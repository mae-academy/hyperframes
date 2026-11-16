// Timeline for "THREE-PHASE INVERTER: SINE PWM" (23.0 s).
// The references, the carrier, the pulses, their average, the line voltage, the load current, the bridge, the phasors and the
// harmonic spectrum are drawn on a canvas from the time alone (hf-seek protocol); text, counters and cards are GSAP.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, PA, PB, PLOT, BR, SP, PH, SPEC } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind
    [2.2, "click"], // compare a sine to a triangle
    [2.4, "snap"], // the first cycle: pulses appear
    [4.4, "click"], // average the pulses
    [4.6, "snap"], // the average is the sine
    [6.6, "click"], // three legs
    [6.8, "snap"], // line voltage
    [8.8, "click"], // the load filters the ripple
    [9.0, "snap"], // current, THD at mf = 9
    [11.2, "click"], // raise the carrier
    [11.4, "snap"], // mf = 21
    [13.9, "snap"], // mf = 45
    [16.6, "thump"], // lock
    [17.6, "click"], // a faster carrier, a cleaner sine
    [19.0, "snap"], // CTA reveal
    [21.4, "click"], // engagement pulse
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

  // the legends of the finished picture are on screen at frame 0; they leave with the rewind and come back stage by stage
  gsap.set("#lvb,#lvc", { opacity: 1 });
  gsap.set("#lbp", { opacity: 0 });
  const HOOKED = ["#lva", "#lvb", "#lvc", "#lvt", "#lbp", "#lbl", "#lbi", "#lsp", "#lsh", "#lmf"];

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

  /** one stage: the banner, the counter and the formula; the waveforms are drawn in the canvas */
  function stage(k, ci, fi) {
    const st = T.st[k],
      sw = T.sw[k];
    hit(st, "click", "#bn" + (k + 1));
    bnSwap("#bn" + (k + 1), st);
    hit(sw, "snap", "#c" + ci);
    cswap("#c" + ci, sw, true);
    fswap("#f" + fi, sw + 0.3);
  }
  stage(0, 1, 1);
  pop("#lva", 2.3, 6);
  pop("#lvt", 2.3, 6);
  pop("#lbp", 2.5, 6);
  stage(1, 2, 2);
  pop("#lba", 4.7, 6);
  stage(2, 3, 3);
  pop("#lvb", 6.9, 6);
  pop("#lvc", 6.9, 6);
  pop("#lbl", 6.9, 6);
  stage(3, 4, 4);
  pop("#lbi", 9.1, 6);
  pop("#lsp", 9.1, 6);
  pop("#lsh", 9.1, 6);
  pop("#lmf", 9.1, 6);
  fade("#lbp", 6.8, 0.3);
  fade("#lba", 6.8, 0.3);
  stage(4, 5, 5);
  hit(T.sw[5], "snap", "#c6");
  cswap("#c6", T.sw[5], true);
  fswap("#f6", T.sw[5] + 0.3);

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

  tl.to({}, { duration: 0.0001 }, 22.9999);
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
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
  const { NS, TWO, M } = PWM;
  const xP = (k) => PLOT.x0 + (PLOT.w * k) / NS;
  const yA = (u) => PLOT.yA - PLOT.kA * u;
  const yB = (u) => PLOT.yB - PLOT.kB * u;
  const IS = 0.7 / PWM.I1; // the load current is drawn in units of its fundamental

  // monotone cubic keyframes (no overshoot, zero velocity at holds): the carrier ratio stretches smoothly
  function monoEval(keys, t) {
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
  const MFK = [
    [0, 21],
    [T.rewind0, 21],
    [T.cyc0, 9],
    [T.m1[0], 9],
    [T.m1[1], 21],
    [T.m2[0], 21],
    [T.m2[1], 45],
    [40, 45],
  ];

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

  // ---------------------------------------------------------------- the state at time t
  const hookA = (t) => (t < T.rewind0 ? 1 : 1 - smooth((t - T.rewind0) / 0.5));
  const cyc = (t) => (t - T.cyc0) / T.CYC;
  /** alpha and reveal progress of a trace that is drawn during cycle `start` (full during the hook) */
  const tr = (t, start) => (t < 2.1 ? { a: hookA(t), p: 1 } : { a: 1, p: clamp01(cyc(t) - start) });
  const thetaC = (t) => {
    if (t < T.cyc0) return 0.9;
    const c = cyc(t);
    return TWO * (c - Math.floor(c));
  };

  function drawTop(t, W, kC) {
    const aB = t < 2.1 ? hookA(t) : smooth((t - 2.2) / 0.3);
    const aBC = t < 2.1 ? hookA(t) : smooth((t - 6.8) / 0.4);
    const x0 = PLOT.x0,
      x1 = PLOT.x0 + PLOT.w;
    if (aB > 0.001) {
      seg(x0, yA(0), x1, yA(0), WHITE, 2, 0.3 * aB);
      seg(x0, yA(1), x1, yA(1), WHITE, 1, 0.1 * aB);
      seg(x0, yA(-1), x1, yA(-1), WHITE, 1, 0.1 * aB);
    }
    // the switch is ON wherever the reference is above the carrier: shade the gap, up to the first cycle's reveal
    const s0 = tr(t, 0);
    if (s0.a > 0.001) {
      const n = Math.round(NS * s0.p);
      ctx.save();
      ctx.globalAlpha = 0.3 * s0.a * aB;
      ctx.strokeStyle = RED;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let k = 0; k < n; k++)
        if (W.Sa[k]) {
          ctx.moveTo(xP(k), yA(W.c[k]));
          ctx.lineTo(xP(k), yA(W.va[k]));
        }
      ctx.stroke();
      ctx.restore();
    }
    const curve = (arr, color, a, wd, blur) => {
      const pts = [];
      for (let k = 0; k < NS; k++) pts.push([xP(k), yA(arr[k])]);
      line(pts, color, wd, a, blur);
    };
    curve(W.c, WHITE, 0.85 * aB, 3);
    curve(W.va, RED, aB, 5, 10);
    if (aBC > 0.001) {
      curve(W.vb, BLUE, aBC, 5, 10);
      curve(W.vc, PURPLE, aBC, 5, 10);
    }
    // legend swatches (the labels are HTML)
    seg(170, 372, 198, 372, RED, 5, aB);
    seg(300, 372, 328, 372, BLUE, 5, aBC);
    seg(430, 372, 458, 372, PURPLE, 5, aBC);
    seg(582, 372, 610, 372, WHITE, 4, 0.85 * aB);
    // the cursor
    const aC = t < 2.1 ? hookA(t) : smooth((t - 2.3) / 0.2);
    if (aC > 0.001) {
      seg(xP(kC), PA[1] + 56, xP(kC), PB[1] + PB[3] - 14, WHITE, 2, 0.4 * aC);
      dot(xP(kC), yA(W.va[kC]), 8, RED, aC, 16);
      dot(xP(kC), yA(W.c[kC]), 6, WHITE, aC, 10);
    }
  }

  function drawMid(t, W, mf, kC) {
    const x0 = PLOT.x0,
      x1 = PLOT.x0 + PLOT.w;
    seg(x0, yB(0), x1, yB(0), WHITE, 2, 0.3);
    seg(x0, yB(1), x1, yB(1), WHITE, 1, 0.1);
    seg(x0, yB(-1), x1, yB(-1), WHITE, 1, 0.1);
    const path = (arr, scale, p) => {
      const n = Math.max(2, Math.round(NS * p));
      const pts = [];
      for (let k = 0; k < Math.min(n, NS); k++) pts.push([xP(k), yB(arr[k] * scale)]);
      return pts;
    };
    // pulses of leg a, then their average (the filter output), then the line voltage, then the load current
    const pole = t < 2.1 ? { a: 0, p: 1 } : tr(t, 0);
    const aPole = pole.a * (t < 2.1 ? 0 : 1 - smooth((t - 6.8) / 0.3));
    if (aPole > 0.001 && pole.p > 0) line(path(W.Sa, 1, pole.p), RED, 4, aPole, 8);
    seg(165, 815, 193, 815, RED, 5, aPole * (pole.p > 0 ? 1 : 0));
    const av = tr(t, 1);
    const aAvg = t < 2.1 ? 0 : av.a * (1 - smooth((t - 6.8) / 0.3));
    if (aAvg > 0.001 && av.p > 0) line(path(PWM.average(W.Sa, mf), 1, av.p), WHITE, 5, aAvg, 10);
    seg(515, 815, 543, 815, WHITE, 5, aAvg * (av.p > 0 ? 1 : 0));
    const ln = tr(t, 2);
    const aLine = ln.a * (t < 9.0 || t < 2.1 ? 1 : 1 - 0.55 * smooth((t - 9.0) / 0.4));
    if (aLine > 0.001 && ln.p > 0) line(path(W.vab, 1, ln.p), BLUE, 4, aLine, 8);
    seg(295, 815, 323, 815, BLUE, 5, aLine * (ln.p > 0 ? 1 : 0));
    const cu = tr(t, 3);
    if (cu.a > 0.001 && cu.p > 0) line(path(W.ia, IS, cu.p), PURPLE, 6, cu.a, 14);
    seg(425, 815, 453, 815, PURPLE, 5, cu.a * (cu.p > 0 ? 1 : 0));
    // the cursor in the second panel
    const aC = t < 2.1 ? hookA(t) : smooth((t - 2.3) / 0.2);
    if (aC > 0.001) {
      if (aPole > 0.001) dot(xP(kC), yB(W.Sa[kC]), 7, RED, aC * aPole, 14);
      if (cu.a > 0.001 && cu.p >= 1) dot(xP(kC), yB(W.ia[kC] * IS), 8, PURPLE, aC * cu.a, 16);
    }
  }

  // the bridge: the conducting switch of each leg lights up in the colour of its phase
  function drawBridge(t, W, kC) {
    const a0 = t < 2.1 ? hookA(t) : 1;
    const aBC = t < 2.1 ? hookA(t) : smooth((t - 6.8) / 0.4);
    const S = [W.Sa[kC], W.Sb[kC], W.Sc[kC]];
    // the two DC rails, drawn as T-shaped terminals
    seg(135, BR.top, 415, BR.top, WHITE, 3, 0.7 * a0);
    seg(150, BR.top - 14, 150, BR.top, WHITE, 3, 0.7 * a0);
    seg(130, BR.top - 14, 170, BR.top - 14, WHITE, 3, 0.7 * a0);
    seg(135, BR.bot, 415, BR.bot, WHITE, 3, 0.7 * a0);
    seg(150, BR.bot, 150, BR.bot + 14, WHITE, 3, 0.7 * a0);
    seg(130, BR.bot + 14, 170, BR.bot + 14, WHITE, 3, 0.7 * a0);
    BR.xs.forEach((x, n) => {
      const a = n === 0 ? a0 : aBC;
      if (a <= 0.001) return;
      const up = S[n] === 1;
      const sw = (cy, on) => {
        ctx.save();
        ctx.globalAlpha = a;
        if (on) {
          ctx.fillStyle = PHC[n];
          ctx.shadowColor = PHC[n];
          ctx.shadowBlur = 16;
          ctx.fillRect(x - 15, cy - 18, 30, 36);
        } else {
          ctx.strokeStyle = "rgba(255,255,255,.35)";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - 15, cy - 18, 30, 36);
        }
        ctx.restore();
      };
      const on = (v) => (v ? PHC[n] : "rgba(255,255,255,.35)");
      seg(x, BR.top, x, 1084, on(up), 3, a);
      sw(1102, up);
      seg(x, 1120, x, 1138, on(up), 3, a);
      seg(x, 1138, x, 1156, on(!up), 3, a);
      sw(1174, !up);
      seg(x, 1192, x, BR.bot, on(!up), 3, a);
      dot(x, 1138, 6, PHC[n], a, 12);
    });
  }

  // the three phase references as rotating vectors (the circle is the carrier amplitude)
  function drawPhasors(t, th, a) {
    if (a <= 0.001) return;
    const aBC = smooth((t - 6.8) / 0.4);
    ctx.save();
    ctx.globalAlpha = 0.5 * a;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(PH.cx, PH.cy, PH.r, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
    seg(PH.cx - PH.r - 8, PH.cy, PH.cx + PH.r + 8, PH.cy, WHITE, 1.5, 0.3 * a);
    seg(PH.cx, PH.cy - PH.r - 8, PH.cx, PH.cy + PH.r + 8, WHITE, 1.5, 0.3 * a);
    [0, 1, 2].forEach((n) => {
      const al = n === 0 ? a : a * aBC;
      if (al <= 0.001) return;
      const ang = th - (n * TWO) / 3,
        x = PH.cx + PH.r * M * Math.cos(ang),
        y = PH.cy - PH.r * M * Math.sin(ang);
      seg(PH.cx, PH.cy, x, y, PHC[n], 5, al, 10);
      dot(x, y, 7, PHC[n], al, 14);
    });
  }

  // the spectrum of the line voltage: the carrier sidebands move away as the carrier ratio rises
  function drawSpectrum(mf, a) {
    if (a <= 0.001) return;
    seg(SP.x0 - 8, SP.base, 975, SP.base, WHITE, 2, 0.4 * a);
    const wt = {
      9: mf <= 21 ? clamp01((21 - mf) / 12) : 0,
      21: mf <= 21 ? clamp01((mf - 9) / 12) : clamp01((45 - mf) / 24),
      45: mf >= 21 ? clamp01((mf - 21) / 24) : 0,
    };
    for (const k of [9, 21, 45]) {
      const w = wt[k] * a;
      if (w <= 0.001) continue;
      const tab = SPEC[k];
      ctx.save();
      ctx.globalAlpha = w;
      for (let h = 1; h <= 100; h++) {
        const v = tab[h - 1];
        if (v < 0.006) continue;
        ctx.fillStyle = h === 1 ? RED : BLUE;
        if (h === 1) {
          ctx.shadowColor = RED;
          ctx.shadowBlur = 12;
        } else ctx.shadowBlur = 0;
        const bh = Math.min(1, v) * SP.kv;
        ctx.fillRect(SP.x0 + h * SP.kh - 1.5, SP.base - bh, 3, bh);
      }
      ctx.restore();
    }
    const xm = SP.x0 + mf * SP.kh;
    seg(xm, SP.base + 2, xm, SP.base - SP.kv - 4, WHITE, 1.5, 0.35 * a);
  }

  const mfLab = document.getElementById("lmf");
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
    const mf = monoEval(MFK, t);
    const W = PWM.wave(mf);
    const th = thetaC(t);
    const kC = Math.min(NS - 1, Math.floor((NS * th) / TWO));
    drawTop(t, W, kC);
    drawMid(t, W, mf, kC);
    drawBridge(t, W, kC);
    const aPh = t < 2.1 ? 0 : smooth((t - 2.4) / 0.3) * (1 - smooth((t - 9.0) / 0.4));
    const aSp = t < 2.1 ? hookA(t) : smooth((t - 9.0) / 0.4);
    drawPhasors(t, th, aPh);
    drawSpectrum(mf, aSp);
    if (mfLab) mfLab.style.transform = `translate(${(SP.x0 + mf * SP.kh - 700).toFixed(1)}px,0px)`;
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
