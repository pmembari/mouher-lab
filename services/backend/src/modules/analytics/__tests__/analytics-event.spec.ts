import { describe, expect, it } from "vitest"

import {
  AnalyticsInputError,
  buildAnalyticsDashboardSummary,
  buildAnalyticsEventRecord,
  detectDeviceType,
} from "../../../lib/analytics"

describe("analytics event compatibility", () => {
  it("requires consent and rejects unsupported events", () => {
    expect(() =>
      buildAnalyticsEventRecord({
        event_name: "page_view",
        consent: false,
      })
    ).toThrow(AnalyticsInputError)

    expect(() =>
      buildAnalyticsEventRecord({
        event_name: "unsupported",
        consent: true,
      })
    ).toThrow(AnalyticsInputError)
  })

  it("normalizes request-derived fields without storing ip addresses", () => {
    const event = buildAnalyticsEventRecord(
      {
        event_name: "product_view",
        consent: true,
        anonymous_id: "visitor-1",
        product_id: "prod-1",
        product_name: "Coat",
        value: "12.4",
        currency: "eur",
        properties: {
          source: "product-card",
          ip: "203.0.113.10",
        },
      },
      {
        country_code: "it",
        region: "Lombardy",
        city: "Milan",
        user_agent: "Mobile Safari",
      }
    )

    expect(event.country_code).toBe("IT")
    expect(event.region).toBe("Lombardy")
    expect(event.city).toBe("Milan")
    expect(event.device_type).toBe("mobile")
    expect(event.currency).toBe("EUR")
    expect(event.value).toBe("12.40")
    expect(event.properties).toEqual({ source: "product-card" })
  })

  it("clamps stale and future timestamps", () => {
    const now = new Date("2026-09-16T12:00:00.000Z")

    const stale = buildAnalyticsEventRecord(
      {
        event_name: "page_view",
        consent: true,
        occurred_at: "2026-09-10T12:00:00.000Z",
      },
      { now }
    )
    const future = buildAnalyticsEventRecord(
      {
        event_name: "page_view",
        consent: true,
        occurred_at: "2026-09-16T12:06:00.000Z",
      },
      { now }
    )

    expect(stale.occurred_at.toISOString()).toBe(now.toISOString())
    expect(future.occurred_at.toISOString()).toBe(now.toISOString())
  })

  it("keeps stable device classification", () => {
    expect(detectDeviceType("Mozilla/5.0 iPhone Safari")).toBe("mobile")
    expect(detectDeviceType("Mozilla/5.0 iPad Safari")).toBe("tablet")
    expect(detectDeviceType("Mozilla/5.0 Macintosh Safari")).toBe("desktop")
  })
})

describe("analytics dashboard compatibility", () => {
  it("aggregates visitors, funnel, locations, and product rankings", () => {
    const now = new Date("2026-09-16T12:00:00.000Z")
    const occurred_at = new Date("2026-09-16T11:00:00.000Z")
    const rows = [
      buildAnalyticsEventRecord(
        {
          event_name: "product_click",
          consent: true,
          anonymous_id: "v1",
          product_id: "p1",
          product_name: "Coat",
        },
        {
          country_code: "IT",
          user_agent: "Desktop",
          now,
        }
      ),
      buildAnalyticsEventRecord(
        {
          event_name: "purchase",
          consent: true,
          product_id: "p1",
          product_name: "Coat",
        },
        { now }
      ),
      buildAnalyticsEventRecord(
        {
          event_name: "wishlist_click",
          consent: true,
          product_id: "p2",
          product_name: "Dress",
        },
        { now }
      ),
    ].map((row) => ({ ...row, occurred_at }))

    const summary = buildAnalyticsDashboardSummary(rows, 7, now)

    expect(summary.visitors).toBe(1)
    expect(summary.events).toBe(3)
    expect(summary.funnel.product_views).toBe(1)
    expect(summary.funnel.purchases).toBe(1)
    expect(summary.locations[0]).toMatchObject({
      country_code: "IT",
      events: 1,
      visitors: 1,
    })
    expect(summary.top_sold_products[0]).toMatchObject({
      product_id: "p1",
      sold_units: 1,
    })
    expect(summary.top_wishlisted_products[0]).toMatchObject({
      product_id: "p2",
      wishlists: 1,
    })
  })

  it("returns empty aggregates without analytics rows", () => {
    const summary = buildAnalyticsDashboardSummary([], 120, new Date("2026-09-16T12:00:00.000Z"))

    expect(summary.range_days).toBe(90)
    expect(summary.visitors).toBe(0)
    expect(summary.events).toBe(0)
    expect(summary.daily).toHaveLength(90)
    expect(summary.top_products).toEqual([])
  })
})
