#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

import mouher_catalog_identity as identity


CATEGORY_LABELS = {
    "پیراهن": {"name": "Shirts", "name_fa": "پیراهن", "slug": "shirts"},
    "شلوار": {"name": "Trousers", "name_fa": "شلوار", "slug": "trousers"},
    "کت": {"name": "Coats", "name_fa": "کت", "slug": "coats"},
    "ست": {"name": "Sets", "name_fa": "ست", "slug": "sets"},
}

COLLECTION_LABELS = {
    "زنانه": "Women",
    "مردانه": "Men",
    "اکسسوری": "Accessories",
    "بهار تابستان( unisex)": "Spring Summer 2024",
    "پاییز زمستان موهر": "Fall Winter 2024",
}

IMAGE_NAME_PATTERN = re.compile(
    r"^(?P<position>\d+)_(?P<year>\d{4})_(?P<month>\d{2})_(?P<day>\d{2})(?:_.+)?(?P<suffix>\.[^.]+)$"
)

VIDEO_NAME_PATTERN = re.compile(r"^IMG_(?P<sequence>\d+)\.(?P<suffix>mov|mp4)$", re.I)


def main() -> int:
    args = parse_args()
    source_root = args.source_root.resolve()
    output_dir = args.output_dir.resolve()

    catalog = build_catalog(source_root, include_hidden=args.include_hidden)
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.link_media:
        link_media_tree(catalog, source_root, output_dir / "media")

    write_json(output_dir / "catalog.clean.json", catalog["products"])
    write_json(output_dir / "categories.clean.json", catalog["categories"])
    write_json(output_dir / "collections.clean.json", catalog["collections"])
    write_json(output_dir / "media.clean.json", catalog["media"])
    write_json(output_dir / "summary.json", catalog["summary"])
    write_json(output_dir / "storefront.catalog.json", build_storefront_catalog(catalog))

    summary = catalog["summary"]
    print(
        f"Clean products: {summary['products']['included']} / {summary['products']['total']}"
        " (--include-hidden adds draft/hidden products)"
    )
    print(f"Physical product images scanned: {summary['media']['matched_images']}")
    print(f"Physical images for included products: {summary['media']['included_product_images']}")
    print(f"Products without physical images: {summary['media']['products_without_physical_images']}")
    print(f"Unmatched videos: {summary['media']['unmatched_videos']}")
    print(f"Output: {output_dir}")

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a private cleaned Mouher catalog using physical media files."
    )
    parser.add_argument(
        "--source-root",
        type=Path,
        default=Path("Mouher_Data"),
        help="Path to local Mouher_Data. Default: Mouher_Data",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/Mouher_Data/clean"),
        help="Ignored directory for generated clean JSON and media links.",
    )
    parser.add_argument(
        "--include-hidden",
        action="store_true",
        help="Include products that are not visible in the legacy export.",
    )
    parser.add_argument(
        "--link-media",
        action="store_true",
        help="Create an organized symlink tree for matched media under output-dir/media.",
    )

    return parser.parse_args()


