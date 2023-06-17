import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export function causeError(programId: PublicKey = PROGRAM_ID) {
  const keys: Array<AccountMeta> = []
  const identifier = Buffer.from([67, 104, 37, 17, 2, 155, 68, 17])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
