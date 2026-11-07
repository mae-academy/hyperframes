#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 22.0 s) for the Fourier square-wave reel.

"الأصوات الحية المتصلة" (Connected Living Sounds): continuous layers computed from the same numbers as the picture,
discrete hits only as accents. Inputs: assets/cues.json (from the page timeline) and assets/sched.json (the harmonic schedule).

Continuous layers
  hum    50 Hz, -22 dBFS, unbroken 0.0 - 22.0 s.
  pad    open fifths A-E (A2 E3 A3 E4) with slow tremolos; the major third (C#) joins at the lock (16.2 s).
  voice  ADDITIVE SYNTHESIS OF THE PICTURE: A3 (220 Hz) with harmonics k = 2n-1 weighted by exactly the same
         smooth(clamp(N(t) - (n-1))) that sizes the epicycles on screen. One harmonic = one more circle = one more
         partial in the sound. N = 1 is a pure sine, N = 50 a bright almost-square tone, N -> infinity a band-limited
         square wave (partials above 12 kHz are inaudible and left out). Rewinding the picture rewinds the sound.
  clarity a second additive layer with a flatter spectrum (1/sqrt(k)) on the same weights, so every partial that
         joins is plainly audible instead of hiding under the 1/k roll-off of a true square wave.
  air    a breath of low-passed noise that follows how fast harmonics are being added (|dN/dt|).
Damped harmonic pings
  every time a new circle joins the picture, its own partial rings once at its own frequency k*220 Hz as a
  damped sine (decay 0.12 - 0.26 s): you hear 660, 1100, 1540 ... climb stage by stage; the lock adds a
  cascade of pings up to 9 kHz. They are derived from N(t), exactly like the circles.
Accents
  tick 3600 Hz / 8 ms (the rewind ticks glide down), click 1800 Hz / 15 ms (+ a soft pentatonic bell on each stage),
  snap = metallic vice lock, thump 55 Hz, stab = band-limited SQUARE-WAVE stab (110 Hz + 220 Hz) at the opening
  slam and at the lock. Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 22.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())
sched = json.loads((root / "assets" / "sched.json").read_text())["SCHED"]

n_s = int(SR * DUR)
t = np.arange(n_s) / SR
mix = np.zeros(n_s)
rng = np.random.default_rng(23)  # seeded: deterministic noise

def c3(p):  # GSAP power2.inOut
    p = np.clip(p, 0, 1)
    return np.where(p < 0.5, 4 * p**3, 1 - (-2 * p + 2) ** 3 / 2)

