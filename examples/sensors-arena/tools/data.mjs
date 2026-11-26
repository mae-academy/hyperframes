// ONE data object: every number on screen comes from here (or is computed from it).
const eps0_pF_per_m = 8.854; // pF/m
export const D = {
  fps: 30,
  scenes: { lab: [0, 114], table: [114, 133], example: [133, 162], outro: [162, 170] },
  // --- illustrative values for the four transducers (textbook gives symbols, not numbers) ---
  pot: { E: 10, L: 100, dEnd: 70, loadK: 1.5 }, // V, mm, mm, R_p/R_L at the edge case
  cap: { A_side: 36, gapMin: 4, gapLand: 20, gapMax: 60, epsR: 1, eps0: eps0_pF_per_m }, // mm, mm, mm, -, pF/m
  diff: { E: 10, d: 20, xMax: 17 }, // V, mm, mm
  lvdt: { xr: 12, E0atRange: 4, xMax: 20, coreLen: 50 }, // mm (linear range), V, mm
  // --- textbook worked example: RLC impedance uncertainty (Ch.3 "Sensitivity analysis") ---
  rlc: { R: 2000, dR: 100, L: 0.8, dL: 0.04, C: 5e-6, dC: 0.25e-6, f: 60 },
  tb: {
    pot: { linMin: 0.01, linMax: 1.5 },
    lvdt: { res: 0.05, rangeMin: 0.1, rangeMax: 300, acc: 0.5 },
  },
  textbookPrinted: { dZ: 99.9, pct: 4.96, dZdR: 0.999 },
  tex: {
    E: "E",
    L: "L",
    d: "d",
    V: "V",
    x: "x",
    C: "C",
    A: "A",
    Z: "Z",
    R: "R",
    N: "N",
    eps: "\\epsilon_r\\epsilon_0",
    P1: "P_1",
    P2: "P_2",
    E1: "E_1",
    E2: "E_2",
    ES1: "E_{S1}",
    ES2: "E_{S2}",
    E0: "E_0",
    dE: "\\Delta E",
    dC: "\\Delta C",
    XL: "X_L",
    XC: "X_C",
    RL: "R_L",
    Rp: "R_p",
    S: "S",
    dZ: "\\Delta Z",
    dN: "\\Delta N",
    xi: "x_i",
    f: "f",
    dR: "\\Delta R",
    dXL: "\\Delta X_L",
    dXC: "\\Delta X_C",
    Ohm: "\\Omega",
    pi: "2\\pi f",
    f_pot: "V = E\\,\\dfrac{d}{L}",
    f_cap: "C = \\dfrac{\\epsilon_r \\epsilon_0 A}{d}",
    s_cap: "S = \\dfrac{\\partial C}{\\partial d} = -\\dfrac{\\epsilon_r \\epsilon_0 A}{d^{2}}",
    f_diff: "\\Delta E = E_1 - E_2 = \\dfrac{x}{d}\\,E",
    s_diff: "S = \\dfrac{\\Delta E}{x} = \\dfrac{E}{d}",
    f_lvdt: "E_0 = E_{S1} - E_{S2}",
    f_err:
      "\\Delta N = \\left|\\dfrac{\\partial N}{\\partial x_1}\\right|\\Delta x_1 + \\left|\\dfrac{\\partial N}{\\partial x_2}\\right|\\Delta x_2 + \\cdots",
    f_Z: "Z = \\sqrt{R^{2} + (X_L - X_C)^{2}}",
    f_XL: "X_L = 2\\pi f L",
    f_XC: "X_C = \\dfrac{1}{2\\pi f C}",
    f_dZ: "\\Delta Z = \\left|\\dfrac{\\partial Z}{\\partial R}\\right|\\Delta R + \\left|\\dfrac{\\partial Z}{\\partial X_L}\\right|\\Delta X_L + \\left|\\dfrac{\\partial Z}{\\partial X_C}\\right|\\Delta X_C",
    pZR: "\\dfrac{\\partial Z}{\\partial R}",
    pZXL: "\\dfrac{\\partial Z}{\\partial X_L}",
    pZXC: "\\dfrac{\\partial Z}{\\partial X_C}",
    in_out: "x \\rightarrow V",
    ohm100: "\\pm 100\\,\\Omega",
    dZres: "\\Delta Z \\approx 104\\,\\Omega",
  },
};
// ---- derived (computed once, shared by every scene) ----
const r = D.rlc,
  w = 2 * Math.PI * r.f;
const XL = w * r.L,
  XC = 1 / (w * r.C),
  Z = Math.sqrt(r.R ** 2 + (XL - XC) ** 2);
const dXL = w * r.dL,
  dXC = XC * (r.dC / r.C);
const p = { R: r.R / Z, XL: (XL - XC) / Z, XC: -(XL - XC) / Z };
const c = { R: Math.abs(p.R) * r.dR, XL: Math.abs(p.XL) * dXL, XC: Math.abs(p.XC) * dXC };
const sum = c.R + c.XL + c.XC;
D.rlcOut = {
  XL,
  XC,
  Z,
  dXL,
  dXC,
  p,
  c,
  sum,
  pct: (100 * sum) / Z,
  rss: Math.hypot(c.R, c.XL, c.XC),
};
D.cap.A_mm2 = D.cap.A_side ** 2;
D.cap.C = (g) => (D.cap.epsR * D.cap.eps0 * (D.cap.A_mm2 * 1e-6)) / (g * 1e-3); // pF
D.cap.S = (g) => (-(D.cap.epsR * D.cap.eps0 * (D.cap.A_mm2 * 1e-6)) / (g * 1e-3) ** 2) * 1e-3; // pF per mm

D.pot.pct = (100 * D.pot.dEnd) / D.pot.L;
const f1 = (v, n = 1) => v.toFixed(n);
Object.assign(D.tex, {
  giv_R: `R = ${r.R} \\pm ${r.dR}\\,\\Omega`,
  giv_L: `L = ${r.L} \\pm ${r.dL}\\,\\mathrm{H}`,
  giv_C: `C = ${r.C * 1e6} \\pm ${r.dC * 1e6}\\,\\mu\\mathrm{F}`,
  giv_f: `f = ${r.f}\\,\\mathrm{Hz}`,
  v_R: `${r.R}\\,\\Omega`,
  v_XL: `${f1(D.rlcOut.XL)}\\,\\Omega`,
  v_XC: `${f1(D.rlcOut.XC)}\\,\\Omega`,
  val_XL: `X_L = ${f1(D.rlcOut.XL)}\\,\\Omega`,
  val_XC: `X_C = ${f1(D.rlcOut.XC)}\\,\\Omega`,
  val_Z: `Z = ${f1(D.rlcOut.Z, 0)}\\,\\Omega`,
  dXL_v: `${f1(D.rlcOut.dXL, 2)}\\,\\Omega`,
  dXC_v: `${f1(D.rlcOut.dXC, 2)}\\,\\Omega`,
  dR_v: `${r.dR}\\,\\Omega`,
  p_R: f1(Math.abs(D.rlcOut.p.R), 3),
  p_XL: f1(Math.abs(D.rlcOut.p.XL), 3),
  p_XC: f1(Math.abs(D.rlcOut.p.XC), 3),
  c_R: f1(D.rlcOut.c.R),
  c_XL: f1(D.rlcOut.c.XL),
  c_XC: f1(D.rlcOut.c.XC),
  tot: `\\Delta Z = ${f1(D.rlcOut.sum)}\\,\\Omega`,
  pct: `\\dfrac{\\Delta Z}{Z} = ${f1(D.rlcOut.pct, 2)}\\,\\%`,
});
