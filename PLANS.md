# Mouher Website And Owner Dashboard Plan

## Purpose

Build Mouher as a complete ecommerce operating system, not just a storefront and not just an admin template. The target system has:

- A premium public storefront for customers.
- A secure owner dashboard for Mouher operations.
- Medusa as the commerce source of truth.
- Django as the secure Mouher API, backend-for-frontend, and admin gateway.
- A separate payment adapter service.
- PostgreSQL, Redis, and object storage as independent infrastructure components.
- `db-mouher/`: optional PostgreSQL Docker image and connection contract for Django-owned operational data; it remains separate from the Medusa commerce database and does not require Compose.

This plan is the delivery guide for the next implementation phases. It should be used together with:

- `Agent.md`: agent operating brief and working rules.
- `docs/mouher-medusa-data-plan.md`: source catalog, media, and Medusa import plan.
- `docs/mouher-medusa-django-backend.md`: backend boundary and Medusa/Django integration plan.
- `Agent_Skills_Could_Inspired/vercel-commerce/`: ecommerce completeness reference for routes, product pages, cart behavior, Medusa Store API usage, metadata, sitemap, robots, and revalidation concepts.
- `Agent_Skills_Could_Inspired/Free-Admin-Dashboard/`: UI reference for the owner dashboard shell, tables, charts, notifications, reviews, help desk, and responsive navigation.
- `Agent_Skills_Could_Inspired/hitkeep/`: MIT-licensed, self-hostable reference for privacy-first analytics, ecommerce reporting, funnels, exports, permissions, and calm operational dashboard design. Use its product principles and information architecture as inspiration; do not copy its brand or import paid/cloud-only services.
- `Agent_Skills_Could_Inspired/graphify/`: optional reference for agent-aware development and keeping implementation context compact.

## Current Baseline

- `frontend/`: Vite React storefront with catalog display, cart drawer, checkout UI, account workspace, analytics calls, and Medusa fallback behavior.
- `mouher-backend/`: Django commerce API with analytics collection/dashboard, protected Medusa admin proxy endpoints, warehouse inventory endpoints, push notification support, and payment webhook endpoint.
- `mouher-payment-service/`: isolated payment adapter service.
- `docs/`: existing Medusa data and backend plans.
- `data/Mouher_Data`: private raw/source data and generated catalog outputs. This data must stay out of Git.
- `Agent_Skills_Could_Inspired/vercel-commerce/`: external Next.js Commerce x Medusa reference.
- `Agent_Skills_Could_Inspired/Free-Admin-Dashboard/`: external React admin dashboard reference.

## Target Architecture

### Engineering Principles

- Keep services loosely coupled: storefront, owner dashboard, Django API, Medusa, payment service, database, cache, and object storage must be independently understandable and replaceable.
- Keep cohesion high: storefront code handles customer UX, dashboard code handles owner UX, Django handles Mouher orchestration/security, Medusa handles commerce, and the payment service handles provider integration.
- Depend on contracts, not internals. Frontends should use stable API contracts, not Medusa internals or database schemas.
- Centralize service-boundary adapters. Raw Medusa HTTP calls, response reshaping, auth checks, price formatting, and analytics mapping should not be scattered through UI components.
- Isolate failures. Analytics issues must not block checkout, dashboard issues must not block the public shop, and payment adapter issues must not block catalog browsing.
- Do not share mutable database access between unrelated services. Services communicate through APIs or events.
- Prefer explicit data ownership over convenient duplication.
- Add abstractions only when they remove real complexity or match an existing local pattern.

### Development DevOps Principles

This milestone is about local development discipline and deployable boundaries. Kubernetes, autoscaling, ingress policy, and production cluster work are later milestones.

Required development practices:

- Run each heavy component independently: storefront, owner dashboard, Django API, Medusa, payment service, PostgreSQL, Redis, and object storage.
- Give every component its own environment variables, startup command, health check, and logs.
- Keep PostgreSQL separate from application processes and containers.
- Use MinIO or another S3-compatible local service for product media during development.
- Keep product media in object storage, not in app source code or app containers.
- Add readiness checks before running end-to-end flows.
- Use structured logs for Django and payment-service operations.
- Include request IDs or correlation IDs across service calls.
- Keep secrets out of source control and browser bundles.
- Prefer stateless app services so they can be restarted, debugged, and scaled independently.
- Prefer open-source and self-hosted components. Do not add paid agent services, hosted AI tools, proprietary dashboard dependencies, or usage-billed integrations without explicit owner approval.
- Document how to start, test, and troubleshoot each component locally.

