// BLOCK DIAGRAM REDUCTION: eight blocks into one transfer function (46.0 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const DIM = "rgba(255,255,255,.6)";
const W = 1080,
  H = 1920,
  DUR = 46;

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (Math.abs(a - b) > tol * Math.max(1, Math.abs(b))) throw new Error(`${what}: ${a} vs ${b}`);
  };
  let seed = 7;
  const rr = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 1.8 + 0.3;
  for (let trial = 0; trial < 50; trial++) {
    const [G1, G2, G3, G4, G5, G6, G7, G8] = Array.from({ length: 8 }, rr);
    // node equations of the figure; unknowns P (after sum B), D (sum D), Y (after sum E), C
    const A = [
      [1, G1, 0, -G8],
      [-G2, 1, -G5, 0],
      [-(G3 + G4), 0, 1, G6],
      [0, 0, -G7, 1],
    ];
    const b = [G1, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      let p = i;
      for (let r = i + 1; r < 4; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
      [A[i], A[p]] = [A[p], A[i]];
      [b[i], b[p]] = [b[p], b[i]];
      for (let r = i + 1; r < 4; r++) {
        const f = A[r][i] / A[i][i];
        for (let c = i; c < 4; c++) A[r][c] -= f * A[i][c];
        b[r] -= f * b[i];
      }
    }
    const x = [0, 0, 0, 0];
    for (let i = 3; i >= 0; i--) {
      let s = b[i];
      for (let c = i + 1; c < 4; c++) s -= A[i][c] * x[c];
      x[i] = s / A[i][i];
    }
    const Cdirect = x[3];
    const N = G3 + G4,
      Hh = 1 + G6 * G7;
    const GL = G7 / Hh; // rule 3
    const Gf = N * GL; // rule 4
    const Ga = G2 + (G5 / G7) * Gf; // rules 2 + 1: G5/G7 moved back past Gf is G5 N / H
    near((G5 / G7) * Gf, (G5 * N) / Hh, 1e-12, "take-off moved back");
    const Tsteps = (G1 * Gf) / (1 + G1 * Ga - G8 * Gf);
    const Tclosed = (G1 * G7 * N) / ((1 + G1 * G2) * Hh + (G1 * G5 - G7 * G8) * N);
    near(Tsteps, Cdirect, 1e-9, "reduction steps vs node equations");
    near(Tclosed, Cdirect, 1e-9, "closed form vs node equations");
  }
  console.log(
    "maths ok: 50 random gain sets, the six-step reduction and the closed form both equal the direct solve of the four node equations",
  );
})();

// ------------------------------------------------------------------ helpers
const tx = (s) => {
  try {
    return katex.renderToString(s, { throwOnError: true, output: "html", strict: "error" });
  } catch (e) {
    throw new Error("KaTeX failed on: " + s + " -> " + String(e.message).slice(0, 200));
  }
};
const it = (s) => `\\textit{${s}}`;
let L = {};
try {
  L = JSON.parse(fs.readFileSync(new URL("./layout.json", import.meta.url), "utf8"));
} catch {
  L = {};
}
function box({ id, cx, cy, w, h, size, color, html, cls = "", m = false, style = "" }) {
  return `<div ${id ? `id="${id}"` : ""} class="t ${cls}" ${m ? `data-m="${id}"` : ""} style="left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;font-size:${size}px;color:${color};${style}">${html}</div>`;
}
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261108);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ the diagram as data: eight states, every element has a lifetime [from, to]
const DY = 45;
const Y = (y) => y + DY;
const EL = []; // {id, from, to, blk?, cx, cy}
const svgParts = [],
  htmlParts = [];
