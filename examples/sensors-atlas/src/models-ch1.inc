// ===== chapter 1: motion & position =====
const K = D.k, PI = Math.PI, ST = COL.steel, SD = COL.steelD, GD = COL.gold, TL = COL.teal, OR = COL.orange, GR = COL.green, BL = COL.blue, PU = COL.purple, NV = COL.navy, GL = COL.glass;
const softLin = (u) => { const a = Math.abs(u), s = Math.sign(u); return a <= 1 ? u : s * (Math.min(a, 2) - 0.5 * (Math.min(a, 2) - 1) ** 2); };
const frac = (v) => v - Math.floor(v);
const KB = (cs) => cs;
const SENS = {};
// 1 variable reluctance ------------------------------------------------
SENS.ind = {
  view: { yaw: -0.5, pitch: 0.26, dist: 22, tx: 1.0, tz: 2.2 }, p: [3, 18, 22], x: [0, 22], y: [0, 125],
  out: (g) => K.ind.Lmax / (1 + g / K.ind.g0),
  kb: [{ c: [0, 0, -1], s: [5.4, 2, 1], col: ST }, { c: [0, 0, 2.9], s: [5.4, 2, 0.6], col: GD }],
  build(g) {
    const gu = g / 10, zA = 2.5 + gu + 0.3, f = SENS.ind.out(g) / K.ind.Lmax;
    shadow([0, 0, 0], 4.6, 2.6);
    box([0, 0, -1.0], [5.4, 2, 1.0], ST); box([-2.2, 0, 1.0], [1, 2, 3], ST); box([2.2, 0, 1.0], [1, 2, 3], ST);
    for (let i = 0; i < 7; i++) ring("z", [-2.2, 0, -0.2 + i * 0.42], 1.3, BL, 4, 1);
    box([0, 0, zA], [5.4, 2, 0.6], GD); cyl("z", [0, 0, zA + 1.4], 2.2, 0.3, ST);
    arw([3.4, -1.3, 2.5 + gu / 2 + 0.01], [3.4, -1.3, 2.5], OR, 7); arw([3.4, -1.3, 2.5 + gu / 2 - 0.01], [3.4, -1.3, 2.5 + gu], OR, 7);
    ln([[-2.2, -0.1, -0.8], [-2.2, -0.1, zA], [2.2, -0.1, zA], [2.2, -0.1, -0.8], [-2.2, -0.1, -0.8]], TL, 6, 0.25 + 0.75 * f, "18 14", g / 6);
    box([-5.4, 0, -0.3], [1.4, 1.2, 1.2], BL); ln([[-2.2, -1.3, 1.9], [-5.4, -1.3, 1.9], [-5.4, -1.3, 0.3]], BL, 5);
    outBar(6.4, f);
  },
  lab: [["d", (g) => [3.4, -1.3, 3.5 + g / 10]], ["Lind", (g) => [6.4, 0, -0.9 + 3.4 * (SENS.ind.out(g) / K.ind.Lmax) + 0.7]], ["Phi", () => [0, 0, 3.3]]],
};
// 2 RVDT ---------------------------------------------------------------
SENS.rvdt = {
  view: { yaw: -0.45, pitch: 0.24, dist: 20, tx: 0.8, tz: 0.9 }, p: [0, 35, 75], x: [-80, 80], y: [-8, 8],
  out: (th) => K.rvdt.E * softLin(th / K.rvdt.thMax) * 1.0,
  kb: [{ c: [0, 0, 0.9], s: [6, 3.8, 3.8], col: GL }, { c: [0, 0, 0.9], s: [4.4, 2.6, 0.7], col: GD }],
  build(th) {
    const a = (th * PI) / 180, z = 0.9; shadow([0, 0, 0], 5, 2.6);
    box([0, 0, -1.1], [7, 3, 0.4], SD);
    glassCyl("x", [0, 0, z], 6, 1.95, 1);
    for (const [x, col] of [[-2, GR], [0, BL], [2, GR]]) for (let i = -1; i <= 1; i++) ring("x", [x + i * 0.4, 0, z], 1.98, col, 4, 1);
    cyl("x", [0, 0, z], 11, 0.28, ST); box([0, 0, z], [4.4, 2.6, 0.7], GD, 1, ["x", a]);
    box([-5.7, 0, z + 1.1], [0.3, 0.3, 2.2], OR, 1, ["x", a, [-5.7, 0, z]]); cyl("x", [-5.7, 0, z], 0.4, 0.55, ST);
    ring("x", [-5.7, 0, z], 2.4, OR, 6, 1, PI / 2, PI / 2 + a, 12);
    biBar(7.2, softLin(th / K.rvdt.thMax) / 1.5, 1, 0.9, 2.2);
  },
  lab: [["th", (th) => [-5.7, 0, 3.8]], ["E0", (th) => [7.2, 0, 0.9 + 2.2 * Math.max(0, SENS.rvdt.out(th) / 7.5) + 0.8]]],
};
// 3 variable-area capacitor -------------------------------------------------
const capAC = (ov) => (K.eps0 * ((ov * K.capA.w) / K.capA.d)) * 1e-3;
SENS.capA = {
  view: { yaw: -0.5, pitch: 0.32, dist: 19, tx: 1.2, tz: 0.6 }, p: [0, 50, 100], x: [0, 100], y: [0, 2.1],
  out: (p) => capAC(p <= 60 ? p : 120 - p),
  kb: [{ c: [0, 0, 1.1], s: [6, 3, 0.25], col: ST }, { c: [-3, 0, 0.1], s: [6, 3, 0.25], col: GD }],
  build(p) {
    const ov = p <= 60 ? p : 120 - p, c = ov / 10 - 6, lo = Math.max(-3, c - 3), hi = Math.min(3, c + 3);
    shadow([0, 0, -1], 7, 2.6); box([0, 0, -1.1], [13.5, 3.6, 0.4], SD);
    box([c, 0, 0.1], [6, 3, 0.25], GD); box([0, 0, 1.1], [6, 3, 0.25], ST);
    box([-3.6, 0, 0.55], [0.4, 0.4, 3.0], SD); box([3.6, 0, 0.55], [0.4, 0.4, 3.0], SD);
    const n = Math.max(0, Math.round(ov / 6 * 2.5));
    if (hi - lo > 0.2) for (let i = 0; i < n; i++) { const x = lo + ((hi - lo) * (i + 0.5)) / n; for (const y of [-1, 0, 1]) ln([[x, y, 0.25], [x, y, 0.97]], TL, 4, 0.9); }
    if (hi - lo > 0.2) arw([lo, -1.9, 1.8], [hi, -1.9, 1.8], OR, 7);
    outBar(7.5, SENS.capA.out(p) / 2.0);
  },
  lab: [["x", (p) => [(Math.max(-3, p / 10 - 9) + Math.min(3, p / 10 - 3)) / 2, -1.9, 2.6]], ["C", (p) => [7.5, 0, -0.9 + 3.4 * (SENS.capA.out(p) / 2.0) + 0.7]]],
};
// 4 angular capacitor ------------------------------------------------------
const capTC = (thDeg) => { const r = (Math.min(thDeg, 360 - thDeg) * PI) / 180; return (K.eps0 * (r / 2) * ((K.capT.r * K.capT.r) / K.capT.d)) * 1e-3; };
SENS.capT = {
  view: { yaw: -0.25, pitch: 0.12, dist: 23, tx: 0.8, tz: 1.8 }, p: [0, 150, 270], x: [0, 270], y: [0, 2.6],
  out: (p) => capTC(p),
  kb: [{ c: [0, 0.5, 1.6], s: [6, 0.25, 3], col: ST }, { c: [0, -0.5, 1.6], s: [6, 0.25, 3], col: GD }],
  build(p) {
    const a = (p * PI) / 180, c = [0, 0, 1.6]; shadow([0, 0, 0], 3.5, 2);
    box([0, 0, -0.9], [1.0, 1.0, 1.6], SD); box([0, 0, -1.2], [5, 3, 0.3], SD);
    sect([0, 0.55, 1.6], 0.55, 3, 0, PI, 0.25, ST);
    sect([0, -0.55, 1.6], 0.55, 3, a - PI, a, 0.25, GD);
    const lo = Math.max(0, a - PI), hi = Math.min(PI, a); if (hi - lo > 0.05) sect([0, 0, 1.6], 0.6, 2.95, lo, hi, 0.05, TL, 0.55);
    cyl("y", [0, 0, 1.6], 2.2, 0.45, ST); ring("y", [0, -1.35, 1.6], 3.5, OR, 6, 1, 0, Math.min(a, 2 * PI), 40);
    outBar(5.3, SENS.capT.out(p) / 2.6);
  },
  lab: [["th", (p) => [3.6 * Math.cos((p * PI) / 360), -1.35, 1.6 + 3.6 * Math.sin((p * PI) / 360) + 0.3]], ["C", (p) => [5.3, 0, -0.9 + 3.4 * (SENS.capT.out(p) / 2.6) + 0.7]]],
};
// 5 liquid-level capacitor ---------------------------------------------------
const capLC = (h) => (2 * PI * K.eps0 * ((K.capL.er * h + (K.capL.L - h)) * 1e-3)) / Math.log(K.capL.D2 / K.capL.D1);
SENS.capL = {
  view: { yaw: -0.35, pitch: 0.18, dist: 20, tx: 1.6, tz: 1.8 }, p: [0, 40, 0], x: [0, 50], y: [0, 7],
  out: (h) => capLC(h),
  kb: [{ c: [0, 0, 1.5], s: [3, 3, 5], col: GL }, { c: [0, 0, 1.7], s: [1, 1, 5.4], col: ST }],
  build(h) {
    const hu = h / 10; shadow([0, 0, -1], 3, 3);
    box([0, 0, -1.25], [4.4, 4.4, 0.4], SD);
    if (hu > 0.02) { cyl("z", [0, 0, -1.05 + hu / 2], hu, 1.42, TL, 0.4, { n: 24 }); ring("z", [0, 0, -1.05 + hu], 1.42, TL, 4, 0.9); }
    glassCyl("z", [0, 0, 1.45], 5, 1.5, 1); cyl("z", [0, 0, 1.6], 5.3, 0.5, ST);
    ln([[0, 0, 4.3], [0, 0, 5.0], [4, 0, 5.0], [4, 0, 3.6]], NV, 5);
    arw([2.5, -1.2, -1.05], [2.5, -1.2, -1.05 + Math.max(hu, 0.2)], OR, 7);
    outBar(5.5, SENS.capL.out(h) / 7, 1, -0.9, 3.4);
  },
  lab: [["h", (h) => [2.5, -1.2, -0.7 + h / 10 + 0.6]], ["C", (h) => [5.5, 0, -0.9 + 3.4 * (SENS.capL.out(h) / 7) + 0.7]]],
};
// 6 incremental encoder -----------------------------------------------------
const incOpen = (th) => (((90 - th) % 15) + 15) % 15 >= 7.5 ? 1 : 0;
SENS.inc = {
  view: { yaw: -0.2, pitch: 0.1, dist: 24, tx: 1.0, tz: 1.8 }, p: [0, 180, 60], x: [0, 190], y: [0, 1.3], ns: 380,
  out: (th) => Math.floor(th / 15), sc: (th) => incOpen(th),
  kb: [{ c: [0, 0, 1.6], s: [7, 0.3, 7], col: ST }, { c: [0, 0, 4.3], s: [0.9, 2.8, 0.5], col: GD }],
  build(th) {
    const a = (th * PI) / 180, n = K.enc.n, pitch = (2 * PI) / n, c = [0, 0, 1.6]; shadow([0, 0, 0], 4, 2.2);
    box([0, 0.5, -0.8], [0.8, 0.8, 1.6], SD); box([0, 0, -1.2], [6, 3, 0.3], SD);
    sect(c, 0.45, 2.2, 0, PI, 0.3, ST); sect(c, 0.45, 2.2, PI, 2 * PI, 0.3, ST);
    for (let i = 0; i < n; i++) sect(c, 2.2, 3.1, i * pitch + a, i * pitch + a + pitch / 2, 0.3, ST, 1, 2);
    for (let q = 0; q < 4; q++) sect(c, 3.1, 3.45, (q * PI) / 2 + a * 0, ((q + 1) * PI) / 2, 0.3, ST, 1, 8);
    cyl("y", [0, -0.5, 1.6], 2, 0.32, SD); cyl("y", [0, -1.7, 1.6], 0.5, 0.75, GD);
    const z = 1.6 + 2.65, open = incOpen(th);
    box([0, 1.45, z], [1.0, 0.7, 1.0], GD); box([0, -1.45, z], [1.0, 0.7, 1.0], NV); box([0, 1.45, z - 0.9], [0.3, 0.3, 0.9], SD);
    ln([[0, 1.1, z], [0, -1.1, z]], TL, 7, open ? 1 : 0.12);
    ring("y", [0, -1.2, 1.6], 3.9, OR, 6, 1, 0, a, 30);
    box([5.5, 0, 1.6], [1.4, 1.2, 1.4], open ? GR : SD);
  },
  lab: [["th", (th) => [3.9 * Math.cos((th * PI) / 360), -1.2, 1.6 + 3.9 * Math.sin((th * PI) / 360) + 0.4]], ["N", () => [5.5, 0, 3.2]]],
};
// 7 absolute encoder ---------------------------------------------------------
const absCode = (th) => Math.floor((((th % 360) + 360) % 360) / 22.5);
SENS.abs = {
  view: { yaw: -0.2, pitch: 0.1, dist: 25, tx: 1.6, tz: 1.8 }, p: [0, 300, 360], x: [0, 360], y: [0, 16], ns: 200,
  out: (th) => absCode(th), sc: (th) => absCode(th),
  kb: [{ c: [0, 0, 1.6], s: [7.4, 0.3, 7.4], col: ST }, { c: [2.5, 0, 1.6], s: [3.4, 2.8, 0.6], col: GD }],
  build(th) {
    const a = (th * PI) / 180, c = [0, 0, 1.6], sd = (2 * PI) / 16; shadow([0, 0, 0], 4, 2.2);
    box([0, 0.5, -0.8], [0.8, 0.8, 1.6], SD); box([0, 0, -1.2], [6, 3, 0.3], SD);
    const R = [[0.9, 1.6], [1.7, 2.4], [2.5, 3.2], [3.3, 4.0]];
    sect(c, 0.3, 0.9, 0, PI, 0.3, ST); sect(c, 0.3, 0.9, PI, 2 * PI, 0.3, ST);
    for (let t = 0; t < 4; t++) { let s = 0; while (s < 16) { const bit = (s >> (3 - t)) & 1; if (!bit) { s++; continue; } let e = s; while (e < 16 && ((e >> (3 - t)) & 1)) e++; sect(c, R[t][0], R[t][1], s * sd - a, e * sd - a, 0.3, t % 2 ? ST : SD, 1, Math.max(2, (e - s) * 2)); s = e; } }
    const code = absCode(th);
    box([2.45, 1.5, 1.6], [3.4, 0.5, 0.9], GD);
    for (let t = 0; t < 4; t++) { const bit = (code >> (3 - t)) & 1, xx = (R[t][0] + R[t][1]) / 2; box([xx, -1.5, 1.6], [0.5, 0.5, 0.6], bit ? GR : NV); ln([[xx, 1.25, 1.6], [xx, -1.25, 1.6]], TL, 5, bit ? 0.12 : 1); }
    ring("y", [0, -1.2, 1.6], 4.5, OR, 6, 1, -a, 0, 40);
    for (let t = 0; t < 4; t++) box([5.7 + t * 1.15, 0, 1.6], [0.9, 0.9, 0.9], (code >> (3 - t)) & 1 ? GR : SD);
  },
  lab: [["th", (th) => [4.5 * Math.cos((-th * PI) / 360), -1.2, 1.6 + 4.5 * Math.sin((-th * PI) / 360) + 0.4]], ["code", () => [6.9, 0, 2.6]]],
};
// 8 linear reflection encoder -------------------------------------------------
SENS.lin = {
  view: { yaw: -0.35, pitch: 0.34, dist: 17, tx: 0.5, tz: 0.9 }, p: [0, 40, 40], q: [1, 2], x: [0, 45], y: [0, 1.2], ns: 360,
  out: (x, q) => Math.floor((x * q) / K.lin.pitch), sc: (x, q) => 0.5 + 0.5 * Math.cos((2 * PI * x * q) / K.lin.pitch),
  kb: [{ c: [0, 0, -0.2], s: [12, 2, 0.4], col: SD }, { c: [0, 0, 0.75], s: [5, 2, 0.15], col: GL }],
  build(x, q) {
    const pu = 1 / q, xs = x / 10; shadow([0, 0, -1], 7, 2.2);
    box([0, 0, -1.0], [13, 2.6, 0.3], ST); box([xs, 0, -0.55], [12, 2, 0.5], SD);
    const n = Math.round(12 * q); for (let k = 0; k < n; k++) { const cx = xs - 6 + pu * (k + 0.5); if (Math.abs(cx) < 6.2) box([cx, 0, -0.27], [pu * 0.5, 1.8, 0.1], COL.white); }
    box([0, 0, 0.9], [5, 2.2, 0.14], GL, 0.35); for (let k = 0; k < Math.round(5 * q); k++) box([-2.5 + pu * (k + 0.5), 0, 0.95], [pu * 0.5, 2.1, 0.1], NV);
    box([-3.4, 0, 0.3], [0.4, 0.4, 1.6], SD); box([3.4, 0, 0.3], [0.4, 0.4, 1.6], SD);
    const I = 0.5 + 0.5 * Math.cos((2 * PI * x * q) / K.lin.pitch);
    box([-1.6, 0, 2.7], [0.9, 0.9, 0.7], GD); box([1.6, 0, 2.7], [0.9, 0.9, 0.7], NV);
    ln([[-1.6, 0, 2.35], [0, 0, 0.1], [1.6, 0, 2.35]], TL, 6, 0.15 + 0.85 * I);
    arw([-5.4, -1.8, 0.4], [-5.4 + xs, -1.8, 0.4], OR, 7);
    box([5.8, 0, 1.0], [1.3, 1.2, 1.3], I > 0.5 ? GR : SD);
  },
  lab: [["x", (x) => [-5.4 + x / 20, -1.8, 1.2]], ["N", () => [5.8, 0, 2.5]]],
};
// 9 moire fringes ------------------------------------------------------------
SENS.moi = {
  view: { yaw: -0.12, pitch: 0.12, dist: 19, tx: 0.8, tz: 2.0 }, p: [0, 4, 6], x: [0, 6], y: [0, 1.2], ns: 240,
  out: (p) => Math.min(p, 4) / K.moire.pitch, sc: (p) => Math.cos((PI * Math.min(p, 4)) / K.moire.pitch) ** 2,
  kb: [{ c: [0, 0.1, 1.8], s: [6, 0.1, 3.6], col: ST }, { c: [0, -0.1, 1.8], s: [6, 0.1, 3.6], col: GD }],
  build(p) {
    const P = 0.5, s = Math.min(p, 4), al = K.moire.alpha + 0.1 * Math.max(0, p - 4), ta = Math.tan(al), H = 3.6;
    shadow([0, 0, -1], 5, 2); box([0, 0, -1.0], [8, 2.4, 0.3], SD);
    box([0, 0.15, 1.8], [6.2, 0.1, 3.8], GL, 0.28);
    for (let i = 0; i <= 12; i++) ln([[-3 + i * P, 0.1, 0], [-3 + i * P, 0.1, H]], NV, 3, 0.85);
    for (let m = -8; m <= 14; m++) { const x0 = -3 + m * P + (s % P), x1 = x0 + H * ta; if (x0 > 3.1 && x1 > 3.1) continue; if (x0 < -3.1 && x1 < -3.1) continue; ln([[Math.max(-3.05, Math.min(3.05, x0)), -0.1, 0], [Math.max(-3.05, Math.min(3.05, x1)), -0.1, H]], OR, 3, 0.9); }
    const Wf = P / ta, off = ((-s / ta) % Wf + Wf) % Wf;
    for (let k = -1; k < 6; k++) { const zc = off + k * Wf, z0 = Math.max(0, zc - 0.22 * Wf), z1 = Math.min(H, zc + 0.22 * Wf); if (z1 - z0 > 0.02) OUT.push({ k: "p", pts: [[-3, -0.3, z0], [3, -0.3, z0], [3, -0.3, z1], [-3, -0.3, z1]], fill: NV, op: 0.3 * EA, sw: 0, bias: -2, stroke: "none" }); }
    box([0, 0, -0.55], [1.2, 0.5, 0.5], SD);
    const I = Math.cos((PI * s) / P) ** 2; box([4.4, 0, 1.8], [1.0, 1.0, 1.0], I > 0.5 ? GR : SD);
    arw([-3, -1.3, -0.2], [-3 + Math.min(s, 3) , -1.3, -0.2], OR, 6);
  },
  lab: [["x", (p) => [-2.2, -1.3, 0.5]], ["N", () => [4.4, 0, 2.8]]],
};
