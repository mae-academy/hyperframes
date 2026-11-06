// Build script: renders every formula with KaTeX (build time), lays out the static DOM,
// checks the maths, and inlines anim.js into a single-file index.html.
//   node build.mjs            -> index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// Layout numbers that depend on glyph widths come from layout.json (written by measure.mjs).
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 21;

// ---------------------------------------------------------------- maths (asserted)
const X = (x) => 150 + (700 / 3) * (x + 1); // domain [-1, 2.3] -> [150, 920]
const Y = (y) => 830 - 46 * y;
const f = Math.exp;
const dnum = (x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h); // numerical derivative
const XS = [0, 1, 2];
const fmt = (v) =>
  Number.isInteger(Math.round(v * 1000) / 1000)
    ? String(Math.round(v))
    : (Math.round(v * 1000) / 1000).toString();
const VAL = XS.map((x) => fmt(f(x))); // "1", "2.718", "7.389"
const SLP = XS.map((x) => fmt(dnum(x)));
(function assertMath() {
  const eq = (a, b, m) => {
    if (a !== b) throw new Error(`ASSERT ${m}: ${a} !== ${b}`);
  };
  eq(VAL.join(), "1,2.718,7.389", "values");
  eq(SLP.join(), "1,2.718,7.389", "slopes (numerical derivative) equal the values");
  // secant quotients shown in the banner
  eq((Math.round(((f(1) - 1) / 1) * 1000) / 1000).toString(), "1.718", "h=1");
  eq((Math.round(((f(0.1) - 1) / 0.1) * 1000) / 1000).toString(), "1.052", "h=0.1");
  // the sensor tip (height = measured slope) lands on the curve to sub-pixel accuracy
  let worst = 0;
  for (let x = -1; x <= 2.3; x += 0.01) worst = Math.max(worst, Math.abs(Y(dnum(x)) - Y(f(x))));
  if (worst > 0.05) throw new Error("slope curve deviates from f by " + worst + " px");
  console.log("maths ok  (max |slope tip - curve| =", worst.toFixed(4), "px)");
})();

// ---------------------------------------------------------------- helpers
const tx = (s) => {
  try {
    return katex.renderToString(s, { throwOnError: true, output: "html", strict: "error" });
  } catch (e) {
    throw new Error("KaTeX failed on: " + s + "  ->  " + String(e.message).slice(0, 200));
  }
};
const col = (c, s) => `\\textcolor{${c}}{${s}}`;
const it = (s) => `\\textit{${s}}`;
let L = {};
try {
  L = JSON.parse(fs.readFileSync(new URL("./layout.json", import.meta.url), "utf8"));
} catch {
  L = {};
}
const M = (k) => L[k] || { cx: 0, cy: 0, w: 100, h: 40 };

/** absolutely placed, centred box; (cx, cy) in canvas coordinates */
function box({ id, cx, cy, w, h, size, color, html, cls = "", m = false, style = "" }) {
  return `<div ${id ? `id="${id}"` : ""} class="t ${cls}" ${m ? `data-m="${id}"` : ""} style="left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;font-size:${size}px;color:${color};${style}">${html}</div>`;
}
const BOLT = (c = C.red, s = 30) =>
  `<svg class="bolt" width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M13.5 1 4 14h6.5L9.5 23 20 9.5h-6.8z" fill="${c}"/></svg>`;
