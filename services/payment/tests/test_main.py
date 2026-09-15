from __future__ import annotations

from fastapi.testclient import TestClient

from services.payment.app.main import app


client = TestClient(app)


def test_healthz():
    response = client.get("/healthz")

    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_authorize_payment_requires_shared_secret(monkeypatch):
    monkeypatch.setenv("PAYMENT_SERVICE_SHARED_SECRET", "secret")

    response = client.post(
        "/payments/authorize",
        json={
            "payment_session_id": "payses_123",
            "amount": 120,
            "currency_code": "eur",
            "idempotency_key": "idem_123",
        },
    )

    assert response.status_code == 401


def test_authorize_payment_returns_normalized_payload(monkeypatch):
    monkeypatch.setenv("PAYMENT_SERVICE_SHARED_SECRET", "secret")

    response = client.post(
        "/payments/authorize",
        headers={"X-Mouher-Payment-Secret": "secret"},
        json={
            "payment_session_id": "payses_123",
            "amount": 120,
            "currency_code": "eur",
            "idempotency_key": "idem_123",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "requires_provider_action"
    assert payload["payment_session_id"] == "payses_123"
    assert payload["currency_code"] == "eur"
