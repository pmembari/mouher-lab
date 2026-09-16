# Mouher Website And Operations Dashboard Plan

## Purpose

Build Mouher as a complete ecommerce operating system, not just a
storefront and not just an admin template.

The target system has:

- A premium public storefront for customers.

- A secure Mouher operations dashboard for authorized staff.
- A secure client account.

- Medusa should be identify as the commerce backend and commerce source of truth.

- Medusa running under `services/backend/`.

- A separate payment adapter service.

- PostgreSQL, cache, and object storage as independent infrastructure
components.

- A role- and permission-aware dashboard for owner, assistant, and
developer users.

- Mouher-specific operational functionality implemented through
Medusa-native extension mechanisms.

- A storefront designed around premium product engagement, large
imagery, restrained motion, and Mouher's existing brand colors.

`services/backend/` represents the Mouher backend service boundary.

Its implementation is Medusa, and we must transition from Django to Medusa once this achive. All the Agent related including PLANS.md, AGENTS.md, `.agents/skills/mouher-medusa/SKILL.md`, `docs/mouher-medusa-django-backend.md`, and `docs/mouher-medusa-data-plan.md` should be updated and do not maintain the django in these files. This decision will be taken whenever I ask for.

Do not create a second Django backend or a Django-style proxy layer in
front of Medusa.

This plan is the delivery guide for the next implementation phases.

It should be used together with:

- docs/mouher-medusa-data-plan.md`: source catalog, media, and
Medusa import plan.

- `.agents/skills/hitkeep/`: dashboard product reference for
role-aware navigation, analytics/reporting, permissions, exports,
audit-friendly operations, loading/empty/error states, and self-hostable dashboard patterns.

- `.agents/skills/mouher-storefront/`: Mouher storefront UX,
imagery, motion, color, RTL/LTR, and Medusa storefront guidance.

- `.agents/skills/mouher-admin/`: Mouher dashboard product and
permission guidance.

- `.agents/skills/mouher-medusa/`: Mouher Medusa backend
architecture guidance.

---

# Current Baseline

Current repository responsibilities include:

- `apps/storefront/`: customer-facing storefront with catalog
display, cart, checkout, account functionality, analytics calls, and
ecommerce UI.

- `apps/dashboards/`: Mouher operational dashboard boundary.

- `services/backend/`: backend service boundary that is being
migrated from Django to Medusa.

- `services/payment/`: isolated payment adapter service.

- `services/db/`: independent PostgreSQL service/infrastructure
boundary.

- `docs/`: architecture, backend, data, operational, and developer
documentation.

- `data/Mouher_Data`: private historical transactions, users, images,
gallery/media, and catalog source data.

- `.agents/skills/hitkeep/`: operational dashboard reference.

The current Django implementation may contain important Mouher-specific
operational behavior.

---

# Agent Context Exclusions

Agents should default to:

- source code

- typed configuration

- human-authored documentation

- focused tests

Do not read or index unless explicitly required:

- CSV files

- image files

- video files

- raw media

- generated catalog JSON

- generated data JSON

- build outputs

- files larger than 2 MB

- private files under `data/Mouher_Data`

Environment files are stricter.

Do not read:

- `.env`
- `.env.-`
- `-.env`
- `.venv`

unless the user explicitly asks for environment inspection.

---

# Target Architecture

## Architecture Principle

Use:

```text

Apps consume services.

Services own domains.

Infrastructure remains independent.

```

Target repository model:

```text

mouher-lab/

| 

├── apps/

| ├── storefront/

| └── dashboards/

| 

├── services/
| |
| ├── backend/
| |
| | └── Medusa
| |
| |
| ├── db/
| |
| └── payment/
| 
| 
├── docs/
| 
└── .agents/skills/

```

---

# Component Responsibilities

## Storefront--

`apps/storefront/`

Owns:

- customer experience

- navigation

- merchandising

- product discovery

- product detail experience

- cart interaction

- checkout interaction

- customer account UX

- search

- localization

- accessibility

- frontend analytics event emission

The storefront must not own commerce truth.

---

## Dashboard

`apps/dashboards/`

Owns:

- Mouher operational UX

- analytics presentation

- reports

- operational workflows

- staff-facing navigation

- role-aware UI (must be implemented)

- filtering

- exports

- alerts

- administrative tools

---

## Backend

`services/backend/`

Owns:

- Medusa application runtime

- commerce modules

- Store API

- Admin API

- custom Mouher API routes

- Mouher custom modules

- workflows

- subscribers

- scheduled jobs

- authentication

- authorization

- analytics persistence where required

- audit functionality

- support functionality

- operational notifications

- product notes

- payment orchestration

Do not recreate a generic BFF between clients and Medusa unless a
specific use case requires aggregation, authorization, or orchestration.

---

## Payment

`services/payment/`

Owns:

- payment-provider-specific integration

- provider communication

- provider authentication

- provider request/response adaptation
- The payment service should connect to iranian portal for payment. For example Snappay

Keep provider-specific payment logic outside:

- storefront

- dashboard

- unrelated Medusa modules

Future payment providers should integrate through this boundary.

---

# Engineering Principles--

- Keep components loosely coupled.

- Keep components highly cohesive.

- Depend on stable API contracts rather than internal database
structure.

- Keep commerce ownership explicit.

- Keep frontend state separate from backend source-of-truth state.

- Centralize API adaptation.

- Avoid raw HTTP calls scattered across UI components.

- Avoid duplicated auth checks scattered across UI pages.

- Avoid duplicated price/currency formatting.

- Avoid duplicated analytics transformations.

- Isolate failures.

- Prefer existing Medusa functionality before custom implementation.

- Add abstractions only when they remove real complexity.

- Do not reproduce Django architecture inside Medusa.

- Do not create a competing source of truth for Medusa-owned commerce
data. - Preserve Mouher-specific extensions to Medusa-owned entities
when required.

Failures should degrade locally:

- analytics failure must not block checkout

- dashboard failure must not block storefront

- notification failure must not invalidate successful commerce
mutations

- payment adapter failure must not block catalog browsing

- reporting failure must not block normal Medusa commerce operations

---

# Development DevOps Principles--

This milestone focuses on:

- local development discipline

- independently runnable components

- testability

- service contracts

- developer documentation

Kubernetes, production orchestration, ingress policy, and autoscaling
are later concerns.

Required development practices:

- Run storefront independently.

- Run dashboard independently.

- Run Medusa backend independently.

- Run payment adapter independently.

- Run PostgreSQL independently.

- Run Redis independently when required.

- Run object storage independently.

- Give each component documented startup commands.

- Give each component health/readiness checks.

- Keep secrets out of Git.

- Keep secrets out of browser bundles.

- Use structured logs.

- Use request/correlation IDs where useful.

- Keep application services stateless where practical.

- Prefer open-source/self-hosted infrastructure.

- Do not add paid agent tooling without explicit approval.

- Do not require Docker Compose for the current milestone unless
explicitly requested.

- Keep product media in object storage.

---

# Component Flow--

## Customer Flow--

```text

