# Sensors Arena: Linear Displacement (HyperFrames)

2:50 Arabic explainer (1920×1080, no voiceover, no mascot): one slider `x` drives one 3D diagram that transforms
Potentiometer → Capacitance (gap) → Differential capacitor → LVDT, then recap, textbook summary table, and the
textbook's RLC error-propagation worked example.

## Layout

- `src/*.src.html`, `src/common.{css,inc}`: sources (edit these). `tools/data.mjs` is the single data object,
  `tools/captions.mjs` the captions, `tools/sfx.mjs` the sound cues.
- `npm i --prefix tools && node tools/build.mjs` regenerates `index.html` + `compositions/*.html` (MathJax → inline SVG).
- Scenes: `lab` 0–114 s (hook, setup, 4 steps, recap), `table` 114–133, `example` 133–162, `outro` 162–170.
- Seams between scenes: cut-the-curve LEFT (±230 px, mirrored power4 eases). No cuts inside `lab`: the camera eases.

## Checks and render

```bash
npx hyperframes lint && npx hyperframes check
tools/render-segments.sh 24 draft 10 3 /tmp/draft      # preview: 10 s segments, 3 at a time, retries, concat -c copy
tools/render-segments.sh 60 delivery 8 8 /tmp/final    # final: 8 s segments, 8 at a time
```

## Colour = concept (never changes)

navy ink · blue supply `E` · orange input motion `x`/`d` · green electrical output · teal field lines/flux ·
gold moving part · purple edge case · red Z axis only.
