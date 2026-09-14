#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="$REPO_ROOT/dist"
ENTRIES=(index.html assets admin edu org school)

rm -rf "$OUTPUT"
mkdir -p "$OUTPUT"

for entry in "${ENTRIES[@]}"; do
  cp -R "$REPO_ROOT/$entry" "$OUTPUT/$entry"
done

printf '静态站点已构建到 %s\n' "$OUTPUT"
