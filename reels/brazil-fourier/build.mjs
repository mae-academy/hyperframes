// THE FLAG OF BRAZIL, DRAWN BY ROTATING CIRCLES (22.4 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// The flag is built from its legal geometry (20 x 14 modules), every shape is resampled by arc length, turned into
// z = x + i y and expanded with a complex DFT. The page draws the circles on a canvas from the time alone.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
// the real colours of the flag (the user asked for them; listed in palette-extra.json)
const FLAG = {
  field: "#009B3A",
  rhombus: "#FEDF00",
  disc: "#002776",
  discLine: "#2F6BFF",
  white: "#FFFFFF",
};
const W = 1080,
  H = 1920,
  DUR = 22.4;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  xf0: 1.3, // the equations start turning into the flag
  xf1: 3.1, // the flag is complete
  hold: 3.7,
  down: 4.1, // the filled flag has gone, only the dashed target is left
  roles: ["field", "rhombus", "disc", "band", "star"],
  a: [4.2, 6.9, 9.4, 10.9, 12.9],
  b: [6.6, 9.1, 10.6, 12.6, 15.0],
  lock: 15.6,
  banF: 16.5,
  card: 18.2,
  pulse: 20.8,
};
const SWEEP_N = [1, 4, 16, 64]; // only used to assert that the error falls as N grows
const LIVE_N = { field: 80, rhombus: 64, disc: 1, band: 64, star: 40 };

// ------------------------------------------------------------------ geometry (module units, y down) and the DFT
const PX = 45,
  CX = 540,
  CY = 760; // 20 modules = 900 px
const MOD = { W: 20, H: 14, cx: 10, cy: 7, discR: 3.5 };
const RHOMBUS = [
  [1.7, 7],
  [10, 1.7],
  [18.3, 7],
  [10, 12.3],
];
const STARS = [
  [-0.6, -2.8, 3],
  [0.5, -2.4, 2],
  [1.4, -2.2, 3],
  [-1.8, -2.0, 3],
  [-2.6, -1.2, 4],
  [-1.0, -1.6, 2],
  [0.1, -1.4, 1],
  [1.0, -1.0, 3],
  [2.2, -1.3, 3],
  [2.9, -0.6, 4],
  [-1.9, -0.7, 2],
  [-0.9, -0.4, 3],
  [0.4, -0.5, 2],
  [1.7, -0.2, 2],
  [2.5, 0.4, 3],
  [-2.6, 0.2, 4],
  [-1.5, 0.3, 3],
  [-0.5, 0.6, 1],
  [0.9, 0.7, 2],
  [-2.2, 1.1, 4],
  [-1.0, 1.4, 2],
  [0.2, 1.6, 0],
  [1.3, 1.5, 2],
  [2.0, 1.2, 3],
  [-0.3, 2.4, 1],
  [-1.4, 2.2, 3],
  [0.9, 2.3, 3],
]; // dx, dy from the disc centre in modules, magnitude class: an approximate layout of the sky on the disc
const STAR_R = [0.3, 0.25, 0.21, 0.17, 0.13];

const arc = (c, r, a0, a1, n) =>
  Array.from({ length: n + 1 }, (_, k) => [
    c[0] + r * Math.cos(a0 + ((a1 - a0) * k) / n),
    c[1] + r * Math.sin(a0 + ((a1 - a0) * k) / n),
  ]);
