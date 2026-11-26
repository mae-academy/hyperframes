#!/usr/bin/env bash
# usage: render-segments.sh <fps> <quality> <seconds-per-segment> <parallel> <outdir> [total=170]
# Renders whole-second segments of the film in parallel (retrying each up to 3x), then concatenates with stream copy.
set -u
FPS=$1; Q=$2; SEG=$3; PAR=$4; OUT=$5; TOTAL=${6:-170}
mkdir -p "$OUT"; cd "$(dirname "$0")/.."
export HYPERFRAMES_RENDER_LOCK=off
N=$(( (TOTAL + SEG - 1) / SEG ))
one() {
  i=$1; s=$(( i * SEG )); e=$(( s + SEG )); [ $e -gt $TOTAL ] && e=$TOTAL
  f=$(printf "%s/seg_%03d.mp4" "$OUT" "$i")
  for try in 1 2 3; do
    [ -s "$f" ] && ffprobe -v error "$f" 2>/dev/null && return 0
    npx hyperframes render --start $s --end $e --fps $FPS -q $Q -w 1 --quiet -o "$f" >"$OUT/log_$i.txt" 2>&1
    [ -s "$f" ] && return 0
    echo "segment $i retry $try" >&2
  done
  echo "segment $i FAILED" >&2; return 1
}
export -f one; export FPS Q SEG OUT TOTAL
seq 0 $((N-1)) | xargs -P "$PAR" -I{} bash -c 'one {}'
ls "$OUT"/seg_*.mp4 | sort | sed "s|^|file '$(pwd)/|;s|$|'|" > "$OUT/list.txt"
sed -i "s|file '$(pwd)/$OUT|file '$OUT|" "$OUT/list.txt" 2>/dev/null
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/list.txt" -c copy "$OUT/film.mp4" && echo "concat ok: $OUT/film.mp4"
