// THE MICRON INSPECTOR: HOW A CAMERA MEASURES 31 MICRONS (22.0 s).
// A computer-vision walk-through on one backlit CNC part: capture, pixels, gradient, sub-pixel edge, circle fit,
// tolerance decision, sorting. Every number on screen is computed here by the same image model the page uses.
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;
const cvSrc = fs.readFileSync(new URL("./cvcore.js", import.meta.url), "utf8");
const CV = new Function(cvSrc + "; return CV;")();

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 22;
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ the measurement (real maths, asserted)
const SENSOR = 3500, // px, square sensor; 1 px = 8 um -> 28 mm field of view
  D_NOM = 20.0,
  D_TRUE = 20.031, // what the CNC actually cut (the defect)
  TOL_UM = 15,
  K = 24; // edge points on the circle
const HOLE = { cx: 1750.37, cy: 1750.11, R: (D_TRUE * 1000) / 2 / CV.UM }; // true hole, sensor px
const NOM_R = (D_NOM * 1000) / 2 / CV.UM; // 1250 px
const WORLD = 0.16; // screen px (full view) per sensor px: 560 px = 3500 sensor px
// centroid of |G| in a +-2 px window around the strongest gradient (positions are pixel centres i + 0.5)
function centroid(g, off) {
  let am = 0;
  g.forEach((v, i) => {
    if (Math.abs(v) > Math.abs(g[am])) am = i;
  });
  let sw = 0,
    swx = 0;
  for (let i = Math.max(0, am - 2); i <= Math.min(g.length - 1, am + 2); i++) {
    sw += Math.abs(g[i]);
    swx += Math.abs(g[i]) * (i + off);
  }
  return swx / sw;
}
// --- the patch: 10 x 10 pixels at the left edge of the hole (what the zoom shows)
const ix0 = Math.floor(HOLE.cx - HOLE.R) - 4,
  iy0 = Math.round(HOLE.cy) - 5;
const patchI = [],
  patchG = [],
  rowXc = [];
for (let j = 0; j < 10; j++) {
  const row = [];
  for (let i = -1; i <= 10; i++) row.push(CV.pix(ix0 + i, iy0 + j, HOLE, 7));
  patchI.push(row.slice(1, 11));
  const g = [];
  for (let i = 0; i < 10; i++) g.push((row[i + 2] - row[i]) / 2);
  patchG.push(g);
  rowXc.push(centroid(g, 0.5));
}
const xe = rowXc.reduce((a, b) => a + b, 0) / 10; // sub-pixel edge, patch coordinates
const meanAbsG = patchG[0].map((_, i) => patchG.reduce((a, r) => a + Math.abs(r[i]), 0) / 10);
const peakCol = meanAbsG.indexOf(Math.max(...meanAbsG));
const gMax = Math.max(...patchG.flat().map(Math.abs));
// --- precision of that estimator: 600 seeded trials with random sub-pixel edge positions and fresh noise
const rr = mulberry32(5150);
let sumE = 0,
  sumE2 = 0;
const NT = 600;
for (let n = 0; n < NT; n++) {
  const off = rr();
  const Ht = { cx: HOLE.cx, cy: HOLE.cy, R: HOLE.cx - (Math.floor(HOLE.cx - HOLE.R) + off) };
  const e0 = Math.floor(Ht.cx - Ht.R) - 4;
  const xs = [];
  for (let j = 0; j < 10; j++) {
    const row = [];
    for (let i = -1; i <= 10; i++) row.push(CV.pix(e0 + i, iy0 + j, Ht, 100 + n));
    const g = [];
    for (let i = 0; i < 10; i++) g.push((row[i + 2] - row[i]) / 2);
    xs.push(centroid(g, 0.5));
  }
  const est = e0 + xs.reduce((a, b) => a + b, 0) / 10;
  const err = est - (Ht.cx - Ht.R);
  sumE += err;
  sumE2 += err * err;
}
const biasPx = sumE / NT,
  sigmaPx = Math.sqrt(sumE2 / NT - biasPx * biasPx);