function circleCircle(c0, r0, c1, r1) {
  const dx = c1[0] - c0[0],
    dy = c1[1] - c0[1],
    d = Math.hypot(dx, dy);
  const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d),
    h = Math.sqrt(Math.max(r0 * r0 - a * a, 0));
  const mx = c0[0] + (a * dx) / d,
    my = c0[1] + (a * dy) / d;
  return [
    [mx + (h * dy) / d, my - (h * dx) / d],
    [mx - (h * dy) / d, my + (h * dx) / d],
  ];
}
function bandPolygon() {
  const phi = (75 * Math.PI) / 180,
    mid = 8,
    wid = 0.55,
    D = [MOD.cx, MOD.cy];
  const c = [D[0] + mid * Math.cos(phi), D[1] + mid * Math.sin(phi)];
  const ro = mid + wid / 2,
    ri = mid - wid / 2;
  const ang = (p, o) => Math.atan2(p[1] - o[1], p[0] - o[0]);
  const po = circleCircle(c, ro, D, MOD.discR).sort((p, q) => ang(p, c) - ang(q, c));
  const pi = circleCircle(c, ri, D, MOD.discR).sort((p, q) => ang(p, c) - ang(q, c));
  const outer = arc(c, ro, ang(po[0], c), ang(po[1], c), 64);
  const inner = arc(c, ri, ang(pi[1], c), ang(pi[0], c), 64);
  const discArc = (p, q) => {
    const a0 = ang(p, D),
      a1 = ang(q, D),
      d = Math.atan2(Math.sin(a1 - a0), Math.cos(a1 - a0)); // the short way round
    return arc(D, MOD.discR, a0, a0 + d, 16);
  };
  return [
    ...outer,
    ...discArc(po[1], pi[1]).slice(1, -1),
    ...inner,
    ...discArc(pi[0], po[0]).slice(1, -1),
  ];
}
function starPoly(cx, cy, r) {
  return Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k * Math.PI) / 5,
      rr = k % 2 === 0 ? r : r * 0.381966;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  });
}
/** M points uniformly spaced by arc length along the CLOSED polygon */
function resample(poly, M) {
  const pts = [...poly, poly[0]];
  const s = [0];
  for (let i = 1; i < pts.length; i++)
    s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = s[s.length - 1];
  const out = [];
  let j = 0;
  for (let k = 0; k < M; k++) {
    const t = (total * k) / M;
    while (j < pts.length - 2 && s[j + 1] < t) j++;
    const seg = s[j + 1] - s[j] || 1,
      u = (t - s[j]) / seg;
    out.push([
      pts[j][0] + u * (pts[j + 1][0] - pts[j][0]),
      pts[j][1] + u * (pts[j + 1][1] - pts[j][1]),
    ]);
  }
  return { pts: out, perimeter: total };
}
const toPx = ([x, y]) => [CX + (x - MOD.cx) * PX, CY + (y - MOD.cy) * PX];
/** c_n = (1/M) sum z_k e^{-i n theta_k}, n = -Nmax..Nmax; returns the base c_0 and the terms sorted by descending |c_n| */
function dft(pts, Nmax) {
  const M = pts.length,
    cs = new Float64Array(M),
    sn = new Float64Array(M);
  for (let k = 0; k < M; k++) {
    cs[k] = Math.cos((2 * Math.PI * k) / M);
    sn[k] = Math.sin((2 * Math.PI * k) / M);
  }
  const coef = (n) => {
    let re = 0,
      im = 0;
    for (let k = 0; k < M; k++) {
      const idx = (((n * k) % M) + M) % M; // e^{-i n theta_k} = cos - i sin
      const c = cs[idx],
        s = -sn[idx];
      re += pts[k][0] * c - pts[k][1] * s;
      im += pts[k][0] * s + pts[k][1] * c;
    }
    return [re / M, im / M];
  };
  const base = coef(0);
  const terms = [];
  for (let n = -Nmax; n <= Nmax; n++) {
    if (n === 0) continue;
    const [re, im] = coef(n);
    if (Math.hypot(re, im) > 1e-6) terms.push([n, re, im]);
  }
  terms.sort(
    (p, q) =>
      Math.hypot(q[1], q[2]) - Math.hypot(p[1], p[2]) ||
      Math.abs(p[0]) - Math.abs(q[0]) ||
      p[0] - q[0],
  );
  return { base, terms };
}

