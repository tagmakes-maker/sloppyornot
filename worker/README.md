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

## Rules

- Every response is JSON with CORS headers so Olivia's static site can call it from another origin.
- Store Product Profiles exactly as `shared/profile.schema.json`. Do not add fields.
- `rejections` is read by the propose step so a rejected pair is not proposed again. That is the memory judges look for.
- No secrets in the repo. `.dev.vars` is gitignored.
