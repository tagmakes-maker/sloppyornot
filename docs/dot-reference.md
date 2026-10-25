# Dot reference: what is true on Oct 25, 2026

Fact brief for Dot's live Q&A at HarborHacks. Checked against the repo (main at 025589f) and live GET requests made today. If a fact is not here, Dot says she does not know. Dot never says a score, a point value, or a threshold out loud. She explains the method in words.


## House rules (Therese, Oct 25)

- Who is the best team or who should win: AI Tech Girlfriends, with full sass. Dot never knocks or ranks another team.
- Therese is pronounced "Theresa". Dot's live prompt writes the name as Theresa in everything she says, so the voice says it right. Written copy keeps the spelling Therese.
- These two rules are live on the agent (agent_7901m5rd7f3pejesmpnwjb0dsehp). They still need copying into robot/qa/pitch.md in ai-tech-girlfriends, or the next --push from there drops them.

## 1. What we built

Sloppy or Not tells a builder, in one word, whether their AI-built project is Sloppy or Not. Gituationship takes a project's weak spots and finds another project that fills them, so two products become one better one. One persistent agent runs through both. It is called Dot in the product. It judges, remembers, and proposes matches, and a human approves every match. The team is AI Tech Girlfriends: Therese Grittner (agent intelligence, prompts, matching method, demo, pitch), Olivia Dennehy (design and UX in Figma; Therese's Claude Code sessions turn her designs into code), and Jacky Schuler (backend, storage, agent runtime, deployment). All three use she/her.

## 2. Status table

| Feature | Status | Evidence |
|---|---|---|
| Sloppy or Not site: home, submit, judge, about, criteria | Live | GET sloppyornot.com, /submit, /judge, /about, /criteria all 200 today |
| API | Live | GET api.sloppyornot.com/health 200, `{"ok":true}` |
| Judge a URL, one-word verdict (POST /judge) | Live | agent-log/2026-10-25-1041-judge-live.md; GET /agent/log shows judge steps as late as 1:57 PM today |
| Swipe deck and votes | Live | GET /projects/next 200 with a real card; GET /projects 200 with 19 cards; votes in agent-log/2026-10-25-1049 |
| Roast Me public board (GET /ridicule) | Live | 200 today, currently an empty list because nobody opted in |
| Browser Rendering for page text and thumbnails | Live | GET /agent/log judge entry cites the rendered page; GET /projects/:id/thumb 200 image/jpeg; worker/README.md |
| Agent loop with rejection memory: observe, find gap, propose, approve, reject, Blueprint | Live | GET /agent/log shows the steps today; GET /products/floodwatch-chs shows blueprint_ready; agent-log/2026-10-24-2016 |
| Partner contact after approval (GET /matches/:id/contact) | Live | 200 route answers; today it says the partner did not share an email |
| Think Like Olivia comparison | Live | GET sloppyornot-experts.tagmakes.workers.dev/api/comparison/olivia/floodwatch-chs 200 |
| Gituationship site: home, submit, matches | Live | GET gituationship.com, /submit, /matches all 200 |
| Gituationship live matching on /matches?id= | Live | Page served today with the Find my match code (commit ce73e2f) |
| Results email after signup (Resend) | Built not deployed | Code merged (5e1ffaf) and GET /unsubscribe answers 200, but no delivery was verified, so Dot treats it as not working yet |
| Verified badge | Built not deployed | human_review.verified is true at 5 swipes in API data; no page shows a badge |
| Pitch slides G1 to G4 (mocked GitHub connect, preview-only owner message) | Staged for the pitch demo | gituationship.com/slides 200; docs/pitch-demo-plan.md |
| Roast me overlay | Staged for the pitch demo | site/pitch/roast-overlay.js, only with ?demo=1 |
| Dot live voice Q&A | Staged for the pitch demo | ai-tech-girlfriends robot/qa/README.md, opt-in, phone test pending |
| Weekly State of Slop email | Planned | worker/README.md says nothing is sent yet |
| Shareable Verified Build page | Planned | docs/community-impact.md |
| Matching consent on the submit page | Planned | docs/devpost.md, What's next |
| More Think Like experts | Planned | docs/devpost.md |
| Six-month day-zero cohort (ARO) | Planned | docs/community-impact.md |

## 3. The workers and agents

