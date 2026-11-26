/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R,
  ang = D.ang;
const S = K.scene("s2", {
  cam: { a: 35, e: 24, d: 9.2, tx: 0.55, ty: 0.4, tz: 0.7, cx: 560, cy: 540 },
});
const st = S.st,
  tl = S.tl,
  L = 1.9;
st.floor({ n: 5 });
S.seam();
const u = { v: 0 };
const Rb = () =>
  M.mul(M.mul(M.z(ang.alpha * D2R * u.v), M.y(ang.beta * D2R * u.v)), M.x(ang.gamma * D2R * u.v));
const Rf = D.Rfinal,
  col = (j) => V(Rf[j], Rf[3 + j], Rf[6 + j]);
const o0 = V(0, 0, 0);
// gold under-glow along each B axis (drawn under the frames)
const hl = [0, 1, 2].map((j) =>
  st.seg(o0, () => mul(M.col(Rb(), j), L), { c: C.gold, w: 20, op: 0 }),
);
const grp = [0, 1, 2].map(() => ({ op: 0 }));
// projection dashes of each final B axis tip onto the A axes
[0, 1, 2].forEach((j) => {
  const T = () => mul(M.col(Rb(), j), L),
    k = () => grp[j].op,
    o = { c: C.blue, w: 4, dash: true, k };
  st.seg(T, () => V(T().x, 0, 0), o);
  st.seg(T, () => V(0, T().y, 0), o);
  st.seg(T, () => V(0, 0, T().z), o);
});
const A = st.frame({
  o: o0,
  R: M.I(),
  len: L,
  cols: [C.navy, C.navy, C.red],
  names: ["X_A", "Y_A", "Z_A"],
  w: 7,
  dy: [-34, -34, -34],
});
const B = st.frame({
  o: o0,
  R: Rb,
  len: L,
  cols: [C.blue, C.blue, C.red],
  names: ["X_B", "Y_B", "Z_B"],
  w: 7,
  dx: [46, 46, 46],
  dy: [10, 10, -4],
});
st.label(o0, "\\{A\\},\\{B\\}", {
  c: C.navy,
  px: 40,
  dx: -80,
  dy: 34,
  k: () => 1 - Math.min(1, u.v * 8),
});
st.label(o0, "\\{A\\}", { c: C.navy, px: 40, dx: -50, dy: 34, k: () => Math.min(1, u.v * 8) });
tl.to(st.cam, { a: 52, duration: 15, ease: "none" }, 0);
tl.fromTo(u, { v: 0 }, { v: 1, duration: 2.4, ease: "power2.inOut" }, 1.5);
S.sfx("servo", 1.5, 0.55, 2.4);

