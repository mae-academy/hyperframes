/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul, len } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R;
const S = K.scene("hook", {
  cam: { a: 28, e: 24, d: 12.5, tx: 0.7, ty: 0.3, tz: 1.0, cx: 960, cy: 500 },
});
const st = S.st,
  tl = S.tl;
S.seam({ noIn: true });
st.floor({ n: 6 });
tl.to(st.cam, { a: 46, duration: 7, ease: "none" }, 0); // slow orbit while building

// ---- the arm: base, column, two links (teal), head (gold) ----
const STEEL = "#8FA3BD",
  TEAL = C.teal,
  GOLD = C.gold;
const Sh = V(0, 0, 1.45),
  E = V(1.5, 0.5, 2.0),
  W = V(2.4, 1.3, 1.25);
const frameAlong = (a, b) => {
  const x = mul(sub(b, a), 1 / len(sub(b, a)));
  let y = V(-x.y, x.x, 0);
  y = mul(y, 1 / (len(y) || 1));
  const z = V(x.y * y.z - x.z * y.y, x.z * y.x - x.x * y.z, x.x * y.y - x.y * y.x);
  return [x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z];
};
const link = (a, b, th, col) =>
  st.box(mul(add(a, b), 0.5), frameAlong(a, b), [len(sub(b, a)), th, th], col, { op: 0 });
const parts = [
  st.box(V(0, 0, 0.12), M.I(), [1.6, 1.6, 0.24], STEEL, { op: 0 }),
  st.box(V(0, 0, 0.84), M.I(), [0.5, 0.5, 1.2], STEEL, { op: 0 }),
  link(Sh, E, 0.36, TEAL),
  link(E, W, 0.32, TEAL),
];
const RH = M.mul(M.mul(M.z(0.6), M.y(0.75)), M.x(0.35)),
  Hc = add(W, M.mv(RH, V(0.3, 0, 0)));
parts.push(st.box(Hc, RH, [0.7, 0.62, 0.5], GOLD, { op: 0 }));
parts.forEach((p, i) => {
  tl.fromTo(p, { op: 0 }, { op: 1, duration: 0.25, ease: "none" }, 0.15 + i * 0.3);
  S.sfx("pop", 0.15 + i * 0.3, 0.7);
});

// ---- frame {A} on the floor, vector to the head ----
const Ao = V(-1.7, -1.3, 0);
const A = st.frame({
  o: Ao,
  R: M.I(),
  len: 1.5,
  cols: [C.navy, C.navy, C.red],
  names: ["X_A", "Y_A", "Z_A"],
  w: 7,
  op: 0,
});
tl.fromTo(A, { op: 0 }, { op: 1, duration: 0.4, ease: "none" }, 1.9);
S.sfx("pop", 1.9, 0.7);
const org = st.label(Ao, "\\{A\\}", { c: C.navy, px: 44, dx: -48, dy: 30, op: 0 });
tl.fromTo(org, { op: 0 }, { op: 1, duration: 0.2, ease: "none" }, 2.0);
const vec = st.seg(Ao, Hc, { c: C.green, w: 8, head: true, op: 0 });
tl.fromTo(vec, { prog: 0, op: 1 }, { prog: 1, duration: 0.8, ease: "power3.out" }, 3.3);
S.sfx("whoosh", 3.3, 0.4);
// ---- frame {B} on the head ----
const B = st.frame({
  o: Hc,
  R: RH,
  len: 1.1,
  cols: [C.blue, C.blue, C.red],
  names: ["X_B", "Y_B", "Z_B"],
  w: 7,
  op: 0,
});
tl.fromTo(B, { op: 0 }, { op: 1, duration: 0.4, ease: "none" }, 4.2);
S.sfx("pop", 4.2, 0.7);

// ---- HTML tags pinned to 3D points ----
const q1 = K.el("div", "tag", `--c:${C.green};direction:rtl;font-size:52px;`, S.layer);
q1.textContent = "وين؟";
S.anchor(q1, () => lerp3(Ao, Hc, 0.5), -80, -120);
const q2 = K.el("div", "tag", `--c:${C.blue};direction:rtl;font-size:52px;`, S.layer);
q2.textContent = "كيف مايل؟";
S.anchor(q2, Hc, 40, -230);
function lerp3(a, b, t) {
  return add(a, mul(sub(b, a), t));
}
tl.fromTo(q1, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power4.out" }, 3.7);
tl.to(q1, { opacity: 0, duration: 0.3, ease: "none" }, 4.9);
tl.fromTo(q2, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power4.out" }, 4.5);
tl.to(q2, { opacity: 0, duration: 0.3, ease: "none" }, 5.6);
// the answer teaser
const ans = K.el(
  "div",
  "panel",
  `left:1330px;top:150px;width:490px;height:190px;border-color:${C.blue};display:flex;align-items:center;justify-content:center;`,
  S.layer,
);
ans.appendChild(K.tex("{}^{A}_{B}T", 96, C.navy));
tl.fromTo(
  ans,
  { opacity: 0, y: 40 },
  { opacity: 1, y: 0, duration: 0.35, ease: "power4.out" },
  5.5,
);
S.sfx("pop", 5.5, 0.9);

S.cap(0.3, 3.3, ["كيف", "الروبوت", "بيعرف", "وين", "راسه؟"]);
S.cap(3.4, 5.3, ["وكيف", "هو", "مايل؟"]);
S.cap(5.5, 6.85, ["الجواب:", "مصفوفة", "وحدة"]);
S.finish();
