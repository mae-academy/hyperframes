#!/usr/bin/env python3
"""Generates index.html from src/template.html + src/timeline.js  ("THE R-MATRIX TRICK: THE COMPLETE MASTERCLASS", 1080x1920, 21 s).

    python3 build_index.py            # ships the cdnjs GSAP tag
    python3 build_index.py --local    # points the GSAP tag at assets/gsap.min.js (offline verification only)

Typography: every formula is rendered by the vendored KaTeX (scripts/vendor, scripts/katex_render.cjs) from the TeX in the brief:
variables are KaTeX math italic (R_1, V_1, I_1), indices and units are upright (R_{\\mathrm{11}}, 2\\,\\mathrm{k}\\Omega), results are bold.
Numbers: every entry, sum, sign, mesh index and comet timing is derived here and asserted against scripts/solve.py.
"""
import json, math, re, subprocess, sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "scripts"))
from solve import solve_mesh  # noqa: E402

CONFIG = dict(DURATION=21.0, R=[2, 2, 3, 4, 1], V=[5, 16, 13])   # kOhm, volts
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


def render_tex():
    r = subprocess.run(["node", str(HERE / "scripts" / "katex_render.cjs")], input=json.dumps(TEX), capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def n(x):
    return str(int(x))


def Rl(k): return f"R_{{{k}}}"                          # R_1  (italic variable, upright index)
def Rm(ij): return r"R_{\mathrm{" + ij + "}}"           # R_{\mathrm{11}}
def Vl(k): return f"V_{{{k}}}"
def Il(k): return f"I_{{{k}}}"
def vb(sub): return r"\mathbf{v}_{" + sub + "}"
def kohm(v): return str(v) + r"\,\mathrm{k}\Omega"
def volt(v): return str(v) + r"\,\mathrm{V}"
def bold(s): return r"\mathbf{" + s + "}"


# ------------------------------------------------------------------ geometry (plate-local 900x550)
PLATE = (91, 341)             # padding-box origin of #plate (left 90, top 340, 1 px border)
CARD = (150, 1060)            # origin of #cardin (card: left 150, top 1060, 780x300: never scaled)
BANNER_C = (540, 980)
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


# One clockwise lap per mesh at constant speed. The lap length is solved so that the last resistor it touches lifts its value off exactly
# FLIGHT seconds before the number must land in its matrix cell (`lock`); each window starts as soon as the previous number has landed.
FLIGHT = 0.25        # seconds a value needs to project from its component into its matrix cell
DIAG = {
    1: dict(path=["BR", "BL", "TL", "TR"], banner=2.0, start=2.0, lock=3.9, until=4.2),
    2: dict(path=["BL", "TL", "TR", "BR"], banner=4.2, start=4.2, lock=6.3, until=6.6),
    3: dict(path=["BR", "BL", "TL", "TR"], banner=6.6, start=6.6, lock=8.5, until=8.8),
}
MESH_RES = {1: ["R1", "R2"], 2: ["R2", "R3", "R4"], 3: ["R4", "R5"]}
MESH_SRC = {1: [("V1", +1), ("V3", -1)], 2: [("V2", -1)], 3: [("V3", +1)]}
SHARED = {(1, 2): "R2", (2, 3): "R4", (1, 3): None}


def lap(m, spec):
    c = corners(m)
    pts = [c[k] for k in spec["path"]]
    seg = seglens(pts)
    total = sum(seg)
    touches = sorted(((arc_pos(pts, BR[r][3]), r) for r in MESH_RES[m]))
    last_touch = spec["lock"] - FLIGHT
    spec["end"] = spec["start"] + (last_touch - spec["start"]) * total / touches[-1][0]     # constant speed: the last touch lands on `last_touch`
    assert spec["end"] <= spec["until"] + 1e-9, (m, spec["end"], spec["until"])              # the lap is over before the next window starts
    t_of = lambda d: spec["start"] + (spec["end"] - spec["start"]) * d / total
    run, cum = 0.0, []
    for L in seg:
        cum.append(run)
        run += L
    ds = sorted({round(x, 3) for x in cum + [total] + [d for d, _ in touches]})
    wps = [dict(d=d, t=round(t_of(d), 4), x=round(point_at(pts, d)[0], 2), y=round(point_at(pts, d)[1], 2)) for d in ds]
    return dict(pts=[list(p) for p in pts], total=round(total, 2), wps=wps), [dict(res=r, t=round(t_of(d), 3)) for d, r in touches]


# ------------------------------------------------------------------ circuit (SVG + KaTeX labels)
def build_circuit():
    svg, labels = [], []
    svg.append('<defs><filter id="glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="5" result="b"/>'
               '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
    for k, (_, p, q, _) in BR.items():
        svg.append(f'<line id="w-{k}" x1="{p[0]}" y1="{p[1]}" x2="{q[0]}" y2="{q[1]}" class="wire"/>')
    svg.append(f'<line id="w-GND" x1="{X0}" y1="{GY}" x2="{X2}" y2="{GY}" class="wire"/>')
    gx = 572
    svg.append(f'<g id="gnd"><line x1="{gx}" y1="{GY}" x2="{gx}" y2="{GY+16}" class="gl"/><line x1="{gx-28}" y1="{GY+16}" x2="{gx+28}" y2="{GY+16}" class="gl"/>'
               f'<line x1="{gx-18}" y1="{GY+27}" x2="{gx+18}" y2="{GY+27}" class="gl"/><line x1="{gx-8}" y1="{GY+38}" x2="{gx+8}" y2="{GY+38}" class="gl"/></g>')
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
    # static clockwise mesh-current arrows (always visible)
    for i, (cx, cy) in enumerate(MESH_C):
        r, t0, t1 = 40, math.radians(-60), math.radians(235)
        sx, sy, ex, ey = cx + r * math.cos(t0), cy + r * math.sin(t0), cx + r * math.cos(t1), cy + r * math.sin(t1)
        tx, ty, nx, ny = -math.sin(t1), math.cos(t1), math.cos(t1), math.sin(t1)
        tip, h1, h2 = (ex + tx * 14, ey + ty * 14), (ex - nx * 8, ey - ny * 8), (ex + nx * 8, ey + ny * 8)
        svg.append(f'<path d="M{sx:.1f} {sy:.1f} A{r} {r} 0 1 1 {ex:.1f} {ey:.1f}" class="marc"/>'
                   f'<polygon points="{tip[0]:.1f},{tip[1]:.1f} {h1[0]:.1f},{h1[1]:.1f} {h2[0]:.1f},{h2[1]:.1f}" class="mhead"/>')
    # contours (mesh boundaries) and the comet
    for m in (1, 2, 3):
        c = corners(m)
        poly = " ".join(f"{x},{y}" for x, y in (c["TL"], c["TR"], c["BR"], c["BL"]))
        svg.append(f'<polygon id="perim-{m}" points="{poly}" class="perim"/>')
    LAPS, TOUCH = {}, {}
    for m, spec in DIAG.items():
        LAPS[m], TOUCH[m] = lap(m, spec)
        pts = LAPS[m]["pts"]
        closed = " ".join(f"{x},{y}" for x, y in pts + [pts[0]])
        svg.append(f'<polyline id="trail-{m}" points="{closed}" class="trail" stroke-dasharray="{LAPS[m]["total"]}" stroke-dashoffset="{LAPS[m]["total"]}"/>')
    for m in (1, 2, 3):
        x, y = LAPS[m]["pts"][0]
        svg.append(f'<g id="head-{m}" class="head"><circle cx="{x}" cy="{y}" r="15" fill="#0088FF" opacity=".35" filter="url(#glow)"/>'
                   f'<circle cx="{x}" cy="{y}" r="8.5" fill="#0088FF" filter="url(#glow)"/><circle cx="{x}" cy="{y}" r="3.8" fill="#fff"/></g>')

    def box(x, y, w, h, al, html, cid, cls):
        left = x if al == "l" else (x - w if al == "r" else x - w / 2)
        ta = {"l": "left", "r": "right", "c": "center"}[al]
        return f'<div id="{cid}" class="lb {cls}" style="left:{left:.0f}px;top:{y-h/2:.0f}px;width:{w}px;height:{h}px;line-height:{h}px;text-align:{ta}">{html}</div>'

    for k, (x, y, al) in LAB.items():
        tex = Rl(k[1]) + "=" + kohm(Rv[k]) if k in Rv else Vl(k[1]) + "=" + volt(Vv[k])
        labels.append(box(x, y, 210, 36, al, K(tex), f"lb-{k}", "elabel"))
    for i, (cx, cy) in enumerate(MESH_C):
        labels.append(box(cx, cy, 70, 44, "c", K(Il(str(i + 1))), f"ml-{i+1}", "mlabel"))
    labels.append(box(536, GY + 28, 80, 26, "r", K(r"\mathrm{GND}"), "gtag", "gtag"))
    return "\n".join(svg), "\n".join(labels), LAPS, TOUCH


# ------------------------------------------------------------------ matrix card (card-local coordinates, card 780x460)
COLX, ROWY, VX, IX = [120, 240, 360], [92, 160, 228], 675, 490     # row pitch 68 px


def cell_abs(r, c):
    return (CARD[0] + (VX if c == 3 else COLX[c]), CARD[1] + ROWY[r])


def build_matrix():
    out = []
    for r in range(3):
        for c in range(3):
            cls = "d" if r == c else "p"
            out.append(f'<div id="e-{r}-{c}" class="cell {cls}" style="left:{COLX[c]-60}px;top:{ROWY[r]-34}px">'
                       f'<b class="ghost">{K(bold(Rm(f"{r+1}{c+1}")))}</b><b class="val">{K(bold(n(A0[r][c])))}</b></div>')
        out.append(f'<div class="ivec" style="left:{IX-40}px;top:{ROWY[r]-34}px">{K(Il(str(r+1)))}</div>')
    # source vector V: one explicit 3-row grid (row 1: v1, row 2: v2, row 3: v3); a value can only ever render inside its own row
    rows = "".join(f'<div id="v-{r}" class="cell s vrow" style="grid-row:{r+1}">'
                   f'<b class="ghost">{K(bold("v_{" + str(r+1) + "}"))}</b><b class="val">{K(bold(n(b0[r])))}</b></div>' for r in range(3))
    out.append(f'<div id="vvec" class="vcol" style="left:{VX-60}px;top:{ROWY[0]-34}px">{rows}</div>')
    return "\n".join(out)


def brackets():
    def br(x, left, y0=58, y1=262, a=16):
        d = f"M{x+a} {y0} H{x} V{y1} H{x+a}" if left else f"M{x-a} {y0} H{x} V{y1} H{x-a}"
        return f'<path d="{d}" class="brk"/>'
    return "".join([br(50, True), br(424, False), br(454, True, a=12), br(528, False, a=12), br(602, True), br(748, False)])


# ------------------------------------------------------------------ banner (zone 3, 820x110): the live arithmetic
def piece(pid, tex, cls="pc"):
    return f'<span id="{pid}" class="{cls}">{K(tex)}</span>'


BOLT = '<svg class="ic" viewBox="0 0 24 24"><path d="M13.5 2 5 13.2h6L9.8 22 19 10.2h-6.2L13.5 2z" fill="#fff"/></svg>'


def build_banner():
    h = ['<div id="bv-h1" class="bv"><div class="bt">' + K(r"\mathbf{15\ MINUTES\ OF\ KVL\ ALGEBRA?\ \times}") + '</div></div>',
         '<div id="bv-h2" class="bv"><div class="bt">' + K(r"\mathbf{BUILD\ THE\ R}\text{-}\mathbf{MATRIX\ BY\ SIGHT}") + BOLT + '</div></div>',
         '<div id="bv-fin" class="bv"><div class="bt">' + K(r"\mathbf{R}\cdot\mathbf{I}=\mathbf{V}\quad\textbf{[SYSTEM\ FULLY\ SOLVED}") + BOLT + K(r"\textbf{]}") + '</div></div>']
    for m, spec in DIAG.items():
        res = sorted(MESH_RES[m])
        assert A0[m - 1][m - 1] == sum(Rv[k] for k in res)
        lead = Rm(f"{m}{m}")                       # mesh 3 -> R_{\mathrm{33}}, never R_{22}
        assert lead == r"R_{\mathrm{" + str(m) + str(m) + "}}" and sorted(MESH_RES[3]) == ["R4", "R5"]
        l1 = piece(f"d{m}-p0", lead + "=")
        sym, numr = [], []
        for i, r in enumerate(res):
            pre = "" if i == 0 else "+" + chr(92) + ";"
            sym.append(piece(f"d{m}-s{i}", pre + Rl(r[1])))
            numr.append(piece(f"d{m}-n{i}", pre + str(Rv[r])))
        l2 = piece(f"d{m}-e", "=") + "".join(numr) + piece(f"d{m}-f", "=" + bold(kohm(A0[m - 1][m - 1])))
        h.append(f'<div id="bv-d{m}" class="bv bvc"><div class="bl l1">{l1}{"".join(sym)}</div><div class="bl l2">{l2}</div></div>')
    off = '<div id="bv-off" class="bv bvc"><div class="bl l1">' + K(Rm("ij") + r"=-(\text{Shared Resistor})") + '</div>'
    var = []
    for (i, j), vid in zip(((1, 2), (2, 3), (1, 3)), ("a", "b", "c")):
        sh = SHARED[(i, j)]
        val = -Rv[sh] if sh else 0
        assert A0[i - 1][j - 1] == A0[j - 1][i - 1] == val
        if sh:
            tex = r"\text{SHARED BETWEEN MESH " + f"{i} \\& {j}" + r"}\implies " + Rm(f"{i}{j}") + "=" + Rm(f"{j}{i}") + "=-" + kohm(Rv[sh])
        else:
            tex = r"\text{NO RESISTOR SHARED BETWEEN " + f"{i} \\& {j}" + r"}\implies " + Rm(f"{i}{j}") + "=" + Rm(f"{j}{i}") + "=0"
        var.append(f'<div id="off-{vid}" class="bl l2 vr">{K(tex)}</div>')
    h.append(off + "".join(var) + "</div>")
    src = '<div id="bv-src" class="bv bvc"><div class="bl l1">' + K(r"\mathbf{v}_i=\sum\mathrm{V}_{\mathrm{rises}}-\sum\mathrm{V}_{\mathrm{drops}}") + '</div>'
    sv = []
    for m in (1, 2, 3):
        terms = MESH_SRC[m]
        val = sum(sg * Vv[k] for k, sg in terms)
        assert b0[m - 1] == val
        sym = "".join(("+" if sg > 0 else "-") + Vl(k[1]) for k, sg in terms)
        numeric = "".join(("-" if sg < 0 else ("+" if i else "")) + str(Vv[k]) for i, (k, sg) in enumerate(terms))
        sign = "+" if (val > 0 and m == 3) else ""
        if m == 1:      # two terms: "+5" and "-13" fly in from V1 and V3 and meet here, then the result drops into row 1
            pieces = (piece("v1-p0", vb("1") + "=+" + Vl("1") + "-" + Vl("3") + "=") + piece("v1-n0", "5") + piece("v1-n1", "{}-13")
                      + piece("v1-f", "=" + bold(volt(val))))
            sv.append(f'<div id="src-{m}" class="bl l2 vr">{pieces}</div>')
            continue
        tex = vb(str(m)) + "=" + sym + ("=" + numeric if len(terms) > 1 else "") + "=" + bold(sign + volt(val))
        sv.append(f'<div id="src-{m}" class="bl l2 vr">{K(tex)}</div>')
    h.append(src + "".join(sv) + "</div>")
    return "\n".join(h)


# ------------------------------------------------------------------ hook overlay: four crossed-out KVL equations
def build_overlay():
    I, R_, V_ = Il, Rl, Vl
    lines = [
        (r"(" + R_("1") + "+" + R_("2") + ")" + I("1") + "-" + R_("2") + I("2") + "=" + V_("1") + "-" + V_("3"), 46, 50, 34),
        (r"-" + R_("2") + I("1") + "+(" + R_("2") + "+" + R_("3") + "+" + R_("4") + ")" + I("2") + "-" + R_("4") + I("3") + "=-" + V_("2"), 60, 124, 30),
        (r"-" + R_("4") + I("2") + "+(" + R_("4") + "+" + R_("5") + ")" + I("3") + "=" + V_("3"), 38, 198, 34),
        (r"4" + I("1") + "-2" + I("2") + "=-8,\\ \\ -2" + I("1") + "+9" + I("2") + "-4" + I("3") + "=-16,\\ \\ \\dots", 40, 272, 30),
    ]
    h = []
    for i, (tex, x, y, fs) in enumerate(lines):
        h.append(f'<div id="ms-{i}" class="mess" style="left:{x}px;top:{y}px;font-size:{fs}px">{K(tex)}<i class="strike"></i></div>')
    h.append('<svg class="ovx" style="left:407px;top:378px" width="86" height="86" viewBox="0 0 86 86"><rect x="3" y="3" width="80" height="80" rx="16" fill="#FF0044"/>'
             '<path d="M24 24 L62 62 M62 24 L24 62" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>')
    return "\n".join(h), [-2.5, 1.8, -1.4, 2.6]


# ------------------------------------------------------------------ choreography
COMP = {k: (PLATE[0] + BR[k][3][0], PLATE[1] + BR[k][3][1]) for k in BR}          # exact canvas coordinate of every component
ZERO_SRC = (PLATE[0] + X1, PLATE[1] + 345)       # on the V3 branch, the boundary between mesh 1 and mesh 3 (no resistor lives there)


def cell_pt(cid):
    kind, r, *c = cid.split("-")
    return cell_abs(int(r), 3 if kind == "v" else int(c[0]))


def slot(sel):
    return {"slot": sel}


def at(x, y):
    return {"x": x, "y": y}


def groups(TOUCH):
    def fl(gid, k, text, cls, t0, src, cell, merge=None):
        return dict(id=f"gh-{gid}-{k}", text=text, cls=cls, t0=round(t0, 3), t1=round(t0 + FLIGHT, 3), src=src, tgt=at(*cell_pt(cell)), cell=cell, merge=merge)

    G = []
    for m, spec in DIAG.items():
        cell = f"e-{m-1}-{m-1}"
        res = sorted(MESH_RES[m])
        flights = [fl(f"d{m}", k, str(Rv[t["res"]]), "d", t["t"], at(*COMP[t["res"]]), cell, merge=res.index(t["res"])) for k, t in enumerate(TOUCH[m])]
        assert abs(flights[-1]["t1"] - spec["lock"]) < 1e-6, (m, flights[-1]["t1"], spec["lock"])    # the last value lands exactly on the lock
        G.append(dict(id=f"d{m}", kind="diag", color=BLUE, mesh=m, banner=spec["banner"], start=spec["start"], end=spec["end"], lock=spec["lock"], until=spec["until"],
                      cells=[cell], res=res, touches=TOUCH[m], flights=flights))
    for (i, j), (banner, lock, until) in zip(((1, 2), (2, 3), (1, 3)), ((8.8, 9.9, 10.3), (10.3, 11.4, 11.8), (11.8, 12.4, 12.8))):
        sh = SHARED[(i, j)]
        val = -Rv[sh] if sh else 0
        assert A0[i - 1][j - 1] == A0[j - 1][i - 1] == val
        cells = [f"e-{i-1}-{j-1}", f"e-{j-1}-{i-1}"]
        src = at(*COMP[sh]) if sh else at(*ZERO_SRC)
        flights = [fl(f"o{i}{j}", k, n(val), "p", lock - FLIGHT, src, c) for k, c in enumerate(cells)]
        G.append(dict(id=f"o{i}{j}", kind="off" if sh else "zero", color=PURPLE, banner=banner, start=banner, lock=lock, until=until, cells=cells, shared=sh, flights=flights))
    # sources: every source value projects straight into its row of V (v1 takes two values, one after the other)
    v1 = dict(id="v1", kind="src", color=RED, mesh=1, banner=12.8, start=12.8, lock=13.9, until=14.2, cells=["v-0"], src=["V1", "V3"], flights=[
        fl("v1", 0, "+5", "s", 13.4, at(*COMP["V1"]), "v-0", merge="v1-n0"),
        fl("v1", 1, "-13", "s", 13.65, at(*COMP["V3"]), "v-0", merge="v1-n1")])
    v2 = dict(id="v2", kind="src", color=RED, mesh=2, banner=14.2, start=14.2, lock=15.0, until=15.3, cells=["v-1"], src=["V2"], flights=[
        fl("v2", 0, "-16", "s", 14.75, at(*COMP["V2"]), "v-1")])
    v3 = dict(id="v3", kind="src", color=RED, mesh=3, banner=15.3, start=15.3, lock=16.1, until=16.5, cells=["v-2"], src=["V3"], flights=[
        fl("v3", 0, "+13", "s", 15.85, at(*COMP["V3"]), "v-2")])
    for g, val in ((v1, -8), (v2, -16), (v3, 13)):
        assert b0[g["mesh"] - 1] == val == sum(sg * Vv[k] for k, sg in MESH_SRC[g["mesh"]])
        assert abs(g["flights"][-1]["t1"] - g["lock"]) < 1e-6, g["id"]
    G += [v1, v2, v3]
    return G


def build_cues(G):
    """The audio schedule, derived from the very same data the picture uses. Only three voices exist: a click when a value lifts off its
    component, a click when an intermediate value lands, and a snap + sub-bass thump when the final value locks into its matrix cell."""
    C = {(0.0, "thump"), (1.2, "snap"), (16.5, "thump"), (17.5, "snap"), (18.2, "click")}
    for g in G:
        for f in g["flights"]:
            C.add((f["t0"], "click"))
            if f["t1"] == g["lock"]:
                C.add((f["t1"], "snap"))
                C.add((f["t1"], "thump"))
            else:
                C.add((f["t1"], "click"))
    return sorted(C)


def write_cues(cues):
    p = HERE / "src" / "timeline.js"
    js = p.read_text()
    block = "// @CUES-BEGIN\nconst CUES = [\n" + "".join(f'  [{t!r}, "{v}"],\n' for t, v in cues) + "];\n// @CUES-END"
    js2 = re.sub(r"// @CUES-BEGIN.*?// @CUES-END", lambda m: block, js, flags=re.S)
    if js2 != js:
        p.write_text(js2)


def main():
    local = "--local" in sys.argv
    svg, labels, LAPS, TOUCH = build_circuit()
    G = groups(TOUCH)
    ghosts = []
    for g in G:
        for f in g["flights"]:
            f["cls"] = f["cls"]
            ghosts.append(f'<div id="{f["id"]}" class="xfer {f["cls"]}">{K(bold(f["text"]))}</div>')
        if g["kind"] == "diag":
            for t in g["touches"]:
                t["idx"] = g["res"].index(t["res"])       # which term of the equation this resistor ignites
    write_cues(build_cues(G))
    overlay_inner, base_rot = build_overlay()
    data = dict(END=CONFIG["DURATION"], groups=G, tracers=LAPS, base_rot=base_rot)
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
    rules = re.sub(r"[^{}]+\{[^{}]*font-family:KaTeX_(?:SansSerif|Typewriter|Caligraphic|Fraktur|Script)[^{}]*\}", "", rules)
    html = (HERE / "src" / "template.html").read_text()
    repl = {"DURATION": f"{CONFIG['DURATION']:g}", "GSAP_SRC": "assets/gsap.min.js" if local else GSAP_CDN,
            "KATEX_CSS": "\n".join(faces) + "\n" + rules, "CIRCUIT_SVG": svg, "CIRCUIT_LABELS": labels, "MATRIX": build_matrix(),
            "BRACKETS": brackets(), "BANNER": build_banner(), "OVERLAY": overlay_inner,
            "FLY": "\n".join(ghosts),
            "HEAD_EQ": K(bold("R") + r"\cdot" + bold("I") + "=" + bold("V")),
            "CTA_Q": K(r"\textbf{CAN YOU CALCULATE }" + Il("1") + r"\textbf{?}") + "<br>" + K(r"\textbf{COMMENT BELOW}"),
            "DATA_JSON": json.dumps(data), "TIMELINE_JS": (HERE / "src" / "timeline.js").read_text()}
    for k, v in repl.items():
        html = html.replace("{{" + k + "}}", v)
    rendered = render_tex()
    html = re.sub(r"@@K(\d+)@@", lambda mm: rendered[int(mm.group(1))], html)
    left = re.findall(r"\{\{[A-Z_]+\}\}|@@K\d+@@", html)
    assert not left, left[:5]
    (HERE / "index.html").write_text(html)
    print("wrote index.html", len(html), "bytes;", len(G), "groups;", len(TEX), "KaTeX formulas")


if __name__ == "__main__":
    main()