const init = (from) => (from > 0 ? "opacity:0;" : "");
const reg = (id, from, to, extra = {}) => EL.push({ id, from, to, ...extra });
function wire(id, from, to, pts, arrow = false) {
  const P = pts.map(([x, y]) => [x, Y(y)]);
  const d = "M" + P.map((p) => p.join(",")).join("L");
  let head = "";
  if (arrow) {
    const [x1, y1] = P[P.length - 2],
      [x2, y2] = P[P.length - 1];
    const l = Math.hypot(x2 - x1, y2 - y1),
      dx = (x2 - x1) / l,
      dy = (y2 - y1) / l;
    const bx = x2 - 15 * dx,
      by = y2 - 15 * dy;
    head = `<polygon points="${x2},${y2} ${(bx - 7.5 * dy).toFixed(1)},${(by + 7.5 * dx).toFixed(1)} ${(bx + 7.5 * dy).toFixed(1)},${(by - 7.5 * dx).toFixed(1)}" class="ah"/>`;
  }
  svgParts.push(`<g id="${id}" style="${init(from)}"><path d="${d}" class="wp"/>${head}</g>`);
  reg(id, from, to);
}
function dot(id, from, to, x, y) {
  svgParts.push(
    `<circle id="${id}" cx="${x}" cy="${Y(y)}" r="6.5" class="dt" style="${init(from)}"/>`,
  );
  reg(id, from, to);
}
function sum(id, from, to, x, y) {
  const cy = Y(y);
  svgParts.push(
    `<g id="${id}" style="${init(from)}"><circle cx="${x}" cy="${cy}" r="22" class="sm"/><path d="M${x - 15.5},${cy - 15.5}L${x + 15.5},${cy + 15.5}M${x + 15.5},${cy - 15.5}L${x - 15.5},${cy + 15.5}" class="wp"/></g>`,
  );
  reg(id, from, to);
}
function txt(id, from, to, cx, cy, tex, size = 26, color = C.white, w = 120) {
  htmlParts.push(
    box({ id, cx, cy: Y(cy), w, h: 40, size, color, html: tx(tex), style: init(from) }),
  );
  reg(id, from, to);
}
function blk(id, from, to, cx, cy, w, h, tex, size = 36, o = {}) {
  htmlParts.push(
    `<div id="${id}" class="blk" style="left:${cx - w / 2}px;top:${Y(cy) - h / 2}px;width:${w}px;height:${h}px;font-size:${size}px;${init(from)}">${tx(tex)}</div>`,
  );
  reg(id, from, to, { blk: true, cx, cy: Y(cy), ...o });
}
const y1 = 506,
  y2 = 605,
  y3 = 674,
  y4 = 758,
  yT = 400,
  XO = 885;
const mid1 = [535, y1]; // the G3 + G4 block
const midL = [795, y2]; // the closed G7 / (1 + G6 G7) block
const tgt = (p) => [p[0], Y(p[1])];

