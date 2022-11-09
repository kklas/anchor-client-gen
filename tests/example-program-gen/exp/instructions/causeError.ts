import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@project-serum/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID, programIdOverride } from "../programId"

export function causeError() {
  const programId = (programIdOverride && programIdOverride()) || PROGRAM_ID
  const keys: Array<AccountMeta> = []
  const identifier = Buffer.from([67, 104, 37, 17, 2, 155, 68, 17])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
