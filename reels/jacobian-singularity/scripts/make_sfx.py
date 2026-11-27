#!/usr/bin/env python3
"""Generate assets/sfx.wav (48 kHz stereo, 16-bit) from assets/cues.json and assets/sched.json.

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

SR = 48000
root = pathlib.Path(__file__).resolve().parent.parent
cues = json.loads((root / "assets" / "cues.json").read_text())
sched = json.loads((root / "assets" / "sched.json").read_text())
DUR, LOCK, PULSE, CARD = float(sched["dur"]), float(sched["lock"]), float(sched["pulse"]), float(sched["card"])
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

FX = 0.30   # every effect: clear, with the tracer voice and a light groove underneath
def place(t0, sig, gain=1.0, pan=0.0, wet=0.2):
    gain = gain * FX
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
SWAPS = [float(x) for x in sched["sw"]]

# the pad opens (more harmonics) as the duty cycle rises
prog = smooth(env([(0, 0.3), (SWAPS[0], 0.4), (SWAPS[5], 1.0), (DUR, 1.0)]), 0.1)
pad_gain = smooth(env([(0, 0.0), (0.4, 0.5), (float(sched["st"][0]), 0.6), (SWAPS[0], 0.8), (LOCK, 1.15), (LOCK + 2, 1.2), (DUR - 1.5, 0.95), (DUR, 0.5)]), 0.25)
pad = np.zeros(n)
def voice(f0, amp, lfo_hz, ph):
    out = np.zeros(n)
    for det in (-0.0016, 0.0, 0.0017):
        ph_ = 2 * np.pi * f0 * (1 + det) * t + rng.uniform(0, 6.28)
        v = np.sin(ph_)
        for h, a in ((2, 0.30), (3, 0.14 * (0.25 + 0.75 * prog)), (4, 0.08 * (0.2 + 0.8 * prog)), (5, 0.04 * prog)):
            v = v + a * np.sin(h * ph_)
        out += v / 3
    return amp * (0.82 + 0.18 * np.sin(2 * np.pi * lfo_hz * t + ph)) * out
for f0, amp, lfo_hz, ph in [(110.0, 0.034, 0.09, 0.0), (164.81, 0.028, 0.14, 1.3), (220.0, 0.022, 0.19, 2.1), (329.63, 0.014, 0.23, 3.4)]:
    pad += voice(f0, amp, lfo_hz, ph)
third = smooth(env([(0, 0), (LOCK - 0.05, 0), (LOCK + 0.5, 1.0), (DUR - 1.5, 1.0), (DUR, 0.6)]), 0.12)
pad += third * voice(277.18, 0.022, 0.17, 0.7)
padL = pad * pad_gain * 1.2
dry[0] += padL * 0.95; dry[1] += padL * 1.05
send += padL * 0.25
air = fband(rng.uniform(-1, 1, n), 120, 2600)
air_env = smooth(env([(0, 0), (1.0, 0.5), (LOCK, 1.0), (LOCK + 1.6, 0.6), (DUR, 0.3)]), 0.4)
dry[0] += 0.010 * air_env * air; dry[1] += 0.010 * air_env * np.roll(air, 977)

# ------------------------------------------------------------------ new voices: laser pluck, flying whoosh, riser, bass line
def place_pan(t0, sig, gain, pans, wet=0.2):
    """like place, but the pan moves along the sound (a number flying across the picture)"""
    gain = gain * FX
    i = int(round(t0 * SR))
    if i >= n: return
    j = min(n, i + len(sig))
    s = sig[: j - i] * gain
    p = pans[: j - i]
    l = np.cos((p + 1) * np.pi / 4); r = np.sin((p + 1) * np.pi / 4)
    dry[0, i:j] += s * l * 1.414
    dry[1, i:j] += s * r * 1.414
    send[i:j] += s * wet

def zip_(t0, f0, f1, pan, amp=0.5):
    """a branch is drawn: a short electric pluck that sweeps up (the signal being laid down), panned where the branch is"""
    k = int(SR * 0.30); tt = np.arange(k) / SR
    f = f0 * (f1 / f0) ** np.minimum(1, tt / 0.09)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) * np.exp(-tt / 0.05)
    s *= np.exp(-tt / 0.09) * np.minimum(1, tt / 0.001)
    sp = fband(noise_burst(10, 2.0), 3000, 9000)
    sp /= np.max(np.abs(sp)) + 1e-9
    s[: len(sp)] += 0.25 * sp
    place(t0, s, amp, pan, 0.25)

def whoosh(t0, dur, x0, x1, amp=0.5):
    """a number leaves the graph and flies to the table: a rising band of air plus a pitch glide, panned along its path"""
    k = int((dur + 0.25) * SR); tt = np.arange(k) / SR
    nz = rng.uniform(-1, 1, k)
    out = np.zeros(k)
    for fc, tc in [(350, 0.18), (800, 0.40), (1700, 0.65), (3300, 0.88)]:
        band = fband(nz, fc * 0.7, fc * 1.5)
        out += band * np.exp(-(((tt / dur) - tc) / 0.22) ** 2)
    out = out / (np.max(np.abs(out)) + 1e-9)
    f = 300 * (1400 / 300) ** np.minimum(1, tt / dur)
    out += 0.35 * np.sin(2 * np.pi * np.cumsum(f) / SR)
    out *= np.minimum(1, tt / 0.01) * np.exp(-np.maximum(0, tt - dur) / 0.06)
    pans = np.clip(((x0 + (x1 - x0) * np.minimum(1, tt / dur)) - 540) / 420, -1, 1)
    place_pan(t0, out, amp, pans, 0.25)

def hat(t0, amp=0.1):
    h = fband(noise_burst(30, 5.0), 6500, 11000)
    h /= np.max(np.abs(h)) + 1e-9
    place(t0, h, amp, rng.uniform(-0.3, 0.3), 0.08)

def bass(t0, f0, amp=0.3):
    k = int(SR * 0.30); tt = np.arange(k) / SR
    ph = 2 * np.pi * f0 * tt
    s = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
    s *= np.exp(-tt / 0.11) * np.minimum(1, tt / 0.003)
    place(t0, s, amp, 0.0, 0.05)

# ------------------------------------------------------------------ the joint voices: three servo whirrs that follow the three slides
def mono(keys, x):
    ts = np.array([k[0] for k in keys], float); ys = np.array([k[1] for k in keys], float); nk = len(ts)
    sl = np.diff(ys) / np.diff(ts); m = np.zeros(nk)
    for k in range(1, nk - 1):
        s0, s1 = sl[k - 1], sl[k]
        m[k] = 0.0 if s0 * s1 <= 0 else 2 * s0 * s1 / (s0 + s1)
    out = np.empty_like(x)
    out[x < ts[0]] = ys[0]; out[x >= ts[-1]] = ys[-1]
    for i in range(nk - 1):
        sel = (x >= ts[i]) & (x < ts[i + 1])
        dt = ts[i + 1] - ts[i]; u = (x[sel] - ts[i]) / dt
        out[sel] = ((1 + 2 * u) * (1 - u) ** 2 * ys[i] + u * (1 - u) ** 2 * dt * m[i]
                    + u * u * (3 - 2 * u) * ys[i + 1] + u * u * (u - 1) * dt * m[i + 1])
    return out
DKS = sched["DK"]; RANGE = sched["RANGE"]
JBASE = [110.0, 220.0]       # A2, A3: joint 1, joint 2
JPAN = [-0.30, 0.30]
joint_pos, joint_speed = [], []
for i in range(len(JBASE)):
    d_i = mono([(k[0], k[i + 1]) for k in DKS], t)
    joint_pos.append(d_i / RANGE[i])
    joint_speed.append(smooth(np.abs(np.gradient(d_i, t)), 0.04))
for i in range(len(JBASE)):
    f_inst = JBASE[i] * 2 ** (1.2 * joint_pos[i])
    ph = 2 * np.pi * np.cumsum(f_inst) / SR
    v = np.sin(ph) + 0.22 * np.sin(2 * ph)
    v = fband(v, 70, 1100)
    gate = np.clip(joint_speed[i] / 1.6, 0, 1) ** 0.6
    fric = fband(rng.uniform(-1, 1, n), 700, 2600) * 0.35
    sig = 0.05 * fband(rng.uniform(-1, 1, n), 250, 800) * gate
    pan = np.full(n, JPAN[i])
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    dry[0] += sig * l * 1.2; dry[1] += sig * r * 1.2
    send += sig * 0.18


# the groove under the picture (120 bpm, from the first banner to the lock): felt kick on the beat, hat on the off-beat, a plucked
# A-minor-pentatonic bass line on the eighths. It is felt more than heard, and it opens as the answer gets closer.
BEAT = 0.5
RH0 = float(sched["st"][0]) + 0.3
RH1 = LOCK - 1.4
BASSLINE = [110.0, 110.0, 164.81, 110.0, 98.0, 110.0, 164.81, 146.83]
# the riser into the lock and the sub drop on it
rk = int(1.3 * SR); rt_ = np.arange(rk) / SR; ru = rt_ / 1.3
rn = fband(rng.uniform(-1, 1, rk), 400, 9000) * ru ** 2.2
rn /= np.max(np.abs(rn)) + 1e-9
rs = np.sin(2 * np.pi * np.cumsum(180 * (1800 / 180) ** ru) / SR) * ru ** 2
place(LOCK - 1.3, 0.08 * rn + 0.5 * rs, 0.25, 0.0, 0.3)
sk = int(1.2 * SR); st_ = np.arange(sk) / SR
sub = np.sin(2 * np.pi * np.cumsum(45 + 50 * np.exp(-st_ / 0.25)) / SR) * np.exp(-st_ / 0.5)
place(LOCK, sub, 0.45, 0.0, 0.1)

# ------------------------------------------------------------------ events
STAGE = [220.0, 277.18, 329.63, 369.99, 440.0, 554.37, 659.26, 880.0]   # one note per counter (A-major pentatonic)
STARTS = [float(x) for x in sched["st"]]
POPS = [float(x) for x in sched["pops"]]
POP_NOTE = [329.63, 369.99, 440.0, 493.88, 554.37]
near = lambda x, ys: any(abs(x - y) < 1e-6 for y in ys)
idx = lambda x, ys: [abs(x - y) < 1e-6 for y in ys].index(True)

counts = {"click": 0, "snap": 0, "thump": 0}
for c in cues:
    k, t0 = c["kind"], c["t"]
    if k not in counts:
        raise SystemExit(f"unknown cue kind {k}")
    counts[k] += 1
    if k == "click":
        if near(t0, POPS):                               # a panel gets its title: a soft note and a tick
            i = idx(t0, POPS)
            click(t0 - 0.004, 0.25)
            marimba(t0 + 0.004, POP_NOTE[i], 0.22, 1.0, pan=-0.2 + 0.1 * i)
        else:
            click(t0, 0.35)
        if abs(t0 - PULSE) < 1e-6:                       # engagement ping
            bell(t0 + 0.01, 880.0, 0.05, 0.8); bell(t0 + 0.07, 1108.7, 0.035, 0.8)
    elif k == "snap":
        if abs(t0 - float(sched["rewind0"])) < 1e-6:     # the robot slides home: a short descending run, soft marimba
            for i, fz in enumerate([440.0, 369.99, 329.63, 277.18, 220.0]):
                marimba(t0 + 0.05 * i, fz, 0.13, 0.5, pan=0.25 - 0.1 * i)
        elif near(t0, SWAPS):                            # a new counter: a note of the ladder
            i = idx(t0, SWAPS)
            click(t0 - 0.004, 0.22)
            marimba(t0 + 0.004, STAGE[i], 0.26, 1.2, pan=-0.3 + 0.09 * i)
            if i == 7:                                   # the infinity: a falling-then-rising run
                for j, fz in enumerate([329.63, 440.0, 554.37, 659.26, 880.0]):
                    marimba(t0 + 0.06 * j, fz, 0.10, 1.0, pan=-0.3 + 0.15 * j)
        else:                                            # CTA reveal: two bells, a fifth apart
            click(t0, 0.35)
            bell(t0 + 0.02, 440.0, 0.07, 1.0, -0.15); bell(t0 + 0.11, 554.37, 0.06, 1.0, 0.15)
    elif k == "thump":
        if abs(t0 - LOCK) < 1e-6:                        # the lock: felt kick + bright A-major arpeggio of bells
            kick(t0, 0.30)
            for i, fz in enumerate([220.0, 277.18, 329.63, 440.0, 554.37, 659.26]):
                bell(t0 + 0.04 + 0.09 * i, fz, 0.06 - 0.004 * i, 1.2, pan=-0.3 + 0.12 * i)
        else:
            kick(t0, 0.32)

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
