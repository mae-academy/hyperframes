#!/usr/bin/env python3
"""Generates ../index.html (static SVG/HTML markup + inlined scripts/timeline.js).

All circuit geometry lives in WORLD coordinates (the `#world` SVG group).  At zoom 1 world == page;
the Act II zoom-out scales `#world` by 0.75 about (560,760):   page = (140 + .75 x, 190 + .75 y).
Wires are lists of grid-snapped vertices; the same vertex lists are exported to the timeline as WP so the
cursor can follow a wire while it is being dragged out.
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent

OFF, BLUE, RED, PUR, WH = "#2A2A3C", "#0088FF", "#FF0044", "#B026FF", "#FFFFFF"

# ---------------------------------------------------------------- wires
WIRES = {}  # id -> dict(pts, lit, draw, hop)


def wire(wid, pts, lit=BLUE, draw=None, hop=None):
    WIRES[wid] = dict(pts=pts, lit=lit, draw=draw or lit, hop=hop or {})


def wire_d(w):
    pts, hop = w["pts"], w["hop"]
    d = f"M{pts[0][0]} {pts[0][1]}"
    for i in range(1, len(pts)):
        (x0, y0), (x1, y1) = pts[i - 1], pts[i]
        if (i - 1) in hop and y0 == y1:  # bridge hop over a crossing wire
            xc, dr = hop[i - 1], (1 if x1 > x0 else -1)
            d += f" H{xc - 12 * dr} A12 12 0 0 {1 if dr > 0 else 0} {xc + 12 * dr} {y0} H{x1}"
        elif y0 == y1:
            d += f" H{x1}"
        else:
            d += f" V{y1}"
    return d


# Act I — half adder built from discrete gates
wire("A1", [(280, 520), (400, 520), (400, 540)], BLUE, BLUE)
wire("A2", [(400, 540), (460, 540)], BLUE, BLUE)
wire("A3", [(400, 540), (400, 740), (460, 740)], BLUE, BLUE)
wire("B1", [(280, 800), (340, 800), (340, 780)], BLUE, PUR)
wire("B2", [(340, 780), (460, 780)], BLUE, PUR)
wire("B3", [(340, 780), (340, 580), (460, 580)], BLUE, PUR, hop={1: 400})
wire("S0", [(620, 560), (810, 560)], BLUE, BLUE)
wire("C0", [(620, 760), (810, 760)], RED, RED)
# Act III — full adder (final, post-zoom layout)
wire("FA", [(160, 470), (250, 470)], BLUE, BLUE)
wire("FB", [(160, 570), (250, 570)], BLUE, PUR)
wire("FS1", [(430, 470), (550, 470)], BLUE, BLUE)
wire("FCIN", [(160, 960), (490, 960), (490, 570), (550, 570)], RED, RED)
wire("FS2", [(730, 470), (990, 470)], BLUE, BLUE)
wire("FC2", [(730, 570), (760, 570), (760, 820), (780, 820)], RED, RED)
wire("FC1", [(430, 570), (450, 570), (450, 860), (780, 860)], RED, RED, hop={2: 490})
wire("FOR", [(980, 840), (990, 840)], RED, RED)


def wire_svg(wid):
    w = WIRES[wid]
    d = wire_d(w)
    return (
        f'<g id="w_{wid}" class="wire">'
        f'<path class="b" d="{d}" pathLength="1"/>'
        f'<path class="g" d="{d}" pathLength="1" style="stroke:{w["draw"]}"/>'
        f'<g class="l"><path class="lg" d="{d}" pathLength="1" style="stroke:{w["lit"]}"/>'
        f'<path class="lc" d="{d}" pathLength="1" style="stroke:{w["lit"]}"/></g>'
        f'<path class="p" d="{d}" pathLength="1"/></g>'
    )


# ---------------------------------------------------------------- symbols (local coords, origin = centre)
OR_B = "M -50 -40 H -20 C 20 -40 45 -20 50 0 C 45 20 20 40 -20 40 H -50 C -30 20 -30 -20 -50 -40 Z"
XOR_B = "M -42 -40 H -20 C 20 -40 45 -20 50 0 C 45 20 20 40 -20 40 H -42 C -22 20 -22 -20 -42 -40 Z"
XOR_X = "M -50 -40 C -30 -20 -30 20 -50 40"
AND_B = "M -50 -40 H 10 A 40 40 0 0 1 10 40 H -50 Z"
OR_BIG = "M -62 -50 H -25 C 25 -50 55 -25 62 0 C 55 25 25 50 -25 50 H -62 C -38 25 -38 -25 -62 -50 Z"


def pin(x, y, r=5):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff"/>'


def at(cx, cy, inner):
    return f'<g transform="translate({cx} {cy})">{inner}</g>'


def snapfx(sid, w, h):
    return (f'<rect id="{sid}" class="sf" x="{-w / 2}" y="{-h / 2}" width="{w}" height="{h}" rx="16" '
            f'fill="none" stroke="{BLUE}" stroke-width="3"/>')


def gate(gid, cx, cy, kind):
    if kind == "or":
        body, stub, pins = OR_BIG, "M -100 -20 H -46 M -100 20 H -46 M 62 0 H 100", [(-100, -20), (-100, 20), (100, 0)]
        lab, lx, fs, fx, fh = "OR", -4, 34, 240, 130
    elif kind == "xor":
        body, stub, pins = XOR_B, "M -80 -20 H -38 M -80 20 H -38 M 50 0 H 80", [(-80, -20), (-80, 20), (80, 0)]
        lab, lx, fs, fx, fh = "XOR", 2, 22, 190, 100
    else:
        body, stub, pins = AND_B, "M -80 -20 H -50 M -80 20 H -50 M 50 0 H 80", [(-80, -20), (-80, 20), (80, 0)]
        lab, lx, fs, fx, fh = "AND", -8, 22, 190, 100
    extra = f'<path d="{XOR_X}" fill="none" stroke="{PUR}" stroke-width="4" stroke-linecap="round"/>' if kind == "xor" else ""
    on_extra = (f'<path d="{XOR_X}" fill="none" stroke="{PUR}" stroke-width="4" stroke-linecap="round"/>' if kind == "xor" else "")
    inner = (
        f'<path d="{stub}" fill="none" stroke="{PUR}" stroke-width="4" stroke-linecap="round"/>'
        f'<path class="body" d="{body}" fill="rgba(176,38,255,.14)" stroke="{PUR}" stroke-width="4" stroke-linejoin="round"/>'
        f'{extra}'
        f'<g class="on" opacity="0" filter="url(#glowM)"><path d="{body}" fill="rgba(176,38,255,.55)" stroke="{PUR}" stroke-width="4" stroke-linejoin="round"/>{on_extra}</g>'
        f'<text class="fm" x="{lx}" y="{fs * .36:.1f}" text-anchor="middle" font-size="{fs}" fill="#fff">{lab}</text>'
        + "".join(pin(x, y) for x, y in pins)
    )
    return at(cx, cy, snapfx("sf_" + gid, fx, fh) + f'<g id="{gid}" class="mv" opacity="0">{inner}</g>')


def toggle(tid, cx, cy, label_svg, on_color):
    inner = (
        f'<g class="lab">{label_svg}</g>'
        f'<path class="stubOff" d="M 42 0 H 60" stroke="{OFF}" stroke-width="5" fill="none"/>'
        f'<path class="stubOn" d="M 42 0 H 60" stroke="{on_color}" stroke-width="5" fill="none" opacity="0"/>'
        f'<rect x="-42" y="-22" width="84" height="44" rx="22" fill="#161624" stroke="{OFF}" stroke-width="3"/>'
        f'<rect class="trkOn" x="-42" y="-22" width="84" height="44" rx="22" fill="{on_color}" fill-opacity=".22" stroke="{on_color}" stroke-width="3" opacity="0" filter="url(#glowS)"/>'
        f'<g class="kn">'
        f'<circle cx="-20" cy="0" r="17" fill="#232336" stroke="#6C6C88" stroke-width="2"/>'
        f'<circle class="knOn" cx="-20" cy="0" r="17" fill="{on_color}" opacity="0"/>'
        f'<text class="fm d0" x="-20" y="8" text-anchor="middle" font-size="22" fill="#8A8AA8">0</text>'
        f'<text class="fm d1" x="-20" y="8" text-anchor="middle" font-size="22" fill="#fff" opacity="0">1</text>'
        f'</g>' + pin(60, 0)
    )
    return at(cx, cy, snapfx("sf_" + tid, 140, 80) + f'<g id="{tid}" class="mv" opacity="0">{inner}</g>')


def led(lid, cx, cy, color, top_svg, bot_svg):
    inner = (
        f'<circle class="ring" r="30" fill="none" stroke="{color}" stroke-width="4" opacity="0"/>'
        f'<circle r="30" fill="#14141F" stroke="{OFF}" stroke-width="4"/>'
        f'<g class="on" opacity="0" filter="url(#glowM)"><circle r="30" fill="{color}" fill-opacity=".38" stroke="{color}" stroke-width="4"/>'
        f'<circle r="13" fill="#fff"/></g>' + pin(-30, 0) + top_svg + bot_svg
    )
    return at(cx, cy, snapfx("sf_" + lid, 130, 130) + f'<g id="{lid}" class="mv" opacity="0">{inner}</g>')


def ic(iid, cx, cy, l1, l2):
    inner = (
        f'<rect class="body" x="-90" y="-100" width="180" height="200" rx="22" fill="#17172B" stroke="{PUR}" stroke-width="4"/>'
        f'<rect x="-90" y="-100" width="180" height="200" rx="22" fill="rgba(176,38,255,.14)"/>'
        f'<rect class="on" x="-90" y="-100" width="180" height="200" rx="22" fill="rgba(176,38,255,.5)" stroke="{PUR}" stroke-width="4" opacity="0" filter="url(#glowM)"/>'
        f'<text class="fm" x="0" y="-4" text-anchor="middle" font-size="30" fill="#fff">{l1}</text>'
        f'<text class="fm" x="0" y="34" text-anchor="middle" font-size="30" fill="#fff">{l2}</text>'
        f'<text class="fv" x="-76" y="-40" font-size="28" fill="#fff">A</text>'
        f'<text class="fv" x="-76" y="60" font-size="28" fill="#fff">B</text>'
        f'<text class="fv" x="76" y="-40" font-size="28" fill="#fff" text-anchor="end">S</text>'
        f'<text class="fv" x="76" y="60" font-size="28" fill="#fff" text-anchor="end">C</text>'
        + pin(-90, -50) + pin(-90, 50) + pin(90, -50) + pin(90, 50)
    )
    return at(cx, cy, snapfx("sf_" + iid, 220, 240) + f'<g id="{iid}" class="mv" opacity="0">{inner}</g>')


def netlabel(nid, x, y, base, subs, anchor):
    return (f'<text id="{nid}" class="fv nl" x="{x}" y="{y}" text-anchor="{anchor}" font-size="36" fill="#fff" opacity="0">{base}'
            f'<tspan class="fm" font-size="23" dy="9" font-weight="700">{subs}</tspan></text>')


# ---------------------------------------------------------------- world content
world = []
# dot-matrix grid (20 px pitch) lives in the world so it scales with the zoom
world.append('<rect x="-400" y="-300" width="2000" height="2200" fill="url(#dots)"/>')
world.append('<g id="circ">')

half = []
for wid in ["A1", "A2", "A3", "B1", "B2", "B3", "S0", "C0"]:
    half.append(wire_svg(wid))
half.append('<circle id="j_A" cx="400" cy="540" r="7" fill="#fff" opacity="0"/>')
half.append('<circle id="j_B" cx="340" cy="780" r="7" fill="#fff" opacity="0"/>')
half.append(gate("gXor", 540, 560, "xor"))
half.append(gate("gAnd", 540, 760, "and"))
world.append('<g id="half">' + "".join(half) + "</g>")

world.append(toggle("tgA", 220, 520, '<text class="fv" x="-82" y="14" text-anchor="middle" font-size="44" fill="#fff">A</text>', BLUE))
world.append(toggle("tgB", 220, 800, '<text class="fv" x="-82" y="14" text-anchor="middle" font-size="44" fill="#fff">B</text>', BLUE))

sum_top = '<text class="fv" x="0" y="-46" text-anchor="middle" font-size="44" fill="#fff">S</text>'
sum_bot = '<text class="fm" x="0" y="72" text-anchor="middle" font-size="26" fill="#fff">SUM</text>'
car_top = ('<g class="lblI"><text class="fv" x="0" y="-46" text-anchor="middle" font-size="44" fill="#fff">C</text></g>'
           '<g class="lblIII" opacity="0"><text class="fv" x="0" y="-46" text-anchor="middle" font-size="44" fill="#fff">C'
           '<tspan class="fv" font-size="26" dy="9">out</tspan></text></g>')
car_bot = '<text class="fm" x="0" y="72" text-anchor="middle" font-size="26" fill="#fff">CARRY</text>'
world.append(led("ledS", 840, 560, BLUE, sum_top, sum_bot))
world.append(led("ledC", 840, 760, RED, car_top, car_bot))

# marquee + IC blocks
world.append(f'<rect id="mq0" x="110" y="440" width="790" height="440" rx="10" fill="rgba(0,136,255,.10)" stroke="{BLUE}" stroke-width="2.5" stroke-dasharray="10 8" opacity="0"/>')
world.append(f'<rect id="mq" x="320" y="470" width="350" height="380" rx="10" fill="rgba(0,136,255,.10)" stroke="{BLUE}" stroke-width="2.5" stroke-dasharray="10 8" opacity="0"/>')
world.append(f'<rect id="mq2" x="320" y="470" width="350" height="380" rx="10" fill="rgba(0,136,255,.10)" stroke="{BLUE}" stroke-width="2.5" stroke-dasharray="10 8" opacity="0"/>')
world.append(ic("ha1", 490, 660, "HALF", "ADDER 1"))
world.append(ic("ha2", 640, 520, "HALF", "ADDER 2"))
world.append(gate("gOr", 880, 840, "or"))
cin_label = ('<text class="fv" x="-82" y="14" text-anchor="middle" font-size="44" fill="#fff">C'
             '<tspan class="fv" font-size="27" dy="9">in</tspan></text>')
world.append(toggle("tgC", 100, 960, cin_label, RED))

fw = []
for wid in ["FA", "FB", "FS1", "FCIN", "FS2", "FC2", "FC1", "FOR"]:
    fw.append(wire_svg(wid))
world.insert(world.index(next(x for x in world if x.startswith('<rect id="mq"'))), '<g id="full">' + "".join(fw) + "</g>")
def badge(bid, x, y, color, base, subs):
    return (f'<g id="{bid}" opacity="0"><circle cx="{x}" cy="{y}" r="18" fill="#12121C" stroke="{color}" stroke-width="3"/>'
            f'<text class="fv" x="{x}" y="{y + 7}" text-anchor="middle" font-size="22" fill="#fff">{base}'
            f'<tspan class="fm" font-size="13" dy="4">{subs}</tspan></text></g>')


world.append(badge("bdS1", 450, 470, BLUE, "S", "1"))   # integrated terminal badges on the HA output pins
world.append(badge("bdC1", 450, 570, RED, "C", "1"))
world.append(badge("bdC2", 750, 570, RED, "C", "2"))
world.append("</g>")  # /circ  (only the circuit dissolves at the loop point; the dot grid stays)

# ---------------------------------------------------------------- dock tiles
def mini(kind):
    if kind == "tog":
        return (f'<rect x="-26" y="-13" width="52" height="26" rx="13" fill="#161624" stroke="{OFF}" stroke-width="2.5"/>'
                f'<circle cx="-13" cy="0" r="9" fill="#232336" stroke="#6C6C88" stroke-width="2"/>')
    if kind == "led":
        return f'<circle r="15" fill="#14141F" stroke="{RED}" stroke-width="3"/><circle r="6" fill="{RED}" fill-opacity=".6"/>'
    body = {"xor": XOR_B, "and": AND_B, "or": OR_B}[kind]
    ex = f'<path d="{XOR_X}" fill="none" stroke="{PUR}" stroke-width="5" stroke-linecap="round"/>' if kind == "xor" else ""
    return (f'<g transform="scale(.32)"><path d="M -80 -20 H -40 M -80 20 H -40 M 50 0 H 80" stroke="{PUR}" stroke-width="5" fill="none"/>'
            f'<path d="{body}" fill="rgba(176,38,255,.2)" stroke="{PUR}" stroke-width="5" stroke-linejoin="round"/>{ex}</g>')


tiles = [("tog", "INPUT<br>TOGGLE"), ("xor", "XOR"), ("and", "AND"), ("or", "OR"), ("led", "OUTPUT<br>LED")]
dock_html = ""
for i, (k, lab) in enumerate(tiles):
    x = 106 + i * 176
    dock_html += (
        f'<div class="tile" id="tile_{k}" style="left:{x}px;top:326px">'
        f'<svg width="52" height="44" viewBox="-26 -22 52 44" overflow="visible">{mini(k)}</svg>'
        f'<span>{lab}</span></div>'
    )

# ---------------------------------------------------------------- truth table
def v(s):
    return f'<span class="v">{s}</span>'


def cell_html(txt, cls=""):
    return f'<b class="c {cls}">{txt}</b>'


CHECK = ('<svg class="ck" width="26" height="26" viewBox="0 0 26 26" overflow="visible"><polyline points="4,14 10,20 22,6" '
         f'fill="none" stroke="{BLUE}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')
BOLT = ('<svg class="bolt" width="22" height="30" viewBox="0 0 22 30" overflow="visible"><polygon points="13,0 0,17 9,17 7,30 22,11 12,11" '
        f'fill="{BLUE}"/></svg>')

WID = [110, 110, 130, 110, 150]


def cell(txt, cls, w):
    return f'<b class="c {cls}" style="flex-basis:{w}px">{txt}</b>'


fa_rows = ""
for idx in range(8):
    a, b_, ci = (idx >> 2) & 1, (idx >> 1) & 1, idx & 1
    s, c = a ^ b_ ^ ci, (a & b_) | ((a ^ b_) & ci)
    fa_rows += (f'<div class="tr" id="faR{idx}"><i class="bg"></i>' + cell(a, "ci", WID[0]) + cell(b_, "ci", WID[1]) + cell(ci, "ci", WID[2])
                + '<b class="ts"></b>' + cell(s, "os", WID[3]) + cell(c, "oc", WID[4]) + (CHECK if idx == 7 else "") + "</div>")
hdr = ('<div class="th">' + cell(v("A"), "", WID[0]) + cell(v("B"), "", WID[1]) + cell(v("C") + '<sub class="v">in</sub>', "", WID[2])
       + '<b class="ts"></b>' + cell(v("S"), "", WID[3]) + cell(v("C") + '<sub class="v">out</sub>', "", WID[4]) + "</div>")
table_html = f'<div id="ttFA" class="tt"><div class="grp">{hdr}{fa_rows}</div></div>'

banner_html = f"""
<div class="pg col" id="bn0"><span class="t t42">HOW COMPUTERS ACTUALLY</span><span class="l"><span class="t t42">ADD NUMBERS</span>{BOLT}</span></div>
<div class="pg" id="bn1"><span class="t">HALF ADDER:</span><span class="q"></span><span class="m">{v("S")} = {v("A")} ⊕ {v("B")}</span><span class="q sep">|</span><span class="m">{v("C")}<sub class="v">out</sub> = {v("A")} ⋅ {v("B")}</span></div>
<div class="pg" id="bn2"><span class="t">BINARY 1 + 1 = 10<sub>2</sub> (SUM = 0, CARRY = 1)</span>{CHECK}</div>
<div class="pg col" id="bn3"><span class="t">BUT WHAT IF WE HAVE A CARRY FROM</span><span class="t">A PREVIOUS BIT ({v("C")}<sub class="v">in</sub>)?</span></div>
<div class="pg col" id="bn4"><span class="l"><span class="t">FULL ADDER:</span><span class="q"></span><span class="m">{v("S")} = {v("A")} ⊕ {v("B")} ⊕ {v("C")}<sub class="v">in</sub></span></span><span class="l"><span class="m">{v("C")}<sub class="v">out</sub> = ({v("A")} ⋅ {v("B")}) + ({v("S")}<sub>1</sub> ⋅ {v("C")}<sub class="v">in</sub>)</span></span></div>
<div class="pg" id="bn5"><span class="m">1 + 1 + 1 = 3<sub>10</sub> = 11<sub>2</sub></span><span class="q"></span><span class="m">({v("S")} = 1,</span><span class="m">{v("C")}<sub class="v">out</sub> = 1)</span>{CHECK}</div>
"""

PIN_ICON = (f'<svg width="30" height="38" viewBox="0 0 30 38" overflow="visible"><path d="M15 36 V22 M6 22 H24 L21 8 H9 Z" fill="none" '
            f'stroke="{BLUE}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>')

timeline_js = (ROOT / "scripts" / "timeline.js").read_text()

html = (ROOT / "scripts" / "template.html").read_text()
for key, val in {
    "@@WORLD@@": "\n".join(world),
    "@@DOCK@@": dock_html,
    "@@TABLES@@": table_html,
    "@@BANNER@@": banner_html,
    "@@PIN@@": PIN_ICON,
    "@@WP@@": json.dumps({k: w["pts"] for k, w in WIRES.items()}),
    "@@TIMELINE@@": timeline_js,
}.items():
    assert key in html, key
    html = html.replace(key, val)
import sys
if "--verify" in sys.argv:
    vdir = pathlib.Path(sys.argv[sys.argv.index("--verify") + 1])
    vdir.mkdir(parents=True, exist_ok=True)
    (vdir / "index.html").write_text(html.replace("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js", "assets/gsap.min.js"))
    print("verification variant (local gsap) written to", vdir)
(ROOT / "index.html").write_text(html)
print("index.html written:", len(html), "bytes")
