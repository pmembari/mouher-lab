FROM dbeaver/cloudbeaver:latest

LABEL org.opencontainers.image.title="Mouher CloudBeaver"
LABEL org.opencontainers.image.description="CloudBeaver Community UI for the Mouher PostgreSQL database"

COPY data-sources.json /opt/cloudbeaver/bootstrap/data-sources.json
COPY seed-connections.sh /opt/cloudbeaver/bootstrap/seed-connections.sh
RUN chmod +x /opt/cloudbeaver/bootstrap/seed-connections.sh

EXPOSE 8978
