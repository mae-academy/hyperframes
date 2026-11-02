#!/usr/bin/env python3
"""Snapshots every 0.6 s (+ critical times + last frame) and checks pixels:
  * nothing outside x 90-990, nothing above y 110, nothing below y 1670  (only bg #0A0A10 / grid #161622 allowed there)
  * no yellow pixels anywhere (this film has no window chrome, so there is no exception)
Usage: python3 scripts/verify_snapshots.py [outdir]   (run from the project dir; needs numpy + pillow)
"""
import subprocess, sys, json
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else HERE / "snapshots")
END = 20.0
times = sorted({round(0.6 * i, 2) for i in range(0, 34)} | {0.0, 1.35, 1.8, 3.3, 4.5, 7.7, 9.0, 11.4, 12.7, 15.45, 15.85, 16.4, 17.0, 17.8, 19.99})
times = [t for t in times if t < END]
OUT.mkdir(exist_ok=True, parents=True)
for f in OUT.glob("*.png"): f.unlink()

for i in range(0, len(times), 12):
    chunk = ",".join(str(t) for t in times[i:i + 12])
    subprocess.run(["npx", "hyperframes", "snapshot", "--at", chunk, "--no-end", "--keep", "-o", str(OUT)], cwd=HERE,
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

BG = np.array([[10, 10, 16], [22, 22, 34]], dtype=float)
fails, rows = [], []
for p in sorted(OUT.glob("at-*s.png"), key=lambda q: float(q.stem[3:-1])):
    t = float(p.stem[3:-1])
    a = np.asarray(Image.open(p).convert("RGB"), dtype=float)
    assert a.shape[:2] == (1920, 1080), (p, a.shape)
    d = np.min([np.abs(a - c).max(2) for c in BG], axis=0)       # distance to nearest allowed bg colour
    zones = {"left<90": d[:, :90], "right>990": d[:, 991:], "above<110": d[:110, :], "below>1670": d[1671:, :]}
    bad = {k: int((v > 14).sum()) for k, v in zones.items()}
    mx, mn = a.max(2) / 255, a.min(2) / 255
    dl = mx - mn
    r, g, b = a[..., 0] / 255, a[..., 1] / 255, a[..., 2] / 255
    h = np.zeros_like(mx)
    m = dl > 0
    rc = (mx == r) & m; gc = (mx == g) & m & ~rc; bc = m & ~rc & ~gc
    h[rc] = ((g - b)[rc] / dl[rc]) % 6; h[gc] = (b - r)[gc] / dl[gc] + 2; h[bc] = (r - g)[bc] / dl[bc] + 4
    h *= 60
    s = np.where(mx > 0, dl / np.maximum(mx, 1e-6), 0)
    y = (h >= 38) & (h <= 72) & (s > 0.45) & (mx > 0.45)
    ny = int(y.sum())
    # circuit arena (x 90-990, y 340-890): after the hook has dissolved it must stay fully lit, never dimmed or hidden
    lum = (0.299 * a[340:890, 90:990, 0] + 0.587 * a[340:890, 90:990, 1] + 0.114 * a[340:890, 90:990, 2])
    lit = float((lum > 110).mean())
    rows.append(dict(t=t, **bad, yellow=ny, circuit_lit=round(lit, 5)))
    if any(bad.values()) or ny:
        fails.append((t, bad, ny))
post = [r["circuit_lit"] for r in rows if r["t"] >= 3.2]
ref = float(np.median(post))
for r in rows:
    if r["t"] >= 1.8 and r["circuit_lit"] < 0.8 * ref:
        fails.append((r["t"], "circuit dimmed/hidden", r["circuit_lit"]))
print(f"circuit-lit fraction after 1.8 s: min {min(post):.4f}, median {ref:.4f}")
(HERE / "reports" / "snapshot-verification.json").write_text(json.dumps(rows, indent=1))
print(f"{len(rows)} snapshots checked; failures: {len(fails)}")
for f in fails: print("  FAIL", f)
sys.exit(1 if fails else 0)
