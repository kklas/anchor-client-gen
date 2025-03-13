/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  address,
  Address,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  GetAccountInfoApi,
  GetMultipleAccountsApi,
  Rpc,
} from "@solana/kit"
/* eslint-enable @typescript-eslint/no-unused-vars */
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface State2Fields {
  vecOfOption: Array<BN | null>
}

export interface State2JSON {
  vecOfOption: Array<string | null>
}

export class State2 {
  readonly vecOfOption: Array<BN | null>

  static readonly discriminator = Buffer.from([
    106, 97, 255, 161, 250, 205, 185, 192,
  ])

  static readonly layout = borsh.struct<State2>([
    borsh.vec(borsh.option(borsh.u64()), "vecOfOption"),
  ])

  constructor(fields: State2Fields) {
    this.vecOfOption = fields.vecOfOption
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<State2 | null> {
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
  ): Promise<Array<State2 | null>> {
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

  static decode(data: Buffer): State2 {
    if (!data.slice(0, 8).equals(State2.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = State2.layout.decode(data.slice(8))

    return new State2({
      vecOfOption: dec.vecOfOption,
    })
  }

  toJSON(): State2JSON {
    return {
      vecOfOption: this.vecOfOption.map(
        (item) => (item && item.toString()) || null
      ),
    }
  }

  static fromJSON(obj: State2JSON): State2 {
    return new State2({
      vecOfOption: obj.vecOfOption.map(
        (item) => (item && new BN(item)) || null
      ),
    })
  }
}
