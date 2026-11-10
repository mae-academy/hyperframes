#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 15.0 s) from assets/cues.json (exported by the page timeline).

Connected living sound, derived from the picture:
  hum    50 Hz, -22 dBFS, unbroken 0.0 - 15.0 s.
  pad    open fifths A-E with slow tremolos; swells with the film, gains the major third (C#) at the lock (9.5 s).
  voice  the belt motor: soft sine + 2nd/3rd harmonics (detuned pair). Its pitch climbs with the number of parts
         already inspected k: 220 Hz * 1.5^(k/4) (a quarter fifth per part), loudness grows with k.
  air    low-passed noise riding the voice.
Events (from CUES): scan click 1800 Hz carries a bell ping (PASS: A5, REJECT: B4, both A-major pentatonic);
snap = metallic vice lock (the diverter), thump 55 Hz; the 9.5 s thump carries the bright arpeggio,
the 10.5 s snap a bell pair, the 12.0 s click a small high shimmer. Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 15.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())
SCANS = [c["t"] for c in cues if c["ref"].startswith("scan")]

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(23)  # seeded

def env(points):
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)

def smooth(x, sec):
    k = max(1, int(sec * SR))
    c = np.cumsum(np.insert(x, 0, 0))
    out = (c[k:] - c[:-k]) / k
    return np.concatenate([np.full(k // 2, out[0]), out, np.full(k - k // 2 - 1, out[-1])])[: len(x)]

def lowpass(x, fc):
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y

# hum
mix += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)

# pad
pad_gain = smooth(env([(0, 0.0), (0.4, 0.35), (1.5, 0.55), (3.2, 0.8), (8.5, 1.0), (9.5, 1.15), (12.5, 1.0), (14.3, 0.7), (15.0, 0.55)]), 0.2)
pad = np.zeros(n)
for f0, amp, lfo_hz, ph in [(110.0, 0.030, 0.11, 0.0), (164.81, 0.026, 0.17, 1.3), (220.0, 0.022, 0.23, 2.1), (329.63, 0.014, 0.29, 3.4)]:
    trem = 0.8 + 0.2 * np.sin(2 * np.pi * lfo_hz * t + ph)
    pad += amp * trem * (np.sin(2 * np.pi * f0 * t) + 0.25 * np.sin(2 * np.pi * 2 * f0 * t))
third = smooth(env([(0, 0), (9.45, 0), (9.9, 1.0), (14.3, 1.0), (15.0, 0.6)]), 0.1)
pad += third * 0.020 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.19 * t + 0.7)) * (np.sin(2 * np.pi * 277.18 * t) + 0.25 * np.sin(2 * np.pi * 554.36 * t))
mix += pad * pad_gain

# voice of the belt: k(t) = parts inspected so far (smooth steps at each scan)
k = np.zeros(n)
for s in SCANS:
    u = np.clip((t - s) / 0.25, 0, 1)
    k += u * u * (3 - 2 * u)
freq = 220.0 * 1.5 ** (k / 4.0)
voice_env = smooth(env([(0, 0), (1.3, 0), (1.6, 0.6), (10.0, 0.9), (10.8, 0.0), (15.0, 0.0)]), 0.05) * (0.55 + 0.45 * k / 4.0)
voice = np.zeros(n)
for det, a in [(-1.2, 0.5), (+1.2, 0.5)]:
    ph = 2 * np.pi * np.cumsum(freq + det) / SR
    voice += a * (np.sin(ph) + 0.38 * np.sin(2 * ph) + 0.14 * np.sin(3 * ph))
mix += 0.075 * voice_env * voice

# air
air = lowpass(rng.uniform(-1, 1, n), 1800.0)
air_env = smooth(env([(0, 0), (1.6, 0), (1.9, 0.5), (10.0, 0.7), (10.8, 0), (15, 0)]), 0.08)
mix += 0.018 * air_env * (0.4 + 0.6 * k / 4.0) * air

def add(t0, sig):
    i = int(round(t0 * SR)); j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i]

def tone(freq_hz, length, tau, amp):
    tt = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq_hz * tt) * np.exp(-tt / tau)

counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    kd, t0, ref = c["kind"], c["t"], c["ref"]
    if kd not in counts:
        raise SystemExit(f"unknown cue kind {kd}")
    counts[kd] += 1
    if kd == "click":
        add(t0, tone(1800, 0.015, 0.003, 0.30))
        if ref.startswith("scan"):  # verdict ping on a pentatonic note
            if ref.endswith(":P"): add(t0 + 0.02, tone(880.0, 1.2, 0.35, 0.050))
            else: add(t0 + 0.02, tone(493.88, 1.4, 0.45, 0.060))
        if abs(t0 - 12.0) < 1e-6:
            add(t0, tone(1760, 0.5, 0.18, 0.035)); add(t0 + 0.05, tone(2217.5, 0.5, 0.15, 0.022))
    elif kd == "snap":
        tt = np.arange(int(SR * 0.05)) / SR
        body = 0.20 * np.sin(2 * np.pi * 600 * tt) * np.exp(-tt / 0.012)
        ring = (0.22 * np.sin(2 * np.pi * 2400 * tt) + 0.12 * np.sin(2 * np.pi * 3150 * tt)) * np.exp(-tt / 0.008)
        hit = 0.30 * rng.uniform(-1, 1, len(tt)) * np.exp(-tt / 0.003)
        add(t0, body + ring + hit)
        if ref == "rej": add(t0, tone(110, 0.3, 0.07, 0.30))  # the diverter's thud
        if abs(t0 - 10.5) < 1e-6:
            add(t0 + 0.02, tone(659.26, 1.4, 0.45, 0.05)); add(t0 + 0.09, tone(880.0, 1.4, 0.40, 0.04))
    elif kd == "thump":
        add(t0, tone(55, 0.25, 0.045, 0.55))
        if abs(t0 - 9.5) < 1e-6:
            for i, fz in enumerate([220.0, 277.18, 329.63, 440.0, 554.36, 659.26]):
                add(t0 + 0.03 + 0.045 * i, tone(fz, 2.2, 0.9, 0.040))

peak = float(np.max(np.abs(mix)))
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
pcm = (np.repeat(np.clip(mix, -1, 1)[:, None], 2, axis=1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, {DUR:.1f} s; continuous layers: hum, pad, voice, air")
