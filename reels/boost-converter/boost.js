// The maths of an ideal boost converter in continuous conduction (CCM). Plain JS: build.mjs runs it for the assertions, the page
// inlines the same text. Vin = 12 V, switching period T = 20 us (50 kHz), L = 100 uH, C = 100 uF, load R = 24 ohm.
globalThis.BOOST = (function () {
  const VIN = 12,
    T = 20e-6,
    L = 100e-6,
    C = 100e-6,
    R = 24,
    RL = 0.1; // series resistance of the inductor (the "real" curve)
  /** monotone cubic through [t, value] keys: no overshoot, zero velocity at holds */
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
  // the duty cycle through the reel: 0.75 for the hook, 0.5, then up to 0.75 and 0.9
  const DK = [
    [0, 0.75],
    [1.6, 0.75],
    [2.4, 0.5],
    [9.2, 0.5],
    [10.4, 0.75],
    [11.8, 0.75],
    [13.0, 0.9],
    [40, 0.9],
  ];
  const Dat = (t) => mono(DK, t);
  /** ideal and real voltage gain */
  const gain = (D) => 1 / (1 - D);
  const gainReal = (D) => 1 / ((1 - D) * (1 + RL / (R * (1 - D) * (1 - D))));
  /** steady state of the ideal converter at duty D */
  function steady(D) {
    const Vo = VIN * gain(D),
      Io = Vo / R,
      IL = Io / (1 - D),
      dI = (VIN * D * T) / L;
    return { Vo, Io, IL, dI, Imin: IL - dI / 2, Imax: IL + dI / 2 };
  }
  /** n samples over `nper` switching periods: switch state, inductor current, inductor voltage */
  function wave(D, n = 1500, nper = 3) {
    const s = steady(D),
      on = new Uint8Array(n),
      il = new Float32Array(n),
      vl = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      const x = (nper * k) / n,
        tau = x - Math.floor(x);
      if (tau < D) {
        on[k] = 1;
        il[k] = s.Imin + (s.dI * tau) / D;
        vl[k] = VIN;
      } else {
        il[k] = s.Imax - (s.dI * (tau - D)) / (1 - D);
        vl[k] = VIN - s.Vo;
      }
    }
    return { on, il, vl, s };
  }
  /** the switched circuit itself (ideal switch and diode), integrated from the ideal operating point: independent check */
  function simulate(D, rl, periods, n = 1000) {
    const s = steady(D);
    let i = s.IL,
      v = s.Vo;
    const dt = T / n;
    let sumV = 0,
      sumI = 0,
      cnt = 0,
      imin = 1e9,
      imax = -1e9;
    for (let p = 0; p < periods; p++)
      for (let k = 0; k < n; k++) {
        if (k < D * n) {
          i += (dt * (VIN - rl * i)) / L;
          v += (dt * (-v / R)) / C;
        } else {
          v += (dt * (i - v / R)) / C;
          i += (dt * (VIN - rl * i - v)) / L;
        }
        if (p >= periods - 5) {
          sumV += v;
          sumI += i;
          cnt++;
          imin = Math.min(imin, i);
          imax = Math.max(imax, i);
        }
      }
    return { Vo: sumV / cnt, IL: sumI / cnt, dI: imax - imin };
  }
  return { VIN, T, L, C, R, RL, mono, DK, Dat, gain, gainReal, steady, wave, simulate };
})();
