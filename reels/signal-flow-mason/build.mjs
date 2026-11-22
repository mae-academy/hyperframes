// SIGNAL FLOW GRAPHS AND MASON'S GAIN FORMULA (24.0 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// The graph is solved two ways at build time (Gaussian elimination of the node equations, and Mason's rule on the loops and paths that
// are enumerated from the graph itself); the page draws the graph, the paths, the loops and the table from the same data.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 24.0;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  s1: 2.2,
  st: [2.2, 5.2, 8.8, 13.8, 15.8], // banners
  sw: [2.4, 5.4, 7.2, 9.0, 14.0, 16.0, 17.6], // counters (the snap)
  // table cells: P1, P2, L1..L6, the non-touching pair, Delta_1, Delta_2
  cells: [7.05, 8.75, 10.0, 10.7, 11.4, 12.1, 12.8, 13.5, 15.55, 16.4, 16.7], // the numbers land here
  fly: [6.55, 8.25, 9.55, 10.25, 10.95, 11.65, 12.35, 13.05, 15.05], // the numbers leave the graph
  eg: [2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.45, 4.7, 4.95, 5.15], // the gain labels pop
  ns: [2.4, 2.5, 2.6, 2.7, 2.8, 2.9], // nodes R x1 x2 x3 x4 C
  es: [2.6, 2.85, 3.1, 3.35, 3.6, 3.85, 4.3, 4.55, 4.8, 5.0], // edges e0..e9
  ed: [0.4, 0.4, 0.4, 0.4, 0.4, 0.5, 0.35, 0.35, 0.5, 0.35],
  lock: 19.4,
  banF: 20.2,
  card: 21.4,
  pulse: 23.0,
};

// ------------------------------------------------------------------ the graph: R x1 x2 x3 x4 C (C = x5)
const NODE_NAMES = ["R", "x1", "x2", "x3", "x4", "C"];
// edge: [from, to, gain, symbol]; e0 is the unit branch R -> x1
const GAIN = { G1: 2, G2: 1, G3: 3, G4: 2, G5: 1, H1: -1, H2: -1, H3: -1, H4: -1 };
const E = [
  [0, 1, 1, "1"],
  [1, 2, GAIN.G1, "G1"],
  [2, 3, GAIN.G2, "G2"],
  [3, 4, GAIN.G3, "G3"],
  [4, 5, GAIN.G5, "G5"],
  [2, 4, GAIN.G4, "G4"],
  [3, 2, GAIN.H1, "H1"],
  [4, 3, GAIN.H2, "H2"],
  [4, 1, GAIN.H3, "H3"],
  [5, 4, GAIN.H4, "H4"],
];
// what the page shows (edge ids in the order the tracer walks them)
const PATHS = [
  [0, 1, 2, 3, 4], // P1
  [0, 1, 5, 4], // P2
];
const LOOPS = [
  [2, 6], // L1 = G2 H1
  [3, 7], // L2 = G3 H2
  [1, 2, 3, 8], // L3 = G1 G2 G3 H3
  [1, 5, 8], // L4 = G1 G4 H3
  [4, 9], // L5 = G5 H4
  [5, 7, 6], // L6 = G4 H2 H1
];

