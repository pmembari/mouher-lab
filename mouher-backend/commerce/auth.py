from __future__ import annotations

from functools import wraps
from typing import Callable

from django.conf import settings
from django.http import HttpRequest, JsonResponse

from .http import json_response


def require_internal_token(view: Callable) -> Callable:
    @wraps(view)
    def wrapped(request: HttpRequest, *args, **kwargs) -> JsonResponse:
        expected = getattr(settings, "MOUHER_INTERNAL_API_TOKEN", "")
        supplied = request.headers.get("X-Mouher-Internal-Token", "")

        if not expected:
            return json_response(
                {
                    "error": {
                        "message": "Internal API token is not configured.",
                        "code": "service_unavailable",
                    }
                },
                status=503,
            )

        if supplied != expected:
            return json_response(
                {
                    "error": {
                        "message": "Invalid internal API token.",
                        "code": "unauthorized",
                    }
                },
                status=401,
            )

        return view(request, *args, **kwargs)

    return wrapped
