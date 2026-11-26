/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R,
  ang = D.ang;
const S = K.scene("s4", { cam: { a: 0, e: 90, d: 9, tx: 0, ty: 0, tz: 0, cx: 560, cy: 520 } });
const st = S.st,
  tl = S.tl,
  o0 = V(0, 0, 0),
  R = 1.6;
S.seam();
const fl = st.floor({ n: 4, op: 0 });
const GC = { op: 1 },
  kc = () => GC.op; // circle phase group
const G3 = { op: 0 },
  k3 = () => G3.op; // gimbal phase group
const X = V(1, 0, 0),
  Y = V(0, 1, 0);
const ring = st.ring(o0, X, Y, R, 0, 360, 96);
st.path(ring, { c: C.navy, w: 6, k: kc });
st.seg(V(-2.1, 0, 0), V(2.1, 0, 0), { c: C.navy, w: 5, head: true, k: kc });
st.seg(V(0, -2.1, 0), V(0, 2.1, 0), { c: C.navy, w: 5, head: true, k: kc });
st.label(V(2.1, 0, 0), "x", { c: C.navy, px: 40, dx: 22, dy: -4, k: kc });
st.label(V(0, 2.1, 0), "y", { c: C.navy, px: 40, dx: 4, dy: -28, k: kc });
const qc = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ],
  qn = ["\\mathrm{I}", "\\mathrm{II}", "\\mathrm{III}", "\\mathrm{IV}"];
qc.forEach(([x, y], i) => st.label(V(x * 0.8, y * 0.8, 0), qn[i], { c: C.ink2, px: 44, k: kc }));
const sector = (q, col, gk) =>
  st.path(ring2(q * 90, q * 90 + 90), { c: col, w: 3, fill: col, fillOp: 0.3, k: gk });
