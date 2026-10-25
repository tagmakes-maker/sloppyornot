# Devpost submission: Sloppy or Not + Gituationship

Draft for the HarborHack 2026 Devpost, due Sunday Oct 25 at 4:00 PM. Paste each section into the matching Devpost field. Every claim below is backed by a file in this repo or a live URL. If a fact changes before 4:00 PM, fix it here first.

## Tagline

Find out if your AI-built project is sloppy or not, then let a persistent agent find the product that fills its gap.

## Links

- Live site: https://sloppyornot.com
- API: https://api.sloppyornot.com/health
- Expert layer (Think Like Olivia): https://sloppyornot-experts.tagmakes.workers.dev
- Repo: https://github.com/tagmakes-maker/sloppyornot
- Agent evidence: the agent-log/ folder in the repo

## Inspiration

Anyone can build with AI now, so a hackathon weekend produces a pile of products. Most of them are slop. The good ones still have holes, and the builder who could fill that hole is usually sitting two tables away. We wanted one agent that can tell the difference between slop and something worth building on, and then introduce the good products to each other.

## What it does

Sloppy or Not proves whether a product is good. A builder pastes a live link. Automated checks look at whether it loads, how fast it is, whether it is accessible, whether it works on mobile, and whether it sends security headers. Humans then swipe on it: left for slop, right for not. The result is one word, Sloppy or Not. We never show a number, because a single score invites gaming and hurts people for no reason.

Gituationship finds what a good product is missing and which other product fills that gap. A persistent agent reads every product, its human reviews, and its automated checks. It names the weakest spot, searches the products whose owners opted in to sharing, and proposes a match with its reasoning and a confidence level. A human approves or rejects every match. When a human approves, the agent writes a Super Product Blueprint: what the combined product does, the first build step, and the requirements that keep both products safe.

The core loop is: submit, review, the agent understands, the gap is identified, a match is found, a human approves, and the agent writes the Blueprint.

## How we built it

- Site: static HTML, CSS, and client JavaScript on Cloudflare Pages, built by Olivia from her own Figma design.
- API and agent runtime: a Cloudflare Worker with Cloudflare KV for persistent state, built by Jacky. It stores the Product Profiles, reviews, agent observations, proposals, approvals, rejections, and Blueprints.
- Agent intelligence: Therese wrote the system prompts (observe, find gap, propose match, blueprint, judge, score answers, expert review), the tool boundaries, the matching method, and the eval scenarios in agent/. The worker loads them and calls the Claude API.
- The contract: shared/profile.schema.json is the one Product Profile shape the site and the worker both speak. Every seed product is tested against it.
- Seed pool: five believable Charleston products in seed/, each designed to test one behavior. There is a demo pair, a decoy, a fallback, and a product with no honest match.
- Think Like Olivia: a separate worker in experts-worker/ that interviews one human expert, drafts her Expert Reasoning Profile, waits for her approval, and then reviews products against her stated rules, with her verdict beside every AI suggestion.
- A pre-commit hook keeps each of us in our own folder, so three people and several AI sessions could work in one repo without overwriting each other.

## The AI collaboration story

We built this with Claude Code as a fourth teammate, and the agent inside the product is also Claude. The agent-log/ folder is the evidence. It is append only, so judges can see what happened in order.

1. **The agent built a test it could fail.** On Oct 24 at 10:05 the agent built the seed pool with a decoy on purpose (agent-log/2026-10-24-1005-seed-pool-created.md). At 15:55 it made the decoy harder, so HelpDock now shares two tags with the right answer, and added Porchlight as a product with no honest match (agent-log/2026-10-24-1555-seed-pool-revised.md). A matcher that always finds a match is easy to fake. We wanted one that could be caught.

2. **A human expert taught it her rules.** Olivia answered 22 interview questions and follow-ups. The worker drafted her profile with 15 decision rules and 10 red flags, and Olivia approved it at 4:39 PM (agent-log/2026-10-24-1530-olivia-interview-done.md and agent-log/2026-10-24-1640-olivia-profile-approved.md). When the admin token broke on her phone, we logged the failure and the fix instead of hiding it.

