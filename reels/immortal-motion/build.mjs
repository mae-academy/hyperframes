// THE IMMORTAL FUNCTION: THE e^x TRIANGLE IN MOTION (15.0 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 15;

// ------------------------------------------------------------------ geometry
const KX = 178,
  KY = 61;
const X = (x) => 140 + KX * (x + 2); // x in [-2, 2.5] -> [140, 941]
const Y0 = 890;
const Y = (y) => Y0 - KY * y;
const f = Math.exp;
const dnum = (x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
// GSAP power1.inOut / power2.inOut, reproduced so the readouts match the tweens exactly
const q = (p) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p));
const c3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// timeline constants
const SCAN0 = 2.0,
  SCAN1 = 3.2,
  FLY0 = 4.5,
  FLY1 = 8.5;
const XS0 = -1.0; // scan start
const xScan = (t) => XS0 + 2 * c3(Math.min(1, Math.max(0, (t - SCAN0) / (SCAN1 - SCAN0))));
const xFly = (t) => 1 + q(Math.min(1, Math.max(0, (t - FLY0) / (FLY1 - FLY0))));

(function assertMath() {
  for (let x0 = -2; x0 <= 2.5; x0 += 0.25) {
    const xi = x0 - f(x0) / dnum(x0); // x-intercept of the tangent
    if (Math.abs(x0 - xi - 1) > 1e-6) throw new Error("subtangent is not 1 at " + x0);
  }
  for (const x0 of [1, 1.37, 2]) {
    const slopePx = (dnum(x0) * KY) / KX;
    const yAtBaseLeft = Y(f(x0)) + slopePx * (X(x0) - X(x0 - 1));
    if (Math.abs(yAtBaseLeft - Y(0)) > 0.01) throw new Error("tangent misses (x-1, 0) at x=" + x0);
  }
  if (Math.abs(f(2) - 7.389) > 5e-4 || Math.abs(f(1) - 2.718) > 5e-4)
    throw new Error("table values wrong");
  if (Math.abs(Y(f(2)) - 439) > 1.5) throw new Error("P(2) leaves the arena");
  console.log(
    "maths ok: subtangent = 1 for all tested x; tangent meets the x-axis at x-1 (x = 1, 1.37, 2); e^1 = 2.718, e^2 = 7.389",
  );
})();

// ------------------------------------------------------------------ helpers
const tx = (s) => {
  let h;
  try {
    h = katex.renderToString(s, { throwOnError: true, output: "html", strict: "error" });
  } catch (e) {
    throw new Error("KaTeX failed on: " + s + " -> " + String(e.message).slice(0, 200));
  }
  return h;
};
const it = (s) => `\\textit{${s}}`;
const col = (c, s) => `\\textcolor{${c}}{${s}}`;
let L = {};
try {
  L = JSON.parse(fs.readFileSync(new URL("./layout.json", import.meta.url), "utf8"));
} catch {
  L = {};
}
const M = (k) => L[k] || { cx: 0, cy: 0, w: 120, h: 50 };
function box({
  id,
  cx,
  cy,
  w,
  h,
  size,
  color,
  html,
  cls = "",
  m = false,
  style = "",
  left = false,
  right = false,
}) {
  const l = left || right ? cx : cx - w / 2;
  const just = left ? "justify-content:flex-start;" : right ? "justify-content:flex-end;" : "";
  return `<div ${id ? `id="${id}"` : ""} class="t ${cls}" ${m ? `data-m="${id}"` : ""} style="left:${l}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;font-size:${size}px;color:${color};${just}${style}">${html}</div>`;
}
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const LOCK = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-left:10px;flex:none;filter:drop-shadow(0 0 6px ${C.purple})"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="10" width="16" height="11" rx="2.5" fill="#fff"/><circle cx="12" cy="15.5" r="1.8" fill="${C.purple}"/></svg>`;
const f3 = (v) => (Math.round(v * 1000) / 1000).toFixed(3);
const f2 = (v) => (v < 0 ? "-" : "") + Math.abs(v).toFixed(2);

