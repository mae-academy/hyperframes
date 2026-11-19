// The maths of a single-phase transformer and its core flux. Plain JS: build.mjs runs it for the assertions, the page inlines the same text.
// V1 = 230 V rms, f = 50 Hz, N1 = 500 turns, core area A = 20 cm2, magnetic path 0.5 m, a soft-saturating steel (Bs = 1.8 T).
globalThis.XF = (function () {
  const V1 = 230,
    F0 = 50,
    N1 = 500,
    A = 0.002,
    LC = 0.5,
    BS = 1.8,
    HS = 150,
    MU0 = 4e-7 * Math.PI,
    RL = 23; // load on the secondary
  const TWO = 2 * Math.PI;
  /** peak flux density: B = V sqrt(2) / (2 pi f N A)  (= V / (4.44 f N A) with V in volts rms) */
  const Bm = (f) => (V1 * Math.SQRT2) / (TWO * f * N1 * A);
  /** the B(H) curve of the core: a saturating tanh plus the vacuum slope that remains beyond saturation */
  const Bof = (H) => BS * Math.tanh(H / HS) + MU0 * H;
  function Hof(B) {
    const s = B < 0 ? -1 : 1,
      b = Math.abs(B);
    let lo = 0,
      hi = 1;
    while (Bof(hi) < b) hi *= 2;
    for (let i = 0; i < 70; i++) {
      const mid = (lo + hi) / 2;
      if (Bof(mid) < b) lo = mid;
      else hi = mid;
    }
    return (s * (lo + hi)) / 2;
  }
  /** magnetizing current that produces the flux density B: i = H l / N1 */
  const im = (B) => (Hof(B) * LC) / N1;
  /** monotone cubic keyframes (no overshoot, zero velocity at holds) */
  function mono(keys, t) {
    const n = keys.length;
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let i = 0;
    while (keys[i + 1][0] <= t) i++;
    const t0 = keys[i][0],
      t1 = keys[i + 1][0],
      dt = t1 - t0,
      u = (t - t0) / dt;
    const sl = (a, b) => (keys[b][1] - keys[a][1]) / (keys[b][0] - keys[a][0]);
    const tang = (k) => {
      if (k === 0 || k === n - 1) return 0;
      const s0 = sl(k - 1, k),
        s1 = sl(k, k + 1);
      return s0 * s1 <= 0 ? 0 : (2 * s0 * s1) / (s0 + s1);
    };
    const h00 = (1 + 2 * u) * (1 - u) * (1 - u),
      h10 = u * (1 - u) * (1 - u),
      h01 = u * u * (3 - 2 * u),
      h11 = u * u * (u - 1);
    return h00 * keys[i][1] + h10 * dt * tang(i) + h01 * keys[i + 1][1] + h11 * dt * tang(i + 1);
  }
  // the turns ratio N2/N1 and the frequency through the reel
  const AK = [
    [0, 2],
    [1.6, 2],
    [2.4, 1],
    [9.4, 1],
    [10.4, 2],
    [11.6, 2],
    [12.6, 0.5],
    [40, 0.5],
  ];
  const FK = [
    [0, 50],
    [18.0, 50],
    [19.0, 25],
    [40, 25],
  ];
  const aAt = (t) => mono(AK, t);
  const fAt = (t) => mono(FK, t);
  /** an ideal transformer feeding the load RL: voltages, currents, power */
  function ideal(a) {
    const V2 = V1 * a,
      I2 = V2 / RL,
      I1 = a * I2;
    return { V2, I2, I1, P1: V1 * I1, P2: V2 * I2 };
  }
  return {
    V1,
    F0,
    N1,
    A,
    LC,
    BS,
    HS,
    MU0,
    RL,
    TWO,
    Bm,
    Bof,
    Hof,
    im,
    mono,
    AK,
    FK,
    aAt,
    fAt,
    ideal,
  };
})();
