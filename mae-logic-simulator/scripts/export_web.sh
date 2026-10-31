#!/usr/bin/env bash
# Standard web-delivery export: even dimensions, yuv420p (universal playback), +faststart
# (moov atom first, so playback starts before the download finishes), 60 fps CFR, AAC 192k,
# and no extraneous container tags (smaller file). Usage: scripts/export_web.sh [in.mp4] [out.mp4]
set -euo pipefail
IN="${1:-preview.mp4}"
OUT="${2:-mae_logic_simulator_web.mp4}"
ffmpeg -v error -y -i "$IN" \
  -map_metadata -1 -map_chapters -1 \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -r 60 \
  -c:a aac -b:a 192k -movflags +faststart \
  "$OUT"
ffprobe -v error -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_frames,duration -of compact "$OUT"