// ------------------------------------------------------------------ zone 1: header
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1000, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE IMMORTAL FUNCTION}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 232, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("THE GEOMETRIC SECRET OF ") + "e^{x}") })}
<div id="h-rule" style="position:absolute;left:480px;top:268px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>`;

// ------------------------------------------------------------------ zone 2: arena
const grid = [];
for (const x of [-2, -1, 0, 1, 2])
  grid.push(`<line x1="${X(x)}" y1="${Y0}" x2="${X(x)}" y2="372" class="gl"/>`);
for (const y of [2, 4, 6, 8])
  grid.push(`<line x1="140" y1="${Y(y)}" x2="941" y2="${Y(y)}" class="gl"/>`);
const ptsE = [],
  ptsD = [];
for (let x = -2; x <= 2.5001; x += 0.02) {
  ptsE.push(`${X(x).toFixed(2)},${Y(f(x)).toFixed(2)}`);
  ptsD.push(`${X(x).toFixed(2)},${Y(dnum(x)).toFixed(2)}`);
}
const dE = "M" + ptsE.join("L"),
  dD = "M" + ptsD.join("L");
const axisLabels = [-2, -1, 0, 1, 2]
  .map((v) =>
    box({
      cx: X(v),
      cy: 932,
      w: 60,
      h: 26,
      size: 24,
      color: "rgba(255,255,255,.6)",
      html: tx(String(v)),
      cls: "axl",
    }),
  )
  .concat(
    [2, 4, 6, 8].map((v) =>
      box({
        cx: 116,
        cy: Y(v),
        w: 50,
        h: 28,
        size: 24,
        color: "rgba(255,255,255,.6)",
        html: tx(String(v)),
        cls: "axl",
      }),
    ),
  )
  .concat([
    box({
      cx: 958,
      cy: Y0,
      w: 40,
      h: 28,
      size: 28,
      color: "rgba(255,255,255,.6)",
      html: tx("x"),
      cls: "axl",
    }),
    box({
      cx: X(0) + 22,
      cy: 384,
      w: 40,
      h: 28,
      size: 28,
      color: "rgba(255,255,255,.6)",
      html: tx("y"),
      cls: "axl",
    }),
  ])
  .join("");

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261109);
const r1 = (v) => Math.round(v * 1000) / 1000;
// flight steps (every 0.1 s, 4.5 -> 8.5) and scan steps (every 0.1 s, 2.0 -> 3.1)
const fly = [];
for (let k = 0; k <= 40; k++) {
  const t = r1(FLY0 + k * 0.1);
  fly.push({ k, t, x: xFly(t) });
}
const scan = [];
for (let k = 0; k < 12; k++) {
  const t = r1(SCAN0 + k * 0.1);
  scan.push({ k, t, x: xScan(t) });
}
// sparks: curve ignition (1.5), scan steps, flight (every 0.2 s)
const sparkCols = [C.red, C.purple, C.white, C.red];
const sparks = [];
const addSparks = (tag, t, x, n) => {
  for (let j = 0; j < n; j++) {
    const ang = -Math.PI / 2 + (rnd() - 0.5) * 2.4;
    const sp = 30 + rnd() * 46;
    sparks.push({
      id: `sp_${tag}_${j}`,
      t,
      cx: X(x),
      cy: Y(f(x)),
      dx: Math.cos(ang) * sp,
      dy: Math.sin(ang) * sp + 12,
      r: 2.2 + rnd() * 2.2,
      c: sparkCols[(sparks.length + j) % 4],
    });
  }
};
[-1.9, -1.4, -0.9, -0.4, 0.1, 0.6].forEach((x, i) => addSparks("ig" + i, r1(1.5 + i * 0.08), x, 2));
scan.forEach((s) => addSparks("sc" + s.k, s.t, s.x, 2));
fly.filter((s) => s.k % 2 === 0 && s.k > 0).forEach((s) => addSparks("fl" + s.k, s.t, s.x, 2));
const sparkSvg = sparks
  .map(
    (s) =>
      `<circle id="${s.id}" class="spark" cx="${s.cx.toFixed(2)}" cy="${s.cy.toFixed(2)}" r="${s.r.toFixed(1)}" fill="${s.c}" style="opacity:0"/>`,
  )
  .join("");

