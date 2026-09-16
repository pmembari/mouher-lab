# Mouher Payment Service

Isolated payment adapter service for local payment providers such as SnapPay.

Medusa remains the source of truth for payment collections, payment sessions, captures, refunds, and order state. A custom Medusa payment provider should call this service for gateway-specific work, then return normalized payment data to Medusa.

## API

- `GET /healthz`
- `POST /payments/authorize`
- `POST /payments/capture`
- `POST /payments/refund`
- `POST /webhooks/provider`

All mutating routes accept `X-Mouher-Payment-Secret` when `PAYMENT_SERVICE_SHARED_SECRET` is configured.

## Production Notes

- Run independently from Medusa.
- Keep gateway credentials only in this service and the minimal Medusa provider config needed to call it.
- Use idempotency keys for every authorization, capture, and refund.
- Verify provider webhook signatures before normalizing webhook events.
- Do not let this service independently mark Medusa orders paid.