function ring2(a0, a1) {
  const r = st.ring(o0, X, Y, R, a0, a1, 24);
  return () => [o0, ...r(), o0];
}
const shade = [0, 1, 2, 3].map(() => ({ op: 0 }));
const sh = [0, 1, 2, 3].map((q) => sector(q, C.red, () => kc() * shade[q].op));
// warning icons anchored on quadrants
const wpos = [V(1.15, 0.5, 0), V(-1.15, 0.5, 0), V(-1.15, -0.5, 0), V(1.15, -0.5, 0)];
const wico = (q) => {
  const e = K.el("div", "", "width:70px;height:70px;margin:-35px 0 0 -35px;", S.layer);
  e.innerHTML =
    '<svg viewBox="0 0 64 64" width="70" height="70"><path d="M32 6 L61 56 H3 Z" fill="#E5173F" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><rect x="29" y="22" width="6" height="19" rx="3" fill="#fff"/><circle cx="32" cy="48" r="4" fill="#fff"/></svg>';
  S.anchor(e, wpos[q], 0, 0);
  tl.fromTo(e, { opacity: 0, scale: 0.6 }, { opacity: 0, scale: 0.6, duration: 0.01 }, 0);
  return e;
};
const wi = [0, 1, 2, 3].map(wico);
// atan2 beam + sweep
const bm = { a: 0 };
const sweep = st.path(
  () => {
    const r = st.ring(o0, X, Y, R, 0, Math.max(0.01, bm.a), 90)();
    return [o0, ...r, o0];
  },
  { c: C.teal, w: 2, fill: C.teal, fillOp: 0.28, k: () => kc() * Math.min(1, bm.a / 3) },
);
const tip = () => V(R * Math.cos(bm.a * D2R), R * Math.sin(bm.a * D2R), 0);
st.seg(o0, tip, { c: C.teal, w: 9, head: true, k: () => kc() * Math.min(1, bm.a / 3) });
st.dot(tip, { r: 14, c: C.teal, k: () => kc() * Math.min(1, bm.a / 3) });
// panel: Table 2.3.1
const pn = S.panel(1100, 150, 724, 700, C.teal);
tl.fromTo(pn, { opacity: 1 }, { opacity: 1, duration: 0.01 }, 0);
const rowsT = [
  ["\\sin^{-1}", "-90^\\circ\\ldots90^\\circ", "\\mathrm{I},\\ \\mathrm{IV}", C.navy],
  ["\\tan^{-1}", "-90^\\circ\\ldots90^\\circ", "\\mathrm{I},\\ \\mathrm{IV}", C.navy],
  ["\\cos^{-1}", "0^\\circ\\ldots180^\\circ", "\\mathrm{I},\\ \\mathrm{II}", C.navy],
  ["\\mathrm{atan2}", "-180^\\circ\\ldots180^\\circ", "\\mathrm{I}\\!-\\!\\mathrm{IV}", C.green],
];
const tbl = K.el("div", "", "position:absolute;inset:0;", pn);
const trs = rowsT.map((r, i) => {
  const d = K.el(
    "div",
    "",
    `position:absolute;left:30px;right:30px;top:${50 + i * 150}px;height:120px;border-radius:20px;border:5px solid ${i === 3 ? C.green : "rgba(11,31,58,.14)"};display:flex;align-items:center;justify-content:space-between;padding:0 30px;direction:ltr;`,
    tbl,
  );
  const a = K.el("div", "", "width:170px;", d);
  a.appendChild(K.tex(r[0], 48, r[3]));
  const b = K.el("div", "", "flex:1;text-align:center;", d);
  b.appendChild(K.tex(r[1], 36, C.navy));
  const c = K.el("div", "", "width:150px;text-align:right;", d);
  c.appendChild(K.tex(r[2], 36, i === 3 ? C.green : C.red));
  tl.fromTo(d, { opacity: 0, y: 30 }, { opacity: 0, y: 30, duration: 0.01 }, 0);
  return d;
});
const rowAt = [0.15, 0.15, 3.6, 6.3];
trs.forEach((d, i) => {
  tl.to(d, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, rowAt[i]);
  S.sfx("pop", rowAt[i], 0.7);
});
const tg = (txt, c, x, y) => {
  const e = K.el("div", "tag", `--c:${c};left:${x}px;top:${y}px;`, S.layer);
  e.appendChild(K.tex(txt, 44, C.navy));
  tl.fromTo(e, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
  return e;
};
const t1 = tg(
  "\\sin^{-1},\\ \\tan^{-1}\\ \\Rightarrow\\ \\mathrm{II},\\mathrm{III}\\ \\times",
  C.red,
  1130,
  690,
);
const t2 = tg("\\cos^{-1}\\ \\Rightarrow\\ \\mathrm{III},\\mathrm{IV}\\ \\times", C.red, 1130, 690);
const show = (e, a, b) => {
  tl.to(e, { opacity: 1, duration: 0.25, ease: "power4.out" }, a);
  tl.to(e, { opacity: 0, duration: 0.25, ease: "none" }, b);
};
const quad = (qs, a, b) => {
  qs.forEach((q) => {
    tl.to(shade[q], { op: 1, duration: 0.35, ease: "none" }, a);
    tl.to(shade[q], { op: 0, duration: 0.3, ease: "none" }, b);
    tl.to(wi[q], { opacity: 1, scale: 1, duration: 0.3, ease: "power4.out" }, a);
    tl.to(wi[q], { opacity: 0, duration: 0.3, ease: "none" }, b);
  });
};
quad([1, 2], 1.0, 3.3);
show(t1, 1.0, 3.3);
S.sfx("pop", 1.0, 0.8);
quad([2, 3], 3.6, 5.9);
show(t2, 3.6, 5.9);
S.sfx("pop", 3.6, 0.8);
// radar sweep
const cnt = K.el(
  "div",
  "cnt",
  `left:96px;top:160px;color:${C.teal};border-color:${C.teal};font-size:52px;`,
  S.layer,
);
cnt.innerHTML =
  '<span style="font-size:38px">atan2(y,x) =</span><span class="v">0</span><span>&deg;</span>';
tl.fromTo(cnt, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(cnt, { opacity: 1, duration: 0.25 }, 6.3);
tl.to(cnt, { opacity: 0, duration: 0.3 }, 10.2);
tl.fromTo(bm, { a: 0 }, { a: 359.9, duration: 3.0, ease: "power1.inOut" }, 6.5);
S.sfx("servo", 6.5, 0.5, 3.0);
S.counter(cnt.querySelector(".v"), 0, 360, 6.5, 9.5, (v) => String(Math.round(v)), "power1.inOut");
S.check(480, 170, 9.8, { out: 10.3 });
tl.to(GC, { op: 0, duration: 0.5, ease: "none" }, 10.2);
tl.to(tbl, { opacity: 0, duration: 0.4, ease: "none" }, 10.2);
S.card(0.2, 20.9, "6", "ليش atan2؟", C.teal);

// ================= gimbal lock =================
S.cam({ a: 38, e: 18, d: 10, tx: 0.4, ty: 0.3, tz: 0.4 }, 9.8, 2.4);
tl.to(fl, { op: 1, duration: 0.8, ease: "none" }, 10.4);
const L = 1.8,
  be = { v: ang.beta };
tl.fromTo(G3, { op: 0 }, { op: 1, duration: 0.5, ease: "none" }, 10.6);
const Rb = () => M.mul(M.mul(M.z(ang.alpha * D2R), M.y(be.v * D2R)), M.x(ang.gamma * D2R));
const lockG = { op: 0 };
st.seg(o0, V(0, 0, L), { c: C.gold, w: 24, k: () => lockG.op * 0.7 });
const A = st.frame({
  o: o0,
  R: M.I(),
  len: L,
  cols: [C.navy, C.navy, C.red],
  names: ["X_A", "Y_A", "Z_A"],
  w: 7,
  dx: [40, 40, 36],
  dy: [-22, 8, -8],
});
const B = st.frame({
  o: o0,
  R: Rb,
  len: L,
  cols: [C.blue, C.blue, C.red],
  names: ["X_B", "Y_B", "Z_B"],
  w: 7,
  dx: [-46, 46, 62],
  dy: [20, 8, 24],
});
A.k = k3;
B.k = k3;
const g3 = [...A.parts, ...B.parts];
g3.forEach((p) => {
  const k0 = p.o.k;
  p.o.k = () => k0() * k3();
});
const bcnt = K.el("div", "cnt", "left:96px;top:160px;", S.layer);
bcnt.innerHTML = '<span>&beta;</span><span>=</span><span class="v">35</span><span>&deg;</span>';
tl.fromTo(bcnt, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(bcnt, { opacity: 1, duration: 0.25 }, 11.8);
tl.to(bcnt, { opacity: 0, duration: 0.3 }, 20.9);
tl.fromTo(be, { v: ang.beta }, { v: 90, duration: 2.0, ease: "power2.inOut" }, 12.2);
S.sfx("servo", 12.2, 0.5, 2.0);
S.counter(
  bcnt.querySelector(".v"),
  ang.beta,
  90,
  12.2,
  14.2,
  (v) => String(Math.round(v)),
  "power2.inOut",
);
tl.to(lockG, { op: 1, duration: 0.3, ease: "none" }, 14.4);
S.sfx("click", 14.4, 0.9);
const lk = K.el("div", "tag", `--c:${C.gold};left:96px;top:250px;`, S.layer);
lk.appendChild(K.tex("X_B=-Z_A", 46, C.navy));
tl.fromTo(lk, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(lk, { opacity: 1, duration: 0.3, ease: "power4.out" }, 14.5);
// ---- panel 2: formulas -> division by zero -> reduced matrix -> assume alpha = 0 ----
const p2 = K.el("div", "", "position:absolute;inset:0;", pn);
tl.fromTo(p2, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(p2, { opacity: 1, duration: 0.4 }, 10.8);
const fr = [
  ["\\beta=\\mathrm{atan2}\\!\\left(-r_{31},\\sqrt{r_{11}^2+r_{21}^2}\\right)", C.navy],
  [
    "\\alpha=\\mathrm{atan2}\\!\\left(\\frac{r_{21}}{\\cos\\beta},\\frac{r_{11}}{\\cos\\beta}\\right)",
    C.navy,
  ],
  [
    "\\gamma=\\mathrm{atan2}\\!\\left(\\frac{r_{32}}{\\cos\\beta},\\frac{r_{33}}{\\cos\\beta}\\right)",
    C.navy,
  ],
];
const frD = fr.map(([t, c], i) => {
  const d = K.el("div", "", `position:absolute;left:30px;top:${40 + i * 140}px;`, p2);
  d.appendChild(K.tex(t, 40, c));
  return d;
});
frD.forEach((d, i) => S.pop(d, 11.0 + i * 0.4, null, { dy: 18, sfx: "tick", vol: 0.6 }));
const dz = K.el("div", "tag", `--c:${C.red};left:30px;top:470px;font-size:44px;`, p2);
dz.appendChild(K.tex("\\cos 90^\\circ=0", 44, C.red));
const dz2 = K.el("span", "", "margin-left:16px;direction:rtl;color:#E5173F;", dz);
dz2.textContent = "قسمة على صفر!";
tl.fromTo(dz, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(dz, { opacity: 1, duration: 0.3, ease: "power4.out" }, 14.6);
S.sfx("click", 14.6, 0.9);
const strikes = [1, 2].map((i) => {
  const s = K.el(
    "div",
    "",
    `position:absolute;left:24px;top:${40 + i * 140 + 62}px;width:0px;height:7px;background:${C.red};border-radius:4px;transform:rotate(-4deg);transform-origin:left center;`,
    p2,
  );
  return s;
});
strikes.forEach((s, i) =>
  tl.to(s, { width: 640, duration: 0.35, ease: "power3.out" }, 14.7 + i * 0.12),
);
// reduced matrix
const p3 = K.el("div", "", "position:absolute;inset:0;", pn);
tl.fromTo(p3, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(p2, { opacity: 0, duration: 0.3, ease: "none" }, 15.8);
tl.to(p3, { opacity: 1, duration: 0.35, ease: "none" }, 15.9);
const th = "(\\alpha-\\gamma)";
const m1 = K.mx(
  [
    ["0", "-\\sin" + th, "\\cos" + th],
    ["0", "\\cos" + th, "\\sin" + th],
    ["-1", "0", "0"],
  ],
  { px: 34, cw: 190, rh: 70, c: C.purple },
);
const hd3 = K.el("div", "", "position:absolute;left:30px;top:30px;", p3);
hd3.appendChild(K.tex("\\beta=90^\\circ\\ \\Rightarrow", 44, C.navy));
const m1w = K.el("div", "", "position:absolute;left:20px;top:120px;", p3);
m1w.appendChild(m1.el);
const m2 = K.mx(
  [
    ["0", "\\sin\\gamma", "\\cos\\gamma"],
    ["0", "\\cos\\gamma", "-\\sin\\gamma"],
    ["-1", "0", "0"],
  ],
  { px: 34, cw: 190, rh: 70, c: C.purple },
);
const m2w = K.el("div", "", "position:absolute;left:20px;top:120px;", p3);
m2w.appendChild(m2.el);
tl.fromTo(m2w, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
[
  [0, 1],
  [0, 2],
  [1, 1],
  [1, 2],
].forEach(([i, j], q) => S.glow(m1.cells[i][j], 16.2 + q * 0.04, 17.2));
const eq1 = K.el("div", "", "position:absolute;left:30px;top:380px;", p3);
eq1.appendChild(K.tex("\\alpha-\\gamma=\\mathrm{atan2}(r_{23},r_{22})", 44, C.navy));
tl.fromTo(eq1, { opacity: 0, y: 24 }, { opacity: 0, y: 24, duration: 0.01 }, 0);
tl.to(eq1, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, 17.3);
S.sfx("pop", 17.3, 0.8);
const as = K.el("div", "tag", `--c:${C.gold};left:30px;top:480px;font-size:44px;`, p3);
as.appendChild(K.tex("\\text{Assume }\\alpha=0^\\circ", 44, C.navy));
tl.fromTo(as, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(as, { opacity: 1, duration: 0.3, ease: "power4.out" }, 18.5);
S.sfx("pop", 18.5, 0.8);
tl.to(m1w, { opacity: 0, duration: 0.3, ease: "none" }, 18.7);
tl.to(m2w, { opacity: 1, duration: 0.3, ease: "none" }, 18.8);
[
  [0, 1],
  [1, 1],
].forEach(([i, j], q) => S.glow(m2.cells[i][j], 19.1 + q * 0.04, 20.0));
const fg = K.el("div", "", "position:absolute;left:30px;top:620px;", p3);
fg.appendChild(K.tex("\\gamma=\\mathrm{atan2}(r_{12},r_{22})", 50, C.green));
tl.fromTo(fg, { opacity: 0, y: 24 }, { opacity: 0, y: 24, duration: 0.01 }, 0);
tl.to(fg, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, 19.5);
S.sfx("click", 19.5, 0.9);
S.check(1740, 585, 19.9);

S.cap(0.3, 2.9, [{ m: "\\sin^{-1}" }, "و", { m: "\\tan^{-1}" }, "بيفقدوا", "ربعين"]);
S.cap(3.6, 5.9, [{ m: "\\cos^{-1}" }, "كمان", "بيفقد", "ربعين"]);
S.cap(6.3, 9.9, [{ m: "\\mathrm{atan2}" }, "بيغطي", "الـ", "360°", "كلها"]);
S.cap(10.9, 14.2, ["لما", { m: "\\beta" }, "توصل", { m: "90^\\circ" }]);
S.cap(14.5, 17.1, ["محور", { m: "X_B" }, "على", { m: "Z_A" }, "= درجة", "حرية", "ضاعت"]);
S.cap(17.3, 18.4, ["بقت", "زاوية", "وحدة"]);
S.cap(18.6, 20.8, ["نفترض", { m: "\\alpha=0^\\circ" }, "ونحل", { m: "\\gamma" }]);
S.finish();
