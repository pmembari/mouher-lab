import assert from "node:assert/strict";
import test from "node:test";

import { summarizeEvents } from "./analytics.js";

test("summarizeEvents counts recent commerce interactions", () => {
  const now = new Date("2026-09-13T00:00:00Z");
  const events = [
    { name: "product_click", timestamp: "2026-09-12T00:00:00Z", properties: { product_id: "coat", product_name: "Coat" } },
    { name: "quick_add_click", timestamp: "2026-09-12T01:00:00Z", properties: { product_id: "coat", product_name: "Coat" } },
    { name: "wishlist_click", timestamp: "2026-09-12T02:00:00Z", properties: { product_id: "dress", product_name: "Dress" } },
    { name: "product_click", timestamp: "2026-07-01T00:00:00Z", properties: { product_id: "old" } },
  ];

  const summary = summarizeEvents(events, now);
  assert.deepEqual({
    totalEvents: summary.totalEvents,
    productClicks: summary.productClicks,
    quickAdds: summary.quickAdds,
    wishlists: summary.wishlists,
    conversionRate: summary.conversionRate,
    topProducts: summary.topProducts,
  }, {
    totalEvents: 3,
    productClicks: 1,
    quickAdds: 1,
    wishlists: 1,
    conversionRate: 100,
    topProducts: [
      { id: "coat", name: "Coat", clicks: 1, quickAdds: 1, wishlists: 0 },
      { id: "dress", name: "Dress", clicks: 0, quickAdds: 0, wishlists: 1 },
    ],
  });
  assert.equal(summary.daily.at(-2).total, 3);
  assert.deepEqual(summary.funnel.map((step) => step.value), [1, 1, 0, 0]);
});