const BOOKMARK = `<svg width="34" height="44" viewBox="0 0 24 32" style="margin-left:14px"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;

// ---------------------------------------------------------------- header
const header = `
${box({ id: "h-title", cx: 540, cy: 180, w: 960, h: 90, size: 58, color: C.red, html: tx(it("THE ") + "e^{x}\\," + it("TRICK")), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 262, w: 960, h: 56, size: 34, color: C.purple, html: tx(it("SLOPE = HEIGHT, AT EVERY POINT")) })}`;

// ---------------------------------------------------------------- plate (zone 2)
const gridLines = [];
for (const x of [-1, 0, 1, 2])
  gridLines.push(`<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="372" class="gl"/>`);
for (const y of [2, 4, 6, 8])
  gridLines.push(`<line x1="150" y1="${Y(y)}" x2="948" y2="${Y(y)}" class="gl"/>`);
const curvePts = [];
for (let x = -1; x <= 2.3001; x += 0.02) curvePts.push(`${X(x).toFixed(2)},${Y(f(x)).toFixed(2)}`);
const curveD = "M" + curvePts.join("L");

const tangents = XS.map((x0) => {
  const u = 0.3;
  const s = f(x0);
  return {
    x1: X(x0 - u),
    y1: Y(f(x0) - s * u),
    x2: X(x0 + u),
    y2: Y(f(x0) + s * u),
    px: X(x0),
    py: Y(f(x0)),
  };
});

const axisLabels = [-1, 0, 1, 2]
  .map((v) =>
    box({
      cx: X(v),
      cy: 860,
      w: 60,
      h: 30,
      size: 24,
      color: "rgba(255,255,255,.6)",
      html: tx(String(v)),
    }),
  )
  .concat(
    [2, 4, 6, 8].map((v) =>
      box({
        cx: 122,
        cy: Y(v),
        w: 40,
        h: 30,
        size: 24,
        color: "rgba(255,255,255,.6)",
        html: tx(String(v)),
      }),
    ),
  )
  .concat([
    box({ cx: 950, cy: 858, w: 40, h: 30, size: 28, color: "rgba(255,255,255,.6)", html: tx("x") }),
  ])
  .join("");

const VLAB = [
  { cx: 315, cy: 742 },
  { cx: 535, cy: 662 },
  { cx: 758, cy: 450 },
];
const SLAB = [
  { cx: 452, cy: 806 },
  { cx: 705, cy: 806 },
  { cx: 767, cy: 806 },
];
const lab = (id, pos, lead, num, color, extra = "") =>
  `<div id="lab_${id}" class="lab" data-layout-allow-overlap style="left:${pos.cx - 110}px;top:${pos.cy - 18}px;width:220px;height:36px;${extra}">${`<span class="lead">${tx(lead)}</span><span class="num" id="o_${id}" data-m="o_${id}" style="color:${color}">${tx(num)}</span>`}</div>`;

const valueLabels = XS.map((x, i) => lab("v" + i, VLAB[i], `f(${x})=\\,`, VAL[i], C.blue)).join("");
const slopeLabels = XS.map((x, i) =>
  lab("s" + i, SLAB[i], `f'(${x})=\\,`, SLP[i], C.purple, "opacity:0;"),
).join("");

// hook card ----------------------------------------------------------------
const EQ = [
  { id: "eq1", tex: "(x^{2})'=2x", cy: 430 },
  { id: "eq2", tex: "(\\sin x)'=\\cos x", cy: 515 },
  { id: "eq3", tex: "(\\ln x)'=1/x", cy: 600 },
];
const eqHtml = EQ.map((e) =>
  box({
    id: e.id,
    cx: 540,
    cy: e.cy,
    w: 700,
    h: 70,
    size: 50,
    color: "rgba(255,255,255,.85)",
    html: tx(e.tex),
    m: true,
  }),
).join("");
const strikes = EQ.map((e, i) => {
  const m = M(e.id);
  const w = Math.max(200, m.w + 56);
  return `<div class="strike" id="strike${i}" style="left:${540 - w / 2}px;top:${e.cy - 3}px;width:${w}px"></div>`;
}).join("");
const hookTxt =
  box({
    cx: 540,
    cy: 703,
    w: 860,
    h: 60,
    size: 42,
    color: C.red,
    html: tx(it("DERIVATIVES ALWAYS")),
  }) +
  box({
    cx: 540,
    cy: 760,
    w: 860,
    h: 60,
    size: 42,
    color: C.red,
    html: tx(it("CHANGE THE FUNCTION? ") + "\\times"),
  });

// shards ---------------------------------------------------------------------
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261106);
const COLS = 6,
  ROWS = 4,
  PX0 = 90,
  PY0 = 340,
  PW = 900,
  PH = 550;
