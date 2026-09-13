-- Add or refresh Mouher human read-only group roles on an existing database.
-- Run as the PostgreSQL admin user after the db-mouher container already exists.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mouher_backend_readonly') THEN
    CREATE ROLE mouher_backend_readonly NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mouher_medusa_readonly') THEN
    CREATE ROLE mouher_medusa_readonly NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mouher_payment_readonly') THEN
    CREATE ROLE mouher_payment_readonly NOLOGIN;
  END IF;
END
$$;

\connect mouher_backend
GRANT CONNECT ON DATABASE mouher_backend TO mouher_backend_readonly;
GRANT USAGE ON SCHEMA public TO mouher_backend_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mouher_backend_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mouher_backend_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_backend IN SCHEMA public GRANT SELECT ON TABLES TO mouher_backend_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_backend IN SCHEMA public GRANT SELECT ON SEQUENCES TO mouher_backend_readonly;

\connect mouher_medusa
GRANT CONNECT ON DATABASE mouher_medusa TO mouher_medusa_readonly;
GRANT USAGE ON SCHEMA public TO mouher_medusa_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mouher_medusa_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mouher_medusa_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_medusa IN SCHEMA public GRANT SELECT ON TABLES TO mouher_medusa_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_medusa IN SCHEMA public GRANT SELECT ON SEQUENCES TO mouher_medusa_readonly;

\connect mouher_payment
GRANT CONNECT ON DATABASE mouher_payment TO mouher_payment_readonly;
GRANT USAGE ON SCHEMA public TO mouher_payment_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mouher_payment_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mouher_payment_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_payment IN SCHEMA public GRANT SELECT ON TABLES TO mouher_payment_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_payment IN SCHEMA public GRANT SELECT ON SEQUENCES TO mouher_payment_readonly;
