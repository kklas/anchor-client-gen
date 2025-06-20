export type CustomError =
  | SomeError
  | OtherError
  | ErrorWithoutMsg
  | RemainingAccountsMismatch

export class SomeError extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "SomeError"
  readonly msg = "Example error."

  constructor(readonly logs?: string[]) {
    super("6000: Example error.")
  }
}

export class OtherError extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "OtherError"
  readonly msg = "Another error."

  constructor(readonly logs?: string[]) {
    super("6001: Another error.")
  }
}

export class ErrorWithoutMsg extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "ErrorWithoutMsg"

  constructor(readonly logs?: string[]) {
    super("6002: ")
  }
}

export class RemainingAccountsMismatch extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "RemainingAccountsMismatch"
  readonly msg = "Remaining accounts mismatch."

  constructor(readonly logs?: string[]) {
    super("6003: Remaining accounts mismatch.")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new SomeError(logs)
    case 6001:
      return new OtherError(logs)
    case 6002:
      return new ErrorWithoutMsg(logs)
    case 6003:
      return new RemainingAccountsMismatch(logs)
  }

  return null
}