customer browser

    |

    v

apps/storefront/

    |

    | Medusa Store API

    v

services/backend/

    |

    | Medusa

    v

PostgreSQL

product media

    |

    v

object storage / CDN

```

There should not be a Django commerce proxy between storefront and
Medusa.

---

## Dashboard Flow--

```text

authorized operator

    |

    v

apps/dashboards/

    |

    | Medusa Admin API

    | Mouher custom admin API

    v

services/backend/

    |

    | Medusa

    v

PostgreSQL

```

Mouher-specific dashboard endpoints may exist when:

- aggregation is required

- custom permissions are required

- multiple Medusa domains must be composed

- Mouher-specific operational entities are involved

- reporting logic requires a dedicated endpoint

---

## Checkout / Payment--

```text

storefront

    |

    v

Medusa cart / checkout / payment workflow

    |

    v

services/backend/

    |

    v

services/payment/

    |

    v

payment provider

```

Do not place provider-specific payment logic directly in the storefront.

---

## Analytics--

```text

storefront interaction

    |

    v

analytics event

    |

    v

Medusa custom analytics route/module

    |

    +--> Mouher analytics data

    |

    +--> Medusa commerce data

    |

    v

dashboard reporting APIs

```

Analytics ingestion must not block commerce.

---

## Media--

```text

admin/storefront upload request

    |

    v

Medusa file/provider integration

    |

    v

object storage

    |

    v

CDN/public media URL

```

---

# Operational Benefits--

This architecture allows:

- storefront and dashboard to fail independently

- backend to remain headless

- future mobile apps to reuse the same backend

- payment providers to be replaced independently

- commerce logic to stay inside Medusa

- analytics to evolve without rewriting checkout

- object storage to scale independently

- permissions to remain server-enforced

- Codex to work within smaller service boundaries

---

# Public Storefront Scope--

The storefront must include:

- Home page with merchandising/storytelling sections.

- Product listing page.

- Product detail page with stable handles.

- Category pages.

- Collection pages.

- Search page.

- Cart drawer or cart page.

- Checkout flow.

- Payment success state.

- Payment failure state.

- Payment cancellation state.

- Account/login area.

- Order history.

- Wishlist or saved items.

- Size/color variant selection.

- Stock-aware add-to-cart behavior.

- Legal and trust pages.

- SEO metadata.

- Sitemap.

- Robots rules.

- Canonical URLs.

- Open Graph metadata.

The current storefront framework may remain unless a separate framework
migration is approved.

Use Medusa Store API-compatible patterns.

---

# Storefront UX Direction--

## Design Philosophy--

Mouher storefront should combine:

```text

Apple-like UX discipline

\+

large product imagery

\+

restrained motion

\+

Mouher visual identity

\+

premium ecommerce functionality

```

The goal is not to copy Apple.

Use Apple as inspiration for:

- simplicity

- hierarchy

- product focus

- whitespace

- large imagery

- progressive disclosure

- navigation restraint

- polished transitions

- purposeful motion

- immersive product storytelling

Do not copy:

- Apple branding

- Apple icons

- Apple typography

- Apple page layouts literally

- Apple visual identity

---

# Mouher Brand Colors--

Preserve the existing Mouher color direction.

Suggested tokens:

```text

primary / persian-blue: #1C39BB

accent-red / persian-red: #CC3333

accent-gold / persian-gold: #F4C430

ink: #111111

surface: #FFFFFF

surface-muted: #F6F6F4

border: #E5E5E0

