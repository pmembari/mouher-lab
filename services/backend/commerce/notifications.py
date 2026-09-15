from __future__ import annotations

import json
from typing import Any

from django.utils import timezone

from .medusa import JsonObject, MedusaAPIError
from .models import BrowserPushSubscription
from .services import get_setting


def loyalty_push_config() -> JsonObject:
    public_key = str(get_setting("MOUHER_WEB_PUSH_VAPID_PUBLIC_KEY", "") or "").strip()

    return {
        "enabled": bool(public_key),
        "public_key": public_key,
        "delivery": "browser_push",
        "supported_browsers": ["Chrome", "Safari", "Edge", "Firefox"],
    }


def register_loyalty_push_subscription(
    payload: JsonObject,
    *,
    user_agent: str = "",
) -> JsonObject:
    subscription = payload.get("subscription") or payload
    if not isinstance(subscription, dict):
        raise MedusaAPIError(400, "subscription must be a JSON object.")

    endpoint = str(subscription.get("endpoint") or "").strip()
    keys = subscription.get("keys") if isinstance(subscription.get("keys"), dict) else {}

    if not endpoint:
        raise MedusaAPIError(400, "subscription.endpoint is required.")
    if not keys.get("p256dh") or not keys.get("auth"):
        raise MedusaAPIError(400, "subscription.keys.p256dh and keys.auth are required.")

    customer_id = str(payload.get("customer_id") or "").strip()
    browser = detect_browser(user_agent)
    record, created = BrowserPushSubscription.objects.update_or_create(
        endpoint=endpoint,
        defaults={
            "subscription": subscription,
            "customer_id": customer_id,
            "browser": browser,
            "user_agent": user_agent[:1000],
            "active": True,
        },
    )

    return {
        "created": created,
        "subscription": {
            "id": record.id,
            "customer_id": record.customer_id,
            "browser": record.browser,
            "active": record.active,
        },
    }


def send_loyalty_push_notification(payload: JsonObject) -> JsonObject:
    title = str(payload.get("title") or "Mouher loyalty update").strip()
    body = str(payload.get("body") or "").strip()
    customer_id = str(payload.get("customer_id") or "").strip()

    if not body:
        raise MedusaAPIError(400, "body is required.")

    queryset = BrowserPushSubscription.objects.filter(active=True)
    if customer_id:
        queryset = queryset.filter(customer_id=customer_id)

    message = {
        "title": title,
        "body": body,
        "url": payload.get("url") or "/",
        "tag": payload.get("tag") or "mouher-loyalty",
        "data": payload.get("data") or {},
    }
    delivered = 0
    failed = 0

    for subscription in queryset:
        try:
            send_browser_push(subscription.subscription, message)
            delivered += 1
            subscription.last_sent_at = timezone.now()
            subscription.save(update_fields=["last_sent_at", "updated_at"])
        except StalePushSubscription:
            failed += 1
            subscription.active = False
            subscription.save(update_fields=["active", "updated_at"])
        except Exception:
            failed += 1

    return {
        "notification": message,
        "targeted": queryset.count(),
        "delivered": delivered,
        "failed": failed,
    }


class StalePushSubscription(RuntimeError):
    pass


def send_browser_push(subscription: JsonObject, message: JsonObject) -> None:
    vapid_private_key = str(
        get_setting("MOUHER_WEB_PUSH_VAPID_PRIVATE_KEY", "") or ""
    ).strip()
    vapid_subject = str(
        get_setting("MOUHER_WEB_PUSH_VAPID_SUBJECT", "mailto:owner@mouher.com") or ""
    ).strip()

    if not vapid_private_key:
        raise MedusaAPIError(503, "Web Push VAPID private key is not configured.")

    try:
        from pywebpush import WebPushException, webpush
    except ImportError as error:
        raise MedusaAPIError(503, "pywebpush is not installed.") from error

    try:
        webpush(
            subscription_info=subscription,
            data=json.dumps(message),
            vapid_private_key=vapid_private_key,
            vapid_claims={"sub": vapid_subject},
        )
    except WebPushException as error:
        status_code = getattr(getattr(error, "response", None), "status_code", None)
        if status_code in {404, 410}:
            raise StalePushSubscription(str(error)) from error
        raise


def detect_browser(user_agent: str) -> str:
    agent = user_agent.lower()

    if "edg/" in agent:
        return "Edge"
    if "chrome/" in agent or "crios/" in agent:
        return "Chrome"
    if "safari/" in agent and "chrome/" not in agent:
        return "Safari"
    if "firefox/" in agent or "fxios/" in agent:
        return "Firefox"

    return "Browser"
