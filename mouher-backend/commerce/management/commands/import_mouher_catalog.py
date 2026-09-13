from __future__ import annotations

import json
import csv
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from commerce.models import CatalogCategory, CatalogCollection, CatalogProduct, CatalogVariant


DEFAULT_SOURCE = Path(__file__).resolve().parents[4] / "data" / "Mouher_Data" / "clean" / "catalog.clean.json"
DEFAULT_CSV_DIRECTORY = Path(__file__).resolve().parents[4] / "data" / "Mouher_Data" / "data" / "mouherwear-more"


def parse_source_datetime(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None
    return timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed


class Command(BaseCommand):
    help = "Import the cleaned Mouher catalog into Django reporting tables."

    def add_arguments(self, parser):
        parser.add_argument("--source", default=str(DEFAULT_SOURCE))
        parser.add_argument(
            "--csv-directory",
            default="",
            help="Import legacy Mouher CSV catalog exports instead of the cleaned JSON source.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        csv_directory = Path(options["csv_directory"]) if options["csv_directory"] else None
        if csv_directory:
            products = load_csv_catalog(csv_directory)
            source_label = csv_directory
        else:
            source = Path(options["source"])
            source_label = source
            if not source.exists():
                raise CommandError(f"Catalog source does not exist: {source}")

            try:
                products = json.loads(source.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as error:
                raise CommandError(f"Could not read catalog source: {error}") from error

        if not isinstance(products, list):
            raise CommandError("Catalog source must contain a JSON array of products.")

        self.import_products(products)
        self.stdout.write(self.style.SUCCESS(f"Imported Mouher catalog from {source_label}."))

    def import_products(self, products):
        category_cache = {}
        collection_cache = {}
        product_count = 0
        variant_count = 0

        for payload in products:
            product, _ = CatalogProduct.objects.update_or_create(
                legacy_id=str(payload.get("legacy_id", "")),
                defaults={
                    "upc": str(payload.get("upc") or ""),
                    "handle": str(payload.get("handle") or payload.get("legacy_id") or "")[:160],
                    "title": str(payload.get("title") or "")[:255],
                    "title_fa": str(payload.get("title_fa") or "")[:255],
                    "description_fa": str(payload.get("description_fa") or ""),
                    "is_visible": bool(payload.get("is_visible", True)),
                    "is_promotion": bool(payload.get("is_promotion", False)),
                    "source_created_at": parse_source_datetime(payload.get("created_at")),
                    "source_updated_at": parse_source_datetime(payload.get("updated_at")),
                },
            )
            product_count += 1

            categories = []
            for category_payload in payload.get("categories") or []:
                category_id = str(category_payload.get("legacy_id") or category_payload.get("slug") or "")
                category, _ = CatalogCategory.objects.update_or_create(
                    legacy_id=category_id,
                    defaults={
                        "slug": str(category_payload.get("slug") or category_id)[:160],
                        "name": str(category_payload.get("name") or "")[:255],
                        "name_fa": str(category_payload.get("name_fa") or "")[:255],
                        "is_visible": bool(category_payload.get("is_visible", True)),
                    },
                )
                category_cache[category_id] = category
                categories.append(category)
            product.categories.set(categories)

            collections = []
            for collection_payload in payload.get("collections") or []:
                collection_id = str(collection_payload.get("legacy_id") or collection_payload.get("slug") or "")
                collection, _ = CatalogCollection.objects.update_or_create(
                    legacy_id=collection_id,
                    defaults={
                        "slug": str(collection_payload.get("slug") or collection_id)[:160],
                        "title": str(collection_payload.get("title") or "")[:255],
                        "title_fa": str(collection_payload.get("title_fa") or "")[:255],
                        "description": str(collection_payload.get("description") or ""),
                        "is_visible": bool(collection_payload.get("is_visible", True)),
                    },
                )
                collection_cache[collection_id] = collection
                collections.append(collection)
            product.collections.set(collections)

            variant_ids = []
            for variant_payload in payload.get("variants") or []:
                variant_id = str(variant_payload.get("legacy_id") or "")
                CatalogVariant.objects.update_or_create(
                    legacy_id=variant_id,
                    defaults={
                        "product": product,
                        "sku": str(variant_payload.get("sku") or "")[:128],
                        "stock": int(variant_payload.get("stock") or 0),
                        "source_price": variant_payload.get("source_price"),
                        "source_discount": variant_payload.get("source_discount"),
                        "size": variant_payload.get("size") or {},
                        "color": variant_payload.get("color") or {},
                        "is_visible": bool(variant_payload.get("is_visible", True)),
                    },
                )
                variant_ids.append(variant_id)
                variant_count += 1
            CatalogVariant.objects.filter(product=product).exclude(legacy_id__in=variant_ids).delete()

        self.stdout.write(self.style.SUCCESS(
            f"Imported {product_count} products and {variant_count} variants "
            f"({len(category_cache)} categories, {len(collection_cache)} collections)."
        ))


def read_csv(directory, filename):
    path = directory / filename
    if not path.exists():
        raise CommandError(f"Required CSV does not exist: {path}")
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def truthy(value):
    return str(value or "").strip().lower() in {"1", "true", "yes", "y"}


def decimal_or_none(value):
    value = str(value or "").strip()
    return value or None


def load_csv_catalog(directory):
    if not directory.exists():
        raise CommandError(f"CSV directory does not exist: {directory}")

    categories = {row["id"]: row for row in read_csv(directory, "categories.csv")}
    collections = {row["id"]: row for row in read_csv(directory, "collections.csv")}
    variants_by_product = defaultdict(list)
    categories_by_product = defaultdict(list)
    collections_by_product = defaultdict(list)

    for row in read_csv(directory, "variants.csv"):
        variants_by_product[row["product_id"]].append(row)

    for row in read_csv(directory, "category_product.csv"):
        category = categories.get(row["category_id"])
        if category:
            categories_by_product[row["product_id"]].append(category)

    for row in read_csv(directory, "collection_product.csv"):
        collection = collections.get(row["collection_id"])
        if collection:
            collections_by_product[row["product_id"]].append(collection)

    products = []
    for row in read_csv(directory, "products.csv"):
        product_id = row["id"]
        products.append({
            "legacy_id": product_id,
            "upc": row.get("upc", ""),
            "handle": row.get("slug") or f"legacy-product-{product_id}",
            "title": row.get("name", ""),
            "title_fa": row.get("name", ""),
            "description_fa": row.get("description", ""),
            "is_visible": truthy(row.get("is_visible")),
            "is_promotion": truthy(row.get("is_promotion")),
            "created_at": row.get("created_at"),
            "updated_at": row.get("updated_at"),
            "categories": [
                {
                    "legacy_id": category["id"],
                    "slug": category.get("slug") or f"legacy-category-{category['id']}",
                    "name": category.get("name", ""),
                    "name_fa": category.get("name", ""),
                    "is_visible": truthy(category.get("is_visible")),
                }
                for category in categories_by_product[product_id]
            ],
            "collections": [
                {
                    "legacy_id": collection["id"],
                    "slug": collection.get("slug") or f"legacy-collection-{collection['id']}",
                    "title": collection.get("title", ""),
                    "title_fa": collection.get("title", ""),
                    "description": collection.get("description", ""),
                    "is_visible": truthy(collection.get("is_visible")),
                }
                for collection in collections_by_product[product_id]
            ],
            "variants": [
                {
                    "legacy_id": variant["id"],
                    "sku": variant.get("sku", ""),
                    "stock": int(variant.get("stock") or 0),
                    "source_price": decimal_or_none(variant.get("price")),
                    "source_discount": decimal_or_none(variant.get("discount")),
                    "size": {"legacy_id": variant.get("size", ""), "label": variant.get("description", "")},
                    "color": {"legacy_id": variant.get("color", "")},
                    "is_visible": truthy(variant.get("is_visible")),
                }
                for variant in variants_by_product[product_id]
            ],
        })
    return products
