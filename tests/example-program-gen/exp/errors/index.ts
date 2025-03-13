import { Address } from "@solana/kit"
import { PROGRAM_ID } from "../programId"
import * as anchor from "./anchor"
import * as custom from "./custom"

export function fromCode(
  code: number,
  logs?: string[]
): custom.CustomError | anchor.AnchorError | null {
  return code >= 6000
    ? custom.fromCode(code, logs)
    : anchor.fromCode(code, logs)
}

function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.hasOwnProperty.call(obj, prop)
}

const errorRe = /Program (\w+) failed: custom program error: (\w+)/

export function fromTxError(
  err: unknown,
  programId: Address = PROGRAM_ID
): custom.CustomError | anchor.AnchorError | null {
  if (
    typeof err !== "object" ||
    err === null ||
    !hasOwnProperty(err, "context")
  ) {
    return null
  }

  const context = err.context as { code?: number; logs?: string[] }
  if (hasOwnProperty(context, "code") && context.code) {
    return fromCode(context.code, context.logs)
  }
  if (!hasOwnProperty(context, "logs") || !context.logs) {
    return null
  }
  let firstMatch: RegExpExecArray | null = null
  for (const logLine of context.logs) {
    firstMatch = errorRe.exec(logLine)
    if (firstMatch !== null) {
      break
    }
  }

  if (firstMatch === null) {
    return null
  }

  const [programIdRaw, codeRaw] = firstMatch.slice(1)
  if (programIdRaw !== programId.toString()) {
    return null
  }

  let errorCode: number
  try {
    errorCode = parseInt(codeRaw, 16)
  } catch (parseErr) {
    return null
  }

  return fromCode(errorCode, context.logs)
}