// --- K edge points: point 0 is the patch; the others are measured along radial probe lines (5 parallel lines each)
const pts = [{ x: ix0 + xe, y: iy0 + 5 }];
for (let k = 1; k < K; k++) {
  const th = Math.PI + (k * 2 * Math.PI) / K,
    nx = Math.cos(th),
    ny = Math.sin(th);
  let acc = 0;
  for (let m = -2; m <= 2; m++) {
    const prof = [];
    for (let j = 0; j <= 10; j++) {
      const r = NOM_R + (j - 5);
      const qx = 1750 + r * nx - m * ny,
        qy = 1750 + r * ny + m * nx;
      const d = Math.hypot(qx - HOLE.cx, qy - HOLE.cy) - HOLE.R;
      prof.push(CV.clip(CV.Iclean(d) + CV.NOISE * CV.gauss(k * 100 + j, m + 2, 11)));
    }
    const g = [];
    for (let j = 1; j < 10; j++) g.push((prof[j + 1] - prof[j - 1]) / 2);
    acc += centroid(g, 1); // g[0] belongs to sample 1
  }
  const rEdge = NOM_R + (acc / 5 - 5);
  pts.push({ x: 1750 + rEdge * nx, y: 1750 + rEdge * ny });
}
// --- least-squares circle (Kasa): x^2 + y^2 + A x + B y + Cc = 0
function fitCircle(P) {
  let sx = 0,
    sy = 0;
  P.forEach((p) => ((sx += p.x), (sy += p.y)));
  const mx = sx / P.length,
    my = sy / P.length;
  let suu = 0,
    suv = 0,
    svv = 0,
    suuu = 0,
    svvv = 0,
    suvv = 0,
    svuu = 0;
  P.forEach((p) => {
    const u = p.x - mx,
      v = p.y - my;
    suu += u * u;
    suv += u * v;
    svv += v * v;
    suuu += u * u * u;
    svvv += v * v * v;
    suvv += u * v * v;
    svuu += v * u * u;
  });
  const det = suu * svv - suv * suv;
  const uc = (0.5 * (suuu + suvv) * svv - 0.5 * (svvv + svuu) * suv) / det;
  const vc = (0.5 * (svvv + svuu) * suu - 0.5 * (suuu + suvv) * suv) / det;
  return { cx: mx + uc, cy: my + vc, R: Math.sqrt(uc * uc + vc * vc + (suu + svv) / P.length) };
}
const fit = fitCircle(pts);
const dMeas = Math.round(((2 * fit.R * CV.UM) / 1000) * 1000) / 1000; // mm, 3 decimals = 1 um
const dUm = Math.round((dMeas - D_NOM) * 1000);
const gapPx = fit.R - NOM_R; // the real edge sits this many px left of where the CAD edge should be (hole too big)
const nomX = xe + gapPx; // nominal edge, patch coordinates
const halfUm = gapPx * CV.UM;
(function assertMath() {
  if (Math.abs(biasPx) > 0.05) throw new Error("edge estimator bias " + biasPx.toFixed(3) + " px");
  if (sigmaPx > 0.1) throw new Error("edge estimator sigma " + sigmaPx.toFixed(3) + " px");
  const errUm = Math.abs(dMeas - D_TRUE) * 1000;
  if (errUm > 1) throw new Error("diameter error " + errUm.toFixed(2) + " um");
  if (Math.abs(Math.abs(dUm) - 2 * halfUm) > 1.01)
    throw new Error("gap does not match the diameter error");
  if (!(Math.abs(dUm) > TOL_UM)) throw new Error("this part must be out of tolerance");
  if (nomX < 0.5 || nomX > 9.5 || xe < 0.5 || xe > 9.5) throw new Error("edge leaves the patch");
  if (peakCol < 2 || peakCol > 7) throw new Error("gradient peak at the patch border");
  console.log(
    `maths ok: 1 px = ${CV.UM} um; edge estimator bias ${(biasPx * CV.UM).toFixed(2)} um, sigma ${sigmaPx.toFixed(3)} px = ${(sigmaPx * CV.UM).toFixed(2)} um (${NT} trials); ` +
      `fit of ${K} points: diameter ${dMeas.toFixed(3)} mm (true ${D_TRUE}), delta ${dUm} um > ${TOL_UM} um -> REJECT; ` +
      `measured edge ${xe.toFixed(2)} px vs nominal ${nomX.toFixed(2)} px (gap ${halfUm.toFixed(1)} um per side)`,
  );
})();