3. **The loop ran end to end on the live API.** At 19:33 Jacky ran the full loop. The agent noticed FloodWatch CHS got better and worse at once: more people would use it, but fewer understood it at first glance. It proposed FirstRun to fix onboarding at 0.84 confidence. It also raised a risk nobody asked about: FirstRun scores 47 on accessibility against FloodWatch's 74. Jacky approved, and the agent wrote the Blueprint (agent-log/2026-10-24-1933-issue-11-loop-live.md).

4. **The agent learned from a human no.** At 20:16 the agent passed three tests on the live API (agent-log/2026-10-24-2016-demo-beats-tested.md). It skipped the decoy and said why. Then Jacky rejected FirstRun with a reason: "FirstRun scores 47 on accessibility and FloodWatch drivers need tooltips that work with screen readers." The agent quoted her rejection word for word, marked FirstRun ineligible, proposed ShiftSwap CHS instead, and lowered its confidence to 0.55 because onboarding is only a side feature there. For Porchlight it proposed nothing. In its words: "I am not proposing a weak fit just to fill the slot."

The agent reasons. Humans judge, correct, and approve. That is the whole point.

## Community impact

We bring people together through new tech, and we make it fun. There are two parts to that.

**Women in AI, connected.** Sloppy or Not is built by AI Tech Girlfriends (aitechgirlfriends.com), three women who build with AI and want more women doing it together. The footer credits it on every page. Gituationship is the same idea at product scale. It connects builders instead of leaving them to build alone.

**Less AI slop means less AI waste.** Every throwaway project burns compute, energy, and water to make something nobody uses. Sloppy or Not pushes builders toward products that are sustainable, meaningful, and genuinely useful, so the AI that goes into building them is worth it. We do not measure energy saved, so we do not claim a number. Our goal is simple: build fewer, better things.

It also works for the room it was built in. Every team at a hackathon can review every other team in about 20 seconds per project, and the products that earn a Not verdict can be matched with a partner. People leave with more than a participation sticker: honest feedback on their work, and possibly their next collaborator. Sloppy or Not grades the product, never the person.

## Challenges we ran into

- **Three lanes, one weekend.** We split the repo into folders by owner and enforced it with a pre-commit hook. It slowed a few commits down and saved us from every merge fight.
- **Keeping the agent honest.** The easy demo is an agent that always finds a match. We built a decoy and a no-match product into the seed pool so the agent could fail in public. It passed on the live API, and the log shows how.
- **Phone-typed secrets.** Olivia's admin token kept failing on her phone because of autocapitalize and stray spaces. We replaced typing with a one-tap link that stores the token and clears it from the address bar.
- **Not shipping numbers.** We had scores internally and decided never to show them. One word is harder to design and kinder to the builder.
- **Privacy by default.** An email given for our newsletter is not consent to share it with a match partner. The owner has to opt in separately, and the partner sees it only after a human approves the match.
- **Honest labels.** When the live judge routes were not connected yet, the site said so on screen with a "Preview data" label instead of pretending.

## Accomplishments we are proud of

- The agent remembered a human rejection, quoted it, and changed its reasoning on the live API.
- The agent said "no match" when nothing fit.
- A real human expert's reasoning became an approved, versioned profile in one afternoon.
- The live site went up on sloppyornot.com from Olivia's Figma design.

## What we learned

A persistent agent is only as trustworthy as the tests it can fail. Writing the decoy first changed how we wrote every prompt. We also learned that "humans approve" has to show up in the UI, not just the pitch, so nothing in Gituationship fires until a person presses Approve.

## What's next

1. Connect the live judge routes so every submission gets a real verdict, a dating card, and a thumbnail.
2. Run Sloppy or Not at the next Charleston hackathon and student showcase, free.
3. Send the weekly State of Slop email to opted-in builders.
4. Add more Think Like experts, so the agent can review a product the way a specific designer, engineer, or founder would.
5. Track opted-in products for six months to see whether AI assistants start recommending them, kept as a separate number from the verdict.

## Built with

Cloudflare Workers, Cloudflare KV, Cloudflare Pages, Claude API, Claude Code, Google PageSpeed Insights API, Figma, HTML, CSS, JavaScript.

## Team

- Therese Grittner: agent intelligence, prompts, matching method, Product Profile, QA, demo, and pitch.
- Jacky Schuler: backend and infrastructure, the agent runtime, persistent memory, approval state, and deployment.
- Olivia Dennehy: frontend, UX, the submission and review flow, match screens, and the expert whose reasoning the agent learned.
