import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { publicCatalog } from "./service"
import { searchCatalog } from "./search"

const boolean = z.enum(["true", "false"]).transform(value => value === "true").optional()
const price = z.coerce.number().finite().nonnegative().optional()
const querySchema = z.object({
  q: z.string().max(200).optional(), category: z.string().max(200).optional(), collection: z.string().max(200).optional(),
  minPrice: price, maxPrice: price, size: z.string().max(100).optional(), color: z.string().max(100).optional(),
  inStock: boolean, sale: boolean,
  sort: z.enum(["featured", "newest", "price-asc", "price-desc"]).default("featured"),
  limit: z.coerce.number().int().min(1).max(100).default(30), offset: z.coerce.number().int().nonnegative().default(0),
  region_id: z.string().max(100).optional(), country_code: z.string().length(2).optional(),
}).strict().refine(value => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice,
  "Minimum price must not exceed maximum price.")

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const result = querySchema.safeParse(req.query)
  if (!result.success) throw new MedusaError(MedusaError.Types.INVALID_DATA, result.error.message)
  const publishableKey = req.headers["x-publishable-api-key"]
  if (typeof publishableKey !== "string" || !publishableKey) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Publishable API key is required.")
  const { q, region_id, country_code, ...filters } = result.data
  try {
    const products = await publicCatalog({ publishableKey, regionId: region_id, countryCode: country_code })
    res.setHeader("Cache-Control", "no-store")
    return res.json({ ...searchCatalog(products, { ...filters, query: q }), contract_version: 1 })
  } catch {
    return res.status(503).json({ code: "catalog_unavailable", message: "The catalog could not be refreshed. Retry shortly." })
  }
}
