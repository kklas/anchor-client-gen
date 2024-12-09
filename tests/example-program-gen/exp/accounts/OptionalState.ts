import {
  address,
  Address,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  GetAccountInfoApi,
  GetMultipleAccountsApi,
  Rpc,
} from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface OptionalStateFields {
  readonlySignerOption: boolean
  mutableSignerOption: boolean
  readonlyOption: boolean
  mutableOption: boolean
}

export interface OptionalStateJSON {
  readonlySignerOption: boolean
  mutableSignerOption: boolean
  readonlyOption: boolean
  mutableOption: boolean
}

export class OptionalState {
  readonly readonlySignerOption: boolean
  readonly mutableSignerOption: boolean
  readonly readonlyOption: boolean
  readonly mutableOption: boolean

  static readonly discriminator = Buffer.from([
    182, 31, 131, 174, 98, 39, 6, 20,
  ])

  static readonly layout = borsh.struct<OptionalState>([
    borsh.bool("readonlySignerOption"),
    borsh.bool("mutableSignerOption"),
    borsh.bool("readonlyOption"),
    borsh.bool("mutableOption"),
  ])

  constructor(fields: OptionalStateFields) {
    this.readonlySignerOption = fields.readonlySignerOption
    this.mutableSignerOption = fields.mutableSignerOption
    this.readonlyOption = fields.readonlyOption
    this.mutableOption = fields.mutableOption
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<OptionalState | null> {
    const info = await fetchEncodedAccount(rpc, address)

    if (!info.exists) {
      return null
    }
    if (info.programAddress !== programId) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(Buffer.from(info.data))
  }

  static async fetchMultiple(
    rpc: Rpc<GetMultipleAccountsApi>,
    addresses: Address[],
    programId: Address = PROGRAM_ID
  ): Promise<Array<OptionalState | null>> {
    const infos = await fetchEncodedAccounts(rpc, addresses)

    return infos.map((info) => {
      if (!info.exists) {
        return null
      }
      if (info.programAddress !== programId) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(Buffer.from(info.data))
    })
  }

  static decode(data: Buffer): OptionalState {
    if (!data.slice(0, 8).equals(OptionalState.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OptionalState.layout.decode(data.slice(8))

    return new OptionalState({
      readonlySignerOption: dec.readonlySignerOption,
      mutableSignerOption: dec.mutableSignerOption,
      readonlyOption: dec.readonlyOption,
      mutableOption: dec.mutableOption,
    })
  }

  toJSON(): OptionalStateJSON {
    return {
      readonlySignerOption: this.readonlySignerOption,
      mutableSignerOption: this.mutableSignerOption,
      readonlyOption: this.readonlyOption,
      mutableOption: this.mutableOption,
    }
  }

  static fromJSON(obj: OptionalStateJSON): OptionalState {
    return new OptionalState({
      readonlySignerOption: obj.readonlySignerOption,
      mutableSignerOption: obj.mutableSignerOption,
      readonlyOption: obj.readonlyOption,
      mutableOption: obj.mutableOption,
    })
  }
}
