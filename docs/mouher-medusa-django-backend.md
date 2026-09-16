# Mouher Medusa Backend Migration Note

Medusa under `services/backend/` is the active Mouher backend target and the
source of truth for commerce data. Django is legacy migration context: inventory
the behavior it contains, preserve useful Mouher-specific behavior through
Medusa-native extension points, and remove or replace Django only after the
replacement behavior is verified.

Do not recreate a Django-style proxy or BFF in front of Medusa. Use Medusa Store
API, Admin API, custom routes, workflows, subscribers, jobs, and Mouher modules
where the requirement actually needs them.

## Boundaries

- Catalog, variants, cart, checkout, order, inventory, stock locations, and
  reservations: Medusa.
- Public storefront UI: React/Vite in `apps/storefront/`.
- Mouher-specific orchestration and protected admin behavior: Medusa custom
  routes, workflows, subscribers, jobs, Admin extensions, or Mouher modules in
  `services/backend/`.
- Payment provider implementation: Medusa payment provider module that calls an
  isolated payment adapter service. Do not independently mark orders paid
  outside Medusa's payment lifecycle.

## Scalable Production Shape

- Storefront: stateless static/web service behind CDN or web pods.
- Medusa server: HTTP Store/Admin API pods with `MEDUSA_WORKER_MODE=server`.
- Medusa worker: background job/subscriber pods with `MEDUSA_WORKER_MODE=worker`.
- Payment adapter: separate private pods, for example `mouher-payment-service`.
- PostgreSQL: managed or dedicated database service, never embedded in an app pod.
- Redis: managed or dedicated session/cache/event/queue service.
- Product media: object storage instead of Git or local pod storage.

See `developer-workspace/scaling-architecture.md` and
`infrastructure/kubernetes/base/` for the current target deployment templates.

## Checkout

Checkout follows Medusa's storefront checkout flow:

1. Retrieve the cart.
2. Resolve the cart region.
3. List payment providers enabled in that region.
4. Create a payment collection when one does not exist.
5. Initialize a payment session for the chosen provider.
6. Let the storefront complete provider-specific UI, such as Stripe Elements.
7. Complete the cart through Medusa.

## Warehouse

Warehouse and dashboard endpoints should use Medusa Admin API or custom
admin-authenticated Mouher routes with server-side authorization. Inventory-level
updates use Medusa's batch inventory-level endpoint so stock and reservations
continue to be accounted for by Medusa.

## Loyalty Notifications

Loyalty should use browser Web Push for customers who opt in through Chrome,
Safari, or another supported browser. It should not require email, SMS,
WhatsApp, or paid messaging providers. Web Push delivery must not block checkout
or order placement.

## Current Mouher Products

The current public catalog from `https://mouher.com/products` is exported with:

```bash
python3 scripts/inspect_mouher_live_site.py --include-public-image-urls --output-dir data/Mouher_Data/current-site
python3 scripts/export_current_mouher_storefront.py
```

The generated `apps/storefront/src/data/currentMouherCatalog.js` is used as the
storefront fallback when Medusa is not configured or reachable.
