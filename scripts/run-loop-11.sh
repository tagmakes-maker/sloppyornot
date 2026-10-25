#!/usr/bin/env bash
# Issue #11: Smallest loop runs end to end with curl
# Loads FloodWatch CHS (A) and FirstRun (B), reviews A,
# runs observe -> find-gap -> propose -> approve, prints the blueprint.
# Run from repo root: bash scripts/run-loop-11.sh

BASE="https://api.sloppyornot.com"
SEED="$(dirname "$0")/../seed"

echo "=== Issue #11: End-to-end loop ==="
echo ""

# 1. Load Product A: FloodWatch CHS
echo "--- 1. POST FloodWatch CHS (Product A) ---"
RESP=$(curl -s -X POST "$BASE/products" \
  -H "Content-Type: application/json" \
  -d @"$SEED/floodwatch-chs.json")
A_ID=$(echo "$RESP" | python3 -I -c "import json,sys; d=json.load(sys.stdin); print(d.get('id') or d.get('error','?'))" 2>/dev/null || echo "?")
if [ "$A_ID" = "product id already exists" ]; then
  A_ID="floodwatch-chs"
  echo "Already exists, using id: $A_ID"
else
  echo "Loaded: $A_ID"
fi

# 2. Load Product B: FirstRun
echo ""
echo "--- 2. POST FirstRun (Product B) ---"
RESP=$(curl -s -X POST "$BASE/products" \
  -H "Content-Type: application/json" \
  -d @"$SEED/firstrun.json")
B_ID=$(echo "$RESP" | python3 -I -c "import json,sys; d=json.load(sys.stdin); print(d.get('id') or d.get('error','?'))" 2>/dev/null || echo "?")
if [ "$B_ID" = "product id already exists" ]; then
  B_ID="firstrun"
  echo "Already exists, using id: $B_ID"
else
  echo "Loaded: $B_ID"
fi

# 3. Review Product A (send a swipe)
echo ""
echo "--- 3. POST /products/$A_ID/review ---"
curl -s -X POST "$BASE/products/$A_ID/review" \
  -H "Content-Type: application/json" \
  -d '{"test":true,"would_use":1,"understood_immediately":0,"feels_distinctive":1,"easy_to_use":1,"looks_like_slop":0}' \
  | python3 -I -c "import json,sys; raw=sys.stdin.read(); print(raw[:200] if not raw.startswith('{') else json.dumps(json.loads(raw), indent=2))" 2>&1 || echo "(empty response)"

# 4. Agent: observe
echo ""
echo "--- 4. POST /agent/observe/$A_ID ---"
OBSERVE_RAW=$(curl -s -X POST "$BASE/agent/observe/$A_ID" -H "Content-Type: application/json")
echo "Raw: ${OBSERVE_RAW:0:300}"
echo "$OBSERVE_RAW" | python3 -I -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d, indent=2))" 2>/dev/null || true

# 5. Agent: find-gap
echo ""
echo "--- 5. POST /agent/find-gap/$A_ID ---"
FINDGAP_RAW=$(curl -s -X POST "$BASE/agent/find-gap/$A_ID" -H "Content-Type: application/json")
echo "Raw: ${FINDGAP_RAW:0:300}"
echo "$FINDGAP_RAW" | python3 -I -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d, indent=2))" 2>/dev/null || true

# 6. Agent: propose
echo ""
echo "--- 6. POST /agent/propose/$A_ID ---"
PROPOSE=$(curl -s -X POST "$BASE/agent/propose/$A_ID" -H "Content-Type: application/json")
echo "Raw: ${PROPOSE:0:300}"
echo "$PROPOSE" | python3 -I -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d, indent=2))" 2>/dev/null || true
PARTNER=$(echo "$PROPOSE" | python3 -I -c "import json,sys; d=json.load(sys.stdin); print((d.get('proposal') or {}).get('product_id',''))" 2>/dev/null || true)

if [ -z "$PARTNER" ]; then
  echo ""
  echo "No proposal in the propose response. Check the output above."
  exit 1
fi
echo "Proposed partner: $PARTNER (expected $B_ID)"

# 7. Approve the match (the route takes product A's id)
echo ""
echo "--- 7. POST /matches/$A_ID/approve ---"
BLUEPRINT=$(curl -s -X POST "$BASE/matches/$A_ID/approve" \
  -H "Content-Type: application/json" -d '{"approved_by":"run-loop-11"}')
echo "$BLUEPRINT" | python3 -I -c "import json,sys; d=json.load(sys.stdin); print(json.dumps(d.get('blueprint', d), indent=2))" 2>/dev/null || echo "Raw: ${BLUEPRINT:0:300}"

# 8. Print agent log
echo ""
echo "--- 8. GET /agent/log ---"
curl -s "$BASE/agent/log" | python3 -I -c "import json,sys; entries=json.load(sys.stdin); print(f'{len(entries)} entries'); [print(f'  {e.get(\"step\",\"?\")} at {e.get(\"at\",\"?\")}') for e in entries]"

echo ""
echo "=== Done. Issue #11 complete. ==="
