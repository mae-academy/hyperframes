#!/usr/bin/env bash
# two-pass build: layout depends on glyph widths measured in a real browser
set -euo pipefail
cd "$(dirname "$0")"
node build.mjs && node measure.mjs && node build.mjs && node measure.mjs --check
