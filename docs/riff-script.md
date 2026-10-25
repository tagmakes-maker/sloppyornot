# Riff script: beats 1 to 3

Pitch only. The product tone stays clean. Roasts use our seed products only, never a real site. Every roast below comes from a real number in seed/*.json, so if a judge asks "is that true?", the answer is yes.

## Before you go on stage

- The seed product URLs (helpdock.pages.dev and the rest) are not real sites. Never click a product title on stage.
- Clear the judge page's memory so the deck starts at the first card: open the browser console on sloppyornot.com and run `localStorage.removeItem("sloppy-seen")`, or use a fresh private window.
- The roasts are voiced live. The "Roast me" overlay is a bonus. If it is not on the page, say the lines anyway. That is the whole MST3K bit.

## The judge deck (built Oct 25)

- The preview deck in site/app.js now runs HelpDock, Porchlight, FloodWatch CHS, ShiftSwap CHS, FirstRun, so the two roasts come first and the turn lands on the third card.
- site/judge.html loads the "Roast me" overlay. It only appears with `?demo=1`, so the real product is unaffected. Stage URL: https://sloppyornot.com/judge?demo=1
- The overlay reads the card on screen at every click, so the roast always matches the product. The lines are the number-free versions below.
- The judge routes are live. With `?demo=1` the judge page pulls the live cards and puts HelpDock, Porchlight, and FloodWatch CHS first. Votes still go to the live API. The seed cards exist only after `scripts/reset-demo.sh` runs, so run it before the pitch.

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

## Full riff script, beats 1 to 3 (0:25 to 2:25 in the run of show)

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

### Beat 3: "You've been noticed." (2:15 to 2:25)

[Therese switches to sloppyornot.com/pitch/gituationship.html.]

**Therese:** "FloodWatch, you've been noticed."

**Olivia:** [stage whisper] "Oh no. It's a Gituationship."

**Jacky:** "Somebody check if it has a GitHub."

**Therese:** "It doesn't need one. Paste the link."

[Into G1. From here on the hecklers are cheerleaders.]

## Timing check

Beat 1 is 9 short lines, about 75 words, in 30 seconds. Read it out loud once with a timer. If it runs over, drop Porchlight and go straight from HelpDock to FloodWatch.
