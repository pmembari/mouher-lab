# Catalog browsing

Shop, search, category and collection routes use `loadCatalogPage` and the
versioned `GET /store/catalog` Medusa route. Search, category, collection,
price, size, color, stock and sale filters run across the complete public
catalog before sorting, counting and pagination. The storefront does not
filter or sort the returned page again. Filter and sort changes reset the
page; next/previous controls retain filters in the URL.

## Public API contract

Send the normal `x-publishable-api-key` header. The native Medusa Store API
resolves published products, sales-channel access, inventory and regional
prices. No Admin API credentials are used.

Example query:

```text
/store/catalog?category=shirts&size=m&inStock=true&sort=price-asc&limit=30&offset=30&region_id=reg_example&country_code=ir
```

Supported parameters: `q`, `category`, `collection`, `minPrice`, `maxPrice`,
`size`, `color`, `inStock`, `sale`, `sort`, `limit`, `offset`, `region_id`,
`country_code`. Booleans are `true` or `false`; `all` disables an entity or
option filter. Prices use Medusa's public calculated amounts. Sorting supports
`featured`, `newest`, `price-asc`, `price-desc`. Best-selling is hidden without
verified sales data and unsupported by this public endpoint.

The response contains `contract_version: 1`, raw public `products`, filtered
`count`, effective `offset`, `limit`, and full-catalog `facets` (categories,
collections, sizes, colors, price bounds and total count). Empty matches have
count/offset zero. Out-of-range pages clamp to the last available page.
Invalid parameters return a Medusa validation error; source failures return
503 `catalog_unavailable`. Responses have `Cache-Control: no-store`.

Filters follow product-card semantics: the displayed cheapest variant's price
and availability, primary category, collection title slug, any listed size or
color, and calculated discount or first `sale` tag. Selecting size/color does
not reserve inventory or change the displayed variant; checkout validates the
chosen variant through Medusa.

## Deployment and bounds

Deploy `services/backend` as well as rebuilding the GitHub Pages storefront
to use live catalog browsing. Pages deployment alone cannot deploy a Medusa
API. Configure `MOUHER_STORE_API_URL` on the backend if its own native Store
API is not reachable at `http://127.0.0.1:${PORT || 9000}`. This origin is
trusted configuration, never derived from the caller's Host header.

The backend fetches the full public projection through the Medusa JS SDK in
100-product batches, with stable ID order. It caches each publishable-key,
region and country context for 15 seconds, deduplicates simultaneous refreshes,
and retains at most 16 contexts. Price/inventory browsing can therefore lag by
15 seconds. These are public region prices; customer-specific pricing is not
forwarded. Checkout remains authoritative.

The projection is deliberately bounded to 10,000 products. Larger catalogs
fail rather than silently truncate and require a dedicated search index. A
refresh with inconsistent counts, duplicate IDs or incomplete batches fails
rather than exposing a partial catalog. This cache is per backend process.

When explicitly enabled, the static fallback uses the entire checked-in
catalog snapshot and applies the same filter/sort/page sequence. The UI labels
snapshot results. Snapshot edits still require rebuilding static pages.

## Verification

```sh
cd services/backend
npm run test:catalog-search
npm run build
cd ../../apps/storefront
npm run test:catalog-pages
npm run test:prerender
VITE_ALLOW_STATIC_CATALOG_FALLBACK=true npm run build
```

After deployment, open Shop, apply a category that includes products beyond
the first 30, and verify the result count. Sort prices ascending and compare
the last price on page 1 with the first on page 2. Add another filter while on
page 2: the URL and results should reset to page 1. Reload or use back/forward
to confirm the same filters remain selected. In Network, live browsing uses
`/store/catalog` with the filters, sort and offset; its `count` must match the
UI total. A snapshot notice means the live endpoint is unavailable or not
configured. Automated tests use local HTTP fixtures, not a deployed Medusa
database or a browser interaction runner.
