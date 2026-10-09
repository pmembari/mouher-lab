# Product URLs and prerendering

The build writes a real `index.html` for every product and category. For example:

`https://pmembari.github.io/mouher-lab/products/slap-shirt-brown/`

GitHub Pages serves that file directly, including on refresh. A crawler can read the name, description, image, displayed price and stock information without executing JavaScript. React replaces the static view with the interactive storefront when its bundle loads. This is static prerendering, not server-side rendering on every request.

## Build and verify

```bash
npm install --no-audit --no-fund
npm run test:prerender
VITE_ALLOW_STATIC_CATALOG_FALLBACK=true npm run build
npm run preview -- --host 127.0.0.1
curl http://127.0.0.1:4173/mouher-lab/products/slap-shirt-brown/
```

The existing Pages workflow already enables the public snapshot fallback. Without Medusa, this deliberately publishes the existing public catalog, not private source data. Snapshot pages carry a notice, and their estimated stock values are excluded from Offer structured data.

When both `VITE_MEDUSA_BACKEND_URL` and `VITE_MEDUSA_PUBLISHABLE_KEY` are set, the build uses the public Medusa Store SDK and fetches every catalog page. Region and country settings match the storefront. No Admin API credentials are needed. An unavailable configured Medusa service fails the build rather than silently replacing live products with an older snapshot. Set `VITE_SITE_URL` when the public origin changes; its path must match the Vite base.

Each product has its own title, description, canonical URL, Open Graph metadata, Product JSON-LD and a small public bootstrap payload. Offer data is emitted only for Medusa products with explicit numeric price, currency and availability. Prices remain in Medusa units; they are not divided by 100. Pages and links use the same URL helper. Duplicate or unsafe handles fail the build.

`dist/sitemap.xml` lists the generated homepage, product index, products and categories. The homepage includes ordinary links for discovery without JavaScript. A robots file for GitHub Pages must be managed in the origin repository (`pmembari.github.io`); a file under this project path would not control the origin.

## What to learn and test

1. Compare View Source with DevTools Elements. Source now contains product details; Elements shows the React version with working cart and gallery controls.
2. Disable JavaScript, visit a product directly, and follow its catalog links. Re-enable it and test product clicks, Back, Forward and refresh. Existing hash product links are converted to their canonical path by the client. Other screens retain their existing hash routes.
3. Click a product that is outside the homepage's first catalog batch. Its detail is fetched by handle, independent of that batch. Until current Medusa data arrives, the build snapshot is readable but cannot authorize a live cart addition.
4. Check a Persian product name and switch language. The document language/direction follows the toggle. This does not create separately indexed language translations; localized URLs are a later task.

Rebuild and redeploy when products, handles, prices or inventory change. New products need a build before their URLs can be refreshed on GitHub Pages. The browser refreshes product data from Medusa, but crawlers still see the last successful build. A scheduled catalog rebuild can be added separately.

This change adds discoverable pages; it does not establish backend concurrency capacity or complete the payment integration.
