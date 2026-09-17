---
name: mouher-admin
description: Plan and build Mouher's shared operations dashboard under apps/dashboards. Use for owner, assistant, and developer dashboard UX, permissions, Medusa Admin/API integration, admin extensions, reporting, exports, audit behavior, operational actions, loading/empty/error states, and role-aware navigation. Do not use for public storefront work.
---

# Mouher Admin Dashboard

Use this skill for Mouher's internal operations dashboard and admin-facing workflows.

`apps/dashboards/` is the shared dashboard surface for owner, assistant, and developer users. Do not create separate dashboard products for each role. Role labels can shape navigation and defaults, but permissions are the authorization primitive.

## Architecture

Prefer native Medusa Admin or Admin API behavior when it fully satisfies the requirement. Use Mouher-specific dashboard functionality, Medusa Admin extensions, or custom admin-authenticated routes when stock Medusa behavior does not cover the workflow.

Target flow:

```text
apps/dashboards/
      |
      | Admin API / custom admin APIs
      v
services/backend/
      |
    Medusa
      |
      +-- commerce modules
      +-- Mouher modules
      +-- workflows
      +-- subscribers
      +-- audit
```

Do not expose Medusa Admin credentials in browser code. Do not use a browser-entered internal API token as the final owner auth model.

## Permissions

Enforce permissions server-side. Hiding a navigation item or button in the dashboard is not authorization.

Useful permission families may include:

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

Add only the permissions needed for the current workflow. Prefer permission checks over hardcoded role-only branching.

## Dashboard UX

The dashboard should feel denser and more operational than the public storefront while still using Mouher brand tokens. Prioritize scanning, comparison, filtering, tables, clear status, and fast repeated actions.

Use `.agents/skills/hitkeep/` only as a product reference for role-aware layout, analytics/reporting, permissions, exports, audit-friendly operations, and loading/empty/error states. Do not copy HitKeep branding or optional AI/MCP features.

Preserve useful existing Mouher dashboard functionality even when stock Medusa Admin lacks a direct equivalent. Extend Medusa correctly rather than reducing Mouher requirements to stock Admin capabilities.

## Data And APIs

Use stable Medusa Admin APIs and custom Mouher APIs. Do not depend on Medusa database internals from dashboard code.

Custom admin APIs must:

* authenticate the admin identity
* enforce permissions server-side
* validate inputs
* return predictable error codes
* paginate list responses
* use stable IDs, ISO dates, and explicit currency codes
* include request/correlation IDs where appropriate

Administrative mutations must write audit evidence through backend workflows or shared audit infrastructure. Do not rely on frontend logging.

## States And Failures

Dashboard features must include useful loading, empty, error, and permission-denied states. Dashboard failures must not block storefront browsing, cart, checkout, or payment. Analytics/reporting failures should degrade locally.

## Agent Workflow

Before changing dashboard code:

1. Read the relevant `PLANS.md` section.
2. Query `graphify-out/` when architecture context is needed.
3. Identify the smallest set of relevant dashboard/backend files.
4. Use `.agents/skills/building-admin-dashboard-customizations/` for Medusa Admin extension details when needed.
5. Write or update focused tests for auth, permissions, API contracts, loading, empty, error, and audit behavior.

Do not read CSV, private media, environment files, generated JSON, build output, or files over 5 MB unless explicitly required.
