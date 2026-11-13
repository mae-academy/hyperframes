# MAE Academy — Web / HyperFrames Motion Framework

### Master System Specification v2.0 (supersedes v1.0)

**Changes from v1.0 are marked [v2].** Everything not marked is carried over from v1.0 unchanged. Where a value below is portrait-specific (old 1080×1920 coordinates), it is flagged **[Re-derive]**: it must be recomputed for the landscape canvas, not copied.

---

## 0. Pipeline in one paragraph

A video is **one `index.html`**: inline CSS, inline SVG, GSAP 3.12.5 (cdnjs), one paused timeline registered as `window.__timelines["main"]` (also `window.__timeline`), root `data-duration` = the exact length. All motion is a pure function of time (no `Math.random`, no `Date`, no network at render). Sound is synthesised from oscillators and baked to `assets/sfx.wav` by a script, referenced with an `<audio id>` tag. Validate with `npx hyperframes check`, inspect with `snapshot --at …`, then `render`. Output: **1920 × 1080 MP4** [v2].

---

## 1. Canvas, framing and safe zones (16:9 landscape) [v2]

| Item                | Rule                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Canvas              | **1920 × 1080**, `html, body` fixed to that size, `overflow:hidden`; `#root` carries `data-width="1920" data-height="1080"`.                                                   |
| Safe area           | **x ∈ [120, 1800], y ∈ [90, 990]**. Nothing essential outside it. Motion that leaves the safe area (transitions, clones in flight) must return inside it at rest.              |
| Two-panel grid      | **Left stage** x 120–1000 (schematic). **Right panel** x 1040–1800 (matrix, equations, solution). Gutter 40 px, centred at x 1020, carries the dashed paper-grey divider (§5). |
| Header              | y 90–190: title (64 px) and subtitle (36 px), spanning the full safe width, left-aligned at x 120.                                                                             |
| Content band        | y 230–930.                                                                                                                                                                     |
| Caption / step line | y 940–990 only.                                                                                                                                                                |
| Bottom margin       | ≥ 90 px (nothing below y 990).                                                                                                                                                 |
| Page-space SVG      | Author SVG in page coordinates: `viewBox="0 0 1920 1080"` so every x/y is the real pixel position.                                                                             |

**[Re-derive]** All v1 coordinates (loop lanes at x 472/608, matrix origin at y 1070, equation banner at y 995, etc.) were portrait values. Recompute them on the two-panel grid above. Keep the v1 _proportions_ (loop radius relative to resistor width, matrix bracket spacing relative to cell size) rather than the absolute numbers.

---

## 2. Background, depth and paper layers [v2]

- **Canvas fill:** `#f6eeeb` (paper). Flat. The v1 dark canvas, grid, neon glows and vignette are **removed**.
- **Depth is built from stacked paper sheets**, not light. Three layers only:
  - **L0 Canvas:** `#f6eeeb`.
  - **L1 Plates / panels:** solid fill `#bab9c7` or `#f2c2a7`, 24 px radius, no border, cast shadow (§5.2).
  - **L2 Objects:** circuit elements, graphs, labels, cut-out pieces. Each carries its keyline and shadow (§5.2).
- **Watermark:** text `@MAE.Academy`, KaTeX_Main Bold, 96 px, colour `#0c234c`, **opacity 0.07** (allowed 0.06–0.08), centred on the left stage behind the circuit (x ≈ 560, y ≈ 560). Never a second one. Never at the bottom.
- **Stacking:** `#scene {isolation:isolate}`; L0 `z-index:-30`, L1 `-20`, watermark `-10`, L2 auto.

---

## 3. Typography and math

**Fonts — ship locally** (unchanged): KaTeX 0.16.8 woff2 in `assets/fonts/`, declared with `@font-face`: `KaTeX_Main` 400 and 700, `KaTeX_Math` (italic). Do not list unmapped families.

| Content                    | Style                                                                                                           | Implementation                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Words, headings, step text | Upright Roman **Bold**                                                                                          | `font-family: KaTeX_Main; font-weight:700; font-style:normal`         |
| Variables `I₁ I₂ R V C Iₛ` | Italic math serif                                                                                               | `<span class="v">` with `.v{font-family:KaTeX_Math}` (never `<i>`)    |
| Subscripts                 | Upright Main digits                                                                                             | `sub{font-family:KaTeX_Main; font-size:.62em; vertical-align:-.24em}` |
| Numbers & units            | Upright, bold for values                                                                                        | KaTeX_Main                                                            |
| Operators                  | Upright Main, navy                                                                                              |                                                                       |
| Matrix headers             | `[R] [I] [V]`, bold upright, `letter-spacing:.16em` (set once, never animated), centred over their bracket pair |                                                                       |

