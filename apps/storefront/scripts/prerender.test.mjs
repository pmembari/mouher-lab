import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "vite";

const directory = await mkdtemp(path.join(process.cwd(), ".prerender-test-"));
let renderer;
try {
  await build({ logLevel: "silent", build: { ssr: "src/prerender.jsx", outDir: directory,
    rollupOptions: { output: { entryFileNames: "renderer.mjs" } } } });
  renderer = await import(pathToFileURL(path.join(directory, "renderer.mjs")).href);
} finally {
  await rm(directory, { recursive: true, force: true });
}

const shell = '<html lang="en"><head><title>Old</title></head><body><div id="root"></div><script src="/mouher-lab/assets/app.js"></script></body></html>';
const product = { id: "p1", handle: "shirt", name: "Cotton shirt", nameFa: "پیراهن", description: "Light cotton",
  price: "€49.99", priceAmount: 49.99, currencyCode: "eur", source: "medusa", inStock: true,
  category: "Shirts", categorySlug: "shirts", imageUrls: ["https://cdn.test/shirt.webp"], sizes: [], colors: [], metadata: { private: "never publish" } };

test("shared product rendering emits readable pages, category links, sitemap and public bootstrap", () => {
  const result = renderer.generatePages(shell, { source: "medusa", products: [product], categories: [{ slug: "shirts", name: "Shirts" }] },
    { base: "/mouher-lab/", siteUrl: "https://pmembari.github.io/mouher-lab/" });
  const html = result.pages.get("/mouher-lab/products/shirt/");
  assert.ok(html.includes("<h1>Cotton shirt</h1>"));
  assert.ok(html.includes("Light cotton"));
  assert.ok(html.includes("€49.99"));
  assert.ok(html.includes("InStock"));
  assert.ok(!html.includes("never publish"));
  assert.ok(html.includes('loading="eager"'));
  assert.ok(result.pages.get("/mouher-lab/categories/shirts/").includes('href="/mouher-lab/products/shirt/"'));
  assert.ok(result.sitemap.includes("https://pmembari.github.io/mouher-lab/products/shirt/"));
  assert.ok(!result.sitemap.includes("#"));
  assert.throws(() => renderer.generatePages(shell, { products: [product, product] }, { base: "/", siteUrl: "https://shop.test/" }), /Duplicate/);
});

test("build uses the public Store API and paginates beyond the first page", async () => {
  const offsets = [];
  const server = createServer((request, response) => {
    assert.equal(request.headers["x-publishable-api-key"], "pk_test");
    assert.equal(request.headers.signal, undefined);
    const url = new URL(request.url, "http://localhost");
    assert.equal(url.pathname, "/store/products");
    const offset = Number(url.searchParams.get("offset"));
    offsets.push(offset);
    const products = Array.from({ length: offset === 0 ? 100 : 1 }, (_, index) => ({
      id: `p${offset + index}`, title: `Shirt ${offset + index}`, handle: `shirt-${offset + index}`, variants: [],
    }));
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ products, count: 101 }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const catalog = await renderer.loadBuildCatalog({ VITE_MEDUSA_BACKEND_URL: `http://127.0.0.1:${server.address().port}`, VITE_MEDUSA_PUBLISHABLE_KEY: "pk_test" });
    assert.deepEqual(offsets, [0, 100]);
    assert.equal(catalog.products.length, 101);
    assert.equal(catalog.products[100].handle, "shirt-100");
    assert.equal(catalog.source, "medusa");
  } finally { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
});

test("snapshot publishing is explicit and partial Medusa configuration fails", async () => {
  await assert.rejects(renderer.loadBuildCatalog({}), /Explicitly/);
  await assert.rejects(renderer.loadBuildCatalog({ VITE_MEDUSA_BACKEND_URL: "https://backend.test", VITE_ALLOW_STATIC_CATALOG_FALLBACK: "true" }), /both/);
  const catalog = await renderer.loadBuildCatalog({ VITE_ALLOW_STATIC_CATALOG_FALLBACK: "true" });
  assert.equal(catalog.source, "mouher-live-snapshot");
});

test("homepage hero is discovered in HTML before JavaScript or catalog fetching", () => {
  const catalog = { source: "medusa", products: [product], categories: [{ slug: "shirts", name: "Shirts" }],
    merchandising: { heroImage: "https://cdn.test/curated-hero.webp" } };
  const { pages } = renderer.generatePages(shell, catalog, { base: "/mouher-lab/", siteUrl: "https://pmembari.github.io/mouher-lab/" });
  const home = pages.get("/mouher-lab/");
  const hero = home.match(/<img[^>]*class="mouher-hero-image"[^>]*>/)?.[0];
  assert.ok(hero, "The existing homepage hero must be rendered into HTML");
  assert.ok(hero.includes('src="https://cdn.test/curated-hero.webp"'));
  assert.ok(hero.includes('loading="eager"'));
  assert.ok(hero.includes('fetchPriority="high"') || hero.includes('fetchpriority="high"'));
  assert.ok(home.includes('rel="preload" as="image" href="https://cdn.test/curated-hero.webp"'));
  assert.ok(home.indexOf('rel="preload"') < home.indexOf('<script src='));
  assert.ok(home.includes('"heroImage":"https://cdn.test/curated-hero.webp"'));
  assert.ok(home.match(/<img[^>]*class="mouher-reference-story-image"[^>]*loading="lazy"/));
  assert.equal((home.match(/<main(?:\s|>)/g) || []).length, 1);
  assert.ok(!hero.includes("srcSet="));
  assert.ok(!pages.get("/mouher-lab/products/shirt/").includes("curated-hero.webp"));
});
