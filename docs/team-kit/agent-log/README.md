# Agent log (evidence)

Append only. One file per event. Name: `YYYY-MM-DD-HHMM-<what>.md`

Each entry records one of:
- observation: what the agent noticed
- decision: what it concluded and why
- tool_call: what it called, with inputs and outputs summarized
- proposal: what it suggested and the reasoning
- outcome: a human approved or rejected, and what the agent changed because of it

This is what judges and reviewers read to see the agent actually did something. The agent's working memory lives in storage, not here.
