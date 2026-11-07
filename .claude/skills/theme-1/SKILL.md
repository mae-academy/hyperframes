---
name: theme-1
description: "MAE Academy Theme 1: the complete house style for vertical math and engineering reels (1080x1920 at 60 fps, UHD export), distilled from every reel built in the founding session. Load it when the user types /theme-1 followed by an idea. It fixes the palette (#0A0A10 ground, #0088FF, #FF0044, #B026FF, #FFFFFF, no yellow), KaTeX math-italic typography, the zone layout, the hook / extraction / recorded-history / lock / CTA patterns, the effects library, the Connected Living Sounds, the watermark policy (brand watermark yes, drifting platform badges no) and the build, verify and export gates, so a new idea comes out identical in design to the existing reels."
metadata:
  internal: true
---

# /theme-1: the MAE Academy reel style

The user writes `/theme-1`, then the idea. Your job: make that idea look, move and sound exactly like the
reels already built in this repo. Do not invent a new look. Read this file, `tokens.json` next to it, and the
nearest reference project, then build.

**Design tokens:** `tokens.json` (this folder). **Style lint:** `node .claude/skills/theme-1/theme1-lint.mjs reels/NAME`.
**Sound spec:** `reels/prompts/connected-living-sounds.md`. **Final export:** the `/export-4k` skill.

## The reels this style was distilled from

| Project (under `reels/`) | What it is                                                                                                                                                         | Use it as the base when                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `exp-derivative`         | 21 s, derivative of e^x as a sliding slope sensor; circuit-lab template: crossed-out hook card, number-extraction mechanic, matrix card, CTA panel                 | the idea is numbers moving from a figure into a table  |
| `ghost-derivative`       | 15 s, dual tracer: red f' traces on top of blue f with 0.000 percent deviation (asserted at build)                                                                 | the idea compares two curves                           |
| `immortal-fused`         | 16 s, scanner plus constant-subtangent triangle                                                                                                                    | geometry that locks and clamps                         |
| `immortal-motion`        | 15 s, the triangle in motion: point rides the curve while the base stays rigid; live HUD and table; one persistent glass card                                      | DOM plus GSAP explainers with live tables              |
| `fourier-square`         | 22 s, epicycles building a square wave: canvas drawn from time (hf-seek), recorded-history trace, spectrum panel, lock effect, simulator CTA with oversized cursor | anything that is a sum, a simulation or per-frame math |

The visual reference for epicycles is a Fourier-epicycle video the user supplied: two-line header, big counter,
formula, circle chain on the left with a dot on a dashed connector, wave scrolling left, dashed target in the
background, watermark across the middle, ending on a handle card. The reels above reproduce that on our palette.

## Canvas, time and runtime

- 1080x1920, 60 fps, root `data-composition-id="main"`, one paused GSAP 3.12.5 timeline on `window.__timelines["main"]`.
  UHD is a render flag, not a different design: `render --resolution portrait-4k` gives 2160x3840.
- Per-frame maths (circles, scrolling traces, particles, spectrum) is drawn on a canvas from `hf-seek` time only;
  text, counters and cards are GSAP. Canvas backing store uses `devicePixelRatio`. A pure function of time, never of the
  previous frame. Seed any randomness with mulberry32.
- Never: `Date.now`, unseeded random, timers, network at render time, tweens of left / top / width / height
  (use x, y, scale, rotation), CSS transforms on GSAP-animated elements, bounce or elastic eases.
- GSAP is loaded from cdnjs in `index.html` (the spec); the sandbox blocks cdnjs, so `build.mjs` also writes
  `dist/index.html` with a vendored copy and everything is checked and rendered from `dist`.

## Palette (no other colour, ever)

