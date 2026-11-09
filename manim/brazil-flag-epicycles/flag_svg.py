"""Where the Flag of Brazil SVG comes from.

Resolution order (first hit wins):
  1. an explicit path or URL passed to `load_flag_svg(source)`
  2. the environment variable BRAZIL_SVG (path or URL)
  3. ./assets/Flag_of_Brazil.svg next to this file
  4. a download of the Wikimedia Commons original (cached into ./assets/ on success)
  5. a built-in construction from the legal geometry of the flag (Law 5.700/1971, 20 x 14 modules).

The built-in SVG is exact for the field, the rhombus and the disc. The band and the 27 stars are an APPROXIMATION of the
construction sheet (band arc radius 8 M, width 0.55 M, clipped by the disc; star positions placed by eye on the disc),
so drop the official SVG into ./assets/Flag_of_Brazil.svg for a faithful drawing. Every path carries an `id`
(field / rhombus / disc / band / star_00 ...) that the rest of the pipeline uses to pick a role.
"""
from __future__ import annotations

import math
import os
import pathlib
import urllib.request

HERE = pathlib.Path(__file__).resolve().parent
ASSET = HERE / "assets" / "Flag_of_Brazil.svg"
WIKIMEDIA_URL = "https://upload.wikimedia.org/wikipedia/commons/0/05/Flag_of_Brazil.svg"

# ---------------------------------------------------------------------------------------- geometry (module units, y down)
W, H = 20.0, 14.0
CENTER = (10.0, 7.0)
DISC_R = 3.5
RHOMBUS = [(1.7, 7.0), (10.0, 1.7), (18.3, 7.0), (10.0, 12.3)]
BAND_R_MID, BAND_WIDTH, BAND_TILT_DEG = 8.0, 0.55, 75.0

# 27 stars: (dx, dy) from the disc centre in modules, and a magnitude class 0 (largest) .. 4 (smallest). Approximate layout.
STARS = [
    (-0.6, -2.8, 3), (0.5, -2.4, 2), (1.4, -2.2, 3), (-1.8, -2.0, 3), (-2.6, -1.2, 4), (-1.0, -1.6, 2),
    (0.1, -1.4, 1), (1.0, -1.0, 3), (2.2, -1.3, 3), (2.9, -0.6, 4), (-1.9, -0.7, 2), (-0.9, -0.4, 3),
    (0.4, -0.5, 2), (1.7, -0.2, 2), (2.5, 0.4, 3), (-2.6, 0.2, 4), (-1.5, 0.3, 3), (-0.5, 0.6, 1),
    (0.9, 0.7, 2), (-2.2, 1.1, 4), (-1.0, 1.4, 2), (0.2, 1.6, 0), (1.3, 1.5, 2), (2.0, 1.2, 3),
    (-0.3, 2.4, 1), (-1.4, 2.2, 3), (0.9, 2.3, 3),
]
STAR_RADII = [0.30, 0.25, 0.21, 0.17, 0.13]


def _fmt(v: float) -> str:
    return f"{v:.4f}".rstrip("0").rstrip(".")


def _poly(points, closed=True) -> str:
    d = "M" + " L".join(f"{_fmt(x)},{_fmt(y)}" for x, y in points)
    return d + (" Z" if closed else "")


def _circle_path(cx, cy, r) -> str:
    return f"M{_fmt(cx - r)},{_fmt(cy)} A{_fmt(r)},{_fmt(r)} 0 1,0 {_fmt(cx + r)},{_fmt(cy)} A{_fmt(r)},{_fmt(r)} 0 1,0 {_fmt(cx - r)},{_fmt(cy)} Z"


def _star_points(cx, cy, r):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.381966  # regular pentagram: inner / outer = 1 / phi^2
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


def _circle_circle(c0, r0, c1, r1):
    """intersection points of two circles"""
    dx, dy = c1[0] - c0[0], c1[1] - c0[1]
    d = math.hypot(dx, dy)
    a = (r0 * r0 - r1 * r1 + d * d) / (2 * d)
    h = math.sqrt(max(r0 * r0 - a * a, 0.0))
    mx, my = c0[0] + a * dx / d, c0[1] + a * dy / d
    return [(mx + h * dy / d, my - h * dx / d), (mx - h * dy / d, my + h * dx / d)]


