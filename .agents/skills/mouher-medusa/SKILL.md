---
name: mouher-medusa
description: Develop Mouher's backend using Medusa under services/backend. Use for commerce backend architecture, custom modules, API routes, workflows, subscribers, jobs, authentication, authorization, analytics integration, notifications, audit behavior, payment orchestration, persistence, and migration away from Django. Medusa is the commerce source of truth and services/backend is the backend service boundary. Prefer Medusa-native extension points rather than recreating a Django-style BFF or duplicating commerce models.
---

# Mouher Medusa Backend

`services/backend/` is Mouher's backend service.

Its implementation is Medusa.

Do not introduce Django as a second backend.

Do not introduce a separate top-level Medusa service unless explicitly requested.

## Service Boundary

Target:

```text
services/
├── backend/
│   └── Medusa
│
└── payment/
    └── payment provider adapter
```

`services/backend/` describes responsibility, not framework identity.

Keep that path even though Medusa is the implementation.

## Architecture

Target flow:

```text
apps/storefront/
      |
      | Store API
      v
services/backend/
      |
    Medusa
      |
      +-- commerce modules
      +-- Mouher modules
      +-- workflows
      +-- API routes
      +-- subscribers
      +-- jobs
      |
      +--> PostgreSQL
      +--> Redis when needed
      +--> object storage
      |
      +--> services/payment/
```

Admin flow:

```text
Mouher dashboard / Medusa Admin
           |
           | Admin API
           | custom admin APIs
           v
     services/backend/
```

## Medusa Owns Commerce

Medusa is the source of truth for:

* products
* product variants
* options
* images
* categories
* collections
* pricing
* price lists
* promotions
* carts
* customers
* orders
* inventory
* stock locations
* reservations
* fulfillment
* shipping
* payment collections
* payment sessions
* refunds
* cancellations where supported
* regions
* currencies

Do not duplicate these as Mouher custom entities.

## Prefer Medusa-Native Extension

For functionality not provided directly by core commerce modules, consider in this order:

1. existing Medusa API/module capability
2. Medusa configuration/provider
3. workflow
4. subscriber
5. custom API route
6. custom module
7. scheduled job

Do not create custom infrastructure before checking whether Medusa already provides the required behavior.

## Custom Mouher Domains

Potential Mouher-specific domains include:

* analytics
* audit
* operational notifications
* support tickets
* product admin notes

Only create a custom module when domain-specific persistence or logic actually requires one.

Do not create modules merely for organizational symmetry.

## No Django-Style BFF

Avoid:

```text
apps/storefront/
-> custom proxy layer
-> custom adapter layer
-> Medusa API
```

when the storefront can safely use an appropriate Medusa API directly.

Preferred:

```text
storefront
-> Medusa Store API
```

and:

```text
admin/dashboard
-> Medusa Admin API
```

Use custom Mouher API routes when aggregation, custom authorization, additional data, or orchestration is genuinely necessary.

## API Design

Depend on stable APIs, not database internals.

Storefront code uses Store APIs.

Administrative code uses authenticated Admin APIs.

Custom API routes must:

* validate input
* return predictable errors
* enforce authentication
* enforce authorization
* support pagination when returning lists
* expose stable identifiers
* use ISO dates
* use explicit currency codes
* use request/correlation IDs where appropriate

Do not expose privileged credentials to browsers.

## Authentication

Use Medusa-native authentication. Customer authentication uses Medusa email/password authentication. Admin/owner authentication must also remain Medusa-compatible.

Keycloak is removed and must not be reintroduced unless explicitly requested. Do not retain Django only for owner authentication.

Admin-facing routes require authenticated admin identities.

Support role/permission logic for:

* owner
* assistant
* developer

Prefer permission-based authorization rather than hardcoding every decision directly to a role name.

Backend permission enforcement is mandatory.

Hiding UI elements is not sufficient.

## Authorization

A useful permission model may include:

```text
products.read
products.update
orders.read
orders.manage
customers.read
inventory.read
inventory.update
analytics.read
reports.export
support.read
support.reply
audit.read
users.manage
system.health.read
```

Exact permissions should follow real product requirements.

Do not create unnecessary permissions before they are needed.

## Analytics

Do not recreate the old Django analytics architecture automatically.

First determine what can be derived from:

* Medusa commerce data
* Medusa events
* storefront analytics events
* Medusa infrastructure

If custom persisted analytics are required, use a focused Mouher module.

Analytics failure must not block:

* browsing
* cart
* checkout
* payment

Prefer aggregate reporting over invasive user profiling.

## Audit Logs

Important administrative mutations should create audit evidence.

Centralize this behavior in backend workflows or shared infrastructure where possible.

Do not rely on frontend logging.

## Payment

Keep:

`services/payment/`

isolated.

Target:

```text
Medusa payment workflow
        |
        v
services/payment/
        |
        v
payment provider
```

Provider-specific logic stays outside the storefront.

Do not bypass Medusa's payment lifecycle without a justified architectural reason.

## Database

PostgreSQL remains independent infrastructure.

Medusa owns its application data through Medusa models/modules.

Do not:

* manipulate Medusa tables directly from storefront code
* share mutable database ownership between unrelated services
* duplicate Medusa commerce data in another database without a clear reporting/cache reason