def build_catalog(source_root: Path, include_hidden: bool = False) -> dict:
    data_dir = source_root / "data" / "mouherwear-more"
    image_root = source_root / "data" / "images"
    video_root = source_root / "data" / "videos"

    rows = {
        "products": read_csv(data_dir / "products.csv"),
        "variants": read_csv(data_dir / "variants.csv"),
        "variant_values": read_csv(data_dir / "variant_values.csv"),
        "categories": read_csv(data_dir / "categories.csv"),
        "collections": read_csv(data_dir / "collections.csv"),
        "category_product": read_csv(data_dir / "category_product.csv"),
        "collection_product": read_csv(data_dir / "collection_product.csv"),
        "product_images": read_csv(data_dir / "product_images.csv"),
    }

    category_by_id = {
        row["id"]: clean_category(row) for row in rows["categories"] if row.get("id")
    }
    collection_by_id = {
        row["id"]: clean_collection(row) for row in rows["collections"] if row.get("id")
    }
    variant_value_by_id = {
        row["id"]: clean_variant_value(row)
        for row in rows["variant_values"]
        if row.get("id")
    }

    categories_by_product = group_links(
        rows["category_product"], "product_id", "category_id", category_by_id
    )
    collections_by_product = group_links(
        rows["collection_product"], "product_id", "collection_id", collection_by_id
    )
    variants_by_product = group_rows(rows["variants"], "product_id")
    deprecated_images_by_product = group_rows(rows["product_images"], "product_id")
    physical_images_by_product, image_scan_issues = scan_physical_images(
        image_root, source_root
    )
    videos, video_scan_issues = scan_videos(video_root, source_root)

    products = []
    for row in rows["products"]:
        product = clean_product(
            row,
            categories_by_product,
            collections_by_product,
            variants_by_product,
            variant_value_by_id,
            physical_images_by_product,
            deprecated_images_by_product,
        )

        if include_hidden or product["is_visible"]:
            products.append(product)

    product_ids = {row["id"] for row in rows["products"]}
    image_product_ids = set(physical_images_by_product)
    visible_products = [product for product in products if product["is_visible"]]
    included_product_ids = {product["legacy_id"] for product in products}
    included_physical_images = sum(
        len(physical_images_by_product[product_id])
        for product_id in included_product_ids
        if product_id in physical_images_by_product
    )
    products_without_physical_images = [
        product["legacy_id"] for product in visible_products if not product["media"]["images"]
    ]
    products_without_visible_variants = [
        product["legacy_id"]
        for product in visible_products
        if not any(variant["is_visible"] for variant in product["variants"])
    ]
    validation = identity.validate_catalog(products)
    duplicate_handles = validation["counts"]["duplicate_handles"]
    handle_needs_review = count_quality_flag(products, "handle_needs_review")
    duplicate_product_codes = validation["counts"]["duplicate_product_codes"]
    duplicate_skus = validation["counts"]["duplicate_skus"]
    invalid_product_codes = count_validation_type(validation, "invalid_product_code")
    invalid_skus = count_validation_type(validation, "invalid_sku")
    invalid_handles = count_validation_type(validation, "invalid_canonical_handle")
    normalized_collections = sum(
        1 for product in products for collection in product["collections"]
        if not collection["quality_flags"]
    )
    review_collections = sum(
        1 for product in products for collection in product["collections"]
        if "collection_needs_review" in collection["quality_flags"]
    )
    invalid_media_paths = count_validation_type(validation, "invalid_target_media_path")
    duplicate_media_positions = count_validation_type(validation, "duplicate_media_position")

    media = {
        "images": [
            image
            for product_images in physical_images_by_product.values()
            for image in product_images
        ],
        "videos": videos,
        "unmatched_videos": videos,
        "scan_issues": image_scan_issues + video_scan_issues,
    }
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_root": str(source_root),
        "privacy": {
            "uses_remote_image_urls": False,
            "uses_physical_images": True,
            "raw_exports_committed": False,
            "output_should_stay_ignored": True,
        },
        "products": {
            "total": len(rows["products"]),
            "visible": count_visible(rows["products"]),
            "included": len(products),
            "included_visible": len(visible_products),
            "without_visible_variants": len(products_without_visible_variants),
            "product_codes_generated": count_present(products, "product_code"),
            "invalid_product_codes": invalid_product_codes,
            "duplicate_product_codes": duplicate_product_codes,
            "handles_accepted": count_present(products, "handle"),
            "handles_needing_review": handle_needs_review,
            "duplicate_handles": duplicate_handles,
        },
        "variants": {
            "total": len(rows["variants"]),
            "visible": count_visible(rows["variants"]),
            "included": sum(len(product["variants"]) for product in products),
            "skus_generated": sum(
                1
                for product in products
                for variant in product["variants"]
                if variant.get("sku")
            ),
            "invalid_skus": invalid_skus,
            "duplicate_skus": duplicate_skus,
            "known_colors_mapped": sum(
                1
                for product in products
                for variant in product["variants"]
                if variant.get("color_code")
            ),
            "unknown_colors_requiring_review": count_variant_flag(
                products, "unknown_color_code"
            ),
            "known_sizes_mapped": sum(
                1
                for product in products
                for variant in product["variants"]
                if variant.get("size_code")
            ),
            "unknown_sizes_requiring_review": count_variant_flag(
                products, "unknown_size_code"
            ),
            "missing_size_lookup": count_missing_variant_lookup(
                rows["variants"], "size", variant_value_by_id
            ),
            "missing_color_lookup": count_missing_variant_lookup(
                rows["variants"], "color", variant_value_by_id
            ),
        },
        "media": {
            "matched_product_dirs": len(image_product_ids & product_ids),
            "matched_images": len(media["images"]),
            "included_product_images": included_physical_images,
            "items_mapped": sum(
                1
                for product in products
                for image in product["media"]["images"]
                if image.get("target_path")
            ),
            "image_dirs_without_product": sorted(image_product_ids - product_ids),
            "products_without_physical_images": len(products_without_physical_images),
            "invalid_target_paths": invalid_media_paths,
            "duplicate_positions": duplicate_media_positions,
            "deprecated_csv_image_rows_ignored": len(rows["product_images"]),
            "videos_total": len(videos),
            "unmatched_videos": len(videos),
            "scan_issues": len(media["scan_issues"]),
        },
        "categories": summarize_links(products, "categories"),
        "collections": {
            **summarize_links(products, "collections"),
            "_normalized": normalized_collections,
            "_requiring_review": review_collections,
        },
        "validation": validation,
        "issues": {
            "products_without_physical_images": products_without_physical_images,
            "products_without_visible_variants": products_without_visible_variants,
            "handle_needs_review": [
                product["legacy_id"]
                for product in products
                if "handle_needs_review" in product["quality_flags"]
            ],
            "invalid_handles": invalid_handles,
            "image_scan_issues": image_scan_issues,
            "video_scan_issues": video_scan_issues,
        },
    }

    return {
        "products": products,
        "categories": sorted(category_by_id.values(), key=lambda item: item["position"]),
        "collections": sorted(
            collection_by_id.values(), key=lambda item: (not item["is_visible"], item["position"])
        ),
        "media": media,
        "summary": summary,
    }


