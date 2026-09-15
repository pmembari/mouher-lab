from __future__ import annotations

import os
from pathlib import Path


DEFAULT_CREDENTIALS_FILE = Path.home() / ".credentials" / "mouher"


def credentials_path() -> Path:
    return Path(os.environ.get("MOUHER_CREDENTIALS_FILE", DEFAULT_CREDENTIALS_FILE)).expanduser()


def load_credentials() -> dict[str, str]:
    path = credentials_path()
    if not path.is_file():
        return {}

    values = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def credential(name: str, default: str = "") -> str:
    return os.environ.get(name, load_credentials().get(name, default))


def missing_credentials(names: list[str]) -> list[str]:
    values = load_credentials()
    return [name for name in names if not os.environ.get(name) and not values.get(name)]