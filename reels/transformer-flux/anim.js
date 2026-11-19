// Timeline for "THE TRANSFORMER: IT IS ALL ABOUT THE FLUX" (26.0 s).
// The core with its flux and two coils, the flux and the voltages over two cycles, the turns ratio, the ampere-turn balance and the
// saturation of the core (B-H curve and magnetizing current) are drawn on a canvas from the time alone (hf-seek protocol); text,
// counters and cards are GSAP. Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, PB, PC, PLOT } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind
    [2.2, "click"], // a changing flux induces voltage
    [2.4, "snap"], // v = N dphi/dt
    [4.6, "click"], // the flux lags the voltage
    [4.8, "snap"], // phi = (1/N) int v dt
    [7.0, "click"], // one core, two coils
    [7.2, "snap"], // V2/V1 = N2/N1
    [9.4, "snap"], // N2 = 2 N1
    [11.6, "snap"], // N2 = N1 / 2
    [13.8, "click"], // the ampere-turns balance
    [14.0, "snap"], // N1 I1 = N2 I2
    [16.6, "click"], // too much flux saturates the core
    [16.8, "snap"], // B = V / (4.44 f N A)
    [18.0, "snap"], // half the frequency, double the flux
    [19.6, "thump"], // lock
    [20.6, "click"], // volts per hertz set the flux
    [22.0, "snap"], // CTA reveal
    [24.4, "click"], // engagement pulse
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

  // the finished picture is on screen at frame 0; its labels leave with the rewind and come back stage by stage
  gsap.set("#lBHB,#lBHH,#lim", { opacity: 1 });
  const HOOKED = ["#lN2", "#lv2", "#lV1b", "#lV2b", "#lv2l", "#lBHB", "#lBHH", "#lim"];

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

  /** one beat: the counter and the formula (the picture moves in the canvas) */
  function beat(ci, fi, at) {
    hit(at, "snap", "#c" + ci);
    cswap("#c" + ci, at, true);
    fswap("#f" + fi, at + 0.3);
  }
  const bannerAt = (k) => {
    hit(T.st[k], "click", "#bn" + (k + 1));
    bnSwap("#bn" + (k + 1), T.st[k]);
  };
  bannerAt(0);
  beat(1, 1, T.sw[0]);
  bannerAt(1);
  beat(2, 2, T.sw[1]);
  pop("#l90", 4.9, 6);
  fade("#l90", 7.0, 0.3);
  bannerAt(2);
  beat(3, 3, T.sw[2]);
  ["#lN2", "#lv2", "#lV2b", "#lv2l"].forEach((s) => pop(s, 7.3, 6));
  pop("#lV1b", 7.3, 6);
  beat(4, 4, T.sw[3]);
  beat(5, 5, T.sw[4]);
  bannerAt(3);
  beat(6, 6, T.sw[5]);
  ["#lP1", "#lP2", "#lI1", "#lI2"].forEach((s) => pop(s, 14.1, 6));
  bannerAt(4);
  ["#lP1", "#lP2", "#lI1", "#lI2", "#lV1b", "#lV2b"].forEach((s) => fade(s, 16.6, 0.3));
  beat(7, 7, T.sw[6]);
  ["#lBHB", "#lBHH", "#lim", "#lBs", "#lBb"].forEach((s) => pop(s, 16.9, 6));
  beat(8, 8, T.sw[7]);
  pop("#lspike", 18.6, 6);

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
  fswap("#f9", LK + 0.6);
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

  tl.to({}, { duration: 0.0001 }, 25.9999);
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
    WHITE = "#FFFFFF";
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);

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
  const seg = (x1, y1, x2, y2, color, w, a, blur, dash) =>
    line(
      [
        [x1, y1],
        [x2, y2],
      ],
      color,
      w,
      a,
      blur,
      dash,
    );
  const rect = (x, y, w, h, color, a, blur) => {
    if (a <= 0.001 || w <= 0 || h <= 0) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    if (blur) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    }
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };
  function arrowHead(x, y, ang, color, alpha, size) {
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.8, -size * 0.7);
    ctx.lineTo(-size * 0.8, size * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const mix = (c0, c1, u) => {
    const h = (s) => [
      parseInt(s.slice(1, 3), 16),
      parseInt(s.slice(3, 5), 16),
      parseInt(s.slice(5, 7), 16),
    ];
    const a = h(c0),
      b = h(c1);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * u)},${Math.round(a[1] + (b[1] - a[1]) * u)},${Math.round(a[2] + (b[2] - a[2]) * u)})`;
  };

  // ---------------------------------------------------------------- the state at time t
  const hookA = (t) => (t < T.rewind0 ? 1 : 1 - smooth((t - T.rewind0) / 0.5));
  /** position in the two-cycle window (0 .. 1); at the hook the cursor rests on the first cycle */
  const winPos = (t) => {
    if (t < T.t0) return 0.18;
    const c = (t - T.t0) / (2 * T.PER);
    return c - Math.floor(c);
  };
  /** alpha and reveal progress of a trace that is drawn from `start` on (full during the hook) */
  const tr = (t, start) =>
    t < 2.1 ? { a: hookA(t), p: 1 } : { a: 1, p: clamp01((t - start) / 1.2) };

  const X0 = PLOT.x0,
    PW = PLOT.w,
    Y0 = PLOT.y0,
    K = PLOT.k;
  const NB = 1660;
  const xB = (k) => X0 + (PW * k) / NB;
  const thB = (k) => (4 * Math.PI * k) / NB;

  // ---------------------------------------------------------------- the core, its flux, its coils
  const LOOP = [
    [290, 460],
    [590, 460],
    [590, 710],
    [290, 710],
  ];
  const LOOPLEN = [300, 250, 300, 250];
  function onLoop(u) {
    let d = (((u % 1) + 1) % 1) * 1100;
    for (let i = 0; i < 4; i++) {
      if (d <= LOOPLEN[i] || i === 3) {
        const f = clamp01(d / LOOPLEN[i]),
          a = LOOP[i],
          b = LOOP[(i + 1) % 4];
        return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
      }
      d -= LOOPLEN[i];
    }
    return LOOP[0];
  }
  function drawCore(th, sf, f) {
    // the iron: a ring (outer 260..620 x 430..740, window 320..560 x 490..680)
    ctx.save();
    ctx.beginPath();
    ctx.rect(260, 430, 360, 310);
    ctx.rect(320, 490, 240, 190);
    ctx.fillStyle = "rgba(46,46,72,.95)";
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    // the flux: its density follows sin(theta); the iron glows purple and turns red as the flux density passes the saturation knee
    const B = XF.Bm(f) * Math.sin(th),
      sat = clamp01((Math.abs(B) - 1.4) / 0.5);
    const col = mix(PURPLE, RED, sat),
      gl = clamp01(Math.abs(Math.sin(th)) * sf * 0.55);
    ctx.save();
    ctx.globalAlpha = 0.18 + 0.55 * gl;
    ctx.strokeStyle = col;
    ctx.lineWidth = 12;
    ctx.shadowColor = col;
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.moveTo(290, 460);
    ctx.lineTo(590, 460);
    ctx.lineTo(590, 710);
    ctx.lineTo(290, 710);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    // the flux lines move round the core one way while phi > 0 and the other way while phi < 0
    const N = 36,
      shift = -0.12 * sf * Math.cos(th);
    for (let i = 0; i < N; i++) {
      const p = onLoop(i / N + 0.5 + shift);
      dot(p[0], p[1], 4.2, col, 0.35 + 0.65 * clamp01(Math.abs(Math.sin(th)) * sf), 8);
    }
    const dir = Math.sin(th) >= 0 ? 0 : Math.PI;
    arrowHead(440, 460, dir, WHITE, 0.25 + 0.6 * gl, 12);
    arrowHead(440, 710, dir + Math.PI, WHITE, 0.25 + 0.6 * gl, 12);
  }
  /** a coil: slanted turns along a leg, evenly spread between y = 505 and 665; a fractional count fades its last turn in */
  function coil(xc, count, color, alpha) {
    if (alpha <= 0.001) return;
    const n = Math.max(1, count),
      step = 160 / n;
    const whole = Math.floor(count);
    for (let i = 0; i <= whole; i++) {
      const a = i < whole ? 1 : count - whole;
      if (a <= 0.01) continue;
      const y = 505 + i * step;
      if (y > 668) continue;
      seg(xc - 34, y, xc + 34, y + 9, color, 4, alpha * a, 6);
    }
  }
  function drawCoils(a, aSec) {
    coil(290, 10, RED, 0.95);
    // wires and the source
    seg(165, 555, 165, 505, RED, 3, 0.9);
    seg(165, 505, 256, 505, RED, 3, 0.9);
    seg(165, 615, 165, 665, RED, 3, 0.9);
    seg(165, 665, 256, 665, RED, 3, 0.9);
    ctx.save();
    ctx.strokeStyle = RED;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(165, 585, 30, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const x = 148 + (34 * k) / 20,
        y = 585 - 11 * Math.sin((2 * Math.PI * k) / 20);
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    if (aSec > 0.001) {
      coil(590, 10 * a, BLUE, 0.95 * aSec);
      seg(624, 505, 730, 505, BLUE, 3, 0.9 * aSec);
      seg(730, 505, 730, 545, BLUE, 3, 0.9 * aSec);
      seg(730, 625, 730, 665, BLUE, 3, 0.9 * aSec);
      seg(730, 665, 624, 665, BLUE, 3, 0.9 * aSec);
      ctx.save();
      ctx.globalAlpha = 0.8 * aSec;
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 3;
      ctx.strokeRect(717, 545, 26, 80);
      ctx.restore();
    }
  }

  // ---------------------------------------------------------------- the right side of the top panel: voltage bars, then the B meter
  const BASE = 740;
  function drawBars(a, aBars) {
    if (aBars <= 0.001) return;
    seg(815, BASE, 965, BASE, WHITE, 2, 0.4 * aBars);
    rect(830, BASE - 230 * 0.35, 45, 230 * 0.35, RED, 0.95 * aBars, 12);
    rect(900, BASE - 230 * a * 0.35, 45, 230 * a * 0.35, BLUE, 0.95 * aBars, 12);
  }
  function drawMeter(th, f, aM) {
    if (aM <= 0.001) return;
    const kB = 130,
      bm = XF.Bm(f);
    seg(815, BASE, 965, BASE, WHITE, 2, 0.4 * aM);
    // the part of the bar below the knee is purple, the part above it red
    const hBs = XF.BS * kB,
      h = bm * kB;
    rect(840, BASE - Math.min(h, hBs), 60, Math.min(h, hBs), PURPLE, 0.95 * aM, 12);
    if (h > hBs) rect(840, BASE - h, 60, h - hBs, RED, 0.95 * aM, 16);
    seg(820, BASE - hBs, 975, BASE - hBs, WHITE, 3, 0.85 * aM, 0, [10, 7]);
    // the flux density now
    const inst = Math.abs(bm * Math.sin(th)) * kB;
    seg(832, BASE - inst, 908, BASE - inst, WHITE, 4, aM, 8);
  }

  // ---------------------------------------------------------------- the flux and the voltages over two cycles
  function drawWaves(t, th, a, sf, pos) {
    seg(X0, Y0, X0 + PW, Y0, WHITE, 2, 0.3);
    const phiT = tr(t, T.t0),
      v2T =
        t < 2.1
          ? { a: hookA(t), p: 1 }
          : { a: smooth((t - T.sw[2]) / 0.4), p: clamp01((t - T.sw[2]) / 1.2) };
    const trace = (fn, color, w, al, p, blur) => {
      if (al <= 0.001 || p <= 0) return [];
      const pts = [];
      const nE = Math.max(2, Math.round(NB * p));
      for (let k = 0; k < Math.min(nE, NB + 1); k++) pts.push([xB(k), Y0 - K * fn(thB(k))]);
      line(pts, color, w, al, blur);
      return pts;
    };
    // v2 first (underneath), then v1 on top, then the flux
    trace((x) => a * Math.cos(x), BLUE, 7, v2T.a, v2T.p, 10);
    trace((x) => Math.cos(x), RED, 4, phiT.a, phiT.p, 8);
    trace((x) => sf * Math.sin(x), PURPLE, 5, phiT.a, phiT.p, 12);
    // legend swatches
    seg(150, 856, 176, 856, PURPLE, 5, phiT.a * (phiT.p > 0 ? 1 : 0));
    seg(280, 856, 306, 856, RED, 5, phiT.a * (phiT.p > 0 ? 1 : 0));
    seg(410, 856, 436, 856, BLUE, 5, v2T.a * (v2T.p > 0 ? 1 : 0));
    // the cursor, and in the first beat the tangent of the flux: its slope IS the voltage
    const xc = X0 + PW * pos,
      aC = t < 2.1 ? hookA(t) : smooth((t - 2.3) / 0.2);
    if (aC > 0.001 && phiT.p >= 1) {
      seg(xc, PB[1] + 14, xc, PB[1] + PB[3] - 14, WHITE, 2, 0.35 * aC);
      dot(xc, Y0 - K * sf * Math.sin(th), 8, PURPLE, aC, 16);
      dot(xc, Y0 - K * Math.cos(th), 7, RED, aC, 14);
      if (v2T.a > 0.001) dot(xc, Y0 - K * a * Math.cos(th), 7, BLUE, aC * v2T.a, 14);
    }
    const aTan = t < 2.1 ? 0 : smooth((t - T.t0) / 0.3) * (1 - smooth((t - T.st[1]) / 0.3));
    if (aTan > 0.001 && phiT.p >= 1) {
      const m = (-K * sf * Math.cos(th)) / (PW / (4 * Math.PI)); // dy/dx of the plotted flux
      const L2 = 60 / Math.sqrt(1 + m * m);
      seg(
        xc - L2,
        Y0 - K * sf * Math.sin(th) - m * L2,
        xc + L2,
        Y0 - K * sf * Math.sin(th) + m * L2,
        WHITE,
        4,
        aTan,
        8,
      );
    }
    // the 90 degree lag: from the voltage peak to the flux peak
    const aN = t < 2.1 ? 0 : smooth((t - T.sw[1]) / 0.3) * (1 - smooth((t - T.st[2]) / 0.3));
    if (aN > 0.001) {
      const x1 = X0 + PW * 0.5,
        x2 = X0 + PW * 0.625,
        y = Y0 - 80;
      seg(x1, y, x2, y, WHITE, 3, aN, 8);
      arrowHead(x2, y, 0, WHITE, aN, 9);
      arrowHead(x1, y, Math.PI, WHITE, aN, 9);
      seg(x1, y + 4, x1, Y0 - K * 1.0, WHITE, 1.5, 0.45 * aN, 0, [5, 5]);
      seg(x2, y + 4, x2, Y0 - K * sf, WHITE, 1.5, 0.45 * aN, 0, [5, 5]);
    }
  }

  // ---------------------------------------------------------------- the bottom panel: power and current bars, then the B-H curve and the magnetizing current
  function drawBottom(t, th, f, aSec) {
    const idl = XF.ideal(XF.aAt(t));
    const aPow = t < 2.1 ? 0 : smooth((t - T.sw[5]) / 0.4) * (1 - smooth((t - T.st[4]) / 0.3));
    if (aPow > 0.001) {
      const g = easeOut((t - T.sw[5]) / 0.9);
      rect(170, 1090, idl.P1 * 0.5 * g, 20, RED, aPow, 10);
      rect(170, 1140, idl.P2 * 0.5 * g, 20, BLUE, aPow, 10);
      rect(640, 1090, idl.I1 * 50 * g, 20, RED, aPow, 10);
      rect(640, 1140, idl.I2 * 50 * g, 20, BLUE, aPow, 10);
    }
    const aBH = t < 2.1 ? hookA(t) : smooth((t - T.sw[6]) / 0.4);
    if (aBH <= 0.001) return;
    // the B-H curve (the H axis is compressed so that the saturated tail still fits)
    const cx = 325,
      cy = 1140,
      kB = 35,
      hx = (H) => cx + (185 * Math.asinh(H / 100)) / Math.asinh(240000 / 100);
    seg(cx - 190, cy, cx + 190, cy, WHITE, 1.5, 0.3 * aBH);
    seg(cx, cy - 82, cx, cy + 82, WHITE, 1.5, 0.3 * aBH);
    seg(cx - 190, cy - XF.BS * kB, cx + 190, cy - XF.BS * kB, WHITE, 1.5, 0.3 * aBH, 0, [8, 6]);
    seg(cx - 190, cy + XF.BS * kB, cx + 190, cy + XF.BS * kB, WHITE, 1.5, 0.3 * aBH, 0, [8, 6]);
    const bm = XF.Bm(f);
    const all = [],
      inUse = [];
    for (let k = -100; k <= 100; k++) {
      const B = (2.3 * k) / 100,
        H = XF.Hof(B),
        p = [hx(H), cy - kB * B];
      all.push(p);
      if (Math.abs(B) <= bm) inUse.push(p);
    }
    line(all, WHITE, 3, 0.45 * aBH);
    const sat = clamp01((bm - 1.5) / 0.5);
    line(inUse, mix(PURPLE, RED, sat), 6, aBH, 12);
    const Bi = bm * Math.sin(th);
    dot(hx(XF.Hof(Bi)), cy - kB * Bi, 8, WHITE, aBH, 16);
    // the magnetizing current over two cycles, in units of its rated peak; the saturated part runs off the top
    const ref = XF.im(XF.Bm(50)),
      x0 = 600,
      w = 370,
      ib = 1150;
    seg(x0, ib, x0 + w, ib, WHITE, 2, 0.3 * aBH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(PC[0], PC[1], PC[2], PC[3]);
    ctx.clip();
    const pts = [];
    for (let k = 0; k <= 740; k++) {
      const thk = (4 * Math.PI * k) / 740,
        B = bm * Math.sin(thk);
      pts.push([x0 + (w * k) / 740, ib - (30 * XF.im(B)) / ref, Math.abs(B) > XF.BS]);
    }
    for (const red of [false, true]) {
      ctx.save();
      ctx.globalAlpha = aBH;
      ctx.strokeStyle = red ? RED : PURPLE;
      ctx.lineWidth = 5;
      ctx.lineJoin = "round";
      ctx.shadowColor = red ? RED : PURPLE;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      let on = false;
      for (let k = 0; k < pts.length; k++) {
        const hot = pts[k][2],
          draw = red ? hot : !hot;
        if (draw) {
          if (!on) ctx.moveTo(pts[k][0], pts[k][1]);
          else ctx.lineTo(pts[k][0], pts[k][1]);
          on = true;
        } else on = false;
      }
      ctx.stroke();
      ctx.restore();
    }
    const kc = Math.round((740 * th) / (4 * Math.PI));
    const q = pts[Math.min(740, kc)];
    dot(q[0], Math.max(PC[1] + 4, q[1]), 7, WHITE, aBH, 14);
    ctx.restore();
    void aSec;
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
    const a = XF.aAt(t),
      f = XF.fAt(t),
      sf = 50 / f;
    const pos = winPos(t),
      th = 4 * Math.PI * pos;
    const aSec = t < 2.1 ? hookA(t) : smooth((t - T.sw[2]) / 0.4);
    const aBars =
      (t < 2.1 ? hookA(t) : smooth((t - T.sw[2] - 0.1) / 0.4)) * (1 - smooth((t - T.st[4]) / 0.3));
    const aMeter = t < 2.1 ? 0 : smooth((t - T.sw[6]) / 0.4);
    drawCore(th, sf, f);
    drawCoils(a, aSec);
    drawBars(a, aBars);
    drawMeter(th, f, aMeter);
    drawWaves(t, th, a, sf, pos);
    drawBottom(t, th, f, aSec);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
