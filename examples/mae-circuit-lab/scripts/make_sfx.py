#!/usr/bin/env python3
"""Builds assets/sfx.wav (stereo, 48 kHz, 16-bit) for the composition.

Timing comes ONLY from the CUES array between @CUES-BEGIN / @CUES-END in timeline.js.
Length = the root data-duration in index.html (so audio and video are always the same length).

Bed : 50 Hz drone at -24 dBFS peak + 100 Hz at -36 dBFS peak, for the full duration.
Voices: click (1400/1800 Hz), snap (2200 + 4400 Hz), thump (85 Hz sub), relay_thump (double 80 Hz sub),
        chime (1200-3600 Hz partials).
"""
import re, sys, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent.parent
SR = 48000


def read_cues():
    js = (HERE / "src" / "timeline.js").read_text()
    block = js.split("// @CUES-BEGIN")[1].split("// @CUES-END")[0]
    cues = [dict(id=m[0], t=float(m[1]), v=m[2], g=float(m[3]))
            for m in re.findall(r'\{\s*id:\s*"([^"]+)",\s*t:\s*([\d.]+),\s*v:\s*"([^"]+)",\s*g:\s*([\d.]+)\s*\}', block)]
    n_objs = block.count("{ id:") + block.count("{id:")
    assert len(cues) == n_objs and cues, f"CUES parse mismatch: parsed {len(cues)} of {n_objs}"
    return cues


def read_duration():
    html = (HERE / "index.html").read_text()
    return float(re.search(r'id="root"[^>]*data-duration="([\d.]+)"', html).group(1))


def env(n, attack=0.002, tau=0.02):
    t = np.arange(n) / SR
    a = np.minimum(t / attack, 1.0)
    return a * np.exp(-t / tau)


def tone(f, dur, tau, amp=1.0, attack=0.002, phase=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return amp * np.sin(2 * np.pi * f * t + phase) * env(n, attack, tau)


def mix(*parts):
    """Sum equal-weighted parts of different lengths (zero-padded)."""
    out = np.zeros(max(len(p) for p in parts))
    for p in parts:
        out[: len(p)] += p
    return out


def voice(name):
    if name == "click":
        return mix(tone(1400, 0.06, 0.007), 0.7 * tone(1800, 0.06, 0.006))
    if name == "snap":
        return mix(tone(2200, 0.12, 0.014, attack=0.0008), 0.6 * tone(4400, 0.08, 0.008, attack=0.0008))
    if name == "thump":
        return tone(85, 0.45, 0.09, attack=0.004)
    if name == "relay_thump":
        gap = int(0.085 * SR)
        a, b = tone(80, 0.45, 0.085, attack=0.003), 0.8 * tone(80, 0.45, 0.085, attack=0.003)
        out = np.zeros(len(a) + gap)
        out[: len(a)] += a
        out[gap: gap + len(b)] += b
        return out
    if name == "chime":
        return mix(*[a * tone(f, 1.2, tau, attack=0.003) for f, a, tau in
                     [(1200, 1.0, 0.30), (1800, 0.55, 0.22), (2400, 0.35, 0.18), (3000, 0.22, 0.14), (3600, 0.15, 0.10)]])
    raise ValueError(name)


def main():
    dur = read_duration()
    cues = read_cues()
    n = int(round(dur * SR))
    t = np.arange(n) / SR
    db = lambda x: 10 ** (x / 20)
    bed = db(-24) * np.sin(2 * np.pi * 50 * t) + db(-36) * np.sin(2 * np.pi * 100 * t)
    L, Rr = bed.copy(), bed.copy()
    for i, c in enumerate(cues):
        assert 0 <= c["t"] < dur, c
        w = voice(c["v"])
        w = w / (np.max(np.abs(w)) + 1e-9) * 0.5 * c["g"]          # peak = 0.5*gain  (<= -6 dBFS)
        s = int(round(c["t"] * SR))
        e = min(n, s + len(w))
        pan = 0.15 * (1 if i % 2 else -1)                            # tiny deterministic stereo spread
        L[s:e] += w[: e - s] * (1 - pan)
        Rr[s:e] += w[: e - s] * (1 + pan)
    peak = max(np.max(np.abs(L)), np.max(np.abs(Rr)))
    assert peak < 0.98, f"clipping: peak {peak:.3f}"
    pcm = (np.stack([L, Rr], 1) * 32767).astype("<i2")
    out = HERE / "assets" / "sfx.wav"
    with wave.open(str(out), "wb") as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
    print(f"wrote {out.name}: {n/SR:.3f} s, {len(cues)} cues, peak {20*np.log10(peak):.1f} dBFS")


if __name__ == "__main__":
    main()
