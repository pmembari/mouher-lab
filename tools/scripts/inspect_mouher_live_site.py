#!/usr/bin/env python3
from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from prepare_mouher_catalog import base_handle, build_catalog, clean_text, write_json


DEFAULT_BASE_URL = "https://mouher.com"


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir.resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    live = fetch_live_site(
        args.base_url,
        delay=args.delay,
        include_public_image_urls=args.include_public_image_urls,
    )
    history = build_catalog(args.source_root.resolve(), include_hidden=True)
    matches = match_live_products(live["products"], history["products"])

    write_json(output_dir / "products.current.json", live["products"])
    write_json(output_dir / "collections.current.json", live["collections"])
    write_json(output_dir / "categories.current.json", live["categories"])
    write_json(output_dir / "matches.current-to-history.json", matches)
    write_json(
        output_dir / "summary.json",
        build_summary(
            live,
            matches,
            include_public_image_urls=args.include_public_image_urls,
        ),
    )

    print(f"Live products: {len(live['products'])}")
    print(f"Live collections: {len(live['collections'])}")
    print(f"Live categories: {len(live['categories'])}")
    print(f"High-confidence history matches: {count_matches(matches, 'high')}")
    print(f"Manual-review matches: {count_matches(matches, 'review')}")
    print(f"Output: {output_dir}")

    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Inspect current mouher.com storefront data into ignored local JSON."
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--source-root", type=Path, default=Path("Mouher_Data"))
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/Mouher_Data/current-site"),
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.2,
        help="Delay between page fetches, in seconds.",
    )
    parser.add_argument(
        "--include-public-image-urls",
        action="store_true",
        help="Keep public product image URLs from mouher.com in the generated output.",
    )
    return parser.parse_args()


def fetch_live_site(
    base_url: str,
    delay: float = 0.2,
    include_public_image_urls: bool = False,
) -> dict:
    products_page = fetch_page_json(f"{base_url.rstrip('/')}/products")
    products_payload = products_page["props"]["products"]
    last_page = int(products_payload.get("last_page") or 1)
    products = sanitize_products(
        products_payload.get("data", []),
        page=1,
        include_public_image_urls=include_public_image_urls,
    )

    for page in range(2, last_page + 1):
        time.sleep(delay)
        payload = fetch_page_json(f"{base_url.rstrip('/')}/products?page={page}")
        products.extend(
            sanitize_products(
                payload["props"]["products"].get("data", []),
                page=page,
                include_public_image_urls=include_public_image_urls,
            )
        )

    collections_page = fetch_page_json(f"{base_url.rstrip('/')}/collections")
    categories_page = fetch_page_json(f"{base_url.rstrip('/')}/categories")

    return {
        "products": products,
        "collections": sanitize_collections(collections_page["props"].get("collections", [])),
        "categories": sanitize_categories(categories_page["props"].get("categories", [])),
        "tenant": {
            "name": clean_text(products_page["props"].get("tenant", {}).get("name")),
            "domain": clean_text(products_page["props"].get("tenant", {}).get("domain")),
            "seo_description": clean_text(
                products_page["props"]
                .get("tenant", {})
                .get("settings", {})
                .get("seo_description")
            ),
        },
    }


def fetch_page_json(url: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "MouherCatalogInspector/1.0",
            "Accept": "text/html,application/xhtml+xml",
        },
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read().decode("utf-8")

    return extract_inertia_page_json(body)


def extract_inertia_page_json(html_body: str) -> dict:
    parser = InertiaPageParser()
    parser.feed(html_body)

    if not parser.page_json:
        raise ValueError("Could not find Inertia data-page JSON")

    return json.loads(html.unescape(parser.page_json))


class InertiaPageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._capture = False
        self.page_json = ""

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "script":
            return

        attributes = dict(attrs)
        if attributes.get("data-page") == "app" and attributes.get("type") == "application/json":
            self._capture = True

    def handle_data(self, data: str) -> None:
        if self._capture:
            self.page_json += data

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._capture:
            self._capture = False


def sanitize_products(
    rows: list[dict],
    page: int,
    include_public_image_urls: bool = False,
) -> list[dict]:
    products = []

    for row in rows:
        image_hint = image_hints(row.get("image"))
        product = {
            "live_id": row.get("id"),
            "name": clean_text(row.get("name")),
            "handle": base_handle(row.get("slug") or row.get("name") or row.get("id")),
            "raw_slug": clean_text(row.get("slug")),
            "price": clean_text(row.get("price")),
            "compare_at_price": clean_text(row.get("compare_at_price")),
            "track_inventory": bool(row.get("track_inventory")),
            "listing_stock": row.get("listing_stock"),
            "colors": sanitize_colors(row.get("colors") or []),
            "source_page": page,
            "image_filename_hint": image_hint["filename"],
            "image_product_id_hint": image_hint["product_id"],
            "image_source": "remote_url_stripped",
        }

        if include_public_image_urls:
            product["image_url"] = clean_text(row.get("image"))
            product["image_source"] = "remote_public_url"

        products.append(product)

    return products


