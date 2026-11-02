#!/usr/bin/env python3
"""Generates index.html from src/template.html + src/timeline.js  ("THE R-MATRIX TRICK: THE COMPLETE MASTERCLASS", 1080x1920, 21 s).

    python3 build_index.py            # ships the cdnjs GSAP tag
    python3 build_index.py --local    # points the GSAP tag at assets/gsap.min.js (offline verification only)

Typography: pure KaTeX math mode, rendered by the vendored KaTeX at build time. No \\mathrm, \\mathbf or forced roman: R_{11}, I_1, v_1, 2\\,k\\Omega.
Numbers: every entry, sum, sign, mesh index and comet timing is derived here and asserted against scripts/solve.py.
Sound: the CUES block of src/timeline.js is written from the same schedule: one click per component pop, one thump per completed row/vector.
"""
import json, math, random, re, subprocess, sys
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


def Rl(k): return f"R_{{{k}}}"            # R_1
def Rm(ij): return f"R_{{{ij}}}"          # R_{11}
def Vl(k): return f"V_{{{k}}}"
def Il(k): return f"I_{{{k}}}"
def vb(sub): return f"v_{{{sub}}}"
def kohm(v): return str(v) + r"\,k\Omega"
def volt(v): return str(v) + r"\,V"


# ------------------------------------------------------------------ geometry (plate-local 900x550)
PLATE = (91, 341)             # padding-box origin of #plate (left 90, top 340, 1 px border)
CARD = (150, 1060)            # origin of #cardin (card: left 150, top 1060, 780x300: never scaled)
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


