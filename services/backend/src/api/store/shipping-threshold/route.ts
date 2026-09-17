import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { getFreeShippingThreshold } from "./service"

export async function GET(
  _req: MedusaRequest,
  res: MedusaResponse
) {
  const threshold = await getFreeShippingThreshold()

  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
  )

  return res.status(200).json({
    free_shipping: threshold,
  })
}
