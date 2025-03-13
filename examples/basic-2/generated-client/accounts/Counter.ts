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
import { PROGRAM_ID } from "../programId"

export interface CounterFields {
  authority: Address
  count: BN
}

export interface CounterJSON {
  authority: string
  count: string
}

export class Counter {
  readonly authority: Address
  readonly count: BN

  static readonly discriminator = Buffer.from([
    255, 176, 4, 245, 188, 253, 124, 25,
  ])

  static readonly layout = borsh.struct<Counter>([
    borshAddress("authority"),
    borsh.u64("count"),
  ])

  constructor(fields: CounterFields) {
    this.authority = fields.authority
    this.count = fields.count
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<Counter | null> {
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
  ): Promise<Array<Counter | null>> {
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

  static decode(data: Buffer): Counter {
    if (!data.slice(0, 8).equals(Counter.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = Counter.layout.decode(data.slice(8))

    return new Counter({
      authority: dec.authority,
      count: dec.count,
    })
  }

  toJSON(): CounterJSON {
    return {
      authority: this.authority,
      count: this.count.toString(),
    }
  }

  static fromJSON(obj: CounterJSON): Counter {
    return new Counter({
      authority: address(obj.authority),
      count: new BN(obj.count),
    })
  }
}
