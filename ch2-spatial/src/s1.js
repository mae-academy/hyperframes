/* eslint-disable no-unused-vars */
const { V, M, add, sub, mul } = HF3D,
  D = DATA,
  C = D.C,
  D2R = D.D2R;
const S = K.scene("s1", {
  cam: { a: 35, e: 26, d: 9, tx: 0.35, ty: 0.3, tz: 0.55, cx: 560, cy: 520 },
});
const st = S.st,
  tl = S.tl,
  P1 = V(...D.s1.P1),
  TH = D.s1.theta;
const fl = st.floor({ n: 5 });
S.seam({ noIn: false });

// ---- frame {A}: built axis by axis ----
const A = st.frame({
  o: V(0, 0, 0),
  R: M.I(),
  len: 1.9,
  cols: [C.navy, C.navy, C.red],
  names: ["X_A", "Y_A", "Z_A"],
  w: 7,
});
[0, 1, 2].forEach((j) => {
  const seg = A.parts[j * 2],
    lab = A.parts[j * 2 + 1],
    t = 0.25 + j * 0.4;
  tl.fromTo(seg, { prog: 0 }, { prog: 1, duration: 0.42, ease: "power3.out" }, t);
  tl.fromTo(lab, { op: 0 }, { op: 1, duration: 0.2, ease: "none" }, t + 0.3);
  S.sfx("pop", t + 0.3, 0.6);
});
const org = st.label(V(0, 0, 0), "\\{A\\}", { c: C.navy, px: 42, dx: -52, dy: 30, op: 0 });
tl.fromTo(org, { op: 0 }, { op: 1, duration: 0.2, ease: "none" }, 0.2);

// ---- shared UI ----
const pn = S.panel(1100, 150, 724, 700, C.purple);
tl.fromTo(pn, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, 2.3);

const axes = [
  {
    n: "x",
    fn: M.x,
    perp: [1, 2],
    inv: 0,
    view: { a: 90, e: 6, d: 8.6, tx: 0.2, ty: 0.3, tz: 0.55 },
    tex: "R_x(\\theta)",
    name: ["مصفوفة دوران حول", "X"],
    head: "{}^{A}P_2 = R_x(\\theta)\\,{}^{A}P_1",
    eq: [
      "x_2 = x_1",
      "y_2 = y_1\\cos\\theta - z_1\\sin\\theta",
      "z_2 = y_1\\sin\\theta + z_1\\cos\\theta",
    ],
    M: [
      ["1", "0", "0"],
      ["0", "\\cos\\theta", "-\\sin\\theta"],
      ["0", "\\sin\\theta", "\\cos\\theta"],
    ],
    dir: 1,
    card: ["2", "دوران حول X"],
  },
  {
    n: "y",
    fn: M.y,
    perp: [2, 0],
    inv: 1,
    view: { a: 0, e: 6, d: 8.6, tx: 0.5, ty: 0.3, tz: 0.55 },
    tex: "R_y(\\theta)",
    name: ["مصفوفة دوران حول", "Y"],
    head: "{}^{A}P_2 = R_y(\\theta)\\,{}^{A}P_1",
    eq: [
      "\\phi \\quad\\to\\quad \\phi - \\theta",
      "x_2 = x_1\\cos\\theta + z_1\\sin\\theta",
      "z_2 = -x_1\\sin\\theta + z_1\\cos\\theta",
    ],
    M: [
      ["\\cos\\theta", "0", "\\sin\\theta"],
      ["0", "1", "0"],
      ["-\\sin\\theta", "0", "\\cos\\theta"],
    ],
    dir: -1,
    card: ["3", "دوران حول Y"],
  },
];
axes.unshift({
  n: "z",
  fn: M.z,
  perp: [0, 1],
  inv: 2,
  view: { a: 0, e: 72, d: 8.2, tx: 0.5, ty: 0.55, tz: 0 },
  tex: "R_z(\\theta)",
  name: ["مصفوفة دوران حول", "Z"],
  head: "{}^{A}P_2 = R_z(\\theta)\\,{}^{A}P_1",
  eq: [
    "x_2 = x_1\\cos\\theta - y_1\\sin\\theta",
    "y_2 = x_1\\sin\\theta + y_1\\cos\\theta",
    "z_2 = z_1",
  ],
  M: [
    ["\\cos\\theta", "-\\sin\\theta", "0"],
    ["\\sin\\theta", "\\cos\\theta", "0"],
    ["0", "0", "1"],
  ],
  dir: 1,
  card: ["1", "دوران حول Z"],
});

const comp = (v, k) => [v.x, v.y, v.z][k],
  vec = (a, b, c) => V(a, b, c);
