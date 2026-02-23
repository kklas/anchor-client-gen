// Lightweight Borsh serialization library
// No external dependencies - uses only Uint8Array, DataView, and native bigint

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion */

export abstract class Layout<T = any> {
  span: number
  property?: string

  constructor(span: number, property?: string) {
    this.span = span
    this.property = property
  }

  abstract encode(src: T, b: Uint8Array, offset?: number): number
  abstract decode(b: Uint8Array, offset?: number): T

  getSpan(_b?: Uint8Array, _offset?: number): number {
    return this.span
  }

  replicate(name: string): Layout<T> {
    return new ReplicatedLayout(this, name)
  }
}

class ReplicatedLayout<T> extends Layout<T> {
  private inner: Layout<T>

  constructor(inner: Layout<T>, property: string) {
    super(inner.span, property)
    this.inner = inner
  }

  encode(src: T, b: Uint8Array, offset?: number): number {
    return this.inner.encode(src, b, offset)
  }

  decode(b: Uint8Array, offset?: number): T {
    return this.inner.decode(b, offset)
  }

  getSpan(b?: Uint8Array, offset?: number): number {
    return this.inner.getSpan(b, offset)
  }
}

// --- Fixed integer layouts ---

function validateInt(src: number, min: number, max: number, label: string) {
  if (!Number.isInteger(src) || src < min || src > max) {
    throw new Error(
      `Value ${src} is not a valid ${label} (expected integer in ${min}..${max})`
    )
  }
}

class UInt8Layout extends Layout<number> {
  constructor(property?: string) {
    super(1, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    validateInt(src, 0, 0xff, "u8")
    b[offset] = src
    return 1
  }
  decode(b: Uint8Array, offset = 0): number {
    return b[offset]
  }
}

class Int8Layout extends Layout<number> {
  constructor(property?: string) {
    super(1, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    validateInt(src, -128, 127, "i8")
    new DataView(b.buffer, b.byteOffset, b.byteLength).setInt8(offset, src)
    return 1
  }
  decode(b: Uint8Array, offset = 0): number {
    return new DataView(b.buffer, b.byteOffset, b.byteLength).getInt8(offset)
  }
}

class UInt16Layout extends Layout<number> {
  constructor(property?: string) {
    super(2, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    validateInt(src, 0, 0xffff, "u16")
    new DataView(b.buffer, b.byteOffset, b.byteLength).setUint16(
      offset,
      src,
      true
    )
    return 2
  }
  decode(b: Uint8Array, offset = 0): number {
    return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint16(
      offset,
      true
    )
  }
}

class Int16Layout extends Layout<number> {
  constructor(property?: string) {
    super(2, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    validateInt(src, -32768, 32767, "i16")
    new DataView(b.buffer, b.byteOffset, b.byteLength).setInt16(
      offset,
      src,
      true
    )
    return 2
  }
  decode(b: Uint8Array, offset = 0): number {
    return new DataView(b.buffer, b.byteOffset, b.byteLength).getInt16(
      offset,
      true
    )
  }
}

class UInt32Layout extends Layout<number> {
  constructor(property?: string) {
    super(4, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    validateInt(src, 0, 0xffffffff, "u32")
    new DataView(b.buffer, b.byteOffset, b.byteLength).setUint32(
      offset,
      src,
      true
    )
    return 4
  }
  decode(b: Uint8Array, offset = 0): number {
    return new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(
      offset,
      true
    )
  }
}

class Int32Layout extends Layout<number> {
  constructor(property?: string) {
    super(4, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    validateInt(src, -2147483648, 2147483647, "i32")
    new DataView(b.buffer, b.byteOffset, b.byteLength).setInt32(
      offset,
      src,
      true
    )
    return 4
  }
  decode(b: Uint8Array, offset = 0): number {
    return new DataView(b.buffer, b.byteOffset, b.byteLength).getInt32(
      offset,
      true
    )
  }
}

class Float32Layout extends Layout<number> {
  constructor(property?: string) {
    super(4, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    new DataView(b.buffer, b.byteOffset, b.byteLength).setFloat32(
      offset,
      src,
      true
    )
    return 4
  }
  decode(b: Uint8Array, offset = 0): number {
    return new DataView(b.buffer, b.byteOffset, b.byteLength).getFloat32(
      offset,
      true
    )
  }
}

class Float64Layout extends Layout<number> {
  constructor(property?: string) {
    super(8, property)
  }
  encode(src: number, b: Uint8Array, offset = 0): number {
    new DataView(b.buffer, b.byteOffset, b.byteLength).setFloat64(
      offset,
      src,
      true
    )
    return 8
  }
  decode(b: Uint8Array, offset = 0): number {
    return new DataView(b.buffer, b.byteOffset, b.byteLength).getFloat64(
      offset,
      true
    )
  }
}

// --- Big integer layouts ---

function encodeBigintLE(
  value: bigint,
  b: Uint8Array,
  offset: number,
  byteLen: number
): void {
  // For signed negative values, compute two's complement
  let v = value
  if (v < 0n) {
    v = (1n << BigInt(byteLen * 8)) + v
  }
  for (let i = 0; i < byteLen; i++) {
    b[offset + i] = Number(v & 0xffn)
    v >>= 8n
  }
}

function decodeUBigintLE(
  b: Uint8Array,
  offset: number,
  byteLen: number
): bigint {
  let v = 0n
  for (let i = byteLen - 1; i >= 0; i--) {
    v = (v << 8n) | BigInt(b[offset + i])
  }
  return v
}

function decodeSBigintLE(
  b: Uint8Array,
  offset: number,
  byteLen: number
): bigint {
  const v = decodeUBigintLE(b, offset, byteLen)
  const bits = BigInt(byteLen * 8)
  const half = 1n << (bits - 1n)
  if (v >= half) {
    return v - (1n << bits)
  }
  return v
}

class UBigIntLayout extends Layout<bigint> {
  private byteLen: number