### Component Flow

```text
customer browser
  -> public storefront
  -> Django commerce API/BFF
  -> Medusa Store API
  -> PostgreSQL
  -> object storage for product media

owner browser
  -> owner dashboard
  -> Django owner/admin API
  -> Medusa Admin API
  -> PostgreSQL

checkout/payment
  -> Django checkout orchestration
  -> Medusa payment collection/session
  -> mouher-payment-service
  -> payment provider

analytics
  -> storefront event collector
  -> Django analytics API
  -> analytics_event table
  -> reporting cache or views when needed

media
  -> upload gateway
  -> object storage
  -> CDN/public media URLs
```

Future payment-provider goal: integrate SnapPay or another local provider through the isolated payment service, not directly from the storefront.

### Operational Benefits

- Storefront and owner dashboard can scale and fail independently.
- Dashboard access can be restricted without taking down the public shop.
- Payment provider integration can be restarted or replaced without changing catalog/admin code.
- Database performance can be monitored independently from application CPU/memory.
- Analytics ingestion can degrade without blocking customer purchase flow.
- Media storage can scale independently from app deployments.

## Public Storefront Scope

The storefront must eventually include:

- Home page with merchandising sections.
- Product listing page.
- Product detail page with stable product handles.
- Category pages.
- Collection pages.
- Search page.
- Cart drawer or cart page.
- Checkout flow.
- Payment success, failure, and cancel states.
- Account/login area.
- Order history.
- Wishlist or saved items.
- Size/color variant selection.
- Stock-aware add-to-cart behavior.
- Legal and trust pages.
- SEO metadata, sitemap, robots, canonical URLs, and Open Graph images.

The current Vite storefront can keep its framework. It should adopt the ecommerce concepts shown in `vercel-commerce`, including product routes, collection/search routes, cart mutation patterns, Medusa Store API adapters, metadata, and sitemap/robots coverage.

## Owner Dashboard Scope

The owner dashboard should be a separate app, not mixed into the public storefront.

Recommended local path:

```text
owner-dashboard/
```

Recommended production host:

```text
admin.mouher.com
```

Implementation status: the first independent `owner-workspace/` Vite app now
exists with separated auth, API, navigation, Overview, resource-table, chart,
and report modules. The existing owner route in `frontend/` remains a legacy
preview until the new workspace completes integration and end-to-end parity.

Use `Agent_Skills_Could_Inspired/Free-Admin-Dashboard/` as a UI starting point only. The template's static data, demo routing, and generic styling must be replaced with Mouher API clients, real auth, permission checks, loading states, empty states, validation, audit logs, and brand tokens.

### Owner Dashboard Page Model

The owner experience must use a persistent, protected dashboard shell with separate enriched pages. Each page must have its own loading, empty, error, search/filter, pagination, export, and responsive states where applicable:

- **Overview**: executive KPIs, revenue and order trends, traffic and conversion funnel, today's visits, checkout drop-off, what changed today, low-stock and attention alerts, top sold products, top wishlisted products, device mix, geographic mix, and report-range controls.
- **Products**: paginated product table, search, status/category/collection filters, inventory and price signals, product performance, low-stock ranking, top sellers, top wishlisted products, and read-only product detail view.
- **Categories**: category and collection performance, product counts, revenue/order contribution when available, inventory health by category, demand signals, search, pagination, and read-only category detail view.
- **Orders**: paginated order table, search, status/payment/fulfillment/date filters, order totals and customer context, today's changed orders, status distribution, revenue trend, and read-only order detail view.
- **Users**: paginated customer/user table, search, account activity, order count/value when available, repeat-customer signals, recent activity, and read-only customer detail view. Owner users and roles remain a separate protected administration capability and must not be confused with customers.

The page model should follow HitKeep's useful open-source patterns: clear scope and date controls, aggregate evidence instead of invasive visitor profiling, compact tables with stable pagination, explicit empty/loading/error feedback, accessible charts, tabular fallbacks, downloadable open-format reports, visible permission boundaries, and self-hostable operation.

