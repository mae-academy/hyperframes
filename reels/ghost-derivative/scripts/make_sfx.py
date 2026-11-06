#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 15.0 s) from assets/cues.json.

Bed    : continuous 50 Hz lab hum at -22 dBFS, unbroken 0.0 - 15.0 s.
TICK   : mechanical scanner tick, 3600 Hz sine * exp(-t/1.2 ms), 8 ms (one per scanner step, 2.8 - 8.5 s).
SNAP   : metallic snap, 2400 Hz sine + noise burst * exp(-t/5 ms), 35 ms (deviation locks at 0.000%).
THUMP  : 55 Hz sub-bass * exp(-t/45 ms), 250 ms (eigenfunction confirmation).
Silent for everything else. Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 15.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())

n = int(SR * DUR)
mix = np.zeros(n)
t_all = np.arange(n) / SR
mix += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t_all)

rng = np.random.default_rng(11)  # seeded: deterministic noise

def add(t0, sig):
    i = int(round(t0 * SR)); j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i]

def tone(freq, length, tau, amp):
    t = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq * t) * np.exp(-t / tau)

counts = {"tick": 0, "snap": 0, "thump": 0}
for c in cues:
    k = c["kind"]; counts[k] += 1
    if k == "tick":
        add(c["t"], tone(3600, 0.008, 0.0012, 0.22))
    elif k == "snap":
        t = np.arange(int(SR * 0.035)) / SR; env = np.exp(-t / 0.005)
        add(c["t"], 0.34 * np.sin(2 * np.pi * 2400 * t) * env + 0.24 * rng.uniform(-1, 1, len(t)) * env)
    elif k == "thump":
        add(c["t"], tone(55, 0.25, 0.045, 0.6))
    else:
        raise SystemExit(f"unknown cue kind {k}")

peak = float(np.max(np.abs(mix)))
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
pcm = (np.repeat(np.clip(mix, -1, 1)[:, None], 2, axis=1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, {DUR:.1f} s")