// HUD readouts: stacked, one visible per step
const hline = (c, t) =>
  `<div style="height:36px;display:flex;align-items:center;font-size:25px;color:#fff">${tx(t)}</div>`;
const scanHud = scan
  .map(
    (s) =>
      `<div id="hs${s.k}" class="rd" style="opacity:0">${hline("#fff", "x=" + f2(s.x))}${hline("#fff", col(C.blue, "f") + "=" + col(C.blue, f3(f(s.x))))}${hline("#fff", col(C.red, "f'") + "=" + col(C.red, f3(dnum(s.x))))}</div>`,
  )
  .join("");
const flyHud = fly
  .map(
    (s) =>
      `<div id="hf${s.k}" class="rd" style="opacity:0">${hline("#fff", "x=" + f2(s.x))}${hline("#fff", col(C.blue, it("Height")) + "=e^{x}=" + col(C.blue, f3(f(s.x))))}${hline("#fff", col(C.purple, it("Base")) + "=" + col(C.purple, "1.0"))}</div>`,
  )
  .join("");

// rig anchor values at the lock point P(1, e)
const P1 = { x: X(1), y: Y(f(1)) },
  O1 = { x: X(0), y: Y(0) },
  Q1 = { x: X(1), y: Y(0) };
const BR_Y = 906;
const triPts = (x) =>
  `${X(x - 1).toFixed(2)},${Y(0).toFixed(2)} ${X(x).toFixed(2)},${Y(0).toFixed(2)} ${X(x).toFixed(2)},${Y(f(x)).toFixed(2)}`;
const midY = (x) => (Y(f(x)) + Y(0)) / 2;

