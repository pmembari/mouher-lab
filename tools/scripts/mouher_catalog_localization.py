from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from typing import Any


PERSIAN_RE = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")
LATIN_RE = re.compile(r"[A-Za-z]")
URL_RE = re.compile(r"https?://\S+|www\.\S+", re.I)
SKU_RE = re.compile(r"\bMHR-[A-Z]{3}-\d{6}(?:-[A-Z0-9]{1,4}){0,2}\b")
APPROVED_TOKEN_RE = re.compile(
    r"\b(?:Free\s+Size|Oversize|Unisex|SS\d{2}|FW\d{2}|XS|XXL|XL|[SML])\b",
    re.I,
)


def audit_catalog_localization(
    products: list[dict[str, Any]],
    categories: list[dict[str, Any]],
    collections: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    reviews: list[dict[str, Any]] = []

    for product in products:
        base = {
            "legacy_id": product.get("legacy_id"),
            "product_code": product.get("product_code"),
        }
        reviews.extend(
            audit_field(base, "title_fa", product.get("title_fa"), "fa", "title")
        )
        reviews.extend(
            audit_field(base, "title_en", product.get("title_en"), "en", "title")
        )
        reviews.extend(
            audit_field(
                base,
                "description_fa",
                product.get("description_fa"),
                "fa",
                "description",
            )
        )
        reviews.extend(
            audit_field(
                base,
                "description_en",
                product.get("description_en"),
                "en",
                "description",
            )
        )

    for category in categories:
        base = {"legacy_id": category.get("legacy_id")}
        reviews.extend(
            audit_named_field(
                base,
                "name_fa",
                category.get("name_fa"),
                "fa",
                "category",
            )
        )
        reviews.extend(
            audit_named_field(base, "name", category.get("name"), "en", "category")
        )

    for collection in collections:
        base = {"legacy_id": collection.get("legacy_id")}
        reviews.extend(
            audit_named_field(
                base,
                "title_fa",
                collection.get("title_fa"),
                "fa",
                "collection",
            )
        )
        reviews.extend(
            audit_named_field(base, "title", collection.get("title"), "en", "collection")
        )
        description = collection.get("description")
        if not is_blank(description):
            reviews.extend(
                audit_named_field(
                    base,
                    "description",
                    description,
                    "en",
                    "collection",
                )
            )

    return reviews


def audit_field(
    base: dict[str, Any],
    field: str,
    value: Any,
    expected: str,
    issue_scope: str,
) -> list[dict[str, Any]]:
    missing_code = f"missing_{issue_scope}_{expected}"
    wrong_code = f"{issue_scope}_{expected}_wrong_script"
    mixed_code = f"mixed_language_{issue_scope}_{expected}"
    return classify_value(base, field, value, expected, missing_code, wrong_code, mixed_code)


def audit_named_field(
    base: dict[str, Any],
    field: str,
    value: Any,
    expected: str,
    scope: str,
) -> list[dict[str, Any]]:
    missing_code = f"missing_{scope}_{expected}"
    mixed_code = f"mixed_language_{scope}"
    return classify_value(
        base,
        field,
        value,
        expected,
        missing_code,
        mixed_code,
        mixed_code,
    )


def classify_value(
    base: dict[str, Any],
    field: str,
    value: Any,
    expected: str,
    missing_code: str,
    wrong_code: str,
    mixed_code: str,
) -> list[dict[str, Any]]:
    if is_blank(value):
        return [review(base, field, value, missing_code)]

    text = str(value)
    normalized = strip_approved_tokens(text)
    persian = len(PERSIAN_RE.findall(normalized))
    latin = len(LATIN_RE.findall(normalized))

    if expected == "fa":
        if persian == 0 and latin > 0:
            return [review(base, field, value, wrong_code)]
        if is_substantial_mixing(expected_count=persian, opposite_count=latin):
            return [review(base, field, value, mixed_code)]
    else:
        if latin == 0 and persian > 0:
            return [review(base, field, value, wrong_code)]
        if is_substantial_mixing(expected_count=latin, opposite_count=persian):
            return [review(base, field, value, mixed_code)]

    return []


def strip_approved_tokens(text: str) -> str:
    stripped = URL_RE.sub(" ", text)
    stripped = SKU_RE.sub(" ", stripped)
    stripped = APPROVED_TOKEN_RE.sub(" ", stripped)
    return stripped


def is_substantial_mixing(expected_count: int, opposite_count: int) -> bool:
    if expected_count == 0 or opposite_count == 0:
        return False
    return opposite_count >= 4 and opposite_count / (expected_count + opposite_count) >= 0.2


def is_blank(value: Any) -> bool:
    return value is None or str(value).strip() == ""


def review(base: dict[str, Any], field: str, value: Any, issue_code: str) -> dict[str, Any]:
    record = {
        **base,
        "field": field,
        "current_value": value,
        "issue_code": issue_code,
    }
    return {key: val for key, val in record.items() if val is not None}


def summarize_reviews(reviews: list[dict[str, Any]]) -> dict[str, Any]:
    issue_counts = Counter(review["issue_code"] for review in reviews)
    affected_products = {
        review.get("legacy_id")
        for review in reviews
        if review.get("product_code") is not None or review.get("field", "").endswith("_en")
    }
    affected_products.discard(None)
    return {
        "total_review_items": len(reviews),
        "issue_counts": dict(sorted(issue_counts.items())),
        "affected_products": len(affected_products),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit cleaned Mouher catalog localization.")
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--categories", type=Path, required=True)
    parser.add_argument("--collections", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    reviews = audit_catalog_localization(
        json.loads(args.catalog.read_text(encoding="utf-8")),
        json.loads(args.categories.read_text(encoding="utf-8")),
        json.loads(args.collections.read_text(encoding="utf-8")),
    )
    payload = {"summary": summarize_reviews(reviews), "reviews": reviews}

    if args.output:
        args.output.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(json.dumps(payload["summary"], ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
