# agent/ (Therese)

The agent's intelligence: system prompts, tool definitions, matching methodology, and evaluation scenarios. Jacky's worker/ loads these; it does not define them.

- prompts/: one file per prompt. Name says what it does: observe.md, find-gap.md, propose-match.md, blueprint.md
- evals/: scenarios the agent must pass. Each is a seed product pair plus the expected proposal.
- tools.md: what the agent may call on its own and what requires a human
