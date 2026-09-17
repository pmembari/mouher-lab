const BONBAST_EUR_GRAPH_URL = "https://www.bonbast.com/graph/eur"
const FREE_SHIPPING_EUR = 50
const BASE_POLICY_YEAR = 2026
const BASE_THRESHOLD_TOMAN = 10_000_000
const ANNUAL_INCREMENT_TOMAN = 1_000_000
const FETCH_TIMEOUT_MS = 8_000

export type FreeShippingThreshold = {
  eur_amount: number
  eur_toman_rate: number | null
  threshold_toman: number
  threshold_rial: number
  policy_year: number
  source: "annual-policy"
  fetched_at: string | null
  cache_month: string
}

type CachedThreshold = FreeShippingThreshold & {
  cache_month: string
}

let cachedThreshold: CachedThreshold | null = null

export async function getFreeShippingThreshold(): Promise<FreeShippingThreshold> {
  const now = new Date()
  const cacheMonth = monthKey(now)
  const policyYear = now.getUTCFullYear()
  const thresholdToman = annualFreeShippingThresholdToman(policyYear)

  if (cachedThreshold?.cache_month === cacheMonth) {
    return cachedThreshold
  }

  let eurTomanRate: number | null = null
  let fetchedAt: string | null = null

  try {
    eurTomanRate = await fetchBonbastEurTomanRate()
    fetchedAt = new Date().toISOString()
  } catch {
    // The exchange rate is informational only. The free-shipping threshold
    // follows a stable annual policy and must not move with FX volatility.
  }

  cachedThreshold = {
    eur_amount: FREE_SHIPPING_EUR,
    eur_toman_rate: eurTomanRate,
    threshold_toman: thresholdToman,
    threshold_rial: thresholdToman * 10,
    policy_year: policyYear,
    source: "annual-policy",
    fetched_at: fetchedAt,
    cache_month: cacheMonth,
  }

  return cachedThreshold
}

export function annualFreeShippingThresholdToman(year: number): number {
  const elapsedYears = Math.max(0, Math.trunc(year) - BASE_POLICY_YEAR)

  return BASE_THRESHOLD_TOMAN + elapsedYears * ANNUAL_INCREMENT_TOMAN
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
