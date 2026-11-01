#!/usr/bin/env python3
"""Generates index.html from template.html + timeline.js + exact mesh-analysis numbers.

    python3 build_index.py            # ships the cdnjs GSAP tag
    python3 build_index.py --local    # points the GSAP tag at assets/gsap.min.js (sandbox verification only)

Change the numbers in CONFIG for a new video; everything (circuit labels, matrices, elimination text,
KCL/power checks, count-up targets) is recomputed by scripts/solve.py with exact fractions.
"""
import json, math, re, sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE / "scripts"))
from solve import solve_mesh  # noqa: E402

CONFIG = dict(
    DURATION=30.0,                 # [DURATION]
    T_HOOK=3.0,                    # [T_HOOK]
    HOOK_QUOTE="Canvas Ready",     # [HOOK QUOTE] - visible text on the recorded page
    R=[2, 2, 3, 4, 1],             # R1..R5 in kOhm
    V=[5, 16, 13],                 # V1..V3 in volts
)
GSAP_CDN = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"
MINUS = "−"

BLUE, PURPLE, RED, TEAL = "#0088FF", "#B026FF", "#FF0044", "#00D4B4"
MESH_COL = [BLUE, PURPLE, TEAL]


# ------------------------------------------------------------------ formatting helpers
def num(x):
    """Fraction -> plain text with a true minus sign (decimals when not an integer)."""
    x = F(x)
    s = str(int(x)) if x.denominator == 1 else f"{float(x):.3f}".rstrip("0").rstrip(".")
    return s.replace("-", MINUS)


def frac_html(x):
    """Fraction -> HTML; stacked fraction for non-integers (used for multipliers)."""
    x = F(x)
    if x.denominator == 1:
        return num(x)
    sign = MINUS if x < 0 else ""
    return f'{sign}<span class="fr"><i>{abs(x.numerator)}</i><i>{x.denominator}</i></span>'


def mi(sym, sub=None):
    s = f'<span class="mi">{sym}</span>'
    return s + (f'<span class="ms">{sub}</span>' if sub is not None else "")


def I_(k): return mi("I", k)
def R_(k): return mi("R", k)
def V_(k): return mi("V", k)


def lin(coefs, names):
    """'4I1 - 2I2' style linear form from coefficients (skips zeros)."""
    out = []
    for c, n in zip(coefs, names):
        if c == 0:
            continue
        mag = abs(c)
        term = (f'<span class="n">{num(mag)}</span>' if mag != 1 else "") + n
        if not out:
            out.append((MINUS if c < 0 else "") + term)
        else:
            out.append(f' {MINUS if c < 0 else "+"} {term}')
    return "".join(out) or '<span class="n">0</span>'


# ------------------------------------------------------------------ numbers
R, V = CONFIG["R"], CONFIG["V"]
S = solve_mesh(R, V)
A0, b0, A, b, I = S["A0"], S["b0"], S["A"], S["b"], S["I"]
END = CONFIG["DURATION"]

# ------------------------------------------------------------------ circuit geometry (stage-local 900x750)
NODES = {"TL": (150, 130), "N1": (410, 130), "TR": (720, 130), "N3": (410, 400), "N2": (720, 400)}
GY = 640
BR = [  # id, kind, from, to, element centre
    ("V1", "V", (150, 130), (150, GY), (150, 385)),
    ("R1", "R", (150, 130), (410, 130), (290, 130)),
    ("R3", "R", (410, 130), (720, 130), (565, 130)),
    ("V2", "V", (720, 130), (720, 400), (720, 265)),
    ("R2", "R", (410, 130), (410, 400), (410, 265)),
    ("R4", "R", (410, 400), (720, 400), (565, 400)),
    ("R5", "R", (720, 400), (720, GY), (720, 520)),
    ("V3", "V", (410, 400), (410, GY), (410, 520)),
]
# label anchor: (x, y_centre, align)   chip: centre of the branch-current chip
LAB = {"R1": (290, 94, "c"), "R3": (565, 94, "c"), "R2": (392, 270, "r"), "R4": (565, 366, "c"),
       "R5": (762, 520, "l"), "V1": (108, 385, "r"), "V2": (762, 265, "l"), "V3": (368, 520, "r")}
CHIP = {"R1": (290, 178), "R3": (565, 178), "R2": (492, 266), "R4": (590, 434), "R5": (806, 562),
        "V1": (66, 430), "V2": (806, 302), "V3": (326, 558)}
