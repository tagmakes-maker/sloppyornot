Demo products. Each file validates against shared/profile.schema.json with "is_seed": true and "status": "seed". Weakness tags use the same words as capability tags, so the agent matches them with a simple lookup. The rules are in docs/scoring.md.

## The pool

- floodwatch-chs (Product A): crowdsourced street flooding map. Strong core, would_use 0.82. Weak first look, understood_immediately 0.3. Its one weakness tag is onboarding.
- firstrun (Product B): drop-in onboarding engine. Its first capability is onboarding. This is the demo match for FloodWatch CHS.
- helpdock (Product C, the decoy): embeddable help widget. It shares two tags with FirstRun (contextual-help and embeddable-widget) and installs the same way, so it looks like an onboarding tool. It answers questions after users get stuck and has no onboarding tag, so the agent must not propose it.
- shiftswap-chs (Product D): restaurant shift swapping. Has onboarding as a secondary feature (SMS signup). This is the fallback match after a human rejects FirstRun.
- porchlight (Product E, no match): volunteer matching that reviewers love but that fails security and reliability checks. Nothing in the pool fills those gaps, so the agent must say there is no match instead of forcing one.

## Why the demo pair works

FloodWatch CHS has nine swipes, so it is verified. Every other human metric is at or above 0.5 and every automated check passes, so onboarding is its only weakness and the gap is clear. FirstRun lists onboarding as its core capability and scores 0.86 on understood_immediately, so it proves it can do the thing FloodWatch cannot. The combined product is a flood map that teaches new drivers what the pins mean in their first ten seconds.
