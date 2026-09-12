# Mouher Scalable Commerce Architecture

This is the target production architecture for a website that can scale under concurrent traffic while keeping services independently deployable and independently scalable.

## Service Boundaries

| Service | Owns | Scaling unit |
| --- | --- | --- |
| `mouher-storefront` | Public React storefront, account UI, browser push opt-in | CDN/static host or stateless web pods |
| `mouher-commerce-api` | Django BFF, protected Medusa Admin proxy, warehouse API, subscription registration | Stateless API pods |
| `mouher-medusa-server` | Medusa Store/Admin API, commerce workflows, Admin UI | Stateless API pods |
| `mouher-medusa-worker` | Medusa subscribers, scheduled jobs, long-running imports | Worker pods, scaled separately from API |
| `mouher-payment-service` | Local payment/SnapPay adapter and provider callbacks | Isolated payment pods |
| `mouher-postgres` | Medusa and Django relational data | Managed PostgreSQL or dedicated database service |
| `mouher-redis` | Sessions, cache, queues, event bus, workflow engine | Managed Redis or dedicated cache service |
| `mouher-object-storage` | Product media and generated assets | S3-compatible object storage |
| `mouher-observability` | Metrics, logs, traces, alerts | Platform service |

## Rules

- The database must not run inside an application pod. Use a managed PostgreSQL service in production, or a dedicated database operator/StatefulSet only when managed DB is unavailable.
- Payment processing runs behind `mouher-payment-service`. Medusa should still own payment collections, sessions, captures, refunds, and order state through a custom Medusa payment provider that calls this service.
- Medusa runs in two workloads: `server` mode for HTTP traffic and `worker` mode for background jobs.
- Redis is mandatory in production for Medusa events, queues, sessions, caching, locking, and workflow reliability.
- Browser loyalty notifications use standard Web Push. Customers opt in from the storefront; Django records subscriptions; delivery runs through a worker or controlled internal endpoint.
- All app workloads are stateless, have readiness/liveness probes, have CPU/memory requests, and can be horizontally autoscaled.
- Secrets are injected by Kubernetes Secrets or an external secret manager. Do not commit real tokens, database URLs, VAPID private keys, payment keys, or Medusa admin tokens.

## Request Flow

1. Customer visits `mouher-storefront`.
2. Storefront reads catalog/cart data from `mouher-medusa-server` Store API.
3. Storefront calls `mouher-commerce-api` for Mouher-specific composition, warehouse operations, checkout helpers, and browser push subscriptions.
4. Medusa creates carts, payment collections, orders, inventory reservations, promotions, and prices against PostgreSQL and Redis-backed workflows.
5. Medusa custom payment provider calls `mouher-payment-service` for provider-specific authorization, capture, refund, and webhook normalization.
6. Payment provider webhooks enter Medusa's payment webhook route or the payment adapter, then Medusa updates payment and order state.
7. Loyalty events enqueue browser notification jobs; notification delivery sends Web Push only to opted-in subscriptions.

## Deployment Shape

- `storefront`: 2+ replicas or static hosting behind CDN.
- `commerce-api`: 2+ replicas; no background jobs in web pods.
- `medusa-server`: 2+ replicas; `MEDUSA_WORKER_MODE=server`.
- `medusa-worker`: 1+ replicas; `MEDUSA_WORKER_MODE=worker`; no public ingress.
- `payment-service`: 2+ replicas; private network access from Medusa only where possible.
- `postgres`: managed external endpoint with backups, PITR, monitoring, connection pooling, and private networking.
- `redis`: managed external endpoint with persistence policy suited to queues/events.

## Scaling Signals

- Storefront: request rate, CDN cache hit ratio, response latency.
- Commerce API: CPU, p95 latency, upstream Medusa error rate, DB connection pressure.
- Medusa server: CPU, p95 API latency, Store/Admin route saturation.
- Medusa worker: queue depth, job age, job failure rate.
- Payment service: payment authorization latency, gateway error rate, idempotency conflicts.
- Notification delivery: pending jobs, send failures, stale subscription rate.

## Failure Boundaries

- Storefront can still render cached/static pages when backend APIs degrade.
- Commerce API failure does not take down Medusa Store API.
- Payment adapter failure prevents payment authorization, but does not corrupt orders because Medusa remains payment/order state owner.
- Worker saturation does not block Store API reads; it increases job lag and should scale on queue metrics.
- Browser notification failure must never block checkout.
