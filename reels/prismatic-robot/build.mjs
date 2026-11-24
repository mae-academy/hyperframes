// THE PRISMATIC ROBOT, episode 1 of the series (24.4 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
// A robot whose three joints only slide. The page draws the robot in 3D from the joint values alone; the build asserts the maths:
// the pose of the tip is the product of three translation matrices, which is just the sum of the three slides (and the order does not matter).
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
  st: [2.4, 4.2, 6.0, 7.8, 9.8, 12.4, 15.2, 17.6], // banners
  sw: [2.6, 4.4, 6.2, 8.0, 10.0, 12.6, 15.4, 17.8], // counters (the snap)
  rows: [4.7, 6.5, 8.3], // the three relations X = d1, Y = d2, Z = d3 land in the panel
  vec: 10.3, // the column-vector equation
  mats: [12.9, 13.3, 13.7, 14.1, 14.5], // T1, T2, T3, the equals sign, the product
  rng: 15.6, // the range bars
  inv: 18.0, // the inverse is trivial
  lock: 19.8,
  banF: 20.6,
  card: 21.8,
  pulse: 23.4,
};
// joint travel, in units of 100 mm: the workspace is a box 600 x 400 x 250 mm
const RANGE = [6, 4, 2.5];
// the joint values (units of 100 mm) as keyframes [t, d1, d2, d3]; the page and the sound evaluate the same monotone cubic
const DK = [
  [0, 3, 1.5, 2],
  [1.6, 3, 1.5, 2],
  [2.4, 0, 0, 0],
  [4.4, 0, 0, 0],
  [5.7, 3, 0, 0],
  [6.2, 3, 0, 0],
  [7.4, 3, 1.5, 0],
  [8.0, 3, 1.5, 0],
  [9.2, 3, 1.5, 2],
  [12.6, 3, 1.5, 2],
  [13.8, 4.5, 3, 1],
  [14.2, 4.5, 3, 1],
  [15.2, 1.5, 0.5, 2.5],
  [15.5, 1.5, 0.5, 2.5],
  [16.0, 6, 0, 0],
  [16.5, 6, 4, 0],
  [17.0, 6, 4, 2.5],
  [17.6, 0, 4, 2.5],
  [19.0, 4.5, 3, 1],
  [40, 4.5, 3, 1],
];
const P0 = [300, 150, 200]; // mm, the pose in the hook and the pose the three stages build

