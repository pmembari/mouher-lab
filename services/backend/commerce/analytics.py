from __future__ import annotations

from datetime import timedelta
from decimal import Decimal, InvalidOperation

from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .medusa import MedusaAPIError
from .models import AnalyticsEvent

ALLOWED_EVENTS = {
    "page_view", "product_click", "product_view", "search", "wishlist_click",
    "quick_add_click", "add_to_cart", "begin_checkout", "purchase",
}
ALLOWED_PROPERTIES = {"category", "collection", "interaction", "query_length", "source"}


def record_event(payload: dict, *, request) -> dict:
    if payload.get("consent") is not True:
        raise MedusaAPIError(400, "Analytics consent is required.")
    event_name = str(payload.get("event_name") or "")[:64]
    if event_name not in ALLOWED_EVENTS:
        raise MedusaAPIError(400, "Unsupported analytics event.")
    occurred_at = parse_datetime(str(payload.get("occurred_at") or "")) or timezone.now()
    if occurred_at < timezone.now() - timedelta(days=2) or occurred_at > timezone.now() + timedelta(minutes=5):
        occurred_at = timezone.now()
    raw_properties = payload.get("properties") if isinstance(payload.get("properties"), dict) else {}
    properties = {key: raw_properties[key] for key in ALLOWED_PROPERTIES if key in raw_properties}
    customer_id = ""
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        customer_id = str(getattr(user, "pk", ""))[:128]
    event = AnalyticsEvent.objects.create(
        event_name=event_name,
        anonymous_id=str(payload.get("anonymous_id") or "")[:64],
        session_id=str(payload.get("session_id") or "")[:64],
        customer_id=customer_id,
        path=str(payload.get("path") or "")[:512],
        product_id=str(payload.get("product_id") or "")[:128],
        product_name=str(payload.get("product_name") or "")[:255],
        value=_decimal_or_none(payload.get("value")),
        currency=str(payload.get("currency") or "")[:8].upper(),
        country_code=_header(request, "CF-IPCountry", "X-Country-Code")[:2].upper(),
        region=_header(request, "X-Region")[:100],
        city=_header(request, "X-City")[:100],
        device_type=_device_type(request.headers.get("User-Agent", "")),
        properties=properties,
        occurred_at=occurred_at,
    )
    return {"accepted": True, "event_id": event.pk}


def dashboard_summary(days: int = 30) -> dict:
    days = max(1, min(days, 90))
    start = timezone.now() - timedelta(days=days)
    events = AnalyticsEvent.objects.filter(occurred_at__gte=start)
    counts = dict(events.values_list("event_name").annotate(total=Count("id")))
    visitors = events.exclude(anonymous_id="").values("anonymous_id").distinct().count()
    product_views = counts.get("product_view", 0) + counts.get("product_click", 0)
    adds = counts.get("add_to_cart", 0) + counts.get("quick_add_click", 0)
    checkouts = counts.get("begin_checkout", 0)
    purchases = counts.get("purchase", 0)
    daily_rows = {row["day"]: row["total"] for row in events.annotate(day=TruncDate("occurred_at")).values("day").annotate(total=Count("id")).order_by("day")}
    today = timezone.localdate()
    daily = [{"date": (today - timedelta(days=offset)).isoformat(), "events": daily_rows.get(today - timedelta(days=offset), 0)} for offset in range(days - 1, -1, -1)]
    top_sold_products = list(
        events.filter(event_name="purchase")
        .exclude(product_id="")
        .values("product_id", "product_name")
        .annotate(sold_units=Count("id"))
        .order_by("-sold_units", "product_name")[:10]
    )
    top_wishlisted_products = list(
        events.filter(event_name="wishlist_click")
        .exclude(product_id="")
        .values("product_id", "product_name")
        .annotate(wishlists=Count("id"))
        .order_by("-wishlists", "product_name")[:10]
    )
    return {
        "range_days": days,
        "visitors": visitors,
        "events": events.count(),
        "account_visitors": events.exclude(customer_id="").values("customer_id").distinct().count(),
        "funnel": {"product_views": product_views, "adds": adds, "checkouts": checkouts, "purchases": purchases},
        "daily": daily,
        "top_products": list(events.exclude(product_id="").values("product_id", "product_name").annotate(interactions=Count("id"), adds=Count("id", filter=Q(event_name__in=["add_to_cart", "quick_add_click"]))).order_by("-interactions")[:10]),
        "top_sold_products": top_sold_products,
        "top_wishlisted_products": top_wishlisted_products,
        "locations": list(events.exclude(country_code="").values("country_code", "region", "city").annotate(events=Count("id"), visitors=Count("anonymous_id", distinct=True)).order_by("-events")[:20]),
        "devices": list(events.exclude(device_type="").values("device_type").annotate(events=Count("id")).order_by("-events")),
    }


def _decimal_or_none(value):
    try:
        return Decimal(str(value)) if value not in (None, "") else None
    except (InvalidOperation, ValueError):
        return None


def _header(request, *names):
    for name in names:
        value = request.headers.get(name, "")
        if value:
            return value
    return ""


def _device_type(user_agent: str) -> str:
    normalized = user_agent.lower()
    if any(value in normalized for value in ("mobile", "android", "iphone")):
        return "mobile"
    if any(value in normalized for value in ("ipad", "tablet")):
        return "tablet"
    return "desktop"
