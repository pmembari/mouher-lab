import { describe, expect, it } from "vitest"

import { roundToNearestMillionToman } from "./service"

describe("roundToNearestMillionToman", () => {
  it("rounds down to the nearest million", () => {
    expect(roundToNearestMillionToman(7_470_000)).toBe(7_000_000)
  })

  it("rounds up to the nearest million", () => {
    expect(roundToNearestMillionToman(7_510_000)).toBe(8_000_000)
  })

  it("keeps exact million brackets unchanged", () => {
    expect(roundToNearestMillionToman(12_000_000)).toBe(12_000_000)
  })
})
