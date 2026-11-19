// THE TRANSFORMER AND ITS FLUX (26.0 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// v = N dphi/dt: the flux is the thing. The page draws the core with its flux, the flux and the two voltages, the turns ratio, the
// ampere-turn balance and the saturation of the core (B-H curve and magnetizing current) from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const xfSrc = fs.readFileSync(new URL("./xfm.js", import.meta.url), "utf8");
const XF = new Function(xfSrc + "\nreturn globalThis.XF;")();

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 26.0;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  s1: 2.2,
  t0: 2.4, // the cursor starts: one electrical cycle every PER seconds
  PER: 2.6,
  st: [2.2, 4.6, 7.0, 13.8, 16.6], // banners
  sw: [2.4, 4.8, 7.2, 9.4, 11.6, 14.0, 16.8, 18.0], // counters (the snap)
  lock: 19.6,
  banF: 20.6,
  card: 22.0,
  pulse: 24.4,
};

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
let SPIKE = 0;
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))))
      throw new Error(`${what}: ${a} vs ${b}`);
  };
  const w = XF.TWO * XF.F0,
    Phim = XF.Bm(XF.F0) * XF.A;
  // Faraday: v = N dphi/dt. The flux of a sinusoidal supply is sinusoidal, its derivative gives back the supply
  const dt = 1 / (XF.F0 * 20000);
  let vpk = 0;
  for (let k = 1; k < 20000; k++) {
    const t = k * dt,
      v = (XF.N1 * (Phim * Math.sin(w * (t + dt)) - Phim * Math.sin(w * (t - dt)))) / (2 * dt);
    vpk = Math.max(vpk, v);
  }
  near(vpk, XF.V1 * Math.SQRT2, 1e-3, "N dphi/dt reproduces the supply peak");
  // the flux is the integral of the voltage: it peaks a quarter of a period AFTER the voltage (a 90 degree lag)
  let lam = 0,
    tv = 0,
    tphi = 0,
    vmax = -1,
    lmax = -1e9;
  for (let k = 0; k < 20000; k++) {
    const t = k * dt,
      v = XF.V1 * Math.SQRT2 * Math.cos(w * t);
    lam += v * dt;
    if (v > vmax) {
      vmax = v;
      tv = t;
    }
    if (lam > lmax) {
      lmax = lam;
      tphi = t;
    }
  }
  near(
    (tphi - tv) * XF.F0,
    0.25,
    2e-3,
    "the flux lags the voltage by a quarter of a period (90 degrees)",
  );
  near(
    lmax / XF.N1,
    Phim,
    5e-3,
    "the flux peak is the integral of the voltage over a quarter period",
  );
  // the peak flux density: B = V / (4.44 f N A)
  near(XF.Bm(50), XF.V1 / (4.44 * 50 * XF.N1 * XF.A), 1e-3, "B = V / (4.44 f N A)");
  near(XF.Bm(25), 2 * XF.Bm(50), 1e-12, "half the frequency doubles the flux");
  if (!(XF.Bm(50) < XF.BS && XF.Bm(25) > XF.BS))
    throw new Error("50 Hz must be below saturation and 25 Hz above it");
  // one core, two coils: the same flux gives V2/V1 = N2/N1
  for (const a of [1, 2, 0.5]) {
    const N2 = XF.N1 * a;
    let v2 = 0;
    for (let k = 1; k < 20000; k++) {
      const t = k * dt;
      v2 = Math.max(
        v2,
        (N2 * (Phim * Math.sin(w * (t + dt)) - Phim * Math.sin(w * (t - dt)))) / (2 * dt),
      );
    }
    near(v2 / vpk, a, 2e-3, `V2/V1 = N2/N1 at a = ${a}`);
    const id = XF.ideal(a);
    near(id.I1 * XF.N1, id.I2 * N2, 1e-12, `ampere-turns balance at a = ${a}`);
    near(id.P1, id.P2, 1e-12, `power in = power out at a = ${a}`);
  }
  near(XF.ideal(2).V2, 460, 1e-12, "V2 = 460 V");
  near(XF.ideal(0.5).V2, 115, 1e-12, "V2 = 115 V");
  near(XF.ideal(0.5).I1, 2.5, 1e-12, "I1 = 2.5 A");
  near(XF.ideal(0.5).I2, 5, 1e-12, "I2 = 5 A");
  near(XF.ideal(0.5).P1, 575, 1e-12, "P = 575 W");
  // the magnetizing current: a sine of flux needs an almost sinusoidal current below saturation and a violently distorted one above it
  const thd = (f) => {
    const n = 4096,
      xs = [];
    for (let k = 0; k < n; k++) xs.push(XF.im(XF.Bm(f) * Math.sin((XF.TWO * k) / n)));
    const h = (m) => {
      let re = 0,
        im = 0;
      for (let k = 0; k < n; k++) {
        const a = (XF.TWO * m * k) / n;
        re += xs[k] * Math.cos(a);
        im -= xs[k] * Math.sin(a);
      }
      return (2 / n) * Math.hypot(re, im);
    };
    let s = 0;
    for (let m = 2; m < 200; m++) s += h(m) ** 2;
    return Math.sqrt(s) / h(1);
  };
  if (!(thd(50) < 0.05))
    throw new Error("at 50 Hz the magnetizing current must be nearly sinusoidal: " + thd(50));
  if (!(thd(25) > 0.5))
    throw new Error("at 25 Hz the magnetizing current must be badly distorted: " + thd(25));
  SPIKE = Math.round(XF.im(XF.Bm(25)) / XF.im(XF.Bm(50)) / 100) * 100;
  if (!(SPIKE > 1000))
    throw new Error("the spike must be more than a thousand times the rated one");
  console.log(
    "maths ok: N dphi/dt = supply, flux lags voltage by 90 degrees, B = V/(4.44 f N A) = " +
      XF.Bm(50).toFixed(3) +
      " T at 50 Hz and " +
      XF.Bm(25).toFixed(3) +
      " T at 25 Hz (Bs = 1.8 T), V2/V1 = N2/N1, N1 I1 = N2 I2, P in = P out, magnetizing-current THD " +
      (100 * thd(50)).toFixed(1) +
      " % -> " +
      (100 * thd(25)).toFixed(0) +
      " %, peak x" +
      SPIKE,
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
const rnd = mulberry32(20261119);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry
const PA = [90, 340, 900, 470]; // the core with its coils (left), voltage bars or the B meter (right)
const PB = [90, 830, 900, 200]; // flux and voltages over two cycles
const PC = [90, 1050, 900, 180]; // power and current bars, then the B-H curve and the magnetizing current
const PLOT = { x0: 130, w: 830, y0: 930, k: 50 };

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE TRANSFORMER}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("IT IS ALL ABOUT THE FLUX")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const lab = (id, cx, cy, w, size, tex, op = 1, color = C.white) =>
  box({ id, cx, cy, w, h: 38, size, color, html: tx(tex), style: op === 1 ? "" : `opacity:${op}` });
