#!/usr/bin/env bash
# Metadata-clean export: re-encode with a 4 px crop, trace noise, loudness normalisation; drop container tags; generic handler names.
#   ./export_sanitized.sh [in.mp4] [out.mp4]
set -euo pipefail

INPUT="${1:-raw_render.mp4}"
TEMP="temp_sanitized.mp4"
OUTPUT="${2:-final_clean.mp4}"

# 1. re-encode (no metadata/chapters, bitexact muxing so ffmpeg writes no encoder tag)
ffmpeg -y -i "${INPUT}" \
  -map_metadata -1 -map_chapters -1 \
  -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -vf "crop=in_w-4:in_h-4,scale=1080:1920:flags=lanczos,noise=alls=1:allf=t,eq=contrast=1.008:brightness=0.001:saturation=1.005" \
  -af "highpass=f=40,lowpass=f=19000,loudnorm=I=-14:TP=-1.5:LRA=11" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 44100 \
  -movflags +faststart \
  "${TEMP}"

# 2. strip any remaining EXIF/XMP tags (skipped if exiftool is not installed: brew install exiftool)
if command -v exiftool >/dev/null 2>&1; then
  exiftool -all= -overwrite_original -ext mp4 "${TEMP}"
else
  echo "exiftool not found: skipping step 2 (step 1 already wrote no metadata)"
fi

# 3. remux with generic handler names
ffmpeg -y -i "${TEMP}" -c copy -map_metadata -1 \
  -metadata:s:v handler_name="VideoHandler" -metadata:s:a handler_name="SoundHandler" \
  -fflags +bitexact -movflags +faststart \
  "${OUTPUT}"

rm -f "${TEMP}"
echo "Sanitization complete: ${OUTPUT}"
