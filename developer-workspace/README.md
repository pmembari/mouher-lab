# Developer Workspace

Use this workspace for engineering work that supports the Mouher Medusa, Django, and React storefront stack.

## Scope

- API contracts for Medusa-backed features.
- Backend implementation plans for `mouher-backend/`.
- Frontend implementation plans for `mouher-preview/`.
- Test plans, migration notes, release checklists, and integration runbooks.
- Browser push-notification implementation notes for Chrome and Safari.

## Current Application Folders

- `mouher-backend/`: Django companion API and protected Medusa Admin proxy.
- `mouher-preview/`: React/Vite storefront and owner/assistant dashboards.
- `scripts/`: catalog inspection, export, and preparation tools.
- `docs/`: shared architecture and data-import documentation.

## Boundaries

- Do not move existing source code into this folder unless the project structure is intentionally refactored.
- Do not commit secrets, local `.env` files, raw private catalog exports, or generated media.
