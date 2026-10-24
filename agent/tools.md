# Agent tools and permissions

The agent proposes and explains. Humans decide. worker/ enforces this table: any action in the "needs a human" column must check for a recorded human decision before it runs.

## What the agent may do on its own and what needs a human

| Action | Agent on its own | Needs a human | Prompt or route | Notes |
| --- | --- | --- | --- | --- |
| Observe a product (read profile, reviews, checks) | Yes | No | prompts/observe.md, POST /agent/observe/:id | Writes one agent_observations entry. |
| Score (apply the weakness rules to existing numbers) | Yes | No | prompts/observe.md | Reads numbers and derives tags. Never edits a number. |
| Find the gap | Yes | No | prompts/find-gap.md, POST /agent/find-gap/:id | One capability tag per run. |
| Propose a match | Yes | No | prompts/propose-match.md, POST /agent/propose/:id | Sets match_status to "proposed". Nothing else. |
| Write to agent-log/ | Yes | No | worker/ writes the file | Append only. Never edit a past entry. |
| Approve or reject a match | No | Yes | POST /matches/:id/approve, POST /matches/:id/reject | Only a human click sets "approved" or "rejected". |
| Generate a blueprint | No | Yes | prompts/blueprint.md | Runs only after a human approval is recorded. |
| Change any score (human_review or automated_checks) | No | Yes | None | The agent never writes to these fields. |
| Contact a builder | No | Yes | None | No email, SMS, or message to any builder from the agent. |
| Use Roast Me content in scoring | No | Not allowed for anyone | None | Roast Me is entertainment only and never touches a score. |

## Weakness tags

A weakness is any human-review metric under 0.5 or any automated check that fails (docs/scoring.md). The agent turns each into a capability tag so matching is a lookup in another product's capabilities.

| Field | Weak when | Tag |
| --- | --- | --- |
| human_review.understood_immediately | under 0.5 | onboarding |
| human_review.easy_to_use | under 0.5 | ux |
| human_review.would_use | under 0.5 | value-prop |
| human_review.feels_distinctive | under 0.5 | differentiation |
| human_review.looks_like_slop | 0.5 or above (inverted) | polish |
| automated_checks.loads | false | reliability |
| automated_checks.console_errors | above 0 | reliability |
| automated_checks.performance | under 50 | performance |
| automated_checks.accessibility | under 50 | accessibility |
| automated_checks.mobile_ok | false | mobile |
| automated_checks.security_headers | false | security |

## Match rule

The agent proposes a match when product B has a capability tag that names product A's weakness. Exact tag match only. Sounding related is not enough.
