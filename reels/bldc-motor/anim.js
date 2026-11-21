// Timeline for "THE BRUSHLESS DC MOTOR" (25.0 s).
// The motor (rotor magnet, three stator phases, Hall sensors, the stator field), the six-step table, the phase currents, the Hall signals,
// the trapezoidal back-EMF, the inverter bridge, the torque against the angle and the voltage balance are drawn on a canvas from the time
// alone (hf-seek protocol); text, counters and cards are GSAP. The rotor angle is the integral of a speed that follows the duty cycle.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, PB, MC, PLOT, BR, TBL } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind
    [2.2, "click"], // the stator field chases the magnet
    [2.4, "snap"], // T = Kt I
    [5.0, "click"], // six steps of 60 degrees
    [5.2, "snap"], // 6 x 60 = 360
    [8.4, "click"], // three Hall sensors
    [8.6, "snap"], // 3 bits = 6 steps
    [11.6, "click"], // the motor is also a generator
    [11.8, "snap"], // e = Ke w
    [15.0, "click"], // more duty, more speed
    [15.2, "snap"], // D = 0.4
    [16.8, "snap"], // D = 0.7
    [19.0, "snap"], // D = 1
    [21.2, "thump"], // lock
    [22.2, "click"], // a magnet, three coils, six switches
    [23.6, "snap"], // CTA reveal
    [26.0, "click"], // engagement pulse
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
  gsap.set("#lLegCur,#lTd,#ldel", { opacity: 0 });
  gsap.set("#lLegEmf,#lKV1,#lKV2,#lH1,#lH2,#lH3", { opacity: 1 });
  const ROWS = ["#rc0", "#rc1", "#rc2", "#rc3", "#rc4", "#rc5"],
    PAIRS = ["#rp0", "#rp1", "#rp2", "#rp3", "#rp4", "#rp5"];
  const BRIDGE = ["#lrp", "#lrn", "#lla", "#llb", "#llc"],
    HALLS = ["#lH1", "#lH2", "#lH3"];
  const HOOKED = [
    ...ROWS,
    ...PAIRS,
    "#lcodeH",
    "#lpairH",
    "#lLegEmf",
    "#lKV1",
    "#lKV2",
    ...BRIDGE,
    ...HALLS,
  ];

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
  function beat(ci, at) {
    hit(at, "snap", "#c" + ci);
    cswap("#c" + ci, at, true);
    fswap("#f" + ci, at + 0.3);
  }
  const bannerAt = (k) => {
    hit(T.st[k], "click", "#bn" + (k + 1));
    bnSwap("#bn" + (k + 1), T.st[k]);
  };
  bannerAt(0);
  beat(1, T.sw[0]);
  ["#lLegCur", "#lTd", "#ldel"].forEach((s) => pop(s, 2.5, 6));
  bannerAt(1);
  beat(2, T.sw[1]);
  [...PAIRS, "#lpairH"].forEach((s, i) => pop(s, T.sw[1] + 0.1 + 0.05 * i, 6));
  BRIDGE.forEach((s) => pop(s, T.sw[1] + 0.1, 6));
  bannerAt(2);
  beat(3, T.sw[2]);
  fade("#lLegCur", T.sw[2], 0.2);
  pop("#lLegHall", T.sw[2] + 0.1, 6);
  HALLS.forEach((s) => pop(s, T.sw[2] + 0.1, 6));
  [...ROWS, "#lcodeH"].forEach((s, i) => pop(s, T.sw[2] + 0.1 + 0.05 * i, 6));
  bannerAt(3);
  beat(4, T.sw[3]);
  fade("#lLegHall", T.sw[3], 0.2);
  pop("#lLegEmf", T.sw[3] + 0.1, 6);
  bannerAt(4);
  beat(5, T.sw[4]);
  fade("#lTd", T.st[4], 0.25);
  fade("#ldel", T.st[4], 0.25);
  pop("#lKV1", T.sw[4] + 0.1, 6);
  pop("#lKV2", T.sw[4] + 0.1, 6);
  beat(6, T.sw[5]);
  beat(7, T.sw[6]);

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
  fswap("#f8", LK + 0.6);
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

  tl.to({}, { duration: 0.0001 }, 27.5999);
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
  const PHC = [RED, BLUE, PURPLE];
  const DEG = Math.PI / 180;
  let gA = 1; // a multiplier on the alpha of everything drawn by the helpers (to fade a whole block in)
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
    ctx.globalAlpha = alpha * gA;
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
    ctx.globalAlpha = alpha * gA;
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

  // ---------------------------------------------------------------- the rotor angle: the integral of a speed that follows the duty cycle
  const DT = 0.001,
    NT = Math.ceil(27.6 / DT) + 5;
  const THETA = new Float64Array(NT);
  {
    let acc = 100 * DEG; // the hook starts with the rotor in the middle of a step
    for (let i = 0; i < NT; i++) {
      THETA[i] = acc;
      acc += BLDC.omegaVis(BLDC.Dat(i * DT)) * DT;
    }
  }
  const thetaDeg = (t) => {
    const f = Math.max(0, t) / DT,
      i = Math.min(NT - 2, Math.floor(f)),
      u = f - i;
    return ((THETA[i] + (THETA[i + 1] - THETA[i]) * u) / DEG) % 360;
  };
  const pt = (deg, r) => [MC.x + r * Math.cos(deg * DEG), MC.y - r * Math.sin(deg * DEG)];
  const hookA = (t) => (t < T.rewind0 ? 1 : 1 - smooth((t - T.rewind0) / 0.5));
  const norm180 = (d) => (((d % 360) + 540) % 360) - 180;

  // ---------------------------------------------------------------- commutation, smoothed: a real commutation takes a short, finite time
  const BW = 10; // degrees over which the current moves from one step to the next
  function blendCur(th) {
    const x = (((th - 30) % 360) + 360) % 360,
      k = Math.floor(x / 60),
      s = x - 60 * k;
    const cur = BLDC.currents(30 + 60 * k + 0.01, 1),
      prev = BLDC.currents(30 + 60 * (k - 1) + 0.01, 1);
    const w = s < BW ? smooth(s / BW) : 1;
    return { i: cur.map((v, n) => prev[n] * (1 - w) + v * w), w, k };
  }
  const HC = [120, 240, 0]; // centres of the high part of the three Hall signals
  const hallSoft = (th, n) => 1 - smooth((Math.abs(norm180(th - HC[n])) - 87) / 6);
  const trEl = (id) => document.getElementById(id);
  const NPOLE = trEl("lNp"),
    SPOLE = trEl("lSp");
  const moveLabel = (el, p) => {
    if (el)
      el.style.transform = `translate(${(p[0] - MC.x).toFixed(1)}px,${(p[1] - MC.y).toFixed(1)}px)`;
  };

  // ---------------------------------------------------------------- the motor
  const TOOTH = [
    [0, 1],
    [2, -1],
    [1, 1],
    [0, -1],
    [2, 1],
    [1, -1],
  ]; // tooth at 60 k degrees: [phase, winding sense]
  function wedge(r0, r1, a0, a1) {
    const pts = [];
    for (let a = a0; a <= a1 + 1e-6; a += 2) pts.push(pt(a, r1));
    for (let a = a1; a >= a0 - 1e-6; a -= 2) pts.push(pt(a, r0));
    return pts;
  }
  function drawMotor(th, t, bl) {
    // the stator ring and its teeth
    ctx.save();
    ctx.beginPath();
    ctx.arc(MC.x, MC.y, 190, 0, 2 * Math.PI);
    ctx.arc(MC.x, MC.y, 122, 0, 2 * Math.PI, true);
    ctx.fillStyle = "rgba(46,46,72,.95)";
    ctx.fill("evenodd");
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    const cur = bl.i;
    for (let k = 0; k < 6; k++) {
      const [n, s] = TOOTH[k],
        on = Math.abs(s * cur[n]),
        a = 60 * k;
      poly(wedge(126, 180, a - 13, a + 13));
      ctx.save();
      ctx.globalAlpha = 0.14 + 0.7 * on;
      ctx.fillStyle = PHC[n];
      if (on > 0.05) {
        ctx.shadowColor = PHC[n];
        ctx.shadowBlur = 14;
      }
      ctx.fill();
      ctx.restore();
      for (let j = 0; j < 5; j++) {
        const r = 134 + j * 9;
        line([pt(a - 11, r), pt(a + 11, r)], PHC[n], 3, 0.35 + 0.6 * on, on > 0.05 ? 6 : 0);
      }
    }
    // the rotor: a permanent magnet, north half red, south half blue
    const phi = BLDC.rotorAngle(th);
    ctx.save();
    ctx.beginPath();
    ctx.arc(MC.x, MC.y, 110, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(20,20,34,.95)";
    ctx.fill();
    ctx.restore();
    const half = (a0, color) => {
      const pts = [];
      for (let a = a0; a <= a0 + 180 + 1e-6; a += 6) pts.push(pt(a, 102));
      poly(pts);
      ctx.save();
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.restore();
    };
    half(phi - 90, RED);
    half(phi + 90, BLUE);
    dot(MC.x, MC.y, 12, WHITE, 0.7, 0);
    moveLabel(NPOLE, pt(phi, 70));
    moveLabel(SPOLE, pt(phi + 180, 70));
    // the Hall sensors sit on the inner face of the stator; they appear with their stage and light up smoothly when they read 1
    const aHs = t < 2.1 ? hookA(t) : smooth((t - T.sw[2]) / 0.4);
    if (aHs > 0.001)
      [30, 150, 270].forEach((a, i) => {
        const p = pt(a, 131),
          h = hallSoft(th, i);
        ctx.save();
        ctx.globalAlpha = aHs;
        ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.9 * h})`;
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        if (h > 0.5) {
          ctx.shadowColor = WHITE;
          ctx.shadowBlur = 12;
        }
        ctx.fillRect(p[0] - 9, p[1] - 9, 18, 18);
        ctx.strokeRect(p[0] - 9, p[1] - 9, 18, 18);
        ctx.restore();
      });
    // the stator field (white) is the sum of the phase axes weighted by the currents: it turns smoothly through each commutation
    let vx = 0,
      vy = 0;
    for (let n = 0; n < 3; n++) {
      vx += cur[n] * Math.cos(120 * n * DEG);
      vy += cur[n] * Math.sin(120 * n * DEG);
    }
    const m = Math.atan2(vy, vx) / DEG,
      len = (100 * Math.hypot(vx, vy)) / 1.7321;
    const mp = pt(m, len),
      rp = pt(phi, 76);
    line([[MC.x, MC.y], rp], RED, 5, 0.95, 8);
    line([[MC.x, MC.y], mp], WHITE, 7, 0.95, 14);
    arrowHead(mp[0], mp[1], -m * DEG, WHITE, 0.95, 13);
    arrowHead(rp[0], rp[1], -phi * DEG, RED, 0.95, 10);
    // the angle between them
    const d = norm180(m - phi);
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(MC.x, MC.y, 48, -phi * DEG, -(phi + d) * DEG, d > 0);
    ctx.stroke();
    ctx.restore();
    return d;
  }

  // ---------------------------------------------------------------- the six-step table
  function drawTable(bl, aT) {
    if (aT <= 0.001) return;
    const hl = (k, al) => {
      if (al <= 0.001) return;
      const y = TBL.y0 + k * TBL.dy,
        p = BLDC.PAIRS[k][0];
      ctx.save();
      ctx.globalAlpha = aT * al;
      ctx.fillStyle = "rgba(255,255,255,.10)";
      ctx.strokeStyle = PHC[p];
      ctx.lineWidth = 3;
      ctx.shadowColor = PHC[p];
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.roundRect(612, y - 23, 340, 46, 14);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    hl((bl.k + 5) % 6, 1 - bl.w);
    hl(bl.k, bl.w);
  }

  // ---------------------------------------------------------------- the waveforms over one electrical turn
  const X0 = PLOT.x0,
    PW = PLOT.w,
    Y0 = PLOT.y0,
    K = PLOT.k;
  const xU = (u) => X0 + (PW * u) / 360;
  function drawWaves(t, th, D, bl) {
    seg(X0, Y0, X0 + PW, Y0, WHITE, 2, 0.3);
    const aHook = t < 2.1 ? hookA(t) : 0;
    const aCur = t < 2.1 ? 0 : smooth((t - T.sw[0]) / 0.4) * (1 - smooth((t - T.sw[2]) / 0.3));
    const aHall = t < 2.1 ? 0 : smooth((t - T.sw[2]) / 0.3) * (1 - smooth((t - T.sw[3]) / 0.3));
    const aEmf = t < 2.1 ? aHook : smooth((t - T.sw[3]) / 0.4);
    const U = [];
    for (let u = 0; u <= 360; u += 2) U.push(u);
    // the phase currents of six-step commutation: +I for 120 degrees, 0 for 60, -I for 120, 0 for 60
    if (aCur > 0.001)
      for (let n = 0; n < 3; n++) {
        const pts = U.map((u) => [
          xU(u),
          Y0 - K * BLDC.currents(30 + u + 0.01, 1)[n] + (n - 1) * 2.5,
        ]);
        line(pts, PHC[n], 5, aCur, 8);
      }
    // the three Hall signals, 180 degrees wide and 120 degrees apart: together six codes
    if (aHall > 0.001)
      for (let n = 0; n < 3; n++) {
        const yb = Y0 - 38 + n * 38;
        const pts = U.map((u) => [xU(u), yb - 22 * BLDC.hall(30 + u + 0.01)[n]]);
        line(pts, PHC[n], 5, aHall, 8);
        seg(X0, yb, X0 + PW, yb, WHITE, 1, 0.15 * aHall);
      }
    // the back-EMF is a trapezoid whose height grows with the speed; the current stays flat-topped inside it
    if (aEmf > 0.001) {
      const ratio = BLDC.steadyW(D) / BLDC.steadyW(1),
        A = 62 * ratio;
      for (let n = 0; n < 3; n++) {
        const pts = U.map((u) => [xU(u), Y0 - A * BLDC.emf(n, 30 + u)]);
        line(pts, PHC[n], 5, aEmf, 8);
      }
      const ia = U.map((u) => [xU(u), Y0 - 36 * BLDC.currents(30 + u + 0.01, 1)[0]]);
      line(ia, WHITE, 4, 0.9 * aEmf, 6, [10, 7]);
    }
    // legend swatches and the cursor
    const swA = Math.max(aCur, aHall, aEmf);
    [0, 1, 2].forEach((n) => seg(190 + 22 * n, 856, 206 + 22 * n, 856, PHC[n], 5, swA));
    const u = (((th - 30) % 360) + 360) % 360,
      xc = xU(u);
    const aC = t < 2.1 ? hookA(t) : smooth((t - 2.3) / 0.2);
    seg(xc, PB[1] + 14, xc, PB[1] + PB[3] - 14, WHITE, 2, 0.4 * aC);
    if (aEmf > 0.001) {
      const ratio = BLDC.steadyW(D) / BLDC.steadyW(1);
      for (let n = 0; n < 3; n++)
        dot(xc, Y0 - 62 * ratio * BLDC.emf(n, th), 6, PHC[n], aC * aEmf, 12);
    }
    if (aCur > 0.001)
      for (let n = 0; n < 3; n++)
        dot(xc, Y0 - K * bl.i[n] + (n - 1) * 2.5, 6, PHC[n], aC * aCur, 12);
  }

  // ---------------------------------------------------------------- the inverter bridge: the two switches of the step light up
  function drawBridge(bl, aBr) {
    if (aBr <= 0.001) return;
    gA = aBr;
    seg(135, BR.top, 385, BR.top, WHITE, 3, 0.7);
    seg(150, BR.top - 16, 150, BR.top, WHITE, 3, 0.7);
    seg(130, BR.top - 16, 170, BR.top - 16, WHITE, 3, 0.7);
    seg(135, BR.bot, 385, BR.bot, WHITE, 3, 0.7);
    seg(150, BR.bot, 150, BR.bot + 14, WHITE, 3, 0.7);
    seg(130, BR.bot + 14, 170, BR.bot + 14, WHITE, 3, 0.7);
    BR.xs.forEach((x, n) => {
      // the upper switch closes while the phase current is positive, the lower one while it is negative (smoothly through the commutation)
      const up = clamp01(bl.i[n]),
        lo = clamp01(-bl.i[n]);
      const sw = (cy, on) => {
        ctx.save();
        ctx.globalAlpha = gA * (0.35 * (1 - on));
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 14, cy - 15, 28, 30);
        ctx.globalAlpha = gA * on;
        ctx.fillStyle = PHC[n];
        ctx.shadowColor = PHC[n];
        ctx.shadowBlur = 16;
        ctx.fillRect(x - 14, cy - 15, 28, 30);
        ctx.restore();
      };
      const wire = (y0, y1, on) => {
        seg(x, y0, x, y1, WHITE, 3, 0.35);
        seg(x, y0, x, y1, PHC[n], 3, on);
      };
      wire(BR.top, 1097, up);
      sw(1112, up);
      wire(1127, 1146, up);
      wire(1146, 1162, lo);
      sw(1177, lo);
      wire(1192, BR.bot, lo);
      dot(x, 1146, 6, up + lo > 0.2 ? PHC[n] : WHITE, up + lo > 0.2 ? 1 : 0.5, 10);
    });
    gA = 1;
  }

  // ---------------------------------------------------------------- the right of the bottom panel: torque against angle, then the voltage balance
  function drawBottomRight(t, d, D) {
    const aTq = t < 2.1 ? 0 : smooth((t - T.sw[0]) / 0.4) * (1 - smooth((t - T.st[4]) / 0.3));
    if (aTq > 0.001) {
      const x0 = 600,
        w = 350,
        base = 1200,
        h = 100;
      const xs = (deg) => x0 + (w * deg) / 180;
      seg(x0, base, x0 + w, base, WHITE, 2, 0.35 * aTq);
      rect(xs(60), base - h, xs(120) - xs(60), h, WHITE, 0.1 * aTq);
      const pts = [];
      for (let g = 0; g <= 180; g += 3) pts.push([xs(g), base - h * Math.sin(g * DEG)]);
      line(pts, PURPLE, 5, aTq, 10);
      dot(xs(d), base - h * Math.sin(d * DEG), 8, WHITE, aTq, 14);
      seg(xs(d), base, xs(d), base - h * Math.sin(d * DEG), WHITE, 2, 0.5 * aTq, 0, [5, 5]);
    }
    const aKV = t < 2.1 ? hookA(t) : smooth((t - T.sw[4]) / 0.4);
    if (aKV > 0.001) {
      const sx = 740,
        k = 8.5,
        vin = D * BLDC.VDC,
        ir = BLDC.steadyI * BLDC.RLL,
        ke = vin - ir;
      rect(sx, 1105, vin * k, 26, RED, 0.95 * aKV, 12);
      rect(sx, 1153, ke * k, 26, BLUE, 0.95 * aKV, 12);
      rect(sx + ke * k, 1153, ir * k, 26, WHITE, 0.95 * aKV, 8);
      seg(sx + vin * k, 1096, sx + vin * k, 1190, WHITE, 2, 0.4 * aKV, 0, [6, 5]);
    }
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
    const D = BLDC.Dat(t),
      th = thetaDeg(t),
      bl = blendCur(th);
    const d = drawMotor(th, t, bl);
    const aTbl = t < 2.1 ? hookA(t) : smooth((t - T.sw[1]) / 0.4);
    drawTable(bl, aTbl);
    // what the two arrows are
    seg(630, 748, 668, 748, WHITE, 6, 1, 8);
    arrowHead(672, 748, 0, WHITE, 1, 11);
    seg(630, 780, 668, 780, RED, 5, 1, 8);
    arrowHead(672, 780, 0, RED, 1, 10);
    drawWaves(t, th, D, bl);
    drawBridge(bl, t < 2.1 ? hookA(t) : smooth((t - T.sw[1]) / 0.4));
    drawBottomRight(t, Math.abs(d), D);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
