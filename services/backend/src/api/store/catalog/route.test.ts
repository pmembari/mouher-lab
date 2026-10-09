import { beforeEach, describe, expect, it, vi } from "vitest"
vi.mock("./service", () => ({ publicCatalog: vi.fn() }))
import { publicCatalog } from "./service"
import { GET } from "./route"

function response() {
  const res = { setHeader: vi.fn(), json: vi.fn(), status: vi.fn() }
  res.status.mockReturnValue(res)
  return res
}
beforeEach(() => { vi.mocked(publicCatalog).mockReset() })

describe("GET /store/catalog contract", () => {
  it("rejects invalid ranges, unsupported sorts, oversized pages and missing public keys before fetching", async () => {
    for (const query of [{ minPrice: "20", maxPrice: "10" }, { sort: "best-selling" }, { limit: "101" }]) {
      await expect(GET({ query, headers: { "x-publishable-api-key": "pk_test" } } as any, response() as any)).rejects.toThrow()
    }
    await expect(GET({ query: {}, headers: {} } as any, response() as any)).rejects.toThrow("Publishable API key")
    expect(publicCatalog).not.toHaveBeenCalled()
  })
  it("returns exact empty totals and global facets under the versioned contract", async () => {
    vi.mocked(publicCatalog).mockResolvedValue([{ id: "p", title: "shirt", variants: [] }])
    const res = response()
    await GET({ query: { q: "no match", offset: "90" }, headers: { "x-publishable-api-key": "pk_test" } } as any, res as any)
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store")
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ count: 0, offset: 0, products: [], contract_version: 1,
      facets: expect.objectContaining({ totalCount: 1 }) }))
  })
  it("returns an unavailable error without leaking source failures", async () => {
    vi.mocked(publicCatalog).mockRejectedValue(new Error("private source failure"))
    const res = response()
    await GET({ query: {}, headers: { "x-publishable-api-key": "pk_test" } } as any, res as any)
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith({ code: "catalog_unavailable", message: "The catalog could not be refreshed. Retry shortly." })
  })
})