// ------------------------------------------------------------------ the contours
const shapes = [];
shapes.push({
  name: "field",
  role: "field",
  poly: [
    [0, 0],
    [20, 0],
    [20, 14],
    [0, 14],
  ],
  M: 1024,
  N: 80,
});
shapes.push({ name: "rhombus", role: "rhombus", poly: RHOMBUS, M: 1024, N: 64 });
shapes.push({
  name: "disc",
  role: "disc",
  M: 720,
  N: 8,
  poly: Array.from({ length: 720 }, (_, k) => [
    MOD.cx + MOD.discR * Math.cos(Math.PI + (2 * Math.PI * k) / 720),
    MOD.cy + MOD.discR * Math.sin(Math.PI + (2 * Math.PI * k) / 720),
  ]),
});
shapes.push({ name: "band", role: "band", poly: bandPolygon(), M: 1024, N: 64 });
STARS.forEach(([dx, dy, mag], i) =>
  shapes.push({
    name: "star_" + String(i).padStart(2, "0"),
    role: "star",
    poly: starPoly(MOD.cx + dx, MOD.cy + dy, STAR_R[mag]),
    M: 512,
    N: LIVE_N.star,
  }),
);
const contours = shapes.map((s) => {
  const { pts, perimeter } = resample(s.poly, s.M);
  const px = pts.map(toPx);
  const { base, terms } = dft(px, s.N);
  return { name: s.name, role: s.role, N: s.N, perimeter, base, terms, ref: px };
});

