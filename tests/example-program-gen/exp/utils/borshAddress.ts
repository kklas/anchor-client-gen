import { Address, getAddressCodec } from "@solana/kit"
import { blob, Layout } from "../borsh"

const addressCodec = getAddressCodec()

export function borshAddress(property?: string): Layout<Address> {
  return new WrappedLayout(
    blob(32),
    (b: Uint8Array) => addressCodec.decode(b),
    (addr: Address) => new Uint8Array(addressCodec.encode(addr)),
    property
  )
}

class WrappedLayout<T, U> extends Layout<U> {
  layout: Layout<T>
  decoder: (data: T) => U
  encoder: (src: U) => T

  constructor(
    layout: Layout<T>,
    decoder: (data: T) => U,
    encoder: (src: U) => T,
    property?: string
  ) {
    super(layout.span, property)
    this.layout = layout
    this.decoder = decoder
    this.encoder = encoder
  }

  decode(b: Uint8Array, offset?: number): U {
    return this.decoder(this.layout.decode(b, offset))
  }

  encode(src: U, b: Uint8Array, offset?: number): number {
    return this.layout.encode(this.encoder(src), b, offset)
  }

  getSpan(b: Uint8Array, offset?: number): number {
    return this.layout.getSpan(b, offset)
  }
}
