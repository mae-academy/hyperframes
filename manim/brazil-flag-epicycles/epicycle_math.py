"""SVG -> contours -> arc-length samples -> complex DFT -> epicycles sorted by magnitude.

No Manim in here, so it can be tested on its own:  python epicycle_math.py --selftest

Conventions
  * SVG is y-down, Manim is y-up: y is flipped once, in `to_scene_units`.
  * z_k = x_k + i y_k at theta_k = 2 pi k / M, k = 0 .. M-1 (the closing point is NOT repeated).
  * c_n = (1/M) sum_k z_k e^{-i n theta_k}, so z(t) = sum_n c_n e^{i n t} reproduces the contour for t in [0, 2 pi).
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass, field

import numpy as np

# ---------------------------------------------------------------------------------------- configuration
# Harmonics per role: the series uses frequencies -N .. +N (2N + 1 terms). Sharp corners (field, rhombus, band, stars) need
# more terms than smooth curves; a circle is exactly one harmonic. Raise N for crisper corners, lower it to avoid ringing
# (Gibbs) and to render faster. A value in `HARMONICS_BY_NAME` overrides the role value for that one contour.
HARMONICS_BY_ROLE = {"field": 48, "rhombus": 48, "disc": 6, "band": 60, "star": 36}
HARMONICS_BY_NAME: dict[str, int] = {}
SAMPLES_PER_CONTOUR = 2048        # M: arc-length samples fed to the DFT (must be > 2 N + 1)
DENSE_PER_SEGMENT = 400           # internal oversampling used to measure arc length

ROLE_ORDER = ["field", "rhombus", "disc", "band", "star"]   # sequential drawing order
FILL_ROLES = {                    # fallback classification by fill colour (official Wikimedia SVG has no ids)
    "#009b3a": "field", "#fedf00": "rhombus", "#002776": "disc", "#ffffff": "white", "#fff": "white",
}
WHITE_BAND_MIN_AREA = 2.0         # in module^2: a white shape larger than this is the band, smaller ones are stars


@dataclass
class Contour:
    name: str
    role: str
    fill: str | None
    samples: np.ndarray          # complex, M uniformly spaced (by arc length) points, scene units
    perimeter: float
    series: "Series | None" = field(default=None, repr=False)


@dataclass
class Epicycle:
    n: int                       # signed frequency (angular speed n, in rad per unit of t)
    c: complex                   # coefficient: radius |c|, phase arg(c)

    @property
    def radius(self) -> float:
        return abs(self.c)

    @property
    def phase(self) -> float:
        return float(np.angle(self.c))


@dataclass
class Series:
    base: complex                # c_0, the static offset every epicycle is chained onto
    terms: list[Epicycle]        # sorted by descending |c_n| (dominant frequencies first)
    N: int

    def tips(self, t: float) -> np.ndarray:
        """positions of the head of every vector in the chain: base, base + v1, base + v1 + v2, ..."""
        cs = np.array([e.c for e in self.terms])
        ns = np.array([e.n for e in self.terms])
        return self.base + np.concatenate([[0], np.cumsum(cs * np.exp(1j * ns * t))])

    def evaluate(self, t) -> np.ndarray:
        t = np.atleast_1d(np.asarray(t, dtype=float))
        cs = np.array([e.c for e in self.terms])
        ns = np.array([e.n for e in self.terms])
        return self.base + (cs[None, :] * np.exp(1j * ns[None, :] * t[:, None])).sum(axis=1)


# ---------------------------------------------------------------------------------------- SVG -> contours
def _classify(name: str, fill: str | None, area: float) -> str:
    if name.startswith("star"):
        return "star"
    if name in ("field", "rhombus", "disc", "band"):
        return name
    role = FILL_ROLES.get((fill or "").lower().strip())
    if role == "white":
        return "band" if area > WHITE_BAND_MIN_AREA else "star"
    return role or "star"


def _dense_polyline(subpath, per_segment: int) -> np.ndarray:
    pts = []
    for seg in subpath:
        # more points on longer segments so curves stay smooth, at least 2 on lines
        n = max(2, int(per_segment * min(1.0, seg.length() / max(subpath.length(), 1e-12) * 4 + 0.05)))
        ts = np.linspace(0.0, 1.0, n, endpoint=False)
        pts.append(np.array([seg.point(t) for t in ts]))
    return np.concatenate(pts)


def resample_arclength(poly: np.ndarray, m: int) -> tuple[np.ndarray, float]:
    """m points uniformly spaced by arc length along the CLOSED polyline `poly` (the closing edge is included)"""
    closed = np.concatenate([poly, poly[:1]])
    seg = np.abs(np.diff(closed))
    keep = np.concatenate([[True], seg > 1e-12])            # drop duplicate points (zero-length edges)
    closed = closed[np.concatenate([keep[:-1], [True]])] if not keep.all() else closed
    seg = np.abs(np.diff(closed))
    s = np.concatenate([[0.0], np.cumsum(seg)])
    total = float(s[-1])
    target = np.linspace(0.0, total, m, endpoint=False)
    re = np.interp(target, s, closed.real)
    im = np.interp(target, s, closed.imag)
    return re + 1j * im, total


def _polygon_area(z: np.ndarray) -> float:
    x, y = z.real, z.imag
    return 0.5 * abs(float(np.dot(x, np.roll(y, -1)) - np.dot(y, np.roll(x, -1))))


_SHAPE_TAGS = {"path", "rect", "circle", "ellipse", "polygon", "polyline", "line"}


def _local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _iter_shapes(svg_text: str):
    """yield (attrs, Path) for every drawable element, with every ancestor `transform` applied (nested groups included)"""
    import xml.etree.ElementTree as ET

    from svgpathtools import Path, parse_path
    from svgpathtools.parser import parse_transform
    from svgpathtools import svg_to_paths as sp

    def convert(tag, a):
        if tag == "path":
            return parse_path(a.get("d", ""))
        fn = {"rect": sp.rect2pathd, "circle": sp.ellipse2pathd, "ellipse": sp.ellipse2pathd,
              "polygon": sp.polygon2pathd, "polyline": sp.polyline2pathd, "line": sp.line2pathd}[tag]
        return parse_path(fn(a))

    def walk(el, mat, inherited):
        tag = _local(el.tag)
        own = dict(el.attrib)
        style = dict(kv.split(":", 1) for kv in own.get("style", "").split(";") if ":" in kv)
        attrs = {**inherited, **{k: v for k, v in own.items() if k != "style"}, **{k: v.strip() for k, v in style.items()}}
        if "transform" in own:
            mat = mat @ parse_transform(own["transform"])
        if tag in _SHAPE_TAGS:
            path = convert(tag, own)
            if len(path):
                yield attrs, (path.transformed(mat) if not np.allclose(mat, np.eye(3)) else path)
        keep = {k: attrs[k] for k in ("fill",) if k in attrs}      # fill is inherited from groups
        for ch in el:
            yield from walk(ch, mat, keep)

    root = ET.fromstring(svg_text)
    yield from walk(root, np.eye(3), {})


def svg_to_contours(svg_text: str, samples: int = SAMPLES_PER_CONTOUR) -> list[Contour]:
    """parse every path / shape of the SVG (transforms applied), one Contour per closed sub-path, sorted for drawing"""
    out: list[Contour] = []
    for attrs, path in _iter_shapes(svg_text):
        fill = (attrs.get("fill") or "").strip() or None
        if fill == "none":
            continue
        base = attrs.get("id") or f"shape_{len(out):02d}"
        for j, sub in enumerate(path.continuous_subpaths()):
            if sub.length() < 1e-9:
                continue
            dense = _dense_polyline(sub, DENSE_PER_SEGMENT)
            z, perim = resample_arclength(dense, samples)
            name = base if j == 0 else f"{base}_{j}"
            out.append(Contour(name, _classify(base, fill, _polygon_area(z)), fill, z, perim))
    rank = {r: i for i, r in enumerate(ROLE_ORDER)}
    out.sort(key=lambda c: (rank.get(c.role, 99), c.name))
    return out


def to_scene_units(contours: list[Contour], width: float) -> list[Contour]:
    """flip y, centre the whole drawing on the origin and scale so the bounding box is `width` units wide"""
    allz = np.concatenate([c.samples for c in contours])
    lo = complex(allz.real.min(), allz.imag.min())
    hi = complex(allz.real.max(), allz.imag.max())
    centre = (lo + hi) / 2
    scale = width / (hi.real - lo.real)
    for c in contours:
        z = (c.samples - centre) * scale
        c.samples = z.real - 1j * z.imag          # flip: SVG y-down -> scene y-up
        c.perimeter *= scale
    return contours


# ---------------------------------------------------------------------------------------- DFT
def harmonics_for(c: Contour) -> int:
    return HARMONICS_BY_NAME.get(c.name, HARMONICS_BY_ROLE.get(c.role, 32))


def dft_series(z: np.ndarray, N: int) -> Series:
    """complex Fourier coefficients c_n for n in [-N, N]; the chain is sorted by descending magnitude (c_0 is the base)"""
    m = len(z)
    if 2 * N + 1 > m:
        raise ValueError(f"need more samples than coefficients: M={m}, 2N+1={2 * N + 1}")
    c = np.fft.fft(z) / m                        # c[n mod m] = (1/M) sum_k z_k e^{-2 pi i n k / M}
    terms = [Epicycle(n, complex(c[n % m])) for n in range(-N, N + 1) if n != 0]
    terms.sort(key=lambda e: (-e.radius, abs(e.n), e.n))
    return Series(base=complex(c[0]), terms=terms, N=N)


def attach_series(contours: list[Contour]) -> list[Contour]:
    for c in contours:
        c.series = dft_series(c.samples, harmonics_for(c))
    return contours


def build(svg_text: str, width: float = 10.0, samples: int = SAMPLES_PER_CONTOUR) -> list[Contour]:
    return attach_series(to_scene_units(svg_to_contours(svg_text, samples), width))


def reconstruction_error(c: Contour, points: int = 4096) -> tuple[float, float]:
    """(max, rms) distance from the reconstructed curve to the original arc-length samples, in scene units"""
    t = np.linspace(0, 2 * np.pi, len(c.samples), endpoint=False)
    err = np.abs(c.series.evaluate(t) - c.samples)
    return float(err.max()), float(np.sqrt((err ** 2).mean()))


# ---------------------------------------------------------------------------------------- self test
def _selftest(svg_path: str | None) -> int:
    import flag_svg

    svg, origin = flag_svg.load_flag_svg(svg_path, allow_download=False)
    print("source:", origin)
    cs = build(svg, width=20.0)           # width 20 -> module units, so the legal dimensions can be asserted
    by = {c.name: c for c in cs}
    print(f"{len(cs)} contours: " + ", ".join(sorted({c.role for c in cs})))
    ok = True

    def check(label, got, want, tol):
        nonlocal ok
        good = abs(got - want) <= tol
        ok &= good
        print(("ok   " if good else "FAIL ") + f"{label}: {got:.4f} (expected {want:.4f})")

    if "field" in by:                      # legal geometry (only meaningful for the built-in / official artwork)
        check("field perimeter", by["field"].perimeter, 2 * (20 + 14), 0.02)
        check("rhombus perimeter", by["rhombus"].perimeter, 4 * float(np.hypot(8.3, 5.3)), 0.02)
        check("disc perimeter", by["disc"].perimeter, 2 * np.pi * 3.5, 0.02)
        # arc-length parameterisation: consecutive samples on a straight run of the rhombus are equally spaced
        z = by["rhombus"].samples
        d = np.abs(np.diff(np.concatenate([z, z[:1]])))
        spread = (d.max() - d.min()) / d.mean()
        print(f"info rhombus sample-step spread {spread:.3%} (0 on straight edges: uniform in arc length)")
        check("disc needs exactly one harmonic (|c_1|)", by["disc"].series.terms[0].radius, 3.5, 0.02)
    print("\nrole      N    terms  max err   rms err   (scene units, 20 = flag width)")
    for c in cs:
        if c.name.startswith("star_") and c.name != "star_00":
            continue
        mx, rms = reconstruction_error(c)
        print(f"{c.name:<9} {c.series.N:<4} {2 * c.series.N + 1:<6} {mx:8.4f}  {rms:8.4f}")
    # more harmonics must not increase the error
    c = by.get("rhombus") or cs[0]
    errs = [reconstruction_error(Contour(c.name, c.role, c.fill, c.samples, c.perimeter, dft_series(c.samples, n)))[1] for n in (4, 16, 64, 256)]
    mono = all(a >= b - 1e-9 for a, b in zip(errs, errs[1:]))
    ok &= mono
    print(f"{'ok  ' if mono else 'FAIL'} rms error falls with N on {c.name}: " + " > ".join(f"{e:.4f}" for e in errs))
    # the chain must end exactly on the curve at t = 0
    tip0 = c.series.tips(0.0)[-1]
    check("chain tip at t=0 is within truncation error of the first sample", abs(tip0 - c.samples[0]), 0.0, 0.15)
    print("\nSELFTEST", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--svg", default=None)
    a = ap.parse_args()
    raise SystemExit(_selftest(a.svg) if a.selftest else 0)
