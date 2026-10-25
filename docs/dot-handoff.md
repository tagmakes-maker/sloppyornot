# Dot demo handoff (Oct 25, evening)

Paste this file into a new Claude Code session that has both repos attached: tagmakes-maker/sloppyornot and tagmakes-maker/ai-tech-girlfriends. Read it before changing anything.

## What is built and working

The pitch runs from one page: `sloppyornot.com/pitch/dot` (Therese's lane, site/pitch/).

1. Start demo plays Dot's 22.5 second intro: she walks in, talks to camera (lip synced), turns, sits, and the camera pushes into a TV full of static.
2. The static dissolves into the real Sloppy or Not site in a same-origin frame. Watcher Dot rises into the bottom right corner and stays there on every page.
3. G opens the Gituationship match page for the demo couple inside the same frame.
4. C plays the close: a QR card for sloppyornot.com/submit, then the Gituationship card with the robot love clip and a QR for gituationship.com. Dot voices both lines and her glow follows her voice. Escape clears it.

Keys: S skips the intro, G opens the match, C plays the close, Escape leaves the close. Keys work even after someone clicks into the site.

Practice: `sloppyornot.com/pitch/dot?practice=1`. G makes a fresh copy of Gigs Tonight CHS each time (id `gigs-tonight-practice-<timestamp>`), so rehearsals never touch the stage pair. A yellow PRACTICE RUN badge shows. Tested end to end on Oct 25: copy, Find my match picked ClearPath in 28 seconds, Approve wrote the Blueprint.

Stage: same URL without `?practice=1`. G opens `gigs-tonight-chs`, which is one-shot. Do not rehearse on it.

Do not reset the live demo data. Therese decided the first entries stay. Dot tells the real history (agent picked FirstRun, Jacky rejected it for accessibility, agent picked ShiftSwap CHS).

## Files

| What | Where |
|---|---|
| Page, styles, logic | `site/pitch/dot.html`, `site/pitch/dot/dot.css`, `site/pitch/dot/dot.js` |
| How it was made | `site/pitch/dot/README.md` |
| Therese's original clips, never edit | `site/pitch/dot/original/` |
| Intro video and voice | `site/pitch/dot/intro.mp4`, `dot-line1.mp3` (take C, eleven_v3, sassy tags) |
| Watcher Dot | `site/pitch/dot/silhouette/dot-watcher.png` and `.webp`, made by `scripts/dot-watcher-cut.py` |
| Close lines, QR codes, robot love clip | `site/pitch/dot/close/` |
| Robot love on black | `scripts/robot-love-black.py` |
| Practice seed | `site/pitch/dot/practice/gigs-tonight.json` |
| Dot's fact reference | `docs/dot-reference.md` |

## Dot's live voice agent

- ElevenLabs agent `agent_7901m5rd7f3pejesmpnwjb0dsehp`, model `eleven_v3_conversational`, expressive mode on, eight suggested tone tags. First audio about 1.0 to 1.5 seconds.
- Her facts: ai-tech-girlfriends, branch `claude/great-heisenberg-akmrgo`, `robot/qa/pitch.md`, kept in sync with `docs/dot-reference.md` here. Edit both.
- Push changes: from `robot/`, make sure `qa/agent.json` exists with `{"agent_id":"agent_7901m5rd7f3pejesmpnwjb0dsehp"}` (gitignored, so create it in each new container, or --push makes a duplicate agent). Then `NODE_USE_ENV_PROXY=1 node src/qa-agent.mjs --push`.
- Test her by text: a Python websockets script that opens a signed URL and sends `user_message` events. It needs the proxy CA at `/root/.ccr/ca-bundle.crt`. Node's built-in WebSocket does not go through the proxy.
- Tested Oct 25: judge is live, Gituationship, score bait (she refuses numbers), Olivia (she says "ask Olivia"), FirstRun history, the demo couple (she says they are demo projects).

## Open items, most important first

1. The Gituationship match page shows numbers ("understood immediately (0.88)", "scores 38 on accessibility") in "Why Dot picked it". That breaks the no-numbers rule on stage. The text comes from `agent/prompts/propose-match.md` (Therese's lane). Not fixed yet. Therese was asked.
2. The live mic is not on the pitch page. No mic, stop, end, or timer controls, and no server-enforced time limit. Today the Q&A runs through the ElevenLabs talk page for the agent. The agent has auth off and a 300 second max per conversation, so anyone with the id can spend credits.
3. Practice copies pile up in the live store, one per G press in practice mode. Harmless (they only offer event listings, and the swipe deck only shows judged projects). Delete them after the hackathon with the Cloudflare KV API, keys `product:gigs-tonight-practice-*`.
4. Small cutout flaw: a pink smudge by watcher Dot's left arm. The source clip is 330 by 432, so she is soft on a big projector. A larger export fixes it.
5. The robot love clip has a tiny artifact where the hands meet.
6. agent/experts/HANDOFF.md still says Olivia's review is "Next", and no agent-log entry records who entered the five Think Like Olivia verdicts on FloodWatch CHS.

## Deploy notes

- Merges to main deploy `site/` to Cloudflare Pages (project `sloppyornot-site`).
- Branch previews only build for branches listed in the project's `preview_branch_includes`. `claude/fervent-carson-0rpho9` was added Oct 25.
- The Cloudflare API is reachable from the session (account `24e9a7cf816f435cac65da9daef6dc82`).
