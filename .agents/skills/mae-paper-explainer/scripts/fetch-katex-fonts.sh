#!/usr/bin/env bash
# Place the three KaTeX 0.16.8 fonts the MAE spec needs into a project's assets/fonts/.
# Authoring-time only: the render itself never touches the network.
# Usage: fetch-katex-fonts.sh <dest-dir>
set -euo pipefail
dest="${1:?usage: fetch-katex-fonts.sh <dest-dir>}"
mkdir -p "$dest"
files=(KaTeX_Main-Regular KaTeX_Main-Bold KaTeX_Math-Italic)
base="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.8/fonts"
for f in "${files[@]}"; do
  [ -s "$dest/$f.woff2" ] && continue
  local_copy=$(find . -path "*/katex/dist/fonts/$f.woff2" -print -quit 2>/dev/null || true)
  if [ -n "$local_copy" ]; then cp "$local_copy" "$dest/$f.woff2"
  else curl -fsSL "$base/$f.woff2" -o "$dest/$f.woff2"; fi
  echo "ok $dest/$f.woff2"
done
cat <<'CSS'

/* paste into index.html <style> */
@font-face{font-family:KaTeX_Main;font-weight:400;font-style:normal;src:url(assets/fonts/KaTeX_Main-Regular.woff2) format("woff2")}
@font-face{font-family:KaTeX_Main;font-weight:700;font-style:normal;src:url(assets/fonts/KaTeX_Main-Bold.woff2) format("woff2")}
@font-face{font-family:KaTeX_Math;font-weight:400;font-style:italic;src:url(assets/fonts/KaTeX_Math-Italic.woff2) format("woff2")}
CSS
