# Dot's intro (pitch demo only)

Open `/pitch/dot` on the big screen. Press Start demo (browsers block sound until a person clicks). The intro plays, the TV static clears into the real site, and Dot sits in the bottom right corner watching. The site runs in a same-origin frame, so every page stays clickable and Dot stays put while you navigate.

- `?skip=1` skips the intro and goes straight to the live site with Dot in the corner.
- `?page=/judge` opens a different page in the frame.
- Press S during the intro to skip.
- Press C for the close: a QR card for sloppyornot.com/submit, then Gituationship with a QR card for gituationship.com. Dot says one line over each, from her corner, and her glow follows her voice. The cards stay up for scanning. Escape leaves the close. Keys work even after someone clicks into the site.
- If the video cannot play, the page goes straight to the live site. It never shows a blank screen.

## Files

| File | What it is |
|---|---|
| `original/` | Therese's clips, untouched. Never edit these. |
| `intro.mp4` | The finished 20.4 second intro. Scenes 1 and 2 are lip synced. |
| `dot-line1.mp3`, `dot-line1.align.json` | Dot's approved first line (SCRIPT.md, 0:00), voiced once with ElevenLabs and cached here, with per-character timing. |
| `silhouette/dot-watcher` | The watcher Dot from Therese's `original/dot-enter-watcher.mp4`, last frame, cut off its white background with the pink glow kept. Transparent PNG and WebP. The page splits it at the neck with CSS so the head can move. |
| `dot.css`, `dot.js` | The overlay and the transition. `window.DotOverlay.setState("listening" / "speaking" / "muted" / "idle")` and `setLevel(0 to 1)` drive her states. |

## How intro.mp4 was made

1. Scene 1 scaled and cropped from 1284 by 716 to 1280 by 720. Scenes 2 and 3 untouched. All 24 fps.
2. Dot's line, ElevenLabs voice FGY2WhTYpPnrIDTdsKH5, model eleven_multilingual_v2, settings from robot/character/dot.json. 19.5 seconds, starting 0.8 seconds in. "The fourth member of this team" lands as she turns to the TV. "Let's go" lands as she sits.
3. Scenes 1 and 2 lip synced with ElevenLabs sync-lipsync-v3 (flow "Dot HarborHack intro lip sync"). Scene 3 is her back, so it was not synced.
4. Scene 2 is cut at 9.9 seconds, just before its own TV appears, so the only TV on screen is scene 3's.
5. Six frames of static at the scene 2 to 3 cut, because the two clips are set in different rooms.
6. Scene 3's last frame is held half a second so "Let's go" finishes. TV hiss fades in under the push into the screen.

The page cuts to static drawn in code at 19.4 seconds, when the TV screen fills the frame. The video keeps playing underneath until "Let's go" ends, then the static dissolves into the site and Dot rises into the corner over 4 seconds, like her Dot_Enter clip.

## Watcher

`scripts/dot-watcher-cut.py` makes `silhouette/dot-watcher.png` from the clip's last frame: it upscales 2x, treats everything reachable from the frame edge through white or pink pixels as background, and keeps the pink glow as partial transparency.

## The close

`close/close-1-submit.mp3`: "Scan the code, go to sloppyornot.com, and add your project."
`close/close-2-gituationship.mp3`: "And then? Gituationship. A project matchmaker that uses the Sloppy or Not data to pair two products into one super product. Do you have a match? Check gituationship.com."

Both voiced with ElevenLabs eleven_v3 and tone tags, and checked with speech to text. The QR codes are SVGs in `close/`. The Gituationship wordmark and robots come from `site/gituationship/assets/`.

## Not built yet

The live mic conversation, the controls (mic, stop, end, timer), and the time limit. The overlay states are ready for them.
