// THREE-PHASE INVERTER: SINE PWM, SLICING DC INTO A SINE (23.0 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// A sine reference is compared with a triangular carrier; the result switches a DC bus. The page draws the references, the carrier,
// the pulses, their average, the line voltage, the load current, the bridge, the phasors and the harmonic spectrum from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const pwmSrc = fs.readFileSync(new URL("./pwm.js", import.meta.url), "utf8");
const PWM = new Function(pwmSrc + "\nreturn globalThis.PWM;")();

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 23.0;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  s1: 2.2,
  cyc0: 2.4, // the cursor starts to run: one fundamental period every CYC seconds
  CYC: 2.2,
  st: [2.2, 4.4, 6.6, 8.8, 11.2], // banners
  sw: [2.4, 4.6, 6.8, 9.0, 11.4, 13.9], // counters (the snap)
  m1: [11.4, 12.4], // the carrier stretches from 9 to 21
  m2: [13.9, 15.1], // ... and from 21 to 45
  lock: 16.6,
  banF: 17.6,
  card: 19.0,
  pulse: 21.4,
};
const MFS = [9, 21, 45];

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
const THD = {},
  SPEC = {};
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))))
      throw new Error(`${what}: ${a} vs ${b}`);
  };
  const m = PWM.M;
  for (const mf of [9, 15, 21, 45]) {
    const w = PWM.wave(mf, 4096);
    const mean = (x) => x.reduce((s, v) => s + v, 0) / x.length;
    // pulses: mf of them per period, half of the time on, the fundamental of the pole voltage is m Vdc / 2
    let rises = 0;
    for (let k = 0; k < 4096; k++) if (w.Sa[k] === 1 && w.Sa[(k + 4095) % 4096] === 0) rises++;
    if (rises !== mf) throw new Error(`mf = ${mf}: ${rises} pulses per period`);
    near(mean(Array.from(w.Sa)), 0.5, 2e-3, "mean of the pole voltage = Vdc / 2");
    const f1 = PWM.harm(Float32Array.from(w.Sa), 1);
    near(f1, m / 2, 1e-2, `fundamental of the pole voltage at mf = ${mf} is m Vdc / 2`);
    // line voltage: sqrt(3) m Vdc / 2 (peak), V_LL,rms = 0.612 m Vdc, no triplen harmonic when mf is a multiple of 3
    const fab = PWM.harm(w.vab, 1);
    near(fab, (Math.sqrt(3) * m) / 2, 1e-2, `fundamental of the line voltage at mf = ${mf}`);
    near(fab / Math.SQRT2, 0.612 * m, 1e-2, `V_LL,rms = 0.612 m Vdc at mf = ${mf}`);
    if (PWM.harm(w.vab, 3) > 6e-3)
      throw new Error("the third harmonic must cancel in the line voltage");
    // the strongest line-voltage harmonics sit at mf - 2, mf + 2 (and 2 mf +- 1): the carrier sidebands, nothing below mf - 4
    let hmax = 0,
      vmax = 0;
    for (let h = 2; h < 140; h++) {
      const v = PWM.harm(w.vab, h);
      if (v > vmax) {
        vmax = v;
        hmax = h;
      }
    }
    if (![mf - 2, mf + 2, 2 * mf - 1, 2 * mf + 1].includes(hmax))
      throw new Error(`mf = ${mf}: strongest harmonic at ${hmax}`);
    for (let h = 2; h < mf - 5; h++)
      if (PWM.harm(w.vab, h) > 6e-3) throw new Error(`mf = ${mf}: harmonic ${h} below the carrier`);
    // the average over one carrier period is the duty (1 + m sin) / 2, which is the sine
    const av = PWM.average(w.Sa, mf);
    let e = 0;
    for (let k = 0; k < 4096; k++) e = Math.max(e, Math.abs(av[k] - (1 + w.va[k]) / 2));
    if (e > (mf === 9 ? 0.09 : mf === 15 ? 0.06 : 0.04))
      throw new Error(`average of the pulses off by ${e} at mf = ${mf}`);
    // the load current: fundamental I1 = (m Vdc / 2) / |Z|, ripple falls with mf
    near(PWM.harm(w.ia, 1), PWM.I1, 2e-2, `fundamental of the current at mf = ${mf}`);
    THD[mf] = PWM.thd(w.ia);
    const sp = [];
    for (let h = 1; h <= 100; h++) sp.push(+(PWM.harm(w.vab, h) / fab).toFixed(4));
    SPEC[mf] = sp;
  }
  if (!(THD[9] > THD[15] && THD[15] > THD[21] && THD[21] > THD[45]))
    throw new Error("THD must fall with the carrier ratio");
  const ratio = THD[9] / THD[45];
  if (!(ratio > 4 && ratio < 6.5))
    throw new Error("THD_i must fall roughly as 1/mf (ratio of 5 expected): " + ratio);
  console.log(
    "maths ok: pole fundamental = m Vdc/2, line fundamental = sqrt(3) m Vdc/2 (V_LL,rms = 0.612 m Vdc), mf pulses per period, " +
      "no triplen harmonic, sidebands at mf+-2 and 2mf+-1, the average of the pulses is (1 + m sin)/2; " +
      "THD_i " +
      [9, 21, 45].map((k) => `${k}: ${(100 * THD[k]).toFixed(2)} %`).join(", "),
  );
})();

