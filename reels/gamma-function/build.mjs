// THE GAMMA FUNCTION: THE GRAPH AND THE CALCULATIONS (23.2 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// Gamma(x) = int_0^inf t^(x-1) e^(-t) dt. The page draws the integrand, the graph, the hops of the recurrence and the poles on a canvas
// from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const DIM = "rgba(255,255,255,.6)";
const W = 1080,
  H = 1920,
  DUR = 23.2;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const SW0 = 5.0,
  SW1 = 9.6;
const XS0 = 0.25,
  XS1 = 4.6; // the integral slides x from 0.25 to 4.6
const T = {
  rewind0: 1.6,
  s1: 2.2,
  dots: [2.4, 2.9, 3.4, 3.9], // Gamma(1..4) = 0!, 1!, 2!, 3!
  s2: 4.6,
  fm2: 4.8,
  sw0: SW0,
  sw1: SW1,
  s3: 10.2,
  fm3: 10.4,
  negHops: [11.6, 12.3, 13.0], // 0.5 -> -0.5 -> -1.5 -> -2.5 (divide)
  clear: 13.5,
  s4: 13.6,
  posHops: [13.8, 14.4, 15.4, 16.4], // marker at 0.5, then 1.5, 2.5, 3.5 (multiply)
  lock: 16.8,
  banF: 17.8,
  card: 19.2,
  pulse: 21.8,
};
const xAt = (time) => XS0 + (XS1 - XS0) * Math.max(0, Math.min(1, (time - SW0) / (SW1 - SW0))); // linear: the same law in the canvas, the read-out and the sound

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
function gamma(z) {
  // Lanczos (g = 7, n = 9) with the reflection formula for z < 1/2: good to about 15 digits
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < 9; i++) x += c[i] / (z + i);
  const t = z + 7.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
