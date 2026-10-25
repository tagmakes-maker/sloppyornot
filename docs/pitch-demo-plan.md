# Sloppy or Not: Pitch Demo Plan

Drafted Oct 25, 2026. Revised the same day to give all three of us speaking parts and to spec the Gituationship slides.

## The concept

A slideshow with links to the live site, done in the style of Mystery Science Theater 3000.

- The silhouettes in the bottom corner are us. Therese is the narrator with her back to the audience. Olivia and Jacky are the two sidekick robots. We voice them live.
- The hecklers roast the sloppy sites.
- One site comes back **not sloppy**, gets an invitation to the git relationship, and we show the signup.
- The MST3K style is for the **pitch only**. The product tone stays clean.

**Why the silhouettes are us:** the judges hear three humans, not one agent. Each of us steps out of the riff to present the feature we built. That is the proof we are making: the agent reasons, and humans judge, correct, and approve.

## Run of show (5:00)

| Time | Beat | Who talks | What they show | Tone |
|---|---|---|---|---|
| 0:00 to 0:30 | Cold open | Therese | The problem: a weekend of products, most of them slop, and the good ones still have holes. | Straight |
| 0:30 to 1:20 | 1. Sloppy sites get roasted | All three riff | Two or three seed sites with cached roasts. | Comedy |
| 1:20 to 1:35 | 2. The turn | Olivia | FloodWatch CHS appears. "...wait. Nobody say anything. This one's actually good." | The turn |
| 1:35 to 2:20 | Human review | Olivia | The swipe flow. Human votes become the Verified badge. Her review is why the site counts as good. | Straight |
| 2:20 to 3:00 | Checks and memory | Jacky | Automated checks next to human scores, kept separate. Then the agent's memory: the rejection she gave it last night and how its reasoning changed. | Straight |
| 3:00 to 3:15 | 3. "You've been noticed." | Therese | The invite pops up. | Payoff |
| 3:15 to 4:30 | 4 and 5. The git relationship | Therese narrates, Olivia presses Approve | Slides G1 to G4 below. | Straight with one cute moment |
| 4:30 to 4:50 | Close | Therese | The Super Product Blueprint and the one line we are proving. | Straight |
| 4:50 to 5:00 | Buffer | | | |

**Rule:** comedy for the problem, straight delivery for the solution. Once signup starts, the hecklers become cheerleaders, not interrupters.

### Speaking parts, first draft

**Therese, cold open:** "Hackathons ship a hundred products a weekend. Most of them are slop. The good ones still have holes. We built an agent that knows the difference and finds the fix."

**Olivia, human review:** "The agent does not decide what is good. People do. Every swipe is one human answering four questions. Enough swipes and a product earns the Verified badge. FloodWatch earned it. People said they would use it. They also said they did not understand it at first."

**Jacky, checks and memory:** "Human taste is one signal. Here is the other: does it load, is it fast, is it accessible. We never blend the two. And the agent remembers. Last night it proposed a match and I said no, with a reason. Watch what it did next." (Show the 20:16 rejection from agent-log. The agent quoted her reason and changed its pick.)

**Therese, match narration:** "FloodWatch is not sloppy. That makes it worth dating. Nobody is perfect, and its weak spot is onboarding. So the agent goes looking."

**Therese, close:** "A persistent agent that understands products, learns from human judgment, and finds the partner that makes both better. Humans approve every match."

## The git relationship slides (G1 to G4)

Animations live in `site/` (Olivia's lane). This doc is the spec, not the build.

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

- No send button works. A small label under the box says: "Preview only. We will share your email with the owner once you both approve."
- We are not building messaging. The label keeps us honest if a judge clicks it.

## "Roast me" button (demo build)

- A demo-only overlay on top of the live site, not built into the product UI.
- Turn it on with a URL flag (`?demo=1`). Real users never see it.
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
2. Olivia and Jacky: the email field saves to the worker's KV today, not Supabase. Fine for Sunday. It is not in `shared/profile.schema.json` and not in the repo yet. Where does it live in KV, and does the match screen read it from there? If it should become part of the Product Profile, that is a contract change for all three of us after the pitch.
3. Jacky: are you comfortable telling the rejection story in your own words? Rewrite your lines freely.
4. All three: one full run-through with a timer before 5:00 PM.

## Next 3 actions

1. Send this to Olivia and Jacky. Each of them edits their own lines.
2. Olivia builds G1 to G4 and the `?demo=1` overlay in `site/`.
3. Therese writes the cached roasts for beat 1 and times a full run-through.

## Starter riffs (placeholders)

- "Is that Comic Sans or a cry for help?"
- "This hero image loaded slower than my dial-up in 1998."
- "Four fonts. Four. Pick a lane."
- "The contact form just leads to another contact form."
- Beat 2 turn: "...wait. Nobody say anything. This one's actually good."
