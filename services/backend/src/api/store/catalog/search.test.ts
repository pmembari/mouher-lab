import { describe, it, expect } from "vitest"
import { searchCatalog } from "./search"

function product(id: string, amount: number, category = "Shirts", stock = 3) {
  return { id, handle: id, title: id, categories: [{ name: category }], collection: { title: "Unisex" },
    variants: [{ id: `v_${id}`, manage_inventory: true, inventory_quantity: stock,
      calculated_price: { calculated_amount: amount, original_amount: amount + 5, currency_code: "eur" },
      options: [{ value: "M", option: { title: "Size" } }, { value: "Blue", option: { title: "Color" } }] }] }
}

describe("catalog-wide search", () => {
  it("finds a match outside the first source batch and counts before pagination", () => {
    const products = Array.from({ length: 31 }, (_, i) => product(`p${i}`, i + 1, i === 30 ? "Coats" : "Shirts"))
    const result = searchCatalog(products, { category: "coats", limit: 30, offset: 0 })
    expect(result.products.map(p => p.id)).toEqual(["p30"])
    expect(result.count).toBe(1)
    expect(result.facets.availableCategories).toHaveLength(2)
  })
  it("sorts prices globally and uses a deterministic ID tie-breaker", () => {
    const products = [product("z", 20), product("b", 10), product("a", 10), product("c", 30)]
    expect(searchCatalog(products, { sort: "price-asc", limit: 2 }).products.map(p => p.id)).toEqual(["a", "b"])
    expect(searchCatalog(products, { sort: "price-desc", limit: 2 }).products.map(p => p.id)).toEqual(["c", "z"])
    expect(searchCatalog(products, { sort: "price-asc", limit: 2, offset: 2 }).products.map(p => p.id)).toEqual(["z", "c"])
  })
  it("orders newest across pages after restricting the collection", () => {
    const products = [product("old", 10), product("new", 20), product("other", 30)].map((p, i) =>
      ({ ...p, created_at: `2026-01-0${i + 1}T00:00:00Z` }))
    products[2].collection.title = "Women"
    const result = searchCatalog(products, { collection: "unisex", sort: "newest", limit: 1 })
    expect(result.count).toBe(2)
    expect(result.products[0].id).toBe("new")
    expect(searchCatalog(products, { collection: "unisex", sort: "newest", limit: 1, offset: 1 }).products[0].id).toBe("old")
  })
  it("combines price, stock, sale, size, color and Persian search", () => {
    const products = [product("p1", 19), product("p2", 50), product("p3", 20, "Shirts", 0)]
    products[0].title = "پیراهن آبی"
    const result = searchCatalog(products, { query: "پیراهن", minPrice: 10, maxPrice: 30, size: "m", color: "blue", sale: true, inStock: true })
    expect(result.products.map(p => p.id)).toEqual(["p1"])
    expect(result.facets.priceBounds).toEqual({ min: 19, max: 50 })
  })
  it("keeps missing prices last, handles empty results and clamps an out-of-range page", () => {
    const unknown = { ...product("unknown", 0), variants: [] }
    expect(searchCatalog([unknown, product("known", 20)], { sort: "price-desc" }).products.map(p => p.id)).toEqual(["known", "unknown"])
    expect(searchCatalog([product("p", 20)], { offset: 60, limit: 30 }).offset).toBe(0)
    expect(searchCatalog([product("p", 20)], { query: "missing" }).count).toBe(0)
  })
})
