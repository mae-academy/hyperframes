#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 42.0 s) from assets/cues.json and assets/sched.json.

Continuous layers (Connected Living Sounds):
  hum     50 Hz, -22 dBFS, unbroken 0 - 42 s, never ducked.
  pad     open fifths A-E (A2 E3 A3 E4) with slow tremolos. Calm in Act I, swells with the wall, drops to
          nothing but the hum at the halt (25.0 - 26.0 s), returns for the trick, gains the major third (C#) at the lock (35.8 s).
  voice   the wall's own voice: soft sine + 2nd/3rd harmonics (detuned pair) whose pitch follows the term count N on screen,
          pitch = 220 Hz * 1.5^(log4(N / 4)): 4 -> 220, 16 -> 330, 64 -> 495, 100 -> ~563 Hz; it glides to each new stage
          over 0.3 s and holds. Loudness grows with log N.
  type    rapid-fire typing: one soft click for every cell that appears and every cell that recalculates (assets/sched.json),
          so the density of clicks is the density of the picture.
  air     low-passed noise riding the voice; plus a faint academic tick every 0.5 s in Act I and II (very quiet).
Events from CUES: click 1800 Hz / 15 ms, snap = metallic lock, thump 55 Hz. The 27.9 s thump carries the "ding" (bell pair),
the 35.8 s thump the bright arpeggio with the C#, the 38.4 s snap a bell pair, the 40.0 s click a small shimmer.
Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 42.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())
sched = json.loads((root / "assets" / "sched.json").read_text())

n = int(SR * DUR)
t = np.arange(n) / SR
mix = np.zeros(n)
rng = np.random.default_rng(23)

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

# everything except the hum is gated at the halt: total quiet 25.0 - 26.2 s (the hum keeps the floor at about -25 dBFS RMS)
gate = smooth(env([(0, 1), (24.98, 1), (25.0, 0), (26.15, 0), (26.4, 1), (42, 1)]), 0.03)

# ------------------------------------------------------------------ hum
mix += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)

# ------------------------------------------------------------------ pad (open fifths, third at the lock)
pad_gain = smooth(env([(0, 0.0), (0.5, 0.35), (4.5, 0.45), (11.6, 0.6), (18, 0.9), (24.9, 1.1), (26.6, 0.45), (28, 0.6), (35.8, 1.0), (37, 1.15), (40, 1.0), (42, 0.55)]), 0.2)
pad = np.zeros(n)
for f0, amp, lfo_hz, ph in [(110.0, 0.030, 0.11, 0.0), (164.81, 0.026, 0.17, 1.3), (220.0, 0.022, 0.23, 2.1), (329.63, 0.014, 0.29, 3.4)]:
    trem = 0.8 + 0.2 * np.sin(2 * np.pi * lfo_hz * t + ph)
    pad += amp * trem * (np.sin(2 * np.pi * f0 * t) + 0.25 * np.sin(2 * np.pi * 2 * f0 * t))
third = smooth(env([(0, 0), (35.75, 0), (36.2, 1.0), (40, 1.0), (42, 0.6)]), 0.1)
pad += third * 0.020 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.19 * t + 0.7)) * (np.sin(2 * np.pi * 277.18 * t) + 0.25 * np.sin(2 * np.pi * 554.36 * t))
mix += gate * pad * pad_gain

# ------------------------------------------------------------------ voice: pitch follows the term count on screen
stages = sched["stages"]  # 11.6, 13.4, 15.2, 17.0 for N = 4, 16, 64, 100
Ns = [4, 16, 64, 100]
logN = np.full(n, np.log(4.0))
for st, N in zip(stages, Ns):
    ramp = np.clip((t - st) / 0.3, 0, 1)
    ramp = ramp * ramp * (3 - 2 * ramp)  # smoothstep glide to the new stage
    logN = np.where(t >= st, logN * (1 - ramp) + np.log(N) * ramp, logN)
