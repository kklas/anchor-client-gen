import { PublicKey, TransactionInstruction } from "@solana/web3.js"
import BN from "bn.js"
import * as borsh from "@project-serum/borsh"
import * as types from "../types"
import { PROGRAM_ID } from "../programId"

export interface InitializeAccounts {
  state: PublicKey
  nested: {
    clock: PublicKey
    rent: PublicKey
  }
  payer: PublicKey
  systemProgram: PublicKey
}

export function initialize(accounts: InitializeAccounts) {
  const keys = [
    { pubkey: accounts.state, isSigner: true, isWritable: true },
    { pubkey: accounts.nested.clock, isSigner: false, isWritable: false },
    { pubkey: accounts.nested.rent, isSigner: false, isWritable: false },
    { pubkey: accounts.payer, isSigner: true, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237])
  const data = identifier
  const ix = new TransactionInstruction({ keys, programId: PROGRAM_ID, data })
  return ix
}
