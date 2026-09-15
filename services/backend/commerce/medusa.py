from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Callable

from django.conf import settings as django_settings


JsonObject = dict[str, Any]
Transport = Callable[[str, str, dict[str, str], bytes | None, float], tuple[int, Any]]


class MedusaAPIError(RuntimeError):
    def __init__(self, status_code: int, message: str, payload: Any | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


@dataclass(frozen=True)
class MedusaSettings:
    backend_url: str
    publishable_key: str
    region_id: str = ""
    country_code: str = ""
    currency_code: str = ""
    admin_api_token: str = ""
    admin_bearer_token: str = ""
    timeout_seconds: float = 15

    @classmethod
    def from_django_settings(cls) -> "MedusaSettings":
        return cls(
            backend_url=getattr(django_settings, "MEDUSA_BACKEND_URL", ""),
            publishable_key=getattr(django_settings, "MEDUSA_PUBLISHABLE_KEY", ""),
            region_id=getattr(django_settings, "MEDUSA_REGION_ID", ""),
            country_code=getattr(django_settings, "MEDUSA_COUNTRY_CODE", ""),
            currency_code=getattr(django_settings, "MEDUSA_CURRENCY_CODE", ""),
            admin_api_token=getattr(django_settings, "MEDUSA_ADMIN_API_TOKEN", ""),
            admin_bearer_token=getattr(django_settings, "MEDUSA_ADMIN_BEARER_TOKEN", ""),
            timeout_seconds=getattr(
                django_settings,
                "MEDUSA_REQUEST_TIMEOUT_SECONDS",
                15,
            ),
        )


class MedusaClient:
    def __init__(
        self,
        config: MedusaSettings | None = None,
        transport: Transport | None = None,
    ):
        self.config = config or MedusaSettings.from_django_settings()
        self.transport = transport or urllib_transport

    @property
    def is_store_configured(self) -> bool:
        return bool(self.config.backend_url and self.config.publishable_key)

    @property
    def is_admin_configured(self) -> bool:
        return bool(
            self.config.backend_url
            and (self.config.admin_api_token or self.config.admin_bearer_token)
        )

    def create_cart(
        self,
        *,
        email: str = "",
        items: list[JsonObject] | None = None,
        metadata: JsonObject | None = None,
    ) -> JsonObject:
        body: JsonObject = {
            "items": normalize_cart_items(items or []),
            "context": {"source": "mouher-django"},
        }

        if self.config.region_id:
            body["region_id"] = self.config.region_id
        if self.config.country_code:
            body["country_code"] = self.config.country_code
        if not self.config.region_id and not self.config.country_code:
            raise MedusaAPIError(
                409,
                "Configure MEDUSA_REGION_ID or MEDUSA_COUNTRY_CODE before creating carts.",
            )
        if email:
            body["email"] = email
        if metadata:
            body["metadata"] = metadata

        return self.store_request("POST", "/store/carts", body)

    def retrieve_cart(self, cart_id: str, *, fields: str = "") -> JsonObject:
        query = {"fields": fields} if fields else None
        return self.store_request("GET", f"/store/carts/{cart_id}", query=query)

    def add_line_item(self, cart_id: str, variant_id: str, quantity: int = 1) -> JsonObject:
        return self.store_request(
            "POST",
            f"/store/carts/{cart_id}/line-items",
            {"variant_id": variant_id, "quantity": max(1, int(quantity))},
        )

    def list_payment_providers(self, region_id: str) -> JsonObject:
        return self.store_request(
            "GET",
            "/store/payment-providers",
            query={"region_id": region_id},
        )

    def create_payment_collection(self, cart_id: str) -> JsonObject:
        return self.store_request(
            "POST",
            "/store/payment-collections",
            {"cart_id": cart_id},
        )

    def initialize_payment_session(
        self,
        payment_collection_id: str,
        provider_id: str,
    ) -> JsonObject:
        return self.store_request(
            "POST",
            f"/store/payment-collections/{payment_collection_id}/payment-sessions",
            {"provider_id": provider_id},
        )

    def complete_cart(self, cart_id: str) -> JsonObject:
        return self.store_request("POST", f"/store/carts/{cart_id}/complete", {})

    def list_store_products(self, *, query: JsonObject | None = None) -> JsonObject:
        return self.store_request("GET", "/store/products", query=query)

    def retrieve_store_product(
        self,
        product_id: str,
        *,
        query: JsonObject | None = None,
    ) -> JsonObject:
        clean_id = urllib.parse.quote(str(product_id).strip(), safe="")

        if not clean_id:
            raise MedusaAPIError(400, "Product id is required.")

        return self.store_request("GET", f"/store/products/{clean_id}", query=query)

    def list_stock_locations(self, *, limit: int = 50, offset: int = 0) -> JsonObject:
        return self.admin_request(
            "GET",
            "/admin/stock-locations",
            query={"limit": limit, "offset": offset},
        )

    def retrieve_stock_location(self, location_id: str) -> JsonObject:
        return self.admin_request("GET", f"/admin/stock-locations/{location_id}")

    def list_inventory_items(
        self,
        *,
        limit: int = 50,
        offset: int = 0,
        sku: str = "",
        q: str = "",
    ) -> JsonObject:
        query: JsonObject = {
            "limit": limit,
            "offset": offset,
            "fields": "*location_levels",
        }
        if sku:
            query["sku"] = sku
        if q:
            query["q"] = q

        return self.admin_request("GET", "/admin/inventory-items", query=query)

    def batch_inventory_levels(
        self,
        *,
        create: list[JsonObject] | None = None,
        update: list[JsonObject] | None = None,
        delete: list[str] | None = None,
        force: bool = False,
    ) -> JsonObject:
        body: JsonObject = {}
        if create is not None:
            body["create"] = create
        if update is not None:
            body["update"] = update
        if delete is not None:
            body["delete"] = delete
        if force:
            body["force"] = True

        return self.admin_request(
            "POST",
            "/admin/inventory-items/location-levels/batch",
            body,
        )

    def list_admin_resource(
        self,
        resource_path: str,
        *,
        query: JsonObject | None = None,
    ) -> JsonObject:
        return self.admin_request("GET", resource_path, query=query)

    def retrieve_admin_resource(
        self,
        resource_path: str,
        resource_id: str,
        *,
        query: JsonObject | None = None,
    ) -> JsonObject:
        clean_path = resource_path.rstrip("/")
        clean_id = urllib.parse.quote(str(resource_id).strip(), safe="")

        if not clean_id:
            raise MedusaAPIError(400, "Resource id is required.")

        return self.admin_request("GET", f"{clean_path}/{clean_id}", query=query)

    def store_request(
        self,
        method: str,
        path: str,
        body: JsonObject | None = None,
        *,
        query: JsonObject | None = None,
    ) -> JsonObject:
        if not self.is_store_configured:
            raise MedusaAPIError(503, "Medusa Store API is not configured.")

        return self.request(method, path, body, query=query, auth="store")

    def admin_request(
        self,
        method: str,
        path: str,
        body: JsonObject | None = None,
        *,
        query: JsonObject | None = None,
    ) -> JsonObject:
        if not self.is_admin_configured:
            raise MedusaAPIError(503, "Medusa Admin API is not configured.")

        return self.request(method, path, body, query=query, auth="admin")

    def request(
        self,
        method: str,
        path: str,
        body: JsonObject | None,
        *,
        query: JsonObject | None = None,
        auth: str,
    ) -> JsonObject:
        encoded_body = json.dumps(body).encode("utf-8") if body is not None else None
        status_code, payload = self.transport(
            method.upper(),
            self.build_url(path, query),
            self.headers(auth),
            encoded_body,
            self.config.timeout_seconds,
        )

        if status_code >= 400:
            raise MedusaAPIError(status_code, error_message(payload), payload)

        return payload if isinstance(payload, dict) else {"data": payload}

    def build_url(self, path: str, query: JsonObject | None = None) -> str:
        base = self.config.backend_url.rstrip("/")
        url = f"{base}{path if path.startswith('/') else '/' + path}"

        if query:
            params: dict[str, Any] = {}

            for key, value in query.items():
                if value is None or value == "":
                    continue

                if isinstance(value, (list, tuple)):
                    clean_values = [
                        str(item)
                        for item in value
                        if item is not None and item != ""
                    ]
                    if clean_values:
                        params[key] = clean_values
                    continue

                params[key] = str(value)

            if params:
                url = f"{url}?{urllib.parse.urlencode(params, doseq=True)}"

        return url

    def headers(self, auth: str) -> dict[str, str]:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        if auth == "store":
            headers["x-publishable-api-key"] = self.config.publishable_key
        elif self.config.admin_bearer_token:
            headers["Authorization"] = f"Bearer {self.config.admin_bearer_token}"
        else:
            headers["Authorization"] = f"Basic {self.config.admin_api_token}"

        return headers


def normalize_cart_items(items: list[JsonObject]) -> list[JsonObject]:
    normalized = []

    for item in items:
        variant_id = str(item.get("variant_id") or "").strip()
        if not variant_id:
            continue

        normalized.append(
            {
                "variant_id": variant_id,
                "quantity": parse_quantity(item.get("quantity")),
            }
        )

    return normalized


def parse_quantity(value: Any, default: int = 1) -> int:
    try:
        quantity = int(value or default)
    except (TypeError, ValueError):
        return default

    return max(1, quantity)


def urllib_transport(
    method: str,
    url: str,
    headers: dict[str, str],
    body: bytes | None,
    timeout_seconds: float,
) -> tuple[int, Any]:
    request = urllib.request.Request(
        url,
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return response.status, parse_json_response(response.read())
    except urllib.error.HTTPError as error:
        return error.code, parse_json_response(error.read())
    except urllib.error.URLError as error:
        raise MedusaAPIError(502, f"Could not reach Medusa: {error.reason}") from error


def parse_json_response(raw_body: bytes) -> Any:
    if not raw_body:
        return {}

    try:
        return json.loads(raw_body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return raw_body.decode("utf-8", errors="replace")


def error_message(payload: Any) -> str:
    if isinstance(payload, dict):
        for key in ("message", "error", "detail"):
            if payload.get(key):
                return str(payload[key])

    return "Medusa API request failed."
