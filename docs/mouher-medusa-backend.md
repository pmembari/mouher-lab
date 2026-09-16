# Mouher Medusa Backend

Medusa under `services/backend/` is Mouher's active backend and the source of
truth for commerce data. Preserve useful Mouher-specific behavior through
Medusa-native extension points: modules, workflows, API routes, subscribers,
jobs, and Admin extensions.

Do not recreate a proxy or BFF in front of Medusa. Use Medusa Store API, Admin
API, and custom Mouher routes only where the requirement needs aggregation,
authorization, orchestration, or extra operational data.

## Boundaries

- Catalog, variants, cart, checkout, order, inventory, stock locations, and
  reservations: Medusa.
- Public storefront UI: React/Vite in `apps/storefront/`.
- Owner and staff dashboards: React/Vite in `apps/dashboards/`.
- Mouher-specific protected admin behavior: Medusa custom routes, workflows,
  subscribers, jobs, Admin extensions, or Mouher modules in `services/backend/`.
- Payment provider implementation: Medusa payment provider module that calls an
  isolated payment adapter service.

## Production Shape

- Storefront: stateless static/web service behind CDN or web pods.
- Medusa server: HTTP Store/Admin API pods with `MEDUSA_WORKER_MODE=server`.
- Medusa worker: background job/subscriber pods with `MEDUSA_WORKER_MODE=worker`.
- Payment adapter: separate private service, for example `mouher-payment-service`.
- PostgreSQL: managed or dedicated database service.
- Redis: managed or dedicated session/cache/event/queue service.
- Product media: object storage instead of Git or local pod storage.

## Checkout

Checkout follows Medusa's storefront checkout flow:

1. Retrieve the cart.
2. Resolve the cart region.
3. List payment providers enabled in that region.
4. Create a payment collection when one does not exist.
5. Initialize a payment session for the chosen provider.
6. Let the storefront complete provider-specific UI.
7. Complete the cart through Medusa.

## Warehouse

Warehouse and dashboard endpoints should use Medusa Admin API or custom
admin-authenticated Mouher routes with server-side authorization. Inventory-level
updates use Medusa's inventory APIs so stock and reservations continue to be
accounted for by Medusa.

## Loyalty Notifications

Loyalty should use browser Web Push for customers who opt in through Chrome,
Safari, or another supported browser. Delivery failures must not block checkout
or order placement.

## Current Mouher Products

The current public catalog from `https://mouher.com/products` can be exported
for migration analysis with:

```bash
python3 scripts/inspect_mouher_live_site.py --include-public-image-urls --output-dir data/Mouher_Data/current-site
python3 scripts/export_current_mouher_storefront.py
```

Generated storefront fallback data is temporary and should be replaced by
Medusa Store API reads.
