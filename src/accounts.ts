import { Idl } from "@coral-xyz/anchor"
import { Project } from "ts-morph"
import {
  fieldFromDecoded,
  fieldFromJSON,
  fieldsInterfaceName,
  fieldToJSON,
  genAccDiscriminator,
  idlTypeToJSONType,
  jsonInterfaceName,
  layoutForType,
  structFieldInitializer,
  tsTypeFromIdl,
} from "./common"

export function genAccounts(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  if (idl.accounts === undefined || idl.accounts.length === 0) {
    return
  }

  genIndexFile(project, idl, outPath)
  genAccountFiles(project, idl, outPath)
}

function genIndexFile(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  const src = project.createSourceFile(outPath("accounts/index.ts"), "", {
    overwrite: true,
  })

  idl.accounts?.forEach((ix) => {
    src.addExportDeclaration({
      namedExports: [ix.name],
      moduleSpecifier: `./${ix.name}`,
    })
    src.addExportDeclaration({
      namedExports: [fieldsInterfaceName(ix.name), jsonInterfaceName(ix.name)],
      isTypeOnly: true,
      moduleSpecifier: `./${ix.name}`,
    })
  })
}

function genAccountFiles(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  idl.accounts?.forEach((acc) => {
    const src = project.createSourceFile(
      outPath(`accounts/${acc.name}.ts`),
      "",
      {
        overwrite: true,
      }
    )

    // imports
    src.addStatements([
      `/* eslint-disable @typescript-eslint/no-unused-vars */`,
      `import { address, Address, fetchEncodedAccount, fetchEncodedAccounts, GetAccountInfoApi, GetMultipleAccountsApi, Rpc } from "@solana/kit"`,
      `/* eslint-enable @typescript-eslint/no-unused-vars */`,
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

    const fields = acc.type.fields
    const name = acc.name

    // fields interface
    src.addInterface({
      isExported: true,
      name: fieldsInterfaceName(name),
      properties: fields.map((field) => {
        return {
          name: field.name,
          type: tsTypeFromIdl(idl, field.type),
          docs: field.docs && [field.docs.join("\n")],
        }
      }),
    })

    // json interface
    src.addInterface({
      isExported: true,
      name: jsonInterfaceName(name),
      properties: fields.map((field) => {
        return {
          name: field.name,
          type: idlTypeToJSONType(field.type),
          docs: field.docs && [field.docs.join("\n")],
        }
      }),
    })

    // account class
    const cls = src.addClass({
      isExported: true,
      name: name,
      properties: fields.map((field) => {
        return {
          isReadonly: true,
          name: field.name,
          type: tsTypeFromIdl(idl, field.type, "types.", false),
          docs: field.docs && [field.docs.join("\n")],
        }
      }),
      docs: (acc as any).docs && [(acc as any).docs.join("\n")],
    })

    // discriminator
    cls
      .addProperty({
        isStatic: true,
        isReadonly: true,
        name: "discriminator",
        initializer: `Buffer.from([${genAccDiscriminator(name).toString()}])`,
      })
      .prependWhitespace("\n")

    // layout
    cls
      .addProperty({
        isStatic: true,
        isReadonly: true,
        name: "layout",
        initializer: (writer) => {
          writer.write(`borsh.struct<${name}>([`)

          fields.forEach((field) => {
            writer.writeLine(layoutForType(field.type, field.name) + ",")
          })

          writer.write("])")
        },
      })
      .prependWhitespace("\n")

    // constructor
    cls.addConstructor({
      parameters: [
        {
          name: "fields",
          type: fieldsInterfaceName(name),
        },
      ],
      statements: (writer) => {
        fields.forEach((field) => {
          const initializer = structFieldInitializer(idl, field)
          writer.writeLine(`this.${field.name} = ${initializer}`)
        })
      },
    })

    // fetch
    cls.addMethod({
      isStatic: true,
      isAsync: true,
      name: "fetch",
      parameters: [
        {
          name: "rpc",
          type: "Rpc<GetAccountInfoApi>",
        },
        {
          name: "address",
          type: "Address",
        },
        {
          name: "programId",
          type: "Address",
          initializer: "PROGRAM_ID",
        },
      ],
      returnType: `Promise<${name} | null>`,
      statements: [
        (writer) => {
          writer.writeLine(
            "const info = await fetchEncodedAccount(rpc, address)"
          )
          writer.blankLine()
          writer.write("if (!info.exists)")
          writer.inlineBlock(() => {
            writer.writeLine("return null")
          })
          writer.write("if (info.programAddress !== programId)")
          writer.inlineBlock(() => {
            writer.writeLine(
              `throw new Error(\`${fieldsInterfaceName(
                name
              )} account \${address} belongs to wrong program \${info.programAddress}, expected \${programId}\`)`
            )
          })
          writer.blankLine()
          writer.writeLine("return this.decode(Buffer.from(info.data))")
        },
      ],
    })

    // fetchMultiple
    cls.addMethod({
      isStatic: true,
      isAsync: true,
      name: "fetchMultiple",
      parameters: [
        {
          name: "rpc",
          type: "Rpc<GetMultipleAccountsApi>",
        },
        {
          name: "addresses",
          type: "Address[]",
        },
        {
          name: "programId",
          type: "Address",
          initializer: "PROGRAM_ID",
        },
      ],
      returnType: `Promise<Array<${name} | null>>`,
      statements: [
        (writer) => {
          writer.writeLine(
            "const infos = await fetchEncodedAccounts(rpc, addresses)"
          )
          writer.blankLine()
          writer.write("return infos.map((info) => ")
          writer.inlineBlock(() => {
            writer.write("if (!info.exists)")
            writer.inlineBlock(() => {
              writer.writeLine("return null")
            })
            writer.write("")

            writer.write("if (info.programAddress !== programId)")
            writer.inlineBlock(() => {
              writer.writeLine(
                `throw new Error(\`${fieldsInterfaceName(
                  name
                )} account \${info.address} belongs to wrong program \${info.programAddress}, expected \${programId}\`)`
              )
            })
            writer.blankLine()
            writer.writeLine("return this.decode(Buffer.from(info.data))")
          })
          writer.write(")")
        },
      ],
    })

    // decode
    cls.addMethod({
      isStatic: true,
      name: "decode",
      parameters: [
        {
          name: "data",
          type: "Buffer",
        },
      ],
      returnType: name,
      statements: [
        (writer) => {
          writer.write(`if (!data.slice(0, 8).equals(${name}.discriminator))`)
          writer.inlineBlock(() => {
            writer.writeLine(`throw new Error("invalid account discriminator")`)
          })
          writer.blankLine()
          writer.writeLine(`const dec = ${name}.layout.decode(data.slice(8))`)

          writer.blankLine()
          writer.write(`return new ${name}({`)
          fields.forEach((field) => {
            const decoded = fieldFromDecoded(idl, field, "dec.")
            writer.writeLine(`${field.name}: ${decoded},`)
          })
          writer.write("})")
        },
      ],
    })

    // toJSON
    cls.addMethod({
      name: "toJSON",
      returnType: jsonInterfaceName(name),
      statements: [
        (writer) => {
          writer.write(`return {`)

          fields.forEach((field) => {
            writer.writeLine(
              `${field.name}: ${fieldToJSON(idl, field, "this.")},`
            )
          })

          writer.write("}")
        },
      ],
    })

    // fromJSON
    cls.addMethod({
      isStatic: true,
      name: "fromJSON",
      returnType: name,
      parameters: [
        {
          name: "obj",
          type: jsonInterfaceName(name),
        },
      ],
      statements: [
        (writer) => {
          writer.write(`return new ${name}({`)

          fields.forEach((field) => {
            writer.writeLine(`${field.name}: ${fieldFromJSON(field)},`)
          })

          writer.write("})")
        },
      ],
    })
  })
}
