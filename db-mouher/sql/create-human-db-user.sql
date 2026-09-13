-- Template for creating one named human PostgreSQL user.
--
-- Usage from your host, after replacing the psql variables:
-- psql "postgresql://postgres:<admin-password>@localhost:5433/postgres" \
--   -v user_name='firstname_lastname' \
--   -v user_password='replace-with-generated-password' \
--   -v access_role='mouher_backend_readonly' \
--   -f db-mouher/sql/create-human-db-user.sql
--
-- Valid access_role values created by the Mouher database image:
-- - mouher_backend_readonly
-- - mouher_medusa_readonly
-- - mouher_payment_readonly
--
-- Keep user_name lowercase with letters, numbers, and underscores.
-- This file is intended for trusted local admins; review access_role before
-- running because PostgreSQL executes the final GRANT with admin authority.

CREATE ROLE :"user_name"
  LOGIN
  PASSWORD :'user_password'
  NOSUPERUSER
  NOCREATEDB
  NOCREATEROLE
  NOREPLICATION;

GRANT :"access_role" TO :"user_name";
