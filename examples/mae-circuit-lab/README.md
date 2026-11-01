# MAE Academy · Circuit Lab · mesh-analysis film (1080×1920, 60 fps, 30 s)

A real screen recording of https://maeacademy.org/simulations/circuit-lab (0.0–3.0 s), then a redrawn 3-mesh DC circuit
solved by mesh analysis (matrix, Gaussian elimination, KCL and power checks), ending on a CTA card.
GSAP 3.12.5, root timeline at `window.__timelines["main"]`.

## Values used (new for this video)

R1 = 2 kΩ, R2 = 2 kΩ, R3 = 3 kΩ, R4 = 4 kΩ, R5 = 1 kΩ; V1 = 5 V, V2 = 16 V, V3 = 13 V.
Solution: **I1 = −3 mA, I2 = −2 mA, I3 = 1 mA** (exact, `reports/solution.json`). The brief's defaults (all 1 kΩ / 12 V →
−1.5, −3, 4.5 mA) are reproduced by `python3 scripts/solve.py` as a self-test but are not reused.

## Layout

```
src/template.html   markup + CSS with {{slots}}        src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN/@CUES-END)
build_index.py      fills the slots from scripts/solve.py (exact fractions) -> index.html
scripts/solve.py    mesh solver, elimination trace, KCL + power asserts
scripts/make_sfx.py CUES -> assets/sfx.wav (stereo 48 kHz, same length as the video)
scripts/record_site.cjs   Playwright recording of the live page
scripts/verify_snapshots.py   snapshots every 0.6 s + pixel checks (x 90-990, y 140-1670, no yellow)
scripts/export_web.sh   yuv420p, +faststart, even dimensions, tags stripped
assets/fonts/       KaTeX_Math-Italic, KaTeX_Main-Bold/Regular (MIT, see KaTeX-LICENSE.txt)
assets/circuit-lab-hook.mp4 (git-ignored)   assets/sfx.wav (git-ignored)   assets/gsap.min.js (local copy, sandbox verification only)
reports/            check-report.txt, solution.json, site-strings.md, site-capture-log.json, snapshot-verification.json
snapshots/critical/ frames at 3.0, 7.0, 11.0, 16.0, 22.0, 25.0 and the last frame
```

`src/` holds the templates because `hyperframes lint` rejects a second root-level HTML file with a composition id.

## Rebuild

```bash
python3 build_index.py            # ships the cdnjs GSAP tag (use --local only to test offline)
python3 scripts/make_sfx.py
npx hyperframes lint && npx hyperframes check
python3 scripts/verify_snapshots.py
npx hyperframes render --fps 60 -o renders/mae-circuit-lab-raw.mp4
scripts/export_web.sh renders/mae-circuit-lab-raw.mp4 renders/mae-circuit-lab-web.mp4
```

New numbers: edit `CONFIG` in `build_index.py` (R, V, DURATION, T_HOOK, HOOK_QUOTE) and rebuild. The recorded clip,
`record_site.cjs` and the cue times in `src/timeline.js` are tied to the 3.0 s hook; other durations need those retimed.

## Check status

`npx hyperframes check`: 0 errors. Documented warnings (see `reports/check-report.txt`):

- `composition_file_too_large` (415 lines): the brief asks for one single-file index.html.
- `line_unread` ×7: the §6 timetable gives each KVL line / elimination step 1-2.4 s; the tool wants 1.5-3.8 s.
  The same text stays visible in the matrix card and strip; kept to hold the specified schedule.
- `text_below_floor`: unit suffixes, node tags and branch chips (13-24 px) are annotations; the equations, matrix and CTA are ≥ 24-40 px.
- The CTA subline is 24 px by specification.
