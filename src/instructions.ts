import { Idl } from "@coral-xyz/anchor"
import { IdlAccount, IdlAccountItem } from "@coral-xyz/anchor/dist/cjs/idl"
import { CodeBlockWriter, Project, VariableDeclarationKind } from "ts-morph"
import {
  fieldToEncodable,
  genIxIdentifier,
  layoutForType,
  tsTypeFromIdl,
} from "./common"
import { AccountRole } from "@solana/web3.js"

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
      `import { Address, isSome, IAccountMeta, IAccountSignerMeta, IInstruction, Option, TransactionSigner } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars`,
      `import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars`,
      `import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars`,
      `import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars`,
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
        if (accItem.isOptional) {
          writer.write("Option<")
        }
        if (accItem.isSigner) {
          writer.write("TransactionSigner")
        } else {
          writer.write("Address")
        }
        if (accItem.isOptional) {
          writer.write(">")
        }
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
      name: "programAddress",
      type: "Address",
      initializer: "PROGRAM_ID",
    })

    // accounts
    ixFn.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "keys",
          type: "Array<IAccountMeta | IAccountSignerMeta>",
          initializer: (writer) => {
            writer.write("[")

            function getAccountRole({
              isSigner,
              isMut,
            }: {
              isSigner: boolean
              isMut: boolean
            }): AccountRole {
              if (isSigner && isMut) {
                return AccountRole.WRITABLE_SIGNER
              }
              if (isSigner && !isMut) {
                return AccountRole.READONLY_SIGNER
              }
              if (!isSigner && isMut) {
                return AccountRole.WRITABLE
              }
              return AccountRole.READONLY
            }

            function getAddressProps(
              item: IdlAccount,
              baseProps: string[]
            ): string[] {
              if (item.isOptional && item.isSigner) {
                return [...baseProps, "value", "address"]
              } else if (item.isOptional && !item.isSigner) {
                return [...baseProps, "value"]
              } else if (!item.isOptional && item.isSigner) {
                return [...baseProps, "address"]
              } else {
                return baseProps
              }
            }

            function getSignerProps(
              item: IdlAccount,
              baseProps: string[]
            ): string[] {
              if (item.isOptional) {
                return [...baseProps, "value"]
              } else {
                return [...baseProps]
              }
            }

            function recurseAccounts(
              accs: IdlAccountItem[],
              nestedNames: string[]
            ) {
              accs.forEach((item) => {
                if ("accounts" in item) {
                  recurseAccounts(item.accounts, [...nestedNames, item.name])
                  return
                }

                const baseProps = [...nestedNames, item.name]
                const addressProps = getAddressProps(item, baseProps)
                const role = getAccountRole(item)

                const meta = `{ address: accounts.${addressProps.join(
                  "."
                )}, role: ${role}${
                  item.isSigner
                    ? `, signer: accounts.${getSignerProps(
                        item,
                        baseProps
                      ).join(".")}`
                    : ""
                } }`

                if (item.isOptional) {
                  writer.writeLine(
                    `isSome(accounts.${baseProps.join(
                      "."
                    )}) ? ${meta} : { address: programAddress, role: ${
                      AccountRole.READONLY
                    } },`
                  )
                } else {
                  writer.writeLine(`${meta},`)
                }
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
          type: "IInstruction",
          initializer: "{ accounts: keys, programAddress, data }",
        },
      ],
    })

    ixFn.addStatements("return ix")
  })
}
