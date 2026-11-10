// Shared image model for the Micron Inspector reel. Evaluated by build.mjs (measurements) and embedded in the
// page (so the numbers on screen and the numbers the build asserts come from the same code).
// Sensor model: backlit part, dark part 20 / bright hole 235, optical blur sigma 1.2 px, sensor noise sigma 3.
// eslint-disable-next-line no-unused-vars
const CV = (function () {
  const UM = 8,
    PSF = 1.2,
    NOISE = 3,
    BRIGHT = 235,
    DARK = 20;
  const imul = Math.imul;
  function hash(a, b, c) {
    let h = (imul(a | 0, 374761393) + imul(b | 0, 668265263) + imul(c | 0, 2147483647)) | 0;
    h = imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }
  // deterministic N(0,1) per (a, b, c): sum of four hashed uniforms (Irwin-Hall)
  function gauss(a, b, c) {
    let h = hash(a, b, c),
      s = 0;
    for (let k = 0; k < 4; k++) {
      h = (h + 0x6d2b79f5) | 0;
      let t = imul(h ^ (h >>> 15), 1 | h);
      t = (t + imul(t ^ (t >>> 7), 61 | t)) ^ t;
      s += ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return (s - 2) * 1.7320508;
  }
  function erf(x) {
    const s = Math.sign(x),
      a = Math.abs(x),
      t = 1 / (1 + 0.3275911 * a);
    const y =
      1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
        t *
        Math.exp(-a * a);
    return s * y;
  }
  const Phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  // clean intensity at signed distance d (px) from the hole edge; d < 0 is inside the (bright) hole
  const Iclean = (d) => DARK + (BRIGHT - DARK) * Phi(-d / PSF);
  const clip = (v) => Math.max(0, Math.min(255, Math.round(v)));
  // pixel (ix, iy) of the sensor: value at the pixel centre, plus noise
  function pix(ix, iy, H, salt) {
    const d = Math.hypot(ix + 0.5 - H.cx, iy + 0.5 - H.cy) - H.R;
    return clip(Iclean(d) + NOISE * gauss(ix, iy, salt));
  }
  return { UM, PSF, NOISE, BRIGHT, DARK, hash, gauss, erf, Phi, Iclean, clip, pix };
})();
