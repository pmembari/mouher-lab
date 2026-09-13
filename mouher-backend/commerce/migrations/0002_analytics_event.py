from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("commerce", "0001_browser_push_subscription")]

    operations = [
        migrations.CreateModel(
            name="AnalyticsEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("event_name", models.CharField(max_length=64)),
                ("anonymous_id", models.CharField(blank=True, max_length=64)),
                ("session_id", models.CharField(blank=True, max_length=64)),
                ("customer_id", models.CharField(blank=True, max_length=128)),
                ("path", models.CharField(blank=True, max_length=512)),
                ("product_id", models.CharField(blank=True, max_length=128)),
                ("product_name", models.CharField(blank=True, max_length=255)),
                ("value", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                ("currency", models.CharField(blank=True, max_length=8)),
                ("country_code", models.CharField(blank=True, max_length=2)),
                ("region", models.CharField(blank=True, max_length=100)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("device_type", models.CharField(blank=True, max_length=16)),
                ("properties", models.JSONField(blank=True, default=dict)),
                ("occurred_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"indexes": [
                models.Index(fields=["event_name", "occurred_at"], name="commerce_a_event_n_9575ef_idx"),
                models.Index(fields=["product_id", "occurred_at"], name="commerce_a_product_7b6433_idx"),
                models.Index(fields=["country_code", "occurred_at"], name="commerce_a_country_2ed897_idx"),
                models.Index(fields=["customer_id", "occurred_at"], name="commerce_a_customer_1aac64_idx"),
            ]},
        )
    ]
