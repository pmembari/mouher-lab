# Mouher Infrastructure

This folder contains production-oriented deployment templates for separating Mouher services by scaling boundary.

## Layout

- `kubernetes/base/`: baseline Kubernetes manifests for namespace, config, secrets template, deployments, services, autoscaling, and ingress.

## Production Service Model

- Storefront is a stateless web/static service.
- Django commerce API is a stateless backend-for-frontend and protected Medusa Admin proxy.
- Medusa runs as separate `server` and `worker` deployments.
- PostgreSQL is an external managed database or dedicated database service.
- Redis is an external managed cache/queue/event service.
- Payment adapter is an isolated private service/pod set.
- Loyalty browser push delivery is separated from email/SMS/payment channels.

These files are intentionally environment-neutral. Replace image names, hosts, resource limits, secret references, and ingress annotations for the target cluster.
