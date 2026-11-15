// The maths of the s-plane landscape. Plain JS: build.mjs runs it for the assertions, the page inlines the same text.
// The surface follows the MAE Academy simulator: adaptive grid (denser near poles and zeros), compressive height law
// (floor + spire), log colour law through the site's heat colormap.
// A configuration is a list of poles and zeros [re, im, weight]; weight 1 is a true pole / zero, a weight between 0 and 1
// is one growing out of the floor (|s-p|^-w). That lets poles appear, split and slide continuously.
globalThis.LAP = (function () {
  const EXT = 3.5,
    N = 80,
    N1 = N + 1,
    NV = N1 * N1,
    HA = 2.7,
    XD = 0.35;
  // the five systems of the reel (poles p, zeros z as [re, im], gain K = 1)
  const SYS = {
    A: { K: 1, z: [], p: [[-1, 0]] },
    B: {
      K: 1,
      z: [],
      p: [
        [-1, 2],
        [-1, -2],
      ],
    },
    C: {
      K: 1,
      z: [],
      p: [
        [1, 2],
        [1, -2],
      ],
    },
    D: {
      K: 1,
      z: [],
      p: [
        [0, 2],
        [0, -2],
      ],
    },
    E: {
      K: 1,
      z: [
        [0, 1],
        [0, -1],
      ],
      p: [
        [-1, 0],
        [-1, 2],
        [-1, -2],
      ],
    },
  };
  const ORDER = ["A", "B", "C", "D", "E"];
  const hyp = Math.hypot;
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => {
    const d = b[0] * b[0] + b[1] * b[1];
    return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
  };
  /** |H(s)| of a system at s = re + j im; Infinity exactly on a pole */
  function mag(S, re, im) {
    let num = Math.abs(S.K),
      den = 1;
    for (const z of S.z) num *= hyp(re - z[0], im - z[1]);
    for (const p of S.p) den *= hyp(re - p[0], im - p[1]);
    return den === 0 ? Infinity : num / den;
  }
  /** H(s) as a complex number */
  function Hc(S, re, im) {
    let num = [S.K, 0],
      den = [1, 0];
    for (const z of S.z) num = cmul(num, [re - z[0], im - z[1]]);
    for (const p of S.p) den = cmul(den, [re - p[0], im - p[1]]);
    return cdiv(num, den);
  }
  /** residues at the (simple) poles: h(t) = sum Re(r e^{pt}) */
  function residues(S) {
    return S.p.map((p, k) => {
      let num = [S.K, 0],
        den = [1, 0];
      for (const z of S.z) num = cmul(num, [p[0] - z[0], p[1] - z[1]]);
      S.p.forEach((q, j) => {
        if (j !== k) den = cmul(den, [p[0] - q[0], p[1] - q[1]]);
      });
      return { p, r: cdiv(num, den) };
    });
  }
  function h(S, t) {
    let s = 0;
    for (const { p, r } of residues(S))
      s += Math.exp(p[0] * t) * (r[0] * Math.cos(p[1] * t) - r[1] * Math.sin(p[1] * t));
    return s;
  }

  // ---- the adaptive grid of the simulator (denser around the poles and zeros), snapped onto them
  function adapt(n, lo, hi, centers, width, strength) {
    const cum = new Float64Array(4097);
    for (let k = 1; k <= 4096; k++) {
      const p = lo + ((hi - lo) * (k - 0.5)) / 4096;
      let f = 1;
      for (const c of centers) f += strength * Math.exp(-((Math.abs(p - c) / width) ** 2));
      cum[k] = cum[k - 1] + f;
    }
    const out = new Float64Array(n + 1);
    let m = 0;
    for (let k = 0; k <= n; k++) {
      const p = (cum[4096] * k) / n;
      while (m < 4096 && cum[m + 1] < p) m++;
      const f = cum[m + 1] - cum[m] || 1;
      out[k] = lo + ((hi - lo) * (m + (p - cum[m]) / f)) / 4096;
    }
    out[0] = lo;
    out[n] = hi;
    for (const c of centers) {
      if (c <= lo || c >= hi) continue;
      let q = 1;
      for (let k = 1; k < n; k++) if (Math.abs(out[k] - c) < Math.abs(out[q] - c)) q = k;
      if (c > out[q - 1] && c < out[q + 1]) out[q] = c;
    }
    return out;
  }

  // ---- the site's height and colour laws
  const k8 = (e, t) => {
    if (!(e >= 0)) return 0;
    const a = 0.75 * t;
    if (e <= a) return e;
    if (!Number.isFinite(e)) return t;
    const n = t - a,
      i = e - a;
    return a + i / (1 + i / n);
  };
  const w8 = (e) => {
    if (!(e > 0)) return 0;
    if (!Number.isFinite(e)) return 1;
    const a = Math.pow(e, 2.4);
    return a / (1 + a);
  };
  const fb = (e, t, a) => {
    if (!(e > 0)) return 0;
    const n = k8(e / t, 1);
    return XD * n + (HA - XD) * w8(e / a);
  };
  const m8 = (e, t, a) => {
    if (!(e > 0)) return 0;
    if (!Number.isFinite(e)) return 1;
    const n = t / 6;
    return Math.min(1, Math.log1p(e / n) / Math.log1p(a / n));
  };
  const KL = [-0.45, 0.8, 0.4],
    KN = hyp(KL[0], KL[1], KL[2]);

  // ---- a configuration: [re, im, weight] poles and zeros
  const DMIN = 1e-3;
  function magC(cfg, re, im) {
    let v = 1;
    for (const z of cfg.zeros)
      if (z[2] > 1e-4) v *= Math.pow(Math.max(hyp(re - z[0], im - z[1]), DMIN), z[2]);
    for (const p of cfg.poles)
      if (p[2] > 1e-4) v /= Math.pow(Math.max(hyp(re - p[0], im - p[1]), DMIN), p[2]);
    return v;
  }
  const cfgOf = (S) => ({
    poles: S.p.map((p) => [p[0], p[1], 1]),
    zeros: S.z.map((z) => [z[0], z[1], 1]),
  });
  function uniq(list) {
    const out = [];
    for (const v of list) if (!out.some((o) => Math.abs(o - v) < 1e-6)) out.push(v);
    return out;
  }
  const NS = 96,
    bm = new Float64Array(NV),
    bh = new Float32Array(NV),
    bc = new Float32Array(NV),
    bs = new Float32Array(NV),
    bsamp = new Float64Array((NS + 1) * (NS + 1)),
    bB = new Float32Array(NV),
    bW = new Float32Array(NV);
  function shadeInto(y, gx, gy, out) {
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        bB[i * N1 + j] = gx[j] / EXT;
        bW[i * N1 + j] = -gy[i] / EXT;
      }
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        const jm = Math.max(0, j - 1),
          jp = Math.min(N, j + 1),
          im = Math.max(0, i - 1),
          ip = Math.min(N, i + 1);
        const a = i * N1 + jm,
          b = i * N1 + jp,
          c = im * N1 + j,
          d = ip * N1 + j;
        const ne = bB[b] - bB[a],
          te = y[b] - y[a],
          ge = bW[b] - bW[a],
          le = bB[d] - bB[c],
          ee = y[d] - y[c],
          Me = bW[d] - bW[c];
        let fe = te * Me - ge * ee,
          be = ge * le - ne * Me,
          Se = ne * ee - te * le;
        if (be < 0) {
          fe = -fe;
          be = -be;
          Se = -Se;
        }
        const E = hyp(fe, be, Se);
        out[i * N1 + j] =
          E < 1e-12 ? 1 : Math.max(0, (fe * KL[0] + be * KL[1] + Se * KL[2]) / (E * KN));
      }
  }
  /** the surface of a configuration on its own adaptive grid (denser, and snapped, onto every pole and zero in it).
   *  The arrays are shared buffers: read them before the next call. */
  function surfaceFor(cfg) {
    const all = [...cfg.poles, ...cfg.zeros].filter((q) => q[2] > 0.02);
    const gx = adapt(N, -EXT, EXT, uniq([0, ...all.map((q) => q[0])]), 0.06 * EXT, 5);
    const gy = adapt(N, -EXT, EXT, uniq([0, ...all.map((q) => q[1])]), 0.06 * EXT, 5);
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) bm[i * N1 + j] = magC(cfg, gx[j], gy[i]);
    let ns = 0;
    for (let a = 0; a <= NS; a++)
      for (let b = 0; b <= NS; b++) {
        const v = magC(cfg, -EXT + (2 * EXT * a) / NS, -EXT + (2 * EXT * b) / NS);
        if (Number.isFinite(v) && v > 0) bsamp[ns++] = v;
      }
    const samp = bsamp.subarray(0, ns);
    samp.sort();
    const g = (q) => (ns ? samp[Math.min(ns - 1, Math.floor(q * ns))] : 1);
    const med = g(0.5);
    let bmax = 0;
    for (let k = 0; k <= 360; k++) {
      const v = magC(cfg, 0, -EXT + (2 * EXT * k) / 360);
      if (Number.isFinite(v)) bmax = Math.max(bmax, v);
    }
    const floorScale = Math.max(4 * med, 1.15 * Math.min(bmax, 12 * med), 1e-9);
    const spire = Math.max(g(0.996), 1.5 * floorScale);
    const ceil = 4 * spire;
    for (let v = 0; v < NV; v++) {
      bh[v] = fb(bm[v], floorScale, spire);
      bc[v] = m8(bm[v], floorScale, ceil);
    }
    shadeInto(bh, gx, gy, bs);
    return { gx, gy, hgt: bh, col: bc, shade: bs, floorScale, spire };
  }
  /** surface height of a magnitude m under a surface's own scales (for a point travelling over the landscape) */
  const heightOf = (S, m) => fb(m, S.floorScale, S.spire);

  // heat colormap of the site (MathNumberInput chunk): indigo, blue, cyan, green, amber, orange, rose
  const HEAT = ["#1E1B4B", "#2563EB", "#06B6D4", "#10B981", "#F59E0B", "#EA580C", "#E11D48"];
  const hx = (s) => [
    parseInt(s.slice(1, 3), 16),
    parseInt(s.slice(3, 5), 16),
    parseInt(s.slice(5, 7), 16),
  ];
  const LUT = [];
  for (let k = 0; k < 256; k++) {
    const l = (k / 255) * (HEAT.length - 1),
      n = Math.min(HEAT.length - 2, Math.floor(l)),
      c = l - n,
      a = hx(HEAT[n]),
      b = hx(HEAT[n + 1]);
    LUT.push([a[0] + (b[0] - a[0]) * c, a[1] + (b[1] - a[1]) * c, a[2] + (b[2] - a[2]) * c]);
  }
  return {
    EXT,
    N,
    NV,
    HA,
    SYS,
    ORDER,
    mag,
    magC,
    cfgOf,
    surfaceFor,
    heightOf,
    Hc,
    h,
    residues,
    HEAT,
    LUT,
    fb,
  };
})();
