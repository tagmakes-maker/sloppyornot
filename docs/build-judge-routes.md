# Build prompt: Sloppy or Not judge routes

Paste everything below the line into a fresh Claude Code session on this repo, or Jacky runs it by hand. It touches worker/ only, which is Jacky's lane, so Jacky reviews and merges.

---

Read CLAUDE.md, README.md, CONTRIBUTING.md, shared/profile.schema.json, docs/scoring.md (the "Sloppy or Not verdict" section), agent/judging-questions.md, agent/prompts/judge.md, and agent/prompts/score-answers.md. Then add the routes below to worker/src/index.js. Plain JS, no framework, same style as the file. Do not change shared/profile.schema.json. Do not touch site/ or agent/. Keep every existing route working.

## The user flow this serves

1. Submitter enters a URL and picks one of two buttons: "Manually answer questions" (lane two) or "Have agent do it for me" (lane one). The design source is Olivia's Figma: https://www.figma.com/design/G1ulYipDtAJ7dRiEvZmGPx/Sloppy-Or-Not
2. The agent judges the site with the AI question set. The submitter then answers the human questions (lane two) or skips them (lane one).
3. The screen shows one word: Sloppy or Not. No numbers, ever, to anyone.
4. Optional email signs them up for the weekly State of Slop email. Sending comes later with Resend. Today we only store it.
5. Then they go judge other projects. Each project is a dating-profile card: thumbnail (the profile pic), project title with name and URL, By (user name), Likes and goals, and What I bring to the table (feature bullets). Never a verdict.
6. A public ridicule board shows verdicts only for projects with consent.roast_me true.

## Storage (KV, env.STORE). Add these keys to the comment in worker/wrangler.toml

- `product:<id>` existing Product Profile. Must still validate the schema. No new fields.
- `judge:<id>` private. `{ url, lane, ai_answers, automated_checks, ai_score, human_answers, human_score, total, verdict, judged_at }`. Never returned by any public route except as the verdict on the ridicule board.
- `card:<id>` `{ likes_and_goals, brings: [string] }` from the judge agent.
- `thumb:<id>` the thumbnail image bytes (PNG or JPEG), stored with metadata `{ contentType }`.
- `url:<normalized url>` the product id for that URL. Used to reuse the first verdict.
- `votes:<id>` `{ slop, not, list: [{ vote, at }] }` from the Judge screen.
- `subscriber:<lowercased email>` `{ email, product_id, subscribed_at, unsubscribe_token }`. Never returned by any route.

## Routes

### POST /judge  `{ url, by, email?, roast_me? }`

`by` is the user name shown on the card as @username. Optional, trimmed, 1 to 40 characters. The Figma submit screen has no username field yet, so default to "anonymous" when it is missing.

1. Validate the URL (http or https). Normalize it: lowercase host, drop trailing slash, query, and hash.
2. If `url:<normalized>` exists, return the saved result for that product. Never rejudge a URL.
3. Pull the page. Try Cloudflare Browser Rendering first (REST endpoint `/accounts/{account_id}/browser-rendering/content` or the `browser` binding, whichever the account has). If it is not available, plain `fetch` the URL. Reduce the HTML to `{ title, meta_description, text, links, rendered }`. Cap text at about 6,000 words.
4. Automated checks: call the PageSpeed Insights API (`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=...&category=performance&category=accessibility&strategy=mobile`) for performance and accessibility (score x 100, integer). `loads` is whether the page fetch returned 2xx. `security_headers` is true when the response has content-security-policy or strict-transport-security. `mobile_ok` is true when the HTML has a viewport meta tag. `console_errors` is 0 unless Browser Rendering reports errors. If PageSpeed fails or times out after 30 seconds, use 50 for both and note it.
5. If `loads` is false, the verdict is Sloppy. Skip the agent and save.
6. Run the agent with `runAgent("judge", { url, page, automated_checks }, env)`. If it returns `enough_content: false` and the page was not rendered, retry once with Browser Rendering. If it still lacks content, return `{ needs_description: true }` so the site can ask for one line, and accept `description` on a second POST /judge to append to page.text.
7. Make the id a slug from the host (for example `floodwatch-chs-pages-dev`). Add a short suffix if taken.
8. Save the Product Profile: `builder` set to `by`, the agent's name, what_it_does, target_user, capabilities, plus `url`, `status: "submitted"`, `match_status: "unmatched"`, `automated_checks`, `consent: { roast_me: roast_me === true }`, `agent_observations: [{ at, note: observation, source: "submission" }]`, created_at, updated_at.
9. Compute lane one from docs/scoring.md: measured 40 plus the sum of the six AI scores. Save `judge:<id>` with lane 1, `card:<id>`, `url:<normalized>`. Save the subscriber if an email came in.
10. Thumbnail: take a screenshot with Browser Rendering (`/browser-rendering/screenshot`, 1200 x 630 viewport, JPEG). If that is not available, fetch the page's og:image. If neither exists, save no thumbnail and the site shows a placeholder. Save to `thumb:<id>`.
11. Return `{ id, verdict, card, ai_answers, human_questions }`. ai_answers is `[{ id, question, evidence }]` with no scores, for the "agent animation" loading screen that shows the questions being answered. human_questions is the eight questions from agent/judging-questions.md as `[{ id, question }]`. The site holds the verdict until the submitter answers or skips.

