# Mouher Medusa/Django Backend Plan

Medusa should remain the source of truth for commerce data. Django is a
companion integration service for Mouher-specific API composition, internal
warehouse tools, and operational webhooks.

## Boundaries

- Catalog, variants, cart, checkout, order, inventory, stock locations, and
  reservations: Medusa.
- Public storefront UI: React/Vite in `mouher-preview`.
- Mouher-specific orchestration and protected admin proxying: Django in
  `mouher-backend`.
- Payment provider implementation: Medusa payment provider module that calls an
  isolated payment adapter service. Django can help initiate sessions but should
  not independently mark orders paid.

## Scalable Production Shape

- Storefront: stateless static/web service behind CDN or web pods.
- Django commerce API: stateless protected BFF/API pods.
- Medusa server: HTTP Store/Admin API pods with `MEDUSA_WORKER_MODE=server`.
- Medusa worker: background job/subscriber pods with `MEDUSA_WORKER_MODE=worker`.
- Payment adapter: separate private pods, for example `mouher-payment-service`.
- PostgreSQL: managed or dedicated database service, never embedded in an app pod.
- Redis: managed or dedicated session/cache/event/queue service.
- Product media: object storage instead of Git or local pod storage.

See `developer-workspace/scaling-architecture.md` and
`infrastructure/kubernetes/base/` for the current target deployment templates.

## Checkout

The Django payment endpoint follows Medusa's storefront checkout flow:

1. Retrieve the cart.
2. Resolve the cart region.
3. List payment providers enabled in that region.
4. Create a payment collection when one does not exist.
5. Initialize a payment session for the chosen provider.
6. Let the frontend complete provider-specific UI, such as Stripe Elements.
7. Complete the cart through Medusa.

## Warehouse

The warehouse endpoints call Medusa Admin API with server-side credentials.
Inventory-level updates use Medusa's batch inventory-level endpoint so stock and
reservations continue to be accounted for by Medusa.

## Loyalty Notifications

Loyalty should use browser Web Push for customers who opt in through Chrome,
Safari, or another supported browser. It should not require email, SMS,
WhatsApp, or paid messaging providers. Web Push delivery must not block checkout
or order placement.

## Current Mouher Products

The current public catalog from `https://mouher.com/products` is exported with:

```bash
python3 scripts/inspect_mouher_live_site.py --include-public-image-urls --output-dir Mouher_Data/current-site
python3 scripts/export_current_mouher_storefront.py
```

The generated `mouher-preview/src/data/currentMouherCatalog.js` is used as the
storefront fallback when Medusa is not configured or reachable.
