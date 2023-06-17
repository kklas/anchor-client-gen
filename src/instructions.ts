import { Idl } from "@coral-xyz/anchor"
import { IdlAccountItem } from "@coral-xyz/anchor/dist/cjs/idl"
import { CodeBlockWriter, Project, VariableDeclarationKind } from "ts-morph"
import {
  fieldToEncodable,
  genIxIdentifier,
  layoutForType,
  tsTypeFromIdl,
} from "./common"

export function genInstructions(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  if (idl.instructions.length === 0) {
    return
  }

  genIndexFile(project, idl, outPath)
  genInstructionFiles(project, idl, outPath)
}

function capitalize(s: string): string {
  return s[0].toUpperCase() + s.slice(1)
}

function argsInterfaceName(ixName: string) {
  return `${capitalize(ixName)}Args`
}

function accountsInterfaceName(ixName: string) {
  return `${capitalize(ixName)}Accounts`
}

function genIndexFile(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  const src = project.createSourceFile(outPath("instructions/index.ts"), "", {
    overwrite: true,
  })

  idl.instructions.forEach((ix) => {
    src.addExportDeclaration({
      namedExports: [ix.name],
      moduleSpecifier: `./${ix.name}`,
    })

    const typeExports: string[] = []
    if (ix.args.length > 0) {
      typeExports.push(argsInterfaceName(ix.name))
    }
    if (ix.accounts.length > 0) {
      typeExports.push(accountsInterfaceName(ix.name))
    }
    if (typeExports.length > 0) {
      src.addExportDeclaration({
        namedExports: typeExports,
        isTypeOnly: true,
        moduleSpecifier: `./${ix.name}`,
      })
    }
  })
}

function genInstructionFiles(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  idl.instructions.forEach((ix) => {
    const src = project.createSourceFile(
      outPath(`instructions/${ix.name}.ts`),
      "",
      {
        overwrite: true,
      }
    )

    // imports
    src.addStatements([
      `import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars`,
      `import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars`,
      `import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars`,
      ...(idl.types && idl.types.length > 0
        ? [
            `import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars`,
          ]
        : []),
      `import { PROGRAM_ID } from "../programId"`,
    ])

    // args interface
    if (ix.args.length > 0) {
      src.addInterface({
        isExported: true,
        name: argsInterfaceName(ix.name),
        properties: ix.args.map((arg) => {
          return {
            name: arg.name,
            type: tsTypeFromIdl(idl, arg.type),
          }
        }),
      })
    }

    // accounts interface
    function genAccIfPropTypeRec(
      accItem: IdlAccountItem,
      writer: CodeBlockWriter
    ) {
      if (!("accounts" in accItem)) {
        writer.write("PublicKey")
        return
      }
      writer.block(() => {
        accItem.accounts.forEach((item) => {
          if (item.docs) {
            writer.writeLine(`/** ${item.docs.join(" ")} */`)
          }
          writer.write(`${item.name}: `)
          genAccIfPropTypeRec(item, writer)
          writer.newLine()
        })
      })
    }

    if (ix.accounts.length > 0) {
      src.addInterface({
        isExported: true,
        name: accountsInterfaceName(ix.name),
        properties: ix.accounts.map((acc) => {
          return {
            name: acc.name,
            type: (writer) => {
              genAccIfPropTypeRec(acc, writer)
            },
            docs: acc.docs && [acc.docs.join("\n")],
          }
        }),
      })
    }

    // layout
    if (ix.args.length > 0) {
      src.addVariableStatement({
        isExported: true,
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: "layout",
            initializer: (writer) => {
              writer.write("borsh.struct([")

              ix.args.forEach((arg) => {
                writer.writeLine(layoutForType(arg.type, arg.name) + ",")
              })

              writer.write("])")
            },
          },
        ],
      })
    }

    // instruction
    const ixFn = src.addFunction({
      isExported: true,
      name: ix.name,
      docs: ix.docs && [ix.docs.join("\n")],
    })
    if (ix.args.length > 0) {
      ixFn.addParameter({
        name: "args",
        type: argsInterfaceName(ix.name),
      })
    }
    if (ix.accounts.length > 0) {
      ixFn.addParameter({
        name: "accounts",
        type: accountsInterfaceName(ix.name),
      })
    }
    ixFn.addParameter({
      name: "programId",
      type: "PublicKey",
      initializer: "PROGRAM_ID",
    })

    // keys
    ixFn.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "keys",
          type: "Array<AccountMeta>",
          initializer: (writer) => {
            writer.write("[")

            function recurseAccounts(
              accs: IdlAccountItem[],
              nestedNames: string[]
            ) {
              accs.forEach((item) => {
                if ("accounts" in item) {
                  recurseAccounts(item.accounts, [...nestedNames, item.name])
                  return
                }
                writer.writeLine(
                  `{ pubkey: accounts.${[...nestedNames, item.name].join(
                    "."
                  )}, isSigner: ${item.isSigner}, isWritable: ${item.isMut} },`
                )
              })
            }

            recurseAccounts(ix.accounts, [])

            writer.write("]")
          },
        },
      ],
    })

    // identifier
    ixFn.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "identifier",
          initializer: `Buffer.from([${genIxIdentifier(ix.name).toString()}])`,
        },
      ],
    })

    // encode
    if (ix.args.length > 0) {
      ixFn.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: "buffer",
            initializer: "Buffer.alloc(1000)", // TODO: use a tighter buffer.
          },
        ],
      })
      ixFn.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: "len",
            initializer: (writer) => {
              writer.write("layout.encode({")

              ix.args.forEach((arg) => {
                writer.writeLine(
                  `${arg.name}: ${fieldToEncodable(idl, arg, "args.")},`
                )
              })

              writer.write("}, buffer)")
            },
          },
        ],
      })
      ixFn.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: "data",
            initializer:
              "Buffer.concat([identifier, buffer]).slice(0, 8 + len)",
          },
        ],
      })
    } else {
      ixFn.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: "data",
            initializer: "identifier",
          },
        ],
      })
    }

    // ret
    ixFn.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "ix",
          initializer: "new TransactionInstruction({ keys, programId, data })",
        },
      ],
    })

    ixFn.addStatements("return ix")
  })
}
