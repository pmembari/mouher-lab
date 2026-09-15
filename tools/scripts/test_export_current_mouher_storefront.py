from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

MODULE_PATH = SCRIPT_DIR / "export_current_mouher_storefront.py"
SPEC = importlib.util.spec_from_file_location("export_current_mouher_storefront", MODULE_PATH)
export_current_mouher_storefront = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(export_current_mouher_storefront)


class ExportCurrentMouherStorefrontTest(unittest.TestCase):
    def test_name_markers_do_not_create_gendered_collections(self):
        products = [
            {
                "live_id": 1,
                "name": "Porto linen shirt(m)",
                "handle": "porto-linen-shirt",
                "price": "1000",
                "compare_at_price": "",
                "listing_stock": 5,
                "colors": [],
                "image_url": "",
            },
            {
                "live_id": 2,
                "name": "Small tee(f)",
                "handle": "small-tee",
                "price": "1000",
                "compare_at_price": "",
                "listing_stock": 5,
                "colors": [],
                "image_url": "",
            },
        ]

        catalog = export_current_mouher_storefront.build_catalog(products, [], [], "IRR")

        self.assertEqual(
            {product["collection"] for product in catalog["products"]},
            {"Unisex"},
        )
        self.assertEqual(catalog["products"][0]["name"], "Porto linen shirt")
        self.assertEqual(catalog["products"][0]["sizes"], ["M"])
        self.assertEqual(
            {collection["slug"] for collection in catalog["collections"]},
            {"unisex"},
        )


if __name__ == "__main__":
    unittest.main()
