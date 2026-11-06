#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit) from assets/cues.json.

Bed    : continuous 50 Hz sine at -22 dBFS for the full 21.0 s.
CLICK  : 1800 Hz sine * exp(-t/3 ms), 15 ms   (one per touched point)
SNAP   : 2400 Hz sine + noise burst * exp(-t/5 ms), 35 ms (one per matrix-cell lock)
THUMP  : 55 Hz sine * exp(-t/40 ms), 200 ms   (one, when the identity locks)
Nothing else: no whooshes, glissandi, chirps or pitch sweeps. Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 21.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())

n = int(SR * DUR)
mix = np.zeros(n, dtype=np.float64)
t_all = np.arange(n) / SR
mix += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t_all)  # bed, unbroken

rng = np.random.default_rng(7)  # seeded: deterministic noise burst

def add(t0, sig):
    i = int(round(t0 * SR))
    j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i]

def tone(freq, length, tau, amp):
    t = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq * t) * np.exp(-t / tau)

counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    k = c["kind"]
    counts[k] += 1
    if k == "click":
        add(c["t"], tone(1800, 0.015, 0.003, 0.32))
    elif k == "snap":
        t = np.arange(int(SR * 0.035)) / SR
        env = np.exp(-t / 0.005)
        sig = 0.30 * np.sin(2 * np.pi * 2400 * t) * env + 0.22 * rng.uniform(-1, 1, len(t)) * env
        add(c["t"], sig)
    elif k == "thump":
        add(c["t"], tone(55, 0.2, 0.04, 0.55))
    else:
        raise SystemExit(f"unknown cue kind {k}")

peak = float(np.max(np.abs(mix)))
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
pcm = np.clip(mix, -1, 1)
pcm = (np.repeat(pcm[:, None], 2, axis=1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, {DUR:.1f} s")
