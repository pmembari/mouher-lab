# Mouher Backend

`services/backend/` is Mouher's Medusa backend service. Medusa is the commerce
source of truth for catalog, carts, customers, orders, inventory, pricing,
promotions, payment collections, fulfillment, and Admin/Store APIs.

The previous Python backend has been deprecated. Do not add a replacement
framework or proxy layer in front of Medusa unless a custom Mouher API route is
required for authentication, authorization, aggregation, or orchestration.

## Setup

```bash
cd services/backend
npm install
cp .env.example .env
npm run dev
```

Use PostgreSQL through `DATABASE_URL`. Keep PostgreSQL, Redis, media storage,
and payment services independently runnable service boundaries.

## Commands

```bash
npm run dev
npm run build
npm test
npm run test:analytics
```

## Implemented Mouher Extensions

- `src/modules/analytics`: privacy-conscious analytics event persistence.
- `src/api/store/analytics/events`: Store API route for recording analytics.
- `src/api/admin/analytics/dashboard`: Admin API route for dashboard summaries.
- `src/workflows/record-analytics-event.ts`: workflow-backed analytics writes.

## Architecture Rules

- Use Medusa Store APIs directly from the storefront when safe.
- Use Medusa Admin APIs or authenticated custom Admin routes for dashboards.
- Use workflows for all mutations.
- Put business rules in workflows and workflow steps, not route handlers.
- Keep privileged Admin credentials server-side only.
- Add Mouher modules only for operational domains not already owned by Medusa.

## Next Migration Work

Move remaining operational behavior into Medusa-native modules and routes:

- owner authentication, permissions, and audit logs
- admin notifications and support tooling
- product notes and operational reporting
- browser push subscription persistence and send workflow
- catalog import into Medusa products, categories, collections, variants, and
  metadata
