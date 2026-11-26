# Sensors Atlas (HyperFrames)

7:22 Arabic explainer, 1920×1080, no voiceover, no mascot: the 30 sensors/transducers of the Sensors & Transducers chapter that
`examples/sensors-arena` does not cover, in 4 chapters (motion/position, force/tactile/vibration, flow, temperature), then a summary
table and the book's speed-control error example.

- `tools/data.mjs`: the single data object (sensor texts, symbols, constants, timing). `tools/build.mjs` + `build-tail.mjs` generate
  `index.html` and `compositions/*.html` from `src/` (`npm i --prefix tools`, then `node tools/build.mjs`).
- `src/engine.inc`: small SVG 3D engine (flat-shaded boxes, frustums/cylinders with silhouettes, glass pipes, annular discs, spheres,
  soft shadows, streamlines). `src/models-ch*.inc`: one model per sensor (geometry, output equation, scope curve, labels).
- Sound: `node tools/mix-audio.mjs` builds `assets/mix.m4a` offline (peak-aligned cues, pitch-rotated hits, speed-following servo,
  two-pass loudnorm, limiter).
- Render: `tools/render-segments.sh <fps> <quality> <seg seconds> <parallel> <outdir> 442`.
