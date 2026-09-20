# Agent Brief

Use this brief when continuing work on Mouher's ecommerce website and owner dashboard.

## Primary References

- `.agents/skills/vercel-commerce/`: It is a simple and complete ecosystem for WebApplication that agent can leverage to implement the logic of how the lifecycle of my website should be. Agent uses it as the e-commerce completeness reference. It shows expected Medusa storefront concepts: product detail routes, search/collection routes, cart mutations, product type reshaping, SEO metadata, sitemap, robots, Open Graph images, and cache/revalidation patterns.
- `.agents/skills/hitkeep/`: Use this as the dashboard reference for role-aware layout, analytics/reporting, permissions, exports, audit-friendly operations, loading/empty/error states, and self-hostable dashboard patterns. Do not copy HitKeep branding or optional AI/MCP features.
- `data/Mouher_Data`: Is the history transactions, users, images, glary of our shop. This might be needed for test and building test for our Admin Dashboard.
- `https://mouher.com/` this is our current (old website) you can know it as the old website that needs to be refine.
- `PLANS.md`: follow the phased implementation plan and test/user-scenario checklist.

## System Boundaries

- Medusa is the source of truth for commerce data.
- `services/backend/` is the Mouher backend service boundary, implemented with Medusa.
- The public storefront lives in `apps/storefront/`.
- Role dashboards live under `apps/dashboards/`: canonical roles are owner, assistant, and developer. Use staff/operator only as generic prose, not persisted role names.
- The payment adapter stays isolated in `services/payment/`. In future we will push it into a separate git repo so we can follow the SaaS best practices.
- PostgreSQL must remain a separated, independent component. Do not embed database state in an app component. In future we will push it into a separate git repo so we can follow the SaaS best practices.
- Heavy components must be loosely coupled and independently runnable: storefront, shared dashboards, Medusa backend, payment service, database, cache, and media storage.
- The legacy Python backend is deprecated and must not be reintroduced. New backend behavior belongs in the Medusa backend ecosystem under `services/backend/`.
- Private catalog/media data under `data/Mouher_Data` must not be committed.
- Agents must not read CSV files, media files, build outputs, generated data JSON, nested reference repositories, or files larger than 1 MB unless the current task explicitly requires them.
- Agents must not read environment files such as `.env`, `.venv` , `.env.*`, or `*.env` unless explicitly told to do so.


## Current Auth And Hosting Guardrails

- Keycloak is removed and must not be reintroduced unless the user explicitly requests a new auth architecture.
- Customer authentication uses Medusa email/password authentication.
- Customer mobile phone is required during account creation.
- CAPTCHA is not currently required; do not add it unless explicitly requested.
- GitHub Pages remains the public development storefront host.
- Do not assume localhost is the primary user-facing integration topology.
- Do not create a second backend or BFF solely to make GitHub Pages work.

## File Size And Modularity

- Prefer human-authored source files under 400 lines.
- Treat 400 lines as a refactoring signal, not an automatic split requirement.
- Split only along cohesive responsibility boundaries.
- Do not create wrapper files, artificial abstractions, or tiny modules solely to satisfy the line limit.
- Do not refactor unrelated files just because they exceed 400 lines.
- Generated files, lockfiles, migrations, fixtures, vendored/reference code, and large focused test suites are exempt.

## Software Engineering Rules

- Design components with high cohesion and loose coupling.
- Depend on stable API contracts, not another component's internal database schema.
- Keep Medusa-owned commerce data, Mouher operational extensions, and frontend state clearly separated.
- Prefer Medusa-native models and extension points when they fit; preserve Mouher-specific legacy behavior only when it still has product or operational value.
- Keep adapters at service boundaries so Medusa/API response reshaping is centralized and testable.
- Avoid spreading raw HTTP calls, auth checks, price formatting, and analytics mapping across UI components.
- Failures should degrade locally: analytics problems must not block checkout, dashboard problems must not block the storefront, and payment-service problems must not block catalog browsing.

## Development DevOps Rules

- For this milestone, focus on development-time operability, not Kubernetes or production orchestration. The public development storefront is hosted on GitHub Pages at `https://pmembari.github.io/mouher-lab/`; real customer accounts therefore require a separately reachable Medusa backend and database.
- Do not use mamba/conda for virtual envs. Use the service's native toolchain; `services/backend/` is Node/Medusa.
- Services should be stateless where practical so they can be restarted and later scaled independently.
- Keep secrets out of Git and out of browser bundles.
- Use structured logs and request/correlation IDs for cross-service debugging.
- Follow the best practices of security for both user and provider (owner).

