ARG POSTGRES_VERSION=16
FROM postgres:${POSTGRES_VERSION}-alpine

LABEL org.opencontainers.image.title="Mouher database"
LABEL org.opencontainers.image.description="PostgreSQL image for Django-owned Mouher operational data"

# Configure credentials at runtime; never bake them into the image.
ENV POSTGRES_DB=postgres
ENV POSTGRES_USER=postgres

COPY init/01-create-mouher-databases.sql /usr/local/share/mouher/01-create-mouher-databases.sql
COPY init/entrypoint.sh /docker-entrypoint-initdb.d/01-create-mouher-databases.sh
RUN chmod +x /docker-entrypoint-initdb.d/01-create-mouher-databases.sh

EXPOSE 5432