let RESULT = null;
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))))
      throw new Error(`${what}: ${a} vs ${b}`);
  };
  const n = NODE_NAMES.length;
  // 1. the node equations: x_j = sum over edges (i -> j) of gain * x_i, with R = 1; solved by Gaussian elimination
  const A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
  for (let j = 1; j < n; j++) A[j][j] = 1;
  A[0][0] = 1;
  A[0][n] = 1; // x_R = 1
  for (const [i, j, g] of E) A[j][i] -= g;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k];
    }
  }
  const x = A.map((row, i) => row[n] / row[i]);
  const direct = x[5];
  // 2. Mason: enumerate simple cycles and simple R -> C paths from the edge list
  const out = Array.from({ length: n }, () => []);
  E.forEach((e, id) => out[e[0]].push(id));
  const cycles = [],
    paths = [];
  const walk = (start, v, seen, es, isCycle) => {
    for (const id of out[v]) {
      const to = E[id][1];
      if (isCycle) {
        if (to === start) cycles.push([...es, id]);
        else if (to > start && !seen.has(to))
          walk(start, to, new Set([...seen, to]), [...es, id], true);
      } else if (to === 5) paths.push([...es, id]);
      else if (!seen.has(to)) walk(start, to, new Set([...seen, to]), [...es, id], false);
    }
  };
  for (let s = 1; s < n; s++) walk(s, s, new Set([s]), [], true);
  walk(0, 0, new Set([0]), [], false);
  const nodesOf = (es) => new Set(es.flatMap((id) => [E[id][0], E[id][1]]));
  const gain = (es) => es.reduce((g, id) => g * E[id][2], 1);
  const key = (es) => [...es].sort((a, b) => a - b).join(",");
  const sameSet = (A1, B1) => A1.length === B1.length && A1.every((k) => B1.includes(k));
  if (!sameSet(cycles.map(key), LOOPS.map(key)))
    throw new Error("the displayed loops are not the loops of the graph: " + cycles.map(key));
  if (!sameSet(paths.map(key), PATHS.map(key)))
    throw new Error("the displayed paths are not the paths of the graph");
  const touch = (a, b) => [...nodesOf(a)].some((v) => nodesOf(b).has(v));
  // the determinant: sum over sets of mutually non-touching loops
  const delta = (ls) => {
    let d = 0;
    const rec = (start, chosen) => {
      d += (chosen.length % 2 ? -1 : 1) * chosen.reduce((g, l) => g * gain(l), 1);
      for (let i = start; i < ls.length; i++)
        if (chosen.every((c) => !touch(c, ls[i]))) rec(i + 1, [...chosen, ls[i]]);
    };
    rec(0, []);
    return d;
  };
  const Dl = delta(LOOPS);
  const Pk = PATHS.map(gain);
  const Dk = PATHS.map((p) => delta(LOOPS.filter((l) => !touch(l, p))));
  const mason = Pk.reduce((s, P, k) => s + P * Dk[k], 0) / Dl;
  near(mason, direct, 1e-12, "Mason's rule and the node equations agree");
  near(direct, 2 / 3, 1e-12, "C/R = 2/3");
  const Lv = LOOPS.map(gain);
  if (Lv.join(",") !== "-1,-3,-6,-4,-1,2") throw new Error("loop gains: " + Lv);
  if (Pk.join(",") !== "6,4") throw new Error("path gains: " + Pk);
  if (Dl !== 15) throw new Error("Delta = " + Dl);
  if (Dk.join(",") !== "1,1") throw new Error("Delta_k = " + Dk);
  const pairs = [];
  for (let i = 0; i < LOOPS.length; i++)
    for (let j = i + 1; j < LOOPS.length; j++)
      if (!touch(LOOPS[i], LOOPS[j])) pairs.push([i + 1, j + 1]);
  if (JSON.stringify(pairs) !== "[[1,5]]")
    throw new Error("non-touching pairs: " + JSON.stringify(pairs));
  if (Lv[0] * Lv[4] !== 1) throw new Error("L1 L5 = " + Lv[0] * Lv[4]);
  const sumL = Lv.reduce((s, v) => s + v, 0);
  if (1 - sumL + Lv[0] * Lv[4] !== 15)
    throw new Error("1 - sum L + L1 L5 = " + (1 - sumL + Lv[0] * Lv[4]));
  RESULT = { x, sumL, Lv, Pk, Dl };
  console.log(
    "maths ok: node equations give C/R = " +
      direct.toFixed(6) +
      "; Mason: " +
      cycles.length +
      " loops " +
      JSON.stringify(Lv) +
      ", paths " +
      JSON.stringify(Pk) +
      ", only non-touching pair L1 L5, Delta = 1 - (" +
      sumL +
      ") + 1 = " +
      Dl +
      ", Delta_k = " +
      Dk +
      " -> (6 + 4)/15 = 2/3",
  );
})();