Ground `#0A0A10` with a `#161622` grid (2 px lines every 60 px). Plate `rgba(30,30,46,.52)`.
Electric Blue `#0088FF`: the function, the value, the base curve. Flame Red `#FF0044`: the hook, the title, sensors,
traces, the key CTA line. Neon Purple `#B026FF`: derived or shared quantities, fusion, the lock, subtitles.
White `#FFFFFF`: text and the tracing dot (60 percent for tertiary, 70 percent for handle lines).
**Forbidden: yellow, green, orange, any other hue, platform gradients.** A yellow tip dot in a reference becomes white
with a red core; an Instagram glyph becomes a plain white outline.

## Typography: KaTeX math italic only

- Every formula and every word is KaTeX, rendered at build time (0.16.11, vendored fonts, `strict: "error"`).
- Math italic everywhere. Never `\mathbf`, `\mathrm`, `\text` (upright) or CSS to force upright. Prose is `\textit{...}`
  in capitals. The only bold item is the title: `\textbf{\textit{...}}` (bold italic). Digits stay upright (KaTeX default).
- Sizes: title 58 px red at y about 180 to 200; subtitle 34 to 46 px purple; counters 84 px; matrix values 42 px;
  labels 24 px; nothing under 20 px.
- Contrast gate: blue or purple text under 24 px fails 4.5:1. Exponents are 0.7 of the font size, so a blue or purple
  exponent needs a base of at least 35 px; otherwise colour only the base glyphs and leave the exponent white.
- Do not name your own CSS classes `.base`, `.strut`, `.mord` or any other KaTeX class (a `.base` rule once dimmed
  every formula to 40 percent).

## Layout (centred at x = 540, safe x 90 to 990, nothing below y 1670)

1. **Header**, y 110 to 330: title, subtitle, a 120x3 gradient rule (red, purple, blue).
2. **Arena**, the picture: plate 900 wide with radius 32, or the open canvas for simulations (axis arrow, dashed
   ghost target, baseline). Brand watermark behind it (see below).
3. **Counter and formula** (simulations): the counter (for example N = 7) above a blue formula whose limits change with it.
4. **Spectrum or table panel**: glass card (radius 28 to 36, `rgba(30,30,46,.55)`, 1 px border).
5. **Banner**: 820 wide, 90 to 100 high, radius 24, fill `rgba(255,0,68,.08)`, 2 px border `rgba(255,0,68,.55)`, bottom at
   most y 1665. One caption per stage; swaps are 0.15 s out, 0.075 s overlap, 0.15 s in.
6. **CTA**: one persistent glass card; its content cross-fades; it never shows blank.

## Patterns that must be reused

- **Hook (first 1.6 s).** Frame 0 is the most impressive image: either the finished result with its lock effect
  (fourier-square) or the crossed-out failures (exp-derivative, immortal-motion). A question in the banner, an opening
  thump, then, if frame 0 was the result, a glitch rewind (counter ticks down, chromatic split) into the build-up.
- **Stages.** Content grows in steps (N = 1, 3, 7, 15, 50, infinity). Each step: counter pop with back.out(2),
  caption swap, new components grow in one after another, one soft bell on a pentatonic scale.
- **Recorded history.** A scrolling trace is a record: every point keeps the shape it had when it was drawn. A change
  (a new harmonic) affects only new points. Compute each point from its own draw time, not from the current state.
- **Extraction mechanic** (circuit-lab template): a number leaves its component (pop 2.5x, glide, drop) into the banner
  term and then into its cell; the original is hidden while the clone flies and returns when it lands; never two copies.
- **Lock effect** at the climax: sweep line across the picture, corner glints, seeded sparks, two shock rings, glow
  flash, check mark drawn with stroke-dashoffset, counter pulse. The sweep recolours, it never reshapes.
- **Live tables and HUDs** are stacked readouts toggled every 0.1 s from values generated at build time with the same
  easing law as the tween; assert at build that the numbers match the maths (the build fails if they do not).
- **CTA.** Glass card, line 1 red (the ask), line 2 blue with a down arrow, a handle row (icon plus @MAE.ACADEMY),
  and for the simulator an oversized cursor (house style, `.claude/skills/oversized-cursor`) that enters from off-screen,
  presses the button, and drags a slider from N to infinity. No website address is invented: it says LINK IN BIO
  unless a `SITE_URL` is supplied to the build.