```

Use Persian blue for:

- primary actions

- important links

- selected navigation

- active controls

Use Persian red for:

- errors

- destructive actions

- urgency

- important sale states

Use Persian gold for:

- premium emphasis

- loyalty

- editorial highlights

- special selected states

Keep page surfaces mostly neutral.

Product photography should remain dominant.

Do not transform Mouher into a generic monochrome Apple clone.

---

# Storefront Imagery--

Use large imagery intentionally.

Product images should dominate:

- homepage

- hero areas

- product pages

- category stories

- collection stories

- editorial sections

Prefer:

- large product photography

- edge-to-edge sections when appropriate

- immersive galleries

- consistent aspect ratios

- stable dimensions

- responsive loading

- meaningful alt text

Avoid excessive small product cards on premium storytelling pages.

---

# Storefront Motion--

Motion should improve engagement and understanding.

Good examples:

- image reveals

- soft transitions

- product image transitions

- section entrance

- gallery transitions

- cart drawer transitions

- variant-selection feedback

- sticky storytelling

- controlled scroll effects

Avoid:

- constant animation

- animation for decoration only

- heavy parallax

- excessive JavaScript animation systems

- motion that harms loading performance

- motion that causes layout shift

Respect:

`prefers-reduced-motion`

Homepage may use a lightweight derivative of:

`data/Mouher_Data/data/videos/1-parnian.webm`

Raw private media must not be committed.

---

# Homepage Experience--

Preferred flow:

```text

Brand / product hero

↓ large imagery

Featured collection

↓ editorial story

Featured products

↓ motion-led visual section

Category / collection story

↓ trust + service + delivery

Footer

```

Avoid beginning the homepage with a dense marketplace-style product
grid.

## Homepage Hero Media--

Mouher currently has multiple portrait-oriented video assets rather than
one widescreen cinematic source.

Do not distort portrait media into a widescreen frame.

The homepage may use a composed three-media hero on wide screens,
treating multiple portrait clips as one coordinated editorial story.

Desktop:

\- allow up to three portrait media panels

\- preserve each video's natural aspect ratio

\- use intentional spacing, scale, and vertical offsets

\- maintain one clear headline and CTA for the overall composition

Tablet:

\- recompose the media into a 1+2 or similarly balanced layout

Mobile:

\- prioritize one media item at a time

\- optionally expose additional media through swipe/carousel or
sequential sections

\- do not compress three portrait videos into narrow side-by-side
columns

Performance:

\- use WebM/MP4 rather than GIF

\- provide lightweight poster images

\- load primary visual content first

\- defer secondary videos

\- pause offscreen video

\- respect reduced-motion preferences

\- keep page LCP and interaction responsiveness more important than
autoplay animation

# Product Detail Experience--

Preferred hierarchy:

```text

large product imagery

    |

name + price

    |

variant selection

    |

primary purchase action

    |

additional imagery / product story

    |

materials / care / size

    |

shipping / returns

    |

related products

```

Use progressive disclosure.

Do not overload the first viewport.

Product pages must handle:

- many variants

- missing images

- unavailable variants

- out-of-stock states

- loading states

- API errors

- incomplete metadata

---

# Search / Collections--

Product browsing should remain:

- clear

- spacious

- product-led

- filterable

- responsive

Cards should prioritize:

1\. image

2\. product name

3\. price

4\. important availability/promotion state

Avoid excessive badges and metadata.

Search must support:

- Persian

- English

- no-result state

- loading state

- error state

---

# Cart And Checkout--

Cart state must correctly preserve:

- selected variant

- quantity

- pricing

- stock state

Checkout must handle:

- invalid address

- payment failure

- payment cancellation

- delayed provider response

- inventory changes

- expired cart

- network errors

Errors should be recoverable whenever possible.

---

# Internationalization--

Support:

- Persian / RTL

- English / LTR

Language selection must be visible in the upper UI.

Verify direction-sensitive behavior for:

- navigation

- menus

- product grids

- forms

- drawers

- breadcrumbs

- carousels

- icons

- account pages

- checkout

RTL is not only text alignment.

Layout direction must work correctly.

---

# Accessibility--

Require:

- keyboard navigation

- visible focus styles

- semantic HTML

- accessible form labels

- accessible chart labels

- sufficient contrast

- reduced-motion support

- touch-friendly targets

- proper alt text

- recoverable validation errors

Accessibility must not be sacrificed for visual polish.

---

# Dashboard Architecture--

The dashboard is an independent application experience but is backed
directly by Medusa APIs and Mouher Medusa extensions.

Use:

`apps/dashboards/`

Do not create three separate dashboard products for:

- owner

- assistant

- developer

Use one shared dashboard implementation.

Target model:

```text

apps/dashboards/

    |

    v

shared dashboard shell

    |

    v

authenticated operator

    |

    v

role + permissions

```

Different roles use the same:

- layout

- component system

- page system

- API clients

- design tokens

- navigation architecture

Role and permissions determine accessible functionality.

---

# Dashboard Roles--

Initial roles include:

- owner

- assistant

- developer

Do not hardcode all authorization around role names.

Use permissions as the true authorization primitive.

Possible permissions:

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

notifications.read

support.read

support.reply

audit.read

users.manage

system.health.read

```

Exact permissions must follow real product requirements.

Backend authorization is mandatory.

Hiding buttons is not sufficient security.

---

# Dashboard Host--

Recommended production host:

```text

admin.mouher.com

```

---

# Dashboard UX Direction--

The dashboard should share Mouher brand tokens but not imitate the
storefront's cinematic layout.

Storefront:

```text

visual

immersive

editorial

product-led

```

Dashboard:

```text

dense

operational

fast

scan-friendly

data-led

```

Use `.agents/skills/hitkeep/` as a reference for:

- information architecture

- analytics organization

- role-aware navigation

- table density

- filtering

- exports

- loading states

- empty states

- error states

- accessible charts

- permission visibility

Do not copy HitKeep branding.

Do not import HitKeep optional AI/MCP features.

---

# Dashboard Page Model--

The dashboard must use a persistent protected shell.

Each applicable page must support:

- loading state

- empty state

- error state

- search

- filters