// ------------------------------------------------------------------ helpers
const tx = (s) => {
  try {
    return katex.renderToString(s, { throwOnError: true, output: "html", strict: "error" });
  } catch (err) {
    throw new Error("KaTeX failed on: " + s + " -> " + String(err.message).slice(0, 200));
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
const rnd = mulberry32(20261122);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry
const PA = [90, 350, 900, 540]; // the graph
const PB = [90, 910, 900, 320]; // the table of paths, loops and cofactors
const NY = 620;
const NX = [150, 300, 450, 600, 750, 900];
const NR = 28;
const straight = (i) => {
  const a = NX[i] + NR + 4,
    b = NX[i + 1] - NR - 6;
  return Array.from({ length: 31 }, (_, k) => [a + ((b - a) * k) / 30, NY]);
};
const arc = (cx, cy, r, a0, a1, n = 90) =>
  Array.from({ length: n + 1 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
// true semicircles: G4 over x3 (x2 -> x4), the three short feedback arcs and the long one (x4 -> x1) below the row
const EDGE_PTS = [
  straight(0),
  straight(1),
  straight(2),
  straight(3),
  straight(4),
  arc(600, NY - NR, 150, Math.PI, 2 * Math.PI), // G4: x2 -> x4, over the top
  arc(525, NY + 24, 61, 0, Math.PI), // H1: x3 -> x2
  arc(675, NY + 24, 61, 0, Math.PI), // H2: x4 -> x3
  arc(525, NY + NR, 225, 0, Math.PI, 150), // H3: x4 -> x1
  arc(825, NY + 24, 61, 0, Math.PI), // H4: C -> x4
];
const EDGE_LAB = [
  [225, 585],
  [375, 585],
  [525, 585],
  [675, 585],
  [825, 585],
  [600, 412],
  [525, 736],
  [675, 736],
  [525, 836],
  [825, 736],
];
const gainTex = (e) => (e[3] === "1" ? "1" : `${e[3][0]}_{${e[3][1]}}=${e[2]}`);

// the highlight windows: path / loop, colour, edges in walking order
const LT0 = [9.0, 9.7, 10.4, 11.1, 11.8, 12.5];
const HL = [
  { t0: 5.4, t1: 6.7, c: "blue", e: PATHS[0] },
  { t0: 7.2, t1: 8.4, c: "purple", e: PATHS[1] },
  ...LOOPS.map((e, i) => ({ t0: LT0[i], t1: LT0[i] + 0.7, c: "red", e })),
  { t0: 14.0, t1: 15.2, c: "purple", e: LOOPS[0] },
  { t0: 14.0, t1: 15.2, c: "purple", e: LOOPS[4] },
];

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{SIGNAL FLOW GRAPHS}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("MASON'S GAIN FORMULA")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const NODE_TEX = ["R", "x_{1}", "x_{2}", "x_{3}", "x_{4}", "C"];
const nodeLabels = NODE_TEX.map((s, i) =>
  box({ id: "ln" + i, cx: NX[i], cy: NY, w: 56, h: 40, size: 30, color: C.white, html: tx(s) }),
).join("");
const edgeLabels = E.map((e, i) =>
  box({
    id: "lg" + i,
    cx: EDGE_LAB[i][0],
    cy: EDGE_LAB[i][1],
    w: 130,
    h: 38,
    size: 28,
    color: i >= 6 ? C.red : C.white,
    html: tx(gainTex(e)),
  }),
).join("");
// the table
const cell = (id, cx, cy, tex, color) =>
  box({ id, cx, cy, w: 430, h: 40, size: color === C.purple ? 36 : 30, color, html: tx(tex) });
const lv = RESULT.Lv;
const sg = (v) => (v > 0 ? "+" + v : String(v));
const LTEX = [
  "L_{1}=G_{2}H_{1}",
  "L_{2}=G_{3}H_{2}",
  "L_{3}=G_{1}G_{2}G_{3}H_{3}",
  "L_{4}=G_{1}G_{4}H_{3}",
  "L_{5}=G_{5}H_{4}",
  "L_{6}=G_{4}H_{2}H_{1}",
];
const table = [
  cell("tP1", 325, 950, "P_{1}=G_{1}G_{2}G_{3}G_{5}=" + RESULT.Pk[0], C.blue),
  cell("tP2", 755, 950, "P_{2}=G_{1}G_{4}G_{5}=" + RESULT.Pk[1], C.purple),
  ...LTEX.map((s, i) =>
    cell(
      "tL" + (i + 1),
      i % 2 ? 755 : 325,
      1004 + 46 * Math.floor(i / 2),
      s + "=" + sg(lv[i]),
      C.red,
    ),
  ),
  cell("tN", 540, 1148, "L_{1}L_{5}=(-1)(-1)=" + lv[0] * lv[4], C.purple),
  cell("tD1", 325, 1198, "\\Delta_{1}=1", C.blue),
  cell("tD2", 755, 1198, "\\Delta_{2}=1", C.purple),
].join("");
// the numbers that leave the graph and land in the table (start point, the text, its colour, the cell it lands in)
const CELLC = [
  [325, 950],
  [755, 950],
  ...Array.from({ length: 6 }, (_, i) => [i % 2 ? 755 : 325, 1004 + 46 * Math.floor(i / 2)]),
  [540, 1148],
];
const FLY = [
  { sx: 900, sy: 556, v: RESULT.Pk[0], col: C.blue },
  { sx: 900, sy: 556, v: RESULT.Pk[1], col: C.purple },
  { sx: 525, sy: 690, v: lv[0], col: C.red },
  { sx: 675, sy: 690, v: lv[1], col: C.red },
  { sx: 525, sy: 790, v: lv[2], col: C.red },
  { sx: 600, sy: 470, v: lv[3], col: C.red },
  { sx: 825, sy: 690, v: lv[4], col: C.red },
  { sx: 700, sy: 520, v: lv[5], col: C.red },
  { sx: 675, sy: 700, v: lv[0] * lv[4], col: C.purple },
];
const flyers = FLY.map((f, i) =>
  box({
    id: "fl" + i,
    cx: f.sx,
    cy: f.sy,
    w: 90,
    h: 56,
    size: 44,
    color: f.col,
    html: tx(f.col === C.red ? sg(f.v) : String(f.v)),
    style: "opacity:0",
  }),
).join("");
const labels = [nodeLabels, edgeLabels, table].join("");

// ------------------------------------------------------------------ counters, formulas, banners
const CY_CNT = 1290,
  CY_FM = 1388;
const mkC = (id, tex, color = C.blue, size = 52, hidden = true) =>
  box({
    id,
    cx: 540,
    cy: CY_CNT,
    w: 860,
    h: 90,
    size,
    color,
    html: tx(tex),
    m: true,
    style: hidden ? "opacity:0" : "",
  });
const counters = [
  mkC("c0", "\\dfrac{C}{R}=\\dfrac{2}{3}", C.blue, 56, false),
  mkC("c1", "\\dfrac{C}{R}=\\dfrac{\\sum_{k}P_{k}\\Delta_{k}}{\\Delta}", C.blue, 50),
  mkC("c2", "P_{1}=G_{1}G_{2}G_{3}G_{5}=2\\cdot1\\cdot3\\cdot1=6", C.blue, 42),
  mkC("c3", "P_{2}=G_{1}G_{4}G_{5}=2\\cdot2\\cdot1=4", C.blue, 46),
  mkC("c4", "\\sum L_{i}=-1-3-6-4-1+2=" + RESULT.sumL, C.blue, 46),
  mkC("c5", "L_{1}L_{5}=(-1)(-1)=1", C.blue, 52),
  mkC("c6", "\\Delta=1-(" + RESULT.sumL + ")+1=" + RESULT.Dl, C.blue, 52),
  mkC("c7", "\\dfrac{C}{R}=\\dfrac{6\\cdot1+4\\cdot1}{15}=\\dfrac{2}{3}", C.blue, 50),
  mkC("cfin", it("EVERY LOOP COUNTS"), C.blue, 52),
].join("");
const mkF = (id, tex, size = 46, hidden = true) =>
  box({
    id,
    cx: 540,
    cy: CY_FM,
    w: 880,
    h: 100,
    size,
    color: C.blue,
    html: tx(tex),
    m: true,
    style: hidden ? "opacity:0" : "",
  });
const FORM = [
  ["fm0", "\\Delta=15,\\quad P_{1}\\Delta_{1}+P_{2}\\Delta_{2}=10", 42, false],
  ["f1", "\\Delta=1-\\sum L_{i}+\\sum L_{i}L_{j}-\\cdots", 42],
  ["f2", "R\\to x_{1}\\to x_{2}\\to x_{3}\\to x_{4}\\to C", 40],
  ["f3", "R\\to x_{1}\\to x_{2}\\to x_{4}\\to C", 44],
  ["f4", "L_{i}=\\prod(" + it("BRANCH GAINS") + ")", 44],
  ["fh4", "L_{6}=G_{4}H_{2}H_{1}=+2\\;\\;" + it("THE HIDDEN ONE"), 38],
  ["f5", it("THE ONLY PAIR WITH NO NODE IN COMMON"), 36],
  ["f6", "\\Delta=1-\\sum L_{i}+L_{1}L_{5}", 46],
  ["f7", "\\Delta_{1}=\\Delta_{2}=1\\;\\;" + it("LOOPS TOUCH BOTH PATHS"), 36],
  ["f8", "\\dfrac{\\sum P_{k}\\Delta_{k}}{\\Delta}=\\dfrac{10}{15}", 48],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("CAN YOU SOLVE IT IN 20 SECONDS?"), it("MASON'S GAIN FORMULA"), 1),
  bn("bn1", it("A SIGNAL FLOW GRAPH"), it("NODES, GAINS AND FEEDBACK"), 0),
  bn("bn2", it("FORWARD PATHS"), it("FROM R TO C, NO NODE TWICE"), 0),
  bn("bn3", it("LOOPS"), it("SIX OF THEM, ONE IS HIDDEN"), 0),
  bn("bn4", it("NON-TOUCHING LOOPS"), it("NO NODE IN COMMON"), 0),
  bn("bn5", it("THE DETERMINANT"), "\\Delta=1-\\sum L+\\sum LL", 0),
  bn("bnF", it("EVERY LOOP COUNTS"), "C/R=2/3", 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("WHICH LOOP DO PEOPLE MISS?")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:180px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;

// ------------------------------------------------------------------ guards
const allHtml = [header, labels, flyers, counters, formulas, banner, card].join("");
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(allHtml))
  throw new Error("upright / bold math style found");
const boldCount = (allHtml.match(/class="[^"]*\btextbf\b/g) || []).length;
if (boldCount !== 1)
  throw new Error("expected exactly one \\textbf (the header title), found " + boldCount);
if (Object.keys(L).length) {
  for (const [k, v] of Object.entries(L))
    if (v.w > 860) throw new Error(`${k} is ${v.w}px wide, limit 860`);
  console.log("layout ok: every measured formula fits");
}
console.log("typography ok: no \\mathbf / \\mathrm / upright math; one \\textbf (title only)");

fs.mkdirSync(new URL("./assets/", import.meta.url), { recursive: true });
fs.writeFileSync(
  new URL("./assets/sched.json", import.meta.url),
  JSON.stringify({
    ...T,
    dur: DUR,
    hl: HL,
    flyx: FLY.map((f) => f.sx),
    cellx: CELLC.map((c) => c[0]),
    edgex: EDGE_LAB.map((p) => p[0]),
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
.panel{position:absolute;border-radius:28px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1)}
#cv{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:26px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:38px;color:${C.red};line-height:1.15;margin-top:2px}
#card{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:2px solid rgba(255,0,68,.5);overflow:hidden}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = {
  T,
  PA,
  PB,
  NODES: NX.map((x) => [x, NY]),
  NR,
  EDGES: EDGE_PTS,
  HL,
  EN: E.map((e) => [e[0], e[1]]),
  FLY: FLY.map((f, i) => ({
    launch: T.fly[i],
    land: T.cells[i],
    dx: CELLC[i][0] - f.sx,
    dy: CELLC[i][1] - f.sy,
  })),
  spark: Array.from({ length: 28 }, () => ({
    a: rnd() * Math.PI * 2,
    d: 160 + rnd() * 320,
    r: 2.5 + rnd() * 3.5,
  })),
};
function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>Signal Flow Graphs</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="left:${PA[0]}px;top:${PA[1]}px;width:${PA[2]}px;height:${PA[3]}px"></div>
<div class="panel" style="left:${PB[0]}px;top:${PB[1]}px;width:${PB[2]}px;height:${PB[3]}px"></div>
<div id="glow" style="position:absolute;left:90px;top:350px;width:900px;height:880px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:350px;width:900px;height:880px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
<canvas id="cv" data-layout-allow-overflow data-layout-ignore></canvas>
${labels}
${flyers}
${counters}
${formulas}
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
