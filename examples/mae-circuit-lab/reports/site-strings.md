# Site strings quoted in the film

Source: https://maeacademy.org/simulations/circuit-lab, recorded with headless Chromium (Playwright) by
`scripts/record_site.cjs`; clip = `assets/circuit-lab-hook.mp4` (source seconds 3.6 to 6.6 of the recording).
Timestamps are composition time (the clip starts at 0.0 s). Strings were read from the rendered DOM
(innerText semantics, so CSS upper-casing is respected) and polled every ~60 ms; the appearance/disappearance times
were cross-checked against pixel differences in the recording (`reports/site-capture-log.json`).

| #   | Exact string                             | Where on the page                      | Visible in the film                                             |
| --- | ---------------------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| 1   | `Electrical Circuits`                    | page H1, centred above the toolbar     | 0.0 - 3.0 s                                                     |
| 2   | `COMPONENT LIBRARY`                      | header of the left component panel     | 0.0 - 3.0 s                                                     |
| 3   | `INTERACTIVE CIRCUIT SCHEMATIC CANVAS`   | header of the canvas panel             | 0.0 - 3.0 s                                                     |
| 4   | `Canvas Ready` (used as the hook banner) | pill in the middle of the empty canvas | 0.0 - ~1.4 s (disappears when the DC Voltage Source is dropped) |
| 5   | `V1 added`                               | toast, lower right of the canvas       | from ~1.42 s to 3.0 s                                           |

Nothing else is quoted. The drag of the "DC Voltage Source" tile is a real interaction with the live page (no cursor is
drawn by the recorder). The crop height (792 px) is chosen to stay above the "3-Phase Source/Rail" icons, which
contain yellow strokes (project rule: zero yellow).
