import { Idl } from "@project-serum/anchor"
import { Project, VariableDeclarationKind } from "ts-morph"

export function genErrors(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  genIndex(project, idl, outPath)
  genCustomErrors(project, idl, outPath)
  genAnchorErrors(project, idl, outPath)
}

export function genIndex(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  const src = project.createSourceFile(outPath("errors/index.ts"), "", {
    overwrite: true,
  })

  const hasCustomErrors = idl.errors && idl.errors.length > 0

  src.addImportDeclaration({
    namedImports: ["PROGRAM_ID"],
    moduleSpecifier: "../programId",
  })
  src.addImportDeclaration({
    namespaceImport: "anchor",
    moduleSpecifier: "./anchor",
  })
  if (hasCustomErrors) {
    src.addImportDeclaration({
      namespaceImport: "custom",
      moduleSpecifier: "./custom",
    })
  }

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
    returnType: hasCustomErrors
      ? "custom.CustomError | anchor.AnchorError | null"
      : "anchor.AnchorError | null",
  })
  hasCustomErrors
    ? fromCodeFn.setBodyText(
        "return code >= 6000 ? custom.fromCode(code) : anchor.fromCode(code)"
      )
    : fromCodeFn.setBodyText("return anchor.fromCode(code)")

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

  // errorRe
  src.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: "errorRe",
        initializer: "/Program (\\w+) failed: custom program error: (\\w+)/",
      },
    ],
  })

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
    returnType: hasCustomErrors
      ? "custom.CustomError | anchor.AnchorError | null"
      : "anchor.AnchorError | null",
  })
  fromTxErrorFn.setBodyText(`if (
  typeof err !== "object" ||
  err === null ||
  !hasOwnProperty(err, "logs") ||
  !Array.isArray(err.logs)
) {
  return null
}

let firstMatch: RegExpExecArray | null = null
for (const logLine of err.logs) {
  firstMatch = errorRe.exec(logLine)
  if (firstMatch !== null) {
    break
  }
}

if (firstMatch === null) {
  return null
}

const [programIdRaw, codeRaw] = firstMatch.slice(1)
if (programIdRaw !== PROGRAM_ID.toString()) {
  return null
}

let errorCode: number
try {
  errorCode = parseInt(codeRaw, 16)
} catch (parseErr) {
  return null
}

return fromCode(errorCode)`)
}

