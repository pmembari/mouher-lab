import assert from "node:assert/strict";
import test from "node:test";

import { normalizeOwnerList, ownerCatalogFromProducts } from "./ownerApi.js";

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
