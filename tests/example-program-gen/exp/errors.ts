import { PROGRAM_ID } from "./programId"

export type CustomError = SomeError | OtherError

export class SomeError extends Error {
  readonly code = 6000
  readonly name = "SomeError"
  readonly msg = "Example error."

  constructor() {
    super("6000: Example error.")
  }
}

export class OtherError extends Error {
  readonly code = 6001
  readonly name = "OtherError"
  readonly msg = "Another error."

  constructor() {
    super("6001: Another error.")
  }
}

export function fromCode(code: number): CustomError | null {
  switch (code) {
    case 6000:
      return new SomeError()
    case 6001:
      return new OtherError()
  }

  return null
}

function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.hasOwnProperty.call(obj, prop)
}

export function fromTxError(err: unknown): CustomError | null {
  if (
    typeof err !== "object" ||
    err === null ||
    !hasOwnProperty(err, "logs") ||
    !Array.isArray(err.logs)
  ) {
    return null
  }

  const log = err.logs.slice(-1)[0]
  if (typeof log !== "string") {
    return null
  }

  const components = log.split(`${PROGRAM_ID} failed: custom program error: `)
  if (components.length !== 2) {
    return null
  }

  let errorCode: number
  try {
    errorCode = parseInt(components[1], 16)
  } catch (parseErr) {
    return null
  }

  return fromCode(errorCode)
}