  constructor(byteLen: number, property?: string) {
    super(byteLen, property)
    this.byteLen = byteLen
  }

  encode(src: bigint, b: Uint8Array, offset = 0): number {
    const max = 1n << BigInt(this.byteLen * 8)
    if (src < 0n || src >= max) {
      throw new Error(
        `Value ${src} out of range for u${this.byteLen * 8} (0..${max - 1n})`
      )
    }
    encodeBigintLE(src, b, offset, this.byteLen)
    return this.byteLen
  }

  decode(b: Uint8Array, offset = 0): bigint {
    return decodeUBigintLE(b, offset, this.byteLen)
  }
}

class SBigIntLayout extends Layout<bigint> {
  private byteLen: number

  constructor(byteLen: number, property?: string) {
    super(byteLen, property)
    this.byteLen = byteLen
  }

  encode(src: bigint, b: Uint8Array, offset = 0): number {
    const bits = BigInt(this.byteLen * 8)
    const min = -(1n << (bits - 1n))
    const max = (1n << (bits - 1n)) - 1n
    if (src < min || src > max) {
      throw new Error(
        `Value ${src} out of range for i${this.byteLen * 8} (${min}..${max})`
      )
    }
    encodeBigintLE(src, b, offset, this.byteLen)
    return this.byteLen
  }

  decode(b: Uint8Array, offset = 0): bigint {
    return decodeSBigintLE(b, offset, this.byteLen)
  }
}

// --- Bool ---

class BoolLayout extends Layout<boolean> {
  constructor(property?: string) {
    super(1, property)
  }
  encode(src: boolean, b: Uint8Array, offset = 0): number {
    b[offset] = src ? 1 : 0
    return 1
  }
  decode(b: Uint8Array, offset = 0): boolean {
    return b[offset] !== 0
  }
}

// --- Blob ---

class BlobLayout extends Layout<Uint8Array> {
  constructor(size: number, property?: string) {
    super(size, property)
  }
  encode(src: Uint8Array, b: Uint8Array, offset = 0): number {
    b.set(src.subarray(0, this.span), offset)
    return this.span
  }
  decode(b: Uint8Array, offset = 0): Uint8Array {
    return b.slice(offset, offset + this.span)
  }
}

// --- Struct ---

class StructLayout<T = any> extends Layout<T> {
  fields: Layout[]

  constructor(fields: Layout[], property?: string) {
    super(-1, property)
    this.fields = fields
  }

  encode(src: any, b: Uint8Array, offset = 0): number {
    let pos = offset
    for (const field of this.fields) {
      const val = field.property !== undefined ? src[field.property] : undefined
      pos += field.encode(val, b, pos)
    }
    return pos - offset
  }

  decode(b: Uint8Array, offset = 0): T {
    const result: any = {}
    let pos = offset
    for (const field of this.fields) {
      if (field.property !== undefined) {
        result[field.property] = field.decode(b, pos)
      }
      pos += field.getSpan(b, pos)
    }
    return result as T
  }

