# db-mouher

Standalone PostgreSQL service and CloudBeaver Community UI image for local
Mouher database work. This milestone intentionally does not use Docker Compose.

## Ownership

This stack creates separate logical databases so the service boundaries stay
visible during development:

- `mouher_backend`: Django-owned operational data such as analytics events,
  browser push subscriptions, owner authentication metadata, audit logs,
  notifications, support tickets, and product notes.
- `mouher_medusa`: Medusa-owned commerce data.
- `mouher_payment`: reserved for the isolated payment adapter if it later needs
  durable provider state.

Django must access Medusa through its APIs, not by directly editing
`mouher_medusa`.

## Credentials

Store local secrets outside the repository in:

```text
~/.credentials/mouher
```

Use `.env.example` only as a key list; do not put real passwords in committed
files.

CloudBeaver Community is available as a separate visual UI container under
`db-mouher/cloudbeaver/`. It is not part of the PostgreSQL image.

## Human Database Access

Use named human accounts for database UI access. Do not share the application
service passwords (`mouher_backend`, `mouher_medusa`, `mouher_payment`) with
people, and do not use the CloudBeaver administrator account as a PostgreSQL
database user.

The PostgreSQL image creates these no-login group roles for human access:

```text
mouher_backend_readonly
mouher_medusa_readonly
mouher_payment_readonly
```

Create one login role per person, then grant only the role they need. Generate
passwords with a password manager or this local command:

```bash
openssl rand -base64 24
```

Example for a person who may inspect Django-owned operational data:

```bash
psql "postgresql://postgres:<admin-password>@localhost:5433/postgres" \
  -v user_name='firstname_lastname' \
  -v user_password='<generated-password>' \
  -v access_role='mouher_backend_readonly' \
  -f db-mouher/sql/create-human-db-user.sql
```

If your PostgreSQL data volume already existed before these read-only roles were
added, install or refresh the group roles first:

```bash
psql "postgresql://postgres:<admin-password>@localhost:5433/postgres" \
  -f db-mouher/sql/install-readonly-access-roles.sql
```

Then in CloudBeaver, open **Mouher Backend Operations** and use:

```text
User name: firstname_lastname
Password: <generated-password>
```

For eligibility, grant only one of the approved read-only roles unless there is
a reviewed operational need for write access. Application service accounts keep
write ownership; humans should normally inspect data through the UI or API.

To remove access:

```sql
REVOKE mouher_backend_readonly FROM firstname_lastname;
DROP ROLE firstname_lastname;
```

To rotate a user's password:

```sql
ALTER ROLE firstname_lastname PASSWORD '<new-generated-password>';
```

Store issued human passwords in a password manager or
`~/.credentials/mouher-users`, never in this repository.

## Open the database visually with CloudBeaver

Build and run the free, open-source CloudBeaver UI as its own container:

```bash
cd db-mouher/cloudbeaver
docker build -t mouher-cloudbeaver .
docker run --name mouher-cloudbeaver \
	--publish 8978:8978 \
	--volume mouher-cloudbeaver-workspace:/opt/cloudbeaver/workspace \
	--detach \
	mouher-cloudbeaver
```

To pre-seed the three local PostgreSQL connections into an existing CloudBeaver
workspace without storing database passwords there:

```bash
docker exec mouher-cloudbeaver /opt/cloudbeaver/bootstrap/seed-connections.sh
docker restart mouher-cloudbeaver
```

Open http://localhost:8978 in your browser. On first launch, configure:

```text
Server Name: Mouher-Database-UI
Allowed Server URLs: http://localhost:8978
Session lifetime, min: 60
Force HTTPS: Off
```

Create the CloudBeaver administrator account with the values stored in
`~/.credentials/mouher`:

```text
Username: CLOUDBEAVER_ADMIN_USER
Password: CLOUDBEAVER_ADMIN_PASSWORD
```

Then create PostgreSQL connections. If PostgreSQL and CloudBeaver run as
separate containers, attach both containers to the same user-defined Docker
network:

```bash
docker network create mouher-network
docker network connect mouher-network db-mouher
docker network connect mouher-network mouher-cloudbeaver
```

From CloudBeaver, use `db-mouher` as the PostgreSQL host. From the host machine,
PostgreSQL is available on `localhost:5433`.

### Django Operations

```text
Host: db-mouher
Port: 5432
Database: mouher_backend
Username: mouher_backend
Password: MOUHER_BACKEND_DB_PASSWORD
```

### Medusa Commerce

```text
Host: db-mouher
Port: 5432
Database: mouher_medusa
Username: mouher_medusa
Password: MOUHER_MEDUSA_DB_PASSWORD
```

### Payment Adapter

```text
Host: db-mouher
Port: 5432
Database: mouher_payment
Username: mouher_payment
Password: MOUHER_PAYMENT_DB_PASSWORD
```

## Build and run PostgreSQL

```bash
cd db-mouher
docker build -t db-mouher:16 .
docker run --name db-mouher \
	--env POSTGRES_DB=postgres \
	--env POSTGRES_USER=postgres \
	--env POSTGRES_PASSWORD=change-this-local-admin-password \
	--env MOUHER_BACKEND_DB_PASSWORD=change-this-local-backend-password \
	--env MOUHER_MEDUSA_DB_PASSWORD=change-this-local-medusa-password \
	--env MOUHER_PAYMENT_DB_PASSWORD=change-this-local-payment-password \
	--publish 5433:5432 \
	--volume mouher-postgres-data:/var/lib/postgresql/data \
	--detach \
	db-mouher:16
```

The host port `5433` avoids colliding with another local PostgreSQL service.
Check readiness with:

```bash
docker ps --filter name=db-mouher
docker exec db-mouher pg_isready -U mouher_backend -d mouher_backend
```

## Django connection

In `mouher-backend/.env`, use the same values as `db-mouher/.env`:

```dotenv
DJANGO_DATABASE_URL=postgresql://mouher_backend:change-this-local-backend-password@localhost:5433/mouher_backend
```

Then apply Django-owned migrations:

```bash
cd mouher-backend
python3 manage.py migrate
python3 manage.py runserver 8001
```

Do not commit `.env` files or production credentials. For production, use a
managed or separately operated PostgreSQL service and inject credentials through
the deployment environment.