def build_storefront_catalog(catalog: dict) -> dict:
    products = [to_storefront_product(product) for product in catalog["products"]]
    products = [product for product in products if product["sellable"]]
    sorted_by_update = sorted(products, key=lambda product: product["updated_at"], reverse=True)
    sale_products = [
        product for product in products if product["pricing"]["compare_at_amount"]
    ]
    low_stock_products = [
        product
        for product in products
        if product["inventory"]["stock"] is not None and product["inventory"]["stock"] <= 5
    ]

    return {
        "brand": {
            "name": "Mouher",
            "tagline": "What you wear",
            "seo_description_fa": (
                "خرید آنلاین جدیدترین پوشاک یونیسکس موهر با تمرکز بر کیفیت، "
                "استایل مدرن و تجربه خرید ساده."
            ),
        },
        "navigation": [
            {"label": "New arrivals", "label_fa": "تازه‌ها", "target": "new-arrivals"},
            {"label": "Unisex", "label_fa": "یونیسکس", "target": "unisex"},
            {"label": "Accessories", "label_fa": "اکسسوری", "target": "accessories"},
        ],
        "rails": [
            build_product_rail("new-arrivals", "New arrivals", "تازه‌ها", sorted_by_update[:24]),
            build_product_rail("sale", "On sale", "تخفیف‌دار", sale_products[:24]),
            build_product_rail("low-stock", "Last pieces", "آخرین موجودی", low_stock_products[:24]),
        ],
        "categories": [
            {
                "slug": category["slug"],
                "name": category["name"],
                "name_fa": category["name_fa"],
                "product_count": count_product_link(products, "categories", category["slug"]),
            }
            for category in catalog["categories"]
            if category["is_visible"]
        ],
        "collections": build_collection_cards(catalog["collections"], products),
        "products": products,
        "facets": build_facets(products),
        "commerce_notes": {
            "snap_pay": "Display installment messaging only after SnapPay merchant/API terms are confirmed.",
            "prices": "Legacy source prices need final currency/minor-unit confirmation before import.",
        },
    }


