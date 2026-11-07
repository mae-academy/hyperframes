// THE KING'S PROPERTY: brute force vs. two lines, I = int_0^pi x sin x / (1 + cos^2 x) dx (42.0 s).
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
  DUR = 42;

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
const PI = Math.PI;
const simpson = (g, a, b, n = 4000) => {
  const h = (b - a) / n;
  let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
};
(function assertMath() {
  const f = (x) => (x * Math.sin(x)) / (1 + Math.cos(x) ** 2);
  const I = simpson(f, 0, PI);
  const near = (a, b, tol, what) => {
    if (Math.abs(a - b) > tol) throw new Error(`${what}: ${a} vs ${b}`);
  };
  near(I, (PI * PI) / 4, 1e-9, "I = pi^2/4");
  // integration by parts: I = [-x atan(cos x)]_0^pi + int atan(cos x) dx, boundary = pi^2/4, the "monster" integrates to 0
  const boundary = -PI * Math.atan(Math.cos(PI)) + 0 * Math.atan(Math.cos(0));
  near(boundary, (PI * PI) / 4, 1e-12, "boundary term");
  const monster = simpson((x) => Math.atan(Math.cos(x)), 0, PI);
  near(monster, 0, 1e-9, "atan(cos x) integrates to 0 over [0, pi]");
  near(boundary + monster, I, 1e-9, "by-parts identity");
  // arctan as a complex log: atan(u) = (1/2i) ln((1+iu)/(1-iu)), checked for real u via the real part of the log
  for (const u of [-1, -0.3, 0.2, 0.9]) {
    const re = (1 + 0) ** 2 + u * u; // |1+iu|^2 = |1-iu|^2, so ln|ratio| = 0 and the log is purely imaginary
    const arg = 2 * Math.atan2(u, 1); // arg((1+iu)/(1-iu)) = 2 atan(u)
    near(arg / 2, Math.atan(u), 1e-12, "atan = (1/2i) ln(...)");
    if (re <= 0) throw new Error("modulus");
  }
  // King's property on this integrand: f(pi - x) = (pi - x) sin x / (1 + cos^2 x)
  const g = (x) => ((PI - x) * Math.sin(PI - x)) / (1 + Math.cos(PI - x) ** 2);
  near(simpson(g, 0, PI), I, 1e-9, "King's property");
  for (const x of [0.3, 1.1, 2.7]) {
    near(Math.sin(PI - x), Math.sin(x), 1e-12, "sin(pi-x)");
    near(Math.cos(PI - x) ** 2, Math.cos(x) ** 2, 1e-12, "cos^2(pi-x)");
  }
  // 2I = pi * int sin x/(1+cos^2 x) dx = pi * [-atan(cos x)]_0^pi = pi * (pi/4 + pi/4) = pi^2/2
  const s = simpson((x) => Math.sin(x) / (1 + Math.cos(x) ** 2), 0, PI);
  near(s, PI / 2, 1e-9, "int sin/(1+cos^2) = pi/2");
  near(PI * (-Math.atan(-1) + Math.atan(1)), (PI * PI) / 2, 1e-12, "2I");
  near(2 * I, PI * s, 1e-9, "2I = pi * int");
  // CTA challenge: int_0^pi x/(1 + sin x) dx = pi (King's property gives (pi/2) * 2)
  near(
    simpson((x) => x / (1 + Math.sin(x)), 0, PI, 20000),
    PI,
    1e-6,
    "CTA challenge value",
  );
  console.log(
    `maths ok: I = ${I.toFixed(10)} = pi^2/4; boundary = pi^2/4; int atan(cos) = ${monster.toExponential(1)}; King's property, identities, 2I = pi^2/2 and the CTA challenge (= pi) verified`,
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
const col = (c, s) => `\\textcolor{${c}}{${s}}`;
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
const rnd = mulberry32(20261107);
const r3 = (v) => Math.round(v * 1000) / 1000;
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ the formulas
const INT0 = "\\int_{0}^{\\pi}\\frac{x\\sin x}{1+\\cos^{2}x}\\,dx";
const SINEINT = "\\int_{0}^{\\pi}\\frac{\\sin x}{1+\\cos^{2}x}\\,dx";
// [selector id, cx, cy, maxWidth, size, colour, tex]; data-m elements are measured and must fit (asserted on pass two)
const F = {
  I0: { cy: 840, size: 100, color: C.blue, tex: `I=${INT0}`, max: 860 },
  L1: {
    cy: 460,
    size: 38,
    color: C.blue,
    tex: `I=\\left[-x\\arctan(\\cos x)\\right]_{0}^{\\pi}-\\int_{0}^{\\pi}\\left(-\\arctan(\\cos x)\\right)dx`,
    max: 860,
  },
  L2: {
    cy: 600,
    size: 52,
    color: C.white,
    tex: `\\left[-x\\arctan(\\cos x)\\right]_{0}^{\\pi}=\\pi\\cdot\\frac{\\pi}{4}=\\frac{\\pi^{2}}{4}`,
    max: 860,
  },
  L3: {
    cy: 750,
    size: 60,
    color: C.blue,
    tex: `I=\\frac{\\pi^{2}}{4}+${col(C.red, "\\int_{0}^{\\pi}\\arctan(\\cos x)\\,dx")}`,
    max: 860,
  },
  L4: {
    cy: 910,
    size: 46,
    color: C.purple,
    tex: `\\arctan u=\\frac{1}{2i}\\ln\\!\\left(\\frac{1+iu}{1-iu}\\right)\\Rightarrow\\frac{1}{2i}\\ln\\!\\left(\\frac{1+i\\cos x}{1-i\\cos x}\\right)`,
    max: 860,
  },
  L5: {
    cy: 1075,
    size: 60,
    color: C.white,
    tex: `\\cos x=\\frac{e^{ix}+e^{-ix}}{2},\\qquad z=e^{ix}`,
    max: 860,
  },
  KP: {
    cy: 500,
    size: 58,
    color: C.purple,
    tex: `\\int_{a}^{b}f(x)\\,dx=\\int_{a}^{b}f(a+b-x)\\,dx`,
    max: 860,
  },
  I1: { cy: 660, size: 76, color: C.blue, tex: `I=${INT0}`, max: 860 },
  S1: {
    cy: 825,
    size: 68,
    color: C.blue,
    tex: `I=\\int_{0}^{\\pi}\\frac{(\\pi-x)\\sin(\\pi-x)}{1+\\cos^{2}(\\pi-x)}\\,dx`,
    max: 860,
  },
  S2: {
    cy: 965,
    size: 44,
    color: C.white,
    tex: `\\sin(\\pi-x)=\\sin x,\\qquad\\cos^{2}(\\pi-x)=\\cos^{2}x`,
    max: 860,
  },
  Q1: { cy: 460, size: 70, color: C.blue, tex: `2I=\\pi${SINEINT}`, max: 860 },
  Q2: {
    cy: 600,
    size: 56,
    color: C.purple,
    tex: `u=\\cos x\\Rightarrow du=-\\sin x\\,dx`,
    max: 860,
  },
  Q3: {
    cy: 745,
    size: 64,
    color: C.blue,
    tex: `2I=\\pi\\left[-\\arctan(\\cos x)\\right]_{0}^{\\pi}`,
    max: 860,
  },
  Q4: {
    cy: 870,
    size: 50,
    color: C.white,
    tex: `2I=\\pi\\left(-\\arctan(-1)-(-\\arctan 1)\\right)`,
    max: 860,
  },
  Q5: {
    cy: 1000,
    size: 64,
    color: C.white,
    tex: `=\\pi\\left(\\frac{\\pi}{4}+\\frac{\\pi}{4}\\right)=\\frac{\\pi^{2}}{2}`,
    max: 860,
  },
  R: { cy: 1215, size: 120, color: C.blue, tex: `I=\\frac{\\pi^{2}}{4}`, max: 600 },
};
const fm = (k, extra = "") =>
  box({
    id: k,
    cx: 540,
    cy: F[k].cy,
    w: 880,
    h: 120,
    size: F[k].size,
    color: F[k].color,
    html: tx(F[k].tex),
    m: true,
    style: "opacity:0;" + extra,
  });

// ------------------------------------------------------------------ header
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1000, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE KING'S PROPERTY}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("TWO LINES BEAT EIGHT PAGES")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 835, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), style: "z-index:0", cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;

// ------------------------------------------------------------------ page 0: the calm
const pg0 = `
${fm("I0")}
${box({ id: "lab0", cx: 540, cy: 1020, w: 860, h: 60, size: 40, color: DIM, html: tx(it("STANDARD CALCULUS 2 EXAM QUESTION")), style: "opacity:0" })}`;

// ------------------------------------------------------------------ page 1: by parts and the spiral
const pg1 = ["L1", "L2", "L3", "L4", "L5"].map((k) => fm(k)).join("\n");

// ------------------------------------------------------------------ page 2: the wall (100 cells, two variants each)
const COLS = 4,
  ROWS = 25,
  WX = 90,
  WY = 340,
  WW = 900,
  WH = 1040;
const CW = WW / COLS,
  CH = WH / ROWS;
const pool = [
  (a, _b) => `\\sum_{k=1}^{\\infty}\\frac{(-1)^{k}}{k^{${a}}}`,
  (a, _b) => `\\mathit{Li}_{2}(z^{${a}})=\\sum_{n\\ge1}\\frac{z^{${a}n}}{n^{2}}`,
  (a, _b) => `\\oint_{|z|=1}\\frac{\\ln(1+${a}iz)}{z}\\,dz`,
  (_a, _b) => `\\Gamma(s)=\\int_{0}^{\\infty}t^{s-1}e^{-t}dt`,
  (a, b) => `\\binom{${a + 4}}{${b + 1}}i^{${b}}\\,z^{${a}}`,
  (_a, b) => `\\mathit{Res}_{z=${["i", "-i", "2i", "e^{i\\pi/4}"][b % 4]}}\\frac{1}{z^{2}+1}`,
  (a, _b) => `\\frac{1}{2i}\\ln\\frac{1+iz^{${a}}}{1-iz^{${a}}}`,
  (a, _b) => `\\int_{-i}^{i}\\frac{\\ln(z+${a})}{z^{2}+1}dz`,
  (a, _b) => `\\sum_{n=0}^{\\infty}\\binom{2n}{n}\\frac{z^{${a}n}}{4^{n}}`,
  (a, _b) => `z^{4}+${a}z^{2}+1=0`,
  (a, _b) => `\\frac{\\Gamma(${a}/2)}{\\Gamma(${a + 1}/2)}\\sqrt{\\pi}`,
  (a, _b) => `\\sum_{j=1}^{${a + 3}}\\sum_{k=1}^{j}\\frac{i^{k}}{jk}`,
  (a, _b) => `\\int_{\\gamma}\\frac{dz}{(z-i)^{${a}}}=2\\pi i`,
  (_a, _b) => `\\ln(1-iz)\\big|_{\\text{branch cut}}`.replace("\\text{branch cut}", "z\\in[-i,i]"),
  (a, _b) => `\\zeta(${a + 1})=\\sum_{n\\ge1}n^{-${a + 1}}`,
  (_a, _b) => `\\frac{e^{ix}+e^{-ix}}{2}=\\cos x`,
];
const wallCells = [];
for (let r = 0; r < ROWS; r++)
  for (let c = 0; c < COLS; c++) {
    const idx = r * COLS + c;
    const mk = () => {
      const a = 1 + Math.floor(rnd() * 5),
        b = Math.floor(rnd() * 4);
      return pool[Math.floor(rnd() * pool.length)](a, b);
    };
    const cx = WX + c * CW + CW / 2,
      cy = WY + r * CH + CH / 2;
    const dist = Math.hypot((cx - 540) / WW, (cy - (WY + WH / 2)) / WH);
    wallCells.push({ idx, cx, cy, dist, A: mk(), B: mk() });
  }
// appearance order: closest to the centre first (ties broken by index, so it is deterministic)
const order = [...wallCells].sort((p, q) => p.dist - q.dist || p.idx - q.idx);
order.forEach((c, i) => (c.rank = i));
const wall = `<div id="wall" data-layout-ignore style="position:absolute;left:${WX}px;top:${WY}px;width:${WW}px;height:${WH}px;opacity:0">
${wallCells
  .map(
    (c) =>
      `<div class="cell" id="c${c.idx}" style="left:${c.cx - CW / 2 - WX}px;top:${c.cy - CH / 2 - WY}px;width:${CW}px;height:${CH}px;opacity:0"><div class="va" id="c${c.idx}a">${tx(c.A)}</div><div class="va" id="c${c.idx}b" style="opacity:0">${tx(c.B)}</div></div>`,
  )
  .join("\n")}
</div>`;

// the wall's schedule: appearance times (stage waves) and flash toggles; written to assets/sched.json for the sound
const STAGES = [
  { t: 11.6, n: 4, label: "4" },
  { t: 13.4, n: 16, label: "16" },
  { t: 15.2, n: 64, label: "64" },
  { t: 17.0, n: 100, label: "100" },
];
const appear = new Array(wallCells.length).fill(0);
STAGES.forEach((s, si) => {
  const lo = si ? STAGES[si - 1].n : 0;
  const cnt = s.n - lo;
  for (let k = 0; k < cnt; k++) {
    const cell = order[lo + k];
    cell.t = r3(s.t + (k / Math.max(1, cnt)) * (si === 0 ? 0.4 : 1.1));
    appear[cell.idx] = cell.t;
  }
});
const flashes = []; // {cell, t, toB}
const state = new Array(wallCells.length).fill(false);
for (let t = 17.2; t < 24.95; t += 0.04) {
  // density escalates: probability per 40 ms tick climbs from 0.35 to 2.4 flashes
  const lam = 0.35 + 2.05 * ((t - 17.2) / (24.95 - 17.2)) ** 1.4;
  let n = Math.floor(lam) + (rnd() < lam - Math.floor(lam) ? 1 : 0);
  while (n--) {
    const cell = wallCells[Math.floor(rnd() * wallCells.length)];
    state[cell.idx] = !state[cell.idx];
    flashes.push({ cell: cell.idx, t: r3(t + rnd() * 0.04), toB: state[cell.idx] });
  }
}
fs.mkdirSync(new URL("./assets/", import.meta.url), { recursive: true });
fs.writeFileSync(
  new URL("./assets/sched.json", import.meta.url),
  JSON.stringify({
    appear: order.map((c) => c.t),
    flashes: flashes.map((f) => f.t),
    stages: STAGES.map((s) => s.t),
  }),
);
console.log(`wall: ${wallCells.length} cells, ${flashes.length} flashes`);

// counter chip (stacked values, toggled by the timeline)
const chip = `<div id="chip" style="position:absolute;left:340px;top:355px;width:400px;height:100px;border-radius:30px;background:rgba(10,10,16,.88);border:2px solid rgba(255,0,68,.55);opacity:0">
${STAGES.map((s, i) => box({ id: "n" + i, cx: 200, cy: 50, w: 400, h: 90, size: 62, color: C.blue, html: tx(it("TERMS") + `\\,=\\,${s.label}${i === 3 ? "{+}" : ""}`), style: i ? "opacity:0" : "" })).join("")}</div>`;

// slash + dust (collapse)
const SL = Math.hypot(WW, WH);
const dust = [];
for (let i = 0; i < 48; i++)
  dust.push({
    x: WX + 30 + rnd() * (WW - 60),
    y: WY + 30 + rnd() * (WH - 60),
    r: 2.5 + rnd() * 3.5,
    c: [C.white, C.red, C.purple, C.white][i % 4],
  });
const fx = `<svg id="fxs" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" data-layout-ignore>
  <line id="slash" x1="${WX}" y1="${WY}" x2="${WX + WW}" y2="${WY + WH}" stroke="${C.red}" stroke-width="16" stroke-linecap="round" stroke-dasharray="${SL}" stroke-dashoffset="${SL}" style="filter:drop-shadow(0 0 14px ${C.red})" opacity="0"/>
  <g id="dust" opacity="0">${dust.map((d, i) => `<circle id="d${i}" cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="${d.r.toFixed(1)}" fill="${d.c}"/>`).join("")}</g>
  <circle id="ringC" cx="540" cy="${WY + WH / 2}" r="10" fill="none" stroke="${C.red}" stroke-width="5" opacity="0"/>
</svg>`;

// ------------------------------------------------------------------ page 3: the trick
const hlRow = `<div id="rowE" class="t" style="left:20px;top:${1105 - 70}px;width:1040px;height:140px;opacity:0">
  <div class="it" style="font-size:50px;color:${C.blue}">${tx(`I=\\pi${SINEINT}-`)}</div>
  <div class="it hl" style="font-size:50px;color:${C.blue};position:relative;margin-left:22px">${tx(INT0)}<div id="hlbox"></div></div>
</div>
${box({ id: "tagI", cx: 760, cy: 1230, w: 420, h: 60, size: 38, color: C.purple, html: tx(it("THE LAST TERM IS ") + "I"), style: "opacity:0" })}`;
const pg3 = [fm("I1"), fm("KP"), fm("S1"), fm("S2"), hlRow].join("\n");
// "WHERE THE TRICK LIVES" label for the theorem
const kpLab = box({
  id: "kpLab",
  cx: 540,
  cy: 405,
  w: 700,
  h: 50,
  size: 36,
  color: C.purple,
  html: tx(it("KING'S PROPERTY")),
  style: "opacity:0",
});

// ------------------------------------------------------------------ page 4: execution
const pg4 = [fm("Q1"), fm("Q2"), fm("Q3"), fm("Q4"), fm("Q5")].join("\n");
const RES = { cx: 540, cy: 1215, w: 560, h: 190 };
const resultBlock = `
<div id="glow" style="position:absolute;left:${RES.cx - 420}px;top:${RES.cy - 220}px;width:840px;height:440px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
${fm("R", "z-index:2")}
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
  <path id="check" d="M${RES.cx + RES.w / 2 + 28} ${RES.cy} l24 26 l48 -56" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="130" stroke-dashoffset="130" opacity="0" style="filter:drop-shadow(0 0 10px ${C.purple})"/>
</svg>`;

// ------------------------------------------------------------------ plate and banners
const plate = `<div id="plate"><div id="pc">
  <div id="pg0" class="pg">${pg0}</div>
  <div id="pg1" class="pg" style="opacity:0">${pg1}</div>
  ${wall}
  <div id="pg3" class="pg" style="opacity:0">${kpLab}${pg3}</div>
  <div id="pg4" class="pg" style="opacity:0">${pg4}${resultBlock}</div>
  ${fx}
</div></div>
${chip}`;

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("YOU HAVE 15 SECONDS"), it("WHERE DO YOU START?"), 1),
  bn("bn1", it("INTEGRATION BY PARTS"), `u=x,\\;dv=\\frac{\\sin x}{1+\\cos^{2}x}dx`, 0),
  bn("bn2", it("THE BOUNDARY TERM IS CLEAN"), it("BUT THE LEFTOVER IS A MONSTER"), 0),
  bn("bn3", it("NO TRICKS: GO COMPLEX"), it("LOGARITHMS AND EULER"), 0),
  bn("bn4", it("4 TERMS BECOME 16"), it("SPLIT THE QUADRATICS"), 0),
  bn("bn5", it("DILOGARITHMS ") + "\\mathit{Li}_{2}(z)", it("16 TERMS BECOME 64"), 0),
  bn("bn6", it("BRANCH CUTS ALONG ") + "[-i,\\,i]", it("64 TERMS BECOME 100+"), 0),
  bn("bn7", it("ESTIMATED HUMAN CALCULATION TIME:"), it("4 DAYS AND 7 CUPS OF COFFEE"), 0),
  bn("bn8", it("WAIT"), it("THERE IS A TWO-LINE WAY"), 0),
  bn(
    "bn9",
    it("KING'S PROPERTY: REPLACE ") + "x" + it(" BY ") + "a+b-x",
    it("THE INTEGRAL DOES NOT CHANGE"),
    0,
  ),
  bn("bn10", it("REPLACE ") + "x" + it(" WITH ") + "(\\pi-x)", it("THEN APPLY THE IDENTITIES"), 0),
  bn("bn11", it("THE LAST TERM IS LITERALLY ") + "I", it("MOVE IT TO THE LEFT"), 0),
  bn("bn12", it("LET ") + "u=\\cos x", it("THE INTEGRAL COLLAPSES TO ARCTAN"), 0),
  bn("bn13", it("8 PAGES OF COMPLEX ANALYSIS..."), it("OR 15 SECONDS OF SYMMETRY"), 0),
];
const banner = `<div id="banner">${banners.join("\n")}</div>`;

// ------------------------------------------------------------------ CTA (one glass card; the banner hands over to it)
const CARD = { x: 90, y: 1420, w: 900, h: 240 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:90px;width:700px;height:120px;border-radius:60px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS TRICK"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 98, w: 860, h: 52, size: 35, color: C.blue, html: tx(it("TRY ") + "\\int_{0}^{\\pi}\\frac{x}{1+\\sin x}dx" + it(" IN 15 SECONDS")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 860, h: 44, size: 32, color: C.blue, html: tx(it("ANSWER IN THE COMMENTS ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:182px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;

// ------------------------------------------------------------------ guards
const allHtml = [header, plate, banner, card].join("");
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(allHtml))
  throw new Error("upright / bold math style found");
const boldCount = (allHtml.match(/class="[^"]*\btextbf\b/g) || []).length;
if (boldCount !== 1)
  throw new Error("expected exactly one \\textbf (the header title), found " + boldCount);
