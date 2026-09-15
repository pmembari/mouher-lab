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


class OwnerRole(models.Model):
    name = models.CharField(max_length=80, unique=True)
    permissions = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["name"]),
        ]

    def __str__(self) -> str:
        return self.name


class OwnerUser(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        DISABLED = "disabled", "Disabled"
        INVITED = "invited", "Invited"

    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    roles = models.ManyToManyField(OwnerRole, through="OwnerUserRole", related_name="users")
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return self.email


class OwnerUserRole(models.Model):
    owner_user = models.ForeignKey(OwnerUser, on_delete=models.CASCADE)
    owner_role = models.ForeignKey(OwnerRole, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner_user", "owner_role"],
                name="unique_owner_user_role",
            )
        ]


class AdminAuditLog(models.Model):
    owner_user = models.ForeignKey(
        OwnerUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=128)
    resource_type = models.CharField(max_length=80)
    resource_id = models.CharField(max_length=160, blank=True)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["action", "created_at"]),
            models.Index(fields=["resource_type", "resource_id"]),
            models.Index(fields=["owner_user", "created_at"]),
        ]


class DashboardDailyMetric(models.Model):
    date = models.DateField(unique=True)
    visitors = models.PositiveIntegerField(default=0)
    product_views = models.PositiveIntegerField(default=0)
    add_to_cart_count = models.PositiveIntegerField(default=0)
    checkout_count = models.PositiveIntegerField(default=0)
    purchase_count = models.PositiveIntegerField(default=0)
    order_count = models.PositiveIntegerField(default=0)
    gross_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    net_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    currency = models.CharField(max_length=8, default="EUR")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["date"]),
        ]


class AdminNotification(models.Model):
    class Severity(models.TextChoices):
        INFO = "info", "Info"
        WARNING = "warning", "Warning"
        ERROR = "error", "Error"
        SUCCESS = "success", "Success"

    class Status(models.TextChoices):
        UNREAD = "unread", "Unread"
        READ = "read", "Read"
        ARCHIVED = "archived", "Archived"

    type = models.CharField(max_length=80)
    severity = models.CharField(max_length=16, choices=Severity.choices, default=Severity.INFO)
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.UNREAD)
    resource_type = models.CharField(max_length=80, blank=True)
    resource_id = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["type", "severity"]),
            models.Index(fields=["resource_type", "resource_id"]),
        ]


class SupportTicket(models.Model):
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        PENDING = "pending", "Pending"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    customer_id = models.CharField(max_length=128, blank=True)
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=16, choices=Priority.choices, default=Priority.NORMAL)
    assigned_owner = models.ForeignKey(
        OwnerUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_support_tickets",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status", "priority"]),
            models.Index(fields=["customer_id"]),
            models.Index(fields=["assigned_owner", "status"]),
            models.Index(fields=["created_at"]),
        ]


class SupportTicketMessage(models.Model):
    class AuthorType(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        OWNER = "owner", "Owner"
        SYSTEM = "system", "System"

    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    author_type = models.CharField(max_length=16, choices=AuthorType.choices)
    author_id = models.CharField(max_length=160, blank=True)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["ticket", "created_at"]),
            models.Index(fields=["author_type", "author_id"]),
        ]


class ProductAdminNote(models.Model):
    product_id = models.CharField(max_length=128)
    owner_user = models.ForeignKey(
        OwnerUser,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="product_notes",
    )
    note = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["product_id", "created_at"]),
            models.Index(fields=["owner_user", "created_at"]),
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