// ---- states 0 - 3: the original figure, simplified in place
txt("tR", 0, 3, 112, y1, "R(s)", 32, C.white, 100);
wire(
  "wR",
  0,
  3,
  [
    [152, y1],
    [193, y1],
  ],
  true,
);
sum("sA", 0, 3, 215, y1);
txt("sgA1", 0, 3, 190, y1 - 28, "+", 26, C.white, 30);
txt("sgA2", 0, 3, 240, y1 + 34, "-", 26, C.white, 30);
wire(
  "wAG1",
  0,
  3,
  [
    [237, y1],
    [271, y1],
  ],
  true,
);
blk("g1", 0, 3, 316, y1, 90, 56, "G_1");
wire(
  "wG1B",
  0,
  3,
  [
    [361, y1],
    [393, y1],
  ],
  true,
);
sum("sB", 0, 3, 415, y1);
txt("sgB1", 0, 3, 386, y1 - 28, "+", 26, C.white, 30);
txt("sgB2", 0, 3, 440, y1 - 40, "+", 26, C.white, 30);
dot("dp", 0, 3, 453, y1);
// state 0 only
wire(
  "wBG3",
  0,
  0,
  [
    [437, y1],
    [484, y1],
  ],
  true,
);
blk("g3", 0, 0, 529, y1, 90, 56, "G_3", 36, { mergeTo: tgt(mid1) });
blk("g4", 0, 0, 529, y3, 90, 56, "G_4", 36, { mergeTo: tgt(mid1) });
wire(
  "wG3C",
  0,
  0,
  [
    [574, y1],
    [600, y1],
    [600, y2 - 22],
  ],
  true,
);
wire(
  "wG4C",
  0,
  0,
  [
    [574, y3],
    [600, y3],
    [600, y2 + 22],
  ],
  true,
);
wire("wpq", 0, 0, [
  [453, y1],
  [453, y3],
]);
dot("dq", 0, 0, 453, y3);
wire(
  "wqG4",
  0,
  0,
  [
    [453, y3],
    [484, y3],
  ],
  true,
);
wire(
  "wqG2",
  0,
  0,
  [
    [453, y3],
    [361, y3],
  ],
  true,
);
sum("sC", 0, 0, 600, y2);
txt("sgC1", 0, 0, 578, y2 - 36, "+", 26, C.white, 30);
txt("sgC2", 0, 0, 578, y2 + 38, "+", 26, C.white, 30);
wire(
  "wCE",
  0,
  0,
  [
    [622, y2],
    [667, y2],
  ],
  true,
);
// states 1 - 3: G3 and G4 combined
blk("g34", 1, 3, mid1[0], mid1[1], 130, 56, "G_3+G_4", 30, { mergeTo: tgt([610, 520]) });
wire(
  "wBG34",
  1,
  3,
  [
    [437, y1],
    [475, y1],
  ],
  true,
);
wire(
  "wpG2",
  1,
  3,
  [
    [453, y1],
    [453, y3],
    [361, y3],
  ],
  true,
);
wire(
  "wG34E",
  1,
  2,
  [
    [595, y1],
    [620, y1],
    [620, y2],
    [667, y2],
  ],
  true,
);
wire(
  "wG34L",
  3,
  3,
  [
    [595, y1],
    [620, y1],
    [620, y2],
    [720, y2],
  ],
  true,
);
// sum E, G6, G7 (states 0 - 2)
sum("sE", 0, 2, 689, y2);
txt("sgE1", 0, 2, 662, y2 + 36, "+", 26, C.white, 30);
txt("sgE2", 0, 2, 714, y2 - 40, "-", 26, C.white, 30);
wire("wEr", 0, 1, [
  [711, y2],
  [728, y2],
]);
dot("dr", 0, 1, 728, y2);
wire(
  "wrG7",
  0,
  1,
  [
    [728, y2],
    [747, y2],
  ],
  true,
);
wire(
  "wEG7",
  2,
  2,
  [
    [711, y2],
    [747, y2],
  ],
  true,
);
blk("g7", 0, 2, 792, y2, 90, 56, "G_7", 36, { mergeTo: tgt(midL) });
blk("g6", 0, 2, 792, y1, 90, 56, "G_6", 36, { mergeTo: tgt(midL) });
wire("wG7o", 0, 2, [
  [837, y2],
  [XO, y2],
]);
blk("gl", 3, 3, midL[0], midL[1], 150, 96, "\\dfrac{G_7}{1+G_6G_7}", 28, {
  mergeTo: tgt([610, 520]),
});
wire("wGLo", 3, 3, [
  [870, y2],
  [XO, y2],
]);
dot("dout", 0, 3, XO, y2);
wire(
  "wC",
  0,
  3,
  [
    [XO, y2],
    [905, y2],
  ],
  true,
);
txt("tC", 0, 3, 945, y2, "C(s)", 32, C.white, 100);
dot("d6", 0, 2, XO, y1);
wire(
  "wo6",
  0,
  2,
  [
    [XO, y1],
    [837, y1],
  ],
  true,
);
wire(
  "wG6E",
  0,
  2,
  [
    [747, y1],
    [689, y1],
    [689, y2 - 22],
  ],
  true,
);
wire(
  "wo8",
  0,
  3,
  [
    [XO, y2],
    [XO, yT],
    [686, yT],
  ],
  true,
);
blk("g8", 0, 3, 641, yT, 90, 56, "G_8", 36);
wire(
  "wG8B",
  0,
  3,
  [
    [596, yT],
    [415, yT],
    [415, y1 - 22],
  ],
  true,
);
sum("sD", 0, 3, 215, y3);
txt("sgD1", 0, 3, 262, y3 - 28, "+", 26, C.white, 30);
txt("sgD2", 0, 3, 240, y3 + 36, "+", 26, C.white, 30);
wire(
  "wDA",
  0,
  3,
  [
    [215, y3 - 22],
    [215, y1 + 22],
  ],
  true,
);
blk("g2", 0, 3, 316, y3, 90, 56, "G_2", 36);
wire(
  "wG2D",
  0,
  3,
  [
    [271, y3],
    [237, y3],
  ],
  true,
);
blk("g5", 0, 1, 523, y4, 90, 56, "G_5", 36, { mergeTo: [523, Y(y4)] });
wire(
  "wr5",
  0,
  1,
  [
    [728, y2],
    [728, y4],
    [568, y4],
  ],
  true,
);
blk("g5r", 2, 3, 523, y4, 120, 92, "\\dfrac{G_5}{G_7}", 30);
wire(
  "wo5",
  2,
  3,
  [
    [XO, y2],
    [XO, y4],
    [583, y4],
  ],
  true,
);
wire(
  "wG5D",
  0,
  3,
  [
    [478, y4],
    [215, y4],
    [215, y3 + 22],
  ],
  true,
);

