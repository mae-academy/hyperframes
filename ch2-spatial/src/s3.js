/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R,
  ang = D.ang;
const S = K.scene("s3", {
  cam: { a: 38, e: 22, d: 11.4, tx: 0.5, ty: 0.4, tz: 0.7, cx: 480, cy: 462 },
});
const st = S.st,
  tl = S.tl,
  st2 = S.stage2({ a: 38, e: 22, d: 11.4, tx: 0.5, ty: 0.4, tz: 0.7, f: 1750, cx: 1440, cy: 462 });
S.seam();
st.floor({ n: 3, step: 0.75 });
st2.floor({ n: 3, step: 0.75 });
const L = 1.7,
  o0 = V(0, 0, 0),
  al = ang.alpha * D2R,
  be = ang.beta * D2R,
  ga = ang.gamma * D2R;
const sL = [{ v: 0 }, { v: 0 }, { v: 0 }],
  sR = [{ v: 0 }, { v: 0 }, { v: 0 }];
// fixed XYZ: rotate X by gamma, then Y by beta, then Z by alpha (about A's axes)  ->  Rz(a) Ry(b) Rx(g)  (new factor on the LEFT)
const RL = () => M.mul(M.mul(M.z(al * sL[2].v), M.y(be * sL[1].v)), M.x(ga * sL[0].v));
// Euler ZYX: rotate Z_B by alpha, then new Y_B by beta, then new X_B by gamma  ->  Rz(a) Ry(b) Rx(g)  (new factor on the RIGHT)
const RR = () => M.mul(M.mul(M.z(al * sR[0].v), M.y(be * sR[1].v)), M.x(ga * sR[2].v));
const side = (stg, Rfn, fixedSide) => {
  const glow = [0, 1, 2].map((j) =>
    stg.seg(
      o0,
      () => mul(fixedSide ? V(...[0, 0, 0].map((_, q) => (q === j ? 1 : 0))) : M.col(Rfn(), j), L),
      { c: C.gold, w: 22, op: 0 },
    ),
  );
  const plate = stg.path(
    () => {
      const Rm = Rfn(),
        s = 0.85;
      return [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
        [-1, -1],
      ].map(([x, y]) => M.mv(Rm, V(x * s, y * s, 0)));
    },
    { c: C.blue, w: 3, fill: C.blue, fillOp: 0.16 },
  );
  const A = stg.frame({
    o: o0,
    R: M.I(),
    len: L,
    cols: [C.navy, C.navy, C.red],
    names: ["X_A", "Y_A", "Z_A"],
    w: 7,
    px: 38,
  });
  const B = stg.frame({
    o: o0,
    R: Rfn,
    len: L,
    cols: [C.blue, C.blue, C.red],
    names: ["X_B", "Y_B", "Z_B"],
    w: 7,
    px: 38,
    dx: [44, 44, 44],
    dy: [8, 8, -6],
  });
  return { glow, plate, A, B };
};
const SL = side(st, RL, true),
  SR = side(st2, RR, false);
