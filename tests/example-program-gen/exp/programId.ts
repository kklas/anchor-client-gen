import { address, Address } from "@solana/web3.js"

// Program ID passed with the cli --program-id flag when running the code generator. Do not edit, it will get overwritten.
export const PROGRAM_ID_CLI = address(
  "3rTQ3R4B2PxZrAyx7EUefySPgZY8RhJf16cZajbmrzp8"
)

// This constant will not get overwritten on subsequent code generations and it's safe to modify it's value.
export const PROGRAM_ID: Address = PROGRAM_ID_CLI
