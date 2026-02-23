/* eslint-disable @typescript-eslint/no-unused-vars */
import { address, Address } from "@solana/kit"
import * as types from "../types"
import * as borsh from "../utils/borsh"
import { borshAddress } from "../utils"
/* eslint-enable @typescript-eslint/no-unused-vars */
export interface ActiveJSON {
  kind: "Active"
}

export class Active {
  static readonly discriminator = 0
  static readonly kind = "Active"
  readonly discriminator = 0
  readonly kind = "Active"

  toJSON(): ActiveJSON {
    return {
      kind: "Active",
    }
  }

  toEncodable() {
    return {
      Active: {},
    }
  }
}

export interface TieJSON {
  kind: "Tie"
}

export class Tie {
  static readonly discriminator = 1
  static readonly kind = "Tie"
  readonly discriminator = 1
  readonly kind = "Tie"

  toJSON(): TieJSON {
    return {
      kind: "Tie",
    }
  }

  toEncodable() {
    return {
      Tie: {},
    }
  }
}

export type WonFields = {
  winner: Address
}
export type WonValue = {
  winner: Address
}

export interface WonJSON {
  kind: "Won"
  value: {
    winner: string
  }
}

export class Won {
  static readonly discriminator = 2
  static readonly kind = "Won"
  readonly discriminator = 2
  readonly kind = "Won"
  readonly value: WonValue

  constructor(value: WonFields) {
    this.value = {
      winner: value.winner,
    }
  }

  toJSON(): WonJSON {
    return {
      kind: "Won",
      value: {
        winner: this.value.winner,
      },
    }
  }

  toEncodable() {
    return {
      Won: {
        winner: this.value.winner,
      },
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.GameStateKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Active" in obj) {
    return new Active()
  }
  if ("Tie" in obj) {
    return new Tie()
  }
  if ("Won" in obj) {
    const val = obj["Won"]
    return new Won({
      winner: val["winner"],
    })
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.GameStateJSON): types.GameStateKind {
  switch (obj.kind) {
    case "Active": {
      return new Active()
    }
    case "Tie": {
      return new Tie()
    }
    case "Won": {
      return new Won({
        winner: address(obj.value.winner),
      })
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "Active"),
    borsh.struct([], "Tie"),
    borsh.struct([borshAddress("winner")], "Won"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
