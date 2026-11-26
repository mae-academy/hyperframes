// ===== chapter 3: flow =====
const K = D.k, PI = Math.PI, ST = COL.steel, SD = COL.steelD, GD = COL.gold, TL = COL.teal, OR = COL.orange, GR = COL.green, BL = COL.blue, PU = COL.purple, NV = COL.navy, GL = COL.glass;
const LIQ = mix(NV, GL, 0.45);
const SENS = {};
// pipe built from frustum sections [x0,x1,r0,r1]; glass wall + flanges
function pipeSections(secs, o = 1) { for (const [a, b, r0, r1] of secs) cone("x", [(a + b) / 2, 0, 0], b - a, r0, r1, GL, o, { glass: true, n: 22 }); }
function tube(x, z0, z1, r, level, col, o = 1) { glassCyl("z", [x, 0, (z0 + z1) / 2], z1 - z0, r, o); if (level > z0 + 0.02) cyl("z", [x, 0, (z0 + level) / 2], level - z0, r * 0.82, col, o * 0.9, { n: 12 }); }
const flowArrow = (x0, Q, r = 0) => arw([x0, -2.2, r], [x0 + 0.5 + 0.28 * Q, -2.2, r], OR, 8);
// ---- differential-pressure meters (orifice / nozzle / venturi) share one builder ----
const DPK = { orifice: { Cd: K.dp.kinds.orifice.Cd, loss: K.dp.kinds.orifice.loss }, nozzle: { Cd: K.dp.kinds.nozzle.Cd, loss: K.dp.kinds.nozzle.loss }, venturi: { Cd: K.dp.kinds.venturi.Cd, loss: K.dp.kinds.venturi.loss } };
const dpOf = (kind, Q) => { const a = (PI / 4) * 0.05 * 0.05, A = (PI / 4) * 0.1 * 0.1, v = (Q * 1e-3) / (DPK[kind].Cd * a); return (0.5 * K.dp.rho * Math.pow(v * Math.sqrt(1 - Math.pow(a / A, 2)), 2)) / 1000; };
function dpSensor(kind, ymax) {
  const secs = kind === "orifice" ? [[-7, 7, 1.5, 1.5]] : kind === "nozzle" ? [[-7, -1.5, 1.5, 1.5], [-1.5, 0.3, 1.5, 0.75], [0.3, 1.5, 0.75, 0.75], [1.5, 7, 1.5, 1.5]] : [[-7, -2.8, 1.5, 1.5], [-2.8, -0.5, 1.5, 0.75], [-0.5, 0.5, 0.75, 0.75], [0.5, 4.5, 0.75, 1.5], [4.5, 7, 1.5, 1.5]];
  const rf = (x) => kind === "orifice" ? (x < -0.3 ? 1.5 : x < 1.2 ? lerp(1.5, 0.6, smoothstepX(-0.3, 1.2, x)) : lerp(0.6, 1.5, smoothstepX(1.2, 5.5, x))) : kind === "nozzle" ? (x < -1.5 ? 1.5 : x < 0.3 ? lerp(1.5, 0.75, smoothstepX(-1.5, 0.3, x)) : x < 1.5 ? 0.75 : 1.5 - 0.0 * x) : (x < -2.8 ? 1.5 : x < -0.5 ? lerp(1.5, 0.75, smoothstepX(-2.8, -0.5, x)) : x < 0.5 ? 0.75 : x < 4.5 ? lerp(0.75, 1.5, smoothstepX(0.5, 4.5, x)) : 1.5);
  const xt = kind === "venturi" ? 0 : 0.9, ymaxp = ymax;
  return {
    view: { yaw: -0.42, pitch: 0.22, dist: 25, tx: 1.5, tz: 1.8 }, p: [0, 8, 10], q: [0, 1], x: [0, 10], y: [0, ymax], ns: 60,
    out: (Q) => dpOf(kind, Q),
    kb: [{ c: [0, 0, 0], s: [14, 3, 3], col: GL }, { c: [xt, 0, 0], s: [0.5, 1.5, 1.5], col: GD }],
    build(Q, q, S) {
      shadow([0, 0, -1], 8, 2.6); box([0, 0, -1.55], [15, 3.2, 0.2], SD);
      pipeSections(secs); for (const x of [-7, 7]) pipeFlange(x, 1.5);
      for (const x of [-4, 0, 4]) box([x, 0, -1.05], [0.5, 2.4, 1.0], SD);
      if (kind === "orifice") { for (const [c, s] of [[[0, 0, 1.12], [0.22, 3.2, 0.76]], [[0, 0, -1.12], [0.22, 3.2, 0.76]], [[0, 1.12, 0], [0.22, 0.76, 1.5]], [[0, -1.12, 0], [0.22, 0.76, 1.5]]]) box(c, s, GD); }
      streams(-7, 7, rf, Q * 0.5, 1, 5);
      const dp = dpOf(kind, Q) / ymaxp, hU = 2.6, hT = hU - 2.2 * dp, hD = hU - 2.2 * dp * DPK[kind].loss, top = 5.2;
      tube(-3.2, 1.45, top, 0.2, 1.45 + hU, LIQ); tube(xt, kind === "venturi" ? 0.75 : 1.45, top, 0.2, 1.45 + hT, LIQ); tube(5.6, 1.45, top, 0.2, 1.45 + hD, LIQ, q);
      ln([[-3.2, 0, 1.45 + hU], [xt, 0, 1.45 + hU]], NV, 3, 0.5, "8 8");
      if (q > 0.02) { ln([[5.6, 0, 1.45 + hU], [5.6, 0, 1.45 + hD]], PU, 5, q); arw([6.3, 0, 1.45 + hU], [6.3, 0, 1.45 + hD + 0.02], PU, 8, q); }
      flowArrow(-8.8, Q); outBar(9.4, dpOf(kind, Q) / ymaxp, 1, -0.9, 3.4);
    },
    lab: [["P1", () => [-3.2, 0, 5.8]], ["P2", () => [xt, 0, 5.8]], ["Q", (Q) => [-8.8 + 0.3 + 0.14 * Q, -2.2, 0.9]], ["dP", (Q) => [9.4, 0, -0.9 + 3.4 * (dpOf(kind, Q) / ymaxp) + 0.7]]],
  };
}
const smoothstepX = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
SENS.ori = dpSensor("orifice", 35); SENS.noz = dpSensor("nozzle", 16); SENS.ven = dpSensor("venturi", 14);
// 15 solid flow ----------------------------------------------------------------
SENS.sol = {
  view: { yaw: -0.4, pitch: 0.3, dist: 20, tx: 0.8, tz: 0.3 }, p: [0, 1.6, 1.6], q: [25, 40], x: [0, 2], y: [0, 66], ns: 40,
  out: (R, W) => (W * R) / K.solid.L, phase: true,
  kb: [{ c: [0, 0, -0.4], s: [12, 3, 0.35], col: NV }, { c: [0, 0, -0.9], s: [2, 2.4, 0.6], col: GD }],
  build(R, W, S) {
    const ph = S.ph * 1.4; shadow([0, 0, -1], 7, 2.6);
    for (const x of [-5, 5]) box([x, 0, -1.1], [0.5, 3.4, 0.8], SD); box([0, 0, -1.55], [13, 3.4, 0.2], SD);
    box([0, 0, -0.45], [12, 2.8, 0.3], NV);
    for (const x of [-6, 6]) cyl("y", [x, 0, -0.45], 3.0, 0.5, ST);
    box([0, 0, -0.95], [2.0, 2.4, 0.5], GD); cyl("z", [0, 0, -1.3], 0.4, 0.5, SD);
    ring("x", [0, 0, 0], 0.01, TL, 4, 0); ln([[-1, -1.7, -0.7], [1, -1.7, -0.7]], NV, 5); ln([[-1, -1.7, -0.9], [-1, -1.7, -0.5]], NV, 4); ln([[1, -1.7, -0.9], [1, -1.7, -0.5]], NV, 4);
    const layers = W / 25;
    for (let i = 0; i < 44; i++) { const sx = seeded(i + 1), sy = seeded(i + 51), x = (((sx * 11.4 + ph) % 11.4) + 11.4) % 11.4 - 5.7; box([x, (sy - 0.5) * 2.2, -0.15], [0.34, 0.34, 0.3], i % 3 ? mix(OR, GD, 0.5) : GD); if (layers > 1.05 && i % 2) box([x, (sy - 0.5) * 2.2, 0.15 + 0.1 * (layers - 1)], [0.34, 0.34, 0.3], mix(OR, GD, 0.3)); }
    arw([-7.8, 0, 0.2], [-7.8 + 0.4 + 2 * R, 0, 0.2], OR, 8);
    outBar(8.8, (W * R) / K.solid.L / 66, 1, -0.9, 3.4);
  },
  lab: [["R", (R) => [-7.8 + 0.2 + R, 0, 1.0]], ["W", () => [0, 0, 1.2]], ["L", () => [0, -1.7, -1.3]], ["Q", (R, W) => [8.8, 0, -0.9 + 3.4 * ((W * R) / K.solid.L / 66) + 0.7]]],
};
// 19 pitot tube --------------------------------------------------------------------
const pitDP = (v) => (0.5 * K.pitot.rho * Math.pow(v / K.pitot.Cv, 2));
SENS.pit = {
  view: { yaw: -0.4, pitch: 0.22, dist: 22, tx: -0.2, tz: 1.8 }, p: [0, 30, 40], x: [0, 40], y: [0, 1000], ns: 40,
  out: pitDP, kb: [{ c: [0, 0, 0], s: [12, 3.6, 3.6], col: GL }, { c: [-1, 0, 0], s: [1.8, 0.4, 0.4], col: GD }],
  build(v) {
    shadow([0, 0, -1], 7, 2.6); box([0, 0, -1.9], [13, 3.4, 0.2], SD);
    pipeSections([[-7, 6, 1.8, 1.8]]); pipeFlange(-7, 1.8); pipeFlange(6, 1.8);
    const rf = (x) => 1.8 - 1.3 * Math.exp(-((x + 1.9) * (x + 1.9)) / 0.9) * 0 ;
    for (const f of [-0.8, -0.4, 0.4, 0.8]) { const pts = []; for (let i = 0; i <= 30; i++) { const x = lerp(-7, 6, i / 30), bump = Math.abs(f) < 0.5 ? 0.0 : 0; const dz = f * 1.8 + (Math.abs(f) < 0.5 ? Math.sign(f) * 0.55 * Math.exp(-((x + 1.9) ** 2) / 1.6) : 0); pts.push([x, 0, dz]); } ln(pts, TL, 4, 1, "16 14", -v * 0.05, -0.5); }
    ln((() => { const pts = []; for (let i = 0; i <= 12; i++) pts.push([lerp(-7, -2.2, i / 12), 0, 0]); return pts; })(), TL, 4, 1, "16 14", -v * 0.05, -0.5);
    cyl("x", [-0.95, 0, 0], 1.9, 0.2, GD); cyl("z", [0, 0, 1.9], 3.8, 0.2, GD); dot([-1.95, 0, 0], 0.2, OR);
    const base = 2.0, hP = base + 2.3 * (pitDP(v) / 1000), hS = base;
    tube(0, 1.8, 5.8, 0.24, 1.8 + hP - 0.3, LIQ); tube(2.6, 1.7, 5.8, 0.24, 1.8 + hS - 0.3, LIQ); cyl("z", [2.6, 0, 1.8], 0.4, 0.2, GD);
    ln([[0, 0, 1.8 + hP - 0.3], [2.6, 0, 1.8 + hP - 0.3]], NV, 3, 0.5, "8 8"); arw([3.4, 0, 1.8 + hP - 0.28], [3.4, 0, 1.8 + hS - 0.3 + 0.02], PU, 8, 1);
    flowArrow(-8.8, v / 3); outBar(8.4, pitDP(v) / 1000, 1, -0.9, 3.4);
  },
  lab: [["P2", () => [0, 0, 6.3]], ["P1", () => [2.6, 0, 6.3]], ["v", (v) => [-8.8 + 0.4 + 0.1 * v, -2.2, 0.8]], ["dP", (v) => [8.4, 0, -0.9 + 3.4 * (pitDP(v) / 1000) + 0.7]]],
};
// 20 rotameter -------------------------------------------------------------------------
const rotH = (Q) => 6 + 4.5 * Q;
SENS.rot = {
  view: { yaw: -0.4, pitch: 0.16, dist: 20, tx: 1.2, tz: 2.0 }, p: [0, 6, 9.5], x: [0, 10], y: [0, 55],
  out: rotH, kb: [{ c: [0, 0, 2.5], s: [3, 3, 7], col: GL }, { c: [0, 0, 1.5], s: [1.2, 1.2, 1.6], col: GD }],
  build(Q, q, S) {
    const z0 = -1.0, Lt = 7.4; shadow([0, 0, -1], 3, 3); box([0, 0, -1.3], [4, 4, 0.4], SD);
    cone("z", [0, 0, z0 + Lt / 2], Lt, 0.8, 1.7, GL, 1, { glass: true, n: 26 }); cyl("z", [0, 0, z0 - 0.25], 0.5, 1.0, ST); cyl("z", [0, 0, z0 + Lt + 0.25], 0.5, 1.9, ST);
    for (let i = 1; i < 8; i++) ln([[1.1 + 0.05 * i, -1.2, z0 + i], [1.5 + 0.05 * i, -1.2, z0 + i]], NV, 3, 0.45);
    const h = (rotH(Q) / 55) * 6.0 + 0.5, zf = z0 + h, rr = lerp(0.8, 1.7, h / Lt) * 0.55;
    cyl("z", [0, 0, zf], 0.55, rr, GD); cone("z", [0, 0, zf - 0.55], 0.55, rr * 0.3, rr, GD); cone("z", [0, 0, zf + 0.5], 0.4, rr, rr * 0.5, GD);
    const q2 = Math.min(1, Q / 4);
    for (const f of [-0.6, 0.6]) { const pts = []; for (let i = 0; i <= 20; i++) { const z = lerp(z0 - 0.3, z0 + Lt, i / 20); pts.push([lerp(0, 1, 0) + f * lerp(0.8, 1.7, (z - z0) / Lt) * 0.95, 0, z]); } ln(pts, TL, 4, 1, "16 14", Q * 0.5, -0.5); }
    const fl = 1.5 + 0.0 * Q; arw([-1.9, 0, zf], [-1.9, 0, zf + fl], OR, 9); arw([-2.5, 0, zf], [-2.5, 0, zf - fl], NV, 9);
    arw([1.9, -1.3, z0 - 1.0], [1.9, -1.3, z0 - 0.1 + 0.2 * Q * 0.1], OR, 7);
    outBar(5.6, rotH(Q) / 55, 1, -0.9, 3.4);
  },
  lab: [["Fup", (Q) => [-1.9, 0, -1.0 + (rotH(Q) / 55) * 6.0 + 0.5 + 2.3]], ["Fdn", (Q) => [-2.5, 0, -1.0 + (rotH(Q) / 55) * 6.0 + 0.5 - 1.8]], ["Q", () => [1.9, -1.3, -0.4]], ["h", (Q) => [5.6, 0, -0.9 + 3.4 * (rotH(Q) / 55) + 0.7]]],
};
// 21 ultrasonic (transit time) ----------------------------------------------------------
const ultDt = (v) => { const c = 1480, d = K.ultra.d, al = (K.ultra.alpha * PI) / 180, Lp = d / Math.sin(al), vc = v * Math.cos(al); return (Lp / (c - vc) - Lp / (c + vc)) * 1e9; };
SENS.ult = {
  view: { yaw: -0.4, pitch: 0.2, dist: 21, tx: 0.2, tz: 0.6 }, p: [0, 3, 5], x: [0, 5], y: [0, 480], ns: 40,
  out: ultDt, kb: [{ c: [0, 0, 0], s: [13, 3.4, 3.4], col: GL }, { c: [2.5, 0, -1.9], s: [0.9, 0.9, 0.6], col: GD }],
  build(v, q, S) {
    shadow([0, 0, -1], 7, 2.6); box([0, 0, -1.9], [14, 3.4, 0.2], SD);
    pipeSections([[-7, 7, 1.6, 1.6]]); pipeFlange(-7, 1.6); pipeFlange(7, 1.6);
    const A = [-2.5, 0, 1.95], B = [2.5, 0, 1.95], C = [-2.5, 0, -1.95], Dd = [2.5, 0, -1.95];
    for (const [p, c] of [[A, GD], [B, GD], [C, NV], [Dd, NV]]) box([p[0], 0, p[2] + (p[2] > 0 ? 0.2 : -0.2)], [0.9, 0.9, 0.5], c);
    ln([A, Dd], TL, 4, 0.7, "12 10"); ln([B, C], TL, 4, 0.7, "12 10");
    const tt = (S.t * 0.7) % 1.9, fa = clamp(tt / 1.0), fb = clamp(tt / (1.0 + 0.5 * v / 5 + 0.1));
    const lerp3 = (a, b, f) => [0, 1, 2].map((j) => lerp(a[j], b[j], f)); if (fa < 1) dot(lerp3(A, Dd, fa), 0.2, GD, 1); if (fb < 1) dot(lerp3(B, C, fb), 0.2, mix(GD, NV, 0.5), 1);
    streams(-7, 7, () => 1.5, v * 0.9, 1, 3); flowArrow(-8.8, v * 1.4);
    outBar(8.8, ultDt(v) / 480, 1, -0.9, 3.4);
  },
  lab: [["tAD", () => [2.5, 0, -2.6]], ["tBC", () => [2.5, 0, 3.0]], ["v", (v) => [-8.8 + 0.4 + 0.2 * v, -2.2, 0.8]], ["dt", (v) => [8.8, 0, -0.9 + 3.4 * (ultDt(v) / 480) + 0.7]]],
};
// 22 drag-force ------------------------------------------------------------------------------
const dragF = (v) => 0.5 * K.drag.Cd * K.drag.rho * v * v * K.drag.A;
SENS.drg = {
  view: { yaw: -0.42, pitch: 0.22, dist: 21, tx: 0.8, tz: 0.6 }, p: [0, 4, 5], x: [0, 5], y: [0, 31], ns: 40,
  out: dragF, kb: [{ c: [0, 0, 0], s: [13, 3.4, 3.4], col: GL }, { c: [0, 0, 0], s: [0.3, 1.8, 1.8], col: GD }],
  build(v) {
    const F = dragF(v), ang = 0.32 * (F / 31); shadow([0, 0, -1], 7, 2.6); box([0, 0, -1.9], [14, 3.4, 0.2], SD);
    pipeSections([[-7, 7, 1.7, 1.7]]); pipeFlange(-7, 1.7); pipeFlange(7, 1.7);
    box([0, 0, 1.95], [1.2, 1.0, 0.5], SD);
    const piv = [0, 0, 1.7]; box([0, 0, 0.5], [0.3, 0.5, 2.4], ST, 1, ["y", -ang, piv]);
    const pc = rotP([0, 0, -0.55], "y", -ang, piv); cyl("x", [pc[0], 0, pc[2]], 0.18, 0.95, GD);
    box([0, -0.1, 1.45], [0.34, 0.54, 0.4], mix(COL.white, OR, clamp(F / 31)), 1, ["y", -ang * 0.2, piv]); ln([[0.2, -0.3, 1.9], [0.8, -0.3, 2.6], [8, -0.3, 2.6]], NV, 4);
    for (const f of [-1.2, -0.7, 0.7, 1.2]) { const pts = []; for (let i = 0; i <= 30; i++) { const x = lerp(-7, 7, i / 30); pts.push([x, 0, f + (Math.abs(f) < 1 ? Math.sign(f) * 0.5 * Math.exp(-((x + 0.3) ** 2) / 1.2) : 0) - 0.55 * 0]); } ln(pts, TL, 4, 1, "16 14", -v * 0.6, -0.5); }
    arw([pc[0] + 0.6, -1.8, pc[2]], [pc[0] + 0.6 + 0.3 + 0.15 * F, -1.8, pc[2]], OR, 8); flowArrow(-8.8, v * 1.4);
    outBar(9.4, F / 31, 1, -0.9, 3.4);
  },
  lab: [["Fd", (v) => [0.9 + 0.1 * dragF(v), -1.8, -0.3]], ["v", (v) => [-8.8 + 0.4 + 0.2 * v, -2.2, 0.8]], ["F", (v) => [9.4, 0, -0.9 + 3.4 * (dragF(v) / 31) + 0.7]]],
};
// 23 turbine --------------------------------------------------------------------------------------
SENS.trb = {
  view: { yaw: -0.42, pitch: 0.22, dist: 21, tx: 0.8, tz: 0.8 }, p: [0, 8, 10], x: [0, 10], y: [0, 1300], ns: 30, phase: true,
  out: (Q) => K.turb.K * Q, kb: [{ c: [0, 0, 0], s: [13, 3.6, 3.6], col: GL }, { c: [0, 0, 0], s: [0.8, 1.6, 1.6], col: GD }],
  build(Q, q, S) {
    const a = S.ph * 1.1; shadow([0, 0, -1], 7, 2.6); box([0, 0, -1.9], [14, 3.4, 0.2], SD);
    pipeSections([[-7, 7, 1.7, 1.7]]); pipeFlange(-7, 1.7); pipeFlange(7, 1.7);
    cyl("x", [0, 0, 0], 1.2, 0.42, GD); cone("x", [-0.8, 0, 0], 0.6, 0.12, 0.42, GD);
    for (let i = 0; i < 6; i++) { const ph = a + (i * PI) / 3; box([0, 0, 0.95], [0.2, 0.5, 1.0], i === 0 ? mix(GD, OR, 0.5) : GD, 1, ["x", ph, [0, 0, 0]]); }
    const tip = rotP([0, 0, 1.45], "x", a, [0, 0, 0]); dot([tip[0], tip[1], tip[2]], 0.17, NV);
    cyl("z", [0, 0, 2.2], 1.0, 0.45, SD); box([0, 0, 2.9], [1.0, 0.8, 0.5], BL);
    const lit = Math.cos(a - PI / 2 + PI / 2) > 0.93 ? 1 : 0; ln([[0.5, 0, 2.9], [3.5, 0, 2.9], [3.5, 0, 1.3]], NV, 4);
    box([4.6, 0, 1.3], [1.2, 1.0, 1.2], lit ? GR : SD);
    for (const f of [-1.0, 1.0]) { const pts = []; for (let i = 0; i <= 28; i++) pts.push([lerp(-7, 7, i / 28), 0, f]); ln(pts, TL, 4, 0.7, "16 14", -Q * 0.5, -0.5); }
    flowArrow(-8.8, Q); outBar(9.2, (K.turb.K * Q) / 1300, 1, -0.9, 3.4);
  },
  lab: [["Q", (Q) => [-8.8 + 0.3 + 0.14 * Q, -2.2, 0.8]], ["f", (Q) => [9.2, 0, -0.9 + 3.4 * ((K.turb.K * Q) / 1300) + 0.7]]],
};
// 24 laser Doppler anemometer -------------------------------------------------------------------------
const ldaF = (v) => (2 * v * Math.sin(((K.lda.theta / 2) * PI) / 180)) / (K.lda.lam * 1e-6) / 1e6;
SENS.lda = {
  view: { yaw: -0.5, pitch: 0.26, dist: 22, tx: 0.4, tz: 0.4 }, p: [0, 4, 5], q: [1, 0], x: [0, 5], y: [0, 3], ns: 40, phase: true,
  out: (v, q) => ldaF(v) * clamp(q * 2.5),
  kb: [{ c: [0, 0, 0], s: [14, 3.4, 3.4], col: GL }, { c: [0, 0, 0], s: [1.2, 0.6, 0.6], col: TL }],
  build(v, q, S) {
    shadow([0, 0, -1], 7, 4); box([0, 0, -1.9], [14, 7, 0.2], SD);
    box([0, 0, 0], [14, 3.4, 3.4], mix(GL, TL, 0.3), 0.2); for (const [c, s] of [[[0, 0, 1.7], [14, 3.4, 0.06]], [[0, 0, -1.7], [14, 3.4, 0.06]], [[0, 1.7, 0], [14, 0.06, 3.4]]]) box(c, s, GL, 0.3);
    const ph = S.ph * 1.2, n = Math.round(30 * clamp(q));
    for (let i = 0; i < n; i++) { const x = (((seeded(i + 3) * 14 + ph) % 14) + 14) % 14 - 7, y = (seeded(i + 80) - 0.5) * 2.6, z = (seeded(i + 160) - 0.5) * 2.6; const near = Math.abs(x) < 0.6 && Math.abs(y) < 0.6 && Math.abs(z) < 0.6; dot([x, y, z], near ? 0.16 : 0.1, near ? GD : NV); }
    box([-1.8, -5.4, 0], [1.4, 1.2, 1.0], GD); cyl("y", [-1.8, -4.4, 0], 0.5, 0.45, GL);
    for (const sx of [-1.4, 1.4]) { ln([[-1.8, -4.1, 0], [sx * 0.5, -1.8, 0], [0, 0, 0]], TL, 5, 1); }
    cyl("y", [0, -3.1, 0], 0.3, 1.2, GL, 0.5);
    for (let i = -3; i <= 3; i++) ln([[i * 0.17, -0.5, -0.5], [i * 0.17, -0.5, 0.5]], mix(TL, NV, 0.3), 3, 0.9);
    box([0, 4.8, 0], [1.2, 1.0, 1.0], NV); for (const dz of [-0.5, 0.5]) ln([[0, 0, 0], [0, 4.2, dz]], TL, 3, 0.45 * clamp(q), "8 8");
    arw([-7.8, -2.1, 1.3], [-7.8 + 0.4 + 0.5 * v, -2.1, 1.3], OR, 8);
    outBar(9.0, ldaF(v) / 3 * clamp(q * 2.5), 1, -0.9, 3.4);
  },
  lab: [["v", (v) => [-7.8 + 0.3 + 0.3 * v, -2.1, 2.1]], ["fD", (v, q) => [9.0, 0, -0.9 + 3.4 * (ldaF(v) / 3 * clamp(q * 2.5)) + 0.7]], ["th", () => [0, -2.6, 0.5]]],
};
// 25 hot-wire anemometer ---------------------------------------------------------------------------------------
const hotE = (v) => Math.sqrt(K.hot.A + K.hot.B * Math.sqrt(v));
SENS.hot = {
  view: { yaw: -0.4, pitch: 0.2, dist: 21, tx: 1.6, tz: 0.5 }, p: [0, 30, 38], x: [0, 38], y: [0, 3.2], ns: 60,
  out: hotE, kb: [{ c: [-3, 0, 0], s: [6, 1, 1], col: ST }, { c: [0, 0, 0], s: [0.2, 2, 0.2], col: OR }],
  build(v) {
    shadow([0, 0, -1], 7, 2.6); box([0, 0, -1.25], [15, 3.4, 0.3], SD);
    cyl("x", [-3.6, 0, 0], 5.2, 0.55, ST); cone("x", [-0.6, 0, 0], 0.7, 0.55, 0.3, ST);
    for (const y of [-1.0, 1.0]) cone("x", [0.0, y, 0], 0.9, 0.22, 0.1, GD);
    const cool = clamp(v / 38), col = mix(COL.red, "#FFE2B0", cool * 0.8);
    ln([[0.5, -1.0, 0], [0.5, 1.0, 0]], col, 8, 1); dot([0.5, 0, 0], 0.0, col, 0);
    for (let k = 0; k < 4; k++) { const pts = []; for (let i = 0; i <= 24; i++) pts.push([lerp(-7, 6, i / 24), -1.5 + k * 1.0, (k % 2 ? 0.3 : -0.3) + (Math.abs(-1.5 + k) < 1.2 ? 0 : 0)]); ln(pts, TL, 4, 0.8, "16 14", -v * 0.07, -0.5); }
    // Wheatstone bridge (wire = one arm)
    const N = [[8.2, 0, 3.0], [10.0, 0, 1.4], [8.2, 0, -0.2], [6.4, 0, 1.4]];
    for (const [a, b, i] of [[0, 1, 0], [1, 2, 1], [3, 2, 2], [0, 3, 3]]) { const A = N[a], B = N[b], c = [(A[0] + B[0]) / 2, 0, (A[2] + B[2]) / 2]; ln([A, B], NV, 4, 0.5); box(c, [1.0, 0.6, 0.45], i === 3 ? mix(COL.red, OR, 0.5) : SD, 1, ["y", Math.atan2(A[2] - B[2], B[0] - A[0])]); }
    arw([-8.8, -2.2, 0], [-8.8 + 0.5 + 0.1 * v, -2.2, 0], OR, 8);
    outBar(12.0, hotE(v) / 3.2, 1, -0.9, 3.4);
  },
  lab: [["v", (v) => [-8.8 + 0.3 + 0.05 * v, -2.2, 0.9]], ["Rw", () => [0.5, 0, 1.2]], ["Vm", (v) => [12.0, 0, -0.9 + 3.4 * (hotE(v) / 3.2) + 0.7]]],
};
// 26 electromagnetic flow meter ----------------------------------------------------------------------------------------
const emE = (v) => K.em.B * (K.em.D * 1e-3) * v * 1000;
SENS.emf = {
  view: { yaw: -0.55, pitch: 0.24, dist: 21, tx: 1.0, tz: 0.8 }, p: [0, 4, -4], x: [-5, 5], y: [-26, 26], ns: 30, phase: true,
  out: emE, kb: [{ c: [0, 0, 0], s: [13, 3.6, 3.6], col: GL }, { c: [0, 0, 2.7], s: [2.4, 2.4, 0.9], col: BL }],
  build(v, q, S) {
    const ph = S.ph * 1.0; shadow([0, 0, -1], 7, 2.6); box([0, 0, -1.9], [14, 3.4, 0.2], SD);
    pipeSections([[-7, 7, 1.7, 1.7]]); pipeFlange(-7, 1.7); pipeFlange(7, 1.7);
    for (const z of [2.7, -2.7]) { box([0, 0, z], [3.0, 2.8, 0.9], BL); for (let i = 0; i < 4; i++) ring("z", [0, 0, z + (i - 1.5) * 0.18], 1.5, mix(BL, "#fff", 0.35), 3, 1); }
    for (const x of [-0.9, 0, 0.9]) arw([x, 0, 2.2], [x, 0, -2.1], TL, 6, 0.9);
    for (const sg of [-1, 1]) { cyl("y", [0, sg * 1.78, 0], 0.5, 0.26, GD); ln([[0, sg * 2.0, 0], [0, sg * 2.5, 0], [4.8, sg * 2.5, 0], [4.8, sg * 1.2, 1.6]], NV, 4, 0.8); }
    const k = clamp(Math.abs(v) / 4), dir = Math.sign(v) || 1;
    for (let i = 0; i < 14; i++) { const x = (((seeded(i + 5) * 13 + dir * ph) % 13) + 13) % 13 - 6.5, z = (seeded(i + 60) - 0.5) * 2.2; dot([x, (seeded(i + 30) - 0.5) * 0.8 + 1.1 * k, z], 0.13, OR, 1); dot([x + 0.35, (seeded(i + 30) - 0.5) * 0.8 - 1.1 * k, z], 0.13, NV, 1); }
    arw(v >= 0 ? [-8.8, -2.2, 0] : [-6.8, -2.2, 0], v >= 0 ? [-8.8 + 0.5 + 0.5 * v, -2.2, 0] : [-6.8 - 0.5 + 0.5 * v, -2.2, 0], OR, 8);
    biBar(7.6, emE(v) / 26, 1, 0.9, 2.2);
  },
  lab: [["v", (v) => [-8.2 + 0.2 * v, -2.2, 0.9]], ["e", (v) => [7.6, 0, 0.9 + 2.2 * Math.max(0, emE(v) / 26) + 0.8]], ["B", () => [0, 0, 4.2]]],
};
