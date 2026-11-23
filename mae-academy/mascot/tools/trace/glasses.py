"""Re-draw the glasses from the ORIGINAL frame centre-lines (keeps every gentle curve), with one uniform stroke weight."""
import numpy as np
from scipy.ndimage import gaussian_filter1d, binary_dilation

LENS_C = {"L": (988.0, 1121.0), "R": (1451.0, 1121.0)}      # centres of the lens interiors (measured on the reference)

def lens_loop(ink, c, t=13.0, sigma_deg=4.0, n=360):
    """cast rays from the lens centre; first ink pixel = inner edge of the frame; return smoothed closed centre-line"""
    H, W = ink.shape
    rc = np.zeros(n)
    for k in range(n):
        a = np.deg2rad(k * 360.0 / n); ca, sa = np.cos(a), np.sin(a)
        rs = np.arange(30, 330, 0.5)
        xs = np.clip((c[0] + rs * ca).astype(int), 0, W - 1); ys = np.clip((c[1] + rs * sa).astype(int), 0, H - 1)
        idx = np.where(ink[ys, xs])[0]
        if not len(idx): rc[k] = np.nan; continue
        i0 = idx[0]; j = i0
        while j + 1 < len(rs) and ink[ys[j + 1], xs[j + 1]]: j += 1
        run = rs[j] - rs[i0]
        rc[k] = rs[i0] + (run / 2 if run < 26 else t / 2)       # long runs = junction with bridge/temple -> use t/2
    good = ~np.isnan(rc)
    rc = np.interp(np.arange(n), np.where(good)[0], rc[good], period=n)
    rc = gaussian_filter1d(rc, sigma_deg * n / 360.0, mode="wrap")
    a = np.deg2rad(np.arange(n) * 360.0 / n)
    return np.column_stack([c[0] + rc * np.cos(a), c[1] + rc * np.sin(a)])

def closed_path(P, step=6):
    P = P[::step]; n = len(P)
    d = f"M{P[0][0]:.1f},{P[0][1]:.1f}"
    for i in range(n):
        p0, p1, p2, p3 = P[(i - 1) % n], P[i], P[(i + 1) % n], P[(i + 2) % n]
        c1 = p1 + (p2 - p0) / 6; c2 = p2 - (p3 - p1) / 6
        d += f"C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + "Z"

def column_line(ink, x0, x1, ylo, yhi, deg=2, ext=(0, 0), ybias=None):
    """centre-line of a thin horizontal-ish stroke: per-column mean y of ink inside [ylo,yhi]; polynomial fit -> open path"""
    xs, ys = [], []
    for x in range(x0, x1):
        lo, hi = (ylo, yhi) if ybias is None else (int(ybias(x) - 38), int(ybias(x) + 38))
        col = np.where(ink[lo:hi, x])[0]
        if len(col): xs.append(x); ys.append(lo + col.mean())
    coef = np.polyfit(xs, ys, deg)
    xx = np.arange(x0 - ext[0], x1 + ext[1], 8.0)
    yy = np.polyval(coef, xx)
    return "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in zip(xx, yy))
