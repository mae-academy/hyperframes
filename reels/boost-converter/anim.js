// Timeline for "THE BOOST CONVERTER: VOLT-SECOND BALANCE" (22.8 s).
// The circuit with its live current path, the voltage bars, the inductor current with the switch state behind it, the inductor voltage
// with its equal areas, and the gain curve are drawn on a canvas from the time alone (hf-seek protocol); text, counters and cards are GSAP.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, PB, X, CK, GC, BARS } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind
    [2.2, "click"], // switch on: the coil charges
    [2.4, "snap"], // the converter starts to run
    [4.4, "click"], // switch off: the current must go on
    [4.6, "snap"], // through the diode
    [6.6, "click"], // volt-seconds must balance
    [6.8, "snap"], // area up = area down
    [9.0, "click"], // turn the duty up
    [9.2, "snap"], // D = 0.75, 48 V
    [11.6, "click"], // keep going
    [11.8, "snap"], // D = 0.9, 120 V
    [14.0, "click"], // the ideal gain goes to infinity
    [14.2, "snap"], // real losses bend the curve
    [16.4, "thump"], // lock
    [17.4, "click"], // a switch, a coil, a diode
    [18.8, "snap"], // CTA reveal
    [21.2, "click"], // engagement pulse
  ];
  // @CUES-END
  const EXPORT = [];
  const used = new Set();
  /** every cue is tied to the element that visibly appears at that instant (probed by verify.mjs) */
  function hit(t, kind, sel) {
    const i = CUES.findIndex((c) => c[0] === t && c[1] === kind);
    if (i < 0) throw new Error(`visual event at ${t}s (${kind}) has no CUES entry`);
    used.add(i);
    EXPORT.push({ t, kind, sel });
    return t;
  }
  let curBanner = "#bn0",
    curCount = "#c0",
    curForm = "#fm0";
  function bnSwap(n, t) {
    ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, t + 0.08);
    curBanner = n;
  }
  function cswap(n, t, pop) {
    if (curCount)
      ft(
        curCount,
        { opacity: 1 },
        { opacity: 0, duration: pop ? 0.12 : 0.05, ease: "power1.in" },
        t,
      );
    ft(
      n,
      { opacity: 0, scale: pop ? 1.18 : 1.05 },
      { opacity: 1, scale: 1, duration: pop ? 0.4 : 0.12, ease: pop ? "power3.out" : "power2.out" },
      t,
    );
    curCount = n;
  }
  function fswap(n, t) {
    if (curForm) ft(curForm, { opacity: 1 }, { opacity: 0, duration: 0.18, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, t + 0.08);
    curForm = n;
  }
  const pop = (sel, at, y) =>
    ft(
      sel,
      { opacity: 0, y: y === undefined ? 10 : y },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      at,
    );
  const fade = (sel, at, d) =>
    ft(sel, { opacity: 1 }, { opacity: 0, duration: d || 0.25, ease: "power1.in" }, at);

  // the labels of the finished picture are on screen at frame 0; they leave with the rewind and come back stage by stage
  gsap.set("#lMD,#lDx", { opacity: 1 });
  const HOOKED = ["#liL", "#lon", "#loff", "#lil2", "#lvL", "#lMD", "#lDx"];

  // ---------------------------------------------------------------- 0.0 - 2.2  the finished picture, then the rewind
  hit(0.0, "thump", "#flash0");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  hit(T.rewind0, "snap", "#rw");
  ft("#rw", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T.rewind0);
  tl.fromTo(
    "#rw",
    { opacity: 1 },
    { opacity: 0, duration: 0.7, ease: "power2.in", immediateRender: false },
    T.rewind0 + 0.4,
  );
  fade("#c0", T.rewind0, 0.3);
  fade("#fm0", T.rewind0, 0.3);
  HOOKED.forEach((s) => fade(s, T.rewind0, 0.3));
  curCount = null;
  curForm = null;

  /** one stage: the banner, the counter and the formula; everything else is drawn in the canvas */
  function stage(k) {
    const st = T.st[k],
      sw = T.sw[k];
    hit(st, "click", "#bn" + (k + 1));
    bnSwap("#bn" + (k + 1), st);
    hit(sw, "snap", "#c" + (k + 1));
    cswap("#c" + (k + 1), sw, true);
    fswap("#f" + (k + 1), sw + 0.3);
  }
  stage(0);
  ["#liL", "#lon", "#loff", "#lil1", "#lvL"].forEach((s) => pop(s, 2.5, 6));
  stage(1);
  stage(2);
  stage(3);
  fade("#lil1", 9.2, 0.25);
  pop("#lil2", 9.35, 6);
  pop("#lMD", 6.9, 6);
  pop("#lDx", 6.9, 6);
  stage(4);
  fade("#lil2", 11.8, 0.25);
  pop("#lil3", 11.95, 6);
  stage(5);
  pop("#lreal", 14.4, 6);

  // ---------------------------------------------------------------- the lock
  const LK = T.lock;
  hit(LK, "thump", "#glow");
  ft("#glow", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, LK);
  tl.fromTo(
    "#glow",
    { opacity: 1 },
    { opacity: 0, duration: 1.0, ease: "power2.inOut", immediateRender: false },
    LK + 0.2,
  );
  cswap("#cfin", LK + 0.3, true);
  fswap("#f7", LK + 0.6);
  hit(T.banF, "click", "#bnF");
  bnSwap("#bnF", T.banF);

  // ---------------------------------------------------------------- CTA
  hit(T.card, "snap", "#card");
  ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in" }, T.card - 0.1);
  ft("#banner", { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in" }, T.card - 0.1);
  ft("#card", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, T.card);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T.card + 0.1);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T.card + 0.4);
  ft("#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T.card + 0.7);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T.card + 1.1);
  hit(T.pulse, "click", "#ctaglow");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.45, duration: 0.25, ease: "power2.out" }, T.pulse);
  tl.fromTo(
    "#ctaglow",
    { opacity: 0.45 },
    { opacity: 0, duration: 0.6, ease: "power2.in", immediateRender: false },
    T.pulse + 0.35,
  );

  tl.to({}, { duration: 0.0001 }, 22.7999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t || a.kind.localeCompare(b.kind));

  // ================================================================ canvas
  const cvs = document.getElementById("cv");
  const ctx = cvs.getContext("2d");
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = Math.round(1080 * DPR);
  cvs.height = Math.round(1920 * DPR);

  const BLUE = "#0088FF",
    RED = "#FF0044",
    PURPLE = "#B026FF",
    WHITE = "#FFFFFF",
    DIMW = "rgba(255,255,255,.35)";
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
  const NS = 1500;
  const xP = (k) => X.x0 + (X.w * k) / NS;

  function poly(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }
  function line(pts, color, width, alpha, blur, dash) {
    if (pts.length < 2 || alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (dash) ctx.setLineDash(dash);
    if (blur) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    }
    poly(pts);
    ctx.stroke();
    ctx.restore();
  }
  function dot(x, y, r, color, alpha, blur) {
    if (alpha <= 0.001 || r <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = blur === undefined ? 14 : blur;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
  const seg = (x1, y1, x2, y2, color, w, a, blur) =>
    line(
      [
        [x1, y1],
        [x2, y2],
      ],
      color,
      w,
      a,
      blur,
    );
  const rect = (x, y, w, h, color, a) => {
    if (a <= 0.001 || w <= 0 || h <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };
  /** runs of equal switch state: [from, to, on] */
  function runs(on) {
    const out = [];
    let a = 0;
    for (let k = 1; k <= NS; k++)
      if (k === NS || on[k] !== on[a]) {
        out.push([a, k, on[a]]);
        a = k;
      }
    return out;
  }

  // ---------------------------------------------------------------- the state at time t
  const hookA = (t) => (t < T.rewind0 ? 1 : 1 - smooth((t - T.rewind0) / 0.5));
  const phase = (t) => {
    if (t < T.t0) return 0.35;
    const c = (t - T.t0) / T.WIN;
    return c - Math.floor(c);
  };

  // ---------------------------------------------------------------- the circuit
  const G = { top: 470, bot: 700, xL0: 210, xL1: 350, xX: 410, xY: 570, xR: 630 };
  const PATH_ON = [
    [150, G.top],
    [G.xX, G.top],
    [G.xX, 520],
    [G.xX, 600],
    [G.xX, G.bot],
  ];
  const PATH_OFF = [
    [150, G.top],
    [G.xX, G.top],
    [G.xY, G.top],
  ];
  const PATH_R = [
    [G.xY, G.top],
    [G.xR, G.top],
    [G.xR, G.bot],
  ];
  const PATH_C = [
    [G.xY, G.top],
    [G.xY, G.bot],
  ];
  function along(path, u) {
    let tot = 0;
    const lens = [];
    for (let i = 1; i < path.length; i++) {
      const l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
      lens.push(l);
      tot += l;
    }
    let d = u * tot;
    for (let i = 0; i < lens.length; i++) {
      if (d <= lens[i] || i === lens.length - 1) {
        const f = clamp01(d / lens[i]);
        return [
          path[i][0] + (path[i + 1][0] - path[i][0]) * f,
          path[i][1] + (path[i + 1][1] - path[i][1]) * f,
        ];
      }
      d -= lens[i];
    }
    return path[path.length - 1];
  }
  function flow(path, color, n, speed, t, alpha) {
    if (alpha <= 0.001) return;
    for (let i = 0; i < n; i++) {
      const u = (i / n + t * speed) % 1;
      const p = along(path, u);
      dot(p[0], p[1], 5, color, alpha, 10);
    }
  }
  function coil(x0, x1, y, color, alpha, blur) {
    const n = 5,
      w = (x1 - x0) / n;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    if (blur) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    }
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      ctx.moveTo(x0 + k * w, y);
      ctx.arc(x0 + k * w + w / 2, y, w / 2, Math.PI, 0, false);
    }
    ctx.stroke();
    ctx.restore();
  }
  function drawCircuit(t, on, il) {
    const run = t >= T.t0 ? 1 : 1; // the circuit is always alive
    // wires (dim) with the T-shaped rails
    const dim = DIMW;
    seg(150, G.top - 20, 150, G.top, WHITE, 4, 0.8);
    seg(128, G.top - 20, 172, G.top - 20, WHITE, 4, 0.8);
    seg(150, G.top, G.xL0, G.top, dim, 3, 1);
    seg(G.xL1, G.top, G.xX, G.top, dim, 3, 1);
    seg(G.xX, G.top, 470, G.top, dim, 3, 1);
    seg(514, G.top, G.xY, G.top, dim, 3, 1);
    seg(G.xY, G.top, G.xR, G.top, dim, 3, 1);
    seg(G.xX, G.top, G.xX, 520, dim, 3, 1);
    seg(G.xX, 600, G.xX, G.bot, dim, 3, 1);
    seg(G.xY, G.top, G.xY, 565, dim, 3, 1);
    seg(G.xY, 585, G.xY, G.bot, dim, 3, 1);
    seg(G.xR, G.top, G.xR, 545, dim, 3, 1);
    seg(G.xR, 625, G.xR, G.bot, dim, 3, 1);
    seg(150, G.bot, G.xR + 10, G.bot, dim, 3, 1);
    seg(150, G.bot, 150, G.bot + 20, WHITE, 4, 0.8);
    seg(128, G.bot + 20, 172, G.bot + 20, WHITE, 4, 0.8);
    // the capacitor and the load
    seg(G.xY - 22, 565, G.xY + 22, 565, WHITE, 4, 0.7);
    seg(G.xY - 22, 585, G.xY + 22, 585, WHITE, 4, 0.7);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.lineWidth = 3;
    ctx.strokeRect(G.xR - 13, 545, 26, 80);
    ctx.restore();
    // the active path takes the colour of the state: red while the switch is closed, blue while it is open
    const col = on ? RED : BLUE;
    if (on) {
      line(PATH_ON, RED, 5, 1, 12);
    } else {
      line(PATH_OFF, BLUE, 5, 1, 12);
      line(PATH_C, BLUE, 4, 0.9, 10);
    }
    line(PATH_R, BLUE, 4, on ? 0.35 : 0.95, on ? 0 : 10);
    // the inductor glows with the energy it holds
    coil(G.xL0, G.xL1, G.top, col, 0.5 + 0.5 * il, 14);
    // the switch: closed (a straight link) or open (the lever swung away)
    seg(G.xX, 520, G.xX, 535, WHITE, 4, 0.9);
    seg(G.xX, 585, G.xX, 600, WHITE, 4, 0.9);
    dot(G.xX, 520, 5, WHITE, 0.9, 0);
    dot(G.xX, 600, 5, WHITE, 0.9, 0);
    if (on) seg(G.xX, 520, G.xX, 600, RED, 6, 1, 14);
    else seg(G.xX, 600, G.xX + 34, 538, "rgba(255,255,255,.55)", 5, 1);
    // the diode: it conducts only while the switch is open
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = on ? "rgba(255,255,255,.18)" : BLUE;
    ctx.strokeStyle = on ? DIMW : BLUE;
    ctx.lineWidth = 3;
    if (!on) {
      ctx.shadowColor = BLUE;
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.moveTo(470, G.top - 16);
    ctx.lineTo(470, G.top + 16);
    ctx.lineTo(508, G.top);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(512, G.top - 16);
    ctx.lineTo(512, G.top + 16);
    ctx.stroke();
    ctx.restore();
    dot(G.xX, G.top, 6, WHITE, 1, 0);
    dot(G.xY, G.top, 6, WHITE, 1, 0);
    // charge flowing along the active path
    const ts = t < T.t0 ? 1.0 : t;
    if (on) flow(PATH_ON, RED, 8, 0.9, ts, 1);
    else {
      flow(PATH_OFF, BLUE, 6, 0.9, ts, 1);
      flow(PATH_C, BLUE, 4, 0.7, ts, 0.8);
    }
    flow(PATH_R, BLUE, 5, 0.6, ts, on ? 0.45 : 1);
    return run;
  }

  // ---------------------------------------------------------------- the bars: Vin and Vo
  function drawBars(t, D) {
    const ramp = t < T.t0 ? 1 : smooth((t - T.t0) / 0.8);
    const M = t < T.t0 ? BOOST.gain(D) : 1 + (BOOST.gain(D) - 1) * ramp;
    const vin = BOOST.VIN,
      vo = vin * M;
    seg(BARS.xi - 14, BARS.y0, BARS.xo + BARS.bw + 14, BARS.y0, WHITE, 2, 0.4);
    rect(BARS.xi, BARS.y0 - vin * BARS.k, BARS.bw, vin * BARS.k, WHITE, 0.9);
    ctx.save();
    ctx.shadowColor = RED;
    ctx.shadowBlur = 18;
    rect(BARS.xo, BARS.y0 - vo * BARS.k, BARS.bw, vo * BARS.k, RED, 0.95);
    ctx.restore();
    // the real converter loses some of it (the coil has resistance)
    if (t >= T.sw[5]) {
      const vr = vin * BOOST.gainReal(D),
        a = smooth((t - T.sw[5] - 0.2) / 0.4);
      seg(
        BARS.xo - 10,
        BARS.y0 - vr * BARS.k,
        BARS.xo + BARS.bw + 10,
        BARS.y0 - vr * BARS.k,
        WHITE,
        4,
        a,
        8,
      );
    }
  }

  // ---------------------------------------------------------------- the inductor current, the switch state behind it
  function drawCurrent(t, W, kC) {
    const a = t < 2.1 ? hookA(t) : t < T.t0 ? 0 : 1;
    if (a <= 0.001) return;
    const p = t < 2.1 ? 1 : clamp01((t - T.t0) / 1.2);
    const nEnd = Math.round(NS * p);
    // the switch state: red band while it is closed, blue while it is open
    for (const [from, to, on] of runs(W.on)) {
      const e = Math.min(to, nEnd);
      if (e <= from) continue;
      rect(
        xP(from),
        PB[1] + 14,
        xP(e) - xP(from),
        PB[3] - 28,
        on ? RED : BLUE,
        (on ? 0.16 : 0.1) * a,
      );
    }
    seg(X.x0, 935, X.x0 + X.w, 935, WHITE, 2, 0.3 * a);
    const pts = [];
    for (let k = 0; k < nEnd; k++) pts.push([xP(k), 935 - ((W.il[k] - W.s.IL) / W.s.dI) * 60]);
    line(pts, PURPLE, 6, a, 14);
    // legend swatches
    rect(262, 850, 22, 16, RED, a * 0.9);
    rect(352, 850, 22, 16, BLUE, a * 0.9);
    seg(X.x0 + 6, 858, X.x0 + 30, 858, PURPLE, 5, 0);
    if (a > 0.001 && p >= 1) {
      seg(xP(kC), PB[1] + 14, xP(kC), PB[1] + PB[3] - 14, WHITE, 2, 0.4 * a);
      dot(xP(kC), 935 - ((W.il[kC] - W.s.IL) / W.s.dI) * 60, 8, PURPLE, a, 16);
    }
  }

  // ---------------------------------------------------------------- the inductor voltage with its equal areas, and the gain curve
  const yV = (v) => CK.yl0 - (v / BOOST.VIN) * CK.kl;
  const xV = (k) => CK.xl0 + (CK.xlw * k) / NS;
  function drawVoltage(t, W) {
    const a = t < 2.1 ? hookA(t) : t < T.t0 ? 0 : 1;
    if (a <= 0.001) return;
    const p = t < 2.1 ? 1 : clamp01((t - T.t0) / 1.2);
    const nEnd = Math.round(NS * p);
    seg(CK.xl0, CK.yl0, CK.xl0 + CK.xlw, CK.yl0, WHITE, 2, 0.35 * a);
    const sh = t < 2.1 ? hookA(t) : smooth((t - T.sw[2]) / 0.5); // the areas appear when volt-seconds are discussed
    for (const [from, to, on] of runs(W.on)) {
      const e = Math.min(to, nEnd);
      if (e <= from) continue;
      const y = yV(on ? BOOST.VIN : BOOST.VIN - W.s.Vo);
      rect(
        xV(from),
        Math.min(CK.yl0, y),
        xV(e) - xV(from),
        Math.abs(y - CK.yl0),
        on ? RED : BLUE,
        0.45 * sh * a,
      );
    }
    const pts = [];
    for (let k = 0; k < nEnd; k++) pts.push([xV(k), yV(W.vl[k])]);
    line(pts, WHITE, 3, 0.9 * a);
  }
  const gx = (D) => GC.x0 + (GC.w * D) / GC.dmax;
  const gy = (M) => GC.y0 - GC.k * Math.min(M, 10.4);
  function drawGain(t, D) {
    const a = t < 2.1 ? hookA(t) : smooth((t - 6.7) / 0.4);
    if (a <= 0.001) return;
    seg(GC.x0 - 4, GC.y0, GC.x0 + GC.w + 8, GC.y0, WHITE, 2, 0.4 * a);
    seg(GC.x0, GC.y0 + 4, GC.x0, gy(10.4), WHITE, 2, 0.4 * a);
    seg(GC.x0, gy(1), GC.x0 + GC.w, gy(1), WHITE, 1, 0.15 * a);
    const ideal = [];
    for (let d = 0; d <= GC.dmax + 1e-9; d += 0.01) ideal.push([gx(d), gy(BOOST.gain(d))]);
    line(ideal, RED, 5, a, 10);
    // the real curve (a coil with 0.1 ohm): it peaks and then falls
    if (t >= T.sw[5]) {
      const p = clamp01((t - T.sw[5]) / 1.2),
        real = [];
      for (let d = 0; d <= GC.dmax * p + 1e-9; d += 0.01) real.push([gx(d), gy(BOOST.gainReal(d))]);
      line(real, WHITE, 4, a, 8, [10, 8]);
      if (p >= 1) dot(gx(D), gy(BOOST.gainReal(D)), 7, WHITE, a, 14);
    }
    dot(gx(D), gy(BOOST.gain(D)), 9, RED, a, 18);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gx(D), gy(BOOST.gain(D)), 15, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
    // legend swatch of the real curve
    if (t >= T.sw[5]) seg(703, 1100, 731, 1100, WHITE, 4, smooth((t - T.sw[5] - 0.2) / 0.3), 0);
  }

  function drawLock(t) {
    const u = t - T.lock;
    if (u < 0 || u > 1.3) return;
    const cx = 540,
      cy = 790;
    if (u < 0.5) {
      const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 700);
      g.addColorStop(0, "rgba(176,38,255," + (0.3 * (1 - u / 0.5)).toFixed(3) + ")");
      g.addColorStop(1, "rgba(176,38,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1920);
    }
    if (u < 0.6) {
      const x = 90 + 900 * easeOut(u / 0.55);
      ctx.save();
      ctx.globalAlpha = 1 - smooth((u - 0.45) / 0.15);
      ctx.shadowColor = PURPLE;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.moveTo(x, 340);
      ctx.lineTo(x, 1230);
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    [
      [90, 340],
      [990, 340],
      [90, 1230],
      [990, 1230],
    ].forEach(([x, y], i) => {
      const v = clamp01((u - 0.1 - i * 0.05) / 0.5);
      if (v <= 0 || v >= 1) return;
      const r = 20 * Math.sin(Math.PI * v) + 4;
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r);
      ctx.lineTo(x, y + r);
      ctx.stroke();
      ctx.restore();
    });
    [
      [PURPLE, 660, 0, 0.7],
      [RED, 520, 0.1, 0.6],
    ].forEach(([c, R, d0, dur]) => {
      const v = clamp01((u - d0) / dur);
      if (v <= 0 || v >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - v;
      ctx.strokeStyle = c;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + R * easeOut(v), 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    });
    CFG.spark.forEach((sp, i) => {
      const v = clamp01((u - 0.05) / 0.8);
      if (v <= 0 || v >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - v;
      ctx.fillStyle = i % 3 === 0 ? RED : i % 3 === 1 ? PURPLE : "#fff";
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(sp.a) * sp.d * easeOut(v),
        cy + Math.sin(sp.a) * sp.d * easeOut(v),
        sp.r,
        0,
        2 * Math.PI,
      );
      ctx.fill();
      ctx.restore();
    });
  }

  function draw(t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, 1080, 1920);
    const D = BOOST.Dat(t);
    const W = BOOST.wave(D, NS, 3);
    const ph = phase(t);
    const kC = Math.min(NS - 1, Math.floor(NS * ph));
    const on = 3 * ph - Math.floor(3 * ph) < D;
    const il = clamp01((W.il[kC] - W.s.Imin) / W.s.dI);
    drawCircuit(t, on, il);
    drawBars(t, D);
    drawCurrent(t, W, kC);
    drawVoltage(t, W);
    drawGain(t, D);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
