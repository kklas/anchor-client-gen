import * as borsh from "@project-serum/borsh"
import { PublicKey } from "@solana/web3.js"
import BN from "bn.js"
import * as types from "."

export interface BarStructFields {
  someField: boolean
  otherField: number
}

export interface BarStructJSON {
  someField: boolean
  otherField: number
}

export class BarStruct {
  readonly someField: boolean
  readonly otherField: number

  constructor(fields: BarStructFields) {
    this.someField = fields.someField
    this.otherField = fields.otherField
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.bool("someField"), borsh.u8("otherField")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new BarStruct({
      someField: obj.someField,
      otherField: obj.otherField,
    })
  }

  static toEncodable(fields: BarStructFields) {
    return {
      someField: fields.someField,
      otherField: fields.otherField,
    }
  }

  toJSON(): BarStructJSON {
    return {
      someField: this.someField,
      otherField: this.otherField,
    }
  }

  static fromJSON(obj: BarStructJSON): BarStruct {
    return new BarStruct({
      someField: obj.someField,
      otherField: obj.otherField,
    })
  }

  toEncodable() {
    return BarStruct.toEncodable(this)
  }
}
