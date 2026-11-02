# THE R-MATRIX TRICK · build the mesh matrix by inspection (1080×1920, 60 fps, 14.5 s)

Opens on a crossed-out wall of KVL algebra ("15 MINUTES OF MESH EQUATIONS? ✕") that shatters at 0.6 s and lights the circuit.
A blue comet then laps each mesh clockwise; at every resistor it touches, that resistor blooms, its value is pulled down into a pill
and the running sum ignites term by term in the Zone 3 banner (`R₂₂ = R₂ + R₃ + R₄` / `= 2 + 3 + 4 = 9 kΩ`) before the result is
thrown into the matrix. Shared resistors fire purple beams into R_ij; sources fill v. At 11.2 s the matrix glows, pushes up, and the
"SAVE THIS TRICK" card takes over the bottom of the screen. No URL bar, no cursor, no link, no screen recording, no Gaussian elimination.

| Time (s)    | Beat                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| 0.0 - 1.8   | hook: crossed-out algebra, shatter at 0.6, circuit illuminates, banner "BUILD THE R-MATRIX IN 5 SECONDS BY SIGHT"           |
| 1.8 - 6.2   | diagonals: comet on mesh 1 / 2 / 3, ticks at 2.2 2.6 · 3.6 4.0 4.3 · 5.1 5.5, locks 3.0 4.6 6.0 → R11 = 4, R22 = 9, R33 = 5 |
| 6.2 - 9.0   | off-diagonals: shared R2 → R12 = R21 = −2 (6.5), shared R4 → R23 = R32 = −4 (7.6), nothing shared → 0 (8.6)                 |
| 9.0 - 11.2  | sources: v1 = +5 − 13 = −8 (9.2), v2 = −16 (9.9), v3 = +13 (10.6)                                                           |
| 11.2 - 14.5 | matrix glows (11.2), card pushes up, CTA slides up (11.4 / 11.45), resonance (12.8), static hold from 13.5                  |

R = [[4, −2, 0], [−2, 9, −4], [0, −4, 5]] kΩ, V = [−8, −16, 13]ᵀ V, mesh currents clockwise (asserted against `scripts/solve.py`).

## Typography

Every formula is rendered by KaTeX 0.16.11 at build time (vendored in `scripts/vendor`, fonts in `assets/fonts`, woff2 only).
**All KaTeX is italic** (`ITALIC = True` in `build_index.py`): names, subscripts, numbers, units (`k\varOmega`, `V`) and `\textit` text are
italic, bold is bold-italic, and the KaTeX_Main titles/banners/CTA inherit italic from the root. Set `ITALIC = False` to get the
earlier upright-roman hygiene (`\mathbf{R}`, `\mathrm{11}`, `2\,\mathrm{k}\Omega`) back. Units keep their thin space.
⚡, 🔖 and 👇 are SVG icons (KaTeX has no such glyphs). Palette: Electric Blue #0088FF diagonals, Neon Purple #B026FF off-diagonals,
Flame Red #FF0044 sources, white; no green, no yellow.

## Files

```
src/template.html   markup + CSS          src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN / @CUES-END)
build_index.py      derives every sum, sign and comet waypoint, renders the KaTeX -> index.html
scripts/katex_render.cjs + scripts/vendor/   KaTeX at build time          scripts/solve.py   exact solver (assertions)
scripts/make_sfx.py CUES -> assets/sfx.wav (14.5 s stereo, 50 Hz hum at -22 dBFS, click / snap / thump)
scripts/verify_snapshots.py   snapshots every 0.6 s + pixel checks (x 90-990, y 110-1670, no yellow)
export_clean.sh     metadata/chapters stripped, 4 px crop + rescale, light noise, loudnorm, faststart yuv420p (+ bitexact flags)
reports/            check-report.txt, solution.json     snapshots/critical/  frames at 0, 0.9, 2.9, 4.5, 6.4, 9.2, 11.6, 14.49 s
```

## Rebuild

```bash
python3 build_index.py            # ships the cdnjs GSAP tag; add --local to test offline
python3 scripts/make_sfx.py
npx hyperframes lint && npx hyperframes check
python3 scripts/verify_snapshots.py
npx hyperframes render --fps 60 -o renders/raw_render.mp4
cd renders && ../export_clean.sh raw_render.mp4 mesh_inspection_matrix_perfect.mp4
```

`assets/sfx.wav` and `renders/` are git-ignored.

## Check status

`npx hyperframes check`: 0 errors. Warnings (`reports/check-report.txt`): `line_unread` (locks and ticks are short by design),
type under 28 px (subscripts, circuit labels, legend), single-file length. `MAE_STYLE_SPEC.md` is not in this repository; the numbers in the brief were used.