const simpson = (g, a, b, n = 200000) => {
  const h = (b - a) / n;
  let s = g(a) + g(b);
  for (let i = 1; i < n; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
};
const HOPS_POS = [0.5, 1.5, 2.5, 3.5];
const HOPS_NEG = [0.5, -0.5, -1.5, -2.5];
const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (Math.abs(a - b) > tol * Math.max(1, Math.abs(b))) throw new Error(`${what}: ${a} vs ${b}`);
  };
  near(gamma(0.5), Math.sqrt(Math.PI), 1e-13, "Gamma(1/2) = sqrt(pi)");
  for (let n = 1; n <= 10; n++) near(gamma(n), fact(n - 1), 1e-12, `Gamma(${n}) = ${n - 1}!`);
  for (const x of [0.3, 0.8, 1.7, 2.9, 4.4])
    near(gamma(x + 1), x * gamma(x), 1e-12, "Gamma(x+1) = x Gamma(x) at " + x);
  // the integral definition, by Simpson's rule on t in [0, 60]
  for (const x of [1.5, 2.5, 3.5, 4.2])
    near(
      simpson((t) => (t === 0 ? 0 : Math.pow(t, x - 1) * Math.exp(-t)), 0, 60),
      gamma(x),
      1e-6,
      "the integral at x = " + x,
    );
  // the negative side by the recurrence Gamma(x) = Gamma(x+1) / x, and the alternating signs between the poles
  near(gamma(-0.5), gamma(0.5) / -0.5, 1e-12, "Gamma(-1/2)");
  near(gamma(-1.5), gamma(-0.5) / -1.5, 1e-12, "Gamma(-3/2)");
  near(gamma(-2.5), gamma(-1.5) / -2.5, 1e-12, "Gamma(-5/2)");
  const signs = [-0.5, -1.5, -2.5, -3.5].map((x) => Math.sign(gamma(x)));
  if (signs.join() !== "-1,1,-1,1")
    throw new Error("signs between the poles must alternate: " + signs);
  for (const p of [0, -1, -2, -3])
    if (Math.abs(gamma(p + 1e-6)) < 1e5) throw new Error("no pole at " + p);
  // the climax: 2.5! = Gamma(3.5) = 2.5 * 1.5 * 0.5 * sqrt(pi) = 1.875 sqrt(pi)
  near(gamma(3.5), 1.875 * Math.sqrt(Math.PI), 1e-13, "Gamma(7/2) = 1.875 sqrt(pi)");
  near(gamma(3.5), 3.32335097044784, 1e-12, "Gamma(7/2) value");
  console.log(
    "maths ok: Gamma(1/2) = sqrt(pi); Gamma(n) = (n-1)! for n = 1..10; the integral matches at x = 1.5, 2.5, 3.5, 4.2; Gamma(x+1) = x Gamma(x); poles at 0, -1, -2, -3 with alternating signs; Gamma(3.5) = 1.875 sqrt(pi) = " +
      gamma(3.5).toFixed(6),
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
const rnd = mulberry32(20261112);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry of the two plots (canvas pixels)
const GB = { xmin: -3.6, xmax: 4.6, x0: 110, ku: 860 / 8.2, zero: 1070, kv: 36 }; // bottom plot: Gamma(x)
const GA = { x0: 110, ku: 86, base: 705, kv: 120 }; // top plot: the integrand t^(x-1) e^(-t), t in [0, 10]
const XB = (x) => GB.x0 + (x - GB.xmin) * GB.ku;
const YB = (v) => GB.zero - v * GB.kv;
// the curve as a table, step 0.01 (null where the value runs off the plot, so the line breaks at the poles)
const TAB = [];
for (let i = 0; i <= 830; i++) {
  const x = Math.round((-3.7 + i * 0.01) * 100) / 100;
  const g = Number.isInteger(x) && x <= 0 ? Infinity : gamma(x);
  TAB.push(Math.abs(g) > 9 || !isFinite(g) ? null : +g.toFixed(4));
}
const TAB0 = -3.7;

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE GAMMA FUNCTION}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("FACTORIALS FOR EVERY NUMBER")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const labels = [
  box({
    id: "lt",
    cx: 790,
    cy: 372,
    w: 300,
    h: 40,
    size: 34,
    color: C.red,
    html: tx("t^{x-1}e^{-t}"),
    style: "opacity:0",
  }),
  box({
    id: "lg",
    cx: 905,
    cy: 790,
    w: 120,
    h: 40,
    size: 36,
    color: C.purple,
    html: tx("\\Gamma(x)"),
  }),
  ...[-3, -2, -1, 0, 1, 2, 3, 4].map((v) =>
    box({
      id: "tx" + (v + 3),
      cx: XB(v),
      cy: 1208,
      w: 50,
      h: 28,
      size: 24,
      color: DIM,
      html: tx(String(v)),
    }),
  ),
  box({
    id: "pl",
    cx: XB(0) - 78,
    cy: 800,
    w: 130,
    h: 34,
    size: 26,
    color: C.white,
    html: tx(it("POLES")),
    style: "opacity:0",
  }),
  // factorials at the integers, on the curve
  ...[1, 2, 3, 4].map((n) =>
    box({
      id: "fl" + n,
      cx: XB(n),
      cy: YB(gamma(n)) - 32,
      w: 70,
      h: 34,
      size: 28,
      color: C.white,
      html: tx(`${n - 1}!`),
      style: "opacity:0",
    }),
  ),
  // the hops of the recurrence
  ...HOPS_POS.map((x, i) =>
    box({
      id: "pv" + i,
      cx: XB(x),
      cy: YB(gamma(x)) + 34,
      w: 130,
      h: 34,
      size: 26,
      color: C.white,
      html: tx(gamma(x).toFixed(4)),
      style: "opacity:0",
    }),
  ),
  ...[0.5, 1.5, 2.5].map((m, i) =>
    box({
      id: "pm" + i,
      cx: (XB(HOPS_POS[i]) + XB(HOPS_POS[i + 1])) / 2,
      cy: YB(Math.max(gamma(HOPS_POS[i]), gamma(HOPS_POS[i + 1]))) - 104,
      w: 120,
      h: 40,
      size: 32,
      color: C.red,
      html: tx(`\\times${m}`),
      style: "opacity:0",
    }),
  ),
  ...HOPS_NEG.slice(1).map((x, i) =>
    box({
      id: "nv" + i,
      cx: XB(x),
      cy: YB(gamma(x)) + (gamma(x) < 0 ? 34 : -34),
      w: 130,
      h: 34,
      size: 26,
      color: C.white,
      html: tx(gamma(x).toFixed(4)),
      style: "opacity:0",
    }),
  ),
  ...[0, 1, 2].map((i) =>
    box({
      id: "nm" + i,
      cx: (XB(HOPS_NEG[i]) + XB(HOPS_NEG[i + 1])) / 2,
      cy: Math.min(YB(gamma(HOPS_NEG[i])), YB(gamma(HOPS_NEG[i + 1]))) - 106,
      w: 170,
      h: 40,
      size: 30,
      color: C.red,
      html: tx(`\\div(${HOPS_NEG[i + 1]})`),
      style: "opacity:0",
    }),
  ),
].join("");

