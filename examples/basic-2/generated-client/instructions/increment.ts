import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import { PROGRAM_ID } from "../programId"

export interface IncrementAccounts {
  counter: PublicKey
  authority: PublicKey
}

export function increment(accounts: IncrementAccounts) {
  const keys = [
    { pubkey: accounts.counter, isSigner: false, isWritable: true },
    { pubkey: accounts.authority, isSigner: true, isWritable: false },
  ]
  const identifier = Buffer.from([11, 18, 104, 9, 104, 174, 59, 33])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