- pagination

- export

- responsive layout

- permission boundaries

---

## Overview--

Provide:

- executive KPIs

- revenue trends

- order trends

- traffic trend

- conversion funnel

- today's visits

- checkout drop-off

- what changed today

- low-stock alerts

- attention alerts

- top sold products

- top wishlisted products

- device mix

- geographic mix

- configurable reporting period

---

## Products--

Provide:

- paginated table

- search

- status filter

- category filter

- collection filter

- inventory signals

- price signals

- product performance

- low-stock ranking

- top sellers

- wishlist demand

- product detail view

Use Medusa product data as source of truth.

---

## Categories / Collections--

Provide:

- product counts

- performance

- revenue contribution where available

- order contribution where available

- inventory health

- demand signals

- search

- pagination

- detail views

---

## Orders--

Provide:

- paginated order table

- search

- status filter

- payment filter

- fulfillment filter

- date filter

- order totals

- customer context

- today's changed orders

- status distribution

- revenue trend

- order detail

---

## Customers--

Provide:

- paginated customer table

- search

- account activity

- order count

- customer value

- repeat-customer signals

- recent activity

- detail view

Commerce customers must not be confused with dashboard operator
accounts.

---

## Inventory--

Provide:

- inventory levels

- stock locations

- low stock

- out-of-stock items

- inventory changes

- filters

- pagination

- adjustment actions when permitted

Use Medusa Inventory APIs/modules.

---

## Analytics--

Provide:

- daily trend

- weekly trend

- selectable 7-day comparison

- selectable 30-day comparison

- selectable 90-day comparison

- visitors

- product views

- adds to cart

- checkout starts

- purchases

- conversion

- checkout drop-off

- order count

- gross revenue

- net revenue

- average order value

- refunds

- cancellations

- order-status distribution

- top sold products

- top wishlisted products

- category performance

- collection performance

- inventory value

- low stock

- out of stock

- stale catalog

- geographic aggregates

- device aggregates

Production dashboard data must never rely on hard-coded metrics.

Use truthful no-data states.

---

# Analytics Privacy--

Prefer aggregate evidence.

Do not build invasive cross-site user profiling.

Avoid storing raw IP addresses unless explicitly required and approved.

Useful geography should be aggregated to:

- country

- region

- city when appropriate

Useful device information should be aggregated.

---

# Dashboard Reports And Exports--

Every report the owner can view should support an appropriate
open-format export when practical.

CSV may be used as an export format.

Agents should still avoid reading repository CSV files unless explicitly
required.

Exports must:

- respect permissions

- handle zero rows

- handle large result sets safely

- avoid blocking interactive requests where long-running export
generation is needed

---

# Backend Boundaries--

## Medusa Owns Commerce--

Medusa is the source of truth for:

- products

- variants

- options

- product images

- categories

- collections

- prices

- price lists

- promotions

- carts

- checkout

- orders

- customers

- inventory

- stock locations

- reservations

- fulfillment

- shipping

- payment collections

- payment sessions

- refunds

- cancellation workflows where supported

- regions

- currencies

Do not recreate these as Mouher custom tables.

---

# Mouher Operational Domains--

Mouher-specific backend functionality may require custom Medusa modules.

Potential domains include:

```text

analytics

audit

notifications

support

product-notes

operator authorization

```

Do not create modules automatically.

First check whether Medusa already provides suitable native
infrastructure.

Preferred decision order:

1\. existing Medusa module/API

2\. configuration/provider

3\. workflow

4\. subscriber

5\. custom API route

6\. custom module

7\. scheduled job

---

# Legacy Django Data Model Migration--

The migration from Django to Medusa is an implementation migration, not
a reason to recreate Django's framework structure.

Inventory the operational data model already designed in Django before
removing it.

Preserve useful Mouher-specific behavior, reporting meaning, permissions
semantics, and migration-critical data. Do not preserve obsolete fields as
active application state merely because they existed in Django.

The existing operational model is the discovery baseline, not an automatic
target schema.

Important entities include:

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

For each entity, inspect and classify:

- field meaning and current product value

- relationships

- identifiers

- timestamps

- status semantics

- meaningful nullability

- permission structures

- reporting behavior

- operational semantics that are still needed

Translate only still-needed Mouher operational domains into Medusa-compatible
custom models/modules.

Prefer Medusa-native commerce models wherever Medusa represents the domain
correctly.

Use Python cleaning and normalization for legacy import data before import
instead of forcing Medusa to mirror obsolete Django or CSV structure.

---

# Operational Model Baseline--

## owner_user--

```text

id

email

name

status

last_login_at

created_at

updated_at

```

---

## owner_role--

```text

id

name

permissions json

created_at

updated_at

```

---

## owner_user_role--

```text

id

owner_user_id

owner_role_id

```

---

## admin_audit_log--

```text

id

owner_user_id

action

resource_type

resource_id

before json

after json

ip_address

user_agent

created_at

```

---

## analytics_event--

Existing analytics event model should be migrated carefully.

Preserve:

- event meaning

- event timestamps

- attribution fields

- commerce references

- deduplication semantics

Do not automatically redesign its schema.

---

## dashboard_daily_metric--

```text

id

date

visitors

product_views

add_to_cart_count

checkout_count

purchase_count

order_count

gross_revenue

net_revenue

currency

created_at

updated_at

```

---

## admin_notification--

```text

id

type

severity

title

body

status

resource_type

resource_id

created_at

read_at

```

---

## support_ticket--

```text

id

customer_id

email

subject

body

status

priority

assigned_owner_id

created_at

updated_at

```

