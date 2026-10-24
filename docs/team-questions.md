# Team questions (Oct 24)

Each question has a recommendation. Answer yes, or say what you want instead.

## Jacky

1. **Prompts will not load.** wrangler.toml fetches prompts from raw.githubusercontent.com, but the repo is private, so that URL returns 404. Recommendation: bundle agent/prompts/*.md into the worker at deploy with a wrangler Text rule. No network call, no token, and the prompts always match the deployed code.
2. **Model name is out of date.** ANTHROPIC_MODEL is "claude-sonnet-4-5". Recommendation: change it to "claude-sonnet-5-5".
3. **KV or Supabase?** The team email said Supabase. The worker is built on KV. Recommendation: KV. It is already wired and it is enough for one weekend.
4. **Rejections.** I matched the propose-match prompt to your KV shape: `{ a_id, b_id, reason, at }`. Please confirm you will pass that list in as `rejections` when calling propose-match.

## Olivia

5. **Where does the site get products?** Recommendation: from the worker (GET /products), not from seed/ files directly. Jacky loads seed/*.json into KV once. One source of truth.
6. **How do seed products look?** They have status "seed" and verified true. Recommendation: show the Verified badge plus a small "Demo product" label. Judges see that we are honest about seed data.

## All three

7. **Scoring rules.** docs/scoring.md now lists every weakness rule and threshold. The new ones: performance or accessibility under 50 fails, any console error fails, and looks_like_slop is a weakness at 0.5 or above. Recommendation: approve as written.
8. **Tighten the schema.** The objects inside a profile (human_review, automated_checks, blueprint, and the rest) accept any extra field, so a typo like "would_us" passes. Recommendation: add `"additionalProperties": false` to each one. This touches shared/, so all three of us agree first.
9. **Merge to main.** The seed products, prompts, evals, and tests are on branch claude/great-pascal-k4j547. Recommendation: merge to main today so Jacky and Olivia build against them.

## Decided

Oct 24: Therese said yes to all nine recommendations. Items 7, 8, and 9 are done. Items 1 to 6 are posted on the matching GitHub issues for Jacky and Olivia.
