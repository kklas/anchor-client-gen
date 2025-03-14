import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface XJSON {
  kind: "X"
}

export class X {
  static readonly discriminator = 0
  static readonly kind = "X"
  readonly discriminator = 0
  readonly kind = "X"

  toJSON(): XJSON {
    return {
      kind: "X",
    }
  }

  toEncodable() {
    return {
      X: {},
    }
  }
}

export interface OJSON {
  kind: "O"
}

export class O {
  static readonly discriminator = 1
  static readonly kind = "O"
  readonly discriminator = 1
  readonly kind = "O"

  toJSON(): OJSON {
    return {
      kind: "O",
    }
  }

  toEncodable() {
    return {
      O: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.SignKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("X" in obj) {
    return new X()
  }
  if ("O" in obj) {
    return new O()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.SignJSON): types.SignKind {
  switch (obj.kind) {
    case "X": {
      return new X()
    }
    case "O": {
      return new O()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([borsh.struct([], "X"), borsh.struct([], "O")])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
