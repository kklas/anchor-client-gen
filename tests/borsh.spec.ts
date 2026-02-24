import { describe, expect, it } from "vitest"
import * as borsh from "../src/borsh"

describe("borsh layout span", () => {
  describe("primitive layouts", () => {
    it("u8 span is 1", () => {
      expect(borsh.u8().span).toBe(1)
    })

    it("i8 span is 1", () => {
      expect(borsh.i8().span).toBe(1)
    })

    it("u16 span is 2", () => {
      expect(borsh.u16().span).toBe(2)
    })

    it("u32 span is 4", () => {
      expect(borsh.u32().span).toBe(4)
    })

    it("u64 span is 8", () => {
      expect(borsh.u64().span).toBe(8)
    })

    it("i64 span is 8", () => {
      expect(borsh.i64().span).toBe(8)
    })

    it("u128 span is 16", () => {
      expect(borsh.u128().span).toBe(16)
    })

    it("f32 span is 4", () => {
      expect(borsh.f32().span).toBe(4)
    })

    it("f64 span is 8", () => {
      expect(borsh.f64().span).toBe(8)
    })

    it("bool span is 1", () => {
      expect(borsh.bool().span).toBe(1)
    })

    it("blob span matches size", () => {
      expect(borsh.blob(32).span).toBe(32)
    })
  })

  describe("struct layout span", () => {
    it("fixed-size struct has correct span", () => {
      const layout = borsh.struct([
        borsh.u8("a"),
        borsh.u32("b"),
        borsh.u64("c"),
      ])
      expect(layout.span).toBe(1 + 4 + 8)
    })

    it("struct with blob has correct span", () => {
      const layout = borsh.struct([
        borsh.u64("fieldA"),
        borsh.u32("fieldB"),
        borsh.blob(32, "data"),
      ])
      expect(layout.span).toBe(8 + 4 + 32)
    })

    it("struct containing variable-size field returns -1", () => {
      const layout = borsh.struct([
        borsh.u32("fixed"),
        borsh.str("variable"),
      ])
      expect(layout.span).toBe(-1)
    })

    it("struct with vec returns -1", () => {
      const layout = borsh.struct([
        borsh.u32("id"),
        borsh.vec(borsh.u8(), "data"),
      ])
      expect(layout.span).toBe(-1)
    })

    it("struct with option returns -1", () => {
      const layout = borsh.struct([
        borsh.u32("id"),
        borsh.option(borsh.u32(), "maybe"),
      ])
      expect(layout.span).toBe(-1)
    })

    it("empty struct has span 0", () => {
      const layout = borsh.struct([])
      expect(layout.span).toBe(0)
    })
  })

  describe("array layout span", () => {
    it("fixed-size element array has correct span", () => {
      const layout = borsh.array(borsh.u8(), 32)
      expect(layout.span).toBe(32)
    })

    it("u64 array has correct span", () => {
      const layout = borsh.array(borsh.u64(), 256)
      expect(layout.span).toBe(8 * 256)
    })

    it("bool array has correct span", () => {
      const layout = borsh.array(borsh.bool(), 3)
      expect(layout.span).toBe(3)
    })

    it("array of variable-size element returns -1", () => {
      const layout = borsh.array(borsh.str(), 5)
      expect(layout.span).toBe(-1)
    })

    it("zero-count array has span 0", () => {
      const layout = borsh.array(borsh.u64(), 0)
      expect(layout.span).toBe(0)
    })
  })

  describe("nested struct/array span", () => {
    it("struct with fixed-size array has correct span", () => {
      const layout = borsh.struct([
        borsh.u64("fieldA"),
        borsh.u32("fieldB"),
        borsh.array(borsh.u8(), 32, "data"),
        borsh.blob(32, "owner"),
      ])
      // 8 + 4 + 32 + 32 = 76
      expect(layout.span).toBe(76)
    })

    it("struct with nested fixed struct has correct span", () => {
      const inner = borsh.struct([
        borsh.bool("someField"),
        borsh.u8("otherField"),
      ])
      const outer = borsh.struct([
        borsh.u32("id"),
        inner.replicate("nested"),
      ])
      expect(inner.span).toBe(2)
      expect(outer.span).toBe(4 + 2)
    })

    it("struct with nested variable struct returns -1", () => {
      const inner = borsh.struct([
        borsh.str("name"),
      ])
      const outer = borsh.struct([
        borsh.u32("id"),
        inner.replicate("nested"),
      ])
      expect(inner.span).toBe(-1)
      expect(outer.span).toBe(-1)
    })

    it("array of fixed structs has correct span", () => {
      const element = borsh.struct([
        borsh.u32("x"),
        borsh.u32("y"),
      ])
      const layout = borsh.array(element, 10)
      expect(layout.span).toBe(8 * 10)
    })
  })

  describe("variable-size layouts", () => {
    it("vec span is -1", () => {
      expect(borsh.vec(borsh.u8()).span).toBe(-1)
    })

    it("str span is -1", () => {
      expect(borsh.str().span).toBe(-1)
    })

    it("vecU8 span is -1", () => {
      expect(borsh.vecU8().span).toBe(-1)
    })

    it("option span is -1", () => {
      expect(borsh.option(borsh.u32()).span).toBe(-1)
    })

    it("rustEnum span is -1", () => {
      expect(borsh.rustEnum([borsh.struct([], "A")]).span).toBe(-1)
    })
  })

  describe("span caching", () => {
    it("struct span is consistent across multiple reads", () => {
      const layout = borsh.struct([
        borsh.u8("a"),
        borsh.u32("b"),
      ])
      const first = layout.span
      const second = layout.span
      expect(first).toBe(5)
      expect(second).toBe(5)
      expect(first).toBe(second)
    })

    it("array span is consistent across multiple reads", () => {
      const layout = borsh.array(borsh.u64(), 100)
      const first = layout.span
      const second = layout.span
      expect(first).toBe(800)
      expect(second).toBe(800)
    })
  })

  describe("getSpan consistency", () => {
    it("struct getSpan matches span for fixed layouts", () => {
      const layout = borsh.struct([
        borsh.u64("a"),
        borsh.u32("b"),
        borsh.array(borsh.u8(), 32, "c"),
      ])
      expect(layout.span).toBe(layout.getSpan())
    })

    it("array getSpan matches span for fixed layouts", () => {
      const layout = borsh.array(borsh.u64(), 256)
      expect(layout.span).toBe(layout.getSpan())
    })
  })
})
