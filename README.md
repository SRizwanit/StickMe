# Why You Can't Stop Checking Your Phone: stick-man video

Python + React + Remotion, rendered by a GitHub Action. Everything lives in the repo root (no subfolders), except `.github/workflows/render.yml`, which GitHub requires at that path.

## Files

| File | Role |
| --- | --- |
| `script.txt` | The narration. One line = one scene. **Edit this to change the video.** |
| `generate.py` | Python: assigns a visual to every line, makes the voice-over with edge-tts, writes `voice.mp3` + `data.json` (exact frame timings, caption chunks, tags). |
| `index.ts`, `Root.tsx`, `Video.tsx` | Remotion entry, composition (`StickMan`, 1920×1080, 30 fps), captions and on-screen tags. |
| `StickMan.tsx` | The animated stick figure (poses, faces, phone). |
| `Scenes.tsx` | The 12 scene types (phone, grass, rat, brain, monkey, slot, feed, forage, tribe, mismatch, advice, end). |
| `.github/workflows/render.yml` | Installs everything, runs `generate.py`, renders `out.mp4`, uploads it as an artifact. |

## Keeping every detail in sync

All 56 lines of the script are in the video: full text as karaoke captions, plus a tag for each key term, researcher and year (Olds & Milner 1954, Berridge, Schultz 1990s, Skinner, Charnov 1976, Pirolli & Card 1990s, Dunbar, Eisenberger 2003, ≈200,000 years ago). Edit `script.txt` and re-render; timings, captions and tags regenerate automatically. To map a new line to a different visual, add a rule to `RULES` in `generate.py` (a line with no match keeps the previous scene's visual).

## Run

```bash
pip install edge-tts      # plus ffmpeg on PATH
npm install
python3 generate.py       # or: python3 generate.py --silent  (no TTS, estimated timings)
npm run dev               # Remotion Studio
npx remotion render index.ts StickMan out.mp4
```

Voice: `TTS_VOICE` (default `en-US-AndrewNeural`) and `TTS_RATE` (default `-4%`) env vars.

## GitHub Action

Runs on every push to `main` that touches the script/code, or manually from the Actions tab (**Render video → Run workflow**). Download `out.mp4` from the run's artifacts.
