/* eslint-disable no-unused-vars */
/* The one data object. Every number, angle and colour on screen comes from here.
   Loaded in the browser (window.DATA) and by tools/make-sfx.mjs. */
(function (g) {
  const D2R = Math.PI / 180;
  const r4 = (x) => Math.round(x * 1e4) / 1e4;
  const f3 = (x) => {
    const v = Math.round(x * 1e3) / 1e3;
    return Math.abs(v) < 5e-4 ? "0" : v.toFixed(3);
  };
  const fmt = (x) => {
    const s = String(r4(Math.abs(x) < 5e-5 ? 0 : x));
    return s;
  };
  const Rx = (t) => {
    const c = Math.cos(t),
      s = Math.sin(t);
    return [1, 0, 0, 0, c, -s, 0, s, c];
  };
  const Ry = (t) => {
    const c = Math.cos(t),
      s = Math.sin(t);
    return [c, 0, s, 0, 1, 0, -s, 0, c];
  };
  const Rz = (t) => {
    const c = Math.cos(t),
      s = Math.sin(t);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  };
  const mul = (a, b) => {
    const r = [];
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        r.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
    return r;
  };
  const mv = (a, p) =>
    [0, 1, 2].map((i) => a[i * 3] * p[0] + a[i * 3 + 1] * p[1] + a[i * 3 + 2] * p[2]);
  const T3 = (a) => [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]];

  // ---- timeline landmarks (seconds, absolute). Sum = 178 s. ----
  const scenes = [
    ["hook", 0, 7],
    ["s1", 7, 28],
    ["s2", 28, 43],
    ["s3", 43, 70],
    ["s4", 70, 91],
    ["s5", 91, 106],
    ["s6", 106, 122],
    ["s7", 122, 141],
    ["recap", 141, 148],
    ["table", 148, 156],
    ["example", 156, 173],
    ["outro", 173, 178],
  ];
  const T = {};
  scenes.forEach(([k, a, b]) => (T[k] = { start: a, dur: b - a, end: b }));

  const C = {
    navy: "#0B1F3A",
    blue: "#1565FF",
    purple: "#7A3CFF",
    orange: "#F26B00",
    green: "#00945E",
    red: "#E5173F",
    gold: "#FFC21A",
    teal: "#18B5C8",
    bg1: "#F6F9FF",
    bg2: "#E4EDFD",
    ink2: "#4A5D7A",
    grid: "#1565FF",
  };

  // ---- Scene 1: single-axis rotation of a point ----
  const s1 = { P1: [1.4, 0.4, 0.9], theta: 60 };
  s1.P2z = mv(Rz(s1.theta * D2R), s1.P1);

  // ---- Scene 3/4: fixed XYZ = Euler ZYX ----
  const ang = { alpha: 40, beta: 35, gamma: 55 };
  const Rfinal = mul(mul(Rz(ang.alpha * D2R), Ry(ang.beta * D2R)), Rx(ang.gamma * D2R));

  // ---- Scene 6/7 + worked example (textbook Example 2.16) ----
  const ex = {
    Bp: [6, 2.8, 7.7],
    org: [3, 8.6, 2.9],
    ax: 45,
    ay: 30,
  };
  const Rraw = mul(Rx(ex.ax * D2R), Ry(ex.ay * D2R));
  // the textbook rounds every entry to 4 decimals first, then multiplies: reproduce that
  ex.R = Rraw.map(r4);
  const rows = [0, 1, 2].map((i) => {
    const terms = [0, 1, 2].map((j) => ex.R[i * 3 + j] * ex.Bp[j]);
    const sum = terms.reduce((a, b) => a + b, 0) + ex.org[i];
    return { terms, org: ex.org[i], val: r4(sum) };
  });
  ex.rows = rows;
  ex.Ap = rows.map((r) => r.val);
  ex.fmt = fmt;

  g.DATA = { D2R, r4, fmt, f3, Rx, Ry, Rz, mul, mv, T3, T, scenes, C, s1, ang, Rfinal, ex };
})(typeof window !== "undefined" ? window : globalThis);
