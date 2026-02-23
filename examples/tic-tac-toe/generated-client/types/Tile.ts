/* eslint-disable @typescript-eslint/no-unused-vars */
import { address, Address } from "@solana/kit"
import * as types from "../types"
import * as borsh from "../utils/borsh"
import { borshAddress } from "../utils"
/* eslint-enable @typescript-eslint/no-unused-vars */
export interface TileFields {
  row: number
  column: number
}

export interface TileJSON {
  row: number
  column: number
}

export class Tile {
  readonly row: number
  readonly column: number

  constructor(fields: TileFields) {
    this.row = fields.row
    this.column = fields.column
  }

  static layout(property?: string) {
    return borsh.struct([borsh.u8("row"), borsh.u8("column")], property)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new Tile({
      row: obj.row,
      column: obj.column,
    })
  }

  static toEncodable(fields: TileFields) {
    return {
      row: fields.row,
      column: fields.column,
    }
  }

  toJSON(): TileJSON {
    return {
      row: this.row,
      column: this.column,
    }
  }

  static fromJSON(obj: TileJSON): Tile {
    return new Tile({
      row: obj.row,
      column: obj.column,
    })
  }

  toEncodable() {
    return Tile.toEncodable(this)
  }
}
