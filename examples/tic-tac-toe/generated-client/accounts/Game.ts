import {
  address,
  Address,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  GetAccountInfoApi,
  GetMultipleAccountsApi,
  Rpc,
} from "@solana/web3.js"
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface GameFields {
  players: Array<Address>
  turn: number
  board: Array<Array<types.SignKind | null>>
  state: types.GameStateKind
}

export interface GameJSON {
  players: Array<string>
  turn: number
  board: Array<Array<types.SignJSON | null>>
  state: types.GameStateJSON
}

export class Game {
  readonly players: Array<Address>
  readonly turn: number
  readonly board: Array<Array<types.SignKind | null>>
  readonly state: types.GameStateKind

  static readonly discriminator = Buffer.from([
    27, 90, 166, 125, 74, 100, 121, 18,
  ])

  static readonly layout = borsh.struct<Game>([
    borsh.array(borshAddress(), 2, "players"),
    borsh.u8("turn"),
    borsh.array(borsh.array(borsh.option(types.Sign.layout()), 3), 3, "board"),
    types.GameState.layout("state"),
  ])

  constructor(fields: GameFields) {
    this.players = fields.players
    this.turn = fields.turn
    this.board = fields.board
    this.state = fields.state
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<Game | null> {
    const info = await fetchEncodedAccount(rpc, address)

    if (!info.exists) {
      return null
    }
    if (info.programAddress !== programId) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(Buffer.from(info.data))
  }

  static async fetchMultiple(
    rpc: Rpc<GetMultipleAccountsApi>,
    addresses: Address[],
    programId: Address = PROGRAM_ID
  ): Promise<Array<Game | null>> {
    const infos = await fetchEncodedAccounts(rpc, addresses)

    return infos.map((info) => {
      if (!info.exists) {
        return null
      }
      if (info.programAddress !== programId) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(Buffer.from(info.data))
    })
  }

  static decode(data: Buffer): Game {
    if (!data.slice(0, 8).equals(Game.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = Game.layout.decode(data.slice(8))

    return new Game({
      players: dec.players,
      turn: dec.turn,
      board: dec.board.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) =>
          item.map(
            (
              item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
            ) => (item && types.Sign.fromDecoded(item)) || null
          )
      ),
      state: types.GameState.fromDecoded(dec.state),
    })
  }

  toJSON(): GameJSON {
    return {
      players: this.players,
      turn: this.turn,
      board: this.board.map((item) =>
        item.map((item) => (item && item.toJSON()) || null)
      ),
      state: this.state.toJSON(),
    }
  }

  static fromJSON(obj: GameJSON): Game {
    return new Game({
      players: obj.players.map((item) => address(item)),
      turn: obj.turn,
      board: obj.board.map((item) =>
        item.map((item) => (item && types.Sign.fromJSON(item)) || null)
      ),
      state: types.GameState.fromJSON(obj.state),
    })
  }
}
