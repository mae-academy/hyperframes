# THE R-MATRIX TRICK · build the mesh matrix by inspection (1080×1920, 60 fps, 13.0 s)

The circuit is fully drawn and glowing at frame 0. An Electric Blue particle tracer laps the inner perimeter of each mesh
(clockwise); every resistor it passes pulses and hurls its value into the matrix. Off-diagonal entries are shot from the
shared resistor by two beams, source entries from the sources that rise (+) or drop (−) along the mesh.
No URL bar, no cursor, no CTA, no screen recording, no Gaussian elimination.

| Time (s)    | Beat                                                                                                    | Audio cue                                   |
| ----------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 0.0 - 2.0   | live hook, banner "STOP WRITING KVL EQUATIONS…"                                                         | thump 0.0, snap 0.04                        |
| 2.0 - 5.5   | diagonals: tracer laps mesh 1 / 2 / 3, values combine (2+2, 2+3+4, 4+1) and lock R11, R22, R33          | click 2.0 / 3.2 / 4.4, snap 2.8 / 4.0 / 5.2 |
| 5.5 - 9.0   | off-diagonals: R2 shared → R12 = R21 = −2; R4 shared → R23 = R32 = −4; meshes 1 and 3 share nothing → 0 | snap 5.8, 7.0, click 8.2                    |
| 9.0 - 11.8  | sources: v1 = +5 − 13 = −8, v2 = −16, v3 = +13                                                          | snap 9.2, 10.2, thump 11.1                  |
| 11.8 - 13.0 | whole equation pulses, check mark draws, static hold from 12.8                                          | snap 11.8, click 12.2                       |

R = [[4, −2, 0], [−2, 9, −4], [0, −4, 5]] kΩ, V = [−8, −16, 13]ᵀ V (asserted against `scripts/solve.py` while building).
Mesh currents are clockwise. Colours: diagonal Electric Blue #0088FF, off-diagonal Neon Purple #B026FF, source terms Flame Red #FF0044;
no green, no yellow anywhere. Every glyph is KaTeX (`KaTeX_Math` italic, `KaTeX_Main` regular/bold); the ⚡ and ✓ are SVG because KaTeX has no such glyphs.

## Layout (4 zones, centred on x = 540)

Zone 1 header y 110-310 · Zone 2 circuit plate x 90-990, y 340-900 · Zone 3 banner 720×95 at y ≈ 995 · Zone 4 glass card 760×500 at y 1100-1600 · y 1670-1920 empty.
`MAE_STYLE_SPEC.md` is not in this repository; the numbers in the brief were used as the spec.

## Files

```
src/template.html   markup + CSS          src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN / @CUES-END)
build_index.py      derives every entry, sum, sign and tracer timing -> index.html
scripts/make_sfx.py CUES -> assets/sfx.wav (13.0 s stereo, 50 Hz hum at -22 dBFS, click / snap(+70 Hz sub) / thump)
scripts/verify_snapshots.py   snapshots every 0.6 s + pixel checks (x 90-990, y 110-1670, no yellow)
export_clean.sh     metadata/chapters stripped, 4 px crop + rescale, light noise, loudnorm, faststart yuv420p
assets/fonts/ KaTeX fonts (MIT)   assets/gsap.min.js local copy, offline verification only
reports/            check-report.txt, solution.json     snapshots/critical/  frames at 0, 2.8, 5.8, 9.2, 11.8, 12.95 s
```

## Rebuild

```bash
python3 build_index.py            # ships the cdnjs GSAP tag; add --local to test offline
python3 scripts/make_sfx.py
npx hyperframes lint && npx hyperframes check
python3 scripts/verify_snapshots.py
npx hyperframes render --fps 60 -o renders/raw_render.mp4
cd renders && ../export_clean.sh raw_render.mp4 mesh_inspection_matrix_master.mp4
```

`assets/sfx.wav` and `renders/` are git-ignored.

## Check status

`npx hyperframes check`: 0 errors. Warnings (`reports/check-report.txt`): `line_unread` (a lock lasts 0.15-0.3 s by design for pacing),
small text below 28 px (subscripts, circuit labels, legend), and the 3.x s of the first banner on screen is 2.0 s.
