---
name: export-4k
description: "Final export for MAE Academy reels: 2160x3840 at 60 fps, with every trace of the tools that made the file removed from the picture, the container and the sound, and an audit that proves it. Load it when the user types /export-4k (optionally with a project and an approved audio file) or asks for the final, clean, 4K, sanitized or fingerprint-free export. It runs build, theme-1 lint, cue verification, hyperframes check, the 4K render, the clean-export pipeline (visual pixel-grid break, metadata and encoder-string removal, H.264 SEI removal, neutral handlers, optional bit-identical audio) and audit-clean.sh."
metadata:
  internal: true
---

# /export-4k: the clean 4K 60 fps master

Use after the reel passed its gates (see `/theme-1`). One command does everything; the audit decides if the file is clean.

```bash
# long: start it with the shell tool's background option, then wait for the notification
.claude/skills/export-4k/export-4k.sh reels/NAME [approved_audio.mp4] [out_name.mp4]
```

- No second argument: `assets/sfx.wav` is regenerated, mastered to -14 LUFS (two-pass loudnorm) and encoded.
- With an approved audio file (the version the user already listened to): its audio stream is **copied byte for byte**.
  No filter, no loudnorm, no re-encode, so the sound stays exactly what was heard. The script proves it with a stream hash
  when you compare the two files (the audio MD5 of the approved file and of the final must be equal).
- Output: `reels/NAME/out/NAME_4k60_FINAL.mp4`. `out/` is git-ignored; send the file to the user with the file tool.

## What the pipeline does (in order)

1. `build.sh` (two-pass build: KaTeX, maths assertions, measured layout), `make_sfx.py` unless audio is approved.
2. `theme1-lint.mjs`: palette, math italic, determinism, watermark policy, audio continuity.
3. `verify.mjs`: every cue has a visual event, no page errors.
4. `hyperframes check` on the dist page: 0 errors required.
5. Render: `render --resolution portrait-4k --fps 60 --quality delivery` (GSAP vendored because cdnjs is blocked in the sandbox).
6. `reels/export_final_clean.sh raw approved_audio_optional`:
   - Picture: micro-crop of 4 px per 1080 px of width, Lanczos rescale back to full size, 1 percent temporal noise
     (breaks the pixel grid), a hair of contrast, brightness and saturation.
   - Container: all metadata and chapters dropped, bitexact muxing (no muxer version tag), `exiftool -all=`,
     neutral handler names (VideoHandler, SoundHandler).
   - Inside the video: H.264 SEI units removed (x264 writes its settings string there).
   - Sound: stream copy of the approved audio, or highpass 40 Hz, lowpass 19 kHz and two-pass loudnorm to -14 LUFS, TP -1.5.
7. `audit-clean.sh`: see below.

The raw render carries tags such as `hyperframes_version`, `hyperframes_renderer` and `encoder=Lavf...`; the final must not.

## The audit (`audit-clean.sh final.mp4 [WIDTHxHEIGHT] [FPS]`)

Fails the export if any of these is present:

- video not H.264 at 2160x3840 and 60 fps, a missing audio stream, or more than two streams;
- a container or stream tag other than language, vendor id, brand fields and the two neutral handler names;
- tool strings anywhere in the file (lavf, lavc, libx264, x264, ffmpeg, hyperframes, chromium, puppeteer, playwright,
  encoder, software, gsap, katex, and similar);
- C2PA, JUMBF, XMP, EXIF or ID3 blocks, or extra fields in exiftool;
- decode errors, and it reports the loudness (target -14 LUFS).

Also run `node .claude/skills/theme-1/theme1-lint.mjs reels/NAME` (already part of the script): it keeps visible marks out of
the picture (no drifting platform badges) and checks the sound is continuous and not clipped.

## What this does and does not do (say it plainly to the user)

- It removes the traces that **our own pipeline** leaves: tags, encoder and renderer names, x264 settings, handler
  names, metadata blocks; it also breaks the exact pixel grid of the render. The reels are generated from code (HTML,
  GSAP, KaTeX, canvas, synthesised audio), so there is no embedded AI watermark or C2PA record to remove, and the audit
  confirms none is in the final.
- It does not claim to make a file undetectable by any classifier, and nobody tested it against one. Do not promise that.
- It does not touch media made by other generative tools. If a project embeds such media (images, footage, voice),
  tell the user this export does not remove or alter any provenance mark in it, and that the platform's disclosure rules
  for AI content are the user's decision.
- It is not a reason to answer a direct question about how the video was made with anything but the truth.

## Troubleshooting

- `exiftool` missing: `apt-get update` then `apt-get install -y libimage-exiftool-perl` (macOS: `brew install exiftool`).
- Render cancelled with `render_cancelled_parent_exited`: it was started with a trailing ampersand; use the shell tool's
  background option instead.
- `hyperframes check` fails on contrast, `text_occluded` or `canvas_content_at_edge`: see the rules in `/theme-1`.
- A commit is rejected by the large-file hook: the mp4 or a snapshot is over 500 KB; never commit mp4, downscale snapshots.
- Audio is not what the user approved: re-run with the approved file as the second argument (stream copy).