## UI Direction

- Skill set for agent ui design is described in `.agents/skills/mouher-storefront/SKILL.md`
- For the homepage I can have a light-weight motion that shows in such a way that describe in  .agents/skills/mouher-storefront/SKILL.md `## Multi-Video Hero` section.
- Use Persian-inspired brand colors: Persian blue for primary actions, navy buttons, Beige for showing product box for selection, Persian red for urgent/sale/error accents, and Persian gold (#FFD700) for premium highlights.
- Keep the main surfaces neutral so product photography remains central.
- Use the same design tokens across storefront and owner dashboard.
- Public storefront should feel premium, visual, and product-led.
- Owner dashboard should feel denser, operational, and easy to scan while still using Mouher brand tokens.
- Customer account UX belongs in `apps/storefront/`. Internal owner/assistant/developer operations UX belongs in `apps/dashboards/`. Use Medusa Admin styling only for Medusa Admin/admin-extension surfaces.
- Support Persian/RTL and English/LTR layouts carefully.
- Preserve accessibility contrast and avoid text overlap on mobile and desktop.
- For purpose of Dashboard we want to add an e-commerce model dashboard that inherit the features in `.agents/skills/hitkeep/`; At the end we are going to provide the dashboard just using the free feature of hitkeep implementations. use the AGENT skills in that standalone repo (e.g. `.agents/skills/hitkeep/hitkeep/.agents/skills`).

### Storefront Implementation Rules

For any change under `apps/storefront/`:

1. Load `.agents/skills/mouher-storefront/SKILL.md`.
2. If the task touches catalog/API/data fetching, also load
   `.agents/skills/building-storefronts/SKILL.md`.
3. Read the relevant storefront section of `PLANS.md`.
4. Inspect only the smallest necessary storefront files before editing.

Homepage is a curated entry surface.

Do not implement full catalog browsing, filtering, or pagination inside
HomePage.

Navigation contract:

- product -> product route
- collection -> collection route
- category -> category route
- Shop / Shop All -> shop route
- search -> search route

Do not use homepage anchors such as `#products` as the destination for
collection or category entities.

Prefer route-based browsing so URLs remain shareable and browser
back/forward navigation remains meaningful.

Before adding new CSS to `index.css`, check whether the styles belong in
an existing file under `apps/storefront/src/styles/`.

### UI Quality Guardrails

Storefront UI must be visually merchandised, not merely functionally rendered.

Before implementing a homepage section, ask:

- Does the section communicate through imagery?
- Is the primary action obvious?
- Is there duplicated navigation or duplicated filtering?
- Is metadata visually secondary?
- Can any control be removed or progressively disclosed?
- Does the design still work without hover?

Avoid:
- plain text collection/category rows when imagery exists
- excessive image hover transforms
- glassmorphism as a default design language
- large floating modals for simple search/filter interactions
- duplicated controls between homepage and Shop
- raw HTML-looking select/input layouts
- decorative animation without merchandising purpose

For catalog lists:
- keep product imagery stable
- keep card chrome minimal
- prioritize image, name, price, availability
- prefer dedicated Shop/Collection/Category routes over homepage state

For homepage collections/categories:
- use editorial image-led cards or compositions
- product counts are metadata, not the main visual content
- each entity must link to its dedicated route

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

- Keep edits scoped.
- Use `rg` for search.
- Agent should ask question for critical design decisions.
- Use `apply_patch` for manual file edits.
- Do not revert unrelated user changes.
- Verify changes with focused tests when code is modified.

## Token-Efficient Codex Workflow

- Use ChatGPT app for product discussion and planning that does not require repository inspection. Use Codex planning when repository files must be inspected.
- Use Codex only when repository access is needed: reading files, editing code, running tests, checking logs.
- Prefer targeted Codex requests with exact paths, constraints, and acceptance tests over broad project exploration.
- Follow the canonical context exclusions in `System Boundaries`; do not widen them in domain skills.
- For every implementation, load only the directly applicable local skill first, then inspect the smallest necessary code surface. Do not recursively inspect cloned/reference repositories under `.agents/skills/`; open a specific referenced file only when the task requires it.
- Prefer targeted repository reads and exact paths. Before any broad read, identify the concrete unanswered question it will resolve.
