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
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface InitializeWithValues2Args {
  vecOfOption: Array<BN | null>
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
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.state.address, role: 3, signer: accounts.state },
    { address: accounts.payer.address, role: 3, signer: accounts.payer },
    { address: accounts.systemProgram, role: 0 },
  ]
  const identifier = Buffer.from([248, 190, 21, 97, 239, 148, 39, 181])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      vecOfOption: args.vecOfOption,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
