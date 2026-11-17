// THE BOOST CONVERTER: VOLT-SECOND BALANCE (22.8 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// One switch, one coil, one diode: Vo = Vin / (1 - D). The page draws the circuit with its live current path, the inductor current,
// the inductor voltage with its equal areas, the gain curve and the output bar from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const boostSrc = fs.readFileSync(new URL("./boost.js", import.meta.url), "utf8");
const BOOST = new Function(boostSrc + "\nreturn globalThis.BOOST;")();

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 23.6;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  s1: 2.2,
  t0: 2.4, // the switch starts to run: one window of three switching periods every WIN seconds
  WIN: 4.5, // three switching periods of 1.5 s: 0.75 s of charging, 0.75 s of discharging at D = 0.5
  st: [2.2, 3.05, 5.3, 8.0, 11.2, 14.0], // banners
  sw: [2.4, 3.15, 5.4, 8.2, 11.4, 14.2], // counters (the snap)
  lock: 17.0,
  banF: 18.0,
  card: 19.4,
  pulse: 21.8,
};

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))))
      throw new Error(`${what}: ${a} vs ${b}`);
  };
  for (const [D, Vo, IL] of [
    [0.5, 24, 2],
    [0.75, 48, 8],
    [0.9, 120, 50],
  ]) {
    const s = BOOST.steady(D);
    near(s.Vo, Vo, 1e-12, `Vo at D = ${D}`);
    near(s.IL, IL, 1e-12, `IL at D = ${D}`);
    if (!(s.Imin > 0)) throw new Error(`D = ${D}: not in continuous conduction`);
    // volt-second balance: the area up equals the area down (this is what fixes the gain)
    const up = BOOST.VIN * D * BOOST.T,
      down = (s.Vo - BOOST.VIN) * (1 - D) * BOOST.T;
    near(up, down, 1e-12, `volt-second balance at D = ${D}`);
    // charge balance of the capacitor: the diode carries IL for (1 - D) T and the load takes Vo / R
    near(s.IL * (1 - D), s.Vo / BOOST.R, 1e-12, `charge balance at D = ${D}`);
    // the sampled waveform: its average is IL, its ripple is Vin D T / L, and the slopes are Vin / L and -(Vo - Vin) / L
    const w = BOOST.wave(D, 3000);
    near(w.il.reduce((a, b) => a + b, 0) / w.il.length, s.IL, 2e-3, `average of iL at D = ${D}`);
    near(Math.max(...w.il) - Math.min(...w.il), s.dI, 5e-3, `ripple of iL at D = ${D}`);
    near(
      w.vl.reduce((a, b) => a + b, 0) / w.vl.length,
      0,
      2e-3 * s.Vo,
      `average of vL = 0 at D = ${D} (to the sampling)`,
    );
    // an independent check: the switched circuit (ideal switch and diode) integrated in time
    const sim = BOOST.simulate(D, 0, D > 0.8 ? 2500 : 600);
    near(sim.Vo, s.Vo, 1.5e-2, `simulated Vo at D = ${D}`);
    near(sim.IL, s.IL, 3e-2, `simulated IL at D = ${D}`);
    near(sim.dI, s.dI, 2e-2, `simulated ripple at D = ${D}`);
  }
  // the real converter: a small inductor resistance bends the gain curve; it peaks and then falls
  for (const D of [0.5, 0.75, 0.9]) {
    const sim = BOOST.simulate(D, BOOST.RL, 2500);
    near(sim.Vo / BOOST.VIN, BOOST.gainReal(D), 1.5e-2, `simulated real gain at D = ${D}`);
  }
  let pk = 0,
    pd = 0;
  for (let d = 0; d < 0.97; d += 0.001) {
    const m = BOOST.gainReal(d);
    if (m > pk) {
      pk = m;
      pd = d;
    }
  }
  if (!(pd > 0.9 && pd < 0.96 && pk < BOOST.gain(0.9)))
    throw new Error("the real gain must peak below the ideal one");
  console.log(
    "maths ok: Vo = Vin/(1-D) = 24 / 48 / 120 V at D = 0.5 / 0.75 / 0.9, IL = Vo/(R(1-D)) = 2 / 8 / 50 A, ripple = Vin D T/L, " +
      "volt-second and charge balance, CCM; the switched circuit simulated in time agrees; with RL = 0.1 ohm the gain peaks at " +
      pk.toFixed(2) +
      " near D = " +
      pd.toFixed(3),
  );
})();

