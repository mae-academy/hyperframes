#!/usr/bin/env bash
# Anti-fingerprint clean export: metadata stripped, 4 px micro-crop + Lanczos rescale,
# 1% temporal micro-noise (fixed seed), -14 LUFS audio.
# usage: ./export_clean.sh [raw.mp4] [final.mp4]
set -euo pipefail
cd "$(dirname "$0")"
RAW="${1:-out/raw.mp4}"
OUT="${2:-out/immortal-function.mp4}"
ffmpeg -y -hide_banner -loglevel error -i "$RAW" \
  -vf "crop=1072:1912:4:4,scale=1080:1920:flags=lanczos,noise=alls=1:allf=t:all_seed=7,setsar=1" \
  -af "loudnorm=I=-14:TP=-1.0:LRA=7" -ar 48000 \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 60 \
  -c:a aac -b:a 192k \
  -map_metadata -1 -map_chapters -1 -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -t 15.0 -movflags +faststart "$OUT"
echo "wrote $OUT"
