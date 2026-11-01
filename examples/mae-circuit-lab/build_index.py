#!/usr/bin/env python3
"""Generates index.html from src/template.html + src/timeline.js.

    python3 build_index.py            # ships the cdnjs GSAP tag
    python3 build_index.py --local    # points the GSAP tag at assets/gsap.min.js (offline verification only)

The film shows WHERE each entry of R and v comes from (self / shared resistance, source rises and drops).
Every derivation below is asserted against the exact matrix from scripts/solve.py, so text and numbers cannot drift.
Change CONFIG for new values; the beats, strip text and matrix are rebuilt.
"""
import json, math, re, sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "scripts"))
from solve import solve_mesh  # noqa: E402

CONFIG = dict(DURATION=30.0, R=[2, 2, 3, 4, 1], V=[5, 16, 13])   # kOhm, volts
GSAP_CDN = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
MINUS = "−"
DOT = "⋅"       # KaTeX_Main has U+22C5 (not U+00B7)


def num(x):
    x = F(x)
    s = str(int(x)) if x.denominator == 1 else f"{float(x):.3f}".rstrip("0").rstrip(".")
    return s.replace("-", MINUS)


def mi(sym, sub=None):
    return f'<span class="mi">{sym}</span>' + (f'<span class="ms">{sub}</span>' if sub is not None else "")


R_ = lambda k: mi("R", k)
V_ = lambda k: mi("V", k)
I_ = lambda k: mi("I", k)
Rv = dict(zip(["R1", "R2", "R3", "R4", "R5"], CONFIG["R"]))
Vv = dict(zip(["V1", "V2", "V3"], CONFIG["V"]))
S = solve_mesh(CONFIG["R"], CONFIG["V"])
A0, b0 = S["A0"], S["b0"]

# ------------------------------------------------------------------ circuit geometry (stage-local 900x750)
NODES = {"TL": (150, 130), "N1": (410, 130), "TR": (720, 130), "N3": (410, 400), "N2": (720, 400)}
GY = 640
BR = [("V1", "V", (150, 130), (150, GY), (150, 385)), ("R1", "R", (150, 130), (410, 130), (290, 130)),
      ("R3", "R", (410, 130), (720, 130), (565, 130)), ("V2", "V", (720, 130), (720, 400), (720, 265)),
      ("R2", "R", (410, 130), (410, 400), (410, 265)), ("R4", "R", (410, 400), (720, 400), (565, 400)),
      ("R5", "R", (720, 400), (720, GY), (720, 520)), ("V3", "V", (410, 400), (410, GY), (410, 520))]
LAB = {"R1": (290, 90, "c"), "R3": (565, 90, "c"), "R2": (392, 270, "r"), "R4": (565, 362, "c"),
       "R5": (762, 520, "l"), "V1": (108, 385, "r"), "V2": (762, 265, "l"), "V3": (368, 520, "r")}
NODE_TAG = {"TL": (150, 100, "c"), "N1": (410, 100, "c"), "TR": (720, 100, "c"), "N3": (392, 378, "r"), "N2": (734, 376, "l")}
MESH_C = [(280, 385), (590, 262), (590, 520)]