### POST /judge/:id/answers  `{ answers: [{ id, answer }] }`

1. Load `judge:<id>`. If lane is already 2, return the saved verdict (answers count once).
2. Run `runAgent("score-answers", { profile, answers }, env)`.
3. human_score = sum of the eight 0 to 5 scores x 1.25. total = ai_score / 2 + human_score. Apply the AI floor: if ai_score / 2 is under 30, the verdict is Sloppy. Otherwise 70 or above is Not.
4. Save lane 2 to `judge:<id>`. Append the observation to the profile's agent_observations.
5. Return `{ id, verdict }`.

### POST /judge/:id/email  `{ email }`

Basic email check. Save `subscriber:<email>` with a random unsubscribe_token. Return `{ ok: true }`. Never echo other subscribers.

### GET /projects

Every product with a `card:<id>`: `[{ id, name, url, by, thumb_url, likes_and_goals, brings }]`. `by` comes from the profile's `builder` field. `thumb_url` is `/projects/<id>/thumb` or null. No verdict, no scores, no email.

### GET /projects/:id/thumb

Serves `thumb:<id>` with its content type and a one-day cache header. 404 when there is none.

### POST /projects/:id/vote  `{ vote: "slop" | "not" }`

The Judge screen in Figma is a binary swipe: left for SLOP, right for NOT. Append `{ vote, at }` to `votes:<id>` and keep running counts. Return `{ ok: true }`. Never return the counts to the public. They feed the weekly State of Slop email, not the verdict. The old five-field `POST /products/:id/review` stays for the agent loop.

### GET /projects/next?seen=<comma separated ids>

One card the judge has not seen yet, in the same shape as GET /projects. Returns `{ done: true }` when there are none left. The Judge screen shows one card at a time.

### GET /ridicule

Only products with consent.roast_me true and a saved verdict: `[{ id, name, url, by, thumb_url, likes_and_goals, brings, verdict }]`. Still no numbers.

## Verdict math in one function

```js
function verdictFor(j) {
  if (j.automated_checks?.loads === false) return "Sloppy";
  if (j.lane === 2) {
    if (j.ai_score / 2 < 30) return "Sloppy";
    return j.total >= 70 ? "Not" : "Sloppy";
  }
  return j.ai_score >= 70 ? "Not" : "Sloppy";
}
```

## Done means

- `npm test` passes from the repo root.
- With `npx wrangler dev`, POST /judge on a real Pages site returns a verdict, a card, and a thumbnail in under 60 seconds.
- POST /judge on the same URL twice returns the same verdict.
- GET /projects never contains "verdict", "score", or "@".
- Write one agent-log entry (new file, append only) showing a real judge run.
- Open a PR into main that says it touches worker/ and why. Jacky merges.