const gv = [];
for (let r = 0; r <= ROWS; r++) {
  gv[r] = [];
  for (let c = 0; c <= COLS; c++) {
    const edgeX = c === 0 || c === COLS,
      edgeY = r === 0 || r === ROWS;
    gv[r][c] = [
      PX0 + (c * PW) / COLS + (edgeX ? 0 : (rnd() - 0.5) * 50),
      PY0 + (r * PH) / ROWS + (edgeY ? 0 : (rnd() - 0.5) * 46),
    ];
  }
}
const shards = [];
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) {
    const a = gv[r][c],
      b = gv[r][c + 1],
      d = gv[r + 1][c],
      e = gv[r + 1][c + 1];
    const tris =
      (r + c) % 2 === 0
        ? [
            [a, b, e],
            [a, e, d],
          ]
        : [
            [a, b, d],
            [b, e, d],
          ];
    for (const t of tris) shards.push(t);
  }
if (shards.length !== 48) throw new Error("expected 48 shards");
const shardSvg = shards
  .map((t) => {
    const cx = (t[0][0] + t[1][0] + t[2][0]) / 3,
      cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    const pts = t.map((p) => `${(p[0] - cx).toFixed(1)},${(p[1] - cy).toFixed(1)}`).join(" ");
    let dx = cx - 540,
      dy = cy - 615;
    const n = Math.hypot(dx, dy) || 1;
    dx /= n;
    dy /= n;
    const ang = Math.atan2(dy, dx) + (rnd() - 0.5) * 0.9;
    const dist = 150 + rnd() * 220;
    const tx2 = Math.cos(ang) * dist,
      ty2 = Math.sin(ang) * dist;
    const rot = (rnd() - 0.5) * 300;
    return `<polygon class="shard" data-cx="${cx.toFixed(1)}" data-cy="${cy.toFixed(1)}" data-dx="${tx2.toFixed(1)}" data-dy="${ty2.toFixed(1)}" data-rot="${rot.toFixed(1)}" points="${pts}"/>`;
  })
  .join("");

const plate = `
<div id="plate"><div id="pc">
  <div id="watermark" class="t" style="left:240px;top:850px;width:600px;height:50px;font-size:40px;color:#fff;opacity:.04">${tx(it("@MAE.Academy"))}</div>
  <svg id="g" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><clipPath id="trace-clip"><rect id="trace-rect" x="140" y="330" width="0" height="560"/></clipPath></defs>
    <g>${gridLines.join("")}</g>
    <line x1="140" y1="${Y(0)}" x2="948" y2="${Y(0)}" class="axis"/>
    <line x1="150" y1="${Y(0)}" x2="150" y2="364" class="axis"/>
    <path id="curve" d="${curveD}" class="curve"/>
    <path id="trace" d="${curveD}" class="trace" clip-path="url(#trace-clip)"/>
    ${tangents
      .map(
        (t, i) =>
          `<line id="bar${i}" class="bar" x1="${t.px}" y1="${Y(0)}" x2="${t.px}" y2="${Y(0)}"/>` +
          (i === 0
            ? ""
            : `<line id="tan${i}" class="tan" x1="${t.px}" y1="${t.py}" x2="${t.px}" y2="${t.py}"/>`),
      )
      .join("")}
    <line id="sec" class="tan" x1="${tangents[0].px}" y1="${tangents[0].py}" x2="${tangents[0].px}" y2="${tangents[0].py}" opacity="0"/>
    <circle id="qdot" class="qdot" cx="${X(1)}" cy="${Y(f(1))}" r="8" opacity="0"/>
    <line id="swb" class="bar sw" x1="${X(-1)}" y1="${Y(0)}" x2="${X(-1)}" y2="${Y(f(-1))}" style="opacity:0"/>
    <circle id="swt" class="swt" cx="${X(-1)}" cy="${Y(f(-1))}" r="9" opacity="0"/>
    ${XS.map((x, i) => `<circle id="node${i}" class="node" cx="${X(x)}" cy="${Y(f(x))}" r="8"/>`).join("")}
    ${[6, 5, 4, 3, 2, 1].map((k) => `<circle class="tail" data-k="${k}" cx="${X(-1)}" cy="${Y(f(-1))}" r="${11 - k}" opacity="0"/>`).join("")}
    <circle id="comet" class="comet" cx="${X(-1)}" cy="${Y(f(-1))}" r="11"/>
  </svg>
  ${axisLabels}
  ${box({ id: "lbl-y", cx: 250, cy: 405, w: 230, h: 52, size: 40, color: C.blue, html: tx("y=e^{x}") })}
  ${box({ id: "lbl-yp", cx: 250, cy: 465, w: 230, h: 52, size: 40, color: C.purple, html: tx("y'=e^{x}"), style: "opacity:0" })}
  ${valueLabels}
  ${slopeLabels}
  <div id="card" data-layout-allow-overlap>
    <div class="cin">${eqHtml}${strikes}${hookTxt}</div>
  </div>
  <svg id="shards" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${shardSvg}</svg>
</div></div>`;

