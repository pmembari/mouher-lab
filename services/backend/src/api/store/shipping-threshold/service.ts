const BONBAST_EUR_GRAPH_URL = "https://www.bonbast.com/graph/eur"
const FREE_SHIPPING_EUR = 50
const TOMAN_ROUNDING_STEP = 1_000_000
const FETCH_TIMEOUT_MS = 8_000

export type FreeShippingThreshold = {
  eur_amount: number
  eur_toman_rate: number | null
  threshold_toman: number | null
  threshold_rial: number | null
  source: "bonbast" | "stale-cache" | "fallback"
  fetched_at: string | null
  cache_month: string
}

type CachedThreshold = FreeShippingThreshold & {
  cache_month: string
}

let cachedThreshold: CachedThreshold | null = null

export async function getFreeShippingThreshold(): Promise<FreeShippingThreshold> {
  const cacheMonth = monthKey(new Date())

  if (cachedThreshold?.cache_month === cacheMonth) {
    return cachedThreshold
  }

  try {
    const eurTomanRate = await fetchBonbastEurTomanRate()
    const thresholdToman = roundToNearestMillionToman(
      eurTomanRate * FREE_SHIPPING_EUR
    )

    cachedThreshold = {
      eur_amount: FREE_SHIPPING_EUR,
      eur_toman_rate: eurTomanRate,
      threshold_toman: thresholdToman,
      threshold_rial: thresholdToman * 10,
      source: "bonbast",
      fetched_at: new Date().toISOString(),
      cache_month: cacheMonth,
    }

    return cachedThreshold
  } catch (error) {
    if (cachedThreshold?.threshold_toman) {
      return {
        ...cachedThreshold,
        source: "stale-cache",
      }
    }

    const fallbackToman = positiveIntegerFromEnv(
      process.env.FREE_SHIPPING_FALLBACK_TOMAN
    )

    return {
      eur_amount: FREE_SHIPPING_EUR,
      eur_toman_rate: null,
      threshold_toman: fallbackToman,
      threshold_rial: fallbackToman ? fallbackToman * 10 : null,
      source: "fallback",
      fetched_at: null,
      cache_month: cacheMonth,
    }
  }
}

export async function fetchBonbastEurTomanRate(): Promise<number> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(BONBAST_EUR_GRAPH_URL, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "MouherStorefront/1.0 (+https://mouher.com)",
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Bonbast returned HTTP ${response.status}`)
    }

    const html = await response.text()
    const text = htmlToText(html)
    const match = text.match(/Average\s+([0-9][0-9,]*)\s+([0-9][0-9,]*)/i)

    if (!match?.[1]) {
      throw new Error("Could not parse Bonbast EUR average sell rate")
    }

    const rate = Number(match[1].replace(/,/g, ""))

    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Bonbast EUR rate is invalid")
    }

    return rate
  } finally {
    clearTimeout(timeout)
  }
}

export function roundToNearestMillionToman(value: number): number {
  return Math.round(value / TOMAN_ROUNDING_STEP) * TOMAN_ROUNDING_STEP
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#160;/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
}

function positiveIntegerFromEnv(value?: string): number | null {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
