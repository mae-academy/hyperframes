# THE R-MATRIX TRICK · THE COMPLETE MASTERCLASS (1080×1920, 60 fps, 21.0 s)

Every value is physically extracted from the circuit: it lifts off its own component as a glowing ghost clone, arcs along a curved path
(separate x / y eases) and merges into its equation slot or matrix cell. Nothing is spawned in zone 3 or zone 4 out of thin air.
The circuit in zone 2 is fully lit and anchored from the first dissolve to the end, and the matrix card (y 1060 - 1360) is never moved or scaled.

| Time (s)    | Beat                                                                                                                                                      |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0 - 1.2   | hook: crossed-out KVL paper (zone 2) and the banner "15 MINUTES OF KVL ALGEBRA? ×" (zone 3)                                                               |
| 1.2 - 2.0   | the banner crossfades straight into "BUILD THE R-MATRIX BY SIGHT ⚡" (never empty), the paper dissolves, the circuit lights up                            |
| 2.0 - 4.2   | mesh 1: comet laps the contour; a "2" lifts off R1, a second "2" off R2, both fly into `2 + 2`; the sum "4" drops from the banner into R11 (3.9)          |
| 4.2 - 6.6   | mesh 2: "2" off R2, "3" off R3, "4" off R4 → `2 + 3 + 4`; "9" drops into R22 (6.3)                                                                        |
| 6.6 - 8.8   | mesh 3: "4" off R4, "1" off R5 → `4 + 1`; "5" drops into R33 (8.5)                                                                                        |
| 8.8 - 10.3  | shared R2 glows purple and splits into two "−2" ghosts that arc into R12 and R21 (9.9)                                                                    |
| 10.3 - 11.8 | shared R4 splits into two "−4" ghosts → R23 and R32 (11.4)                                                                                                |
| 11.8 - 12.8 | a "0" tag appears on the boundary between meshes 1 and 3 and splits into R13 and R31 (12.4)                                                               |
| 12.8 - 16.5 | sources: "+5" off V1 and "−13" off V3 meet in the banner (5 − 13), "−8" drops into row 1 (13.9); "−16" off V2 → row 2 (15.0); "+13" off V3 → row 3 (16.1) |
| 16.5 - 17.5 | system pulse: the whole circuit glows Electric Blue, an energy wave crosses the matrix, banner "R · I = V [SYSTEM FULLY SOLVED ⚡]"                       |
| 17.5 - 21.0 | the CTA slides up into y 1380 - 1620 (840×240); nothing moves from 19.4, so the solved matrix and the CTA hold to the end                                 |

Component coordinates are taken from the SVG itself (e.g. R1 at canvas (378, 431), R2 at (503, 536)); equation slots are measured live in the banner when a flight
starts, so each ghost lands exactly on its term. R = [[4, −2, 0], [−2, 9, −4], [0, −4, 5]] kΩ, V = [−8, −16, 13]ᵀ V, clockwise mesh currents; every sum and sign is asserted against `scripts/solve.py`.

## Typography

Formulas are rendered by KaTeX 0.16.11 at build time from the TeX of the brief (vendored in `scripts/vendor`, woff2 fonts in `assets/fonts`):
variables are math italic (`R_1`, `V_1`, `I_1`), indices and units are upright (`R_{\mathrm{11}}`, `2\,\mathrm{k}\Omega`), results are bold.
Titles, banner text and the CTA use KaTeX_Main Bold. ⚡, 🔖 and 👇 are SVG icons (KaTeX has no such glyphs). Palette: Electric Blue #0088FF diagonals,
Neon Purple #B026FF off-diagonals, Flame Red #FF0044 sources, white; no green, no yellow.

## Audio

`build_index.py` writes the CUES block of `src/timeline.js` from the same schedule the picture uses (50 cues), and `scripts/make_sfx.py`
(numpy + scipy.io.wavfile) turns it into a 21.0 s stereo WAV: a continuous 50 Hz hum at -22 dBFS with no gap, a **whoosh** (rising gliss + swept air) when a ghost lifts off a component,
a **click** when it lands in an equation slot, a **snap** when a value locks into the matrix (a thump for the last vector entry and the system pulse),
plus relay clicks around 1100 Hz and 55 Hz sub-bass. Every cue is varied by its own seed, so no two are identical.

## Files

```
src/template.html   markup + CSS          src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN / @CUES-END, written by build_index.py)
build_index.py      derives every sum, sign and comet timing, renders the KaTeX -> index.html
scripts/solve.py    exact solver (assertions)    scripts/katex_render.cjs + scripts/vendor/   KaTeX at build time
scripts/make_sfx.py CUES -> assets/sfx.wav       scripts/verify_snapshots.py   every 0.6 s: safe zones, no yellow, circuit stays lit
export_clean.sh     clean export -> mesh_inspection_perfect_clean.mp4
reports/            check-report.txt, solution.json, snapshot-verification.json     snapshots/critical/   key frames
```

## Rebuild

```bash
python3 build_index.py            # ships the cdnjs GSAP tag; add --local to test offline
python3 scripts/make_sfx.py
npx hyperframes lint && npx hyperframes check
python3 scripts/verify_snapshots.py
npx hyperframes render --fps 60 -o renders/raw_render.mp4
cd renders && ../export_clean.sh raw_render.mp4 mesh_inspection_perfect_clean.mp4
```

`assets/sfx.wav` and `renders/` are git-ignored.

## Check status

`npx hyperframes check`: 0 errors. Warnings (`reports/check-report.txt`): `line_unread`, type under 28 px (subscripts, circuit labels, legend),
single-file length, and a transient white-on-red contrast sample. `MAE_STYLE_SPEC.md` is not in this repository; the numbers in the brief were used.
