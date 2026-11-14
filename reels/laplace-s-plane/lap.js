// The maths of the s-plane landscape. Plain JS: build.mjs runs it for the assertions, the page inlines the same text.
// The surface follows the MAE Academy simulator: adaptive grid (denser near poles and zeros), compressive height law
// (floor + spire), log colour law through the site's heat colormap, isometric camera 40 deg / 28 deg.
globalThis.LAP = (function () {
  const EXT = 3.5,
    N = 80,
    HA = 2.7,
    XD = 0.35;
  // the five systems of the reel (poles p, zeros z as [re, im], gain K)
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
  /** |H(s)| at s = re + j im; Infinity exactly on a pole */
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
  const reC = [-1, 1, 0];
  const imC = [0, 2, -2, 1, -1];
  const gx = adapt(N, -EXT, EXT, reC, 0.06 * EXT, 5);
  const gy = adapt(N, -EXT, EXT, imC, 0.06 * EXT, 5);
  const NV = (N + 1) * (N + 1);

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
  function shadeOf(y) {
    const B = new Float32Array(NV),
      Wz = new Float32Array(NV);
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        B[i * (N + 1) + j] = gx[j] / EXT;
        Wz[i * (N + 1) + j] = -gy[i] / EXT;
      }
    const out = new Float32Array(NV),
      n1 = N + 1;
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) {
        const A = i * n1 + j,
          jm = Math.max(0, j - 1),
          jp = Math.min(N, j + 1),
          im = Math.max(0, i - 1),
          ip = Math.min(N, i + 1);
        const a = i * n1 + jm,
          b = i * n1 + jp,
          c = im * n1 + j,
          d = ip * n1 + j;
        const ne = B[b] - B[a],
          te = y[b] - y[a],
          ge = Wz[b] - Wz[a],
          le = B[d] - B[c],
          ee = y[d] - y[c],
          Me = Wz[d] - Wz[c];
        let fe = te * Me - ge * ee,
          be = ge * le - ne * Me,
          Se = ne * ee - te * le;
        if (be < 0) {
          fe = -fe;
          be = -be;
          Se = -Se;
        }
        const E = hyp(fe, be, Se);
        out[A] = E < 1e-12 ? 1 : Math.max(0, (fe * KL[0] + be * KL[1] + Se * KL[2]) / (E * KN));
      }
    return out;
  }
  /** heights (hgt), colour parameter (col) and shading (shade) of one system on the common grid */
  function surface(S) {
    const m = new Float64Array(NV);
    for (let i = 0; i <= N; i++)
      for (let j = 0; j <= N; j++) m[i * (N + 1) + j] = mag(S, gx[j], gy[i]);
    const samp = [],
      F = 96;
    for (let a = 0; a <= F; a++)
      for (let b = 0; b <= F; b++) {
        const v = mag(S, -EXT + (2 * EXT * a) / F, -EXT + (2 * EXT * b) / F);
        if (Number.isFinite(v) && v > 0) samp.push(v);
      }
    samp.sort((u, v) => u - v);
    const g = (q) =>
      samp.length ? samp[Math.min(samp.length - 1, Math.floor(q * samp.length))] : 1;
    const med = g(0.5);
    let b = 0;
    for (let k = 0; k <= 360; k++) {
      const v = mag(S, 0, -EXT + (2 * EXT * k) / 360);
      if (Number.isFinite(v)) b = Math.max(b, v);
    }
    const floorScale = Math.max(4 * med, 1.15 * Math.min(b, 12 * med), 1e-9);
    const spire = Math.max(g(0.996), 1.5 * floorScale);
    const ceil = 4 * spire;
    const hgt = new Float32Array(NV),
      col = new Float32Array(NV);
    for (let v = 0; v < NV; v++) {
      hgt[v] = fb(m[v], floorScale, spire);
      col[v] = m8(m[v], floorScale, ceil);
    }
    return { hgt, col, shade: shadeOf(hgt), mag: m };
  }
  const SURF = {
    FLAT: {
      hgt: new Float32Array(NV),
      col: new Float32Array(NV),
      shade: shadeOf(new Float32Array(NV)),
    },
  };
  for (const k of ORDER) SURF[k] = surface(SYS[k]);

  // ---- the camera (isometric, as in the simulator): theta = 40 deg yaw, phi = 28 deg pitch
  const TH = (40 * Math.PI) / 180,
    PH = (28 * Math.PI) / 180;
  const CT = Math.cos(TH),
    ST = Math.sin(TH),
    CP = Math.cos(PH),
    SP = Math.sin(PH);
  /** world (x = sigma/EXT, y = height, z = -omega/EXT) -> [screen right, screen up, depth (bigger = nearer)] */
  function proj(x, y, z) {
    const xp = x * CT + z * ST,
      zp = -x * ST + z * CT;
    return [xp, y * CP - zp * SP, zp];
  }
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
    gx,
    gy,
    SURF,
    mag,
    Hc,
    h,
    residues,
    proj,
    HEAT,
    LUT,
    fb,
    TH,
    PH,
  };
})();
