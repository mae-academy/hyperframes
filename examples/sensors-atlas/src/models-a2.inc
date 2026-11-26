// ===== chapter 1: motion & position =====
const K = D.k, PI = Math.PI, ST = COL.steel, SD = COL.steelD, GD = COL.gold, TL = COL.teal, OR = COL.orange, GR = COL.green, BL = COL.blue, PU = COL.purple, NV = COL.navy, GL = COL.glass;
const softLin = (u) => { const a = Math.abs(u), s = Math.sign(u); return a <= 1 ? u : s * (Math.min(a, 2) - 0.5 * (Math.min(a, 2) - 1) ** 2); };
const frac = (v) => v - Math.floor(v);
const KB = (cs) => cs;
const SENS = {};
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
// 13 moire fringes: raising the tilt alpha tightens BOTH the 3D dark bands and the 2D intensity profile ---------------------
const moiN = (al) => (3.6 * Math.tan((al * PI) / 180)) / K.moire.pitch;
SENS.moi = {
  view: { yaw: -0.12, pitch: 0.12, dist: 19, tx: 0.8, tz: 2.0 }, p: [5, 16, 24], x: [0, 3.6], y: [0, 1.2], ns: 240, xp: true,
  out: moiN, sc: (z, q, al) => Math.cos((PI * z * Math.tan((al * PI) / 180)) / K.moire.pitch) ** 2,
  build(alDeg) {
    const P = 0.5, s = 0.5, ta = Math.tan((alDeg * PI) / 180), H = 3.6;
    shadow([0, 0, -1], 5, 2); box([0, 0, -1.0], [8.6, 2.4, 0.3], SD);
    for (const px of [-3.4, 3.4]) box([px, 0, -0.5], [0.4, 0.6, 1.0], SD);
    box([0, 0.15, 1.8], [6.2, 0.1, 3.8], GL, 0.28); box([0, -0.15, 1.8], [6.2, 0.1, 3.8], GL, 0.22);
    for (let i = 0; i <= 12; i++) ln([[-3 + i * P, 0.1, 0], [-3 + i * P, 0.1, H]], NV, 3, 0.85);
    for (let m = -14; m <= 14; m++) { const x0 = -3 + m * P + (s % P), x1 = x0 + H * ta; if (x0 > 3.1 && x1 > 3.1) continue; if (x0 < -3.1 && x1 < -3.1) continue; ln([[Math.max(-3.05, Math.min(3.05, x0)), -0.1, 0], [Math.max(-3.05, Math.min(3.05, x1)), -0.1, H]], OR, 3, 0.9); }
    const Wf = P / ta, off = ((-s / ta) % Wf + Wf) % Wf;
    for (let k = -1; k < 12; k++) { const zc = off + k * Wf, z0 = Math.max(0, zc - 0.22 * Wf), z1 = Math.min(H, zc + 0.22 * Wf); if (z1 - z0 > 0.02) OUT.push({ k: "p", pts: [[-3, -0.3, z0], [3, -0.3, z0], [3, -0.3, z1], [-3, -0.3, z1]], fill: NV, op: 0.3 * EA, sw: 0, bias: -2, stroke: "none" }); }
    box([4.6, 0, 1.8], [1.0, 1.0, 1.0], ST); box([4.6, 0, -0.5], [0.8, 0.8, 1.0], SD); box([4.6, -0.55, 1.8], [0.5, 0.06, 0.5], GR); ln([[3.1, -0.1, 1.8], [4.1, -0.1, 1.8]], TL, 5);
    ln([[4.6, 0, 2.3], [4.6, 0, 3.2], [7.0, 0, 3.2], [7.0, 0, 1.0]], NV, 4); box([7.0, 0, 0.4], [1.4, 1.2, 1.4], ST);
    arw([-3, -1.3, -0.2], [-3 + 2.2, -1.3, -0.2], OR, 6, 0);
  },
  lab: [["alpha", () => [-3.4, -0.4, 3.9]], ["N", () => [7.0, 0, 1.6]]],
};
