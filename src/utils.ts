import { Project, VariableDeclarationKind } from "ts-morph"

export function genUtils(project: Project, outPath: (path: string) => string) {
  genIndex(project, outPath)
  genBorshAddressLayout(project, outPath)
}

function genIndex(project: Project, outPath: (path: string) => string) {
  const src = project.createSourceFile(outPath("utils/index.ts"), "", {
    overwrite: true,
  })

  src.addExportDeclaration({
    moduleSpecifier: "./borshAddress",
  })
}

export function genBorshAddressLayout(
  project: Project,
  outPath: (path: string) => string
) {
  const src = project.createSourceFile(outPath("utils/borshAddress.ts"), "", {
    overwrite: true,
  })

  src.addImportDeclaration({
    namedImports: ["Address", "getAddressCodec"],
    moduleSpecifier: "@solana/kit",
  })

  src.addImportDeclaration({
    namedImports: ["blob", "Layout"],
    moduleSpecifier: "buffer-layout",
  })

  src.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: "addressCodec",
        initializer: "getAddressCodec()",
      },
    ],
  })

  src.addFunction({
    name: "borshAddress",
    isExported: true,
    parameters: [
      {
        name: "property",
        type: "string",
        hasQuestionToken: true,
      },
    ],
    returnType: "Layout<Address>",
    statements: `return new WrappedLayout(
      blob(32),
      (b: Buffer) => addressCodec.decode(b),
      (addr: Address) => Buffer.from(addressCodec.encode(addr)),
      property
    )`,
  })

  src.addClass({
    name: "WrappedLayout",
    typeParameters: ["T", "U"],
    extends: "Layout<U>",
    properties: [
      {
        name: "layout",
        type: "Layout<T>",
      },
      {
        name: "decoder",
        type: "(data: T) => U",
      },
      {
        name: "encoder",
        type: "(src: U) => T",
      },
    ],
    ctors: [
      {
        parameters: [
          {
            name: "layout",
            type: "Layout<T>",
          },
          {
            name: "decoder",
            type: "(data: T) => U",
          },
          {
            name: "encoder",
            type: "(src: U) => T",
          },
          {
            name: "property",
            type: "string",
            hasQuestionToken: true,
          },
        ],
        statements: [
          "super(layout.span, property)",
          "this.layout = layout",
          "this.decoder = decoder",
          "this.encoder = encoder",
        ],
      },
    ],
    methods: [
      {
        name: "decode",
        returnType: "U",
        parameters: [
          {
            name: "b",
            type: "Buffer",
          },
          {
            name: "offset",
            type: "number",
            hasQuestionToken: true,
          },
        ],
        statements: "return this.decoder(this.layout.decode(b, offset))",
      },
      {
        name: "encode",
        returnType: "number",
        parameters: [
          {
            name: "src",
            type: "U",
          },
          {
            name: "b",
            type: "Buffer",
          },
          {
            name: "offset",
            type: "number",
            hasQuestionToken: true,
          },
        ],
        statements: "return this.layout.encode(this.encoder(src), b, offset)",
      },
      {
        name: "getSpan",
        returnType: "number",
        parameters: [
          {
            name: "b",
            type: "Buffer",
          },
          {
            name: "offset",
            type: "number",
            hasQuestionToken: true,
          },
        ],
        statements: "return this.layout.getSpan(b, offset)",
      },
    ],
  })
}
