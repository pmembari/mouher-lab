import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const directory = await mkdtemp(path.join(process.cwd(), ".catalog-test-"));
let loadCatalogPage;
try {
  await build({ logLevel: "silent", build: { ssr: "src/lib/catalog.js", outDir: directory,
    rollupOptions: { output: { entryFileNames: "catalog.mjs" } } } });
  ({ loadCatalogPage } = await import(pathToFileURL(path.join(directory, "catalog.mjs")).href));
} catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
after(() => rm(directory, { recursive: true, force: true }));

test("SDK forwards every filter and preserves server order, filtered totals and full facets", async () => {
  const facets = { availableCategories: [{ slug: "coats", name: "Coats", count: 61 }],
    availableCollections: [], availableSizes: ["M", "XL"], availableColors: [],
    priceBounds: { min: 10, max: 100 }, totalCount: 101, bestSellingAvailable: false };
  const server = createServer((request, response) => {
    assert.equal(request.headers["x-publishable-api-key"], "pk_test");
    const url = new URL(request.url, "http://localhost");
    assert.equal(url.pathname, "/store/catalog");
    for (const [key, value] of Object.entries({ q: "coat", category: "coats", collection: "unisex",
      minPrice: "10", maxPrice: "100", size: "M", color: "blue", inStock: "true", sale: "true",
      sort: "price-asc", limit: "30", offset: "30", region_id: "reg_test", country_code: "ir" })) {
      assert.equal(url.searchParams.get(key), value, key);
    }
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ contract_version: 1, count: 61, offset: 30, limit: 30, facets,
      products: ["z", "a"].map(id => ({ id, title: id, handle: id, variants: [] })) }));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const result = await loadCatalogPage({ page: 2, query: "coat", category: "coats", collection: "unisex",
      minPrice: 10, maxPrice: 100, size: "M", color: "blue", inStock: true, sale: true, sort: "price-asc" },
      { backendUrl: `http://127.0.0.1:${server.address().port}`, publishableKey: "pk_test", regionId: "reg_test", countryCode: "ir" });
    assert.deepEqual(result.products.map(product => product.id), ["z", "a"]);
    assert.equal(result.pagination.total, 61);
    assert.equal(result.pagination.totalPages, 3);
    assert.equal(result.pagination.page, 2);
    assert.deepEqual(result.facets, facets);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});

test("unavailable live catalog is an error rather than a successful empty result", async () => {
  await assert.rejects(loadCatalogPage({}, { allowStaticCatalogFallback: false }), /Unable to load/);
});

test("snapshot filters and globally sorts before slicing pages; facets cover the full catalog", async () => {
  const config = { allowStaticCatalogFallback: true };
  const first = await loadCatalogPage({ pageSize: 10, sort: "price-asc" }, config);
  const second = await loadCatalogPage({ page: 2, pageSize: 10, sort: "price-asc" }, config);
  assert.ok(first.pagination.total > 30);
  assert.equal(first.facets.totalCount, first.pagination.total);
  assert.equal(second.pagination.total, first.pagination.total);
  const prices = [...first.products, ...second.products].map(product => product.priceAmount);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
  const category = first.facets.availableCategories.find(item => item.count > 0);
  const filtered = await loadCatalogPage({ category: category.slug, pageSize: 10 }, config);
  assert.equal(filtered.pagination.total, category.count);
  assert.ok(filtered.products.every(product => product.categorySlug === category.slug));
  assert.deepEqual(filtered.facets.availableCategories, first.facets.availableCategories);
});
