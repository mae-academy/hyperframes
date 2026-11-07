#!/usr/bin/env bash
# Audit a final export for tool traces: container tags, encoder strings, provenance boxes, stream layout.
#   usage: audit-clean.sh final.mp4 [WIDTHxHEIGHT] [FPS]      (defaults: 2160x3840, 60)
# Exit code 1 when something is found. Needs ffprobe, ffmpeg, and optionally exiftool.
set -u
F="${1:?usage: audit-clean.sh final.mp4 [WIDTHxHEIGHT] [FPS]}"
SIZE="${2:-2160x3840}"
FPS="${3:-60}"
bad=0
fail() { echo "FAIL  $1"; bad=$((bad + 1)); }
ok() { echo "ok    $1"; }

[ -f "$F" ] || { echo "no such file: $F"; exit 2; }

# 1. streams
vinfo=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -of csv=p=0 "$F")
ainfo=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate -of csv=p=0 "$F")
echo "video: $vinfo   audio: $ainfo"
case "$vinfo" in h264,"${SIZE%x*}","${SIZE#*x}",*,"$FPS/1") ok "h264 ${SIZE} @ ${FPS} fps";; *) fail "video is not h264 ${SIZE} @ ${FPS} fps (got $vinfo)";; esac
[ -n "$ainfo" ] && ok "audio stream present ($ainfo)" || fail "no audio stream"
nstreams=$(ffprobe -v error -show_entries stream=index -of csv=p=0 "$F" | wc -l)
[ "$nstreams" -eq 2 ] && ok "exactly two streams (no data, subtitle or attachment tracks)" || fail "unexpected number of streams: $nstreams"

# 2. container and stream tags: only neutral keys allowed
tags=$(ffprobe -v error -show_entries format_tags:stream_tags -of default=nw=1 "$F")
while IFS= read -r line; do
  [ -z "$line" ] && continue
  key="${line%%=*}"; val="${line#*=}"
  case "$key" in
    TAG:language|TAG:vendor_id|TAG:major_brand|TAG:minor_version|TAG:compatible_brands) ;;
    TAG:handler_name) case "$val" in VideoHandler|SoundHandler) ;; *) fail "handler name is '$val'";; esac ;;
    *) fail "unexpected tag: $line" ;;
  esac
done <<< "$tags"
[ "$bad" -eq 0 ] && ok "container and stream tags are neutral"

# 3. encoder / tool strings anywhere in the file (x264 writes its settings into an SEI unit inside the video)
pat='lavf|lavc|libx264|x264 -|x264 core|ffmpeg|hyperframes|headless|chromium|puppeteer|playwright|handbrake|encoder|software|writing application|gsap|katex'
hits=$(strings -n 4 "$F" | grep -iE "$pat" | head -5)
[ -z "$hits" ] && ok "no encoder / tool strings in the file" || { fail "tool strings found:"; echo "$hits" | sed 's/^/        /'; }

# 4. provenance and metadata containers (C2PA / JUMBF / XMP / EXIF / ID3)
prov=$(grep -a -o -i -E 'c2pa|jumb|xmpmeta|adobe:ns|<rdf:' "$F" | sort -u | tr '\n' ' ')
grep -a -q -P 'Exif\x00\x00' "$F" && prov="$prov exif"
grep -a -q -P 'ID3[\x02-\x04]\x00' "$F" && prov="$prov id3"
[ -z "$prov" ] && ok "no C2PA / JUMBF / XMP / EXIF / ID3 blocks" || fail "metadata blocks found: $prov"
if command -v exiftool >/dev/null 2>&1; then
  extra=$(exiftool -a -u -G1 "$F" 2>/dev/null | grep -viE 'file name|directory|file size|modification|access|inode|permissions|file type|mime|major brand|minor version|compatible brands|movie data|^\[(QuickTime|Track|Composite|ExifTool)|duration|image (size|width|height)|time scale|^\[System|video frame rate|avg bitrate|graphics mode|op color|compressor id|source image|bit depth|pixel aspect|x resolution|y resolution|audio|balance|sample|channels|media|track|matrix|preferred|preview|poster|selection|current time|next track|handler|vendor|rotation|encoding|movie header|bits per sample|time (created|modified)|create date|modify date|header version|mp4' | head -6)
  [ -z "$extra" ] && ok "exiftool shows nothing beyond the basic atoms" || { fail "exiftool shows extra fields:"; echo "$extra" | sed 's/^/        /'; }
fi

# 5. decodes cleanly, loudness
ffmpeg -v error -i "$F" -f null - 2>/tmp/audit-decode.log && [ ! -s /tmp/audit-decode.log ] && ok "decodes cleanly end to end" || fail "decode errors (see /tmp/audit-decode.log)"
lufs=$(ffmpeg -hide_banner -nostats -i "$F" -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+I:' | tail -1 | awk '{print $2}')
echo "loudness: ${lufs:-?} LUFS (target -14)"

[ "$bad" -eq 0 ] && { echo "AUDIT PASS: $F"; exit 0; } || { echo "AUDIT FAIL: $bad problem(s) in $F"; exit 1; }
