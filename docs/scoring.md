# Scoring rules (Therese owns)

The agent prompts and tests/core-loop.test.mjs follow this file. Change it here first.

- A product is "verified" once it has at least 5 swipes. Fifty is better, but five proves the loop in a demo room.
- Human review and automated checks are separate numbers. Never blend them.
- Roast Me never touches any score.
- The agent proposes a match when product B has a capability tag that names product A's weakness. Exact tag match only.

## What counts as a weakness

Each weakness becomes one capability tag, so matching is a tag lookup.

- understood_immediately under 0.5 is a weakness. Tag: onboarding.
- easy_to_use under 0.5 is a weakness. Tag: ux.
- would_use under 0.5 is a weakness. Tag: value-prop.
- feels_distinctive under 0.5 is a weakness. Tag: differentiation.
- looks_like_slop at 0.5 or above is a weakness. Tag: polish. This one is reversed: a high score is bad.
- loads false is a weakness. Tag: reliability.
- console_errors above 0 is a weakness. Tag: reliability.
- performance under 50 is a weakness. Tag: performance.
- accessibility under 50 is a weakness. Tag: accessibility.
- mobile_ok false is a weakness. Tag: mobile.
- security_headers false is a weakness. Tag: security.

## The biggest gap

When a product has more than one weakness, the agent works on the one furthest below its line. A human score of 0.3 is 0.2 below. An automated score of 44 is 0.06 below (divide by 100). A failed true or false check counts as 0.15.

## Sloppy or Not verdict (added Oct 25)

The screen shows one word: Sloppy or Not. No number is ever shown to anyone. Scores live behind the scenes in worker storage.

### Two lanes

Every submission goes through exactly one lane.

- Lane one, AI only. The submitter skips the human questions. Total = AI score out of 100.
- Lane two, AI plus human. The submitter answers the human questions. Total = (AI score / 2) + human score out of 50.

### The verdict

- Total 70 or above is Not. Below 70 is Sloppy.
- AI floor in lane two: the AI half must be at least 30 of 50 (an AI score of 60 or more). Below the floor the verdict is Sloppy, whatever the answers say. Answers can rescue a borderline site. They cannot rescue a bad one.
- If the site does not load, the verdict is Sloppy and no other scoring runs.
- The first verdict for a URL is saved and reused. The same URL never flips on a second submission.

### AI score (100 points)

Measured checks, 40 points. These come from automated_checks and are never judged by the model.

- loads true: 10
- performance: performance x 0.08, up to 8
- accessibility: accessibility x 0.08, up to 8
- mobile_ok true: 6
- security_headers true: 4
- console_errors 0: 4

Agent read, 60 points. The agent answers the six AI questions in agent/judging-questions.md, 0 to 10 each, using the anchors in agent/prompts/judge.md.

### Human score (50 points)

The agent scores each of the eight human questions 0 to 5 with agent/prompts/score-answers.md. Sum x 1.25 = human score out of 50. A blank answer scores 0.

### What never touches the verdict

- Swipes. They are stored per project and feed the weekly State of Slop email, not the verdict.
- Roast Me. It only controls whether a project may appear on the public board.

### Agent review: the five review questions from the agent's answers

The worker turns the agent's AI answers into the five review metrics, on the same 0 to 1 scale as swipes. This is how every submission feeds matching without a human swipe.

- understood_immediately = A1 / 10
- would_use = A2 / 10
- feels_distinctive = A3 / 10
- easy_to_use = A5 / 10
- looks_like_slop = 1 - (A3 + A4) / 20. Reversed like the swipe version: high is bad.

Apply the weakness rules at the top of this file to these five numbers and to automated_checks. Write the tags to the profile's weaknesses list. These numbers never go into human_review, which stays swipes only. They never change the verdict either.
