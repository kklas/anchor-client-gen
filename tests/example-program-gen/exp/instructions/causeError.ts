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

export const DISCRIMINATOR = new Uint8Array([67, 104, 37, 17, 2, 155, 68, 17])

export interface CauseErrorProps {
  /** @default [] */
  remainingAccounts?: Array<AccountMeta | AccountSignerMeta>
  /** @default PROGRAM_ID */
  programAddress?: Address
}

export function causeError({
  remainingAccounts = [],
  programAddress = PROGRAM_ID,
}: CauseErrorProps = {}) {
  const keys: Array<AccountMeta | AccountSignerMeta> = [...remainingAccounts]
  const data = DISCRIMINATOR
  const ix: Instruction = { accounts: keys, programAddress, data }
  return ix
}