// the edges of the switch (the sound ticks on them), from the same duty law as the picture
const EDGES = (() => {
  const out = [];
  let prev = null;
  for (let t = T.t0; t < DUR; t += 0.001) {
    const x = (3 * (t - T.t0)) / T.WIN,
      tau = x - Math.floor(x);
    const on = tau < BOOST.Dat(t);
    if (prev !== null && on !== prev) out.push([+t.toFixed(3), on ? 1 : 0]);
    prev = on;
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
const rnd = mulberry32(20261117);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry
const PA = [90, 340, 900, 470]; // the circuit (left) and the voltage bars (right)
const PB = [90, 830, 900, 200]; // inductor current, with the switch state behind it
const PC = [90, 1050, 900, 180]; // inductor voltage (left), gain curve (right)
const X = { x0: 130, w: 830 }; // plot x range of panel B
const CK = { xl0: 130, xlw: 390, yl0: 1082, kl: 15 }; // panel C left: vL plot (zero line and px per Vin)
const GC = { x0: 590, w: 360, y0: 1210, k: 12.5, dmax: 0.9 }; // gain curve: D in [0, 0.9], M in [0, 10]
const CIR = { s: 1.3, ox: 120, oy: 415 }; // the circuit is drawn in its own coordinates and scaled onto the panel
const cm = (x, y) => [CIR.ox + CIR.s * (x - 150), CIR.oy + CIR.s * (y - 470)];
const TAGS = { row: 782, sw: [452, 140], coil: [262, 225], cap: [650, 205] }; // state tags under the circuit: centre x, width
const BARS = { y0: 735, k: 2.5, xi: 790, xo: 875, bw: 60 }; // Vin / Vo bars: 2.5 px per volt

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE BOOST CONVERTER}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("VOLT-SECOND BALANCE")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const lab = (id, cx, cy, w, size, tex, op = 1, color = C.white) =>
  box({ id, cx, cy, w, h: 38, size, color, html: tx(tex), style: op === 1 ? "" : `opacity:${op}` });
const labels = [
  // circuit
  lab("lvin", ...cm(150, 424), 90, 30, "V_{in}"),
  lab("lL", ...cm(226, 512), 40, 30, "L"),
  lab("lS", ...cm(462, 560), 40, 30, "S"),
  lab("lD", ...cm(492, 430), 40, 30, "D"),
  lab("lC", ...cm(528, 575), 40, 30, "C"),
  lab("lR", ...cm(668, 585), 40, 30, "R"),
  lab("lVo", ...cm(600, 428), 60, 30, "V_{o}"),
  // the currents
  lab("liLc", ...cm(330, 512), 60, 28, "i_{L}", 0),
  lab("liD", ...cm(492, 512), 60, 28, "i_{D}", 0),
  lab("lio", ...cm(670, 640), 60, 28, "i_{o}", 0),
  // the live state of the switch, the coil and the capacitor (shown or hidden every frame by the page)
  lab("lsw1", TAGS.sw[0], TAGS.row, TAGS.sw[1], 26, it("S CLOSED"), 0),
  lab("lsw0", TAGS.sw[0], TAGS.row, TAGS.sw[1], 26, it("S OPEN"), 0),
  lab("lcl1", TAGS.coil[0], TAGS.row, TAGS.coil[1], 26, it("L CHARGES"), 0),
  lab("lcl0", TAGS.coil[0], TAGS.row, TAGS.coil[1], 26, it("L DISCHARGES"), 0),
  lab("lcp1", TAGS.cap[0], TAGS.row, TAGS.cap[1], 26, it("C DISCHARGES"), 0),
  lab("lcp0", TAGS.cap[0], TAGS.row, TAGS.cap[1], 26, it("C CHARGES"), 0),
  // bars
  lab("lbi", BARS.xi + BARS.bw / 2, BARS.y0 + 32, 90, 28, "V_{in}"),
  lab("lbo", BARS.xo + BARS.bw / 2, BARS.y0 + 32, 70, 28, "V_{o}"),
  // panel B
  lab("liL", 165, 858, 60, 30, "i_{L}"),
  lab("lon", 300, 858, 70, 28, it("ON"), 1),
  lab("loff", 390, 858, 70, 28, it("OFF"), 1),
  lab("lil1", 900, 858, 170, 30, "I_{L}=2\\,\\textit{A}", 0),
  lab("lil2", 900, 858, 170, 30, "I_{L}=8\\,\\textit{A}", 1),
  lab("lil3", 900, 858, 190, 30, "I_{L}=50\\,\\textit{A}", 0),
  // panel C
  lab("lvL", 160, 1070, 60, 28, "v_{L}", 1),
  lab("lMD", 640, 1072, 100, 28, "M(D)", 0),
  lab("lDx", 975, 1216, 30, 26, "D", 0),
  lab("lreal", 775, 1100, 110, 26, it("real"), 0),
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
  mkC("c0", "V_{in}=12\\,\\textit{V}\\;\\Rightarrow\\;V_{o}=48\\,\\textit{V}", C.blue, 52, false),
  mkC("c1", "v_{L}=V_{in}\\;\\Rightarrow\\;i_{L}\\uparrow", C.blue, 56),
  mkC("c2", "v_{L}=V_{in}-V_{o}\\;\\Rightarrow\\;i_{L}\\downarrow", C.blue, 54),
  mkC("c3", "V_{in}\\,D\\,T=(V_{o}-V_{in})(1-D)\\,T", C.blue, 46),
  mkC("c4", "D=0.75\\;\\Rightarrow\\;V_{o}=48\\,\\textit{V}", C.blue, 56),
  mkC("c5", "D=0.9\\;\\Rightarrow\\;V_{o}=120\\,\\textit{V}", C.blue, 56),
  mkC("c6", "R_{L}>0:\\;" + it("THE GAIN PEAKS, THEN FALLS"), C.blue, 40),
  mkC("cfin", it("OUTPUT ABOVE INPUT: A BOOST"), C.blue, 44),
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
  ["fm0", "V_{o}=\\dfrac{V_{in}}{1-D}", 44, false],
  ["f1", "i_{L}(t)=i_{L}(0)+\\dfrac{V_{in}}{L}\\,t", 42],
  ["f2", "i_{L}(t)=I_{max}-\\dfrac{V_{o}-V_{in}}{L}\\,(t-DT)", 38],
  ["f3", "V_{o}=\\dfrac{V_{in}}{1-D}", 44],
  ["f4", "I_{L}=\\dfrac{V_{o}}{R\\,(1-D)}=8\\,\\textit{A}", 40],
  ["f5", "I_{L}=\\dfrac{V_{o}}{R\\,(1-D)}=50\\,\\textit{A}", 40],
  ["f6", "M(D)=\\dfrac{1}{1-D}\\to\\infty", 44],
  ["f7", "V_{o}>V_{in}", 56],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("HOW CAN 12 V BECOME 48 V?"), it("ONE SWITCH, ONE COIL, ONE DIODE"), 1),
  bn(
    "bn1",
    it("SWITCH ON: THE COIL CHARGES"),
    "v_{L}=V_{in}" + it(": i") + "_{L}" + it(" RAMPS UP"),
    0,
  ),
  bn("bn2", it("SWITCH OFF: THE CURRENT MUST GO ON"), it("IT PUSHES THROUGH THE DIODE"), 0),
  bn("bn3", it("VOLT-SECONDS MUST BALANCE"), it("AREA UP = AREA DOWN"), 0),
  bn("bn4", it("TURN THE DUTY UP"), it("THE SPIKE GROWS, THE AREA STAYS"), 0),
  bn("bn5", it("KEEP GOING: ") + "D=0.9", "V_{o}=120\\,\\textit{V}" + it(" (IDEAL)"), 0),
  bn("bn6", it("THE IDEAL GAIN GOES TO INFINITY"), it("REAL LOSSES BEND THE CURVE"), 0),
  bn("bnF", it("A SWITCH, A COIL, A DIODE"), "V_{o}=V_{in}/(1-D)", 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("WHAT LIMITS ") + "D" + it(" IN A REAL BOOST?")), style: "opacity:0" })}
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
  PA,
  PB,
  PC,
  X,
  CK,
  GC,
  BARS,
  CIR,
  TAGS,
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
<title>The Boost Converter</title>
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
${boostSrc}
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