def to_storefront_product(product: dict) -> dict:
    visible_variants = [variant for variant in product["variants"] if variant["is_visible"]]
    variants = visible_variants or product["variants"]
    prices = [
        variant["source_price"]
        for variant in variants
        if isinstance(variant["source_price"], int) and variant["source_price"] > 0
    ]
    stock_values = [
        variant["stock"] for variant in visible_variants if isinstance(variant["stock"], int)
    ]
    stock = sum(stock_values) if stock_values else None
    amount = min(prices) if prices else None
    compare_at_amount = None

    if product["is_promotion"] and amount:
        compare_at_amount = amount

    return {
        "id": product["legacy_id"],
        "handle": product["handle"],
        "title": product["title_fa"],
        "subtitle": build_subtitle(product),
        "description": product["description_fa"],
        "updated_at": product["updated_at"],
        "sellable": product["is_visible"] and bool(visible_variants) and bool(product["media"]["images"]),
        "badges": build_badges(product, stock),
        "categories": [
            {"slug": category["slug"], "name": category["name"], "name_fa": category["name_fa"]}
            for category in product["categories"]
        ],
        "collections": unique_collection_links(product["collections"]),
        "pricing": {
            "source_amount": amount,
            "compare_at_amount": compare_at_amount,
            "currency_status": "needs_confirmation",
        },
        "inventory": {
            "stock": stock,
            "status": stock_status(stock),
        },
        "options": {
            "sizes": sorted({variant["size"]["name"] for variant in variants if variant["size"]["name"]}),
            "colors": unique_colors(variants),
        },
        "media": {
            "thumbnail": product["media"]["thumbnail"],
            "images": product["media"]["images"],
        },
        "seo": {
            "title": f"{product['title_fa']} | Mouher",
            "description": summarize_description(product["description_fa"]),
        },
        "quality_flags": product["quality_flags"],
    }


def build_product_rail(slug: str, title: str, title_fa: str, products: list[dict]) -> dict:
    return {
        "slug": slug,
        "title": title,
        "title_fa": title_fa,
        "product_ids": [product["id"] for product in products],
    }


def build_subtitle(product: dict) -> str:
    labels = []

    if product["categories"]:
        labels.append(product["categories"][0]["name_fa"])
    if product["collections"]:
        labels.append(product["collections"][0]["title_fa"])

    return " / ".join(labels)


def build_badges(product: dict, stock: int | None) -> list[str]:
    badges = []

    if product["is_promotion"]:
        badges.append("sale")
    if stock is not None and 0 < stock <= 5:
        badges.append("last-pieces")
    if product["updated_at"] >= "2025-09-01":
        badges.append("new")

    return badges


def stock_status(stock: int | None) -> str:
    if stock is None:
        return "unknown"
    if stock <= 0:
        return "out-of-stock"
    if stock <= 5:
        return "low-stock"
    return "in-stock"


def unique_colors(variants: list[dict]) -> list[dict]:
    colors = {}

    for variant in variants:
        color = variant["color"]
        if not color["name"]:
            continue

        colors[color["name"]] = {
            "name": color["name"],
            "family_fa": color["family_fa"],
            "hex": color["hex"],
        }

    return list(colors.values())


def summarize_description(description: str, limit: int = 155) -> str:
    text = re.sub(r"\s+", " ", clean_text(description))

    if len(text) <= limit:
        return text

    return text[: limit - 1].rstrip() + "…"


def count_product_link(products: list[dict], key: str, slug: str) -> int:
    return sum(1 for product in products if any(item["slug"] == slug for item in product[key]))


def build_collection_cards(collections: list[dict], products: list[dict]) -> list[dict]:
    cards = {}

    for collection in collections:
        if not collection["is_visible"]:
            continue

        slug = collection["slug"]
        cards.setdefault(
            slug,
            {
                "slug": slug,
                "name": collection["title"],
                "name_fa": collection["title_fa"],
                "product_count": count_product_link(products, "collections", slug),
            },
        )

    return list(cards.values())


def unique_collection_links(collections: list[dict]) -> list[dict]:
    links = {}

    for collection in collections:
        links.setdefault(
            collection["slug"],
            {
                "slug": collection["slug"],
                "name": collection["title"],
                "name_fa": collection["title_fa"],
            },
        )

    return list(links.values())


def build_facets(products: list[dict]) -> dict:
    sizes = Counter()
    colors = Counter()

    for product in products:
        for size in product["options"]["sizes"]:
            sizes[size] += 1
        for color in product["options"]["colors"]:
            colors[color["name"]] += 1

    return {
        "sizes": dict(sorted(sizes.items())),
        "colors": dict(sorted(colors.items())),
    }


