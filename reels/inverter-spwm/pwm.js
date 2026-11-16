// The maths of sine-triangle PWM for a three-phase two-level inverter. Plain JS: build.mjs runs it for the assertions, the page
// inlines the same text. Time is the fundamental angle theta (omega = 1), Vdc = 1.
globalThis.PWM = (function () {
  const M = 0.8, // modulation index: peak of the sine reference / peak of the triangle
    NS = 1680, // samples per fundamental period
    R = 1,
    L = 2; // load per phase: R = 1, omega L = 2 (series R-L, star connected)
  const TWO = 2 * Math.PI;
  // triangle carrier of period 1 in u: +1 at u = 0, -1 at u = 1/2
  const tri = (u) => 4 * Math.abs(u - Math.floor(u) - 0.5) - 1;
  /** one fundamental period of everything, with carrier ratio mf (may be fractional while the carrier is being stretched) */
  function wave(mf, ns = NS) {
    const c = new Float32Array(ns),
      va = new Float32Array(ns),
      vb = new Float32Array(ns),
      vc = new Float32Array(ns),
      Sa = new Uint8Array(ns),
      Sb = new Uint8Array(ns),
      Sc = new Uint8Array(ns),
      vab = new Float32Array(ns),
      van = new Float32Array(ns),
      ia = new Float32Array(ns);
    for (let k = 0; k < ns; k++) {
      const th = (TWO * k) / ns;
      c[k] = tri((mf * k) / ns);
      va[k] = M * Math.sin(th);
      vb[k] = M * Math.sin(th - TWO / 3);
      vc[k] = M * Math.sin(th + TWO / 3);
      Sa[k] = va[k] > c[k] ? 1 : 0;
      Sb[k] = vb[k] > c[k] ? 1 : 0;
      Sc[k] = vc[k] > c[k] ? 1 : 0;
      vab[k] = Sa[k] - Sb[k];
      van[k] = Sa[k] - (Sa[k] + Sb[k] + Sc[k]) / 3; // phase voltage across the star load
    }
    // series R-L load, exact step response per sample (the voltage is constant inside a sample); four periods, keep the last
    const e = Math.exp((-R / L) * (TWO / ns));
    let i = 0;
    for (let p = 0; p < 4; p++)
      for (let k = 0; k < ns; k++) {
        i = i * e + (van[k] / R) * (1 - e);
        if (p === 3) ia[k] = i;
      }
    return { c, va, vb, vc, Sa, Sb, Sc, vab, van, ia };
  }
  /** amplitude of harmonic h of a one-period signal x */
  function harm(x, h) {
    let re = 0,
      im = 0;
    const n = x.length;
    for (let k = 0; k < n; k++) {
      const a = (TWO * h * k) / n;
      re += x[k] * Math.cos(a);
      im -= x[k] * Math.sin(a);
    }
    return (2 / n) * Math.hypot(re, im);
  }
  /** total harmonic distortion of a one-period signal, harmonics 2 .. n/2 - 1 */
  function thd(x) {
    const f = harm(x, 1);
    let s = 0;
    for (let h = 2; h < x.length / 2; h++) s += harm(x, h) ** 2;
    return Math.sqrt(s) / f;
  }
  /** circular moving average of a 0/1 signal over one carrier period (what an LC filter does to the pulses) */
  function average(S, mf) {
    const n = S.length,
      w = Math.max(1, Math.round(n / mf));
    const out = new Float32Array(n);
    let s = 0;
    for (let k = -Math.floor(w / 2); k < w - Math.floor(w / 2); k++) s += S[(k + n) % n];
    for (let k = 0; k < n; k++) {
      out[k] = s / w;
      s += S[(k + w - Math.floor(w / 2)) % n] - S[(k - Math.floor(w / 2) + n) % n];
    }
    return out;
  }
  const I1 = M / 2 / Math.hypot(R, L); // peak of the fundamental of the phase current
  return { M, NS, R, L, TWO, tri, wave, harm, thd, average, I1 };
})();
