/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R,
  ang = D.ang;
const cam = (cx) => ({ a: 35, e: 22, d: 11.8, tx: 0.7, ty: 0.55, tz: 0.55, f: 1750, cx, cy: 430 });
const S = K.scene("s5", { cam: cam(380) });
const stg = [S.st, S.stage2(cam(960)), S.stage2(cam(1540))],
  tl = S.tl,
  o0 = V(0, 0, 0),
  L = 1.5;
S.seam();
const G = [{ op: 0 }, { op: 0 }, { op: 0 }],
  B0 = [0.05, 4.7, 9.4];
stg.forEach((s) => s.floor({ n: 2, step: 0.9, op: 0.55 }));
const mk = (i) => {
  const s = stg[i],
    k = () => G[i].op;
  return {
    seg: (a, b, o) => s.seg(a, b, Object.assign({ k }, o)),
    dot: (p, o) => s.dot(p, Object.assign({ k }, o)),
    lab: (p, t, o) => s.label(p, t, Object.assign({ k }, o)),
    path: (p, o) => s.path(p, Object.assign({ k }, o)),
    frame: (o) => {
      const F = s.frame(o);
      F.k = k;
      return F;
    },
  };
};
const U = [0, 1, 2].map(mk);
const A = (i, px) =>
  U[i].frame({
    o: o0,
    R: M.I(),
    len: L,
    cols: [C.navy, C.navy, C.red],
    names: ["X_A", "Y_A", "Z_A"],
    w: 6,
    px: px || 34,
    dy: [-30, -30, -30],
  });
// ---------- column 1: frame rotation (2.4) ----------
const P = V(1.0, 0.8, 0.7),
  u1 = { v: 1 };
A(0);
const R1 = () =>
  M.mul(
    M.mul(M.z(ang.alpha * D2R * u1.v), M.y(ang.beta * D2R * u1.v)),
    M.x(ang.gamma * D2R * u1.v),
  );
U[0].path(
  () => {
    const R = R1(),
      s = 0.95;
    return [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ].map(([x, y]) => M.mv(R, V(x * s, y * s, 0)));
  },
  { c: C.blue, w: 3, fill: C.blue, fillOp: 0.16 },
);
U[0].frame({
  o: o0,
  R: R1,
  len: L,
  cols: [C.blue, C.blue, C.red],
  names: ["X_B", "Y_B", "Z_B"],
  w: 6,
  px: 34,
  dx: [40, 40, 40],
  dy: [8, 8, -8],
}).k = () => G[0].op;
U[0].dot(P, { r: 15, c: C.orange });
U[0].lab(P, "P", { c: C.orange, px: 42, dx: 26, dy: -30 });
// dashed: P on A axes (navy, constant) and P on B axes (blue, changes as B turns)
const dA = { c: C.ink2, w: 4, dash: true };
U[0].seg(P, V(P.x, P.y, 0), dA);
U[0].seg(V(P.x, P.y, 0), V(P.x, 0, 0), dA);
U[0].seg(V(P.x, P.y, 0), V(0, P.y, 0), dA);
const inB = () => {
  const R = R1(),
    q = M.mv(M.T(R), P),
    xb = M.col(R, 0),
    yb = M.col(R, 1),
    zb = M.col(R, 2);
  const F = add(mul(xb, q.x), mul(yb, q.y));
  return { F, X: mul(xb, q.x), Y: mul(yb, q.y) };
};
const dB = { c: C.blue, w: 4, dash: true };
U[0].seg(P, () => inB().F, dB);
U[0].seg(
  () => inB().F,
  () => inB().X,
  dB,
);
U[0].seg(
  () => inB().F,
  () => inB().Y,
  dB,
);
tl.fromTo(u1, { v: 1 }, { v: 0, duration: 1.6, ease: "power2.inOut" }, B0[0] + 0.9);
// ---------- column 2: point translation (2.5) ----------
const P1 = V(0.3, 0.5, 0.2),
  Q = V(1.2, 0.8, 0.9),
  t2 = { v: 0 },
  P2 = () => add(P1, mul(Q, t2.v));
A(1);
U[1].seg(o0, P1, { c: C.ink2, w: 4, dash: true });
U[1].seg(o0, P2, { c: C.ink2, w: 4, dash: true, op: 1 });
U[1].seg(P1, P2, { c: C.green, w: 9, head: true });
U[1].dot(P1, { r: 11, c: "#F7B27A" });
U[1].dot(P2, { r: 15, c: C.orange });
U[1].lab(P1, "{}^{A}P_{1}", { c: C.orange, px: 36, dx: -34, dy: 40 });
U[1].lab(P2, "{}^{A}P_{2}", { c: C.orange, px: 36, dx: 40, dy: -34 });
U[1].lab(() => add(P1, mul(Q, 0.5)), "{}^{A}Q", { c: C.green, px: 40, dx: 36, dy: 24 });
tl.fromTo(t2, { v: 0 }, { v: 1, duration: 1.6, ease: "power2.inOut" }, B0[1] + 0.9);
// ---------- column 3: frame translation (2.6), R = I ----------
const Pw = V(1.9, 1.4, 1.0),
  Org = V(1.1, 0.8, 0.5),
  t3 = { v: 0 },
  O3 = () => mul(Org, t3.v);
