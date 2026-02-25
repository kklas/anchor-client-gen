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
  213, 157, 193, 142, 228, 56, 248, 150,
])

export interface PlayArgs {
  tile: types.TileFields
}

export interface PlayAccounts {
  game: Address
  player: TransactionSigner
}

export const layout = borsh.struct([types.Tile.layout("tile")])

export interface PlayProps {
  args: PlayArgs
  accounts: PlayAccounts
  /** @default [] */
  remainingAccounts?: Array<AccountMeta | AccountSignerMeta>
  /** @default PROGRAM_ID */
  programAddress?: Address
}

export function play({
  args,
  accounts,
  remainingAccounts = [],
  programAddress = PROGRAM_ID,
}: PlayProps) {
  const keys: Array<AccountMeta | AccountSignerMeta> = [
    { address: accounts.game, role: 1 },
    { address: accounts.player.address, role: 2, signer: accounts.player },
    ...remainingAccounts,
  ]
  const buffer = new Uint8Array(1000)
  const len = layout.encode(
    {
      tile: types.Tile.toEncodable(args.tile),
    },
    buffer
  )
  const data = (() => {
    const d = new Uint8Array(8 + len)
    d.set(DISCRIMINATOR)
    d.set(buffer.subarray(0, len), 8)
    return d
  })()
  const ix: Instruction = { accounts: keys, programAddress, data }
  return ix
}