// ---- states 4 - 7: the tidy layout (rows: main 520, G8 420, G2 640, G5 740)
const yM = 520,
  yG8 = 420,
  yG2 = 640,
  yG5 = 740,
  XQ = 790;
const GfPos = [610, yM];
txt("tR4", 4, 7, 112, yM, "R(s)", 32, C.white, 100);
txt("tC4", 4, 7, 880, yM, "C(s)", 32, C.white, 100);
wire(
  "wR4",
  4,
  6,
  [
    [152, yM],
    [193, yM],
  ],
  true,
);
sum("sA4", 4, 6, 215, yM);
txt("sgA14", 4, 6, 190, yM - 28, "+", 26, C.white, 30);
txt("sgA24", 4, 6, 240, yM + 34, "-", 26, C.white, 30);
wire(
  "wAG14",
  4,
  6,
  [
    [237, yM],
    [275, yM],
  ],
  true,
);
blk("g1b", 4, 6, 320, yM, 90, 56, "G_1", 36, { mergeTo: tgt([540, yM]) });
wire(
  "wG1B4",
  4,
  6,
  [
    [365, yM],
    [403, yM],
  ],
  true,
);
sum("sB4", 4, 6, 425, yM);
txt("sgB14", 4, 6, 396, yM - 28, "+", 26, C.white, 30);
txt("sgB24", 4, 6, 450, yM - 40, "+", 26, C.white, 30);
wire(
  "wBGf",
  4,
  6,
  [
    [447, yM],
    [565, yM],
  ],
  true,
);
dot("dp4", 4, 6, 480, yM);
blk("gf", 4, 6, GfPos[0], GfPos[1], 90, 56, "G_f", 36, { mergeTo: tgt([540, yM]) });
wire("wGfo", 4, 6, [
  [655, yM],
  [XQ, yM],
]);
dot("dout4", 4, 6, XQ, yM);
wire(
  "wC4",
  4,
  6,
  [
    [XQ, yM],
    [840, yM],
  ],
  true,
);
wire(
  "wo84",
  4,
  6,
  [
    [XQ, yM],
    [XQ, yG8],
    [655, yG8],
  ],
  true,
);
blk("g8b", 4, 6, 610, yG8, 90, 56, "G_8", 36, { mergeTo: tgt([540, yM]) });
wire(
  "wG8B4",
  4,
  6,
  [
    [565, yG8],
    [425, yG8],
    [425, yM - 22],
  ],
  true,
);
// the G2 branch from p (states 4 - 6, in 6 it ends in G_a instead of G_2)
wire(
  "wpG24",
  4,
  6,
  [
    [480, yM],
    [480, yG2],
    [365, yG2],
  ],
  true,
);
blk("g2b", 4, 5, 320, yG2, 90, 56, "G_2", 36, { mergeTo: tgt([320, yG2]) });
wire(
  "wG2D4",
  4,
  5,
  [
    [275, yG2],
    [237, yG2],
  ],
  true,
);
sum("sD4", 4, 5, 215, yG2);
txt("sgD14", 4, 5, 262, yG2 - 28, "+", 26, C.white, 30);
txt("sgD24", 4, 5, 240, yG2 + 36, "+", 26, C.white, 30);
wire(
  "wDA4",
  4,
  5,
  [
    [215, yG2 - 22],
    [215, yM + 22],
  ],
  true,
);
// state 4: G5 / G7 hangs on the output
blk("g57b", 4, 4, 500, yG5, 120, 92, "\\dfrac{G_5}{G_7}", 30, { mergeTo: [330, Y(yG5)] });
wire(
  "wo54",
  4,
  4,
  [
    [XQ, yM],
    [XQ, yG5],
    [560, yG5],
  ],
  true,
);
wire(
  "wG5D4",
  4,
  4,
  [
    [440, yG5],
    [215, yG5],
    [215, yG2 + 22],
  ],
  true,
);
// state 5: the take-off moved back to p
dot("dtap", 5, 5, 480, yG2);
blk("g5n", 5, 5, 330, yG5, 220, 92, "\\dfrac{G_5(G_3+G_4)}{1+G_6G_7}", 24, {
  mergeTo: tgt([320, yG2]),
});
wire(
  "wtr5",
  5,
  5,
  [
    [480, yG2],
    [480, yG5],
    [435, yG5],
  ],
  true,
);
wire(
  "wG5D5",
  5,
  5,
  [
    [225, yG5],
    [215, yG5],
    [215, yG2 + 22],
  ],
  true,
);
// state 6: G_a replaces both
blk("ga", 6, 6, 320, yG2, 90, 56, "G_a", 36, { mergeTo: tgt([540, yM]) });
wire(
  "wGaA",
  6,
  6,
  [
    [275, yG2],
    [215, yG2],
    [215, yM + 22],
  ],
  true,
);
// state 7: one block
blk("gT", 7, 7, 540, yM, 230, 110, "T(s)", 44);
wire(
  "wRT",
  7,
  7,
  [
    [152, yM],
    [425, yM],
  ],
  true,
);
wire(
  "wTC",
  7,
  7,
  [
    [655, yM],
    [840, yM],
  ],
  true,
);

