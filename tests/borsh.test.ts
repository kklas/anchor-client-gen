import { describe, it, expect } from "vitest"
import * as borsh from "../src/borsh"

function roundtrip<T>(layout: borsh.Layout<T>, value: T): T {
  const buf = new Uint8Array(1024)
  layout.encode(value, buf)
  return layout.decode(buf, 0)
}

function encode<T>(layout: borsh.Layout<T>, value: T): Uint8Array {
  const buf = new Uint8Array(1024)
  const written = layout.encode(value, buf)
  return buf.slice(0, written)
}

describe("borsh", () => {
  describe("u8", () => {
    const layout = borsh.u8("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0)).toBe(0)
      expect(roundtrip(layout, 255)).toBe(255)
      expect(roundtrip(layout, 42)).toBe(42)
    })

    it("binary", () => {
      expect(encode(layout, 0)).toEqual(new Uint8Array([0]))
      expect(encode(layout, 255)).toEqual(new Uint8Array([255]))
      expect(encode(layout, 1)).toEqual(new Uint8Array([1]))
    })

    it("span", () => {
      expect(layout.span).toBe(1)
      expect(layout.getSpan()).toBe(1)
    })
  })

  describe("i8", () => {
    const layout = borsh.i8("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0)).toBe(0)
      expect(roundtrip(layout, 127)).toBe(127)
      expect(roundtrip(layout, -128)).toBe(-128)
      expect(roundtrip(layout, -1)).toBe(-1)
    })

    it("binary", () => {
      expect(encode(layout, -1)).toEqual(new Uint8Array([0xff]))
      expect(encode(layout, -128)).toEqual(new Uint8Array([0x80]))
    })
  })

  describe("u16", () => {
    const layout = borsh.u16("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0)).toBe(0)
      expect(roundtrip(layout, 65535)).toBe(65535)
      expect(roundtrip(layout, 1000)).toBe(1000)
    })

    it("binary (little-endian)", () => {
      expect(encode(layout, 0x0102)).toEqual(new Uint8Array([0x02, 0x01]))
    })

    it("span", () => {
      expect(layout.span).toBe(2)
    })
  })

  describe("i16", () => {
    const layout = borsh.i16("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0)).toBe(0)
      expect(roundtrip(layout, 32767)).toBe(32767)
      expect(roundtrip(layout, -32768)).toBe(-32768)
      expect(roundtrip(layout, -1)).toBe(-1)
    })
  })

  describe("u32", () => {
    const layout = borsh.u32("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0)).toBe(0)
      expect(roundtrip(layout, 4294967295)).toBe(4294967295)
      expect(roundtrip(layout, 123456)).toBe(123456)
    })

    it("binary (little-endian)", () => {
      expect(encode(layout, 0x01020304)).toEqual(
        new Uint8Array([0x04, 0x03, 0x02, 0x01])
      )
    })

    it("span", () => {
      expect(layout.span).toBe(4)
    })
  })

  describe("i32", () => {
    const layout = borsh.i32("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0)).toBe(0)
      expect(roundtrip(layout, 2147483647)).toBe(2147483647)
      expect(roundtrip(layout, -2147483648)).toBe(-2147483648)
      expect(roundtrip(layout, -1)).toBe(-1)
    })
  })

  describe("f32", () => {
    const layout = borsh.f32("val")

    it("roundtrip", () => {
      const result = roundtrip(layout, 1.5)
      expect(result).toBeCloseTo(1.5, 5)
    })

    it("span", () => {
      expect(layout.span).toBe(4)
    })
  })

  describe("f64", () => {
    const layout = borsh.f64("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0)).toBe(0)
      expect(roundtrip(layout, 1.5)).toBe(1.5)
      expect(roundtrip(layout, -3.14159265358979)).toBeCloseTo(
        -3.14159265358979,
        10
      )
      expect(roundtrip(layout, Number.MAX_SAFE_INTEGER)).toBe(
        Number.MAX_SAFE_INTEGER
      )
    })

    it("span", () => {
      expect(layout.span).toBe(8)
    })
  })

  describe("u64", () => {
    const layout = borsh.u64("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0n)).toBe(0n)
      expect(roundtrip(layout, 18446744073709551615n)).toBe(
        18446744073709551615n
      )
      expect(roundtrip(layout, 1000000000000n)).toBe(1000000000000n)
    })

    it("binary (little-endian)", () => {
      expect(encode(layout, 1n)).toEqual(
        new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])
      )
      expect(encode(layout, 256n)).toEqual(
        new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0])
      )
      // max u64
      expect(encode(layout, 18446744073709551615n)).toEqual(
        new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255])
      )
    })

    it("span", () => {
      expect(layout.span).toBe(8)
    })
  })

  describe("i64", () => {
    const layout = borsh.i64("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0n)).toBe(0n)
      expect(roundtrip(layout, 9223372036854775807n)).toBe(9223372036854775807n)
      expect(roundtrip(layout, -9223372036854775808n)).toBe(
        -9223372036854775808n
      )
      expect(roundtrip(layout, -1n)).toBe(-1n)
    })

    it("binary (two's complement, little-endian)", () => {
      // -1 in two's complement = all 0xFF
      expect(encode(layout, -1n)).toEqual(
        new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255])
      )
      // -2
      expect(encode(layout, -2n)).toEqual(
        new Uint8Array([254, 255, 255, 255, 255, 255, 255, 255])
      )
      // 1
      expect(encode(layout, 1n)).toEqual(
        new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0])
      )
    })
  })

  describe("u128", () => {
    const layout = borsh.u128("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0n)).toBe(0n)
      const maxU128 = (1n << 128n) - 1n
      expect(roundtrip(layout, maxU128)).toBe(maxU128)
      expect(roundtrip(layout, 12345678901234567890n)).toBe(
        12345678901234567890n
      )
    })

    it("span", () => {
      expect(layout.span).toBe(16)
    })
  })

  describe("i128", () => {
    const layout = borsh.i128("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0n)).toBe(0n)
      expect(roundtrip(layout, -1n)).toBe(-1n)
      const maxI128 = (1n << 127n) - 1n
      const minI128 = -(1n << 127n)
      expect(roundtrip(layout, maxI128)).toBe(maxI128)
      expect(roundtrip(layout, minI128)).toBe(minI128)
    })
  })

  describe("u256", () => {
    const layout = borsh.u256("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0n)).toBe(0n)
      const maxU256 = (1n << 256n) - 1n
      expect(roundtrip(layout, maxU256)).toBe(maxU256)
    })

    it("span", () => {
      expect(layout.span).toBe(32)
    })
  })

  describe("i256", () => {
    const layout = borsh.i256("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, 0n)).toBe(0n)
      expect(roundtrip(layout, -1n)).toBe(-1n)
      const maxI256 = (1n << 255n) - 1n
      const minI256 = -(1n << 255n)
      expect(roundtrip(layout, maxI256)).toBe(maxI256)
      expect(roundtrip(layout, minI256)).toBe(minI256)
    })
  })

  describe("bool", () => {
    const layout = borsh.bool("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, true)).toBe(true)
      expect(roundtrip(layout, false)).toBe(false)
    })

    it("binary", () => {
      expect(encode(layout, true)).toEqual(new Uint8Array([1]))
      expect(encode(layout, false)).toEqual(new Uint8Array([0]))
    })

    it("decodes non-zero as true", () => {
      const buf = new Uint8Array([42])
      expect(layout.decode(buf)).toBe(true)
    })

    it("span", () => {
      expect(layout.span).toBe(1)
    })
  })

  describe("blob", () => {
    const layout = borsh.blob(4, "val")

    it("roundtrip", () => {
      const data = new Uint8Array([1, 2, 3, 4])
      expect(roundtrip(layout, data)).toEqual(data)
    })

    it("span", () => {
      expect(layout.span).toBe(4)
    })
  })

  describe("str", () => {
    const layout = borsh.str("val")

    it("roundtrip", () => {
      expect(roundtrip(layout, "hello")).toBe("hello")
      expect(roundtrip(layout, "")).toBe("")
      expect(roundtrip(layout, "unicode: \u00e9\u00e8\u00ea")).toBe(
        "unicode: \u00e9\u00e8\u00ea"
      )
    })

    it("binary", () => {
      // "hi" = length 2 (u32 LE) + bytes
      const bytes = encode(layout, "hi")
      expect(bytes).toEqual(new Uint8Array([2, 0, 0, 0, 0x68, 0x69]))
    })

    it("getSpan", () => {
      const buf = encode(layout, "hello")
      expect(layout.getSpan(buf)).toBe(4 + 5) // 4 bytes length + 5 chars
    })

    it("getSpan without buffer throws", () => {
      expect(() => layout.getSpan()).toThrow("indeterminate span")
    })
  })

  describe("vecU8", () => {
    const layout = borsh.vecU8("val")

    it("roundtrip", () => {
      const data = new Uint8Array([10, 20, 30])
      expect(roundtrip(layout, data)).toEqual(data)
    })

    it("empty vec", () => {
      expect(roundtrip(layout, new Uint8Array([]))).toEqual(new Uint8Array([]))
    })

    it("binary", () => {
      const bytes = encode(layout, new Uint8Array([0xab, 0xcd]))
      expect(bytes).toEqual(new Uint8Array([2, 0, 0, 0, 0xab, 0xcd]))
    })

    it("getSpan", () => {
      const buf = encode(layout, new Uint8Array([1, 2, 3]))
      expect(layout.getSpan(buf)).toBe(4 + 3)
    })
  })

  describe("vec", () => {
    const layout = borsh.vec(borsh.u32(), "val")

    it("roundtrip", () => {
      expect(roundtrip(layout, [1, 2, 3])).toEqual([1, 2, 3])
    })

    it("empty vec", () => {
      expect(roundtrip(layout, [])).toEqual([])
    })

    it("binary", () => {
      const bytes = encode(layout, [1])
      // length=1 (u32 LE) + value=1 (u32 LE)
      expect(bytes).toEqual(new Uint8Array([1, 0, 0, 0, 1, 0, 0, 0]))
    })

    it("getSpan", () => {
      const buf = encode(layout, [1, 2])
      expect(layout.getSpan(buf)).toBe(4 + 2 * 4) // 4 bytes len + 2 u32s
    })

    it("vec of variable-size elements", () => {
      const strVec = borsh.vec(borsh.str(), "val")
      const result = roundtrip(strVec, ["hello", "world", ""])
      expect(result).toEqual(["hello", "world", ""])
    })
  })

  describe("option", () => {
    const layout = borsh.option(borsh.u32(), "val")

    it("roundtrip some", () => {
      expect(roundtrip(layout, 42)).toBe(42)
    })

    it("roundtrip none (null)", () => {
      expect(roundtrip(layout, null)).toBe(null)
    })

    it("binary none", () => {
      expect(encode(layout, null)).toEqual(new Uint8Array([0]))
    })

    it("binary some", () => {
      expect(encode(layout, 1)).toEqual(new Uint8Array([1, 1, 0, 0, 0]))
    })

    it("getSpan none", () => {
      const buf = encode(layout, null)
      expect(layout.getSpan(buf)).toBe(1)
    })

    it("getSpan some", () => {
      const buf = encode(layout, 42)
      expect(layout.getSpan(buf)).toBe(1 + 4)
    })

    it("option of string", () => {
      const optStr = borsh.option(borsh.str(), "val")
      expect(roundtrip(optStr, "hello")).toBe("hello")
      expect(roundtrip(optStr, null)).toBe(null)
    })
  })

  describe("array", () => {
    const layout = borsh.array(borsh.u8(), 3, "val")

    it("roundtrip", () => {
      expect(roundtrip(layout, [10, 20, 30])).toEqual([10, 20, 30])
    })

    it("binary", () => {
      expect(encode(layout, [1, 2, 3])).toEqual(new Uint8Array([1, 2, 3]))
    })

    it("getSpan fixed", () => {
      expect(layout.getSpan()).toBe(3)
    })

    it("array of variable-size elements", () => {
      const arrStr = borsh.array(borsh.str(), 2, "val")
      expect(roundtrip(arrStr, ["hi", "bye"])).toEqual(["hi", "bye"])
    })
  })

  describe("struct", () => {
    const layout = borsh.struct([
      borsh.u8("a"),
      borsh.u32("b"),
      borsh.bool("c"),
    ])

    it("roundtrip", () => {
      const val = { a: 1, b: 100, c: true }
      expect(roundtrip(layout, val)).toEqual(val)
    })

    it("binary", () => {
      const bytes = encode(layout, { a: 0xff, b: 0x01020304, c: false })
      expect(bytes).toEqual(
        new Uint8Array([0xff, 0x04, 0x03, 0x02, 0x01, 0x00])
      )
    })

    it("getSpan fixed", () => {
      expect(layout.getSpan()).toBe(1 + 4 + 1)
    })

    it("struct with variable fields", () => {
      const varLayout = borsh.struct([
        borsh.u8("tag"),
        borsh.str("name"),
        borsh.u32("value"),
      ])
      const val = { tag: 1, name: "test", value: 42 }
      expect(roundtrip(varLayout, val)).toEqual(val)

      const buf = new Uint8Array(1024)
      varLayout.encode(val, buf)
      expect(varLayout.getSpan(buf)).toBe(1 + (4 + 4) + 4) // u8 + str("test") + u32
    })

    it("nested struct", () => {
      const inner = borsh.struct([borsh.u8("x"), borsh.u8("y")])
      const outer = borsh.struct([inner.replicate("point"), borsh.u32("z")])
      const val = { point: { x: 1, y: 2 }, z: 3 }
      expect(roundtrip(outer, val)).toEqual(val)
    })
  })

  describe("rustEnum", () => {
    const layout = borsh.rustEnum([
      borsh.struct([], "None"),
      borsh.struct([borsh.u32("value")], "Some"),
      borsh.struct([borsh.str("msg"), borsh.u8("code")], "Error"),
    ])

    it("roundtrip variant 0 (no fields)", () => {
      expect(roundtrip(layout, { None: {} })).toEqual({ None: {} })
    })

    it("roundtrip variant 1", () => {
      expect(roundtrip(layout, { Some: { value: 42 } })).toEqual({
        Some: { value: 42 },
      })
    })

    it("roundtrip variant 2", () => {
      expect(roundtrip(layout, { Error: { msg: "fail", code: 1 } })).toEqual({
        Error: { msg: "fail", code: 1 },
      })
    })

    it("binary discriminator", () => {
      const bytes0 = encode(layout, { None: {} })
      expect(bytes0[0]).toBe(0)

      const bytes1 = encode(layout, { Some: { value: 1 } })
      expect(bytes1[0]).toBe(1)

      const bytes2 = encode(layout, { Error: { msg: "", code: 0 } })
      expect(bytes2[0]).toBe(2)
    })

    it("throws on invalid discriminator", () => {
      const buf = new Uint8Array([99]) // discriminator 99, way out of range
      expect(() => layout.decode(buf)).toThrow("Invalid enum discriminator")
    })

    it("throws on invalid value", () => {
      const buf = new Uint8Array(100)
      expect(() => layout.encode({ Unknown: {} }, buf)).toThrow(
        "Invalid enum value"
      )
    })

    it("replicate preserves behavior", () => {
      const replicated = layout.replicate("myEnum")
      expect(replicated.property).toBe("myEnum")
      expect(roundtrip(replicated, { Some: { value: 10 } })).toEqual({
        Some: { value: 10 },
      })
    })
  })

  describe("replicate", () => {
    it("preserves encode/decode for basic types", () => {
      const layout = borsh.u32("original")
      const rep = layout.replicate("copy")
      expect(rep.property).toBe("copy")
      expect(roundtrip(rep, 42)).toBe(42)
      expect(rep.span).toBe(4)
    })

    it("preserves getSpan for variable layouts", () => {
      const layout = borsh.str("original")
      const rep = layout.replicate("copy")
      const buf = encode(rep, "test")
      expect(rep.getSpan(buf)).toBe(layout.getSpan(buf))
    })
  })

  describe("offset encoding", () => {
    it("encodes and decodes at non-zero offset", () => {
      const layout = borsh.u32("val")
      const buf = new Uint8Array(16)
      buf[0] = 0xaa // sentinel
      layout.encode(42, buf, 4)
      expect(buf[0]).toBe(0xaa) // sentinel untouched
      expect(layout.decode(buf, 4)).toBe(42)
    })
  })

  describe("complex nested structures", () => {
    it("struct with vec of structs", () => {
      const inner = borsh.struct([borsh.u8("a"), borsh.u16("b")])
      const layout = borsh.struct([
        borsh.u32("count"),
        borsh.vec(inner, "items"),
      ])
      const val = {
        count: 2,
        items: [
          { a: 1, b: 100 },
          { a: 2, b: 200 },
        ],
      }
      expect(roundtrip(layout, val)).toEqual(val)
    })

    it("vec of options", () => {
      const layout = borsh.vec(borsh.option(borsh.u64()), "val")
      const val = [42n, null, 100n]
      expect(roundtrip(layout, val)).toEqual(val)
    })

    it("struct with all types", () => {
      const layout = borsh.struct([
        borsh.u8("a"),
        borsh.i8("b"),
        borsh.u16("c"),
        borsh.i16("d"),
        borsh.u32("e"),
        borsh.i32("f"),
        borsh.u64("g"),
        borsh.i64("h"),
        borsh.bool("i"),
        borsh.str("j"),
        borsh.vecU8("k"),
      ])
      const val = {
        a: 255,
        b: -1,
        c: 1000,
        d: -1000,
        e: 100000,
        f: -100000,
        g: 9999999999n,
        h: -9999999999n,
        i: true,
        j: "hello",
        k: new Uint8Array([1, 2, 3]),
      }
      expect(roundtrip(layout, val)).toEqual(val)
    })
  })
})
