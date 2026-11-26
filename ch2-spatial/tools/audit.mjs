/* eslint-disable no-unused-vars */
// Independent numeric audit of the maths shown in the video (reads the same DATA the scenes use).
import fs from "node:fs";
import vm from "node:vm";
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL("../assets/data.js", import.meta.url), "utf8"), ctx);
const D = ctx.window.DATA,
  r = D.D2R,
  ok = (n, c) => console.log(c ? "PASS" : "FAIL", n);
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e,
  T = (m) => D.T3(m);
const th = 0.7,
  Rz = D.Rz(th),
  Rx = D.Rx(th),
  Ry = D.Ry(th),
  s = Math.sin(th),
  c = Math.cos(th);
// 1. matrix signs
ok("Rx: (2,3)=-s (3,2)=+s", near(Rx[5], -s) && near(Rx[7], s));
ok("Ry: (1,3)=+s (3,1)=-s", near(Ry[2], s) && near(Ry[6], -s));
ok("Rz: (1,2)=-s (2,1)=+s", near(Rz[1], -s) && near(Rz[3], s));
// right-hand rule: +theta about +axis takes a->b : x->y (z), y->z (x), z->x (y)
const mv = D.mv;
const e = (i) => [0, 1, 2].map((k) => (k === i ? 1 : 0));
ok("RHR z: x->y", near(mv(Rz, e(0))[1], s) && near(mv(Rz, e(0))[0], c));
ok("RHR x: y->z", near(mv(Rx, e(1))[2], s));
ok("RHR y: z->x", near(mv(Ry, e(2))[0], s));
// 2. fixed XYZ vs Euler ZYX
const a = D.ang.alpha * r,
  b = D.ang.beta * r,
  g = D.ang.gamma * r;
const F = D.mul(D.mul(D.Rz(a), D.Ry(b)), D.Rx(g)); // Rz(a)Ry(b)Rx(g)
// physically: fixed = Rz(a)*Ry(b)*Rx(g) applied about fixed axes ; Euler ZYX built by successive right-multiplication gives the same product
let E = D.Rz(a);
E = D.mul(E, D.Ry(b));
E = D.mul(E, D.Rx(g));
let Fx = D.Rx(g);
Fx = D.mul(D.Ry(b), Fx);
Fx = D.mul(D.Rz(a), Fx);
ok(
  "fixed(left-build) == euler(right-build)",
  F.every((v, i) => near(v, E[i]) && near(v, Fx[i])),
);
ok(
  "Rfinal == product",
  D.Rfinal.every((v, i) => near(v, F[i])),
);
ok(
  "orthonormal R^T R = I",
  D.mul(T(F), F).every((v, i) => near(v, i % 4 === 0 ? 1 : 0)),
);
// 3. gimbal lock beta=90
const al = 0.6,
  ga = 0.35,
  G = D.mul(D.mul(D.Rz(al), D.Ry(Math.PI / 2)), D.Rx(ga)),
  sd = Math.sin(al - ga),
  cd = Math.cos(al - ga);
const exp = [0, -sd, cd, 0, cd, sd, -1, 0, 0];
ok(
  "beta=90 reduces to (alpha-gamma) form",
  G.every((v, i) => near(v, exp[i], 1e-9)),
);
const G0 = D.mul(D.mul(D.Rz(0), D.Ry(Math.PI / 2)), D.Rx(ga));
ok(
  "alpha=0: row1=[0,sin g,cos g] row2=[0,cos g,-sin g]",
  near(G0[1], Math.sin(ga)) &&
    near(G0[2], Math.cos(ga)) &&
    near(G0[4], Math.cos(ga)) &&
    near(G0[5], -Math.sin(ga)),
);
ok("gamma = atan2(r12, r22)", near(Math.atan2(G0[1], G0[4]), ga));
ok("X_B = -Z_A at beta=90 (column 1)", near(G[0], 0) && near(G[3], 0) && near(G[6], -1));
// 4. homogeneous inverse
const T4 = (R, p) => [
  [R[0], R[1], R[2], p[0]],
  [R[3], R[4], R[5], p[1]],
  [R[6], R[7], R[8], p[2]],
  [0, 0, 0, 1],
];
const m4 = (A, B) =>
  A.map((row, i) => B[0].map((_, j) => row.reduce((s2, _, k) => s2 + A[i][k] * B[k][j], 0)));
const p = [1.2, -0.7, 2.1],
  Tm = T4(F, p),
  Rt = T(F),
  nRp = mv(Rt, p).map((v) => -v),
  Ti = T4(Rt, nRp);
ok(
  "T^-1 = [R^T | -R^T p]",
  m4(Tm, Ti).every((row, i) => row.every((v, j) => near(v, i === j ? 1 : 0))),
);
const wrong = T4(
  Rt,
  p.map((v) => -v),
);
ok(
  "[R^T | -p] is NOT the inverse (the trap)",
  !m4(Tm, wrong).every((row, i) => row.every((v, j) => near(v, i === j ? 1 : 0, 1e-6))),
);
ok(
  "T^-1 != T^T",
  !m4(
    Tm,
    [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => Tm[j][i])),
  ).every((row, i) => row.every((v, j) => near(v, i === j ? 1 : 0, 1e-6))),
);
// 5. loop: B_C T = (U_B T)^-1 U_A T A_D T (C_D T)^-1 with random frames
const rnd = (k) => {
  const R = D.mul(D.mul(D.Rz(k), D.Ry(k * 0.7)), D.Rx(k * 1.3));
  return T4(R, [k, -k * 0.5, k * 0.3]);
};
const inv = (M) => {
  const R = [M[0][0], M[0][1], M[0][2], M[1][0], M[1][1], M[1][2], M[2][0], M[2][1], M[2][2]],
    p = [M[0][3], M[1][3], M[2][3]];
  const Rt2 = T(R);
  return T4(
    Rt2,
    mv(Rt2, p).map((v) => -v),
  );
};
const UB = rnd(0.4),
  BC = rnd(0.9),
  CD = rnd(0.55),
  UA = (() => m4(m4(UB, BC), CD))(); // choose U_A A_D = U_B B_C C_D with A_D = I
const AD = rnd(0); // identity-ish (k=0)
const solved = m4(m4(m4(inv(UB), UA), AD), inv(CD));
ok(
  "loop solution equals B_C T",
  solved.every((row, i) => row.every((v, j) => near(v, BC[i][j], 1e-9))),
);
// 6. worked example 2.16
const ex = D.ex;
console.log("   Ap =", ex.Ap.join(", "), " (book: 12.046, 7.9860, 7.4738)");
ok("Example 2.16 x=12.046", near(ex.Ap[0], 12.046, 5e-4));
ok("y=7.986", near(ex.Ap[1], 7.986, 5e-4));
ok("z=7.4738", near(ex.Ap[2], 7.4738, 5e-4));
const w78 = 0.866 * 6 + 0.5 * 7.8 + 3;
console.log(
  "   if z were 7.8 (claimed typo): x would be",
  w78.toFixed(3),
  "-> book prints 12.046 = value with 7.7",
);
