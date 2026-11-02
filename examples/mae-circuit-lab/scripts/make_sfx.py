#!/usr/bin/env python3
"""Builds assets/sfx.wav (stereo, 48 kHz, 16-bit) by procedural synthesis only (numpy + scipy.io.wavfile).

Timing comes ONLY from the CUES array (between @CUES-BEGIN / @CUES-END) in src/timeline.js: [[seconds, "voice"], ...].
Length = the root data-duration in index.html, so audio and video always have the same length.

Bed   : continuous 50 Hz hum at -22 dBFS peak, unbroken from 0.0 s to the end (no silent gap anywhere).
Voices (no two cues are identical: each one is varied by a seeded RNG, so there is no mouse-click metronome):
  click = a soft mechanical relay engaging, centred on 1100 Hz: contact transient + resonant body + a faint armature bounce
          and a low case "clunk"; pitch, decay, bounce and level change from cue to cue.
  snap  = a sharp tactile gate closing, centred on 2400 Hz (noise transient + 2400 Hz / 3600 Hz ring), over a cinematic
          55 Hz sub-bass boom so every matrix lock is felt.
  thump = deep resonant sub-bass impact: 55 Hz sine falling from ~110 Hz, long tail, soft low rumble.
  whoosh = the micro-tone of a ghost number travelling from the circuit to its slot: a rising exponential gliss (about 380 to 1700 Hz)
          with a swept band of air, 0.5 s. It is followed by the click (equation slot) or the snap (matrix cell) when the ghost lands.
"""
import re
from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

HERE = Path(__file__).resolve().parent.parent
SR = 48000
GAIN = {"click": 0.34, "snap": 0.40, "thump": 0.56, "whoosh": 0.24}      # peak amplitude of each voice before the bed is added
rng_master = np.random.default_rng(2026)


def read_cues():
    js = (HERE / "src" / "timeline.js").read_text()
    block = js.split("// @CUES-BEGIN")[1].split("// @CUES-END")[0]
    cues = [(float(t), v) for t, v in re.findall(r'\[\s*([\d.]+)\s*,\s*"(\w+)"\s*\]', block)]
    assert cues and len(cues) == len(re.findall(r"^\s*\[", block, flags=re.M)), "CUES parse mismatch"
    return cues


def read_duration():
    html = (HERE / "index.html").read_text()
    return float(re.search(r'id="root"[^>]*data-duration="([\d.]+)"', html).group(1))


def tt(n):
    return np.arange(n) / SR


def damped(f, dur, tau, attack=0.0008, phase=0.0):
    t = tt(int(dur * SR))
    return np.sin(2 * np.pi * f * t + phase) * np.minimum(t / attack, 1.0) * np.exp(-t / tau)


def band_noise(rng, dur, lo, hi, tau, attack=0.0004):
    n = int(dur * SR)
    sos = butter(2, [lo, hi], btype="band", fs=SR, output="sos")
    x = sosfilt(sos, rng.standard_normal(n))
    t = tt(n)
    return x / (np.max(np.abs(x)) + 1e-9) * np.minimum(t / attack, 1.0) * np.exp(-t / tau)


def add(dst, src, at=0):
    e = min(len(dst), at + len(src))
    dst[at:e] += src[: e - at]


def boom(rng, dur=1.0, level=1.0):
    n = int(dur * SR)
    t = tt(n)
    f = 55 + 40 * np.exp(-t / 0.045)                          # falls onto 55 Hz
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.012, 1.0) * np.exp(-t / (0.16 * (0.9 + 0.2 * rng.random())))
    return level * body