def _arc(c, r, a0, a1, n):
    return [(c[0] + r * math.cos(a0 + (a1 - a0) * k / n), c[1] + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def _band_polygon(n=64):
    """the white band: the annulus (centre C, radii Ro and Ri) clipped by the disc"""
    phi = math.radians(BAND_TILT_DEG)
    c = (CENTER[0] + BAND_R_MID * math.cos(phi), CENTER[1] + BAND_R_MID * math.sin(phi))
    ro, ri = BAND_R_MID + BAND_WIDTH / 2, BAND_R_MID - BAND_WIDTH / 2
    ang = lambda p, o: math.atan2(p[1] - o[1], p[0] - o[0])
    po = sorted(_circle_circle(c, ro, CENTER, DISC_R), key=lambda p: ang(p, c))
    pi = sorted(_circle_circle(c, ri, CENTER, DISC_R), key=lambda p: ang(p, c))
    wrap = lambda a0, a1: a1 if a1 > a0 else a1 + 2 * math.pi
    outer = _arc(c, ro, ang(po[0], c), ang(po[1], c), n)
    inner = _arc(c, ri, ang(pi[1], c), ang(pi[0], c), n)
    # follow the disc boundary from the outer end to the inner end (and back), the short way round
    def disc_arc(p, q):
        a0, a1 = ang(p, CENTER), ang(q, CENTER)
        d = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
        return _arc(CENTER, DISC_R, a0, a0 + d, 16)
    return outer + disc_arc(po[1], pi[1])[1:-1] + inner + disc_arc(pi[0], po[0])[1:-1]


def build_spec_svg() -> str:
    """the built-in Flag of Brazil, one <path> per shape, ids and fills set so the pipeline can classify them"""
    paths = [
        ("field", "#009b3a", _poly([(0, 0), (W, 0), (W, H), (0, H)])),
        ("rhombus", "#fedf00", _poly(RHOMBUS)),
        ("disc", "#002776", _circle_path(*CENTER, DISC_R)),
        ("band", "#ffffff", _poly(_band_polygon())),
    ]
    for i, (dx, dy, mag) in enumerate(STARS):
        paths.append((f"star_{i:02d}", "#ffffff", _poly(_star_points(CENTER[0] + dx, CENTER[1] + dy, STAR_RADII[mag]))))
    body = "\n".join(f'  <path id="{i}" fill="{f}" d="{d}"/>' for i, f, d in paths)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:g} {H:g}" width="{W:g}" height="{H:g}">\n{body}\n</svg>\n'


# ---------------------------------------------------------------------------------------- loading
def _read(source: str) -> str:
    if source.startswith(("http://", "https://")):
        with urllib.request.urlopen(source, timeout=10) as r:  # noqa: S310 (user-supplied source)
            return r.read().decode("utf-8")
    return pathlib.Path(source).read_text(encoding="utf-8")


def load_flag_svg(source: str | None = None, allow_download: bool = True) -> tuple[str, str]:
    """returns (svg_text, description of where it came from)"""
    candidates = [("argument", source), ("BRAZIL_SVG", os.environ.get("BRAZIL_SVG"))]
    for label, s in candidates:
        if s:
            return _read(s), f"{label}: {s}"
    if ASSET.exists():
        return ASSET.read_text(encoding="utf-8"), f"local file: {ASSET}"
    if allow_download:
        try:
            text = _read(WIKIMEDIA_URL)
            if "<svg" in text:
                ASSET.parent.mkdir(parents=True, exist_ok=True)
                ASSET.write_text(text, encoding="utf-8")
                return text, f"downloaded: {WIKIMEDIA_URL} (cached to {ASSET})"
        except Exception as e:  # offline, proxy, 4xx ...
            reason = f"{type(e).__name__}: {e}"
        else:
            reason = "response was not an SVG"
        return build_spec_svg(), f"built-in construction from the legal geometry (download failed: {reason})"
    return build_spec_svg(), "built-in construction from the legal geometry"


if __name__ == "__main__":
    svg, origin = load_flag_svg()
    print(origin, f"({len(svg)} bytes)")
