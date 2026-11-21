// The maths of a three-phase brushless DC motor with trapezoidal back-EMF and six-step (120 degree) commutation.
// Plain JS: build.mjs runs it for the assertions, the page inlines the same text. Angles are electrical degrees (a 2-pole rotor, so they
// are also mechanical). Ke = Kt = 0.05 (line to line), Vdc = 24 V, Rll = 1 ohm, load torque 0.1 N m.
globalThis.BLDC = (function () {
  const VDC = 24,
    KE = 0.05,
    RLL = 1.0,
    TL = 0.1,
    SLOW = 100; // the picture is slowed down by this factor
  const DEG = Math.PI / 180;
  /** normalised trapezoid: +1 for 120 degrees, -1 for 120 degrees, 60 degree ramps between (x in degrees) */
  function trap(x) {
    const y = ((((x + 30) % 360) + 360) % 360) - 30; // [-30, 330)
    if (y < 30) return y / 30;
    if (y < 150) return 1;
    if (y < 210) return 1 - (2 * (y - 150)) / 60;
    return -1;
  }
  const emf = (n, th) => trap(th - 120 * n); // phase n = 0 (A), 1 (B), 2 (C): normalised back-EMF of the rotor at angle th
  // the six steps: [phase connected to +, phase connected to -]; step k covers th in [30 + 60 k, 90 + 60 k)
  const PAIRS = [
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 0],
    [2, 0],
    [2, 1],
  ];
  const stepOf = (th) => Math.floor(((((th - 30) % 360) + 360) % 360) / 60);
  const ha = (th) => {
    const x = ((th % 360) + 360) % 360;
    return x >= 30 && x < 210 ? 1 : 0;
  };
  /** the three Hall sensors: 180 degree wide square waves, 120 degrees apart */
  const hall = (th) => [ha(th), ha(th - 120), ha(th + 120)];
  /** phase currents (+I, -I, 0) that six-step commutation drives at rotor angle th */
  function currents(th, I) {
    const i = [0, 0, 0],
      p = PAIRS[stepOf(th)];
    i[p[0]] = I;
    i[p[1]] = -I;
    return i;
  }
  /** direction (degrees) of the stator field made by those currents: the sum of the three phase axes (0, 120, 240 degrees) weighted by current */
  function mmfAngle(th) {
    const i = currents(th, 1);
    let x = 0,
      y = 0;
    for (let n = 0; n < 3; n++) {
      x += i[n] * Math.cos(120 * n * DEG);
      y += i[n] * Math.sin(120 * n * DEG);
    }
    return Math.atan2(y, x) / DEG;
  }
  /** direction of the rotor's north pole when the back-EMF is at angle th */
  const rotorAngle = (th) => th - 180;
  /** speed (rad/s) and current (A) in steady state at duty D with a constant load torque */
  const steadyI = TL / KE;
  const steadyW = (D) => (D * VDC - steadyI * RLL) / KE;
  const rpm = (w) => (w * 60) / (2 * Math.PI);
  const omegaVis = (D) => steadyW(D) / SLOW;
  /** the switched motor integrated in time: L di/dt = D Vdc - R i - Ke w, J dw/dt = Kt i - TL (PWM averaged) */
  function simulate(D, T = 0.6) {
    const L = 1e-3,
      J = 1e-4,
      dt = 1e-5;
    let i = 0,
      w = 0;
    for (let k = 0; k < T / dt; k++) {
      i += (dt * (D * VDC - RLL * i - KE * w)) / L;
      w += (dt * (KE * i - TL)) / J;
    }
    return { i, w };
  }
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
  // the duty cycle through the reel: 0.7 for the hook, 0.4, then up to 0.7 and 1.0
  const DK = [
    [0, 0.7],
    [1.6, 0.7],
    [2.4, 0.4],
    [17.2, 0.4],
    [18.4, 0.7],
    [19.4, 0.7],
    [20.6, 1.0],
    [40, 1.0],
  ];
  const Dat = (t) => mono(DK, t);
  return {
    VDC,
    KE,
    RLL,
    TL,
    SLOW,
    DEG,
    trap,
    emf,
    PAIRS,
    stepOf,
    hall,
    currents,
    mmfAngle,
    rotorAngle,
    steadyI,
    steadyW,
    rpm,
    omegaVis,
    simulate,
    mono,
    DK,
    Dat,
  };
})();