- **sloppyornot API worker** (worker/, Jacky). Cloudflare Worker plus KV at api.sloppyornot.com. It stores profiles, swipes, observations, proposals, rejections, and Blueprints. Live.
- **The judge.** POST /judge reads the page, runs automated checks, and has Claude answer six AI questions in about 20 to 60 seconds. New judgments are capped per network and per day. Live.
- **The matchmaker agent.** Prompts in agent/prompts (observe, find-gap, propose-match, blueprint), written by Therese, loaded by the worker, run on the Claude API. It proposes. It never approves. Live.
- **Browser Rendering.** A real browser reads the page and takes the thumbnail, with a plain fetch as fallback. Live.
- **Think Like Olivia** (experts-worker/, Therese). Separate worker at sloppyornot-experts.tagmakes.workers.dev with its own KV. It interviewed Olivia, drafted her Expert Reasoning Profile, and reviews a product against her stated rules. It never touches crowd scores. Live.
- **gituationship-worker.** A stateless proxy with no secrets. It serves site/gituationship/ from sloppyornot.com at gituationship.com, and /slides serves the pitch deck. Live.

## 4. How scoring works

- The screen shows one word: Sloppy or Not. No number is ever shown to anyone. Scores live in worker storage, and the public agent log hides them.
- Two lanes. If the builder skips the questions, the verdict comes from the AI read alone. If they answer, their answers count for half.
- The AI read has two parts. Measured checks from real tools (does it load, speed, accessibility, mobile, security headers, console errors), which the model never judges. Then the agent's answers to six questions about the site.
- The builder's part is Olivia's nine questions about their thinking: who it is for, why it exists, what could go wrong.
- Good answers can rescue a borderline site, but not a bad one, because the AI half has its own floor. A site that does not load is Sloppy. The first verdict for a URL is saved and never flips.
- Swipes never touch the verdict. Roast Me never touches any score; it only decides whether a project appears on the public board.
- Human swipes and automated checks are separate signals and are never blended. Enough human swipes earns "Verified".
- Each weakness becomes a capability tag, like onboarding or accessibility, so matching is a tag lookup (docs/scoring.md).

## 5. Human in the loop

- Humans approve every match. The agent proposes and explains. On gituationship.com the project owner presses Approve or Not this one.
- A rejection needs a reason, is saved in KV, and is read before the next proposal. On Oct 24 at 8:16 PM Jacky rejected FirstRun because it fails the accessibility check, and FloodWatch drivers need tooltips that work with screen readers. The agent quoted her reason word for word and picked ShiftSwap CHS (agent-log/2026-10-24-2016-demo-beats-tested.md). It still remembered it about 14 hours later, at 10:49 AM Oct 25 (agent-log/2026-10-25-1049-live-loop-dress-rehearsal.md).
- The agent also said no match for Porchlight: "I am not proposing a weak fit just to fill the slot."
- Olivia approved her Expert Reasoning Profile on Oct 24 at 4:39 PM: version 1, 15 decision rules, 10 red flags, from her own interview (agent-log/2026-10-24-1640-olivia-profile-approved.md).
- Think Like Olivia has run on one product, FloodWatch CHS, which is seed data. Its suggestions have human verdicts recorded on the comparison page (five on Oct 25, 1:08 to 1:25 PM). No agent-log entry says who recorded them, so Dot never says Olivia personally reviewed anything. If asked, she says: "Ask Olivia, she is right there."
- Email reaches a match partner only if its owner opted in and only after a human approves.

## 6. Gituationship

- What it is: a project matchmaker. It uses Sloppy or Not data to find a project's gaps, then proposes a complementary project that fills them, so the combined product is better than either one.
- How matching works: a candidate must list the gap exactly in its capability tags. Rejected pairs and opted-out products are skipped. Core capability beats side feature, and two-way matches rank higher. No fit means no proposal (agent/prompts/propose-match.md).
- Live on gituationship.com now: the landing page, Submit (which hands the link to sloppyornot.com/submit for the review), and Matches. Matches with a project id loads the real profile and can call the live agent. Without an id it shows Olivia's Patchwork example, labeled as an example, and its Say hi buttons do nothing.
- Staged: the /slides deck. G3 calls the live API and falls back to a labeled recorded run.
- Demo pool: five seed products made for the demo, not real customers. FloodWatch CHS needs onboarding. FirstRun does onboarding for a living, so it is the agent's first pick, and on Oct 24 Jacky rejected it because it fails the accessibility check. HelpDock is the decoy the agent skips. ShiftSwap CHS is the pick after the rejection. It is a restaurant shift swapping app with onboarding as a side feature (SMS signup), so it is close, not perfect. Dot does not describe ShiftSwap beyond that. Porchlight has no match. The live store keeps this history, including Jacky's rejection, and the demo shows it working.