// ------------------------------------------------------------------ counter chip (stacked values)
const COUNT = [8, 7, 7, 6, 5, 5, 4, 1];
const chip = `<div id="chip" style="position:absolute;left:112px;top:358px;width:330px;height:66px;border-radius:22px;background:rgba(10,10,16,.88);border:2px solid rgba(255,0,68,.55)">
${COUNT.map((n, i) => box({ id: "n" + i, cx: 165, cy: 33, w: 330, h: 60, size: 42, color: C.blue, html: tx(it("BLOCKS") + `\\,=\\,${n}`), style: i ? "opacity:0" : "" })).join("")}</div>`;

// ------------------------------------------------------------------ header + hook panel + ledger
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1000, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{BLOCK DIAGRAM REDUCTION}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("EIGHT BLOCKS, SIX MOVES")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 700, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;

const HK = [
  ["hk1", "P=G_1(R-D)+G_8C"],
  ["hk2", "D=G_2P+G_5Y"],
  ["hk3", "Y=(G_3+G_4)P-G_6C"],
  ["hk4", "C=G_7Y"],
];
const hookRows = HK.map(([id, t], i) => {
  const cy = 1010 + i * 82;
  const w = (L[id] && L[id].w) || 420;
  return `${box({ id, cx: 540, cy, w: 860, h: 70, size: 46, color: C.white, html: tx(t), m: true })}
<div class="strike" style="left:${540 - w / 2 - 24}px;top:${cy - 3}px;width:${w + 48}px"></div>`;
}).join("\n");
const hook = `<div id="hook">${hookRows}
${box({ id: "hkcap", cx: 540, cy: 1360, w: 860, h: 44, size: 32, color: DIM, html: tx(it("4 EQUATIONS, 4 UNKNOWNS, 1 HEADACHE")) })}</div>`;

