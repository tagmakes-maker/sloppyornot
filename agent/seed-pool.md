# Seed pool and demo pair

Lives here because the lane hook only allows JSON in seed/. Source files are in seed/.

## The pool

- floodwatch-chs (Product A): crowdsourced street flooding map. Strong core, would_use 0.82. Weak first look, understood_immediately 0.3. Its one weakness tag is onboarding.
- firstrun (Product B): drop-in onboarding engine. Its first capability is onboarding. This is the demo match for FloodWatch CHS.
- helpdock (Product C, the decoy): support chat and FAQ bot. It looks like it helps confused users, but it answers questions after users get stuck. It has no onboarding capability, so the agent must not propose it.
- shiftswap-chs (Product D): restaurant shift swapping. Has onboarding as a secondary feature (SMS signup). This is the fallback match after a human rejects FirstRun.
- porchlight (Product E): volunteer matching for Lowcountry nonprofits. Fills out the pool.

## Why the demo pair works

FloodWatch CHS has nine swipes, so it is verified. Every other human metric is at or above 0.5 and every automated check passes, so onboarding is its only weakness and the gap is unambiguous. FirstRun lists onboarding as its core capability and scores 0.86 on understood_immediately, so it proves it can do the thing FloodWatch cannot. The combined product is a flood map that teaches new drivers what the pins mean in their first ten seconds.

## Weakness tags

The agent turns metrics into capability tags so matching is a tag lookup. The mapping lives in agent/tools.md.