def sanitize_collections(rows: list[dict]) -> list[dict]:
    return [
        {
            "live_id": row.get("id"),
            "name": clean_text(row.get("name")),
            "handle": base_handle(row.get("slug") or row.get("name") or row.get("id")),
            "raw_slug": clean_text(row.get("slug")),
            "description": clean_text(row.get("description")),
            "image_filename_hint": image_hints(row.get("thumbnail"))["filename"],
            "image_source": "remote_url_stripped" if row.get("thumbnail") else "",
        }
        for row in rows
    ]


def sanitize_categories(rows: list[dict]) -> list[dict]:
    return [
        {
            "live_id": row.get("id"),
            "name": clean_text(row.get("name")),
            "handle": base_handle(row.get("slug") or row.get("name") or row.get("id")),
            "raw_slug": clean_text(row.get("slug")),
            "description": clean_text(row.get("description")),
            "children": sanitize_categories(row.get("children") or []),
            "image_filename_hint": image_hints(row.get("thumbnail"))["filename"],
            "image_source": "remote_url_stripped" if row.get("thumbnail") else "",
        }
        for row in rows
    ]


def sanitize_colors(rows: list[dict]) -> list[dict]:
    return [
        {
            "label": clean_text(row.get("label")),
            "hex": clean_text(row.get("hex")),
        }
        for row in rows
    ]


def image_hints(url: str | None) -> dict:
    if not url:
        return {"filename": "", "product_id": ""}

    parsed = urlparse(url)
    parts = [part for part in parsed.path.split("/") if part]
    filename = Path(parts[-1]).name if parts else ""
    product_id = ""

    if "products" in parts:
        index = parts.index("products")
        if len(parts) > index + 1:
            product_id = parts[index + 1]

    return {
        "filename": filename,
        "product_id": product_id,
    }


def match_live_products(live_products: list[dict], history_products: list[dict]) -> list[dict]:
    history_by_id = {str(product["legacy_id"]): product for product in history_products}
    history_by_handle = {}
    history_by_title = {}

    for product in history_products:
        history_by_handle.setdefault(product["handle"], []).append(product)
        history_by_title.setdefault(normalize_match_key(product["title_fa"]), []).append(product)

    matches = []
    for live in live_products:
        reason = ""
        confidence = "none"
        candidates = []
        hinted_id = clean_text(live.get("image_product_id_hint"))

        if hinted_id and hinted_id in history_by_id:
            candidates = [history_by_id[hinted_id]]
            confidence = "high"
            reason = "image_product_id_hint"
        elif live["handle"] in history_by_handle:
            candidates = history_by_handle[live["handle"]]
            confidence = "review" if len(candidates) > 1 else "medium"
            reason = "handle"
        else:
            name_key = normalize_match_key(live["name"])
            candidates = history_by_title.get(name_key, [])
            if candidates:
                confidence = "review" if len(candidates) > 1 else "medium"
                reason = "normalized_name"

        matches.append(
            {
                "live_id": live["live_id"],
                "live_name": live["name"],
                "live_handle": live["handle"],
                "confidence": confidence,
                "reason": reason,
                "history_candidates": [
                    {
                        "legacy_id": product["legacy_id"],
                        "title_fa": product["title_fa"],
                        "handle": product["handle"],
                        "image_count": len(product["media"]["images"]),
                    }
                    for product in candidates
                ],
            }
        )

    return matches


def build_summary(
    live: dict,
    matches: list[dict],
    include_public_image_urls: bool = False,
) -> dict:
    return {
        "source": DEFAULT_BASE_URL,
        "products": {
            "total": len(live["products"]),
            "with_stock": sum(
                1 for product in live["products"] if int(product.get("listing_stock") or 0) > 0
            ),
            "with_compare_at_price": sum(
                1 for product in live["products"] if product.get("compare_at_price")
            ),
        },
        "collections": {
            "total": len(live["collections"]),
            "names": [collection["name"] for collection in live["collections"]],
        },
        "categories": {
            "total": len(live["categories"]),
            "names": [category["name"] for category in live["categories"]],
        },
        "matches": {
            "high": count_matches(matches, "high"),
            "medium": count_matches(matches, "medium"),
            "review": count_matches(matches, "review"),
            "none": count_matches(matches, "none"),
        },
        "privacy": {
            "remote_image_urls_stripped": not include_public_image_urls,
            "contains_public_image_urls": include_public_image_urls,
            "safe_to_commit": include_public_image_urls,
        },
    }


def count_matches(matches: list[dict], confidence: str) -> int:
    return sum(1 for match in matches if match["confidence"] == confidence)


def normalize_match_key(value: str) -> str:
    return re.sub(r"\s+", " ", clean_text(value).lower()).strip()


if __name__ == "__main__":
    raise SystemExit(main())