def clean_product(
    row: dict,
    categories_by_product: dict[str, list[dict]],
    collections_by_product: dict[str, list[dict]],
    variants_by_product: dict[str, list[dict]],
    variant_value_by_id: dict[str, dict],
    physical_images_by_product: dict[str, list[dict]],
    deprecated_images_by_product: dict[str, list[dict]],
) -> dict:
    legacy_id = clean_text(row.get("id"))
    legacy_slug = clean_text(row.get("slug"))
    handle, handle_flags = identity.canonical_handle(legacy_slug)
    is_visible = as_bool(row.get("is_visible"))
    categories = categories_by_product.get(legacy_id, [])
    product_code, product_code_flags = identity.product_code_for(legacy_id, categories)
    images = [
        standardize_image_identity(image, product_code)
        for image in physical_images_by_product.get(legacy_id, [])
    ]
    variants = [
        clean_variant(variant, variant_value_by_id)
        for variant in variants_by_product.get(legacy_id, [])
    ]
    standardize_variant_identities(product_code, variants)
    variants = collapse_duplicate_migration_variants(variants)

    quality_flags = handle_flags + product_code_flags
    if not images:
        quality_flags.append("no_physical_images")
    if not variants:
        quality_flags.append("no_variants")
    if variants and not any(variant["is_visible"] for variant in variants):
        quality_flags.append("no_visible_variants")
    quality_flags.extend(
        unique_option_values(
            flag
            for collection in collections_by_product.get(legacy_id, [])
            for flag in collection.get("quality_flags", [])
        )
    )
    quality_flags.extend(
        unique_option_values(
            flag
            for variant in variants
            for flag in variant.get("quality_flags", [])
            if flag in {"unknown_color_code", "unknown_size_code"}
        )
    )

    options = build_medusa_options(variants)
    medusa_import_variants = build_medusa_import_variants(variants)

    return {
        "legacy_id": legacy_id,
        "product_code": product_code,
        "upc": clean_text(row.get("upc")),
        "title_fa": clean_text(row.get("name")),
        "title_en": None,
        "handle": handle,
        "description_fa": clean_text(row.get("description")),
        "description_en": None,
        "is_visible": is_visible,
        "is_promotion": as_bool(row.get("is_promotion")),
        "created_at": clean_text(row.get("created_at")),
        "updated_at": clean_text(row.get("updated_at")),
        "categories": categories,
        "collections": collections_by_product.get(legacy_id, []),
        "variants": variants,
        "options": options,
        "medusa_import": {
            "options": options,
            "variants": medusa_import_variants,
            "excluded_variant_ids": [
                variant["legacy_id"] for variant in variants if not variant["is_visible"]
            ],
        },
        "media": {
            "thumbnail": images[0] if images else None,
            "images": images,
            "deprecated_csv_image_rows_ignored": len(
                deprecated_images_by_product.get(legacy_id, [])
            ),
        },
        "metadata": {
            "legacy_product_id": legacy_id,
            "legacy_slug": legacy_slug,
            "legacy_upc": clean_text(row.get("upc")),
            "legacy_is_visible": is_visible,
        },
        "quality_flags": unique_option_values(quality_flags),
    }


def build_medusa_options(variants: list[dict]) -> list[dict]:
    visible_variants = [variant for variant in variants if variant["is_visible"]]
    sizes = unique_option_values(
        variant["size"]["name"] for variant in visible_variants if variant["size"]["name"]
    )
    colors = unique_option_values(
        variant["color"]["name"] for variant in visible_variants if variant["color"]["name"]
    )
    options = []

    if sizes:
        options.append({"title": "Size", "values": sizes})
    if colors:
        options.append({"title": "Color", "values": colors})

    return options


def build_medusa_import_variants(variants: list[dict]) -> list[dict]:
    import_variants = []

    for variant in variants:
        if not variant["is_visible"]:
            continue

        options = {}
        if variant["size"]["name"]:
            options["Size"] = variant["size"]["name"]
        if variant["color"]["name"]:
            options["Color"] = variant["color"]["name"]

        title = " / ".join(options.values()) or variant["sku"] or variant["legacy_id"]

        import_variants.append(
            {
                "sku": variant["sku"],
                "legacy_variant_id": variant["legacy_id"],
                "title": title,
                "options": options,
                "source_price": variant["source_price"],
                "inventory_quantity": variant["stock"],
                "manage_inventory": True,
                "allow_backorder": False,
                "metadata": variant["metadata"],
            }
        )

    return import_variants


