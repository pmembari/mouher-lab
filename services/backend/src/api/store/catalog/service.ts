import Medusa from "@medusajs/js-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { PublicProduct } from "./search"

const MAX_PRODUCTS = 10000
const CACHE_MS = 15000
const MAX_CONTEXTS = 16
const fields = "id,title,handle,description,metadata,thumbnail,created_at,*images,*variants,*variants.calculated_price,*variants.inventory_quantity,*variants.options,*variants.options.option,*categories,*collection,*type,*tags"
type Context = { publishableKey: string; regionId?: string; countryCode?: string }
const cache = new Map<string, { expires: number; products: PublicProduct[] }>()
const pending = new Map<string, Promise<PublicProduct[]>>()

export async function publicCatalog(context: Context): Promise<PublicProduct[]> {
  // Configured trusted origin, never the caller-controlled Host header.
  const baseUrl = process.env.MOUHER_STORE_API_URL || `http://127.0.0.1:${process.env.PORT || "9000"}`
  const key = JSON.stringify([baseUrl, context.publishableKey, context.regionId, context.countryCode])
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.products
  if (pending.has(key)) return pending.get(key)!
  if (pending.size >= MAX_CONTEXTS) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Catalog refresh capacity exceeded. Retry shortly.")
  const refresh = load(context, baseUrl).then(products => {
    if (cache.size >= MAX_CONTEXTS) cache.delete(cache.keys().next().value!)
    cache.set(key, { products, expires: Date.now() + CACHE_MS })
    return products
  }).finally(() => pending.delete(key))
  pending.set(key, refresh)
  return refresh
}

async function load(context: Context, baseUrl: string): Promise<PublicProduct[]> {
  const sdk = new Medusa({ baseUrl, publishableKey: context.publishableKey })
  // Built-in SDK list takes headers, not a signal option. Inject cancellation
  // through the public client.fetch used by that method.
  const fetch = sdk.client.fetch.bind(sdk.client)
  sdk.client.fetch = (input, init = {}) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) })
  const products: PublicProduct[] = []
  const seen = new Set<string>()
  let expectedCount: number | undefined
  for (let offset = 0; ; offset += 100) {
    const query = { limit: 100, offset, fields, order: "id", region_id: context.regionId, country_code: context.countryCode }
    const page = await sdk.store.product.list(query)
    if (!Number.isInteger(page.count) || page.count < 0 || !Array.isArray(page.products)) throw new Error("Invalid Store API catalog response.")
    if (page.count > MAX_PRODUCTS) throw new Error("Catalog exceeds the bounded search projection. Configure a dedicated search index before expanding it.")
    if (expectedCount !== undefined && page.count !== expectedCount) throw new Error("Catalog changed during refresh; retry with a consistent catalog.")
    expectedCount = page.count
    if (page.products.length !== Math.min(100, Math.max(0, page.count - offset))) throw new Error("Incomplete Store API catalog response.")
    for (const product of page.products) {
      if (seen.has(product.id)) throw new Error("Catalog changed during refresh; retry with a consistent catalog.")
      seen.add(product.id); products.push(product)
    }
    if (products.length >= page.count) return products
    if (!page.products.length) throw new Error("Incomplete Store API catalog response.")
  }
}
