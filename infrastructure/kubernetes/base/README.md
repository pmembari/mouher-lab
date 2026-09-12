# Kubernetes Base

Apply these manifests through Kustomize after replacing placeholders.

```bash
kubectl apply -k infrastructure/kubernetes/base
```

## Required External Services

- PostgreSQL: provided through `DATABASE_URL` and `DJANGO_DATABASE_URL`.
- Redis: provided through `REDIS_URL` and `EVENTS_REDIS_URL`.
- Object storage: configured in Medusa as the production file provider.
- Payment gateway credentials: mounted only into `mouher-payment-service` and the Medusa payment provider when needed.

## Scaling Notes

- `mouher-medusa-server` and `mouher-medusa-worker` use the same image but different `MEDUSA_WORKER_MODE` values.
- `mouher-payment-service` is private by default. Expose it publicly only when a gateway requires direct callbacks and protect that route with signature verification.
- HPA objects scale stateless services. Database and Redis scaling are handled by their managed service/operator, not by app manifests.
- `external-services.example.yaml` shows how to expose managed PostgreSQL and Redis endpoints through Kubernetes Service DNS. Edit it before applying if your platform needs service discovery inside the cluster.
