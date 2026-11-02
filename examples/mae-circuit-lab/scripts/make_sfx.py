#!/usr/bin/env python3
"""Builds assets/sfx.wav (stereo, 48 kHz, 16-bit) by procedural synthesis only (numpy + scipy.io.wavfile).

Timing comes ONLY from the CUES array (between @CUES-BEGIN / @CUES-END) in src/timeline.js: [[seconds, "voice"], ...].
Length = the root data-duration in index.html, so audio and video always have the same length.

Pure tactile lab acoustics. There are NO pitch bends, NO slides, NO chirps and no sweeps anywhere in this file:
every voice is a fixed-frequency, instantly decaying transient.

  bed   : continuous 50 Hz stereo hum at -22 dBFS peak, unbroken from 0.0 s to the end (no silent gap).
  click : sharp mechanical relay / switch transient   1800 Hz sine x exp(-t/3 ms), 20 ms.
  snap  : high-frequency tactile contact              (2400 Hz sine + 0.5 x gaussian noise) x exp(-t/5 ms), 35 ms.
  thump : deep sub-bass matrix-lock impact            55 Hz sine x exp(-t/20 ms), 80 ms.
"""
import re
from pathlib import Path
import numpy as np
from scipy.io import wavfile

HERE = Path(__file__).resolve().parent.parent
SR = 48000
sample_rate = SR
GAIN = {"click": 0.40, "snap": 0.34, "thump": 0.45}      # peak amplitude of each voice before the bed is added


def read_cues():
    js = (HERE / "src" / "timeline.js").read_text()
    block = js.split("// @CUES-BEGIN")[1].split("// @CUES-END")[0]
    cues = [(float(t), v) for t, v in re.findall(r'\[\s*([\d.]+)\s*,\s*"(\w+)"\s*\]', block)]
    assert cues and len(cues) == len(re.findall(r"^\s*\[", block, flags=re.M)), "CUES parse mismatch"
    return cues


def read_duration():
    html = (HERE / "index.html").read_text()
    return float(re.search(r'id="root"[^>]*data-duration="([\d.]+)"', html).group(1))


def voice(name, rng):
    if name == "click":
        t = np.linspace(0, 0.02, int(sample_rate * 0.02), endpoint=False)
        return np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.003)
    if name == "snap":
        t = np.linspace(0, 0.035, int(sample_rate * 0.035), endpoint=False)
        return (np.sin(2 * np.pi * 2400 * t) + 0.5 * rng.normal(0, 0.3, len(t))) * np.exp(-t / 0.005)
    if name == "thump":
        t = np.linspace(0, 0.08, int(sample_rate * 0.08), endpoint=False)
        return np.sin(2 * np.pi * 55 * t) * np.exp(-t / 0.02)
    raise ValueError(f"unknown voice {name!r} (only click, snap and thump exist)")


def main():
    dur = read_duration()
    cues = read_cues()
    n = int(round(dur * SR))
    t = np.arange(n) / SR
    bed = 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)
    L, R = bed.copy(), bed.copy()
    rng = np.random.default_rng(2026)                        # seeded: the noise in every snap is the same on every build
    for i, (ct, name) in enumerate(cues):
        assert 0 <= ct < dur, (ct, name)
        w = voice(name, rng)
        w = w / (np.max(np.abs(w)) + 1e-9) * GAIN[name]
        s = int(round(ct * SR))
        e = min(n, s + len(w))
        pan = 0.10 * (1 if i % 2 else -1)                    # tiny fixed stereo spread (no modulation)
        L[s:e] += w[: e - s] * (1 - pan)
        R[s:e] += w[: e - s] * (1 + pan)
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    assert peak < 0.98, f"clipping: peak {peak:.3f}"
    pcm = (np.stack([L, R], 1) * 32767).astype("<i2")
    out = HERE / "assets" / "sfx.wav"
    wavfile.write(str(out), SR, pcm)
    print(f"wrote {out.name}: {n/SR:.3f} s, {len(cues)} cues, peak {20*np.log10(peak):.1f} dBFS, hum 50 Hz at -22 dBFS")


if __name__ == "__main__":
    main()