  getSpan(b?: Uint8Array, offset = 0): number {
    if (!b) {
      // Fixed-size struct: sum fixed spans
      let total = 0
      for (const field of this.fields) {
        if (field.span < 0) return -1
        total += field.span
      }
      return total
    }
    let pos = offset
    for (const field of this.fields) {
      pos += field.getSpan(b, pos)
    }
    return pos - offset
  }
}

// --- Vec ---

class VecLayout<T> extends Layout<T[]> {
  private element: Layout<T>

  constructor(element: Layout<T>, property?: string) {
    super(-1, property)
    this.element = element
  }

  encode(src: T[], b: Uint8Array, offset = 0): number {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    dv.setUint32(offset, src.length, true)
    let pos = offset + 4
    for (const item of src) {
      pos += this.element.encode(item, b, pos)
    }
    return pos - offset
  }

  decode(b: Uint8Array, offset = 0): T[] {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    const len = dv.getUint32(offset, true)
    const result: T[] = []
    let pos = offset + 4
    for (let i = 0; i < len; i++) {
      result.push(this.element.decode(b, pos))
      pos += this.element.getSpan(b, pos)
    }
    return result
  }

  getSpan(b?: Uint8Array, offset = 0): number {
    if (!b) return -1
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    const len = dv.getUint32(offset, true)
    let pos = offset + 4
    for (let i = 0; i < len; i++) {
      pos += this.element.getSpan(b, pos)
    }
    return pos - offset
  }
}

// --- VecU8 (bytes) ---

class VecU8Layout extends Layout<Uint8Array> {
  constructor(property?: string) {
    super(-1, property)
  }

  encode(src: Uint8Array, b: Uint8Array, offset = 0): number {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    dv.setUint32(offset, src.length, true)
    b.set(src, offset + 4)
    return 4 + src.length
  }

  decode(b: Uint8Array, offset = 0): Uint8Array {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    const len = dv.getUint32(offset, true)
    return b.slice(offset + 4, offset + 4 + len)
  }

  getSpan(b?: Uint8Array, offset = 0): number {
    if (!b) return -1
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    const len = dv.getUint32(offset, true)
    return 4 + len
  }
}

// --- Str ---

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

class StrLayout extends Layout<string> {
  constructor(property?: string) {
    super(-1, property)
  }

  encode(src: string, b: Uint8Array, offset = 0): number {
    const encoded = textEncoder.encode(src)
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    dv.setUint32(offset, encoded.length, true)
    b.set(encoded, offset + 4)
    return 4 + encoded.length
  }

  decode(b: Uint8Array, offset = 0): string {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    const len = dv.getUint32(offset, true)
    return textDecoder.decode(b.subarray(offset + 4, offset + 4 + len))
  }

  getSpan(b?: Uint8Array, offset = 0): number {
    if (!b) return -1
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength)
    const len = dv.getUint32(offset, true)
    return 4 + len
  }
}

// --- Option ---

class OptionLayout<T> extends Layout<T | null> {
  private inner: Layout<T>

  constructor(inner: Layout<T>, property?: string) {
    super(-1, property)
    this.inner = inner
  }

  encode(src: T | null, b: Uint8Array, offset = 0): number {
    if (src === null || src === undefined) {
      b[offset] = 0
      return 1
    }
    b[offset] = 1
    return 1 + this.inner.encode(src, b, offset + 1)
  }

  decode(b: Uint8Array, offset = 0): T | null {
    const disc = b[offset]
    if (disc === 0) return null
    if (disc !== 1) {
      throw new Error(`Invalid option discriminator: ${disc}`)
    }
    return this.inner.decode(b, offset + 1)
  }

  getSpan(b?: Uint8Array, offset = 0): number {
    if (!b) return -1
    const disc = b[offset]
    if (disc === 0) return 1
    if (disc !== 1) {
      throw new Error(`Invalid option discriminator: ${disc}`)
    }
    return 1 + this.inner.getSpan(b, offset + 1)
  }
}

// --- Array (fixed count) ---

class ArrayLayout<T> extends Layout<T[]> {
  private element: Layout<T>
  private count: number

  constructor(element: Layout<T>, count: number, property?: string) {
    super(-1, property)
    this.element = element
    this.count = count
  }

  encode(src: T[], b: Uint8Array, offset = 0): number {
    let pos = offset
    for (let i = 0; i < this.count; i++) {
      pos += this.element.encode(src[i], b, pos)
    }
    return pos - offset
  }

