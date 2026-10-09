export const storefrontBase = import.meta.env?.BASE_URL || "/mouher-lab/";

export function routeSegment(value) {
  const segment = String(value || "").trim();
  if (!segment || segment === "." || segment === ".." || /[/\\\u0000-\u001f]/.test(segment)) {
    throw new Error(`Invalid public route segment: ${segment}`);
  }
  return encodeURIComponent(segment);
}

export function productPath(product, base = storefrontBase) {
  return `${base}products/${routeSegment(product.handle || product.id)}/`;
}

export function categoryPath(slug, base = storefrontBase) {
  return `${base}categories/${routeSegment(slug)}/`;
}

export function routeFromPath(pathname, base = storefrontBase) {
  if (!pathname.startsWith(base)) return null;
  const path = pathname.slice(base.length).replace(/\/$/, "");
  if (path === "products") return { type: "shop" };
  const match = /^(products|categories)\/([^/]+)$/.exec(path);
  if (!match) return null;
  try {
    const value = decodeURIComponent(match[2]);
    routeSegment(value);
    return match[1] === "products"
      ? { type: "product", handle: value }
      : { type: "category", slug: value };
  } catch {
    return null;
  }
}

export function readPrerenderData() {
  if (typeof document === "undefined") return null;
  const element = document.getElementById("mouher-prerender-data");
  if (!element) return null;
  try { return JSON.parse(element.textContent); } catch { return null; }
}

export function navigateStorefront(href) {
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function serializeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function productSchema(product, canonical) {
  const schema = {
    "@context": "https://schema.org", "@type": "Product",
    name: product.name || product.nameFa,
    description: product.description || undefined,
    image: product.imageUrls?.length ? product.imageUrls : undefined,
    url: canonical,
  };
  // Old public snapshots have estimated stock; do not advertise those as live offers.
  if (product.source === "medusa" && typeof product.priceAmount === "number" &&
      Number.isFinite(product.priceAmount) && product.priceAmount >= 0 &&
      /^[a-z]{3}$/i.test(product.currencyCode || "") && typeof product.inStock === "boolean") {
    schema.offers = {
      "@type": "Offer", url: canonical, price: product.priceAmount,
      priceCurrency: product.currencyCode.toUpperCase(),
      availability: `https://schema.org/${product.inStock ? "InStock" : "OutOfStock"}`,
    };
  }
  return schema;
}

export function renderDocument(shell, { title, description, canonical, base, body, bootstrap, schema, heroImage }) {
  // React also emits an image preload during static rendering; promote it to
  // the document head rather than leaving a duplicate in the body.
  if (heroImage) {
    body = body.replace(/<link\b[^>]*>/g, (tag) =>
      tag.includes('rel="preload"') && tag.includes('as="image"') &&
      tag.includes(`href="${escapeHtml(heroImage)}"`) ? "" : tag);
  }
  const cleanShell = shell
    .replace(/<title>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "");
  const head = `<base href="${escapeHtml(base)}" />
${heroImage ? `<link rel="preload" as="image" href="${escapeHtml(heroImage)}" fetchpriority="high" />` : ""}
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonical)}" />
<meta property="og:type" content="${schema?.["@type"] === "Product" ? "product" : "website"}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
${schema ? `<script type="application/ld+json">${serializeJson(schema)}</script>` : ""}`;
  return cleanShell.replace("<head>", `<head>${head}`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)
    .replace("</body>", `${bootstrap ? `<script id="mouher-prerender-data" type="application/json">${serializeJson(bootstrap)}</script>` : ""}</body>`);
}