### Advanced Analytics Requirements

Analytics must be based on Django's owner API and real `AnalyticsEvent` and Medusa commerce data. It must not use hard-coded dashboard figures in production owner pages. The reporting layer should support:

- Daily, weekly, and selectable 7/30/90-day trend comparisons.
- Visitors, product views, adds to cart, checkout starts, purchases, conversion rates, and checkout drop-off.
- Orders, gross/net revenue, average order value, refunds/cancellations, and order-status distribution when the commerce source exposes the fields.
- Top 10 sold products with units, revenue, stock, and comparison context.
- Top 10 wishlisted products with wishlist count, product context, and stock state.
- Product/category/collection performance and inventory value.
- Low-stock, out-of-stock, stale-catalog, and other actionable attention reports.
- Country/region/city aggregates and device aggregates without raw IP storage or cross-site identity profiles.
- CSV or another open-format export for every report that the owner can view.
- Charts with accessible labels, tabular fallbacks, responsive layout, and truthful no-data states.

HitKeep's optional AI-native and MCP features are not part of the Mouher scope. Mouher will not add paid agents or non-open-source agent tooling; future automation must use local, open-source, permissioned services only and only after the core dashboard is complete.

## Backend Boundaries

### Medusa Owns Commerce

Medusa is the source of truth for:

- Products, variants, options, and images.
- Categories and collections.
- Prices, price lists, and promotions.
- Cart, checkout, orders, and customers.
- Inventory, stock locations, reservations, and fulfillment.
- Payments, refunds, and cancel workflows where supported by Medusa.

### Django Owns Mouher Operations

Django owns:

- Owner auth and authorization.
- Admin API gateway to Medusa Admin API.
- Analytics collection and reporting.
- Admin audit logs.
- Owner notifications.
- Support tickets.
- Product notes and operational workflow.
- Browser push subscription orchestration.
- Payment-service orchestration and webhooks.

Medusa Admin API credentials must remain server-side. Browser code must never receive Medusa admin tokens, internal API tokens, or privileged service credentials.

## API Standards

All storefront and owner APIs should follow FAIR-style application API principles:

- Findable: endpoints are consistently named, documented, and discoverable from an API contract.
- Accessible: authentication, authorization, status codes, pagination, filters, and error semantics are clear.
- Interoperable: payloads use stable JSON shapes, explicit field names, ISO date strings, currency codes, locale-aware text fields, and consistent IDs.
- Reusable: contracts include examples, validation rules, backwards-compatible evolution rules, and test fixtures.

Rules:

- Use resource-oriented endpoint names.
- Keep response envelopes consistent.
- Include pagination metadata for lists.
- Include machine-readable error codes with human-readable messages.
- Use idempotency keys for payment/order-affecting mutations.
- Use request IDs for troubleshooting.
- Validate incoming payloads at the API boundary.
- Keep Medusa-specific response shape behind Django adapters where the dashboard needs stable Mouher-facing data.
- Version breaking changes or add fields first.
- Write contract tests for every endpoint consumed by the storefront or owner dashboard.

### Owner API Response Pattern

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

Error response:

```json
{
  "error": {
    "message": "Human-readable message",
    "code": "machine_code"
  }
}
```

The dashboard should use one typed API client layer with:

- Base URL from environment.
- Auth/session handling.
- Request timeout.
- Retry only for safe GET requests.
- Consistent error mapping.
- Types for Product, Order, Customer, InventoryItem, AnalyticsSummary, Notification, SupportTicket, and AuditLog.

## Database Plan

The database is an independent component, not an implementation detail of any frontend or app process.

Requirements:

- PostgreSQL runs separately from Django, Medusa, dashboard, storefront, and payment service.
- `db-mouher` provides a single Dockerfile image and documents the optional Django database connection and migration boundary. Local development may use SQLite until PostgreSQL is needed.
- Schema migrations are explicit, reviewed, and reversible where practical.
- Each service accesses only the database/schema it owns.
- Django must not directly modify Medusa-owned commerce tables.
- Medusa must not directly modify Django-owned analytics, audit, support, or notification tables.
- Add indexes for dashboard query patterns before large data growth makes them painful.
- Add backups and restore tests before production.
- Use read-only reporting views/caches when analytics queries become heavy.
- Do not store product media blobs in PostgreSQL unless there is a narrow, justified reason.

