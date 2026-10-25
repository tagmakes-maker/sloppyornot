# Morning handoff, Oct 25

Two prompts. Paste the first one into a fresh Claude Code session on this repo. Start the second, for the demo video, after the site is on sloppyornot.com.

## Prompt 1: rock out Sunday

```
It's Sunday Oct 25, HarborHack demo day. Devpost is due at 4:00 PM and the live pitch is at 6:00 PM (5 min plus 3 min Q&A). I'm Therese. My lanes are agent/, docs/, seed/, and experts-worker/. Read CLAUDE.md, README.md, CONTRIBUTING.md, docs/morning-handoff.md, docs/pitch-demo-plan.md, and docs/community-impact.md first.

State as of 1 AM:
- The site is live at https://sloppyornot-site.pages.dev (site/, PR #48). I'm moving sloppyornot.com from the API worker to the Pages project myself in the dashboard. Check that https://sloppyornot.com serves the site and https://api.sloppyornot.com/health still answers.
- PR #49 (community impact plus the pitch close) may still be open. Merge it if it's clean.
- Jacky's judge routes (#40) may not be built. The site falls back to labeled preview data until they are. Check whether POST /judge and GET /projects/next are live.
- Pitch slides: site/pitch/gituationship.html. Roast overlay: site/pitch/roast-overlay.js.
- Issue #50: test the judge on real Show HN sites, privately. Do this only if time allows.

Do these in order. Tell me after each one, in two lines max:
1. Check that everything is live (domain, API health, Pages deploy, open PRs). Fix what's broken in my lanes. Tell me what's broken in Jacky's or Olivia's lanes.
2. Draft the Devpost submission in docs/devpost.md: what it does, how we built it, the AI collaboration story (cite agent-log/ entries), community impact (both folds, no made-up numbers), challenges, what's next. No em dashes. Complete sentences.
3. Tighten the run of show in docs/pitch-demo-plan.md so it fits in 5:00, with each person's lines. Write 6 likely judge questions with 2-sentence answers.
4. Write the cached roasts for the beat 1 sloppy sites, and the full riff script for beats 1 to 3.
5. If Jacky's routes are live, run the full core loop on the live site and log it in agent-log/. If not, write the exact text I should send Jacky.

Rules: give a recommendation, not options. Fact-check me. Push to your branch and open PRs. Ask before anything that changes DNS, deletes anything, or touches main directly.
```

## Prompt 2: the demo video

```
Make the HarborHack demo video for Sloppy or Not and Gituationship. Read docs/pitch-demo-plan.md and docs/community-impact.md first.

First, find the HarborHack video rules (max length, required content, where it gets uploaded). If you can't find them, ask me. Don't guess.

Rules for doing it correctly:
- Show only what really works. If Jacky's routes are not live, the video shows the "Preview data" label and says so out loud. The Gituationship slides are labeled as a pitch demo. Never present a mockup as a working feature.
- No roasting of real sites. Roasts only use our seed products.
- No em dashes in any on-screen text or captions.

Steps:
1. Write a shot list and script that fit the time limit: the problem, the swipe review, the agent and its memory (agent-log 2026-10-24 20:16 rejection test), the Gituationship slides, and the community impact close. Each of Therese, Olivia, and Jacky gets a voiced line. Show me the script before recording.
2. Record silent screen clips with Playwright's recordVideo (Chromium is preinstalled; don't run playwright install) at 1920x1080: the live site at sloppyornot.com, site/pitch/gituationship.html, and the roast overlay with ?demo=1.
3. Put the clips together with ffmpeg if it's installed. Add captions. Leave the voice tracks for us to record. I'll record our three voices on my phone unless I say to use ElevenLabs.
4. Save the final video and the script in my scratchpad and send me both files.
```

## Morning checklist (Therese)

1. Cloudflare: remove sloppyornot.com from the sloppyornot worker (Settings, Domains & Routes). Then add it to sloppyornot-site under Custom domains.
2. Merge PR #49.
3. Group text to Jacky and Olivia: the #40 share_with_match change, PR #48 (the site is live, Olivia can restyle or replace it), and the logo halves for the pitch slides.
4. Paste Prompt 1.