const plate = `
<div id="plate"><div id="pc">
  <svg id="g" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <clipPath id="plotclip"><rect x="130" y="372" width="830" height="${Y0 + 12 - 372}"/></clipPath>
      <clipPath id="revE"><rect id="revE-r" x="130" y="300" width="0" height="660"/></clipPath>
      <clipPath id="revR"><rect id="revR-r" x="${X(XS0)}" y="300" width="0" height="660"/></clipPath>
      <clipPath id="revP"><rect id="revP-r" x="${X(XS0)}" y="300" width="0" height="660"/></clipPath>
    </defs>
    <g id="gridg" style="opacity:.25">${grid.join("")}
      <line x1="140" y1="${Y0}" x2="948" y2="${Y0}" class="axis"/>
      <line x1="${X(0)}" y1="${Y0}" x2="${X(0)}" y2="364" class="axis"/>
    </g>
    <g clip-path="url(#plotclip)">
      <g clip-path="url(#revE)"><path id="base" d="${dE}" class="bcurve"/></g>
      <g clip-path="url(#revR)"><path id="trR" d="${dD}" class="trR"/></g>
      <g clip-path="url(#revP)"><path id="trP" d="${dD}" class="trP"/></g>
      <polygon id="tri" points="${triPts(1)}" fill="${C.purple}" style="opacity:0"/>
      <line id="tgs" class="tgl" x1="${P1.x}" y1="${P1.y}" x2="${P1.x}" y2="${P1.y}" style="opacity:0"/>
      <line id="tgl" class="tgl" x1="${P1.x}" y1="${P1.y}" x2="${P1.x}" y2="${P1.y}" style="opacity:0"/>
    </g>
    <line id="drop" class="drop" x1="${P1.x}" y1="${P1.y}" x2="${P1.x}" y2="${P1.y}" style="opacity:0"/>
    <path id="rtang" d="M${Q1.x - 18},${Q1.y}V${Q1.y - 18}H${Q1.x}" class="rt" style="opacity:0"/>
    <g id="brk" style="opacity:0">
      <line id="brkL" class="brk" x1="${O1.x}" y1="${BR_Y - 13}" x2="${O1.x}" y2="${BR_Y + 13}"/>
      <line id="brkR" class="brk" x1="${Q1.x}" y1="${BR_Y - 13}" x2="${Q1.x}" y2="${BR_Y + 13}"/>
      <line id="brkM" class="brk" x1="${O1.x}" y1="${BR_Y}" x2="${Q1.x}" y2="${BR_Y}"/>
    </g>
    <circle id="dotO" cx="${O1.x}" cy="${O1.y}" r="7" fill="${C.purple}" style="opacity:0"/>
    <circle id="dotQ" cx="${Q1.x}" cy="${Q1.y}" r="7" fill="#fff" style="opacity:0"/>
    <circle id="ringI" class="ring" cx="${X(0)}" cy="${Y(1)}" r="10" style="opacity:0;stroke:${C.blue}"/>
    <circle id="ringP" class="ring" cx="${P1.x}" cy="${P1.y}" r="10" style="opacity:0;stroke:${C.purple}"/>
    <g id="head" style="opacity:0">
      <line id="needle" class="needle" x1="0" y1="0" x2="0" y2="0"/>
      <line id="tang" class="tang" x1="0" y1="0" x2="0" y2="0"/>
      <circle id="ringm" class="ring" cx="0" cy="0" r="18" style="opacity:0;stroke:${C.purple}"/>
      <circle class="ret" r="17" cx="0" cy="0"/>
      <path class="ret" d="M0,-30V-22M0,22V30M-30,0H-22M22,0H30"/>
      <circle r="4.5" cx="0" cy="0" fill="${C.blue}"/>
    </g>
    ${sparkSvg}
  </svg>
  ${axisLabels}
  <div id="hud" style="opacity:0">
    <div id="hudbg" class="hbg"></div>
    ${scanHud}${flyHud}
  </div>
  <div id="lbl-h" class="t" style="left:${X(1) + 16}px;top:${midY(1) - 16}px;width:120px;height:32px;font-size:24px;color:${C.blue};justify-content:flex-start;opacity:0">${tx(it("Height"))}</div>
  <div id="lbl-b" class="t" style="left:${X(0) - 22 - 240}px;top:${BR_Y - 18}px;width:240px;height:36px;font-size:28px;color:${C.purple};justify-content:flex-end;opacity:0">${tx(it("Base ") + "\\equiv 1.0")}${LOCK(28)}</div>
</div></div>`;

// ------------------------------------------------------------------ zone 3: banner (820x100, y 980 - 1080)
const BN = { x: 130, y: 980, w: 820, h: 100 };
const ba = (id, html, on = false) =>
  `<div id="${id}" class="ba" style="opacity:${on ? 1 : 0}">${html}</div>`;
const banner = `<div id="banner">
${ba("BA", `<div class="l1">${tx(it("EVERY FUNCTION COLLAPSES UNDER DERIVATIVES..."))}</div><div class="l2">${tx(it("EXCEPT ONE."))}</div>`, true)}
${ba("BB", `<div class="row c">${tx(it("Slope") + "=\\dfrac{" + it("Height") + "}{" + it("Base") + "}=\\dfrac{e^{x}}{1.0}\\equiv e^{x}\\quad" + it("[BASE IS CLAMPED AT 1.0]"))}</div>`)}
${ba("BC", `<div class="row c">${tx(it("AS HEIGHT EXPLODES, BASE STAYS 1.0 ") + "\\implies\\dfrac{d}{dx}(e^{x})\\equiv e^{x}")}</div>`)}
${ba("BD", `<div class="row c">${tx("\\dfrac{d}{dx}\\left(e^{x}\\right)\\equiv e^{x}\\quad" + it("[AN EIGENFUNCTION OF CALCULUS ") + "\\checkmark" + it("]"))}</div>`)}
</div>`;

