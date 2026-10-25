# Morning handoff, Oct 25

## The real HarborHack rules (from https://harborhack-2026.devpost.com, checked Oct 25)

- **No video is required.** Every team presents live. The live demo must show the problem, the solution, the role of your synthetic teammate, and lessons learned.
- **Devpost needs:** a project name, a 2 to 5 paragraph description (the problem, the solution, which challenge, what makes it unique), a public GitHub repo, and a Non-Human Collaboration Story (which AI systems, how responsibilities evolved, where the AI influenced the design, what surprised you, what didn't work, what you'd change).
- **Scoring is three equal thirds:** value (commercial or social), achievement (how much got built, and "a web app is better" than a slide deck), and non-human collaboration (was a non-human a serious contributor; creative approaches get bonus points).

What that means for us: a third of the score is how we worked with Claude, so the pitch has to show it, not just the product's agent. The video below is optional, a backup for the live demo and the Devpost page.

Two prompts. Paste the first one into a fresh Claude Code session on this repo. Start the second, for the demo video, after the site is on sloppyornot.com.

## Prompt 1: rock out Sunday

```
It's Sunday Oct 25, HarborHack demo day. Devpost is due at 4:00 PM and the live pitch is at 5:00 PM (5 min plus 3 min Q&A). I'm Therese. My lanes are agent/, docs/, seed/, and experts-worker/. Read CLAUDE.md, README.md, CONTRIBUTING.md, docs/morning-handoff.md, docs/pitch-demo-plan.md, and docs/community-impact.md first.

State as of 1 AM:
- The site is live at https://sloppyornot-site.pages.dev (site/, PR #48). I'm moving sloppyornot.com from the API worker to the Pages project myself in the dashboard. Check that https://sloppyornot.com serves the site and https://api.sloppyornot.com/health still answers.
- PR #49 (community impact plus the pitch close) may still be open. Merge it if it's clean.
- Jacky's judge routes (#40) may not be built. The site falls back to labeled preview data until they are. Check whether POST /judge and GET /projects/next are live.
- Pitch slides: site/pitch/gituationship.html. Roast overlay: site/pitch/roast-overlay.js.
- Issue #50: test the judge on real Show HN sites, privately. Do this only if time allows.

Do these in order. Tell me after each one, in two lines max:
1. Check that everything is live (domain, API health, Pages deploy, open PRs). Fix what's broken in my lanes. Tell me what's broken in Jacky's or Olivia's lanes.
2. Draft the Devpost submission in docs/devpost.md to match the rules at the top of docs/morning-handoff.md: name, a 2 to 5 paragraph description, the repo link, and the Non-Human Collaboration Story (cite agent-log/ entries and this repo's history of Claude sessions). Add community impact (both folds, no made-up numbers). Score it against the three judging thirds and tell me the weakest third. No em dashes. Complete sentences.
3. Tighten the run of show in docs/pitch-demo-plan.md so it fits in 5:00, with each person's lines. The rules require the live demo to cover the role of our synthetic teammate and lessons learned, so add a 30 to 45 second beat on how we worked with Claude. Write 6 likely judge questions with 2-sentence answers.
4. Write the cached roasts for the beat 1 sloppy sites, and the full riff script for beats 1 to 3.
5. If Jacky's routes are live, run the full core loop on the live site and log it in agent-log/. If not, write the exact text I should send Jacky.

Rules: give a recommendation, not options. Fact-check me. Push to your branch and open PRs. Ask before anything that changes DNS, deletes anything, or touches main directly.
```

## Prompt 2: the demo video

```
Make the HarborHack demo video for Sloppy or Not and Gituationship. Read docs/pitch-demo-plan.md and docs/community-impact.md first.

No video is required (see the rules at the top of docs/morning-handoff.md). This is a 2-minute backup for the live demo and the Devpost page. Keep it under 2:00.

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