// ------------------------------------------------------------------ timeline constants (shared with anim.js through CFG)
const S = { 1: 1.6, 2: 4.0, 3: 6.6, 4: 8.8, 5: 10.8, 6: 14.0, 7: 16.6, 8: 19.4 };
const T_PT0 = 11.6,
  T_PT_STEP = 0.08;
const r3 = (v) => Math.round(v * 1000) / 1000;
const T_PTS = Array.from({ length: K }, (_, k) => r3(T_PT0 + k * T_PT_STEP));

// ------------------------------------------------------------------ helpers
const tx = (s) => {
  let h;
  try {
    h = katex.renderToString(s, { throwOnError: true, output: "html", strict: "error" });
  } catch (e) {
    throw new Error("KaTeX failed on: " + s + " -> " + String(e.message).slice(0, 200));
  }
  return h;
};
const it = (s) => `\\textit{${s}}`;
const col = (c, s) => `\\textcolor{${c}}{${s}}`;
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
  style = "",
  left = false,
  right = false,
}) {
  const l = left || right ? cx : cx - w / 2;
  const just = left ? "justify-content:flex-start;" : right ? "justify-content:flex-end;" : "";
  return `<div ${id ? `id="${id}"` : ""} class="t ${cls}" style="left:${l}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;font-size:${size}px;color:${color};${just}${style}">${html}</div>`;
}
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const GLYPH = (s, c = "#fff") =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="${c}" stroke-width="2.2"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="${c}" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.3" fill="${c}"/></svg>`;
const CHECK = (s, c = "#fff") =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CROSS = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none;margin-right:12px"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/></svg>`;
const sgn = (v) => (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v);
const f2 = (v) => v.toFixed(2);
const CHIP = "background:rgba(10,10,16,.78);border-radius:10px;padding:0 10px;";

// ------------------------------------------------------------------ zone 1: header
const header = `
<div id="flash0"></div><div id="flashG"></div>
${box({ id: "wm", cx: 540, cy: 640, w: 1000, h: 130, size: 100, color: C.red, html: tx(it("@MAE.Academy")), style: "opacity:.12" }).replace(`id="wm"`, `id="wm" data-layout-ignore`)}
${box({ id: "h-title", cx: 540, cy: 180, w: 1000, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{HOW A CAMERA MEASURES}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 232, w: 1000, h: 50, size: 40, color: C.purple, html: tx("31\\,\\mu m" + it(" ON A CNC PART")) })}
<div id="h-rule" style="position:absolute;left:480px;top:268px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>`;

// ------------------------------------------------------------------ zone 2: arena = one canvas (900 x 610) + KaTeX labels on top
const RX = 740; // centre of the right-hand panel (plate-local)
const xm = 20 + 56 * xe,
  xn = 20 + 56 * nomX; // measured / nominal edge in the zoomed patch (plate-local x)
const L = (id, cx, cy, w, size, color, html, extra = "") =>
  box({
    id,
    cx,
    cy,
    w,
    h: Math.round(size * 1.3),
    size,
    color,
    html: tx(html),
    cls: "ov",
    style: "opacity:0;" + extra,
  });
