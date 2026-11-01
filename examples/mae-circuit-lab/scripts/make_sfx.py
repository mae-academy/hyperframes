#!/usr/bin/env python3
"""Builds assets/sfx.wav (stereo, 48 kHz, 16-bit) by procedural synthesis only.

Timing comes ONLY from the CUES array (between @CUES-BEGIN / @CUES-END) in src/timeline.js: [[seconds, "voice"], ...].
Length = the root data-duration in index.html, so audio and video always have the same length.

Bed   : continuous 50 Hz hum at -22 dBFS peak, no gaps, 0.0 s to the end.
Voices: click (1400/1800 Hz), snap (2200 + 4400 Hz transient with a 70 Hz sub-bass thud underneath),
        thump (85 Hz sub impact).
"""
import re, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent.parent
SR = 48000
GAIN = {"click": 0.40, "snap": 0.50, "thump": 0.70}      # peak amplitude of each voice before the bed is added


def read_cues():
    js = (HERE / "src" / "timeline.js").read_text()
    block = js.split("// @CUES-BEGIN")[1].split("// @CUES-END")[0]
    cues = [(float(t), v) for t, v in re.findall(r'\[\s*([\d.]+)\s*,\s*"(\w+)"\s*\]', block)]
    assert cues and len(cues) == len(re.findall(r"^\s*\[", block, flags=re.M)), "CUES parse mismatch"
    return cues


def read_duration():
    html = (HERE / "index.html").read_text()
    return float(re.search(r'id="root"[^>]*data-duration="([\d.]+)"', html).group(1))


def tone(f, dur, tau, attack=0.002):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.minimum(t / attack, 1.0) * np.exp(-t / tau)


def mix(*parts):
    out = np.zeros(max(len(p) for p in parts))
    for p in parts:
        out[: len(p)] += p
    return out


def voice(name):
    if name == "click":
        return mix(tone(1400, 0.06, 0.007), 0.7 * tone(1800, 0.06, 0.006))
    if name == "snap":
        return mix(tone(2200, 0.12, 0.014, 0.0008), 0.6 * tone(4400, 0.08, 0.008, 0.0008), 1.4 * tone(70, 0.30, 0.07, 0.003))
    if name == "thump":
        return tone(85, 0.50, 0.10, 0.004)
    raise ValueError(name)


def main():
    dur = read_duration()
    cues = read_cues()
    n = int(round(dur * SR))
    t = np.arange(n) / SR
    db = lambda x: 10 ** (x / 20)
    bed = db(-22) * np.sin(2 * np.pi * 50 * t)
    L, R = bed.copy(), bed.copy()
    for i, (ct, name) in enumerate(cues):
        assert 0 <= ct < dur, (ct, name)
        w = voice(name)
        w = w / (np.max(np.abs(w)) + 1e-9) * GAIN[name]
        s = int(round(ct * SR))
        e = min(n, s + len(w))
        pan = 0.12 * (1 if i % 2 else -1)                    # tiny deterministic stereo spread
        L[s:e] += w[: e - s] * (1 - pan)
        R[s:e] += w[: e - s] * (1 + pan)
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    assert peak < 0.98, f"clipping: peak {peak:.3f}"
    pcm = (np.stack([L, R], 1) * 32767).astype("<i2")
    out = HERE / "assets" / "sfx.wav"
    with wave.open(str(out), "wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
    print(f"wrote {out.name}: {n/SR:.3f} s, {len(cues)} cues, peak {20*np.log10(peak):.1f} dBFS, hum 50 Hz at -22 dBFS")


if __name__ == "__main__":
    main()