DIRSYM = {"R1": "→", "R3": "→", "R2": "↓", "R4": "→", "R5": "↓",
          "V1": "↑", "V2": "↓", "V3": "↑"}
NODE_TAG = {"TL": (150, 100, "c"), "N1": (410, 100, "c"), "TR": (720, 100, "c"),
            "N3": (392, 378, "r"), "N2": (734, 376, "l")}
NODE_CHIP = {"TL": (168, 146), "N1": (426, 146), "TR": (736, 146), "N3": (426, 414), "N2": (736, 414),
             "GND": (166, 652)}
MESH_C = [(280, 385), (590, 262), (590, 520)]


def line_len(p, q): return math.hypot(q[0] - p[0], q[1] - p[1])


def build_circuit():
    svg, labels = [], []
    svg.append('<defs><filter id="glow" x="-200%" y="-200%" width="500%" height="500%">'
               '<feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/>'
               '<feMergeNode in="SourceGraphic"/></feMerge></filter></defs>')
    # wires + light packets (GND bus is the 9th wire)
    wires = [(k, p, q) for k, _, p, q, _ in BR] + [("GND", (150, GY), (720, GY))]
    for k, p, q in wires:
        L = round(line_len(p, q), 2)
        svg.append(f'<line id="w-{k}" x1="{p[0]}" y1="{p[1]}" x2="{q[0]}" y2="{q[1]}" class="wire" '
                   f'stroke-dasharray="{L}" stroke-dashoffset="{L}"/>')
    for k, p, q in wires:
        svg.append(f'<circle id="pk-{k}" cx="{p[0]}" cy="{p[1]}" r="7" class="packet" filter="url(#glow)"/>')
    # ground symbol (stub from the bus + three bars)
    gx = 565
    svg.append('<g id="gnd" class="el">'
               f'<line x1="{gx}" y1="{GY}" x2="{gx}" y2="{GY+26}" class="gl"/>'
               f'<line x1="{gx-30}" y1="{GY+26}" x2="{gx+30}" y2="{GY+26}" class="gl"/>'
               f'<line x1="{gx-19}" y1="{GY+38}" x2="{gx+19}" y2="{GY+38}" class="gl"/>'
               f'<line x1="{gx-8}" y1="{GY+50}" x2="{gx+8}" y2="{GY+50}" class="gl"/></g>')
    # elements
    for k, kind, p, q, (cx, cy) in BR:
        horiz = p[1] == q[1]
        if kind == "R":
            pts_sp = [(-60, 0), (-48, 0), (-40, -14), (-24, 14), (-8, -14), (8, 14), (24, -14), (40, 14), (48, 0), (60, 0)]
            pts = [(cx + s, cy + t) if horiz else (cx + t, cy + s) for s, t in pts_sp]
            mask = (cx - 62, cy - 17, 124, 34) if horiz else (cx - 17, cy - 62, 34, 124)
            svg.append(f'<g id="el-{k}" class="el"><rect x="{mask[0]}" y="{mask[1]}" width="{mask[2]}" height="{mask[3]}" class="mask"/>'
                       f'<polyline points="{" ".join(f"{x},{y}" for x, y in pts)}" class="res"/></g>')
        else:
            svg.append(f'<g id="el-{k}" class="el"><circle cx="{cx}" cy="{cy}" r="34" class="src"/>'
                       f'<path d="M{cx-8} {cy-14} H{cx+8} M{cx} {cy-22} V{cy-6}" class="pm"/>'
                       f'<path d="M{cx-8} {cy+14} H{cx+8}" class="pm"/></g>')
    # nodes
    for n, (x, y) in NODES.items():
        svg.append(f'<circle id="nd-{n}" cx="{x}" cy="{y}" r="9" class="node el"/>')
    for x in (150, 410, 720):
        svg.append(f'<circle cx="{x}" cy="{GY}" r="7" class="node gnode el"/>')
    # mesh arrows (clockwise: screen-space angle increases clockwise)
    for i, (cx, cy) in enumerate(MESH_C):
        r, t0, t1 = 38, math.radians(-60), math.radians(235)
        sx, sy = cx + r * math.cos(t0), cy + r * math.sin(t0)
        ex, ey = cx + r * math.cos(t1), cy + r * math.sin(t1)
        L = round(r * (t1 - t0), 2)
        tx, ty = -math.sin(t1), math.cos(t1)
        nx, ny = math.cos(t1), math.sin(t1)
        tip = (ex + tx * 13, ey + ty * 13)
        h1, h2 = (ex - nx * 8, ey - ny * 8), (ex + nx * 8, ey + ny * 8)
        col = MESH_COL[i]
        svg.append(f'<path id="mesh-{i+1}" d="M{sx:.1f} {sy:.1f} A{r} {r} 0 1 1 {ex:.1f} {ey:.1f}" class="marc" stroke="{col}" '
                   f'stroke-dasharray="{L}" stroke-dashoffset="{L}"/>'
                   f'<polygon id="mhead-{i+1}" points="{tip[0]:.1f},{tip[1]:.1f} {h1[0]:.1f},{h1[1]:.1f} {h2[0]:.1f},{h2[1]:.1f}" fill="{col}" class="mhead"/>')

    def box(x, y, w, h, align, html, cid, cls):
        left = x if align == "l" else (x - w if align == "r" else x - w / 2)
        return (f'<div id="{cid}" class="lb {cls}" style="left:{left:.0f}px;top:{y-h/2:.0f}px;width:{w}px;height:{h}px;'
                f'line-height:{h}px;text-align:{ {"l":"left","r":"right","c":"center"}[align] }">{html}</div>')

    Rv = dict(zip(["R1", "R2", "R3", "R4", "R5"], R))
    Vv = dict(zip(["V1", "V2", "V3"], V))
    for k, (x, y, al) in LAB.items():
        if k in Rv:
            html = f'{R_(k[1])} <span class="eq">=</span> <b class="n">{Rv[k]}</b> <span class="u">kΩ</span>'
        else:
            html = f'{V_(k[1])} <span class="eq">=</span> <b class="n">{Vv[k]}</b> <span class="u">V</span>'
        labels.append(box(x, y, 190, 34, al, html, f"lb-{k}", "elabel"))
    for n, (x, y, al) in NODE_TAG.items():
        labels.append(box(x, y, 60, 26, al, n, f"nt-{n}", "ntag"))
    labels.append(box(600, 692, 70, 26, "l", "GND", "nt-GND", "ntag"))
    for n, (x, y) in NODE_CHIP.items():
        labels.append(f'<div id="nv-{n}" class="chip nvchip" style="left:{x}px;top:{y}px"><b class="n">{num(S["node_v"][n])}</b> <span class="u">V</span></div>')
    for k, (x, y) in CHIP.items():
        labels.append(f'<div id="bc-{k}" class="chip bcchip" style="left:{x-53}px;top:{y-15}px"><span class="dir">{DIRSYM[k]}</span>'
                      f'<b class="n">{num(S["branch"][k])}</b> <span class="u">mA</span></div>')
    for i, (cx, cy) in enumerate(MESH_C):
        labels.append(box(cx, cy, 60, 40, "c", I_(i + 1), f"ml-{i+1}", "mlabel"))
    return "\n".join(svg), "\n".join(labels)