- No emoji: icons are small SVG in palette colours (bookmark red, lock white with purple glow, check white).

## Watermark policy

- **Yes:** the brand watermark `@MAE.Academy`, red at about 12 percent opacity, large, behind the picture, marked
  `data-layout-ignore` (texture, not reading text). The handle row inside the CTA card.
- **No:** drifting corner badges (Instagram glyph plus handle) hopping between corners. They were removed on request.
- Nothing in the picture, the file or the sound names the tools that made it (see `/export-4k`).

## Sound: Connected Living Sounds

Follow `reels/prompts/connected-living-sounds.md` exactly. Summary: continuous layers first (50 Hz hum at minus 22 dBFS,
open-fifth pad that gains the major third at the lock, additive voice that is the partial sum on screen, 1/sqrt(k)
clarity layer, air), then accents (click, tick, snap, thump, band-limited square-wave stab at the opening and the lock),
a damped ping at the frequency of every component that joins, bells per stage. Pleasant, not piercing: voice
low-pass 7.5 kHz, clarity low-pass 5 kHz, stab low-pass 4.5 kHz. Cues live in a `CUES` block in `anim.js` between
`@CUES-BEGIN` and `@CUES-END`; every cue must have a visual event and every visual accent a cue (verify.mjs probes each).

## Project shape and commands

A reel is a folder under `reels/` with: `build.mjs` (KaTeX, maths assertions, single-file `index.html`, plus `dist/` with
vendored GSAP), `anim.js`, `measure.mjs` (measured layout and exported cues), `verify.mjs` (snapshots and cue probes
on the dist page; seeks the timeline and sends `hf-seek`), `scripts/make_sfx.py`, `build.sh` (two-pass build),
`.gitignore` (assets/sfx.wav, assets/cues.json, assets/sched.json, layout.json, snapshots, dist, out, mp4, render work folders: all generated by the build, so they never show up as uncommitted noise). Copy the nearest reference project and replace the content.

```bash
cd reels/NAME && ./build.sh && python3 scripts/make_sfx.py && node verify.mjs
node .claude/skills/theme-1/theme1-lint.mjs reels/NAME
cd reels/NAME/dist && npx -y hyperframes@0.9.19 check
```

Gates before anything is shown: build asserts pass, theme1-lint PASS, verify reports 0 mismatches and no page errors,
`hyperframes check` has 0 errors. Preview quickly at 1080p (`render` without the resolution flag). Final: `/export-4k`.

## Repository rules that bite

- Package manager is bun; the root package.json is `"type": "module"`, so a vendored UMD file must be named `.cjs`.
- Lint and format with `node_modules/.bin/oxlint` and `node_modules/.bin/oxfmt`; the pre-commit hook also runs the repo
  build, lint and typecheck (run `bun install` first in a fresh clone).
- Conventional commits (feat, fix, docs, chore), no model name anywhere in a commit, code or file. The large-file hook
  rejects any non-LFS file over 500 KB: keep review snapshots at 720x1280 and never commit mp4 (outputs are ignored).
- Long renders run with the background option of the shell tool, not with a trailing ampersand.
- Contrast, text_occluded and canvas-at-edge findings: mark decorative text `data-layout-ignore` and intentional
  scrolling canvases `data-layout-allow-overflow`; fix everything else.

## Starting a new reel from an idea

1. Read this file and `tokens.json`; open the closest reference project.
2. Decide the archetype (DOM plus GSAP, or canvas simulation), the stages, the one variable the sound will follow,
   the hook (what is on screen at frame 0), the lock moment, the CTA target.
3. Write the maths first and assert it in `build.mjs`.
4. Build, run every gate, show a 1080p preview, then run `/export-4k` for the 4K master.
5. Commit and push the sources (no mp4). Report what was checked and what was not (for example, sound that was
   analysed but not listened to).
