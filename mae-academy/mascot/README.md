# MAE mascot rig

Vector rig of the MAE character, **traced from the original reference art** (not redrawn by eye), then split into layers.
All coordinates are in the reference pixel space (2473 x 3024) so every part overlays exactly.

```
reference/   the 4 original poses (PNG extracted from the supplied SVGs)
rig/
  rig.json            all traced layers (head, glasses, per-pose body, face parts)
  mae-rig.mjs         runtime: compose(pose, expression) -> SVG string
  head/               head-white, hair, ink, glasses
  poses/              body-<pose>.svg, overlay-think.svg (glove drawn over the chin)
  parts/{brows,eyes,mouths}/<pose>-*.svg   native face parts of each pose
  assembled/<pose>.svg   each original pose rebuilt from the parts (<1% edge-pixel diff vs reference)
tools/trace/          segment -> potrace -> split -> build_rig.py (regenerates rig/)
tools/make-sheets.mjs preview sheets in previews/
```

Regenerate: `python3 tools/trace/build_rig.py && node tools/make-sheets.mjs`
(needs `pip install potracer numpy opencv-python-headless pillow`, and Playwright for the sheets).

Extra eye / brow / mouth states are built from the traced shapes (rigid transforms) or drawn in the same ink weight; see `EYES`, `BROWS`, `MOUTHS`, `EXPRESSIONS` in `mae-rig.mjs`.
