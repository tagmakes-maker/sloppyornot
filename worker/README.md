# worker/ (Jacky)

Cloudflare Worker. Plain JS. One KV namespace. Spec is GitHub issues #7 to #10, plus #40 (docs/build-judge-routes.md) for the Sloppy or Not judge.

## Start here

```
cd worker
npm install
# KV namespace STORE already exists and its id is in wrangler.toml. Do not run kv:create.
cp ../.env.example .dev.vars   # fill in ANTHROPIC_API_KEY for local dev
npm run dev              # http://localhost:8787/health, with a local copy of the data
```

## Deploy

Every merge to main deploys the live worker at https://api.sloppyornot.com automatically, about a minute later. Work on a branch and merge only code that runs.

```
npm run secret           # once; sets ANTHROPIC_API_KEY on the deployed worker
```

## Routes

- #7  POST /products, GET /products, GET /products/:id
- #8  POST /products/:id/review, POST /products/:id/check
- #9  POST /agent/observe/:id, POST /agent/find-gap/:id, POST /agent/propose/:id, GET /agent/log
- #10 POST /matches/:id/approve, POST /matches/:id/reject, GET /matches/:id/contact
- #40 POST /judge, POST /judge/:id/answers, GET /projects, GET /projects/next, POST /projects/:id/vote, GET /projects/:id/thumb, POST /judge/:id/email, GET /ridicule.

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

**`GET /matches/:id/contact`** returns `{ product_id, email }` for the partner, only after the match is approved (`match_status: "blueprint_ready"`) and only if the partner shared an email. Otherwise 403 or 404.

### Sloppy or Not judge (issue #40)

The full spec is docs/build-judge-routes.md. No route ever returns a score. The only verdict anyone sees is the one returned to the submitter.

**`POST /judge`** with `{ url, by?, roast_me?, description? }`. Judging takes about 20 to 60 seconds, so show the loading animation. Returns `{ id, verdict, card, ai_answers, human_questions }`, where `verdict` is `"Sloppy"` or `"Not"` and `ai_answers` are `[{ id, question, evidence }]` with no scores. Returns `{ needs_description: true }` when the page has too little text. Send the same request again with a one-line `description`. The same URL always returns its first verdict. A 429 means the cap on new judgments was hit, and its `error` says so.

**`POST /judge/:id/answers`** with `{ answers: [{ id, answer }] }` for the nine human questions. Returns `{ id, verdict }`. Answers count once.

**`POST /judge/:id/email`** with `{ email, share_with_match? }` signs the owner up for the weekly State of Slop email. Nothing is sent yet. When `share_with_match` is true, the email is also saved for an approved match partner (`GET /matches/:id/contact`). The newsletter signup alone is not consent to share it. Returns only `{ ok: true }`, never any stored email. `POST /judge` accepts the same two fields.

**`GET /projects`** returns every card: `[{ id, name, url, by, thumb_url, likes_and_goals, brings }]`. **`GET /projects/next?seen=a,b`** returns one card not in `seen`, or `{ done: true }`.

**`POST /projects/:id/vote`** with `{ vote: "slop" }` or `{ vote: "not" }`. Returns `{ ok: true }`. Counts are never returned. Each swipe is saved as its own `vote:<id>:<time>:<rand>` key, so simultaneous swipes are never lost. `votes:<id>` keeps a running tally, but KV is last write wins, so count the `vote:` keys for the real number.

**`GET /projects/:id/thumb`** returns the thumbnail image, or 404. Use `thumb_url` from the card, prefixed with the base URL.

**`GET /ridicule`** returns the public board: only projects whose owner checked Roast Me, as `[{ id, name, url, by, thumb_url, likes_and_goals, brings, verdict }]`. Still no numbers.

### Where the judge differs from the spec, and why

- **A cap on new judgments.** 30 per network per hour and 200 per day. Each judgment is a paid Claude call on the team key, and the API is public. The demo room shares one wifi address, so the per-network number is high. A URL that was already judged does not count.
- **A site that does not load gets no profile or card.** Its Sloppy verdict is saved. The Product Profile schema needs fields only the agent writes, and the agent is skipped for a site that does not load.
- **Guards that keep profiles valid.** If the agent leaves out a field, the worker fills in a plain fallback. Fields are cut to the schema's lengths. A reply missing any of the six scores is an error, so the submitter can try again, and is never counted as zero. `by` loses any "@" because the card adds its own.
- **Browser Rendering needs a token.** With `CF_BROWSER_TOKEN` set, pages are read with a real browser and the thumbnail is a screenshot. Without it, or if the call fails, pages are read with a plain fetch and thumbnails come from the page's og:image.

### The demo path

`floodwatch-chs` is product A and `firstrun` is the match. Reject FirstRun and the next proposal should be `shiftswap-chs`. `porchlight` should get `proposal: null`. `bash scripts/run-loop-11.sh` runs the whole loop.

## Rules

- Every response is JSON with CORS headers so Olivia's static site can call it from another origin.
- Store Product Profiles exactly as `shared/profile.schema.json`. Do not add fields.
- `rejections` is read by the propose step so a rejected pair is not proposed again. That is the memory judges look for.
- No secrets in the repo. `.dev.vars` is gitignored.
