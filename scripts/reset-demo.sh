#!/usr/bin/env bash
# Resets the live demo: deletes every key in the worker's KV (products,
# swipes, rejections, agent log), then reloads the seed products through
# the API. Not an API route, so nobody can call it from the internet.
# It runs from your machine with your Cloudflare login.
#
# Needs: npx wrangler login with access to the Tagmakes account.
# Run from repo root: bash scripts/reset-demo.sh

set -e

# the Tagmakes account, where the live worker and its KV live
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-24e9a7cf816f435cac65da9daef6dc82}"

BASE="https://api.sloppyornot.com"
NS="ccf3f3081542491c96020fe1e679c8ac"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cd "$ROOT/worker"

echo "--- Keys in the live store ---"
npx wrangler kv key list --namespace-id "$NS" --remote > "$TMP/keys.json"
python3 -I -c "import json,sys; ks=json.load(open(sys.argv[1])); json.dump([k['name'] for k in ks], open(sys.argv[2],'w')); print(len(ks), 'keys:', ', '.join(k['name'] for k in ks))" "$TMP/keys.json" "$TMP/names.json"

read -r -p "Delete all of them and reload the seed products? Type yes: " ANSWER
if [ "$ANSWER" != "yes" ]; then
  echo "Stopped. Nothing deleted."
  exit 0
fi

if [ "$(cat "$TMP/names.json")" != "[]" ]; then
  # back up every key first, outside the repo, because real swipes are real people's data
  BACKUP="$HOME/sloppyornot-backups/$(date +%Y-%m-%d-%H%M%S)"
  mkdir -p "$BACKUP"
  python3 -I -c "import json,sys; print('\n'.join(json.load(open(sys.argv[1]))))" "$TMP/names.json" | while read -r KEY; do
    # url:<link> keys hold slashes, which a file name cannot
    npx wrangler kv key get "$KEY" --namespace-id "$NS" --remote --text < /dev/null > "$BACKUP/$(printf '%s' "$KEY" | tr '/' '_').json"
  done
  echo "Backed up $(ls "$BACKUP" | wc -l) keys to $BACKUP"

  npx wrangler kv bulk delete "$TMP/names.json" --namespace-id "$NS" --remote --force
fi

echo ""
echo "--- Waiting for the delete to reach every Cloudflare location (up to a minute) ---"
# KV deletes take time to spread, and reloading too soon gets 409 "already exists"
for f in "$ROOT"/seed/*.json; do
  ID=$(basename "$f" .json)
  for i in $(seq 1 30); do
    [ "$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products/$ID")" = "404" ] && break
    sleep 3
  done
done

echo ""
echo "--- Reloading seed products ---"
for f in "$ROOT"/seed/*.json; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/products" \
    -H "Content-Type: application/json" -d @"$f")
  echo "$(basename "$f" .json): $CODE"
done

echo ""
echo "Done. 201 means loaded. Check $BASE/products"
