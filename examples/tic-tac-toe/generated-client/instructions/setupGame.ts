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

export interface SetupGameArgs {
  playerTwo: Address
}

export interface SetupGameAccounts {
  game: TransactionSigner
  playerOne: TransactionSigner
  systemProgram: Address
}

export const layout = borsh.struct([borshAddress("playerTwo")])

export function setupGame(
  args: SetupGameArgs,
  accounts: SetupGameAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.game.address, role: 3, signer: accounts.game },
    {
      address: accounts.playerOne.address,
      role: 3,
      signer: accounts.playerOne,
    },
    { address: accounts.systemProgram, role: 0 },
  ]
  const identifier = Buffer.from([180, 218, 128, 75, 58, 222, 35, 82])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      playerTwo: args.playerTwo,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
