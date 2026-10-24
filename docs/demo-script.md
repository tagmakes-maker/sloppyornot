# Demo script (draft, Therese owns)

Five minutes, then three minutes of judge Q&A. Sunday 6:00 PM. This is a draft for the team to react to. Swap any beat; the timings tell you what it costs.

**Drivers:** Therese talks. Olivia drives the screen. Jacky stands by the agent log and the curl fallback.

**The one thing we prove:** a persistent agent can understand products, learn from human evaluation, find complementary capabilities, and help humans build something better together.

## Before we go on stage

- Reset KV to the seed pool. Clear `rejections` and `agentlog` so the live run is clean.
- Open three tabs: the swipe card, the match screen, and the agent log.
- Put the QR code on the projector slide and on paper at the judges' table.
- Have the curl fallback in a terminal, already typed (see the bottom of this file).

## The run (5:00)

### 0:00 to 0:30. The hook

> "Every hackathon ends the same way. Forty teams build forty half-finished things, and nobody finds out which half was good. We built the thing that tells you, and then finds you the team that has your missing half."

Show the projector slide: SloppyOrNot + Gituationship, one agent, humans decide.

### 0:30 to 1:20. SloppyOrNot: the room grades the room

> "Scan the code. You have twenty seconds."

Judges and the room swipe a product on their phones. Five questions: would you use it, did you get it right away, does it feel distinctive, is it easy, does it look like AI slop.

Cut to FloodWatch CHS, a Charleston street flooding map. Nine swipes, verified.

> "People love it. 82 percent would use it. But only 30 percent understood it on first look. Three reviewers asked what the colored pins mean."

Point out that human review and automated checks are separate numbers, and they are never blended.

### 1:20 to 2:00. The agent understands and finds the gap

Open the agent log. Read one line out loud, the 13:42 observation:

> "The core works. New users do not know where to start."

> "The agent wrote that this afternoon from the swipe data. It turned that into one gap: onboarding."

### 2:00 to 2:40. Gituationship: the agent proposes a match

Match screen shows FirstRun, a drop-in onboarding engine, with its confidence and its reason.

> "Notice what it did not pick. HelpDock sounds like the right answer. It is a help widget, it installs the same way, it shares two tags. But it answers questions after users get stuck. It does not onboard them. The agent skipped it."

### 2:40 to 3:30. A human says no, and the agent learns

Therese taps **Reject** and types the reason live:

> "FloodWatch users are drivers checking the map at a red light. A desktop tooltip tour will not help them. We need onboarding that works by text before they open the app."

The agent runs again. New proposal: ShiftSwap CHS, which has an SMS signup flow that sets people up in under a minute. Its reasoning cites the rejection.

> "That is the whole point. I did not edit a prompt. I told it why, once, and its next answer changed. That rejection is stored. It will never propose that pair again."

### 3:30 to 4:20. A human approves, and the agent writes the plan

Therese taps **Approve**. The Super Product Blueprint appears.

Read three fields out loud: the combined concept, who builds what, and the first build.

> "Not 'you two should talk.' A plan someone could start on Monday."

### 4:20 to 5:00. Why it matters, and the close

> "Today this ran on our seed products. Tonight it runs on every team in this room. Every builder walks out with proof real humans used their thing, honest feedback, and maybe their next collaborator."

> "SloppyOrNot grades the product, never the person. The agent proposes. Humans decide."

Stop talking. Leave the Blueprint on screen.

## Judge Q&A (3:00): likely questions and our answers

**"Is the agent actually persistent, or is it just one prompt?"**
It reads its own past observations and every human rejection from storage on each run. The rejection beat you just watched is that memory working. The agent log is the receipt.

**"What stops it from forcing a bad match?"**
Two tests. The decoy (HelpDock) looks right and it must not be picked. Porchlight fails security, nothing in the pool fixes that, and the agent must say "no match" instead of inventing one.

**"Five swipes is not statistically meaningful."**
Correct. Five proves the loop in a demo room. The verified line is a setting, and fifty is the real target.

**"Are these real products?"**
The demo pool is seed data and it is labeled "Demo product" on screen. The live room swipes are real.

**"What did the AI build versus what did you build?"**
Humans set direction, wrote the scoring rules, and made every approve or reject call. The agent observed, found gaps, proposed, and wrote Blueprints. The agent log and the Devpost AI collaboration story show who did what.

**"Is this a hiring filter?"**
No. It grades the product, never the person. The shareable page is feedback the builder owns.

## If something breaks

- **Site down:** Jacky runs the same loop with curl against https://api.sloppyornot.com and we narrate the JSON. Same story, uglier screen.
- **Agent call is slow or fails:** Show the last good run in the agent log and the Blueprint already saved on FloodWatch CHS. Say "here is the run from an hour ago" honestly.
- **Room QR flops (bad wifi, no swipes):** Skip 0:30 to 1:20 live swipes and start from FloodWatch CHS's existing nine swipes. Gain 40 seconds.

## Open questions for the team

1. Reject then approve (shows learning, as written) or approve FirstRun straight through (simpler, about 40 seconds shorter)?
2. Do we demo live room swipes, or only mention them to protect the clock?
3. Who reads the close: Therese, or all three of us splitting the last line?