  decode(b: Uint8Array, offset = 0): T[] {
    const result: T[] = []
    let pos = offset
    for (let i = 0; i < this.count; i++) {
      result.push(this.element.decode(b, pos))
      pos += this.element.getSpan(b, pos)
    }
    return result
  }

  getSpan(b?: Uint8Array, offset = 0): number {
    if (this.element.span >= 0) {
      return this.element.span * this.count
    }
    if (!b) return -1
    let pos = offset
    for (let i = 0; i < this.count; i++) {
      pos += this.element.getSpan(b, pos)
    }
    return pos - offset
  }
}

// --- Rust Enum ---

class RustEnumLayout extends Layout<any> {
  private variants: Layout[]

  constructor(variants: Layout[], property?: string) {
    super(-1, property)
    this.variants = variants
  }

  encode(src: any, b: Uint8Array, offset = 0): number {
    // src is { VariantName: { ...fields } }
    for (let i = 0; i < this.variants.length; i++) {
      const variant = this.variants[i]
      if (variant.property !== undefined && variant.property in src) {
        b[offset] = i
        const encoded = variant.encode(src[variant.property], b, offset + 1)
        return 1 + encoded
      }
    }
    throw new Error("Invalid enum value: " + JSON.stringify(src))
  }

  decode(b: Uint8Array, offset = 0): any {
    const disc = b[offset]
    if (disc >= this.variants.length) {
      throw new Error(`Invalid enum discriminator: ${disc}`)
    }
    const variant = this.variants[disc]
    const decoded = variant.decode(b, offset + 1)
    return { [variant.property!]: decoded }
  }

  getSpan(b?: Uint8Array, offset = 0): number {
    if (!b) return -1
    const disc = b[offset]
    if (disc >= this.variants.length) {
      throw new Error(`Invalid enum discriminator: ${disc}`)
    }
    return 1 + this.variants[disc].getSpan(b, offset + 1)
  }

  replicate(name: string): RustEnumLayout {
    return new RustEnumLayout(this.variants, name)
  }
}

// --- Factory functions ---

export function u8(property?: string): Layout<number> {
  return new UInt8Layout(property)
}

export function i8(property?: string): Layout<number> {
  return new Int8Layout(property)
}

export function u16(property?: string): Layout<number> {
  return new UInt16Layout(property)
}

export function i16(property?: string): Layout<number> {
  return new Int16Layout(property)
}

export function u32(property?: string): Layout<number> {
  return new UInt32Layout(property)
}

export function i32(property?: string): Layout<number> {
  return new Int32Layout(property)
}

export function f32(property?: string): Layout<number> {
  return new Float32Layout(property)
}

export function f64(property?: string): Layout<number> {
  return new Float64Layout(property)
}

export function u64(property?: string): Layout<bigint> {
  return new UBigIntLayout(8, property)
}

export function i64(property?: string): Layout<bigint> {
  return new SBigIntLayout(8, property)
}

export function u128(property?: string): Layout<bigint> {
  return new UBigIntLayout(16, property)
}

export function i128(property?: string): Layout<bigint> {
  return new SBigIntLayout(16, property)
}

export function u256(property?: string): Layout<bigint> {
  return new UBigIntLayout(32, property)
}

export function i256(property?: string): Layout<bigint> {
  return new SBigIntLayout(32, property)
}

export function bool(property?: string): Layout<boolean> {
  return new BoolLayout(property)
}

export function blob(size: number, property?: string): Layout<Uint8Array> {
  return new BlobLayout(size, property)
}

export function struct<T = any>(
  fields: Layout[],
  property?: string
): StructLayout<T> {
  return new StructLayout<T>(fields, property)
}

export function vec<T>(element: Layout<T>, property?: string): Layout<T[]> {
  return new VecLayout<T>(element, property)
}

export function vecU8(property?: string): Layout<Uint8Array> {
  return new VecU8Layout(property)
}

export function str(property?: string): Layout<string> {
  return new StrLayout(property)
}

export function option<T>(
  inner: Layout<T>,
  property?: string
): Layout<T | null> {
  return new OptionLayout<T>(inner, property)
}

export function array<T>(
  element: Layout<T>,
  count: number,
  property?: string
): Layout<T[]> {
  return new ArrayLayout<T>(element, count, property)
}

export function rustEnum(
  variants: Layout[],
  property?: string
): RustEnumLayout {
  return new RustEnumLayout(variants, property)
}
