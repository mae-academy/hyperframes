# THE R-MATRIX TRICK · THE COMPLETE MASTERCLASS (1080×1920, 60 fps, 26.0 s)

Builds the mesh matrices by inspection, unhurried. The circuit in zone 2 is fully lit and anchored for all 26 s (it is never dimmed,
hidden or moved; every highlight is a glow). The matrix card never moves until the finale, where it compacts in place.

| Time (s)    | Beat                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.0 - 3.0   | hook: four crossed-out KVL equations over the circuit ("15 MINUTES OF KVL ALGEBRA?"), clean dissolve 2.0-3.0, banner "BUILD THE R-MATRIX IN SECONDS BY SIGHT"                                                                           |
| 3.0 - 11.5  | diagonals: the mesh contour glows, a blue comet laps it once clockwise, each resistor blooms as it is touched, its value is pulled into a pill and the sum builds in the banner, the result drops into R11 (5.4), R22 (8.2), R33 (11.0) |
| 11.5 - 16.5 | off-diagonals: shared R2 glows purple → R12 = R21 = −2 (13.2); shared R4 → R23 = R32 = −4 (14.9); meshes 1 and 3 share nothing → 0 (16.2)                                                                                               |
| 16.5 - 21.5 | sources: v1 = +V1 − V3 = 5 − 13 = −8 (17.9), v2 = −V2 = −16 (19.5), v3 = +V3 = +13 (21.2)                                                                                                                                               |
| 21.5 - 26.0 | the system pulses (21.5), the matrix compacts in place, the CTA expands below it (22.0 - 23.0), hold from 24.9                                                                                                                          |

R = [[4, −2, 0], [−2, 9, −4], [0, −4, 5]] kΩ, V = [−8, −16, 13]ᵀ V, mesh currents clockwise. Mesh 3 reads R₃₃ = R₄ + R₅ = 4 + 1 = 5 kΩ:
the builder derives the index from the mesh number and asserts it, together with every sum and sign, against `scripts/solve.py`.

## Typography

Formulas are rendered by KaTeX 0.16.11 at build time from the TeX of the brief (vendored in `scripts/vendor`, woff2 fonts in `assets/fonts`):
variables are math italic (`R_1`, `V_1`, `I_1`), indices and units are upright (`R_{\mathrm{11}}`, `2\,\mathrm{k}\Omega`), results are bold.
Titles, banner text and the CTA use KaTeX_Main Bold. ⚡, 🔖 and 👇 are SVG icons (KaTeX has no such glyphs). Palette: Electric Blue #0088FF diagonals,
Neon Purple #B026FF off-diagonals, Flame Red #FF0044 sources, white; no green, no yellow.

## Audio

`scripts/make_sfx.py` (numpy + scipy.io.wavfile) reads the CUES block and writes a 26.0 s stereo WAV: a continuous 50 Hz hum at -22 dBFS with no gap,
relay clicks around 1100 Hz, gate-close snaps around 2400 Hz laid over a 55 Hz sub-bass boom, and 55 Hz thumps. Every cue is varied by its own seed, so no two are identical.

## Files

```
src/template.html   markup + CSS          src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN / @CUES-END)
build_index.py      derives every sum, sign and comet timing, renders the KaTeX -> index.html
scripts/solve.py    exact solver (assertions)    scripts/katex_render.cjs + scripts/vendor/   KaTeX at build time
scripts/make_sfx.py CUES -> assets/sfx.wav       scripts/verify_snapshots.py   every 0.6 s: safe zones, no yellow, circuit stays lit
export_clean.sh     clean export -> mesh_inspection_masterclass_clean.mp4
reports/            check-report.txt, solution.json, snapshot-verification.json     snapshots/critical/   key frames
```

## Rebuild

```bash
python3 build_index.py            # ships the cdnjs GSAP tag; add --local to test offline
python3 scripts/make_sfx.py
npx hyperframes lint && npx hyperframes check
python3 scripts/verify_snapshots.py
npx hyperframes render --fps 60 -o renders/raw_render.mp4
cd renders && ../export_clean.sh raw_render.mp4 mesh_inspection_masterclass_clean.mp4
```

`assets/sfx.wav` and `renders/` are git-ignored.

## Check status

`npx hyperframes check`: 0 errors. Warnings (`reports/check-report.txt`): `line_unread`, type under 28 px (subscripts, circuit labels, legend),
single-file length, and a transient white-on-red contrast sample. `MAE_STYLE_SPEC.md` is not in this repository; the numbers in the brief were used.
