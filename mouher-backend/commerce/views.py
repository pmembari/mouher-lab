from __future__ import annotations

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .auth import require_internal_token
from .http import error_response, json_response, parse_json_body, positive_int, query_params
from .medusa import MedusaAPIError
from .notifications import (
    loyalty_push_config,
    register_loyalty_push_subscription,
    send_loyalty_push_notification,
)
from .services import (
    CommerceServices,
    add_cart_item,
    complete_checkout,
    create_cart,
    health_payload,
    list_admin_resource,
    list_storefront_products,
    prepare_payment,
    retrieve_admin_resource,
    retrieve_storefront_product,
)


@require_GET
def health(_request: HttpRequest) -> JsonResponse:
    return json_response(health_payload())


@csrf_exempt
@require_POST
def cart_create(request: HttpRequest) -> JsonResponse:
    try:
        return json_response(create_cart(parse_json_body(request)), status=201)
    except Exception as error:
        return error_response(error)


@csrf_exempt
@require_POST
def cart_add_item(request: HttpRequest, cart_id: str) -> JsonResponse:
    try:
        return json_response(add_cart_item(cart_id, parse_json_body(request)))
    except Exception as error:
        return error_response(error)


@csrf_exempt
@require_POST
def checkout_prepare_payment(request: HttpRequest, cart_id: str) -> JsonResponse:
    try:
        return json_response(prepare_payment(cart_id, parse_json_body(request)))
    except Exception as error:
        return error_response(error)


@csrf_exempt
@require_POST
def checkout_complete(request: HttpRequest, cart_id: str) -> JsonResponse:
    try:
        return json_response(complete_checkout(cart_id))
    except Exception as error:
        return error_response(error)


@require_GET
def storefront_products(request: HttpRequest) -> JsonResponse:
    try:
        return json_response(list_storefront_products(query_params(request)))
    except Exception as error:
        return error_response(error)


@require_GET
def storefront_product_detail(request: HttpRequest, product_id: str) -> JsonResponse:
    try:
        return json_response(
            retrieve_storefront_product(product_id, query_params(request))
        )
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def warehouse_stock_locations(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        payload = services.warehouse.list_stock_locations(
            limit=positive_int(request.GET.get("limit"), 50),
            offset=positive_int(request.GET.get("offset"), 0, maximum=100000),
        )
        return json_response(payload)
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def warehouse_inventory(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        payload = services.warehouse.list_inventory(
            limit=positive_int(request.GET.get("limit"), 50),
            offset=positive_int(request.GET.get("offset"), 0, maximum=100000),
            sku=request.GET.get("sku", ""),
            q=request.GET.get("q", ""),
        )
        return json_response(payload)
    except Exception as error:
        return error_response(error)


@csrf_exempt
@require_internal_token
@require_POST
def warehouse_inventory_levels(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(services.warehouse.batch_levels(parse_json_body(request)))
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_orders(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(list_admin_resource(services.orders, query_params(request)))
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_order_detail(request: HttpRequest, order_id: str) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(
            retrieve_admin_resource(services.orders, order_id, query_params(request))
        )
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_products(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(list_admin_resource(services.products, query_params(request)))
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_product_detail(request: HttpRequest, product_id: str) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(
            retrieve_admin_resource(services.products, product_id, query_params(request))
        )
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_customers(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(list_admin_resource(services.customers, query_params(request)))
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_customer_detail(request: HttpRequest, customer_id: str) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(
            retrieve_admin_resource(services.customers, customer_id, query_params(request))
        )
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_promotions(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(list_admin_resource(services.promotions, query_params(request)))
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_promotion_detail(request: HttpRequest, promotion_id: str) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(
            retrieve_admin_resource(services.promotions, promotion_id, query_params(request))
        )
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_price_lists(request: HttpRequest) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(list_admin_resource(services.price_lists, query_params(request)))
    except Exception as error:
        return error_response(error)


@require_internal_token
@require_GET
def admin_price_list_detail(request: HttpRequest, price_list_id: str) -> JsonResponse:
    try:
        services = CommerceServices.default()
        return json_response(
            retrieve_admin_resource(
                services.price_lists,
                price_list_id,
                query_params(request),
            )
        )
    except Exception as error:
        return error_response(error)


@require_GET
def loyalty_push_public_config(_request: HttpRequest) -> JsonResponse:
    return json_response(loyalty_push_config())


@csrf_exempt
@require_POST
def loyalty_push_subscribe(request: HttpRequest) -> JsonResponse:
    try:
        return json_response(
            register_loyalty_push_subscription(
                parse_json_body(request),
                user_agent=request.headers.get("User-Agent", ""),
            ),
            status=201,
        )
    except Exception as error:
        return error_response(error)


@csrf_exempt
@require_internal_token
@require_POST
def loyalty_push_notify(request: HttpRequest) -> JsonResponse:
    try:
        return json_response(send_loyalty_push_notification(parse_json_body(request)))
    except Exception as error:
        return error_response(error)


@csrf_exempt
@require_POST
def payment_webhook(request: HttpRequest) -> JsonResponse:
    try:
        expected = getattr(settings, "MOUHER_PAYMENT_WEBHOOK_SECRET", "")

        if expected and request.headers.get("X-Mouher-Webhook-Secret") != expected:
            return json_response({"error": {"message": "Invalid webhook secret."}}, status=401)

        if not expected:
            raise_error = MedusaAPIError(503, "Payment webhook secret is not configured.")
            return error_response(raise_error)

        payload = parse_json_body(request)

        return json_response(
            {
                "received": True,
                "event": payload.get("type") or payload.get("event"),
                "note": (
                    "Payment authorization, capture, and refunds should be handled by the "
                    "Medusa payment provider webhook. This endpoint is for Mouher "
                    "operations notifications only."
                ),
            },
            status=202,
        )
    except Exception as error:
        return error_response(error)
