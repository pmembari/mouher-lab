#!/usr/bin/env bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --set=mouher_backend_password="$MOUHER_BACKEND_DB_PASSWORD" \
  --set=mouher_medusa_password="$MOUHER_MEDUSA_DB_PASSWORD" \
  --set=mouher_payment_password="$MOUHER_PAYMENT_DB_PASSWORD" \
  --file=/usr/local/share/mouher/01-create-mouher-databases.sql
