# Seed pool

Five demo products. Each file validates against shared/profile.schema.json with "is_seed": true and "status": "seed". Weakness tags use the same vocabulary as capability tags so the agent can match them directly.

- Demo pair: tidecheck (product A) and firststep (product B).
- tidecheck has a strong core (would_use 0.78, feels_distinctive 0.87, live NOAA data) and one obvious weakness. understood_immediately is 0.30, so its weaknesses list starts with "onboarding". Its map also fails mobile_ok, so "mobile" is the secondary weakness.
- firststep's core capability is exactly "onboarding". It is verified, every automated check passes, and its own understood_immediately is 0.82. The agent should propose firststep for tidecheck with confidence above 0.7.
- Decoy: helpharbor (product C). It looks like firststep on the surface. Both are embeddable widgets with a script tag install and both carry the "tooltips" and "embeddable-widget" tags. Its core is "help-center", which answers questions after a user is already inside the app. It does not fill an onboarding gap. The agent must not propose it for tidecheck, or must propose it with confidence below 0.4.
- palmetto-pwa-kit (product D) carries the "mobile" tag. It fills tidecheck's secondary gap, which is the fallback the agent should reach for if the builder rejects firststep.
- sweetgrass-market (product E) fills out the pool with strong human review and failing automated checks ("security", "stability"). Nothing in the pool fills those gaps. The agent should say so instead of forcing a match.
- All five have swipe_count of at least 5, so every product is verified per docs/scoring.md.
- potential_matches is empty and match_status is "unmatched" on every seed. The agent fills those at runtime.
