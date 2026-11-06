#!/usr/bin/env bash
# Anti-fingerprint clean export. Filters are exactly the specified pipeline; loudnorm runs in two passes
# (measure, then linear apply) so the master really lands on -14 LUFS / -1.5 dBTP.
set -euo pipefail
cd "$(dirname "$0")"

INPUT="raw_render.mp4"
OUTPUT="the_immortal_function_perfect.mp4"
AF_PRE="highpass=f=40,lowpass=f=19000"

STATS=$(ffmpeg -hide_banner -nostats -i "${INPUT}" -vn -af "${AF_PRE},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null - 2>&1 | sed -n '/^{/,/^}/p')
j() { echo "${STATS}" | sed -n "s/.*\"$1\" *: *\"\\([^\"]*\\)\".*/\\1/p"; }

ffmpeg -y -i "${INPUT}" \
  -map_metadata -1 -map_chapters -1 \
  -vf "crop=in_w-4:in_h-4,scale=1080:1920:flags=lanczos,noise=alls=1:allf=t,eq=contrast=1.008:brightness=0.001:saturation=1.005" \
  -af "${AF_PRE},loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(j input_i):measured_TP=$(j input_tp):measured_LRA=$(j input_lra):measured_thresh=$(j input_thresh):offset=$(j target_offset):linear=true" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -t 15.0 -movflags +faststart \
  "${OUTPUT}"

echo "Clean export complete: ${OUTPUT}"
