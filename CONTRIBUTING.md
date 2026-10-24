# Where does this file go?

Answer the first question that applies. Stop there.

1. **Is it the Product Profile shape, or a change to it?**
   `shared/profile.schema.json`. Do not edit alone. Say it in the group chat first.

2. **Does a browser load it directly (HTML, CSS, images, client-side JS)?**
   `site/`. Olivia's lane.

3. **Does it run on Cloudflare, talk to the database, call an LLM, or store state?**
   `worker/`. Jacky's lane.

4. **Is it a fake product for the demo?**
   `seed/<slug>.json`. Must validate against the schema.

5. **Is it a record of something the agent did (observation, decision, tool call, match proposal, approve/reject, outcome)?**
   `agent-log/YYYY-MM-DD-HHMM-<what>.md` or `.json`. Append only. Never edit a past entry. This is evidence for the judges, not the agent's memory.

6. **Is it words for humans (demo script, pitch, Devpost copy, decision)?**
   `docs/`.

7. **None of the above?**
   Ask in the group chat before committing. Do not create a new top-level folder.

## Rules that save us on Sunday

- Commit small and often. Branch per person: `jacky/`, `olivia/`, `therese/`. Merge to `main` when it runs.
- No secrets in the repo. `.env` is gitignored. Worker secrets go in `wrangler secret put`.
- Every PR says which folder it touches and why (the template asks).
- The pre-commit hook blocks files outside their lane. Run `bash scripts/install-hooks.sh` once after cloning.
- No em dashes in any copy. Complete sentences.

## Branch and deploy

- `main` deploys `site/` to Cloudflare Pages automatically.
- `worker/` deploys with `npx wrangler deploy` from inside `worker/`. Therese or Jacky runs it.