// the edges of the pole voltage during the first cycle (the sound ticks on them)
const EDGES = (() => {
  const w = PWM.wave(9);
  const out = [];
  for (let k = 0; k < PWM.NS; k++) {
    const prev = w.Sa[(k + PWM.NS - 1) % PWM.NS];
    if (w.Sa[k] !== prev) out.push([+(T.cyc0 + (T.CYC * k) / PWM.NS).toFixed(3), w.Sa[k]]);
  }
  return out;
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
const rnd = mulberry32(20261116);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry
const PA = [90, 340, 900, 430]; // reference sines against the carrier
const PB = [90, 790, 900, 230]; // pulses, average, line voltage, load current
const PC = [90, 1040, 900, 190]; // bridge (left), phasors then spectrum (right)
const PLOT = { x0: 130, w: 830, yA: 560, kA: 150, yB: 915, kB: 80 };
const BR = { xs: [200, 290, 380], top: 1066, bot: 1210 }; // the bridge
const SP = { x0: 590, kh: 3.7, base: 1190, kv: 118 }; // spectrum: bar of harmonic h at x0 + h kh
const PH = { cx: 770, cy: 1140, r: 72 }; // phasors

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THREE-PHASE INVERTER}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("SINE PWM: SLICE DC INTO A SINE")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const lab = (id, cx, cy, w, size, tex, op = 1, color = C.white) =>
  box({ id, cx, cy, w, h: 38, size, color, html: tx(tex), style: op === 1 ? "" : `opacity:${op}` });
const labels = [
  // legend of the top panel (colour swatches are drawn on the canvas, left of each label)
  lab("lva", 218, 372, 70, 30, "v_{a}", 1),
  lab("lvb", 348, 372, 70, 30, "v_{b}", 0),
  lab("lvc", 478, 372, 70, 30, "v_{c}", 0),
  lab("lvt", 640, 372, 120, 30, "v_{tri}", 1),
  // legend of the second panel
  lab("lbp", 215, 815, 90, 30, "v_{aN}", 1),
  lab("lbl", 345, 815, 90, 30, "v_{ab}", 1),
  lab("lbi", 465, 815, 70, 30, "i_{a}", 1),
  lab("lba", 585, 815, 150, 30, it("average"), 0),
  // bridge
  lab("lrp", 470, 1066, 100, 26, "+V_{dc}", 1),
  lab("lrn", 452, 1210, 40, 26, "0", 1),
  lab("lla", BR.xs[0] + 28, 1138, 30, 24, "a", 1),
  lab("llb", BR.xs[1] + 28, 1138, 30, 24, "b", 1),
  lab("llc", BR.xs[2] + 28, 1138, 30, 24, "c", 1),
  // spectrum
  lab("lsp", 700, 1064, 220, 28, "\\lvert V_{ab}(h)\\rvert", 1),
  lab("lsh", 962, 1212, 30, 26, "h", 1),
  box({ id: "lmf", cx: 700, cy: 1214, w: 60, h: 32, size: 26, color: C.white, html: tx("m_{f}") }),
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
const thdTxt = (mf) => `m_{f}=${mf}\\;\\;${it("THD")}_{i}=${(100 * THD[mf]).toFixed(1)}\\%`;
const counters = [
  mkC("c0", "V_{LL,rms}=0.612\\,m\\,V_{dc}", C.blue, 56, false),
  mkC("c1", "v_{ref}>v_{tri}\\;\\Rightarrow\\;S_{a}=1"),
  mkC("c2", "\\bar{v}_{aN}=\\dfrac{V_{dc}}{2}\\,(1+m\\sin\\theta)", C.blue, 50),
  mkC("c3", "v_{ab}=v_{aN}-v_{bN}", C.blue, 56),
  mkC("c4", thdTxt(9), C.blue, 54),
  mkC("c5", thdTxt(21), C.blue, 54),
  mkC("c6", thdTxt(45), C.blue, 54),
  mkC("cfin", "V_{LL,rms}=0.612\\,m\\,V_{dc}", C.blue, 56),
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
  ["fm0", "\\hat{V}_{ab,1}=\\sqrt{3}\\,\\dfrac{m\\,V_{dc}}{2}", 44, false],
  ["f1", "m=\\dfrac{\\hat{V}_{ref}}{\\hat{V}_{tri}}=0.8", 44],
  ["f2", "f_{c}=m_{f}\\,f_{1}=9\\cdot50=450\\;" + it("Hz"), 46],
  ["f3", "v_{ab}\\in\\{-V_{dc},\\,0,\\,+V_{dc}\\}", 50],
  ["f4", "\\hat{V}_{ab,1}=\\sqrt{3}\\,\\dfrac{m\\,V_{dc}}{2}", 44],
  ["f5", "f_{c}=21\\cdot50=1050\\;" + it("Hz"), 50],
  ["f6", "f_{c}=45\\cdot50=2250\\;" + it("Hz"), 50],
  ["f7", it("THD") + "_{i}\\propto 1/m_{f}", 54],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("HOW DOES DC BECOME A SINE?"), it("SLICE IT WITH A TRIANGLE"), 1),
  bn("bn1", it("COMPARE A SINE TO A TRIANGLE"), "v_{ref}>v_{tri}" + it(": SWITCH ON"), 0),
  bn("bn2", it("AVERAGE THE PULSES"), it("THE SINE COMES BACK"), 0),
  bn("bn3", it("THREE LEGS, 120") + "^{\\circ}" + it(" APART"), "v_{ab}=v_{aN}-v_{bN}", 0),
  bn("bn4", it("THE LOAD FILTERS THE RIPPLE"), "i_{a}" + it(" IS ALMOST A SINE"), 0),
  bn("bn5", it("RAISE THE CARRIER"), it("THE RIPPLE FADES: THD DROPS"), 0),
  bn("bnF", it("A FASTER CARRIER, A CLEANER SINE"), "V_{LL}=0.612\\,m\\,V_{dc}", 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("WHAT HAPPENS WHEN ") + "m>1" + it("?")), style: "opacity:0" })}
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
  JSON.stringify({ ...T, dur: DUR, edges: EDGES }),
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
  MFS,
  PA,
  PB,
  PC,
  PLOT,
  BR,
  SP,
  PH,
  SPEC,
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
<title>Three-Phase Inverter</title>
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
${pwmSrc}
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
