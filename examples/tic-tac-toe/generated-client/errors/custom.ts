export type CustomError =
  | TileOutOfBounds
  | TileAlreadySet
  | GameAlreadyOver
  | NotPlayersTurn
  | GameAlreadyStarted

export class TileOutOfBounds extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "TileOutOfBounds"

  constructor(readonly logs?: string[]) {
    super("6000: ")
  }
}

export class TileAlreadySet extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "TileAlreadySet"

  constructor(readonly logs?: string[]) {
    super("6001: ")
  }
}

export class GameAlreadyOver extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "GameAlreadyOver"

  constructor(readonly logs?: string[]) {
    super("6002: ")
  }
}

export class NotPlayersTurn extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "NotPlayersTurn"

  constructor(readonly logs?: string[]) {
    super("6003: ")
  }
}

export class GameAlreadyStarted extends Error {
  static readonly code = 6004
  readonly code = 6004
  readonly name = "GameAlreadyStarted"

  constructor(readonly logs?: string[]) {
    super("6004: ")
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new TileOutOfBounds(logs)
    case 6001:
      return new TileAlreadySet(logs)
    case 6002:
      return new GameAlreadyOver(logs)
    case 6003:
      return new NotPlayersTurn(logs)
    case 6004:
      return new GameAlreadyStarted(logs)
  }

  return null
}
