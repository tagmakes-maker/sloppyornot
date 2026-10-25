# CLAUDE.md

Read README.md, then CONTRIBUTING.md, then shared/profile.schema.json before touching anything.

- Lanes: site/ (Olivia designs it; Therese's Claude sessions write the code), worker/ (Jacky), agent/ + docs/ + seed/ + experts-worker/ (Therese). Stay in the lane of the person you are working for. Olivia does not code, so site/ code changes come from Therese's sessions and follow Olivia's Figma.
- Olivia and Jacky both use she/her.
- Olivia approved her Expert Reasoning Profile on Oct 24. Think Like Olivia status is in agent/experts/HANDOFF.md.
- shared/profile.schema.json is the contract. Never change it without saying so in the PR and the group chat.
- agent-log/ is evidence for judges, append only. The agent's real memory lives in worker/ storage.
- Not building: payments, Stripe, accounts, social network, big test suites.
- No em dashes in any copy. Complete sentences.
- The one thing we are proving: a persistent agent can understand products, learn from human evaluation, find complementary capabilities, and help humans build something better together.
