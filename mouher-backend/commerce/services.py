from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from django.conf import settings as django_settings
from django.core.exceptions import ImproperlyConfigured

from .medusa import JsonObject, MedusaAPIError, MedusaClient, parse_quantity
from .repositories import (
    AdminResourceRepository,
    CartRepository,
    PaymentRepository,
    StorefrontRepository,
    WarehouseRepository,
)


@dataclass
class CommerceServices:
    cart: CartRepository
    payment: PaymentRepository
    warehouse: WarehouseRepository
    storefront: StorefrontRepository | None = None
    orders: AdminResourceRepository | None = None
    products: AdminResourceRepository | None = None
    customers: AdminResourceRepository | None = None
    promotions: AdminResourceRepository | None = None
    price_lists: AdminResourceRepository | None = None

    @classmethod
    def default(cls) -> "CommerceServices":
        client = MedusaClient()
        return cls(
            cart=CartRepository(client),
            payment=PaymentRepository(client),
            warehouse=WarehouseRepository(client),
            storefront=StorefrontRepository(client),
            orders=AdminResourceRepository(client, "/admin/orders"),
            products=AdminResourceRepository(client, "/admin/products"),
            customers=AdminResourceRepository(client, "/admin/customers"),
            promotions=AdminResourceRepository(client, "/admin/promotions"),
            price_lists=AdminResourceRepository(client, "/admin/price-lists"),
        )


def health_payload(client: MedusaClient | None = None) -> JsonObject:
    client = client or MedusaClient()

    return {
        "ok": True,
        "medusa": {
            "backend_url": client.config.backend_url,
            "store_configured": client.is_store_configured,
            "admin_configured": client.is_admin_configured,
            "region_id": client.config.region_id,
            "country_code": client.config.country_code,
            "currency_code": client.config.currency_code,
        },
    }


def create_cart(payload: JsonObject, services: CommerceServices | None = None) -> JsonObject:
    services = services or CommerceServices.default()
    items = payload.get("items") or []

    if not isinstance(items, list):
        raise MedusaAPIError(400, "items must be a list.")

    cart_response = services.cart.create(
        email=str(payload.get("email") or "").strip(),
        items=items,
    )

    return {"cart": cart_response.get("cart", cart_response)}


def add_cart_item(
    cart_id: str,
    payload: JsonObject,
    services: CommerceServices | None = None,
) -> JsonObject:
    services = services or CommerceServices.default()
    variant_id = str(payload.get("variant_id") or "").strip()

    if not variant_id:
        raise MedusaAPIError(400, "variant_id is required.")

    cart_response = services.cart.add_item(
        cart_id,
        variant_id,
        parse_quantity(payload.get("quantity")),
    )

    return {"cart": cart_response.get("cart", cart_response)}


def prepare_payment(
    cart_id: str,
    payload: JsonObject,
    services: CommerceServices | None = None,
) -> JsonObject:
    services = services or CommerceServices.default()
    cart = unwrap("cart", services.cart.retrieve_for_checkout(cart_id))
    region_id = cart.get("region_id") or get_setting("MEDUSA_REGION_ID", "")

    if not region_id:
        raise MedusaAPIError(
            409,
            "Cart has no region_id. Create the cart with a Medusa region first.",
        )

    providers_payload = services.payment.list_providers(region_id)
    providers = providers_payload.get("payment_providers", [])
    provider_id = choose_payment_provider(payload.get("provider_id"), providers)
    payment_collection = cart.get("payment_collection")

    if not payment_collection:
        created = services.payment.create_collection(cart_id)
        payment_collection = unwrap("payment_collection", created)

    initialized = services.payment.initialize_session(payment_collection["id"], provider_id)
    payment_collection = unwrap("payment_collection", initialized)

    return {
        "cart_id": cart_id,
        "provider_id": provider_id,
        "payment_collection": payment_collection,
        "payment_session": selected_payment_session(payment_collection, provider_id),
    }


def complete_checkout(
    cart_id: str,
    services: CommerceServices | None = None,
) -> JsonObject:
    services = services or CommerceServices.default()
    result = services.cart.complete(cart_id)

    if result.get("type") == "order":
        return {
            "type": "order",
            "order": result.get("order"),
            "clear_cart": True,
        }

    return {
        "type": "cart",
        "cart": result.get("cart", result),
        "error": result.get("error") or "Cart completion failed.",
        "clear_cart": False,
    }


