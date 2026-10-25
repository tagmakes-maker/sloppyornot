# Riff script: beats 1 to 3

Pitch only. The product tone stays clean. Roasts use our seed products only, never a real site. Every roast below comes from a real number in seed/*.json, so if a judge asks "is that true?", the answer is yes.

## Before you go on stage

- The seed product URLs (helpdock.pages.dev and the rest) are not real sites. Never click a product title on stage.
- Clear the judge page's memory so the deck starts at the first card: open the browser console on sloppyornot.com and run `localStorage.removeItem("sloppy-seen")`, or use a fresh private window.
- The roasts are voiced live. The "Roast me" overlay is a bonus. If it is not on the page, say the lines anyway. That is the whole MST3K bit.

## Needs from Olivia (site/, her lane)

The script needs the deck in this order: HelpDock, Porchlight, FloodWatch CHS, then the rest. Today the preview deck in site/app.js is FirstRun, FloodWatch CHS, ShiftSwap CHS, Porchlight, and HelpDock is missing. Without the change, FirstRun shows up first and gets roasted before it becomes the hero match.

1. In site/app.js, add a HelpDock card to `SAMPLE_PROJECTS` and reorder it as above.
2. In site/judge.html, inside `render(p)`, add `document.body.dataset.productId = p.id;`.
3. In site/pitch/roast-overlay.js, read the product id on each click instead of once at load, so the roast always matches the card on screen.
4. Add `<script src="/pitch/roast-overlay.js" defer></script>` to site/judge.html. It does nothing without `?demo=1`, so the real product is unaffected.
5. In roast-overlay.js, drop the "a chat bubble" line from the HelpDock set (see "Lines we cut" below), and swap the lines that say a score out loud for the number-free versions in this doc.

If none of that lands, use two tabs on the current deck and skip HelpDock:

1. Tab B (the turn): in the console run `localStorage.setItem("sloppy-seen", '["firstrun"]')`, then reload. FloodWatch CHS shows. Leave this tab alone.
2. Tab A (the roasts): in a new tab on the same site, run `localStorage.setItem("sloppy-seen", '["firstrun","floodwatch-chs","shiftswap-chs"]')`, then reload. Porchlight shows.
3. On stage, roast Porchlight in Tab A, then switch to Tab B for the turn.

## The cached roasts (beat 1)

Two lines per product. Each joke points at something the checks really found, so the audience learns what the checks do. No scores out loud: users only ever see Sloppy or Not, and the numbers stay in the backend.

### HelpDock (lead roast, the real slop)

Seed facts: performance 44, no security headers, 2 console errors, only 33 percent of reviewers found it distinctive, 41 percent said it looks like slop.

1. **Jacky:** "This page loads slower than my microwave, and my microwave is from 2004."
2. **Olivia:** "It throws errors on load. The help widget needs a help widget."
3. **Therese:** "No security headers. The front door is open and the FAQ bot is the doorman."
4. **Olivia (backup):** "Two out of three reviewers could not tell it apart from every other chat bubble on the internet."

### Porchlight (second roast)

Seed facts: 4 console errors, no security headers. Reviewers love it (81 percent would use it), so roast the code, not the idea.

1. **Jacky:** "Open the browser console. That is not a website, that is a cry for help."
2. **Therese:** "People love it. The browser console does not."
3. **Olivia (backup):** "No security headers. Volunteers, please also volunteer to guard the database."

### ShiftSwap CHS (out of the timed run, use only if the room is slow)

Seed facts: fails the mobile check. Do not roast it in the timed run: it is the match Olivia approves live in G3.

1. **Olivia:** "A shift swap app that fails on mobile. Where do you think servers check their shifts? A desk?"
2. **Jacky:** "Pinch, zoom, scroll sideways, cry. The full mobile experience."

### Lines we cut, and why

- "The other two thirds called it 'a chat bubble.'" No reviewer said that. It reads like a quote, so it is out. Backup line 4 above says the same thing honestly.
- "This hero image loaded slower than my dial-up in 1998." ShiftSwap's performance is 68, which is middling, not slow. Not grounded.
- "Is that Comic Sans or a cry for help?" and "Four fonts. Four." None of our seed products have that problem. Use them only as ad libs, never as a product's roast.

## Full riff script, beats 1 to 3 (0:25 to 2:40 in the run of show)

Stage directions are in brackets. Therese drives the laptop unless noted.

### Beat 1: the roasts (0:25 to 0:55)

[Therese opens the judge page. A card comes up.]

**Therese:** "First contestant. HelpDock. A support chat bot."

**Jacky:** "This page loads slower than my microwave, and my microwave is from 2004."

**Olivia:** "It throws errors on load. The help widget needs a help widget."

**Therese:** "No security headers. The front door is open and the FAQ bot is the doorman."

[Therese swipes left. SLOP.]

**Therese:** "Next. Porchlight. Volunteer matching for nonprofits."

**Olivia:** "Oh, I like this one."

**Jacky:** "Open the browser console. That is not a website, that is a cry for help."

**Therese:** "People love it. The browser console does not."

[Swipe left. FloodWatch CHS comes up. If the deck shows ShiftSwap first, swipe it left without a word.]

### Beat 2: the turn (0:55 to 1:05)

[Long pause. Nobody talks for one full second.]

**Jacky:** [opens her mouth to roast]

**Olivia:** "...wait. Nobody say anything. This one's actually good."

**Therese:** "FloodWatch CHS. A live street flooding map for Charleston drivers."

**Jacky:** "Does it load?"

**Therese:** "It loads. It is fast. It works on a phone."

[Swipe right. NOT. The hecklers stop heckling for the rest of the pitch.]

Then Olivia's human review block and Jacky's checks and memory block run straight, as written in docs/pitch-demo-plan.md.

### Beat 3: "You've been noticed." (2:30 to 2:40)

[Therese switches to sloppyornot.com/pitch/gituationship.html.]

**Therese:** "FloodWatch, you've been noticed."

**Olivia:** [stage whisper] "Oh no. It's a Gituationship."

**Jacky:** "Somebody check if it has a GitHub."

**Therese:** "It doesn't need one. Paste the link."

[Into G1. From here on the hecklers are cheerleaders.]

## Timing check

Beat 1 is 9 short lines, about 75 words, in 30 seconds. Read it out loud once with a timer. If it runs over, drop Porchlight and go straight from HelpDock to FloodWatch.