### Medusa-Owned Commerce Entities

Do not duplicate these in Django unless there is a specific reporting/cache reason:

```text
product
product_variant
product_option
product_option_value
product_image
product_category
product_collection
price_set / money_amount
price_list
promotion
cart
cart_line_item
customer
order
order_line_item
payment_collection
payment_session
refund
inventory_item
inventory_level
stock_location
reservation_item
fulfillment
shipping_option
region
currency
```

### Django-Owned Operational Entities

Keep Django tables focused on Mouher-specific operations:

```text
owner_user
- id
- email
- name
- status
- last_login_at
- created_at
- updated_at

owner_role
- id
- name
- permissions json
- created_at
- updated_at

owner_user_role
- id
- owner_user_id
- owner_role_id

admin_audit_log
- id
- owner_user_id
- action
- resource_type
- resource_id
- before json
- after json
- ip_address
- user_agent
- created_at

analytics_event
- existing model, keep and extend carefully

dashboard_daily_metric
- id
- date
- visitors
- product_views
- add_to_cart_count
- checkout_count
- purchase_count
- order_count
- gross_revenue
- net_revenue
- currency
- created_at
- updated_at

admin_notification
- id
- type
- severity
- title
- body
- status
- resource_type
- resource_id
- created_at
- read_at

support_ticket
- id
- customer_id
- email
- subject
- body
- status
- priority
- assigned_owner_id
- created_at
- updated_at

support_ticket_message
- id
- ticket_id
- author_type
- author_id
- body
- created_at

product_admin_note
- id
- product_id
- owner_user_id
- note
- created_at

browser_push_subscription
- existing model, keep
```

### Reporting Views

Add database views or cached daily rows only after raw analytics and order data are reliable:

- Daily revenue.
- Daily conversion funnel.
- Top products.
- Low stock products.
- Repeat customers.
- Abandoned carts.
- Promotion performance.
- Country/device performance.

## UI And Brand Direction

Mouher should feel premium, product-led, and restrained. Take inspiration from Apple's product focus, whitespace, typography, simple navigation, and polished interactions, but do not copy Apple branding or visual identity.

Brand color direction:

- Persian blue for primary actions.
- Persian red for urgency, sale, destructive, and error states.
- Persian gold/yellow for premium highlights, selected states, loyalty, and editorial emphasis.
- Neutral whites, near-blacks, and soft grays as the primary surfaces so product photography stays central.

Suggested token direction:

```text
primary / persian-blue: #1C39BB or a softened accessible variant
accent-red / persian-red: #CC3333
accent-gold / persian-gold: #F4C430
ink: #111111
surface: #FFFFFF
surface-muted: #F6F6F4
border: #E5E5E0
```

Rules:

- Use Persian colors as accents, not full-page saturation.
- Product images should dominate product pages and collection pages.
- Prefer real product/media assets over abstract illustrations.
- Homepage motion can use `data/Mouher_Data/data/videos/IMG_2575.MOV` or derived lightweight media, but raw private media should not be committed.
- Use the same design tokens across storefront and owner dashboard.
- Put English/Farsi language switching in the upper UI where it is discoverable.
- Support Persian/RTL and English/LTR layouts without text overlap.
- Preserve accessibility contrast for text, buttons, badges, charts, and focus states.
- Avoid generic electronics-dashboard styling when adapting the admin template.
- Owner dashboard should be denser and more operational than the public storefront while still sharing Mouher brand tokens.

## Website Production Checklist

Before calling the public website production-ready, verify:

- Product detail pages use stable handles.
- Product variants support size/color selection.
- Selected variants are reflected correctly in the cart.
- Stock and sold-out behavior are accurate.
- Cart state persists.
- Checkout has recoverable error handling.
- Payment success/failure/cancel states are implemented.
- Order confirmation exists.
- Customer account and order history exist.
- Search handles empty state and Persian/English text.
- Category and collection browsing work.
- Product images have alt text and stable dimensions.
- Each page has SEO title/description.
- Canonical URLs exist.
- Sitemap and robots files exist.
- Open Graph/Twitter metadata exists.
- 404 and error pages exist.
- Loading, empty, and error states exist.
- Keyboard navigation and accessibility labels are covered.
- Mobile layouts are QA checked.
- Analytics consent and event coverage are implemented.
- Privacy policy, terms, shipping policy, return/refund policy, and contact/support flow exist.
- Sensitive endpoints have security headers, HTTPS-only cookies, and rate limiting.
- Production database and media backups exist and are restorable.
- Product media lives in object storage.

