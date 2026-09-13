# Mouher Frontend

React/Vite storefront for Mouher. It is built to use Medusa as the commerce backend, while keeping private CSV exports and product imagery out of GitHub.

## Medusa Setup

Create `frontend/.env.local` from `.env.example` and fill in:

```bash
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key
VITE_MEDUSA_REGION_ID=reg_your_region_id
VITE_MEDUSA_COUNTRY_CODE=it
VITE_MEDUSA_CURRENCY_CODE=eur
```

The storefront calls Medusa Store API routes under `/store`. If these values are missing or Medusa is offline, the app shows a non-private demo catalog.

## Keycloak Setup

The account page can use Keycloak for secure login and account creation. Configure a public OIDC client in Keycloak with Authorization Code flow and PKCE, then add:

```bash
VITE_KEYCLOAK_URL=https://auth.example.com
VITE_KEYCLOAK_REALM=mouher
VITE_KEYCLOAK_CLIENT_ID=mouher-frontend
```

When these values are present, the frontend redirects users to Keycloak for login/registration and does not collect passwords locally. Keep Keycloak redirect URIs and web origins specific to the deployed frontend URL.

## Commands

```bash
npm run dev
npm run build
npm run test:catalog
```

Private data stays local in `data/Mouher_Data`. The Vite build has `publicDir: false`, so local product media is not copied into `dist`.

## Private Data Prep

From the repo root, build a cleaned local catalog without using deprecated remote image links:

```bash
python3 scripts/prepare_mouher_catalog.py --link-media
python3 -m unittest scripts/test_prepare_mouher_catalog.py
```

The generated files stay in ignored `data/Mouher_Data/clean/`.
By default this includes visible products only; add `--include-hidden` when you want hidden/draft products in the private clean output too.
