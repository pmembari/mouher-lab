import { afterEach, describe, expect, it } from "vitest"
import { createServer, Server } from "node:http"
import { publicCatalog } from "./service"

let server: Server | undefined
const originalOrigin = process.env.MOUHER_STORE_API_URL
afterEach(async () => {
  if (server) {
    server.closeAllConnections()
    await new Promise<void>(resolve => server!.close(() => resolve()))
    server = undefined
  }
  if (originalOrigin === undefined) delete process.env.MOUHER_STORE_API_URL
  else process.env.MOUHER_STORE_API_URL = originalOrigin
})

describe("public Store API projection contract", () => {
  it("loads every source page, forwards the public pricing context and shares a bounded cached refresh", async () => {
    const offsets: number[] = []
    server = createServer((request, response) => {
      expect(request.headers["x-publishable-api-key"]).toBe("pk_contract")
      const url = new URL(request.url!, "http://localhost")
      expect(url.pathname).toBe("/store/products")
      expect(url.searchParams.get("region_id")).toBe("reg_contract")
      expect(url.searchParams.get("country_code")).toBe("ir")
      expect(url.searchParams.get("order")).toBe("id")
      const offset = Number(url.searchParams.get("offset"))
      offsets.push(offset)
      response.setHeader("Content-Type", "application/json")
      response.end(JSON.stringify({ count: 101, products: Array.from({ length: offset ? 1 : 100 }, (_, i) => ({ id: `p${offset + i}` })) }))
    })
    await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve))
    process.env.MOUHER_STORE_API_URL = `http://127.0.0.1:${(server.address() as any).port}`
    const context = { publishableKey: "pk_contract", regionId: "reg_contract", countryCode: "ir" }
    const [first, concurrent] = await Promise.all([publicCatalog(context), publicCatalog(context)])
    expect(first).toHaveLength(101)
    expect(first[100].id).toBe("p100")
    expect(concurrent).toBe(first)
    expect(await publicCatalog(context)).toBe(first)
    expect(offsets).toEqual([0, 100])
  })

  it("rejects a partial source instead of publishing an incomplete catalog", async () => {
    server = createServer((_request, response) => {
      response.setHeader("Content-Type", "application/json")
      response.end(JSON.stringify({ count: 101, products: [] }))
    })
    await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve))
    process.env.MOUHER_STORE_API_URL = `http://127.0.0.1:${(server.address() as any).port}`
    await expect(publicCatalog({ publishableKey: "pk_incomplete" })).rejects.toThrow("Incomplete")
  })
})
