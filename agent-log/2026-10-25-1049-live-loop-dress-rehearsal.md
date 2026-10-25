# 2026-10-25 10:49: The full core loop ran on the live site, a dress rehearsal for the pitch

- type: observation, match_proposed, outcome
- actor: the agent, with Therese's Claude Code session driving a real browser and approving as the human
- site: https://sloppyornot.com (Pages, main at 6ff7d6d with Jacky's judge routes from #53)
- api: https://api.sloppyornot.com

## Submit, judge, and answers (10:43 to 10:44)

The session opened sloppyornot.com/submit in Chromium and submitted our own Think Like Olivia worker, https://sloppyornot-experts.tagmakes.workers.dev, as "therese" with "Manually answer questions". We judged our own site on purpose, so no outside project was graded. POST /judge answered in 21 seconds with eight human questions. The session answered all eight, and POST /judge/:id/answers returned in about 15 seconds.

The verdict was **Sloppy**. The agent judged our own expert worker as sloppy, and we are keeping that result, not hiding it.

The email step called POST /judge/:id/email, which returned 404 because the route is not built yet. The page said so honestly: "Preview only. Email signup is not connected yet, so nothing was saved."

## Swipe (10:44)

The judge page showed live cards, with no preview label. A "not" vote on Sloppy or Not was saved through POST /projects/sloppyornot-com/vote, and the next live card was the project we had just submitted.

## The agent (10:45 to 10:47)

The session ran observe (8 seconds), find-gap (4 seconds), and propose (14 seconds) for FloodWatch CHS.

The agent proposed **ShiftSwap CHS**, not FirstRun. Its memory reference quoted Jacky's rejection from 2026-10-25T00:16:43Z word for word: "FirstRun scores 47 on accessibility and FloodWatch drivers need tooltips that work with screen readers." The store had not been reset since last night's test, so the agent carried that rejection across about 14 hours and still acted on it.

It also had two new candidates that did not exist last night: the two projects submitted through POST /judge today. It marked both ineligible for onboarding, along with FirstRun, HelpDock, and Porchlight.

## Approval and Blueprint (10:48)

The session opened sloppyornot.com/pitch/gituationship and ran G1 and G2. G3 loaded the live proposal (ShiftSwap CHS, labeled "Live from api.sloppyornot.com") and approved it as the human. POST /matches/floodwatch-chs/approve returned the Blueprint in about 26 seconds.

The Blueprint: FloodWatch CHS gains a text-to-start onboarding path modeled on ShiftSwap's SMS setup flow. A new driver texts a code, gets a plain-language legend for the pin colors in the phone's own messaging app, picks a commute area, and opts into tide-based route alerts. The first build is one Twilio number with an inbound webhook, a four-line legend, an area question, and a YES opt-in. The agent added that whether this helps first-look understanding should be measured with a fresh human review round, because the current swipes all predate the change.

## What changed because of this run

- The G3 slide now waits 60 seconds before falling back, because the live Blueprint took about 26.
- scripts/reset-demo.sh now loads judge deck cards for the seed products. Before this run, the live deck held only today's two submissions.
- The judge page in ?demo=1 mode orders the live cards for the pitch.
- The reset before the pitch is mandatory. Without it, there is no FirstRun proposal to reject on stage.

## Not built yet (Jacky's lane)

POST /judge/:id/email and GET /ridicule return 404.