**Paper-cut label shadow [v2]:** every circuit label and value carries a hard offset text shadow, no blur: `text-shadow: 4px 5px 0 #bab9c7`. This is the only text effect allowed.

**Sizes (landscape reference):** title 64 · subtitle 36 · step text 36 · equation 66 · circuit labels 44–50 · loop labels 34 (+ bold sub 0.72 em) · matrix placeholders 64 · matrix values 80 · solution lines 96 · check line 40.

**Contrast:** text colour is restricted to **navy `#0c234c`** (primary) and **blue `#1c3d7d`** (secondary, variables of mesh 1). **Slate `#60638f`** may be used for text only at ≥ 24 px regular. **Mauve, peach, orange and grey are never used as text colour**; they are for fills, strokes and shapes. `check` enforces WCAG AA (4.5:1 normal, 3:1 large).

**Text anchoring:** centre-anchor animated text with `.ctr` and `gsap.set(".ctr",{xPercent:-50,yPercent:-50})` once. Never CSS `translate(-50%,-50%)` on a node GSAP also transforms.

---

## 4. Colour system (palette v2 — NO YELLOW, ever) [v2]

### 4.1 Palette tokens

| Token      | Hex       | Role                                                                                       |
| ---------- | --------- | ------------------------------------------------------------------------------------------ |
| `--paper`  | `#f6eeeb` | Canvas, keylines (the white edge around every cut-out)                                     |
| `--navy`   | `#0c234c` | Axes, conductors, primary text, battery long plate, charge cross "+", arrows of the graphs |
| `--blue`   | `#1c3d7d` | Mesh 1 / I₁, voltage source body, graph curves, energy                                     |
| `--slate`  | `#60638f` | Mesh 2 / I₂, passive end caps, shadows of dark pieces                                      |
| `--mauve`  | `#a1808e` | Direction arrows, indicator accents, scan/motion arrows                                    |
| `--orange` | `#e29e7a` | Charges (+), filled areas under curves, current source 3A, the constraint/shared branch    |
| `--peach`  | `#f2c2a7` | Resistor bodies, panel highlights, filled areas (light)                                    |
| `--grey`   | `#bab9c7` | Conductor bodies, plates, cast shadows, dividers                                           |

**Rule of hue (kept from v1, re-mapped):** blue = mesh 1 / source of energy; slate = mesh 2 / passive; orange = what couples the meshes (shared branch, constraint, 3A). Mauve = direction only.

### 4.2 Gradients [v2]

Gradients are allowed **only** as two-stop, linear, 90° fills between the pairs below. No other gradient, no radial glow.

| Use                                   | From → To             |
| ------------------------------------- | --------------------- |
| Panel / plate fill                    | `#f6eeeb` → `#f2c2a7` |
| Conductor body (cylinder)             | `#bab9c7` → `#f6eeeb` |
| Dark fill (battery body, dark plates) | `#1c3d7d` → `#0c234c` |
| Filled area under curve               | `#f2c2a7` → `#e29e7a` |
| Cap / end ellipse                     | `#60638f` → `#a1808e` |

_Interpretation to confirm: the request asked for the palette "as a gradient". This table reads that as the palette's own colours used in pairs. If a different gradient was intended, replace §4.2 only._

### 4.3 Hard rules

- Palette ⊆ {§4.1 tokens} ∪ {white `#ffffff` for nothing}. Nothing else appears in the render, including shadows, glows and anti-aliasing edges.
- Placeholders: `#bab9c7` at full opacity until filled, with a dashed `#60638f` outline.
- A clone may change colour on landing only when the brief says so.

---

## 5. Paper cut-out vector standard [v2]

Replaces v1 §2 neon glow and v1 §5 line glows. The look: flat coloured paper pieces, each with a clean white edge and a hard cast shadow, arranged on paper.

### 5.1 Keyline and shadow (applies to every L2 object)

Each object is drawn as **three stacked copies**:

1. **Shadow copy:** same geometry, offset **(+8, +10) px**, fill `#bab9c7` for light pieces or `#60638f` for dark pieces. Solid, no blur.
2. **Keyline copy:** same geometry, stroke `#f6eeeb` at **stroke-width + 12 px** (the white cut edge).
3. **Object:** the real fill/stroke.

Shadows never use CSS `filter` or SVG `feGaussianBlur`. Glow filters from v1 are **forbidden** in v2.

### 5.2 Stroke system

- Three weights only: **6 px** (dividers, hair details, arrow shafts), **10 px** (graph curves, plate outlines), **14 px** (conductors, axes). `stroke-linecap/linejoin: round`.
- Each path carries `pathLength="1"` so every draw-on is `strokeDasharray:1` + `strokeDashoffset 1→0`.
- Grid: all coordinates snap to an **8 px grid**. Spacing between components ≥ 40 px.

### 5.3 Component detail (readable, organised, not photographic)