def smooth_env(x, sec):
    k = max(1, int(sec * SR))
    c = np.cumsum(np.insert(x, 0, 0))
    out = (c[k:] - c[:-k]) / k
    return np.concatenate([np.full(k // 2, out[0]), out, np.full(k - k // 2 - 1, out[-1])])[: len(x)]

def env(points):
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)

def lowpass(x, fc):
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y

# ------------------------------------------------------------------ N(t): the number of harmonics (same law as the picture)
Neff = np.full(n_s, float(sched["start"]))
for r in sched["ramps"]:
    m = (t >= r["t0"]) & (t < r["t1"])
    Neff[m] = r["from"] + (r["to"] - r["from"]) * c3((t[m] - r["t0"]) / (r["t1"] - r["t0"]))
    Neff[t >= r["t1"]] = r["to"]
LOCK = sched["lock"]

# ------------------------------------------------------------------ hum
mix += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)

# ------------------------------------------------------------------ pad
pad_gain = smooth_env(env([(0, 0.35), (0.9, 0.45), (1.6, 0.35), (4.6, 0.55), (10.2, 0.8), (15.2, 1.0), (LOCK, 1.15), (18.6, 0.9), (21.5, 0.6), (22.0, 0.5)]), 0.25)
pad = np.zeros(n_s)
for f0, amp, lfo, ph in [(110.0, 0.030, 0.11, 0.0), (164.81, 0.026, 0.17, 1.3), (220.0, 0.020, 0.23, 2.1), (329.63, 0.013, 0.29, 3.4)]:
    pad += amp * (0.8 + 0.2 * np.sin(2 * np.pi * lfo * t + ph)) * (np.sin(2 * np.pi * f0 * t) + 0.25 * np.sin(2 * np.pi * 2 * f0 * t))
third = smooth_env(env([(0, 0), (LOCK - 0.05, 0), (LOCK + 0.4, 1.0), (22.0, 0.7)]), 0.1)
pad += third * 0.020 * (np.sin(2 * np.pi * 277.18 * t) + 0.25 * np.sin(2 * np.pi * 554.36 * t))
mix += pad * pad_gain

# ------------------------------------------------------------------ voice: additive synthesis of the partial sum on screen
F0 = 220.0
KMAX_HZ = 12000.0
nmax = int(KMAX_HZ // F0 + 1) // 2  # k = 2n-1 <= 54  ->  n <= 27
voice = np.zeros(n_s)
for n in range(1, nmax + 1):
    k = 2 * n - 1
    x = np.clip(Neff - (n - 1), 0, 1)
    w = x * x * (3 - 2 * x)  # smoothstep, identical to the picture
    if not w.any():
        continue
    osc = 0.5 * (np.sin(2 * np.pi * k * (F0 - 0.5) * t) + np.sin(2 * np.pi * k * (F0 + 0.5) * t))  # detuned pair: slow shimmer
    voice += w * osc / k
voice_gain = smooth_env(env([(0, 1.1), (0.8, 1.0), (0.9, 0.8), (1.7, 0.6), (4.6, 0.62), (15.2, 0.8), (LOCK, 0.95), (17.4, 0.82), (18.6, 0.8), (22.0, 0.35)]), 0.06)
voice = lowpass(voice, 7500.0)  # soften the top of the square (less edge, same shape)
mix += 0.100 * voice_gain * voice

# ------------------------------------------------------------------ clarity layer: flatter spectrum on the same weights
clar = np.zeros(n_s)
for n in range(1, nmax + 1):
    k = 2 * n - 1
    x = np.clip(Neff - (n - 1), 0, 1)
    w = x * x * (3 - 2 * x)
    if not w.any():
        continue
    clar += w * np.sin(2 * np.pi * k * F0 * t + 0.7 * k) / np.sqrt(k)
clar_gain = smooth_env(env([(0, 1.0), (0.85, 0.9), (1.7, 0.55), (4.6, 0.6), (15.2, 0.75), (LOCK, 1.0), (18.6, 0.7), (22.0, 0.3)]), 0.06)
clar = lowpass(clar, 5000.0)  # the clarity layer carries the mid partials, not the hiss
mix += 0.018 * clar_gain * clar

# ------------------------------------------------------------------ air: follows the speed of harmonic additions
dN = np.abs(np.gradient(Neff, 1 / SR))
act = smooth_env(np.clip(dN / 25.0, 0, 1), 0.12)
air = lowpass(rng.uniform(-1, 1, n_s), 2600.0)
mix += 0.020 * act * air

# ------------------------------------------------------------------ accents
def add(t0, sig, g=1.0):
    i = int(round(t0 * SR)); j = min(n_s, i + len(sig))
    if i < n_s:
        mix[i:j] += g * sig[: j - i]

def tone(freq_hz, length, tau, amp):
    tt = np.arange(int(SR * length)) / SR
    return amp * np.sin(2 * np.pi * freq_hz * tt) * np.exp(-tt / tau)

def square_stab(f0, length, tau, amp):
    tt = np.arange(int(SR * length)) / SR
    sig = np.zeros_like(tt)
    for k in range(1, int(11000 // f0) + 1, 2):  # band-limited square wave: odd harmonics, 1/k
        sig += np.sin(2 * np.pi * k * f0 * tt) / k
    sig = lowpass(sig, 4500.0)
    return amp * sig * np.exp(-tt / tau) * np.minimum(1, tt / 0.004)

def bell(freq_hz, amp, tau=0.7, length=1.6):
    return tone(freq_hz, length, tau, amp) + tone(2.76 * freq_hz, length, tau * 0.5, amp * 0.18)

# ------------------------------------------------------------------ damped pings: one per harmonic that joins the picture
def ping(freq_hz, amp, tau):
    tt = np.arange(int(SR * min(1.2, 6 * tau))) / SR
    return amp * np.sin(2 * np.pi * freq_hz * tt) * np.exp(-tt / tau) * np.minimum(1, tt / 0.002)

ping_log = []
after = t > 1.6
for n in range(2, 21):  # k = 3 .. 39  (660 Hz .. 8.6 kHz)
    idx = np.nonzero(after & (Neff >= n - 0.5))[0]
    if len(idx) == 0:
        continue
    t_n = float(t[idx[0]])
    k = 2 * n - 1
    add(t_n, ping(k * F0, 0.075 * k ** -0.55, 0.26 / (1 + k / 22.0)))
    ping_log.append((round(t_n, 2), k))
for i, k in enumerate(range(21, 37, 2)):  # the cascade while N runs on to infinity (to 8 kHz)
    t_c = 15.25 + 0.1 * i
    add(t_c, ping(k * F0, 0.05 * k ** -0.7, 0.13))
    ping_log.append((round(t_c, 2), k))

BELLS = [440.0, 554.37, 659.26, 880.0, 1108.73]  # A4 C#5 E5 A5 C#6, one per stage step
STAGE_T = [4.6, 7.6, 10.2, 12.8, 15.2]
counts = {}
for c in cues:
    k, t0 = c["kind"], c["t"]
    counts[k] = counts.get(k, 0) + 1
    if k == "tick":
        f = 3600.0 if t0 > 1.4 else 3600.0 - (t0 - 0.9) / 0.4 * 1500.0  # the rewind ticks fall
        add(t0, tone(f, 0.008, 0.0012, 0.16))
    elif k == "click":
        add(t0, tone(1800, 0.015, 0.003, 0.30))
        if any(abs(t0 - s) < 1e-6 for s in STAGE_T):
            add(t0 + 0.01, bell(BELLS[STAGE_T.index(min(STAGE_T, key=lambda s: abs(s - t0)))], 0.04))
        if abs(t0 - 16.7) < 1e-6:  # the check mark
            add(t0, tone(2637.0, 0.35, 0.09, 0.06))
        if abs(t0 - 20.9) < 1e-6:  # slider reaches infinity: small bright chord
            for i, fz in enumerate([880.0, 1108.73, 1318.51]):
                add(t0 + 0.03 * i, bell(fz, 0.035, 0.6, 1.4))
    elif k == "snap":
        tt = np.arange(int(SR * 0.05)) / SR
        body = 0.20 * np.sin(2 * np.pi * 600 * tt) * np.exp(-tt / 0.012)
        ring = (0.18 * np.sin(2 * np.pi * 2400 * tt) + 0.08 * np.sin(2 * np.pi * 3150 * tt)) * np.exp(-tt / 0.008)
        hit = 0.30 * rng.uniform(-1, 1, len(tt)) * np.exp(-tt / 0.003)
        add(t0, body + ring + hit)
        if abs(t0 - 18.6) < 1e-6:
            add(t0 + 0.02, bell(659.26, 0.045)); add(t0 + 0.09, bell(880.0, 0.04))
    elif k == "thump":
        add(t0, tone(55, 0.25, 0.045, 0.45))
        if abs(t0 - LOCK) < 1e-6:  # lock: bright A-major arpeggio rides the thump
            for i, fz in enumerate([220.0, 277.18, 329.63, 440.0, 554.37, 659.26]):
                add(t0 + 0.03 + 0.045 * i, bell(fz, 0.04, 0.9, 2.2))
    elif k == "stab":
        add(t0, square_stab(110.0, 0.55, 0.17, 0.12))
        add(t0, square_stab(220.0, 0.45, 0.14, 0.06))
    else:
        raise SystemExit(f"unknown cue kind {k}")

peak = float(np.max(np.abs(mix)))
if peak > 0.85:
    mix *= 0.85 / peak  # keep headroom; the export pass sets the final loudness
    peak = 0.85
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
rms = [20 * np.log10(max(np.sqrt(np.mean(mix[int(i * SR * .5):int((i + 1) * SR * .5)] ** 2)), 1e-6)) for i in range(int(DUR * 2))]
assert min(rms) > -40, f"a window is nearly silent: {min(rms):.1f} dBFS"
pcm = (np.repeat(np.clip(mix, -1, 1)[:, None], 2, axis=1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, quietest 0.5 s window {min(rms):.1f} dBFS, loudest {max(rms):.1f}; layers: hum, pad, additive voice + clarity layer, air; {len(ping_log)} damped harmonic pings")
