# mouher-lab
Mouher LAB is a repository for implementing data analysis workflows and experiments related to our fashion brand ( [Mouher](https://mouher.com/) ), as well as a space for developing broader data-driven projects.

## Workspaces

This folder is split into the storefront, role dashboards, and separated services:

- `apps/storefront/` for the public Mouher ecommerce storefront.
- `apps/dashboards/owner-workspace/` for Mouher business operations, merchandising, customer, promotion, price-list, and loyalty decisions.
- `apps/dashboards/developer-workspace/` for engineering plans, implementation notes, API contracts, and test plans.
- `apps/dashboards/assistant-workspace/` for assistant workflows, customer-support drafts, automation prompts, and browser-notification copy.
- `services/backend/` for the Medusa backend service and protected custom APIs.
- `services/payment/` for the isolated payment adapter service.
- `services/db/` for the independent PostgreSQL service boundary.

Private raw data, CSV exports, generated catalog JSON, media, build outputs, and environment files stay out of routine agent context. Do not read environment files unless explicitly requested.