// ---------------------------------------------------------------- banner (zone 3)
const barith = (id, html, extra = "") =>
  `<div id="${id}" class="ba" style="opacity:0">${html}${extra}</div>`;
const slotW = (txt) => 20 + [...txt].reduce((a, ch) => a + (ch === "." ? 9 : 16), 0);
const SLOTTXT = { v0: VAL[0], s0: SLP[0], v1: VAL[1], s1: SLP[1], v2: VAL[2], s2: SLP[2] };
const slot = (id) =>
  `<span class="slot" id="bs_${id}" data-m="bs_${id}" style="width:${slotW(SLOTTXT[id])}px"></span>`;
const btitle = (id, html, on = false) =>
  `<div id="${id}" class="bt" style="opacity:${on ? 1 : 0}">${tx(html)}</div>`;
const B = {
  titles: [
    btitle("T0", it("FIND THE FUNCTION"), true),
    btitle("T1", it("READ THE HEIGHT")),
    btitle("T2", it("SHRINK ") + "h" + it(" - THE LIMIT APPEARS")),
    btitle("T3", it("SAME LIMIT, SO SLOPE = HEIGHT ") + "\\times 1"),
    btitle("T4", it("SWEEP THE SLOPE SENSOR ACROSS EVERY ") + "x"),
    btitle("T5", it("DIFFERENTIATE IT AND NOTHING CHANGES")),
  ].join(""),
  ariths: [
    `<div id="A0" class="ba" style="opacity:1">${tx(it("THAT IS ITS OWN DERIVATIVE "))}${BOLT()}</div>`,
    barith("A1", tx("f(0)=e^{0}=") + slot("v0")),
    barith("A2a", tx("h=1\\;\\Rightarrow\\;(e^{h}-1)/h=1.718")),
    barith("A2b", tx("h=0.1\\;\\Rightarrow\\;(e^{h}-1)/h=1.052")),
    barith("A2c", tx("f'(0)=\\lim_{h\\to0}(e^{h}-1)/h=") + slot("s0")),
    barith("A3", tx("f(1)=e^{1}=") + slot("v1")),
    barith("A4", tx("f'(1)=e^{1}\\cdot1=") + slot("s1")),
    barith("A5", tx("f(2)=e^{2}=") + slot("v2")),
    barith("A6", tx("f'(2)=e^{2}\\cdot1=") + slot("s2")),
    barith("A7", tx("f'(x)=f(x)") + tx(it("\\;\\;FOR EVERY ") + "x")),
    barith("A8", tx("(e^{x})'=e^{x}\\;" + it("[ SLOPE = HEIGHT ]")), BOLT()),
  ].join(""),
};
const banner = `<div id="banner">${B.titles}${B.ariths}</div>`;

