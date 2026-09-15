import json
from pathlib import Path
from tempfile import TemporaryDirectory

from django.core.management import call_command
from django.test import TestCase

from services.backend.commerce.models import CatalogProduct, CatalogVariant


class CatalogImportTests(TestCase):
    def test_catalog_import_is_idempotent(self):
        payload = [{
            "legacy_id": "product-1",
            "handle": "mouher-coat",
            "title": "Mouher Coat",
            "categories": [{"legacy_id": "category-1", "slug": "coats", "name": "Coats"}],
            "collections": [{"legacy_id": "collection-1", "slug": "winter", "title": "Winter"}],
            "variants": [{"legacy_id": "variant-1", "stock": 4, "source_price": 120}],
        }]

        with TemporaryDirectory() as directory:
            source = Path(directory) / "catalog.json"
            source.write_text(json.dumps(payload), encoding="utf-8")
            call_command("import_mouher_catalog", source=str(source))
            call_command("import_mouher_catalog", source=str(source))

        self.assertEqual(CatalogProduct.objects.count(), 1)
        self.assertEqual(CatalogVariant.objects.count(), 1)
        self.assertEqual(CatalogProduct.objects.get().categories.count(), 1)
        self.assertEqual(CatalogProduct.objects.get().collections.count(), 1)

    def test_catalog_import_accepts_legacy_csv_directory(self):
        with TemporaryDirectory() as directory:
            source = Path(directory)
            (source / "products.csv").write_text(
                "id,upc,name,slug,description,is_promotion,is_visible,created_at,updated_at,drophub,attributes\n"
                "1,UPC-1,کت,coat,desc,0,1,2024-01-01 10:00:00,2024-01-02 10:00:00,,\n",
                encoding="utf-8",
            )
            (source / "variants.csv").write_text(
                "id,sku,product_id,description,size,color,price,discount,stock,is_visible,created_at,updated_at\n"
                "7,SKU-1,1,Large,100,1,1480000,0,4,1,2024-01-01 10:00:00,2024-01-02 10:00:00\n",
                encoding="utf-8",
            )
            (source / "categories.csv").write_text(
                "id,slug,position,name,parent_id,is_visible,created_at,updated_at\n"
                "2,Coats,1,کت,,1,2024-01-01 10:00:00,2024-01-02 10:00:00\n",
                encoding="utf-8",
            )
            (source / "collections.csv").write_text(
                "id,slug,position,title,description,is_visible,thumbnail,created_at,updated_at\n"
                "3,winter,1,زمستان,desc,1,,2024-01-01 10:00:00,2024-01-02 10:00:00\n",
                encoding="utf-8",
            )
            (source / "category_product.csv").write_text("category_id,product_id\n2,1\n", encoding="utf-8")
            (source / "collection_product.csv").write_text(
                "id,collection_id,product_id,position,created_at,updated_at\n1,3,1,1,,\n",
                encoding="utf-8",
            )

            call_command("import_mouher_catalog", csv_directory=str(source))

        product = CatalogProduct.objects.get()
        self.assertEqual(product.legacy_id, "1")
        self.assertEqual(product.title_fa, "کت")
        self.assertEqual(product.variants.get().source_price, 1480000)
        self.assertEqual(product.categories.get().legacy_id, "2")
