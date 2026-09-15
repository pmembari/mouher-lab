from __future__ import annotations

import os
import uuid
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, Field


app = FastAPI(title="Mouher Payment Service", version="0.1.0")


class PaymentRequest(BaseModel):
    payment_session_id: str = Field(min_length=1)
    amount: float = Field(gt=0)
    currency_code: str = Field(min_length=3, max_length=3)
    idempotency_key: str = Field(min_length=1)
    customer_id: str = ""
    return_url: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


class RefundRequest(BaseModel):
    provider_payment_id: str = Field(min_length=1)
    amount: float = Field(gt=0)
    currency_code: str = Field(min_length=3, max_length=3)
    idempotency_key: str = Field(min_length=1)
    reason: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)


@app.get("/healthz")
def healthz() -> dict[str, bool]:
    return {"ok": True}


@app.post("/payments/authorize")
def authorize_payment(
    payload: PaymentRequest,
    x_mouher_payment_secret: str = Header(default=""),
) -> dict[str, Any]:
    require_service_secret(x_mouher_payment_secret)

    return {
        "status": "requires_provider_action",
        "provider_payment_id": f"mouher_pay_{uuid.uuid4().hex}",
        "amount": payload.amount,
        "currency_code": payload.currency_code.lower(),
        "payment_session_id": payload.payment_session_id,
        "idempotency_key": payload.idempotency_key,
        "data": {
            "return_url": payload.return_url,
            "gateway": "configure-provider",
        },
    }


@app.post("/payments/capture")
def capture_payment(
    payload: PaymentRequest,
    x_mouher_payment_secret: str = Header(default=""),
) -> dict[str, Any]:
    require_service_secret(x_mouher_payment_secret)

    return {
        "status": "captured",
        "provider_payment_id": payload.metadata.get("provider_payment_id", ""),
        "amount": payload.amount,
        "currency_code": payload.currency_code.lower(),
        "idempotency_key": payload.idempotency_key,
    }


@app.post("/payments/refund")
def refund_payment(
    payload: RefundRequest,
    x_mouher_payment_secret: str = Header(default=""),
) -> dict[str, Any]:
    require_service_secret(x_mouher_payment_secret)

    return {
        "status": "refunded",
        "provider_payment_id": payload.provider_payment_id,
        "amount": payload.amount,
        "currency_code": payload.currency_code.lower(),
        "idempotency_key": payload.idempotency_key,
        "reason": payload.reason,
    }


@app.post("/webhooks/provider")
async def provider_webhook(
    request: Request,
    x_mouher_payment_secret: str = Header(default=""),
) -> dict[str, Any]:
    require_service_secret(x_mouher_payment_secret)
    payload = await request.json()

    return {
        "received": True,
        "event": payload.get("type") or payload.get("event") or "unknown",
        "action": "normalize-for-medusa-payment-provider",
    }


def require_service_secret(supplied: str) -> None:
    expected = os.environ.get("PAYMENT_SERVICE_SHARED_SECRET", "")

    if expected and supplied != expected:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid payment service secret.",
        )