export function genCustomErrors(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  if (!idl.errors || idl.errors.length === 0) {
    return
  }
  const errors = idl.errors

  const src = project.createSourceFile(outPath("errors/custom.ts"), "", {
    overwrite: true,
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
}

export function genAnchorErrors(
  project: Project,
  idl: Idl,
  outPath: (path: string) => string
) {
  const src = project.createSourceFile(outPath("errors/anchor.ts"), "", {
    overwrite: true,
  })

  // type alias
  src.addTypeAlias({
    name: "AnchorError",
    type: Object.keys(LangErrorCode).join(" | "),
    isExported: true,
  })

  // error classes
  Object.keys(LangErrorCode).forEach((errorName) => {
    const code: number = LangErrorCode[errorName]
    const message: string = LangErrorMessage.get(code) || ""

    const cls = src.addClass({
      isExported: true,
      name: errorName,
      extends: "Error",
      properties: [
        {
          name: "code",
          initializer: code.toString(),
          isReadonly: true,
        },
        {
          name: "name",
          initializer: `"${errorName}"`,
          isReadonly: true,
        },
        {
          name: "msg",
          initializer: `"${message}"`,
          isReadonly: true,
        },
      ],
    })
    const ctor = cls.addConstructor()
    ctor.setBodyText(`super("${code}: ${message}")`)
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
    returnType: "AnchorError | null",
  })
  fromCodeFn.setBodyText((writer) => {
    writer
      .writeLine("switch (code)")
      .block(() => {
        Object.keys(LangErrorCode).forEach((errorName) => {
          writer.writeLine(`case ${LangErrorCode[errorName]}:`).indent(() => {
            writer.writeLine(`return new ${errorName}();`)
          })
        })
      })
      .blankLine()
      .writeLine("return null")
  })
}
const LangErrorCode = {
  // Instructions.
  InstructionMissing: 100,
  InstructionFallbackNotFound: 101,
  InstructionDidNotDeserialize: 102,
  InstructionDidNotSerialize: 103,

  // IDL instructions.
  IdlInstructionStub: 1000,
  IdlInstructionInvalidProgram: 1001,

  // Constraints.
  ConstraintMut: 2000,
  ConstraintHasOne: 2001,
  ConstraintSigner: 2002,
  ConstraintRaw: 2003,
  ConstraintOwner: 2004,
  ConstraintRentExempt: 2005,
  ConstraintSeeds: 2006,
  ConstraintExecutable: 2007,
  ConstraintState: 2008,
  ConstraintAssociated: 2009,
  ConstraintAssociatedInit: 2010,
  ConstraintClose: 2011,
  ConstraintAddress: 2012,
  ConstraintZero: 2013,
  ConstraintTokenMint: 2014,
  ConstraintTokenOwner: 2015,
  ConstraintMintMintAuthority: 2016,
  ConstraintMintFreezeAuthority: 2017,
  ConstraintMintDecimals: 2018,
  ConstraintSpace: 2019,

  // Require.
  RequireViolated: 2500,
  RequireEqViolated: 2501,
  RequireKeysEqViolated: 2502,
  RequireNeqViolated: 2503,
  RequireKeysNeqViolated: 2504,
  RequireGtViolated: 2505,
  RequireGteViolated: 2506,

  // Accounts.
  AccountDiscriminatorAlreadySet: 3000,
  AccountDiscriminatorNotFound: 3001,
  AccountDiscriminatorMismatch: 3002,
  AccountDidNotDeserialize: 3003,
  AccountDidNotSerialize: 3004,
  AccountNotEnoughKeys: 3005,
  AccountNotMutable: 3006,
  AccountOwnedByWrongProgram: 3007,
  InvalidProgramId: 3008,
  InvalidProgramExecutable: 3009,
  AccountNotSigner: 3010,
  AccountNotSystemOwned: 3011,
  AccountNotInitialized: 3012,
  AccountNotProgramData: 3013,
  AccountNotAssociatedTokenAccount: 3014,
  AccountSysvarMismatch: 3015,
  // State.
  StateInvalidAddress: 4000,

  // Miscellaneous
  DeclaredProgramIdMismatch: 4100,

  // Used for APIs that shouldn't be used anymore.
  Deprecated: 5000,
}

const LangErrorMessage = new Map([
  // Instructions.
  [
    LangErrorCode.InstructionMissing,
    "8 byte instruction identifier not provided",
  ],
  [
    LangErrorCode.InstructionFallbackNotFound,
    "Fallback functions are not supported",
  ],
  [
    LangErrorCode.InstructionDidNotDeserialize,
    "The program could not deserialize the given instruction",
  ],
  [
    LangErrorCode.InstructionDidNotSerialize,
    "The program could not serialize the given instruction",
  ],

  // Idl instructions.
  [
    LangErrorCode.IdlInstructionStub,
    "The program was compiled without idl instructions",
  ],
  [
    LangErrorCode.IdlInstructionInvalidProgram,
    "The transaction was given an invalid program for the IDL instruction",
  ],

  // Constraints.
  [LangErrorCode.ConstraintMut, "A mut constraint was violated"],
  [LangErrorCode.ConstraintHasOne, "A has_one constraint was violated"],
  [LangErrorCode.ConstraintSigner, "A signer constraint was violated"],
  [LangErrorCode.ConstraintRaw, "A raw constraint was violated"],
  [LangErrorCode.ConstraintOwner, "An owner constraint was violated"],
  [
    LangErrorCode.ConstraintRentExempt,
    "A rent exemption constraint was violated",
  ],
  [LangErrorCode.ConstraintSeeds, "A seeds constraint was violated"],
  [LangErrorCode.ConstraintExecutable, "An executable constraint was violated"],
  [LangErrorCode.ConstraintState, "A state constraint was violated"],
  [LangErrorCode.ConstraintAssociated, "An associated constraint was violated"],
  [
    LangErrorCode.ConstraintAssociatedInit,
    "An associated init constraint was violated",
  ],
  [LangErrorCode.ConstraintClose, "A close constraint was violated"],
  [LangErrorCode.ConstraintAddress, "An address constraint was violated"],
  [LangErrorCode.ConstraintZero, "Expected zero account discriminant"],
  [LangErrorCode.ConstraintTokenMint, "A token mint constraint was violated"],
  [LangErrorCode.ConstraintTokenOwner, "A token owner constraint was violated"],
  [
    LangErrorCode.ConstraintMintMintAuthority,
    "A mint mint authority constraint was violated",
  ],
  [
    LangErrorCode.ConstraintMintFreezeAuthority,
    "A mint freeze authority constraint was violated",
  ],
  [
    LangErrorCode.ConstraintMintDecimals,
    "A mint decimals constraint was violated",
  ],
  [LangErrorCode.ConstraintSpace, "A space constraint was violated"],

  // Require.
  [LangErrorCode.RequireViolated, "A require expression was violated"],
  [LangErrorCode.RequireEqViolated, "A require_eq expression was violated"],
  [
    LangErrorCode.RequireKeysEqViolated,
    "A require_keys_eq expression was violated",
  ],
  [LangErrorCode.RequireNeqViolated, "A require_neq expression was violated"],
  [
    LangErrorCode.RequireKeysNeqViolated,
    "A require_keys_neq expression was violated",
  ],
  [LangErrorCode.RequireGtViolated, "A require_gt expression was violated"],
  [LangErrorCode.RequireGteViolated, "A require_gte expression was violated"],

  // Accounts.
  [
    LangErrorCode.AccountDiscriminatorAlreadySet,
    "The account discriminator was already set on this account",
  ],
  [
    LangErrorCode.AccountDiscriminatorNotFound,
    "No 8 byte discriminator was found on the account",
  ],
  [
    LangErrorCode.AccountDiscriminatorMismatch,
    "8 byte discriminator did not match what was expected",
  ],
  [LangErrorCode.AccountDidNotDeserialize, "Failed to deserialize the account"],
  [LangErrorCode.AccountDidNotSerialize, "Failed to serialize the account"],
  [
    LangErrorCode.AccountNotEnoughKeys,
    "Not enough account keys given to the instruction",
  ],
  [LangErrorCode.AccountNotMutable, "The given account is not mutable"],
  [
    LangErrorCode.AccountOwnedByWrongProgram,
    "The given account is owned by a different program than expected",
  ],
  [LangErrorCode.InvalidProgramId, "Program ID was not as expected"],
  [LangErrorCode.InvalidProgramExecutable, "Program account is not executable"],
  [LangErrorCode.AccountNotSigner, "The given account did not sign"],
  [
    LangErrorCode.AccountNotSystemOwned,
    "The given account is not owned by the system program",
  ],
  [
    LangErrorCode.AccountNotInitialized,
    "The program expected this account to be already initialized",
  ],
  [
    LangErrorCode.AccountNotProgramData,
    "The given account is not a program data account",
  ],
  [
    LangErrorCode.AccountNotAssociatedTokenAccount,
    "The given account is not the associated token account",
  ],
  [
    LangErrorCode.AccountSysvarMismatch,
    "The given public key does not match the required sysvar",
  ],

  // State.
  [
    LangErrorCode.StateInvalidAddress,
    "The given state account does not have the correct address",
  ],

  // Miscellaneous
  [
    LangErrorCode.DeclaredProgramIdMismatch,
    "The declared program id does not match the actual program id",
  ],

  // Deprecated
  [
    LangErrorCode.Deprecated,
    "The API being used is deprecated and should no longer be used",
  ],
])
