#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 15.0 s) from assets/cues.json (exported by the page timeline).

Continuous layers (all smooth, all tied to what is on screen):
  hum     50 Hz lab hum, -22 dBFS, unbroken 0.0 - 15.0 s.
  pad     open fifths A-E (A2, E3, A3, E4) with slow independent tremolos; it swells with the film and
          gains the major third (C#) exactly when the identity is confirmed (9.5 s), then settles.
  voice   the point's own voice: a soft sine + 2nd/3rd harmonics (detuned pair for a slow shimmer) whose pitch
          follows x. pitch(x) = 220 Hz * 1.5^(x - 1): a perfect fifth per unit of x, so the scan (x -1 -> 1)
          climbs, it holds at x = 1 while the base clamps, and the flight (x 1 -> 2) rises A3 -> E4 using the
          very same easing law as the picture (power2.inOut scan, power1.inOut flight).
  air     a whisper of low-passed noise riding the voice's loudness (more height, more air). No whooshes.
Events (from CUES): click 1800 Hz / 15 ms, snap = metallic vice lock, thump 55 Hz; the 9.5 s thump carries a
soft A-major arpeggio, the 10.5 s snap a bell pair, the 12.0 s click a small high shimmer.
Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 15.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(17)  # seeded: deterministic noise

def power1_inout(p):  # GSAP power1.inOut
    return np.where(p < 0.5, 2 * p * p, 1 - 2 * (1 - p) ** 2)

def power2_inout(p):  # GSAP power2.inOut
    return np.where(p < 0.5, 4 * p**3, 1 - (-2 * p + 2) ** 3 / 2)

def env(points):  # piecewise-linear envelope from (time, value) pairs
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)

def smooth(x, sec):  # moving-average smoothing so envelopes never click
    k = max(1, int(sec * SR))
    c = np.cumsum(np.insert(x, 0, 0))
    out = (c[k:] - c[:-k]) / k
    return np.concatenate([np.full(k // 2, out[0]), out, np.full(k - k // 2 - 1, out[-1])])[: len(x)]

def lowpass(x, fc):  # one-pole low-pass
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y

# ------------------------------------------------------------------ hum (unbroken)
mix += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)

# ------------------------------------------------------------------ pad: open fifths, third arrives at 9.5 s
pad_gain = smooth(env([(0, 0.0), (0.4, 0.35), (1.5, 0.55), (3.2, 0.8), (8.5, 1.0), (9.5, 1.15), (12.5, 1.0), (14.3, 0.7), (15.0, 0.55)]), 0.2)
pad = np.zeros(n)
for f0, amp, lfo_hz, ph in [(110.0, 0.030, 0.11, 0.0), (164.81, 0.026, 0.17, 1.3), (220.0, 0.022, 0.23, 2.1), (329.63, 0.014, 0.29, 3.4)]:
    trem = 0.8 + 0.2 * np.sin(2 * np.pi * lfo_hz * t + ph)
    pad += amp * trem * (np.sin(2 * np.pi * f0 * t) + 0.25 * np.sin(2 * np.pi * 2 * f0 * t))
third = smooth(env([(0, 0), (9.45, 0), (9.9, 1.0), (14.3, 1.0), (15.0, 0.6)]), 0.1)  # C# (major third) joins at the confirmation
pad += third * 0.020 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.19 * t + 0.7)) * (np.sin(2 * np.pi * 277.18 * t) + 0.25 * np.sin(2 * np.pi * 554.36 * t))
mix += pad * pad_gain

