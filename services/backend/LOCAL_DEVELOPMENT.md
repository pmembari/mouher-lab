# Local Medusa account development

This setup keeps customer authentication Medusa-only and costs nothing to run locally.

## 1. Start PostgreSQL

Create a local PostgreSQL database matching `services/backend/.env`:

```text
postgres://mouher:mouher@localhost:5432/mouher_medusa
```

You may use an existing local PostgreSQL installation or a local container.

## 2. Configure the backend

Copy `services/backend/.env.example` to `services/backend/.env` and set:

```env
DATABASE_URL=postgres://mouher:mouher@localhost:5432/mouher_medusa
JWT_SECRET=<random-local-secret>
COOKIE_SECRET=<different-random-local-secret>
MEDUSA_ADMIN_DISABLED=false
STORE_CORS=http://localhost:5173
AUTH_CORS=http://localhost:5173,http://localhost:9000
ADMIN_CORS=http://localhost:9000
```

Generate the two local secrets with:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Do not reuse these development values in production.

## 3. Install, migrate, and start Medusa

From `services/backend`:

```bash
npm install
npx medusa db:migrate
npm run dev
```

The backend runs at `http://localhost:9000`.

## 4. Create a local admin user

From `services/backend`, create an admin user with the Medusa CLI:

```bash
npx medusa user -e admin@mouher.local -p 'choose-a-local-password'
```

Then open Medusa Admin at:

```text
http://localhost:9000/app
```

## 5. Create the store configuration in Medusa Admin

For the storefront you need:

1. A Region configured for Iran / IRR.
2. A Sales Channel used by the storefront.
3. A Publishable API Key associated with that Sales Channel.

In Medusa Admin, create or select the sales channel, then create a publishable API key and attach the sales channel to it. Copy the resulting `pk_...` value. Also copy the Region ID (`reg_...`) if the storefront should target that region explicitly.

## 6. Configure the storefront

Create `apps/storefront/.env.local`:

```env
VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_real_local_key
VITE_MEDUSA_REGION_ID=reg_your_real_local_region
VITE_MEDUSA_COUNTRY_CODE=ir
VITE_MEDUSA_CURRENCY_CODE=irr
VITE_ALLOW_STATIC_CATALOG_FALLBACK=true
```

Only `VITE_MEDUSA_BACKEND_URL` and `VITE_MEDUSA_PUBLISHABLE_KEY` are required for Medusa SDK initialization. `VITE_MEDUSA_REGION_ID` is recommended once the Iran region exists.

## 7. Start the storefront

From `apps/storefront`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173/mouher-lab/#/account
```

## 8. Test customer authentication

Create an account using:

- full name
- required mobile number
- email
- password

Iranian mobile numbers entered as `09...` are normalized by the storefront to `+98...` before the customer is created.

After account creation, sign out and sign back in with the same email/password. The storefront uses Medusa JWT authentication only; no Keycloak or CAPTCHA configuration is required.

## Values you create locally

| Value | Where it comes from | Secret? |
| --- | --- | --- |
| `JWT_SECRET` | `openssl rand -hex 32` | yes |
| `COOKIE_SECRET` | `openssl rand -hex 32` | yes |
| Admin email/password | `npx medusa user ...` | yes |
| `VITE_MEDUSA_PUBLISHABLE_KEY` | Medusa Admin publishable API keys | no; intended for storefront use |
| `VITE_MEDUSA_REGION_ID` | Medusa Admin region | no |
| `VITE_MEDUSA_BACKEND_URL` | `http://localhost:9000` locally | no |

Do not create or configure Keycloak keys. Do not add CAPTCHA keys.
