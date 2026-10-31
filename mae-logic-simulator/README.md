# MAE Academy — Logic Circuit Simulator (Half Adder → Full Adder)

25.0 s · 1080×1920 · 60 fps · GSAP 3.12.5 · `window.__timelines["main"]` · MAE_STYLE_SPEC v1.0

| File                                                     | Role                                                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `index.html`                                             | **Deliverable.** Single-file composition (inline CSS/SVG/JS). Generated — edit the sources below, then rebuild. |
| `assets/sfx.wav`                                         | Procedural audio (sine/shaped-sine only, no noise), baked from the `CUES` block in `index.html`.                |
| `assets/fonts/`                                          | KaTeX 0.16.8 woff2: Main-Regular, Main-Bold, Math-Italic.                                                       |
| `scripts/template.html`, `build_index.py`, `timeline.js` | Sources of `index.html` (markup/geometry generator + hand-written timeline).                                    |
| `scripts/make_sfx.py`                                    | Parses `@CUES-BEGIN/END` in `index.html` and writes `assets/sfx.wav`.                                           |

```bash
python3 scripts/build_index.py && python3 scripts/make_sfx.py   # rebuild
npx hyperframes check
npx hyperframes render --fps 60
```
