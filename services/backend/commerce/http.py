from __future__ import annotations

import json
from typing import Any

from django.http import HttpRequest, JsonResponse

from .medusa import JsonObject, MedusaAPIError


def json_response(payload: JsonObject, status: int = 200) -> JsonResponse:
    return JsonResponse(payload, status=status, json_dumps_params={"ensure_ascii": False})


def error_response(error: Exception) -> JsonResponse:
    if isinstance(error, MedusaAPIError):
        return json_response(
            {
                "error": {
                    "message": str(error),
                    "code": error_code(error),
                    "status_code": error.status_code,
                    "payload": error.payload,
                }
            },
            status=error.status_code,
        )

    return json_response(
        {"error": {"message": "Internal server error.", "code": "internal_error"}},
        status=500,
    )


def error_code(error: MedusaAPIError) -> str:
    if error.status_code == 400:
        return "bad_request"
    if error.status_code == 401:
        return "unauthorized"
    if error.status_code == 403:
        return "forbidden"
    if error.status_code == 404:
        return "not_found"
    if error.status_code == 409:
        return "conflict"
    if error.status_code == 503:
        return "service_unavailable"
    if 500 <= error.status_code:
        return "upstream_error"
    return "request_failed"


def parse_json_body(request: HttpRequest) -> JsonObject:
    if not request.body:
        return {}

    try:
        payload: Any = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise MedusaAPIError(400, "Request body must be valid JSON.") from error

    if not isinstance(payload, dict):
        raise MedusaAPIError(400, "Request body must be a JSON object.")

    return payload


def positive_int(value: str | None, default: int, maximum: int = 100) -> int:
    try:
        number = int(value or default)
    except (TypeError, ValueError):
        return default

    return max(0, min(number, maximum))


def query_params(request: HttpRequest) -> JsonObject:
    params: JsonObject = {}

    for key, values in request.GET.lists():
        clean_values = [value for value in values if value != ""]
        if not clean_values:
            continue

        params[key] = clean_values if len(clean_values) > 1 else clean_values[0]

    return params


def allowed_query_params(request: HttpRequest, allowed_keys: set[str]) -> JsonObject:
    params = query_params(request)
    return {key: value for key, value in params.items() if key in allowed_keys}
