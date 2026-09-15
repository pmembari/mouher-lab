import os
from pathlib import Path

from .credentials import credential


BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = credential("DJANGO_SECRET_KEY", "development-only-secret-key")
DEBUG = credential("DJANGO_DEBUG", "1").lower() not in {"0", "false", "no"}
ALLOWED_HOSTS = [
    host.strip()
    for host in credential("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "commerce",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "mouher_backend.urls"
WSGI_APPLICATION = "mouher_backend.wsgi.application"
ASGI_APPLICATION = "mouher_backend.asgi.application"

DJANGO_DATABASE_URL = credential("DJANGO_DATABASE_URL", "")
if DJANGO_DATABASE_URL:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": credential("DJANGO_DATABASE_NAME", ""),
            "USER": credential("DJANGO_DATABASE_USER", ""),
            "PASSWORD": credential("DJANGO_DATABASE_PASSWORD", ""),
            "HOST": credential("DJANGO_DATABASE_HOST", ""),
            "PORT": credential("DJANGO_DATABASE_PORT", ""),
            "CONN_MAX_AGE": int(credential("DJANGO_DATABASE_CONN_MAX_AGE", "60")),
        }
    }

    try:
        from urllib.parse import urlparse

        parsed_database_url = urlparse(DJANGO_DATABASE_URL)
        DATABASES["default"].update(
            {
                "NAME": parsed_database_url.path.lstrip("/"),
                "USER": parsed_database_url.username or "",
                "PASSWORD": parsed_database_url.password or "",
                "HOST": parsed_database_url.hostname or "",
                "PORT": str(parsed_database_url.port or ""),
            }
        )
    except ValueError:
        pass
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

MEDUSA_BACKEND_URL = credential("MEDUSA_BACKEND_URL", "")
MEDUSA_PUBLISHABLE_KEY = credential("MEDUSA_PUBLISHABLE_KEY", "")
MEDUSA_REGION_ID = credential("MEDUSA_REGION_ID", "")
MEDUSA_COUNTRY_CODE = credential("MEDUSA_COUNTRY_CODE", "")
MEDUSA_CURRENCY_CODE = credential("MEDUSA_CURRENCY_CODE", "")
MEDUSA_ADMIN_API_TOKEN = credential("MEDUSA_ADMIN_API_TOKEN", "")
MEDUSA_ADMIN_BEARER_TOKEN = credential("MEDUSA_ADMIN_BEARER_TOKEN", "")
MEDUSA_REQUEST_TIMEOUT_SECONDS = float(
    credential("MEDUSA_REQUEST_TIMEOUT_SECONDS", "15")
)
MOUHER_STOREFRONT_PRODUCT_LIMIT = credential("MOUHER_STOREFRONT_PRODUCT_LIMIT", "")
MOUHER_STOREFRONT_PRODUCT_FIELDS = credential("MOUHER_STOREFRONT_PRODUCT_FIELDS", "")
MOUHER_OWNER_USE_CATALOG_SNAPSHOT = credential(
    "MOUHER_OWNER_USE_CATALOG_SNAPSHOT",
    "0",
).lower() in {"1", "true", "yes"}

MOUHER_INTERNAL_API_TOKEN = credential("MOUHER_INTERNAL_API_TOKEN", "")
MOUHER_PAYMENT_WEBHOOK_SECRET = credential("MOUHER_PAYMENT_WEBHOOK_SECRET", "")
MOUHER_DEFAULT_PAYMENT_PROVIDER_ID = os.environ.get(
    "MOUHER_DEFAULT_PAYMENT_PROVIDER_ID",
    "",
)
MOUHER_WEB_PUSH_VAPID_PUBLIC_KEY = os.environ.get(
    "MOUHER_WEB_PUSH_VAPID_PUBLIC_KEY",
    "",
)
MOUHER_WEB_PUSH_VAPID_PRIVATE_KEY = os.environ.get(
    "MOUHER_WEB_PUSH_VAPID_PRIVATE_KEY",
    "",
)
MOUHER_WEB_PUSH_VAPID_SUBJECT = os.environ.get(
    "MOUHER_WEB_PUSH_VAPID_SUBJECT",
    "mailto:owner@mouher.com",
)
