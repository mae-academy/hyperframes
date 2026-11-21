// THE BRUSHLESS DC MOTOR (25.0 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// A permanent-magnet rotor, three stator phases, six-step commutation driven by three Hall sensors. The page draws the motor, its stator field,
// the phase currents, the Hall signals, the trapezoidal back-EMF, the inverter bridge and the speed equation from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const bldcSrc = fs.readFileSync(new URL("./bldc.js", import.meta.url), "utf8");
const BLDC = new Function(bldcSrc + "\nreturn globalThis.BLDC;")();

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 28.6;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  s1: 2.2,
  t0: 2.4, // the duty drops to 0.4 and the rotor settles at its slow speed
  st: [2.2, 5.2, 8.6, 12.0, 15.4], // banners
  sw: [2.4, 5.4, 8.8, 12.2, 15.6, 17.2, 19.4], // counters (the snap)
  asm: [6.4, 6.9, 7.5], // the stator, the Hall boards and the rotor arrive (a clack each)
  lock: 22.2,
  banF: 23.2,
  card: 24.6,
  pulse: 27.0,
};

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
const RPM = {};
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))))
      throw new Error(`${what}: ${a} vs ${b}`);
  };
  // the trapezoid: 120 degree flat tops, 60 degree ramps
  near(BLDC.trap(90), 1, 1e-12, "positive flat top");
  near(BLDC.trap(270), -1, 1e-12, "negative flat top");
  near(BLDC.trap(0), 0, 1e-12, "zero crossing");
  near(BLDC.trap(165), 0.5, 1e-12, "ramp down");
  // six-step commutation: the two conducting phases are exactly the ones on a flat top, so the torque Ke I is constant
  for (let th = 0.25; th < 360; th += 0.5) {
    const I = 1,
      i = BLDC.currents(th, I);
    let p = 0,
      cond = 0;
    for (let n = 0; n < 3; n++) {
      p += BLDC.emf(n, th) * i[n];
      if (i[n] !== 0) {
        cond++;
        if (Math.abs(BLDC.emf(n, th)) < 1 - 1e-9)
          throw new Error(`phase ${n} conducts on a ramp at ${th}`);
      }
    }
    near(p, 2, 1e-9, `constant torque (2 Ke_ph I) at ${th} degrees`);
    if (cond !== 2) throw new Error("exactly two phases must conduct");
    // the phase that floats is on a ramp or about to cross zero: it is the one a sensorless drive would read
  }
  // three Hall sensors: six distinct codes, one bit changes at each 60 degree step, the sequence is the Gray code
  const codes = [];
  for (let k = 0; k < 6; k++) codes.push(BLDC.hall(30 + 60 * k + 10).join(""));
  if (new Set(codes).size !== 6) throw new Error("six distinct Hall codes expected");
  if (codes.join(",") !== "101,100,110,010,011,001") throw new Error("Hall sequence: " + codes);
  for (let k = 0; k < 6; k++) {
    const a = codes[k],
      b = codes[(k + 1) % 6];
    let diff = 0;
    for (let j = 0; j < 3; j++) if (a[j] !== b[j]) diff++;
    if (diff !== 1) throw new Error("one bit must change per step");
    // the Hall sensors switch exactly at the commutation instants (30 + 60 k degrees)
    const before = BLDC.hall(30 + 60 * k - 0.01).join(""),
      after = BLDC.hall(30 + 60 * k + 0.01).join("");
    if (before === after) throw new Error("Hall code must change at " + (30 + 60 * k));
  }
  // the stator field leads the rotor by 60 to 120 degrees: a torque of at least sin 60 = 0.866 of the maximum, 90 degrees on average
  let mnd = 999,
    mxd = -999,
    ssum = 0,
    n = 0;
  for (let th = 0.25; th < 360; th += 0.5) {
    const d = BLDC.mmfAngle(th) - BLDC.rotorAngle(th),
      dd = (((d % 360) + 540) % 360) - 180;
    mnd = Math.min(mnd, dd);
    mxd = Math.max(mxd, dd);
    ssum += Math.sin((dd * Math.PI) / 180);
    n++;
  }
  near(mnd, 60, 2.5e-2, "the field leads by at least 60 degrees");
  near(mxd, 120, 5e-3, "the field leads by at most 120 degrees");
  near(ssum / n, 0.955, 5e-3, "average of sin(delta) = 3 sqrt(3) / pi... of the maximum torque");
  // speed follows duty: KVL D Vdc = Ke w + I R, I = TL / Kt; the switched motor integrated in time agrees
  for (const D of [0.4, 0.7, 1]) {
    const w = BLDC.steadyW(D);
    near(D * BLDC.VDC, BLDC.KE * w + BLDC.steadyI * BLDC.RLL, 1e-12, `KVL at D = ${D}`);
    const s = BLDC.simulate(D);
    near(s.w, w, 1e-2, `simulated speed at D = ${D}`);
    near(s.i, BLDC.steadyI, 1e-2, `simulated current at D = ${D}`);
    RPM[D] = Math.round(BLDC.rpm(w));
  }
  near(BLDC.steadyI, 2, 1e-12, "I = TL / Kt = 2 A");
  if (!(RPM[0.4] < RPM[0.7] && RPM[0.7] < RPM[1])) throw new Error("speed must rise with duty");
  console.log(
    "maths ok: trapezoid with 120 degree flat tops, torque 2 Ke_ph I constant over the whole turn, the conducting phases sit on the flat tops, " +
      "Hall codes 101,100,110,010,011,001 change one bit per 60 degrees at the commutation instants, the stator field leads 60..120 degrees " +
      "(mean sin = " +
      (ssum / n).toFixed(3) +
      "), speed = (D Vdc - I R)/Ke = " +
      [0.4, 0.7, 1].map((d) => RPM[d] + " rpm at D = " + d).join(", ") +
      " (simulated in time: agrees)",
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
const rnd = mulberry32(20261121);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry
const PAT = 330; // top of the 3D panel
const PB1 = [90, 985, 440, 245]; // inverter bridge, then the voltage balance
const PB2 = [550, 985, 440, 245]; // currents, Hall signals, back-EMF over one electrical turn
const PLOT = { x0: 580, w: 360, y0: 1115, k: 34 };
const BR = { xs: [190, 290, 390], top: 1040, bot: 1200 };
const VIEW = { cx: 540, cy: 650, F: 1350 };

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE BRUSHLESS DC MOTOR}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("NO BRUSHES, NO SPARKS")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 800, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const lab = (id, cx, cy, w, size, tex, op = 1, color = C.white) =>
  box({ id, cx, cy, w, h: 38, size, color, html: tx(tex), style: op === 1 ? "" : `opacity:${op}` });