def unique_option_values(values: object) -> list[str]:
    unique = []
    seen = set()

    for value in values:
        if value in seen:
            continue
        seen.add(value)
        unique.append(value)

    return unique


def standardize_variant_identities(product_code: str | None, variants: list[dict]) -> None:
    for variant in variants:
        if not variant["is_visible"]:
            variant["sku"] = None
            continue
        variant["sku"] = identity.sku_for(
            product_code,
            variant.get("color_code"),
            variant.get("size_code"),
        )


def collapse_duplicate_migration_variants(variants: list[dict]) -> list[dict]:
    by_sku: dict[str, list[dict]] = defaultdict(list)
    passthrough = []

    for variant in variants:
        sku = variant.get("sku")
        if variant["is_visible"] and sku:
            by_sku[sku].append(variant)
        else:
            passthrough.append(variant)

    collapsed = []
    for sku_variants in by_sku.values():
        if len(sku_variants) == 1:
            active = sku_variants[0]
            active["metadata"] = {
                "legacy_variant_id": active["legacy_id"],
                "legacy_variant_ids": [active["legacy_id"]],
            }
            collapsed.append(active)
            continue

        active = max(
            sku_variants,
            key=lambda variant: (
                variant.get("created_at") or "",
                variant.get("updated_at") or "",
                variant.get("legacy_id") or "",
            ),
        )
        active["metadata"] = {
            "legacy_variant_id": active["legacy_id"],
            "legacy_variant_ids": [variant["legacy_id"] for variant in sku_variants],
        }
        collapsed.append(active)

    return sorted(
        passthrough + collapsed,
        key=lambda variant: (
            0,
            int(variant["legacy_id"]),
        )
        if variant["legacy_id"].isdigit()
        else (1, variant["legacy_id"]),
    )


def standardize_image_identity(image: dict, product_code: str | None) -> dict:
    standardized = dict(image)
    standardized["source_path"] = standardized["relative_path"]
    standardized["target_path"] = identity.target_image_path(
        product_code,
        standardized.get("position"),
        Path(standardized["filename"]).suffix,
    )
    return standardized


def clean_variant(row: dict, variant_value_by_id: dict[str, dict]) -> dict:
    size = variant_value_by_id.get(clean_text(row.get("size")), {})
    color = variant_value_by_id.get(clean_text(row.get("color")), {})
    size_label = size.get("value") or size.get("name") or clean_text(row.get("size"))
    size_label_fa = size.get("name") or size_label
    color_label = color.get("name") or clean_text(row.get("color"))

    color_code, color_flags = identity.color_code(color_label)
    size_code, size_flags = identity.size_code(size_label)

    return {
        "legacy_id": clean_text(row.get("id")),
        "sku": clean_text(row.get("sku")),
        "legacy_sku": clean_text(row.get("sku")),
        "description": clean_text(row.get("description")),
        "is_visible": as_bool(row.get("is_visible")),
        "stock": as_int(row.get("stock"), default=0),
        "source_price": as_int(row.get("price")),
        "source_discount": as_int(row.get("discount"), default=0),
        "color_code": color_code,
        "size_code": size_code,
        "size": {
            "id": clean_text(row.get("size")),
            "name": size_label,
            "name_fa": size_label_fa,
        },
        "color": {
            "id": clean_text(row.get("color")),
            "name": color_label,
            "family_fa": color.get("category") or "",
            "hex": color.get("value") if looks_like_hex(color.get("value")) else "",
        },
        "created_at": clean_text(row.get("created_at")),
        "updated_at": clean_text(row.get("updated_at")),
        "metadata": {"legacy_variant_id": clean_text(row.get("id"))},
        "quality_flags": color_flags + size_flags,
    }


