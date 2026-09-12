# Medusa Service Contract

The Kubernetes templates expect a Medusa application image named like:

```text
ghcr.io/mouher/mouher-medusa:<tag>
```

This repo currently contains the storefront, Django companion API, payment adapter, scripts, and architecture docs. The Medusa application can live in this repo later as `mouher-medusa/` or in a separate repository, but its production build must satisfy this contract.

## Required Medusa Features

- Products: product module, variants, categories, collections, options, tags.
- Orders: orders, fulfillments, returns, exchanges, payment state.
- Inventory: inventory items, stock locations, reservations.
- Customers: accounts, guest checkout, customer groups.
- Promotions: standard and buy-get promotions.
- Price Lists: sale prices and customer-group-specific overrides.
- Loyalty: custom module or plugin for points/store credit behavior, with browser Web Push notifications delegated to Mouher notification delivery.

## Required Production Config

- `DATABASE_URL`: external PostgreSQL.
- `REDIS_URL`: external Redis for sessions/cache.
- `EVENTS_REDIS_URL`: external Redis or Redis DB for event bus and queues.
- `MEDUSA_WORKER_MODE`: `server` for the public API deployment, `worker` for the background deployment.
- `DISABLE_MEDUSA_ADMIN`: `false` for server, `true` for worker.
- `PAYMENT_SERVICE_URL`: internal URL for `mouher-payment-service`.
- Payment provider module: register a Mouher/SnapPay provider that calls `PAYMENT_SERVICE_URL` and returns normalized Medusa payment-provider results.

## Required Runtime Behavior

- Medusa owns all order/payment state transitions.
- The payment adapter never writes directly to Medusa's database.
- Payment gateway webhooks must be signature-verified and normalized through the Medusa payment provider flow.
- Background subscribers and scheduled jobs run in the worker deployment only.
- Product media is stored in object storage, not in the application container.