const ptCounters = T_PTS.map((_, k) =>
  box({
    id: "pn" + k,
    cx: RX,
    cy: 118,
    w: 260,
    h: 70,
    size: 56,
    color: "#fff",
    html: tx("n=" + (k + 1)),
    cls: "ov",
    style: "opacity:0",
  }).replace(`id="pn${k}"`, `id="pn${k}" data-layout-ignore`),
).join("");
const ov = `<div id="ov">
  ${L("s1a", RX, 70, 260, 24, "rgba(255,255,255,.6)", it("SENSOR"))}
  ${L("s1b", RX, 125, 260, 36, C.blue, "3500\\times3500")}
  ${L("s1c", RX, 182, 260, 32, C.purple, "1\\,px=8\\,\\mu m")}
  ${L("pI", 650, 46, 100, 28, C.blue, "I(x)")}
  ${L("pG", 650, 276, 100, 28, C.red, "G(x)")}
  ${L("xeR", RX, 530, 260, 36, C.purple, "x_{e}=" + f2(xe) + "\\,px")}
  ${box({ id: "chM", cx: xm - 200, cy: 50, w: 190, h: 34, size: 24, color: C.purple, html: tx(it("MEASURED")), cls: "ov", right: true, style: "opacity:0;" + CHIP })}
  ${box({ id: "chN", cx: xn + 10, cy: 50, w: 150, h: 34, size: 24, color: "rgba(255,255,255,.85)", html: tx(it("NOMINAL")), cls: "ov", left: true, style: "opacity:0;" + CHIP })}
  ${box({ id: "chS", cx: 96, cy: 546, w: 160, h: 34, size: 24, color: "#fff", html: tx("1\\,px=8\\,\\mu m"), cls: "ov", left: true, style: "opacity:0;" + CHIP })}
  ${box({ id: "chG", cx: (xm + xn) / 2, cy: 496, w: 170, h: 40, size: 28, color: C.purple, html: tx(halfUm.toFixed(1) + "\\,\\mu m"), cls: "ov", style: "opacity:0;" + CHIP })}
  ${L("ep", RX, 62, 260, 24, "rgba(255,255,255,.6)", it("EDGE POINTS"))}
  ${ptCounters}
  ${L("dres", RX, 112, 280, 38, C.blue, "\\varnothing=" + dMeas.toFixed(3) + "\\,mm")}
  ${L("dnom", RX, 160, 280, 28, "rgba(255,255,255,.7)", it("NOMINAL ") + "20.000\\,mm")}
  ${L("ddel", RX, 222, 280, 44, C.purple, "\\Delta=" + sgn(dUm) + "\\,\\mu m")}
  ${L("gax", RX, 322, 260, 26, "rgba(255,255,255,.6)", "\\Delta\\,(\\mu m)")}
  ${L("gtl", RX, 482, 200, 26, C.purple, "\\pm" + TOL_UM + "\\,\\mu m")}
  <div id="verd" class="t ov" style="left:${RX - 140}px;top:${545 - 30}px;width:280px;height:60px;font-size:44px;color:${C.red};opacity:0">${CROSS(40)}${tx(it("REJECT"))}</div>
  ${L("bl1", 300, 118, 160, 24, "rgba(255,255,255,.6)", it("CAMERA"))}
  <div id="bl2" class="t ov" style="left:566px;top:128px;width:160px;height:32px;font-size:24px;color:rgba(255,255,255,.6);justify-content:flex-start;opacity:0">${tx(it("PUSHER"))}</div>
  ${L("bl3", 540, 478, 160, 24, C.red, it("REJECT BIN"))}
  <div id="bl4" class="t ov" style="left:690px;top:454px;width:190px;height:32px;font-size:24px;color:rgba(255,255,255,.6);justify-content:flex-end;opacity:0">${tx("\\rightarrow" + it(" PASS"))}</div>
  <div id="bl5" class="t ov" style="left:24px;top:454px;width:190px;height:32px;font-size:24px;color:rgba(255,255,255,.6);justify-content:flex-start;opacity:0">${tx(it("FROM CNC ") + "\\rightarrow")}</div>
  <svg id="ovs" width="900" height="610" viewBox="0 0 900 610" style="position:absolute;left:0;top:0">
    <circle id="ringR" cx="540" cy="340" r="10" fill="none" stroke="${C.red}" stroke-width="4" style="opacity:0"/>
    <rect id="sweep" x="0" y="0" width="5" height="610" fill="${C.purple}" style="opacity:0;filter:drop-shadow(0 0 10px ${C.purple})"/>
    <g id="lockb" transform="translate(430,176)" style="opacity:0;filter:drop-shadow(0 0 8px ${C.purple})"><circle r="34" fill="rgba(10,10,16,.8)" stroke="${C.purple}" stroke-width="4"/><path id="lockk" d="M-14,2L-4,13L15,-10" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="50" stroke-dashoffset="50"/></g>
  </svg>
</div>`;
const plate = `<div id="plate"><canvas id="cv" width="900" height="610" data-layout-allow-overflow></canvas>${ov}</div>`;

// ------------------------------------------------------------------ zone 3: banner (820 x 100, y 980 - 1080)
const BN = { x: 130, y: 980, w: 820, h: 100 };
const bx = (id, l1, l2, on = false) =>
  `<div id="${id}" class="ba" style="opacity:${on ? 1 : 0}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banner = `<div id="banner">
