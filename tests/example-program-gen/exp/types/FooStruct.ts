import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "../utils/borsh"
import { borshAddress } from "../utils"

export interface FooStructFields {
  field1: number
  field2: number
  field3: bigint
  nested: types.BarStructFields
  vecNested: Array<types.BarStructFields>
  optionNested: types.BarStructFields | null
  enumField: types.FooEnumKind
  pubkeyField: Address
}

export interface FooStructJSON {
  field1: number
  field2: number
  field3: string
  nested: types.BarStructJSON
  vecNested: Array<types.BarStructJSON>
  optionNested: types.BarStructJSON | null
  enumField: types.FooEnumJSON
  pubkeyField: string
}

export class FooStruct {
  readonly field1: number
  readonly field2: number
  readonly field3: bigint
  readonly nested: types.BarStruct
  readonly vecNested: Array<types.BarStruct>
  readonly optionNested: types.BarStruct | null
  readonly enumField: types.FooEnumKind
  readonly pubkeyField: Address

  constructor(fields: FooStructFields) {
    this.field1 = fields.field1
    this.field2 = fields.field2
    this.field3 = fields.field3
    this.nested = new types.BarStruct({ ...fields.nested })
    this.vecNested = fields.vecNested.map(
      (item) => new types.BarStruct({ ...item })
    )
    this.optionNested =
      (fields.optionNested &&
        new types.BarStruct({ ...fields.optionNested })) ||
      null
    this.enumField = fields.enumField
    this.pubkeyField = fields.pubkeyField
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u8("field1"),
        borsh.u16("field2"),
        borsh.u64("field3"),
        types.BarStruct.layout("nested"),
        borsh.vec(types.BarStruct.layout(), "vecNested"),
        borsh.option(types.BarStruct.layout(), "optionNested"),
        types.FooEnum.layout("enumField"),
        borshAddress("pubkeyField"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new FooStruct({
      field1: obj.field1,
      field2: obj.field2,
      field3: obj.field3,
      nested: types.BarStruct.fromDecoded(obj.nested),
      vecNested: obj.vecNested.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.BarStruct.fromDecoded(item)
      ),
      optionNested:
        (obj.optionNested && types.BarStruct.fromDecoded(obj.optionNested)) ||
        null,
      enumField: types.FooEnum.fromDecoded(obj.enumField),
      pubkeyField: obj.pubkeyField,
    })
  }

  static toEncodable(fields: FooStructFields) {
    return {
      field1: fields.field1,
      field2: fields.field2,
      field3: fields.field3,
      nested: types.BarStruct.toEncodable(fields.nested),
      vecNested: fields.vecNested.map((item) =>
        types.BarStruct.toEncodable(item)
      ),
      optionNested:
        (fields.optionNested &&
          types.BarStruct.toEncodable(fields.optionNested)) ||
        null,
      enumField: fields.enumField.toEncodable(),
      pubkeyField: fields.pubkeyField,
    }
  }

  toJSON(): FooStructJSON {
    return {
      field1: this.field1,
      field2: this.field2,
      field3: this.field3.toString(),
      nested: this.nested.toJSON(),
      vecNested: this.vecNested.map((item) => item.toJSON()),
      optionNested: (this.optionNested && this.optionNested.toJSON()) || null,
      enumField: this.enumField.toJSON(),
      pubkeyField: this.pubkeyField,
    }
  }

  static fromJSON(obj: FooStructJSON): FooStruct {
    return new FooStruct({
      field1: obj.field1,
      field2: obj.field2,
      field3: BigInt(obj.field3),
      nested: types.BarStruct.fromJSON(obj.nested),
      vecNested: obj.vecNested.map((item) => types.BarStruct.fromJSON(item)),
      optionNested:
        (obj.optionNested && types.BarStruct.fromJSON(obj.optionNested)) ||
        null,
      enumField: types.FooEnum.fromJSON(obj.enumField),
      pubkeyField: address(obj.pubkeyField),
    })
  }

  toEncodable() {
    return FooStruct.toEncodable(this)
  }
}
