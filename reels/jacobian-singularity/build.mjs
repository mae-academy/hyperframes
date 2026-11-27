// THE JACOBIAN: WHY A ROBOT SOMETIMES FREEZES (24.4 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// A two-link arm. The Jacobian turns joint speeds into tip speed; its two columns are two arrows at the tip, and the area between them is
// det J = L1 L2 sin(theta2). When the arm is straight the arrows line up, the area is zero and one direction of motion is lost.
// The build asserts the maths: the analytic Jacobian against finite differences, the determinant, the singular poses, the blow-up of the
// joint speeds needed near a singularity, and that every pose of the animation keeps the tip on the drawn floor.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 24.4;

// ------------------------------------------------------------------ timeline constants (shared with anim.js and the sound)
const T = {
  rewind0: 1.6,
  st: [2.4, 4.2, 6.0, 7.8, 9.8, 12.4, 15.0, 17.4], // banners
  sw: [2.6, 4.4, 6.2, 8.0, 10.0, 12.6, 15.2, 17.6], // counters (the snap)
  pops: [2.8, 3.0, 10.2, 12.8, 15.6], // the panel titles: velocity space, the joint-rate readout, J, det J, the speed meter
  lock: 19.8,
  banF: 20.6,
  card: 21.8,
  pulse: 23.4,
};
// the arm: link lengths in units of 100 mm (so 300 mm and 250 mm)
const L1 = 3,
  L2 = 2.5;
