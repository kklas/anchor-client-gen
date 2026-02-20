import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "../borsh"
import { borshAddress } from "../utils"

export interface FirstJSON {
  kind: "First"
}

export class First {
  static readonly discriminator = 0
  static readonly kind = "First"
  readonly discriminator = 0
  readonly kind = "First"

  toJSON(): FirstJSON {
    return {
      kind: "First",
    }
  }

  toEncodable() {
    return {
      First: {},
    }
  }
}

export interface SecondJSON {
  kind: "Second"
}

export class Second {
  static readonly discriminator = 1
  static readonly kind = "Second"
  readonly discriminator = 1
  readonly kind = "Second"

  toJSON(): SecondJSON {
    return {
      kind: "Second",
    }
  }

  toEncodable() {
    return {
      Second: {},
    }
  }
}

export interface ThirdJSON {
  kind: "Third"
}

export class Third {
  static readonly discriminator = 2
  static readonly kind = "Third"
  readonly discriminator = 2
  readonly kind = "Third"

  toJSON(): ThirdJSON {
    return {
      kind: "Third",
    }
  }

  toEncodable() {
    return {
      Third: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.CStyleEnumKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("First" in obj) {
    return new First()
  }
  if ("Second" in obj) {
    return new Second()
  }
  if ("Third" in obj) {
    return new Third()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(obj: types.CStyleEnumJSON): types.CStyleEnumKind {
  switch (obj.kind) {
    case "First": {
      return new First()
    }
    case "Second": {
      return new Second()
    }
    case "Third": {
      return new Third()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "First"),
    borsh.struct([], "Second"),
    borsh.struct([], "Third"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
