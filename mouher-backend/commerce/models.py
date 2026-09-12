from __future__ import annotations

from django.db import models


class BrowserPushSubscription(models.Model):
    endpoint = models.URLField(unique=True, max_length=1024)
    subscription = models.JSONField()
    customer_id = models.CharField(max_length=128, blank=True)
    browser = models.CharField(max_length=64, blank=True)
    user_agent = models.TextField(blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["customer_id", "active"]),
        ]

    def __str__(self) -> str:
        return self.endpoint
