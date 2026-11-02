# THE R-MATRIX TRICK · THE COMPLETE MASTERCLASS (1080×1920, 60 fps, 21.0 s)

**Pop-and-drop extraction.** The comet touches a component; the NUMBER already written on it (`2` on R1, `5` on V1 ...) scales to 2.2× right where it sits with a
neon pulse; then a clone of that exact number glides along a curve (x and y on different eases) into its equation slot or matrix cell, shrinking to the size of its
destination, and settles at scale 1.0 there. The cell pulses 1.2× and locks. The circuit label keeps its own number (the schematic is never left with a hole), and no
badge or background exists: only the numbers move. A shared resistor (R2, R4) pops once and its number splits into two negative numbers that fly to the mirror cells.
The circuit is fully lit and anchored from frame 0 to the end; the matrix (y 1060 - 1360) is never moved or scaled.

| Time (s)    | Beat                                                                                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0.0 - 0.8   | circuit live from frame 0; zone 3 shows the crossed-out handwriting and "15 MINUTES OF KVL? ❌"                                                                          |
| 0.8 - 1.4   | it shatters into particles (all inside x 100 - 980) and reveals "SOLVE BY SIGHT IN 5 SECONDS ⚡"                                                                         |
| 2.0 - 8.8   | mesh 1 (R1, R2 → 4), mesh 2 (R2, R3, R4 → 9), mesh 3 (R4, R5 → 5): each number pops, glides into the banner equation, the sum drops into R11 / R22 / R33 (3.9, 6.3, 8.5) |
| 8.8 - 12.8  | shared R2 pops, its number splits into two "−2" → R12, R21 (9.9); R4 → "−4" into R23, R32 (11.4); zeros lock into R13, R31 (12.4)                                        |
| 12.8 - 16.5 | sources: V1 "+5" and V3 "−13" glide into `5 − 13`, "−8" drops into row 1 (13.9); V2 "−16" → row 2 (15.0); V3 "+13" → row 3 (16.1)                                        |
| 16.5 - 17.5 | system pulse: whole circuit glows Electric Blue, glow wave across the matrix, banner "R · I = V [SYSTEM FULLY SOLVED ⚡]"                                                |
| 17.5 - 21.0 | the CTA slides up into y 1380 - 1620 ("SAVE THIS FOR YOUR EXAM", "CAN YOU FIND I₁? DROP YOUR ANSWER BELOW", "MAE ACADEMY ⋅ CIRCUIT LAB"); static from 19.4               |

The lap of each mesh is timed so its last touched resistor pops exactly 0.9 s before its sum locks. R = [[4, −2, 0], [−2, 9, −4], [0, −4, 5]] kΩ, V = [−8, −16, 13]ᵀ V;
every sum and sign is asserted against `scripts/solve.py`.

## Typography

Pure KaTeX math mode, rendered by KaTeX 0.16.11 at build time (vendored in `scripts/vendor`, woff2 fonts in `assets/fonts`). There is no `\mathrm`, `\mathbf` or forced roman
(`build_index.py` asserts it): `R_{11}`, `I_1`, `v_1`, `2\,k\Omega`, `5\,V`. KaTeX itself sets digits and the Greek capital upright in math mode; letters are math italic.
Titles, banner text and the CTA are plain KaTeX_Main Bold. ⚡, ❌, 🔖 and 👇 are SVG icons (KaTeX has no such glyphs). Palette: Electric Blue #0088FF diagonals, Neon Purple #B026FF
off-diagonals, Flame Red #FF0044 sources, white; no green, no yellow.

## Audio

Sound exists only for physical things. `build_index.py` writes the CUES block of `src/timeline.js` (16 cues) from the same schedule the picture uses and `scripts/make_sfx.py`
(numpy + scipy.io.wavfile) renders it:

- a continuous **50 Hz stereo hum** at -22 dBFS, unbroken from 0.0 s to 21.0 s
- **click** (13): one per component pop, 1800 Hz sine x exp(-t/3 ms), 15 ms. A mesh with 2 resistors gets exactly 2 clicks, with 3 resistors exactly 3; shared R2 / R4 and each source pop once.
- **thump** (3): 55 Hz sine x exp(-t/40 ms) when a full matrix row completes (row 2 at 11.4 s, rows 1 and 3 at 12.4 s) and when the vector completes (16.1 s)

Nothing sounds for an operator, a text change, the hook or the CTA, and there is no whoosh, slide, chirp or pitch movement.

## Files

```
src/template.html   markup + CSS          src/timeline.js   GSAP timeline + CUES (@CUES-BEGIN / @CUES-END, written by build_index.py)
build_index.py      derives every sum, sign and comet timing, renders the KaTeX -> index.html
scripts/solve.py    exact solver (assertions)    scripts/katex_render.cjs + scripts/vendor/   KaTeX at build time
scripts/make_sfx.py CUES -> assets/sfx.wav       scripts/verify_snapshots.py   every 0.6 s: safe zones, no yellow, circuit stays lit
export_clean.sh     clean export (metadata purged, 4 px crop + Lanczos rescale, loudnorm I=-14) -> mesh_inspection_final_master.mp4
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
