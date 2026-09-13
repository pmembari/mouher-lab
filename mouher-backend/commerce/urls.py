from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.health, name="commerce-health"),
    path("analytics/events/", views.analytics_collect, name="commerce-analytics-collect"),
    path("analytics/dashboard/", views.analytics_dashboard, name="commerce-analytics-dashboard"),
    path("cart/", views.cart_create, name="commerce-cart-create"),
    path("cart/<str:cart_id>/items/", views.cart_add_item, name="commerce-cart-add-item"),
    path(
        "checkout/<str:cart_id>/payment/",
        views.checkout_prepare_payment,
        name="commerce-checkout-payment",
    ),
    path(
        "checkout/<str:cart_id>/complete/",
        views.checkout_complete,
        name="commerce-checkout-complete",
    ),
    path(
        "storefront/products/",
        views.storefront_products,
        name="commerce-storefront-products",
    ),
    path(
        "storefront/products/<str:product_id>/",
        views.storefront_product_detail,
        name="commerce-storefront-product-detail",
    ),
    path(
        "warehouse/stock-locations/",
        views.warehouse_stock_locations,
        name="commerce-warehouse-stock-locations",
    ),
    path(
        "warehouse/inventory/",
        views.warehouse_inventory,
        name="commerce-warehouse-inventory",
    ),
    path(
        "warehouse/inventory-levels/",
        views.warehouse_inventory_levels,
        name="commerce-warehouse-inventory-levels",
    ),
    path("admin/orders/", views.admin_orders, name="commerce-admin-orders"),
    path(
        "admin/orders/<str:order_id>/",
        views.admin_order_detail,
        name="commerce-admin-order-detail",
    ),
    path("admin/products/", views.admin_products, name="commerce-admin-products"),
    path(
        "admin/products/<str:product_id>/",
        views.admin_product_detail,
        name="commerce-admin-product-detail",
    ),
    path("admin/customers/", views.admin_customers, name="commerce-admin-customers"),
    path(
        "admin/customers/<str:customer_id>/",
        views.admin_customer_detail,
        name="commerce-admin-customer-detail",
    ),
    path("admin/promotions/", views.admin_promotions, name="commerce-admin-promotions"),
    path(
        "admin/promotions/<str:promotion_id>/",
        views.admin_promotion_detail,
        name="commerce-admin-promotion-detail",
    ),
    path("admin/price-lists/", views.admin_price_lists, name="commerce-admin-price-lists"),
    path(
        "admin/price-lists/<str:price_list_id>/",
        views.admin_price_list_detail,
        name="commerce-admin-price-list-detail",
    ),
    path(
        "loyalty/push/config/",
        views.loyalty_push_public_config,
        name="commerce-loyalty-push-config",
    ),
    path(
        "loyalty/push/subscriptions/",
        views.loyalty_push_subscribe,
        name="commerce-loyalty-push-subscribe",
    ),
    path(
        "loyalty/push/notifications/",
        views.loyalty_push_notify,
        name="commerce-loyalty-push-notify",
    ),
    path("webhooks/payment/", views.payment_webhook, name="commerce-payment-webhook"),
]
