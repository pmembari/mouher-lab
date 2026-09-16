"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const analytics_1 = require("../../../lib/analytics");
(0, vitest_1.describe)("analytics event compatibility", () => {
    (0, vitest_1.it)("requires consent and rejects unsupported events", () => {
        (0, vitest_1.expect)(() => (0, analytics_1.buildAnalyticsEventRecord)({
            event_name: "page_view",
            consent: false,
        })).toThrow(analytics_1.AnalyticsInputError);
        (0, vitest_1.expect)(() => (0, analytics_1.buildAnalyticsEventRecord)({
            event_name: "unsupported",
            consent: true,
        })).toThrow(analytics_1.AnalyticsInputError);
    });
    (0, vitest_1.it)("normalizes request-derived fields without storing ip addresses", () => {
        const event = (0, analytics_1.buildAnalyticsEventRecord)({
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
        }, {
            country_code: "it",
            region: "Lombardy",
            city: "Milan",
            user_agent: "Mobile Safari",
        });
        (0, vitest_1.expect)(event.country_code).toBe("IT");
        (0, vitest_1.expect)(event.region).toBe("Lombardy");
        (0, vitest_1.expect)(event.city).toBe("Milan");
        (0, vitest_1.expect)(event.device_type).toBe("mobile");
        (0, vitest_1.expect)(event.currency).toBe("EUR");
        (0, vitest_1.expect)(event.value).toBe("12.40");
        (0, vitest_1.expect)(event.properties).toEqual({ source: "product-card" });
    });
    (0, vitest_1.it)("clamps stale and future timestamps", () => {
        const now = new Date("2026-09-16T12:00:00.000Z");
        const stale = (0, analytics_1.buildAnalyticsEventRecord)({
            event_name: "page_view",
            consent: true,
            occurred_at: "2026-09-10T12:00:00.000Z",
        }, { now });
        const future = (0, analytics_1.buildAnalyticsEventRecord)({
            event_name: "page_view",
            consent: true,
            occurred_at: "2026-09-16T12:06:00.000Z",
        }, { now });
        (0, vitest_1.expect)(stale.occurred_at.toISOString()).toBe(now.toISOString());
        (0, vitest_1.expect)(future.occurred_at.toISOString()).toBe(now.toISOString());
    });
    (0, vitest_1.it)("keeps stable device classification", () => {
        (0, vitest_1.expect)((0, analytics_1.detectDeviceType)("Mozilla/5.0 iPhone Safari")).toBe("mobile");
        (0, vitest_1.expect)((0, analytics_1.detectDeviceType)("Mozilla/5.0 iPad Safari")).toBe("tablet");
        (0, vitest_1.expect)((0, analytics_1.detectDeviceType)("Mozilla/5.0 Macintosh Safari")).toBe("desktop");
    });
});
(0, vitest_1.describe)("analytics dashboard compatibility", () => {
    (0, vitest_1.it)("aggregates visitors, funnel, locations, and product rankings", () => {
        const now = new Date("2026-09-16T12:00:00.000Z");
        const occurred_at = new Date("2026-09-16T11:00:00.000Z");
        const rows = [
            (0, analytics_1.buildAnalyticsEventRecord)({
                event_name: "product_click",
                consent: true,
                anonymous_id: "v1",
                product_id: "p1",
                product_name: "Coat",
            }, {
                country_code: "IT",
                user_agent: "Desktop",
                now,
            }),
            (0, analytics_1.buildAnalyticsEventRecord)({
                event_name: "purchase",
                consent: true,
                product_id: "p1",
                product_name: "Coat",
            }, { now }),
            (0, analytics_1.buildAnalyticsEventRecord)({
                event_name: "wishlist_click",
                consent: true,
                product_id: "p2",
                product_name: "Dress",
            }, { now }),
        ].map((row) => ({ ...row, occurred_at }));
        const summary = (0, analytics_1.buildAnalyticsDashboardSummary)(rows, 7, now);
        (0, vitest_1.expect)(summary.visitors).toBe(1);
        (0, vitest_1.expect)(summary.events).toBe(3);
        (0, vitest_1.expect)(summary.funnel.product_views).toBe(1);
        (0, vitest_1.expect)(summary.funnel.purchases).toBe(1);
        (0, vitest_1.expect)(summary.locations[0]).toMatchObject({
            country_code: "IT",
            events: 1,
            visitors: 1,
        });
        (0, vitest_1.expect)(summary.top_sold_products[0]).toMatchObject({
            product_id: "p1",
            sold_units: 1,
        });
        (0, vitest_1.expect)(summary.top_wishlisted_products[0]).toMatchObject({
            product_id: "p2",
            wishlists: 1,
        });
    });
    (0, vitest_1.it)("returns empty aggregates without analytics rows", () => {
        const summary = (0, analytics_1.buildAnalyticsDashboardSummary)([], 120, new Date("2026-09-16T12:00:00.000Z"));
        (0, vitest_1.expect)(summary.range_days).toBe(90);
        (0, vitest_1.expect)(summary.visitors).toBe(0);
        (0, vitest_1.expect)(summary.events).toBe(0);
        (0, vitest_1.expect)(summary.daily).toHaveLength(90);
        (0, vitest_1.expect)(summary.top_products).toEqual([]);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW5hbHl0aWNzLWV2ZW50LnNwZWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9hbmFseXRpY3MvX190ZXN0c19fL2FuYWx5dGljcy1ldmVudC5zcGVjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsbUNBQTZDO0FBRTdDLHNEQUsrQjtBQUUvQixJQUFBLGlCQUFRLEVBQUMsK0JBQStCLEVBQUUsR0FBRyxFQUFFO0lBQzdDLElBQUEsV0FBRSxFQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtRQUN6RCxJQUFBLGVBQU0sRUFBQyxHQUFHLEVBQUUsQ0FDVixJQUFBLHFDQUF5QixFQUFDO1lBQ3hCLFVBQVUsRUFBRSxXQUFXO1lBQ3ZCLE9BQU8sRUFBRSxLQUFLO1NBQ2YsQ0FBQyxDQUNILENBQUMsT0FBTyxDQUFDLCtCQUFtQixDQUFDLENBQUE7UUFFOUIsSUFBQSxlQUFNLEVBQUMsR0FBRyxFQUFFLENBQ1YsSUFBQSxxQ0FBeUIsRUFBQztZQUN4QixVQUFVLEVBQUUsYUFBYTtZQUN6QixPQUFPLEVBQUUsSUFBSTtTQUNkLENBQUMsQ0FDSCxDQUFDLE9BQU8sQ0FBQywrQkFBbUIsQ0FBQyxDQUFBO0lBQ2hDLENBQUMsQ0FBQyxDQUFBO0lBRUYsSUFBQSxXQUFFLEVBQUMsZ0VBQWdFLEVBQUUsR0FBRyxFQUFFO1FBQ3hFLE1BQU0sS0FBSyxHQUFHLElBQUEscUNBQXlCLEVBQ3JDO1lBQ0UsVUFBVSxFQUFFLGNBQWM7WUFDMUIsT0FBTyxFQUFFLElBQUk7WUFDYixZQUFZLEVBQUUsV0FBVztZQUN6QixVQUFVLEVBQUUsUUFBUTtZQUNwQixZQUFZLEVBQUUsTUFBTTtZQUNwQixLQUFLLEVBQUUsTUFBTTtZQUNiLFFBQVEsRUFBRSxLQUFLO1lBQ2YsVUFBVSxFQUFFO2dCQUNWLE1BQU0sRUFBRSxjQUFjO2dCQUN0QixFQUFFLEVBQUUsY0FBYzthQUNuQjtTQUNGLEVBQ0Q7WUFDRSxZQUFZ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