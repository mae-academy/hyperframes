// FOURIER EPICYCLES: SQUARE WAVE SYNTHESIS (22.0 s, 1080x1920, MAE theme).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
//   SITE_URL="mae.academy/simulator" node build.mjs   puts the address on the CTA (default: "LINK IN BIO")
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 22;
const SITE_URL = (process.env.SITE_URL || "").trim();

// ------------------------------------------------------------------ the maths of the reel (asserted at build)
// f(t) = (4/pi) * sum_{n>=1} sin((2n-1) pi t) / (2n-1)  ->  square wave of height +-1
const SQ = (t, N) => {
  let s = 0;
  for (let n = 1; n <= N; n++) s += Math.sin((2 * n - 1) * Math.PI * t) / (2 * n - 1);
  return (4 / Math.PI) * s;
};
(function assertMath() {
  // f(t) = (4/pi) sum sin((2n-1) pi t)/(2n-1): plateau +1 on (0,1), -1 on (1,2); first circle radius 4/pi;
  // the Gibbs overshoot (about 8.95 % of the 2-unit jump = 0.179) never goes away, it only gets thinner.
  let err = 0;
  for (let t = 0.1; t <= 0.9; t += 0.01) err = Math.max(err, Math.abs(SQ(t, 3000) - 1));
  if (err > 0.01) throw new Error("partial sums do not converge to the square wave: " + err);
  let peak = 0;
  for (let t = 0.0005; t < 0.1; t += 0.0002) peak = Math.max(peak, SQ(t, 100));
  if (Math.abs(peak - 1.179) > 0.004) throw new Error("Gibbs overshoot off: " + peak);
  if (Math.abs(SQ(0.5, 1) - 4 / Math.PI) > 1e-12)
    throw new Error("first circle radius is not 4/pi");
  console.log(
    `maths ok: partial sums converge to the square wave (max err ${err.toExponential(1)} on 0.1<t<0.9); N=100 peak ${peak.toFixed(3)} (Gibbs 8.95 % of the jump)`,
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
const GLYPH = (s, c = "#fff") =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="${c}" stroke-width="2.2"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="${c}" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.3" fill="${c}"/></svg>`;

// ------------------------------------------------------------------ layout constants (shared with anim.js through CFG)
const G = {
  T: 2.4, // period of the fundamental, seconds
  SPEED: 180, // px / s the wave scrolls left (period = 432 px)
  H: 150, // plateau height of the square wave, px
  CY: 1030, // baseline y
  AX: 420, // axis / first circle centre x
  DOTX: 720, // x of the tracing dot
  SB: 1522, // spectrum baseline
  HMAX: 118, // height of the k = 1 bar
  NBARS: 15,
  BARX0: 168,
  BARP: 50,
  BARW: 32,
};
// schedule of the number of harmonics (shared with scripts/make_sfx.py through assets/sched.json)
const SCHED = {
  lock: 16.2,
  ramps: [
    { t0: 0.9, t1: 1.5, from: 200, to: 0 },
    { t0: 1.7, t1: 2.3, from: 0, to: 1 },
    { t0: 4.6, t1: 5.2, from: 1, to: 3 },
    { t0: 7.6, t1: 8.2, from: 3, to: 7 },
    { t0: 10.2, t1: 10.8, from: 7, to: 15 },
    { t0: 12.8, t1: 13.5, from: 15, to: 50 },
    { t0: 15.2, t1: 16.2, from: 50, to: 200 },
  ],
  start: 200,
};

// ------------------------------------------------------------------ header + counter/formula states
const header = `
<div id="flash0"></div>
${box({ id: "h-t1", cx: 540, cy: 200, w: 1040, h: 80, size: 58, color: C.red, html: tx("\\textbf{\\textit{FOURIER EPICYCLES}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-t2", cx: 540, cy: 272, w: 1040, h: 62, size: 46, color: C.purple, html: tx(it("SQUARE WAVE SYNTHESIS")) })}
<div id="h-rule" style="position:absolute;left:480px;top:318px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>`;
const NSTATES = [
  { id: "sINF", n: "\\infty" },
  { id: "s50", n: "50" },
  { id: "s15", n: "15" },
  { id: "s7", n: "7" },
  { id: "s3", n: "3" },
  { id: "s1", n: "1" },
];
const states = NSTATES.map(
  (s) => `<div id="${s.id}" class="st" style="opacity:${s.id === "sINF" ? 1 : 0}">
  ${box({ id: s.id + "n", cx: 540, cy: 408, w: 600, h: 100, size: 84, color: "#fff", html: tx(`N=${s.n}`) })}
  ${box({ id: s.id + "f", cx: 540, cy: 548, w: 1000, h: 120, size: 50, color: C.blue, html: tx(`\\displaystyle f(t)=\\frac{4}{\\pi}\\sum_{n=1}^{${s.n}}\\frac{\\sin\\left((2n-1)\\pi t\\right)}{2n-1}`) })}
</div>`,
).join("");

// ------------------------------------------------------------------ spectrum panel (bars are drawn on the canvas)
const specLabels = Array.from({ length: G.NBARS }, (_, i) =>
  box({
    cx: G.BARX0 + i * G.BARP + G.BARW / 2,
    cy: G.SB + 20,
    w: 44,
    h: 24,
    size: 20,
    color: "rgba(255,255,255,.6)",
    html: tx(String(2 * i + 1)),
  }),
).join("");
const spectrum = `
<div id="spec" class="card" style="left:90px;top:1370px;width:900px;height:192px;border-radius:28px"></div>
${box({ id: "spec-t", cx: 610, cy: 1392, w: 360, h: 26, size: 22, color: "rgba(255,255,255,.6)", html: tx(it("HARMONIC SPECTRUM")), right: true })}
${specLabels}
${box({ id: "spec-dots", cx: G.BARX0 + G.NBARS * G.BARP + 22, cy: G.SB - 14, w: 70, h: 30, size: 30, color: "rgba(255,255,255,.7)", html: tx("\\cdots") })}`;

// ------------------------------------------------------------------ banner (820 x 90 at y 1575)
const BN = { x: 130, y: 1575, w: 820, h: 90 };
const CAPS = [
  ["cA", it("CAN SMOOTH SINE WAVES BUILD A SHARP CORNER?")],
  ["cB", it("REWINDING TO ONE SINE...")],
  ["c1", it("ONE SINE: PURE AND SMOOTH.")],
  ["c3", it("THREE SINES: CORNERS START TO APPEAR.")],
  ["c7", it("SEVEN SINES: THE EDGES SHARPEN.")],
  ["c15", it("FIFTEEN SINES: ALMOST A SQUARE.")],
  ["c50", it("FIFTY SINES: THE CORNERS ARE ALMOST PERFECT.")],
  ["cX", it("NOW ADD INFINITELY MANY SINES...")],
  ["cI", it("INFINITE SINES: A PERFECT SQUARE WAVE ")],
];
const banner = `<div id="banner">${CAPS.map(([id, t], i) => `<div id="${id}" class="ba" style="opacity:${i === 0 ? 1 : 0}">${tx(t)}${id === "cI" ? tx("\\checkmark") : ""}</div>`).join("")}</div>`;

// ------------------------------------------------------------------ CTA
const sub = SITE_URL
  ? tx(it("VISIT THE WEBSITE ") + "\\downarrow")
  : tx(it("VISIT THE WEBSITE ") + "\\downarrow");
const cta = `<div id="cta" style="opacity:0">
  <div id="ctacard" class="card" style="left:150px;top:760px;width:780px;height:600px;border:2px solid rgba(255,0,68,.5)"></div>
  ${box({ id: "ct1", cx: 540, cy: 850, w: 760, h: 80, size: 62, color: C.red, html: tx(it("TRY THE SIMULATOR")), style: "opacity:0" })}
  ${box({ id: "ct2", cx: 540, cy: 930, w: 760, h: 56, size: 40, color: C.blue, html: sub, style: "opacity:0" })}
  ${box({ id: "ct3", cx: 540, cy: 988, w: 760, h: 44, size: 32, color: "rgba(255,255,255,.88)", html: tx(SITE_URL ? "\\textit{" + SITE_URL.replace(/[^A-Za-z0-9./:_-]/g, "") + "}" : it("LINK IN BIO")), style: "opacity:0" })}
  <div id="btn" class="t" style="left:262px;top:1034px;width:556px;height:92px;border-radius:46px;background:rgba(255,0,68,.16);border:3px solid ${C.red};font-size:38px;color:#fff;gap:16px;opacity:0"><svg width="34" height="34" viewBox="0 0 24 24" style="flex:none"><path d="M6 3.5l15 8.5-15 8.5z" fill="${C.red}"/></svg>${tx(it("LAUNCH SIMULATOR"))}</div>
  <div id="rip" style="position:absolute;left:262px;top:1034px;width:556px;height:92px;border-radius:46px;border:4px solid #FFFFFF;opacity:0"></div>
  <div id="slid" style="opacity:0">
    ${box({ cx: 248, cy: 1206, w: 60, h: 40, size: 34, color: "#fff", html: tx("N") })}
    <div id="trk" style="position:absolute;left:290px;top:1202px;width:500px;height:8px;border-radius:4px;background:rgba(255,255,255,.2)"></div>
    <div id="trkf" style="opacity:0;position:absolute;left:290px;top:1202px;width:500px;height:8px;border-radius:4px;background:linear-gradient(90deg,${C.blue},${C.purple})"></div>
    <div id="knob" style="position:absolute;left:276px;top:1188px;width:36px;height:36px;border-radius:18px;background:#fff;box-shadow:0 0 14px ${C.purple}"></div>
    ${box({ id: "inf", cx: 866, cy: 1206, w: 60, h: 40, size: 40, color: "#fff", html: tx("\\infty") })}
    <div id="infr" style="position:absolute;left:826px;top:1176px;width:80px;height:60px;border-radius:30px;border:3px solid #B026FF;opacity:0"></div>
  </div>
  <div id="hnd" class="t" style="left:340px;top:1276px;width:400px;height:56px;font-size:32px;color:#fff;gap:14px;opacity:0">${GLYPH(40)}${tx("\\textit{@MAE.ACADEMY}")}</div>
  <svg id="cursor" width="120" height="120" viewBox="0 0 24 24" style="position:absolute;left:0;top:0;opacity:0;filter:drop-shadow(0 4px 6px rgba(0,0,0,.45))"><path d="M5 3l0 17 4.4-4.2 3.1 6.7 2.6-1.2-3.1-6.6 6-.4z" fill="#fff" stroke="#0A0A10" stroke-width="1.2" stroke-linejoin="round"/></svg>
</div>`;

// ------------------------------------------------------------------ typography guard: strict KaTeX math italic
const all = [header, states, spectrum, banner, cta].join("");
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(all))
  throw new Error("upright / bold math style found");
if ((all.match(/class="[^"]*\btextbf\b/g) || []).length !== 1)
  throw new Error("expected exactly one \\textbf (the title)");
console.log("typography ok: KaTeX math italic everywhere; one bold-italic title");

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
#stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
#flash0{position:absolute;left:0;top:0;width:${W}px;height:900px;background:radial-gradient(ellipse at 50% 55%,rgba(176,38,255,.5),transparent 65%);opacity:0}
.t{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1}
#wm{position:absolute;left:0;top:${G.CY - 60}px;width:${W}px;height:120px;font-size:100px;color:${C.red};opacity:.12}
#cv{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.st{position:absolute;left:0;top:0;width:${W}px;height:700px}
.card{position:absolute;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08);border-radius:32px}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;align-items:center;justify-content:center;gap:12px;font-size:29px;color:#fff;white-space:nowrap}
.bd{position:absolute;width:240px;height:88px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.bdt{font-size:22px;color:#fff;white-space:nowrap;line-height:1}
#cta{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = { G, SCHED };

function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>Fourier Epicycles: Square Wave Synthesis</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
<div id="stage">
${box({ id: "wm", cx: 540, cy: G.CY, w: 1000, h: 120, size: 100, color: C.red, html: tx(it("@MAE.Academy")), style: "opacity:.12" }).replace(`id="wm"`, `id="wm" data-layout-ignore`)}
<canvas id="cv" width="${W}" height="${H}" data-layout-allow-overflow></canvas>
${header}
${states}
${spectrum}
${banner}
<svg id="chk" width="120" height="120" viewBox="0 0 120 120" style="position:absolute;left:770px;top:352px;opacity:0;filter:drop-shadow(0 0 10px #B026FF)"><path id="chkp" d="M16,64 L46,94 L104,28" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="150" stroke-dashoffset="150"/></svg>
<div id="lockflash" style="position:absolute;left:0;top:560px;width:1080px;height:900px;background:radial-gradient(ellipse at 66% 50%,rgba(176,38,255,.55),rgba(255,255,255,.18) 30%,transparent 62%);opacity:0"></div>
</div>
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
fs.writeFileSync(
  new URL("./assets/sched.json", import.meta.url),
  JSON.stringify({ G, SCHED }, null, 1),
);
console.log(
  "built index.html + dist/index.html" +
    (SITE_URL ? ` (CTA address: ${SITE_URL})` : " (CTA: LINK IN BIO)"),
);