def build_circuit():
    svg, labels = [], []
    svg.append('<defs><filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4" result="b"/>'
               '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
    wires = [(k, p, q) for k, _, p, q, _ in BR] + [("GND", (150, GY), (720, GY))]
    for k, p, q in wires:
        L = round(math.hypot(q[0] - p[0], q[1] - p[1]), 2)
        svg.append(f'<line id="w-{k}" x1="{p[0]}" y1="{p[1]}" x2="{q[0]}" y2="{q[1]}" class="wire" stroke-dasharray="{L}" stroke-dashoffset="{L}"/>')
    for k, p, q in wires:
        svg.append(f'<circle id="pk-{k}" cx="{p[0]}" cy="{p[1]}" r="7" class="packet" filter="url(#glow)"/>')
    gx = 565
    svg.append('<g id="gnd" class="el">'
               f'<line x1="{gx}" y1="{GY}" x2="{gx}" y2="{GY+26}" class="gl"/><line x1="{gx-30}" y1="{GY+26}" x2="{gx+30}" y2="{GY+26}" class="gl"/>'
               f'<line x1="{gx-19}" y1="{GY+38}" x2="{gx+19}" y2="{GY+38}" class="gl"/><line x1="{gx-8}" y1="{GY+50}" x2="{gx+8}" y2="{GY+50}" class="gl"/></g>')
    for k, kind, p, q, (cx, cy) in BR:
        horiz = p[1] == q[1]
        if kind == "R":
            sp = [(-60, 0), (-48, 0), (-40, -14), (-24, 14), (-8, -14), (8, 14), (24, -14), (40, 14), (48, 0), (60, 0)]
            pts = [(cx + s, cy + t) if horiz else (cx + t, cy + s) for s, t in sp]
            m = (cx - 62, cy - 17, 124, 34) if horiz else (cx - 17, cy - 62, 34, 124)
            svg.append(f'<g id="el-{k}" class="el"><rect x="{m[0]}" y="{m[1]}" width="{m[2]}" height="{m[3]}" class="mask"/>'
                       f'<polyline points="{" ".join(f"{x},{y}" for x, y in pts)}" class="res"/></g>')
        else:
            svg.append(f'<g id="el-{k}" class="el"><circle cx="{cx}" cy="{cy}" r="34" class="src"/>'
                       f'<path d="M{cx-8} {cy-14} H{cx+8} M{cx} {cy-22} V{cy-6}" class="pm"/><path d="M{cx-8} {cy+14} H{cx+8}" class="pm"/></g>')
    for n, (x, y) in NODES.items():
        svg.append(f'<circle id="nd-{n}" cx="{x}" cy="{y}" r="9" class="node el"/>')
    for x in (150, 410, 720):
        svg.append(f'<circle cx="{x}" cy="{GY}" r="7" class="node gnode el"/>')
    for i, (cx, cy) in enumerate(MESH_C):
        r, t0, t1 = 38, math.radians(-60), math.radians(235)
        sx, sy, ex, ey = cx + r * math.cos(t0), cy + r * math.sin(t0), cx + r * math.cos(t1), cy + r * math.sin(t1)
        L = round(r * (t1 - t0), 2)
        tx, ty, nx, ny = -math.sin(t1), math.cos(t1), math.cos(t1), math.sin(t1)
        tip, h1, h2 = (ex + tx * 13, ey + ty * 13), (ex - nx * 8, ey - ny * 8), (ex + nx * 8, ey + ny * 8)
        svg.append(f'<path id="mesh-{i+1}" d="M{sx:.1f} {sy:.1f} A{r} {r} 0 1 1 {ex:.1f} {ey:.1f}" class="marc" stroke-dasharray="{L}" stroke-dashoffset="{L}"/>'
                   f'<polygon id="mhead-{i+1}" points="{tip[0]:.1f},{tip[1]:.1f} {h1[0]:.1f},{h1[1]:.1f} {h2[0]:.1f},{h2[1]:.1f}" class="mhead"/>')

    def box(x, y, w, h, al, html, cid, cls):
        left = x if al == "l" else (x - w if al == "r" else x - w / 2)
        ta = {"l": "left", "r": "right", "c": "center"}[al]
        return f'<div id="{cid}" class="lb {cls}" style="left:{left:.0f}px;top:{y-h/2:.0f}px;width:{w}px;height:{h}px;line-height:{h}px;text-align:{ta}">{html}</div>'

    for k, (x, y, al) in LAB.items():
        html = (f'{R_(k[1])} <span class="eq">=</span> <b class="n">{Rv[k]}</b> <span class="u">kΩ</span>' if k in Rv
                else f'{V_(k[1])} <span class="eq">=</span> <b class="n">{Vv[k]}</b> <span class="u">V</span>')
        labels.append(box(x, y, 200, 36, al, html, f"lb-{k}", "elabel"))
    for n, (x, y, al) in NODE_TAG.items():
        labels.append(box(x, y, 60, 28, al, n, f"nt-{n}", "ntag"))
    labels.append(box(600, 692, 80, 28, "l", "GND", "nt-GND", "ntag"))
    for i, (cx, cy) in enumerate(MESH_C):
        labels.append(box(cx, cy, 60, 40, "c", I_(i + 1), f"ml-{i+1}", "mlabel"))
    return "\n".join(svg), "\n".join(labels)


# ------------------------------------------------------------------ matrix card (absolute origin of #cardin = 92,1264)
COLX, ROWY, VX = [130, 235, 340], [64, 108, 152], 506
ORG = (92, 1264)


def build_matrix():
    out = []
    for r in range(3):
        for c in range(3):
            cls = "d" if r == c else "p"
            out.append(f'<div id="e-{r}-{c}" class="cell {cls}" style="left:{COLX[c]-48}px;top:{ROWY[r]-22}px"><b>{num(A0[r][c])}</b></div>')
        out.append(f'<div id="v-{r}" class="cell s" style="left:{VX-48}px;top:{ROWY[r]-22}px"><b>{num(b0[r])}</b></div>')
    for c in range(3):
        out.append(f'<div id="col-{c+1}" class="clab" style="left:{COLX[c]-40}px;top:2px">{I_(c+1)}</div>')
    out.append(f'<div id="col-V" class="clab" style="left:{VX-40}px;top:2px">{mi("V")}</div>')
    for r in range(3):
        out.append(f'<div id="rl-{r+1}" class="rlab" style="top:{ROWY[r]-14}px">M{r+1}</div>')
    out.append(f'<div id="eqsign" class="eqsign" style="left:410px;top:{ROWY[1]-24}px">=</div>')
    return "\n".join(out)


def brackets():
    def br(id_, x, left):
        y0, y1 = 40, 176
        d = f"M{x+11} {y0} H{x} V{y1} H{x+11}" if left else f"M{x-11} {y0} H{x} V{y1} H{x-11}"
        L = 11 + (y1 - y0) + 11
        return f'<path id="{id_}" d="{d}" class="brk" stroke-dasharray="{L}" stroke-dashoffset="{L}"/>'
    return "".join([br("brl-R", 66, True), br("brr-R", 398, False), br("brl-V", 452, True), br("brr-V", 560, False)])


# ------------------------------------------------------------------ the derivation: one beat per matrix entry group
MESH_RES = {1: ["R1", "R2"], 2: ["R3", "R2", "R4"], 3: ["R4", "R5"]}
SHARED = {(1, 2): "R2", (2, 3): "R4", (1, 3): None}
MESH_SRC = {1: [("V1", +1), ("V3", -1)], 2: [("V2", -1)], 3: [("V3", +1)]}   # + : I climbs - to + ; - : I drops + to -
SRC_WHY = {1: "V₁ rises (− → +), V₃ drops (+ → −) along I₁",
           2: "V₂ drops (+ → −) along I₂",
           3: "V₃ rises (− → +) along I₃"}
SUB = "₀₁₂₃"


def beats():
    B = []
    for r in (1, 2, 3):                                  # diagonal: self resistance
        res = sorted(MESH_RES[r])
        assert A0[r - 1][r - 1] == sum(Rv[k] for k in res)
        sym = " + ".join(R_(k[1]) for k in res)
        numr = " + ".join(str(Rv[k]) for k in res)
        B.append(dict(id=f"d{r}", kind="diag", cells=[f"e-{r-1}-{r-1}"], res=res, src=[], meshes=[r], color="#0088FF", rule=1,
                      html=(f'<div class="bl1">{R_(f"{r}{r}")} = {sym} = {numr} = <span class="hot-b">{num(A0[r-1][r-1])}</span> <span class="u">kΩ</span></div>'
                            f'<div class="bl2">self resistance: every resistor around mesh {r}</div>')))
    for (i, j) in ((1, 2), (2, 3), (1, 3)):               # off-diagonal: shared resistance
        sh = SHARED[(i, j)]
        val = -Rv[sh] if sh else 0
        assert A0[i - 1][j - 1] == A0[j - 1][i - 1] == val
        if sh:
            body = (f'{R_(f"{i}{j}")} = {R_(f"{j}{i}")} = {MINUS}{R_(sh[1])} = <span class="hot-p">{num(val)}</span> <span class="u">kΩ</span>')
            sub = f'{R_(sh[1])} is shared; I{SUB[i]} and I{SUB[j]} oppose in it, so the sign is −'
        else:
            body = f'{R_(f"{i}{j}")} = {R_(f"{j}{i}")} = <span class="hot-p">0</span> <span class="u">kΩ</span>'
            sub = f'no resistor is shared by mesh {i} and mesh {j}'
        sub = sub.replace(f"I{SUB[i]}", f'<span class="mi">I</span><span class="ms">{i}</span>').replace(f"I{SUB[j]}", f'<span class="mi">I</span><span class="ms">{j}</span>')
        B.append(dict(id=f"o{i}{j}", kind="off" if sh else "zero", cells=[f"e-{i-1}-{j-1}", f"e-{j-1}-{i-1}"], res=[sh] if sh else [],
                      src=[], meshes=[i, j], color="#B026FF", rule=2,
                      html=f'<div class="bl1">{body}</div><div class="bl2">{sub}</div>'))
    for r in (1, 2, 3):                                  # source vector
        terms = MESH_SRC[r]
        val = sum(sg * Vv[k] for k, sg in terms)
        assert b0[r - 1] == val
        sym = "".join((f' {"+" if sg > 0 else MINUS} ' if n else ("+" if sg > 0 else MINUS)) + V_(k[1])
                      for n, (k, sg) in enumerate(terms))
        numr = "".join((f' {"+" if sg > 0 else MINUS} ' if n else ("" if sg > 0 else MINUS)) + str(Vv[k])
                       for n, (k, sg) in enumerate(terms))
        why = SRC_WHY[r]
        for q in "123":
            why = why.replace(f"V{SUB[int(q)]}", f'<span class="mi">V</span><span class="ms">{q}</span>').replace(f"I{SUB[int(q)]}", f'<span class="mi">I</span><span class="ms">{q}</span>')
        B.append(dict(id=f"v{r}", kind="src", cells=[f"v-{r-1}"], res=[], src=[k for k, _ in terms], meshes=[r], color="#FF0044", rule=3,
                      html=(f'<div class="bl1">{mi("v", r)} = {sym} = {numr + " = " if numr != num(val) else ""}<span class="hot-r">{num(val)}</span> <span class="u">V</span></div>'
                            f'<div class="bl2">{why}</div>')))
    return B


def main():
    local = "--local" in sys.argv
    csvg, clab = build_circuit()
    B = beats()
    beat_html = "\n".join(f'    <div id="bt-{b["id"]}" class="sb">{b["html"]}</div>' for b in B)
    fly, flydata = [], {}
    for b in B:
        for cid in b["cells"]:
            kind, r, *c = cid.split("-")
            r = int(r)
            cx, cy = (VX, ROWY[r]) if kind == "v" else (COLX[int(c[0])], ROWY[r])
            val = b0[r] if kind == "v" else A0[r][int(c[0])]
            cls = "s" if kind == "v" else ("d" if r == int(c[0]) else "p")
            fly.append(f'<div id="fly-{cid}" class="fly {cls}" style="left:{ORG[0]+cx-48}px;top:{ORG[1]+cy-22}px">{num(val)}</div>')
            flydata[cid] = dict(dx=540 - (ORG[0] + cx), dy=1191 - (ORG[1] + cy))
    data = dict(END=CONFIG["DURATION"], beats=[{k: b[k] for k in ("id", "kind", "cells", "res", "src", "meshes", "color", "rule")} for b in B], fly=flydata)
    html = (HERE / "src" / "template.html").read_text()
    repl = {"DURATION": f"{CONFIG['DURATION']:g}", "GSAP_SRC": "assets/gsap.min.js" if local else GSAP_CDN,
            "CIRCUIT_SVG": csvg, "CIRCUIT_LABELS": clab, "MATRIX": build_matrix(), "BRACKETS": brackets(), "BEATS": beat_html,
            "FLY": "\n".join(fly), "DATA_JSON": json.dumps(data), "TIMELINE_JS": (HERE / "src" / "timeline.js").read_text()}
    for k, v in repl.items():
        html = html.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{[A-Z_]+\}\}", html)
    assert not left, left
    (HERE / "index.html").write_text(html)
    print("wrote index.html", len(html), "bytes;", len(B), "beats; I =", [str(x) for x in S["I"]])


if __name__ == "__main__":
    main()
