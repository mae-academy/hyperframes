// THE CONVOLUTION INTEGRAL: FLIP, SLIDE, MULTIPLY, SUM (24.4 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// An RC circuit: x(t) is a pulse of width 2, h(t) = e^{-t} u(t). The page draws the plots on a canvas from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const DIM = "rgba(255,255,255,.6)";
const W = 1080,
  H = 1920,
  DUR = 24.4;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  s1: 2.2,
  imp1: 2.6,
  s2: 4.0,
  imp2: 4.6,
  s3: [6.0, 7.0, 8.0],
  sN: [4, 10, 24],
  s4: 9.2,
  ninf: 9.4,
  f4: 9.6,
  s5: 11.0,
  slide0: 11.2,
  slide1: 17.2,
  mk0: 12.2,
  mk2: 14.2,
  lock: 17.3,
  banF: 18.3,
  card: 19.8,
  pulse: 22.8,
};
const HOOK_N = 24;
const PULSE_W = 2; // x(t) = 1 on [0, 2]

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
const e = Math.exp;
const hf = (s) => (s >= 0 ? e(-s) : 0);
const xf = (t) => (t >= 0 && t <= PULSE_W ? 1 : 0);
const yx = (t) => (t < 0 ? 0 : t <= PULSE_W ? 1 - e(-t) : (1 - e(-PULSE_W)) * e(-(t - PULSE_W)));
const simpson = (g, a, b, n = 8000) => {
  const h = (b - a) / n;
  let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
};
const yN = (t, N) => {
  const d = PULSE_W / N;
  let s = 0;
  for (let k = 0; k < N; k++) {
    const tk = (k + 0.5) * d;
    s += t >= tk ? e(-(t - tk)) * d : 0;
  }
  return s;
};
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (Math.abs(a - b) > tol) throw new Error(`${what}: ${a} vs ${b}`);
  };
  for (const t of [0.5, 1.7, 2, 3.3, 5]) {
    // the integral over the overlap, region by region, against the closed form
    near(
      simpson((tau) => xf(tau) * hf(t - tau), 0, Math.min(t, PULSE_W)),
      yx(t),
      1e-6,
      "y(t) by the integral at t=" + t,
    );
    // commutativity: the same answer with the roles swapped (flip x, keep h)
    near(
      simpson((s) => hf(s) * xf(t - s), 0, Math.max(t, 0.001), 20000),
      yx(t),
      2e-4,
      "x*h = h*x at t=" + t,
    );
  }
  // the Riemann sum of impulse responses converges to the integral as the kicks get thinner
  const errs = [4, 10, 24, 120].map((N) => {
    let m = 0;
    for (let t = -1; t <= 6; t += 0.01) m = Math.max(m, Math.abs(yN(t, N) - yx(t)));
    return m;
  });
  if (!errs.every((v, i) => i === 0 || v < errs[i - 1]))
    throw new Error("Riemann error must fall as N grows: " + errs);
  // the closing challenge: e^{-t} * e^{-2t} = e^{-t} - e^{-2t}
  for (const t of [0.4, 1, 2.5])
    near(
      simpson((tau) => e(-tau) * e(-2 * (t - tau)), 0, t),
      e(-t) - e(-2 * t),
      1e-9,
      "CTA challenge at t=" + t,
    );
  // the output peaks where the pulse ends
  near(yx(2), 1 - e(-2), 1e-12, "peak value");
  console.log(
    "maths ok: y(t) = 1 - e^{-t} on [0,2], (1 - e^{-2}) e^{-(t-2)} after, by the integral; x*h = h*x; Riemann error for N = 4, 10, 24, 120: " +
      errs.map((v) => v.toFixed(3)).join(" > ") +
      "; challenge e^{-t} * e^{-2t} = e^{-t} - e^{-2t}",
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
const rnd = mulberry32(20261110);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry of the two plots (canvas pixels)
const GEO = {
  x0: 130,
  ku: 820 / 7,
  topBase: 760,
  topK: 270,
  outBase: 1150,
  outK: 240,
  tmin: -1,
  tmax: 6,
};
const Xp = (u) => GEO.x0 + (u - GEO.tmin) * GEO.ku;

// ------------------------------------------------------------------ header
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 56, color: C.red, html: tx("\\textbf{\\textit{THE CONVOLUTION INTEGRAL}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("FLIP, SLIDE, MULTIPLY, SUM")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;

// plot labels, ticks and markers
const labels = [
  box({ id: "lx", cx: 680, cy: 430, w: 140, h: 40, size: 30, color: C.blue, html: tx("x(\\tau)") }),
  box({
    id: "lh",
    cx: 860,
    cy: 430,
    w: 190,
    h: 40,
    size: 30,
    color: C.red,
    html: tx("h(t-\\tau)"),
    style: "opacity:0",
  }),
  box({ id: "ly", cx: 900, cy: 905, w: 120, h: 40, size: 30, color: C.purple, html: tx("y(t)") }),
  ...[0, 1, 2, 3, 4, 5].map((v) =>
    box({
      id: "tk" + v,
      cx: Xp(v),
      cy: 1182,
      w: 40,
      h: 28,
      size: 24,
      color: DIM,
      html: tx(String(v)),
    }),
  ),
  box({ id: "tkt", cx: 946, cy: 1182, w: 50, h: 28, size: 24, color: DIM, html: tx("\\tau,\\,t") }),
].join("");
const marks = [
  box({
    id: "mk0",
    cx: Xp(0) - 12,
    cy: 430,
    w: 215,
    h: 40,
    size: 26,
    color: C.white,
    html: tx(it("OVERLAP STARTS")),
    style: "opacity:0",
  }),
  box({
    id: "mk2",
    cx: Xp(2) + 40,
    cy: 430,
    w: 190,
    h: 40,
    size: 26,
    color: C.white,
    html: tx(it("PEAK, ") + "t=2"),
    style: "opacity:0",
  }),
].join("");

// ------------------------------------------------------------------ counters, formulas, HUD (stacked variants toggled by the timeline)
const CY_CNT = 1262,
  CY_FM = 1362;
const mkC = (id, tex, hidden = true) =>
  box({
    id,
    cx: 540,
    cy: CY_CNT,
    w: 560,
    h: 100,
    size: 84,
    color: C.blue,
    html: tx(tex),
    style: hidden ? "opacity:0" : "",
  });
const counters = [
  mkC("c0", `N=${HOOK_N}`, false),
  ...[12, 6, 3, 2, 1].map((n, i) => mkC("r" + (i + 1), `N=${n}`)),
  mkC("n1", "N=1"),
  mkC("n2", "N=2"),
  ...T.sN.map((n) => mkC("n" + n, `N=${n}`)),
  mkC("ninf", "N\\to\\infty"),
].join("");
const mkF = (id, tex, hidden = true, size = 50) =>
  box({
    id,
    cx: 540,
    cy: CY_FM,
    w: 880,
    h: 110,
    size,
    color: C.blue,
    html: tx(tex),
    m: true,
    style: hidden ? "opacity:0" : "",
  });
const INTEGRAL = "y(t)=\\int_{-\\infty}^{\\infty}x(\\tau)\\,h(t-\\tau)\\,d\\tau";
const formulas = [
  mkF("fm0", INTEGRAL, false),
  mkF("fm1", "\\delta(t)\\;\\longrightarrow\\;h(t)"),
  mkF("fm2", "x_{k}\\,\\delta(t-\\tau_{k})\\;\\longrightarrow\\;x_{k}\\,h(t-\\tau_{k})"),
  mkF("fm3", "y(t)\\approx\\sum_{k}x(\\tau_{k})\\,h(t-\\tau_{k})\\,\\Delta\\tau"),
  mkF("fm4", INTEGRAL),
  mkF(
    "fcase",
    "y(t)=\\begin{cases}1-e^{-t}&0\\le t\\le2\\\\(1-e^{-2})\\,e^{-(t-2)}&t>2\\end{cases}",
    true,
    38,
  ),
].join("");
// the live read-out: t and y(t), one element every 0.1 s, from the same law the canvas uses (t = -1 + (time - slide0))
const HUD = [];
for (let k = 0; k <= 60; k++) {
  const t = Math.round((-1 + 0.1 * k) * 10) / 10;
  HUD.push({ id: "hk" + k, t, y: yx(t) });
}
const hud = HUD.map((h) =>
  box({
    id: h.id,
    cx: 540,
    cy: CY_CNT,
    w: 800,
    h: 80,
    size: 54,
    color: C.white,
    html: tx(
      `${col(C.blue, "t=" + h.t.toFixed(1))}\\;\\;\\;${col(C.purple, "y(t)=" + h.y.toFixed(3))}`,
    ),
    style: "opacity:0",
  }),
).join("");

// ------------------------------------------------------------------ banners
const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("A CIRCUIT. ANY INPUT."), it("HOW DOES IT RESPOND?"), 1),
  bn("bn1", it("ONE KICK: AN IMPULSE"), it("THE CIRCUIT RINGS WITH ") + "h(t)", 0),
  bn("bn2", it("LINEAR AND TIME-INVARIANT"), it("SHIFT THE KICK, SHIFT THE RING"), 0),
  bn("bn3", it("CUT THE INPUT INTO KICKS"), it("ADD ALL THE RINGS"), 0),
  bn("bn4", it("THINNER KICKS, MORE OF THEM"), it("THE SUM BECOMES AN INTEGRAL"), 0),
  bn("bn5", it("FLIP ") + "h" + it(", SLIDE IT ALONG"), it("THE OVERLAP AREA IS ") + "y(t)", 0),
  bn("bnF", it("NO DIFFERENTIAL EQUATION"), it("JUST FLIP, SLIDE, MULTIPLY, SUM"), 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

// ------------------------------------------------------------------ CTA
const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("CONVOLVE ") + "e^{-t}" + it(" WITH ") + "e^{-2t}"), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("ANSWER BELOW ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:180px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;

const check = `<svg id="chk" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" data-layout-ignore>
  <path id="chkp" d="M880 1245 l22 24 l44 -50" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="120" stroke-dashoffset="120" opacity="0" style="filter:drop-shadow(0 0 10px ${C.purple})"/>
</svg>`;

// ------------------------------------------------------------------ guards
const allHtml = [header, labels, marks, counters, formulas, hud, banner, card].join("");
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
    hookN: HOOK_N,
    hud: HUD.map((h) => [
      Math.round((T.slide0 + 0.1 * HUD.indexOf(h)) * 100) / 100,
      +h.y.toFixed(4),
    ]),
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
  GEO,
  HOOK_N,
  HUD: HUD.map((h) => ({ id: h.id, t: h.t })),
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
<title>The Convolution Integral</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="top:400px;height:400px"></div>
<div class="panel" style="top:860px;height:340px"></div>
<div id="glow" style="position:absolute;left:90px;top:400px;width:900px;height:800px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:400px;width:900px;height:800px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
<canvas id="cv" data-layout-allow-overflow data-layout-ignore></canvas>
${labels}
${marks}
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
