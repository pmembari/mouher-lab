# Mouher Data to Medusa Plan

This note summarizes the local `Mouher_Data` analysis without committing the raw CSV database or product images.

## Local Data Shape

- `products.csv`: 190 products, 178 marked visible.
- `variants.csv`: 391 variants across 189 products; 177 visible products currently have variants.
- `product_images.csv`: 820 image rows across 190 products.
- `data/images`: 818 local image files in 190 product folders.
- `categories.csv`: 4 categories: `پیراهن`, `شلوار`, `کت`, `ست`.
- Visible storefront collections include `زنانه`, `مردانه`, and `اکسسوری`.

## Medusa Mapping

- Product: `name` to Medusa `title`, `slug` to `handle`, `description` to `description`.
- Product metadata: keep legacy `id`, `upc`, original visibility flags, and old attributes in `metadata`.
- Categories: map legacy category rows to Medusa product categories.
- Collections: map visible legacy collections to Medusa collections.
- Variants: convert legacy size/color values into Medusa product options and variants.
- Prices: Medusa v2 price amounts are major units; confirm whether the source values are toman or rial before importing.
- Inventory: map variant `stock`, `is_visible`, `allow_backorder`, and `manage_inventory` deliberately. Do not treat invisible variants as sellable.
- Images: ignore deprecated CSV image URLs. Match product images from physical folders named `data/images/<product_id>/`, sorted by the leading number in filenames like `1_2025_06_15.jpg`.
- Videos: current files are named `IMG_2574.MOV`, `IMG_2575.MOV`, and `IMG_2576.MOV`; they have no product ID in the filename, so keep them as unmatched/editorial media until a product mapping is provided.
- Upload matched physical images to Medusa file storage or private object storage, then attach returned URLs to products. Do not commit the image folders to GitHub.

## Local Cleaning Command

Generate a private cleaned catalog and organized symlink tree:

```bash
python3 scripts/prepare_mouher_catalog.py --link-media
```

This writes ignored files under `data/Mouher_Data/clean/`:

- `catalog.clean.json`
- `categories.clean.json`
- `collections.clean.json`
- `media.clean.json`
- `summary.json`
- `media/products/<legacy_id>-<handle>/01.jpg` symlinks when `--link-media` is used.

The default catalog includes visible products only. Add `--include-hidden` to include draft/hidden products in the private output.

To inspect the current public Mouher storefront as import/domain source data:

```bash
python3 scripts/inspect_mouher_live_site.py
```

This writes ignored files under `data/Mouher_Data/current-site/`. It strips raw remote image URLs by default and only keeps filename/product-ID hints, because the live asset URLs should not be treated as durable media storage.

Current public site facts checked on September 12, 2026:

- `/products` exposes 181 products across 10 pages.
- `/collections` exposes `اکسسوری`, `زنانه`, and `مردانه`.
- `/categories` exposes `تیشرت`, `کت`, `شلوار`, `پیراهن`, and `ست`.
- Current live product IDs include IDs outside the local historical export range, so exact ID matching to `data/Mouher_Data/data/images/<product_id>/` is not guaranteed.

## Tests Needed Before Import

- CSV parser test for multiline Persian descriptions.
- Product import dry-run: row counts, required fields, unique handles, and visible/invisible filtering.
- Variant import test: every visible purchasable product has at least one visible variant with a valid price.
- Category/collection linking test: every visible product has expected category links.
- Image matching test: every visible product has physical media matched by product ID folder, without reading deprecated URL fields.
- Image upload test: every visible product has at least one reachable uploaded image URL after the private media upload step.
- Store API smoke test: `/store/products` returns products with `variants.calculated_price`, categories, thumbnails, and publishable API key scoping.
- Cart smoke test: create cart for the target region and add one visible variant.

## Privacy Rules

- Keep `data/Mouher_Data`, CSVs, local image folders, generated local catalog JSON, and sample image folders out of Git.
- Use tiny non-sensitive fixtures in tests.
- Use environment variables for Medusa backend URL, publishable key, region, country, and currency.
