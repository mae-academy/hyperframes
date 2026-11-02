#!/usr/bin/env python3
"""Builds assets/sfx.wav (stereo, 48 kHz, 16-bit) by procedural synthesis only.

Timing comes ONLY from the CUES array (between @CUES-BEGIN / @CUES-END) in src/timeline.js: [[seconds, "voice"], ...].
Length = the root data-duration in index.html, so audio and video always have the same length.

Bed   : continuous 50 Hz hum at -22 dBFS peak, unbroken from 0.0 s to the end.
Voices: click  = 1400 Hz sine burst, 6 ms decay. Clicks that follow each other within 0.5 s (a tracer start and the resistor
                 touches after it) form a run and rise 2 semitones per step, so each resistor tick has its own pitch and
                 the run climbs toward the lock.
        snap   = 2200 + 4400 Hz transient over a short 55 Hz sub-bass layer.
        thump  = heavy sub-bass: 55 Hz sine that drops from 90 Hz, 40 ms attack.
"""
import re, wave
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent.parent
SR = 48000
GAIN = {"click": 0.36, "snap": 0.42, "thump": 0.58}      # peak amplitude of each voice before the bed is added
RUN_GAP = 0.5                                            # seconds: clicks closer than this belong to one rising run
SEMITONE = 2 ** (1 / 12)


def read_cues():
    js = (HERE / "src" / "timeline.js").read_text()
    block = js.split("// @CUES-BEGIN")[1].split("// @CUES-END")[0]
    cues = [(float(t), v) for t, v in re.findall(r'\[\s*([\d.]+)\s*,\s*"(\w+)"\s*\]', block)]
    assert cues and len(cues) == len(re.findall(r"^\s*\[", block, flags=re.M)), "CUES parse mismatch"
    return cues


def read_duration():
    html = (HERE / "index.html").read_text()
    return float(re.search(r'id="root"[^>]*data-duration="([\d.]+)"', html).group(1))


def env(n, attack, tau):
    t = np.arange(n) / SR
    return np.minimum(t / attack, 1.0) * np.exp(-t / tau)


def tone(f, dur, tau, attack=0.002):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env(n, attack, tau)


def mix(*parts):
    out = np.zeros(max(len(p) for p in parts))
    for p in parts:
        out[: len(p)] += p
    return out


def voice(name, step=0):
    if name == "click":
        f = 1400 * SEMITONE ** (2 * step)
        return tone(f, 0.06, 0.006)                         # 6 ms decay
    if name == "snap":
        return mix(tone(2200, 0.12, 0.014, 0.0008), 0.6 * tone(4400, 0.08, 0.008, 0.0008), 1.2 * tone(55, 0.30, 0.07, 0.003))
    if name == "thump":
        n = int(0.55 * SR)
        t = np.arange(n) / SR
        f = 55 + 35 * np.exp(-t / 0.05)                     # 90 Hz falling onto 55 Hz
        ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * env(n, 0.04, 0.12)              # 40 ms attack
    raise ValueError(name)


def main():
    dur = read_duration()
    cues = read_cues()
    n = int(round(dur * SR))
    t = np.arange(n) / SR
    db = lambda x: 10 ** (x / 20)
    bed = db(-22) * np.sin(2 * np.pi * 50 * t)
    L, R = bed.copy(), bed.copy()
    step, last_click = 0, None
    for i, (ct, name) in enumerate(cues):
        assert 0 <= ct < dur, (ct, name)
        if name == "click":
            step = step + 1 if (last_click is not None and ct - last_click <= RUN_GAP) else 0
            last_click = ct
        w = voice(name, step if name == "click" else 0)
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
