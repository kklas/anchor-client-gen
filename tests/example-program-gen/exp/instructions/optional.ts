import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface OptionalArgs {
  name: string
}

export interface OptionalAccounts {
  state: PublicKey | null
  payer: PublicKey
  systemProgram: PublicKey
}

export const layout = borsh.struct([borsh.str("name")])

export function optional(
  args: OptionalArgs,
  accounts: OptionalAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.state ?? PROGRAM_ID, isSigner: false, isWritable: true },
    { pubkey: accounts.payer, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([199, 182, 147, 252, 17, 246, 54, 225])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      name: args.name,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
