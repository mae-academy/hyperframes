#!/usr/bin/env bash
# Clean final export: re-encode with the visual/audio pipeline, then strip container metadata and the
# encoder strings that ffmpeg/x264 leave behind (muxer tag, compressor name, x264 SEI settings block).
#   usage: ./export_final_clean.sh [raw_render.mp4] [final_clean.mp4]
# Requires: ffmpeg, exiftool.
set -euo pipefail

INPUT="${1:-raw_render.mp4}"
OUTPUT="${2:-final_clean.mp4}"
TEMP="$(dirname "${OUTPUT}")/temp_sanitized.mp4"
AF_PRE="highpass=f=40,lowpass=f=19000"

# Output keeps the input resolution (1080x1920 or 2160x3840 ...); the micro-crop is 4 px per 1080 px of width.
W=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "${INPUT}")
H=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "${INPUT}")
CROP=$(( W / 270 ))

# 0. Two-pass loudness: measure first, then apply linearly, so the master really lands on -14 LUFS / -1.5 dBTP.
STATS=$(ffmpeg -hide_banner -nostats -i "${INPUT}" -vn -af "${AF_PRE},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
j() { echo "${STATS}" | sed -n "s/.*\"$1\" *: *\"\\([^\"]*\\)\".*/\\1/p"; }

# 1. Visual processing (break the pixel grid), audio normalisation, bitexact muxing (no encoder tag)
ffmpeg -y -i "${INPUT}" \
  -map_metadata -1 \
  -map_chapters -1 \
  -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -vf "crop=in_w-${CROP}:in_h-${CROP},scale=${W}:${H}:flags=lanczos,noise=alls=1:allf=t,eq=contrast=1.008:brightness=0.001:saturation=1.005" \
  -af "${AF_PRE},loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(j input_i):measured_TP=$(j input_tp):measured_LRA=$(j input_lra):measured_thresh=$(j input_thresh):offset=$(j target_offset):linear=true" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 44100 \
  -movflags +faststart \
  "${TEMP}"

# 2. Remove any remaining tags / EXIF / XMP in the container
exiftool -all= -overwrite_original -ext mp4 "${TEMP}"

# 3. Remux: neutral handler names, bitexact (so the muxer does not re-add its version tag), and drop the
#    H.264 SEI NAL units (the x264 settings string lives there). Stream copy: no quality loss.
ffmpeg -y -i "${TEMP}" \
  -c copy \
  -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -bsf:v filter_units=remove_types=6 \
  -map_metadata -1 \
  -metadata handler_name="VideoHandler" \
  -metadata:s:v handler_name="VideoHandler" \
  -metadata:s:a handler_name="SoundHandler" \
  -movflags +faststart \
  "${OUTPUT}"

rm -f "${TEMP}"
echo "Sanitization complete: ${OUTPUT}"
