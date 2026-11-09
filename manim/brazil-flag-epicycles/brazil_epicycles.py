"""The Flag of Brazil drawn by complex Fourier epicycles (Manim Community Edition).

    manim -pql brazil_epicycles.py BrazilFlagEpicycles          # quick preview (480p15)
    manim -qh  brazil_epicycles.py BrazilFlagEpicycles          # 1080p60
    BRAZIL_PORTRAIT=1 manim -qh brazil_epicycles.py BrazilFlagEpicycles   # 1080 x 1920 for Reels / TikTok
    BRAZIL_SVG=/path/to/Flag_of_Brazil.svg manim ...             # use the official artwork

Pipeline (all of the maths lives in epicycle_math.py, the SVG source in flag_svg.py):
    SVG paths -> closed sub-paths -> N_arc uniformly spaced arc-length samples -> z = x + iy
    -> DFT c_n (n = -N..N) -> sorted by |c_n| -> chain of rotating vectors -> a TracedPath on the last tip

Everything visual is in THEME / CONFIG below so a brand palette can be dropped in without touching the animation code.
"""
from __future__ import annotations

import os

import numpy as np
from manim import (
    DOWN, LEFT, ORIGIN, RIGHT, UP, Circle, Dot, FadeIn, FadeOut, Line, Scene, Text, TracedPath, ValueTracker,
    VGroup, VMobject, config, linear, smooth,
)

import epicycle_math as em
import flag_svg

# ================================================================================================ portrait option
if os.environ.get("BRAZIL_PORTRAIT"):
    config.pixel_width, config.pixel_height = 1080, 1920
    config.frame_width, config.frame_height = 9.0, 16.0

# ================================================================================================ THEME (placeholder palette)
# Default = the MAE Academy "theme-1" palette. Swap the dictionaries to inject your own colours.
THEME = {
    "background": "#0A0A10",
    "text": "#FFFFFF",
    "text_dim": "#FFFFFF",
    "rig_circle": "#FFFFFF",        # epicycle circles
    "rig_vector": "#B026FF",        # rotating vectors
    "rig_tip": "#FFFFFF",           # the tracing dot
    # role -> (trace / outline colour, fill colour)
    "roles": {
        "field": ("#0088FF", "#0088FF"),
        "rhombus": ("#FF0044", "#FF0044"),
        "disc": ("#B026FF", "#B026FF"),
        "band": ("#FFFFFF", "#FFFFFF"),
        "star": ("#FFFFFF", "#FFFFFF"),
    },
}
# the real flag colours, for when you want them: THEME["roles"] = FLAG_ROLES
FLAG_ROLES = {
    "field": ("#009B3A", "#009B3A"), "rhombus": ("#FEDF00", "#FEDF00"), "disc": ("#002776", "#002776"),
    "band": ("#FFFFFF", "#FFFFFF"), "star": ("#FFFFFF", "#FFFFFF"),
}

# ================================================================================================ CONFIG
CONFIG = {
    "flag_width": 8.4 if os.environ.get("BRAZIL_PORTRAIT") else 10.0,   # scene units across the whole flag
    "svg": None,                       # path / URL; None = argument -> $BRAZIL_SVG -> assets/ -> Wikimedia -> built-in
    "samples": 2048,                   # arc-length samples per contour fed to the DFT
    # harmonics N per role (series uses -N..N). Override a single contour by name in `harmonics_by_name`.
    "harmonics_by_role": {"field": 48, "rhombus": 48, "disc": 6, "band": 60, "star": 36},
    "harmonics_by_name": {},
    # seconds for one full revolution t: 0 -> 2 pi, per role
    "run_time": {"field": 7.0, "rhombus": 6.0, "disc": 3.5, "band": 5.0, "star": 4.0},
    "max_circles": 36,                 # circles drawn per rig (the biggest first); vectors are always all drawn
    "fill_opacity": {"field": 0.22, "rhombus": 0.30, "disc": 0.35, "band": 0.45, "star": 0.75},
    "stroke_width": {"trace": 3.2, "final": 2.4, "circle": 1.0, "vector": 1.6},
    "first_star_full": True,           # the first star is shown with its full rig, the others trace together
    "settle": True,                    # after a contour is traced: swap the trace for the clean filled shape
    "hud": True,                       # contour name, N and a progress read-out
}


def _setup_math() -> list[em.Contour]:
    em.HARMONICS_BY_ROLE.update(CONFIG["harmonics_by_role"])
    em.HARMONICS_BY_NAME.update(CONFIG["harmonics_by_name"])
    svg, origin = flag_svg.load_flag_svg(CONFIG["svg"])
    print(f"[brazil] SVG source: {origin}")
    contours = em.build(svg, width=CONFIG["flag_width"], samples=CONFIG["samples"])
    print(f"[brazil] {len(contours)} contours, harmonics: "
          + ", ".join(f"{r}={em.HARMONICS_BY_ROLE.get(r)}" for r in em.ROLE_ORDER))
    return contours


def to_pt(z: complex) -> np.ndarray:
    return np.array([z.real, z.imag, 0.0])


