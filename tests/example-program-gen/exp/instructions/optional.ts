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
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export const DISCRIMINATOR = new Uint8Array([
  199, 182, 147, 252, 17, 246, 54, 225,
])

export interface OptionalAccounts {
  optionalState: TransactionSigner
  readonlySignerOption: Option<TransactionSigner>
  mutableSignerOption: Option<TransactionSigner>
  readonlyOption: Option<Address>
  mutableOption: Option<Address>
  payer: TransactionSigner
  systemProgram: Address
}

export interface OptionalProps {
  accounts: OptionalAccounts
  /** @default [] */
  remainingAccounts?: Array<AccountMeta | AccountSignerMeta>
  /** @default PROGRAM_ID */
  programAddress?: Address
}

export function optional({
  accounts,
  remainingAccounts = [],
  programAddress = PROGRAM_ID,
}: OptionalProps) {
  const keys: Array<AccountMeta | AccountSignerMeta> = [
    {
      address: accounts.optionalState.address,
      role: 3,
      signer: accounts.optionalState,
    },
    isSome(accounts.readonlySignerOption)
      ? {
          address: accounts.readonlySignerOption.value.address,
          role: 2,
          signer: accounts.readonlySignerOption.value,
        }
      : { address: programAddress, role: 0 },
    isSome(accounts.mutableSignerOption)
      ? {
          address: accounts.mutableSignerOption.value.address,
          role: 3,
          signer: accounts.mutableSignerOption.value,
        }
      : { address: programAddress, role: 0 },
    isSome(accounts.readonlyOption)
      ? { address: accounts.readonlyOption.value, role: 0 }
      : { address: programAddress, role: 0 },
    isSome(accounts.mutableOption)
      ? { address: accounts.mutableOption.value, role: 1 }
      : { address: programAddress, role: 0 },
    { address: accounts.payer.address, role: 3, signer: accounts.payer },
    { address: accounts.systemProgram, role: 0 },
    ...remainingAccounts,
  ]
  const data = DISCRIMINATOR
  const ix: Instruction = { accounts: keys, programAddress, data }
  return ix
}