// ------------------------------------------------------------------ maths assertions (the build fails otherwise)
(function assertMath() {
  const by = Object.fromEntries(contours.map((c) => [c.name, c]));
  const near = (a, b, tol, what) => {
    if (Math.abs(a - b) > tol) throw new Error(`${what}: ${a} vs ${b}`);
  };
  near(by.field.perimeter, 68, 0.02, "field perimeter (modules)");
  near(by.rhombus.perimeter, 4 * Math.hypot(8.3, 5.3), 0.02, "rhombus perimeter");
  near(by.disc.perimeter, 2 * Math.PI * 3.5, 0.02, "disc perimeter");
  if (by.disc.terms.length !== 1)
    throw new Error("the disc must be exactly one rotating circle, found " + by.disc.terms.length);
  near(
    Math.hypot(by.disc.terms[0][1], by.disc.terms[0][2]),
    3.5 * PX,
    0.5,
    "disc circle radius (px)",
  );
  const ev = (c, th, N) => {
    let x = c.base[0],
      y = c.base[1];
    for (const [n, re, im] of c.terms) {
      if (Math.abs(n) > N) continue;
      x += re * Math.cos(n * th) - im * Math.sin(n * th);
      y += re * Math.sin(n * th) + im * Math.cos(n * th);
    }
    return [x, y];
  };
  const rms = (c, N) => {
    let s = 0;
    c.ref.forEach((p, k) => {
      const q = ev(c, (2 * Math.PI * k) / c.ref.length, N);
      s += (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    });
    return Math.sqrt(s / c.ref.length);
  };
  const report = [];
  for (const nm of ["field", "rhombus", "band", "star_00"]) {
    const c = by[nm],
      e = rms(c, c.N);
    report.push(`${nm} N=${c.N} rms ${e.toFixed(2)} px`);
    if (e > 1.6) throw new Error(`${nm} reconstruction rms ${e} px is above 1.6 px`);
  }
  const sweep = SWEEP_N.map((N) => rms(by.rhombus, N));
  if (!sweep.every((v, i) => i === 0 || v < sweep[i - 1]))
    throw new Error("the error must fall at every N step: " + sweep);
  console.log(
    "maths ok: perimeters match the legal geometry, the disc is exactly one circle (r = 157.5 px); " +
      report.join("; ") +
      "; rhombus error over N=1,4,16,64: " +
      sweep.map((v) => v.toFixed(1)).join(" > ") +
      " px",
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
const rnd = mulberry32(20261109);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ the opening: a wall of real equations that turns into the flag
const FIXED = [
  "z(t)=\\sum_{n=-80}^{80}c_{n}\\,e^{int}",
  "c_{n}=\\frac{1}{2\\pi}\\int_{0}^{2\\pi}z(t)\\,e^{-int}\\,dt",
  "c_{n}=\\frac{1}{M}\\sum_{k=0}^{M-1}z_{k}\\,e^{-2\\pi i\\,nk/M}",
  "z_{k}=x(s_{k})+i\\,y(s_{k})",
  "s_{k}=\\frac{kL}{M},\\quad L=\\oint\\lvert z'(t)\\rvert\\,dt",
  "e^{i\\theta}=\\cos\\theta+i\\sin\\theta",
  "r_{n}=\\lvert c_{n}\\rvert,\\quad\\varphi_{n}=\\arg c_{n}",
  "S_{N}(t)=\\sum_{n=-N}^{N}c_{n}\\,e^{int}",
  "\\sum_{n}\\lvert c_{n}\\rvert^{2}=\\frac{1}{2\\pi}\\int\\lvert z\\rvert^{2}dt",
  "z_{disc}(t)=540+760i+157.5\\,e^{i(t+\\pi)}",
  "z_{k}=x_{k}+i\\,y_{k},\\quad k=0,\\dots,M-1",
  "\\omega_{n}=n\\,\\omega_{0},\\quad\\omega_{0}=1",
  "\\lvert z-S_{N}\\rvert\\to0\\;\\;(N\\to\\infty)",
];
const coefLines = [];
const pick = (name, count) => {
  const c = contours.find((q) => q.name === name);
  const k = Math.max(1, contours.findIndex((q) => q.name === name) + 1);
  let shown = 0;
  for (let i = 0; i < c.terms.length && shown < count; i++) {
    const [n, re, im] = c.terms[i];
    if (Math.hypot(re, im) < 0.05) continue; // tiny coefficients would print as 0.000
    shown++;
    coefLines.push(
      `c_{${n}}^{(${k})}=${re < 0 ? "-" : ""}${Math.abs(re).toFixed(3)}${im < 0 ? "-" : "+"}${Math.abs(im).toFixed(3)}\\,i`,
    );
  }
};
pick("field", 9);
pick("rhombus", 9);
pick("band", 8);
pick("disc", 1);
pick("star_00", 4);
pick("star_13", 4);
pick("star_21", 4);
const wallTex = [];
{
  // interleave: fixed formulas spread through the numeric lines
  const total = 3 * 18;
  let fi = 0,
    ci = 0;
  for (let i = 0; i < total; i++) {
    if (i % 4 === 1 && fi < FIXED.length) wallTex.push({ tex: FIXED[fi++], fixed: true });
    else wallTex.push({ tex: coefLines[ci++ % coefLines.length], fixed: false });
  }
}
const COLX = [200, 540, 880];
const wallItems = wallTex.map((w, i) => {
  const col = i % 3,
    row = Math.floor(i / 3);
  const cx = COLX[col] + (rnd() - 0.5) * 30,
    cy = 392 + row * 57 + (rnd() - 0.5) * 8;
  const id = "w" + i;
  const base = w.fixed ? 30 : 25;
  const mw = L[id] ? L[id].w : 0; // measured at the base size on the previous pass
  const f = mw > 330 ? 330 / mw : 1; // CSS scale that makes a long equation fit its column
  const d = Math.hypot(cx - CX, cy - CY) / 620; // distance from the flag centre, 0 .. ~1
  return {
    id,
    cx,
    cy,
    f,
    w: Math.min(mw || 260, 330),
    op: w.fixed ? 0.9 : 0.55,
    delay: +(0.55 * (1 - Math.min(1, d)) + rnd() * 0.1).toFixed(3),
    tex: w.tex,
    base,
  };
});
const wall = `<div id="wall" data-layout-ignore>${wallItems
  .map((it2) =>
    box({
      id: it2.id,
      cx: it2.cx,
      cy: it2.cy,
      w: 340,
      h: 50,
      size: it2.base,
      color: "#FFFFFF",
      html: `<span class="wi" data-m="${it2.id}" data-mraw style="display:inline-block;transform:scale(${it2.f.toFixed(4)})">${tx(it2.tex)}</span>`,
      style: `opacity:${it2.op};`,
    }),
  )
  .join("")}</div>`;
// the dots: each equation sheds dots that fly to a point on the outline of the flag
const outline = [];
contours.forEach((c) =>
  c.ref.forEach((p, k) =>
    k % (c.role === "star" ? 6 : 5) === 0 ? outline.push({ p, role: c.role }) : null,
  ),
);
const LINEC = {
  field: FLAG.field,
  rhombus: FLAG.rhombus,
  disc: FLAG.discLine,
  band: FLAG.white,
  star: FLAG.white,
};
const parts = Array.from({ length: 760 }, (_, i) => {
  const it2 = wallItems[i % wallItems.length];
  const tgt = outline[Math.floor(rnd() * outline.length)];
  const sx = it2.cx + (rnd() - 0.5) * it2.w,
    sy = it2.cy + (rnd() - 0.5) * 26;
  const mx = (sx + tgt.p[0]) / 2,
    my = (sy + tgt.p[1]) / 2;
  const curl = (rnd() - 0.5) * 360;
  return {
    sx: +sx.toFixed(1),
    sy: +sy.toFixed(1),
    tx: +tgt.p[0].toFixed(1),
    ty: +tgt.p[1].toFixed(1),
    cx: +(mx + curl * 0.6).toFixed(1),
    cy: +(my - curl).toFixed(1),
    delay: +(it2.delay + rnd() * 0.18).toFixed(3),
    dur: +(0.95 + rnd() * 0.25).toFixed(3),
    col: LINEC[tgt.role],
    r: +(2.4 + rnd() * 2.2).toFixed(2),
  };
});

// ------------------------------------------------------------------ counters and formulas (stacked variants, toggled by the timeline)
const CNT = []; // {id, n}
const CY_CNT = 1220,
  CY_FM = 1335;
const mkCounter = (id, n, hidden = true) => {
  CNT.push(id);
  return box({
    id,
    cx: 540,
    cy: CY_CNT,
    w: 500,
    h: 100,
    size: 84,
    color: C.blue,
    html: tx(`N=${n}`),
    style: hidden ? "opacity:0" : "",
  });
};
const mkFormula = (id, n, hidden = true) =>
  box({
    id,
    cx: 540,
    cy: CY_FM,
    w: 860,
    h: 90,
    size: 50,
    color: C.blue,
    html: tx(`z(t)=\\sum_{n=-${n}}^{${n}}c_{n}\\,e^{int}`),
    m: true,
    style: hidden ? "opacity:0" : "",
  });
const counters = [...T.roles.map((r, i) => mkCounter("l" + i, LIVE_N[r]))].join("");
const formulas = [...T.roles.map((r, i) => mkFormula("fl" + i, LIVE_N[r]))].join("");

// pips: one per shape, lit when the shape is finished
const PIP_COL = [FLAG.field, FLAG.rhombus, FLAG.disc, FLAG.white, FLAG.white];
const pips = PIP_COL.map((c, i) => {
  const x = 540 + (i - 2) * 56;
  return `<div class="pip" style="left:${x - 18}px;top:1118px"><div id="pf${i}" class="pf" style="background:${c};opacity:0"></div></div>`;
}).join("");

// ------------------------------------------------------------------ header, banners, CTA
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1000, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE FLAG OF BRAZIL}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("DRAWN BY ROTATING CIRCLES")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 760, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const nv = (r) => 2 * LIVE_N[r] + 1;
const banners = [
  bn("bn0", it("THESE EQUATIONS DRAW"), it("THE FLAG OF BRAZIL"), 1),
  bn("bnR0", it("THE FIELD: A CLOSED CURVE"), it(`${nv("field")} CIRCLES`), 0),
  bn("bnR1", it("THE RHOMBUS: 4 SHARP CORNERS"), it(`${nv("rhombus")} CIRCLES`), 0),
  bn("bnR2", it("THE DISC"), it("ONE CIRCLE IS ENOUGH"), 0),
  bn("bnR3", it("THE BAND: A CURVED SLICE"), it(`${nv("band")} CIRCLES`), 0),
  bn("bnR4", it("27 STARS, ALL AT ONCE"), it(`${nv("star")} CIRCLES EACH`), 0),
  bn("bnF2", it("ONLY ROTATING CIRCLES"), it("ZERO PIXELS, ZERO PAINT"), 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1420, w: 900, h: 240 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("WHICH FLAG NEXT? ")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 152, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("COMMENT BELOW ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:184px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;

const check = `<svg id="chk" width="${W}" height="${H}" style="position:absolute;left:0;top:0;overflow:visible;pointer-events:none" data-layout-ignore>
  <path id="chkp" d="M860 1130 l24 26 l48 -56" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="130" stroke-dashoffset="130" opacity="0" style="filter:drop-shadow(0 0 10px ${C.purple})"/>
</svg>`;

const allHtml = [header, banner, card, counters, formulas].join("");
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

// the sound follows the picture: every time the sound needs is written out here
fs.mkdirSync(new URL("./assets/", import.meta.url), { recursive: true });
fs.writeFileSync(
  new URL("./assets/sched.json", import.meta.url),
  JSON.stringify({
    dur: DUR,
    xf0: T.xf0,
    xf1: T.xf1,
    a: T.a,
    b: T.b,
    lock: T.lock,
    pulse: T.pulse,
    card: T.card,
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
#plate{position:absolute;left:90px;top:445px;width:900px;height:630px;border-radius:24px;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08)}
#cv{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.pip{position:absolute;width:36px;height:36px;border-radius:10px;border:2px solid rgba(255,255,255,.3);overflow:hidden}
.pf{position:absolute;left:0;top:0;width:100%;height:100%}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:26px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:38px;color:${C.red};line-height:1.15;margin-top:2px}
#card{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:2px solid rgba(255,0,68,.5);overflow:hidden}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = {
  T,
  LIVE_N,
  FLAG,
  px: { PX, CX, CY },
  contours: contours.map((c) => ({
    name: c.name,
    role: c.role,
    base: c.base.map((v) => +v.toFixed(3)),
    terms: c.terms.map(([n, re, im]) => [n, +re.toFixed(3), +im.toFixed(3)]),
  })),
  spark: Array.from({ length: 28 }, () => ({
    a: rnd() * Math.PI * 2,
    d: 160 + rnd() * 300,
    r: 2.5 + rnd() * 3.5,
  })),
  items: wallItems.map((q) => ({ id: q.id, delay: q.delay, op: q.op })),
  parts,
};
function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>The Flag of Brazil, Drawn by Rotating Circles</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div id="plate"></div>
<div id="glow" style="position:absolute;left:140px;top:420px;width:800px;height:700px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:445px;width:900px;height:630px;border-radius:24px;background:radial-gradient(ellipse at center,rgba(255,0,68,.32),transparent 75%);opacity:0"></div>
<div id="fc" style="position:absolute;left:140px;top:420px;width:800px;height:700px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,136,255,.35),transparent 70%);opacity:0"></div>
<canvas id="cv" data-layout-allow-overflow data-layout-ignore></canvas>
${wall}
${pips}
${counters}
${formulas}
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