# ------------------------------------------------------------------ matrix card
COLX = [130, 235, 340]
ROWY = [64, 108, 152]
VX = 506


def cell(cid, x, y, text, cls, extra=""):
    return (f'<div id="{cid}" class="cell {cls}" style="left:{x-48}px;top:{y-22}px">'
            f'<b class="o">{text}</b>{extra}</div>')


def build_matrix():
    out = []
    changed = {}   # cell id -> (old text, new text, new class)
    for st in S["steps"]:
        if st["kind"] != "fwd":
            continue
        t = st["target"]
        (rowb, bb), (rowa, ba) = st["before"], st["after"]
        for c in range(3):
            if rowb[c] != rowa[c]:
                changed[f"e-{t}-{c}"] = (num(rowb[c]), num(rowa[c]))
        if bb != ba:
            changed[f"v-{t}"] = (num(bb), num(ba))
    for r in range(3):
        for c in range(3):
            cls = "d" if r == c else "p"
            cid = f"e-{r}-{c}"
            extra = ""
            if cid in changed:
                extra = f'<b class="n2">{changed[cid][1]}</b>'
            out.append(cell(cid, COLX[c], ROWY[r], num(A0[r][c]), cls, extra))
        extra = ""
        if f"v-{r}" in changed:
            extra = f'<b class="n2">{changed[f"v-{r}"][1]}</b>'
        out.append(cell(f"v-{r}", VX, ROWY[r], num(b0[r]), "s", extra))
    for c in range(3):
        out.append(f'<div id="col-{c+1}" class="clab" style="left:{COLX[c]-40}px;top:2px">{I_(c+1)}</div>')
    out.append(f'<div id="col-V" class="clab" style="left:{VX-40}px;top:2px">{mi("V")}</div>')
    for r in range(3):
        out.append(f'<div id="rl-{r+1}" class="rlab" style="top:{ROWY[r]-14}px">M{r+1}</div>')
    out.append('<div id="eqsign" class="eqsign" style="left:410px;top:{}px">=</div>'.format(ROWY[1] - 24))
    return "\n".join(out), sorted(changed)