const LEDGER = [
  ["f1", "G_3\\parallel G_4\\;\\Rightarrow\\;G_3+G_4"],
  ["f2", "G_5\\;\\to\\;\\tfrac{G_5}{G_7}"],
  ["f3", "G_7,\\,G_6\\;\\Rightarrow\\;\\tfrac{G_7}{1+G_6G_7}"],
  ["f4", "G_f=(G_3+G_4)\\,\\tfrac{G_7}{1+G_6G_7}"],
  ["f5", "\\tfrac{G_5}{G_7}\\,G_f=\\tfrac{G_5(G_3+G_4)}{1+G_6G_7}"],
  ["f6", "G_a=G_2+\\tfrac{G_5(G_3+G_4)}{1+G_6G_7}"],
];
const ledger = LEDGER.map(([id, t], i) =>
  box({
    id,
    cx: 540,
    cy: 985 + i * 70,
    w: 860,
    h: 66,
    size: 40,
    color: C.white,
    html: tx(t),
    m: true,
    style: "opacity:0",
  }),
).join("\n");
const FIN = "\\dfrac{C}{R}=\\dfrac{G_1G_7(G_3+G_4)}{(1+G_1G_2)(1+G_6G_7)+(G_1G_5-G_7G_8)(G_3+G_4)}";
const closure = [
  box({
    id: "clos",
    cx: 540,
    cy: 1030,
    w: 860,
    h: 120,
    size: 52,
    color: C.blue,
    html: tx("\\dfrac{C}{R}=\\dfrac{G_1G_f}{1+G_1G_a-G_8G_f}"),
    m: true,
    style: "opacity:0",
  }),
  box({
    id: "closcap",
    cx: 540,
    cy: 1130,
    w: 860,
    h: 44,
    size: 32,
    color: DIM,
    html: tx(it("SUBSTITUTE ") + "G_f" + it(" AND ") + "G_a"),
    style: "opacity:0",
  }),
].join("\n");
const RES = { cx: 540, cy: 1250, w: 880, h: 190 };
const result = `
<div id="glow" style="position:absolute;left:${RES.cx - 440}px;top:${RES.cy - 200}px;width:880px;height:400px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
${box({ id: "fin", cx: RES.cx, cy: RES.cy, w: 860, h: 170, size: 33, color: C.blue, html: tx(FIN), m: true, style: "opacity:0;z-index:2" })}
<svg id="resfx" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" data-layout-ignore>
  <rect id="resbox" x="${RES.cx - RES.w / 2}" y="${RES.cy - RES.h / 2}" width="${RES.w}" height="${RES.h}" rx="26" fill="none" stroke="${C.blue}" stroke-width="5" stroke-dasharray="${2 * (RES.w + RES.h)}" stroke-dashoffset="${2 * (RES.w + RES.h)}" opacity="0" style="filter:drop-shadow(0 0 10px ${C.blue})"/>
  <line id="sweep" x1="0" y1="${RES.cy - RES.h / 2 - 8}" x2="0" y2="${RES.cy + RES.h / 2 + 8}" stroke="${C.purple}" stroke-width="6" stroke-linecap="round" opacity="0" style="filter:drop-shadow(0 0 10px ${C.purple})"/>
  <circle id="ringL1" cx="${RES.cx}" cy="${RES.cy}" r="10" fill="none" stroke="${C.purple}" stroke-width="5" opacity="0"/>
  <circle id="ringL2" cx="${RES.cx}" cy="${RES.cy}" r="10" fill="none" stroke="${C.red}" stroke-width="4" opacity="0"/>
  ${[
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]
    .map(
      ([sx, sy], i) =>
        `<g id="gl${i}" opacity="0" transform="translate(${RES.cx + (sx * RES.w) / 2},${RES.cy + (sy * RES.h) / 2})"><path d="M-16 0H16M0 -16V16" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`,
    )
    .join("")}
  ${Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * 2 * Math.PI + rnd() * 0.3;
    return `<circle id="sk${i}" data-a="${a.toFixed(3)}" data-d="${(120 + rnd() * 150).toFixed(1)}" cx="${RES.cx}" cy="${RES.cy}" r="${(3 + rnd() * 3).toFixed(1)}" fill="${[C.white, C.red, C.purple][i % 3]}" opacity="0"/>`;
  }).join("")}
  <path id="check" d="M${RES.cx + RES.w / 2 - 70} ${RES.cy - RES.h / 2 - 34} l22 24 l44 -50" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="120" stroke-dashoffset="120" opacity="0" style="filter:drop-shadow(0 0 10px ${C.purple})"/>
</svg>`;
const panel = `<div id="pnl"></div>
${hook}
${ledger}
${closure}
${result}`;

