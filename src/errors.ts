import { Idl } from "@project-serum/anchor"
import { Project } from "ts-morph"

export function genErrors(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  if (!idl.errors || idl.errors.length === 0) {
    return
  }
  const errors = idl.errors

  const src = project.createSourceFile(outPath("errors.ts"), "", {
    overwrite: true,
  })

  src.addImportDeclaration({
    namedImports: ["PROGRAM_ID"],
    moduleSpecifier: "./programId",
  })

  // type alias
  src.addTypeAlias({
    name: "CustomError",
    type: errors.map((error) => error.name).join(" | "),
    isExported: true,
  })

  // error classes
  errors.forEach((error) => {
    const cls = src.addClass({
      isExported: true,
      name: error.name,
      extends: "Error",
      properties: [
        {
          name: "code",
          initializer: error.code.toString(),
          isReadonly: true,
        },
        {
          name: "name",
          initializer: `"${error.name}"`,
          isReadonly: true,
        },
        {
          name: "msg",
          initializer: `"${error.msg}"`,
          isReadonly: true,
        },
      ],
    })
    const ctor = cls.addConstructor()
    ctor.setBodyText(`super("${error.code}: ${error.msg}")`)
  })

  // fromCode function
  const fromCodeFn = src.addFunction({
    isExported: true,
    name: "fromCode",
    parameters: [
      {
        name: "code",
        type: "number",
      },
    ],
    returnType: "CustomError | null",
  })
  fromCodeFn.setBodyText((writer) => {
    writer
      .writeLine("switch (code)")
      .block(() => {
        errors.forEach((error) => {
          writer.writeLine(`case ${error.code}:`).indent(() => {
            writer.writeLine(`return new ${error.name}();`)
          })
        })
      })
      .blankLine()
      .writeLine("return null")
  })

  // hasOwnProperty function
  const hasOwnPropertyFn = src.addFunction({
    name: "hasOwnProperty",
    typeParameters: [
      {
        name: "X extends object",
      },
      {
        name: "Y extends PropertyKey",
      },
    ],
    parameters: [
      {
        name: "obj",
        type: "X",
      },
      {
        name: "prop",
        type: "Y",
      },
    ],
    returnType: "obj is X & Record<Y, unknown>",
  })
  hasOwnPropertyFn.setBodyText("return Object.hasOwnProperty.call(obj, prop);")

  // fromTxError function
  const fromTxErrorFn = src.addFunction({
    isExported: true,
    name: "fromTxError",
    parameters: [
      {
        name: "err",
        type: "unknown",
      },
    ],
    returnType: "CustomError | null",
  })
  fromTxErrorFn.setBodyText((writer) => {
    writer
      .writeLine("if (")
      .newLine()
      .indent(() => {
        writer
          .writeLine('typeof err !== "object" ||')
          .writeLine("err === null ||")
          .writeLine('!hasOwnProperty(err, "logs") ||')
          .writeLine("!Array.isArray(err.logs)")
      })
      .writeLine(")")
      .block(() => {
        writer.writeLine("return null;")
      })
      .blankLine()
      .writeLine("const log = err.logs.slice(-1)[0];")
      .writeLine('if (typeof log !== "string")')
      .block(() => {
        writer.writeLine("return null;")
      })
      .blankLine()
      .writeLine(
        "const components = log.split(`${PROGRAM_ID} failed: custom program error: `)"
      )
      .writeLine("if (components.length !== 2)")
      .block(() => {
        writer.writeLine("return null;")
      })
      .blankLine()
      .writeLine("let errorCode: number;")
      .writeLine("try")
      .block(() => {
        writer.writeLine("errorCode = parseInt(components[1], 16);")
      })
      .write("catch (parseErr)")
      .block(() => {
        writer.writeLine("return null;")
      })
      .blankLine()
      .writeLine("return fromCode(errorCode);")
  })
}
