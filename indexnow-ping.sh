#!/usr/bin/env bash
# Submit every URL (main site + blog) to IndexNow in a single POST.
# Run after every deploy to speed up search-engine indexing.
#
# IndexNow participants: Bing, Naver, Seznam.cz, Yandex, Yep (not Google).
set -euo pipefail
cd "$(dirname "$0")"

# Key file: the hex-named file that is also hosted at https://zishanhack.com/<key>.txt
KEY_FILE="$(find . -maxdepth 1 -regextype posix-extended -regex '.*/[0-9a-f]{32,128}\.txt' -printf '%f\n' | sort | head -1 || true)"
if [[ -z "${KEY_FILE:-}" ]]; then
  echo "error: indexnow key file not found" >&2
  exit 1
fi
KEY="$(tr -d '[:space:]' < "$KEY_FILE")"
KEY_LOCATION="https://zishanhack.com/$KEY_FILE"
BASE="https://api.indexnow.org/indexnow"

# Collect URLs: local main sitemap + live blog sitemap (deduped).
mapfile -t URLS < <(
  {
    grep -o '<loc>[^<]*</loc>' sitemap.xml | sed -e 's|<loc>||' -e 's|</loc>||'
    curl -fsS https://zishanhack.com/blog/sitemap.xml \
      | grep -o '<loc>[^<]*</loc>' | sed -e 's|<loc>||' -e 's|</loc>||'
  } | sort -u
)

if [[ ${#URLS[@]} -eq 0 ]]; then
  echo "error: no URLs collected" >&2
  exit 1
fi

PAYLOAD="$(mktemp)"
RESP="$(mktemp)"
trap 'rm -f "$PAYLOAD" "$RESP"' EXIT

python3 - "$KEY" "$KEY_LOCATION" "${URLS[@]}" > "$PAYLOAD" <<'PY'
import json, sys
key, key_location = sys.argv[1], sys.argv[2]
print(json.dumps({
    "host": "zishanhack.com",
    "key": key,
    "keyLocation": key_location,
    "urlList": sys.argv[3:],
}))
PY

HTTP_CODE="$(curl -s -o "$RESP" -w '%{http_code}' -X POST \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data @"$PAYLOAD" "$BASE")"

echo "keyLocation: $KEY_LOCATION"
echo "urls submitted: ${#URLS[@]}"
echo "IndexNow HTTP $HTTP_CODE"
cat "$RESP"
echo

case "$HTTP_CODE" in
  200|202) echo "OK: accepted (200 = pending, 202 = received)" ;;
  *) echo "FAILED: unexpected response" >&2; exit 1 ;;
esac
