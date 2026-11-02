#!/usr/bin/env bash
# Clean export: strips container metadata/chapters, trims a 4 px edge and rescales, adds a trace of temporal noise,
# normalises loudness, and writes a faststart yuv420p MP4.
#   ./export_clean.sh                       -> raw_render.mp4 -> mesh_inspection_masterclass_clean.mp4
#   ./export_clean.sh in.mp4 out.mp4        -> explicit paths
set -euo pipefail

INPUT="${1:-raw_render.mp4}"
OUTPUT="${2:-mesh_inspection_masterclass_clean.mp4}"

ffmpeg -y -i "${INPUT}" \
  -map_metadata -1 -map_chapters -1 \
  -vf "crop=in_w-4:in_h-4,scale=1080:1920:flags=lanczos,noise=alls=1:allf=t,eq=contrast=1.01:brightness=0.002" \
  -af "highpass=f=50,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -movflags +faststart \
  "${OUTPUT}"

echo "Clean export complete: ${OUTPUT}"
