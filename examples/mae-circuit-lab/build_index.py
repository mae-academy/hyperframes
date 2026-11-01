#!/usr/bin/env python3
"""Generates index.html from src/template.html + src/timeline.js  ("THE R-MATRIX TRICK", 1080x1920, 13 s).

    python3 build_index.py            # ships the cdnjs GSAP tag
    python3 build_index.py --local    # points the GSAP tag at assets/gsap.min.js (offline verification only)

Every number shown (matrix entries, sums, signs, the order in which the tracer meets each part) is derived here and
asserted against the exact matrix from scripts/solve.py, so the film cannot drift from the circuit.
"""
import json, math, re, sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "scripts"))
from solve import solve_mesh  # noqa: E402

CONFIG = dict(DURATION=13.0, R=[2, 2, 3, 4, 1], V=[5, 16, 13])   # kOhm, volts
GSAP_CDN = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
MINUS = "−"
SWEEP = 0.5                       # seconds a tracer needs for one lap of a mesh
BLUE, PURPLE, RED = "#0088FF", "#B026FF", "#FF0044"

Rv = dict(zip(["R1", "R2", "R3", "R4", "R5"], CONFIG["R"]))
Vv = dict(zip(["V1", "V2", "V3"], CONFIG["V"]))
S = solve_mesh(CONFIG["R"], CONFIG["V"])
A0, b0 = S["A0"], S["b0"]
assert [[int(x) for x in r] for r in A0] == [[4, -2, 0], [-2, 9, -4], [0, -4, 5]] and [int(x) for x in b0] == [-8, -16, 13]


def num(x):
    x = F(x)
    s = str(int(x)) if x.denominator == 1 else f"{float(x):.3f}".rstrip("0").rstrip(".")
    return s.replace("-", MINUS)


def mi(sym, sub=None):
    return f'<span class="mi">{sym}</span>' + (f'<span class="ms">{sub}</span>' if sub is not None else "")


