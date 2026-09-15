CREATE USER mouher_backend WITH PASSWORD :'mouher_backend_password';
CREATE USER mouher_medusa WITH PASSWORD :'mouher_medusa_password';
CREATE USER mouher_payment WITH PASSWORD :'mouher_payment_password';

CREATE ROLE mouher_backend_readonly NOLOGIN;
CREATE ROLE mouher_medusa_readonly NOLOGIN;
CREATE ROLE mouher_payment_readonly NOLOGIN;

CREATE DATABASE mouher_backend OWNER mouher_backend;
CREATE DATABASE mouher_medusa OWNER mouher_medusa;
CREATE DATABASE mouher_payment OWNER mouher_payment;

GRANT ALL PRIVILEGES ON DATABASE mouher_backend TO mouher_backend;
GRANT ALL PRIVILEGES ON DATABASE mouher_medusa TO mouher_medusa;
GRANT ALL PRIVILEGES ON DATABASE mouher_payment TO mouher_payment;

\connect mouher_backend
GRANT ALL ON SCHEMA public TO mouher_backend;
ALTER SCHEMA public OWNER TO mouher_backend;
GRANT CONNECT ON DATABASE mouher_backend TO mouher_backend_readonly;
GRANT USAGE ON SCHEMA public TO mouher_backend_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mouher_backend_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mouher_backend_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_backend IN SCHEMA public GRANT SELECT ON TABLES TO mouher_backend_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_backend IN SCHEMA public GRANT SELECT ON SEQUENCES TO mouher_backend_readonly;

\connect mouher_medusa
GRANT ALL ON SCHEMA public TO mouher_medusa;
ALTER SCHEMA public OWNER TO mouher_medusa;
GRANT CONNECT ON DATABASE mouher_medusa TO mouher_medusa_readonly;
GRANT USAGE ON SCHEMA public TO mouher_medusa_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mouher_medusa_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mouher_medusa_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_medusa IN SCHEMA public GRANT SELECT ON TABLES TO mouher_medusa_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_medusa IN SCHEMA public GRANT SELECT ON SEQUENCES TO mouher_medusa_readonly;

\connect mouher_payment
GRANT ALL ON SCHEMA public TO mouher_payment;
ALTER SCHEMA public OWNER TO mouher_payment;
GRANT CONNECT ON DATABASE mouher_payment TO mouher_payment_readonly;
GRANT USAGE ON SCHEMA public TO mouher_payment_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mouher_payment_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO mouher_payment_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_payment IN SCHEMA public GRANT SELECT ON TABLES TO mouher_payment_readonly;
ALTER DEFAULT PRIVILEGES FOR ROLE mouher_payment IN SCHEMA public GRANT SELECT ON SEQUENCES TO mouher_payment_readonly;
