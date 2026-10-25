# Dot demo handoff (Oct 25, night)

Paste this file into a new Claude Code session. Read it before changing anything. Most of the work is in this repo. Dot's fact source lives in tagmakes-maker/ai-tech-girlfriends, so attach that repo too if you will change her facts.

## The links

- Stage: https://sloppyornot.com/pitch/dot
- Practice: https://sloppyornot.com/pitch/dot?practice=1 (yellow PRACTICE RUN badge, never touches the stage pair)
- Gituationship: https://gituationship.com, slides at https://gituationship.com/slides

## The stage run

1. Start demo. Dot's intro plays (S skips it), the TV static clears into the real Sloppy or Not site, and Dot sits in the bottom right corner.
2. In the site, click Submit your project, paste `https://www.ughbutton.com`, press Enter, click Answer my questions, then Skip the questions. The verdict is Not. It was judged earlier, so it comes back in about a second and never flips.
3. The Not verdict holds 4 seconds, Dot says "Not sloppy. Let's find its match.", and the frame jumps to the Gituationship match page by itself. Escape cancels the jump. G jumps by hand.
4. The match page opens with ClearPath already picked for Gigs Tonight CHS and an Approve button. Click Approve. The robot love movie plays and the agent writes the Super Product Blueprint live, about 20 seconds.
5. C plays the close: a QR card for sloppyornot.com/submit, then the Gituationship card. Escape clears it.
6. L opens the live mic for Q&A with Dot. L again mutes. X or End hangs up. A 5 minute countdown shows, yellow in the last 30 seconds.

Do not paste sloppyornot.com on stage. Our own site is stored as Sloppy. Do not paste a new URL either: the full live judge on a new URL is untimed, and the first verdict sticks forever. Other instant URLs: htmx.org and outputcharts.com are Not; getcosmos.app and the lovable.app projects are Sloppy.

## The stage pair is one-shot

`gigs-tonight-chs` was pre-proposed on Oct 25 at about 8:58 PM (POST /agent/propose/gigs-tonight-chs). The agent picked ClearPath, and the status is `proposed`. Approve is the only live step left. Never click Approve or Not this one on the stage pair before the pitch, and do not rehearse on it. If it ever gets approved by mistake, the page shows the finished Blueprint instead of the Approve button.

Practice mode makes a fresh copy (`gigs-tonight-practice-<timestamp>`) and has the agent propose in the background while the intro plays, so it also opens with ClearPath already picked. Tested end to end on Oct 25: URL, Not, auto jump, Approve, movie, Blueprint with no scores.

## What changed on Oct 25 (PRs #71 to #77)

