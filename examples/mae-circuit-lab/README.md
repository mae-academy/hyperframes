# THE R-MATRIX TRICK · THE COMPLETE MASTERCLASS (1080×1920, 60 fps, 21.0 s)

Every value is physically extracted from the circuit: the component flashes (0.15 s bloom), a crisp numeric clone appears at its exact SVG coordinate
(KaTeX_Main Bold, #0088FF self / #B026FF shared / #FF0044 source) and projects straight into its matrix cell in exactly 0.25 s (`power3.out`).
On arrival the target cell pulses 1.2×, snaps from placeholder to its final value, and the clone leaves the layout (`opacity: 0`, `display: none`).
There are no badges, rings or backgrounds, and nothing lingers between zones. The circuit stays fully lit for all 21 s; the matrix (y 1060 - 1360) is never moved or scaled.

| Time (s)    | Beat                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0 - 1.2   | hook: crossed-out KVL paper (zone 2) and the banner "15 MINUTES OF KVL ALGEBRA? ×" (zone 3)                                                 |
| 1.2 - 2.0   | the banner crossfades straight into "BUILD THE R-MATRIX BY SIGHT ⚡" (never empty), the paper dissolves, the circuit lights up              |
| 2.0 - 4.2   | mesh 1: the comet laps the contour; "2" off R1 and "2" off R2 project into R11 (lock 3.9 → "4")                                             |
| 4.2 - 6.6   | mesh 2: "2" off R2, "3" off R3, "4" off R4 → R22 (lock 6.3 → "9")                                                                           |
| 6.6 - 8.8   | mesh 3: "4" off R4, "1" off R5 → R33 (lock 8.5 → "5")                                                                                       |
| 8.8 - 12.8  | shared R2 → "−2" into R12 and R21 (9.9); shared R4 → "−4" into R23 and R32 (11.4); a "0" from the mesh 1/3 boundary into R13 and R31 (12.4) |
| 12.8 - 16.5 | sources: "+5" off V1 and "−13" off V3 → row 1 (13.9, "−8"); "−16" off V2 → row 2 (15.0); "+13" off V3 → row 3 (16.1)                        |
| 16.5 - 17.5 | system pulse: whole circuit glows Electric Blue, a glow wave crosses the matrix, banner "R · I = V [SYSTEM FULLY SOLVED ⚡]"                |
| 17.5 - 21.0 | the CTA slides up into y 1380 - 1620 (840×240); nothing moves from 19.4, so the solved matrix and CTA hold to the end                       |

The lap of each mesh is timed so its last touched resistor lifts its value exactly 0.25 s before the cell locks. R = [[4, −2, 0], [−2, 9, −4], [0, −4, 5]] kΩ, V = [−8, −16, 13]ᵀ V;
every sum and sign is asserted against `scripts/solve.py`.

## Typography

Formulas are rendered by KaTeX 0.16.11 at build time from the TeX of the brief (vendored in `scripts/vendor`, woff2 fonts in `assets/fonts`):
variables are math italic (`R_1`, `V_1`, `I_1`), indices and units are upright (`R_{\mathrm{11}}`, `2\,\mathrm{k}\Omega`), results are bold.
Titles, banner text and the CTA use KaTeX_Main Bold. ⚡, 🔖 and 👇 are SVG icons (KaTeX has no such glyphs). Palette: Electric Blue #0088FF diagonals,
Neon Purple #B026FF off-diagonals, Flame Red #FF0044 sources, white; no green, no yellow.

## Audio

`build_index.py` writes the CUES block of `src/timeline.js` from the same schedule the picture uses (41 cues); `scripts/make_sfx.py` (numpy + scipy.io.wavfile)
turns it into a 21.0 s stereo WAV. Only three voices exist, all fixed-frequency instantly-decaying transients (no pitch bends, slides, chirps or sweeps):

- a continuous **50 Hz hum** at -22 dBFS, unbroken from 0.0 s to 21.0 s
- **click**: 1800 Hz sine x exp(-t/3 ms), 20 ms, on every lift-off and every intermediate landing
- **snap**: (2400 Hz sine + 0.5 x gaussian noise) x exp(-t/5 ms), 35 ms, when a value locks into its cell
- **thump**: 55 Hz sine x exp(-t/20 ms), 80 ms, layered under each lock and at the system pulse

## Files

```
src/template.html   markup + CSS          src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN / @CUES-END, written by build_index.py)
build_index.py      derives every sum, sign and comet timing, renders the KaTeX -> index.html
scripts/solve.py    exact solver (assertions)    scripts/katex_render.cjs + scripts/vendor/   KaTeX at build time
scripts/make_sfx.py CUES -> assets/sfx.wav       scripts/verify_snapshots.py   every 0.6 s: safe zones, no yellow, circuit stays lit
export_clean.sh     clean export -> mesh_inspection_final_master.mp4
reports/            check-report.txt, solution.json, snapshot-verification.json     snapshots/critical/   key frames
```

## Rebuild

```bash
python3 build_index.py            # ships the cdnjs GSAP tag; add --local to test offline
python3 scripts/make_sfx.py
npx hyperframes lint && npx hyperframes check
python3 scripts/verify_snapshots.py
npx hyperframes render --fps 60 -o renders/raw_render.mp4
cd renders && ../export_clean.sh raw_render.mp4 mesh_inspection_final_master.mp4
```

`assets/sfx.wav` and `renders/` are git-ignored.

## Check status

`npx hyperframes check`: 0 errors. Warnings (`reports/check-report.txt`): `line_unread`, type under 28 px (subscripts, circuit labels, legend),
single-file length, and a transient white-on-red contrast sample. `MAE_STYLE_SPEC.md` is not in this repository; the numbers in the brief were used.