def build_slots():
    out = []
    for r in range(3):
        sign = MINUS if I[r] < 0 else ""
        out.append(f'<div id="slot-{r+1}" class="slot" style="top:{ROWY[r]-22}px">'
                   f'<span class="sl-name">{I_(r+1)} <span class="eq">=</span></span>'
                   f'<span id="q-{r+1}" class="sl-q">?</span>'
                   f'<span id="val-{r+1}" class="sl-val"><span class="sg">{sign}</span>'
                   f'<b id="cnt-{r+1}" class="cnt">0</b> <span class="u">mA</span></span></div>')
    return "\n".join(out)


def brackets():
    def br(id_, x, w, left):
        y0, y1 = 40, 176
        d = f"M{x+11} {y0} H{x} V{y1} H{x+11}" if left else f"M{x-11} {y0} H{x} V{y1} H{x-11}"
        L = 11 + (y1 - y0) + 11
        return f'<path id="{id_}" d="{d}" class="brk" stroke-dasharray="{L}" stroke-dashoffset="{L}"/>'
    return "".join([br("brl-R", 66, 0, True), br("brr-R", 398, 0, False),
                    br("brl-V", 452, 0, True), br("brr-V", 560, 0, False)])


# ------------------------------------------------------------------ strip content
def kvl_html():
    sym = [
        f'({R_(1)}+{R_(2)}){I_(1)} {MINUS} {R_(2)}{I_(2)} = {V_(1)} {MINUS} {V_(3)}',
        f'{MINUS}{R_(2)}{I_(1)} + ({R_(2)}+{R_(3)}+{R_(4)}){I_(2)} {MINUS} {R_(4)}{I_(3)} = {MINUS}{V_(2)}',
        f'{MINUS}{R_(4)}{I_(2)} + ({R_(4)}+{R_(5)}){I_(3)} = {V_(3)}',
    ]
    names = [I_(1), I_(2), I_(3)]
    rows = []
    for r in range(3):
        numeric = f'{lin(A0[r], names)} = <span class="n">{num(b0[r])}</span>'
        rows.append(f'<div id="kvl-{r+1}" class="kvl"><i class="mdot" style="background:{MESH_COL[r]}"></i>'
                    f'<span class="sym">{sym[r]}</span><span class="arrow">⇒</span><span class="numr">{numeric}</span></div>')
    return "\n".join(rows)


def row_txt(row, bval):
    return "[" + ", ".join(f'<span class="n">{num(x)}</span>' for x in row) + f' | <span class="n">{num(bval)}</span>]'


def elim_html(steps_meta):
    out = []
    for i, st in enumerate(S["steps"]):
        if st["kind"] == "fwd":
            t, p, m = st["target"], st["pivot"], st["m"]
            op = f'R<sub>{t+1}</sub> ← R<sub>{t+1}</sub> {"+" if m > 0 else MINUS} {frac_html(abs(m))}·R<sub>{p+1}</sub>'
            (rowb, bb), (rowa, ba) = st["before"], st["after"]
            prow, pb = st["piv_row"]
            calc = []
            for c in range(3):
                calc.append(f'{num(rowb[c])} {"+" if m > 0 else MINUS} {frac_html(abs(m))}·({num(prow[c])}) = {num(rowa[c])}'
                            if rowb[c] != rowa[c] else f'{num(rowb[c])}')
            calc.append(f'{num(bb)} {"+" if m > 0 else MINUS} {frac_html(abs(m))}·({num(pb)}) = {num(ba)}')
            body = f'<div class="eop">{op}</div><div class="ecalc">{row_txt(rowb, bb)} → {row_txt(rowa, ba)}</div>'
        else:
            r = st["pivot"]
            row, bv = st["row"]
            terms = "".join(
                f' {"+" if -row[c] > 0 else MINUS} {num(abs(row[c]))}·{I_(c+1)}' for c in range(r + 1, 3) if row[c] != 0)
            body = (f'<div class="eop">{I_(r+1)} = ({num(bv)}{terms}) ÷ {num(row[r])} = <span class="n">{num(st["value"])}</span></div>'
                    f'<div class="ecalc">row {r+1} of the triangular system → solved from the bottom up</div>')
        out.append(f'<div id="es-{i+1}" class="estep">{body}</div>')
    return "\n".join(out)


