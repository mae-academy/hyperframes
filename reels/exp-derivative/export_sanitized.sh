#!/usr/bin/env bash
# Final MP4: 4 px micro-crop (scaled back to 1080x1920), -14 LUFS, all metadata stripped.
# usage: ./export_sanitized.sh [raw.mp4] [final.mp4]
set -euo pipefail
cd "$(dirname "$0")"
RAW="${1:-out/raw.mp4}"
OUT="${2:-out/the-e-to-x-trick.mp4}"
ffmpeg -y -hide_banner -loglevel error -i "$RAW" \
  -vf "crop=1072:1912:4:4,scale=1080:1920:flags=lanczos,setsar=1" \
  -af "loudnorm=I=-14:TP=-1.0:LRA=7" -ar 48000 \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 60 \
  -c:a aac -b:a 192k \
  -map_metadata -1 -map_chapters -1 -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -movflags +faststart "$OUT"
echo "wrote $OUT"
