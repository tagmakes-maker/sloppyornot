#!/usr/bin/env bash
# Bulk add: sends every URL in a file through POST /judge, the same route the site uses.
# A URL that was already judged returns its first verdict and does not count against the cap.
# The cap is 30 new judgments per network per hour, so keep a batch under 30.
# Usage: bash scripts/bulk-judge.sh scripts/bulk-urls.txt
# Optional: BY=name sets the builder handle. PARALLEL=3 sets how many run at once.
# A page the judge cannot read gets NEEDS DESCRIPTION. AUTO_DESCRIBE=1 retries it once with the
# page's own meta description, the same one line the site asks a human to type.

BASE="${BASE:-https://api.sloppyornot.com}"
FILE="${1:?give a file with one URL per line}"
export BASE BY="${BY:-}" AUTO_DESCRIBE="${AUTO_DESCRIBE:-}"

judge_one() {
  url="$1"
  body=$(python3 -I -c 'import json,os,sys; print(json.dumps({"url": sys.argv[1], "by": os.environ.get("BY", "")}))' "$url")
  out=$(curl -s -m 180 -w '\n%{http_code}' -X POST "$BASE/judge" -H "Content-Type: application/json" -d "$body")
  if [ -n "$AUTO_DESCRIBE" ] && [[ "$out" == *needs_description* ]]; then
    body=$(curl -s -m 20 -L "$url" | python3 -I -c '
import html, json, os, re, sys
h = sys.stdin.read()
m = re.search(r"<meta[^>]+(?:name|property)=.(?:og:)?description.[^>]+content=\"([^\"]+)", h, re.I)
print(json.dumps({"url": sys.argv[1], "by": os.environ.get("BY", ""), "description": html.unescape(m.group(1)) if m else ""}))' "$url")
    out=$(curl -s -m 180 -w '\n%{http_code}' -X POST "$BASE/judge" -H "Content-Type: application/json" -d "$body")
  fi
  code="${out##*$'\n'}"
  json="${out%$'\n'*}"
  python3 -I -c '
import json, sys
url, code, raw = sys.argv[1], sys.argv[2], sys.argv[3]
try: d = json.loads(raw)
except Exception: d = {"error": "not JSON: " + raw[:80]}
if d.get("needs_description"): r = "NEEDS DESCRIPTION"
elif d.get("verdict"): r = d["verdict"] + "  id=" + str(d.get("id")) + ("  card" if d.get("card") else "  no card")
else: r = "ERROR " + str(d.get("error"))
print(code + "\t" + r + "\t" + url)
' "$url" "$code" "$json"
}
export -f judge_one

grep -v '^\s*#' "$FILE" | grep -v '^\s*$' | xargs -P "${PARALLEL:-3}" -I{} bash -c 'judge_one "$@"' _ {}