// ------------------------------------------------------------------ zone 4: one persistent glass card, three pages
const CARD = { x: 150, y: 1140, w: 780, h: 460 };
const rows = [
  {
    tex: "\\frac{d}{dx}(x^{2})=2x",
    cap: "COLLAPSES TO A LINE",
    f1: (x) => x * x,
    f2: (x) => 2 * x,
    d: [-1.5, 1.5],
    r: [-3, 3],
  },
  {
    tex: "\\frac{d}{dx}(\\sin x)=\\cos x",
    cap: "PHASE-SHIFTED",
    f1: Math.sin,
    f2: Math.cos,
    d: [-Math.PI, Math.PI],
    r: [-1.25, 1.25],
  },
  {
    tex: "\\frac{d}{dx}(e^{x})=e^{x}",
    cap: "ZERO CHANGE",
    f1: f,
    f2: (x) => dnum(x),
    d: [-1.5, 1.5],
    r: [-0.4, 4.9],
  },
];
const ROWY = [80, 230, 380];
const PW = 280,
  PH = 116;
function miniPath(fn, d, r) {
  const pts = [];
  for (let i = 0; i <= 80; i++) {
    const x = d[0] + ((d[1] - d[0]) * i) / 80;
    pts.push(
      `${(6 + ((PW - 12) * i) / 80).toFixed(1)},${(PH - 6 - ((PH - 12) * (fn(x) - r[0])) / (r[1] - r[0])).toFixed(1)}`,
    );
  }
  return "M" + pts.join("L");
}
const pageA = rows
  .map((r, i) => {
    const cy = ROWY[i];
    const m = M("cf" + i);
    const px = m.cx - CARD.x,
      py = m.cy - CARD.y;
    const w = (m.w || 300) + 36,
      h = (m.h || 60) + 8;
    const mark =
      i < 2
        ? `<svg class="xmark" id="x${i}" style="left:${px - w / 2}px;top:${py - h / 2}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="M8,8L${w - 8},${h - 8}M${w - 8},8L8,${h - 8}" stroke="${C.red}" stroke-width="8" stroke-linecap="round" fill="none"/></svg>`
        : `<svg class="xmark" id="x2" style="left:${px - w / 2}px;top:${py - h / 2}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="18" stroke="${C.purple}" stroke-width="5" fill="none"/></svg>`;
    return `
    ${box({ id: "cf" + i, cx: 40, cy: cy - 20, w: 380, h: 62, size: 40, color: "rgba(255,255,255,.92)", html: tx(r.tex), left: true, m: true })}
    ${box({ id: "cc" + i, cx: 40, cy: cy + 34, w: 380, h: 30, size: 24, color: i < 2 ? C.red : C.purple, html: tx(it(r.cap)), left: true })}
    <svg class="mini" style="left:450px;top:${cy - PH / 2}px" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">
      <rect x="0" y="0" width="${PW}" height="${PH}" rx="14" fill="rgba(10,10,16,.55)" stroke="rgba(255,255,255,.08)"/>
      <path d="${miniPath(r.f1, r.d, r.r)}" fill="none" stroke="${C.blue}" stroke-width="4.5" stroke-linecap="round" opacity="${i === 2 ? 0.5 : 0.85}"/>
      <defs><clipPath id="mc${i}"><rect id="mcr${i}" x="0" y="0" width="0" height="${PH}"/></clipPath></defs>
      <path d="${miniPath(r.f2, r.d, r.r)}" fill="none" stroke="${i === 2 ? C.purple : C.red}" stroke-width="${i === 2 ? 3 : 4.5}" stroke-linecap="round" clip-path="url(#mc${i})"/>
    </svg>
    ${mark}`;
  })
  .join("");

