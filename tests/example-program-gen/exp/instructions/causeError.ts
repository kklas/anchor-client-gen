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

export function causeError(programAddress: Address = PROGRAM_ID) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = []
  const identifier = Buffer.from([67, 104, 37, 17, 2, 155, 68, 17])
  const data = identifier
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
