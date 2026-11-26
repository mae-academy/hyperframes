/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R,
  ang = D.ang;
const S = K.scene("recap", {
  cam: { a: 36, e: 24, d: 10.5, tx: 0.7, ty: 0.5, tz: 0.7, cx: 960, cy: 330 },
});
const st = S.st,
  tl = S.tl,
  o0 = V(0, 0, 0),
  L = 1.4;
S.seam();
st.floor({ n: 3, op: 0.7 });
const q = { a: 0, b: 0, c: 0, x: 0, y: 0, z: 0 };
const Rb = () => M.mul(M.mul(M.z(q.a * D2R), M.y(q.b * D2R)), M.x(q.c * D2R)),
  Ob = () => V(q.x, q.y, q.z);
st.frame({
  o: o0,
  R: M.I(),
  len: L,
  cols: [C.navy, C.navy, C.red],
  names: ["X_A", "Y_A", "Z_A"],
  w: 6,
  px: 34,
  dy: [-28, -28, -28],
});
st.frame({
  o: Ob,
  R: Rb,
  len: L,
  cols: [C.blue, C.blue, C.red],
  names: ["X_B", "Y_B", "Z_B"],
  w: 6,
  px: 34,
  dx: [40, 40, 40],
  dy: [8, 8, -8],
});
st.seg(o0, Ob, { c: C.green, w: 8, head: true, k: () => Math.min(1, Math.hypot(q.x, q.y, q.z)) });
const Z0 = { a: 0, b: 0, c: 0, x: 0, y: 0, z: 0 };
const states = [
  Z0,
  { ...Z0, a: 60 },
  { ...Z0, a: 60, c: 40 },
  { ...Z0, a: ang.alpha, b: ang.beta, c: ang.gamma },
  { a: ang.alpha, b: ang.beta, c: ang.gamma, x: 1.6, y: 1.0, z: 0.6 },
  { a: ang.alpha, b: ang.beta, c: ang.gamma, x: 1.6, y: 1.0, z: 0.6 },
  { a: 20, b: 10, c: 70, x: 2.2, y: 0.6, z: 1.0 },
];
const cards = [
  ["R_z,\\,R_x,\\,R_y", "دوران نقطة", C.purple],
  ["{}^{A}_{B}R", "دوران فريمين", C.blue],
  ["R_zR_yR_x", "ثابت = أويلر", C.purple],
  ["\\mathrm{atan2}", "الزوايا عكسيًا", C.teal],
  ["R,\\ P_{BORG}", "دوران + إزاحة", C.green],
  ["{}^{A}_{B}T", "مصفوفة 4×4", C.gold],
  ["T^{-1},\\ TT", "خصائص", C.navy],
];
const step = 0.7,
  t0 = 0.5;
cards.forEach(([t, n, c], i) => {
  const d = K.el(
    "div",
    "panel",
    `left:${113 + i * 244}px;top:560px;width:230px;height:250px;border-color:${c};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:18px 8px 14px;border-width:7px;`,
    S.layer,
  );
  const nb = K.el(
    "div",
    "",
    `width:48px;height:48px;border-radius:14px;background:${c};color:#fff;font:800 30px Inter;display:flex;align-items:center;justify-content:center;`,
    d,
  );
  nb.textContent = String(i + 1);
  const f = K.el("div", "", "", d);
  f.appendChild(K.tex(t, 44, C.navy));
  const l = K.el("div", "", "font-size:32px;font-weight:700;direction:rtl;text-align:center;", d);
  l.textContent = n;
  tl.fromTo(
    d,
    { opacity: 0, y: 50 },
    { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" },
    t0 + i * step,
  );
  S.sfx("pop", t0 + i * step, 0.7);
  S.glow(d, t0 + i * step + 0.05, t0 + i * step + 0.55);
  if (i > 0)
    tl.fromTo(
      q,
      { ...states[i - 1] },
      { ...states[i], duration: step * 0.85, ease: "power2.inOut", immediateRender: false },
      t0 + i * step,
    );
});
S.sfx("servo", 1.2, 0.4, 3.5);
S.card(0.2, 6.9, "10", "الخلاصة", C.navy);
S.cap(0.4, 6.8, ["هيك", "مشينا", "خطوة", "خطوة"]);
S.finish();