def voice(name, rng):
    if name == "click":                                       # soft mechanical relay engagement, ~1100 Hz
        f = 1100 * (1 + rng.uniform(-0.07, 0.07))
        tau = 0.010 * (1 + rng.uniform(-0.3, 0.3))
        out = np.zeros(int(0.12 * SR))
        add(out, 0.8 * band_noise(rng, 0.02, f * 0.6, f * 1.8, 0.004))                      # contact transient
        add(out, damped(f, 0.09, tau))                                                      # resonant relay body
        add(out, 0.5 * damped(f * 1.5, 0.05, tau * 0.6))
        bounce = int(rng.uniform(0.008, 0.016) * SR)                                         # armature bounce
        add(out, rng.uniform(0.25, 0.5) * damped(f * 0.92, 0.05, tau * 0.8), bounce)
        add(out, 0.55 * damped(rng.uniform(170, 260), 0.06, 0.012))                         # case clunk
        return out * rng.uniform(0.72, 1.0)
    if name == "snap":                                        # sharp tactile gate close, ~2400 Hz, over a sub-bass boom
        f = 2400 * (1 + rng.uniform(-0.04, 0.04))
        out = np.zeros(int(1.0 * SR))
        add(out, 0.9 * band_noise(rng, 0.03, f * 0.7, min(f * 2.4, SR / 2 - 100), 0.006, 0.0002))
        add(out, damped(f, 0.12, 0.012 * (1 + rng.uniform(-0.2, 0.2)), 0.0004))
        add(out, 0.55 * damped(f * 1.5, 0.08, 0.008, 0.0004))
        add(out, boom(rng, 1.0, 1.25))
        return out * rng.uniform(0.85, 1.0)
    if name == "thump":                                       # deep resonant sub-bass impact
        out = np.zeros(int(1.6 * SR))
        n = int(1.6 * SR)
        t = tt(n)
        f = 55 + 60 * np.exp(-t / 0.06)
        body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.01, 1.0) * np.exp(-t / 0.28)
        out += body
        sos = butter(2, 140, btype="low", fs=SR, output="sos")
        out += 0.25 * sosfilt(sos, rng.standard_normal(n)) * np.exp(-t / 0.2)               # soft rumble
        return out * rng.uniform(0.92, 1.0)
    if name == "whoosh":                                      # gliss + swept air: the ghost lifts off and travels
        dur = 0.5
        n = int(dur * SR)
        t = tt(n)
        f0, f1 = 380 * (1 + rng.uniform(-0.1, 0.1)), 1700 * (1 + rng.uniform(-0.1, 0.1))
        f = f0 * (f1 / f0) ** (t / dur)                        # exponential gliss
        env_ = np.minimum(t / 0.09, 1.0) * np.exp(-((t - 0.2) / 0.22) ** 2 * 0 - np.maximum(t - 0.2, 0) / 0.16)
        tone_ = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_
        air = sosfilt(butter(2, [600, 5200], btype="band", fs=SR, output="sos"), rng.standard_normal(n)) * env_
        return tone_ + 0.35 * air / (np.max(np.abs(air)) + 1e-9)
    raise ValueError(name)


def main():
    dur = read_duration()
    cues = read_cues()
    n = int(round(dur * SR))
    t = tt(n)
    bed = 10 ** (-22 / 20) * np.sin(2 * np.pi * 50 * t)
    L, R = bed.copy(), bed.copy()
    for i, (ct, name) in enumerate(cues):
        assert 0 <= ct < dur, (ct, name)
        rng = np.random.default_rng(1000 + i)                # per-cue seed: every cue sounds a little different
        w = voice(name, rng)
        w = w / (np.max(np.abs(w)) + 1e-9) * GAIN[name]
        s = int(round(ct * SR))
        e = min(n, s + len(w))
        pan = rng.uniform(-0.18, 0.18)
        L[s:e] += w[: e - s] * (1 - pan)
        R[s:e] += w[: e - s] * (1 + pan)
    peak = max(np.max(np.abs(L)), np.max(np.abs(R)))
    assert peak < 0.98, f"clipping: peak {peak:.3f}"
    pcm = (np.stack([L, R], 1) * 32767).astype("<i2")
    out = HERE / "assets" / "sfx.wav"
    wavfile.write(str(out), SR, pcm)
    print(f"wrote {out.name}: {n/SR:.3f} s, {len(cues)} cues, peak {20*np.log10(peak):.1f} dBFS, hum 50 Hz at -22 dBFS")


if __name__ == "__main__":
    main()
