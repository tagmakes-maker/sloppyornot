# 2026-10-24 10:05 ET. Seed pool created

Type: observation

Therese loaded five seed products into seed/. Each validates against shared/profile.schema.json, carries is_seed true and status seed, and has at least 5 swipes, so every product is verified per docs/scoring.md. Human review and automated checks are recorded as separate numbers on every profile.

## The pool

- tidecheck (Team Pluff Mud). Street-level flood and king tide alerts for the Charleston peninsula. would_use 0.78, understood_immediately 0.30, mobile_ok failed. Weaknesses: onboarding, mobile.
- firststep (Two Devs and a Dog). Drop-in onboarding for hackathon web apps via one script tag. understood_immediately 0.82, feels_distinctive 0.47. Weaknesses: design. Capabilities include onboarding.
- helpharbor (Battery Row Dev Club). Embeddable help center with FAQ, search and contextual tooltips. would_use 0.43, feels_distinctive 0.36. Weaknesses: value, design. Capabilities include tooltips and embeddable-widget but not onboarding.
- palmetto-pwa-kit (Night Shift at Harbor Walk). Mobile-first PWA shell for desktop-first builds. easy_to_use 0.44. Weaknesses: ux. Capabilities include mobile.
- sweetgrass-market (Highway 17 Collective). Direct marketplace for Lowcountry sweetgrass basket makers. feels_distinctive 0.90, security_headers failed, console_errors 2. Weaknesses: security, stability.

## The demo pair

tidecheck is product A. firststep is product B. tidecheck's first weakness tag is onboarding and firststep's capabilities include onboarding exactly. The agent should propose firststep for tidecheck with confidence above 0.7.

## The decoy

helpharbor is product C. It looks like firststep. Both are script-tag widgets and both carry tooltips and embeddable-widget. Its core is help-center, which serves a user who is already inside the app and stuck. It does not carry the onboarding tag and must not be proposed for tidecheck, or only with confidence below 0.4.

## What the agent should notice first

The agent should notice that tidecheck is wanted but not understood, with would_use at 0.78 against understood_immediately at 0.30, and that the one product in the pool whose core capability is exactly onboarding is firststep.

## Next step

The worker runs agent/prompts/find-gap.md on tidecheck, then agent/prompts/propose-match.md against the pool, and writes the proposal here as a match_proposed entry. No human has approved anything yet.