// joint angles in degrees as keyframes [t, theta1, theta2]; the page and the sound evaluate the same monotone cubic
const DK = [
  [0, 60, 0],
  [1.6, 60, 0],
  [2.4, 60, 100],
  [4.4, 60, 100],
  [5.8, 95, 100],
  [6.2, 95, 100],
  [7.6, 95, 150],
  [8.0, 95, 150],
  [9.6, 60, 105],
  [10.0, 60, 105],
  [11.0, 100, 85],
  [12.4, 75, 95],
  [12.8, 75, 95],
  [14.8, 75, 35],
  [15.4, 75, 35],
  [16.6, 75, 0],
  [17.8, 75, 0],
  [18.4, 62, 0],
  [19.0, 88, 0],
  [19.8, 88, 0],
  [21.0, 50, 105],
  [40, 50, 105],
];
// the same monotone cubic as the page and the sound
function monoEval(keys, t) {
  const n = keys.length,
    m = keys[0].length - 1;
  if (t <= keys[0][0]) return keys[0].slice(1);
  if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
  let i = 0;
  while (keys[i + 1][0] <= t) i++;
  const t0 = keys[i][0],
    t1 = keys[i + 1][0],
    dt = t1 - t0,
    u = (t - t0) / dt;
  const h00 = (1 + 2 * u) * (1 - u) * (1 - u),
    h10 = u * (1 - u) * (1 - u),
    h01 = u * u * (3 - 2 * u),
    h11 = u * u * (u - 1);
  const out = [];
  for (let c = 1; c <= m; c++) {
    const sl = (a, b) => (keys[b][c] - keys[a][c]) / (keys[b][0] - keys[a][0]);
    const tang = (k) => {
      if (k === 0 || k === n - 1) return 0;
      const s0 = sl(k - 1, k),
        s1 = sl(k, k + 1);
      return s0 * s1 <= 0 ? 0 : (2 * s0 * s1) / (s0 + s1);
    };
    out.push(h00 * keys[i][c] + h10 * dt * tang(i) + h01 * keys[i + 1][c] + h11 * dt * tang(i + 1));
  }
  return out;
}

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
const RAD = Math.PI / 180;
const fk = (a, b) => {
  const t1 = a * RAD,
    t12 = (a + b) * RAD;
  return [L1 * Math.cos(t1) + L2 * Math.cos(t12), L1 * Math.sin(t1) + L2 * Math.sin(t12)];
};
// J = [a1 a2]: the columns are the tip velocity per unit speed of joint 1 and of joint 2
const jac = (a, b) => {
  const t1 = a * RAD,
    t12 = (a + b) * RAD;
  return [
    [-L1 * Math.sin(t1) - L2 * Math.sin(t12), -L2 * Math.sin(t12)],
    [L1 * Math.cos(t1) + L2 * Math.cos(t12), L2 * Math.cos(t12)],
  ];
};
(function assertMath() {
  const near = (x, y, tol, what) => {
    if (!(Math.abs(x - y) <= tol * Math.max(1, Math.abs(y))))
      throw new Error(`${what}: ${x} vs ${y}`);
  };
  let seed = 11;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  // 1. the analytic Jacobian is the derivative of the forward kinematics (central differences)
  for (let k = 0; k < 2000; k++) {
    const a = rnd() * 360 - 180,
      b = rnd() * 360 - 180,
      h = 1e-4;
    const J = jac(a, b);
    const fa = fk(a + h, b),
      fb = fk(a - h, b),
      ga = fk(a, b + h),
      gb = fk(a, b - h);
    for (let i = 0; i < 2; i++) {
      near(
        J[i][0],
        ((fa[i] - fb[i]) / (2 * h * RAD)) * 1,
        1e-6,
        "column 1 is the derivative with respect to theta1",
      );
      near(
        J[i][1],
        ((ga[i] - gb[i]) / (2 * h * RAD)) * 1,
        1e-6,
        "column 2 is the derivative with respect to theta2",
      );
    }
    // 2. det J = L1 L2 sin(theta2), and the area between the two column arrows is |det J|
    const det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    near(det, L1 * L2 * Math.sin(b * RAD), 1e-9, "det J = L1 L2 sin(theta2)");
  }
  // 3. the singular poses: theta2 = 0 (straight) and 180 (folded): the two arrows are parallel and det J = 0
  for (const b of [0, 180, -180]) {
    const J = jac(37, b);
    near(J[0][0] * J[1][1] - J[0][1] * J[1][0], 0, 1e-9, "det J = 0 at a singular pose");
    // the lost direction is along the arm: no column has a component along the line from the base to the tip
    const p = fk(37, b),
      n = Math.hypot(p[0], p[1]),
      u = [p[0] / n, p[1] / n];
    near(J[0][0] * u[0] + J[1][0] * u[1], 0, 1e-9, "column 1 has no radial component");
    near(J[0][1] * u[0] + J[1][1] * u[1], 0, 1e-9, "column 2 has no radial component");
  }
  // 4. near a singularity the joint speeds needed to move the tip outward blow up like 1 / sin(theta2)
  const need = (b) => {
    const J = jac(60, b),
      det = J[0][0] * J[1][1] - J[0][1] * J[1][0];
    const p = fk(60, b),
      n = Math.hypot(p[0], p[1]),
      v = [p[0] / n, p[1] / n]; // unit speed straight outward
    const x1 = (J[1][1] * v[0] - J[0][1] * v[1]) / det,
      x2 = (-J[1][0] * v[0] + J[0][0] * v[1]) / det;
    return Math.hypot(x1, x2);
  };
  const r = need(1) / need(10);
  if (!(r > 8 && r < 12))
    throw new Error("the joint speeds needed must grow like 1/sin(theta2): " + r);
  if (!(need(0.1) > 100 * need(60)))
    throw new Error("near the singularity the speeds must be huge");
  // 5. every pose of the animation keeps the tip and the elbow in the upper half plane (the HUD sits below the base)
  for (let t = 0; t <= 24.4; t += 0.02) {
    const [a, b] = monoEval(DK, t);
    const p = fk(a, b),
      e = [L1 * Math.cos(a * RAD), L1 * Math.sin(a * RAD)];
    if (!(p[1] > 0.25 && e[1] > 0.25))
      throw new Error(`the arm leaves the upper half plane at t = ${t}: ${p}`);
    if (Math.hypot(p[0], p[1]) > L1 + L2 + 1e-9) throw new Error("beyond the reach");
  }
  console.log(
    "maths ok: J equals the derivative of the forward kinematics (central differences, 2000 poses), det J = L1 L2 sin(theta2), " +
      "det J = 0 and no radial motion at theta2 = 0 or 180, the joint speeds needed grow like 1/sin(theta2) (x" +
      r.toFixed(1) +
      " from 10 to 1 degree), every animated pose stays in the upper half plane",
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
const rnd = mulberry32(20261125);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry (canvas pixels)
const PA = [90, 330, 900, 620]; // the 3D arena
const PL = [90, 960, 430, 300]; // velocity space
const PR = [540, 960, 450, 300]; // the joint-rate readout, then J
const VIEW = { cx: 540, cy: 586, F: 1560 };
const HUD = { xj: 110, wj: 400, xt: 530, wt: 440, y: 822, h: 118 };

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE JACOBIAN}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("WHY A ROBOT SOMETIMES FREEZES")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 780, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
const lab = (id, cx, cy, w, size, tex, op = 1, color = C.white, bg = false) =>
  box({
    id,
    cx,
    cy,
    w,
    h: 40,
    size,
    color,
    html: tx(tex),
    style:
      (op === 1 ? "" : `opacity:${op};`) +
      (bg ? "background:rgba(10,10,16,.9);border-radius:10px;" : ""),
  });
// labels that follow a point (3D or pixel) start at the view centre and are moved by anim.js
const follow = (id, w, size, tex, color, bg = true) =>
  lab(id, VIEW.cx, VIEW.cy, w, size, tex, 0, color, bg);
const labels = [
  follow("lth1", 70, 36, "\\theta_{1}", C.red),
  follow("lth2", 70, 36, "\\theta_{2}", C.purple),
  follow("la1", 70, 36, "a_{1}", C.red),
  follow("la2", 70, 36, "a_{2}", C.purple),
  follow("lv", 50, 36, "v", C.blue),
  follow("pa1", 70, 36, "a_{1}", C.red),
  follow("pa2", 70, 36, "a_{2}", C.purple),
  follow("pv", 50, 36, "v", C.blue),
  // the HUD under the arena
  lab("lHJ", HUD.xj + HUD.wj / 2, HUD.y + 22, 380, 24, it("JOINT SPACE: INPUT"), 1, C.blue),
  lab("lHt1", HUD.xj + 46, HUD.y + 60, 70, 36, "\\theta_{1}", 1, C.red),
  lab("lHt2", HUD.xj + 46, HUD.y + 98, 70, 36, "\\theta_{2}", 1, C.purple),
  lab("lHT", HUD.xt + HUD.wt / 2, HUD.y + 22, 420, 24, it("TASK SPACE: OUTPUT"), 1, C.purple),
  lab("lHX", HUD.xt + 60, HUD.y + 60, 60, 32, "X", 1, C.red),
  lab("lHY", HUD.xt + 205, HUD.y + 60, 60, 32, "Y", 1, C.purple),
  lab("lHV", HUD.xt + 350, HUD.y + 60, 60, 32, "|v|", 1, C.blue),
  // velocity space
  lab(
    "lVS",
    PL[0] + PL[2] / 2,
    PL[1] + 26,
    400,
    24,
    it("WHERE CAN THE HAND GO?"),
    1,
    C.blue,
  ).replace('style="', 'style="opacity:0;'),
  // the joint-rate readout (before J)
  lab("lRA", 765, 986, 420, 22, it("HOW FAST EACH JOINT TURNS"), 0, C.white),
  lab("lrt1", 640, 1030, 130, 28, it("JOINT 1"), 0, C.red),
  lab("lrt2", 640, 1100, 130, 28, it("JOINT 2"), 0, C.purple),
  lab("lrtv", 640, 1170, 130, 28, it("HAND"), 0, C.blue),
  lab("lRB", 765, 986, 420, 24, it("THE JACOBIAN"), 1, C.white),
  // J, its determinant and the speed meter
  lab("lJ", 605, 1060, 70, 50, "J=", 1, C.white),
  lab("ldet", 640, 1170, 150, 26, it("FREEDOM"), 1, C.white),
  lab("lsp", 660, 1232, 240, 24, it("MOTOR SPEED NEEDED"), 1, C.white),
  follow("lTg", 130, 28, it("TARGET"), C.white),
].join("");

// ------------------------------------------------------------------ counters, formulas, banners
const CY_CNT = 1305,
  CY_FM = 1390;
const mkC = (id, tex, color = C.blue, size = 50, hidden = true) =>
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
  mkC("c0", it("THE ARM IS STRAIGHT: IT IS STUCK"), C.blue, 46, false),
  mkC("c1", it("TURN A JOINT: THE HAND MOVES"), C.blue, 46),
  mkC("c2", it("JOINT 1 SWINGS THE HAND"), C.red, 48),
  mkC("c3", it("JOINT 2 SWINGS THE HAND"), C.purple, 48),
  mkC("c4", it("BOTH: ANY DIRECTION IN THE SHAPE"), C.blue, 44),
  mkC("c5", it("THE JACOBIAN = THE TWO ARROWS"), C.blue, 44),
  mkC("c6", it("STRAIGHTEN: THE SHAPE GETS FLAT"), C.blue, 44),
  mkC("c7", it("A FLAT SHAPE: A DIRECTION IS LOST"), C.blue, 42),
  mkC("c8", it("THE ROBOT FREEZES"), C.blue, 54),
  mkC("cfin", it("AVOID THE STRAIGHT ARM"), C.blue, 52),
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
  ["fm0", "\\det J=0", 46, false],
  ["f1", "v=J\\,\\omega", 50],
  ["f2", "\\omega_{1}>0,\\;\\omega_{2}=0", 46],
  ["f3", "\\omega_{1}=0,\\;\\omega_{2}>0", 46],
  ["f4", "v=\\omega_{1}\\,a_{1}+\\omega_{2}\\,a_{2}", 46],
  ["f5", "J=\\begin{bmatrix}a_{1}&a_{2}\\end{bmatrix}", 46],
  ["f6", "\\det J=L_{1}L_{2}\\sin\\theta_{2}", 46],
  ["f7", "\\theta_{2}=0\\;\\Rightarrow\\;\\det J=0", 46],
  ["f8", "\\omega=J^{-1}v\\;\\to\\;\\infty", 46],
  ["f9", it("A SINGULARITY IS A LOST DIRECTION"), 40],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("WHY DOES A ROBOT SOMETIMES FREEZE?"), it("THE JACOBIAN HAS THE ANSWER"), 1),
  bn("bn1", it("EACH JOINT MOVES THE HAND"), it("TWO JOINTS, ONE HAND"), 0),
  bn("bn2", it("TURN ONLY JOINT 1"), it("THE HAND FOLLOWS THE RED ARROW"), 0),
  bn("bn3", it("TURN ONLY JOINT 2"), it("THE HAND FOLLOWS THE PURPLE ARROW"), 0),
  bn("bn4", it("TURN BOTH JOINTS"), it("THE HAND CAN GO ANYWHERE IN THE SHAPE"), 0),
  bn("bn5", it("THE JACOBIAN"), it("THE TWO ARROWS, WRITTEN AS NUMBERS"), 0),
  bn("bn6", it("STRAIGHTEN THE ARM"), it("WATCH THE SHAPE GET FLATTER"), 0),
  bn("bn7", it("FULLY STRAIGHT: THE SHAPE IS A LINE"), it("THE HAND CAN ONLY MOVE SIDEWAYS"), 0),
  bn("bn8", it("THE TARGET IS FURTHER OUT"), it("THE ARM CANNOT GO ALONG ITSELF"), 0),
  bn("bnF", it("KEEP A BEND IN THE ELBOW"), it("SO THE SHAPE NEVER GOES FLAT"), 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("WHERE DOES YOUR ROBOT FREEZE?")), style: "opacity:0" })}
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
  JSON.stringify({ ...T, dur: DUR, DK, RANGE: [180, 180] }),
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
  PL,
  PR,
  VIEW,
  HUD,
  DK,
  L1,
  L2,
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
<title>The Jacobian</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="left:${PA[0]}px;top:${PA[1]}px;width:${PA[2]}px;height:${PA[3]}px"></div>
<div class="panel" style="left:${PL[0]}px;top:${PL[1]}px;width:${PL[2]}px;height:${PL[3]}px"></div>
<div class="panel" style="left:${PR[0]}px;top:${PR[1]}px;width:${PR[2]}px;height:${PR[3]}px"></div>
<div id="glow" style="position:absolute;left:90px;top:330px;width:900px;height:930px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:330px;width:900px;height:930px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
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