// tags + divider
const div = K.el(
  "div",
  "",
  "position:absolute;left:958px;top:150px;width:4px;height:680px;background:rgba(11,31,58,.14);border-radius:2px;",
  S.layer,
);
const tL = K.el(
  "div",
  "tag",
  `--c:${C.navy};left:96px;top:170px;direction:rtl;font-size:42px;`,
  S.layer,
);
tL.innerHTML = '<span style="font-family:Inter">XYZ Fixed</span> · محاور ثابتة';
const tR = K.el(
  "div",
  "tag",
  `--c:${C.blue};left:1010px;top:170px;direction:rtl;font-size:42px;`,
  S.layer,
);
tR.innerHTML = '<span style="font-family:Inter">ZYX Euler</span> · محاور بتتحرك';
S.card(0.2, 26.9, "5", "طريقتين، نفس النتيجة", C.purple);
// ---- equation strips ----
const mkStrip = (x, prefix, order, dirIn) => {
  const strip = K.el(
    "div",
    "",
    `position:absolute;left:${x}px;top:700px;display:flex;align-items:center;direction:ltr;gap:6px;`,
    S.layer,
  );
  const pf = K.el("div", "", "", strip);
  pf.appendChild(K.tex(prefix, 44, C.navy));
  const names = { z: "R_z(\\alpha)", y: "R_y(\\beta)", x: "R_x(\\gamma)" };
  const slots = ["z", "y", "x"].map((a) => {
    const s = K.el(
      "div",
      "",
      "position:relative;width:196px;height:96px;display:flex;align-items:center;justify-content:center;",
      strip,
    );
    const chip = K.el(
      "div",
      "",
      "display:flex;align-items:center;justify-content:center;border-radius:16px;padding:6px 10px;",
      s,
    );
    chip.appendChild(K.tex(names[a], 48, C.purple));
    const bdg = K.el(
      "div",
      "",
      "position:absolute;top:-6px;left:4px;width:42px;height:42px;border-radius:21px;background:#FFC21A;color:#0B1F3A;font:800 30px Inter;display:flex;align-items:center;justify-content:center;",
      s,
    );
    bdg.textContent = String(order[a]);
    tl.fromTo(s, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
    return { s, chip, a };
  });
  return { strip, slots, pf };
};
const LS = mkStrip(96, "{}^{A}_{B}R_{F}=", { x: 1, y: 2, z: 3 }),
  RS = mkStrip(1010, "{}^{A}_{B}R_{E}=", { z: 1, y: 2, x: 3 });
tl.fromTo([LS.pf, RS.pf], { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.4);
// ---- three steps ----
const B0 = 1.6,
  PITCH = 5.2;
const idxL = [0, 1, 2],
  idxR = [2, 1, 0]; // slot index in each strip: left builds x,y,z (slots 2,1,0), right builds z,y,x (0,1,2)
const slotL = [2, 1, 0],
  slotR = [0, 1, 2];
const angTex = [
  "\\gamma=" + ang.gamma + "^\\circ",
  "\\beta=" + ang.beta + "^\\circ",
  "\\alpha=" + ang.alpha + "^\\circ",
];
const angTexR = [
  "\\alpha=" + ang.alpha + "^\\circ",
  "\\beta=" + ang.beta + "^\\circ",
  "\\gamma=" + ang.gamma + "^\\circ",
];
const mkAng = (x, tx) => {
  const e = K.el("div", "tag", `--c:${C.purple};left:${x}px;top:170px;font-family:Inter;`, S.layer);
  e.appendChild(K.tex(tx, 40, C.navy));
  tl.fromTo(e, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
  return e;
};
for (let i = 0; i < 3; i++) {
  const b = B0 + i * PITCH,
    aL = mkAng(600, angTex[i]),
    aR = mkAng(1545, angTexR[i]);
  [aL, aR].forEach((e) => {
    tl.to(e, { opacity: 1, y: 0, duration: 0.25, ease: "power4.out" }, b);
    tl.to(e, { opacity: 0, duration: 0.25, ease: "none" }, b + PITCH - 0.4);
  });
  S.sfx("pop", b, 0.8);
  tl.to(SL.glow[i], { op: 0.55, duration: 0.25, ease: "none" }, b);
  tl.to(SL.glow[i], { op: 0, duration: 0.25, ease: "none" }, b + 2.5);
  tl.to(SR.glow[2 - i], { op: 0.55, duration: 0.25, ease: "none" }, b);
  tl.to(SR.glow[2 - i], { op: 0, duration: 0.25, ease: "none" }, b + 2.5);
  tl.fromTo(sL[i], { v: 0 }, { v: 1, duration: 1.4, ease: "power2.inOut" }, b + 0.8);
  tl.fromTo(sR[i], { v: 0 }, { v: 1, duration: 1.4, ease: "power2.inOut" }, b + 0.8);
  S.sfx("servo", b + 0.8, 0.5, 1.4);
  const tIn = b + 2.7;
  const sl = LS.slots[slotL[i]],
    sr = RS.slots[slotR[i]];
  tl.fromTo(
    sl.s,
    { opacity: 0, x: -150 },
    { opacity: 1, x: 0, duration: 0.4, ease: "power4.out" },
    tIn,
  );
  tl.fromTo(
    sr.s,
    { opacity: 0, x: 150 },
    { opacity: 1, x: 0, duration: 0.4, ease: "power4.out" },
    tIn,
  );
  S.sfx("click", tIn, 0.9);
  S.glow(sl.chip, tIn + 0.3, tIn + 1.0);
  S.glow(sr.chip, tIn + 0.3, tIn + 1.0);
}
// ---- merge: both frames land on one spot, equations merge ----
const MT = B0 + 3 * PITCH + 0.2; // 17.4
tl.to(st.cam, { cx: 960, duration: 2.2, ease: "power3.inOut" }, MT);
tl.to(st2.cam, { cx: 960, duration: 2.2, ease: "power3.inOut" }, MT);
S.sfx("whoosh", MT, 0.6);
tl.to([div, tL, tR], { opacity: 0, duration: 0.4, ease: "none" }, MT);
tl.to([LS.strip, RS.strip], { opacity: 0, y: 40, duration: 0.4, ease: "power4.in" }, MT + 1.5);
const fin = K.el(
  "div",
  "panel",
  `left:150px;top:690px;width:1620px;height:170px;border-color:${C.gold};display:flex;align-items:center;justify-content:center;`,
  S.layer,
);
fin.appendChild(
  K.tex(
    "{}^{A}_{B}R_{F_{XYZ}}(\\gamma,\\beta,\\alpha)={}^{A}_{B}R_{E_{ZYX}}(\\alpha,\\beta,\\gamma)",
    70,
    C.navy,
  ),
);
tl.fromTo(
  fin,
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 0.4, ease: "power4.out" },
  MT + 2.1,
);
S.sfx("sparkle", MT + 2.1, 0.8);
const zero = K.el("div", "tag", `--c:${C.green};left:96px;top:170px;font-family:Inter;`, S.layer);
zero.appendChild(K.tex("\\Delta=0^\\circ", 44, C.navy));
tl.fromTo(
  zero,
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" },
  MT + 2.3,
);
S.check(380, 160, MT + 2.7);

S.cap(0.3, 1.5, ["نفس", "الزوايا", "بطريقتين"]);
S.cap(1.8, 6.5, ["يسار:", "حول", { m: "X_A" }, "الثابت", "— يمين:", "حول", { m: "Z_B" }]);
S.cap(7.0, 11.7, ["يسار:", "حول", { m: "Y_A" }, "— يمين:", "حول", { m: "Y_B" }, "الجديد"]);
S.cap(12.2, 16.9, ["يسار:", "حول", { m: "Z_A" }, "— يمين:", "حول", { m: "X_B" }]);
S.cap(17.4, 20.0, ["الجديد", "يلزق", "يسار", "أو", "يمين"]);
S.cap(20.2, 24.0, ["النتيجة:", "نفس", "المصفوفة", "بالضبط!"]);
S.cap(24.2, 26.7, ["نفس", "الاتجاه", "بالفراغ"]);
S.finish();
