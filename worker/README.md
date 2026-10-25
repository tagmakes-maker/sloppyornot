# worker/ (Jacky)

Cloudflare Worker. Plain JS. One KV namespace. Spec is GitHub issues #7 to #10.

## Start here

```
cd worker
npm install
# KV namespace STORE already exists and its id is in wrangler.toml. Do not run kv:create.
cp ../.env.example .dev.vars   # fill in ANTHROPIC_API_KEY for local dev
npm run dev              # http://localhost:8787/health
```

## Deploy

```
npm run secret           # once; sets ANTHROPIC_API_KEY on the deployed worker
npm run deploy           # prints the workers.dev URL
```

## Routes (build in this order)

- #7  POST /products, GET /products, GET /products/:id
- #8  POST /products/:id/review
- #9  POST /agent/observe/:id, POST /agent/find-gap/:id, POST /agent/propose/:id, GET /agent/log
- #10 POST /matches/:id/approve, POST /matches/:id/reject

## The agent

`agent/prompts/*.md` are system prompts written by Therese. `runAgent(step, input, env)` fetches `env.PROMPTS_BASE + step + ".md"`, sends it as the system prompt to the Anthropic Messages API with `JSON.stringify(input)` as the user message, parses the first JSON object in the reply, appends an entry to `agentlog`, returns the object. The agent never approves anything; it proposes and a human calls /approve.

## API cheat sheet (for site/)

Base URL: `https://api.sloppyornot.com`. Every response is JSON. Errors look like `{"error": "message"}` with a 4xx or 5xx status. No auth. Send `Content-Type: application/json` on every POST.

Everything below uses the Product Profile from `shared/profile.schema.json`. Routes that say "returns the profile" send back the whole updated profile, so the page can re-render from the response without a second fetch.

### Products

**`POST /products`** submits a product. Body is a Product Profile. Required: `id`, `name`, `what_it_does`, `target_user`, `capabilities` (array of tags). The worker sets `status: "submitted"`, `match_status: "unmatched"`, `created_at` and `updated_at`. Returns the profile with status 201. Returns 409 if the id is taken.

**`GET /products`** returns an array of every profile.

**`GET /products/:id`** returns one profile, or 404.

### Review (the swipe)

**`POST /products/:id/review`** records one person's swipe. Send all five fields, each as `true`/`false` or a number from 0 to 1 (1 means yes):

```json
{ "would_use": true, "understood_immediately": false, "feels_distinctive": true, "easy_to_use": true, "looks_like_slop": false }
```

A swipe missing a field, or with a value like `"yes"` or `2`, gets a 400 that names the bad fields, and nothing is saved.

The worker averages each field into `human_review`, adds 1 to `human_review.swipe_count`, and sets `human_review.verified` to true at 5 swipes. Returns the profile.

Add `"test": true` to a swipe and the worker throws it away without saving or counting it, then returns `{"ignored": true, "reason": "test swipe", "id": "..."}`. Scripts use this so testing never changes real scores. The site should never send it.

### Automated checks

**`POST /products/:id/check`** visits the product's `url` and records two things in `automated_checks`: `loads` (the page answered with a 2xx status) and `security_headers` (it sends Content-Security-Policy or Strict-Transport-Security), plus `checked_at`. It leaves `performance`, `accessibility`, and the other fields alone. Returns the profile plus `check_details` with the HTTP status and which headers it found. It refuses seed products, because their urls are made up and their checks are seeded. Call it once after a real submission.

### Agent

These call Claude, so each one takes a few seconds. Show a loading state.

**`POST /agent/observe/:id`** has the agent read the latest reviews. It updates `strengths`, `weaknesses`, and appends one entry to `agent_observations` (`{at, note, source}`). Returns the profile. Show the newest `note` as "what the agent noticed".

**`POST /agent/find-gap/:id`** names the one thing the product is missing. Saves nothing. Returns:

```json
{ "product_id": "floodwatch-chs", "gap": "onboarding", "metric": "human_review.understood_immediately", "value": 0.3, "why": "One sentence." }
```

`gap` is `null` when there is nothing to fix.

**`POST /agent/propose/:id`** finds the gap, then picks a partner product. It never proposes a pair a human already rejected. If it finds one, it appends the proposal to `potential_matches` and sets `match_status` to `"proposed"`. Returns:

```json
{
  "product_a_id": "floodwatch-chs",
  "proposal": { "product_id": "firstrun", "fills_gap": "onboarding", "reason": "Two or three sentences.", "confidence": 0.9 },
  "memory_reference": "One sentence naming the earlier observation it used.",
  "considered": [ { "product_id": "helpdock", "eligible": false, "why_not": "One sentence." } ]
}
```

`proposal` is `null` when nothing in the pool fits. Show `reason` on the match screen. `considered` is good for a "why not the others" panel.

**`GET /agent/log`** returns every agent step, oldest first: `[{step, at, input_summary, result}]`. Useful for a "what the agent did" timeline.

### Human decision

Both routes take **product A's id** (the product that has the proposal), not a match id. Both return 400 unless `match_status` is `"proposed"`.

**`POST /matches/:id/approve`** approves the latest proposal and has the agent write the Super Product Blueprint. Optional body `{"approved_by": "name"}`. Takes a few seconds. Returns the profile with `match_status: "blueprint_ready"` and `blueprint` filled in:

```json
{ "partner_id": "firstrun", "combined_concept": "...", "contribution_a": "...", "contribution_b": "...", "target_user": "...", "integration_plan": "...", "first_build": "...", "requirements": ["..."] }
```

**`POST /matches/:id/reject`** rejects the latest proposal. Body `{"reason": "why not"}` is required. The agent remembers the rejection and will not propose that pair again. Returns the profile with `match_status: "unmatched"`. Call propose again to get the next suggestion.

### The demo path

`floodwatch-chs` is product A and `firstrun` is the match. Reject FirstRun and the next proposal should be `shiftswap-chs`. `porchlight` should get `proposal: null`. `bash scripts/run-loop-11.sh` runs the whole loop.

## Rules

- Every response is JSON with CORS headers so Olivia's static site can call it from another origin.
- Store Product Profiles exactly as `shared/profile.schema.json`. Do not add fields.
- `rejections` is read by the propose step so a rejected pair is not proposed again. That is the memory judges look for.
- No secrets in the repo. `.dev.vars` is gitignored.
