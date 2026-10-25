# 2026-10-24 20:16: The agent passed the decoy, rejection memory, and no-match tests

- type: match_proposed, outcome
- actor: the agent, with Jacky rejecting one proposal
- api: https://api.sloppyornot.com
- raw export: 2026-10-24-2016-demo-beats-tested.json (the six agent log entries from these tests)

## Setup

The live store was reset with scripts/reset-demo.sh, so all five seed products were loaded at their seeded numbers with no earlier proposals or rejections.

## Test 1: the decoy (20:16)

The agent proposed FloodWatch CHS plus FirstRun for onboarding, confidence 0.85.

It ruled out HelpDock, the decoy, because "HelpDock does not list onboarding in its capabilities, and it helps users after they are stuck rather than orienting them on first use." Its memory reference cites the 13:47 observation that warned HelpDock only looks like an onboarding tool. It ranked ShiftSwap CHS second because its onboarding proof (understood_immediately 0.69) is weaker than FirstRun's (0.86).

## Test 2: memory after a human rejection (20:16 to 20:17)

Jacky rejected FirstRun with the reason "FirstRun scores 47 on accessibility and FloodWatch drivers need tooltips that work with screen readers."

The agent then proposed ShiftSwap CHS, confidence 0.55. It quoted the rejection word for word with its timestamp and marked FirstRun ineligible because of it. It also changed its reasoning: it argued that SMS onboarding happens in the phone's own messaging app, so it answers the screen reader concern. It lowered its confidence and said why: onboarding is a side feature for ShiftSwap.

## Test 3: no match (20:17)

For Porchlight the agent returned no proposal. Porchlight needs reliability and security, and no product in the pool offers either. It checked all four candidates and explained each one. It noted that HelpDock shares Porchlight's weakness instead of filling it. In its words: "I am not proposing a weak fit just to fill the slot."

## What this shows

The agent avoids a product that only looks like a fit, remembers a human's rejection and changes its reasoning because of it, and says no when nothing fits.

## Next

Reset again before the pitch so the live demo starts clean.