// ------------------------------------------------------------------ banners
const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("8 BLOCKS, 4 SUMMING POINTS"), it("HOW MANY LINES OF ALGEBRA?"), 1),
  bn("bnH", it("FORGET THE EQUATIONS"), it("REDUCE THE PICTURE INSTEAD"), 0),
  bn("bn1", it("RULE 1: PARALLEL BLOCKS"), it("THEY ADD"), 0),
  bn("bn2", it("RULE 2: TAKE-OFF POINT PAST A BLOCK"), it("DIVIDE BY THAT BLOCK"), 0),
  bn("bn3", it("RULE 3: NEGATIVE FEEDBACK LOOP"), it("FORWARD OVER 1 + LOOP GAIN"), 0),
  bn("bn4", it("RULE 4: SERIES BLOCKS"), it("THEY MULTIPLY"), 0),
  bn("bn5", it("RULE 2 AGAIN: TAKE-OFF POINT BACK"), it("MULTIPLY BY THAT BLOCK"), 0),
  bn("bn6", it("RULE 1 AGAIN: PARALLEL BLOCKS"), it("THEY ADD"), 0),
  bn("bn7", it("CLOSE THE LAST TWO LOOPS"), it("ONE TRANSFER FUNCTION"), 0),
  bn("bnF", it("8 BLOCKS GONE IN 6 MOVES"), it("ZERO SIMULTANEOUS EQUATIONS"), 0),
];
const banner = `<div id="banner">${banners.join("\n")}</div>`;

// ------------------------------------------------------------------ CTA
const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS SHORTCUT"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 98, w: 860, h: 52, size: 35, color: C.blue, html: tx(it("WHICH RULE DO YOU FORGET MOST?")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 148, w: 860, h: 44, size: 32, color: C.blue, html: tx(it("COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:176px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;

// ------------------------------------------------------------------ plate + guards
const plate = `<div id="plate"></div>
<div id="dgw">
<svg id="dg" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible">${svgParts.join("")}<circle id="tapd" cx="728" cy="${Y(y2)}" r="9" fill="#fff" stroke="${C.red}" stroke-width="4" opacity="0"/></svg>
${htmlParts.join("\n")}
</div>
${chip}`;

const allHtml = [header, plate, panel, banner, card].join("");
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(allHtml))
  throw new Error("upright / bold math style found");
const boldCount = (allHtml.match(/class="[^"]*\btextbf\b/g) || []).length;
if (boldCount !== 1)
  throw new Error("expected exactly one \\textbf (the header title), found " + boldCount);
