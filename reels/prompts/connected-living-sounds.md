# الأصوات الحية المتصلة (Connected Living Sounds)

A reusable sound-design directive for MAE Academy reels. Paste it (or say "use الأصوات الحية المتصلة") together
with a reel's timeline. Reference implementation: `reels/immortal-motion/scripts/make_sfx.py`.

---

## PROMPT

You are the Sound Designer for MAE Academy. Design the audio for the reel below as **connected living sound**:
the track must feel like the picture is breathing. A reel made only of clicks and snaps is a failure.

### Principle

1. **The sound is the picture's body, not its punctuation.** Every moving thing on screen has a continuous voice
   that exists for exactly as long as it moves, and that voice is computed from the same numbers as the motion.
2. **Continuous first, events second.** Build the unbroken layers first; then add discrete hits (click / snap /
   thump) only as accents on top of them. Never the other way round.
3. **No silence, no drone.** There is never a moment without sound (RMS between about -26 and -18 dBFS in every
   0.5 s window), and no layer is static: every layer slowly changes.
4. **Elegant, not goofy.** Pure, warm tones. No cartoon sounds, no slide whistles, no whooshes, no chirps, no
   buzzing saw/square tones, no monotone scanner drone.

### Layers (build all of them)

| Layer                  | What it is                                                                                                                                             | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hum**                | 50 Hz sine, -22 dBFS                                                                                                                                   | Unbroken from 0.0 s to the very end. Never ducked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Pad**                | Open fifths in the reel's key (A2, E3, A3, E4), each note a sine plus a quiet 2nd harmonic, each with its own slow tremolo (0.1 - 0.3 Hz, depth ~20 %) | Gain curve follows the story: soft at the start, swelling toward the climax, settling in the CTA. Add the major third (C#) at the moment the result is confirmed: the tonality turns bright exactly when the claim is proven.                                                                                                                                                                                                                                                                                                                |
| **Voice of the point** | Soft sine + 2nd and 3rd harmonics (0.38, 0.14), as a **detuned pair** (+/- 1.2 Hz) so it shimmers slowly                                               | **Pitch is a function of the on-screen variable**, not of time. Use `pitch(x) = base * ratio^(x - x0)` (reference: 220 Hz * 1.5^(x - 1), a perfect fifth per unit). Drive x with the *same easing law as the animation* (e.g. power2.inOut for the scan, power1.inOut for the flight), so the pitch and the picture move as one. Loudness grows with the quantity on screen (height, magnitude): `0.45 + 0.55 * sqrt(value / max)`. When the object is locked or paused, the voice ducks to ~30 % and holds; when it moves again it resumes. |
| **Air**                | Low-passed noise (one-pole, ~1.8 kHz), about -34 dBFS                                                                                                  | Rides the voice's loudness; present only while something moves. A breath, never a whoosh.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### Accents (discrete events, take the times from the reel's `@CUES` block)

- **click**: 1800 Hz sine, exp decay 3 ms, 15 ms long. A coordinate milestone.
- **snap**: metallic vice lock: 600 Hz body (12 ms decay) + 2400 Hz and 3150 Hz ring (8 ms decay) + a 3 ms noise transient, 50 ms total.
- **thump**: 55 Hz sine, exp decay 45 ms, 250 ms long. A confirmation.
- Give the _important_ accents a musical tail so they belong to the pad: the confirmation thump carries a soft
  arpeggio of the bright chord (A3 C#4 E4 A4 C#5 E5, 45 ms apart, 0.9 s decay); the CTA snap carries a bell pair
  (E5, A5); the final engagement click carries a small high shimmer (A6, C#7).

### Mixing and safety

- Sum of all layers peaks below 0.98 before export (assert it). Typical master: about -14 LUFS after loudnorm.
- All envelopes are smoothed (moving average >= 50 ms) so no layer ever clicks on or off.
- Deterministic: seeded noise (`numpy.random.default_rng(seed)`), no wall-clock, no unseeded randomness.
- Audio is generated from the page's exported cue list (`assets/cues.json`) so that every cue has a visual event
  and every visual accent has a cue.

### Checklist before delivery

1. Plot or print RMS per 0.5 s: no window is silent.
2. The voice's pitch at each key moment matches `pitch(x)` for the x shown on screen at that moment.
3. The tonality changes (third added) on the confirmation beat, not before.
4. No forbidden sound types (see Principle 4). If something sounds like buzzing, lower the voice by 3 dB first.
5. Export with the clean pipeline (two-pass loudnorm to -14 LUFS, TP -1.5).

### Inputs you receive per reel

- The animation timeline (what moves when, and with which easing).
- The `@CUES` block (time, kind) for the accents.
- The variable that the voice should follow (e.g. x) and its range, plus the quantity that controls loudness.
- The musical key (default: A, open fifths A-E, bright third C#).

---

## Reference parameters (immortal-motion, 15 s)

- Voice: `freq = 220 * 1.5^(x - 1)`; scan x -1 -> 1 over 2.0 - 3.2 s (power2.inOut), hold 3.2 - 4.5 s, flight x 1 -> 2 over 4.5 - 8.5 s (power1.inOut), hold after.
- Voice envelope points (s: gain): 1.9: 0, 2.05: 0.8, 3.1: 0.9, 3.3: 0.30, 4.4: 0.30, 4.7: 0.55, 8.5: 1.0, 9.0: 0.7, 9.9: 0.
- Voice master gain 0.085; air gain 0.020; pad notes 0.030 / 0.026 / 0.022 / 0.014 (+0.020 for C#).
- Pad gain curve (s: gain): 0: 0, 0.4: 0.35, 1.5: 0.55, 3.2: 0.8, 8.5: 1.0, 9.5: 1.15, 12.5: 1.0, 14.3: 0.7, 15.0: 0.55.
- Third (C#) gate: 0 until 9.45 s, 1.0 at 9.9 s.
