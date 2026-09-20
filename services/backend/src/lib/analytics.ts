export const ALLOWED_ANALYTICS_EVENTS = new Set([
  "page_view",
  "product_click",
  "product_view",
  "search",
  "wishlist_click",
  "quick_add_click",
  "add_to_cart",
  "begin_checkout",
  "purchase",
])

export const ALLOWED_ANALYTICS_PROPERTIES = new Set([
  "category",
  "collection",
  "interaction",
  "query_length",
  "source",
])

export type AnalyticsEventInput = {
  event_name: string
  consent: boolean
  anonymous_id?: string
  session_id?: string
  customer_id?: string
  path?: string
  product_id?: string
  product_name?: string
  value?: number | string | null
  currency?: string
  properties?: Record<string, unknown>
  occurred_at?: string
}

export type AnalyticsRequestContext = {
  country_code?: string
  region?: string
  city?: string
  user_agent?: string
  customer_id?: string
  now?: Date
}

export type AnalyticsEventRecord = {
  id?: string
  event_name: string
  anonymous_id: string
  session_id: string
  customer_id: string
  path: string
  product_id: string
  product_name: string
  value: string | null
  currency: string
  country_code: string
  region: string
  city: string
  device_type: string
  properties: Record<string, unknown>
  occurred_at: Date
}

export type AnalyticsDashboardSummary = {
  range_days: number
  visitors: number
  events: number
  account_visitors: number
  funnel: {
    product_views: number
    adds: number
    checkouts: number
    purchases: number
  }
  daily: Array<{ date: string; events: number }>
  top_products: Array<{
    product_id: string
    product_name: string
    interactions: number
    adds: number
  }>
  top_sold_products: Array<{
    product_id: string
    product_name: string
    sold_units: number
  }>
  top_wishlisted_products: Array<{
    product_id: string
    product_name: string
    wishlists: number
  }>
  locations: Array<{
    country_code: string
    region: string
    city: string
    events: number
    visitors: number
  }>
  devices: Array<{ device_type: string; events: number }>
}

export class AnalyticsInputError extends Error {
  statusCode = 400
}

export function buildAnalyticsEventRecord(
  input: AnalyticsEventInput,
  context: AnalyticsRequestContext = {}
): AnalyticsEventRecord {
  if (input.consent !== true) {
    throw new AnalyticsInputError("Analytics consent is required.")
  }

  const eventName = cleanText(input.event_name, 64)

  if (!ALLOWED_ANALYTICS_EVENTS.has(eventName)) {
    throw new AnalyticsInputError("Unsupported analytics event.")
  }

  return {
    event_name: eventName,
    anonymous_id: cleanText(input.anonymous_id, 64),
    session_id: cleanText(input.session_id, 64),
    customer_id: cleanText(context.customer_id || input.customer_id, 128),
    path: cleanText(input.path, 512),
    product_id: cleanText(input.product_id, 128),
    product_name: cleanText(input.product_name, 255),
    value: normalizeDecimal(input.value),
    currency: cleanText(input.currency, 8).toUpperCase(),
    country_code: cleanText(context.country_code, 2).toUpperCase(),
    region: cleanText(context.region, 100),
    city: cleanText(context.city, 100),
    device_type: detectDeviceType(context.user_agent || ""),
    properties: allowedProperties(input.properties),
    occurred_at: normalizeOccurredAt(input.occurred_at, context.now || new Date()),
  }
}

export function buildAnalyticsDashboardSummary(
  rows: AnalyticsEventRecord[],
  days = 30,
  now = new Date()
): AnalyticsDashboardSummary {
  const rangeDays = Math.max(1, Math.min(Number.isFinite(days) ? Math.trunc(days) : 30, 90))
  const start = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000)
  const events = rows.filter((row) => new Date(row.occurred_at).getTime() >= start.getTime())
  const counts = countBy(events, (row) => row.event_name)
  const dailyRows = countBy(events, (row) => dateKey(row.occurred_at))

  return {
    range_days: rangeDays,
    visitors: uniqueCount(events, (row) => row.anonymous_id),
    events: events.length,
    account_visitors: uniqueCount(events, (row) => row.customer_id),
    funnel: {
      product_views: (counts.product_view || 0) + (counts.product_click || 0),
      adds: (counts.add_to_cart || 0) + (counts.quick_add_click || 0),
      checkouts: counts.begin_checkout || 0,
      purchases: counts.purchase || 0,
    },
    daily: buildDailySeries(rangeDays, now, dailyRows),
    top_products: topProducts(events),
    top_sold_products: topSoldProducts(events),
    top_wishlisted_products: topWishlistedProducts(events),
    locations: topLocations(events),
    devices: topDevices(events),
  }
}

export function analyticsHeadersContext(headers: Record<string, string | string[] | undefined>) {
  return {
    country_code: headerValue(headers, "cf-ipcountry") || headerValue(headers, "x-country-code"),
    region: headerValue(headers, "x-region"),
    city: headerValue(headers, "x-city"),
    user_agent: headerValue(headers, "user-agent"),
  }
}

