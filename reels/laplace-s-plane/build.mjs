// THE LAPLACE TRANSFORM: THE s-PLANE AS A LANDSCAPE (24.2 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// |H(s)| over s = sigma + j omega is a surface: poles are mountains, zeros are holes. The page draws that surface (the same
// grid, height law, colour law and camera as the MAE Academy simulator) on a canvas from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const lapSrc = fs.readFileSync(new URL("./lap.js", import.meta.url), "utf8");
const LAP = new Function(lapSrc + "\nreturn globalThis.LAP;")();

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const DIM = "rgba(255,255,255,.6)";
const W = 1080,
  H = 1920,
  DUR = 24.2;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  s1: 2.2, // banner of the stage
  st: [2.2, 4.9, 7.6, 10.3, 13.0],
  sw: [2.4, 5.1, 7.8, 10.5, 13.2], // the landscape snaps to the new function (the counter pops here)
  cutBan: 15.7,
  cut: 15.9,
  lock: 17.9,
  banF: 18.9,
  card: 20.2,
  pulse: 22.6,
};
const MORPH = [0.5, 0.22, 0.22, 0.22, 0.22];

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))))
      throw new Error(`${what}: ${a} vs ${b}`);
  };
  const simpson = (g, a, b, n = 400000) => {
    const hh = (b - a) / n;
    let s = g(a) + g(b);
    for (let i = 1; i < n; i++) s += g(a + i * hh) * (i % 2 ? 4 : 2);
    return (s * hh) / 3;
  };
  // closed forms of the h(t) shown on screen
  const closed = {
    A: (t) => Math.exp(-t),
    B: (t) => 0.5 * Math.exp(-t) * Math.sin(2 * t),
    C: (t) => 0.5 * Math.exp(t) * Math.sin(2 * t),
    D: (t) => 0.5 * Math.sin(2 * t),
    E: (t) => Math.exp(-t) * (0.5 + 0.5 * Math.cos(2 * t) - Math.sin(2 * t)),
  };
  for (const k of LAP.ORDER)
    for (const t of [0, 0.3, 1, 2.2, 4.7])
      near(LAP.h(LAP.SYS[k], t), closed[k](t), 1e-12, `h(t) of ${k} at ${t}`);
  // the definition: the integral of h(t) e^{-st} reproduces H(s) (s to the right of every pole)
  for (const k of LAP.ORDER) {
    const S = LAP.SYS[k];
    const smax = Math.max(...S.p.map((p) => p[0]));
    for (const w of [0, 0.7, -1.3]) {
      const sg = smax + 1.2;
      const re = simpson((t) => LAP.h(S, t) * Math.exp(-sg * t) * Math.cos(w * t), 0, 40);
      const im = -simpson((t) => LAP.h(S, t) * Math.exp(-sg * t) * Math.sin(w * t), 0, 40);
      const Hs = LAP.Hc(S, sg, w);
      near(re, Hs[0], 1e-6, `Laplace integral (re) of ${k} at s = ${sg} + j${w}`);
      near(im, Hs[1], 1e-6, `Laplace integral (im) of ${k} at s = ${sg} + j${w}`);
    }
  }
  // stability: poles in the left half-plane decay, in the right half-plane grow, on the axis neither
  for (const k of ["A", "B", "E"])
    if (Math.abs(LAP.h(LAP.SYS[k], 25)) > 1e-8) throw new Error(k + " must decay");
  if (
    !((Math.exp(10) / 2) * 0.99 > 1e3) ||
    Math.max(...Array.from({ length: 200 }, (_, i) => Math.abs(LAP.h(LAP.SYS.C, 10 + i * 0.01)))) <
      1e3
  )
    throw new Error("C must grow");
  const dAmp = Math.max(
    ...Array.from({ length: 400 }, (_, i) => Math.abs(LAP.h(LAP.SYS.D, 40 + i * 0.01))),
  );
  near(dAmp, 0.5, 1e-4, "D: undamped oscillation amplitude (sampled every 0.01 s)");
  // the frequency response is the cut sigma = 0
  for (const w of [0, 0.5, 1.7, 3.2])
    near(LAP.mag(LAP.SYS.A, 0, w), 1 / Math.sqrt(1 + w * w), 1e-13, "|1/(1+jw)|");
  near(LAP.mag(LAP.SYS.E, 0, 1), 0, 1e-15, "E has a zero at w = 1");
  near(LAP.mag(LAP.SYS.E, 0, 0), 0.2, 1e-13, "|H(0)| of E = 1/5");
  const Hj = LAP.Hc(LAP.SYS.E, 0, 0.8);
  const w = 0.8,
    num = 1 - w * w,
    d1 = [1, w],
    d2 = [5 - w * w, 2 * w];
  const dd = [d1[0] * d2[0] - d1[1] * d2[1], d1[0] * d2[1] + d1[1] * d2[0]];
  const q = [(num * dd[0]) / (dd[0] ** 2 + dd[1] ** 2), (-num * dd[1]) / (dd[0] ** 2 + dd[1] ** 2)];
  near(Hj[0], q[0], 1e-13, "H(jw) closed form (re)");
  near(Hj[1], q[1], 1e-13, "H(jw) closed form (im)");
  // the landscape: the grid contains every pole and zero exactly, a pole is the top of the height law, a zero the floor
  const idx = (arr, v) => arr.findIndex((a) => Math.abs(a - v) < 1e-12);
  for (const k of LAP.ORDER) {
    const S = LAP.SYS[k];
    for (const p of S.p) {
      const j = idx(LAP.gx, p[0]),
        i = idx(LAP.gy, p[1]);
      if (j < 0 || i < 0) throw new Error(`pole ${p} of ${k} is not a grid vertex`);
      near(
        LAP.SURF[k].hgt[i * (LAP.N + 1) + j],
        LAP.HA,
        1e-6,
        `pole of ${k} reaches the spire height`,
      );
    }
    for (const z of S.z) {
      const j = idx(LAP.gx, z[0]),
        i = idx(LAP.gy, z[1]);
      if (j < 0 || i < 0) throw new Error(`zero ${z} of ${k} is not a grid vertex`);
      near(LAP.SURF[k].hgt[i * (LAP.N + 1) + j], 0, 1e-9, `zero of ${k} sits on the floor`);
    }
  }
  if (idx(LAP.gx, 0) < 0) throw new Error("the jw axis (sigma = 0) must be a grid column");
  console.log(
    "maths ok: h(t) closed forms match the residues; the Laplace integral of h(t) reproduces H(s) for A..E; " +
      "A, B, E decay, C grows, D rings at amplitude 1/2; |H(jw)| = the sigma = 0 cut; E has a zero at w = 1; " +
      "every pole and zero is a grid vertex (poles reach the spire height, zeros touch the floor)",
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
const rnd = mulberry32(20261114);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry
const PS = [90, 340, 900, 650]; // the landscape panel
const PM = [90, 1010, 440, 220]; // the pole-zero map
const PR = [550, 1010, 440, 220]; // h(t), then |H(jw)|
const CAM = { S: 275, CX: 540, CY: 790, HM: 0.5 };
const scr = (x, y, z) => {
  const [xp, up] = LAP.proj(x, y, z);
  return [CAM.CX + CAM.S * xp, CAM.CY - CAM.S * up];
};
const MAP = { cx: 345, cy: 1125, half: 100 };
const RP = { x0: 585, x1: 970, y0: 1130, amp: 78 }; // right plot: baseline and half-height

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE LAPLACE TRANSFORM}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("THE s-PLANE AS A LANDSCAPE")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const aS = scr(1.2, 0, 0),
  aW = scr(0, 0, -1.2);