---

## support_ticket_message--

```text

id

ticket_id

author_type

author_id

body

created_at

```

---

## product_admin_note--

```text

id

product_id

owner_user_id

note

created_at

```

---

## browser_push_subscription--

Preserve the existing model and migrate it carefully.

---

# Relations To Medusa Commerce Data--

Mouher operational entities should reference Medusa commerce records
using stable IDs.

Example:

```text

product_admin_note.product_id

    -> Medusa product ID

```

Example:

```text

support_ticket.customer_id

    -> Medusa customer ID

```

Do not duplicate the referenced commerce entity.

---

# Migration Requirements For Django Models--

Before removing Django persistence:

1\. Inventory every Django model.

2\. Record every field.

3\. Record relationships.

4\. Record indexes.

5\. Record defaults.

6\. Record enums/status values.

7\. Record nullable behavior.

8\. Record uniqueness constraints.

9\. Map each entity to a Medusa module/model.

10\. Add appropriate migrations.

11\. Preserve existing production/source data when applicable.

12\. Add behavioral compatibility tests.

13\. Verify dashboard queries.

14\. Verify reporting queries.

15\. Remove Django model only after its replacement is validated.

If an existing field appears obsolete:

- document it

- do not silently remove it

- handle cleanup in a separate schema-change task

---

# Reporting / Aggregation--

Reporting views or cached daily aggregates should be introduced only
when raw analytics and commerce data are reliable.

Potential reporting outputs:

- daily revenue

- daily conversion funnel

- top products

- low-stock products

- repeat customers

- abandoned carts

- promotion performance

- country performance

- device performance

Do not prematurely duplicate Medusa commerce state just for dashboard
speed.

Prefer derived/cached reporting data.

---

# API Standards--

All public, storefront, dashboard, and operational APIs should follow
FAIR-style application API principles.

## Findable--

- consistently named

- documented

- discoverable

- clearly grouped

## Accessible--

- explicit auth

- explicit permissions

- meaningful status codes

- pagination

- filters

- predictable errors

## Interoperable--

- stable JSON

- explicit field names

- ISO date strings

- currency codes

- locale-aware text

- stable identifiers

## Reusable--

- examples

- fixtures

- validation rules

- backwards-compatible evolution

---

# API Rules--

- Use resource-oriented endpoint names.

- Prefer Medusa-native API shapes where practical.

- Do not wrap every Medusa endpoint in a Mouher proxy.

- Add custom endpoints only when they add real value.

- Include pagination metadata for custom list routes.

- Use machine-readable errors.

- Validate inputs at boundaries.

- Use idempotency for payment/order-sensitive mutations where
applicable.

- Include request/correlation IDs.

- Write contract tests for custom APIs.

- Keep API clients typed.

---

# Dashboard API Client--

The dashboard should use centralized typed API access.

Support:

- backend base URL configuration

- auth/session handling

- request timeout

- retry only when safe

- consistent error mapping

- pagination

- filters

- typed responses

Types should cover at minimum:

- Product

- Order

- Customer

- InventoryItem

- AnalyticsSummary

- Notification

- SupportTicket

- AuditLog

- OperatorUser

- Role

- Permission

Do not scatter raw HTTP calls through dashboard components.

---

# Authentication--

Dashboard routes require real authentication.

Do not use:

- browser-entered internal API tokens

- frontend-embedded admin credentials

Use Medusa-compatible admin authentication.

Future authentication may include Google login.

Adding Google authentication must not remove role/permission
enforcement.

---

# Authorization--

Every privileged API route must enforce permissions server-side.

Every sensitive mutation must:

- authenticate actor

- authorize actor

- validate input

- perform operation

- generate audit evidence where required

Frontend permission checks exist for UX only.

They are not a security boundary.

---

# Audit Logs--

Sensitive administrative mutations should create audit records.

Capture where appropriate:

```text

actor

action

resource_type

resource_id

before

after

timestamp

request_id

```

Do not implement independent logging logic inside each dashboard page.

Prefer shared backend workflows/infrastructure.

---

# Notifications--

Use Medusa notification/event infrastructure where appropriate.

Mouher-specific persisted notification state may use the preserved
`admin_notification` model.

Support:

- type

- severity

- title

- body

- read/unread state

- resource association

- created time

---

# Support--

Support functionality may be implemented as a Mouher Medusa module.

Preserve the existing support ticket data model.

Support:

- ticket creation

- status

- priority

- assignment

- messages

- customer relation

- staff permissions

---

# Product Notes--

Product operational notes are not the same thing as product
descriptions.

Use the preserved `product_admin_note` domain model.

Reference Medusa product ID.

Do not duplicate product information.

---

# Payment Architecture--

Keep `services/payment/` isolated.

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

Payment provider errors must be converted into predictable backend
errors.

Do not leak provider-specific behavior across storefront components.

---

# Database Plan--

PostgreSQL remains independent infrastructure.

Requirements:

- database process is separate from application runtime

- migrations are explicit

- schema changes are reviewed

- backups are required before production

- restore behavior should be tested

- application services should not directly mutate unrelated service
schemas

- media should not be stored as PostgreSQL blobs without a narrow
justification

Medusa owns commerce persistence.

Mouher custom modules own Mouher-specific operational persistence.

---

# Commerce Data Ownership And Migration

Medusa is the target commerce source of truth. The Django-to-Medusa
migration is an implementation migration, not permission to recreate Django
inside Medusa.

The existing Django-designed data model is the discovery baseline for useful
Mouher behavior, not an automatic target schema.

## Migration Rule