// ------------------------------------------------------------------ counters, formulas, read-outs
const CY_CNT = 1280,
  CY_FM = 1372;
const mkC = (id, tex, color = C.blue, size = 68, hidden = true) =>
  box({
    id,
    cx: 540,
    cy: CY_CNT,
    w: 800,
    h: 90,
    size,
    color,
    html: tx(tex),
    style: hidden ? "opacity:0" : "",
  });
const counters = [
  mkC("c0", "\\Gamma(3.5)=3.323", C.blue, 68, false),
  ...["2.7", "1.9", "1.1", "0.4", "0"].map((v, i) => mkC("r" + (i + 1), `\\Gamma(x)=${v}`)),
  ...[1, 2, 3, 4].map((n) => mkC("n" + n, `${n - 1}!=${fact(n - 1)}`, C.blue, 84)),
  mkC("cp", "\\Gamma\\to\\pm\\infty", C.purple, 76),
  mkC("cfin", "2.5!=3.323", C.blue, 84),
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
const DEF = "\\Gamma(x)=\\int_{0}^{\\infty}t^{x-1}e^{-t}\\,dt";
const formulas = [
  mkF("fm0", DEF, C.blue, 46, false),
  mkF("f1", "\\Gamma(n)=(n-1)!", C.blue, 54),
  mkF("f2", DEF, C.blue, 46),
  mkF("f3", "\\Gamma(x)=\\dfrac{\\Gamma(x+1)}{x}", C.blue, 46),
  mkF("f4", "\\Gamma(x+1)=x\\,\\Gamma(x)", C.blue, 50),
  mkF(
    "f5",
    "\\Gamma\\!\\left(\\tfrac{7}{2}\\right)=\\tfrac{5}{2}\\cdot\\tfrac{3}{2}\\cdot\\tfrac{1}{2}\\sqrt{\\pi}\\approx3.323",
    C.blue,
    44,
  ),
].join("");
// the live read-out while the integral slides: x and Gamma(x), one element per 0.1 s, same law as the canvas
const HUD = [];
for (let k = 0; SW0 + 0.1 * k <= SW1 + 1e-9; k++) {
  const x = xAt(Math.round((SW0 + 0.1 * k) * 100) / 100);
  HUD.push({ id: "hk" + k, x, g: gamma(x) });
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
      `${col(C.blue, "x=" + h.x.toFixed(2))}\\;\\;\\;${col(C.purple, "\\Gamma(x)=" + h.g.toFixed(3))}`,
    ),
    style: "opacity:0",
  }),
).join("");
// the ledger on the top panel: the recurrence, line by line
const LEDP = [
  ["lp0", "\\Gamma(\\tfrac{1}{2})=\\sqrt{\\pi}\\approx1.7725"],
  ["lp1", "\\Gamma(\\tfrac{3}{2})=\\tfrac{1}{2}\\,\\Gamma(\\tfrac{1}{2})=0.8862"],
  ["lp2", "\\Gamma(\\tfrac{5}{2})=\\tfrac{3}{2}\\,\\Gamma(\\tfrac{3}{2})=1.3293"],
  ["lp3", "\\Gamma(\\tfrac{7}{2})=\\tfrac{5}{2}\\,\\Gamma(\\tfrac{5}{2})=3.3234"],
];
const LEDN = [
  ["ln0", "\\Gamma(-\\tfrac{1}{2})=\\dfrac{\\Gamma(\\tfrac{1}{2})}{-\\tfrac{1}{2}}=-3.5449"],
  ["ln1", "\\Gamma(-\\tfrac{3}{2})=\\dfrac{\\Gamma(-\\tfrac{1}{2})}{-\\tfrac{3}{2}}=2.3633"],
  ["ln2", "\\Gamma(-\\tfrac{5}{2})=\\dfrac{\\Gamma(-\\tfrac{3}{2})}{-\\tfrac{5}{2}}=-0.9453"],
];
const ledger = [
  ...LEDP.map(([id, t], i) =>
    box({
      id,
      cx: 540,
      cy: 430 + i * 90,
      w: 860,
      h: 80,
      size: 44,
      color: i === 3 ? C.blue : C.white,
      html: tx(t),
      m: true,
      style: "opacity:0",
    }),
  ),
  ...LEDN.map(([id, t], i) =>
    box({
      id,
      cx: 540,
      cy: 450 + i * 120,
      w: 860,
      h: 100,
      size: 42,
      color: C.white,
      html: tx(t),
      m: true,
      style: "opacity:0",
    }),
  ),
].join("");

