#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 46.0 s) from assets/cues.json and assets/sched.json.

Connected Living Sounds, tied to the one variable on screen: the number of blocks N (8 -> 1).
  hum     50 Hz, -22 dBFS, unbroken 0 - 46 s.
  pad     open fifths A-E (A2 E3 A3 E4) with slow tremolos; it swells with every simplification and gains the
          major third (C#) at the lock (36.6 s), exactly when the closed form is confirmed.
  voice   the diagram's own voice: soft sine + 2nd/3rd harmonics (detuned pair), pitch = 220 Hz * 2^((8 - N) / 7),
          so the pitch climbs a full octave (A3 -> A4) as eight blocks collapse to one; it glides 0.35 s to each new N
          and holds. It is the same step function as the counter on screen.
  air     low-passed breath riding the voice.
  pings   every merge (the snap cues at 6.0, 10.6, ..., 33.6 s) carries a damped bell on the A-major pentatonic
          ladder (A4 B4 C#5 E5 F#5 A5, then A5 + E6 at the last merge), so the simplification literally sounds like a scale.
Accents from CUES: click 1800 Hz / 15 ms, snap = metallic lock, thump 55 Hz. The 36.6 s thump carries the bright
arpeggio, the 40.8 s snap a bell pair, the 43.2 s click a small high shimmer. Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 46.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())
sched = json.loads((root / "assets" / "sched.json").read_text())

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(31)

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

def add(t0, sig, g=1.0):
    i = int(round(t0 * SR))
    if i >= n: return
    j = min(n, i + len(sig))
    mix[i:j] += g * sig[: j - i]

def tone(freq_hz, length, tau, amp):
    tt = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq_hz * tt) * np.exp(-tt / tau)

def bell(freq_hz, amp, length=1.8, tau=0.55):
    tt = np.arange(int(SR * length)) / SR
    d = np.exp(-tt / tau)
    return amp * d * (np.sin(2 * np.pi * freq_hz * tt) + 0.30 * np.sin(2 * np.pi * 2.0 * freq_hz * tt) * np.exp(-tt / 0.2) + 0.12 * np.sin(2 * np.pi * 3.01 * freq_hz * tt) * np.exp(-tt / 0.1))

# ------------------------------------------------------------------ hum
mix += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)

# ------------------------------------------------------------------ pad
merges = sched["merges"]  # [[time, N], ...]
pad_pts = [(0, 0.0), (0.5, 0.4), (3.6, 0.5)] + [(m[0], 0.5 + 0.08 * i) for i, m in enumerate(merges)] + [(36.6, 1.1), (38.5, 1.2), (43, 1.0), (46, 0.55)]
pad_pts = sorted(pad_pts)
pad_gain = smooth(env(pad_pts), 0.25)
pad = np.zeros(n)
for f0, amp, lfo_hz, ph in [(110.0, 0.030, 0.11, 0.0), (164.81, 0.026, 0.17, 1.3), (220.0, 0.022, 0.23, 2.1), (329.63, 0.014, 0.29, 3.4)]:
    trem = 0.8 + 0.2 * np.sin(2 * np.pi * lfo_hz * t + ph)
    pad += amp * trem * (np.sin(2 * np.pi * f0 * t) + 0.25 * np.sin(2 * np.pi * 2 * f0 * t))
third = smooth(env([(0, 0), (36.55, 0), (37.0, 1.0), (43, 1.0), (46, 0.6)]), 0.1)
pad += third * 0.020 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.19 * t + 0.7)) * (np.sin(2 * np.pi * 277.18 * t) + 0.25 * np.sin(2 * np.pi * 554.36 * t))
mix += pad * pad_gain

# ------------------------------------------------------------------ voice: pitch follows the block count N
N = np.full(n, float(sched["initial"]))
for tm, nn in merges:
    ramp = np.clip((t - tm) / 0.35, 0, 1)
    ramp = ramp * ramp * (3 - 2 * ramp)
    N = np.where(t >= tm, N * (1 - ramp) + nn * ramp, N)
