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

export interface PlayArgs {
  tile: types.TileFields
}

export interface PlayAccounts {
  game: Address
  player: TransactionSigner
}

export const layout = borsh.struct([types.Tile.layout("tile")])

export function play(
  args: PlayArgs,
  accounts: PlayAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.game, role: 1 },
    { address: accounts.player.address, role: 2, signer: accounts.player },
  ]
  const identifier = Buffer.from([213, 157, 193, 142, 228, 56, 248, 150])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      tile: types.Tile.toEncodable(args.tile),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
