from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import patch

from django.test import TestCase, override_settings


class FakeAdminRepository:
    def __init__(self, resource_key: str, detail_key: str, rows: list[dict]):
        self.resource_key = resource_key
        self.detail_key = detail_key
        self.rows = rows

    def list(self, query=None):
        return {
            self.resource_key: self.rows,
            "limit": int((query or {}).get("limit", 50)),
            "offset": int((query or {}).get("offset", 0)),
            "count": len(self.rows),
        }

    def retrieve(self, resource_id, query=None):
        return {self.detail_key: {"id": resource_id}}


class FakeWarehouseRepository:
    def list_inventory(self, *, limit=50, offset=0, sku="", q=""):
        return {
            "inventory_items": [{"id": "iitem_1", "sku": sku or "COAT-001"}],
            "limit": limit,
            "offset": offset,
            "count": 1,
        }

    def list_stock_locations(self, *, limit=50, offset=0):
        return {
            "stock_locations": [{"id": "sloc_1", "name": "Main warehouse"}],
            "limit": limit,
            "offset": offset,
            "count": 1,
        }


@override_settings(MOUHER_INTERNAL_API_TOKEN="owner-secret")
class OwnerAPIContractTests(TestCase):
    def test_protected_errors_include_machine_readable_code(self):
        response = self.client.get("/api/commerce/admin/products/")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["error"]["code"], "unauthorized")

    @patch("commerce.views.CommerceServices.default")
    def test_products_list_uses_dashboard_list_envelope(self, default_services):
        default_services.return_value = SimpleNamespace(
            products=FakeAdminRepository(
                "products",
                "product",
                [{"id": "prod_1", "title": "Mouher Coat"}],
            )
        )

        response = self.client.get(
            "/api/commerce/admin/products/?limit=25&offset=50",
            HTTP_X_MOUHER_INTERNAL_TOKEN="owner-secret",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {
                "data": [{"id": "prod_1", "title": "Mouher Coat"}],
                "meta": {"limit": 25, "offset": 50, "count": 1},
            },
        )

    @patch("commerce.views.CommerceServices.default")
    def test_product_detail_uses_dashboard_detail_envelope(self, default_services):
        default_services.return_value = SimpleNamespace(
            products=FakeAdminRepository("products", "product", [])
        )

        response = self.client.get(
            "/api/commerce/admin/products/prod_1/",
            HTTP_X_MOUHER_INTERNAL_TOKEN="owner-secret",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"data": {"id": "prod_1"}})

    @patch("commerce.views.CommerceServices.default")
    def test_orders_list_uses_dashboard_list_envelope(self, default_services):
        default_services.return_value = SimpleNamespace(
            orders=FakeAdminRepository(
                "orders",
                "order",
                [{"id": "order_1", "display_id": 1001}],
            )
        )

        response = self.client.get(
            "/api/commerce/admin/orders/",
            HTTP_X_MOUHER_INTERNAL_TOKEN="owner-secret",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"][0]["id"], "order_1")
        self.assertEqual(response.json()["meta"], {"limit": 50, "offset": 0, "count": 1})

    @patch("commerce.views.CommerceServices.default")
    def test_inventory_list_uses_dashboard_list_envelope(self, default_services):
        default_services.return_value = SimpleNamespace(warehouse=FakeWarehouseRepository())

        response = self.client.get(
            "/api/commerce/warehouse/inventory/?sku=COAT-001",
            HTTP_X_MOUHER_INTERNAL_TOKEN="owner-secret",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["data"][0]["sku"], "COAT-001")
        self.assertEqual(response.json()["meta"], {"limit": 50, "offset": 0, "count": 1})

