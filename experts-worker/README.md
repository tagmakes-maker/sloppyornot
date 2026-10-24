# experts-worker/ (Therese)

Think Like Olivia. A standalone Cloudflare Worker with its own KV namespace and its own pages. It talks to Jacky's worker over HTTP only when CORE_API_URL is set, and nothing here breaks if worker/ is down.

The flow: interview, approve profile, AI reviews one product flow, Olivia reviews every suggestion, comparison appears for judging.

## Setup

```
cd experts-worker
npm install
cp .dev.vars.example .dev.vars        # fill in ADMIN_TOKEN, and ANTHROPIC_API_KEY if you have one
npx wrangler kv namespace create EXPERTS_KV   # paste the id it prints into wrangler.toml
npx wrangler dev                      # http://localhost:8787/experts/olivia/interview
```

Without ANTHROPIC_API_KEY the worker runs in rule-based mode. Follow-ups come from the question list in agent/experts/interview.md, the profile draft is a template built from her answers, and the review matches rules to Product Profile fields by keyword. Every page shows a "rule-based mode" badge when this is the case.

## Deploy (Therese runs this)

```
npx wrangler secret put ADMIN_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY     # optional
npx wrangler deploy
```

## Pages

- /experts/olivia/interview: the interview, then the drafted profile with Save and Approve.
- /experts/olivia/review: run the review on one product, record a verdict on every suggestion, see the comparison.

## Routes

- GET /api/config: mode (claude or rule-based) and whether CORE_API_URL is set.
- GET /api/interview/:expert_id/next: the next question. Resumes from KV.
- POST /api/interview/:expert_id/answer: { question_id, answer }.
- POST /api/interview/:expert_id/finish: drafts the profile as "draft".
- GET /api/profile/:expert_id
- PUT /api/profile/:expert_id: edit fields. Needs X-Admin-Token. Any edit sets the profile back to draft.
- POST /api/profile/:expert_id/approve: needs X-Admin-Token. Sets approved, approved_at, version plus one.
- POST /api/review: { expert_id, product } or { expert_id, product_id }. Needs X-Admin-Token. Refused unless the profile is approved.
- POST /api/verdict: agent/experts/validation.schema.json. Needs X-Admin-Token. Never touches the suggestion.
- GET /api/comparison/:expert_id/:product_id: the judging panel data. Public, CORS open.
- GET /api/demo/product: the FloodWatch CHS seed product, labeled as seed data.

## Prompts

src/prompts.js is generated. Do not edit it. scripts/build-prompts.mjs inlines agent/experts/interview.md, agent/prompts/expert-review.md, both expert schemas, shared/profile.schema.json, and the demo seed into it, so the deployed worker has no filesystem dependency. wrangler runs the build before every dev and deploy. After editing a prompt, run `npm run build` and commit the result; a test fails if you forget.

## Re-running a review for a rehearsal

Reviews are immutable. A second POST /api/review for the same expert and product returns the first review. To start over, delete the keys: `npx wrangler kv key delete --binding EXPERTS_KV "review:olivia:floodwatch-chs"`.