def clean_category(row: dict) -> dict:
    name_fa = clean_text(row.get("name"))
    label = CATEGORY_LABELS.get(name_fa, {})

    return {
        "legacy_id": clean_text(row.get("id")),
        "slug": label.get("slug") or base_handle(row.get("slug") or name_fa),
        "name": label.get("name") or name_fa,
        "name_fa": label.get("name_fa") or name_fa,
        "position": as_int(row.get("position"), default=0),
        "is_visible": as_bool(row.get("is_visible")),
    }


def clean_collection(row: dict) -> dict:
    title_fa = clean_text(row.get("title"))
    raw_slug = base_handle(row.get("slug") or title_fa or row.get("id"))
    slug, quality_flags = identity.collection_slug(raw_slug)

    return {
        "legacy_id": clean_text(row.get("id")),
        "slug": slug,
        "title": COLLECTION_LABELS.get(title_fa, title_fa),
        "title_fa": title_fa,
        "description": clean_text(row.get("description")),
        "position": as_int(row.get("position"), default=0),
        "is_visible": as_bool(row.get("is_visible")),
        "thumbnail_source": "legacy_csv_path_ignored",
        "metadata": {"legacy_slug": clean_text(row.get("slug"))},
        "quality_flags": quality_flags,
    }


def clean_variant_value(row: dict) -> dict:
    return {
        "legacy_id": clean_text(row.get("id")),
        "attribute_id": clean_text(row.get("variant_attribute_id")),
        "name": clean_text(row.get("name")),
        "category": clean_text(row.get("category")),
        "value": clean_text(row.get("value")),
    }


def scan_physical_images(image_root: Path, source_root: Path) -> tuple[dict[str, list[dict]], list[dict]]:
    images_by_product: dict[str, list[dict]] = defaultdict(list)
    issues = []

    if not image_root.exists():
        return images_by_product, [{"type": "missing_image_root", "path": str(image_root)}]

    for product_dir in sorted(image_root.iterdir(), key=lambda path: natural_key(path.name)):
        if not product_dir.is_dir():
            continue

        product_id = product_dir.name
        for image_path in sorted(product_dir.iterdir(), key=lambda path: natural_key(path.name)):
            if not image_path.is_file():
                continue

            match = IMAGE_NAME_PATTERN.match(image_path.name)
            if not match:
                issues.append(
                    {
                        "type": "unparseable_image_name",
                        "product_id": product_id,
                        "path": relative_to(image_path, source_root),
                    }
                )

            position = as_int(match.group("position"), default=9999) if match else 9999
            shot_date = (
                f"{match.group('year')}-{match.group('month')}-{match.group('day')}"
                if match
                else ""
            )

            images_by_product[product_id].append(
                {
                    "product_id": product_id,
                    "position": position,
                    "shot_date": shot_date,
                    "filename": image_path.name,
                    "relative_path": relative_to(image_path, source_root),
                    "bytes": image_path.stat().st_size,
                    "source": "physical_file",
                }
            )

    for product_images in images_by_product.values():
        product_images.sort(key=lambda item: (item["position"], item["filename"]))

    return images_by_product, issues


def scan_videos(video_root: Path, source_root: Path) -> tuple[list[dict], list[dict]]:
    videos = []
    issues = []

    if not video_root.exists():
        return videos, []

    for video_path in sorted(video_root.iterdir(), key=lambda path: natural_key(path.name)):
        if not video_path.is_file():
            continue

        match = VIDEO_NAME_PATTERN.match(video_path.name)
        if not match:
            issues.append(
                {
                    "type": "unparseable_video_name",
                    "path": relative_to(video_path, source_root),
                }
            )

        videos.append(
            {
                "filename": video_path.name,
                "sequence": as_int(match.group("sequence")) if match else None,
                "relative_path": relative_to(video_path, source_root),
                "bytes": video_path.stat().st_size,
                "source": "physical_file",
                "match_status": "unmatched_no_product_id_in_filename",
            }
        )

    return videos, issues