// ---------------------------------------------------------------- matrix card (zone 4)
const ROWY = [1180, 1235, 1290];
const CX = { lab: 280, A: 455, eq: 595, B: 735 };
const bracket = (cx) => {
  const x0 = cx - 82,
    x1 = cx + 82,
    y0 = 1148,
    y1 = 1322;
  return `<path d="M${x0 + 16},${y0}H${x0}V${y1}H${x0 + 16}M${x1 - 16},${y0}H${x1}V${y1}H${x1 - 16}" class="br"/>`;
};
const cells = [
  ...XS.map((x, i) =>
    box({
      id: "cell_s" + i,
      cx: CX.A,
      cy: ROWY[i],
      w: 150,
      h: 56,
      size: 42,
      color: C.purple,
      html: tx(SLP[i]),
      cls: "cell",
      m: true,
    }),
  ),
  ...XS.map((x, i) =>
    box({
      id: "cell_v" + i,
      cx: CX.B,
      cy: ROWY[i],
      w: 150,
      h: 56,
      size: 42,
      color: C.blue,
      html: tx(VAL[i]),
      cls: "cell",
      m: true,
    }),
  ),
].join("");
const matrix = `
<div id="mcard"></div>
<svg id="mbr" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bracket(CX.A)}${bracket(CX.B)}</svg>
${box({ id: "m-hs", cx: CX.A, cy: 1104, w: 200, h: 46, size: 36, color: C.purple, html: tx("f'(x)") })}
${box({ id: "m-hv", cx: CX.B, cy: 1104, w: 200, h: 46, size: 36, color: C.blue, html: tx("f(x)") })}
${XS.map((x, i) => box({ cx: CX.lab, cy: ROWY[i], w: 120, h: 50, size: 30, color: "rgba(255,255,255,.6)", html: tx(`x=${x}`) })).join("")}
${box({ id: "m-eq", cx: CX.eq, cy: 1235, w: 80, h: 70, size: 56, color: "rgba(255,255,255,.45)", html: tx("=") })}
${cells}
${box({ id: "m-leg", cx: 540, cy: 1340, w: 740, h: 34, size: 28, color: "rgba(255,255,255,.75)", html: tx(`${col(C.blue, "\\bullet")}${it(" = HEIGHT")}\\quad${col(C.purple, "\\bullet")}${it(" = SLOPE")}\\quad${col(C.red, "\\bullet")}${it(" = IDENTITY")}`) })}`;

// ---------------------------------------------------------------- CTA
const cta = `
<div id="cta">
  ${box({ id: "cta1", cx: 540, cy: 1428, w: 860, h: 60, size: 42, color: C.red, html: tx("\\textbf{SAVE THIS TRICK FOR}"), style: "opacity:0" })}
  <div id="cta2" class="t" style="left:90px;top:1450px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx("\\textbf{YOUR EXAM}")}${BOOKMARK}</div>
  ${box({ id: "cta3", cx: 540, cy: 1546, w: 860, h: 54, size: 31, color: C.blue, html: tx(it("CAN YOU FIND ") + "(2^{x})'" + it(" ?")), style: "opacity:0" })}
  ${box({ id: "cta4", cx: 540, cy: 1594, w: 860, h: 48, size: 31, color: C.blue, html: tx(it("COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
  ${box({ id: "cta5", cx: 540, cy: 1641, w: 860, h: 36, size: 24, color: "rgba(255,255,255,.6)", html: tx(it("MAE ACADEMY ") + "\\cdot" + it(" CALCULUS")), style: "opacity:0" })}
</div>`;

// ---------------------------------------------------------------- clones (flying numbers)
const EV = [
  { id: "v0", color: C.blue, txt: VAL[0] },
  { id: "s0", color: C.purple, txt: SLP[0] },
  { id: "v1", color: C.blue, txt: VAL[1] },
  { id: "s1", color: C.purple, txt: SLP[1] },
  { id: "v2", color: C.blue, txt: VAL[2] },
  { id: "s2", color: C.purple, txt: SLP[2] },
];
const clones = EV.map(
  (e) =>
    `<div class="clone" id="c_${e.id}" style="color:${e.color};text-shadow:0 0 14px ${e.color}">${tx(e.txt)}</div>`,
).join("");

// ---------------------------------------------------------------- css
let kcss = fs.readFileSync(new URL("./vendor/katex/katex.min.css", import.meta.url), "utf8");
kcss = kcss.replace(
  /url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\),url\(fonts\/[^)]+?\.woff\) format\("woff"\),url\(fonts\/[^)]+?\.ttf\) format\("truetype"\)/g,
  'url(assets/fonts/$1.woff2) format("woff2")',
);
if (/fonts\/[^)]*\.(woff|ttf)\b/.test(kcss.replace(/\.woff2/g, "")))
  throw new Error("katex css still references woff/ttf");