export function detectDeviceType(userAgent: string): string {
  const normalized = userAgent.toLowerCase()

  if (["mobile", "android", "iphone"].some((value) => normalized.includes(value))) {
    return "mobile"
  }

  if (["ipad", "tablet"].some((value) => normalized.includes(value))) {
    return "tablet"
  }

  return "desktop"
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value || "").slice(0, maxLength)
}

function normalizeDecimal(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numeric = Number(value)

  if (!Number.isFinite(numeric)) {
    return null
  }

  return numeric.toFixed(2)
}

function normalizeOccurredAt(value: unknown, now: Date): Date {
  const parsed = typeof value === "string" && value ? new Date(value) : now
  const occurredAt = Number.isNaN(parsed.getTime()) ? now : parsed
  const earliest = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const latest = new Date(now.getTime() + 5 * 60 * 1000)

  if (occurredAt < earliest || occurredAt > latest) {
    return now
  }

  return occurredAt
}

function allowedProperties(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(([key]) =>
      ALLOWED_ANALYTICS_PROPERTIES.has(key)
    )
  )
}

function countBy<T>(rows: T[], keyFn: (row: T) => string): Record<string, number> {
  return rows.reduce<Record<string, number>>((accumulator, row) => {
    const key = keyFn(row)
    accumulator[key] = (accumulator[key] || 0) + 1
    return accumulator
  }, {})
}

function uniqueCount<T>(rows: T[], keyFn: (row: T) => string): number {
  return new Set(rows.map(keyFn).filter(Boolean)).size
}

function buildDailySeries(
  days: number,
  now: Date,
  dailyRows: Record<string, number>
): Array<{ date: string; events: number }> {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  return Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index
    const date = new Date(today.getTime() - offset * 24 * 60 * 60 * 1000)
    const key = date.toISOString().slice(0, 10)
    return { date: key, events: dailyRows[key] || 0 }
  })
}

function topProducts(events: AnalyticsEventRecord[]) {
  const rows = groupedProductRows(
    events.filter((row) => row.product_id),
    (row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      interactions: 0,
      adds: 0,
    }),
    (target, row) => {
      target.interactions += 1
      if (["add_to_cart", "quick_add_click"].includes(row.event_name)) {
        target.adds += 1
      }
    }
  )

  return rows.sort((a, b) => b.interactions - a.interactions).slice(0, 10)
}

function topSoldProducts(events: AnalyticsEventRecord[]) {
  const rows = groupedProductRows(
    events.filter((row) => row.event_name === "purchase" && row.product_id),
    (row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      sold_units: 0,
    }),
    (target) => {
      target.sold_units += 1
    }
  )

  return rows.sort((a, b) => b.sold_units - a.sold_units).slice(0, 10)
}

function topWishlistedProducts(events: AnalyticsEventRecord[]) {
  const rows = groupedProductRows(
    events.filter((row) => row.event_name === "wishlist_click" && row.product_id),
    (row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      wishlists: 0,
    }),
    (target) => {
      target.wishlists += 1
    }
  )

  return rows.sort((a, b) => b.wishlists - a.wishlists).slice(0, 10)
}

function groupedProductRows<T extends { product_id: string; product_name: string }>(
  events: AnalyticsEventRecord[],
  create: (row: AnalyticsEventRecord) => T,
  update: (target: T, row: AnalyticsEventRecord) => void
): T[] {
  const grouped = new Map<string, T>()

  for (const row of events) {
    const key = `${row.product_id}:${row.product_name}`
    const target = grouped.get(key) || create(row)
    update(target, row)
    grouped.set(key, target)
  }

  return [...grouped.values()]
}

function topLocations(events: AnalyticsEventRecord[]) {
  const grouped = new Map<
    string,
    {
      country_code: string
      region: string
      city: string
      events: number
      visitorsSet: Set<string>
    }
  >()

  for (const row of events.filter((event) => event.country_code)) {
    const key = `${row.country_code}:${row.region}:${row.city}`
    const target =
      grouped.get(key) ||
      {
        country_code: row.country_code,
        region: row.region,
        city: row.city,
        events: 0,
        visitorsSet: new Set<string>(),
      }
    target.events += 1
    if (row.anonymous_id) {
      target.visitorsSet.add(row.anonymous_id)
    }
    grouped.set(key, target)
  }

  return [...grouped.values()]
    .map(({ visitorsSet, ...row }) => ({ ...row, visitors: visitorsSet.size }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 20)
}

function topDevices(events: AnalyticsEventRecord[]) {
  return Object.entries(countBy(events.filter((row) => row.device_type), (row) => row.device_type))
    .map(([device_type, count]) => ({ device_type, events: count }))
    .sort((a, b) => b.events - a.events)
}

function dateKey(value: Date): string {
  return new Date(value).toISOString().slice(0, 10)
}

function headerValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string {
  const value = headers[name] || headers[name.toLowerCase()]

  if (Array.isArray(value)) {
    return value[0] || ""
  }

  return value || ""
}