def link_media_tree(catalog: dict, source_root: Path, media_root: Path) -> None:
    product_media_root = media_root / "products"
    video_media_root = media_root / "videos" / "unmatched"
    product_media_root.mkdir(parents=True, exist_ok=True)
    video_media_root.mkdir(parents=True, exist_ok=True)

    for product in catalog["products"]:
        product_dir = product_media_root / f"{product['legacy_id']}-{product['handle']}"
        product_dir.mkdir(parents=True, exist_ok=True)

        for image in product["media"]["images"]:
            source_path = source_root / image["relative_path"]
            link_name = f"{image['position']:02d}{Path(image['filename']).suffix.lower()}"
            link_path = product_dir / link_name
            refresh_symlink(source_path, link_path)
            image["organized_path"] = relative_to(link_path, source_root)

    for video in catalog["media"]["videos"]:
        source_path = source_root / video["relative_path"]
        link_path = video_media_root / video["filename"]
        refresh_symlink(source_path, link_path)
        video["organized_path"] = relative_to(link_path, source_root)


def refresh_symlink(source_path: Path, link_path: Path) -> None:
    if link_path.is_symlink() or link_path.exists():
        link_path.unlink()

    target = os.path.relpath(source_path, start=link_path.parent)
    link_path.symlink_to(target)


def group_rows(rows: list[dict], key: str) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = defaultdict(list)

    for row in rows:
        grouped[clean_text(row.get(key))].append(row)

    return grouped


def group_links(
    rows: list[dict],
    source_key: str,
    target_key: str,
    target_by_id: dict[str, dict],
) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = defaultdict(list)

    for row in rows:
        target = target_by_id.get(clean_text(row.get(target_key)))
        if target:
            grouped[clean_text(row.get(source_key))].append(target)

    return grouped


def summarize_links(products: list[dict], key: str) -> dict:
    counts = Counter()

    for product in products:
        for item in product[key]:
            counts[item.get("name") or item.get("title") or item.get("slug")] += 1

    return dict(sorted(counts.items(), key=lambda item: (-item[1], item[0])))


def count_visible(rows: list[dict]) -> int:
    return sum(1 for row in rows if as_bool(row.get("is_visible")))


def count_missing_variant_lookup(
    rows: list[dict], key: str, variant_value_by_id: dict[str, dict]
) -> int:
    return sum(
        1
        for row in rows
        if clean_text(row.get(key)) and clean_text(row.get(key)) not in variant_value_by_id
    )


def count_present(items: list[dict], key: str) -> int:
    return sum(1 for item in items if item.get(key))


def count_quality_flag(products: list[dict], flag: str) -> int:
    return sum(1 for product in products if flag in product.get("quality_flags", []))


def count_variant_flag(products: list[dict], flag: str) -> int:
    return sum(
        1
        for product in products
        for variant in product.get("variants", [])
        if flag in variant.get("quality_flags", [])
    )


def count_validation_type(validation: dict, issue_type: str) -> int:
    return sum(
        1
        for issue in validation["errors"] + validation["reviews"]
        if issue.get("type") == issue_type
    )


def unique_handle(
    raw_handle: str,
    legacy_id: str,
    duplicate_raw_handles: set[str],
    used_handles: set[str],
) -> str:
    if raw_handle not in duplicate_raw_handles and raw_handle not in used_handles:
        used_handles.add(raw_handle)
        return raw_handle

    candidate = f"{raw_handle}-{legacy_id}"
    suffix = 2

    while candidate in used_handles:
        candidate = f"{raw_handle}-{legacy_id}-{suffix}"
        suffix += 1

    used_handles.add(candidate)
    return candidate


def base_handle(value: object) -> str:
    text = clean_text(value).lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = text.strip("-")

    return text or "product"


def clean_text(value: object) -> str:
    if value is None:
        return ""

    text = unicodedata.normalize("NFKC", str(value))
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("ي", "ی").replace("ك", "ک")
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    text = "\n".join(lines).strip()
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text


def as_bool(value: object) -> bool:
    return clean_text(value) == "1"


def as_int(value: object, default: int | None = None) -> int | None:
    text = clean_text(value)

    if not text:
        return default

    try:
        return int(float(text))
    except ValueError:
        return default


def looks_like_hex(value: object) -> bool:
    return bool(re.match(r"^#[0-9a-fA-F]{3,8}$", clean_text(value)))


def natural_key(value: str) -> list[object]:
    return [int(part) if part.isdigit() else part.lower() for part in re.split(r"(\d+)", value)]


def relative_to(path: Path, root: Path) -> str:
    return path.resolve().relative_to(root.resolve()).as_posix()


def read_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8-sig") as csv_file:
        return list(csv.DictReader(csv_file))


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    raise SystemExit(main())
