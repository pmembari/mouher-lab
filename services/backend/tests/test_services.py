from __future__ import annotations

import unittest
from dataclasses import dataclass, field
from unittest.mock import patch

from services.backend.commerce.medusa import MedusaAPIError
from services.backend.commerce.services import (
    CommerceServices,
    choose_payment_provider,
    complete_checkout,
    prepare_payment,
)


@dataclass
class FakeCartRepository:
    completed_response: dict = field(
        default_factory=lambda: {"type": "order", "order": {"id": "order_123"}}
    )

    def retrieve_for_checkout(self, cart_id):
        return {"cart": {"id": cart_id, "region_id": "reg_123"}}

    def complete(self, cart_id):
        return self.completed_response


@dataclass
class FakePaymentRepository:
    created_collection: bool = False
    initialized_session: bool = False

    def list_providers(self, region_id):
        return {
            "payment_providers": [
                {"id": "pp_system_default"},
                {"id": "pp_stripe_stripe"},
            ]
        }

    def create_collection(self, cart_id):
        self.created_collection = True
        return {"payment_collection": {"id": "paycol_123", "payment_sessions": []}}

    def initialize_session(self, payment_collection_id, provider_id):
        self.initialized_session = True
        return {
            "payment_collection": {
                "id": payment_collection_id,
                "payment_sessions": [
                    {
                        "id": "payses_123",
                        "provider_id": provider_id,
                        "is_selected": True,
                    }
                ],
            }
        }


@dataclass
class FakeWarehouseRepository:
    pass


class ServiceTests(unittest.TestCase):
    def test_prepare_payment_creates_collection_and_session(self):
        services = CommerceServices(
            cart=FakeCartRepository(),
            payment=FakePaymentRepository(),
            warehouse=FakeWarehouseRepository(),
        )

        with patch("commerce.services.get_setting", return_value="pp_system_default"):
            result = prepare_payment("cart_123", {}, services)

        self.assertEqual(result["provider_id"], "pp_system_default")
        self.assertEqual(result["payment_collection"]["id"], "paycol_123")
        self.assertEqual(result["payment_session"]["id"], "payses_123")
        self.assertTrue(services.payment.created_collection)
        self.assertTrue(services.payment.initialized_session)

    def test_choose_payment_provider_rejects_disabled_provider(self):
        with self.assertRaises(MedusaAPIError) as context:
            choose_payment_provider("pp_missing", [{"id": "pp_system_default"}])

        self.assertEqual(context.exception.status_code, 400)

    def test_complete_checkout_marks_order_result_as_clearable(self):
        services = CommerceServices(
            cart=FakeCartRepository(),
            payment=FakePaymentRepository(),
            warehouse=FakeWarehouseRepository(),
        )

        result = complete_checkout("cart_123", services)

        self.assertEqual(result["type"], "order")
        self.assertTrue(result["clear_cart"])


if __name__ == "__main__":
    unittest.main()