const labels = [
  box({
    id: "ax1",
    cx: aS[0] + 6,
    cy: aS[1] + 6,
    w: 60,
    h: 40,
    size: 34,
    color: DIM,
    html: tx("\\sigma"),
  }),
  box({
    id: "ax2",
    cx: aW[0] - 28,
    cy: aW[1] - 4,
    w: 70,
    h: 40,
    size: 34,
    color: DIM,
    html: tx("j\\omega"),
  }),
  box({ id: "lh", cx: 205, cy: 395, w: 200, h: 44, size: 36, color: C.white, html: tx("|H(s)|") }),
  box({
    id: "lgp",
    cx: 925,
    cy: 392,
    w: 110,
    h: 36,
    size: 30,
    color: C.white,
    html: tx(it("poles")),
  }),
  box({
    id: "lgz",
    cx: 925,
    cy: 436,
    w: 110,
    h: 36,
    size: 30,
    color: C.white,
    html: tx(it("zeros")),
  }),
  box({
    id: "ls",
    cx: 170,
    cy: 1052,
    w: 150,
    h: 36,
    size: 30,
    color: C.white,
    html: tx("s=\\sigma+j\\omega"),
  }),
  box({
    id: "mx1",
    cx: MAP.cx + MAP.half + 28,
    cy: MAP.cy + 22,
    w: 40,
    h: 32,
    size: 28,
    color: DIM,
    html: tx("\\sigma"),
  }),
  box({
    id: "mx2",
    cx: MAP.cx + 38,
    cy: MAP.cy - MAP.half + 18,
    w: 60,
    h: 32,
    size: 28,
    color: DIM,
    html: tx("j\\omega"),
  }),
  box({ id: "lt", cx: 925, cy: 1205, w: 110, h: 36, size: 32, color: C.white, html: tx("h(t)") }),
  box({
    id: "lw",
    cx: 905,
    cy: 1205,
    w: 150,
    h: 36,
    size: 30,
    color: C.white,
    html: tx("|H(j\\omega)|"),
    style: "opacity:0",
  }),
].join("");

