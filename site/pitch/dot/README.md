# Dot's intro (pitch demo only)

Open `/pitch/dot` on the big screen. Press Start demo (browsers block sound until a person clicks). The intro plays, the TV static clears into the real site, and Dot sits in the bottom right corner watching. The site runs in a same-origin frame, so every page stays clickable and Dot stays put while you navigate.

- `?skip=1` skips the intro and goes straight to the live site with Dot in the corner.
- `?page=/judge` opens a different page in the frame.
- Press S during the intro to skip.
- If the video cannot play, the page goes straight to the live site. It never shows a blank screen.

## Files

| File | What it is |
|---|---|
| `original/` | Therese's three clips, untouched. Never edit these. |
| `intro.mp4` | The finished 25 second intro. Scenes 1 and 2 are lip synced. |
| `dot-line1.mp3`, `dot-line1.align.json` | Dot's approved first line (SCRIPT.md, 0:00), voiced once with ElevenLabs and cached here, with per-character timing. |
| `silhouette/` | Dot seated, from behind, transparent background. `dot-seated` is the full figure. `-head`, `-body` and `-glow` are layers for the speaking state. PNG and WebP. |
| `dot.css`, `dot.js` | The overlay and the transition. `window.DotOverlay.setState("listening" / "speaking" / "muted" / "idle")` and `setLevel(0 to 1)` drive her states. |

## How intro.mp4 was made

1. Scene 1 scaled and cropped from 1284 by 716 to 1280 by 720. Scenes 2 and 3 untouched. All 24 fps.
2. Dot's line, ElevenLabs voice FGY2WhTYpPnrIDTdsKH5, model eleven_multilingual_v2, settings from robot/character/dot.json. 19.5 seconds, starting 0.8 seconds in. "The fourth member of this team" lands as she turns to the TV. "Let's go" lands as she sits.
3. Scenes 1 and 2 lip synced with ElevenLabs sync-lipsync-v3 (flow "Dot HarborHack intro lip sync"). Scene 3 is her back, so it was not synced.
4. Six frames of static at the scene 2 to 3 cut, because the two clips are set in different rooms.
5. TV hiss fades in under the final push into the screen.

The page cuts to static drawn in code at 24.5 seconds, holds it, then dissolves into the site.

## Silhouette

Cut from scene 3 at 4.0 seconds with rembg (isnet-general-use), then restyled as charcoal chrome with a pink rim on the side facing the screen. Scripts: `scripts/dot-silhouette-cut.py` and `scripts/dot-silhouette-style.py`. The chair is one solid shape because the slats did not cut cleanly. It is not a separate layer.

## Not built yet

The live mic conversation, the controls (mic, stop, end, timer), and the time limit. The overlay states are ready for them.
