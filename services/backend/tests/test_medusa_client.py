from __future__ import annotations

import json
import unittest

from services.backend.commerce.medusa import MedusaClient, MedusaSettings, normalize_cart_items


class RecordingTransport:
    def __init__(self, payload=None):
        self.calls = []
        self.payload = payload or {"cart": {"id": "cart_123"}}

    def __call__(self, method, url, headers, body, timeout_seconds):
        self.calls.append(
            {
                "method": method,
                "url": url,
                "headers": headers,
                "body": json.loads(body.decode("utf-8")) if body else None,
                "timeout_seconds": timeout_seconds,
            }
        )
        return 200, self.payload


class MedusaClientTests(unittest.TestCase):
    def test_create_cart_uses_store_headers_and_region(self):
        transport = RecordingTransport()
        client = MedusaClient(
            MedusaSettings(
                backend_url="https://medusa.example.test",
                publishable_key="pk_test",
                region_id="reg_123",
                country_code="it",
            ),
            transport=transport,
        )

        response = client.create_cart(
            email="client@example.test",
            items=[{"variant_id": "var_123", "quantity": 2}],
        )

        self.assertEqual(response["cart"]["id"], "cart_123")
        self.assertEqual(transport.calls[0]["method"], "POST")
        self.assertEqual(
            transport.calls[0]["url"],
            "https://medusa.example.test/store/carts",
        )
        self.assertEqual(transport.calls[0]["headers"]["x-publishable-api-key"], "pk_test")
        self.assertEqual(transport.calls[0]["body"]["region_id"], "reg_123")
        self.assertEqual(transport.calls[0]["body"]["country_code"], "it")
        self.assertEqual(
            transport.calls[0]["body"]["items"],
            [{"variant_id": "var_123", "quantity": 2}],
        )

    def test_admin_inventory_level_batch_uses_admin_token(self):
        transport = RecordingTransport({"updated": [{"id": "ilvl_123"}]})
        client = MedusaClient(
            MedusaSettings(
                backend_url="https://medusa.example.test/",
                publishable_key="pk_test",
                admin_api_token="sk_test",
            ),
            transport=transport,
        )

        response = client.batch_inventory_levels(
            update=[
                {
                    "id": "ilvl_123",
                    "stocked_quantity": 12,
                }
            ],
        )

        self.assertEqual(response["updated"][0]["id"], "ilvl_123")
        self.assertEqual(
            transport.calls[0]["url"],
            "https://medusa.example.test/admin/inventory-items/location-levels/batch",
        )
        self.assertEqual(transport.calls[0]["headers"]["Authorization"], "Basic sk_test")

    def test_list_admin_resource_forwards_query_params(self):
        transport = RecordingTransport({"orders": []})
        client = MedusaClient(
            MedusaSettings(
                backend_url="https://medusa.example.test",
                publishable_key="pk_test",
                admin_api_token="sk_test",
            ),
            transport=transport,
        )

        response = client.list_admin_resource(
            "/admin/orders",
            query={"limit": 20, "offset": 40, "status": "completed"},
        )

        self.assertEqual(response["orders"], [])
        self.assertEqual(
            transport.calls[0]["url"],
            "https://medusa.example.test/admin/orders?limit=20&offset=40&status=completed",
        )

    def test_retrieve_admin_resource_url_encodes_id(self):
        transport = RecordingTransport({"product": {"id": "prod_123"}})
        client = MedusaClient(
            MedusaSettings(
                backend_url="https://medusa.example.test",
                publishable_key="pk_test",
                admin_api_token="sk_test",
            ),
            transport=transport,
        )

        client.retrieve_admin_resource("/admin/products", "prod_123")

        self.assertEqual(
            transport.calls[0]["url"],
            "https://medusa.example.test/admin/products/prod_123",
        )

    def test_normalize_cart_items_ignores_missing_variants(self):
        self.assertEqual(
            normalize_cart_items(
                [
                    {"variant_id": " var_123 ", "quantity": 0},
                    {"quantity": 2},
                    {"variant_id": "var_456", "quantity": 3},
                ]
            ),
            [
                {"variant_id": "var_123", "quantity": 1},
                {"variant_id": "var_456", "quantity": 3},
            ],
        )


if __name__ == "__main__":
    unittest.main()
