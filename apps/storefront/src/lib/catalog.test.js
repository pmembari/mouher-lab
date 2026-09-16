import assert from "node:assert/strict";
import test from "node:test";

import {
  formatPrice,
  normalizeMedusaProduct,
  normalizeMedusaProductsResponse,
} from "./catalog.js";

test("normalizes Medusa products into storefront cards", () => {
  const product = normalizeMedusaProduct(
    {
      id: "prod_1",
      title: "پیراهن نخی",
      handle: "cotton-shirt",
      thumbnail: "https://cdn.example.test/shirt.webp",
      description: "Light shirt",
      categories: [{ name: "پیراهن" }],
      collection: { title: "New edit" },
      variants: [
        {
          id: "variant_1",
          inventory_quantity: 3,
          calculated_price: {
            calculated_amount: 98,
            original_amount: 128,
            currency_code: "eur",
          },
          options: [
            { option: { title: "Color" }, value: "Black" },
            { option: { title: "Size" }, value: "Free Size" },
          ],
        },
      ],
    },
    "eur"
  );

  assert.equal(product.id, "prod_1");
  assert.equal(product.nameFa, "پیراهن نخی");
  assert.equal(product.category, "Shirts");
  assert.equal(product.categorySlug, "shirts");
  assert.equal(product.variantId, "variant_1");
  assert.equal(product.price, "€98");
  assert.equal(product.compareAtPrice, "€128");
  assert.equal(product.installment, "4 payments of €24.50");
  assert.equal(product.inStock, true);
  assert.equal(product.stockCount, 3);
  assert.deepEqual(product.colors, [
    { label: "Black", labelFa: "Black", hex: "#111111" },
  ]);
  assert.deepEqual(product.sizes, ["Free Size"]);
});

test("builds category counts from product response", () => {
  const catalog = normalizeMedusaProductsResponse(
    {
      products: [
        {
          id: "prod_1",
          title: "Shirt",
          categories: [{ name: "پیراهن" }],
          variants: [{ id: "variant_1", prices: [{ amount: 20, currency_code: "eur" }] }],
        },
        {
          id: "prod_2",
          title: "Coat",
          categories: [{ name: "کت" }],
          variants: [{ id: "variant_2", prices: [{ amount: 80, currency_code: "eur" }] }],
        },
      ],
    },
    "eur"
  );

  assert.equal(catalog.products.length, 2);
  assert.equal(catalog.collections.length, 0);
  assert.deepEqual(
    catalog.categories.map((category) => [category.slug, category.count]),
    [
      ["shirts", 1],
      ["coats", 1],
    ]
  );
});

test("formats Medusa v2 major-unit prices", () => {
  assert.equal(formatPrice(20.5, "eur"), "€20.50");
});