// ---- panel ----
const pn = S.panel(1100, 150, 724, 700, C.blue);
const head = K.el("div", "", "position:absolute;left:30px;top:34px;", pn);
const h1 = K.tex("{}^{A}_{B}R=[\\,{}^{A}X_B\\quad{}^{A}Y_B\\quad{}^{A}Z_B\\,]", 44, C.navy);
head.appendChild(h1);
const num = (i, j) => D.f3(Rf[i * 3 + j]);
const RM = K.mx(
  [0, 1, 2].map((i) => [0, 1, 2].map((j) => ({ t: num(i, j), c: C.blue }))),
  { px: 42, cw: 168, rh: 76, c: C.blue },
);
const mw = K.el("div", "", "position:absolute;left:30px;top:130px;", pn);
mw.appendChild(RM.el);
const cellKids = RM.cells.map((r) => r.map((c) => c.firstChild));
cellKids.forEach((r) =>
  r.forEach((k) => tl.fromTo(k, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0)),
);
tl.fromTo(pn, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, 0.35);
const lab = ["X", "Y", "Z"];
const camEnd = { a: 52 };
// chip flight: column vector from the axis tip (screen) into column j of the matrix
const meas = [0, 1, 2].map((j) => S.rect(RM.cells[0][j]));
[0, 1, 2].forEach((j) => {
  const t0 = 4.4 + j * 3.1,
    c = col(j);
  tl.to(grp[j], { op: 1, duration: 0.3, ease: "none" }, t0);
  tl.to(hl[j], { op: 0.55, duration: 0.25, ease: "none" }, t0);
  S.sfx("click", t0, 0.7);
  // chip: 3x1 column
  const ch = K.mx(
    [0, 1, 2].map((i) => [{ t: num(i, j), c: C.blue }]),
    { px: 36, cw: 100, rh: 56, c: C.blue },
  );
  const w = K.el(
    "div",
    "panel",
    `border-color:${C.blue};border-width:6px;padding:6px 6px;border-radius:20px;`,
    S.layer,
  );
  w.appendChild(ch.el);
  const sv = Object.assign({}, st.cam);
  Object.assign(st.cam, { a: 52 });
  const q = st.pr(mul(col(j), L));
  Object.assign(st.cam, sv);
  const tx = meas[j].x - 14,
    ty = meas[j].y - 6;
  tl.fromTo(
    w,
    { opacity: 0, x: q.x + 40, y: q.y - 90, scale: 0.8 },
    { opacity: 1, x: q.x + 40, y: q.y - 90, scale: 0.8, duration: 0.01 },
    t0 + 0.3,
  );
  tl.to(w, { x: tx, y: ty, scale: 1, duration: 1.0, ease: "power3.inOut" }, t0 + 0.6);
  S.sfx("whoosh", t0 + 0.6, 0.35);
  tl.to(
    cellKids.map((r) => r[j]),
    { opacity: 1, duration: 0.15, ease: "none" },
    t0 + 1.65,
  );
  tl.to(w, { opacity: 0, duration: 0.15, ease: "none" }, t0 + 1.68);
  S.glow(RM.cells[0][j], t0 + 1.65, t0 + 2.4);
  S.glow(RM.cells[1][j], t0 + 1.65, t0 + 2.4);
  S.glow(RM.cells[2][j], t0 + 1.65, t0 + 2.4);
  S.sfx("click", t0 + 1.65, 0.8);
  tl.to(hl[j], { op: 0, duration: 0.3, ease: "none" }, t0 + 2.2);
  tl.to(grp[j], { op: 0.0, duration: 0.3, ease: "none" }, t0 + 2.4);
});
S.card(0.2, 14.9, "4", "دوران فريمين", C.blue);
// ---- orthonormality badge ----
const T0 = 10.9;
const r1 = K.el("div", "", "position:absolute;left:30px;top:420px;", pn);
r1.appendChild(K.tex("|{}^{A}X_B|=|{}^{A}Y_B|=|{}^{A}Z_B|=1", 42, C.navy));
const r2 = K.el("div", "", "position:absolute;left:30px;top:500px;", pn);
r2.appendChild(K.tex("X_B\\cdot Y_B=0\\quad Y_B\\cdot Z_B=0\\quad X_B\\cdot Z_B=0", 40, C.navy));
const bd = K.el(
  "div",
  "tag",
  `--c:${C.gold};left:30px;top:588px;font-family:Inter;font-size:46px;`,
  pn,
);
bd.textContent = "Orthonormal";
[r1, r2, bd].forEach((e, i) => {
  tl.fromTo(e, { opacity: 0, y: 24 }, { opacity: 0, y: 24, duration: 0.01 }, 0);
  tl.to(e, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, T0 + i * 0.55);
});
S.sfx("pop", T0, 0.8);
S.sfx("pop", T0 + 0.55, 0.8);
S.sfx("click", T0 + 1.1, 0.9);
// right-angle marks at the origin (gold) between B axes, unit tick on each
[
  [0, 1],
  [1, 2],
  [0, 2],
].forEach(([a, b]) => {
  const s = 0.4;
  st.path(
    () => {
      const Rm = Rb(),
        x = M.col(Rm, a),
        y = M.col(Rm, b);
      return [mul(x, s), add(mul(x, s), mul(y, s)), mul(y, s)];
    },
    { c: C.gold, w: 6, k: () => 0, op: 0 },
  );
});
const ra = st.items.slice(-3);
ra.forEach((it, i) => {
  it.o.k = null;
  tl.fromTo(it, { op: 0 }, { op: 1, duration: 0.3, ease: "none" }, T0 + 0.4 + i * 0.2);
});
// flip rows <-> columns: off-diagonal cells swap across the diagonal
const flipT = 13.0;
tl.to([r1, r2, bd], { opacity: 0, y: -20, duration: 0.3, ease: "power4.in" }, flipT - 0.2);
RM.cells.forEach((r, i) =>
  r.forEach((c, j) => {
    if (i !== j)
      tl.to(
        c,
        { x: (i - j) * RM.cw * 1, y: (j - i) * RM.rh, duration: 0.8, ease: "power3.inOut" },
        flipT,
      );
  }),
);
S.sfx("whoosh", flipT, 0.5);
const inv = K.el("div", "", "position:absolute;left:30px;top:470px;", pn);
inv.appendChild(K.tex("{}^{A}_{B}R^{-1}={}^{A}_{B}R^{T}={}^{B}_{A}R", 50, C.navy));
tl.fromTo(
  inv,
  { opacity: 0, y: 26 },
  { opacity: 1, y: 0, duration: 0.35, ease: "power4.out" },
  flipT + 0.9,
);
S.sfx("click", flipT + 0.95, 0.9);
S.check(1010, 60, flipT + 1.25);

S.cap(0.4, 1.6, ["فريم", { m: "\\{A\\}" }, "ثابت"]);
S.cap(1.7, 4.2, ["و", { m: "\\{B\\}" }, "بيلف", "عليه"]);
S.cap(4.4, 8.0, ["إسقاط", "كل", "محور", "= عمود", "بالمصفوفة"]);
S.cap(8.2, 10.7, ["تلات", "أعمدة،", "تلات", "اتجاهات"]);
S.cap(10.9, 12.9, ["طول", "العمود", "1", "وبينهم", "90°"]);
S.cap(13.0, 14.7, ["قلب", "الصفوف", "للأعمدة", "= العكس"]);
S.finish();
