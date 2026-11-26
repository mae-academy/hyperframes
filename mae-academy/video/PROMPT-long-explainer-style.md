# Prompt: long-form engineering explainer (MAE Academy style)

Use this as the brief for Claude + HyperFrames. Replace the `[...]` slots.

---

Build a **long-form educational explainer video** about **[TOPIC, e.g. Modified D-H parameters]** with HyperFrames
(HTML rendered to video). Read `/hyperframes`, `motion-doctrine` and `cut-the-curve` first. No voiceover and no mascot
unless I ask: the picture, the on-screen Arabic text and the sound effects carry everything.

## 1. What the video is

- **Length / format:** 2.5 to 3 minutes, **1920x1080 landscape**, 30 fps while iterating, **60 fps** for the final render. YouTube-style, but it must stay readable on a weak projector (Data Show): large type, thick lines, high contrast.
- **Audience:** a weak robotics student, even a child who has never seen a robot. Every symbol is introduced by what it _does_ before its name. One idea per scene; nothing appears before it is named.
- **Language:** Arabic (light Jordanian tone, simple), with the technical terms kept in English (`Link length`, `Frame`, `Joint`). Short sentences, at most about 12 words per caption.
- **Spine (always the same):**
  1. Hook: a concrete question the viewer already has ("where is the robot's hand?").
  2. Setup: build the object piece by piece (link, two joints, axes, frames). Never show a finished diagram at once.
  3. **One continuous diagram** that transforms step by step. Each step is one parameter/concept, in this loop: card swaps in, camera turns to face it, a value counter runs, the main motion plays, the counter lands (check mark + soft click), a short demo of the edge case (e.g. value = 0), then the plain-language name.
  4. Recap: replay all steps quickly and land on the final state.
  5. Summary table (taken from the textbook).
  6. **Worked example** from the textbook, table filled row by row while the object moves.
  7. Outro: one line that states the whole idea, brand card.

## 2. Visual style

- **Background:** light, never pure white: soft blue-white gradient (`#F6F9FF` to `#E4EDFD`) plus a faint 3D floor grid.
- **Brand palette, semantic:** ink navy `#0B1F3A` (text, X axes), blue `#1565FF`, purple `#7A3CFF`, orange `#F26B00`, green `#00945E`, red `#E5173F` (Z axes), gold `#FFC21A`, teal `#18B5C8`. One color per concept and it never changes meaning (e.g. a = blue, alpha = purple, d = orange, theta = green).
- **Type:** IBM Plex Sans Arabic for Arabic and Inter for Latin. Body captions about 50 px, titles 90 to 160 px, nothing below 28 px. Captions sit in a white rounded card, bottom-left, RTL.
- **All math in LaTeX** (MathJax, rendered to SVG paths, no font files), in captions, cards, counters and inside the 3D scene. Every inline symbol is an LTR isolate (`dir="ltr"`, `unicode-bidi:isolate`), and Arabic connector words between symbols are isolated too, or the order flips.
- **Lines:** uniform stroke weights, no sketchy wobble. Arrow heads and dashed helpers use the concept color.
- **Cards and panels:** white, thick colored border, soft shadow. Right column: parameter card, step dots, live value counter, small legend.
- **The 3D look:** objects are flat-shaded solids (steel body, gold rotating head, teal link) on a gridded floor, drawn by a small SVG 3D engine (projection, cylinders, light/dark side) driven by a GSAP timeline.

## 3. Motion

- **Camera with intent.** Slow orbit while building. For every concept the camera eases (2.5 to 3.8 s, `power2.inOut`) to the view that shows it face-on: along an axis for a twist, from above the axis for a rotation, front view for a distance. No hard cuts between views.
- **A travelling transparent copy.** A dashed, semi-transparent copy of the previous object rides with the moving frame and ends exactly on top of the real next object. It carries a marker so rotation about its own axis is visible.
- **Doctrine rules:** scene-to-scene cut-the-curve in one direction (left), 230 px partial travel, mirrored `power4` eases; every scene arrives **already composed** at its first frame; no idle wobble (every second must either reveal, move the camera or run the demo); 0.3 to 0.75 s stillness before a result lands; staged word-by-word caption cascade with shrinking gaps; no bounce or elastic eases.
- Labels are small pills near what they name and fade when they would overlap something; arrows never start as zero-length dots.

## 4. Sound (no voiceover)

Sound effects only, each tied to a visible action: soft whoosh on camera moves and cuts, pop on cards and labels, click on measurements, soft servo whirr under motions, a click when a value lands, sparkle on the final alignment, one riser into the final impact. Levels: effects at 0.2 to 0.5, nothing clips (peak below -1 dBTP). No chimes or dings. Music only if a real source exists.

## 5. Quality gate and render

1. `npx hyperframes lint` and `check` must pass with 0 errors; snapshot every phase and every seam; fix label overlaps, clipped labels, stray dots and unreadable text before rendering.
2. Check the first frame of every scene is not empty.
3. Preview render: 24 fps, `-q draft`, in parallel segments (`HYPERFRAMES_RENDER_LOCK=off`, `--start/--end`, whole-second segments), then concat.
4. Final: 1080p, 60 fps, `-q delivery`, segments of 8 s run 8 at a time with retries, concat with stream copy, verify duration, frame count and audio peak.

## 6. Content rules

- Use the textbook's convention and symbols exactly (here: Modified D-H, alpha(i-1), a(i-1), d(i), theta(i)). Correct textbook typos silently and tell me.
- Every claim traces to the source figure/table; numbers shown on screen come from one data object.
- End on the one idea in one line.

Topic: **[TOPIC]**. Source material: **[attached pages / figures]**. Worked example: **[example number]**.
