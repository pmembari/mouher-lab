# Mouher Owner Workspace

This directory is the independently runnable owner dashboard application. It is
separate from the public storefront so owner auth, analytics, reporting, and
commerce operations can evolve without making `frontend/src/App.jsx` a second
application entrypoint.

## Run locally

```bash
cd owner-workspace
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL and sign in with the local development owner credentials
`pmembari` / `1234`. Set `VITE_MOUHER_API_URL` to connect the dashboard to
Django. Without it, the app shows honest empty/local-preview states.

## Modules

- `src/lib/ownerAuth.js`: local session boundary and development credential check.
- `src/lib/ownerApi.js`: Django owner API adapter and response normalization.
- `src/components/DashboardHome.jsx`: Overview KPIs, trend, funnel, and reports.
- `src/components/ResourcePage.jsx`: searchable, paginated resource tables.
- `src/components/Navigation.jsx`: protected owner page navigation.
- `src/components/LoginPage.jsx`: owner login surface.

The app is read-only in this milestone. Medusa admin credentials never enter
the browser. Future mutations belong behind Django permissions and audit logs.

## Scope

- Orders: review queues, fulfillment priorities, return/exchange notes.
- Products: merchandising decisions, launch notes, collection edits.
- Inventory: reorder decisions, low-stock review, warehouse priorities.
- Customers: segments, VIP notes, customer-group decisions.
- Promotions: campaign briefs, discount rules, budget decisions.
- Price Lists: sale windows, VIP/B2B/customer-group pricing notes.
- Loyalty: reward policy, point campaigns, and opt-in browser notification copy.

## Boundaries

- Do not store Medusa admin tokens, payment credentials, or raw customer exports here.
- Put source code changes in `frontend/`, `mouher-backend/`, or `scripts/`.
- Put technical implementation details in `developer-workspace/`.
