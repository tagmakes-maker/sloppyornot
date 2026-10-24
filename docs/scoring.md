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
