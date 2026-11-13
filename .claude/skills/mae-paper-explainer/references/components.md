# Components: copy-ready paper cut-out SVG

All snippets are **page-space** (`<svg viewBox="0 0 1920 1080">`), 8 px grid, palette tokens only. Author them as static markup (Studio edits tags; no script-built DOM). Gradient direction "90°" is read as **left → right** (`x1=0 y1=0 x2=1 y2=0`).

```html
<svg id="art" viewBox="0 0 1920 1080" width="1920" height="1080">
  <defs>
    <linearGradient id="gPanel" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f6eeeb" />
      <stop offset="1" stop-color="#f2c2a7" />
    </linearGradient>
    <linearGradient id="gCond" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#bab9c7" />
      <stop offset="1" stop-color="#f6eeeb" />
    </linearGradient>
    <linearGradient id="gDark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1c3d7d" />
      <stop offset="1" stop-color="#0c234c" />
    </linearGradient>
    <linearGradient id="gArea" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#f2c2a7" />
      <stop offset="1" stop-color="#e29e7a" />
    </linearGradient>
    <linearGradient id="gCap" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#60638f" />
      <stop offset="1" stop-color="#a1808e" />
    </linearGradient>
  </defs>
</svg>
```

## 1. The triple-copy rule (every L2 object)

Define geometry once in `<defs>`, draw it three times with `<use>`: shadow (+8,+10) → keyline (stroke + 12, paper) → object. Light pieces cast `#bab9c7`; dark pieces cast `#60638f`. Shadow and keyline are **siblings of the object inside the same group**, so a group tween (`x`, `y`, `scale`, `opacity`) moves all three together.

```html
<!-- filled piece: peach rounded body -->
<defs><rect id="bodyR1" x="904" y="136" width="112" height="48" rx="16" /></defs>
<g id="R1" class="piece">
  <use href="#bodyR1" transform="translate(8,10)" fill="#bab9c7" />
  <!-- shadow -->
  <use href="#bodyR1" fill="#f6eeeb" stroke="#f6eeeb" stroke-width="12" stroke-linejoin="round" />
  <!-- keyline -->
  <use href="#bodyR1" fill="#f2c2a7" />
  <!-- object -->
</g>

<!-- stroked piece: wire, draw-on via pathLength -->
<defs><path id="w1" d="M 200 400 H 640 V 760" pathLength="1" /></defs>
<g id="wire1" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1">
  <use class="w1" href="#w1" transform="translate(8,10)" stroke="#bab9c7" stroke-width="14" />
  <use class="w1" href="#w1" stroke="#f6eeeb" stroke-width="26" />
  <use class="w1" href="#w1" stroke="#0c234c" stroke-width="14" />
</g>
```

Draw-on: `tl.fromTo(".w1",{strokeDashoffset:1},{strokeDashoffset:0,duration:.8,ease:"power2.inOut"},t)` (the same `pathLength="1"` on the referenced path is shared by all three copies; give each wire its own class).

Keyline never wider than the gap to its neighbour: keep ≥ 40 px between objects (spec §8.9).

## 2. Components (centre-referenced; shift with `transform` on the group)

Each shows ≥ 3 legible details (spec §5.3). Shadow/keyline copies omitted below for brevity: **add them** per §1 for body shapes.

### Resistor (112 × 48 body, four bands, leads)

```html
<g id="R1" transform="translate(960,160)">
  <line
    x1="-120"
    x2="-56"
    y1="0"
    y2="0"
    stroke="#0c234c"
    stroke-width="14"
    stroke-linecap="round"
  />
  <!-- leads -->
  <line x1="56" x2="120" y1="0" y2="0" stroke="#0c234c" stroke-width="14" stroke-linecap="round" />
  <rect x="-56" y="-24" width="112" height="48" rx="16" fill="#f2c2a7" />
  <!-- body -->
  <rect x="-32" y="-24" width="8" height="48" fill="#0c234c" />
  <!-- band 1 navy -->
  <rect x="-12" y="-24" width="8" height="48" fill="#a1808e" />
  <!-- band 2 mauve -->
  <rect x="8" y="-24" width="8" height="48" fill="#e29e7a" />
  <!-- band 3 orange -->
  <rect x="28" y="-24" width="8" height="48" fill="#60638f" />
  <!-- band 4 slate -->
  <text class="lbl ctr" x="0" y="-56">4 Ω</text>
  <!-- ≥ 14 px clear of body -->
</g>
```

