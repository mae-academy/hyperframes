/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R,
  ang = D.ang;
const S = K.scene("s6", {
  cam: { a: 38, e: 24, d: 10.5, tx: 0.9, ty: 0.7, tz: 0.6, cx: 470, cy: 520 },
});
const st = S.st,
  tl = S.tl,
  o0 = V(0, 0, 0),
  L = 1.5;
S.seam();
st.floor({ n: 4 });
const org = V(1.7, 1.1, 0.6),
  Bp = V(0.9, 0.6, 0.7),
  u = { v: 0 },
  w = { v: 0 };
const Rb = () =>
  M.mul(M.mul(M.z(ang.alpha * D2R * u.v), M.y(ang.beta * D2R * u.v)), M.x(ang.gamma * D2R * u.v));
const O = () => mul(org, w.v),
  Pw = () => add(O(), M.mv(Rb(), Bp));
st.frame({
  o: o0,
  R: M.I(),
  len: L,
  cols: [C.navy, C.navy, C.red],
  names: ["X_A", "Y_A", "Z_A"],
  w: 6,
  px: 36,
  dy: [-30, -30, -30],
});
st.seg(o0, O, { c: C.green, w: 9, head: true });
st.label(() => mul(org, 0.5 * w.v), "{}^{A}P_{BORG}", {
  c: C.green,
  px: 36,
  dx: -78,
  dy: 44,
  k: () => Math.min(1, w.v * 4),
});
st.frame({
  o: O,
  R: Rb,
  len: L,
  cols: [C.blue, C.blue, C.red],
  names: ["X_B", "Y_B", "Z_B"],
  w: 6,
  px: 36,
  dx: [40, 40, 40],
  dy: [8, 8, -8],
});
st.seg(O, Pw, { c: C.blue, w: 5, dash: true });
st.seg(o0, Pw, { c: C.ink2, w: 5, dash: true });
st.dot(Pw, { r: 15, c: C.orange });
st.label(Pw, "P", { c: C.orange, px: 42, dx: 26, dy: -30 });
tl.fromTo(u, { v: 0 }, { v: 1, duration: 2.4, ease: "power2.inOut" }, 1.0);
tl.fromTo(w, { v: 0 }, { v: 1, duration: 2.4, ease: "power2.inOut" }, 1.0);
S.sfx("servo", 1.0, 0.55, 2.4);
tl.to(st.cam, { a: 46, duration: 16, ease: "none" }, 0);
S.card(0.2, 15.9, "8", "مصفوفة التحويل", C.gold);
// ---- panel ----
const pn = S.panel(1000, 150, 824, 700, C.gold);
tl.fromTo(pn, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, 3.5);
// step 1: vector equation, piece by piece
const eqRow = K.el(
  "div",
  "",
  "position:absolute;left:30px;top:44px;display:flex;align-items:center;gap:14px;direction:ltr;",
  pn,
);
const parts = [
  ["{}^{A}P", C.orange],
  ["=", C.navy],
  ["{}^{A}_{B}R", C.purple],
  ["{}^{B}P", C.orange],
  ["+", C.navy],
  ["{}^{A}P_{BORG}", C.green],
].map(([t, c]) => {
  const d = K.el("div", "", "", eqRow);
  d.appendChild(K.tex(t, 52, c));
  return d;
});
const pt = [3.8, 3.8, 4.6, 5.3, 6.0, 6.3];
parts.forEach((d, i) =>
  S.pop(d, pt[i], null, { dy: 18, sfx: i === 2 || i === 5 ? "pop" : "tick", vol: 0.7 }),
);
// step 2: assemble into one 4x4
const px = 34,
  cw = 104,
  rh = 64;
const rCells = [
  ["r_{11}", "r_{12}", "r_{13}"],
  ["r_{21}", "r_{22}", "r_{23}"],
  ["r_{31}", "r_{32}", "r_{33}"],
].map((r) => r.map((t) => ({ t, c: C.purple })));
const Tm = K.mx(
  [
    ...rCells.map((r, i) => [...r, { t: ["p_x", "p_y", "p_z"][i], c: C.green }]),
    [{ t: "0" }, { t: "0" }, { t: "0" }, { t: "1" }],
  ],
  { px, cw, rh, c: C.navy },
);
const VA = K.mx([["x_A"], ["y_A"], ["z_A"], ["1"]], { px, cw: 80, rh, c: C.orange }),
  VB = K.mx([["x_B"], ["y_B"], ["z_B"], ["1"]], { px, cw: 80, rh, c: C.orange });