if (Object.keys(L).length) {
  for (const k of [...LEDGER.map((l) => l[0]), "clos", "fin", "hk1", "hk2", "hk3", "hk4"]) {
    if (L[k] && L[k].w > 860) throw new Error(`${k} is ${L[k].w}px wide, limit 860`);
  }
  console.log("layout ok: every measured formula fits its limit");
}
console.log("typography ok: no \\mathbf / \\mathrm / upright math; one \\textbf (title only)");
if (EL.some((e) => e.to < e.from)) throw new Error("element lifetime inverted");

// the sound follows the block count: merge times are fixed in anim.js (ST + 1.2 s)
const ST = [0, 4.8, 9.4, 14.0, 18.6, 23.2, 27.8, 32.4];
fs.mkdirSync(new URL("./assets/", import.meta.url), { recursive: true });
fs.writeFileSync(
  new URL("./assets/sched.json", import.meta.url),
  JSON.stringify({
    merges: ST.slice(1).map((s, i) => [Math.round((s + 1.2) * 1000) / 1000, COUNT[i + 1]]),
    initial: COUNT[0],
  }),
);

// ------------------------------------------------------------------ css
let kcss = fs.readFileSync(new URL("./vendor/katex/katex.min.css", import.meta.url), "utf8");
kcss = kcss.replace(
  /url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\),url\(fonts\/[^)]+?\.woff\) format\("woff"\),url\(fonts\/[^)]+?\.ttf\) format\("truetype"\)/g,
  'url(assets/fonts/$1.woff2) format("woff2")',
);
const css = `
${kcss}
.katex{font-size:1em !important;text-rendering:geometricPrecision}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#0A0A10;width:${W}px;height:${H}px;overflow:hidden}
#root{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:#0A0A10;overflow:hidden;
  background-image:linear-gradient(#161622 2px,transparent 2px),linear-gradient(90deg,#161622 2px,transparent 2px);background-size:60px 60px}
#flash0{position:absolute;left:0;top:0;width:${W}px;height:700px;background:radial-gradient(ellipse at 50% 22%,rgba(255,0,68,.5),transparent 65%);opacity:0}
.t{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1}
#plate{position:absolute;left:90px;top:340px;width:900px;height:580px;border-radius:32px;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08)}
#dgw{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:540px 640px}
.wp{fill:none;stroke:rgba(255,255,255,.78);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}
.ah{fill:rgba(255,255,255,.9)}
.dt{fill:#fff}
.sm{fill:rgba(10,10,16,.92);stroke:rgba(255,255,255,.78);stroke-width:3}
.blk{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;color:#fff;border:3px solid rgba(255,255,255,.7);border-radius:12px;background:rgba(10,10,16,.94)}
#pnl{position:absolute;left:90px;top:940px;width:900px;height:460px;border-radius:32px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1)}
.strike{position:absolute;height:6px;border-radius:3px;background:${C.red};box-shadow:0 0 14px rgba(255,0,68,.7);transform:rotate(-1.2deg)}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:26px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:38px;color:${C.red};line-height:1.15;margin-top:2px}
#card{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:2px solid rgba(255,0,68,.5);overflow:hidden}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = { el: EL, ST, count: COUNT, res: RES, tap: { x0: 728, x1: XO, y: Y(y2) } };
function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>Block Diagram Reduction</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
${plate}
${panel}
${banner}
${card}
<audio id="sfx" class="clip" src="assets/sfx.wav" data-start="0" data-duration="${DUR}" data-track-index="2" data-volume="1"></audio>
</div>
<script src="${gsapSrc}"></script>
<script>
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
fs.cpSync(
  new URL("./vendor/gsap/", import.meta.url),
  new URL("./dist/vendor/gsap/", import.meta.url),
  { recursive: true },
);
fs.cpSync(new URL("./assets/", import.meta.url), new URL("./dist/assets/", import.meta.url), {
  recursive: true,
});
console.log("built index.html + dist/ (vendored GSAP, fonts, assets)");