if (Object.keys(L).length) {
  for (const [k, v] of Object.entries(F)) {
    const m = L[k];
    if (m && m.w > v.max) throw new Error(`${k} is ${m.w}px wide, limit ${v.max}`);
  }
  console.log("layout ok: every measured formula fits its limit");
}
console.log("typography ok: no \\mathbf / \\mathrm / upright math; one \\textbf (title only)");

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
#plate{position:absolute;left:90px;top:340px;width:900px;height:1040px;border-radius:32px;overflow:hidden;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08)}
#pc{position:absolute;left:-91px;top:-341px;width:${W}px;height:${H}px}
.pg{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.cell{position:absolute;overflow:hidden;color:${DIM};font-size:20px;display:flex;align-items:center;justify-content:center;white-space:nowrap}
.va{position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
.it{display:flex;align-items:center;justify-content:center}
.hl{padding:6px 4px}
#hlbox{position:absolute;left:-8px;top:-8px;right:-8px;bottom:-8px;border:3px solid ${C.purple};border-radius:16px;box-shadow:0 0 18px rgba(176,38,255,.6);opacity:0}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:26px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:38px;color:${C.red};line-height:1.15;margin-top:2px}
#card{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:2px solid rgba(255,0,68,.5);overflow:hidden}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = {
  stages: STAGES,
  cells: wallCells.map((c) => ({ id: c.idx, t: appear[c.idx] })),
  flashes,
  dust: dust.map((d) => ({ x: d.x, y: d.y })),
  wallCenter: { x: 540, y: WY + WH / 2 },
  res: RES,
};
function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>The King's Property</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
${plate}
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