A(2);
U[2].frame({ o: o0, R: M.I(), len: L, cols: [C.blue, C.blue, C.red], names: [], w: 6 }).k = () =>
  G[2].op * 0.28;
U[2].frame({
  o: O3,
  R: M.I(),
  len: L,
  cols: [C.blue, C.blue, C.red],
  names: ["X_B", "Y_B", "Z_B"],
  w: 6,
  px: 34,
  dx: [40, 40, 40],
  dy: [8, 8, -8],
}).k = () => G[2].op;
U[2].seg(o0, O3, { c: C.green, w: 9, head: true });
U[2].lab(() => mul(Org, 0.5 * t3.v), "{}^{A}P_{BORG}", {
  c: C.green,
  px: 34,
  dx: -78,
  dy: 52,
  k: () => G[2].op * Math.min(1, t3.v * 4),
});
U[2].seg(O3, Pw, { c: C.blue, w: 5, dash: true });
U[2].seg(o0, Pw, { c: C.ink2, w: 5, dash: true });
U[2].dot(Pw, { r: 15, c: C.orange });
U[2].lab(Pw, "P", { c: C.orange, px: 42, dx: 24, dy: -28 });
tl.fromTo(t3, { v: 0 }, { v: 1, duration: 1.6, ease: "power2.inOut" }, B0[2] + 0.9);
// ---------- HTML: titles, equations, names ----------
const cx = [380, 960, 1540];
const sec = ["2.4", "2.5", "2.6"],
  nm = ["دوران الفريم", "إزاحة النقطة", "إزاحة الفريم"],
  col = [C.purple, C.orange, C.green];
const eqs = [
  "{}^{A}P={}^{A}_{B}R\\,{}^{B}P",
  "{}^{A}P_2={}^{A}P_1+{}^{A}Q",
  "{}^{A}P={}^{B}P+{}^{A}P_{BORG}",
];
for (let i = 0; i < 3; i++) {
  const b = B0[i];
  const tg = K.el(
    "div",
    "tag",
    `--c:${col[i]};left:${cx[i] - 250}px;top:165px;width:500px;text-align:center;direction:rtl;font-size:42px;`,
    S.layer,
  );
  tg.innerHTML = `<span style="font-family:Inter;color:${col[i]};font-weight:800">${sec[i]}</span> · ${nm[i]}`;
  const pnl = S.panel(cx[i] - 270, 700, 540, 130, col[i]);
  pnl.style.display = "flex";
  pnl.style.alignItems = "center";
  pnl.style.justifyContent = "center";
  pnl.appendChild(K.tex(eqs[i], 46, C.navy));
  const t = [tg];
  tl.fromTo(tg, { opacity: 0, x: 80 }, { opacity: 1, x: 0, duration: 0.34, ease: "power4.out" }, b);
  tl.fromTo(G[i], { op: 0 }, { op: 1, duration: 0.3, ease: "none" }, b + 0.1);
  S.sfx("whoosh", b, 0.5);
  S.sfx("pop", b + 0.3, 0.7);
  tl.fromTo(
    pnl,
    { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.35, ease: "power4.out" },
    b + 2.9,
  );
  S.sfx("servo", b + 0.9, 0.5, 1.6);
  S.sfx("click", b + 2.9, 0.9);
  const gl = K.el(
    "div",
    "",
    `position:absolute;left:${cx[i] - 270}px;top:700px;width:540px;height:130px;border-radius:28px;box-shadow:0 0 0 0 rgba(255,194,26,0);pointer-events:none;`,
    S.layer,
  );
  tl.fromTo(
    gl,
    { boxShadow: "0 0 0 0px rgba(255,194,26,0), 0 0 0 0 rgba(255,194,26,0)" },
    {
      boxShadow: "0 0 0 8px rgba(255,194,26,.9), 0 0 30px 10px rgba(255,194,26,.5)",
      duration: 0.25,
      ease: "power4.out",
    },
    b + 3.1,
  );
  tl.to(
    gl,
    {
      boxShadow: "0 0 0 0px rgba(255,194,26,0), 0 0 0 0 rgba(255,194,26,0)",
      duration: 0.3,
      ease: "none",
    },
    b + 3.9,
  );
}
S.card(0.2, 14.9, "7", "ثلاث حركات مختلفة", C.navy);
S.cap(0.4, 4.8, ["النقطة", "ثابتة،", "والفريم", "هو", "اللي", "بيلف"]);
S.cap(5.0, 9.4, ["الفريم", "ثابت،", "والنقطة", "هي", "اللي", "بتتحرك"]);
S.cap(9.6, 13.4, ["بدون", "دوران", ":", "الفريم", "بيتزحلق"]);
S.cap(13.6, 14.8, ["ثلاث", "حركات", "مختلفة"]);
S.finish();
