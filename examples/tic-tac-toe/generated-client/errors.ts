import { PROGRAM_ID } from "./programId"

export type CustomError =
  | TileOutOfBounds
  | TileAlreadySet
  | GameAlreadyOver
  | NotPlayersTurn
  | GameAlreadyStarted

export class TileOutOfBounds extends Error {
  readonly code = 6000
  readonly name = "TileOutOfBounds"
  readonly msg = "undefined"

  constructor() {
    super("6000: undefined")
  }
}

export class TileAlreadySet extends Error {
  readonly code = 6001
  readonly name = "TileAlreadySet"
  readonly msg = "undefined"

  constructor() {
    super("6001: undefined")
  }
}

export class GameAlreadyOver extends Error {
  readonly code = 6002
  readonly name = "GameAlreadyOver"
  readonly msg = "undefined"

  constructor() {
    super("6002: undefined")
  }
}

export class NotPlayersTurn extends Error {
  readonly code = 6003
  readonly name = "NotPlayersTurn"
  readonly msg = "undefined"

  constructor() {
    super("6003: undefined")
  }
}

export class GameAlreadyStarted extends Error {
  readonly code = 6004
  readonly name = "GameAlreadyStarted"
  readonly msg = "undefined"

  constructor() {
    super("6004: undefined")
  }
}

export function fromCode(code: number): CustomError | null {
  switch (code) {
    case 6000:
      return new TileOutOfBounds()
    case 6001:
      return new TileAlreadySet()
    case 6002:
      return new GameAlreadyOver()
    case 6003:
      return new NotPlayersTurn()
    case 6004:
      return new GameAlreadyStarted()
  }

  return null
}

function hasOwnProperty<X extends object, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return Object.hasOwnProperty.call(obj, prop)
}

const errorRe = /Program (\w+) failed: custom program error: (\w+)/

export function fromTxError(err: unknown): CustomError | null {
  if (
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

  return fromCode(errorCode)
}
