#!/usr/bin/env bash
# Ping IndexNow for every URL in sitemap.xml.
# Run after every deploy to speed up search-engine indexing.
set -euo pipefail
cd "$(dirname "$0")"

KEY_FILE="$(ls 9*.txt 2>/dev/null | head -1 || true)"
if [[ -z "$KEY_FILE" ]]; then
  echo "error: indexnow key file not found" >&2
  exit 1
fi
KEY="${KEY_FILE%.txt}"
BASE="https://api.indexnow.org/indexnow"

grep -o '<loc>[^<]*</loc>' sitemap.xml | sed -e 's/<loc>//' -e 's|</loc>||' | while read -r url; do
  code="$(curl -s -o /dev/null -w "%{http_code}" \
    "$BASE?url=$url&key=$KEY&keyLocation=https://zishanhack.com/$KEY_FILE")"
  echo "$code $url"
done