# ------------------------------------------------------------------ geometry
PLATE = (91, 341)             # padding-box origin of #plate in canvas px
CARD = (160, 1100)            # origin of #cardin in canvas px
DX = 12
NODES = {"TL": (150 + DX, 90), "N1": (400 + DX, 90), "TR": (720 + DX, 90), "N3": (400 + DX, 300), "N2": (720 + DX, 300)}
GY = 470
X0, X1, X2 = 150 + DX, 400 + DX, 720 + DX
BR = {  # id: (kind, from, to, centre)
    "V1": ("V", (X0, 90), (X0, GY), (X0, 280)), "R1": ("R", (X0, 90), (X1, 90), ((X0 + X1) // 2, 90)),
    "R3": ("R", (X1, 90), (X2, 90), ((X1 + X2) // 2, 90)), "V2": ("V", (X2, 90), (X2, 300), (X2, 195)),
    "R2": ("R", (X1, 90), (X1, 300), (X1, 195)), "R4": ("R", (X1, 300), (X2, 300), ((X1 + X2) // 2, 300)),
    "R5": ("R", (X2, 300), (X2, GY), (X2, 385)), "V3": ("V", (X1, 300), (X1, GY), (X1, 385)),
}
LAB = {"R1": (287, 52, "c"), "R3": (572, 52, "c"), "R2": (382, 195, "r"), "R4": (572, 342, "c"),
       "R5": (774, 385, "l"), "V1": (118, 280, "r"), "V2": (774, 195, "l"), "V3": (366, 385, "r")}
MESH_C = [(287, 280), (572, 195), (572, 385)]
INS = 14
PERIM = {  # clockwise inner paths (inset 14 px from the branch wires)
    1: [(X0 + INS, 90 + INS), (X1 - INS, 90 + INS), (X1 - INS, GY - INS), (X0 + INS, GY - INS)],
    2: [(X1 + INS, 90 + INS), (X2 - INS, 90 + INS), (X2 - INS, 300 - INS), (X1 + INS, 300 - INS)],
    3: [(X1 + INS, 300 + INS), (X2 - INS, 300 + INS), (X2 - INS, GY - INS), (X1 + INS, GY - INS)],
}
MESH_RES = {1: ["R1", "R2"], 2: ["R2", "R3", "R4"], 3: ["R4", "R5"]}
MESH_SRC = {1: [("V1", +1), ("V3", -1)], 2: [("V2", -1)], 3: [("V3", +1)]}   # +: I climbs - to +, -: I drops + to -
SHARED = {(1, 2): "R2", (2, 3): "R4", (1, 3): None}


def seglens(pts):
    return [math.dist(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts))]


def arc_pos(pts, p):
    """Arc length at which the closed clockwise path passes closest to point p."""
    best, cum = (1e9, 0.0), 0.0
    for i, L in enumerate(seglens(pts)):
        a, b = pts[i], pts[(i + 1) % len(pts)]
        t = max(0.0, min(1.0, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (L * L)))
        q = (a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]))
        d = math.dist(p, q)
        if d < best[0]:
            best = (d, cum + t * L)
        cum += L
    return best[1]


def build_circuit():
    svg, labels = [], []
    svg.append('<defs><filter id="glow" x="-300%" y="-300%" width="700%" height="700%"><feGaussianBlur stdDeviation="5" result="b"/>'
               '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
    wires = list(BR.items())
    for k, (_, p, q, _) in wires:
        svg.append(f'<line id="w-{k}" x1="{p[0]}" y1="{p[1]}" x2="{q[0]}" y2="{q[1]}" class="wire"/>')
    svg.append(f'<line id="w-GND" x1="{X0}" y1="{GY}" x2="{X2}" y2="{GY}" class="wire"/>')
    gx = 572
    svg.append(f'<g id="gnd"><line x1="{gx}" y1="{GY}" x2="{gx}" y2="{GY+20}" class="gl"/><line x1="{gx-30}" y1="{GY+20}" x2="{gx+30}" y2="{GY+20}" class="gl"/>'
               f'<line x1="{gx-19}" y1="{GY+32}" x2="{gx+19}" y2="{GY+32}" class="gl"/><line x1="{gx-8}" y1="{GY+44}" x2="{gx+8}" y2="{GY+44}" class="gl"/></g>')
    for k, (kind, p, q, (cx, cy)) in wires:
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
    for n, (x, y) in NODES.items():
        svg.append(f'<circle cx="{x}" cy="{y}" r="9" class="node"/>')
    for x in (X0, X1, X2):
        svg.append(f'<circle cx="{x}" cy="{GY}" r="7" class="node"/>')
    # tracer layer: boundary flashes, trails, comet heads, opposite-direction sparks
    for m, pts in PERIM.items():
        closed = " ".join(f"{x},{y}" for x, y in pts + [pts[0]])
        L = round(sum(seglens(pts)), 2)
        svg.append(f'<polygon id="perim-{m}" points="{" ".join(f"{x},{y}" for x, y in pts)}" class="perim"/>')
        svg.append(f'<polyline id="trail-{m}" points="{closed}" class="trail" stroke-dasharray="{L}" stroke-dashoffset="{L}"/>')
    for m, pts in PERIM.items():
        x, y = pts[0]
        svg.append(f'<g id="head-{m}" class="head"><circle cx="{x}" cy="{y}" r="15" fill="#0088FF" opacity=".35" filter="url(#glow)"/>'
                   f'<circle cx="{x}" cy="{y}" r="8.5" fill="#0088FF" filter="url(#glow)"/><circle cx="{x}" cy="{y}" r="3.8" fill="#fff"/></g>')
    SPARKS = {"sp-R2a": (X1 - INS, 133), "sp-R2b": (X1 + INS, 257), "sp-R4a": (X2 - 34, 300 - INS), "sp-R4b": (X1 + 34, 300 + INS)}
    for sid, (x, y) in SPARKS.items():
        svg.append(f'<circle id="{sid}" cx="{x}" cy="{y}" r="7" fill="#fff" class="spark" filter="url(#glow)"/>')

    def box(x, y, w, h, al, html, cid, cls):
        left = x if al == "l" else (x - w if al == "r" else x - w / 2)
        ta = {"l": "left", "r": "right", "c": "center"}[al]
        return f'<div id="{cid}" class="lb {cls}" style="left:{left:.0f}px;top:{y-h/2:.0f}px;width:{w}px;height:{h}px;line-height:{h}px;text-align:{ta}">{html}</div>'

    for k, (x, y, al) in LAB.items():
        html = (f'{mi("R", k[1])} <span class="eq">=</span> <b class="n">{Rv[k]}</b> <span class="u">kΩ</span>' if k in Rv
                else f'{mi("V", k[1])} <span class="eq">=</span> <b class="n">{Vv[k]}</b> <span class="u">V</span>')
        labels.append(box(x, y, 190, 36, al, html, f"lb-{k}", "elabel"))
    for i, (cx, cy) in enumerate(MESH_C):
        labels.append(box(cx, cy, 60, 44, "c", mi("I", i + 1), f"ml-{i+1}", "mlabel"))
    labels.append(box(612, GY + 44, 80, 26, "l", "GND", "gtag", "gtag"))
    return "\n".join(svg), "\n".join(labels), SPARKS


# ------------------------------------------------------------------ matrix card (card-local coordinates)
COLX, ROWY, VX, IX = [110, 230, 350], [175, 285, 395], 666, 484


def cell_abs(r, c):          # c = 0..2 matrix column, 3 = v
    return (CARD[0] + (VX if c == 3 else COLX[c]), CARD[1] + ROWY[r])


def build_matrix(sums):
    out = []
    for r in range(3):
        for c in range(3):
            cls = "d" if r == c else "p"
            out.append(f'<div id="e-{r}-{c}" class="cell {cls}" style="left:{COLX[c]-60}px;top:{ROWY[r]-55}px">'
                       f'<b class="ghost">R<span class="ms">{r+1}{c+1}</span></b><b class="val">{num(A0[r][c])}</b><b class="sum">{sums.get(f"e-{r}-{c}", "")}</b><i class="ring"></i></div>')
        out.append(f'<div id="v-{r}" class="cell s" style="left:{VX-60}px;top:{ROWY[r]-55}px">'
                   f'<b class="ghost">v<span class="ms">{r+1}</span></b><b class="val">{num(b0[r])}</b><b class="sum">{sums.get(f"v-{r}", "")}</b><i class="ring"></i></div>')
        out.append(f'<div class="ivec mi" style="left:{IX-40}px;top:{ROWY[r]-55}px">I<span class="ms">{r+1}</span></div>')
    return "\n".join(out)


def brackets():
    def br(x, left, y0=120, y1=450, a=16):
        d = f"M{x+a} {y0} H{x} V{y1} H{x+a}" if left else f"M{x-a} {y0} H{x} V{y1} H{x-a}"
        return f'<path d="{d}" class="brk"/>'
    return "".join([br(44, True), br(416, False), br(446, True, a=12), br(522, False, a=12), br(594, True), br(738, False)])


# ------------------------------------------------------------------ the choreography data
def groups():
    G = []
    # --- diagonals: tracer sweep, resistors hurl their values, sum face, lock
    for m, (start, lock) in zip((1, 2, 3), ((2.0, 2.8), (3.2, 4.0), (4.4, 5.2))):
        res = MESH_RES[m]
        assert A0[m - 1][m - 1] == sum(Rv[k] for k in res)
        pts = PERIM[m]
        total = sum(seglens(pts))
        items = []
        for k in BR_ORDER_ON(pts, res):
            d = arc_pos(pts, BR[k][3])
            launch = start + SWEEP * d / total
            arrive = min(max(launch + 0.25, start + SWEEP + 0.12), lock - 0.03)
            items.append(dict(src=k, text=num(Rv[k]), launch=round(launch, 3), arrive=round(arrive, 3), pulse=round(launch, 3)))
        cell = f"e-{m-1}-{m-1}"
        G.append(dict(id=f"d{m}", kind="diag", color=BLUE, mesh=m, start=start, lock=lock, cells=[cell], items=items,
                      sum="+".join(str(Rv[k]) for k in sorted(res)), focus=[start, lock + 0.2],
                      active=sorted(res) + [k for k, _ in MESH_SRC[m]]))
    # --- off-diagonals
    for (i, j), (start, lock) in zip(((1, 2), (2, 3), (1, 3)), ((5.5, 5.8), (6.8, 7.0), (8.0, 8.2))):
        sh = SHARED[(i, j)]
        val = -Rv[sh] if sh else 0
        assert A0[i - 1][j - 1] == A0[j - 1][i - 1] == val
        cells = [f"e-{i-1}-{j-1}", f"e-{j-1}-{i-1}"]
        items = [dict(src=sh, text=num(val), launch=round(start + 0.05, 3), arrive=round(lock - 0.03, 3), to=c) for c in cells] if sh else []
        G.append(dict(id=f"o{i}{j}", kind="off" if sh else "zero", color=PURPLE, start=start, lock=lock, cells=cells, items=items, sum="",
                      focus=[start, lock + 0.9 if sh else lock + 0.65], active=[sh] if sh else None, shared=sh, meshes=[i, j]))
    # --- source vector
    for m, (start, lock) in zip((1, 2, 3), ((9.0, 9.2), (10.0, 10.2), (10.9, 11.1))):
        terms = MESH_SRC[m]
        assert b0[m - 1] == sum(sg * Vv[k] for k, sg in terms)
        items = [dict(src=k, text=("+" if sg > 0 else MINUS) + str(Vv[k]), launch=round(start + 0.02, 3), arrive=round(lock - 0.06, 3)) for k, sg in terms]
        sumtxt = "".join((f"{'+' if sg > 0 else MINUS}" if n else ("" if sg > 0 else MINUS)) + str(Vv[k]) for n, (k, sg) in enumerate(terms)) if len(terms) > 1 else ""
        G.append(dict(id=f"v{m}", kind="src", color=RED, mesh=m, start=start, lock=lock, cells=[f"v-{m-1}"], items=items, sum=sumtxt,
                      focus=[start, {1: 9.85, 2: 10.75, 3: 11.65}[m]], active=[k for k, _ in terms]))
    return G


def BR_ORDER_ON(pts, res):
    return sorted(res, key=lambda k: arc_pos(pts, BR[k][3]))


def main():
    local = "--local" in sys.argv
    csvg, clab, sparks = build_circuit()
    G = groups()
    fly, beams, flydata = [], [], []
    for g in G:
        cls = {"diag": "d", "off": "p", "zero": "p", "src": "s"}[g["kind"]]
        for n, it in enumerate(g["items"]):
            tcell = it.get("to", g["cells"][0])
            r, c = (int(tcell.split("-")[1]), int(tcell.split("-")[2])) if tcell.startswith("e") else (int(tcell.split("-")[1]), 3)
            tx, ty = cell_abs(r, c)
            sx, sy = PLATE[0] + BR[it["src"]][3][0], PLATE[1] + BR[it["src"]][3][1]
            fid = f"fly-{g['id']}-{n}"
            fly.append(f'<div id="{fid}" class="fly {cls}" style="left:{tx-65}px;top:{ty-28}px">{it["text"]}</div>')
            it.update(id=fid, dx=sx - tx, dy=sy - ty)
            if g["kind"] == "off":
                beams.append(f'<line id="bm-{g["id"]}-{n}" x1="{sx}" y1="{sy}" x2="{tx}" y2="{ty}" class="beam" stroke="{PURPLE}" stroke-dasharray="{round(math.dist((sx, sy), (tx, ty)), 1)}" stroke-dashoffset="{round(math.dist((sx, sy), (tx, ty)), 1)}"/>')
                it["beam"] = f"bm-{g['id']}-{n}"
    tracers = {}
    for m, pts in PERIM.items():
        tracers[m] = dict(pts=pts, seg=[round(x, 2) for x in seglens(pts)])
    data = dict(END=CONFIG["DURATION"], SWEEP=SWEEP, groups=G, tracers=tracers,
                BRK=list(BR.keys()),
                sparks=dict(R2=[["sp-R2a", [X1 - INS, 133], [X1 - INS, 257]], ["sp-R2b", [X1 + INS, 257], [X1 + INS, 133]]],
                            R4=[["sp-R4a", [X2 - 34, 300 - INS], [X1 + 34, 300 - INS]], ["sp-R4b", [X1 + 34, 300 + INS], [X2 - 34, 300 + INS]]]))
    html = (HERE / "src" / "template.html").read_text()
    repl = {"DURATION": f"{CONFIG['DURATION']:g}", "GSAP_SRC": "assets/gsap.min.js" if local else GSAP_CDN,
            "CIRCUIT_SVG": csvg, "CIRCUIT_LABELS": clab, "MATRIX": build_matrix({g["cells"][0]: g["sum"] for g in G if g["sum"]}), "BRACKETS": brackets(),
            "FLY": "\n".join(fly), "BEAMS": "\n".join(beams), "DATA_JSON": json.dumps(data),
            "TIMELINE_JS": (HERE / "src" / "timeline.js").read_text()}
    for k, v in repl.items():
        html = html.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{[A-Z_]+\}\}", html)
    assert not left, left
    (HERE / "index.html").write_text(html)
    print("wrote index.html", len(html), "bytes;", len(G), "groups;", len(fly), "flying numerals")


if __name__ == "__main__":
    main()
