#!/usr/bin/env sh
set -eu

TARGET=/opt/cloudbeaver/workspace/GlobalConfiguration/.dbeaver/data-sources.json
SOURCE=/opt/cloudbeaver/bootstrap/data-sources.json

mkdir -p "$(dirname "$TARGET")"
cp "$SOURCE" "$TARGET"
