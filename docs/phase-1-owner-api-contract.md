# Phase 1 Owner API Contract

This document defines the read-only API contract for the first owner dashboard milestone. Django is the dashboard-facing API boundary. Medusa remains the source of truth for commerce data, and Medusa Admin credentials stay server-side.

## Contract Rules

- All owner endpoints require authenticated owner access. During the current development phase, protected endpoints still use `X-Mouher-Internal-Token`; this must be replaced by real owner auth before the dashboard is considered ready.
- List endpoints return `data` and `meta`.
- Detail endpoints return `data`.
- Error responses return `error.message` and `error.code`.
- List pagination uses `limit`, `offset`, and `count`.
- Query parameters accepted by Django may be passed through to Medusa only after validation or explicit allow-listing.

## Response Shapes

List response:

```json
{
  "data": [],
  "meta": {
    "limit": 50,
    "offset": 0,
    "count": 0
  }
}
```

Detail response:

```json
{
  "data": {}
}
```

Analytics response:

```json
{
  "data": {
    "range_days": 30,
    "visitors": 0,
    "events": 0,
    "account_visitors": 0,
    "funnel": {
      "product_views": 0,
      "adds": 0,
      "checkouts": 0,
      "purchases": 0
    },
    "daily": [],
    "top_products": [],
    "locations": [],
    "devices": []
  }
}
```

Error response:

```json
{
  "error": {
    "message": "Human-readable message.",
    "code": "machine_readable_code"
  }
}
```

Current error codes:

- `bad_request`
- `unauthorized`
- `forbidden`
- `not_found`
- `conflict`
- `service_unavailable`
- `upstream_error`
- `internal_error`
- `request_failed`

## Phase 1 Endpoints

### Analytics Dashboard

```text
GET /api/commerce/analytics/dashboard/?days=30
```

Returns dashboard analytics in the analytics response shape.

### Products

```text
GET /api/commerce/admin/products/?limit=50&offset=0
GET /api/commerce/admin/products/<product_id>/
```

The list endpoint returns Medusa products normalized into the list response shape. The detail endpoint returns the product object in `data`.

### Orders

```text
GET /api/commerce/admin/orders/?limit=50&offset=0
GET /api/commerce/admin/orders/<order_id>/
```

The list endpoint returns Medusa orders normalized into the list response shape. The detail endpoint returns the order object in `data`.

### Customers

```text
GET /api/commerce/admin/customers/?limit=50&offset=0
GET /api/commerce/admin/customers/<customer_id>/
```

The list endpoint returns Medusa customers normalized into the list response shape. The detail endpoint returns the customer object in `data`.

### Inventory

```text
GET /api/commerce/warehouse/inventory/?limit=50&offset=0
GET /api/commerce/warehouse/stock-locations/?limit=50&offset=0
```

Inventory and stock-location lists use the same list response shape.

## Initial Contract Tests

The first backend contract tests live in:

```text
mouher-backend/tests/test_owner_api_contracts.py
```

They currently cover:

- Protected endpoint error code.
- Products list envelope.
- Product detail envelope.
- Orders list envelope.
- Inventory list envelope.

