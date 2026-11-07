#!/usr/bin/env bash
# One-shot 4K 60 fps export of a theme-1 reel project: build, gates, render, clean, audit.
#   usage: .claude/skills/export-4k/export-4k.sh reels/<project> [approved_audio.mp4] [out_name.mp4]
# With approved_audio.mp4 the sound of that file is stream-copied unchanged (bit-identical); without it the
# project's assets/sfx.wav is regenerated and mastered to -14 LUFS.
# Takes several minutes (the render): run it in the background.
set -euo pipefail

PROJ="${1:?usage: export-4k.sh reels/<project> [approved_audio.mp4] [out_name.mp4]}"
AUDIO="${2:-}"
NAME="${3:-$(basename "${PROJ}")_4k60_FINAL.mp4}"
HF="${HF_VERSION:-0.9.19}"
ROOT="$(git rev-parse --show-toplevel)"
[ -n "${AUDIO}" ] && AUDIO="$(cd "$(dirname "${AUDIO}")" && pwd)/$(basename "${AUDIO}")"

cd "${PROJ}"
echo "== 1/7 build";            ./build.sh
echo "== 2/7 sound";            if [ -z "${AUDIO}" ]; then python3 scripts/make_sfx.py; else echo "approved audio will be copied unchanged: ${AUDIO}"; fi
echo "== 3/7 theme-1 lint";     node "${ROOT}/.claude/skills/theme-1/theme1-lint.mjs" .
echo "== 4/7 cue verification"; node verify.mjs
echo "== 5/7 hyperframes check"
( cd dist && npx -y "hyperframes@${HF}" check )
echo "== 6/7 render 4K 60 fps"
rm -rf out/work-* work-* .raw_render_4k.hf-transaction-* raw_render_4k.mp4
( cd dist && npx -y "hyperframes@${HF}" render . --output ../raw_render_4k.mp4 --fps 60 --resolution portrait-4k --quality delivery --workers 4 --quiet )
echo "== 7/7 clean export + audit"
mkdir -p out
"${ROOT}/reels/export_final_clean.sh" raw_render_4k.mp4 "out/${NAME}" ${AUDIO:+"${AUDIO}"}
bash "${ROOT}/.claude/skills/export-4k/audit-clean.sh" "out/${NAME}"
rm -rf work-* .raw_render_4k.hf-transaction-*
echo "DONE: ${PROJ}/out/${NAME}"
