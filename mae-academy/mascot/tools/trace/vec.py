"""Mask -> smooth SVG path (potrace). Coordinates stay in source-pixel space."""
import numpy as np, cv2, potrace

def smooth_mask(mask, sigma=3.0, dilate=0, scale=0.5):
    m = mask.astype(np.uint8) * 255
    if dilate:
        k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * dilate + 1, 2 * dilate + 1))
        m = cv2.dilate(m, k)
    m = cv2.resize(m, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    m = cv2.GaussianBlur(m, (0, 0), sigma * scale)
    return m > 127

def trace(mask, scale=0.5, turd=60, alphamax=1.25, opttol=1.0, prec=1):
    bm = potrace.Bitmap(~mask)  # potracer treats False as ink
    pl = bm.trace(turdsize=turd, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,
                  alphamax=alphamax, opticurve=True, opttolerance=opttol)
    s = 1.0 / scale
    f = lambda p: f"{p.x * s:.{prec}f},{p.y * s:.{prec}f}"
    out = []
    for curve in pl:
        sp = curve.start_point
        d = [f"M{f(sp)}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{f(seg.c)}L{f(seg.end_point)}")
            else:
                d.append(f"C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}")
        d.append("Z")
        out.append("".join(d))
    return "".join(out)

def mask_to_path(mask, sigma=3.0, dilate=0, **kw):
    return trace(smooth_mask(mask, sigma, dilate), **kw)
