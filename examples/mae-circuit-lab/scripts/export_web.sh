#!/usr/bin/env bash
# Web export: yuv420p, +faststart, even dimensions, container tags stripped.
# Usage: scripts/export_web.sh renders/mae-circuit-lab-raw.mp4 renders/mae-circuit-lab-web.mp4
set -euo pipefail
IN="${1:?input mp4}"; OUT="${2:?output mp4}"
ffmpeg -y -v error -i "$IN" \
  -map 0:v:0 -map 0:a:0? \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" \
  -c:v libx264 -preset slow -crf 18 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -map_metadata -1 -map_chapters -1 -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -movflags +faststart+use_metadata_tags "$OUT"
# strip leftover container tags (title/encoder/handler names) without re-encoding
TMP="${OUT%.mp4}.tmp.mp4"
ffmpeg -y -v error -i "$OUT" -c copy -map_metadata -1 -fflags +bitexact -flags +bitexact -metadata:s:v handler_name= -metadata:s:a handler_name= -movflags +faststart "$TMP" && mv "$TMP" "$OUT"
ffprobe -v error -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,duration -show_entries format=duration:format_tags -of default=nw=1 "$OUT"