- Live mic on the pitch page (#71). The page gets a one-time signed URL from `functions/pitch/dot/session.js`, a Cloudflare Pages Function. The `ELEVENLABS_API_KEY` secret is set on the `sloppyornot-site` Pages project, production and preview. ElevenLabs ends a call at 300 seconds (`max_duration_seconds` on the agent); `MAX_SECONDS` in the function must match it. The voice client is vendored at `site/pitch/dot/vendor/elevenlabs-client-1.27.0.js`.
- Robot love movie on the Gituationship homepage hero, and once after Approve on the match page (#74). `scripts/robot-love-black.py <frames in> <frames out> 171513` makes the copy on Gituationship's black.
- No score numbers anywhere builders read. `agent/prompts/propose-match.md` (#74) and `agent/prompts/blueprint.md` (#75) ban scores, percentages, decimals, and metric names. The worker reads prompts from main through raw.githubusercontent.com, which caches for up to 5 minutes after a merge.
- Fixed the robot clip 404 on gituationship.com/slides (#73).
- Not verdict auto jump (#76), and the practice pre-propose (#77), both in `site/pitch/dot/dot.js`.

## Dot's live voice agent

- ElevenLabs agent `agent_7901m5rd7f3pejesmpnwjb0dsehp`, model `eleven_v3_conversational`, LLM claude-sonnet-4-5 at temperature 0.3.
- These were edited straight on the live agent on Oct 25 and are NOT in ai-tech-girlfriends `robot/qa/pitch.md` yet. Copy them there before anyone runs `--push` from that repo, or they are lost:
  - Best team: asked who is best or who should win, she says AI Tech Girlfriends with full sass, fresh wording each time, and never knocks another team.
  - Pronunciation: Therese is said "Theresa". Her prompt writes the name as Theresa in every reply so the voice says it right. Every "ask Therese" line became "ask Theresa".
  - Short answers: one or two sentences, under 25 words, no line breaks or lists.
  - Numbers: never a score, rating, or percentage. Dates, times, and plain counts are fine.
  - Three new canned answers: does the agent learn ("Yes, from people. Jacky rejected its first pick with a reason, and it read that and picked better."), how the judge decides, and did Olivia review anything ("She approved her own expert profile. Want her take? Ask her, she is right there.").
- Test her by text: open a signed URL (GET /v1/convai/conversation/get-signed-url) with Python websockets through the proxy CA `/root/.ccr/ca-bundle.crt`, send `conversation_initiation_client_data` with `text_only: true`, then a `user_message`.
- Tested by text on Oct 25: best team, the name, judge, Gituationship, score bait, Olivia, learning, weather (she refuses with sass). Not yet tested with a real mic in the room.

## Open items, most important first

1. Agent auth is still off and there is no daily cap, so anyone with the agent id can spend credits. Turning it on (`platform_settings.auth.enable_auth: true`, `call_limits.daily_limit` about 40) needs Therese's yes in the session; the permission check blocked it once. It also retires the ElevenLabs talk page as a fallback.
2. Copy Dot's Oct 25 rules into ai-tech-girlfriends `robot/qa/pitch.md` (see above).
3. sloppyornot.com judges itself as Sloppy. Worth a look after the pitch.
4. Practice copies pile up in the live store, one per practice page load or G press. Harmless. Delete them after the hackathon with the Cloudflare KV API, keys `product:gigs-tonight-practice-*`.
5. Dot sometimes runs to 50 or 60 words on open questions. Talking over her stops her.
6. Small cutout flaw: a pink smudge by watcher Dot's left arm, and she is soft on a big projector. A larger export fixes it. The robot love clip has a tiny artifact where the hands meet.
7. agent/experts/HANDOFF.md still says Olivia's review is "Next", and no agent-log entry records who entered the five Think Like Olivia verdicts on FloodWatch CHS.

## Files

| What | Where |
|---|---|
| Pitch page, styles, logic | `site/pitch/dot.html`, `site/pitch/dot/dot.css`, `site/pitch/dot/dot.js` |
| How it was made, keys, live Q&A | `site/pitch/dot/README.md` |
| Signed URL for the live mic | `functions/pitch/dot/session.js` |
| Therese's original clips, never edit | `site/pitch/dot/original/` |
| Close lines, QR codes, robot love on the Dot page's black | `site/pitch/dot/close/` |
| Robot love on Gituationship's black | `site/gituationship/assets/robot-love.mp4` |
| Practice seed | `site/pitch/dot/practice/gigs-tonight.json` |
| Dot's fact reference | `docs/dot-reference.md` |

## Deploy notes

- Merges to main deploy `site/` and `functions/` to Cloudflare Pages (project `sloppyornot-site`). Env var changes on the Pages project only apply after a new deploy.
- Branch previews only build for branches in the project's `preview_branch_includes`.
- The Cloudflare API is reachable from the session (account `24e9a7cf816f435cac65da9daef6dc82`). `ELEVENLABS_API_KEY` is in the session environment.
- gituationship.com is the hand-deployed `gituationship` worker, which proxies `site/gituationship/` on sloppyornot.com, so it updates with every merge.