## Delivery Phases

### Phase 0: Foundation And Contracts

Goal: make the implementation path testable before building more UI.

Work:

- Define Phase 1 API contracts for owner auth, analytics, products, orders, customers, inventory, and stock locations.
- Add contract tests for each endpoint.
- Confirm how the owner dashboard authenticates in local development.
- Normalize existing Django response envelopes where needed.
- Document startup commands and required environment variables for each service.

Acceptance criteria:

- API contracts exist and are checked by tests.
- Local services can be started independently.
- Medusa Admin credentials remain server-side.
- The plan for owner auth is explicit and testable.

### Phase 1: Read-Only Owner MVP

Goal: give the owner real operational visibility without mutation risk.

Screens:

- Login.
- Overview.
- Products.
- Product detail.
- Orders.
- Order detail.
- Customers.
- Customer detail.
- Inventory.
- Analytics.

API dependencies:

- `GET /api/commerce/analytics/dashboard/`
- `GET /api/commerce/admin/products/`
- `GET /api/commerce/admin/products/<id>/`
- `GET /api/commerce/admin/orders/`
- `GET /api/commerce/admin/orders/<id>/`
- `GET /api/commerce/admin/customers/`
- `GET /api/commerce/admin/customers/<id>/`
- `GET /api/commerce/warehouse/inventory/`
- `GET /api/commerce/warehouse/stock-locations/`

Acceptance criteria:

- No mock data remains in production owner screens.
- Owner auth is required for every dashboard route.
- API errors are visible and actionable.
- Loading, empty, and error states are designed.
- Product, order, customer, and inventory tables paginate.
- Dashboard charts use real analytics data.
- The owner can answer what sold, what is low in stock, what needs attention, what changed today, today's visits, checkout drop-off, top sold products, and top wishlisted products.

### Phase 2: Safe Operations

Goal: add low-risk business actions after auth, permissions, and audit logging are stable.

Work:

- Mark notifications as read.
- Add product admin notes.
- Update supported order operational status.
- Send browser push notifications to eligible customers.
- View audit logs.
- Export CSV reports.
- Show low-stock alert list.
- Add support-ticket read/reply workflows if the support model is ready.

Acceptance criteria:

- Every mutation writes an audit log.
- Permission checks exist per action.
- Dangerous operations require confirmation.
- Exports are permission-protected.
- Mutation tests cover success, failure, permission denial, and audit-log creation.

### Phase 3: Full Commerce Admin

Goal: add higher-risk commerce mutations only after read-only workflows are stable.

Work:

- Product create/edit.
- Variant create/edit.
- Product image upload.
- Category and collection management.
- Price and price-list management.
- Promotion management.
- Inventory-level updates.
- Refund/cancel workflows.
- Owner user and role management.

Acceptance criteria:

- Medusa remains the source of truth.
- Django validates requests and proxies server-side.
- Uploads go to object storage or Medusa file service.
- Audit logs contain before/after values.
- Tests cover success, failure, permission denial, and Medusa API errors.

## Authentication And Authorization Roadmap

Initial requirement:

- Owner dashboard routes must require real owner auth.
- Browser-entered internal API tokens are not an acceptable final auth model.
- Every admin mutation must check permissions and write an audit log.

Future requirement:

- Add Google authentication as one supported owner login method.
- Keep support for role-based authorization after adding Google auth.
- Continue using server-side access to Medusa Admin API only.

## Test Plan

Development should follow TDD for new behavior:

1. Write a failing test that describes the desired behavior or regression.
2. Implement the smallest useful change.
3. Run the focused test.
4. Refactor with tests green.
5. Add integration or end-to-end coverage when behavior crosses component boundaries.

TDD is especially important for:

- Auth and permission checks.
- API response contracts.
- Medusa adapter behavior.
- Analytics aggregation.
- Payment and checkout state transitions.
- Inventory updates.
- Audit-log creation.
- Frontend loading, empty, error, and permission states.

