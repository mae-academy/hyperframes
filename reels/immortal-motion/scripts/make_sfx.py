#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 15.0 s) from assets/cues.json (exported by the page timeline).

Bed    : continuous 50 Hz lab hum at -22 dBFS, unbroken 0.0 - 15.0 s. Nothing else is continuous:
         no buzz, no scanner drone, no sweeps, no chirps.
click  : clean tactile click, 1800 Hz sine * exp(-t/3 ms), 15 ms (coordinate milestones).
snap   : solid metallic vice lock, 2400 Hz + 3150 Hz partials, 600 Hz body, short noise transient (50 ms).
thump  : 55 Hz sub-bass * exp(-t/45 ms), 250 ms (formula confirmation).
Peak is asserted < 0.98.
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

rng = np.random.default_rng(17)  # seeded: deterministic noise

def add(t0, sig):
    i = int(round(t0 * SR)); j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i]

def tone(freq, length, tau, amp):
    t = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq * t) * np.exp(-t / tau)

counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    k = c["kind"]
    if k not in counts:
        raise SystemExit(f"unknown cue kind {k}")
    counts[k] += 1
    if k == "click":
        add(c["t"], tone(1800, 0.015, 0.003, 0.32))
    elif k == "snap":
        t = np.arange(int(SR * 0.05)) / SR
        body = 0.20 * np.sin(2 * np.pi * 600 * t) * np.exp(-t / 0.012)
        ring = (0.22 * np.sin(2 * np.pi * 2400 * t) + 0.12 * np.sin(2 * np.pi * 3150 * t)) * np.exp(-t / 0.008)
        hit = 0.30 * rng.uniform(-1, 1, len(t)) * np.exp(-t / 0.003)
        add(c["t"], body + ring + hit)
    elif k == "thump":
        add(c["t"], tone(55, 0.25, 0.045, 0.6))

peak = float(np.max(np.abs(mix)))
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
pcm = (np.repeat(np.clip(mix, -1, 1)[:, None], 2, axis=1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, {DUR:.1f} s")
