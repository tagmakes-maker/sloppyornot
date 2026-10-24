# 2026-10-24 10:05: seed pool created

- type: decision
- actor: agent, directed by Therese
- files: seed/*.json, agent/seed-pool.md

## What happened

The agent built the starting pool of five seed products so the core loop can run before any live HarborHack team submits. Every product validates against shared/profile.schema.json, has 5 or more swipes, and has automated checks.

## The pool

- floodwatch-chs: crowdsourced Charleston street flooding map. Weakness: onboarding (understood_immediately 0.3).
- firstrun: drop-in onboarding engine. Core capability: onboarding.
- helpdock: support chat and FAQ bot. Weaknesses: differentiation, performance, security, reliability.
- shiftswap-chs: restaurant shift swapping with SMS signup. Weakness: mobile.
- porchlight: volunteer matching for Lowcountry nonprofits. Weakness: differentiation.

## Demo pair

FloodWatch CHS plus FirstRun. FloodWatch has a strong core (would_use 0.82) and one clear gap: only 30 percent of reviewers understood it on first look. FirstRun lists onboarding as its first capability and proves it with understood_immediately 0.86.

## Decoy

HelpDock. It sounds like it helps confused users, but it answers questions after users get stuck and has no onboarding capability. The agent must not propose it.

## Fallback

ShiftSwap CHS has onboarding as a secondary feature. If a human rejects FirstRun, the agent should propose ShiftSwap CHS at lower confidence and say the rejection changed its choice.

## Humans decide

No match has been proposed or approved yet. This entry only records the starting state.
