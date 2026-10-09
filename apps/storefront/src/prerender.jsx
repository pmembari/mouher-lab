import { renderToStaticMarkup } from "react-dom/server";
import Medusa from "@medusajs/js-sdk";
import ProductPage from "./pages/ProductPage";
import HomePage from "./pages/HomePage";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import LanguageSwitch from "./components/layout/LanguageSwitch";
import { content } from "./content/siteContent";
import { currentMouherCatalog } from "./data/currentMouherCatalog";
import { normalizeMedusaProductsResponse } from "./lib/catalog/normalize";
import { DEFAULT_PRODUCT_FIELDS } from "./lib/catalog/constants";
import { categoryPath, productPath, renderDocument, productSchema, escapeHtml } from "./lib/seo.js";
import { withCatalogTimeout } from "./lib/publicCatalog.js";

export async function loadBuildCatalog(env) {
  const backend = env.VITE_MEDUSA_BACKEND_URL;
  const key = env.VITE_MEDUSA_PUBLISHABLE_KEY;
  if (backend || key) {
    if (!backend || !key) throw new Error("Prerender requires both Medusa backend URL and publishable key.");
    const sdk = new Medusa({ baseUrl: backend, publishableKey: key });
    const products = [];
    for (let offset = 0; ; offset += 100) {
      const query = { limit: 100, offset, fields: DEFAULT_PRODUCT_FIELDS };
      if (env.VITE_MEDUSA_REGION_ID) query.region_id = env.VITE_MEDUSA_REGION_ID;
      if (env.VITE_MEDUSA_COUNTRY_CODE) query.country_code = env.VITE_MEDUSA_COUNTRY_CODE;
      const page = await withCatalogTimeout(sdk.store.product.list(query));
      if (!Array.isArray(page.products) || !Number.isInteger(page.count)) {
        throw new Error("Invalid Medusa catalog response during prerender.");
      }
      products.push(...page.products);
      if (products.length >= page.count) break;
      if (!page.products.length) throw new Error("Medusa pagination ended before the declared catalog count.");
    }
    return { ...normalizeMedusaProductsResponse({ products }, env.VITE_MEDUSA_CURRENCY_CODE), source: "medusa" };
  }
  if (!/^(true|1)$/i.test(env.VITE_ALLOW_STATIC_CATALOG_FALLBACK || "")) {
    throw new Error("No Medusa configured. Explicitly set VITE_ALLOW_STATIC_CATALOG_FALLBACK=true to publish the existing public snapshot.");
  }
  return currentMouherCatalog;
}

// Only public storefront fields are embedded; never copy arbitrary API metadata.
function publicProduct(product) {
  const fields = ["id", "handle", "name", "nameFa", "description", "descriptionFa", "price", "priceAmount",
    "currencyCode", "compareAtPrice", "compareAtAmount", "imageUrls", "category", "categoryFa", "categorySlug",
    "collection", "collectionFa", "source", "variantId", "inStock", "stockCount", "sizes", "colors", "badge"];
  return Object.fromEntries(fields.filter((field) => product[field] !== undefined).map((field) => [field, product[field]]));
}

function Shell({ children, base, homepage = false }) {
  const t = content.pinglish;
  return <div className="site" dir="ltr">
    {homepage ? <>
      <Header t={t} isFarsi={false} menuOpen={false} cartCount={0} />
      <LanguageSwitch language="pinglish" isFarsi={false} />
    </> : <header className="product-page-topbar"><a href={base}>Mouher</a><a href={`${base}products/`}>All products</a></header>}
    <main>{children}</main>
    {homepage && <Footer t={t} isFarsi={false} />}
  </div>;
}

function CatalogLinks({ products, categories = [], title, base }) {
  return <section className="product-page">
    <h1>{title}</h1>
    {categories.length > 0 && <nav aria-label="Categories">{categories.map((category) =>
      <p key={category.slug}><a href={categoryPath(category.slug, base)}>{category.name}</a></p>)}</nav>}
    <div className="products-grid">{products.map((product) => <article className="product-card" key={product.id}>
      <a href={productPath(product, base)}>
        {product.imageUrls?.[0] && <img src={product.imageUrls[0]} alt={product.name} loading="lazy" className="product-image" />}
        <h2>{product.name || product.nameFa}</h2>
      </a>
      <p>{product.price}</p>
    </article>)}</div>
  </section>;
}

export function generatePages(shell, catalog, { base, siteUrl }) {
  const products = catalog.products.map(publicProduct);
  const categories = catalog.categories || [];
  const pages = new Map();
  const urls = [];
  const t = content.pinglish;
  function add(path, title, description, element, bootstrap, schema, heroImage) {
    if (pages.has(path)) throw new Error(`Duplicate public URL: ${path}`);
    const canonical = new URL(path, siteUrl).href;
    const body = renderToStaticMarkup(<Shell base={base} homepage={path === base}>{element}</Shell>);
    pages.set(path, renderDocument(shell, { title, description, canonical, base, body, bootstrap, schema, heroImage }));
    urls.push(canonical);
  }
  const heroImage = catalog.merchandising?.heroImage || catalog.featuredImage ||
    products.find((product) => product.imageUrls?.length)?.imageUrls[0] || "";
  const homepageCatalog = { products: products.slice(0, 30), categories: categories.slice(0, 6),
    source: catalog.source, featuredImage: heroImage };
  add(base, "Mouher — Contemporary Clothing", "Discover Mouher clothing and browse the product catalog.",
    <>
      <HomePage language="pinglish" t={t} heroImage={heroImage}
        homepageProducts={homepageCatalog.products} homepageCategories={homepageCatalog.categories} />
      <noscript><CatalogLinks title="Browse products" products={products.slice(0, 4)} categories={categories} base={base} /></noscript>
    </>, { heroImage, catalog: homepageCatalog }, undefined, heroImage);
  add(`${base}products/`, "All products | Mouher", "Explore the Mouher product catalog.",
    <CatalogLinks title="All products" products={products} categories={categories} base={base} />);
  for (const product of products) {
    const path = productPath(product, base);
    const canonical = new URL(path, siteUrl).href;
    add(path, `${product.name || product.nameFa} | Mouher`, product.description || `${product.name || product.nameFa} from Mouher.`,
      <>
        <ProductPage product={product} catalog={{ products: [] }} catalogState="ready" language="pinglish"
          labels={t.productPage} cartLabels={{ ...t.cart, outOfStock: t.dashboard.outOfStock }} staticMode />
      </>, { product }, productSchema(product, canonical));
  }
  for (const category of categories) {
    const matching = products.filter((product) => product.categorySlug === category.slug);
    add(categoryPath(category.slug, base), `${category.name} | Mouher`, `Explore Mouher ${category.name}.`,
      <CatalogLinks title={category.name} products={matching} base={base} />);
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}</urlset>\n`;
  return { pages, sitemap, productCount: products.length };
}