def kcl_html():
    out = []
    for n in ("N1", "N2", "N3"):
        d = S["kcl"][n]
        lhs = f" {'+'} ".join(num(x) for _, x in d["inn"]).replace("+ −", "+ −")
        rhs = " + ".join(num(x) for _, x in d["out"])
        out.append(f'<div id="kcl-{n}" class="kcl"><div class="kh">KCL @ {n}</div>'
                   f'<div class="kb"><span class="n">{lhs}</span> = <span class="n">{rhs}</span></div>'
                   f'<svg class="tick" viewBox="0 0 30 30"><path id="tk-{n}" d="M5 16 L12 23 L26 7" stroke-dasharray="32" stroke-dashoffset="32"/></svg></div>')
    return "\n".join(out)


def power_html():
    ps, pr = S["p_src"], S["p_res"]
    src = f" + ".join(num(ps[k]) for k in ("V1", "V2", "V3"))
    res = " + ".join(num(pr[k]) for k in ("R1", "R2", "R3", "R4", "R5"))
    return (f'<div id="pw-1" class="pw"><span class="pl">delivered</span> {src} = <span class="n">{num(S["P_src"])}</span> <span class="u">mW</span></div>'
            f'<div id="pw-2" class="pw"><span class="pl">dissipated</span> {res} = <span class="n">{num(S["P_res"])}</span> <span class="u">mW</span>'
            f'<svg class="tick" viewBox="0 0 30 30"><path id="tk-P" d="M5 16 L12 23 L26 7" stroke-dasharray="32" stroke-dashoffset="32"/></svg></div>')


# ------------------------------------------------------------------ assemble
def main():
    local = "--local" in sys.argv
    circuit_svg, circuit_labels = build_circuit()
    matrix_html, changed = build_matrix()
    steps_meta = [dict(kind=st["kind"], pivot=st["pivot"], **({"target": st["target"]} if st["kind"] == "fwd" else {}))
                  for st in S["steps"]]
    # cells per forward step: those in the target row that change in that step
    for sm, st in zip(steps_meta, S["steps"]):
        if st["kind"] == "fwd":
            t = st["target"]
            (rb, bb), (ra, ba) = st["before"], st["after"]
            cells = [f"e-{t}-{c}" for c in range(3) if rb[c] != ra[c]] + ([f"v-{t}"] if bb != ba else [])
            sm["cells"] = cells
            sm["newcls"] = {f"e-{t}-{c}": ("d" if t == c else "p") for c in range(3)}
    data = dict(END=END, T_HOOK=CONFIG["T_HOOK"], steps=steps_meta,
                I=[dict(abs=float(abs(x)), dec=1 if (abs(x) % 1) else 0, neg=bool(x < 0)) for x in I])
    tpl = (HERE / "src" / "template.html").read_text()
    tl = (HERE / "src" / "timeline.js").read_text()
    repl = {
        "DURATION": f"{END:g}", "T_HOOK": f"{CONFIG['T_HOOK']:g}", "HOOK_QUOTE": CONFIG["HOOK_QUOTE"],
        "GSAP_SRC": "assets/gsap.min.js" if local else GSAP_CDN,
        "CIRCUIT_SVG": circuit_svg, "CIRCUIT_LABELS": circuit_labels,
        "MATRIX": matrix_html, "BRACKETS": brackets(), "SLOTS": build_slots(),
        "KVL": kvl_html(), "ELIM": elim_html(steps_meta), "KCL": kcl_html(), "POWER": power_html(),
        "DATA_JSON": json.dumps(data), "TIMELINE_JS": tl,
        "N_NODES": "6", "N_BRANCHES": "8",
        "VALUES_NOTE": f'R in kΩ · V in volts · I in mA',
    }
    html = tpl
    for k, v in repl.items():
        html = html.replace("{{" + k + "}}", v)
    left = re.findall(r"\{\{[A-Z_]+\}\}", html)
    assert not left, f"unfilled slots: {left}"
    (HERE / "index.html").write_text(html)
    print("wrote index.html", len(html), "bytes; I =", [str(x) for x in I])


if __name__ == "__main__":
    main()