// ------------------------------------------------------------------ banners
const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("WHAT IS 2.5 FACTORIAL?"), it("THE ANSWER IS ON THIS CURVE"), 1),
  bn("bn1", it("FACTORIALS LIVE ON THE INTEGERS"), it("GAMMA OF n IS (n - 1)!"), 0),
  bn("bn2", it("FILL THE GAPS WITH AN INTEGRAL"), it("THE AREA UNDER ") + "t^{x-1}e^{-t}", 0),
  bn("bn3", it("GO LEFT: DIVIDE BY x"), it("POLES AT 0, -1, -2, ..."), 0),
  bn("bn4", it("GO RIGHT: MULTIPLY BY x"), it("FROM sqrt(pi) TO 2.5 FACTORIAL"), 0),
  bn("bnF", it("A FACTORIAL FOR EVERY NUMBER"), it("2.5! = 3.323"), 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

// ------------------------------------------------------------------ CTA
const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("PROVE ") + "\\Gamma(\\tfrac{1}{2})=\\sqrt{\\pi}"), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:180px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;
const check = `<svg id="chk" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" data-layout-ignore>
  <path id="chkp" d="M890 1255 l22 24 l44 -50" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="120" stroke-dashoffset="120" opacity="0" style="filter:drop-shadow(0 0 10px ${C.purple})"/>
</svg>`;

// ------------------------------------------------------------------ guards
const allHtml = [header, labels, counters, formulas, hud, ledger, banner, card].join("");
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
    xs0: XS0,
    xs1: XS1,
    hud: HUD.map((h, k) => [
      Math.round((SW0 + 0.1 * k) * 100) / 100,
      +h.x.toFixed(4),
      +h.g.toFixed(4),
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
  GB,
  GA,
  TAB,
  TAB0,
  HOPS_POS,
  HOPS_NEG,
  XS0,
  XS1,
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
<title>The Gamma Function</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="top:340px;height:400px"></div>
<div class="panel" style="top:760px;height:470px"></div>
<div id="glow" style="position:absolute;left:90px;top:340px;width:900px;height:890px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:340px;width:900px;height:890px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
<canvas id="cv" data-layout-allow-overflow data-layout-ignore></canvas>
${labels}
${ledger}
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
