# Mouher Medusa Catalog Import Bridge

This bridge imports the canonical Mouher catalog into Medusa without reading raw legacy CSVs directly.

## Data flow

```text
legacy data
  -> tools/scripts/prepare_mouher_catalog.py
  -> data/Mouher_Data/clean/catalog.clean.json
  -> services/backend/src/scripts/import-mouher-catalog.ts
  -> Medusa product/category/collection workflows
```

The importer is dry-run by default.

## Dry run

From `services/backend/`:

```bash
npm run catalog:dry-run
```

or:

```bash
npx medusa exec ./src/scripts/import-mouher-catalog.ts
```

The dry run reads the generated canonical catalog, validates the import plan, and performs no Medusa writes.

Use a different catalog path with:

```bash
MOUHER_CATALOG_PATH=/absolute/path/catalog.clean.json npm run catalog:dry-run
```

## Apply

Mouher product prices are canonicalized as Iranian rial (IRR). The importer writes each cleaned `source_price` unchanged as an `irr` Medusa price.

```bash
npx medusa exec ./src/scripts/import-mouher-catalog.ts -- --apply
```

Do not apply a toman/rial multiplier in the catalog importer. Toman wording used in storefront copy, such as free-shipping messaging, is presentation logic and does not change the stored commerce currency.

Optional:

```text
MOUHER_SALES_CHANNEL_ID
MOUHER_SHIPPING_PROFILE_ID
MOUHER_MEDIA_BASE_URL
```

`MOUHER_MEDIA_BASE_URL` should only be set after the corresponding target media paths are publicly available from object storage/CDN. Without it, the bridge intentionally imports no image URLs.

## Idempotency

`product_code` is written to Medusa as `external_id`.

On repeated runs, products whose `external_id` already matches a canonical Mouher `product_code` are skipped instead of duplicated.

Categories and collections are matched by canonical handle and created only when missing.

This first bridge is intentionally create-only for existing products. Updating already-imported products will be a separate synchronization phase.

## Handles

If the canonical catalog handle is still pending human review, the bridge uses a deterministic temporary Medusa handle:

```text
MHR-TRS-000002 -> mhr-trs-000002
```

The canonical catalog remains unchanged and the Medusa product metadata records that the canonical handle is pending review.

## Collections

Medusa products have one product collection relationship. If the canonical source contains exactly one reviewed collection, it is linked.

If a product has multiple reviewed collection slugs, the bridge does not choose one arbitrarily. The slugs stay in metadata and the product is emitted with a review issue.

Categories may remain many-to-many.

## Variants, prices, and stock

Only visible variants with canonical SKUs are imported.

Prices are written as IRR and the cleaned `source_price` value is preserved unchanged.

Inventory levels are not written in this phase. Source stock is preserved in variant metadata. A later inventory phase should create/update Medusa inventory levels against an explicit stock location.

## Media

The bridge never uploads files.

When `MOUHER_MEDIA_BASE_URL` is absent, images are omitted.

When it is set, canonical manifest target paths are joined to that base URL. This should only be enabled after those objects actually exist on S3-compatible storage/CDN.

## Focused test

```bash
npm run test:catalog-import
```

The test covers stable product identity, temporary handle behavior, categories/collections, media URL gating, duplicate SKU validation, and default catalog-path resolution.
