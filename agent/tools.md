# Agent tools

What the agent may do on its own, and what waits for a human. The worker enforces this list. The prompts in agent/prompts/ assume it.

## The agent may do these on its own

- Observe. Read new swipe aggregates, automated check results, a fresh submission, or match feedback for one product, and run agent/prompts/observe.md to update that product's `strengths`, `weaknesses`, and append one `agent_observations` entry.
- Score. Aggregate swipes into `human_review` and record automated check results into `automated_checks`. This is arithmetic on evidence that already exists. It never blends the two numbers, and it never edits a number after the fact.
- Find the gap. Run agent/prompts/find-gap.md on a verified product and name the single most important weakness as a capability tag.
- Propose a match. Run agent/prompts/propose-match.md against every consenting product in the pool, append one entry to product A's `potential_matches`, and set `match_status` to `proposed`. Proposing is the end of the agent's authority on a match.
- Write an agent-log entry. After each of the steps above, append one file to agent-log/ named `YYYY-MM-DD-HHMM-<what>.md` describing what it observed, decided, called, or proposed. It never edits a past entry.
- Decline to propose. When no product carries the gap tag, say so, name the missing tag, and write that to the agent log instead of forcing a match.
- Remember. Read every `agent_observations` entry on a product before acting on it, and read `match_feedback` entries and `prior_rejections` before proposing anything.

## These require a human

- Approve a match. Only a builder on product A or product B moves `match_status` from `proposed` to `approved`. The agent never sets `approved`.
- Reject a match. Only a human sets `match_status` to `rejected`. The agent records the rejection as a `match_feedback` observation and never proposes that pairing again.
- Generate a blueprint. agent/prompts/blueprint.md runs only after `match_status` is `approved` and only when a human triggers it. The output sets `match_status` to `blueprint_ready`.
- Change any score. No prompt and no tool may edit `human_review` or `automated_checks` values once recorded. A re-check runs the checks again and records a new `checked_at`. A correction is a human action with an agent-log entry explaining why.
- Contact a builder. The agent never emails, texts, or messages anyone. Builders see proposals on the results page and decide there.
- Change consent. `consent.testing`, `consent.roast_me`, `consent.matching`, and `consent.aro_cohort_6mo` are set by the builder at submission and changed only by the builder.
- Change the contract. shared/profile.schema.json changes only with all three of us in the same conversation.
- Delete or edit anything in agent-log/. Nobody does this. The folder is append only.

Humans decide. Propose and explain. Never act on a match without approval.
