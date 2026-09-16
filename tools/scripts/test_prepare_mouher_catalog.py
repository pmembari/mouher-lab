from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory


MODULE_PATH = Path(__file__).with_name("prepare_mouher_catalog.py")
SPEC = importlib.util.spec_from_file_location("prepare_mouher_catalog", MODULE_PATH)
prepare_mouher_catalog = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(prepare_mouher_catalog)


class PrepareMouherCatalogTest(unittest.TestCase):
    def test_catalog_uses_physical_images_and_resolves_variant_values(self):
        with TemporaryDirectory() as tmp:
            source_root = Path(tmp) / "Mouher_Data"
            db_dir = source_root / "data" / "mouherwear-more"
            image_dir = source_root / "data" / "images" / "10"
            video_dir = source_root / "data" / "videos"

            db_dir.mkdir(parents=True)
            image_dir.mkdir(parents=True)
            video_dir.mkdir(parents=True)

            write(
                db_dir / "products.csv",
                """id,upc,name,slug,description,is_promotion,is_visible,created_at,updated_at,drophub,attributes
10,,پیراهن تست,Test Shirt,"line one
line two",0,1,2025-01-01,2025-01-02,,
""",
            )
            write(
                db_dir / "variants.csv",
                """id,sku,product_id,description,size,color,price,discount,stock,is_visible,created_at,updated_at
1,,10,,100011,1,1200000,0,4,1,2025-01-01,2025-01-02
""",
            )
            write(
                db_dir / "variant_values.csv",
                """id,variant_attribute_id,name,category,value
1,1,مشکی,مشکی,#212121
100011,2,فری سایز,,Free Size
""",
            )
            write(db_dir / "variant_attributes.csv", "id,name\n1,رنگ\n2,سایز\n")
            write(db_dir / "categories.csv", "id,slug,position,name,parent_id,is_visible,created_at,updated_at\n1,Shirt,1,پیراهن,,1,,\n")
            write(db_dir / "category_product.csv", "category_id,product_id\n1,10\n")
            write(db_dir / "collections.csv", "id,slug,position,title,description,is_visible,thumbnail,created_at,updated_at\n1,new,1,زنانه,,1,/deprecated.webp,,\n")
            write(db_dir / "collection_product.csv", "id,collection_id,product_id,position,created_at,updated_at\n1,1,10,1,,\n")
            write(db_dir / "product_images.csv", "id,product_id,path,type,position,created_at,updated_at\n1,10,http://deprecated/image.jpg,image,1,,\n")

            (image_dir / "2_2025_01_02.jpg").write_bytes(b"second")
            (image_dir / "1_2025_01_02.jpg").write_bytes(b"first")
            (video_dir / "2-parnian-hq.webm").write_bytes(b"video")

            catalog = prepare_mouher_catalog.build_catalog(source_root)
            product = catalog["products"][0]

            self.assertEqual(product["handle"], "test-shirt")
            self.assertEqual(product["categories"][0]["name"], "Shirts")
            self.assertEqual(product["collections"][0]["slug"], "unisex")
            self.assertEqual(product["collections"][0]["title"], "Unisex")
            self.assertEqual(product["collections"][0]["title_fa"], "یونیسکس")
            self.assertEqual(product["variants"][0]["size"]["name"], "Free Size")
            self.assertEqual(product["variants"][0]["color"]["hex"], "#212121")
            self.assertEqual(
                product["media"]["images"][0]["relative_path"],
                "data/images/10/1_2025_01_02.jpg",
            )
            self.assertEqual(product["media"]["deprecated_csv_image_rows_ignored"], 1)
            self.assertEqual(catalog["summary"]["media"]["unmatched_videos"], 1)

            storefront = prepare_mouher_catalog.build_storefront_catalog(catalog)
            self.assertIn(
                {"label": "Unisex", "label_fa": "یونیسکس", "target": "unisex"},
                storefront["navigation"],
            )
            self.assertNotIn(
                {"label": "Women", "label_fa": "زنانه", "target": "women"},
                storefront["navigation"],
            )
            self.assertEqual(storefront["collections"][0]["slug"], "unisex")
            self.assertEqual(storefront["collections"][0]["name"], "Unisex")
            self.assertEqual(storefront["collections"][0]["name_fa"], "یونیسکس")

    def test_duplicate_handles_are_made_unique(self):
        with TemporaryDirectory() as tmp:
            source_root = Path(tmp) / "Mouher_Data"
            db_dir = source_root / "data" / "mouherwear-more"
            images_root = source_root / "data" / "images"

            db_dir.mkdir(parents=True)
            (images_root / "1").mkdir(parents=True)
            (images_root / "2").mkdir(parents=True)

            write(
                db_dir / "products.csv",
                """id,upc,name,slug,description,is_promotion,is_visible,created_at,updated_at,drophub,attributes
1,,One,Same,,0,1,,,, 
2,,Two,Same,,0,1,,,, 
""",
            )
            write(db_dir / "variants.csv", "id,sku,product_id,description,size,color,price,discount,stock,is_visible,created_at,updated_at\n")
            write(db_dir / "variant_values.csv", "id,variant_attribute_id,name,category,value\n")
            write(db_dir / "variant_attributes.csv", "id,name\n")
            write(db_dir / "categories.csv", "id,slug,position,name,parent_id,is_visible,created_at,updated_at\n")
            write(db_dir / "category_product.csv", "category_id,product_id\n")
            write(db_dir / "collections.csv", "id,slug,position,title,description,is_visible,thumbnail,created_at,updated_at\n")
            write(db_dir / "collection_product.csv", "id,collection_id,product_id,position,created_at,updated_at\n")
            write(db_dir / "product_images.csv", "id,product_id,path,type,position,created_at,updated_at\n")

            (images_root / "1" / "1_2025_01_01.jpg").write_bytes(b"one")
            (images_root / "2" / "1_2025_01_01.jpg").write_bytes(b"two")

            catalog = prepare_mouher_catalog.build_catalog(source_root)

            self.assertEqual(
                [product["handle"] for product in catalog["products"]],
                ["same-1", "same-2"],
            )

    def test_medusa_import_shape_uses_only_visible_variants_for_options(self):
        with TemporaryDirectory() as tmp:
            source_root = Path(tmp) / "Mouher_Data"
            db_dir = source_root / "data" / "mouherwear-more"
            image_dir = source_root / "data" / "images" / "20"

            db_dir.mkdir(parents=True)
            image_dir.mkdir(parents=True)

            write(
                db_dir / "products.csv",
                """id,upc,name,slug,description,is_promotion,is_visible,created_at,updated_at,drophub,attributes
20,UPC-20,کت تست,Medusa Coat,Description,0,1,2025-01-01,2025-01-02,drop-legacy,legacy attrs
""",
            )
            write(
                db_dir / "variants.csv",
                """id,sku,product_id,description,size,color,price,discount,stock,is_visible,created_at,updated_at
1,SKU-VISIBLE,20,,1,10,1200000,0,7,1,2025-01-01,2025-01-02
2,SKU-HIDDEN,20,,2,20,1300000,0,99,0,2025-01-01,2025-01-02
""",
            )
            write(
                db_dir / "variant_values.csv",
                """id,variant_attribute_id,name,category,value
1,2,مدیوم,,M
2,2,لارج,,L
10,1,مشکی,مشکی,#111111
20,1,قرمز,قرمز,#cc3333
""",
            )
            write(db_dir / "variant_attributes.csv", "id,name\n1,رنگ\n2,سایز\n")
            write(db_dir / "categories.csv", "id,slug,position,name,parent_id,is_visible,created_at,updated_at\n1,Coat,1,کت,,1,,\n")
            write(db_dir / "category_product.csv", "category_id,product_id\n1,20\n")
            write(db_dir / "collections.csv", "id,slug,position,title,description,is_visible,thumbnail,created_at,updated_at\n1,fall,1,پاییز زمستان موهر,,1,,,\n")
            write(db_dir / "collection_product.csv", "id,collection_id,product_id,position,created_at,updated_at\n1,1,20,1,,\n")
            write(db_dir / "product_images.csv", "id,product_id,path,type,position,created_at,updated_at\n")
            (image_dir / "1_2025_01_02.jpg").write_bytes(b"image")

            product = prepare_mouher_catalog.build_catalog(source_root)["products"][0]

            self.assertEqual(
                product["options"],
                [
                    {"title": "Size", "values": ["M"]},
                    {"title": "Color", "values": ["مشکی"]},
                ],
            )
            self.assertEqual(
                product["medusa_import"]["variants"],
                [
                    {
                        "sku": "SKU-VISIBLE",
                        "legacy_variant_id": "1",
                        "title": "M / مشکی",
                        "options": {"Size": "M", "Color": "مشکی"},
                        "source_price": 1200000,
                        "inventory_quantity": 7,
                        "manage_inventory": True,
                        "allow_backorder": False,
                        "metadata": {"legacy_variant_id": "1"},
                    }
                ],
            )
            self.assertEqual(product["medusa_import"]["excluded_variant_ids"], ["2"])
            self.assertNotIn("legacy_drophub", product["metadata"])
            self.assertNotIn("legacy_attributes", product["metadata"])


def write(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    unittest.main()