const labels = [
  // the core
  lab("lN1", 290, 412, 70, 30, "N_{1}"),
  lab("lN2", 590, 412, 70, 30, "N_{2}", 1),
  lab("lv1", 112, 585, 60, 30, "v_{1}"),
  lab("lv2", 790, 585, 60, 30, "v_{2}", 1),
  lab("lPhi", 440, 585, 50, 40, "\\Phi"),
  // the bars on the right of the core
  lab("lV1b", 852, 775, 60, 28, "V_{1}", 1),
  lab("lV2b", 922, 775, 60, 28, "V_{2}", 1),
  lab("lBb", 870, 775, 40, 28, "\\hat{B}", 0),
  lab("lBs", 950, 486, 50, 26, "B_{s}", 0),
  // the waveforms
  lab("lphi", 200, 856, 40, 30, "\\phi"),
  lab("lv1l", 330, 856, 60, 30, "v_{1}"),
  lab("lv2l", 460, 856, 60, 30, "v_{2}", 1),
  lab("l90", 597, 850, 70, 28, "90^{\\circ}", 0),
  // the bottom panel
  lab("lP1", 135, 1100, 50, 26, "P_{1}", 0),
  lab("lP2", 135, 1150, 50, 26, "P_{2}", 0),
  lab("lI1", 605, 1100, 50, 26, "I_{1}", 0),
  lab("lI2", 605, 1150, 50, 26, "I_{2}", 0),
  lab("lBHB", 160, 1072, 30, 26, "B", 0),
  lab("lBHH", 505, 1180, 30, 26, "H", 0),
  lab("lim", 650, 1072, 50, 26, "i_{m}", 0),
  lab("lspike", 905, 1076, 120, 28, `\\times${SPIKE}`, 0),
].join("");

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
  mkC("c0", "V_{2}/V_{1}=N_{2}/N_{1}", C.blue, 56, false),
  mkC("c1", "v=N\\dfrac{d\\phi}{dt}", C.blue, 52),
  mkC("c2", "\\phi=\\dfrac{1}{N}\\int v\\,dt", C.blue, 50),
  mkC("c3", "\\dfrac{V_{2}}{V_{1}}=\\dfrac{N_{2}}{N_{1}}", C.blue, 50),
  mkC("c4", "N_{2}=2N_{1}\\;\\Rightarrow\\;V_{2}=460\\,\\textit{V}", C.blue, 50),
  mkC("c5", "N_{2}=N_{1}/2\\;\\Rightarrow\\;V_{2}=115\\,\\textit{V}", C.blue, 50),
  mkC("c6", "N_{1}I_{1}=N_{2}I_{2}", C.blue, 56),
  mkC("c7", "\\hat B=\\dfrac{V}{4.44\\,f\\,N\\,A}=1.04\\,\\textit{T}", C.blue, 46),
  mkC("c8", "f=25\\,\\textit{Hz}\\;\\Rightarrow\\;\\hat B=2.07\\,\\textit{T}>B_{s}", C.blue, 46),
  mkC("cfin", it("THE FLUX SETS THE LIMIT"), C.blue, 52),
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
  ["fm0", "\\hat B=\\dfrac{V}{4.44\\,f\\,N\\,A}", 44, false],
  ["f1", "\\phi=\\hat\\Phi\\sin\\omega t\\;\\Rightarrow\\;v=N\\omega\\hat\\Phi\\cos\\omega t", 38],
  ["f2", "\\hat\\Phi=\\dfrac{\\hat V}{2\\pi f N}", 44],
  ["f3", "v_{2}=N_{2}\\,d\\phi/dt", 50],
  ["f4", "V_{2}=V_{1}\\dfrac{N_{2}}{N_{1}}=460\\,\\textit{V}", 44],
  ["f5", "V_{2}=V_{1}\\dfrac{N_{2}}{N_{1}}=115\\,\\textit{V}", 44],
  ["f6", "230\\cdot2.5=115\\cdot5=575\\,\\textit{W}", 44],
  ["f7", "B_{s}\\approx1.8\\,\\textit{T}", 54],
  ["f8", `i_{m}\\;\\times${SPIKE}`, 54],
  ["f9", "\\dfrac{V}{f}\\propto\\hat B", 50],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("WHY DOES A TRANSFORMER NEED AC?"), it("BECAUSE THE FLUX MUST CHANGE"), 1),
  bn("bn1", it("A CHANGING FLUX INDUCES VOLTAGE"), "v=N\\,d\\phi/dt", 0),
  bn("bn2", it("THE FLUX LAGS THE VOLTAGE BY 90") + "^{\\circ}", "\\phi=(1/N)\\int v\\,dt", 0),
  bn("bn3", it("ONE CORE, TWO COILS"), it("THE SAME FLUX LINKS BOTH"), 0),
  bn("bn4", it("THE AMPERE-TURNS BALANCE"), it("POWER IN = POWER OUT"), 0),
  bn("bn5", it("TOO MUCH FLUX SATURATES THE CORE"), it("HALVE THE FREQUENCY: DOUBLE THE FLUX"), 0),
  bn("bnF", it("VOLTS PER HERTZ SET THE FLUX"), "\\hat B=V/(4.44\\,f\\,N\\,A)", 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("WHY DO TRANSFORMERS HUM?")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
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
  PA,
  PB,
  PC,
  PLOT,
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
<title>The Transformer</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="left:${PA[0]}px;top:${PA[1]}px;width:${PA[2]}px;height:${PA[3]}px"></div>
<div class="panel" style="left:${PB[0]}px;top:${PB[1]}px;width:${PB[2]}px;height:${PB[3]}px"></div>
<div class="panel" style="left:${PC[0]}px;top:${PC[1]}px;width:${PC[2]}px;height:${PC[3]}px"></div>
<div id="glow" style="position:absolute;left:90px;top:340px;width:900px;height:890px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:340px;width:900px;height:890px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
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
${xfSrc}
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