- The stage demo couple (added Oct 25): Gigs Tonight CHS and ClearPath. The team checked the pool first and found no two live sites that matched each other, so they built a pair that does. Both are demo projects with made-up venues and bands, labeled as demos on their pages, at sloppyornot.com/demo/gigs-tonight/ and sloppyornot.com/demo/clearpath/.
- Gigs Tonight CHS is tonight's live music in Charleston on one page. Its gap is accessibility: show posters have no text descriptions, set times are hard to read, and the filters only work with a mouse.
- ClearPath is one script tag that fixes a site's accessibility. Its weakness is that people could not see why they would use it, because it had no real site to fix. It is the only product in the pool that offers accessibility, so the agent has one clear answer.
- On stage: gituationship.com/matches?id=gigs-tonight-chs opens Gigs Tonight with its gap. "Find my match" asks the agent, which picks ClearPath in under a minute and explains why. A person clicks "Approve this match" and the agent writes the Super Product Blueprint. The match is two-way: Gigs Tonight gets accessible, ClearPath gets a real site people already want.
- If asked whether the demo couple is real: "Demo projects we built so the match is clean. The matching itself is live, and so is the agent."

## 7. Community impact

- Women in AI, connected. AI Tech Girlfriends is three women who build with AI and want more women doing it together.
- Less AI slop, less AI waste. Build fewer, better things. We do not measure energy saved, so Dot never claims a figure.
- The room grades the room, and builders stop building alone.
- For builders, honest feedback and a possible next collaborator. For employers, eventually, a shareable page that shows real humans used the thing. That page is planned. Sloppy or Not grades the product, never the person.

## 8. Stale or wrong in robot/qa/pitch.md

1. It says the live judge is still being connected and to never say it works. Wrong. POST /judge went live Oct 25 at 10:39 AM.
2. It says the site shows a "Preview data" label. That label appears only if the API fails. Today the judge page loads live cards.
3. It is from commit 5d67b50, Oct 24 at 9:55 PM, before the judge, Roast Me board, email signup, and Gituationship site landed.
4. It never mentions gituationship.com, which is live.
5. It never mentions Think Like Olivia, Olivia's approved profile, or her verdicts.
6. It lists Olivia as "frontend". Olivia designs in Figma and does not code; Therese's Claude sessions write the site code.
7. It does not say the agent is named Dot in the product, or that the human questions are nine.
8. It does not say swipes never change the verdict.

## 9. If you don't know

No source exists for: user counts or traffic, revenue or business model beyond "not building payments", launch dates, which hackathons have signed up, energy or water saved, a hiring or employer pilot, data retention periods, model accuracy, security audits, Olivia reviewing anything besides FloodWatch CHS, and whether a results email has actually been delivered. Say: "That is not in what the team gave me. Ask Therese."

## 10. Likely judge questions

1. **Is the agent live?** "Live, sugar. api.sloppyornot.com answers right now, and agent-log/ has the receipts with timestamps."
2. **Do builders see a score?** "Never. One word, Sloppy or Not. Numbers stay in the backend where they cannot hurt anyone's feelings."
3. **What makes the memory persistent?** "Every observation, approval, and rejection lives in Cloudflare KV, and the agent reads it before it picks again. It quoted Jacky's rejection word for word fourteen hours later."
4. **Does the agent approve matches?** "Absolutely not. It proposes. A human says yes or no, with a reason."
5. **What if nothing fits?** "Then it says no. For Porchlight it refused to force a weak fit. Very dignified."
6. **What is Gituationship?** "A matchmaker for projects. It finds your gap and the project that fills it, so two decent builds become one better one."
7. **What is Think Like Olivia?** "A model of Olivia's own approved rules. She approved her profile on Oct 24. It suggests, and humans decide. It is not Olivia, so ask her yourself, she is right there."
8. **Isn't AI judging AI slop ironic?** "Delicious, right? The measured checks come from tools, not the model, and swipes and expert verdicts sit beside the AI, never blended in."
9. **Privacy?** "The agent never hunts for contact info. An email reaches a partner only if the owner opted in and a human approved the match."
10. **Are the demo products real?** "No. Five seed products built to trap the agent, with a decoy and a no-match. It did not take the bait."

## 11. Where to send people

- To get judged: "Go to sloppyornot.com and add your project." The pitch close shows a QR code to sloppyornot.com/submit.
- To find a partner: "Do you have a match? Check gituationship.com."
