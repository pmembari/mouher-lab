from __future__ import annotations

import re
from collections import Counter


PRODUCT_CODE_RE = re.compile(r"^MHR-(SHT|TRS|COT|SET|ACC|TSH)-\d{6}$")
SKU_RE = re.compile(r"^MHR-[A-Z]{3}-\d{6}-[A-Z0-9]{2,4}-[A-Z0-9]{1,4}$")
HANDLE_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
TARGET_IMAGE_RE = re.compile(r"^products/MHR-[A-Z]{3}-\d{6}/images/\d{2}\.[a-z0-9]+$")

CATEGORY_TYPE_CODES = {
    "shirts": "SHT",
    "trousers": "TRS",
    "coats": "COT",
    "sets": "SET",
}

PRODUCT_TYPE_OVERRIDES = {
    "35": "COT",
    "80": "ACC",
    "81": "ACC",
}

COLOR_CODES = {
    "Black": "BLK",
    "مشکی": "BLK",
    "White": "WHT",
    "سفید": "WHT",
    "Cream": "CRM",
    "کرم": "CRM",
    "Gray": "GRY",
    "طوسی": "GRY",
    "خاکستری": "GRY",
    "Light Gray": "LGY",
    "طوسی روشن": "LGY",
    "Brown": "BRN",
    "قهوه ای": "BRN",
    "قهوه‌ای": "BRN",
    "Nescafe": "NCF",
    "نسکافه ای": "NCF",
    "نسکافه‌ای": "NCF",
    "Green": "GRN",
    "سبز": "GRN",
    "Navy": "NVY",
    "سرمه ای": "NVY",
    "سرمه‌ای": "NVY",
    "Blue": "BLU",
    "آبی": "BLU",
    "Red": "RED",
    "قرمز": "RED",
}

SIZE_CODES = {
    "Free Size": "FS",
    "فری سایز": "FS",
    "SIZE 1": "S1",
    "Size 1": "S1",
    "سایز ۱": "S1",
    "SIZE 2": "S2",
    "Size 2": "S2",
    "سایز ۲": "S2",
    "XS": "XS",
    "S": "S",
    "M": "M",
    "L": "L",
    "XL": "XL",
    "XXL": "XXL",
}

COLLECTION_SLUGS = {
    "1234": "women",
    "123": "men",
    "accessories": "accessories",
    "ss-2024-collection": "spring-summer-2024",
    "fw-2024-collectin": "fall-winter-2024",
}

APPROVED_HANDLES: dict[str, str] = {}


def product_code_for(legacy_id: str, categories: list[dict]) -> tuple[str | None, list[str]]:
    if legacy_id in PRODUCT_TYPE_OVERRIDES:
        code = PRODUCT_TYPE_OVERRIDES[legacy_id]
        try:
            sequence = int(legacy_id)
        except (TypeError, ValueError):
            return None, ["invalid_legacy_product_id"]
        return f"MHR-{code}-{sequence:06d}", []

    codes = {
        CATEGORY_TYPE_CODES[category["slug"]]
        for category in categories
        if category.get("slug") in CATEGORY_TYPE_CODES
    }

    if len(codes) != 1:
        return None, ["unknown_category_mapping"]

    try:
        sequence = int(legacy_id)
    except (TypeError, ValueError):
        return None, ["invalid_legacy_product_id"]

    return f"MHR-{codes.pop()}-{sequence:06d}", []


def canonical_handle(legacy_slug: str) -> tuple[str | None, list[str]]:
    handle = APPROVED_HANDLES.get(legacy_slug)
    if not handle:
        return None, ["handle_needs_review"]
    if not HANDLE_RE.fullmatch(handle):
        return None, ["invalid_canonical_handle"]
    return handle, []


def collection_slug(raw_slug: str) -> tuple[str, list[str]]:
    slug = COLLECTION_SLUGS.get(raw_slug)
    if slug:
        return slug, []
    return raw_slug, ["collection_needs_review"]


def color_code(name: str) -> tuple[str | None, list[str]]:
    code = COLOR_CODES.get(name)
    if code:
        return code, []
    return None, ["unknown_color_code"]


