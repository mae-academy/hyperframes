// ===== chapter 2: force, tactile, vibration =====
const K = D.k, PI = Math.PI, ST = COL.steel, SD = COL.steelD, GD = COL.gold, TL = COL.teal, OR = COL.orange, GR = COL.green, BL = COL.blue, PU = COL.purple, NV = COL.navy, GL = COL.glass;
const SENS = {};
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// bending beam made of rotated boxes: defl(u) -> z offset (u in 0..1), x from x0 length L
function beamSegs(x0, L, w, th, defl, col, z0 = 0.4, n = 12) {
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, um = (u0 + u1) / 2, xa = x0 + L * u0, xb = x0 + L * u1, za = defl(u0), zb = defl(u1);
    const ang = Math.atan2(za - zb, xb - xa);
    box([(xa + xb) / 2, 0, z0 + defl(um)], [L / n + 0.08, w, th], col, 1, ["y", ang]);
  }
}
const beamTop = (x0, L, defl, th, z0, u) => z0 + defl(u) + th / 2 + 0.03;
// 10 unbonded strain gauge -----------------------------------------------------
SENS.unb = {
  view: { yaw: -0.4, pitch: 0.26, dist: 19, tx: 1.8, tz: 0.9 }, p: [0, 40, -50], x: [-50, 50], y: [-0.45, 0.45],
  out: (x) => (100 * K.unb.Gf * x * 1e-3) / K.unb.L0,
  kb: [{ c: [-3.2, 0, 0.5], s: [1.2, 3, 3], col: ST }, { c: [3.2, 0, 0.5], s: [1.2, 3, 3], col: GD }],
  build(x) {
    const xu = x / 12; shadow([0, 0, -0.5], 6, 2.8); box([0, 0, -1.2], [11, 3.6, 0.4], SD);
    box([-3.2, 0, 0.5], [1.2, 3, 3], ST); box([3.4 + xu, 0, 0.5], [1.2, 3, 3], GD);
    box([3.4 + xu, 0, -0.9], [1.6, 1.6, 0.5], SD);
    for (const [zz, sg] of [[1.5, 1], [-0.5, -1]]) for (const y of [-0.9, 0.9]) {
      const a = [-2.6, y, zz], b = [2.8 + xu, y, zz], st = sg * xu, pts = [];
      cyl("x", [-2.6, y, zz], 0.5, 0.16, GD); cyl("x", [2.8 + xu, y, zz], 0.5, 0.16, GD);
      for (let i = 0; i <= 14; i++) { const t = i / 14, sag = st < 0 ? Math.min(0.9, -st * 1.6) * 4 * t * (1 - t) : 0; pts.push([lerp(a[0], b[0], t), y, zz - sag]); }
      ln(pts, st > 0.05 ? OR : NV, st > 0.05 ? 5 : 6, 1);
    }
    arw([3.4 + xu, -1.9, 2.4], [3.4 + xu + (x >= 0 ? 1.4 : -1.4) * Math.min(1, Math.abs(x) / 8), -1.9, 2.4], OR, 7);
    biBar(7.6, (100 * K.unb.Gf * x * 1e-3) / K.unb.L0 / 0.45, 1, 0.5, 2.0);
  },
  lab: [["x", (x) => [3.4 + x / 12, -1.9, 3.1]], ["dR", (x) => [7.6, 0, 0.5 + 2.0 * Math.max(0, (100 * K.unb.Gf * x * 1e-3) / K.unb.L0 / 0.45) + 0.8]]],
};
// 11 bonded strain gauge + Wheatstone bridge --------------------------------------
const bonOut = (F, q) => 1000 * ((K.bon.Gf * K.bon.epsPerN * F * 1e-6 * K.bon.E) / 4) * q;
SENS.bon = {
  view: { yaw: -0.38, pitch: 0.26, dist: 25, tx: 2.4, tz: 1.5 }, p: [0, 50, 50], q: [1, 4], x: [0, 55], y: [0, 11], ns: 40,
  out: (F, q) => bonOut(F, q),
  kb: [{ c: [-6.6, 0, 0.4], s: [1.6, 3, 3], col: SD }, { c: [-2, 0, 0.4], s: [8, 2, 0.5], col: ST }],
  build(F, q) {
    const x0 = -6, L = 8, th = 0.5, dl = (F / 50) * 1.6, defl = (u) => -dl * u * u, eps = (F / 50);
    shadow([-1, 0, -0.5], 6, 2.6); box([-1, 0, -1.2], [11, 3.4, 0.4], SD); box([-6.6, 0, 0.1], [1.4, 3, 2.6], SD);
    beamSegs(x0, L, 2.2, th, defl, ST, 0.4);
    box([-4.4, 0, beamTop(x0, L, defl, th, 0.4, 0.2) + 0.03], [2.4, 1.7, 0.06], COL.white);
    const gp = []; for (let i = 0; i <= 14; i++) { const u = 0.1 + (i / 14) * 0.22, yy = (i % 2 ? 0.55 : -0.55); gp.push([x0 + L * u, yy, beamTop(x0, L, defl, th, 0.4, u) + 0.07]); } ln(gp, mix(NV, OR, clamp(eps * 1.0)), 4, 1);
    arw([2.4, 0, 3.6], [2.4, 0, 0.4 + defl(1) + 0.9], OR, 9);
    // magnified wire: elongates (dL) and thins (dA = Poisson)
    const k = 5 * eps, wl = 2.6 * (1 + k), wr = 0.34 * (1 - 0.3 * k * 1.3);
    cyl("x", [-1.0, 0, 3.4], wl, wr, GD); ln([[-4.2, 0, 1.0], [-2.3, 0, 3.1]], NV, 3, 0.4, "10 8"); ln([[-3.6, 0, 1.0], [0.3, 0, 3.1]], NV, 3, 0.4, "10 8");
    arw([-1.0 + wl / 2 + 0.1, 0, 4.2], [-1.0 + wl / 2 + 0.9, 0, 4.2], OR, 6); arw([-1.0 - wl / 2 - 0.1, 0, 4.2], [-1.0 - wl / 2 - 0.9, 0, 4.2], OR, 6);
    // bridge diamond
    const N = [[7.4, 0, 3.4], [9.6, 0, 1.6], [7.4, 0, -0.2], [5.2, 0, 1.6]], act = [1, q > 1.5 ? 1 : 0, q > 1.5 ? 1 : 0, q > 3 ? 1 : 0];
    const edges = [[0, 1, 0], [1, 2, 1], [3, 2, 2], [0, 3, 3]];
    for (const [a, b, i] of edges) { const A = N[a], B = N[b], c = [(A[0] + B[0]) / 2, 0, (A[2] + B[2]) / 2], ang = Math.atan2(A[2] - B[2], B[0] - A[0]); ln([A, B], NV, 4, 0.5); box(c, [1.1, 0.7, 0.5], act[i] ? OR : SD, 1, ["y", ang]); }
    for (const n of N) dot(n, 0.2, NV);
    box([7.4, 0, 4.6], [1.0, 0.8, 0.7], BL); ln([[7.4, 0, 4.25], [7.4, 0, 3.6]], BL, 4);
    outBar(12.2, bonOut(F, q) / 11, 1, -0.9, 3.4);
  },
  lab: [["F", () => [2.4, 0, 4.2]], ["eps", () => [-1.0, 0, 5.0]], ["V0", (F, q) => [12.2, 0, -0.9 + 3.4 * (bonOut(F, q) / 11) + 0.7]], ["R1", () => [7.4, 0, 3.9]]],
};
// 12 PVDF tactile -------------------------------------------------------------------
const sgN = (p) => smooth(0, 0.35, p) - smooth(0.65, 1, p);
const qOf = (p) => (0.025 * 50 * (sgN(p + 0.002) - sgN(p - 0.002))) / 0.004;
SENS.tac = {
  view: { yaw: -0.3, pitch: 0.3, dist: 17, tx: 0.6, tz: 1.0 }, p: [0, 0.28, 0.5], x: [0, 1], y: [-6.5, 6.5], ns: 160,
  out: (p) => qOf(p), inv: (p) => 50 * sgN(p), sc: (p) => qOf(p), ideal: (p) => 5 * sgN(p),
  kb: [{ c: [0, 0, -0.6], s: [6, 6, 0.8], col: SD }, { c: [0, 0, 2.6], s: [1.6, 1.6, 1.6], col: GD }],
  build(p) {
    const s = sgN(p); shadow([0, 0, -1], 4, 4); box([0, 0, -0.9], [7, 6, 0.6], SD);
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const d2 = (i * i + j * j) / 4, dip = 0.55 * s * Math.exp(-d2 * 1.4); box([i * 1.25, j * 1.0, -0.45 - dip / 2], [1.15, 0.92, 0.3 + dip * 0], mix(GL, TL, 0.4 + 0.4 * s * Math.exp(-d2)), 1); }
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const dip = 0.55 * s * Math.exp(-(i * i + j * j) * 0.35); box([i * 1.25, j * 1.0, -0.22 - dip], [0.9, 0.7, 0.08], GD); }
    const z = 2.0 - 1.35 * s; sph([0, 0, z], 1.15, GD, 1, 7, 12); cyl("z", [0, 0, z + 2.0], 3.2, 0.42, SD); box([0, 0, z + 3.9], [1.2, 1.0, 0.8], NV);
    arw([2.6, -2.2, 2.6], [2.6, -2.2, 2.6 - 1.4 * s - 0.01], OR, 7);
    const q = qOf(p); biBar(6.0, q / 6.5, 1, 0.9, 2.0);
  },
  lab: [["sg", () => [2.6, -2.2, 3.4]], ["q", (p) => [6.0, 0, 0.9 + 2.0 * Math.max(0, qOf(p) / 6.5) + 0.8]]],
};
// 13 piezo accelerometer ---------------------------------------------------------------
const pzOut = (a, q) => K.pz.d * ((K.pz.m * a) / 1000) * (1 + (K.pz.ab - 1) * q);
SENS.pz = {
  view: { yaw: -0.4, pitch: 0.22, dist: 17, tx: 1.6, tz: 1.3 }, p: [0, 800, 800], q: [0, 1], x: [0, 1000], y: [0, 125], ns: 60,
  out: (a, q) => pzOut(a, q),
  kb: [{ c: [0, 0, 1.2], s: [3.4, 3.4, 4.4], col: GL }, { c: [0, 0, 2.6], s: [2.6, 2.6, 1.0], col: GD }],
  build(a, q) {
    const f = a / 1000, sq = 1 - 0.1 * f; shadow([0, 0, -1], 3, 3); cyl("z", [0, 0, -0.8], 0.5, 2.0, SD);
    glassCyl("z", [0, 0, 1.3], 4.0, 1.75, 1);
    const th = 0.6 * sq; for (let i = 0; i < 3; i++) cyl("z", [0, 0, -0.35 + th * (i + 0.5) + i * 0.05], th, 1.25, mix(GL, TL, 0.45), 1);
    const zt = -0.35 + 3 * th + 0.1; cyl("z", [0, 0, zt + 0.6], 1.2, 1.3, GD); cyl("z", [0, 0, zt + 1.5], 0.6, 0.5, ST);
    const on = 0.2 + 0.8 * f;
    for (let i = 0; i < 6; i++) { const ang = (i / 6) * PI * 2, r = 0.75; dot([r * Math.cos(ang), r * Math.sin(ang), zt - 0.02], 0.13, TL, on * (1 - q)); dot([r * Math.cos(ang), r * Math.sin(ang), -0.35 + 0.02], 0.13, NV, on * (1 - q)); }
    for (let i = 0; i < 4; i++) { const yy = -0.7 + i * 0.47; dot([1.27, yy, 0.55], 0.13, TL, on * q); dot([-1.27, yy, 0.55], 0.13, NV, on * q); }
    arw([-2.3, 0, -0.8 - 0.01], [-2.3, 0, -0.8 + 2.2 * f + 0.01], OR, 8);
    ln([[1.75, 0, 1.4], [3.2, 0, 1.4], [3.2, 0, 0.5]], NV, 4);
    outBar(5.0, pzOut(a, q) / 125, 1, -0.9, 3.4);
  },
  lab: [["a", (a) => [-2.3, 0, -0.5 + 2.2 * (a / 1000) + 0.9]], ["Qm", (a, q) => [5.0, 0, -0.9 + 3.4 * (pzOut(a, q) / 125) + 0.7]]],
};
// 14 active vibration control --------------------------------------------------------------
const avcAmp = (g) => 100 / (1 + 4 * g);
SENS.avc = {
  view: { yaw: -0.4, pitch: 0.2, dist: 22, tx: 0.8, tz: 1.0 }, p: [0, 1, 0.2], x: [0, 1.2], y: [0, 100], ns: 60,
  out: (g) => avcAmp(g), kb: [{ c: [-6.6, 0, 0.2], s: [1.6, 3, 3], col: SD }, { c: [-1.5, 0, 0.4], s: [9, 2, 0.5], col: ST }],
  build(g, q, S) {
    const A = (1.5 * avcAmp(g)) / 100, w = 2 * PI * 0.9, ph = Math.sin(w * S.t), x0 = -6, L = 9, th = 0.5, defl = (u) => A * ph * (u * u * (3 - u)) * 0.5 * 1.0;
    shadow([0, 0, -0.5], 7, 2.8); box([0, 0, -1.2], [14, 3.4, 0.4], SD); box([-6.7, 0, 0.1], [1.4, 3, 2.6], SD);
    beamSegs(x0, L, 2.2, th, defl, ST, 0.4);
    const top = (u) => 0.4 + defl(u) + th / 2;
    box([-4.6, 0, top(0.18) + 0.1], [2.2, 1.7, 0.2], g > 0.02 ? GR : GD); box([2.6, 0, top(0.96) + 0.35], [0.9, 0.9, 0.7], NV);
    box([7.2, 0, 0.3], [2.6, 1.8, 1.6], BL);
    const ac = [2.6, 0, top(0.96) + 0.7], co = [7.2, 0, 1.1], at = [-4.6, 0, top(0.18) + 0.2];
    ln([ac, [2.6, 0, 3.4], [7.2, 0, 3.4], [7.2, 0, 1.2]], TL, 5, 1, "16 12", 0.2); ln([[7.2, 0, 1.2], [7.2, 0, 3.4], [-4.6, 0, 3.4], at], TL, 5, g > 0.02 ? 1 : 0.25, "16 12", -0.2);
    outBar(10.6, avcAmp(g) / 100, 1, -0.9, 3.4);
  },
  lab: [["a", () => [2.6, 0, 4.1]], ["amp", (g) => [10.6, 0, -0.9 + 3.4 * (avcAmp(g) / 100) + 0.7]]],
};
