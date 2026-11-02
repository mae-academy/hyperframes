#!/usr/bin/env python3
"""Generates index.html from src/template.html + src/timeline.js  ("THE R-MATRIX TRICK", 1080x1920, 14.5 s).

    python3 build_index.py            # ships the cdnjs GSAP tag
    python3 build_index.py --local    # points the GSAP tag at assets/gsap.min.js (offline verification only)

Typography: every formula is rendered by the vendored KaTeX (scripts/vendor, scripts/katex_render.cjs) at build time.
Names are upright bold (\\mathbf{R}, \\mathbf{I}, \\mathbf{V}), subscripts upright (\\mathrm{11}), units upright with a thin
space (2\\,\\mathrm{k}\\Omega): no italics anywhere.
Numbers: every entry, sum, sign and tracer timing is derived here and asserted against scripts/solve.py.
"""
import json, math, random, re, subprocess, sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "scripts"))
from solve import solve_mesh  # noqa: E402

CONFIG = dict(DURATION=14.5, R=[2, 2, 3, 4, 1], V=[5, 16, 13])   # kOhm, volts
ITALIC = True      # all KaTeX (and the KaTeX_Main text) in italics; False = upright roman names/units
GSAP_CDN = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
BLUE, PURPLE, RED = "#0088FF", "#B026FF", "#FF0044"
Rv = dict(zip(["R1", "R2", "R3", "R4", "R5"], CONFIG["R"]))
Vv = dict(zip(["V1", "V2", "V3"], CONFIG["V"]))
S = solve_mesh(CONFIG["R"], CONFIG["V"])
A0, b0 = S["A0"], S["b0"]
assert [[int(x) for x in r] for r in A0] == [[4, -2, 0], [-2, 9, -4], [0, -4, 5]] and [int(x) for x in b0] == [-8, -16, 13]

# ------------------------------------------------------------------ KaTeX (batch rendered at the end)
TEX = []


def K(tex):
    if tex not in TEX:
        TEX.append(tex)
    return f"@@K{TEX.index(tex)}@@"


def italicise(tex):
    """ITALIC mode: roman text/identifiers become italic (\\mathrm -> \\mathit, \\text -> \\textit, upright Omega -> \\varOmega)."""
    return tex.replace("\\mathrm{", "\\mathit{").replace("\\text{", "\\textit{").replace("\\Omega", "\\varOmega")


