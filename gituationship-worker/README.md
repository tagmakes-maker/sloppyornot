# gituationship-worker

The worker behind gituationship.com. It has no state and no secrets. It proxies every path to `site/gituationship/` on sloppyornot.com, so the Gituationship pages deploy with every merge to main like the rest of `site/`. `/slides` serves the pitch deck at `site/pitch/gituationship.html`.

It is deployed by hand as the `gituationship` worker, with gituationship.com as its custom domain. To redeploy after a change: `npx wrangler deploy gituationship-worker/index.js --name gituationship --compatibility-date 2026-10-01`.
