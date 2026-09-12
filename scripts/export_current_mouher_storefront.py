#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from decimal import Decimal, InvalidOperation
from pathlib import Path

from prepare_mouher_catalog import base_handle, clean_text, write_json


DEFAULT_INPUT_DIR = Path("Mouher_Data/current-site")
DEFAULT_OUTPUT_JS = Path("mouher-preview/src/data/currentMouherCatalog.js")
PUBLIC_PRODUCT_BASE_URL = "https://mouher.com/products"


def main() -> int:
    args = parse_args()
    input_dir = args.input_dir.resolve()
    output_js = args.output_js.resolve()

    products = read_json(input_dir / "products.current.json")
    collections = read_json(input_dir / "collections.current.json")
    categories = read_json(input_dir / "categories.current.json")
    catalog = build_catalog(products, collections, categories, args.currency_code)

    output_js.parent.mkdir(parents=True, exist_ok=True)
    output_js.write_text(
        "export const currentMouherCatalog = "
        + json.dumps(catalog, ensure_ascii=False, indent=2)
        + ";\n",
        encoding="utf-8",
    )

    print(f"Exported {len(catalog['products'])} current Mouher products")
    print(f"Output: {output_js}")

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export the current public mouher.com catalog for the React storefront."
    )
    parser.add_argument("--input-dir", type=Path, default=DEFAULT_INPUT_DIR)
    parser.add_argument("--output-js", type=Path, default=DEFAULT_OUTPUT_JS)
    parser.add_argument(
        "--currency-code",
        default="IRR",
        help="Currency label used for current public prices. Default: IRR",
    )
    return parser.parse_args()


def build_catalog(
    products: list[dict],
    collections: list[dict],
    categories: list[dict],
    currency_code: str,
) -> dict:
    storefront_products = [
        to_storefront_product(product, currency_code)
        for product in products
        if clean_text(product.get("name"))
    ]
    category_cards = build_categories(storefront_products, categories)
    collection_cards = build_collections(storefront_products, collections)
    featured_image = next(
        (
            product["imageUrls"][0]
            for product in storefront_products
            if product["imageUrls"]
        ),
        "",
    )

    return {
        "source": "mouher-live-snapshot",
        "notice": "Current public products from mouher.com/products.",
        "featuredImage": featured_image,
        "products": storefront_products,
        "categories": category_cards,
        "collections": collection_cards,
        "merchandising": {
            "heroImage": featured_image,
            "valueProps": [
                {
                    "id": "current-products",
                    "title": "Current Mouher products",
                    "titleFa": "محصولات فعلی موهر",
                    "description": "Catalog cards are generated from the public mouher.com product listing.",
                    "descriptionFa": "کارت‌های محصول از لیست عمومی محصولات mouher.com ساخته شده‌اند.",
                }
            ],
        },
    }


def to_storefront_product(product: dict, currency_code: str) -> dict:
    raw_name = clean_text(product.get("name"))
    name = display_name(raw_name)
    handle = base_handle(product.get("handle") or product.get("raw_slug") or raw_name)
    price_amount = parse_amount(product.get("price"))
    compare_at_amount = parse_amount(product.get("compare_at_price"))
    category = infer_category(raw_name, handle)
    collection = infer_collection(raw_name)
    stock = parse_stock(product.get("listing_stock"))
    image_url = clean_text(product.get("image_url"))

    return {
        "id": f"mouher-live-{product.get('live_id')}",
        "handle": handle,
        "name": name,
        "nameFa": name,
        "category": category["name"],
        "categoryFa": category["nameFa"],
        "categorySlug": category["slug"],
        "collection": collection["name"],
        "collectionFa": collection["nameFa"],
        "price": format_amount(price_amount, currency_code),
        "priceAmount": price_amount,
        "compareAtPrice": (
            format_amount(compare_at_amount, currency_code)
            if compare_at_amount and compare_at_amount > price_amount
            else ""
        ),
        "compareAtAmount": (
            compare_at_amount
            if compare_at_amount and compare_at_amount > price_amount
            else None
        ),
        "installment": installment_label(price_amount, currency_code),
        "imageUrls": [image_url] if image_url else [],
        "description": (
            "Current public Mouher product. Final product details and checkout "
            "stay synchronized through mouher.com and Medusa."
        ),
        "descriptionFa": (
            "محصول فعلی موهر. جزئیات نهایی و پرداخت از طریق mouher.com و مدوسا "
            "همگام می‌ماند."
        ),
        "badge": product_badge(compare_at_amount, price_amount, stock),
        "variantId": None,
        "inStock": stock is None or stock > 0,
        "stockCount": stock,
        "colors": [
            {
                "label": clean_text(color.get("label")),
                "labelFa": clean_text(color.get("label")),
                "hex": clean_text(color.get("hex")) or "#b9b5aa",
            }
            for color in product.get("colors", [])
            if clean_text(color.get("label"))
        ],
        "sizes": inferred_sizes(raw_name),
        "source": "mouher-live",
        "externalUrl": public_product_url(handle),
    }


