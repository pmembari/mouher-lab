import assert from "node:assert/strict";
import test from "node:test";
import { productPath, routeFromPath, serializeJson, productSchema, renderDocument } from "./seo.js";
import { getRouteFromHash } from "../utils/routing.js";

test("real product paths round-trip Unicode handles under the Pages base", () => {
  const path = productPath({ handle: "پیراهن نخی" }, "/mouher-lab/");
  assert.equal(routeFromPath(path, "/mouher-lab/").handle, "پیراهن نخی");
  assert.equal(routeFromPath("/other/products/shirt/", "/mouher-lab/"), null);
  assert.deepEqual(routeFromPath("/mouher-lab/products/"), { type: "shop" });
  assert.deepEqual(routeFromPath("/mouher-lab/categories/shirts/"), { type: "category", slug: "shirts" });
  assert.throws(() => productPath({ handle: ".." }));
  assert.throws(() => productPath({ handle: "a/b" }));
});

test("JSON script payloads cannot close their script element", () => {
  const value = { name: "</script><script>alert(1)</script>" };
  const json = serializeJson(value);
  assert.ok(!json.includes("<"));
  assert.deepEqual(JSON.parse(json), value);
});

test("client route parser supports direct paths and preserves legacy shop filters", () => {
  globalThis.window = { location: { pathname: "/mouher-lab/products/shirt/", hash: "" } };
  try {
    assert.deepEqual(getRouteFromHash(), { type: "product", handle: "shirt" });
    window.location.hash = "#/shop?category=shirts&page=2";
    assert.equal(getRouteFromHash().type, "shop");
    assert.equal(getRouteFromHash().category, "shirts");
    assert.equal(getRouteFromHash().page, 2);
    window.location.hash = "#/products/old-shirt";
    assert.deepEqual(getRouteFromHash(), { type: "product", handle: "old-shirt" });
    window.location = { pathname: "/mouher-lab/categories/shirts/", hash: "" };
    assert.deepEqual(getRouteFromHash(), { type: "category", slug: "shirts" });
  } finally { delete globalThis.window; }
});

test("offers require live, explicit numeric pricing and known stock", () => {
  const product = { name: "Shirt", priceAmount: 49.99, currencyCode: "eur", inStock: false, source: "medusa" };
  const schema = productSchema(product, "https://shop.test/products/shirt/");
  assert.equal(schema.offers.price, 49.99);
  assert.equal(schema.offers.priceCurrency, "EUR");
  assert.equal(schema.offers.availability, "https://schema.org/OutOfStock");
  assert.equal(productSchema({ ...product, source: "snapshot" }, "https://shop.test/").offers, undefined);
  assert.equal(productSchema({ ...product, priceAmount: null }, "https://shop.test/").offers, undefined);
  assert.equal(productSchema({ ...product, currencyCode: "" }, "https://shop.test/").offers, undefined);
});

test("document replaces generic metadata and embeds readable HTML plus safe bootstrap", () => {
  const shell = '<html lang="en"><head><title>Old</title><meta name="description" content="Old"></head><body><div id="root"></div><script type="module" src="/assets/app.js"></script></body></html>';
  const html = renderDocument(shell, {
    title: 'Shirt & "Mouher"', description: "Cotton shirt", canonical: "https://shop.test/products/shirt/",
    base: "/mouher-lab/", body: "<main><h1>Shirt</h1></main>", bootstrap: { product: { name: "</script>" } },
    schema: { "@type": "Product", name: "Shirt" },
  });
  assert.ok(html.includes("<main><h1>Shirt</h1></main>"));
  assert.ok(html.includes('<base href="/mouher-lab/"'));
  assert.ok(html.includes('rel="canonical"'));
  assert.ok(!html.includes("<title>Old"));
  assert.equal((html.match(/name="description"/g) || []).length, 1);
  assert.ok(html.includes('src="/assets/app.js"'));
});
