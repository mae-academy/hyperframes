#!/bin/bash
# Fetches the vendored MathJax bundle (git-ignored, 3 MB) used to typeset all math to SVG.
set -e; cd "$(dirname "$0")/.."; T=$(mktemp -d); (cd $T && npm i mathjax@3.2.2 >/dev/null) && cp $T/node_modules/mathjax/es5/tex-svg.js assets/mathjax-tex-svg.js
