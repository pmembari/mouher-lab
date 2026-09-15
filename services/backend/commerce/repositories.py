from __future__ import annotations

from dataclasses import dataclass

from .medusa import JsonObject, MedusaClient


@dataclass
class AdminResourceRepository:
    client: MedusaClient
    resource_path: str

    def list(self, query: JsonObject | None = None) -> JsonObject:
        return self.client.list_admin_resource(self.resource_path, query=query)

    def retrieve(self, resource_id: str, query: JsonObject | None = None) -> JsonObject:
        return self.client.retrieve_admin_resource(
            self.resource_path,
            resource_id,
            query=query,
        )


@dataclass
class CartRepository:
    client: MedusaClient

    def create(self, *, email: str = "", items: list[JsonObject] | None = None) -> JsonObject:
        return self.client.create_cart(email=email, items=items)

    def retrieve_for_checkout(self, cart_id: str) -> JsonObject:
        return self.client.retrieve_cart(
            cart_id,
            fields="id,email,region_id,total,currency_code,*items,*payment_collection.payment_sessions",
        )

    def add_item(self, cart_id: str, variant_id: str, quantity: int) -> JsonObject:
        return self.client.add_line_item(cart_id, variant_id, quantity)

    def complete(self, cart_id: str) -> JsonObject:
        return self.client.complete_cart(cart_id)


@dataclass
class StorefrontRepository:
    client: MedusaClient

    def list_products(self, query: JsonObject | None = None) -> JsonObject:
        return self.client.list_store_products(query=query)

    def retrieve_product(
        self,
        product_id: str,
        query: JsonObject | None = None,
    ) -> JsonObject:
        return self.client.retrieve_store_product(product_id, query=query)


@dataclass
class PaymentRepository:
    client: MedusaClient

    def list_providers(self, region_id: str) -> JsonObject:
        return self.client.list_payment_providers(region_id)

    def create_collection(self, cart_id: str) -> JsonObject:
        return self.client.create_payment_collection(cart_id)

    def initialize_session(
        self,
        payment_collection_id: str,
        provider_id: str,
    ) -> JsonObject:
        return self.client.initialize_payment_session(payment_collection_id, provider_id)


@dataclass
class WarehouseRepository:
    client: MedusaClient

    def list_stock_locations(self, *, limit: int = 50, offset: int = 0) -> JsonObject:
        return self.client.list_stock_locations(limit=limit, offset=offset)

    def list_inventory(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        sku: str = "",
        q: str = "",
    ) -> JsonObject:
        return self.client.list_inventory_items(limit=limit, offset=offset, sku=sku, q=q)

    def batch_levels(self, payload: JsonObject) -> JsonObject:
        return self.client.batch_inventory_levels(
            create=payload.get("create"),
            update=payload.get("update"),
            delete=payload.get("delete"),
            force=bool(payload.get("force")),
        )
