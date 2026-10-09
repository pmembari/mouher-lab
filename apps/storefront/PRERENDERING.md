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

The Pages workflow rebuilds and redeploys every six hours, at 00:17, 06:17, 12:17 and 18:17 UTC. GitHub may delay scheduled runs. Pushes to main and manual workflow runs also rebuild immediately. A `repository_dispatch` event with type `catalog-updated` is available for a future backend publication hook; that hook is not wired yet. Keep any GitHub dispatch credential on the backend, never in the storefront.

New products need a successful build before their URLs can be refreshed on GitHub Pages. The browser refreshes product data from Medusa, but crawlers see the last successful build. Scheduled builds fetch fresh data when Medusa is configured; without Medusa, they republish the existing committed public snapshot, which must itself be updated to change the catalog. An unsuccessful refresh leaves the previously deployed website available.

This change adds discoverable pages; it does not establish backend concurrency capacity or complete the payment integration.

## Hero loading

The homepage now renders its existing hero, header and layout into the initial HTML. The build chooses `merchandising.heroImage`, then `featuredImage`, then the first available product image, and places one high-priority image preload in the head. The hero uses eager loading, while category and story images remain lazy. Its existing CSS reserves the hero's space before the image arrives.

The same hero URL is embedded in the homepage bootstrap data and kept stable while Medusa refreshes the catalog. This removes the JavaScript → catalog request → image request dependency and prevents a second hero download after the catalog arrives. A rebuild can update the curated hero.

The current hero host returned byte-identical original and `?width=360` files (66,300 bytes, 1086 × 1448) during verification. The hero therefore uses the original URL for both preload and display; other image components retain their existing responsive behavior. This does not establish that the host resizes other assets.

To measure the result, disable cache in DevTools and use the same slow-network profile for three runs before and after. Check the hero request's initiator, request start, transfer size and LCP. Its request should now start from the HTML preload, independently of the catalog request. The implementation checks prove discovery order and loading attributes; they do not measure a browser LCP improvement.
