/* eslint-disable no-unused-vars */
const D = DATA,
  C = D.C,
  ex = D.ex,
  f = D.fmt;
const S = K.scene("example", {});
const tl = S.tl;
S.seam();
S.card(0.2, 16.8, "12", "مثال 2.16", C.gold);
const abs = (css, parent) => K.el("div", "", "position:absolute;" + css, parent || S.layer);
const hide = (e) => tl.fromTo(e, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
// ---- given ----
const g = abs("left:96px;top:150px;display:flex;gap:26px;direction:ltr;align-items:center;");
const gv = [
  ["{}^{B}P=\\begin{bmatrix}6\\\\2.8\\\\7.7\\end{bmatrix}", C.orange],
  ["{}^{A}P_{BORG}=\\begin{bmatrix}3\\\\8.6\\\\2.9\\end{bmatrix}", C.green],
  ["R_x(45^\\circ)\\to R_y(30^\\circ)", C.purple],
];
gv.forEach(([t, c], i) => {
  const p = K.el(
    "div",
    "panel",
    `position:relative;border-color:${c};padding:12px 26px;border-width:7px;display:flex;align-items:center;`,
    g,
  );
  p.appendChild(K.tex(t, 48, C.navy));
  S.pop(p, 0.4 + i * 0.5, 2.7);
});
// ---- R = Rx(45) Ry(30): Euler, so the same order as performed ----
const Rcells = [0, 1, 2].map((i) => [0, 1, 2].map((j) => ({ t: f(ex.R[i * 3 + j]), c: C.purple })));
const Rm = K.mx(Rcells, { px: 38, cw: 140, rh: 64, c: C.purple });
const rb = abs("left:96px;top:130px;display:flex;align-items:center;gap:20px;direction:ltr;");
rb.appendChild(K.tex("R=R_x(45^\\circ)\\,R_y(30^\\circ)=", 46, C.navy));
rb.appendChild(Rm.el);
S.pop(rb, 2.9, 4.8);
// ---- T | B P | = | A P ----
const px = 30,
  Tc = [0, 1, 2].map((i) => [...Rcells[i], { t: f(ex.org[i]), c: C.green }]);
Tc.push([{ t: "0" }, { t: "0" }, { t: "0" }, { t: "1" }]);
const Tm = K.mx(Tc, { px, cw: 118, rh: 68, c: C.navy });
const Bv = K.mx([...ex.Bp.map((v) => [{ t: f(v), c: C.orange }]), [{ t: "1" }]], {
  px,
  cw: 90,
  rh: 68,
  c: C.orange,
});
const Av = K.mx(
  [["?"], ["?"], ["?"], ["1"]].map((r) => r.map((t) => ({ t, c: C.orange }))),
  { px, cw: 112, rh: 68, c: C.orange },
);
const big = abs("left:96px;top:340px;display:flex;align-items:center;gap:14px;direction:ltr;");
const tl1 = K.el("div", "", "position:absolute;left:60px;top:-70px;", big);
tl1.appendChild(K.tex("{}^{A}_{B}T", 46, C.navy));
big.appendChild(Tm.el);
big.appendChild(Bv.el);
big.appendChild(K.tex("=", 44, C.navy));
big.appendChild(Av.el);
tl.fromTo(big, { opacity: 0, y: 30 }, { opacity: 0, y: 30, duration: 0.01 }, 0);
tl.to(big, { opacity: 1, y: 0, duration: 0.4, ease: "power4.out" }, 5.0);
S.sfx("pop", 5.0, 0.8);
Tm.cells.forEach((r, i) =>
  r.forEach((c, j) => {
    if (j === 3 && i < 3) S.glow(c, 5.5, 6.4);
    if (i === 3) S.glow(c, 5.8, 6.4);
  }),
);
S.sfx("click", 5.5, 0.8);
// ---- table, filled row by row ----
const rowH = 104,
  tb = abs("left:992px;top:330px;width:832px;height:" + 3 * rowH + "px;");
const names = ["x", "y", "z"],
  rowsDom = [],
  valEl = [];
for (let i = 0; i < 3; i++) {
  const r = ex.rows[i],
    parts = [0, 1, 2].map((j) => f(ex.R[i * 3 + j]) + "\\cdot" + f(ex.Bp[j]));
  const tx = parts.join("+") + "+" + f(ex.org[i]);
  const d = K.el(
    "div",
    "",
    `position:absolute;left:0;top:${i * rowH}px;width:832px;height:${rowH - 10}px;border:5px solid ${C.gold};border-radius:16px;background:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 18px;direction:ltr;box-shadow:0 8px 24px rgba(11,31,58,.10);`,
    tb,
  );
  const a = K.el("div", "", "", d);
  a.appendChild(K.tex(tx, 33, C.navy));
  const b = K.el("div", "", "", d);
  b.appendChild(K.tex(names[i] + "_A=" + f(r.val), 38, C.green));
  hide(d);
  rowsDom.push(d);
}
const T0 = 7.0,
  PI = 2.7;
for (let i = 0; i < 3; i++) {
  const t = T0 + i * PI;
  Tm.cells[i].forEach((c) => S.glow(c, t, t + 1.7));
  Bv.cells.forEach((r) => S.glow(r[0], t, t + 1.7));
  tl.fromTo(
    rowsDom[i],
    { opacity: 0, x: 60 },
    { opacity: 1, x: 0, duration: 0.35, ease: "power4.out" },
    t + 0.35,
  );
  S.sfx("pop", t + 0.35, 0.7);
  // the value lands in A P: swap the '?' for the number
  const cell = Av.cells[i][0],
    q = cell.firstChild,
    v = K.tex(f(ex.rows[i].val), 34, C.orange);
  v.style.position = "absolute";
  cell.style.position = "relative";
  cell.appendChild(v);
  tl.fromTo(v, { opacity: 0 }, { opacity: 0, duration: 0.01 }, 0);
  tl.to(q, { opacity: 0, duration: 0.15 }, t + 1.4);
  tl.to(v, { opacity: 1, duration: 0.2, ease: "power4.out" }, t + 1.45);
  S.glow(cell, t + 1.45, t + 2.4);
  S.sfx("click", t + 1.45, 0.9);
}
// final answer
const fin = K.el(
  "div",
  "panel",
  `left:340px;top:690px;width:1240px;height:150px;border-color:${C.gold};display:flex;align-items:center;justify-content:center;gap:20px;border-width:7px;`,
  S.layer,
);
fin.appendChild(
  K.tex("{}^{A}P=\\begin{bmatrix}" + ex.Ap.map(f).join("\\\\") + "\\end{bmatrix}", 44, C.navy),
);
tl.fromTo(fin, { opacity: 0, y: 30 }, { opacity: 0, y: 30, duration: 0.01 }, 0);
tl.to(fin, { opacity: 1, y: 0, duration: 0.4, ease: "power4.out" }, 15.3);
S.sfx("sparkle", 15.3, 0.8);
S.check(1620, 700, 15.6);
S.cap(0.4, 2.7, ["معطيات", "المثال"]);
S.cap(2.9, 4.8, ["أويلر", "= بنفس", "ترتيب", "الدوران"]);
S.cap(5.0, 6.9, ["نركّب", { m: "{}^{A}_{B}T" }]);
S.cap(7.1, 15.1, ["صف", "صف", "— نملأ", "الجدول"]);
S.cap(15.4, 16.7, ["هيك", "طلع", "الموقع", "بـ", { m: "\\{A\\}" }]);
S.finish();
