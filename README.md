# SloppyOrNot + Gituationship

HarborHack 2026 entry. One product, one persistent agent. Oct 23 to 25, CofC Harbor Walk.

**SloppyOrNot** proves a product is good through fast human swipe feedback plus automated checks.
**Gituationship** finds what a product is missing and which other product fills the gap.
A shared persistent agent connects both. Humans approve the matches.

## The core loop

Submit > Review > Agent understands > Gap identified > Match found > Human approves > Super Product Blueprint

## Where things live

| Folder | Owner | What goes here | What does NOT go here |
| --- | --- | --- | --- |
| `site/` | Olivia | Static HTML, CSS, client JS. The Cloudflare Pages root. | API logic, secrets, agent code |
| `worker/` | Jacky | Cloudflare Worker: API routes, agent, persistent state (KV/Supabase), automated checks, match logic, Blueprint generation | UI, seed data |
| `shared/` | Therese (owner), nobody edits alone | `profile.schema.json`, the Product Profile contract between site and worker | Anything that is not the contract |
| `seed/` | Therese | Believable demo products as JSON matching the schema | Real user data |
| `docs/` | Therese | Demo script, pitch, Devpost copy, decisions | Code |
| `agent-log/` | Jacky writes, everyone reads | Demo evidence: what the agent observed, decided, called, proposed, and what happened. Append only. | The agent's actual memory (that lives in the worker storage layer) |

Not sure where something goes? Read `CONTRIBUTING.md`. The pre-commit hook will tell you if you got it wrong.

## The contract

`shared/profile.schema.json` is the one object both halves speak. Changing it requires all three of us in the same conversation and one PR that touches `shared/`, `site/`, and `worker/` together.

## Not building

Payments, Stripe, complex accounts, giant profiles, social network, production matching marketplace, big automated test suite, two polished standalone companies.

## Deadlines

- Devpost submission: Sunday Oct 25, 5:00 PM (description, repo access, AI collaboration story)
- Live pitch: Sunday 6:00 PM, 5 min plus 3 min Q&A

## Team

- Therese Grittner: product, methodology, functional logic, QA, demo, pitch
- Jacky Schuler: backend, database, APIs, agent context and memory, match logic, logs, Blueprint generation
- Olivia Dennehy: frontend, UX, submission and review flow, match screens, demo polish
