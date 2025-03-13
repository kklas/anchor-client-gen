import { Address, getAddressCodec } from "@solana/kit"
import { blob, Layout } from "buffer-layout"

const addressCodec = getAddressCodec()

export function borshAddress(property?: string): Layout<Address> {
  return new WrappedLayout(
    blob(32),
    (b: Buffer) => addressCodec.decode(b),
    (addr: Address) => Buffer.from(addressCodec.encode(addr)),
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

  decode(b: Buffer, offset?: number): U {
    return this.decoder(this.layout.decode(b, offset))
  }

  encode(src: U, b: Buffer, offset?: number): number {
    return this.layout.encode(this.encoder(src), b, offset)
  }

  getSpan(b: Buffer, offset?: number): number {
    return this.layout.getSpan(b, offset)
  }
}
