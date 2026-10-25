# Sloppy or Not: Pitch Demo Plan

Drafted Oct 25, 2026. Revised the same day to give all three of us speaking parts and to spec the Gituationship slides.

## The concept

A slideshow with links to the live site, done in the style of Mystery Science Theater 3000.

- The silhouettes in the bottom corner are us. Therese is the narrator with her back to the audience. Olivia and Jacky are the two sidekick robots. We voice them live.
- The hecklers roast the sloppy sites.
- One site comes back **not sloppy**, gets an invitation to the git relationship, and we show the signup.
- The MST3K style is for the **pitch only**. The product tone stays clean.

**Why the silhouettes are us:** the judges hear three humans, not one agent. Each of us steps out of the riff to present the feature we built. That is the proof we are making: the agent reasons, and humans judge, correct, and approve.

## Run of show (5:00), tightened Oct 25 morning

Spoken pace is about 140 words a minute. Every block below is timed to its word count with room for the clicks.

The HarborHack rules (https://harborhack-2026.devpost.com) say the live demo must show the problem, the solution, the role of our synthetic teammate, and lessons learned. Non-human collaboration is one third of the score. The "Our fourth teammate" beat is required. Never cut it.

If we run long, cut in this order: the Porchlight sentence in Jacky's block, then the second roast. G4 and the ShiftSwap roast are already out of the timed run and are only for Q&A or a slow room.

| Time | Beat | Who talks | On screen |
|---|---|---|---|
| 0:00 to 0:25 | Cold open (the problem) | Therese | sloppyornot.com home page |
| 0:25 to 0:55 | 1. Sloppy sites get roasted | All three riff (script in docs/riff-script.md) | Judge page with the "Roast me" overlay |
| 0:55 to 1:05 | 2. The turn | Olivia | FloodWatch CHS card |
| 1:05 to 1:45 | Human review | Olivia | Submit page, then the swipe |
| 1:45 to 2:15 | Checks and memory | Jacky | Judge page |
| 2:15 to 2:25 | 3. "You've been noticed." | Therese | gituationship.html, first slide |
| 2:25 to 3:50 | 4 and 5. The git relationship, live | Therese narrates, Jacky presses Reject, Olivia presses Approve | Slides G1 and G2, then G3 wired to the live API |
| 3:50 to 4:05 | Close (the solution) | Therese | The Blueprint |
| 4:05 to 4:40 | Our fourth teammate (synthetic teammate and lessons learned) | Therese | The agent-log/ folder on GitHub |
| 4:40 to 5:00 | Community impact | All three | sloppyornot.com footer |

**No numbers on stage.** Users only ever see one word: Sloppy or Not. Scores live in the backend as data. Nobody says a score out loud, and the match card shows the agent's reasoning, not its confidence number.

**Rule:** comedy for the problem, straight delivery for the solution. Once signup starts, the hecklers become cheerleaders, not interrupters.

### The lines

**Therese, cold open (0:00):** "Anyone can build with AI now, so every hackathon ships a pile of products. Most of them are slop. The good ones still have holes, and the person who could fill that hole is sitting two tables away. Sloppy or Not tells the difference. Gituationship finds the fix. Let's meet tonight's contestants."

**Beat 1 (0:25):** see docs/riff-script.md. HelpDock and Porchlight, swipe left after each one.

**Olivia, the turn (0:55):** "...wait. Nobody say anything. This one's actually good."

**Olivia, human review (1:05):** "The agent does not decide what is good. People do. You paste a link. The agent answers six questions about the page, and you answer eight about the work. Then the room swipes: left for slop, right for not. You get one word, never a number, because we grade the product, not the person. People said they would use FloodWatch. Most of them did not get it at first look. That is its hole."

**Jacky, checks and memory (1:45):** "Human taste is one signal. The machines are the other: does it load, is it fast, is it accessible, does it work on a phone. That data stays in the backend. You only ever see one word. And the agent remembers everything we tell it, including when we tell it no. In a minute I am going to tell it no, live."

**Therese, beat 3 (2:15):** "FloodWatch, you've been noticed."

**Therese, G1 (2:25):** "FloodWatch is not sloppy. That makes it worth dating. Nobody is perfect, and its weak spot is onboarding. The owner pastes a live link. GitHub is optional, because plenty of vibe coders ship without it."

**Therese, G2:** "The agent digs through products whose owners opted in to sharing. Nobody else is in that pile. HelpDock looks like onboarding. It is not. ShiftSwap is close, but onboarding is a side feature. FirstRun does onboarding for a living."

**G3, live (about 3:00):** the match card loads the agent's real proposal from the API.

**Therese:** "The agent proposes FirstRun. It does not decide. Jacky?"
**Jacky:** "No. FirstRun fails our accessibility check, and drivers need tooltips that work with screen readers." (She types that reason and presses Reject.)
**Therese:** (while the agent thinks, about 10 to 15 seconds) "Every rejection gets saved with its reason. The agent reads it before it picks again. It does not get to forget."
(The new proposal loads. It names ShiftSwap CHS and quotes Jacky.)
**Therese:** "It quoted her word for word, and it switched to text message onboarding, which happens in the phone's own messaging app."
**Olivia:** "Approved." (She presses Approve. The logos hug.)
**Therese:** "Nothing happens until a human says yes."

**Therese, G4 (out of the timed run, use only if a judge asks):** "The owner's email is shared only if they chose to share it, and only after a human approves. This box is a preview. We are not building messaging."

**Therese, close (3:50):** "Approval unlocks the Super Product Blueprint: what each product brings, the first thing to build, and the requirements, written after a human said yes. A persistent agent that understands products, learns from human judgment, and finds the partner that makes both better. Humans approve every match."

**Therese, our fourth teammate (4:05):** "We had a fourth teammate: Claude. It had two jobs. Inside the product, Claude is the agent that judges, remembers, and matches. Outside it, Claude Code built with us. It wrote prompts with me, built the expert worker that learned Olivia's rules, and kept a log you can read on GitHub. Together we built a trap: a decoy product and one with no honest match, so the agent could fail in public. It did not. The lesson: an agent is only as trustworthy as the tests it can fail. And humans make the final call."

**Community impact (4:40):**
- **Olivia:** "We're AI Tech Girlfriends: three women who build with AI and want more women doing it together."
- **Jacky:** "Every slop project burns energy for nothing. Sloppy or Not pushes everyone to build fewer, better things."
- **Therese:** "We bring people together through new tech, and we make it fun. Thank you."

## Likely judge questions (Q&A, 3:00)

Therese takes the question and hands off to the owner named in brackets.

1. **"Is the agent actually live, or is this a mockup?"** [Jacky] Live. The rejection you just watched went to our API at api.sloppyornot.com, and the agent re-planned on the spot; agent-log/ holds the same test from last night with timestamps.

2. **"Do you show builders their score?"** [Olivia] No. Builders see one word, Sloppy or Not, and the scores stay in the backend as data for the agent and the weekly State of Slop. A number invites gaming and grades the person, and we grade the product.

3. **"What makes the memory persistent, and not just a long prompt?"** [Jacky] Every observation, proposal, approval, and rejection is saved per product in Cloudflare KV and loaded into the next agent call. The agent cites those memories with timestamps, which is how it quoted a rejection from an earlier run word for word.

4. **"Isn't it ironic to use AI to judge AI slop? What about bias?"** [Olivia] The agent does not decide what is good; humans swipe, and the agent explains and matches. In Think Like Olivia the agent learned my stated rules, and my verdict sits beside every AI suggestion so you can see exactly where it got me wrong.

5. **"What about privacy? Are you scraping founders' contact info?"** [Therese] No. The agent never looks for contact info, and an owner's email reaches a match partner only if the owner opted in to sharing it and a human approved the match.

6. **"Who is this for after the weekend?"** [Therese] It is free for hackathons, student showcases, and local dev meetups, starting with the next one in Charleston. Builders leave with honest feedback and possibly a collaborator, and organizers get a room that reviews itself.

## The live match on stage (G3)

This is our strongest Non-Human Collaboration moment: a human says no, and the agent re-plans in front of the judges. The routes are already live on api.sloppyornot.com. The only missing piece is the buttons.

### Needs from Olivia (site/pitch/gituationship.html, her lane)

Wire G3 to the API instead of the mocked card. Product id is `floodwatch-chs`.

1. When G3 opens: `GET /products/floodwatch-chs`. Show the last entry of `potential_matches`: the partner name and the agent's reasoning. Do not show the confidence number.
2. Reject: a text box for the reason, then `POST /matches/floodwatch-chs/reject` with `{ "reason": "..." }`. Then `POST /agent/propose/floodwatch-chs` and show "The agent is thinking..." until it returns. Render the new proposal the same way.
3. Approve: `POST /matches/floodwatch-chs/approve` with `{ "approved_by": "Olivia" }`. Fire the hug right away, then show the Blueprint when the call returns. The Blueprint call takes several seconds, and the hug covers it.
4. If any call fails or takes over 30 seconds, show the cached version of the same step from agent-log/2026-10-24-2016-demo-beats-tested.json with a small "Recorded run, Oct 24" label. Never pass a recording off as live.

### Pre-show (Jacky, 5:30 PM)

1. Run `scripts/reset-demo.sh`.
2. Run `POST /agent/observe/floodwatch-chs`, `POST /agent/find-gap/floodwatch-chs`, and `POST /agent/propose/floodwatch-chs`, so FirstRun is already proposed when G3 opens. That leaves only two live agent calls on stage: the re-propose and the Blueprint.
3. Open G3 once to confirm the card loads, then reload to the first slide.

## The git relationship slides (G1 to G4)

Built: `site/pitch/gituationship.html`. Open it, press the buttons, use the arrow keys between slides. Olivia: swap your logo halves into the `#logo-left` and `#logo-right` SVGs, and restyle anything you want.

### G1: Add your product

- Lead with a URL box: "Paste your live link." The automated checks already run on the URL, and many vibe coders ship without GitHub.
- Below it, an optional "Connect GitHub" link for builders who have a repo.
- An email field, using the one already on Olivia's site. The owner types it and chooses to share it. The agent never goes looking for contact info.
- **No live login on stage.** Paste the FloodWatch URL, then jump to a mocked "Connected!" screen.

### G2: The robot digs

- A small pixel robot with a shovel digs into a pile labeled "Shared products".
- Repo cards pop out of the dirt one at a time:
  1. HelpDock. The robot looks at it and tosses it aside. Caption: "Looks like onboarding. It is not." (This is the decoy the agent rules out for real.)
  2. ShiftSwap CHS. Set to the side. Caption: "Close, but onboarding is a side feature."
  3. FirstRun. The robot holds it up. Caption: "Onboarding is its core."
- Captions come from the agent's real reasoning in the 20:16 agent-log entry, so the cartoon matches what the agent actually did.
- Only products whose owners opted in to sharing appear in the pile. Say that out loud. Judges will ask.

### G3: The hug

- The match card shows the agent's proposal. Olivia presses **Approve**.
- Only after Approve: the two halves of Olivia's logo slide in from each side, meet in the middle, and hug.
- A pixelated heart pops above them, holds for one beat, and fades.
- Keep it simple: CSS keyframes, about 1.5 seconds total, no library.
- Needs from Olivia: the logo as an SVG with the two halves as separate groups.

**Why the hug waits for Approve:** the core loop says humans approve matches. If the hug fires on the agent's proposal alone, the animation tells the judges the opposite of our pitch.

### G4: Connect to owner (optional)

- The match screen shows both products with their live links, plus the GitHub repo where one was connected.
- Contact comes from the email the owner shared when they submitted. Nothing is scraped.
- An optional "Connect to owner" button opens a simulated text box. A message types itself out:

  > "Hi FirstRun team. Our flood alert app gets great reviews but new users get lost on the first screen. Your onboarding could fix that. Want to build something together?"

- No send button works. A small label under the box says: "Preview only. We share the owner's email once the match is approved."
- We are not building messaging. The label keeps us honest if a judge clicks it.

## "Roast me" button (demo build)

- A demo-only overlay on top of the live site, not built into the product UI.
- Built: `site/pitch/roast-overlay.js`. Add one script tag to any page. It does nothing without `?demo=1` in the URL.
- Pick the roasts with `?product=helpdock` (or porchlight, shiftswap-chs, floodwatch-chs). The roasts use each seed product's real check results.
- **Pre-load or cache the roasts.** No live API calls on stage.
- Button label in sentence case: "Roast me".
- Disclaimer banner pinned above the button: "Pitch demo. The roasts are ours, not the product's."

## Cautions

- **Homage, not copy.** No Crow, no Tom Servo, no MST3K silhouette shapes or theme song.
- The audience has to leave knowing what the product does. Olivia's and Jacky's segments plus G1 to G4 carry the pitch.
- Reset the live store with `scripts/reset-demo.sh` before the pitch so the demo starts clean.
- Think Like Olivia is a Q&A backup, not a beat. Cut it first if time runs short.

## Decisions made in this revision

1. **Overlay vs. full UI for "Roast me":** overlay.
2. **Who matches with whom:** products with products. A live URL is required. GitHub is optional.
5. **Contact info:** the owner provides an email at submit. Finding contact info is not an agent job.
3. **The "not sloppy" hero:** FloodWatch CHS. It is seed data, so no permission is needed.
4. **Disclaimer copy:** "Pitch demo. The roasts are ours, not the product's."

## Still open

1. Olivia: is the logo ready as a two-part SVG?
2. Olivia: push the email field. The worker now accepts `email` (or `contact_email`) on POST /products, stores it in KV as `contact:<product_id>`, and never puts it in the public profile. GET /matches/:id/contact returns the partner's email only after the match is approved. Jacky: please review, since it is your lane.
3. Jacky: are you comfortable telling the rejection story in your own words? Rewrite your lines freely.
4. All three: one full run-through with a timer before 5:00 PM.

## Next 3 actions

1. Olivia: swap your logo into `site/pitch/gituationship.html`, add the roast overlay script tag to the product page, and push the email field.
2. Jacky: review and merge PR #46 (the email stays out of the public profile).
3. All three: one timed run-through before 5:00 PM, after the Devpost is in, each person reading their own lines.

## Starter riffs (placeholders)

- "Is that Comic Sans or a cry for help?"
- "This hero image loaded slower than my dial-up in 1998."
- "Four fonts. Four. Pick a lane."
- "The contact form just leads to another contact form."
- Beat 2 turn: "...wait. Nobody say anything. This one's actually good."