// ------------------------------------------------------------------ maths first (asserted, the build fails otherwise)
(function assertMath() {
  const near = (a, b, tol, what) => {
    if (!(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))))
      throw new Error(`${what}: ${a} vs ${b}`);
  };
  const mul = (A, B) =>
    A.map((r, i) => B[0].map((_, j) => r.reduce((s, _v, k) => s + A[i][k] * B[k][j], 0)));
  const I4 = () => [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
  const tr = (ax, d) => {
    const M = I4();
    M[ax][3] = d;
    return M;
  };
  // 1. the tip pose is the product T1(d1) T2(d2) T3(d3); its position column is (d1, d2, d3) and its orientation never changes
  let seed = 7;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let k = 0; k < 2000; k++) {
    const d = RANGE.map((r) => rnd() * r * 100);
    const A = mul(mul(tr(0, d[0]), tr(1, d[1])), tr(2, d[2]));
    for (let i = 0; i < 3; i++) near(A[i][3], d[i], 1e-12, "the tip position is (d1, d2, d3)");
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        near(A[i][j], i === j ? 1 : 0, 1e-12, "the orientation is the identity");
    // 2. the order does not matter (translations commute): every one of the six orders gives the same matrix
    const B = mul(mul(tr(2, d[2]), tr(1, d[1])), tr(0, d[0]));
    const C2 = mul(mul(tr(1, d[1]), tr(0, d[0])), tr(2, d[2]));
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        near(A[i][j], B[i][j], 1e-12, "T1 T2 T3 = T3 T2 T1");
        near(A[i][j], C2[i][j], 1e-12, "T1 T2 T3 = T2 T1 T3");
      }
    // 3. the inverse kinematics is the identity: the joint values are the coordinates
    for (let i = 0; i < 3; i++) near(A[i][3], d[i], 1e-12, "d = P");
  }
  // 4. the numbers on the page
  const A0 = mul(mul(tr(0, P0[0]), tr(1, P0[1])), tr(2, P0[2]));
  if (A0[0][3] !== 300 || A0[1][3] !== 150 || A0[2][3] !== 200) throw new Error("the example pose");
  // 5. the keyframes stay inside the workspace box
  for (const k of DK)
    for (let i = 0; i < 3; i++)
      if (k[i + 1] < 0 || k[i + 1] > RANGE[i]) throw new Error("a key leaves the workspace: " + k);
  if (RANGE[0] * 100 * RANGE[1] * 100 * RANGE[2] * 100 !== 600 * 400 * 250)
    throw new Error("box volume");
  console.log(
    "maths ok: T1(300) T2(150) T3(200) = translation by (300, 150, 200) mm, the orientation stays the identity, every order of the three " +
      "slides gives the same matrix, d = P (no inverse problem); workspace = a box 600 x 400 x 250 mm",
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
const rnd = mulberry32(20261124);
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const HANDLE = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="margin-right:14px;flex:none"><rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.2" fill="#fff"/></svg>`;

// ------------------------------------------------------------------ geometry (canvas pixels)
const PA = [90, 330, 900, 620]; // the 3D arena
const PB = [90, 970, 900, 280]; // the relations, the matrices, the ranges
const VIEW = { cx: 395, cy: 625, F: 1250 };
const HUD = { x: 650, yi: 352, hi: 160, yo: 524, ho: 116, w: 310 };

// ------------------------------------------------------------------ header and labels
const header = `
<div id="flash0"></div>
${box({ id: "h-title", cx: 540, cy: 180, w: 1020, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE PRISMATIC ROBOT}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 236, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("EP 1: A ROBOT THAT ONLY SLIDES")) })}
<div id="h-rule" style="position:absolute;left:480px;top:274px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>
${box({ id: "wm", cx: 540, cy: 780, w: 1000, h: 160, size: 130, color: "rgba(255,0,68,.12)", html: tx(it("@MAE.Academy")), cls: "wm" }).replace('class="t wm"', 'class="t wm" data-layout-ignore')}`;
// labels that follow 3D points are created at the view centre and moved by anim.js (translate); the HUD labels have a fixed place
const lab = (id, cx, cy, w, size, tex, op = 1, color = C.white) =>
  box({ id, cx, cy, w, h: 38, size, color, html: tx(tex), style: op === 1 ? "" : `opacity:${op}` });
const follow = (id, w, size, tex, color, bg = false) =>
  box({
    id,
    cx: VIEW.cx,
    cy: VIEW.cy,
    w,
    h: 38,
    size,
    color,
    html: tx(tex),
    style: "opacity:0;" + (bg ? "background:rgba(10,10,16,.9);border-radius:10px;" : ""),
  });
const labels = [
  follow("lX", 40, 32, "X", C.red),
  follow("lY", 40, 32, "Y", C.purple),
  follow("lZ", 40, 32, "Z", C.blue),
  follow("ld1", 70, 36, "d_{1}", C.red, true),
  follow("ld2", 70, 36, "d_{2}", C.purple, true),
  follow("ld3", 70, 36, "d_{3}", C.blue, true),
  follow("lP", 60, 34, "P", C.white),
  follow("lPs", 60, 34, "P^{*}", C.white),
  follow("lbox", 330, 28, "600\\times400\\times250\\,\\textit{mm}", C.white),
  // the HUD
  lab("lHJ", HUD.x + HUD.w / 2, HUD.yi + 22, 290, 24, it("JOINT SPACE: INPUT"), 1, C.blue),
  lab("lHd1", HUD.x + 42, HUD.yi + 64, 70, 36, "d_{1}", 1, C.red),
  lab("lHd2", HUD.x + 42, HUD.yi + 104, 70, 36, "d_{2}", 1, C.purple),
  lab("lHd3", HUD.x + 42, HUD.yi + 144, 70, 36, "d_{3}", 1, C.blue),
  lab("lHT", HUD.x + HUD.w / 2, HUD.yo + 22, 290, 24, it("TASK SPACE: OUTPUT"), 1, C.purple),
  lab("lHX", HUD.x + 52, HUD.yo + 56, 50, 30, "X", 1, C.red),
  lab("lHY", HUD.x + 155, HUD.yo + 56, 50, 30, "Y", 1, C.purple),
  lab("lHZ", HUD.x + 258, HUD.yo + 56, 50, 30, "Z", 1, C.blue),
].join("");

// ------------------------------------------------------------------ the lower panel: groups that swap
const cx0 = 540;
const grp = (id, inner, op = 0) =>
  `<div id="${id}" class="grp" style="opacity:${op}">${inner}</div>`;
const cell = (id, cx, cy, w, size, tex, color, op = 0) =>
  box({
    id,
    cx,
    cy,
    w,
    h: Math.round(size * 1.5),
    size,
    color,
    html: tx(tex),
    style: `opacity:${op}`,
  });
const mmTxt = (s) => `${s}\\,\\textit{mm}`;
const rows = [
  cell("tX", cx0, 1030, 700, 46, `X=d_{1}=${mmTxt(P0[0])}`, C.red),
  cell("tY", cx0, 1105, 700, 46, `Y=d_{2}=${mmTxt(P0[1])}`, C.purple),
  cell("tZ", cx0, 1180, 700, 46, `Z=d_{3}=${mmTxt(P0[2])}`, C.blue),
].join("");
const col3 = (a, b, c) => `\\begin{bmatrix}${a}\\\\${b}\\\\${c}\\end{bmatrix}`;
const colored = (c, s) => `{\\color{${c}}${s}}`;
const vecEq =
  col3(colored(C.red, "X"), colored(C.purple, "Y"), colored(C.blue, "Z")) +
  "=" +
  col3(colored(C.red, "d_{1}"), colored(C.purple, "d_{2}"), colored(C.blue, "d_{3}")) +
  "=" +
  col3(colored(C.red, P0[0]), colored(C.purple, P0[1]), colored(C.blue, P0[2]));
const vec = box({
  id: "tV",
  cx: cx0,
  cy: 1110,
  w: 860,
  h: 180,
  size: 44,
  color: C.white,
  html: tx(vecEq),
});
// the four-by-four matrices: one translation per slide
const mat4 = (ax, d, col) => {
  const rowsT = [0, 1, 2, 3].map((i) =>
    [0, 1, 2, 3]
      .map((j) =>
        j === 3 && i === ax ? colored(col, d) : j === 3 && i === 3 ? "1" : i === j ? "1" : "0",
      )
      .join("&"),
  );
  return `\\begin{bmatrix}${rowsT.join("\\\\")}\\end{bmatrix}`;
};
const matPos = { T1: 200, d1: 308, T2: 416, d2: 524, T3: 632, eq: 742, T: 852 };
const MY = 1125;
const mats = [
  cell("mT1", matPos.T1, MY, 190, 24, mat4(0, P0[0], C.red), C.white),
  cell("mD1", matPos.d1, MY, 30, 40, "\\cdot", C.white),
  cell("mT2", matPos.T2, MY, 190, 24, mat4(1, P0[1], C.purple), C.white),
  cell("mD2", matPos.d2, MY, 30, 40, "\\cdot", C.white),
  cell("mT3", matPos.T3, MY, 190, 24, mat4(2, P0[2], C.blue), C.white),
  cell("mEq", matPos.eq, MY, 50, 44, "=", C.white),
  cell(
    "mT",
    matPos.T,
    MY,
    190,
    24,
    `\\begin{bmatrix}1&0&0&${colored(C.red, P0[0])}\\\\0&1&0&${colored(C.purple, P0[1])}\\\\0&0&1&${colored(C.blue, P0[2])}\\\\0&0&0&1\\end{bmatrix}`,
    C.white,
  ),
].join("");
const mCap = [
  cell("mC1", matPos.T1, 1030, 200, 30, "T_{1}", C.red),
  cell("mC2", matPos.T2, 1030, 200, 30, "T_{2}", C.purple),
  cell("mC3", matPos.T3, 1030, 200, 30, "T_{3}", C.blue),
].join("");
const rangeRows = [
  cell("rg1", 300, 1040, 400, 36, "0\\le d_{1}\\le600", C.red, 1),
  cell("rg2", 300, 1110, 400, 36, "0\\le d_{2}\\le400", C.purple, 1),
  cell("rg3", 300, 1180, 400, 36, "0\\le d_{3}\\le250", C.blue, 1),
].join("");
const invBlock = [
  cell("iP", cx0, 1050, 860, 44, `P^{*}=(450,\\,300,\\,100)`, C.blue, 1),
  cell("iA", cx0, 1118, 100, 44, "\\Downarrow", C.white, 1),
  cell("iD", cx0, 1190, 860, 46, `d=P^{*}=(450,\\,300,\\,100)`, C.red, 1),
].join("");
const lowerPanel = [
  grp("g1", rows),
  grp("g2", vec),
  grp("g3", mats + mCap),
  grp("g4", rangeRows),
  grp("g5", invBlock),
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
  mkC("c0", "P=(300,\\,150,\\,200)\\,\\textit{mm}", C.blue, 52, false),
  mkC("c1", "(d_{1},\\,d_{2},\\,d_{3})\\;\\Rightarrow\\;(X,\\,Y,\\,Z)", C.blue, 50),
  mkC("c2", `X=d_{1}=${mmTxt(300)}`, C.red, 52),
  mkC("c3", `Y=d_{2}=${mmTxt(150)}`, C.purple, 52),
  mkC("c4", `Z=d_{3}=${mmTxt(200)}`, C.blue, 52),
  mkC("c5", "P=(d_{1},\\,d_{2},\\,d_{3})", C.blue, 52),
  mkC("c6", "T=T_{1}\\,T_{2}\\,T_{3}", C.blue, 52),
  mkC("c7", it("THE WORKSPACE IS A BOX"), C.blue, 48),
  mkC("c8", "d=P", C.blue, 60),
  mkC("cfin", it("TO SLIDE IS TO ADD"), C.blue, 52),
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
  ["fm0", `d=(300,\\,150,\\,200)\\;\\Rightarrow\\;P=d`, 44, false],
  ["f1", it("JOINT VALUES IN, TIP POSITION OUT"), 38],
  ["f2", it("JOINT 1 MOVES THE WHOLE ROBOT ALONG X"), 34],
  ["f3", it("JOINT 2 EXTENDS THE ARM ALONG Y"), 36],
  ["f4", it("JOINT 3 RAISES THE GRIPPER ALONG Z"), 36],
  ["f5", it("THREE SLIDES ADD UP TO ONE POINT"), 38],
  ["f6", "T_{1}T_{2}T_{3}=T_{3}T_{2}T_{1}\\;\\;" + it("ORDER DOES NOT MATTER"), 34],
  ["f7", it("EVERY REACHABLE POINT FITS IN THE BOX"), 36],
  ["f8", it("NO TRIGONOMETRY, NO SOLVING"), 40],
  ["f9", it("A SLIDE IS AN ADDITION"), 46],
];
const formulas = FORM.map(([id, t, s, hid]) => mkF(id, t, s, hid === undefined ? true : hid)).join(
  "",
);

const BN = { x: 130, y: 1450, w: 820, h: 96 };
const bn = (id, l1, l2, op) =>
  `<div id="${id}" class="ba" style="opacity:${op}"><div class="l1">${tx(l1)}</div><div class="l2">${tx(l2)}</div></div>`;
const banners = [
  bn("bn0", it("A ROBOT WHOSE JOINTS ONLY SLIDE"), it("THE PRISMATIC ROBOT"), 1),
  bn("bn1", it("THREE SLIDING JOINTS"), it("EACH MOVES ALONG A STRAIGHT LINE"), 0),
  bn("bn2", it("JOINT 1 SLIDES ALONG X"), "X=d_{1}", 0),
  bn("bn3", it("JOINT 2 SLIDES ALONG Y"), "Y=d_{2}", 0),
  bn("bn4", it("JOINT 3 SLIDES ALONG Z"), "Z=d_{3}", 0),
  bn("bn5", it("THE TIP IS THE THREE SLIDES ADDED"), "P=(d_{1},\\,d_{2},\\,d_{3})", 0),
  bn("bn6", it("EACH SLIDE IS ONE MATRIX"), it("MULTIPLY THEM TO COMBINE THEM"), 0),
  bn("bn7", it("THE REACHABLE SPACE IS A BOX"), it("EVERY JOINT HAS ITS OWN RANGE"), 0),
  bn("bn8", it("INVERSE KINEMATICS"), it("THE EASIEST CASE: d = P"), 0),
  bn("bnF", it("TO SLIDE IS TO ADD"), "T=T_{1}T_{2}T_{3}", 0),
].join("\n");
const banner = `<div id="banner">${banners}</div>`;

const CARD = { x: 90, y: 1430, w: 900, h: 230 };
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px;opacity:0">
  <div id="ctaglow" style="position:absolute;left:100px;top:80px;width:700px;height:110px;border-radius:55px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  <div id="ct1" class="t" style="left:0;top:12px;width:900px;height:60px;font-size:42px;color:${C.red};opacity:0">${tx(it("SAVE THIS"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2", cx: 450, cy: 100, w: 880, h: 52, size: 35, color: C.blue, html: tx(it("NEXT: THE ROBOT THAT ROTATES")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 450, cy: 150, w: 880, h: 44, size: 32, color: C.blue, html: tx(it("FOLLOW FOR EP 2 ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:0;top:180px;width:900px;height:44px;font-size:30px;color:rgba(255,255,255,.7);opacity:0">${HANDLE(30)}${tx(it("@MAE.ACADEMY"))}</div>
</div>`;

// ------------------------------------------------------------------ guards
const allHtml = [header, labels, lowerPanel, counters, formulas, banner, card].join("");
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
  JSON.stringify({ ...T, dur: DUR, DK, RANGE }),
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
.grp{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
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
  VIEW,
  HUD,
  DK,
  RANGE,
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
<title>The Prismatic Robot</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
<div class="panel" style="left:${PA[0]}px;top:${PA[1]}px;width:${PA[2]}px;height:${PA[3]}px"></div>
<div class="panel" style="left:${PB[0]}px;top:${PB[1]}px;width:${PB[2]}px;height:${PB[3]}px"></div>
<div id="glow" style="position:absolute;left:90px;top:330px;width:900px;height:920px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(176,38,255,.35),transparent 70%);opacity:0"></div>
<div id="rw" style="position:absolute;left:90px;top:330px;width:900px;height:920px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(255,0,68,.30),transparent 75%);opacity:0"></div>
<canvas id="cv" data-layout-allow-overflow data-layout-ignore></canvas>
${labels}
${lowerPanel}
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