# ------------------------------------------------------------------ voice of the point: pitch follows x
# x(t): -1 before the scan, scan 2.0-3.2 (power2.inOut) to 1, hold, flight 4.5-8.5 (power1.inOut) to 2, hold
x = np.full(n, -1.0)
m = (t >= 2.0) & (t < 3.2); x[m] = -1 + 2 * power2_inout((t[m] - 2.0) / 1.2)
x[(t >= 3.2) & (t < 4.5)] = 1.0
m = (t >= 4.5) & (t < 8.5); x[m] = 1 + power1_inout((t[m] - 4.5) / 4.0)
x[t >= 8.5] = 2.0
freq = 220.0 * 1.5 ** (x - 1.0)
height = np.exp(x) / np.exp(2.0)  # 0..1: loudness grows with the height of the point
voice_env = smooth(env([(0, 0), (1.9, 0), (2.05, 0.8), (3.1, 0.9), (3.3, 0.30), (4.4, 0.30), (4.7, 0.55), (8.5, 1.0), (9.0, 0.7), (9.9, 0.0), (15.0, 0.0)]), 0.05)
voice_env = voice_env * (0.45 + 0.55 * np.sqrt(np.clip(height, 0, 1)))
voice = np.zeros(n)
for det, a in [(-1.2, 0.5), (+1.2, 0.5)]:  # detuned pair: slow, warm beating
    ph = 2 * np.pi * np.cumsum(freq + det) / SR
    voice += a * (np.sin(ph) + 0.38 * np.sin(2 * ph) + 0.14 * np.sin(3 * ph))
mix += 0.085 * voice_env * voice

# ------------------------------------------------------------------ air: breath that rides the voice
air = lowpass(rng.uniform(-1, 1, n), 1800.0)
air_env = smooth(env([(0, 0), (2.0, 0), (2.2, 0.5), (3.1, 0.7), (3.3, 0), (4.5, 0), (4.8, 0.5), (8.5, 1.0), (9.3, 0), (15, 0)]), 0.08)
mix += 0.020 * air_env * (0.4 + 0.6 * np.clip(height, 0, 1)) * air

# ------------------------------------------------------------------ discrete events from the CUES block
def add(t0, sig):
    i = int(round(t0 * SR)); j = min(n, i + len(sig))
    mix[i:j] += sig[: j - i]

def tone(freq_hz, length, tau, amp):
    tt = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq_hz * tt) * np.exp(-tt / tau)

counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    k, t0 = c["kind"], c["t"]
    if k not in counts:
        raise SystemExit(f"unknown cue kind {k}")
    counts[k] += 1
    if k == "click":
        add(t0, tone(1800, 0.015, 0.003, 0.30))
        if abs(t0 - 12.0) < 1e-6:  # engagement pulse: small high shimmer
            add(t0, tone(1760, 0.5, 0.18, 0.035)); add(t0 + 0.05, tone(2217.5, 0.5, 0.15, 0.022))
    elif k == "snap":
        tt = np.arange(int(SR * 0.05)) / SR
        body = 0.20 * np.sin(2 * np.pi * 600 * tt) * np.exp(-tt / 0.012)
        ring = (0.22 * np.sin(2 * np.pi * 2400 * tt) + 0.12 * np.sin(2 * np.pi * 3150 * tt)) * np.exp(-tt / 0.008)
        hit = 0.30 * rng.uniform(-1, 1, len(tt)) * np.exp(-tt / 0.003)
        add(t0, body + ring + hit)
        if abs(t0 - 10.5) < 1e-6:  # CTA reveal: bell pair
            add(t0 + 0.02, tone(659.26, 1.4, 0.45, 0.05)); add(t0 + 0.09, tone(880.0, 1.4, 0.40, 0.04))
    elif k == "thump":
        add(t0, tone(55, 0.25, 0.045, 0.55))
        if abs(t0 - 9.5) < 1e-6:  # confirmation: soft A-major arpeggio
            for i, fz in enumerate([220.0, 277.18, 329.63, 440.0, 554.36, 659.26]):
                add(t0 + 0.03 + 0.045 * i, tone(fz, 2.2, 0.9, 0.040))

peak = float(np.max(np.abs(mix)))
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
pcm = (np.repeat(np.clip(mix, -1, 1)[:, None], 2, axis=1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, {DUR:.1f} s; continuous layers: hum, pad, voice, air")
