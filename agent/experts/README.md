# agent/experts/ (Therese)

Think Like Olivia. One human expert's reasoning, captured by interview, approved by her, and used by the agent to review one product. Olivia then accepts, rejects, or modifies every suggestion, and the judging view shows her verdict beside the AI suggestion.

- expert-profile.schema.json: the Expert Reasoning Profile. Proposed for shared/ once Jacky and Olivia agree.
- validation.schema.json: the human verdict on one suggestion. The suggestion never changes. The correction sits beside it.
- interview.md: the interview script. A human can read it aloud. experts-worker/ uses it as the system prompt and reads its question list for rule-based mode.
- ../prompts/expert-review.md: the review prompt.
- ../evals/expert-review.json: the eval scenario.
- HANDOFF.md: what Jacky and Olivia need to know. Nothing in worker/ or site/ has to change.

## The seed profile is not active

seed/experts/olivia.draft.json is demo data. The agent wrote it from Olivia's role on the team, not from Olivia. Every rule says PLACEHOLDER. Its approval_status is "draft", and experts-worker/ refuses to review anything with a draft profile. It becomes real only when Olivia completes the interview, edits the draft it produces, and presses Approve. This note lives here because seed/ holds JSON only.
