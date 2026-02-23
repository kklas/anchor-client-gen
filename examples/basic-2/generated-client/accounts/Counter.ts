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
import * as borsh from "../utils/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CounterFields {
  authority: Address
  count: bigint
}

export interface CounterJSON {
  authority: string
  count: string
}

export class Counter {
  readonly authority: Address
  readonly count: bigint

  static readonly discriminator = new Uint8Array([
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
      throw new Error(
        `CounterFields account ${address} belongs to wrong program ${info.programAddress}, expected ${programId}`
      )
    }

    return this.decode(new Uint8Array(info.data))
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
        throw new Error(
          `CounterFields account ${info.address} belongs to wrong program ${info.programAddress}, expected ${programId}`
        )
      }

      return this.decode(new Uint8Array(info.data))
    })
  }

  static decode(data: Uint8Array): Counter {
    if (data.length < Counter.discriminator.length) {
      throw new Error("invalid account discriminator")
    }
    for (let i = 0; i < Counter.discriminator.length; i++) {
      if (data[i] !== Counter.discriminator[i]) {
        throw new Error("invalid account discriminator")
      }
    }

    const dec = Counter.layout.decode(
      data.subarray(Counter.discriminator.length)
    )

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
      count: BigInt(obj.count),
    })
  }
}
