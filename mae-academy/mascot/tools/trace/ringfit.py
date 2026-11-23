"""Fit a smooth closed head outline r(theta) (Fourier series) to the traced ring of the reference."""
import numpy as np
CX, CY = 1312.0, 1136.0

def samples(ink, hair_d, band):
    pts = []
    H, W = ink.shape
    for deg in np.arange(0, 360, 1.0):
        t = np.deg2rad(deg); c, s = np.cos(t), np.sin(t)
        rs = np.arange(470, 680, 1.0)
        xs = (CX + rs * c).astype(int); ys = (CY + rs * s).astype(int)
        ok = (xs >= 0) & (xs < W) & (ys >= 0) & (ys < H)
        if not ok.all(): continue
        if hair_d[ys, xs].any() or band[ys, xs].any(): continue       # hair / glasses temple crossings
        v = ink[ys, xs]
        idx = np.where(v)[0]
        if not len(idx): continue
        i0 = idx[0]; j = i0
        while j + 1 < len(v) and v[j + 1]: j += 1
        th = j - i0 + 1
        if 10 <= th <= 22: pts.append((t, rs[i0] + th / 2.0))        # ring centre
    pts = np.array(pts)
    # the top arc is hidden under the hair: pin it to a circle of mean radius so the Fourier fit stays well behaved
    rm = float(np.median(pts[:, 1]))
    top = np.deg2rad(np.arange(196, 345, 6.0))
    return np.vstack([pts, np.column_stack([top, np.full_like(top, rm)])])

def fit(pts, order=4, iters=3):
    t, r = pts[:, 0], pts[:, 1]
    keep = np.ones(len(t), bool)
    A = lambda t: np.column_stack([np.ones_like(t)] + [f(k * t) for k in range(1, order + 1) for f in (np.cos, np.sin)])
    for _ in range(iters):
        coef, *_ = np.linalg.lstsq(A(t[keep]), r[keep], rcond=None)
        res = r - A(t) @ coef
        keep = np.abs(res) < max(6.0, 2.5 * res[keep].std())
    return coef, res[keep].std(), int(keep.sum())

def radius(coef, t, order=4):
    cols = [np.ones_like(t)] + [f(k * t) for k in range(1, order + 1) for f in (np.cos, np.sin)]
    return np.column_stack(cols) @ coef

def closed_path(coef, n=48, order=4):
    t = np.linspace(0, 2 * np.pi, n, endpoint=False)
    r = radius(coef, t, order)
    P = np.column_stack([CX + r * np.cos(t), CY + r * np.sin(t)])
    d = f"M{P[0][0]:.1f},{P[0][1]:.1f}"
    for i in range(n):                      # Catmull-Rom -> cubic Bezier (closed)
        p0, p1, p2, p3 = P[(i - 1) % n], P[i], P[(i + 1) % n], P[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
        d += f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + "Z"