Before replacing, merging, or removing an existing Django model or
field:

1. Inspect its fields, relationships, constraints, indexes, defaults,
    status values, nullability, and identifiers.
2. Identify its business behavior.
3. Identify API, dashboard, analytics, reporting, permission, and audit
    dependencies.
4. Compare that behavior with the Medusa version installed in this
    repository.
5. Classify the responsibility before implementing the migration.

Use these classifications:

``` text
Native commerce truth
    -> Medusa owns it.

Native commerce + Mouher-specific behavior
    -> Medusa owns the commerce truth.
    -> Preserve Mouher-specific data/behavior as an extension.

Mouher operational domain
    -> Preserve through a Mouher Medusa-compatible module/model.

Apparently obsolete data
    -> Document it.
    -> Preserve raw source history privately when needed.
    -> Do not promote it into active schema without product value.
```

When uncertain, prefer:

``` text
inspect -> classify -> map or retire deliberately
```

over:

``` text
delete blindly -> simplify blindly -> recreate Django structure
```

## Medusa-Owned Commerce

Use Medusa as the source of truth where its native models/modules cover
the existing commerce responsibility, including:

- products, variants, options, and media
- categories and collections
- pricing and price lists
- promotions
- carts and line items
- customers
- orders
- inventory, stock locations, and reservations
- fulfillment and shipping
- payments and refunds
- regions and currencies

Do not create a second independent Mouher source of truth for the same
commerce state.

However, do not remove useful Mouher-specific fields, relationships,
historical information, business behavior, analytics, or dashboard
functionality merely because Medusa owns the underlying commerce entity.

For example:

``` text
Medusa Product
    = product commerce truth

Mouher product extension
    = notes, analytics, attention signals,
      or other Mouher-specific operational data
```

Use appropriate Medusa extension mechanisms such as custom
modules/models, module links, metadata where suitable, workflows,
subscribers, and custom API routes.

## Preserved Mouher Operational Model

Inventory the existing operational model semantics, including:

``` text
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

These may move from Django models to Medusa-compatible Mouher modules/models
when they still carry product or operational value. Framework migration alone
is not permission to drop useful behavior, and legacy existence alone is not
permission to preserve obsolete state.

For retained operational entities, preserve required:

- fields and field meaning
- relationships
- identifiers
- timestamps
- status semantics
- meaningful nullability
- permission behavior
- reporting behavior
- operational behavior

Mouher operational entities should reference Medusa commerce entities
using stable IDs or appropriate Medusa module links rather than
duplicating the commerce record.

## Dashboard Independence

--Medusa commerce ownership does not limit Mouher to the standard Medusa
Admin feature set.--

The existing Mouher dashboard must be preserved and extended.

If Mouher already implements a dashboard capability that standard Medusa
Admin lacks, keep that capability unless an explicit product decision
removes it.

The dashboard may add richer functionality around Medusa commerce data,
including:

- analytics
- conversion funnels
- product performance
- wishlist demand
- inventory intelligence
- attention signals
- geographic/device aggregates
- operational notes
- notifications
- support
- audit history
- reports and exports

Use native Medusa Admin/API functionality when it fully satisfies the
requirement. Extend Medusa or use Mouher-specific dashboard
functionality when it does not.

## No Silent Data Loss

Do not silently remove existing:

- fields
- relationships
- historical data
- business rules
- permissions
- dashboard capabilities
- reporting capabilities
- auditability
- operational information

If Medusa has no obvious destination for existing information, preserve
it through an appropriate Mouher extension or document the issue for an
explicit architecture decision.

Schema simplification or redesign is a separate task and requires
explicit approval.

------------------------------------------------------------------------

# Product Media--

Product media belongs in:

- object storage

- S3-compatible service

- Medusa file provider integration

Do not store product media inside:

- source code

- frontend bundle

- application container

- PostgreSQL without explicit reason

For local development, MinIO or another compatible service may be used.

---

# Website Production Checklist--

Before calling the storefront production-ready, verify:

- stable product handles

- correct product variant selection

- size/color support

- cart reflects selected variant

- stock state is accurate

- sold-out behavior works

- cart persists

- checkout errors are recoverable

- payment success exists

- payment failure exists

- payment cancellation exists

- order confirmation exists

- account/login works

- order history works

- Persian search works

- English search works

- category browsing works

- collection browsing works

- product images have alt text

- product images have stable dimensions

- SEO titles/descriptions exist

- canonical URLs exist

- sitemap exists

- robots configuration exists

- Open Graph metadata exists

- 404 page exists

- global error handling exists

- loading states exist

- empty states exist

- keyboard navigation works

- accessibility labels exist

- mobile layouts are tested

- analytics consent is implemented

- analytics event coverage exists

- privacy policy exists

- terms exist

- shipping policy exists

- return/refund policy exists

- contact/support flow exists

- security headers are configured

- secure cookie behavior exists

- rate limiting exists where needed

- database backups exist

- media backup strategy exists

- product media uses object storage

- motion respects reduced-motion preferences

- large imagery is performance optimized

---

# Dashboard Production Checklist--

Before calling the dashboard production-ready, verify:

- authentication is real

- admin routes reject anonymous access

- permission enforcement exists server-side

- role-aware UI works

- owner role works

- assistant role works

- developer role works

- native Medusa data is used for commerce views

- Mouher custom APIs are used only where needed

- production pages contain no mock metrics

- loading states exist

- empty states exist

- errors are actionable

- tables paginate

- filters work

- exports respect permissions

- audit logs exist for required mutations

- Persian text renders correctly

- RTL works

- analytics use real data

- dashboard does not expose Medusa secrets

- dashboard remains usable if analytics is temporarily unavailable

---

# Delivery Phases--

## Phase 0: Architecture And Migration Foundation--

Goal:

Establish the Medusa-native architecture before deleting Django.

Work:

- Inventory Django responsibilities.

- Inventory Django operational models.

- Map Django models to Medusa custom models/modules.

- Map Django endpoints to native Medusa APIs or Mouher custom APIs.

- Establish `services/backend/` as the Medusa application.

- Define authentication approach.

- Define permission model.

- Define dashboard API contracts.

- Define analytics event contracts.

- Define migration tests.

- Document local startup commands.

Acceptance criteria:

- Medusa backend starts from `services/backend/`.

- Existing Django responsibilities are documented.

- No important operational model is lost.

- Dashboard requirements remain unchanged.

- Storefront contract with Medusa is documented.

- Permission strategy is explicit.

- Data migration plan is explicit.

- No broad destructive Django deletion has occurred.

---

# Phase 1: Read-Only Dashboard MVP--

Goal:

Give authorized operators real operational visibility without mutation
risk.

Screens:

- Login

- Overview

- Products

- Product detail

- Categories

- Orders

- Order detail

- Customers

- Customer detail

- Inventory

- Analytics

Use native Medusa APIs where suitable.

Use custom Mouher API routes only where necessary.

Acceptance criteria:

- no production mock data

- real authentication required

- permission denial works

- API errors are actionable

- loading states exist

- empty states exist

- product tables paginate

- order tables paginate

- customer tables paginate

- inventory tables paginate

- charts use real data

The dashboard should answer:

- What sold today?

- What is low in stock?

- What needs attention?

- What changed today?

- How many customers visited today?

- Where do customers leave the funnel?

- What are the top-selling products?

- What are the most wishlisted products?

---

# Phase 2: Safe Operations--

Goal:

Add lower-risk operational actions after auth and audit infrastructure
are stable.

Work:

- mark notifications as read

- add product operational notes

- supported order status operations

- browser push notifications

- audit log viewing

- report exports

- low-stock alert list

- support-ticket read/reply workflow

Acceptance criteria:

- mutations enforce permission checks

- required mutations generate audit logs

- dangerous actions request confirmation

- exports are permission protected

- tests cover success

- tests cover failure

- tests cover permission denial

- tests cover audit creation

---

# Phase 3: Full Commerce Operations--

Goal:

Enable higher-risk commerce mutation workflows.

Work:

- product create/edit

- variant create/edit

- product image upload

- category management

- collection management

- price management

- price-list management

- promotion management

- inventory-level updates

- refund workflows

- cancellation workflows

- operator user management

- role management

- permission management

Acceptance criteria:

- Medusa remains commerce source of truth

- mutations use Medusa workflows/modules

- permissions are enforced server-side

- uploads go through object storage/file provider

- required actions generate audit logs

- before/after values exist where appropriate

- tests cover success

- tests cover failure

- tests cover permission denial

- tests cover backend errors

---

# Phase 4: Django Removal--

Goal:

Remove Django only after equivalent Medusa behavior is verified.

Before deletion verify:

- commerce proxy is no longer needed

- owner auth has migrated

- role/permission behavior has migrated

- analytics has migrated

- audit persistence has migrated

- notifications have migrated

- support has migrated

- product notes have migrated

- push subscription persistence has migrated

- payment orchestration has migrated

- existing data has a migration path

- focused tests pass

Then remove:

- Django runtime dependency

- Django project configuration

- Django settings

- Django apps

- Django-only dependencies

- obsolete Django tests

- obsolete Django documentation

- obsolete Django environment/config assumptions

Do not remove unrelated Python tooling if it serves another purpose.

---

# Authentication And Authorization Roadmap--

Initial requirement:

- all dashboard routes require authenticated users

- anonymous users cannot reach protected routes

- no browser-entered internal tokens

- permission model exists

- backend authorization is enforced

- sensitive mutations generate audit evidence

Future requirement:

- Google authentication may be supported

- permission model must remain intact

- user identities must remain distinct from commerce customers

---

# Test Plan--

Development should follow TDD.

For new behavior:

1\. Write failing test.

2\. Implement smallest useful change.

3\. Run focused test.

4\. Refactor while green.

5\. Add integration/E2E coverage when behavior crosses boundaries.

TDD is especially important for:

- authentication

- authorization

- API contracts

- Medusa workflows

- analytics aggregation

- payment state transitions

- inventory changes

- audit logging

- data migration

- frontend loading/error/empty states

---

# Backend Tests--

Add or expand tests for:

- admin auth required

- expired sessions rejected

- permission denial

- role/permission mapping

- product API access

- order API access

- customer API access

- inventory API access

- analytics aggregation

- audit log creation

- error mapping

- pagination

- filtering

- export authorization

- custom Mouher modules

- Medusa workflow behavior

- Django-to-Medusa data migration compatibility

---

# Frontend Storefront Tests--

Test:

- product loading

- product missing image

- product variants

- sold-out state

- cart persistence

- cart mutations

- checkout state

- payment failure

- payment cancellation

- account behavior

- search

- Persian strings

- English strings

- RTL

- mobile

- reduced motion

- loading

- empty

- error

---

# Dashboard Tests--

Test:

- login redirects

- unauthenticated access

- unauthorized access

- role-based navigation

- permission-based action visibility

- products loading

- products success

- products empty

- products error

- orders loading

- orders success

- orders empty

- orders error

- customer states

- inventory states

- search/filter query state

- pagination

- analytics chart shape

- export behavior

- mutation validation

- audit creation

- Persian strings

- RTL

- responsive layout

---

# End-To-End Scenarios--

Cover:

- dashboard with no analytics data

- dashboard when analytics service/module fails

- expired operator authentication

- permission-restricted route

- Persian product search

- order filtering

- incomplete customer fields

- product with no image

- product with many variants

- low-stock update

- report export with zero rows

- large report export

- analytics consent declined

- analytics consent accepted

- add to cart without checkout

- payment failure

- payment success with delayed webhook

- inactive push subscription

- duplicate analytics event

- bot-like pageview traffic

- operator without export permission

- assistant attempting owner-only action

- developer accessing only allowed diagnostics

---

# Implementation Order--

1\. Keep implementation context compact.

2\. Query `graphify-out/` before broad exploration.

3\. Inventory Django backend responsibilities.

4\. Inventory Django operational data model.

5\. Correct `AGENTS.md` and `PLANS.md`.

6\. Establish Medusa under `services/backend/`.

7\. Add backend migration/compatibility tests.

8\. Implement authentication.

9\. Implement authorization/permissions.

10\. Connect storefront directly to Medusa Store API.

11\. Connect dashboard to Medusa Admin API.

12\. Create custom APIs only where needed.

13\. Migrate analytics.

14\. Migrate audit persistence.

15\. Migrate notifications.

16\. Migrate support.

17\. Migrate product notes.

18\. Migrate push subscription behavior.

19\. Migrate payment orchestration.

20\. Verify existing operational data model compatibility.

21\. Build read-only dashboard features.

22\. Add safe mutations.

23\. Add higher-risk commerce operations.

24\. Remove Django only after migration validation.

25\. Update developer/operator documentation.

After each completed section:

- propose a semantic commit message

- avoid unrelated changes

- verify focused tests before moving on

---

# Agent Working Style--

Agents should:

- prefer existing repository patterns

- keep edits scoped

- query Graphify first when relevant

- use targeted search

- read exact files

- avoid broad repository crawling

- preserve unrelated user changes

- write focused tests

- keep architecture decisions in `PLANS.md`

- keep reusable operational rules in skills/AGENTS.md

Do not inspect:

- CSV

- media

- environment files

- generated JSON

- build outputs

- files larger than 5 MB

without explicit requirement.

---

# Token-Efficient Codex Workflow--

Use ChatGPT for:

- product decisions

- architecture

- UX planning

- UI direction

- specifications

- reviewing implementation summaries

Use Codex for:

- repository inspection

- file edits

- running tests

- logs

- commits

Before reading many files:

1\. Query `graphify-out/`.

2\. Read `GRAPH_REPORT.md` where relevant.

3\. Identify exact paths.

4\. Read only required files.

Prefer requests containing:

```text