def build_categories(products: list[dict], source_categories: list[dict]) -> list[dict]:
    inferred = {}

    for product in products:
        slug = product["categorySlug"]
        current = inferred.setdefault(
            slug,
            {
                "id": slug,
                "slug": slug,
                "name": product["category"],
                "nameFa": product["categoryFa"],
                "count": 0,
                "imageUrl": product["imageUrls"][0] if product["imageUrls"] else "",
            },
        )
        current["count"] += 1
        if not current["imageUrl"] and product["imageUrls"]:
            current["imageUrl"] = product["imageUrls"][0]

    for category in source_categories:
        slug = base_handle(category.get("handle") or category.get("raw_slug") or category.get("name"))
        if slug in inferred:
            inferred[slug]["nameFa"] = clean_text(category.get("name")) or inferred[slug]["nameFa"]

    return sorted(inferred.values(), key=lambda item: (-item["count"], item["name"]))


def build_collections(products: list[dict], source_collections: list[dict]) -> list[dict]:
    inferred = {}

    for product in products:
        slug = base_handle(product["collection"])
        current = inferred.setdefault(
            slug,
            {
                "id": slug,
                "slug": slug,
                "name": product["collection"],
                "nameFa": product["collectionFa"],
                "count": 0,
            },
        )
        current["count"] += 1

    for collection in source_collections:
        slug = base_handle(collection.get("handle") or collection.get("raw_slug") or collection.get("name"))
        if slug in inferred:
            inferred[slug]["nameFa"] = clean_text(collection.get("name")) or inferred[slug]["nameFa"]

    return sorted(inferred.values(), key=lambda item: (-item["count"], item["name"]))


def infer_category(name: str, handle: str) -> dict:
    value = f"{name} {handle}".lower()

    rules = [
        (("tshirt", "t-shirt", "تیشر", "تیشرت"), "T-shirts", "تیشرت", "t-shirts"),
        (("shirt", "پیراهن"), "Shirts", "پیراهن", "shirts"),
        (("pants", "pant", "شلوار"), "Trousers", "شلوار", "trousers"),
        (("coat", "overcoat", "کت"), "Coats", "کت", "coats"),
        (("set", "ست"), "Sets", "ست", "sets"),
        (("sock", "جوراب"), "Accessories", "اکسسوری", "accessories"),
    ]

    for needles, name_en, name_fa, slug in rules:
        if any(needle in value for needle in needles):
            return {"name": name_en, "nameFa": name_fa, "slug": slug}

    return {"name": "Clothing", "nameFa": "پوشاک", "slug": "clothing"}


def infer_collection(name: str) -> dict:
    value = name.lower()

    if "sock" in value or "جوراب" in value:
        return {"name": "Accessories", "nameFa": "اکسسوری"}

    return {"name": "Unisex", "nameFa": "یونیسکس"}


def inferred_sizes(name: str) -> list[str]:
    value = name.lower()

    if "free" in value or "فری سایز" in value:
        return ["Free Size"]
    if "(m" in value or " m " in f" {value} ":
        return ["M"]
    if "(f" in value or " f " in f" {value} ":
        return ["F"]

    return []


def display_name(raw_name: str) -> str:
    return re.sub(r"\s*\(([mf])\)\s*$", "", raw_name, flags=re.I).strip()


def product_badge(compare_at_amount: int | None, price_amount: int, stock: int | None) -> str:
    if compare_at_amount and compare_at_amount > price_amount:
        return "Sale"
    if stock is not None and 0 < stock <= 5:
        return "Low stock"
    return "Current"


def installment_label(amount: int, currency_code: str) -> str:
    if amount <= 0:
        return ""

    return f"4 payments of {format_amount(amount // 4, currency_code)}"


def format_amount(amount: int, currency_code: str) -> str:
    if amount <= 0:
        return "Price on request"

    return f"{amount:,} {currency_code.upper()}"


def parse_amount(value: object) -> int:
    try:
        amount = Decimal(str(value or "0"))
    except (InvalidOperation, ValueError):
        return 0

    return int(amount)


def parse_stock(value: object) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def public_product_url(handle: str) -> str:
    return f"{PUBLIC_PRODUCT_BASE_URL}/{handle}"


def read_json(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    raise SystemExit(main())
