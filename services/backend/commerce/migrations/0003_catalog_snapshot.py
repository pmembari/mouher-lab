from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("commerce", "0002_analytics_event")]

    operations = [
        migrations.CreateModel(
            name="CatalogCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("legacy_id", models.CharField(max_length=128, unique=True)),
                ("slug", models.SlugField(max_length=160)),
                ("name", models.CharField(max_length=255)),
                ("name_fa", models.CharField(blank=True, max_length=255)),
                ("is_visible", models.BooleanField(default=True)),
                ("source_updated_at", models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="CatalogCollection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("legacy_id", models.CharField(max_length=128, unique=True)),
                ("slug", models.SlugField(max_length=160)),
                ("title", models.CharField(max_length=255)),
                ("title_fa", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True)),
                ("is_visible", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="CatalogProduct",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("legacy_id", models.CharField(max_length=128, unique=True)),
                ("upc", models.CharField(blank=True, max_length=128)),
                ("handle", models.SlugField(max_length=160, unique=True)),
                ("title", models.CharField(max_length=255)),
                ("title_fa", models.CharField(blank=True, max_length=255)),
                ("description_fa", models.TextField(blank=True)),
                ("is_visible", models.BooleanField(default=True)),
                ("is_promotion", models.BooleanField(default=False)),
                ("source_created_at", models.DateTimeField(blank=True, null=True)),
                ("source_updated_at", models.DateTimeField(blank=True, null=True)),
                ("categories", models.ManyToManyField(blank=True, to="commerce.catalogcategory")),
                ("collections", models.ManyToManyField(blank=True, to="commerce.catalogcollection")),
            ],
        ),
        migrations.CreateModel(
            name="CatalogVariant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("legacy_id", models.CharField(max_length=128, unique=True)),
                ("sku", models.CharField(blank=True, max_length=128)),
                ("stock", models.IntegerField(default=0)),
                ("source_price", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                ("source_discount", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True)),
                ("size", models.JSONField(blank=True, default=dict)),
                ("color", models.JSONField(blank=True, default=dict)),
                ("is_visible", models.BooleanField(default=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="variants", to="commerce.catalogproduct")),
            ],
        ),
    ]