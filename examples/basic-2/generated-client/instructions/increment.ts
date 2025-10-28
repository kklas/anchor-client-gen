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

export const DISCRIMINATOR = new Uint8Array([11, 18, 104, 9, 104, 174, 59, 33])

export interface IncrementAccounts {
  counter: Address
  authority: TransactionSigner
}

export interface IncrementProps {
  accounts: IncrementAccounts
  /** @default [] */
  remainingAccounts?: Array<AccountMeta | AccountSignerMeta>
  /** @default PROGRAM_ID */
  programAddress?: Address
}

export function increment({
  accounts,
  remainingAccounts = [],
  programAddress = PROGRAM_ID,
}: IncrementProps) {
  const keys: Array<AccountMeta | AccountSignerMeta> = [
    { address: accounts.counter, role: 1 },
    {
      address: accounts.authority.address,
      role: 2,
      signer: accounts.authority,
    },
    ...remainingAccounts,
  ]
  const data = DISCRIMINATOR
  const ix: Instruction = { accounts: keys, programAddress, data }
  return ix
}
