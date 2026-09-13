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


class AnalyticsEvent(models.Model):
    event_name = models.CharField(max_length=64)
    anonymous_id = models.CharField(max_length=64, blank=True)
    session_id = models.CharField(max_length=64, blank=True)
    customer_id = models.CharField(max_length=128, blank=True)
    path = models.CharField(max_length=512, blank=True)
    product_id = models.CharField(max_length=128, blank=True)
    product_name = models.CharField(max_length=255, blank=True)
    value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=8, blank=True)
    country_code = models.CharField(max_length=2, blank=True)
    region = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    device_type = models.CharField(max_length=16, blank=True)
    properties = models.JSONField(default=dict, blank=True)
    occurred_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["event_name", "occurred_at"]),
            models.Index(fields=["product_id", "occurred_at"]),
            models.Index(fields=["country_code", "occurred_at"]),
            models.Index(fields=["customer_id", "occurred_at"]),
        ]


class CatalogCategory(models.Model):
    legacy_id = models.CharField(max_length=128, unique=True)
    slug = models.SlugField(max_length=160)
    name = models.CharField(max_length=255)
    name_fa = models.CharField(max_length=255, blank=True)
    is_visible = models.BooleanField(default=True)
    source_updated_at = models.DateTimeField(null=True, blank=True)


class CatalogCollection(models.Model):
    legacy_id = models.CharField(max_length=128, unique=True)
    slug = models.SlugField(max_length=160)
    title = models.CharField(max_length=255)
    title_fa = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    is_visible = models.BooleanField(default=True)


class CatalogProduct(models.Model):
    legacy_id = models.CharField(max_length=128, unique=True)
    upc = models.CharField(max_length=128, blank=True)
    handle = models.SlugField(max_length=160, unique=True)
    title = models.CharField(max_length=255)
    title_fa = models.CharField(max_length=255, blank=True)
    description_fa = models.TextField(blank=True)
    is_visible = models.BooleanField(default=True)
    is_promotion = models.BooleanField(default=False)
    source_created_at = models.DateTimeField(null=True, blank=True)
    source_updated_at = models.DateTimeField(null=True, blank=True)
    categories = models.ManyToManyField(CatalogCategory, blank=True)
    collections = models.ManyToManyField(CatalogCollection, blank=True)


class CatalogVariant(models.Model):
    product = models.ForeignKey(CatalogProduct, on_delete=models.CASCADE, related_name="variants")
    legacy_id = models.CharField(max_length=128, unique=True)
    sku = models.CharField(max_length=128, blank=True)
    stock = models.IntegerField(default=0)
    source_price = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    source_discount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    size = models.JSONField(default=dict, blank=True)
    color = models.JSONField(default=dict, blank=True)
    is_visible = models.BooleanField(default=True)
