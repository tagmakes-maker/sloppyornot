# 2026-10-24 11:40: Think Like Olivia worker built

- type: decision
- actor: agent, directed by Therese
- files: experts-worker/, agent/experts/, agent/prompts/expert-review.md, seed/experts/olivia.draft.json, agent/evals/expert-review.json, tests/expert-profile.test.mjs, tests/experts-worker.test.mjs

## What happened

The agent built Think Like Olivia as its own Cloudflare Worker, sloppyornot-experts. It interviews one human expert, drafts her Expert Reasoning Profile, waits for her approval, reviews one product against her stated rules, and records her verdict on every suggestion. The judging view shows each AI suggestion beside her verdict, her correction, and the reasoning gap between them.

## What exists

- An interview with eight main questions and up to two follow-ups each. Progress saves after every answer.
- A profile draft from her answers, editable on the page, stored as "draft".
- An approval step behind an admin token. Approval refuses any profile that still says PLACEHOLDER.
- A review that refuses to run on a draft profile and cites only rule ids from the approved profile. Suggestions under 0.6 confidence carry an uncertainty note.
- Verdicts stored beside each suggestion. The review itself is never rewritten.
- A comparison endpoint for the judging panel, with a disclaimer that this is a model of one expert's stated rules, not the expert.

## What is placeholder

- seed/experts/olivia.draft.json was written by the agent from Olivia's role, not by Olivia. Every rule says PLACEHOLDER. It cannot be approved as is.
- Brand colors are provisional until Olivia sets the real tokens.
- Without ANTHROPIC_API_KEY every step runs in rule-based mode and the pages say so.
- The KV namespace id and the deployed URL do not exist yet. Therese creates them.

## The activation step

Olivia's interview. Until she answers the questions, edits her draft, and presses Approve, the profile is inactive and the agent cannot review anything with it. Crowd review scores and Verified Build scores are untouched either way.
