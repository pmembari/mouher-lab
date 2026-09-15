from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("inspect_mouher_live_site.py")
SPEC = importlib.util.spec_from_file_location("inspect_mouher_live_site", MODULE_PATH)
inspect_mouher_live_site = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(inspect_mouher_live_site)


class InspectMouherLiveSiteTest(unittest.TestCase):
    def test_extracts_inertia_json(self):
        page = inspect_mouher_live_site.extract_inertia_page_json(
            """
            <html><body>
              <script data-page="app" type="application/json">{"props":{"products":{"data":[]}}}</script>
            </body></html>
            """
        )

        self.assertEqual(page["props"]["products"]["data"], [])

    def test_sanitizes_product_and_strips_raw_image_url(self):
        product = inspect_mouher_live_site.sanitize_products(
            [
                {
                    "id": 396,
                    "name": "پیراهن اسلپ",
                    "slug": "slap-shirt-brown",
                    "price": "27040000.00",
                    "compare_at_price": "33800000.00",
                    "image": "https://cdn.example.test/tenant_2/products/396/file.webp",
                    "track_inventory": True,
                    "listing_stock": 10,
                    "colors": [{"label": "مشکی", "hex": "#000000"}],
                }
            ],
            page=1,
        )[0]

        self.assertNotIn("image", product)
        self.assertEqual(product["image_filename_hint"], "file.webp")
        self.assertEqual(product["image_product_id_hint"], "396")
        self.assertEqual(product["image_source"], "remote_url_stripped")


if __name__ == "__main__":
    unittest.main()