const css = `
${kcss}
.katex{font-size:1em !important;text-rendering:geometricPrecision}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:${"#0A0A10"};width:${W}px;height:${H}px;overflow:hidden}
#root{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:#0A0A10;overflow:hidden;
  background-image:linear-gradient(#161622 2px,transparent 2px),linear-gradient(90deg,#161622 2px,transparent 2px);background-size:60px 60px;background-position:0 0}
.t{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1}
#plate{position:absolute;left:90px;top:340px;width:900px;height:550px;border-radius:32px;overflow:hidden;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08);box-sizing:border-box}
#pc{position:absolute;left:-91px;top:-341px;width:${W}px;height:${H}px}
#g,#shards{position:absolute;left:0;top:0}
.gl{stroke:rgba(255,255,255,.06);stroke-width:2}
.axis{stroke:rgba(255,255,255,.4);stroke-width:2.5}
.curve{fill:none;stroke:${C.blue};stroke-width:8;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px ${C.blue})}
.trace{fill:none;stroke:${C.purple};stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px ${C.purple})}
.tan{stroke:${C.purple};stroke-width:4.5;stroke-linecap:round;filter:drop-shadow(0 0 6px ${C.purple})}
.bar{stroke:${C.purple};stroke-width:8;opacity:.9;filter:drop-shadow(0 0 6px ${C.purple})}
.qdot{fill:${C.purple};filter:drop-shadow(0 0 6px ${C.purple})}
.swt{fill:${C.purple};stroke:#fff;stroke-width:2.5;filter:drop-shadow(0 0 8px ${C.purple})}
.node{fill:#fff}
.tail{fill:${C.blue}}
.comet{fill:${C.blue};stroke:#fff;stroke-width:3;filter:drop-shadow(0 0 6px ${C.blue})}
.lab{position:absolute;display:flex;align-items:center;justify-content:center;gap:2px;white-space:nowrap;font-size:24px;color:rgba(255,255,255,.85);line-height:1}
.lab .lead{color:rgba(255,255,255,.85)}
.cin{position:absolute;left:-93px;top:-343px;width:1080px;height:1920px}
#card{position:absolute;left:90px;top:340px;width:900px;height:550px;background:#050509;border:3px solid ${C.red};border-radius:32px;box-sizing:border-box}
.strike{position:absolute;height:6px;background:${C.red};border-radius:3px;box-shadow:0 0 10px rgba(255,0,68,.7)}
.shard{fill:#07070c;stroke:${C.red};stroke-width:2.5;stroke-linejoin:round;opacity:0}
#shards{pointer-events:none}
#banner{position:absolute;left:130px;top:920px;width:820px;height:120px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55);box-sizing:border-box}
.bt{position:absolute;left:0;top:10px;width:816px;height:40px;display:flex;align-items:center;justify-content:center;font-size:28px;color:${C.red};white-space:nowrap}
.ba{position:absolute;left:0;top:56px;width:816px;height:52px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;white-space:nowrap;gap:0}
.bolt{margin-left:8px;filter:drop-shadow(0 0 6px ${C.red})}
.slot{display:inline-block;height:44px}
#mcard{position:absolute;left:150px;top:1060px;width:780px;height:300px;border-radius:30px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1);box-sizing:border-box}
#mbr{position:absolute;left:0;top:0;pointer-events:none}
.br{fill:none;stroke:rgba(255,255,255,.55);stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round}
.cell{opacity:0}
#cta{position:absolute;left:0;top:0;width:${W}px;height:${H}px;opacity:0}
#cta-panel{position:absolute;left:90px;top:1376px;width:900px;height:290px;border-radius:36px;background:rgba(30,30,46,.55);border:2px solid rgba(255,0,68,.5);opacity:0;box-sizing:border-box}
.clone{position:absolute;left:0;top:0;display:none;font-size:24px;line-height:1;white-space:nowrap;z-index:50}
`;

// ---------------------------------------------------------------- inline animation script
const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = { X: { x0: 150, k: 700 / 3 }, Y: { y0: 830, k: 46 }, tangents, VAL, SLP };

function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>The e^x Trick</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
${plate}
${banner}
${matrix}
<div id="cta-panel"></div>
${cta}
<div id="overlay">${clones}</div>
<audio id="sfx" class="clip" src="assets/sfx.wav" data-start="0" data-duration="${DUR}" data-track-index="2" data-volume="1"></audio>
</div>
<script src="${gsapSrc}"></script>
<script>
window.__LAYOUT = ${JSON.stringify(L)};
window.__CFG = ${JSON.stringify(CFG)};
${anim}
</script>
</body>
</html>
`;
}
fs.writeFileSync(
  new URL("./index.html", import.meta.url),
  page("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
);
fs.mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("./dist/index.html", import.meta.url), page("vendor/gsap/gsap.min.js"));
console.log("built index.html + dist/index.html");