Do not add dashboard screens first and tests later. Each screen should start from its data contract and expected user states.

### Backend Tests

Add or expand Django tests for:

- Owner auth required on all admin endpoints.
- Invalid or expired sessions rejected.
- Permission denial by role.
- Product list/detail proxy success.
- Order list/detail proxy success.
- Customer list/detail proxy success.
- Warehouse inventory list success.
- Analytics dashboard aggregation.
- Audit log creation for every mutation.
- Medusa API error mapping.
- Pagination and query parameter pass-through.
- CSV export permission checks.

### Frontend Tests

Add owner-dashboard tests for:

- Login redirects.
- Protected routes reject unauthenticated users.
- Products table loading/success/empty/error states.
- Orders table loading/success/empty/error states.
- Search/filter inputs update query state.
- Pagination controls request the correct page.
- Charts render the real API response shape.
- Mutation forms validate required fields.
- Permission-restricted actions are hidden or disabled.
- RTL/Persian strings do not break key layouts.

### End-To-End Scenarios

Cover scenarios that can harm the storefront, analytics, or dashboard:

- Owner opens dashboard with no analytics data.
- Owner opens dashboard while Medusa is down.
- Owner opens dashboard with expired auth.
- Owner searches for Persian product names.
- Owner filters orders by status and date.
- Owner views an order with missing customer fields.
- Owner views a product with no image.
- Owner views a product with many variants.
- Owner sees low stock and updates inventory.
- Owner exports a report with 0 rows.
- Owner exports a large report.
- Customer declines analytics consent.
- Customer accepts analytics consent and completes purchase.
- Customer adds to cart but does not checkout.
- Customer checkout payment fails.
- Customer checkout succeeds but webhook is delayed.
- Push subscription becomes inactive.
- Duplicate analytics events are submitted.
- Bot-like traffic creates many page views.

## Implementation Order

1. Keep implementation context compact; use `Agent_Skills_Could_Inspired/graphify/` when useful for agent-aware analysis.
2. Define Phase 1 API contracts and write contract tests first.
3. Add owner auth tests in Django, then implement secure owner auth.
4. Add protected endpoint tests for products, orders, customers, inventory, and analytics.
5. Implement or normalize Django owner/admin API responses.
6. Create `owner-workspace/` from the admin template and HitKeep analytics principles with Mouher branding.
7. Remove demo-only pages that are not part of Phase 1.
8. Add frontend tests for protected routing, loading states, empty states, error states, and pagination.
9. Add a typed owner dashboard API client.
10. Connect read-only products, orders, customers, inventory, and analytics.
11. Add local development service documentation for storefront, owner dashboard, Django, Medusa, payment service, PostgreSQL, Redis, and storage.
12. Add operational models for audit logs, notifications, support tickets, and product notes.
13. Add tests for safe mutations and audit logging.
14. Add safe mutations.
15. Add higher-risk commerce mutations only after read-only workflows, auth, permissions, and audit logging are stable.

After each completed section, propose a semantic commit message and ask for a commit decision before moving to unrelated work.

## Documentation Expectations

Documentation should follow the Diataxis framework:

- Tutorials for first-time local setup.
- How-to guides for daily development tasks.
- Reference docs for environment variables, API contracts, and service commands.
- Explanation docs for architecture, boundaries, and tradeoffs.

Documentation should be written separately for:

- Developers.
- Site assistants/operators.

Language coverage:

- English.
- Farsi/Persian.

## Definition Of Done

The owner dashboard is ready for initial use when:

- Owner login is real.
- No admin route can be reached anonymously.
- No browser code contains Medusa admin credentials or internal API tokens.
- Read-only commerce data comes from Medusa through Django.
- Analytics charts come from real `AnalyticsEvent` data.
- Loading, empty, and error states are present.
- Core backend and frontend tests pass.
- API contracts follow the standards in this plan.
- New behavior was developed through failing tests first.
- PostgreSQL, storage, payment service, API, storefront, and dashboard can be run and debugged as separate components.
- The owner can answer:
  - What sold today.
  - What is low in stock.
  - What needs attention.
  - Which customers or orders changed today.
  - The top 10 sold products with useful context.
  - How many customers visited today.
  - How many customers reached checkout but did not purchase.
  - The top 10 wishlisted products with useful context.