Each component must show at least **three legible details** so a student can identify it instantly. Detail is drawn flat, in palette, with no texture.

| Component                      | Required details                                                                                                                                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Conductor (wire)**           | Navy 14 px stroke with keyline. Flow carriers: orange charge discs (r 22) with white keyline and navy "+" cross.                                                                                                        |
| **Resistor**                   | Peach body (rounded, 112 px wide) with **four colour-band stripes** (navy, mauve, orange, slate) and navy leads. Label sits above, clear of the body by ≥ 14 px. Zig-zag form from v1 is retired.                       |
| **Battery**                    | Rounded rectangle, **orange cap** with navy "+", **grey cap** with navy "−", **blue** middle body with a mauve arrow showing direction.                                                                                 |
| **Voltage source (ideal)**     | Blue circle, navy outline, navy "+ / −" pair.                                                                                                                                                                           |
| **Current source (ideal)**     | Orange disc r 46, navy outline, mauve upward arrow inside. Label `3A` to the right.                                                                                                                                     |
| **Cylinder / conductor (3-D)** | Grey body `#bab9c7 → #f6eeeb` gradient, slate end cap ellipse with a paper keyline, flow carriers inside as orange discs with navy cross.                                                                               |
| **Graph**                      | Navy axes 14 px with solid triangular arrow heads, navy tick marks, blue curve 10 px, orange or peach area under the curve. Axis labels in KaTeX italic.                                                                |
| **Node / junction**            | Navy disc r 9, paper keyline.                                                                                                                                                                                           |
| **Dashed divider**             | Grey `#bab9c7`, 6 px dash 18 / gap 14, centred at x 1020, full content height.                                                                                                                                          |
| **Mesh loop**                  | Mesh 1 loop blue, mesh 2 loop slate, 10 px stroke, mauve arrowhead tangent to the arc. Geometry standard from v1 §5.1 (polyline of 41 points, clockwise, 225° start, 290° sweep) kept; radius re-derived for landscape. |
| **Scan beam**                  | Mauve 14 px band with paper keyline and navy-shadow (not glow). Perimeter-only path, dash method from v1 §5 kept.                                                                                                       |

**Organisation rules:** one component per cell; equal spacing along each conductor; labels aligned to a shared baseline per row; no two labels closer than 24 px; no overlap between a label and a keyline.

---

## 6. Motion choreography [v2]

Master timeline length is set per video (v1 template was 22.0 s). Helpers, easing and phase structure are carried over from v1 §6. **[Re-derive]** all x/y values for the landscape layout. Timings may be kept.

Phase structure (unchanged labels): A Intro · B Setup · C Scan · D Leap / Constraint · E Resolution.

### 6.1 Transition library [v2]

Every scene boundary uses **one** transition from this library. Transitions are part of the paper language: sheets lift, slide, fold or are cut.

| ID  | Name                 | Motion                                                                                                                                                    | Duration               |
| --- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| T1  | **Page turn**        | A grey sheet (`#bab9c7`, keyline, shadow) rotates `rotationY 0 → -90` about its left edge, revealing the next scene behind it.                            | 0.9 s, `power3.inOut`  |
| T2  | **Lift & drop**      | Outgoing group lifts (`y −40, scale 1.04`), its shadow grows from (+8,+10) to (+22,+28), then drops off. Incoming scene rises from below.                 | 0.8 s, `back.out(1.6)` |
| T3  | **Scissor cut**      | A diagonal band in `#1c3d7d` with navy keyline sweeps across; its clip-path polygon animates, uncovering the next scene.                                  | 0.7 s, `power2.inOut`  |
| T4  | **Shape morph**      | Outgoing silhouette morphs (`attr:{d}`) into the incoming silhouette. **Only** when both shapes have the same point count and topology; otherwise use T2. | 1.0 s, `power3.inOut`  |
| T5  | **Parallax slide**   | Three layers translate at 1.0× / 1.3× / 1.6× the same speed, with the nearest layer carrying the largest shadow.                                          | 0.8 s, `power3.inOut`  |
| T6  | **Charge flow wipe** | A row of orange charge discs travels across the canvas, leaving the next scene behind it.                                                                 | 1.0 s, `power2.inOut`  |

**Transition rules**

- Duration **0.6 – 1.0 s**, never longer.
- The same transition may not occur twice in a row.
- Transitions are pure functions of time and seekable.
- Transition shapes may leave the safe area only while in motion; at rest, everything is inside it.
- A transition may carry one audio cue at its midpoint (`click` or `snap` only), or none.

---

## 7. Audio — procedural Web Audio (zero sample files)

**Unchanged from v1 §7.** Cue vocabulary: `click`, `snap` (default on); `tick`, `thump` (optional, off). No noise, no voice, no music beds. Sync rule: a cue time equals its animation event time, and a transition cue sits at the transition midpoint.