def size_code(name: str) -> tuple[str | None, list[str]]:
    code = SIZE_CODES.get(name)
    if code:
        return code, []
    return None, ["unknown_size_code"]


def sku_for(product_code: str | None, color: str | None, size: str | None) -> str | None:
    if not product_code or not color or not size:
        return None
    return f"{product_code}-{color}-{size}"


def target_image_path(
    product_code: str | None,
    position: int | None,
    source_suffix: str,
) -> str | None:
    if not product_code or not isinstance(position, int) or position < 1:
        return None
    suffix = source_suffix.lower().lstrip(".")
    if not suffix:
        return None
    return f"products/{product_code}/images/{position:02d}.{suffix}"


def validate_catalog(products: list[dict]) -> dict:
    errors: list[dict] = []
    reviews: list[dict] = []
    product_codes = [product.get("product_code") for product in products if product.get("product_code")]
    skus = [
        variant.get("sku")
        for product in products
        for variant in product.get("variants", [])
        if variant.get("sku")
    ]
    handles = [product.get("handle") for product in products if product.get("handle")]

    errors.extend(duplicates("duplicate_product_code", product_codes))
    errors.extend(duplicates("duplicate_sku", skus))
    errors.extend(duplicates("duplicate_canonical_handle", handles))

    for product in products:
        legacy_product_id = product.get("legacy_id")
        product_code = product.get("product_code")
        if product_code and not PRODUCT_CODE_RE.fullmatch(product_code):
            errors.append({"type": "invalid_product_code", "product_id": legacy_product_id})
        if product.get("handle") and not HANDLE_RE.fullmatch(product["handle"]):
            errors.append({"type": "invalid_canonical_handle", "product_id": legacy_product_id})
        if not product.get("media", {}).get("images"):
            reviews.append({"type": "missing_media", "product_id": legacy_product_id})

        positions: list[int] = []
        for image in product.get("media", {}).get("images", []):
            position = image.get("position")
            if isinstance(position, int):
                positions.append(position)
            target_path = image.get("target_path")
            if target_path and not TARGET_IMAGE_RE.fullmatch(target_path):
                errors.append({"type": "invalid_target_media_path", "product_id": legacy_product_id})
        for duplicate in duplicate_values(positions):
            errors.append(
                {
                    "type": "duplicate_media_position",
                    "product_id": legacy_product_id,
                    "position": duplicate,
                }
            )

        for flag in product.get("quality_flags", []):
            if flag in {
                "unknown_category_mapping",
                "handle_needs_review",
                "collection_needs_review",
                "unknown_color_code",
                "unknown_size_code",
                "missing_media",
            }:
                reviews.append({"type": flag, "product_id": legacy_product_id})

        for variant in product.get("variants", []):
            sku = variant.get("sku")
            if sku and not SKU_RE.fullmatch(sku):
                errors.append(
                    {
                        "type": "invalid_sku",
                        "product_id": legacy_product_id,
                        "variant_id": variant.get("legacy_id"),
                    }
                )
            if (
                variant.get("is_visible")
                and not sku
                and product_code
                and variant.get("color_code")
                and variant.get("size_code")
            ):
                errors.append(
                    {
                        "type": "missing_sku_on_visible_variant",
                        "product_id": legacy_product_id,
                        "variant_id": variant.get("legacy_id"),
                    }
                )

    return {
        "errors": errors,
        "reviews": reviews,
        "counts": {
            "errors": len(errors),
            "reviews": len(reviews),
            "duplicate_product_codes": count_duplicate_instances(product_codes),
            "duplicate_skus": count_duplicate_instances(skus),
            "duplicate_handles": count_duplicate_instances(handles),
        },
    }


def duplicate_values(values: list[object]) -> list[object]:
    return [value for value, count in Counter(values).items() if count > 1]


def duplicates(issue_type: str, values: list[str]) -> list[dict]:
    return [{"type": issue_type, "value": value} for value in duplicate_values(values)]


def count_duplicate_instances(values: list[str]) -> int:
    return sum(count - 1 for count in Counter(values).values() if count > 1)
