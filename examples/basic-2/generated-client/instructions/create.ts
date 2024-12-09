import {
  Address,
  isSome,
  IAccountMeta,
  IAccountSignerMeta,
  IInstruction,
  Option,
  TransactionSigner,
} from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CreateArgs {
  authority: Address
}

export interface CreateAccounts {
  counter: TransactionSigner
  user: TransactionSigner
  systemProgram: Address
}

export const layout = borsh.struct([borshAddress("authority")])

export function create(
  args: CreateArgs,
  accounts: CreateAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.counter.address, role: 3, signer: accounts.counter },
    { address: accounts.user.address, role: 3, signer: accounts.user },
    { address: accounts.systemProgram, role: 0 },
  ]
  const identifier = Buffer.from([24, 30, 200, 40, 5, 28, 7, 119])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      authority: args.authority,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