function phase(ax, i) {
  const p0 = i * 7,
    G = { op: 0 },
    rot = { th: 0 },
    k = () => G.op,
    Rt = () => ax.fn(ax.dir * rot.th * D2R) && ax.fn(rot.th * D2R);
  const Pc = () => M.mv(ax.fn(rot.th * D2R), P1);
  // positive theta about +Z/+X is CCW face-on; about +Y it is CW face-on: right-hand rule gives the sign, nothing else
  const col = (v, a) => {
    const s = [0, 0, 0];
    s[a] = comp(v, a);
    return vec(...s);
  };
  const foot = (v) => {
    const s = [0, 0, 0];
    ax.perp.forEach((q) => (s[q] = comp(v, q)));
    return vec(...s);
  };
  const only = (v, q) => {
    const s = [0, 0, 0];
    s[q] = comp(v, q);
    return vec(...s);
  };
  const proj = (getP, op) => {
    const dc = C.ink2,
      o = { c: dc, w: 4, dash: true, k };
    st.seg(getP, () => foot(getP()), o);
    st.seg(
      () => foot(getP()),
      () => only(getP(), ax.perp[0]),
      o,
    );
    st.seg(
      () => foot(getP()),
      () => only(getP(), ax.perp[1]),
      o,
    );
  };
  const axisPt = () => {
    const s = [0, 0, 0];
    s[[2, 0, 1][["x", "y", "z"].indexOf(ax.n)] === undefined ? 0 : 0] = 0;
    const a = ["x", "y", "z"].indexOf(ax.n);
    s[a] = comp(P1, a);
    return vec(...s);
  };
  const items = [];
  // radius (axis point -> P1) and arc
  items.push(st.seg(axisPt, () => P1, { c: C.orange, w: 4, dash: true, k }));
  items.push(st.dot(() => P1, { r: 11, c: "#F7B27A", k }));
  items.push(st.dot(Pc, { r: 16, c: C.orange, k }));
  proj(Pc);
  const arc = st.path(
    () => {
      const out = [];
      const n = 40;
      for (let q = 0; q <= n; q++) out.push(M.mv(ax.fn(((rot.th * q) / n) * D2R), P1));
      return out;
    },
    { c: C.purple, w: 8, head: true, k: () => k() * Math.min(1, rot.th / 4) },
  );
  const rl = st.label(() => lerpv(axisPt(), P1, 0.5), "R", {
    c: C.orange,
    px: 42,
    dx: -10,
    dy: -30,
    k,
  });
  const l1 = st.label(() => P1, "{}^{A}P_{1}", { c: C.orange, px: 38, dx: -8, dy: -40, k });
  const l2 = st.label(Pc, "{}^{A}P_{2}", {
    c: C.orange,
    px: 38,
    dx: 14,
    dy: -42,
    k: () => k() * Math.min(1, rot.th / 10),
  });
  const geo = ax.n === "y" ? "-\\theta" : "+\\theta";
  const lt = st.label(() => M.mv(ax.fn(rot.th * 0.55 * D2R), P1), geo, {
    c: C.purple,
    px: 46,
    dx: ax.n === "z" ? 40 : ax.n === "x" ? -56 : 84,
    dy: ax.n === "z" ? 4 : ax.n === "x" ? -30 : 10,
    k: () => k() * Math.min(1, rot.th / 8),
  });
  // ---- panel content ----
  const box = K.el("div", "pc", "position:absolute;inset:0;", pn);
  const head = K.el("div", "", "position:absolute;left:36px;top:36px;", box);
  head.appendChild(K.tex(ax.head, 48, C.navy));
  const rows = ax.eq.map((t, q) => {
    const d = K.el("div", "", `position:absolute;left:36px;top:${150 + q * 104}px;`, box);
    d.appendChild(K.tex(t, 46, q === 0 && ax.n === "y" ? C.purple : C.navy));
    return d;
  });
  const V2 = K.mx([["x_2"], ["y_2"], ["z_2"]], { px: 36, cw: 74, rh: 64, c: C.orange }),
    V1 = K.mx([["x_1"], ["y_1"], ["z_1"]], { px: 36, cw: 74, rh: 64, c: C.orange });
  const RM = K.mx(ax.M, { px: 36, cw: 112, rh: 64, c: C.purple });
  const eqn = K.row([V2.el, K.tex("=", 40, C.navy), RM.el, V1.el], "gap:14px;");
  const mwrap = K.el("div", "", "position:absolute;left:12px;top:250px;", box);
  mwrap.appendChild(eqn);
  const nm = K.el(
    "div",
    "tag",
    `--c:${C.purple};left:46px;top:570px;direction:rtl;font-size:46px;`,
    box,
  );
  nm.appendChild(document.createTextNode(ax.name[0] + " "));
  nm.appendChild(K.tex(ax.name[1], 38, C.red));
  // keep Z red only for Z axis wording; X/Y names in navy
  if (ax.n !== "z") nm.lastChild.style.color = C.navy;
  const inv = (i2, j2) => i2 === ax.inv || j2 === ax.inv;
  // ---- timeline ----
  tl.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }, p0 + 0.3);
  tl.fromTo(mwrap, { opacity: 0, y: 30 }, { opacity: 0, y: 30, duration: 0.01 }, p0 + 0.3);
  tl.fromTo(nm, { opacity: 0 }, { opacity: 0, duration: 0.01 }, p0 + 0.3);
  S.card(p0 + 0.2, p0 + 7 - 0.1 + (i === 2 ? 0 : 0), ax.card[0], ax.card[1], C.purple);
  tl.fromTo(G, { op: 0 }, { op: 1, duration: 0.3, ease: "none" }, p0 + (i === 0 ? 1.4 : 0.9));
  S.sfx("pop", p0 + (i === 0 ? 1.4 : 0.9), 0.8);
  if (i === 0) S.cam(ax.view, p0 + 1.5, 2.0);
  const cnt = K.el("div", "cnt", "left:96px;top:160px;", S.layer);
  cnt.innerHTML = '<span>&theta;</span><span>=</span><span class="v">0</span><span>&deg;</span>';
  const cv = cnt.querySelector(".v");
  tl.fromTo(cnt, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "none" }, p0 + 2.6);
  tl.to(cnt, { opacity: 0, duration: 0.3, ease: "none" }, p0 + 6.7);
  // rotation
  tl.fromTo(rot, { th: 0 }, { th: TH, duration: 1.5, ease: "power2.inOut" }, p0 + 3.1);
  S.sfx("servo", p0 + 3.1, 0.55, 1.5);
  S.counter(cv, 0, TH, p0 + 3.1, p0 + 4.6, (v) => String(Math.round(v)));
  rows.forEach((r, q) => S.pop(r, p0 + 3.0 + q * 0.4, null, { dy: 18, sfx: "tick", vol: 0.6 }));
  S.check(480, 88, p0 + 5.1, { out: p0 + 6.7 });
  // morph equations -> matrix
  tl.to(rows, { opacity: 0, y: -34, duration: 0.35, ease: "power4.in" }, p0 + 5.3);
  tl.to(mwrap, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, p0 + 5.5);
  S.sfx("whoosh", p0 + 5.3, 0.4);
  // highlight invariant row & column (or the -sin for Y)
  const hl = [];
  RM.cells.forEach((r, i2) =>
    r.forEach((c, j2) => {
      if (ax.n === "y" ? i2 === 2 && j2 === 0 : inv(i2, j2)) hl.push(c);
    }),
  );
  hl.forEach((c, q) => S.glow(c, p0 + 6.0 + q * 0.03, p0 + 6.78));
  tl.to(nm, { opacity: 1, duration: 0.25 }, p0 + 5.6);
  S.sfx("click", p0 + 6.0, 0.8);
  // fade phase out
  if (i < 2) {
    tl.to(G, { op: 0, duration: 0.3, ease: "none" }, p0 + 6.7);
    tl.to(box, { opacity: 0, duration: 0.3, ease: "none" }, p0 + 6.7);
    S.cam(axes[i + 1].view, p0 + 6.2, 3.0);
  }
  return G;
}
function lerpv(a, b, t) {
  return add(a, mul(sub(b, a), t));
}
axes.forEach((a, i) => phase(a, i));
tl.to(fl, { op: 0.4, duration: 1.5, ease: "power2.inOut" }, 8.2);

// ---- captions (Arabic, simple, Jordanian tone) ----
S.cap(0.4, 2.8, ["عنا", "نقطة", "بالفراغ"]);
S.cap(3.0, 5.0, ["بنلفها", "حول", "محور", { m: "Z", c: C.red }]);
S.cap(5.2, 6.85, [{ m: "z", c: C.orange }, "ما", "بتتغير"]);
S.cap(7.3, 9.5, ["هسا", "حول", "محور", { m: "X" }]);
S.cap(9.8, 12.4, ["أول", "صف", "وأول", "عمود", "ثابتين"]);
S.cap(14.3, 16.8, ["حول", "محور", { m: "Y" }, "بيلف", "مع", "عقارب", "الساعة"]);
S.cap(17.1, 19.3, ["عشان", "هيك", { m: "-\\sin\\theta" }, "نزل", "تحت"]);
S.cap(19.5, 20.7, ["الاتجاه", "بيحدد", "الإشارة"]);
S.finish();
