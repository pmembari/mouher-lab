from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="BrowserPushSubscription",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("endpoint", models.URLField(max_length=1024, unique=True)),
                ("subscription", models.JSONField()),
                ("customer_id", models.CharField(blank=True, max_length=128)),
                ("browser", models.CharField(blank=True, max_length=64)),
                ("user_agent", models.TextField(blank=True)),
                ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("last_sent_at", models.DateTimeField(blank=True, null=True)),
            ],
            options={
                "indexes": [
                    models.Index(
                        fields=["customer_id", "active"],
                        name="commerce_b_customer_1fbe91_idx",
                    )
                ],
            },
        ),
    ]
