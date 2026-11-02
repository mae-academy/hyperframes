# THE R-MATRIX TRICK · THE COMPLETE MASTERCLASS (1080×1920, 60 fps, 20.0 s)

Builds the mesh matrices by inspection. The circuit in zone 2 is fully lit and anchored from the first dissolve to the end (never dimmed,
hidden or moved; every highlight is a glow on the component itself, nothing detaches from it). The matrix card stays put until the outro.

| Time (s)    | Beat                                                                                                                                                                                                                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.0 - 2.0   | hook: crossed-out KVL paper (zone 2) and the banner "15 MINUTES OF KVL ALGEBRA? ×" (zone 3) together; both dissolve over 1.2 - 1.5; banner "BUILD THE R-MATRIX BY SIGHT ⚡" at 1.5                                                                                                                                 |
| 2.0 - 8.5   | diagonals: a blue comet laps mesh 1 / 2 / 3 (starts 2.0 / 4.0 / 6.2, a lap is solved so a cued click lands on a touch at 2.8 / 4.8 / 7.2); touched resistors bloom in place, their terms ignite in the banner, the result falls into R11 (3.5), R22 (5.7), R33 (8.0); the next lap starts 0.2 s after each landing |
| 8.5 - 12.0  | off-diagonals: shared R2 purple → R12 = R21 = −2 (8.8); shared R4 → R23 = R32 = −4 (10.0); meshes 1 and 3 share nothing → 0 (11.2)                                                                                                                                                                                 |
| 12.0 - 15.5 | sources: v1 = +V1 − V3 = 5 − 13 = −8 (12.4), v2 = −V2 = −16 (13.5), v3 = +V3 = +13 (14.6); the source halos relax before 15.5                                                                                                                                                                                      |
| 15.5 - 20.0 | system solved: V3 back to normal, the whole circuit glows Electric Blue, an energy wave runs across the matrix, banner "R · I = V [SYSTEM FULLY SOLVED ⚡]"; 16.5 the matrix compacts in place and the CTA slides up; static from 18.8                                                                             |

Banner crossfades are 0.15 s out, then 0.15 s in. R = [[4, −2, 0], [−2, 9, −4], [0, −4, 5]] kΩ, V = [−8, −16, 13]ᵀ V, mesh currents clockwise.
Mesh 3 reads R₃₃ = R₄ + R₅ = 4 + 1 = 5 kΩ (the builder derives the index from the mesh number and asserts it, with every sum and sign, against `scripts/solve.py`).

## Typography

Formulas are rendered by KaTeX 0.16.11 at build time from the TeX of the brief (vendored in `scripts/vendor`, woff2 fonts in `assets/fonts`):
variables are math italic (`R_1`, `V_1`, `I_1`), indices and units are upright (`R_{\mathrm{11}}`, `2\,\mathrm{k}\Omega`), results are bold.
Titles, banner text and the CTA use KaTeX_Main Bold. ⚡, 🔖 and 👇 are SVG icons (KaTeX has no such glyphs). Palette: Electric Blue #0088FF diagonals,
Neon Purple #B026FF off-diagonals, Flame Red #FF0044 sources, white; no green, no yellow.

## Audio

`scripts/make_sfx.py` (numpy + scipy.io.wavfile) reads the CUES block and writes a 20.0 s stereo WAV: a continuous 50 Hz hum at -22 dBFS with no gap,
relay clicks around 1100 Hz, gate-close snaps around 2400 Hz laid over a 55 Hz sub-bass boom, and 55 Hz thumps. Every cue is varied by its own seed, so no two are identical.

## Files

```
src/template.html   markup + CSS          src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN / @CUES-END)
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