Bands sit inside the body with the rounded corners clipping nothing (x within ±36). Zig-zag resistors are retired.

### Battery (horizontal, 176 × 64)

```html
<g id="V1" transform="translate(400,600)">
  <rect x="-88" y="-32" width="40" height="64" rx="12" fill="#bab9c7" />
  <!-- grey cap  (−) -->
  <rect x="-56" y="-32" width="104" height="64" fill="url(#gDark)" />
  <!-- blue body -->
  <rect x="48" y="-32" width="40" height="64" rx="12" fill="#e29e7a" />
  <!-- orange cap (+) -->
  <path
    d="M -28 0 H 24 M 8 -14 L 24 0 L 8 14"
    fill="none"
    stroke="#a1808e"
    stroke-width="6"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
  <!-- mauve direction arrow -->
  <path d="M 58 0 H 78 M 68 -10 V 10" stroke="#0c234c" stroke-width="6" stroke-linecap="round" />
  <!-- "+" -->
  <path d="M -78 0 H -58" stroke="#0c234c" stroke-width="6" stroke-linecap="round" />
  <!-- "−" -->
</g>
```

Dark body → shadow copy `#60638f`; caps are light → `#bab9c7`. For a vertical battery rotate the group.

### Ideal voltage source

Circle r 48, fill `#1c3d7d`, stroke `#0c234c` 10; "+" above centre, "−" below, navy 6 px strokes. Shadow `#60638f`.

### Ideal current source (`3A`)

Disc r 46 fill `#e29e7a`, stroke `#0c234c` 10; mauve upward arrow (`M 0 24 V -20 M -14 -6 L 0 -22 L 14 -6`, 6 px); label `3A` to the right, ≥ 24 px from the keyline.

### Charge disc (flow carrier)

Disc r 22 fill `#e29e7a`, keyline `#f6eeeb` +12, navy "+" cross (`M -10 0 H 10 M 0 -10 V 10`, 6 px). Animate carriers along the wire path with `motionPath` or by tweening `x`/`y` between explicit nodes (finite repeats only).

### Cylinder (3-D conductor)

```html
<g id="cyl" transform="translate(640,760)">
  <rect x="-200" y="-72" width="400" height="144" fill="url(#gCond)" />
  <!-- body -->
  <ellipse cx="200" cy="0" rx="32" ry="72" fill="url(#gCap)" stroke="#f6eeeb" stroke-width="6" />
  <!-- slate end cap, paper keyline -->
  <!-- 3+ carriers: orange discs with navy cross, r 22 -->
</g>
```

Add the shadow copy (+8,+10, `#bab9c7`) and a paper keyline behind it (§1). The left edge ellipse is half-hidden: draw `path d="M -200 -72 A 32 72 0 0 0 -200 72"` stroke `#bab9c7` 6.

### Node / junction

Disc r 9 fill `#0c234c`, keyline: another disc r 15 fill `#f6eeeb` behind it.

### Dashed divider (x 1020, y 230–930)

`<line x1="1020" x2="1020" y1="230" y2="930" stroke="#bab9c7" stroke-width="6" stroke-dasharray="18 14" stroke-linecap="round"/>`

### Placeholder slot

Rect `#bab9c7` full opacity, dashed `#60638f` outline (6 px, `10 8`). Hide it (`opacity:0`) once the clone has landed centred in it.

### Graph (right panel example, origin 1120,860)

