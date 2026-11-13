---
name: mae-paper-explainer
description: MAE Academy paper-cut-out explainer videos built from a narration audio file. Use when the user supplies a voice recording (or says "MAE style", "paper cut-out", "athar style", "ستايل MAE") and wants a complete 1920×1080 educational video (circuits, control, power, graphs, equations) in the v2.0 palette with keylines, hard shadows and the T1–T6 transition library. Overrides the generic /hyperframes look; keeps its render contract.
---

# MAE Paper Explainer

A dedicated variant of `/hyperframes` for ONE look: flat paper pieces, white keylines, hard offset shadows, on `#f6eeeb` paper. Every session using this skill makes this style only. **The user gives the narration audio; you build the entire video from it.**

Load `/hyperframes` and `/hyperframes-cli` first for the render contract and the CLI. This skill changes the **look, layout, sound and pipeline**, not the contract.

## Precedence

1. `references/style-spec.md` (MAE spec v2.0, verbatim from the user) wins on **look**: palette, shapes, keylines, shadows, typography, layout, transitions.
2. The `/hyperframes` contract wins on **render mechanics** (`class="clip"`, `data-start`/`data-duration`, paused timeline, determinism).
3. Where they collide, the resolutions below apply. State any other conflict in the delivery note, as the spec's master prompt demands.

### Known collisions, already resolved

| Spec says                                         | Hyperframes says                              | Follow                                                                                                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One `index.html`, everything inline               | Scenes as sub-compositions in `compositions/` | **One `index.html`** (spec §0). Scenes are `<g>`/`<div>` groups with `class="clip"` + `data-start`/`data-duration`.                                                                                                                           |
| Root `data-duration` = exact audio length         | Same                                          | Same. Probe the audio with `ffprobe`; use its exact duration.                                                                                                                                                                                 |
| Audio = baked `assets/sfx.wav` of oscillator cues | Music bed + effects by default (`sound.md`)   | Spec §7: **no music bed, no noise**. Final mix = **user's narration + `sfx.wav`** as two `<audio id>` tags. Narration ~1.0, sfx ~0.35.                                                                                                        |
| `Math.random`, `Date` banned                      | Same                                          | Same.                                                                                                                                                                                                                                         |
| No CSS filters / blur / glow                      | `media-treatment` for footage filters         | There is no footage in this style; no filters at all.                                                                                                                                                                                         |
| Fonts from `assets/fonts/` (KaTeX)                | Only bundled fonts resolve by name            | `@font-face` to local KaTeX woff2 (step 2 below).                                                                                                                                                                                             |
| Safe area x 120–1800, y 90–990                    | 90% action-safe box                           | Spec is tighter; use the spec.                                                                                                                                                                                                                |
| Captions: not mentioned                           | Optional                                      | **No captions** unless asked. The step line (y 940–990) carries short text.                                                                                                                                                                   |
| Narration language                                | —                                             | **Fixed language policy (user rule):** ALL on-screen text, labels, step lines and captions are **English** (KaTeX fonts suffice; no Arabic font needed). The narration is a **Jordanian Arabic** voiceover, never rendered as on-screen text. |

## Language policy (fixed)

