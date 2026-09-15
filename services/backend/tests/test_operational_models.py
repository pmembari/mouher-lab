from __future__ import annotations

from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from commerce.models import (
    AdminAuditLog,
    AdminNotification,
    DashboardDailyMetric,
    OwnerRole,
    OwnerUser,
    ProductAdminNote,
    SupportTicket,
    SupportTicketMessage,
)


class OperationalModelTests(TestCase):
    def test_owner_user_roles_and_audit_log_are_persisted(self):
        owner = OwnerUser.objects.create(email="owner@mouher.test", name="Owner")
        role = OwnerRole.objects.create(
            name="owner",
            permissions={"products": ["read"], "orders": ["read"]},
        )
        owner.roles.add(role)

        log = AdminAuditLog.objects.create(
            owner_user=owner,
            action="product.note.create",
            resource_type="product",
            resource_id="prod_1",
            before={},
            after={"note": "Check stock photos"},
            ip_address="203.0.113.7",
            user_agent="Dashboard",
        )

        self.assertEqual(owner.roles.get(), role)
        self.assertEqual(log.owner_user, owner)
        self.assertEqual(log.after["note"], "Check stock photos")

    def test_metrics_notifications_support_and_notes_are_persisted(self):
        owner = OwnerUser.objects.create(email="assistant@mouher.test", name="Assistant")
        metric = DashboardDailyMetric.objects.create(
            date=timezone.localdate(),
            visitors=10,
            product_views=7,
            add_to_cart_count=3,
            checkout_count=2,
            purchase_count=1,
            order_count=1,
            gross_revenue=Decimal("120.50"),
            net_revenue=Decimal("110.25"),
            currency="EUR",
        )
        notification = AdminNotification.objects.create(
            type="inventory",
            severity=AdminNotification.Severity.WARNING,
            title="Low stock",
            body="A coat variant is below threshold.",
            resource_type="product",
            resource_id="prod_1",
        )
        ticket = SupportTicket.objects.create(
            customer_id="cus_1",
            email="buyer@example.test",
            subject="Sizing",
            body="Does this coat run small?",
            assigned_owner=owner,
        )
        message = SupportTicketMessage.objects.create(
            ticket=ticket,
            author_type=SupportTicketMessage.AuthorType.OWNER,
            author_id=str(owner.id),
            body="We recommend one size up.",
        )
        note = ProductAdminNote.objects.create(
            product_id="prod_1",
            owner_user=owner,
            note="Review Persian copy before launch.",
        )

        self.assertEqual(metric.currency, "EUR")
        self.assertEqual(notification.status, AdminNotification.Status.UNREAD)
        self.assertEqual(message.ticket, ticket)
        self.assertEqual(note.owner_user, owner)
