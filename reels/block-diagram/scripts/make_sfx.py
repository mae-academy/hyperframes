#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit, 31.0 s) from assets/cues.json and assets/sched.json.

Designed to sound played, not beeped: every sound is a small physical model, a little different each time, and sits in one room.

  click   a soft mouse / key tap: a 4 ms band-passed noise transient (the contact) + a short wooden body whose pitch falls
          (the housing) + a quieter, brighter release tick 55 ms later. Seeded variation per click (pitch, level, pan), so
          a run of clicks never machine-guns.
  merge   a marimba-style bar (inharmonic partials 1 : 3.99 : 9.2 with their own decays, a mallet thud) on the A-major
          pentatonic ladder A4 B4 C#5 E5 F#5 A5, one note per reduction move; the last merge is an open chord. The ladder
          replaces the old pitch-follows-count voice: it climbs, but as notes, not as a sliding tone.
  kick    the opening thump and the lock: a pitched-down sine (110 -> 48 Hz) with a soft felt click, never a bare sine.
  bell    the lock arpeggio, the CTA and the engagement ping: glockenspiel partials 1 : 2.76 : 5.4 : 8.93 with the high
          ones dying first.
  pad     warm open fifths A-E (A2 E3 A3 E4), each note a stack of 3 slightly detuned triangle-like voices with slow
          tremolo; the brightness (not the pitch) opens as blocks disappear; the major third (C#) arrives at the lock.
  hum     50 Hz at -22 dBFS, unbroken (house rule).  air: a quiet low-passed breath.
Everything except the hum goes through one short plate-like reverb (synthetic, seeded) and a gentle soft clip, so the clicks and
bells share a space. Peak is asserted < 0.98.
"""
import json, pathlib, wave
import numpy as np

SR, DUR = 48000, 31.0
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())
sched = json.loads((root / "assets" / "sched.json").read_text())
rng = np.random.default_rng(2026)

n = int(SR * DUR)
t = np.arange(n) / SR
dry = np.zeros((2, n))      # direct sound (L, R)
send = np.zeros(n)          # reverb send (mono)
hum = np.zeros(n)

def env(points):
    ts, vs = zip(*points)
    return np.interp(t, ts, vs)

def smooth(x, sec):
    k = max(1, int(sec * SR))
    c = np.cumsum(np.insert(x, 0, 0))
    out = (c[k:] - c[:-k]) / k
    return np.concatenate([np.full(k // 2, out[0]), out, np.full(k - k // 2 - 1, out[-1])])[: len(x)]

def fband(x, lo, hi):
    """smooth frequency-domain band-pass (lo or hi may be None)"""
    m = len(x)
    X = np.fft.rfft(x, 2 * m)
    f = np.fft.rfftfreq(2 * m, 1 / SR)
    g = np.ones_like(f)
    if lo: g *= 1 / (1 + (lo / np.maximum(f, 1)) ** 4)
    if hi: g *= 1 / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * g)[:m]

def place(t0, sig, gain=1.0, pan=0.0, wet=0.2):
    i = int(round(t0 * SR))
    if i >= n: return
    j = min(n, i + len(sig))
    s = sig[: j - i] * gain
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    dry[0, i:j] += s * l * 1.414
    dry[1, i:j] += s * r * 1.414
    send[i:j] += s * wet

def noise_burst(ms, tau_ms):
    k = int(SR * ms / 1000)
    tt = np.arange(k) / SR
    return rng.uniform(-1, 1, k) * np.exp(-tt / (tau_ms / 1000))

# ------------------------------------------------------------------ the click: contact + wooden body + release
def click(t0, level=1.0):
    var = rng.uniform(0.94, 1.07)
    g = level * 10 ** (rng.uniform(-1.2, 1.2) / 20)
    pan = rng.uniform(-0.25, 0.25)
    # contact transient (down)
    ct = fband(noise_burst(8, 1.3), 1600 * var, 5200)
    ct /= np.max(np.abs(ct)) + 1e-9
    # wooden body: pitch falls 760 -> 330 Hz
    k = int(SR * 0.09); tt = np.arange(k) / SR
    f = 330 * var + 430 * var * np.exp(-tt / 0.012)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.014)
    s = np.zeros(k); s[: len(ct)] += 0.55 * ct; s += 0.40 * body
    place(t0, s, 0.30 * g, pan, 0.16)
    # release tick (up): quieter, brighter, a hair later
    rt = fband(noise_burst(5, 0.8), 2600, 6500)
    rt /= np.max(np.abs(rt)) + 1e-9
    place(t0 + 0.052 + rng.uniform(-0.004, 0.004), rt, 0.085 * g, pan, 0.12)

# ------------------------------------------------------------------ marimba bar
def marimba(t0, f0, amp=0.5, long=1.0, pan=0.0):
    length = 2.2 * long
    k = int(SR * length); tt = np.arange(k) / SR
    sc = (440.0 / f0) ** 0.5
    parts = [(1.0, 1.0, 0.55 * long * sc), (3.99, 0.33, 0.13 * sc), (9.2, 0.10, 0.045 * sc)]
    s = np.zeros(k)
    for ratio, a, tau in parts:
        s += a * np.sin(2 * np.pi * f0 * ratio * tt) * np.exp(-tt / tau)
    mallet = fband(noise_burst(6, 1.5), 700, 2600)
    mallet /= np.max(np.abs(mallet)) + 1e-9
    s[: len(mallet)] += 0.35 * mallet
    s *= np.minimum(1, tt / 0.002)      # no click on the attack
    place(t0, s, amp, pan, 0.30)

# ------------------------------------------------------------------ glockenspiel / bell
def bell(t0, f0, amp=0.3, long=1.0, pan=0.0):
    length = 3.0 * long
    k = int(SR * length); tt = np.arange(k) / SR
    parts = [(1.0, 1.0, 1.5 * long), (2.76, 0.42, 0.7 * long), (5.4, 0.22, 0.32 * long), (8.93, 0.12, 0.16 * long)]
    s = np.zeros(k)
    for ratio, a, tau in parts:
        s += a * np.sin(2 * np.pi * f0 * ratio * tt + rng.uniform(0, 6.28)) * np.exp(-tt / tau)
    s *= np.minimum(1, tt / 0.001)
    place(t0, s, amp, pan, 0.45)

# ------------------------------------------------------------------ felt kick
def kick(t0, amp=0.5):
    k = int(SR * 0.45); tt = np.arange(k) / SR
    f = 48 + 62 * np.exp(-tt / 0.03)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.11)
    felt = fband(noise_burst(10, 2.0), 150, 900)
    felt /= np.max(np.abs(felt)) + 1e-9
    s[: len(felt)] += 0.22 * felt
    s *= np.minimum(1, tt / 0.0015)
    place(t0, s, amp, 0.0, 0.14)

# ------------------------------------------------------------------ continuous layers
hum += 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)

merges = sched["merges"]
prog = np.zeros(n)                  # 0 -> 1 as blocks disappear (same step function as the counter), used for brightness
last = float(sched["initial"])
for tm, nn in merges:
    ramp = np.clip((t - tm) / 0.5, 0, 1)
    ramp = ramp * ramp * (3 - 2 * ramp)
    prog = np.where(t >= tm, prog * (1 - ramp) + ((8.0 - nn) / 7.0) * ramp, prog)

pad_gain = smooth(env([(0, 0.0), (0.4, 0.5), (2.2, 0.6), (18.4, 0.9), (24.4, 1.15), (26.5, 1.2), (29.5, 0.95), (31, 0.5)]), 0.25)
pad = np.zeros(n)
def voice(f0, amp, lfo_hz, ph, third=False):
    out = np.zeros(n)
    for det in (-0.0016, 0.0, 0.0017):
        f = f0 * (1 + det)
        ph_ = 2 * np.pi * f * t + rng.uniform(0, 6.28)
        v = np.sin(ph_)
        for h, a in ((2, 0.30), (3, 0.14 * (0.25 + 0.75 * prog)), (4, 0.08 * (0.2 + 0.8 * prog)), (5, 0.04 * prog)):
            v = v + a * np.sin(h * ph_)
        out += v / 3
    trem = 0.82 + 0.18 * np.sin(2 * np.pi * lfo_hz * t + ph)
    return amp * trem * out
for f0, amp, lfo_hz, ph in [(110.0, 0.034, 0.09, 0.0), (164.81, 0.028, 0.14, 1.3), (220.0, 0.022, 0.19, 2.1), (329.63, 0.014, 0.23, 3.4)]:
    pad += voice(f0, amp, lfo_hz, ph)
third = smooth(env([(0, 0), (24.35, 0), (24.9, 1.0), (29.5, 1.0), (31, 0.6)]), 0.12)
pad += third * voice(277.18, 0.022, 0.17, 0.7)
padL = pad * pad_gain * 1.9
dry[0] += padL * 0.95; dry[1] += padL * 1.05
send += padL * 0.25

# a quiet breath: low-passed noise, slow swell, no pitch to follow
air = fband(rng.uniform(-1, 1, n), 120, 2600)
air_env = smooth(env([(0, 0), (1.0, 0.5), (24.4, 1.0), (26, 0.6), (31, 0.3)]), 0.4)
dry[0] += 0.010 * air_env * air; dry[1] += 0.010 * air_env * np.roll(air, 977)

# ------------------------------------------------------------------ events
penta = [440.0, 493.88, 554.37, 659.26, 739.99, 880.0]       # A4 B4 C#5 E5 F#5 A5
merge_times = [round(m[0], 3) for m in merges]
counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    k, t0 = c["kind"], c["t"]
    if k not in counts:
        raise SystemExit(f"unknown cue kind {k}")
    counts[k] += 1
    if k == "click":
        click(t0, 1.0)
        if abs(t0 - 29.8) < 1e-6:                  # engagement ping
            bell(t0 + 0.01, 1760.0, 0.07, 0.8); bell(t0 + 0.07, 2217.5, 0.05, 0.8)
    elif k == "snap":
        if any(abs(t0 - mt) < 1e-6 for mt in merge_times):
            i = [abs(t0 - mt) < 1e-6 for mt in merge_times].index(True)
            click(t0 - 0.004, 0.8)                 # the blocks touching
            if i < 6:
                marimba(t0 + 0.004, penta[i], 0.30, 1.0, pan=-0.2 + 0.08 * i)
            else:                                   # the last merge: four blocks become one, a full open chord
                marimba(t0 + 0.004, 440.0, 0.17, 1.5, -0.2); marimba(t0 + 0.03, 659.26, 0.16, 1.5, 0.0)
                marimba(t0 + 0.06, 880.0, 0.14, 1.5, 0.2); bell(t0 + 0.08, 1318.5, 0.04, 1.0)
        else:                                       # CTA reveal: two bells, a fifth apart
            click(t0, 0.9)
            bell(t0 + 0.02, 659.26, 0.11, 1.0, -0.15); bell(t0 + 0.11, 880.0, 0.09, 1.0, 0.15)
    elif k == "thump":
        if abs(t0 - 24.4) < 1e-6:                   # the lock: felt kick + bright A-major arpeggio of bells
            kick(t0, 0.38)
            for i, fz in enumerate([440.0, 554.37, 659.26, 880.0, 1108.7, 1318.5]):
                bell(t0 + 0.04 + 0.075 * i, fz, 0.085 - 0.006 * i, 1.2, pan=-0.3 + 0.12 * i)
        else:
            kick(t0, 0.42)

# ------------------------------------------------------------------ the room: one synthetic plate (seeded), stereo-decorrelated
def make_ir(seed, sec=1.6):
    r = np.random.default_rng(seed)
    m = int(SR * sec); tt = np.arange(m) / SR
    x = r.standard_normal(m) * np.exp(-tt / 0.38)
    x = fband(x, 180, 7500) * (1 - np.exp(-tt / 0.012))   # darker than the dry sound, soft onset
    return x / np.sqrt(np.sum(x * x))
def fftconv(a, b):
    m = len(a) + len(b)
    N = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(a, N) * np.fft.rfft(b, N), N)[: len(a)]
wetL = fftconv(send, make_ir(1)); wetR = fftconv(send, make_ir(2))
L = dry[0] + 0.55 * wetL
R_ = dry[1] + 0.55 * wetR
# gentle soft clip, then the hum (never clipped, never ducked)
L = np.tanh(1.25 * L) / 1.25 + hum
R_ = np.tanh(1.25 * R_) / 1.25 + hum
# high-pass the whole thing above the hum region so reverb tails carry no rumble
mixLR = np.stack([L, R_])
peak = float(np.max(np.abs(mixLR)))
assert peak < 0.98, f"clipping risk: peak {peak:.3f}"
pcm = (np.clip(mixLR.T, -1, 1) * 32767).astype("<i2")
out = root / "assets" / "sfx.wav"
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
mono = (L + R_) / 2
win = int(0.5 * SR)
rms = [20 * np.log10(np.sqrt(np.mean(mono[i:i + win] ** 2)) + 1e-12) for i in range(0, n - win + 1, win)]
# how much energy sits above 5 kHz (piercing check)
F = np.abs(np.fft.rfft(mono)) ** 2; fr = np.fft.rfftfreq(n, 1 / SR)
hi = 10 * np.log10(F[fr > 5000].sum() / F.sum() + 1e-12)
print(f"{out.name}: {len(cues)} cues {counts}, peak {peak:.3f}, {DUR:.1f} s; RMS per 0.5 s: min {min(rms):.1f} max {max(rms):.1f} dBFS; energy above 5 kHz {hi:.1f} dB")