---

## 8. Determinism and engineering pitfalls

1. **Never tween layout-snapping properties** (`letter-spacing`, `font-size`, `width`). Use transforms and opacity.
2. **No glow filters, no blur filters** [v2]. Shadows are duplicated offset shapes (§5.1). This also removes the v1 rule about filters on transformed groups.
3. **Repeated `fromTo` on one target** needs `immediateRender:false` on all but the first.
4. **Finite repeats only**; `repeat:-1` is forbidden.
5. **`svgOrigin`** for pulsing SVG pieces; `transformOrigin:"50% 0%"` for tip-anchored arrowheads.
6. **Opacity-0 initial state in CSS + `fromTo` in the timeline**; never fight a CSS transform with a GSAP transform on the same element.
7. **Fonts local; no unmapped families; contrast per §3.**
8. **Use the checker:** `npx hyperframes check` (0 errors), `snapshot --at t1,t2,… [--zoom x,y,w,h]`, then `render`.
9. **Keylines must not clip:** a keyline wider than its neighbour's gap will merge two objects; keep ≥ 40 px spacing (§5.3).

---

## 9. Quality gates (acceptance checklist)

- [ ] 1920×1080, exact stated duration, audio stream present (`ffprobe`).
- [ ] Nothing essential outside x 120–1800, y 90–990.
- [ ] Canvas `#f6eeeb`; every L2 object has keyline and shadow; no glow, no blur.
- [ ] Palette ⊆ §4.1; gradients only from §4.2; no yellow.
- [ ] Text colour only navy or blue (slate ≥ 24 px); labels carry the 4 px / 5 px shadow.
- [ ] Each component shows its required details (§5.3).
- [ ] Each scene boundary uses exactly one transition from §6.1, 0.6–1.0 s, no repeats in a row.
- [ ] Loop arrowheads tangential and visible at rest and during motion.
- [ ] Clones land centred in slots; placeholder hidden after landing.
- [ ] No noise-based sound; every cue matches its event.
- [ ] `check` passes; final frame holds static.

---

## 10. Master prompt template (fill the `⟦ ⟧` fields)

```
Build a single-file HyperFrames composition index.html (1920×1080 landscape, ⟦DURATION⟧ s, GSAP 3.12.5
from cdnjs, one paused timeline at window.__timelines["main"]) in the MAE Academy style defined in
MAE_STYLE_SPEC.md v2.0. Do not deviate from the spec; the values below only fill in this video's content.

TOPIC
  Title: "⟦TITLE⟧"            (64 px, navy, bold upright KaTeX_Main)
  Subtitle: "⟦SUBTITLE⟧"       (36 px, blue)
  Method: ⟦mesh / supermesh / nodal / thevenin / …⟧

LAYOUT
  Left stage x 120–1000: ⟦schematic⟧.  Right panel x 1040–1800: ⟦matrix / equations / solution⟧.

CIRCUIT (paper cut-out style, §5; components per §5.3)
  Components (id, type, value, location, colour role):
    ⟦V1, battery, 24 V, left branch, blue body⟧
    ⟦R1, resistor, 4 Ω, top-left, peach body⟧
    ⟦I_s, current source, 3 A, centre, orange disc⟧
  Mesh currents: ⟦I1 (blue), I2 (slate)⟧, clockwise loops per §5.3.

EQUATIONS / SOLUTION
  ⟦matrix system, placeholders → values with source label, target slot, final colour⟧
  Constraint banner: ⟦I2 − I1 = 3A⟧
  Solution: ⟦I1 = 3.0 A (blue), I2 = 6.0 A (slate)⟧
  Verification: ⟦…⟧

STORYBOARD (phase skeleton §6; list only content changes)
  A … B … C scan order: ⟦⟧   D leap / constraint: ⟦⟧   E resolution: ⟦⟧
  Transitions per boundary (§6.1): ⟦T1 … T6 in order⟧

AUDIO
  Cues only from {click, snap} (+ optional tick/thump if listed: ⟦none⟧). Bake assets/sfx.wav. No noise, no voice.

DELIVERABLES
  1. index.html  2. assets/sfx.wav  3. check output (0 errors)
  4. snapshots at ⟦6–10 timestamps⟧ reviewed for safe area, keylines and overlap
  5. final MP4 render and its ffprobe summary.
Report any place where the brief conflicts with the spec and which one you followed.
```

---

## Appendix A — Reference frames (v2 style target)

The reference images supplied with v2 define the look: off-white paper ground; cylinders in grey with orange charge discs carrying navy crosses and a slate end cap; navy axes with blue curves and orange or peach areas beneath them; mauve direction arrows; hard grey offset shadows; white keylines around every piece; a dashed grey divider between two panels; batteries built from orange, navy and grey caps.

_End of specification v2.0._
