# Agent Brief

Use this brief when continuing work on Mouher's ecommerce website and owner dashboard.

## Primary References

- `Agent_Skills_Could_Inspired/Free-Admin-Dashboard/`: It is a Agent skill to use as the owner/admin dashboard UI reference. It is a React, Vite, TypeScript, Tailwind template with e-commerce pages, charts, tables, auth screens, notifications, reviews, and help desk UI. Treat it as a UI starter, not a finished admin system.
- `Agent_Skills_Could_Inspired/vercel-commerce/`: It is a simple and complete ecosystem for WebApplication that agent can leverage to implement the logic of how the lifecycle of my website should be. Agent uses it as the e-commerce completeness reference. It shows expected Medusa storefront concepts: product detail routes, search/collection routes, cart mutations, product type reshaping, SEO metadata, sitemap, robots, Open Graph images, and cache/revalidation patterns.
- `data/Mouher_Data`: Is the history transactions, users, images, glary of our shop. This might be needed for test and building test for our Admin Dashboard.
- `https://mouher.com/` this is our current (old website) you can know it as the old website that needs to be refine.
- `Plan.md`: follow the phased implementation plan and test/user-scenario checklist.

## System Boundaries

- Medusa is the source of truth for commerce data.
- Django in `mouher-backend/` is the secure API/BFF and protected admin gateway.
- The public storefront lives in `frontend/`.
- The owner dashboard should become a separate app, preferably `owner-dashboard/`.
- The payment adapter stays isolated in `mouher-payment-service/`. In future we will push it into a separate git repo so we can follow the SaaS best practices.
- PostgreSQL must remain a separated, independent component. Do not embed database state in an app component. In future we will push it into a separate git repo so we can follow the SaaS best practices.
- Heavy components must be loosely coupled and independently runnable: storefront, owner dashboard, Django API, Medusa, payment service, database, cache, and media storage.
- Private catalog/media data under `data/Mouher_Data` must not be committed.

## Software Engineering Rules

- Design components with high cohesion and loose coupling.
- Depend on stable API contracts, not another component's internal database schema.
- Keep Medusa-owned commerce data, Django-owned operational data, and frontend state clearly separated.
- Keep adapters at service boundaries so Medusa/API response reshaping is centralized and testable.
- Avoid spreading raw HTTP calls, auth checks, price formatting, and analytics mapping across UI components.
- Failures should degrade locally: analytics problems must not block checkout, dashboard problems must not block the storefront, and payment-service problems must not block catalog browsing.

## Development DevOps Rules

- For this milestone, focus on development-time operability, not Kubernetes.
- Each component needs documented startup commands, environment variables, health checks, and troubleshooting notes.
- Do not use mamba/conda for virtual envs. Use pyproject.toml + hatch if needed.
- For the documentation, they should follow the [Diataxis](https://diataxis.fr/) framework. Provide them for developers and also Site Assistants (separately) in both English and Farsi.
- Services should be stateless where practical so they can be restarted and later scaled independently.
- Use local service composition, such as Docker (I don't need Docker compose for the moment), before cluster orchestration.
- Keep secrets out of Git and out of browser bundles.
- Use structured logs and request/correlation IDs for cross-service debugging.
- Product media belongs in object storage or an object-storage-compatible service, not in app source code or app containers.
- Follow the best practices of security for both user and provider (owner).

## UI Direction

- Take inspiration from Apple's restraint, product focus, whitespace, typography, simple navigation, and polished interactions.
- Do not copy Apple branding or visual identity.
- For the homepage I can have a light-weight motion that shows `data/Mouher_Data/data/videos/IMG_2575.MOV` as a gif or motions of images.
- Use Persian-inspired brand colors: Persian blue for primary actions, Persian red for urgent/sale/error accents, and Persian gold (#FFD700) for premium highlights.
- Keep the main surfaces neutral so product photography remains central.
- Use the same design tokens across storefront and owner dashboard.
- Public storefront should feel premium, visual, and product-led.
- Owner dashboard should feel denser, operational, and easy to scan while still using Mouher brand tokens.
- Support Persian/RTL and English/LTR layouts carefully.
- put English/Farsi in a button in upper part of ui.
- Preserve accessibility contrast and avoid text overlap on mobile and desktop.
- Avoid generic electronics-dashboard styling when adapting `Agent_Skills_Could_Inspired/Free-Admin-Dashboard/`.

## API FAIR Principles

All storefront and owner APIs should be:

- Findable: documented, consistently named, and discoverable through an API contract.
- Accessible: clear auth, permissions, status codes, pagination, filters, and errors.
- Interoperable: stable JSON, ISO dates, currency codes, locale-aware text fields, and consistent IDs.
- Reusable: examples, fixtures, validation rules, and backwards-compatible evolution.

API implementation rules:

- Use consistent response envelopes.
- Include list metadata for pagination.
- Include machine-readable error codes.
- Validate payloads at the boundary.
- Use idempotency keys for payment/order-affecting mutations.
- Include request IDs for troubleshooting.
- Add contract tests for every API consumed by the storefront or owner dashboard.

## Security Rules

- Never expose Medusa Admin API credentials in browser code.
- Do not use a browser-entered internal API token as the final owner auth model.
- Owner dashboard routes must require real owner auth.
- Every admin mutation must check permissions and write an audit log.
- Keep production secrets in environment variables only.

## Implementation Priorities

1. Write failing tests and API contract tests first.
2. Build secure owner auth.
3. Build a read-only owner dashboard.
4. Connect products, orders, customers, inventory, and analytics to real APIs.
5. Replace all mock admin data with typed API clients.
6. Add loading, empty, and error states before adding complex mutations.
7. Add local development docs for running separated components.
8. Add safe operational actions next: notifications, notes, exports, audit logs.
9. Add product/order/inventory mutations only after auth, permissions, and audit logging are stable.

## Testing Expectations

Use TDD for new behavior:

1. Write the failing test.
2. Implement the smallest useful change.
3. Run the focused test.
4. Refactor while tests remain green.
5. Add integration or end-to-end tests when behavior crosses service boundaries.

Write tests for:

- Owner authentication and protected routes.
- Permission denial.
- Medusa proxy success and failure.
- Analytics aggregation.
- Product/order/customer/inventory list and detail screens.
- Loading, empty, error, and pagination states.
- Mutations with audit log creation.
- Persian/English search and display edge cases.

Cover scenarios that can harm the dashboard:

- No analytics data.
- Medusa unavailable.
- Expired owner session.
- Missing product images.
- Products with many variants.
- Orders with incomplete customer data.
- Failed or delayed payment webhook.
- Duplicate analytics events.
- Bot-like traffic.
- Inactive push subscriptions.

## Working Style

- Prefer existing repo patterns.
- Keep edits scoped.
- Use `rg` for search.
- Agent should ask question for critical design decisions.
- Use `apply_patch` for manual file edits.
- Do not revert unrelated user changes.
- Verify changes with focused tests when code is modified.
