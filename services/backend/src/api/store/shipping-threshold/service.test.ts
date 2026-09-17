import { describe, expect, it } from "vitest"

import { annualFreeShippingThresholdToman } from "./service"

describe("annualFreeShippingThresholdToman", () => {
  it("starts at 10 million toman in 2026", () => {
    expect(annualFreeShippingThresholdToman(2026)).toBe(10_000_000)
  })

  it("adds 1 million toman each year", () => {
    expect(annualFreeShippingThresholdToman(2027)).toBe(11_000_000)
    expect(annualFreeShippingThresholdToman(2028)).toBe(12_000_000)
  })

  it("does not go below the base threshold before 2026", () => {
    expect(annualFreeShippingThresholdToman(2025)).toBe(10_000_000)
  })
})
