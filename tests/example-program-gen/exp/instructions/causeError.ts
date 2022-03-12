import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export function causeError() {
  const keys = []
  const identifier = Buffer.from([67, 104, 37, 17, 2, 155, 68, 17])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