Schema migrations must remain explicit.

Product media belongs in object storage, not PostgreSQL or application source.

## Storefront

The storefront lives in:

`apps/storefront/`

It is a client of `services/backend/`.

The storefront should not know Medusa database details.

Keep Medusa response adaptation centralized.

Use `.agents/skills/mouher-storefront/` for customer UX work.

## Admin And Dashboard

Prefer native Medusa Admin functionality when it satisfies the requirement.

Use:

`services/backend/src/admin/`

for Medusa Admin extensions such as:

* widgets
* custom UI routes

Maintain Mouher's richer custom dashboard requirements where native Admin extension points are insufficient.

Use `.agents/skills/mouher-admin/` for dashboard behavior.

## Migration From Django

Do not delete Django code before identifying unique behavior it currently contains.

Inventory:

```text
current responsibility
current file(s)
data owned
Medusa replacement
migration action
```

Typical mappings:

```text
commerce proxy
-> remove; use Store/Admin API

owner auth
-> Medusa-compatible admin authentication

analytics
-> Medusa events / Mouher analytics module

audit
-> Mouher module/workflow integration

notifications
-> Medusa notification infrastructure or Mouher module

support
-> Mouher module

product notes
-> Mouher module

payment orchestration
-> Medusa payment workflows + services/payment
```

Migrate behavior, not framework structure.

Do not reproduce Django's internal architecture inside Medusa.

## Failure Isolation

Preserve:

* analytics failure must not break checkout
* dashboard failure must not break storefront
* payment adapter failure must not break catalog browsing
* notification failure must not invalidate successful commerce operations

## Development

Keep services independently runnable.

For each service document:

* startup command
* required environment variables
* health check
* tests
* troubleshooting

Do not use Kubernetes for the current development milestone unless explicitly requested.

Do not introduce Docker Compose unless explicitly requested.

## Testing

Use TDD for new behavior.

Prioritize tests for:

* auth
* authorization
* API contracts
* workflows
* payment state
* inventory state
* analytics
* audit
* error mapping
* pagination
* idempotent operations

Use integration tests when behavior crosses Medusa modules or services.

## Agent Context Efficiency

Before broad repository inspection:

1. Identify exact paths and symbols with targeted search/read operations.
2. Read only required files.
3. Use `graphify-out/` or `GRAPH_REPORT.md` only when explicitly requested or when a bounded architecture question cannot be answered from targeted source/document reads.

Follow `AGENTS.md` for canonical context exclusions and file-size limits. Do not widen them here.

Prefer targeted changes and focused tests.


## Legacy Django And Data Migration

Django is legacy migration context, not the target backend architecture. Migrate useful behavior into Medusa-compatible mechanisms; do not reproduce Django's internal structure or keep a Django-style BFF alive by default.

When a task touches legacy models or import data, classify each responsibility before designing a replacement:

```text
Medusa represents this correctly
    -> clean or normalize legacy data with Python
    -> import or map to the Medusa-native model

Medusa represents the commerce truth but Mouher has extra behavior
    -> use Medusa for the commerce entity
    -> preserve the Mouher-specific behavior as metadata, module data, workflow logic, subscriber logic, or a custom route as appropriate

Mouher still needs a non-commerce operational domain
    -> preserve it through a focused Mouher module/model

Apparently obsolete legacy data
    -> document it
    -> do not preserve it as active application state without product value
```

Prefer Medusa-native models for products, variants, customers, orders, carts, inventory, pricing, promotions, fulfillment, regions, currencies, and other commerce concepts. Do not duplicate those as Mouher custom entities.

Use Python cleaning and normalization for CSV or Django-era import data before it reaches Medusa. Do not force Medusa modules to mirror obsolete CSV columns or Django fields merely because they existed historically.

Potential Mouher operational entities to inventory include:

```text
owner_user
owner_role
owner_user_role
admin_audit_log
analytics_event
dashboard_daily_metric
admin_notification
support_ticket
support_ticket_message
product_admin_note
browser_push_subscription
```

Preserve fields, relationships, identifiers, timestamps, status semantics, permissions data, and reporting meaning only after inventory confirms they are still useful or required for migration compatibility. If a field appears obsolete, document it and keep raw source history private rather than silently promoting it into the new active schema.

### Commerce Data Exception

Do not recreate Medusa `product`, `customer`, `order`, `inventory`, pricing, or other commerce tables as custom Mouher models. Mouher operational modules should reference Medusa commerce entities by stable IDs where appropriate.

For example:

```text
product_admin_note.product_id
    -> Medusa product ID

support_ticket.customer_id
    -> Medusa customer ID
```

### Migration Requirements

Before removing Django persistence or depending on a replacement:

1. Inventory every relevant Django responsibility and model.
2. Record fields, relationships, constraints, indexes, defaults, status values, nullability, and identifiers.
3. Identify business behavior and dashboard/API/reporting dependencies.
4. Compare with Medusa-native capability first.
5. Choose Medusa-native mapping, Mouher extension, or documented retirement.
6. Add migrations only for active Mouher extension data that still has value.
7. Preserve existing data when migration data exists and remains useful.
8. Add compatibility tests around important queries and workflows.
9. Remove Django behavior only after the equivalent Medusa behavior or documented retirement is verified.