${bx("BA", it("A HUMAN EYE SEES 100 MICRONS AT BEST"), it("A CAMERA MEASURES 31."), true)}
${bx("B1", it("STEP 1 ") + "\\bullet" + it(" CAPTURE"), it("LIGHT BECOMES A MATRIX"))}
${bx("B2", it("STEP 2 ") + "\\bullet" + it(" ZOOM IN"), it("EVERY PIXEL IS A NUMBER"))}
${bx("B3", it("STEP 3 ") + "\\bullet" + it(" GRADIENT"), it("EDGE = FASTEST CHANGE"))}
${bx("B4", it("STEP 4 ") + "\\bullet" + it(" SUB-PIXEL EDGE"), it("PRECISION ") + "\\sigma=" + sigmaPx.toFixed(2) + "\\,px=" + (sigmaPx * CV.UM).toFixed(1) + "\\,\\mu m")}
${bx("B5", it("STEP 5 ") + "\\bullet" + it(" CIRCLE FIT"), it(K + " POINTS ") + "\\implies\\varnothing")}
${bx("B6", it("STEP 6 ") + "\\bullet" + it(" COMPARE"), it("NOMINAL VS MEASURED EDGE"))}
${bx("B7", it("DECISION"), "|\\Delta|\\gt" + TOL_UM + "\\,\\mu m\\implies" + it("REJECT"))}
${bx("B8", it("EVERY PART INSPECTED"), it("0 ESCAPES"))}
</div>`;

// ------------------------------------------------------------------ zone 4: one persistent glass card: the six-step pipeline, then the CTA
const CARD = { x: 150, y: 1140, w: 780, h: 460 };
const STEPS = [
  { name: "CAPTURE", form: "I(x,y)", res: col(C.blue, "3500\\times3500"), rc: C.blue },
  {
    name: "PIXELS",
    form: "I\\in[0,255]",
    res: col(C.blue, "20") + "\\leftrightarrow" + col(C.blue, "235"),
    rc: C.blue,
  },
  {
    name: "GRADIENT",
    form: "G=(I_{x+1}-I_{x-1})/2",
    res: "\\max G=" + col(C.purple, String(Math.round(gMax))),
    rc: C.purple,
  },
  {
    name: "SUBPIXEL",
    form: "x_{e}=\\sum G x/\\sum G",
    res: "x_{e}=" + col(C.purple, f2(xe)) + "\\,px",
    rc: C.purple,
  },
  {
    name: "FIT",
    form: "\\min\\sum(|P-c|-R)^{2}",
    res: "\\varnothing=" + col(C.blue, dMeas.toFixed(3)) + "\\,mm",
    rc: C.blue,
  },
  {
    name: "DECIDE",
    form: "|\\Delta|\\gt" + TOL_UM + "\\,\\mu m",
    res: "\\Delta=" + col(C.red, sgn(dUm)) + "\\,\\mu m",
    rc: C.red,
  },
];
const ROW0 = 100,
  ROWD = 62;
const pageA = `
  ${box({ id: "tb0", cx: 390, cy: 38, w: 760, h: 36, size: 28, color: "rgba(255,255,255,.85)", html: tx(it("THE COMPUTER VISION PIPELINE")) })}
  ${STEPS.map((s, i) => {
    const cy = ROW0 + ROWD * i;
    return `<div id="rb${i}" class="rb" style="top:${cy - 28}px;opacity:0"></div>
    <div id="rw${i}" style="opacity:1">
      ${box({ cx: 76, cy, w: 190, h: 40, size: 28, color: "#fff", html: tx(it(s.name)), left: true })}
      ${box({ cx: 272, cy, w: 280, h: 40, size: 26, color: "rgba(255,255,255,.78)", html: tx(s.form), left: true })}
    </div>
    <div id="nm${i}" class="t" style="left:22px;top:${cy - 18}px;width:36px;height:36px;border-radius:18px;border:2px solid rgba(255,255,255,.6);font-size:24px;color:rgba(255,255,255,.85);opacity:0">${tx(String(i + 1))}</div>
    <div id="ck${i}" class="t" style="left:22px;top:${cy - 18}px;width:36px;height:36px;border-radius:18px;background:rgba(176,38,255,.22);border:2px solid ${C.purple};opacity:1">${CHECK(22)}</div>
    ${box({ id: "rs" + i, cx: 754, cy, w: 250, h: 44, size: 30, color: "#fff", html: tx(s.res), right: true, style: "opacity:1" }).replace(/left:\d+(\.\d+)?px/, "left:" + (754 - 250) + "px")}`;
  }).join("")}`;
const pageC = `
  <div id="ctaglow" style="position:absolute;left:60px;top:176px;width:660px;height:130px;border-radius:65px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  ${box({ id: "ct1a", cx: 390, cy: 62, w: 740, h: 56, size: 40, color: C.red, html: tx(it("SAVE THIS")), style: "opacity:0" })}
  <div id="ct1b" class="t" style="left:20px;top:92px;width:740px;height:56px;font-size:40px;color:${C.red};opacity:0">${tx(it("COMPUTER VISION IN 6 STEPS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2a", cx: 390, cy: 216, w: 760, h: 48, size: 35, color: C.blue, html: tx(it("WHICH STEP DID YOU")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 390, cy: 268, w: 760, h: 48, size: 35, color: C.blue, html: tx(it("NOT KNOW? COMMENT ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:140px;top:366px;width:500px;height:56px;font-size:30px;color:rgba(255,255,255,.7);gap:14px;opacity:0">${GLYPH(36, "rgba(255,255,255,.7)")}${tx(it("@MAE.ACADEMY"))}</div>`;
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px">
  <div id="pA" class="pg">${pageA}</div>
  <div id="pC" class="pg">${pageC}</div>
</div>`;

// ------------------------------------------------------------------ typography guard
const allHtml = [header, plate, banner, card].join("");
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(allHtml))
  throw new Error("upright / bold math style found");
const boldCount = (allHtml.match(/class="[^"]*\btextbf\b/g) || []).length;
if (boldCount !== 1)
  throw new Error("expected exactly one \\textbf (the header title), found " + boldCount);
console.log(
  "typography ok: no \\mathbf / \\mathrm / upright math; one \\textbf (header title only, bold italic)",
);

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
#flash0{position:absolute;left:0;top:0;width:${W}px;height:700px;background:radial-gradient(ellipse at 50% 22%,rgba(255,0,68,.5),transparent 65%);opacity:0}
#flashG{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:rgba(255,0,68,.12);opacity:0}
.t{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1}
#plate{position:absolute;left:90px;top:340px;width:900px;height:610px;border-radius:32px;overflow:hidden;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08)}
#cv{position:absolute;left:0;top:0;width:900px;height:610px}
#ov{position:absolute;left:0;top:0;width:900px;height:610px}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:25px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:34px;color:${C.red};line-height:1.15;margin-top:2px}
#card{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1);overflow:hidden}
.pg{position:absolute;left:0;top:0;width:780px;height:460px}
.rb{position:absolute;left:12px;width:756px;height:56px;border-radius:16px;background:rgba(255,0,68,.1);border:2px solid rgba(255,0,68,.55)}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = {
  S,
  T_PTS,
  K,
  UM: CV.UM,
  WORLD,
  SENSOR,
  HOLE,
  NOM_R,
  ix0,
  iy0,
  patchI,
  patchG,
  rowXc,
  xe,
  nomX,
  peakCol,
  gMax,
  pts,
  fit,
  dUm,
  TOL_UM,
  xm,
  xn,
  rows: { ROW0, ROWD, n: STEPS.length },
};

function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>How a Camera Measures 31 Microns</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
${plate}
${banner}
${card}
<audio id="sfx" class="clip" src="assets/sfx.wav" data-start="0" data-duration="${DUR}" data-track-index="2" data-volume="1"></audio>
</div>
<script src="${gsapSrc}"></script>
<script>
window.__CFG = ${JSON.stringify(CFG)};
${cvSrc}
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
for (const d of ["vendor", "assets"]) {
  const link = new URL("./dist/" + d, import.meta.url);
  try {
    fs.lstatSync(link);
  } catch {
    fs.symlinkSync("../" + d, link);
  }
}
console.log("built index.html + dist/index.html");