```html
<g id="graph">
  <path
    d="M 1120 860 H 1700"
    stroke="#0c234c"
    stroke-width="14"
    stroke-linecap="round"
    fill="none"
  />
  <!-- x axis -->
  <path
    d="M 1120 860 V 300"
    stroke="#0c234c"
    stroke-width="14"
    stroke-linecap="round"
    fill="none"
  />
  <!-- y axis -->
  <polygon points="1724,860 1692,844 1692,876" fill="#0c234c" />
  <!-- solid arrow heads -->
  <polygon points="1120,276 1104,308 1136,308" fill="#0c234c" />
  <path d="M 1200 860 v -16 M 1280 860 v -16 ..." stroke="#0c234c" stroke-width="6" />
  <!-- ticks -->
  <path id="area" d="M 1120 860 C ... L 1640 860 Z" fill="url(#gArea)" />
  <!-- area under curve -->
  <path
    id="curve"
    d="M 1120 860 C ..."
    fill="none"
    stroke="#1c3d7d"
    stroke-width="10"
    stroke-linecap="round"
    pathLength="1"
  />
  <text class="v ctr" x="1700" y="900">t</text>
  <!-- axis labels: KaTeX_Math italic -->
</g>
```

### Mesh loop

`python3 scripts/loop_points.py CX CY R` prints the 41-point polyline (clockwise, 225° start, 290° sweep) and a tangent arrowhead. Mesh 1 stroke `#1c3d7d`, mesh 2 `#60638f`, 10 px, mauve `#a1808e` arrowhead. Keep R in v1 _proportion_ to the resistor (≈ 1.5–2 × its 112 px width), re-derived for the left stage (x 120–1000).

### Scan beam

Mauve `#a1808e` 14 px band along the circuit perimeter, paper keyline +12, navy `#0c234c` hard shadow offset (+8,+10) (**not** a glow); dash technique via `pathLength`.

## 3. Text

```css
.lbl {
  font-family: KaTeX_Main;
  font-weight: 700;
  font-size: 48px;
  fill: #0c234c;
  color: #0c234c;
  text-shadow: 4px 5px 0 #bab9c7;
}
.v {
  font-family: KaTeX_Math;
  font-style: italic;
  font-weight: 400;
}
sub {
  font-family: KaTeX_Main;
  font-size: 0.62em;
  vertical-align: -0.24em;
}
```

SVG `<text>` doesn't take `text-shadow` in all engines: for SVG labels draw the shadow as a second `<text>` at (+4,+5) in `#bab9c7` under the real one, or use HTML text positioned over the SVG. Centre-anchor with `.ctr` + one `gsap.set(".ctr",{xPercent:-50,yPercent:-50})` (HTML only; for SVG text use `text-anchor:middle; dominant-baseline:central`).

Placement: title 64 px / subtitle 36 px at x 120 (y 90–190). Left stage x 120–1000, right panel x 1040–1800, content band y 230–930, step line y 940–990, watermark `@MAE.Academy` once (96 px, `#0c234c`, opacity .07, centre ≈ 560,560).

## 4. Transition rigs (§6.1)

Every scene boundary uses one; each is a timeline segment, seekable, 0.6–1.0 s, not the same twice in a row. Rigs live on a full-canvas overlay layer above the scenes; rest state is inside the safe area.

| ID                  | Rig                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1 Page turn        | Parent `perspective:1800px`. A `#bab9c7` sheet (keyline + shadow) with `transform-origin:0 50%`; `fromTo rotationY 0→-90`, `power3.inOut`, 0.9 s; next scene already beneath. Cue `snap` at 0.45 s.     |
| T2 Lift & drop      | Outgoing group `y:-40, scale:1.04` while its shadow copy translates (+8,+10)→(+22,+28); then drops/fades; incoming `y:+120→0` with `back.out(1.6)`, 0.8 s.                                              |
| T3 Scissor cut      | Diagonal band `#1c3d7d` + navy keyline, a `clip-path: polygon()` animated across (tween a `p` object and set the polygon in `onUpdate`, still pure of time); uncovers next scene. 0.7 s `power2.inOut`. |
| T4 Shape morph      | `attr:{d}` between two paths with **identical point count and topology**; else use T2. 1.0 s `power3.inOut`.                                                                                            |
| T5 Parallax         | Background/mid/front layers move at 1.0 / 1.3 / 1.6 × speed; front layer's shadow is the largest. 0.8 s `power3.inOut`.                                                                                 |
| T6 Charge-flow wipe | A row of charge discs (§2) travels across at staggered y; a paper sheet follows in their wake, uncovering the next scene. 1.0 s `power2.inOut`.                                                         |

Audio at a transition: one `click` or `snap` at its midpoint, or none.
