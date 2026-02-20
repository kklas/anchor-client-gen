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
import * as borsh from "../borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export const DISCRIMINATOR = new Uint8Array([
  248, 190, 21, 97, 239, 148, 39, 181,
])

export interface InitializeWithValues2Args {
  vecOfOption: Array<bigint | null>
}

export interface InitializeWithValues2Accounts {
  state: TransactionSigner
  payer: TransactionSigner
  systemProgram: Address
}

export const layout = borsh.struct([
  borsh.vec(borsh.option(borsh.u64()), "vecOfOption"),
])

/**
 * a separate instruction due to initialize_with_values having too many arguments
 * https://github.com/solana-labs/solana/issues/23978
 */
export function initializeWithValues2(
  args: InitializeWithValues2Args,
  accounts: InitializeWithValues2Accounts,
  remainingAccounts: Array<AccountMeta | AccountSignerMeta> = [],
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<AccountMeta | AccountSignerMeta> = [
    { address: accounts.state.address, role: 3, signer: accounts.state },
    { address: accounts.payer.address, role: 3, signer: accounts.payer },
    { address: accounts.systemProgram, role: 0 },
    ...remainingAccounts,
  ]
  const buffer = new Uint8Array(1000)
  const len = layout.encode(
    {
      vecOfOption: args.vecOfOption,
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
