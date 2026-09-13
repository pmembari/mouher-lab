#!/usr/bin/env python3
"""Check required credential keys without printing credential values."""

from __future__ import annotations

import os
from pathlib import Path


REQUIRED_KEYS = {
    "backend": ["DJANGO_SECRET_KEY", "MOUHER_INTERNAL_API_TOKEN"],
    "payment": ["PAYMENT_SERVICE_SHARED_SECRET", "PAYMENT_GATEWAY_API_KEY"],
    "database": ["POSTGRES_PASSWORD"],
}


def read_keys(path: Path) -> set[str]:
    if not path.is_file():
        return set()
    return {
        line.split("=", 1)[0].strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.lstrip().startswith("#") and "=" in line
    }


def main() -> int:
    path = Path(os.environ.get("MOUHER_CREDENTIALS_FILE", "~/.credentials/mouher")).expanduser()
    keys = read_keys(path)
    print(f"Credentials file: {path}")
    if not path.is_file():
        print("MISSING_FILE")
        return 1

    failed = False
    for app, required in REQUIRED_KEYS.items():
        missing = [key for key in required if key not in keys and not os.environ.get(key)]
        print(f"{app}: {'OK' if not missing else 'MISSING ' + ', '.join(missing)}")
        failed |= bool(missing)
    return int(failed)


if __name__ == "__main__":
    raise SystemExit(main())