x = (8.0 - N) / 7.0                       # 0 -> 1 as the diagram collapses
freq = 220.0 * 2.0 ** x
level = 0.5 + 0.5 * x
voice_env = smooth(env([(0, 0), (3.4, 0), (3.9, 0.8), (36.5, 1.0), (37.2, 0.28), (40.0, 0.0), (46, 0)]), 0.06) * level
voice = np.zeros(n)
for det in (-1.2, 1.2):
    ph = 2 * np.pi * np.cumsum(freq + det) / SR
    voice += 0.5 * (np.sin(ph) + 0.38 * np.sin(2 * ph) + 0.14 * np.sin(3 * ph))
mix += 0.075 * voice_env * voice

# ------------------------------------------------------------------ air
air = lowpass(rng.uniform(-1, 1, n), 1800.0)
air_env = smooth(env([(0, 0), (3.6, 0), (4.2, 0.5), (36.5, 0.9), (37.5, 0.2), (40, 0), (46, 0)]), 0.08)
mix += 0.016 * air_env * (0.4 + 0.6 * x) * air

# ------------------------------------------------------------------ events
penta = [440.0, 493.88, 554.37, 659.26, 739.99, 880.0]
merge_times = [round(m[0], 3) for m in merges]
counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    k, t0 = c["kind"], c["t"]
    if k not in counts:
        raise SystemExit(f"unknown cue kind {k}")
    counts[k] += 1
    if k == "click":
        add(t0, tone(1800, 0.015, 0.003, 0.30))
        if abs(t0 - 43.2) < 1e-6:
            add(t0, tone(1760, 0.5, 0.18, 0.035)); add(t0 + 0.05, tone(2217.5, 0.5, 0.15, 0.022))
    elif k == "snap":
        tt = np.arange(int(SR * 0.05)) / SR
        body = 0.20 * np.sin(2 * np.pi * 600 * tt) * np.exp(-tt / 0.012)
        ring = (0.22 * np.sin(2 * np.pi * 2400 * tt) + 0.12 * np.sin(2 * np.pi * 3150 * tt)) * np.exp(-tt / 0.008)
        hit = 0.30 * rng.uniform(-1, 1, len(tt)) * np.exp(-tt / 0.003)
        add(t0, body + ring + hit)
        if any(abs(t0 - mt) < 1e-6 for mt in merge_times):
            i = [abs(t0 - mt) < 1e-6 for mt in merge_times].index(True)
            if i < 6:
                add(t0 + 0.01, bell(penta[i], 0.055))
            else:  # the last merge: four blocks become one, a full open chord
                add(t0 + 0.01, bell(880.0, 0.05)); add(t0 + 0.03, bell(1318.5, 0.045)); add(t0 + 0.05, bell(1760.0, 0.03))
        if abs(t0 - 40.8) < 1e-6:
            add(t0 + 0.02, tone(659.26, 1.4, 0.45, 0.05)); add(t0 + 0.09, tone(880.0, 1.4, 0.40, 0.04))
    elif k == "thump":
        add(t0, tone(55, 0.25, 0.045, 0.55))
        if abs(t0 - 36.6) < 1e-6:
            for i, fz in enumerate([220.0, 277.18, 329.63, 440.0, 554.36, 659.26]):
                add(t0 + 0.03 + 0.045 * i, tone(fz, 2.2, 0.9, 0.040))

peak = float(np.max(np.abs(mix)))
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
pcm = (np.repeat(np.clip(mix, -1, 1)[:, None], 2, axis=1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
win = int(0.5 * SR)
rms = [20 * np.log10(np.sqrt(np.mean(mix[i:i + win] ** 2)) + 1e-12) for i in range(0, n - win + 1, win)]
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, {DUR:.1f} s; RMS per 0.5 s: min {min(rms):.1f} max {max(rms):.1f} dBFS; voice {freq.min():.0f} -> {freq.max():.0f} Hz")
