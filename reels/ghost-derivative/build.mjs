// THE IMMORTAL FUNCTION: build script (KaTeX at build time, maths asserted, single-file index.html).
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

// ------------------------------------------------------------------ geometry + maths (asserted)
const X = (x) => 140 + 160 * (x + 2); // x in [-2, 3] -> [140, 940]
const Y = (y) => 880 - 38 * y;
const f = Math.exp;
const dnum = (x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h); // the tracer's derivative: numerical, not e^x
const XA = -1.5,
  XB = 2.2,
  T0 = 2.8,
  T1 = 8.5; // scan window
const TICK = 0.12;
const NT = Math.floor((T1 - T0 - 1e-9) / TICK) + 1; // 48 ticks
(function assertMath() {
  let worst = 0,
    worstPx = 0;
  for (let x = -2; x <= 3; x += 0.005) {
    worst = Math.max(worst, Math.abs(dnum(x) - f(x)) / f(x));
    worstPx = Math.max(worstPx, Math.abs(Y(dnum(x)) - Y(f(x))));
  }
  const pct = (worst * 100).toFixed(3);
  if (pct !== "0.000") throw new Error("deviation is " + pct + "%, banner would lie");
  if (worstPx > 0.01) throw new Error("trace deviates " + worstPx + " px");
  // the failure cases really do change the function
  const dev2 = Math.abs(2 * 1.5 - 1.5 * 1.5);
  const devS = Math.abs(Math.cos(0.5) - Math.sin(0.5));
  if (!(dev2 > 0.5 && devS > 0.1)) throw new Error("comparison rows would not show a difference");
  console.log(
    `maths ok: max relative deviation ${pct}%  (${worstPx.toFixed(5)} px); ${NT} scanner ticks`,
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
const M = (k) => L[k] || { cx: 0, cy: 0, w: 120, h: 50 };

/** absolutely placed box; (cx, cy) are centre coordinates in the coordinate system of its parent */
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
}) {
  const l = left ? cx : cx - w / 2;
  return `<div ${id ? `id="${id}"` : ""} class="t ${cls}" ${m ? `data-m="${id}"` : ""} style="left:${l}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;font-size:${size}px;color:${color};${left ? "justify-content:flex-start;" : ""}${style}">${html}</div>`;
}
const BOOKMARK = (c = C.red) =>
  `<svg width="40" height="52" viewBox="0 0 24 32" style="margin-left:16px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${c}"/></svg>`;

// ------------------------------------------------------------------ zone 1: header
const header = `
${box({ id: "h-title", cx: 540, cy: 180, w: 1000, h: 90, size: 58, color: C.red, html: tx("\\textbf{THE IMMORTAL FUNCTION}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 232, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("WHY DERIVATIVES CANNOT TOUCH ") + "e^{x}") })}
<div id="h-rule" style="position:absolute;left:480px;top:268px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>`;

// ------------------------------------------------------------------ zone 2: the dual-tracer arena
const grid = [];
for (const x of [-2, -1, 0, 1, 2, 3])
  grid.push(`<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="372" class="gl"/>`);
for (const y of [2, 4, 6, 8, 10, 12])
  grid.push(`<line x1="140" y1="${Y(y)}" x2="940" y2="${Y(y)}" class="gl"/>`);
const ptsE = [],
  ptsD = [];
for (let x = -2; x <= 3.0001; x += 0.02) {
  ptsE.push(`${X(x).toFixed(2)},${Y(f(x)).toFixed(2)}`);
  ptsD.push(`${X(x).toFixed(2)},${Y(dnum(x)).toFixed(2)}`);
}
const dE = "M" + ptsE.join("L"),
  dD = "M" + ptsD.join("L");
const axisLabels = [-2, -1, 0, 1, 2, 3]
  .map((v) =>
    box({
      cx: X(v),
      cy: 912,
      w: 60,
      h: 30,
      size: 24,
      color: "rgba(255,255,255,.6)",
      html: tx(String(v)),
    }),
  )
  .concat(
    [2, 4, 6, 8, 10, 12].map((v) =>
      box({
        cx: 116,
        cy: Y(v),
        w: 50,
        h: 30,
        size: 24,
        color: "rgba(255,255,255,.6)",
        html: tx(String(v)),
      }),
    ),
  )
  .concat([
    box({ cx: 958, cy: 880, w: 40, h: 30, size: 28, color: "rgba(255,255,255,.6)", html: tx("x") }),
  ])
  .join("");

// sparks: 2 per scanner tick, seeded
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
const ticks = [];
for (let k = 0; k < NT; k++) {
  const t = +(T0 + k * TICK).toFixed(3);
  const x = XA + ((XB - XA) * (t - T0)) / (T1 - T0);
  ticks.push({ k, t, x });
}
const sparkCols = [C.red, C.purple, C.white, C.red];
const sparks = [];
ticks.forEach((tk) => {
  for (let j = 0; j < 2; j++) {
    const ang = -Math.PI / 2 + (rnd() - 0.5) * 2.4;
    const sp = 34 + rnd() * 52;
    sparks.push({
      id: `sp${tk.k}_${j}`,
      k: tk.k,
      cx: X(tk.x),
      cy: Y(f(tk.x)),
      dx: Math.cos(ang) * sp,
      dy: Math.sin(ang) * sp + 14,
      r: 2.4 + rnd() * 2.4,
      c: sparkCols[(tk.k * 2 + j) % 4],
    });
  }
});
const sparkSvg = sparks
  .map(
    (s) =>
      `<circle id="${s.id}" class="spark" cx="${s.cx.toFixed(2)}" cy="${s.cy.toFixed(2)}" r="${s.r.toFixed(1)}" fill="${s.c}" style="opacity:0"/>`,
  )
  .join("");

// HUD readouts, one per tick (shown for exactly one tick interval)
const fx = (v) => (Math.round(v * 1000) / 1000).toFixed(3);
const readouts = ticks
  .map((tk) => {
    const xs = (tk.x < 0 ? "-" : "") + Math.abs(tk.x).toFixed(2);
    if (fx(f(tk.x)) !== fx(dnum(tk.x))) throw new Error("readout mismatch at " + tk.x);
    const line = (c, t) =>
      `<div style="height:34px;display:flex;align-items:center;font-size:24px;color:${c}">${tx(t)}</div>`;
    return `<div id="rd${tk.k}" class="rd" style="opacity:0">${line("#fff", `x=${xs}`)}${line(C.blue, "f=" + fx(f(tk.x)))}${line(C.red, "f'=" + fx(dnum(tk.x)))}</div>`;
  })
  .join("");

const plate = `
<div id="plate"><div id="pc">
  <svg id="g" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <clipPath id="plotclip"><rect x="130" y="372" width="820" height="530"/></clipPath>
      <clipPath id="revE"><rect id="revE-r" x="130" y="300" width="0" height="640"/></clipPath>
      <clipPath id="revR"><rect id="revR-r" x="${X(XA)}" y="300" width="0" height="640"/></clipPath>
      <clipPath id="revP"><rect id="revP-r" x="${X(XA)}" y="300" width="0" height="640"/></clipPath>
    </defs>
    <g id="gridg" style="opacity:.25">${grid.join("")}
      <line x1="140" y1="${Y(0)}" x2="948" y2="${Y(0)}" class="axis"/>
      <line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="364" class="axis"/>
    </g>
    <g clip-path="url(#plotclip)">
      <g clip-path="url(#revE)"><path id="base" d="${dE}" class="bcurve"/></g>
      <g clip-path="url(#revR)"><path id="trR" d="${dD}" class="trR"/></g>
      <g clip-path="url(#revP)"><path id="trP" d="${dD}" class="trP"/></g>
    </g>
    <circle id="ring1" class="ring" cx="${X(XB)}" cy="${Y(f(XB))}" r="10" style="opacity:0;stroke:${C.purple}"/>
    <circle id="ring2" class="ring" cx="${X(XB)}" cy="${Y(f(XB))}" r="10" style="opacity:0;stroke:${C.red}"/>
    <g id="head" style="opacity:0">
      <line id="needle" class="needle" x1="0" y1="0" x2="0" y2="0"/>
      <line id="tang" class="tang" x1="0" y1="0" x2="0" y2="0"/>
      <circle class="ret" r="17" cx="0" cy="0"/>
      <path class="ret" d="M0,-30V-22M0,22V30M-30,0H-22M22,0H30"/>
      <circle r="4.5" cx="0" cy="0" fill="${C.blue}"/>
    </g>
    ${sparkSvg}
  </svg>
  ${axisLabels}
  <div id="hud" style="opacity:0">
    <div class="hdot" style="left:150px;top:410px;background:${C.blue}"></div>
    ${box({ id: "hud-a", cx: 170, cy: 420, w: 300, h: 36, size: 28, color: C.blue, html: tx("f(x)=e^{x}"), left: true })}
    <div class="hdot" style="left:150px;top:458px;background:${C.red}"></div>
    ${box({ id: "hud-b", cx: 170, cy: 468, w: 400, h: 44, size: 28, color: C.red, html: tx("f'(x)=\\lim\\frac{\\Delta y}{\\Delta x}"), left: true })}
    ${readouts}
  </div>
</div></div>`;

// ------------------------------------------------------------------ zone 3: telemetry banner (820x100 at y 970)
const BN = { x: 130, y: 970, w: 820, h: 100 };
const ba = (id, html, on = false) =>
  `<div id="${id}" class="ba" style="opacity:${on ? 1 : 0}">${html}</div>`;
const banner = `<div id="banner">
${ba("BA", `<div class="l1">${tx(it("EVERY FUNCTION BREAKS UNDER DERIVATIVES..."))}</div><div class="l2">${tx(it("EXCEPT ONE."))}</div>`, true)}
${ba("BB", `<div class="row">${tx(it("READING: ") + "f(x)\\equiv f'(x)\\quad|\\quad" + it("DEVIATION: "))}<span id="dev" class="dev">${tx("\\mathbf{0.000\\%}")}</span></div>`)}
${ba("BC", `<div class="row c">${tx("\\frac{d}{dx}\\left(e^{x}\\right)\\equiv e^{x}\\quad" + it("[AN EIGENFUNCTION OF CALCULUS ") + "\\checkmark" + it("]"))}</div>`)}
</div>`;

// ------------------------------------------------------------------ zone 4: comparison card (state A) + CTA (state B)
const CMP = { x: 150, y: 1130, w: 780, h: 460 };
const rows = [
  {
    id: "r0",
    tex: "\\frac{d}{dx}(x^{2})=2x",
    cap: "BECOMES A LINE",
    f1: (x) => x * x,
    f2: (x) => 2 * x,
    d: [-1.5, 1.5],
    r: [-3, 3],
  },
  {
    id: "r1",
    tex: "\\frac{d}{dx}(\\sin x)=\\cos x",
    cap: "PHASE-SHIFTED WAVE",
    f1: Math.sin,
    f2: Math.cos,
    d: [-Math.PI, Math.PI],
    r: [-1.25, 1.25],
  },
  {
    id: "r2",
    tex: "\\frac{d}{dx}(e^{x})=e^{x}",
    cap: "IDENTICAL CLONE",
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
    const y = fn(x);
    pts.push(
      `${(6 + ((PW - 12) * i) / 80).toFixed(1)},${(PH - 6 - ((PH - 12) * (y - r[0])) / (r[1] - r[0])).toFixed(1)}`,
    );
  }
  return "M" + pts.join("L");
}
const cmpRows = rows
  .map((r, i) => {
    const cy = ROWY[i];
    const m = M("cf" + i);
    const ox = CMP.x,
      oy = CMP.y;
    const px = m.cx - ox,
      py = m.cy - oy; // measured formula centre, card-local
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
const cmp = `<div id="cmp" style="left:${CMP.x}px;top:${CMP.y}px;width:${CMP.w}px;height:${CMP.h}px">${cmpRows}</div>`;

const CTA = { x: 90, y: 1130, w: 900, h: 490 };
const cta = `<div id="cta" style="left:${CTA.x}px;top:${CTA.y}px;width:${CTA.w}px;height:${CTA.h}px;opacity:0">
  ${box({ id: "ct1", cx: 450, cy: 92, w: 860, h: 64, size: 46, color: C.red, html: tx(it("SAVE FOR YOUR NEXT")), style: "opacity:0" })}
  <div id="ct2" class="t" style="left:20px;top:128px;width:860px;height:64px;font-size:46px;color:${C.red};opacity:0">${tx(it("CALCULUS EXAM"))}${BOOKMARK()}</div>
  ${box({ id: "ct3", cx: 450, cy: 252, w: 860, h: 50, size: 34, color: C.blue, html: tx(it("DOES ANY OTHER FUNCTION")), style: "opacity:0" })}
  ${box({ id: "ct4", cx: 450, cy: 304, w: 860, h: 50, size: 34, color: C.blue, html: tx(it("DO THIS? COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
  ${box({ id: "ct5", cx: 450, cy: 422, w: 860, h: 36, size: 26, color: "rgba(255,255,255,.7)", html: tx(it("MAE ACADEMY ") + "\\bullet" + it(" APPLIED MATHEMATICS")), style: "opacity:0" })}
</div>`;

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
.t{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1}
#plate{position:absolute;left:90px;top:340px;width:900px;height:600px;border-radius:32px;overflow:hidden;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08)}
#pc{position:absolute;left:-91px;top:-341px;width:${W}px;height:${H}px}
#g{position:absolute;left:0;top:0}
.gl{stroke:rgba(255,255,255,.07);stroke-width:2}
.axis{stroke:rgba(255,255,255,.4);stroke-width:2.5}
.bcurve{fill:none;stroke:${C.blue};stroke-width:8;stroke-linecap:round;stroke-linejoin:round;opacity:.4}
.trR{fill:none;stroke:${C.red};stroke-width:7;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 7px ${C.red})}
.trP{fill:none;stroke:${C.purple};stroke-width:4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 8px ${C.purple})}
.ring{fill:none;stroke-width:4}
.needle{stroke:${C.red};stroke-width:5;stroke-linecap:round;filter:drop-shadow(0 0 6px ${C.red})}
.tang{stroke:${C.red};stroke-width:3.5;stroke-linecap:round;opacity:.9}
.ret{fill:none;stroke:${C.blue};stroke-width:3.5;stroke-linecap:round;filter:drop-shadow(0 0 6px ${C.blue})}
.spark{filter:drop-shadow(0 0 4px #fff)}
.rd{position:absolute;left:168px;top:518px;width:260px;height:102px;white-space:nowrap}
.hdot{position:absolute;width:12px;height:12px;border-radius:6px}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:25px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:38px;color:${C.red};line-height:1.15;margin-top:2px}
.ba .row{font-size:30px;display:flex;align-items:center;justify-content:center}
.ba .row.c{font-size:28px}
.dev{display:inline-block;margin-left:10px;color:${C.red}}
#cmp,#cta{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1);overflow:hidden}
#cta{border:2px solid rgba(255,0,68,.5)}
.mini{position:absolute}
.xmark{position:absolute;opacity:0;overflow:visible}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = {
  XA,
  XB,
  T0,
  T1,
  TICK,
  NT,
  ticks,
  sparks,
  geo: { x0: 140, kx: 160, y0: 880, ky: 38 },
  ROWY,
  PW,
};

function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>The Immortal Function</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
${plate}
${banner}
${cmp}
${cta}
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
