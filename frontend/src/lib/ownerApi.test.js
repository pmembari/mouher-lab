import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOwnerList, ownerCatalogFromProducts, isOwnerCredentialsValid } from "./ownerApi.js";

test("normalizeOwnerList applies the owner list envelope defaults", () => {
  assert.deepEqual(normalizeOwnerList({ data: [{ id: "prod_1" }] }), {
    data: [{ id: "prod_1" }],
    meta: { limit: 50, offset: 0, count: 1 },
  });

  assert.deepEqual(
    normalizeOwnerList({ data: [], meta: { limit: "10", offset: "20", count: "30" } }).meta,
    { limit: 10, offset: 20, count: 30 }
  );
});

test("ownerCatalogFromProducts normalizes Medusa admin products for dashboard metrics", () => {
  const catalog = ownerCatalogFromProducts([
    {
      id: "prod_1",
      title: "Mouher Coat",
      handle: "mouher-coat",
      variants: [
        {
          id: "variant_1",
          inventory_quantity: 3,
          calculated_price: { calculated_amount: 120, currency_code: "eur" },
        },
      ],
    },
  ]);

  assert.equal(catalog.source, "owner-api");
  assert.equal(catalog.products.length, 1);
  assert.equal(catalog.products[0].name, "Mouher Coat");
  assert.equal(catalog.products[0].stockCount, 3);
});

test("owner credentials accept the built-in super admin", () => {
  assert.equal(isOwnerCredentialsValid("pmembari", "1234"), true);
  assert.equal(isOwnerCredentialsValid("pmembari", "wrong"), false);
  assert.equal(isOwnerCredentialsValid("other", "1234"), false);
});

test("owner analytics clamps and forwards the selected report range", async () => {
  let requestedUrl = "";
  global.fetch = async (url) => {
    requestedUrl = url;
    return {
      ok: true,
      json: async () => ({ data: { range_days: 90 } }),
    };
  };

  const { loadOwnerAnalytics } = await import("./ownerApi.js");
  const response = await loadOwnerAnalytics("owner-secret", { mouherApiUrl: "http://localhost:8001/api/commerce" }, 120);

  assert.equal(response.data.range_days, 90);
  assert.equal(requestedUrl, "http://localhost:8001/api/commerce/analytics/dashboard/?days=90");
});

test("owner data helpers fetch the dashboard endpoints and keep a stable response envelope", async () => {
  const calls = [];

  global.fetch = async (url, options = {}) => {
    calls.push({ url, headers: options.headers || {} });

    if (url.endsWith("/admin/products/?limit=50&offset=0")) {
      return {
        ok: true,
        json: async () => ({ data: [{ id: "prod_1", title: "Mouher Coat" }], meta: { limit: 50, offset: 0, count: 1 } }),
      };
    }

    if (url.endsWith("/admin/orders/?limit=50&offset=0")) {
      return {
        ok: true,
        json: async () => ({ data: [{ id: "ord_1" }], meta: { limit: 50, offset: 0, count: 1 } }),
      };
    }

    if (url.endsWith("/admin/customers/?limit=50&offset=0")) {
      return {
        ok: true,
        json: async () => ({ data: [{ id: "cus_1" }], meta: { limit: 50, offset: 0, count: 1 } }),
      };
    }

    if (url.endsWith("/warehouse/inventory/?limit=50&offset=0")) {
      return {
        ok: true,
        json: async () => ({ data: [{ id: "inv_1" }], meta: { limit: 50, offset: 0, count: 1 } }),
      };
    }

    if (url.endsWith("/warehouse/stock-locations/?limit=50&offset=0")) {
      return {
        ok: true,
        json: async () => ({ data: [{ id: "sl_1" }], meta: { limit: 50, offset: 0, count: 1 } }),
      };
    }

    if (url.endsWith("/analytics/dashboard/?days=30")) {
      return {
        ok: true,
        json: async () => ({ data: { range_days: 30, visitors: 10 } }),
      };
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  const {
    loadOwnerProducts,
    loadOwnerOrders,
    loadOwnerCustomers,
    loadOwnerInventory,
    loadOwnerStockLocations,
    loadOwnerAnalytics,
  } = await import("./ownerApi.js");

  const products = await loadOwnerProducts("owner-secret", { mouherApiUrl: "http://localhost:8001/api/commerce" });
  const orders = await loadOwnerOrders("owner-secret", { mouherApiUrl: "http://localhost:8001/api/commerce" });
  const customers = await loadOwnerCustomers("owner-secret", { mouherApiUrl: "http://localhost:8001/api/commerce" });
  const inventory = await loadOwnerInventory("owner-secret", { mouherApiUrl: "http://localhost:8001/api/commerce" });
  const stockLocations = await loadOwnerStockLocations("owner-secret", { mouherApiUrl: "http://localhost:8001/api/commerce" });
  const analytics = await loadOwnerAnalytics("owner-secret", { mouherApiUrl: "http://localhost:8001/api/commerce" });

  assert.equal(products.meta.count, 1);
  assert.equal(orders.data[0].id, "ord_1");
  assert.equal(customers.data[0].id, "cus_1");
  assert.equal(inventory.data[0].id, "inv_1");
  assert.equal(stockLocations.data[0].id, "sl_1");
  assert.equal(analytics.data.range_days, 30);
  assert.equal(calls.some((call) => call.url.includes("/admin/products/")), true);
  assert.equal(calls.some((call) => call.url.includes("/analytics/dashboard/")), true);
});
