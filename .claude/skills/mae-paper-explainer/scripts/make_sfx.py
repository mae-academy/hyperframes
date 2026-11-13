#!/usr/bin/env python3
"""Bake MAE paper-style sound cues into a WAV from pure oscillators.

Spec v2.0 section 7: cues are click, snap (default on) and tick, thump (opt-in).
No noise, no voice, no music. Deterministic: same cues in -> same bytes out.

Usage:
  make_sfx.py cues.json out.wav --duration 123.4 [--allow tick,thump]

cues.json: [{"t": 12.40, "cue": "click"}, {"t": 31.9, "cue": "snap", "gain": 0.8}]
"""
import argparse
import json
import math
import struct
import sys
import wave

SR = 48000


def env(n, attack, decay_tau):
    """Linear attack, exponential decay. Starts and ends at 0 (no clicks from the edges)."""
    a = max(1, int(attack * SR))
    out = []
    for i in range(n):
        g = i / a if i < a else 1.0
        g *= math.exp(-(i / SR) / decay_tau)
        out.append(g)
    tail = max(1, int(0.004 * SR))
    for i in range(tail):
        out[n - 1 - i] *= i / tail
    return out


def sine(freqs, dur, tau, attack=0.0015, drop=1.0):
    """Sum of sines; `drop` multiplies frequency linearly down to freq*drop over the cue."""
    n = int(dur * SR)
    e = env(n, attack, tau)
    out = []
    phases = [0.0] * len(freqs)
    for i in range(n):
        k = 1.0 + (drop - 1.0) * (i / n)
        s = 0.0
        for j, (f, w) in enumerate(freqs):
            phases[j] += 2 * math.pi * f * k / SR
            s += w * math.sin(phases[j])
        out.append(s * e[i])
    return out


CUES = {
    # short dry tick for a thing landing in its slot
    "click": lambda: sine([(1900, 0.8), (3800, 0.2)], 0.045, 0.010),
    # paper snap: bright two-partial blip with a quick downward glide
    "snap": lambda: sine([(1250, 0.7), (2500, 0.3)], 0.085, 0.020, drop=0.72),
    # optional: very light tick for text/line reveals
    "tick": lambda: sine([(3200, 1.0)], 0.022, 0.006),
    # optional: low thump for a heavy sheet dropping
    "thump": lambda: sine([(78, 1.0), (156, 0.25)], 0.16, 0.045, attack=0.003, drop=0.8),
}
DEFAULT_ON = {"click", "snap"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cues")
    ap.add_argument("out")
    ap.add_argument("--duration", type=float, required=True, help="exact video length, seconds")
    ap.add_argument("--allow", default="", help="extra cues to allow: tick,thump")
    ap.add_argument("--peak", type=float, default=0.5, help="max |sample| 0..1 (default 0.5)")
    a = ap.parse_args()

    allowed = DEFAULT_ON | {c for c in a.allow.split(",") if c}
    cues = json.load(open(a.cues))
    n = int(round(a.duration * SR))
    buf = [0.0] * n
    for c in cues:
        name, t = c["cue"], float(c["t"])
        if name not in CUES:
            sys.exit(f"unknown cue {name!r}; spec allows {sorted(CUES)}")
        if name not in allowed:
            sys.exit(f"cue {name!r} is off by default; pass --allow {name} only if the brief lists it")
        if not 0 <= t < a.duration:
            sys.exit(f"cue at t={t} is outside 0..{a.duration}")
        g = float(c.get("gain", 1.0))
        s0 = int(round(t * SR))
        for i, v in enumerate(CUES[name]()):
            if s0 + i >= n:
                break
            buf[s0 + i] += v * g

    m = max((abs(x) for x in buf), default=0.0)
    scale = (a.peak / m) if m > a.peak else 1.0  # only ever attenuate, never boost
    with wave.open(a.out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x * scale)) * 32767)) for x in buf))
    print(f"{a.out}: {len(cues)} cues, {a.duration:.3f}s, peak {min(m, a.peak):.2f}")


if __name__ == "__main__":
    main()