# ================================================================================================ the rig
class EpicycleRig(VGroup):
    """base c_0 (static), then c_n e^{i n t} chained head to tail. Circles show |c_n|, vectors show |c_n| and the phase."""

    def __init__(self, series: em.Series, t: ValueTracker, show_circles: bool = True, **kw):
        super().__init__(**kw)
        self.series, self.t = series, t
        k = CONFIG["max_circles"] if show_circles else 0
        sw = CONFIG["stroke_width"]
        self.circles = VGroup(*[
            Circle(radius=max(e.radius, 1e-4), stroke_width=sw["circle"], stroke_color=THEME["rig_circle"], stroke_opacity=0.16 + 0.34 * (1 - i / max(k, 1)))
            for i, e in enumerate(series.terms[:k])
        ])
        self.vectors = VGroup(*[
            Line(ORIGIN, RIGHT * 1e-3, stroke_width=sw["vector"], stroke_color=THEME["rig_vector"], stroke_opacity=0.85 if i < 40 else 0.4)
            for i in range(len(series.terms))
        ])
        self.tip = Dot(radius=0.06, color=THEME["rig_tip"])
        self.add(self.circles, self.vectors, self.tip)
        self.add_updater(lambda m: m._refresh())
        self._refresh()

    def _refresh(self):
        pts = self.series.tips(self.t.get_value())
        for i, ln in enumerate(self.vectors):
            ln.put_start_and_end_on(to_pt(pts[i]), to_pt(pts[i + 1]))
        for i, c in enumerate(self.circles):
            c.move_to(to_pt(pts[i]))
        self.tip.move_to(to_pt(pts[-1]))

    def tip_center(self):
        return self.tip.get_center()


def final_shape(contour: em.Contour, points: int = 900) -> VMobject:
    """the clean filled outline, evaluated from the same series at t in [0, 2 pi)"""
    stroke, fill = THEME["roles"][contour.role]
    z = contour.series.evaluate(np.linspace(0, 2 * np.pi, points, endpoint=False))
    m = VMobject()
    m.set_points_as_corners([to_pt(p) for p in np.append(z, z[:1])])
    m.set_stroke(stroke, CONFIG["stroke_width"]["final"], opacity=1.0)
    m.set_fill(fill, opacity=CONFIG["fill_opacity"][contour.role])
    return m


# ================================================================================================ the scene
class BrazilFlagEpicycles(Scene):
    def construct(self):
        self.camera.background_color = THEME["background"]
        contours = _setup_math()
        self.settled: list[VMobject] = []

        by_role: dict[str, list[em.Contour]] = {}
        for c in contours:
            by_role.setdefault(c.role, []).append(c)

        for role in em.ROLE_ORDER:
            group = by_role.get(role, [])
            if not group:
                continue
            if role == "star" and len(group) > 1:
                self.draw_stars(group)
            else:
                for c in group:
                    self.draw_contour(c)
        self.wait(1.2)

    # -------------------------------------------------------------------------------- one contour, full rig
    def draw_contour(self, c: em.Contour, show_circles: bool = True, run_time: float | None = None):
        t = ValueTracker(0.0)
        rig = EpicycleRig(c.series, t, show_circles=show_circles)
        trace = TracedPath(rig.tip_center, stroke_color=THEME["roles"][c.role][0], stroke_width=CONFIG["stroke_width"]["trace"])
        hud = self.make_hud(c, t) if CONFIG["hud"] else VGroup()
        self.add(trace)
        self.play(FadeIn(rig), FadeIn(hud), run_time=0.6)
        self.play(t.animate.set_value(2 * np.pi), run_time=run_time or CONFIG["run_time"][c.role], rate_func=linear)
        self.settle(c, [rig, hud], trace)

    # -------------------------------------------------------------------------------- many small contours at once
    def draw_stars(self, stars: list[em.Contour]):
        first = stars[0]
        rest = stars[1:]
        if CONFIG["first_star_full"]:
            self.draw_contour(first)
        else:
            rest = stars
        if not rest:
            return
        t = ValueTracker(0.0)
        rigs = [EpicycleRig(s.series, t, show_circles=False) for s in rest]
        # only the tips and the traces are shown for the crowd; the vectors are hidden to keep the frame readable
        for r in rigs:
            r.vectors.set_opacity(0)
        traces = [TracedPath(r.tip_center, stroke_color=THEME["roles"]["star"][0], stroke_width=CONFIG["stroke_width"]["trace"] * 0.7) for r in rigs]
        self.add(*traces)
        self.play(*[FadeIn(r.tip) for r in rigs], run_time=0.4)
        self.add(*rigs)
        self.play(t.animate.set_value(2 * np.pi), run_time=CONFIG["run_time"]["star"], rate_func=linear)
        finals = [final_shape(s) for s in rest]
        self.play(*[FadeIn(f) for f in finals], *[FadeOut(x) for x in traces + rigs], run_time=0.8)
        self.settled.extend(finals)

    # -------------------------------------------------------------------------------- helpers
    def settle(self, c: em.Contour, rig_parts, trace):
        if CONFIG["settle"]:
            shape = final_shape(c)
            self.play(FadeIn(shape), *[FadeOut(p) for p in rig_parts], FadeOut(trace), run_time=0.8)
            self.settled.append(shape)
        else:
            self.play(*[FadeOut(p) for p in rig_parts], run_time=0.5)

    def make_hud(self, c: em.Contour, t: ValueTracker) -> VGroup:
        title = Text(f"{c.name}", font_size=26, color=THEME["text"]).to_corner(UP + LEFT, buff=0.35)
        info = Text(f"N = {c.series.N}   ({2 * c.series.N + 1} vectors)", font_size=20, color=THEME["text_dim"]).next_to(title, DOWN, aligned_edge=LEFT, buff=0.1)

        def pct():
            from manim import always_redraw

            return always_redraw(lambda: Text(f"t = {t.get_value() / (2 * np.pi):5.1%} of 2π", font_size=20, color=THEME["text_dim"]).next_to(info, DOWN, aligned_edge=LEFT, buff=0.1))

        return VGroup(title, info, pct())
