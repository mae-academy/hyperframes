/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R;
const S = K.scene("s7", {
  cam: { a: 30, e: 28, d: 10.5, tx: 1.2, ty: 0.5, tz: 0.4, cx: 480, cy: 520 },
});
const st = S.st,
  tl = S.tl,
  o0 = V(0, 0, 0);
S.seam();
const fl = st.floor({ n: 4 });
const G1 = { op: 1 },
  G2 = { op: 0 };
const g1 = () => G1.op,
  g2 = () => G2.op;
// ---------- compound: {A} -> {B} -> {C} ----------
const Bo = V(1.6, 0.5, 0.2),
  RB = M.z(0.5),
  Co = add(Bo, M.mv(RB, V(1.3, 0.9, 0.3))),
  RC = M.mul(RB, M.y(0.45));
const fr = (o, R, cols, names, t0, lab) => {
  const F = st.frame({ o, R, len: 1.0, cols, names, w: 6, px: 30, dy: [-26, -26, -26] });
  F.k = g1;
  return F;
};
const FA = fr(o0, M.I(), [C.navy, C.navy, C.red], ["X_A", "Y_A", "Z_A"]);
const FB = fr(Bo, RB, [C.blue, C.blue, C.red], ["X_B", "Y_B", "Z_B"]);
const FC = fr(Co, RC, [C.teal, C.teal, C.red], ["X_C", "Y_C", "Z_C"]);
const prog = [{ v: 0 }, { v: 0 }, { v: 0 }];
const lnk = (a, b, i, t, c) => {
  const s = st.seg(a, b, { c, w: 8, head: true, k: g1 });
  s.prog = 0;
  tl.to(s, { prog: 1, duration: 0.5, ease: "power3.out" }, t);
  return s;
};
lnk(o0, Bo, 0, 0.9, C.green);
lnk(Bo, Co, 1, 1.5, C.green);
st.label(o0, "\\{A\\}", { c: C.navy, px: 40, dx: -44, dy: 30, k: g1 });
st.label(Bo, "\\{B\\}", { c: C.blue, px: 40, dx: -48, dy: 30, k: g1 });
st.label(Co, "\\{C\\}", { c: C.teal, px: 40, dx: 20, dy: 60, k: g1 });
st.label(() => mul(Bo, 0.5), "{}^{A}_{B}T", { c: C.navy, px: 38, dx: 0, dy: 76, k: g1 });
st.label(() => add(Bo, mul(sub(Co, Bo), 0.5)), "{}^{B}_{C}T", {
  c: C.navy,
  px: 38,
  dx: 70,
  dy: 70,
  k: g1,
});
[FA, FB, FC].forEach((F, i) => {
  F.parts.forEach((p) =>
    tl.fromTo(p, { op: 0 }, { op: 1, duration: 0.3, ease: "none" }, 0.3 + i * 0.6),
  );
  S.sfx("pop", 0.3 + i * 0.6, 0.7);
});
// ---------- loop: five frames {U,A,B,C,D} ----------
const N = {
  U: V(-1.9, 0, 0),
  A: V(-0.9, 1.6, 0.3),
  D: V(2.0, 1.0, 0.5),
  C: V(1.4, -1.3, 0.2),
  B: V(-0.8, -1.5, 0.2),
};
const nodeCol = { U: C.navy, A: C.blue, B: C.purple, C: C.teal, D: C.orange };
Object.keys(N).forEach((k) => {
  st.dot(N[k], { r: 17, c: nodeCol[k], k: g2 });
  st.label(N[k], "\\{" + k + "\\}", {
    c: nodeCol[k],
    px: 46,
    dx: k === "U" ? -50 : k === "D" ? 50 : 0,
    dy: k === "A" || k === "D" ? -42 : 46,
    k: g2,
  });
});
const edge = (a, b, c, key) => {
  const e = { op: 0 };
  const gl = st.seg(N[a], N[b], { c: C.gold, w: 22, k: () => g2() * 0 });
  const s = st.seg(N[a], N[b], { c: c || C.green, w: 8, head: true, k: () => g2() * e.op });
  return { e, gl, s };
};
const E = {
  UA: edge("U", "A"),
  AD: edge("A", "D"),
  UB: edge("U", "B"),
  BC: edge("B", "C", C.red),
  CD: edge("C", "D"),
};
const rCD = edge("D", "C"); // reversed link
const hlE = (k) => {
  E[k].gl.o.k = null;
};
const gold = { s: { op: 0 }, l: { op: 0 } };
const gl = (a, b, ref) => st.seg(N[a], N[b], { c: C.gold, w: 24, k: () => g2() * ref.op * 0.8 });
gl("U", "A", gold.s);
gl("A", "D", gold.s);
gl("U", "B", gold.l);
gl("B", "C", gold.l);
gl("C", "D", gold.l);
const elab = (a, b, t, c, dx, dy, key) => {
  const o = { op: 0 };
  st.label(() => add(N[a], mul(sub(N[b], N[a]), 0.5)), t, {
    c: c || C.navy,
    px: 38,
    dx,
    dy,
    k: () => g2() * o.op,
  });
  return o;
};
const lb = {
  UA: elab("U", "A", "{}^{U}_{A}T", C.navy, -46, -18),
  AD: elab("A", "D", "{}^{A}_{D}T", C.navy, 0, -48),
  UB: elab("U", "B", "{}^{U}_{B}T", C.navy, -50, 20),
  BC: elab("B", "C", "{}^{B}_{C}T\\ ?", C.red, 0, 52),
  CD: elab("C", "D", "{}^{C}_{D}T", C.navy, 56, 10),
  DC: elab("D", "C", "{}^{C}_{D}T^{-1}", C.navy, 78, 10),
};
tl.to(G1, { op: 0, duration: 0.4, ease: "none" }, 10.6);
tl.fromTo(G2, { op: 0 }, { op: 1, duration: 0.4, ease: "none" }, 11.1);
tl.to(
  st.cam,
  { a: 0, e: 55, d: 10.5, tx: 0.2, ty: 0, tz: 0.1, duration: 2.0, ease: "power3.inOut" },
  10.4,
);
S.sfx("whoosh", 10.4, 0.5);
const eT = { UA: 11.9, AD: 12.3, UB: 12.8, BC: 13.2, CD: 13.6 };
Object.keys(E).forEach((k) => {
  tl.to(E[k].e, { op: 1, duration: 0.3, ease: "none" }, eT[k]);
  tl.to(lb[k], { op: 1, duration: 0.3, ease: "none" }, eT[k] + 0.1);
  S.sfx("pop", eT[k], 0.6);
});
tl.to(gold.s, { op: 1, duration: 0.3 }, 14.1);
tl.to(gold.s, { op: 0, duration: 0.3 }, 14.9);
tl.to(gold.l, { op: 1, duration: 0.3 }, 15.0);
tl.to(gold.l, { op: 0, duration: 0.3 }, 15.8);
// reverse C->D: forward arrow out, reversed arrow in, label becomes C_D T^-1
const rv = { op: 0 };
rCD.s.o.k = () => g2() * rv.op;
tl.to(E.CD.e, { op: 0, duration: 0.3, ease: "none" }, 15.9);
tl.to(lb.CD, { op: 0, duration: 0.3, ease: "none" }, 15.9);
tl.to(rv, { op: 1, duration: 0.3, ease: "none" }, 16.0);
tl.to(lb.DC, { op: 1, duration: 0.3, ease: "none" }, 16.1);
S.sfx("click", 16.0, 0.9);
// ---------- panel ----------
const pn = S.panel(1000, 150, 824, 700, C.navy);
tl.fromTo(pn, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, 1.7);
const grp = (t0, t1) => {
  const g = K.el("div", "", "position:absolute;inset:0;", pn);
  tl.fromTo(g, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
  tl.to(g, { opacity: 1, duration: 0.3, ease: "none" }, t0);
  if (t1) tl.to(g, { opacity: 0, duration: 0.3, ease: "none" }, t1);
  return g;
};
// --- compound
const c1 = grp(1.9, 6.4);
const row = K.el(
  "div",
  "",
  "position:absolute;left:60px;top:150px;display:flex;align-items:center;gap:22px;direction:ltr;",
  c1,
);
const t1 = K.tchip("A", "B", "T", 84, C.navy, C.blue),
  t2 = K.tchip("B", "C", "T", 84, C.navy, C.teal);
row.appendChild(t1.el);
row.appendChild(t2.el);
const prefix = K.el("div", "", "position:absolute;left:60px;top:60px;", c1);
prefix.appendChild(K.tex("{}^{A}_{C}T=", 56, C.navy));
tl.fromTo(prefix, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(prefix, { opacity: 1, duration: 0.3 }, 5.0);
const idxA = t1.bot,
  idxB = t2.top;
S.glow(idxA, 3.0, 4.0);
S.glow(idxB, 3.0, 4.0);
S.sfx("pop", 3.0, 0.8);
const lineB = K.el("div", "", "", c1);
tl.to([idxA, idxB], { opacity: 0, scale: 0.3, duration: 0.35, ease: "power2.in" }, 4.0);
S.sfx("click", 4.0, 0.8);
// snap: {C} moves into the free lower slot of chip 1, second T dissolves
const rC = S.rect(t2.bot),
  rS = S.rect(t1.slotB),
  rT2 = S.rect(t2.body),
  rT1 = S.rect(t1.body);
tl.to(
  t2.bot,
  {
    x: rS.x + rS.w / 2 - (rC.x + rC.w / 2),
    y: rS.y + rS.h / 2 - (rC.y + rC.h / 2),
    duration: 0.55,
    ease: "power3.inOut",
  },
  4.5,
);
tl.to(
  t2.body,
  {
    x: rT1.x + rT1.w / 2 - (rT2.x + rT2.w / 2) + 4,
    opacity: 0,
    duration: 0.55,
    ease: "power3.inOut",
  },
  4.5,
);
S.sfx("whoosh", 4.5, 0.5);
const fcomp = K.el("div", "", "position:absolute;left:60px;top:330px;", c1);
fcomp.appendChild(K.tex("{}^{A}_{C}T={}^{A}_{B}T\\,{}^{B}_{C}T", 62, C.navy));
tl.fromTo(fcomp, { opacity: 0, y: 24 }, { opacity: 0, y: 24, duration: 0.01 }, 0);
tl.to(fcomp, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, 5.3);
S.check(1740, 165, 5.5, { out: 6.3 });
S.sfx("sparkle", 5.3, 0.6);
// --- inverse trap
const c2 = grp(6.4, 11.0);
const wrong = K.el("div", "", "position:absolute;left:40px;top:60px;", c2);
wrong.appendChild(K.tex("{}^{A}_{B}T^{-1}\\neq{}^{A}_{B}T^{T}", 64, C.navy));
const ang2 = (Math.atan2(100, 380) * 180) / Math.PI,
  len2 = Math.hypot(380, 100);
const x1 = K.el(
  "div",
  "",
  `position:absolute;left:44px;top:72px;width:0;height:9px;background:${C.red};border-radius:5px;transform:rotate(${ang2}deg);transform-origin:left center;`,
  c2,
);
const x2 = K.el(
  "div",
  "",
  `position:absolute;left:44px;top:172px;width:0;height:9px;background:${C.red};border-radius:5px;transform:rotate(${-ang2}deg);transform-origin:left center;`,
  c2,
);
tl.to([x1, x2], { width: len2, duration: 0.35, ease: "power3.out", stagger: 0.12 }, 7.0);
S.sfx("click", 7.0, 0.9);
tl.to([wrong, x1, x2], { opacity: 0.0, duration: 0.3, ease: "none" }, 8.1);
const rtext = K.el("div", "", "position:absolute;left:40px;top:60px;", c2);
rtext.appendChild(K.tex("{}^{A}_{B}T^{-1}={}^{B}_{A}T=", 58, C.navy));
tl.fromTo(rtext, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to(rtext, { opacity: 1, duration: 0.3 }, 8.3);
const IM = K.mx(
  [
    [
      { t: "{}^{A}_{B}R^{T}", c: C.purple },
      { t: "-{}^{A}_{B}R^{T}\\,{}^{A}P_{BORG}", c: C.green },
    ],
    ["0\\ 0\\ 0", "1"],
  ],
  { px: 40, cws: [250, 440], rh: 100, c: C.navy, vline: 1 },
);
IM.cells[1].forEach((c) => (c.style.borderTop = "4px solid " + C.navy));
IM.cells[0].forEach((c) => (c.style.borderTop = "none"));
const imw = K.el("div", "", "position:absolute;left:20px;top:210px;", c2);
imw.appendChild(IM.el);
tl.fromTo(imw, { opacity: 0, y: 26 }, { opacity: 0, y: 26, duration: 0.01 }, 0);
tl.to(imw, { opacity: 1, y: 0, duration: 0.4, ease: "power4.out" }, 8.6);
S.sfx("pop", 8.6, 0.8);
S.glow(IM.cells[0][1], 9.4, 10.9);
S.check(1740, 165, 9.6, { out: 10.9 });
// --- loop equations
const c3 = grp(11.3, null);
const e1 = K.el("div", "", "position:absolute;left:30px;top:50px;", c3);
e1.appendChild(
  K.tex("{}^{U}_{A}T\\,{}^{A}_{D}T={}^{U}_{B}T\\,{}^{B}_{C}T\\,{}^{C}_{D}T", 46, C.navy),
);
const e2 = K.el("div", "", "position:absolute;left:30px;top:200px;", c3);
e2.appendChild(
  K.tex("{}^{B}_{C}T={}^{U}_{B}T^{-1}\\,{}^{U}_{A}T\\,{}^{A}_{D}T\\,{}^{C}_{D}T^{-1}", 44, C.red),
);
[e1, e2].forEach((e) =>
  tl.fromTo(e, { opacity: 0, y: 20 }, { opacity: 0, y: 20, duration: 0.01 }, 0),
);
tl.to(e1, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, 13.7);
S.sfx("pop", 13.7, 0.7);
tl.to(e2, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, 16.2);
S.sfx("pop", 16.2, 0.7);
// index cancellation: B_U T . U_A T . A_D T . D_C T = B_C T
const crow = K.el(
  "div",
  "",
  "position:absolute;left:24px;top:370px;display:flex;align-items:center;gap:6px;direction:ltr;",
  c3,
);
const k1 = K.tchip("B", "U", "T", 62, C.navy),
  k2 = K.tchip("U", "A", "T", 62, C.navy),
  k3 = K.tchip("A", "D", "T", 62, C.navy),
  k4 = K.tchip("D", "C", "T", 62, C.navy);
[k1, k2, k3, k4].forEach((k) => crow.appendChild(k.el));
const eqc = K.tex("={}^{B}_{C}T", 62, C.green);
crow.appendChild(eqc);
tl.fromTo(crow, { opacity: 0, y: 20 }, { opacity: 0, y: 20, duration: 0.01 }, 0);
tl.to(crow, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, 17.0);
const pairs = [
  [k1.bot, k2.top],
  [k2.bot, k3.top],
  [k3.bot, k4.top],
];
pairs.forEach(([a, b], q) => {
  S.glow(a, 17.5 + q * 0.12, 18.3);
  S.glow(b, 17.5 + q * 0.12, 18.3);
  tl.to([a, b], { opacity: 0, scale: 0.3, duration: 0.3, ease: "power2.in" }, 18.0 + q * 0.1);
});
S.sfx("click", 18.0, 0.8);
S.card(0.2, 18.85, "9", "خصائص T", C.gold);
S.cap(0.4, 2.6, ["ثلاث", "فريمات:", { m: "\\{A\\}" }, "←", { m: "\\{B\\}" }, "←", { m: "\\{C\\}" }]);
S.cap(2.8, 5.0, ["المؤشرات", "المتطابقة", "بتلغي", "بعض"]);
S.cap(5.2, 6.3, ["مصفوفتين", "صارو", "وحدة"]);
S.cap(6.6, 8.2, ["العكس", "مش", "المنقولة!"]);
S.cap(8.4, 10.5, ["العكس", "الصح:", { m: "-R^{T}p" }]);
S.cap(11.4, 15.9, ["طريقين", "من", { m: "\\{U\\}" }, "لـ", { m: "\\{D\\}" }, "= نفس", "النتيجة"]);
S.cap(16.2, 18.7, ["نعكس", "رابط", "ونحل", "المجهول", { m: "{}^{B}_{C}T" }]);
S.finish();