log4 = (logN - np.log(4.0)) / np.log(4.0)
freq = 220.0 * 1.5 ** log4
level = 0.45 + 0.55 * np.clip((logN - np.log(4.0)) / (np.log(100) - np.log(4.0)), 0, 1)
voice_env = smooth(env([(0, 0), (11.5, 0), (11.8, 0.7), (24.9, 1.0), (25.0, 0), (42, 0)]), 0.05) * level
voice = np.zeros(n)
for det in (-1.2, 1.2):
    ph = 2 * np.pi * np.cumsum(freq + det) / SR
    voice += 0.5 * (np.sin(ph) + 0.38 * np.sin(2 * ph) + 0.14 * np.sin(3 * ph))
mix += 0.075 * gate * voice_env * voice

# ------------------------------------------------------------------ air + faint academic ticks
air = lowpass(rng.uniform(-1, 1, n), 1800.0)
air_env = smooth(env([(0, 0), (11.5, 0), (12, 0.5), (24.9, 1.0), (25.0, 0), (42, 0)]), 0.08)
mix += 0.018 * gate * air_env * air

def add(t0, sig, g=1.0):
    i = int(round(t0 * SR))
    if i >= n: return
    j = min(n, i + len(sig))
    mix[i:j] += g * sig[: j - i]

def tone(freq_hz, length, tau, amp):
    tt = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq_hz * tt) * np.exp(-tt / tau)

for tk in np.arange(0.5, 11.5, 0.5):  # gentle ticking, Phases 1-2
    add(float(tk), tone(1100, 0.02, 0.004, 0.035))

# ------------------------------------------------------------------ typing: one soft click per cell appearance / recalculation
times = sorted(sched["appear"] + sched["flashes"])
for k, ts in enumerate(times):
    if ts <= 0.0 or ts >= 25.0: continue
    f = 1500 + 900 * ((k * 37) % 11) / 11.0
    prog = np.clip((ts - 11.6) / 13.4, 0, 1)
    add(ts, tone(f, 0.012, 0.0025, 0.040 + 0.050 * prog), gate[int(ts * SR)])

# ------------------------------------------------------------------ discrete events from the CUES block
counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    k, t0 = c["kind"], c["t"]
    if k not in counts:
        raise SystemExit(f"unknown cue kind {k}")
    counts[k] += 1
    if k == "click":
        add(t0, tone(1800, 0.015, 0.003, 0.30))
        if abs(t0 - 40.0) < 1e-6:
            add(t0, tone(1760, 0.5, 0.18, 0.035)); add(t0 + 0.05, tone(2217.5, 0.5, 0.15, 0.022))
    elif k == "snap":
        tt = np.arange(int(SR * 0.05)) / SR
        body = 0.20 * np.sin(2 * np.pi * 600 * tt) * np.exp(-tt / 0.012)
        ring = (0.22 * np.sin(2 * np.pi * 2400 * tt) + 0.12 * np.sin(2 * np.pi * 3150 * tt)) * np.exp(-tt / 0.008)
        hit = 0.30 * rng.uniform(-1, 1, len(tt)) * np.exp(-tt / 0.003)
        add(t0, body + ring + hit)
        if abs(t0 - 38.4) < 1e-6:
            add(t0 + 0.02, tone(659.26, 1.4, 0.45, 0.05)); add(t0 + 0.09, tone(880.0, 1.4, 0.40, 0.04))
    elif k == "thump":
        add(t0, tone(55, 0.25, 0.045, 0.55))
        if abs(t0 - 27.9) < 1e-6:  # the "ding": a crisp resonant bell pair, open fifth (no third yet)
            add(t0 + 0.01, tone(1318.5, 1.8, 0.55, 0.060)); add(t0 + 0.01, tone(1760.0, 1.8, 0.50, 0.045))
        if abs(t0 - 35.8) < 1e-6:  # the lock: bright A-major arpeggio, the third arrives
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
print(f"{out.name}: {len(cues)} cues {counts}, {len(times)} typing clicks, peak {peak:.3f}, {DUR:.1f} s; RMS per 0.5 s: min {min(rms):.1f} max {max(rms):.1f} dBFS")
