# agent/ (Therese)

The agent's brain. Jacky's worker/ loads these files at runtime and does not define its own. Nothing in here runs on its own.

- prompts/: four complete system prompts, one per step of the loop. Each states its input and the exact JSON it returns, using Product Profile field names from shared/profile.schema.json. observe.md updates strengths, weaknesses, and one agent_observations entry. find-gap.md returns one capability tag. propose-match.md returns one potential_matches entry and must reference an earlier observation and check prior rejections. blueprint.md returns the full blueprint object after a human approves.
- tools.md: a plain list of what the agent may do on its own (observe, score, find gap, propose, write an agent-log entry) and what requires a human (approve, reject, generate a blueprint, change a score, contact a builder).
- evals/: three JSON scenarios the matcher must pass. demo-pair.json expects the demo match. decoy.json expects no match or a low-confidence one. rejection.json expects the agent to honor a prior rejection and say so. Each file has `input`, `expected`, and `why`.

Weakness tags and capability tags share one vocabulary so the matcher can compare them directly: onboarding, ux, design, value, polish, mobile, security, stability, hosting, performance, accessibility. observe.md defines how each review metric and automated check maps to a tag.

Every prompt ends with the same line: Humans decide. Propose and explain. Never act on a match without approval.