const fin = K.el(
  "div",
  "",
  "position:absolute;left:14px;top:190px;display:flex;align-items:center;gap:12px;direction:ltr;",
  pn,
);
fin.appendChild(VA.el);
fin.appendChild(K.tex("=", 40, C.navy));
fin.appendChild(Tm.el);
fin.appendChild(VB.el);
tl.fromTo(fin, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
const pr = S.rect(pn),
  tr = S.rect(Tm.el),
  rel = { x: tr.x - pr.x, y: tr.y - pr.y };
const Rm = K.mx(rCells, { px, cw, rh, c: C.purple }),
  pm = K.mx([[{ t: "p_x", c: C.green }], [{ t: "p_y", c: C.green }], [{ t: "p_z", c: C.green }]], {
    px,
    cw,
    rh,
    c: C.green,
  });
const place = (m, x, y) => {
  const d = K.el("div", "", `position:absolute;left:${x}px;top:${y}px;`, pn);
  d.appendChild(m.el);
  return d;
};
const Rw = place(Rm, rel.x, rel.y),
  pw = place(pm, rel.x + 3 * cw, rel.y);
const tgR = K.el("div", "", `position:absolute;left:${rel.x + 20}px;top:${rel.y - 70}px;`, pn);
tgR.appendChild(K.tex("{}^{A}_{B}R", 48, C.purple));
const tgp = K.el(
  "div",
  "",
  `position:absolute;left:${rel.x + 3 * cw - 40}px;top:${rel.y - 70}px;`,
  pn,
);
tgp.appendChild(K.tex("{}^{A}P_{BORG}", 44, C.green));
const T0 = 7.6;
tl.to(
  eqRow,
  { y: -14, scale: 0.78, transformOrigin: "left top", duration: 0.4, ease: "power4.out" },
  T0 - 0.2,
);
[Rw, pw, tgR, tgp].forEach((e) => tl.fromTo(e, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0));
tl.fromTo(Rw, { opacity: 0, x: -260 }, { opacity: 1, x: -260, duration: 0.3, ease: "none" }, T0);
tl.fromTo(pw, { opacity: 0, x: 250 }, { opacity: 1, x: 250, duration: 0.3, ease: "none" }, T0);
tl.fromTo(tgR, { opacity: 0, x: -260 }, { opacity: 1, x: -260, duration: 0.3 }, T0);
tl.fromTo(tgp, { opacity: 0, x: 250 }, { opacity: 1, x: 250, duration: 0.3 }, T0);
S.sfx("pop", T0, 0.8);
const T1 = T0 + 1.6; // 9.2: slide together (never added directly: they sit side by side)
tl.to([Rw, tgR], { x: 0, duration: 0.9, ease: "power3.inOut" }, T1);
tl.to([pw, tgp], { x: 0, duration: 0.9, ease: "power3.inOut" }, T1);
S.sfx("whoosh", T1, 0.5);
const T2 = T1 + 1.2; // 10.4: the single 4x4 appears, bottom row slides under
tl.set(fin, { opacity: 1 }, T2);
tl.to([Rw, pw, tgR, tgp], { opacity: 0, duration: 0.2, ease: "none" }, T2);
const bot = Tm.cells[3],
  mid = [VA, VB];
tl.fromTo(fin, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none" }, T2);
tl.fromTo(bot, { opacity: 0, y: 70 }, { opacity: 0, y: 70, duration: 0.01 }, 0);
tl.to(bot, { opacity: 1, y: 0, duration: 0.6, ease: "power4.out" }, T2 + 0.3);
S.sfx("whoosh", T2 + 0.3, 0.4);
tl.fromTo([VA.cells[3][0], VB.cells[3][0]], { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
tl.to([VA.cells[3][0], VB.cells[3][0]], { opacity: 1, duration: 0.25, ease: "none" }, T2 + 1.3);
S.sfx("click", T2 + 1.3, 0.9);
bot.forEach((c, q) => S.glow(c, T2 + 0.9 + q * 0.04, T2 + 2.0));
S.glow(VB.cells[3][0], T2 + 1.3, T2 + 2.3);
// final one-line equation + why the 1
const fe = K.el(
  "div",
  "panel",
  `left:1030px;top:710px;width:770px;height:110px;border-color:${C.gold};display:flex;align-items:center;justify-content:center;border-width:6px;`,
  S.layer,
);
fe.appendChild(K.tex("{}^{A}P={}^{A}_{B}T\\,{}^{B}P", 60, C.navy));
tl.fromTo(fe, { opacity: 0, y: 30 }, { opacity: 0, y: 30, duration: 0.01 }, 0);
tl.to(fe, { opacity: 1, y: 0, duration: 0.35, ease: "power4.out" }, T2 + 2.6);
S.sfx("sparkle", T2 + 2.6, 0.7);
S.check(1740, 160, T2 + 2.9);
const why = K.el("div", "", "position:absolute;left:30px;top:470px;", pn);
why.appendChild(K.tex("[0\\ 0\\ 0\\ 1]\\cdot[x\\ y\\ z\\ 1]^T=1", 40, C.ink2));
tl.fromTo(why, { opacity: 0, y: 20 }, { opacity: 0, y: 20, duration: 0.01 }, 0);
// (the 'why' line sits in the panel under the matrices, above the final box)
tl.to(why, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, T2 + 1.6);
S.cap(0.4, 3.6, ["الفريم", { m: "\\{B\\}" }, "بيلف", "وبيتزحلق", "مرة", "وحدة"]);
S.cap(3.8, 7.4, ["مسافة", "الدوران", "+", "مسافة", "الإزاحة"]);
S.cap(7.7, 10.2, ["الدوران", "والإزاحة", "جنب", "بعض"]);
S.cap(10.5, 12.8, ["نضيف", "الصف", "الأخير", { m: "[0\\ 0\\ 0\\ 1]" }]);
S.cap(12.9, 15.6, ["ضربة", "وحدة", "بدل", "ضرب", "وجمع"]);
S.finish();