Goal

Exact paths

Constraints

Acceptance tests

```

Avoid broad prompts such as:

```text

improve the whole backend

```

Prefer:

```text

Migrate analytics_event persistence from the existing Django
implementation

to the Medusa analytics module.

Paths:

\- services/backend/...

\- existing Django analytics model path

\- relevant tests

Constraints:

\- preserve existing schema semantics

\- do not change storefront

\- do not read CSV/media/env

Acceptance:

\- existing analytics compatibility tests pass

\- new Medusa tests pass

```

---

# Documentation Expectations--

Documentation should follow Diataxis.

Create:

## Tutorials--

First-time setup and learning-oriented flows.

## How-to Guides--

Daily developer/operator procedures.

## Reference--

- environment variables

- API contracts

- permissions

- commands

- service endpoints

## Explanation--

- architecture

- boundaries

- tradeoffs

- data ownership

- migration decisions

Documentation audiences:

- developers

- site assistants/operators

Languages:

- English

- Farsi/Persian

---

# Definition Of Done--

The initial Mouher system is ready when:

- Medusa runs under `services/backend/`.

- Django is no longer required at runtime.

- Existing operational data model is preserved.

- Commerce data remains owned by Medusa.

- Storefront communicates with Medusa Store API.

- Dashboard communicates with Medusa Admin/custom APIs.

- No browser contains privileged Medusa credentials.

- Authentication is real.

- Permissions are enforced server-side.

- Owner/assistant/developer roles work through one dashboard system.

- Read-only commerce data is real.

- Analytics is real.

- Dashboard metrics are not mocked.

- Loading states exist.

- Empty states exist.

- Error states exist.

- Storefront supports Persian/RTL.

- Storefront supports English/LTR.

- Dashboard supports Persian/RTL.

- Dashboard supports English/LTR.

- Large imagery is used without unacceptable performance cost.

- Motion respects reduced-motion preferences.

- Existing Mouher colors remain intact.

- Product media lives in object storage.

- Payment integration remains isolated.

- Core backend tests pass.

- Core storefront tests pass.

- Core dashboard tests pass.

- New behavior follows TDD.

- services can be developed/debugged independently.

- docs are updated.

The dashboard must allow authorized users to answer:

- What sold today?

- What is low in stock?

- What needs attention?

- Which orders changed today?

- Which customers changed today?

- What are the top 10 sold products?

- How many customers visited today?

- How many customers reached checkout but did not purchase?

- What are the top wishlisted products?

- What is the current conversion funnel?

- Which reports/actions are available to the current operator?

The storefront must provide:

- premium visual presentation

- large imagery

- purposeful motion

- clear navigation

- smooth product discovery

- reliable Medusa-backed commerce behavior

- Mouher's existing Persian-inspired brand identity

- accessible and responsive customer experience