// ------------------------------------------------------------------ counters (H(s)), formulas (h(t)), banners
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
const CNT = [
  "H(s)=\\dfrac{1}{s+1}",
  "H(s)=\\dfrac{1}{s^{2}+2s+5}",
  "H(s)=\\dfrac{1}{s^{2}-2s+5}",
  "H(s)=\\dfrac{1}{s^{2}+4}",
  "H(s)=\\dfrac{s^{2}+1}{(s+1)(s^{2}+2s+5)}",
];
const counters = [
  mkC("c0", CNT[4], C.blue, 52, false),
  ...CNT.map((t, i) => mkC("c" + (i + 1), t)),
  mkC("c6", "H(j\\omega)=0\\;" + it("AT ") + "\\omega=1", C.blue, 56),
  mkC("cfin", it("STABLE: POLES ON THE LEFT"), C.blue, 52),
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
  ["fm0", "H(s)=\\int_{0}^{\\infty}h(t)\\,e^{-st}\\,dt", 50, false],
  ["f1", "h(t)=e^{-t}", 56],
  ["f2", "h(t)=\\tfrac{1}{2}\\,e^{-t}\\sin 2t", 52],
  ["f3", "h(t)=\\tfrac{1}{2}\\,e^{t}\\sin 2t", 52],
  ["f4", "h(t)=\\tfrac{1}{2}\\sin 2t", 52],
  ["f5", "h(t)=e^{-t}\\left(\\tfrac{1}{2}+\\tfrac{1}{2}\\cos 2t-\\sin 2t\\right)", 40],
  ["f6", "H(j\\omega)=\\dfrac{1-\\omega^{2}}{(1+j\\omega)(5-\\omega^{2}+2j\\omega)}", 36],
  ["f7", "s=\\sigma+j\\omega", 56],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn(
    "bn0",
    it("WHAT DOES THE s-PLANE LOOK LIKE?"),
    "\\lvert H(s)\\rvert" + it(" IS A LANDSCAPE"),
    1,
  ),
  bn("bn1", it("A POLE IS A MOUNTAIN"), it("PEAK AT ") + "s=-1", 0),
  bn("bn2", it("SWAP THE FUNCTION"), it("THE LANDSCAPE SNAPS"), 0),
  bn("bn3", it("PUSH THE POLES RIGHT"), "h(t)" + it(" GROWS: UNSTABLE"), 0),
  bn("bn4", it("PUT THEM ON THE ") + "j\\omega" + it(" AXIS"), it("NO DECAY: A PURE SINE"), 0),
  bn("bn5", it("ADD ZEROS: DIG HOLES"), it("A NOTCH AT ") + "\\omega=1", 0),
  bn(
    "bn6",
    it("CUT ALONG THE ") + "j\\omega" + it(" AXIS"),
    it("THE SLICE IS ") + "H(j\\omega)",
    0,
  ),
  bn("bnF", it("POLES MAKE PEAKS, ZEROS MAKE HOLES"), it("THE SHAPE IS THE SYSTEM"), 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("TRY THE s-PLANE SIMULATOR")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("LINK IN BIO ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:180px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;

// ------------------------------------------------------------------ guards
const allHtml = [header, labels, counters, formulas, banner, card].join("");
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
  JSON.stringify({ ...T, dur: DUR }),
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
  MORPH,
  CAM,
  PS,
  PM,
  PR,
  MAP,
  RP,
  spark: Array.from({ length: 28 }, () => ({
    a: rnd() * Math.PI * 2,
    d: 160 + rnd() * 320,
    r: 2.5 + rnd() * 3.5,
  })),
  glitch: Array.from({ length: 200 }, () => rnd()),
};
function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>The Laplace Transform</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="left:${PS[0]}px;top:${PS[1]}px;width:${PS[2]}px;height:${PS[3]}px"></div>
<div class="panel" style="left:${PM[0]}px;top:${PM[1]}px;width:${PM[2]}px;height:${PM[3]}px"></div>
<div class="panel" style="left:${PR[0]}px;top:${PR[1]}px;width:${PR[2]}px;height:${PR[3]}px"></div>
<div id="glow" style="position:absolute;left:90px;top:340px;width:900px;height:890px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(37,99,235,.40),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:340px;width:900px;height:890px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
<div id="sw" style="position:absolute;left:90px;top:340px;width:900px;height:650px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(6,182,212,.45),transparent 70%);opacity:0"></div>
<canvas id="cv" data-layout-allow-overflow data-layout-ignore></canvas>
${labels}
${counters}
${formulas}
${banner}
${card}
<audio id="sfx" class="clip" src="assets/sfx.wav" data-start="0" data-duration="${DUR}" data-track-index="2" data-volume="1"></audio>
</div>
<script src="${gsapSrc}"></script>
<script>
window.__CFG = ${JSON.stringify(CFG)};
${lapSrc}
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