// state B: live numerical lock table
const COLX = { h: 330, b: 520, s: 690 };
const cell = (id, x, cy, tex, color, size = 36, extra = "") =>
  box({ id, cx: x, cy, w: 150, h: 48, size, color, html: tx(tex), style: extra });
const liveRows = fly
  .map((s) => {
    const hgt = f3(f(s.x)),
      slp = f3(dnum(s.x));
    return `<div id="lv${s.k}" class="lv" style="opacity:0">${box({ cx: 36, cy: 268, w: 250, h: 40, size: 30, color: "#fff", html: tx(it("LIVE ") + "x=" + f2(s.x)), left: true })}${cell("", COLX.h, 268, hgt, C.blue)}${cell("", COLX.b, 268, "1.0", C.purple)}${cell("", COLX.s, 268, slp, C.red)}</div>`;
  })
  .join("");
const pageB = `
  ${box({ id: "tb0", cx: 390, cy: 44, w: 740, h: 36, size: 28, color: "rgba(255,255,255,.85)", html: tx(it("LIVE NUMERICAL LOCK")) })}
  ${box({ cx: COLX.h, cy: 104, w: 160, h: 30, size: 24, color: C.blue, html: tx(it("HEIGHT")) })}
  ${box({ cx: COLX.b, cy: 104, w: 160, h: 30, size: 24, color: C.purple, html: tx(it("BASE")) })}
  ${box({ cx: COLX.s, cy: 104, w: 160, h: 30, size: 24, color: C.red, html: tx(it("SLOPE")) })}
  ${box({ id: "tr1l", cx: 36, cy: 168, w: 250, h: 40, size: 30, color: "#fff", html: tx(it("AT ") + "x=1.0"), left: true })}
  <div id="tr1" style="opacity:0">${cell("", COLX.h, 168, f3(f(1)), C.blue)}${cell("", COLX.b, 168, "1.0", C.purple)}${cell("", COLX.s, 168, f3(dnum(1)), C.red)}</div>
  <div id="livebg" style="position:absolute;left:18px;top:236px;width:744px;height:64px;border-radius:16px;background:rgba(176,38,255,.14);border:1px solid rgba(176,38,255,.45);opacity:0"></div>
  ${liveRows}
  ${box({ cx: 36, cy: 368, w: 250, h: 40, size: 30, color: "rgba(255,255,255,.6)", html: tx(it("AS ") + "x\\to2.0"), left: true })}
  <div id="tr3" style="opacity:.6">${cell("", COLX.h, 368, "\\to" + f3(f(2)), C.blue)}${cell("", COLX.b, 368, "1.0", C.purple)}${cell("", COLX.s, 368, "\\to" + f3(dnum(2)), C.red)}</div>`;

// state C: CTA (card is scaled 1.1 at the end, so local sizes are final / 1.1 except where contrast needs more)
const pageC = `
  <div id="ctaglow" style="position:absolute;left:60px;top:176px;width:660px;height:130px;border-radius:65px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  ${box({ id: "ct1a", cx: 390, cy: 62, w: 740, h: 56, size: 40, color: C.red, html: tx(it("SAVE THIS")), style: "opacity:0" })}
  <div id="ct1b" class="t" style="left:20px;top:92px;width:740px;height:56px;font-size:40px;color:${C.red};opacity:0">${tx(it("GEOMETRIC SECRET"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2a", cx: 390, cy: 216, w: 760, h: 48, size: 35, color: C.blue, html: tx(it("WHAT IS THE BASE LENGTH")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 390, cy: 268, w: 760, h: 48, size: 35, color: C.blue, html: tx(it("FOR ") + "2^{x}" + it("? COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
  ${box({ id: "ct3", cx: 390, cy: 396, w: 760, h: 34, size: 22, color: "rgba(255,255,255,.7)", html: tx(it("MAE ACADEMY ") + "\\bullet" + it(" APPLIED MATHEMATICS")), style: "opacity:0" })}`;
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px">
  <div id="pA" class="pg">${pageA}</div>
  <div id="pB" class="pg" style="opacity:0">${pageB}</div>
  <div id="pC" class="pg">${pageC}</div>
