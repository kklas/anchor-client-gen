/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Address,
  isSome,
  AccountMeta,
  AccountSignerMeta,
  Instruction,
  Option,
  TransactionSigner,
} from "@solana/kit"
/* eslint-enable @typescript-eslint/no-unused-vars */
import * as borsh from "../utils/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export const DISCRIMINATOR = new Uint8Array([24, 30, 200, 40, 5, 28, 7, 119])

export interface CreateArgs {
  authority: Address
}

export interface CreateAccounts {
  counter: TransactionSigner
  user: TransactionSigner
  systemProgram: Address
}

export const layout = borsh.struct([borshAddress("authority")])

export interface CreateProps {
  args: CreateArgs
  accounts: CreateAccounts
  /** @default [] */
  remainingAccounts?: Array<AccountMeta | AccountSignerMeta>
  /** @default PROGRAM_ID */
  programAddress?: Address
}

export function create({
  args,
  accounts,
  remainingAccounts = [],
  programAddress = PROGRAM_ID,
}: CreateProps) {
  const keys: Array<AccountMeta | AccountSignerMeta> = [
    { address: accounts.counter.address, role: 3, signer: accounts.counter },
    { address: accounts.user.address, role: 3, signer: accounts.user },
    { address: accounts.systemProgram, role: 0 },
    ...remainingAccounts,
  ]
  const buffer = new Uint8Array(1000)
  const len = layout.encode(
    {
      authority: args.authority,
    },
    buffer
  )
  const data = (() => {
    const d = new Uint8Array(8 + len)
    d.set(DISCRIMINATOR)
    d.set(buffer.subarray(0, len), 8)
    return d
  })()
  const ix: Instruction = { accounts: keys, programAddress, data }
  return ix
}
