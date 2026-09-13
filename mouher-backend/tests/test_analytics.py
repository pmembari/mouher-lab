from datetime import timedelta

from django.test import TestCase, override_settings
from django.utils import timezone

from commerce.models import AnalyticsEvent


@override_settings(MOUHER_INTERNAL_API_TOKEN="owner-secret")
class AnalyticsTests(TestCase):
    def test_collector_requires_consent_and_does_not_store_ip(self):
        denied = self.client.post("/api/commerce/analytics/events/", {"event_name": "page_view", "consent": False}, content_type="application/json")
        self.assertEqual(denied.status_code, 400)
        accepted = self.client.post(
            "/api/commerce/analytics/events/",
            {"event_name": "product_view", "consent": True, "anonymous_id": "visitor-1", "product_id": "prod-1", "product_name": "Coat"},
            content_type="application/json",
            HTTP_CF_IPCOUNTRY="IT",
            HTTP_X_FORWARDED_FOR="203.0.113.10",
            HTTP_USER_AGENT="Mobile Safari",
        )
        self.assertEqual(accepted.status_code, 202)
        event = AnalyticsEvent.objects.get()
        self.assertEqual(event.country_code, "IT")
        self.assertEqual(event.device_type, "mobile")
        self.assertNotIn("ip", event.properties)

    def test_dashboard_is_protected_and_aggregated(self):
        AnalyticsEvent.objects.create(event_name="product_click", anonymous_id="v1", product_id="p1", product_name="Coat", country_code="IT", device_type="desktop", occurred_at=timezone.now() - timedelta(hours=1))
        denied = self.client.get("/api/commerce/analytics/dashboard/")
        self.assertEqual(denied.status_code, 401)
        response = self.client.get("/api/commerce/analytics/dashboard/?days=7", HTTP_X_MOUHER_INTERNAL_TOKEN="owner-secret")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("data", payload)
        self.assertEqual(payload["data"]["visitors"], 1)
        self.assertEqual(payload["data"]["funnel"]["product_views"], 1)
        self.assertEqual(payload["data"]["locations"][0]["country_code"], "IT")