# ---- the pop-and-drop kinematics (seconds)
POP = 0.15           # the number on the component sits enlarged (2.2x) with its neon pulse before it leaves
GLIDE = 0.45         # curved glide from the component to its equation slot / matrix cell
DROP = 0.30          # a finished sum drops from the banner into its matrix cell
# One clockwise lap per mesh at constant speed. The lap length is solved so that the last resistor it touches pops exactly
# POP + GLIDE + DROP before its sum must land (`lock`); each window starts the instant the previous number has landed.
DIAG = {
    1: dict(path=["BL", "TL", "TR", "BR"], banner=2.0, start=2.0, lock=3.9, until=4.2),
    2: dict(path=["BL", "TL", "TR", "BR"], banner=4.2, start=4.2, lock=6.3, until=6.6),
    3: dict(path=["BL", "TL", "TR", "BR"], banner=6.6, start=6.6, lock=8.5, until=8.8),
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
    last_touch = spec["lock"] - (POP + GLIDE + DROP)
    spec["end"] = spec["start"] + (last_touch - spec["start"]) * total / touches[-1][0]     # constant speed
    assert spec["end"] <= spec["until"] + 1e-9, (m, spec["end"], spec["until"])
    t_of = lambda d: spec["start"] + (spec["end"] - spec["start"]) * d / total
    run, cum = 0.0, []
    for L in seg:
        cum.append(run)
        run += L
    ds = sorted({round(x, 3) for x in cum + [total] + [d for d, _ in touches]})
    wps = [dict(d=d, t=round(t_of(d), 4), x=round(point_at(pts, d)[0], 2), y=round(point_at(pts, d)[1], 2)) for d in ds]
    return dict(pts=[list(p) for p in pts], total=round(total, 2), wps=wps), [dict(res=r, t=round(t_of(d), 3)) for d, r in touches]


# ------------------------------------------------------------------ circuit (SVG + KaTeX labels whose NUMBER is its own element)
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
    for i, (cx, cy) in enumerate(MESH_C):                       # static clockwise mesh-current arrows
        r, t0, t1 = 40, math.radians(-60), math.radians(235)
        sx, sy, ex, ey = cx + r * math.cos(t0), cy + r * math.sin(t0), cx + r * math.cos(t1), cy + r * math.sin(t1)
        tx, ty, nx, ny = -math.sin(t1), math.cos(t1), math.cos(t1), math.sin(t1)
        tip, h1, h2 = (ex + tx * 14, ey + ty * 14), (ex - nx * 8, ey - ny * 8), (ex + nx * 8, ey + ny * 8)
        svg.append(f'<path d="M{sx:.1f} {sy:.1f} A{r} {r} 0 1 1 {ex:.1f} {ey:.1f}" class="marc"/>'
                   f'<polygon points="{tip[0]:.1f},{tip[1]:.1f} {h1[0]:.1f},{h1[1]:.1f} {h2[0]:.1f},{h2[1]:.1f}" class="mhead"/>')
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
        if k in Rv:
            head, num, unit = Rl(k[1]) + "=", str(Rv[k]), r"\,k\Omega"
        else:
            head, num, unit = Vl(k[1]) + "=", str(Vv[k]), r"\,V"
        # the number is its own element (#num-R1 ...): it is the very text that pops and then glides to the matrix
        html = f'<span class="lp">{K(head)}</span><span id="num-{k}" class="lnum">{K(num)}</span><span class="lp">{K(unit)}</span>'
        labels.append(box(x, y, 210, 36, al, html, f"lb-{k}", "elabel"))
    for i, (cx, cy) in enumerate(MESH_C):
        labels.append(box(cx, cy, 70, 44, "c", K(Il(str(i + 1))), f"ml-{i+1}", "mlabel"))
    labels.append(box(536, GY + 28, 80, 26, "r", K(r"\text{GND}"), "gtag", "gtag"))
    return "\n".join(svg), "\n".join(labels), LAPS, TOUCH


# ------------------------------------------------------------------ matrix card (card-local coordinates, card 780x300, row pitch 68)
COLX, ROWY, VX, IX = [120, 240, 360], [92, 160, 228], 675, 490


def cell_abs(r, c):
    return (CARD[0] + (VX if c == 3 else COLX[c]), CARD[1] + ROWY[r])


def build_matrix():
    out = []
    for r in range(3):
        for c in range(3):
            cls = "d" if r == c else "p"
            out.append(f'<div id="e-{r}-{c}" class="cell {cls}" style="left:{COLX[c]-60}px;top:{ROWY[r]-34}px">'
                       f'<b class="ghost">{K(Rm(f"{r+1}{c+1}"))}</b><b class="val">{K(n(A0[r][c]))}</b></div>')
        out.append(f'<div class="ivec" style="left:{IX-40}px;top:{ROWY[r]-34}px">{K(Il(str(r+1)))}</div>')
    rows = "".join(f'<div id="v-{r}" class="cell s vrow" style="grid-row:{r+1}">'
                   f'<b class="ghost">{K(vb(str(r+1)))}</b><b class="val">{K(n(b0[r]))}</b></div>' for r in range(3))
    out.append(f'<div id="vvec" class="vcol" style="left:{VX-60}px;top:{ROWY[0]-34}px">{rows}</div>')
    return "\n".join(out)


def brackets():
    def br(x, left, y0=58, y1=262, a=16):
        d = f"M{x+a} {y0} H{x} V{y1} H{x+a}" if left else f"M{x-a} {y0} H{x} V{y1} H{x-a}"
        return f'<path d="{d}" class="brk"/>'
    return "".join([br(50, True), br(424, False), br(454, True, a=12), br(528, False, a=12), br(602, True), br(748, False)])


# ------------------------------------------------------------------ banner (zone 3, 820x120): the live arithmetic
def piece(pid, tex, cls="pc"):
    return f'<span id="{pid}" class="{cls}">{K(tex)}</span>'


BOLT = '<svg class="ic" viewBox="0 0 24 24"><path d="M13.5 2 5 13.2h6L9.8 22 19 10.2h-6.2L13.5 2z" fill="#fff"/></svg>'


def build_banner():
    h = ['<div id="bv-h2" class="bv"><div class="bt">SOLVE BY SIGHT IN 5 SECONDS' + BOLT + '</div></div>',
         '<div id="bv-fin" class="bv"><div class="bt">' + K(r"R\cdot I=V\quad\text{[SYSTEM FULLY SOLVED}") + BOLT + K(r"\text{]}") + '</div></div>']
    for m, spec in DIAG.items():
        res = sorted(MESH_RES[m])
        assert A0[m - 1][m - 1] == sum(Rv[k] for k in res)
        lead = Rm(f"{m}{m}")                       # mesh 3 -> R_{33}, never R_{22}
        assert lead == "R_{" + str(m) + str(m) + "}" and sorted(MESH_RES[3]) == ["R4", "R5"]
        l1 = piece(f"d{m}-p0", lead + "=")
        sym, numr = [], []
        for i, r in enumerate(res):
            pre = "" if i == 0 else "+" + chr(92) + ";"
            sym.append(piece(f"d{m}-s{i}", pre + Rl(r[1])))
            numr.append(piece(f"d{m}-n{i}", pre + str(Rv[r])))
        l2 = piece(f"d{m}-e", "=") + "".join(numr) + piece(f"d{m}-f", "=" + kohm(A0[m - 1][m - 1]))
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
    src = '<div id="bv-src" class="bv bvc"><div class="bl l1">' + K(r"v_i=\sum V_{\text{rises}}-\sum V_{\text{drops}}") + '</div>'
    sv = []
    for m in (1, 2, 3):
        terms = MESH_SRC[m]
        val = sum(sg * Vv[k] for k, sg in terms)
        assert b0[m - 1] == val
        sym = "".join(("+" if sg > 0 else "-") + Vl(k[1]) for k, sg in terms)
        numeric = "".join(("-" if sg < 0 else ("+" if i else "")) + str(Vv[k]) for i, (k, sg) in enumerate(terms))
        sign = "+" if (val > 0 and m == 3) else ""
        if m == 1:      # two terms: "+5" and "-13" glide into these slots, then "-8" drops into row 1
            pieces = (piece("v1-p0", vb("1") + "=+" + Vl("1") + "-" + Vl("3") + "=") + piece("v1-n0", "5") + piece("v1-n1", "{}-13")
                      + piece("v1-f", "=" + volt(val)))
            sv.append(f'<div id="src-{m}" class="bl l2 vr">{pieces}</div>')
            continue
        tex = vb(str(m)) + "=" + sym + ("=" + numeric if len(terms) > 1 else "") + "=" + sign + volt(val)
        sv.append(f'<div id="src-{m}" class="bl l2 vr">{K(tex)}</div>')
    h.append(src + "".join(sv) + "</div>")
    return "\n".join(h)


# ------------------------------------------------------------------ hook (zone 3): crossed-out handwriting that shatters into particles at 0.8 s
def build_hook():
    s1 = K("(" + Rl("1") + "+" + Rl("2") + ")" + Il("1") + "-" + Rl("2") + Il("2") + "=" + Vl("1") + "-" + Vl("3"))
    s2 = K("-" + Rl("4") + Il("2") + "+(" + Rl("4") + "+" + Rl("5") + ")" + Il("3") + "=" + Vl("3"))
    html = ('<div id="hk"><div id="hk-bg"></div>'
            f'<div id="hk-a" class="hk-s" style="left:24px;top:8px">{s1}<i class="strike"></i></div>'
            f'<div id="hk-b" class="hk-s" style="left:462px;top:14px">{s2}<i class="strike"></i></div>'
            '<div id="hk-q" class="hk-q">15 MINUTES OF KVL?</div>'
            '<svg id="hk-x" viewBox="0 0 60 60" width="52" height="52"><rect x="2" y="2" width="56" height="56" rx="12" fill="#FF0044"/>'
            '<path d="M18 18 L42 42 M42 18 L18 42" stroke="#fff" stroke-width="7" stroke-linecap="round"/></svg></div>')
    rnd = random.Random(23)
    pts, pdata = [], []
    for i in range(44):
        x, y = rnd.uniform(150, 920), rnd.uniform(930, 1030)
        w, hh = rnd.uniform(8, 20), rnd.uniform(8, 20)
        col = rnd.choice(["#FF0044", "#FFFFFF", "#B026FF", "#FF0044"])
        poly = f"{rnd.uniform(0,40):.0f}% 0,100% {rnd.uniform(0,60):.0f}%,{rnd.uniform(30,90):.0f}% 100%,0 {rnd.uniform(40,100):.0f}%"
        pts.append(f'<i id="pt-{i}" class="pt" style="left:{x:.0f}px;top:{y:.0f}px;width:{w:.0f}px;height:{hh:.0f}px;background:{col};clip-path:polygon({poly})"></i>')
        ang = rnd.uniform(-math.pi, 0) if rnd.random() < 0.7 else rnd.uniform(0, math.pi)
        dist = rnd.uniform(120, 360)
        dx = max(104 - x, min(976 - (x + w), math.cos(ang) * dist))       # debris never leaves the 90-990 safe margins
        pdata.append(dict(id=f"pt-{i}", x=round(dx, 1), y=round(math.sin(ang) * dist + rnd.uniform(40, 180), 1),
                          rot=round(rnd.uniform(-240, 240), 1), d=round(rnd.uniform(0, 0.15), 3)))
    pieces = [dict(id="hk-a", r0=-2.2, x=-34, y=-120, rot=-14, d=0.0), dict(id="hk-b", r0=1.8, x=24, y=-130, rot=12, d=0.03),
              dict(id="hk-q", r0=0, x=-30, y=170, rot=-6, d=0.05), dict(id="hk-x", r0=0, x=44, y=190, rot=40, d=0.08)]    # all stay inside x 90-990
    return html, "\n".join(pts), dict(pieces=pieces, particles=pdata)


# ------------------------------------------------------------------ choreography: every flight is a number extracted from a component
COMP = {k: (PLATE[0] + BR[k][3][0], PLATE[1] + BR[k][3][1]) for k in BR}


def cell_pt(cid):
    kind, r, *c = cid.split("-")
    return cell_abs(int(r), 3 if kind == "v" else int(c[0]))


def slot(sel):
    return {"slot": sel}


def at(x, y):
    return {"x": x, "y": y}


SLOT_SCALE = 0.76        # banner numbers are 32 px, matrix numbers 42 px: the clone lands at the size of its destination


def pop_flight(gid, k, text, cls, comp, t_pop, tgt, cell=None, s1=1.0, merge=None):
    return dict(id=f"gh-{gid}-{k}", text=text, cls=cls, kind="pop", num=f"#num-{comp}", comp=comp, t0=round(t_pop, 3), t1=round(t_pop + POP, 3),
                t2=round(t_pop + POP + GLIDE, 3), tgt=tgt, cell=cell, s1=s1, merge=merge)


def drop_flight(gid, text, cls, src_slot, cell, lock):
    return dict(id=f"gh-{gid}-r", text=text, cls=cls, kind="drop", num=None, comp=None, t0=round(lock - DROP, 3), t1=round(lock - DROP, 3), t2=lock,
                src=slot(src_slot), tgt=at(*cell_pt(cell)), cell=cell, s1=1.0)


def groups(TOUCH):
    G = []
    for m, spec in DIAG.items():
        cell = f"e-{m-1}-{m-1}"
        res = sorted(MESH_RES[m])
        fl = [pop_flight(f"d{m}", k, str(Rv[t["res"]]), "d", t["res"], t["t"], slot(f"#d{m}-n{res.index(t['res'])}"), None, SLOT_SCALE, merge=res.index(t["res"]))
              for k, t in enumerate(TOUCH[m])]
        fl.append(drop_flight(f"d{m}", n(A0[m - 1][m - 1]), "d", f"#d{m}-f", cell, spec["lock"]))
        assert abs(fl[-2]["t2"] + DROP - spec["lock"]) < 1e-6, (m, fl[-2]["t2"], spec["lock"])     # the sum drops the instant the last number arrives
        G.append(dict(id=f"d{m}", kind="diag", color=BLUE, mesh=m, banner=spec["banner"], start=spec["start"], end=spec["end"], lock=spec["lock"], until=spec["until"],
                      cells=[cell], res=res, touches=TOUCH[m], flights=fl))
    for (i, j), (banner, lock, until) in zip(((1, 2), (2, 3), (1, 3)), ((8.8, 9.9, 10.3), (10.3, 11.4, 11.8), (11.8, 12.4, 12.8))):
        sh = SHARED[(i, j)]
        val = -Rv[sh] if sh else 0
        assert A0[i - 1][j - 1] == A0[j - 1][i - 1] == val
        cells = [f"e-{i-1}-{j-1}", f"e-{j-1}-{i-1}"]
        # the number on the shared resistor doubles in size, splits into two negative numbers and each flies to its mirror cell
        fl = [pop_flight(f"o{i}{j}", k, n(val), "p", sh, lock - POP - GLIDE, at(*cell_pt(c)), c) for k, c in enumerate(cells)] if sh else []
        G.append(dict(id=f"o{i}{j}", kind="off" if sh else "zero", color=PURPLE, banner=banner, start=banner, lock=lock, until=until, cells=cells, shared=sh, flights=fl))
    v1 = dict(id="v1", kind="src", color=RED, mesh=1, banner=12.8, start=12.8, lock=13.9, until=14.2, cells=["v-0"], src=["V1", "V3"], flights=[
        pop_flight("v1", 0, "+5", "s", "V1", 12.85, slot("#v1-n0"), None, SLOT_SCALE, merge="v1-n0"),
        pop_flight("v1", 1, "-13", "s", "V3", 13.0, slot("#v1-n1"), None, SLOT_SCALE, merge="v1-n1"),
        drop_flight("v1", "-8", "s", "#v1-f", "v-0", 13.9)])
    v2 = dict(id="v2", kind="src", color=RED, mesh=2, banner=14.2, start=14.2, lock=15.0, until=15.3, cells=["v-1"], src=["V2"], flights=[
        pop_flight("v2", 0, "-16", "s", "V2", 14.4, at(*cell_pt("v-1")), "v-1")])
    v3 = dict(id="v3", kind="src", color=RED, mesh=3, banner=15.3, start=15.3, lock=16.1, until=16.5, cells=["v-2"], src=["V3"], flights=[
        pop_flight("v3", 0, "+13", "s", "V3", 15.5, at(*cell_pt("v-2")), "v-2")])
    for g, val in ((v1, -8), (v2, -16), (v3, 13)):
        assert b0[g["mesh"] - 1] == val == sum(sg * Vv[k] for k, sg in MESH_SRC[g["mesh"]])
        last = g["flights"][-1]
        assert abs(last["t2"] - g["lock"]) < 1e-6, (g["id"], last["t2"], g["lock"])
    G += [v1, v2, v3]
    return G


def build_cues(G):
    """Sound only for physical things. One click each time a component pops (R1 pops: one click; a mesh with 2 resistors: exactly 2 clicks,
    with 3 resistors: exactly 3), one deep thump when a full matrix row or the whole vector has locked. Nothing for operators, text or transitions."""
    C = set()
    for g in G:
        for f in g["flights"]:
            if f["kind"] == "pop":
                C.add((f["t0"], "click"))
    lock = {}
    for g in G:
        for c in g["cells"]:
            lock[c] = g["lock"]
    for r in range(3):
        C.add((max(lock[f"e-{r}-{c}"] for c in range(3)), "thump"))      # row r is complete when its last cell has locked
    C.add((max(lock[f"v-{r}"] for r in range(3)), "thump"))              # the vector is complete
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
    clones = []
    for g in G:
        for f in g["flights"]:
            clones.append(f'<div id="{f["id"]}" class="xfer {f["cls"]}">{K(f["text"])}</div>')
        if g["kind"] == "diag":
            for t in g["touches"]:
                t["idx"] = g["res"].index(t["res"])
    cues = build_cues(G)
    write_cues(cues)
    hook_html, particles_html, hook_data = build_hook()
    data = dict(END=CONFIG["DURATION"], groups=G, tracers=LAPS, hook=hook_data)
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
            "BRACKETS": brackets(), "BANNER": build_banner(), "HOOK": hook_html, "PARTICLES": particles_html,
            "FLY": "\n".join(clones),
            "HEAD_EQ": K(r"R\cdot I=V"),
            "CTA_Q": K(r"\text{CAN YOU FIND }I_1\text{?}") + "<br>" + K(r"\text{DROP YOUR ANSWER BELOW}"),
            "DATA_JSON": json.dumps(data), "TIMELINE_JS": (HERE / "src" / "timeline.js").read_text()}
    for k, v in repl.items():
        html = html.replace("{{" + k + "}}", v)
    rendered = render_tex()
    html = re.sub(r"@@K(\d+)@@", lambda mm: rendered[int(mm.group(1))], html)
    left = re.findall(r"\{\{[A-Z_]+\}\}|@@K\d+@@", html)
    assert not left, left[:5]
    assert "mathbf" not in " ".join(TEX) and "mathrm" not in " ".join(TEX), "pure math italic: no \\mathbf / \\mathrm"
    (HERE / "index.html").write_text(html)
    print("wrote index.html", len(html), "bytes;", len(G), "groups;", len(TEX), "KaTeX formulas;", f"{len(cues)} cues")


if __name__ == "__main__":
    main()
