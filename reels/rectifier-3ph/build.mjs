// THE THREE-PHASE HALF-WAVE RECTIFIER (26.2 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// Ideal diodes, resistive load: v_o = max(v_an, v_bn, v_cn). The page draws the circuit and the waves on a canvas from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const DIM = "rgba(255,255,255,.6)";
const PH = [C.blue, C.red, C.purple]; // phase a, b, c
const W = 1080,
  H = 1920,
  DUR = 26.2;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const SW0 = 8.4,
  SW1 = 19.2; // the cursor sweeps wt = 0 .. 720 degrees over this time
const T = {
  rewind0: 1.6,
  ph: [2.2, 3.3, 4.4], // the three sources and their waves
  dio: [6.1, 6.4, 6.7], // the three diodes
  bnC: 5.8,
  load: 7.1,
  ret: 7.5, // the return path to neutral
  vo: 8.0,
  sw0: SW0,
  sw1: SW1,
  bnS2: 12.45,
  lock: 19.5,
  banF: 20.5,
  card: 22.0,
  pulse: 25.0,
};
// switching angles of the conduction (computed below and asserted): D3 until 30, then D1, D2, D3, D1, D2, D3
const SEG = [
  [0, 30, 3],
  [30, 150, 1],
  [150, 270, 2],
  [270, 390, 3],
  [390, 510, 1],
  [510, 630, 2],
  [630, 720, 3],
];
const theta = (time) => 720 * Math.max(0, (time - SW0) / (SW1 - SW0)); // keeps running past 720: the cycle goes on
const timeAt = (deg) => SW0 + (deg / 720) * (SW1 - SW0);
const COMM = SEG.slice(1).map(([a]) => Math.round(timeAt(a) * 100) / 100); // 8.85, 10.65, 12.45, 14.25, 16.05, 17.85

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
const D2R = Math.PI / 180;
const vk = (k, th) => Math.sin((th - 120 * k) * D2R);
const vo = (th) => Math.max(vk(0, th), vk(1, th), vk(2, th));
const active = (th) => {
  let b = 0;
  for (let k = 1; k < 3; k++) if (vk(k, th) > vk(b, th)) b = k;
  return b + 1;
};
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (Math.abs(a - b) > tol) throw new Error(`${what}: ${a} vs ${b}`);
  };
  // every phase conducts for exactly 120 degrees per cycle, switching at 30, 150, 270 ...
  for (const [a, b, d] of SEG) {
    for (const th of [a + 0.5, (a + b) / 2, b - 0.5])
      if (active(th) !== d)
        throw new Error(`diode ${d} should conduct at ${th} deg, found ${active(th)}`);
  }
  for (let th = 0; th < 720; th += 0.5)
    if (vo(th) < 0.5 - 1e-9)
      throw new Error(
        "the output never falls below Vm/2 (so no diode ever sees a dead zone) at " + th,
      );
  let s = 0,
    s2 = 0,
    n = 0;
  for (let th = 0; th < 360; th += 0.01) {
    s += vo(th);
    s2 += vo(th) ** 2;
    n++;
  }
  near(s / n, (3 * Math.sqrt(3)) / (2 * Math.PI), 1e-4, "average output 3 sqrt3 / 2 pi");
  near(Math.sqrt(s2 / n), Math.sqrt(0.5 + (3 * Math.sqrt(3)) / (8 * Math.PI)), 1e-4, "rms output");
  // three pulses per cycle (ripple at 3f): count the local maxima of v_o over one cycle
  let peaks = 0;
  for (let th = 0.02; th < 359.98; th += 0.02)
    if (vo(th) > vo(th - 0.02) && vo(th) >= vo(th + 0.02) && vo(th) > 0.99) peaks++;
  if (peaks !== 3) throw new Error("expected 3 output pulses per cycle, found " + peaks);
  // the cursor law and the commutation times used for the cues
  near(timeAt(30), 8.85, 1e-9, "t(30 deg)");
  console.log(
    `maths ok: each diode conducts 120 degrees (switching at 30, 150, 270 ...); Vo,avg = ${(s / n).toFixed(4)} Vm = 3 sqrt3 / 2 pi; Vo,rms = ${Math.sqrt(s2 / n).toFixed(4)} Vm; 3 pulses per cycle; v_o >= Vm/2 always`,
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
const rnd = mulberry32(20261111);
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry (canvas pixels)
const PLOT = { x0: 110, k: 860 / 720, zero: 975, amp: 112 }; // wt (deg) -> x, v (Vm) -> y
const Xd = (deg) => PLOT.x0 + deg * PLOT.k;
const SRC_Y = [425, 535, 645];
const CKT = {
  srcX: 235,
  negX: 120,
  dioX0: 330,
  dioX1: 395,
  busX: 545,
  nodeY: 535,
  loadX0: 650,
  loadX1: 810,
  rightX: 900,
  retY: 735,
};

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1040, h: 90, size: 52, color: C.red, html: tx("\\textbf{\\textit{3-PHASE HALF-WAVE RECTIFIER}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("WHICH DIODE CONDUCTS?")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const SRCLAB = ["v_{an}", "v_{bn}", "v_{cn}"];
const labels = [
  // sources (shown when each source appears)
  ...SRCLAB.map((s, i) =>
    box({
      id: "sl" + i,
      cx: 163,
      cy: SRC_Y[i] - 29,
      w: 84,
      h: 38,
      size: 36,
      color: PH[i],
      html: tx(s),
      style: "opacity:0",
    }),
  ),
  // diodes
  ...[1, 2, 3].map((d, i) =>
    box({
      id: "dl" + d,
      cx: (CKT.dioX0 + CKT.dioX1) / 2,
      cy: SRC_Y[i] - 40,
      w: 70,
      h: 34,
      size: 30,
      color: C.white,
      html: tx(`D_{${d}}`),
      style: "opacity:0",
    }),
  ),
  box({
    id: "rl",
    cx: (CKT.loadX0 + CKT.loadX1) / 2,
    cy: CKT.nodeY - 48,
    w: 70,
    h: 40,
    size: 34,
    color: C.white,
    html: tx("R"),
    style: "opacity:0",
  }),
  box({
    id: "nl",
    cx: CKT.negX,
    cy: CKT.retY + 36,
    w: 60,
    h: 34,
    size: 30,
    color: C.white,
    html: tx("n"),
    style: "opacity:0",
  }),
  box({
    id: "vo",
    cx: 960,
    cy: 640,
    w: 80,
    h: 44,
    size: 36,
    color: C.purple,
    html: tx("v_{o}"),
    style: "opacity:0",
  }),
  // plot legend and axis
  ...SRCLAB.map((s, i) =>
    box({
      id: "lg" + i,
      cx: 190 + i * 110,
      cy: 825,
      w: 100,
      h: 40,
      size: 36,
      color: PH[i],
      html: tx(s),
    }),
  ),
  box({ id: "lgo", cx: 520, cy: 825, w: 90, h: 40, size: 36, color: C.white, html: tx("v_{o}") }),
  ...[0, 180, 360, 540, 720].map((d) =>
    box({
      id: "ax" + d,
      cx: Xd(d),
      cy: 1178,
      w: 90,
      h: 28,
      size: 24,
      color: DIM,
      html: tx(`${d}^{\\circ}`),
    }),
  ),
  // conduction chart labels (one per segment that is wide enough), lit when that diode starts to conduct
  ...SEG.slice(1).map(([a, b, d], i) =>
    box({
      id: "sg" + (i + 1),
      cx: Xd((a + Math.min(b, 720)) / 2),
      cy: 1133,
      w: 80,
      h: 28,
      size: 26,
      color: C.white,
      html: tx(`D_{${d}}`),
      style: "opacity:0.6",
    }),
  ),
].join("");

// ------------------------------------------------------------------ counters, formulas, HUD
const CY_CNT = 1252,
  CY_FM = 1352;
const mkC = (id, tex, color = C.blue, size = 72, hidden = true) =>
  box({
    id,
    cx: 540,
    cy: CY_CNT,
    w: 700,
    h: 100,
    size,
    color,
    html: tx(tex),
    style: hidden ? "opacity:0" : "",
  });
const AVG = "V_{avg}=0.827\\,V_{m}";
const counters = [
  mkC("c0", AVG, C.blue, 72, false),
  ...[0.621, 0.414, 0.207, 0.103, 0].map((v, i) =>
    mkC("r" + (i + 1), `V_{avg}=${v.toFixed(3)}\\,V_{m}`),
  ),
  mkC("s1", "\\varphi=0^{\\circ}", PH[0], 80),
  mkC("s2", "\\varphi=-120^{\\circ}", PH[1], 80),
  mkC("s3", "\\varphi=-240^{\\circ}", PH[2], 80),
].join("");
const mkF = (id, tex, color = C.blue, size = 46, hidden = true) =>
  box({
    id,
    cx: 540,
    cy: CY_FM,
    w: 880,
    h: 100,
    size,
    color,
    html: tx(tex),
    m: true,
    style: hidden ? "opacity:0" : "",
  });
const MAXF = "v_{o}=\\max(v_{an},v_{bn},v_{cn})";
const formulas = [
  mkF("fm0", MAXF, C.blue, 46, false),
  mkF("f1", "v_{an}=V_{m}\\sin\\omega t", PH[0], 50),
  mkF("f2", "v_{bn}=V_{m}\\sin(\\omega t-120^{\\circ})", PH[1], 50),
  mkF("f3", "v_{cn}=V_{m}\\sin(\\omega t-240^{\\circ})", PH[2], 50),
  mkF("f4", MAXF, C.blue, 46),
  mkF("f5", "V_{avg}=\\dfrac{3\\sqrt{3}}{2\\pi}\\,V_{m}\\approx0.827\\,V_{m}", C.blue, 46),
].join("");
// live read-out while the cursor sweeps: wt and v_o, one element per 0.1 s (same cursor law as the canvas)
const HUD = [];
for (let k = 0; k * 0.1 <= DUR - SW0 - 0.1 + 1e-9; k++) {
  const th = Math.round(theta(Math.round((SW0 + 0.1 * k) * 100) / 100) * 10) / 10;
  HUD.push({ id: "hk" + k, th, vo: vo(th) });
}
const hud = HUD.map((h) =>
  box({
    id: h.id,
    cx: 540,
    cy: CY_CNT,
    w: 860,
    h: 90,
    size: 56,
    color: C.white,
    html: tx(
      `${col(C.blue, "\\omega t=" + Math.round(h.th) + "^{\\circ}")}\\;\\;\\;${col(C.purple, "v_{o}=" + h.vo.toFixed(3) + "\\,V_{m}")}`,
    ),
    style: "opacity:0",
  }),
).join("");

// ------------------------------------------------------------------ banners
const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("THREE SOURCES, ONE LOAD"), it("WHICH DIODE CONDUCTS?"), 1),
  bn("bnP", it("THREE SOURCES"), it("120 DEGREES APART"), 0),
  bn("bnC", it("ONE DIODE PER PHASE"), it("ALL JOIN AT ONE NODE"), 0),
  bn("bnR", it("THE LOAD RETURNS TO NEUTRAL"), it("THE CIRCUIT IS CLOSED"), 0),
  bn("bnS1", it("THE HIGHEST PHASE"), it("TURNS ITS DIODE ON"), 0),
  bn("bnS2", it("THE OTHER TWO DIODES"), it("ARE REVERSE-BIASED: OFF"), 0),
  bn("bnF", it("THREE PULSES PER CYCLE"), it("RIPPLE AT ") + "3f", 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

// ------------------------------------------------------------------ CTA
const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("TRY THE SIMULATOR"))}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("ON THE WEBSITE")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("LINK IN BIO ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:180px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;
const check = `<svg id="chk" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" data-layout-ignore>
  <path id="chkp" d="M890 1235 l22 24 l44 -50" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="120" stroke-dashoffset="120" opacity="0" style="filter:drop-shadow(0 0 10px ${C.purple})"/>
</svg>`;

// ------------------------------------------------------------------ guards
const allHtml = [header, labels, counters, formulas, hud, banner, card].join("");
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
    comm: COMM,
    hud: HUD.map((h, k) => [Math.round((SW0 + 0.1 * k) * 100) / 100, +h.vo.toFixed(4)]),
    seg: SEG,
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
.panel{position:absolute;left:90px;width:900px;border-radius:28px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1)}
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
  SEG,
  COMM,
  PLOT,
  CKT,
  SRC_Y,
  PH,
  HUD: HUD.map((h) => ({ id: h.id })),
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
<title>The Three-Phase Half-Wave Rectifier</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="top:340px;height:440px"></div>
<div class="panel" style="top:800px;height:400px"></div>
<div id="glow" style="position:absolute;left:90px;top:340px;width:900px;height:860px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:340px;width:900px;height:860px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
<canvas id="cv" data-layout-allow-overflow data-layout-ignore></canvas>
${labels}
${counters}
${formulas}
${hud}
${banner}
${card}
${check}
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