</div>`;

// ------------------------------------------------------------------ typography guard: strict KaTeX math italic
const allHtml = [header, plate, banner, card].join("");
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(allHtml))
  throw new Error("upright / bold math style found");
const boldCount = (allHtml.match(/class="[^"]*\btextbf\b/g) || []).length;
if (boldCount !== 1)
  throw new Error("expected exactly one \\textbf (the header title), found " + boldCount);
console.log(
  "typography ok: no \\mathbf / \\mathrm / upright math; one \\textbf (header title only, bold italic)",
);

// ------------------------------------------------------------------ css
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
html,body{background:#0A0A10;width:${W}px;height:${H}px;overflow:hidden}
#root{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:#0A0A10;overflow:hidden;
  background-image:linear-gradient(#161622 2px,transparent 2px),linear-gradient(90deg,#161622 2px,transparent 2px);background-size:60px 60px}
#flash0{position:absolute;left:0;top:0;width:${W}px;height:700px;background:radial-gradient(ellipse at 50% 22%,rgba(255,0,68,.5),transparent 65%);opacity:0}
.t{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1}
#plate{position:absolute;left:90px;top:340px;width:900px;height:610px;border-radius:32px;overflow:hidden;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08)}
#pc{position:absolute;left:-91px;top:-341px;width:${W}px;height:${H}px}
#g{position:absolute;left:0;top:0}
.gl{stroke:rgba(255,255,255,.07);stroke-width:2}
.axis{stroke:rgba(255,255,255,.4);stroke-width:2.5}
.bcurve{fill:none;stroke:${C.blue};stroke-width:4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 7px ${C.blue})}
.trR{fill:none;stroke:${C.red};stroke-width:7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 7px ${C.red})}
.trP{fill:none;stroke:${C.purple};stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 8px ${C.purple})}
.ring{fill:none;stroke-width:4}
.needle{stroke:${C.red};stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 6px ${C.red})}
.tang{stroke:${C.red};stroke-width:3.5;stroke-linecap:round;opacity:.9}
.ret{fill:none;stroke:${C.blue};stroke-width:3.5;stroke-linecap:round;filter:drop-shadow(0 0 6px ${C.blue})}
.spark{filter:drop-shadow(0 0 4px #fff)}
.drop{stroke:${C.blue};stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 7px ${C.blue})}
.tgl{stroke:${C.red};stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 7px ${C.red})}
.brk{stroke:${C.purple};stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 8px ${C.purple})}
.rt{fill:none;stroke:rgba(255,255,255,.75);stroke-width:2.5}
.hbg{position:absolute;left:146px;top:396px;width:330px;height:148px;border-radius:18px;background:rgba(10,10,16,.45);border:1px solid rgba(255,255,255,.08)}
.rd{position:absolute;left:162px;top:402px;width:300px;height:108px;white-space:nowrap}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:25px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:38px;color:${C.red};line-height:1.15;margin-top:2px}
.ba .row{font-size:30px;display:flex;align-items:center;justify-content:center}
.ba .row.c{font-size:26px}
#card{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1);overflow:hidden}
.pg{position:absolute;left:0;top:0;width:780px;height:460px}
.lv{position:absolute;left:0;top:0;width:780px;height:460px}
.mini{position:absolute}
.xmark{position:absolute;opacity:0;overflow:visible}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = {
  geo: { x0: 140, kx: KX, y0: Y0, ky: KY },
  rig: { P1, O1, Q1, BR_Y },
  scan,
  fly,
  sparks,
  PW,
  q03: q(0.3),
  c03: c3(0.3),
  XS0,
  midY1: midY(1),
};

function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>The Immortal Function: The e^x Triangle in Motion</title>
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
