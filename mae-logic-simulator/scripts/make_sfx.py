#!/usr/bin/env python3
"""Bakes assets/sfx.wav (27.0 s, STEREO, 44.1 kHz, 16-bit) from the CUES block in index.html.

Procedural only — pure sine/shaped-sine voices, no noise buffers, no samples, no external files.
Voices mirror the live Web Audio engine inside index.html (SFX object):

  drone        permanent lab drone: 50 Hz at -24 dBFS (0.0631) + 100 Hz (0.02), whole 27.0 s
               (whole cycles -> loops click-free); right channel phase-offset for a stereo field
  click        mouse/toggle: down 1400 Hz transient, up 1800 Hz transient 60 ms later
  snap         terminal wire snap: sharp 2200 Hz micro-click (+4400 Hz overtone)
  thump        heavy relay strike: 85 Hz tanh-shaped sub + 1400 Hz transient
  relay_thump  multi-tone relay: 85 Hz sub + 170 Hz body + 1400 Hz strike + contact bounce at +30 ms
  chime        pure sine pair 1200 / 1800 Hz, long decay

Usage:  python3 scripts/make_sfx.py [index.html] [assets/sfx.wav]
"""
import pathlib
import re
import sys
import wave

import numpy as np

SR = 44100
DUR = 27.0
MASTER = 0.5

root = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "index.html"
dst = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else root / "assets" / "sfx.wav"

text = src.read_text()
block = text[text.index("@CUES-BEGIN"):text.index("@CUES-END")]
block = re.sub(r"//[^\n]*", "", block)  # drop line comments before parsing
CUES = [(float(t), k) for t, k in re.findall(r"\[\s*([0-9.]+)\s*,\s*\"(\w+)\"\s*\]", block)]
assert CUES, "no cues parsed"


def env(n, pk, dec, att=0.001):
    """1 ms linear attack then exponential decay to -80 dB over `dec` s (same shape as the WebAudio ramps)."""
    t = np.arange(n) / SR
    k = np.log(pk / 1e-4) / dec
    e = np.where(t < att, 1e-4 + (pk - 1e-4) * t / att, pk * np.exp(-k * (t - att)))
    return np.where(t > att + dec, 0.0, e)


def tone(f, pk, dec, att=0.001):
    n = int((dec + att + 0.02) * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env(n, pk, dec, att)


def layer(*sigs):
    """Sum signals of different lengths (all starting at t = 0)."""
    out = np.zeros(max(len(x) for x in sigs))
    for x in sigs:
        out[: len(x)] += x
    return out


def sub(f, pk, dec):
    n = int((dec + 0.05) * SR)
    return np.tanh(2.2 * np.sin(2 * np.pi * f * np.arange(n) / SR)) * env(n, pk, dec, 0.002)


VOICES = {
    "click": lambda: [(0.0, tone(1400, 0.34, 0.03)), (0.06, tone(1800, 0.22, 0.026))],
    "snap": lambda: [(0.0, layer(tone(2200, 0.42, 0.016), tone(4400, 0.12, 0.009)))],
    "thump": lambda: [(0.0, layer(sub(85, 0.6, 0.45), tone(1400, 0.25, 0.014)))],
    "relay_thump": lambda: [(0.0, layer(sub(85, 0.5, 0.4), sub(170, 0.18, 0.2), tone(1400, 0.4, 0.014))), (0.03, tone(1400, 0.2, 0.01))],
    "chime": lambda: [(0.0, layer(tone(1200, 0.16, 0.9, 0.003), tone(1800, 0.1, 0.7, 0.003)))],
}

n_total = int(DUR * SR)
mix = np.zeros(n_total)
for t0, kind in CUES:
    for dt, sig in VOICES[kind]():
        i = int((t0 + dt) * SR)
        j = min(n_total, i + len(sig))
        mix[i:j] += sig[: j - i]
mix *= MASTER
t = np.arange(n_total) / SR
left = mix + 0.0631 * np.sin(2 * np.pi * 50 * t) + 0.02 * np.sin(2 * np.pi * 100 * t)
right = mix + 0.0631 * np.sin(2 * np.pi * 50 * t + 0.35) + 0.02 * np.sin(2 * np.pi * 100 * t + 0.9)
st = np.stack([left, right], axis=1)

peak = float(np.max(np.abs(st)))
assert peak < 0.98, peak
dst.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(dst), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
gaps = np.diff([0.0] + sorted(c[0] for c in CUES) + [DUR])
print(f"{dst}  {len(CUES)} cues  peak {20 * np.log10(peak):.1f} dBFS  {n_total / SR:.1f} s  longest cue gap {gaps.max():.2f} s (drone fills it)")
