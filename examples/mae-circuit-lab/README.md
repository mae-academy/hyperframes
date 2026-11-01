# MAE Academy · Build the R matrix (1080×1920, 60 fps, 30 s)

Shows **where every entry of the mesh-analysis matrices comes from**: the circuit is redrawn, the three clockwise mesh
currents are drawn, and then each entry of `R` and `v` is derived on screen. For every beat the circuit dims except the
parts that produce the entry, the strip shows the derivation, the value flies into its cell, and a rule card
highlights the rule that was used. Ends on a CTA card. No Gaussian elimination, no screen recording.

| Time (s)    | Beat                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------- |
| 0.0 - 3.5   | wires draw in as light packets, sources and resistors drop in with values                       |
| 3.5 - 6.0   | clockwise mesh currents I1, I2, I3                                                              |
| 6.0 - 7.2   | brackets, column labels, `R·I = V` set up                                                       |
| 7.2 - 13.2  | diagonal entries: R11, R22, R33 = sum of every resistor around the mesh (blue)                  |
| 13.2 - 19.2 | off-diagonal entries: R12=R21=-R2, R23=R32=-R4, R13=R31=0 = minus the shared resistors (purple) |
| 19.2 - 25.2 | v1 = +V1 - V3, v2 = -V2, v3 = +V3 = source rises minus drops along the mesh current (red)       |
| 25.2 - 25.9 | whole matrix glows, legend appears                                                              |
| 25.9 - 30.0 | CTA: ripples, cursor glide, click, "OPEN THE LAB" (final hold from 29.0)                        |

## Values

R1 = 2, R2 = 2, R3 = 3, R4 = 4, R5 = 1 kΩ; V1 = 5, V2 = 16, V3 = 13 V.
R = [[4, -2, 0], [-2, 9, -4], [0, -4, 5]] kΩ, v = [-8, -16, 13] V. (Check solution, not shown in the film:
I = [-3, -2, 1] mA, `reports/solution.json`.) Every derivation in the strip is asserted against the exact matrix from
`scripts/solve.py` while building.

## Style

Palette only: Electric Blue #0088FF (diagonal / resistors), Neon Purple #B026FF (off-diagonal), Flame Red #FF0044 (source terms),
white; canvas #0A0A10, grid #161622, panels #12121C. No green, no yellow (except the window dot).
All text is KaTeX: `KaTeX_Math` italic for variables, `KaTeX_Main` (bold for numbers) for everything else; no other font is loaded.

## Layout

```
src/template.html   markup + CSS with {{slots}}        src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN/@CUES-END)
build_index.py      derives the beats from scripts/solve.py -> index.html
scripts/solve.py    exact mesh solver (also used as the assertion source)
scripts/make_sfx.py CUES -> assets/sfx.wav (stereo 48 kHz, same length as the video)
scripts/verify_snapshots.py   snapshots every 0.6 s + pixel checks (x 90-990, y 140-1670, no yellow)
scripts/export_web.sh         yuv420p, +faststart, even dimensions, tags stripped
assets/fonts/       KaTeX fonts (MIT)       assets/gsap.min.js  local copy for offline verification only
reports/            check-report.txt, solution.json, snapshot-verification.json
snapshots/critical/ frames at 3, 7, 11, 16, 22, 25 s and the last frame
```

## Rebuild

```bash
python3 build_index.py            # ships the cdnjs GSAP tag (--local only for offline tests)
python3 scripts/make_sfx.py
npx hyperframes lint && npx hyperframes check
python3 scripts/verify_snapshots.py
npx hyperframes render --fps 60 -o renders/mae-circuit-lab-raw.mp4
scripts/export_web.sh renders/mae-circuit-lab-raw.mp4 renders/mae-circuit-lab-web.mp4
```

New numbers: edit `CONFIG` in `build_index.py`. `assets/sfx.wav` and `renders/` are git-ignored.

## Check status

`npx hyperframes check`: 0 errors. Warnings (see `reports/check-report.txt`): single-file length (the brief asks for one
index.html); `line_unread` because 9 derivations in 18 s give each 2.0 s, below the tool's reading floor for long lines;
small annotation text (subscripts, circuit labels). The one contrast note is the intentional white flash on the CTA button.