def list_storefront_products(
    query: JsonObject | None = None,
    services: CommerceServices | None = None,
) -> JsonObject:
    services = services or CommerceServices.default()

    if services.storefront is None:
        raise MedusaAPIError(503, "Storefront product API is not configured.")

    payload = services.storefront.list_products(storefront_product_query(query or {}))
    payload["source"] = "medusa"

    currency_code = get_setting("MEDUSA_CURRENCY_CODE", "")
    if currency_code and "currency_code" not in payload:
        payload["currency_code"] = currency_code

    return payload


def retrieve_storefront_product(
    product_id: str,
    query: JsonObject | None = None,
    services: CommerceServices | None = None,
) -> JsonObject:
    services = services or CommerceServices.default()

    if services.storefront is None:
        raise MedusaAPIError(503, "Storefront product API is not configured.")

    payload = services.storefront.retrieve_product(
        product_id,
        storefront_product_query(query or {}, include_limit=False),
    )
    payload["source"] = "medusa"

    return payload


def storefront_product_query(
    query: JsonObject,
    *,
    include_limit: bool = True,
) -> JsonObject:
    next_query = dict(query)
    settings_map = {
        "fields": "MOUHER_STOREFRONT_PRODUCT_FIELDS",
        "region_id": "MEDUSA_REGION_ID",
        "country_code": "MEDUSA_COUNTRY_CODE",
    }

    if include_limit and not next_query.get("limit"):
        limit = get_setting("MOUHER_STOREFRONT_PRODUCT_LIMIT", "")
        if limit:
            next_query["limit"] = limit

    for query_key, setting_name in settings_map.items():
        if next_query.get(query_key):
            continue

        setting_value = get_setting(setting_name, "")
        if setting_value:
            next_query[query_key] = setting_value

    return next_query


def list_admin_resource(
    repository: AdminResourceRepository | None,
    query: JsonObject | None = None,
) -> JsonObject:
    if repository is None:
        raise MedusaAPIError(503, "Medusa Admin resource is not configured.")

    return repository.list(query=query or {})


def owner_list_response(payload: JsonObject, resource_key: str) -> JsonObject:
    data = payload.get(resource_key, [])
    if not isinstance(data, list):
        data = []

    meta = {
        "limit": int_or_zero(payload.get("limit")),
        "offset": int_or_zero(payload.get("offset")),
        "count": int_or_zero(payload.get("count", len(data))),
    }

    return {"data": data, "meta": meta}


def owner_detail_response(payload: JsonObject, resource_key: str) -> JsonObject:
    data = payload.get(resource_key, payload)
    if not isinstance(data, dict):
        data = {}

    return {"data": data}


def owner_analytics_response(payload: JsonObject) -> JsonObject:
    return {"data": payload}


def retrieve_admin_resource(
    repository: AdminResourceRepository | None,
    resource_id: str,
    query: JsonObject | None = None,
) -> JsonObject:
    if repository is None:
        raise MedusaAPIError(503, "Medusa Admin resource is not configured.")

    return repository.retrieve(resource_id, query=query or {})


def int_or_zero(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def choose_payment_provider(
    requested_provider_id: Any,
    providers: list[JsonObject],
) -> str:
    configured_default = get_setting("MOUHER_DEFAULT_PAYMENT_PROVIDER_ID", "")
    requested = str(requested_provider_id or "").strip()
    provider_ids = [provider.get("id") for provider in providers if provider.get("id")]

    if requested:
        if requested not in provider_ids:
            raise MedusaAPIError(400, "Requested payment provider is not enabled.")
        return requested

    if configured_default and configured_default in provider_ids:
        return configured_default

    if provider_ids:
        return provider_ids[0]

    raise MedusaAPIError(409, "No payment providers are enabled for this region.")


def selected_payment_session(
    payment_collection: JsonObject,
    provider_id: str,
) -> JsonObject | None:
    sessions = payment_collection.get("payment_sessions") or []

    for session in sessions:
        if session.get("provider_id") == provider_id and session.get("is_selected"):
            return session

    for session in reversed(sessions):
        if session.get("provider_id") == provider_id:
            return session

    return None


def unwrap(key: str, payload: JsonObject) -> JsonObject:
    value = payload.get(key, payload)

    return value if isinstance(value, dict) else {}


def get_setting(name: str, default: Any) -> Any:
    try:
        return getattr(django_settings, name, default)
    except ImproperlyConfigured:
        return default
