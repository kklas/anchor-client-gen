export type CustomError =
  | TileOutOfBounds
  | TileAlreadySet
  | GameAlreadyOver
  | NotPlayersTurn
  | GameAlreadyStarted

export class TileOutOfBounds extends Error {
  readonly code = 6000
  readonly name = "TileOutOfBounds"

  constructor() {
    super("6000: ")
  }
}

export class TileAlreadySet extends Error {
  readonly code = 6001
  readonly name = "TileAlreadySet"

  constructor() {
    super("6001: ")
  }
}

export class GameAlreadyOver extends Error {
  readonly code = 6002
  readonly name = "GameAlreadyOver"

  constructor() {
    super("6002: ")
  }
}

export class NotPlayersTurn extends Error {
  readonly code = 6003
  readonly name = "NotPlayersTurn"

  constructor() {
    super("6003: ")
  }
}

export class GameAlreadyStarted extends Error {
  readonly code = 6004
  readonly name = "GameAlreadyStarted"

  constructor() {
    super("6004: ")
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
