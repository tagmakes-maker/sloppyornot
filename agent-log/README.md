# Agent log (demo evidence)

Append only. One file per event. Name: `YYYY-MM-DD-HHMM-<what>.md`

Each entry records one of:
- observation: what the agent noticed (from reviews, checks, or a submission)
- decision: what it concluded and why
- tool_call: what it called, with inputs and outputs summarized
- match_proposed: product A + product B, the gap filled, the reasoning
- outcome: human approved or rejected, and what the agent changed because of it

This is what the judges read to see the agent actually did something. The agent's working memory is in worker/ storage, not here.
