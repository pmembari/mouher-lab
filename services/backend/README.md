# Mouher Backend

Django companion API for the Mouher storefront. Medusa remains the commerce
system of record for catalog, carts, payment collections, payment sessions,
orders, products, inventory, customers, promotions, price lists, stock
locations, inventory levels, and reservations.

## Setup

```bash
cd services/backend
python3 -m venv .venv
. .venv/bin/activate
pip install -e .
cp .env.example .env
python3 manage.py migrate
python3 manage.py runserver 8001
```

Load the `.env` values into your shell or deployment platform before starting
Django. The default local setup uses SQLite. Set `DJANGO_DATABASE_URL` when
you want Django to use PostgreSQL from `services/db` or another separately
managed database.

## Import the Mouher catalog snapshot

The cleaned source catalog contains products, variants, categories, and
collections. Import it into Django-owned reporting tables with:

```bash
python3 manage.py migrate
python3 manage.py import_mouher_catalog
```

The command is safe to rerun: stable legacy source IDs prevent duplicate rows.
Historical orders, customers, and live inventory are not present in
`data/Mouher_Data`; those remain Medusa-owned and are read through the
protected owner API.

## Django-owned database tables

Django migrations create only Mouher operational tables in `mouher_backend`:

- owner users, roles, and user-role assignments for the future real owner auth model
- admin audit logs for protected dashboard actions
- privacy-conscious analytics events and cached daily dashboard metrics
- admin notifications, support tickets/messages, product notes, and browser push subscriptions
- catalog snapshot tables for read-only local reporting/import workflows

Medusa-owned products, orders, carts, customers, inventory, payments, refunds,
and reservations remain in Medusa and must be accessed through API adapters, not
through Django database tables.

## API

- `GET /api/commerce/health/`
- `POST /api/commerce/cart/`
- `POST /api/commerce/cart/<cart_id>/items/`
- `POST /api/commerce/checkout/<cart_id>/payment/`
- `POST /api/commerce/checkout/<cart_id>/complete/`
- `GET /api/commerce/warehouse/stock-locations/`
- `GET /api/commerce/warehouse/inventory/`
- `POST /api/commerce/warehouse/inventory-levels/`
- `GET /api/commerce/admin/orders/`
- `GET /api/commerce/admin/orders/<order_id>/`
- `GET /api/commerce/admin/products/`
- `GET /api/commerce/admin/products/<product_id>/`
- `GET /api/commerce/admin/customers/`
- `GET /api/commerce/admin/customers/<customer_id>/`
- `GET /api/commerce/admin/promotions/`
- `GET /api/commerce/admin/promotions/<promotion_id>/`
- `GET /api/commerce/admin/price-lists/`
- `GET /api/commerce/admin/price-lists/<price_list_id>/`
- `GET /api/commerce/loyalty/push/config/`
- `POST /api/commerce/loyalty/push/subscriptions/`
- `POST /api/commerce/loyalty/push/notifications/`
- `POST /api/commerce/webhooks/payment/`

Warehouse, Admin proxy, and loyalty notification-send routes require
`X-Mouher-Internal-Token`. Browser push subscription registration is public
because customers opt in from the storefront.

## Checkout Flow

Create and modify carts through Medusa Store API calls. When the customer is
ready to pay, call:

```bash
POST /api/commerce/checkout/<cart_id>/payment/
{
  "provider_id": "pp_stripe_stripe"
}
```

The backend lists providers enabled in the cart region, creates a Medusa payment
collection if needed, and initializes a Medusa payment session. The React
storefront should then render the provider UI, such as Stripe Elements. After
provider-side confirmation, call:

```bash
POST /api/commerce/checkout/<cart_id>/complete/
```

If Medusa returns `type: "order"`, clear the storefront cart id. If it returns
`type: "cart"`, show the returned error and keep the cart.

## Warehouse Flow

Warehouse endpoints are protected because they use Medusa Admin credentials.
Use them for operational tooling only:

```bash
curl http://localhost:8001/api/commerce/warehouse/inventory/ \
  -H "X-Mouher-Internal-Token: $MOUHER_INTERNAL_API_TOKEN"
```

Inventory and reservation accounting stay in Medusa. This backend only forwards
stock-location and inventory-level operations to Medusa Admin API.

## Admin Proxy

Protected Admin proxy routes expose the Medusa commerce domains Mouher needs for
owner and assistant tools:

- orders
- products
- customers
- promotions
- price lists

The proxy forwards query parameters such as `limit`, `offset`, `fields`, and
domain filters to Medusa. Keep Medusa Admin credentials server-side only.

## Loyalty Browser Push

Loyalty notifications are delivered with browser Web Push for opted-in
customers in supported browsers such as Chrome and Safari. This avoids email,
SMS, WhatsApp, and paid messaging services.

Configure:

```bash
MOUHER_WEB_PUSH_VAPID_PUBLIC_KEY=
MOUHER_WEB_PUSH_VAPID_PRIVATE_KEY=
MOUHER_WEB_PUSH_VAPID_SUBJECT=mailto:owner@mouher.com
```

The storefront reads the public key from
`GET /api/commerce/loyalty/push/config/`, registers the service worker, and
posts the browser subscription to Django.

## Production Scaling

Use separate workloads for:

- `mouher-commerce-api`: this Django API.
- `mouher-medusa-server`: Medusa HTTP Store/Admin API.
- `mouher-medusa-worker`: Medusa background jobs and subscribers.
- `services/payment`: isolated payment provider adapter.
- PostgreSQL: managed/dedicated database service, not an app pod.
- Redis: managed/dedicated cache, queue, session, and event service.

## Medusa Notes

- Store API requests require `x-publishable-api-key`.
- Admin API requests use `Authorization` and must stay server-side.
- Payment providers must be enabled in the Medusa region.
- Medusa creates reservations when a cart is completed into an order for
  managed-inventory variants.
- SnapPay or another local payment method should be implemented as a Medusa
  payment provider that calls the isolated `services/payment` adapter.

References:

- https://docs.medusajs.com/resources/storefront-development/checkout/payment
- https://docs.medusajs.com/resources/storefront-development/checkout/complete-cart
- https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider
- https://docs.medusajs.com/resources/commerce-modules/inventory/reservations-lifecycle
- https://docs.medusajs.com/resources/commerce-modules/stock-location/concepts