const labels = [
  lab("lslow", 820, 362, 330, 24, it("SLOW MOTION ") + "\\times100", 1),
  // the 3D annotations: moved every frame to the part they name (their resting place is the centre of the 3D view)
  lab("l3brush", VIEW.cx, VIEW.cy, 170, 28, it("CARBON BRUSH"), 0),
  lab("l3comm", VIEW.cx, VIEW.cy, 220, 28, it("COMMUTATOR"), 0),
  lab("l3spark", VIEW.cx, VIEW.cy, 170, 28, it("SPARKS"), 0),
  lab("l3stator", VIEW.cx, VIEW.cy, 250, 28, it("STATOR COILS"), 0),
  lab("l3rotor", VIEW.cx, VIEW.cy, 280, 28, it("MAGNET ROTOR"), 0),
  lab("l3hall", VIEW.cx, VIEW.cy, 250, 28, it("HALL SENSOR"), 0),
  lab("lNp", VIEW.cx, VIEW.cy, 40, 40, "N", 0),
  lab("lSp", VIEW.cx, VIEW.cy, 40, 40, "S", 0),
  // the waveforms
  lab("lLegCur", 680, 1010, 150, 28, "i_{a}\\;i_{b}\\;i_{c}", 0),
  lab("lLegHall", 680, 1010, 170, 28, "H_{1}\\;H_{2}\\;H_{3}", 0),
  lab("lLegEmf", 680, 1010, 150, 28, "e_{a}\\;e_{b}\\;e_{c}", 0),
  // the bridge (T-shaped DC rails)
  lab("lrp", 470, BR.top, 100, 26, "+V_{dc}", 0),
  lab("lrn", 452, BR.bot, 40, 26, "0", 0),
  ...["a", "b", "c"].map((p, n) => lab("ll" + p, BR.xs[n] + 26, 1122, 30, 24, p, 0)),
  // the voltage balance
  lab("lKV1", 205, 1085, 120, 26, "D\\,V_{dc}", 0),
  lab("lKV2", 215, 1140, 180, 26, "K_{e}\\omega\\!+\\!IR", 0),
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
const rpmTxt = (D, dtxt) => `D=${dtxt}\\;\\Rightarrow\\;${RPM[D]}\\,\\textit{rpm}`;
const counters = [
  mkC("c0", it("NO BRUSHES, NO SPARKS"), C.blue, 52, false),
  mkC("c1", it("SPARKS, WEAR, NOISE"), C.blue, 54),
  mkC("c2", it("NO SLIDING CONTACT"), C.blue, 54),
  mkC("c3", "6\\times60^{\\circ}=360^{\\circ}", C.blue, 56),
  mkC("c4", "3\\,\\textit{bits}\\;\\Rightarrow\\;6\\,\\textit{steps}", C.blue, 52),
  mkC("c5", rpmTxt(0.4, "0.4"), C.blue, 52),
  mkC("c6", rpmTxt(0.7, "0.7"), C.blue, 52),
  mkC("c7", rpmTxt(1, "1"), C.blue, 52),
  mkC("cfin", it("A MAGNET, THREE COILS, SIX SWITCHES"), C.blue, 40),
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
  ["fm0", "\\omega=\\dfrac{D\\,V_{dc}-I\\,R}{K_{e}}", 44, false],
  ["f1", it("THE BRUSHES RUB EVERY TURN"), 38],
  ["f2", "T=K_{t}\\,I", 56],
  ["f3", it("TWO PHASES ON, ONE FLOATING"), 38],
  ["f4", "101\\to100\\to110\\to010\\to011\\to001", 44],
  ["f5", "\\omega=\\dfrac{D\\,V_{dc}-I\\,R}{K_{e}}", 44],
  ["f6", "e=K_{e}\\,\\omega", 56],
  ["f7", it("SLOWED DOWN ") + "\\times100", 50],
  ["f8", "T=K_{t}\\,I\\;\\;\\;e=K_{e}\\,\\omega", 50],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("HOW DOES A MOTOR SPIN WITHOUT BRUSHES?"), it("ELECTRONICS SWITCH THE COILS"), 1),
  bn("bn1", it("A BRUSHED MOTOR: BRUSHES RUB THE COMMUTATOR"), it("SPARKS, WEAR, NOISE"), 0),
  bn("bn2", it("SWAP THE ROLES"), it("MAGNETS SPIN, COILS STAY STILL"), 0),
  bn(
    "bn3",
    it("ELECTRONICS REPLACE THE BRUSHES"),
    it("SIX SWITCHES, SIX STEPS OF 60") + "^{\\circ}",
    0,
  ),
  bn("bn4", it("THREE HALL SENSORS READ THE ROTOR"), it("3 BITS = 6 STEPS"), 0),
  bn("bn5", it("MORE DUTY, MORE SPEED"), "\\omega=(D\\,V_{dc}-I\\,R)/K_{e}", 0),
  bn("bnF", it("A MAGNET, THREE COILS, SIX SWITCHES"), it("NO BRUSHES TO WEAR OUT"), 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("WHAT IF A HALL SENSOR FAILS?")), style: "opacity:0" })}
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
  PAT,
  PB1,
  PB2,
  PLOT,
  BR,
  VIEW,
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
<title>The Brushless DC Motor</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
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
${bldcSrc}
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