- **On-screen**: English only (titles, labels, equations' words, step line, any captions).
- **Narration**: Jordanian Arabic voiceover (colloquial, Zarqa/Amman register; technical terms such as _current, voltage, mesh_ may stay in English where an engineer would say them). Arabic is **spoken, not displayed**.
- **Script section for recording**: every scene in `script.md` carries two separate lines, never merged:
  - `Narration (Jordanian Arabic):` what the user records.
  - `On-screen text (English):` exactly what appears, in order of appearance.
- Keep the two independent: the English text is not a translation to be read aloud, and the Arabic is not shown.

### `script.md` format (write this first when no audio exists yet, or reconstruct it from the transcript)

```
## Scene 3 — Supermesh constraint   (≈ 14 s, transition in: T3)
Narration (Jordanian Arabic): <text to record>
On-screen text (English): "Constraint: I₂ − I₁ = 3A" · step line: "Current source shares both meshes"
Visual: <what is drawn, which components, which colour roles>
```

No audio yet → deliver `script.md` and stop for recording. Audio given → verify it matches `script.md` (transcribe) and build; if the recording diverges, the **audio wins** and the on-screen text follows what was actually said.

## Pipeline: audio in → video out

1. **Probe** the audio: `ffprobe -v error -show_entries format=duration -of csv=p=0 <audio>`. Copy it to `assets/narration.<ext>`.
2. **Scaffold**: `npx hyperframes init <dir>`; then `bash <skill>/scripts/fetch-katex-fonts.sh <dir>/assets/fonts` (copies KaTeX_Main-Regular/Bold, KaTeX_Math-Italic woff2 from `node_modules/katex` if present, else downloads KaTeX 0.16.8 from cdnjs at authoring time; never at render).
3. **Transcribe with word timestamps**: `npx hyperframes transcribe assets/narration.* --json`. Write `script.md` (format above, one block per scene) and `beats.md`: one row per teaching beat = `start s | end s | anchor word | what appears | transition`. **Text and shapes land on the word that says them** (`sound.md` §2: narrated, the voice is the clock).
4. **Storyboard in the spec's phases**: A Intro · B Setup · C Scan · D Leap/Constraint · E Resolution (compress or drop phases a topic doesn't need; keep the order). One scene per phase or concept. Each scene boundary gets **one** transition T1–T6 (§6.1: 0.6–1.0 s, never the same twice in a row; T4 only with matching point counts).
5. **Fill the spec's master prompt (§10)** mentally for this topic: title/subtitle, left stage vs right panel content, component list with id/type/value/colour role, equations, solution, audio cues, transitions. Show the user this filled brief **only if the topic is ambiguous**; otherwise proceed.
6. **Build `index.html`** using `references/components.md` (paper triple-copy pattern and component snippets). Re-derive all coordinates on the landscape two-panel grid (spec §1); never copy portrait numbers.
7. **Sound**: write `assets/cues.json` (`[{"t":12.40,"cue":"click"}, ...]`), then `python3 <skill>/scripts/make_sfx.py assets/cues.json assets/sfx.wav --duration <audio duration>`. Cue times = animation event times; a transition cue sits at its midpoint; only `click`/`snap` (+ `tick`/`thump` if the user opts in).
8. **Gate**: `npx hyperframes lint` and `npx hyperframes check --json` (0 errors; WCAG contrast is enforced). Then `npx hyperframes snapshot --at <6–10 timestamps incl. every transition midpoint and the last frame>` and **look** at them for: safe area, keylines present, shadows (+8,+10), overlaps (labels ≥ 24 px apart), palette-only colours, no yellow, component details (§5.3).
9. **Walk the §9 checklist** line by line, fixing before rendering.
10. **Render** (`npx hyperframes render`), then `ffprobe` the MP4: 1920×1080, duration equals narration length, audio stream present. `npx hyperframes audio <mp4> --json` for levels. Report measured, not heard.
11. **Delivery note** (short): what was built, check/ffprobe summary, any spec-vs-brief conflict and which side won, and anything interpreted (e.g. §4.2 gradient reading).

## Design discipline (the user cares about these details; do not deviate)

- **Components must be detailed and instantly readable.** At least three legible details each (spec §5.3): resistor = peach body + four colour bands + navy leads; battery = orange "+" cap, grey "−" cap, blue body, mauve direction arrow; cylinder = grey gradient body + slate end ellipse + orange charge discs with navy "+"; graphs = navy axes with triangular heads and ticks, blue curve, orange/peach area. No component may be a bare outline.
- **Every L2 object is three stacked copies**: shadow (+8,+10), keyline (stroke + 12, `#f6eeeb`), object. Light pieces cast `#bab9c7`, dark pieces `#60638f`. No `filter`, no blur, no glow anywhere.
- **Palette is closed** (§4.1, eight tokens). No yellow, no white, no off-palette shadow or anti-alias tint. Gradients only from the §4.2 pairs, two-stop, 90° linear.
- **Text**: KaTeX_Main Bold upright for words; `.v` (KaTeX_Math) for variables; navy/blue only (slate ≥ 24 px); labels carry `text-shadow: 4px 5px 0 #bab9c7` and nothing else.
- **The DC power rail symbol is a T-shape**, never resistor-like (standing user rule).
- **Mascot** is named **MAE** if one appears.
- **Watermark** `@MAE.Academy` once, 96 px, opacity 0.07, behind the left stage; never at the bottom.
- **Grid**: coordinates snap to 8 px; ≥ 40 px between components; one component per cell.
- **Determinism**: pure-function timeline, no `repeat:-1`, `fromTo` repeats need `immediateRender:false`, centre-anchored text via `.ctr` + `gsap.set` once, `svgOrigin` for pulses.

## Files

| File                           | Purpose                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `references/style-spec.md`     | The full MAE spec v2.0, unmodified. Read before every build.                                     |
| `references/components.md`     | Copy-ready SVG for the paper pattern, each component, dividers, graph, loops, transition rigs.   |
| `scripts/make_sfx.py`          | Bakes `click`/`snap`/`tick`/`thump` (pure oscillators, no noise) from a cue list into `sfx.wav`. |
| `scripts/fetch-katex-fonts.sh` | Places the three KaTeX woff2 files locally.                                                      |