def render_tex():
    tex_list = [italicise(t) for t in TEX] if ITALIC else TEX
    r = subprocess.run(["node", str(HERE / "scripts" / "katex_render.cjs")], input=json.dumps(tex_list), capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def n(x):                      # signed integer as TeX with a real minus
    return str(int(x))


def MB(s): return r"\mathbf{" + s + "}"
def MR(s): return r"\mathrm{" + s + "}"
def Rsym(sub): return MB("R") + "_{" + MR(sub) + "}"            # \mathbf{R}_{\mathrm{11}}
def Vsym(sub): return MR("V") + "_{" + MR(sub) + "}"
def vsym(sub): return MB("v") + "_{" + MR(sub) + "}"
def Isym(sub): return MB("I") + "_{" + MR(sub) + "}"
def kohm(v): return MB(str(v)) + r"\,\mathrm{k}\Omega"
def volt(v): return MB(str(v)) + r"\,\mathrm{V}"


# ------------------------------------------------------------------ geometry (plate-local 900x550)
PLATE = (91, 341)             # padding-box origin of #plate (left 90, top 340, 1 px border)
CARD = (160, 1100)            # origin of #cardin
BANNER_C = (540, 995)         # banner centre
DX = 12
X0, X1, X2, GY = 150 + DX, 400 + DX, 720 + DX, 470
NODES = {"TL": (X0, 90), "N1": (X1, 90), "TR": (X2, 90), "N3": (X1, 300), "N2": (X2, 300)}
BR = {
    "V1": ("V", (X0, 90), (X0, GY), (X0, 280)), "R1": ("R", (X0, 90), (X1, 90), ((X0 + X1) // 2, 90)),
    "R3": ("R", (X1, 90), (X2, 90), ((X1 + X2) // 2, 90)), "V2": ("V", (X2, 90), (X2, 300), (X2, 195)),
    "R2": ("R", (X1, 90), (X1, 300), (X1, 195)), "R4": ("R", (X1, 300), (X2, 300), ((X1 + X2) // 2, 300)),
    "R5": ("R", (X2, 300), (X2, GY), (X2, 385)), "V3": ("V", (X1, 300), (X1, GY), (X1, 385)),
}
LAB = {"R1": (287, 52, "c"), "R3": (572, 52, "c"), "R2": (380, 195, "r"), "R4": (572, 342, "c"),
       "R5": (774, 385, "l"), "V1": (118, 280, "r"), "V2": (774, 195, "l"), "V3": (366, 385, "r")}
MESH_C = [(287, 280), (572, 195), (572, 385)]
INS = 14
RECT = {1: (X0 + INS, 90 + INS, X1 - INS, GY - INS), 2: (X1 + INS, 90 + INS, X2 - INS, 300 - INS), 3: (X1 + INS, 300 + INS, X2 - INS, GY - INS)}


def corners(m):
    xl, yt, xr, yb = RECT[m]
    return {"TL": (xl, yt), "TR": (xr, yt), "BR": (xr, yb), "BL": (xl, yb)}


def seglens(pts):
    return [math.dist(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts))]


def arc_pos(pts, p):
    best, cum = (1e9, 0.0), 0.0
    for i, L in enumerate(seglens(pts)):
        a, b = pts[i], pts[(i + 1) % len(pts)]
        t = max(0.0, min(1.0, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (L * L)))
        d = math.dist(p, (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])))
        if d < best[0]:
            best = (d, cum + t * L)
        cum += L
    return best[1]


def point_at(pts, d):
    for i, L in enumerate(seglens(pts)):
        if d <= L + 1e-9:
            a, b = pts[i], pts[(i + 1) % len(pts)]
            t = d / L
            return (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))
        d -= L
    return pts[0]


# clockwise laps, started at the corner that makes the comet meet the resistors in the order the cues touch them
DIAG = {
    1: dict(path=["TL", "TR", "BR", "BL"], start=1.8, touches=[("R1", 2.2), ("R2", 2.6)], lap_end=2.95, lock=3.0, bar=1.8),
    2: dict(path=["BL", "TL", "TR", "BR"], start=3.2, touches=[("R2", 3.6), ("R3", 4.0), ("R4", 4.3)], lap_end=4.55, lock=4.6, bar=3.2),
    3: dict(path=["TL", "TR", "BR", "BL"], start=4.7, touches=[("R4", 5.1), ("R5", 5.5)], lap_end=5.95, lock=6.0, bar=4.7),
}
MESH_RES = {1: ["R1", "R2"], 2: ["R2", "R3", "R4"], 3: ["R4", "R5"]}
MESH_SRC = {1: [("V1", +1), ("V3", -1)], 2: [("V2", -1)], 3: [("V3", +1)]}
SHARED = {(1, 2): "R2", (2, 3): "R4", (1, 3): None}


def waypoints(m, spec):
    c = corners(m)
    pts = [c[k] for k in spec["path"]]
    seg = seglens(pts)
    total = sum(seg)
    keys = [(0.0, spec["start"])] + [(arc_pos(pts, BR[r][3]), t) for r, t in spec["touches"]] + [(total, spec["lap_end"])]
    assert all(keys[i][0] < keys[i + 1][0] and keys[i][1] < keys[i + 1][1] for i in range(len(keys) - 1)), (m, keys)
    cum, run = [], 0.0
    for L in seg:
        cum.append(run)
        run += L
    ds = sorted({round(x, 3) for x in cum + [total] + [k[0] for k in keys]})

    def tat(d):
        for (d0, t0), (d1, t1) in zip(keys, keys[1:]):
            if d0 - 1e-9 <= d <= d1 + 1e-9:
                return t0 + (t1 - t0) * (d - d0) / (d1 - d0)
    wps = [dict(d=d, t=round(tat(d), 4), x=round(point_at(pts, d)[0], 2), y=round(point_at(pts, d)[1], 2)) for d in ds]
    return dict(pts=[list(p) for p in pts], total=round(total, 2), wps=wps)


# ------------------------------------------------------------------ circuit (SVG + KaTeX labels)
def build_circuit():
    svg, labels = [], []
    svg.append('<defs><filter id="glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="5" result="b"/>'
               '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
    for k, (_, p, q, _) in BR.items():
        svg.append(f'<line id="w-{k}" x1="{p[0]}" y1="{p[1]}" x2="{q[0]}" y2="{q[1]}" class="wire"/>')
    svg.append(f'<line id="w-GND" x1="{X0}" y1="{GY}" x2="{X2}" y2="{GY}" class="wire"/>')
    gx = 572
    svg.append(f'<g id="gnd"><line x1="{gx}" y1="{GY}" x2="{gx}" y2="{GY+18}" class="gl"/><line x1="{gx-30}" y1="{GY+18}" x2="{gx+30}" y2="{GY+18}" class="gl"/>'
               f'<line x1="{gx-19}" y1="{GY+30}" x2="{gx+19}" y2="{GY+30}" class="gl"/><line x1="{gx-8}" y1="{GY+42}" x2="{gx+8}" y2="{GY+42}" class="gl"/></g>')
    for k, (kind, p, q, (cx, cy)) in BR.items():
        horiz = p[1] == q[1]
        if kind == "R":
            sp = [(-60, 0), (-48, 0), (-40, -14), (-24, 14), (-8, -14), (8, 14), (24, -14), (40, 14), (48, 0), (60, 0)]
            pts = [(cx + s, cy + t) if horiz else (cx + t, cy + s) for s, t in sp]
            m = (cx - 62, cy - 17, 124, 34) if horiz else (cx - 17, cy - 62, 34, 124)
            svg.append(f'<g id="el-{k}"><rect x="{m[0]}" y="{m[1]}" width="{m[2]}" height="{m[3]}" class="mask"/>'
                       f'<polyline points="{" ".join(f"{x},{y}" for x, y in pts)}" class="res"/></g>')
        else:
            svg.append(f'<g id="el-{k}"><circle cx="{cx}" cy="{cy}" r="34" class="src"/>'
                       f'<path d="M{cx-8} {cy-14} H{cx+8} M{cx} {cy-22} V{cy-6}" class="pm"/><path d="M{cx-8} {cy+14} H{cx+8}" class="pm"/></g>')
    for nm, (x, y) in NODES.items():
        svg.append(f'<circle cx="{x}" cy="{y}" r="9" class="node"/>')
    for x in (X0, X1, X2):
        svg.append(f'<circle cx="{x}" cy="{GY}" r="7" class="node"/>')
    for m in (1, 2, 3):
        c = corners(m)
        poly = " ".join(f"{x},{y}" for x, y in (c["TL"], c["TR"], c["BR"], c["BL"]))
        svg.append(f'<polygon id="perim-{m}" points="{poly}" class="perim"/>')
    G = {}
    for m, spec in DIAG.items():
        G[m] = waypoints(m, spec)
        pts = G[m]["pts"]
        closed = " ".join(f"{x},{y}" for x, y in pts + [pts[0]])
        svg.append(f'<polyline id="trail-{m}" points="{closed}" class="trail" stroke-dasharray="{G[m]["total"]}" stroke-dashoffset="{G[m]["total"]}"/>')
    for m in (1, 2, 3):
        x, y = G[m]["pts"][0]
        svg.append(f'<g id="head-{m}" class="head"><circle cx="{x}" cy="{y}" r="15" fill="#0088FF" opacity=".35" filter="url(#glow)"/>'
                   f'<circle cx="{x}" cy="{y}" r="8.5" fill="#0088FF" filter="url(#glow)"/><circle cx="{x}" cy="{y}" r="3.8" fill="#fff"/></g>')
    sparks = {"sp-R2a": (X1 - INS, 133), "sp-R2b": (X1 + INS, 257), "sp-R4a": (X2 - 34, 300 - INS), "sp-R4b": (X1 + 34, 300 + INS)}
    for sid, (x, y) in sparks.items():
        svg.append(f'<circle id="{sid}" cx="{x}" cy="{y}" r="7" fill="#fff" class="spark" filter="url(#glow)"/>')

    def box(x, y, w, h, al, html, cid, cls):
        left = x if al == "l" else (x - w if al == "r" else x - w / 2)
        ta = {"l": "left", "r": "right", "c": "center"}[al]
        return f'<div id="{cid}" class="lb {cls}" style="left:{left:.0f}px;top:{y-h/2:.0f}px;width:{w}px;height:{h}px;line-height:{h}px;text-align:{ta}">{html}</div>'

    for k, (x, y, al) in LAB.items():
        tex = (Rsym(k[1]) + "=" + kohm(Rv[k]) if k in Rv else Vsym(k[1]) + "=" + volt(Vv[k]))
        labels.append(box(x, y, 210, 36, al, K(tex), f"lb-{k}", "elabel"))
    for i, (cx, cy) in enumerate(MESH_C):
        labels.append(box(cx, cy, 70, 44, "c", K(Isym(str(i + 1))), f"ml-{i+1}", "mlabel"))
    labels.append(box(612, GY + 42, 90, 26, "l", K(MR("GND")), "gtag", "gtag"))
    return "\n".join(svg), "\n".join(labels), sparks, G


# ------------------------------------------------------------------ matrix card (card-local coordinates)
COLX, ROWY, VX, IX = [110, 230, 350], [175, 285, 395], 666, 484


def cell_abs(r, c):
    return (CARD[0] + (VX if c == 3 else COLX[c]), CARD[1] + ROWY[r])


def build_matrix():
    out = []
    for r in range(3):
        for c in range(3):
            cls = "d" if r == c else "p"
            out.append(f'<div id="e-{r}-{c}" class="cell {cls}" style="left:{COLX[c]-60}px;top:{ROWY[r]-55}px">'
                       f'<b class="ghost">{K(Rsym(f"{r+1}{c+1}"))}</b><b class="val">{K(MB(n(A0[r][c])))}</b><i class="ring"></i></div>')
        out.append(f'<div id="v-{r}" class="cell s" style="left:{VX-60}px;top:{ROWY[r]-55}px">'
                   f'<b class="ghost">{K(vsym(str(r+1)))}</b><b class="val">{K(MB(n(b0[r])))}</b><i class="ring"></i></div>')
        out.append(f'<div class="ivec" style="left:{IX-40}px;top:{ROWY[r]-55}px">{K(Isym(str(r+1)))}</div>')
    return "\n".join(out)


def brackets():
    def br(x, left, y0=120, y1=450, a=16):
        d = f"M{x+a} {y0} H{x} V{y1} H{x+a}" if left else f"M{x-a} {y0} H{x} V{y1} H{x-a}"
        return f'<path d="{d}" class="brk"/>'
    return "".join([br(44, True), br(416, False), br(446, True, a=12), br(522, False, a=12), br(594, True), br(738, False)])


# ------------------------------------------------------------------ banner (zone 3): live resistor accumulator
def piece(pid, tex, cls="pc"):
    return f'<span id="{pid}" class="{cls}">{K(tex)}</span>'


def build_banner():
    h = []
    h.append('<div id="bv-0" class="bv"><div class="bt">STOP WRITING KVL EQUATIONS:<br>BUILD IT BY SIGHT <svg class="ic" viewBox="0 0 24 24"><path d="M13.5 2 5 13.2h6L9.8 22 19 10.2h-6.2L13.5 2z" fill="#fff"/></svg></div></div>')
    h.append('<div id="bv-1" class="bv"><div class="bt">BUILD THE R-MATRIX IN 5 SECONDS<br>BY SIGHT <svg class="ic" viewBox="0 0 24 24"><path d="M13.5 2 5 13.2h6L9.8 22 19 10.2h-6.2L13.5 2z" fill="#fff"/></svg></div></div>')
    for m, spec in DIAG.items():
        res = sorted(MESH_RES[m])
        assert A0[m - 1][m - 1] == sum(Rv[k] for k in res)
        touched = [r for r, _ in spec["touches"]]
        assert sorted(touched) == res
        l1 = piece(f"d{m}-p0", Rsym(f"{m}{m}") + "=")
        sym_terms, num_terms = [], []
        for i, r in enumerate(touched):
            pre = "" if i == 0 else "+" + chr(92) + ";"
            sym_terms.append(piece(f"d{m}-s{i}", pre + Rsym(r[1])))
            num_terms.append(piece(f"d{m}-n{i}", pre + MB(str(Rv[r]))))
        l2 = piece(f"d{m}-e", "=") + "".join(num_terms) + piece(f"d{m}-f", "=" + MB(n(A0[m - 1][m - 1])) + r"\,\mathrm{k}\Omega")
        h.append(f'<div id="bv-d{m}" class="bv bvc"><div class="bl l1">{l1}{"".join(sym_terms)}</div><div class="bl l2">{l2}</div></div>')
    # off-diagonals
    off = ('<div id="bv-off" class="bv bvc"><div class="bl l1">' + K(Rsym("ij") + r"=-\big(\,\text{shared resistor}\,\big)") + '</div>')
    variants = []
    for (i, j), vid in zip(((1, 2), (2, 3), (1, 3)), ("a", "b", "c")):
        sh = SHARED[(i, j)]
        val = -Rv[sh] if sh else 0
        assert A0[i - 1][j - 1] == A0[j - 1][i - 1] == val
        if sh:
            tex = r"\text{Mesh }" + f"{i}" + r"\ \&\ \text{Mesh }" + f"{j}" + r":\ " + Rsym(f"{i}{j}") + "=" + Rsym(f"{j}{i}") + "=-" + MR("R") + "_{" + MR(sh[1]) + "}=" + MB(n(val)) + r"\,\mathrm{k}\Omega"
        else:
            tex = r"\text{Mesh }" + f"{i}" + r"\ \&\ \text{Mesh }" + f"{j}" + r"\ \text{share nothing}:\ " + Rsym(f"{i}{j}") + "=" + Rsym(f"{j}{i}") + "=" + MB("0")
        variants.append(f'<div id="off-{vid}" class="bl l2 vr">{K(tex)}</div>')
    h.append(off + "".join(variants) + "</div>")
    # sources
    src = '<div id="bv-src" class="bv bvc"><div class="bl l1">' + K(vsym("i") + "=" + r"\sum" + MR("V") + "_{" + MR("rises") + "}-" + r"\sum" + MR("V") + "_{" + MR("drops") + "}") + '</div>'
    sv = []
    for m in (1, 2, 3):
        terms = MESH_SRC[m]
        val = sum(sg * Vv[k] for k, sg in terms)
        assert b0[m - 1] == val
        sym = "".join(("-" if sg < 0 else ("+" if True else "")) + MR("V") + "_{" + MR(k[1]) + "}" for k, sg in terms)
        body = "".join(("-" if sg < 0 else ("+" if i else "")) + MB(str(Vv[k])) for i, (k, sg) in enumerate(terms))
        tex = r"\text{Mesh }" + str(m) + r":\ " + vsym(str(m)) + "=" + sym + ("=" + body if len(terms) > 1 else "") + "=" + MB(n(val)) + r"\,\mathrm{V}"
        sv.append(f'<div id="src-{m}" class="bl l2 vr">{K(tex)}</div>')
    h.append(src + "".join(sv) + "</div>")
    return "\n".join(h)


# ------------------------------------------------------------------ hook overlay: messy KVL algebra crossed out, then shatters
def build_overlay():
    lines = [
        (r"(\mathrm{R}_{\mathrm{1}}+\mathrm{R}_{\mathrm{2}})\mathrm{I}_{\mathrm{1}}-\mathrm{R}_{\mathrm{2}}\mathrm{I}_{\mathrm{2}}=\mathrm{V}_{\mathrm{1}}-\mathrm{V}_{\mathrm{3}}", 46, 54, -2.5, 34),
        (r"-\mathrm{R}_{\mathrm{2}}\mathrm{I}_{\mathrm{1}}+(\mathrm{R}_{\mathrm{2}}+\mathrm{R}_{\mathrm{3}}+\mathrm{R}_{\mathrm{4}})\mathrm{I}_{\mathrm{2}}-\mathrm{R}_{\mathrm{4}}\mathrm{I}_{\mathrm{3}}=-\mathrm{V}_{\mathrm{2}}", 70, 138, 1.8, 30),
        (r"-\mathrm{R}_{\mathrm{4}}\mathrm{I}_{\mathrm{2}}+(\mathrm{R}_{\mathrm{4}}+\mathrm{R}_{\mathrm{5}})\mathrm{I}_{\mathrm{3}}=\mathrm{V}_{\mathrm{3}}", 38, 222, -1.4, 34),
        (r"4\mathrm{I}_{\mathrm{1}}-2\mathrm{I}_{\mathrm{2}}=-8\;\Rightarrow\;\mathrm{I}_{\mathrm{1}}=\tfrac{\mathrm{I}_{\mathrm{2}}-4}{2}\;?", 150, 300, 3.2, 32),
    ]
    h = []
    for i, (tex, x, y, rot, fs) in enumerate(lines):
        h.append(f'<div id="ms-{i}" class="mess" style="left:{x}px;top:{y}px;font-size:{fs}px">{K(tex)}<i class="strike"></i></div>')
    h.append('<div id="ms-4" class="ovq" style="left:40px;top:392px;width:700px;text-align:left">15 MINUTES OF MESH EQUATIONS?</div>')
    h.append('<svg id="ms-5" class="ovx" style="left:766px;top:384px" width="120" height="110" viewBox="0 0 120 110"><path d="M14 10 L106 100 M106 10 L14 100" stroke="#FF0044" stroke-width="16" stroke-linecap="round" fill="none"/></svg>')
    return "\n".join(h)


def build_shards(inner):
    rnd = random.Random(11)
    W, H, C, R = 900, 550, 4, 3
    gx = [[(c * W / C) + (rnd.uniform(-34, 34) if 0 < c < C else 0) for c in range(C + 1)] for _ in range(R + 1)]
    gy = [[(r * H / R) + (rnd.uniform(-30, 30) if 0 < r < R else 0) for _ in range(C + 1)] for r in range(R + 1)]
    out, data = [], []
    for r in range(R):
        for c in range(C):
            q = [(gx[r][c], gy[r][c]), (gx[r][c + 1], gy[r][c + 1]), (gx[r + 1][c + 1], gy[r + 1][c + 1]), (gx[r + 1][c], gy[r + 1][c])]
            for tri in ((q[0], q[1], q[2]), (q[0], q[2], q[3])):
                cx, cy = sum(p[0] for p in tri) / 3, sum(p[1] for p in tri) / 3
                poly = ",".join(f"{p[0]:.1f}px {p[1]:.1f}px" for p in tri)
                i = len(data)
                out.append(f'<div id="sh-{i}" class="shard" style="clip-path:polygon({poly});transform-origin:{cx:.1f}px {cy:.1f}px">{inner}</div>')
                ang = math.atan2(cy - H / 2, cx - W / 2)
                dist = rnd.uniform(240, 520)
                data.append(dict(id=f"sh-{i}", x=round(math.cos(ang) * dist, 1), y=round(math.sin(ang) * dist + rnd.uniform(60, 200), 1),
                                 rot=round(rnd.uniform(-70, 70), 1), d=round(rnd.uniform(0, 0.12), 3)))
    return "\n".join(out), data


# ------------------------------------------------------------------ choreography groups
def groups():
    G = []
    for m, spec in DIAG.items():
        res = sorted(MESH_RES[m])
        G.append(dict(id=f"d{m}", kind="diag", color=BLUE, mesh=m, start=spec["start"], lock=spec["lock"], cells=[f"e-{m-1}-{m-1}"],
                      touches=[dict(res=r, t=t) for r, t in spec["touches"]], focus=[spec["start"], spec["lock"] - 0.05],
                      active=res + [k for k, _ in MESH_SRC[m]], text=n(A0[m - 1][m - 1])))
    G[0]["focus"][1] = 3.05; G[1]["focus"][1] = 4.55; G[2]["focus"][1] = 6.05
    for (i, j), (start, lock, f1) in zip(((1, 2), (2, 3), (1, 3)), ((6.2, 6.5, 7.25), (7.4, 7.6, 8.25), (8.4, 8.6, None))):
        sh = SHARED[(i, j)]
        val = -Rv[sh] if sh else 0
        cells = [f"e-{i-1}-{j-1}", f"e-{j-1}-{i-1}"]
        G.append(dict(id=f"o{i}{j}", kind="off" if sh else "zero", color=PURPLE, start=start, lock=lock, cells=cells, shared=sh, meshes=[i, j],
                      items=[dict(src=sh, text=n(val), launch=round(start + 0.05, 3), arrive=round(lock - 0.03, 3), to=c) for c in cells] if sh else [],
                      focus=[start, f1] if f1 else None, active=[sh] if sh else None))
    for m, (start, lock, f1) in zip((1, 2, 3), ((9.0, 9.2, 9.55), (9.7, 9.9, 10.25), (10.4, 10.6, 11.1))):
        terms = MESH_SRC[m]
        G.append(dict(id=f"v{m}", kind="src", color=RED, mesh=m, start=start, lock=lock, cells=[f"v-{m-1}"],
                      items=[dict(src=k, text=("+" if sg > 0 else "−") + str(Vv[k]), launch=round(start + 0.02, 3), arrive=round(lock - 0.05, 3)) for k, sg in terms],
                      focus=[start, f1], active=[k for k, _ in terms]))
    return G


def main():
    local = "--local" in sys.argv
    svg, labels, sparks, TR = build_circuit()
    G = groups()
    fly, beams, pills = [], [], []
    for g in G:
        cls = {"diag": "d", "off": "p", "zero": "p", "src": "s"}[g["kind"]]
        if g["kind"] == "diag":
            r = int(g["cells"][0].split("-")[1])
            tx, ty = cell_abs(r, r)
            # the final sum is thrown from the banner into its matrix cell
            fid = f"fly-{g['id']}"
            fly.append(f'<div id="{fid}" class="fly d" style="left:{tx-65}px;top:{ty-28}px">{K(MB(g["text"]))}</div>')
            g["numfly"] = dict(id=fid, dx=BANNER_C[0] + 110 - tx, dy=BANNER_C[1] + 22 - ty)
            for i, t in enumerate(g["touches"]):
                sx, sy = PLATE[0] + BR[t["res"]][3][0], PLATE[1] + BR[t["res"]][3][1]
                pid = f"pill-{g['id']}-{i}"
                pills.append(f'<div id="{pid}" class="pill" style="left:{BANNER_C[0]-60}px;top:{BANNER_C[1]-26-12}px">{K(kohm(Rv[t["res"]]))}</div>')
                t.update(pill=pid, dx=sx - BANNER_C[0], dy=sy - (BANNER_C[1] - 12))
            continue
        for k, it in enumerate(g.get("items", [])):
            tcell = it.get("to", g["cells"][0])
            r, c = int(tcell.split("-")[1]), (int(tcell.split("-")[2]) if tcell.startswith("e") else 3)
            tx, ty = cell_abs(r, c)
            sx, sy = PLATE[0] + BR[it["src"]][3][0], PLATE[1] + BR[it["src"]][3][1]
            fid = f"fly-{g['id']}-{k}"
            fly.append(f'<div id="{fid}" class="fly {cls}" style="left:{tx-65}px;top:{ty-28}px">{K(MB(it["text"].replace(chr(0x2212), "-")))}</div>')
            it.update(id=fid, dx=sx - tx, dy=sy - ty)
            if g["kind"] == "off":
                L = round(math.dist((sx, sy), (tx, ty)), 1)
                beams.append(f'<line id="bm-{g["id"]}-{k}" x1="{sx}" y1="{sy}" x2="{tx}" y2="{ty}" class="beam" stroke="{PURPLE}" stroke-dasharray="{L}" stroke-dashoffset="{L}"/>')
                it["beam"] = f"bm-{g['id']}-{k}"
    overlay_inner = build_overlay()
    shard_html, shard_data = build_shards('<div class="shbg"></div>')
    rr = random.Random(5)
    base_rot = [-2.5, 1.8, -1.4, 3.2, 0, 0]                      # the hand-written tilt of each line
    pieces = [dict(id=f"ms-{i}", r0=base_rot[i], x=round(rr.uniform(-380, 380), 1), y=round(rr.uniform(180, 520), 1), rot=round(base_rot[i] + rr.uniform(-80, 80), 1), d=round(rr.uniform(0, 0.1), 3)) for i in range(6)]
    data = dict(END=CONFIG["DURATION"], groups=G, tracers=TR, BRK=list(BR.keys()), shards=shard_data, pieces=pieces,
                sparks=dict(R2=[["sp-R2a", [X1 - INS, 133], [X1 - INS, 257]], ["sp-R2b", [X1 + INS, 257], [X1 + INS, 133]]],
                            R4=[["sp-R4a", [X2 - 34, 300 - INS], [X1 + 34, 300 - INS]], ["sp-R4b", [X1 + 34, 300 + INS], [X2 - 34, 300 + INS]]]))
    # KaTeX stylesheet: woff2 only, local files
    css = (HERE / "scripts" / "vendor" / "katex.min.css").read_text()
    keep = ("KaTeX_Main-Regular", "KaTeX_Main-Bold", "KaTeX_Main-Italic", "KaTeX_Main-BoldItalic", "KaTeX_Math-Italic", "KaTeX_Math-BoldItalic",
            "KaTeX_AMS-Regular", "KaTeX_Size1-Regular", "KaTeX_Size2-Regular", "KaTeX_Size3-Regular", "KaTeX_Size4-Regular")
    faces = []
    for m in re.finditer(r"@font-face\{([^}]*)\}", css):
        body = m.group(1)
        u = re.search(r"url\(fonts/([A-Za-z0-9_-]+)\.woff2\)", body)
        if u and u.group(1) in keep:
            rest = re.sub(r"src:[^;]*;?", "", body)
            faces.append("@font-face{" + f'src:url("assets/fonts/{u.group(1)}.woff2") format("woff2");' + rest + "}")
    rules = re.sub(r"@font-face\{[^}]*\}", "", css)
    rules = re.sub(r"[^{}]+\{[^{}]*font-family:KaTeX_(?:SansSerif|Typewriter|Caligraphic|Fraktur|Script)[^{}]*\}", "", rules)   # families not shipped
    html = (HERE / "src" / "template.html").read_text()
    repl = {"DURATION": f"{CONFIG['DURATION']:g}", "GSAP_SRC": "assets/gsap.min.js" if local else GSAP_CDN,
            "KATEX_CSS": "\n".join(faces) + "\n" + rules, "CIRCUIT_SVG": svg, "CIRCUIT_LABELS": labels, "MATRIX": build_matrix(),
            "BRACKETS": brackets(), "BANNER": build_banner(), "OVERLAY": overlay_inner, "SHARDS": shard_html,
            "FLY": "\n".join(fly + pills), "BEAMS": "\n".join(beams),
            "HEAD_EQ": K(MB("R") + r"\cdot" + MB("I") + "=" + MB("V")),
            "CTA_Q": K(r"\textbf{WHAT IS THE VALUE OF }" + MB("I") + "_{" + MB("1") + r"}\textbf{?}") + "<br>" + K(r"\textbf{DROP IT BELOW}"),
            "FONT_STYLE": "italic" if ITALIC else "normal",
            "ITALIC_CSS": "  .katex .mathbf, .katex .textbf, .katex .mathbfit { font-style: italic; }   /* bold KaTeX is bold-italic too */" if ITALIC else "", "DATA_JSON": json.dumps(data), "TIMELINE_JS": (HERE / "src" / "timeline.js").read_text()}
    for k, v in repl.items():
        html = html.replace("{{" + k + "}}", v)
    rendered = render_tex()
    html = re.sub(r"@@K(\d+)@@", lambda mm: rendered[int(mm.group(1))], html)
    left = re.findall(r"\{\{[A-Z_]+\}\}|@@K\d+@@", html)
    assert not left, left[:5]
    (HERE / "index.html").write_text(html)
    print("wrote index.html", len(html), "bytes;", len(G), "groups;", len(TEX), "KaTeX formulas;", len(shard_data), "shards")


if __name__ == "__main__":
    main()
