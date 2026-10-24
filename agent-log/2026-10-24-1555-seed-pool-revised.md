# 2026-10-24 15:55: seed pool revised

- type: decision
- actor: agent, directed by Therese
- files: seed/firstrun.json, seed/helpdock.json, seed/porchlight.json, seed/README.md, agent/evals/no-match.json

## What changed

Therese compared two versions of the seed pool and kept the one on main. The agent then pulled in two ideas from the other version to make the pool a harder test.

- The decoy got harder. HelpDock now shares two tags with FirstRun (contextual-help and embeddable-widget). It still has no onboarding tag, so a correct agent must still skip it.
- Porchlight is now the no-match case. Reviewers love it, but it fails security and reliability checks, and no product in the pool fills those gaps. A correct agent says "no match" instead of forcing one.

## Why it matters

A matcher that only ever finds a match is easy to fake. These two changes test that the agent matches on the actual gap, not on surface similarity, and that it is honest when nothing fits.

## Unchanged

The demo pair is still FloodWatch CHS plus FirstRun. The fallback is still ShiftSwap CHS.
