// Timeline for "THE CONVOLUTION INTEGRAL" (24.4 s).
// The plots (stacked responses, impulses, the flipped and sliding h, the overlap area, y(t)) are drawn on a canvas from the time
// alone (hf-seek protocol); text, counters, read-outs and cards are GSAP.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, GEO, HOOK_N } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const r3 = (v) => Math.round(v * 1000) / 1000;

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the stack of responses
    [1.6, "snap"], // rewind
    [2.2, "click"], // one kick
    [2.6, "snap"], // the impulse lands, the circuit rings
    [4.0, "click"], // linear and time-invariant
    [4.6, "snap"], // the shifted, scaled copy
    [6.0, "snap"], // N = 4 kicks
    [7.0, "snap"], // N = 10
    [8.0, "snap"], // N = 24
    [9.2, "click"], // thinner kicks
    [9.4, "snap"], // N to infinity
    [9.6, "click"], // the integral
    [11.0, "click"], // flip and slide
    [11.2, "snap"], // the slide starts
    [12.2, "click"], // the overlap starts
    [14.2, "snap"], // the peak
    [17.3, "thump"], // lock
    [18.3, "click"], // no differential equation
    [19.8, "snap"], // CTA reveal
    [22.8, "click"], // engagement pulse
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
    ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
    curBanner = n;
  }
  function cswap(n, t, pop) {
    ft(curCount, { opacity: 1 }, { opacity: 0, duration: pop ? 0.06 : 0.03, ease: "power1.in" }, t);
    ft(
      n,
      { opacity: 0, scale: pop ? 1.3 : 1.08 },
      {
        opacity: 1,
        scale: 1,
        duration: pop ? 0.28 : 0.1,
        ease: pop ? "back.out(2)" : "power2.out",
      },
      t,
    );
    curCount = n;
  }
  function fswap(n, t) {
    ft(curForm, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.06);
    curForm = n;
  }
  const pop = (sel, at, y) =>
    ft(
      sel,
      { opacity: 0, y: y === undefined ? 12 : y },
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
      at,
    );
  const burst = (el, r0, r1, dur, at) =>
    ft(
      el,
      { attr: { r: r0 }, opacity: 0.95 },
      { attr: { r: r1 }, opacity: 0, duration: dur, ease: "power2.out" },
      at,
    );
  void burst;

  // ---------------------------------------------------------------- 0.0 - 2.2  the stack, then the rewind
  hit(0.0, "thump", "#flash0");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  hit(T.rewind0, "snap", "#rw");
  ft("#rw", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, T.rewind0);
  tl.fromTo(
    "#rw",
    { opacity: 1 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    T.rewind0 + 0.4,
  );
  [12, 6, 3, 2, 1].forEach((n, i) => cswap("#r" + (i + 1), r3(T.rewind0 + 0.08 * i), false));

  // ---------------------------------------------------------------- 2.2 - 4.0  one kick, one ring
  hit(T.s1, "click", "#bn1");
  bnSwap("#bn1", T.s1);
  cswap("#n1", T.s1, true);
  hit(T.imp1, "snap", "#fm1");
  fswap("#fm1", T.imp1);

  // ---------------------------------------------------------------- 4.0 - 6.0  linear and time-invariant
  hit(T.s2, "click", "#bn2");
  bnSwap("#bn2", T.s2);
  cswap("#n2", T.s2, true);
  hit(T.imp2, "snap", "#fm2");
  fswap("#fm2", T.imp2);

  // ---------------------------------------------------------------- 6.0 - 9.2  N = 4, 10, 24 kicks, all the rings added
  T.sN.forEach((n, i) => {
    hit(T.s3[i], "snap", "#n" + n);
    cswap("#n" + n, T.s3[i], true);
  });
  bnSwap("#bn3", T.s3[0]);
  fswap("#fm3", T.s3[0]);

  // ---------------------------------------------------------------- 9.2 - 11.0  thinner kicks: the sum becomes the integral
  hit(T.s4, "click", "#bn4");
  bnSwap("#bn4", T.s4);
  hit(T.ninf, "snap", "#ninf");
  cswap("#ninf", T.ninf, true);
  hit(T.f4, "click", "#fm4");
  fswap("#fm4", T.f4);

  // ---------------------------------------------------------------- 11.0 - 17.2  flip and slide, the overlap area is y(t)
  hit(T.s5, "click", "#bn5");
  bnSwap("#bn5", T.s5);
  ft("#ninf", { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in" }, T.s5);
  CFG.HUD.forEach((h, k) => {
    const a = r3(T.slide0 + 0.1 * k);
    if (k === 0) {
      hit(a, "snap", "#lh");
      ft("#lh", { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }, a);
      ft(
        "#hk0",
        { opacity: 0, scale: 1.1 },
        { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
        a,
      );
    } else ft("#" + h.id, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, a);
    if (k < CFG.HUD.length - 1)
      ft("#" + h.id, { opacity: 1 }, { opacity: 0, duration: 0.001, ease: "none" }, r3(a + 0.1));
  });
  hit(T.mk0, "click", "#mk0");
  pop("#mk0", T.mk0, 8);
  hit(T.mk2, "snap", "#mk2");
  pop("#mk2", T.mk2, 8);

  // ---------------------------------------------------------------- the lock
  const LK = T.lock;
  hit(LK, "thump", "#glow");
  ft("#glow", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, LK);
  tl.fromTo(
    "#glow",
    { opacity: 1 },
    { opacity: 0, duration: 0.9, ease: "power2.inOut", immediateRender: false },
    LK + 0.15,
  );
  ft("#mk0", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, LK);
  ft("#mk2", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, LK);
  ft("#hk60", { scale: 1 }, { scale: 1.1, duration: 0.15, ease: "power2.out" }, LK);
  tl.fromTo(
    "#hk60",
    { scale: 1.1 },
    { scale: 1, duration: 0.35, ease: "power2.inOut", immediateRender: false },
    LK + 0.15,
  );
  ft(
    "#chkp",
    { opacity: 1, strokeDashoffset: 120 },
    { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" },
    LK + 0.35,
  );
  fswap("#fcase", LK + 0.5);
  hit(T.banF, "click", "#bnF");
  bnSwap("#bnF", T.banF);

  // ---------------------------------------------------------------- CTA
  hit(T.card, "snap", "#card");
  ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, T.card - 0.1);
  ft("#banner", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, T.card - 0.1);
  ft("#card", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, T.card);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 0.1);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 0.4);
  ft("#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 0.7);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 1.1);
  hit(T.pulse, "click", "#ctaglow");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.45, duration: 0.2, ease: "power2.out" }, T.pulse);
  tl.fromTo(
    "#ctaglow",
    { opacity: 0.45 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    T.pulse + 0.3,
  );

  tl.to({}, { duration: 0.0001 }, 24.3999);
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
    PURPLE = "#B026FF";
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
  const e = Math.exp;
  const hf = (s) => (s >= 0 ? e(-s) : 0);
  const PW = 2;
  const yx = (t) => (t < 0 ? 0 : t <= PW ? 1 - e(-t) : (1 - e(-PW)) * e(-(t - PW)));
  const X = (u) => GEO.x0 + (u - GEO.tmin) * GEO.ku;
  const TY = (v) => GEO.topBase - v * GEO.topK;
  const OY = (v) => GEO.outBase - v * GEO.outK;
  const TOP = [90, 400, 900, 400],
    OUT = [90, 860, 900, 340];

  function withClip(r, fn) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(r[0], r[1], r[2], r[3]);
    ctx.clip();
    fn();
    ctx.restore();
  }
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
  function area(pts, color, alpha) {
    if (pts.length < 2 || alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    poly(pts);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  const ts = Array.from({ length: 141 }, (_, i) => GEO.tmin + i * 0.05);

  // ---------------------------------------------------------------- the stack of responses (cumulative, cached per N)
  const BANDS = {};
  function bands(N) {
    if (BANDS[N]) return BANDS[N];
    const d = PW / N;
    const cum = [];
    let prev = ts.map(() => 0);
    for (let k = 0; k < N; k++) {
      const tk = (k + 0.5) * d;
      const cur = prev.map((v, i) => v + hf(ts[i] - tk) * d);
      cum.push(cur);
      prev = cur;
    }
    BANDS[N] = { cum, top: prev, d };
    return BANDS[N];
  }
  const BCOL = [RED, PURPLE, BLUE];
  function drawBands(N, alpha) {
    if (alpha <= 0.001) return;
    const B = bands(N);
    withClip(TOP, () => {
      for (let k = 0; k < N; k++) {
        const lo = k === 0 ? ts.map(() => 0) : B.cum[k - 1];
        const up = B.cum[k];
        const pts = [];
        for (let i = 0; i < ts.length; i++) pts.push([X(ts[i]), TY(up[i])]);
        for (let i = ts.length - 1; i >= 0; i--) pts.push([X(ts[i]), TY(lo[i])]);
        area(pts, BCOL[k % 3], 0.5 * alpha);
        if (N <= 24) line(pts.slice(0, ts.length), "#FFFFFF", 1, 0.18 * alpha);
      }
      line(
        ts.map((t, i) => [X(t), TY(B.top[i])]),
        "#FFFFFF",
        2.5,
        0.85 * alpha,
        8,
      );
    });
  }
  function drawSumN(N, alpha) {
    if (alpha <= 0.001) return;
    const B = bands(N);
    withClip(OUT, () =>
      line(
        ts.map((t, i) => [X(t), OY(B.top[i])]),
        PURPLE,
        5,
        alpha,
        14,
      ),
    );
  }
  function drawPulse(alpha, N, fillA) {
    if (alpha <= 0.001) return;
    withClip(TOP, () => {
      area(
        [
          [X(0), TY(0)],
          [X(0), TY(1)],
          [X(PW), TY(1)],
          [X(PW), TY(0)],
        ],
        BLUE,
        fillA * alpha,
      );
      line(
        [
          [X(0), TY(0)],
          [X(0), TY(1)],
          [X(PW), TY(1)],
          [X(PW), TY(0)],
        ],
        BLUE,
        3,
        0.9 * alpha,
        8,
      );
      if (N && N <= 24)
        for (let k = 1; k < N; k++)
          line(
            [
              [X(k * (PW / N)), TY(0)],
              [X(k * (PW / N)), TY(1)],
            ],
            BLUE,
            1.2,
            0.35 * alpha,
          );
    });
  }
  function drawAxes() {
    ctx.save();
    for (let v = 0; v <= 5; v++) {
      line(
        [
          [X(v), TOP[1] + 30],
          [X(v), OUT[1] + OUT[3] - 40],
        ],
        "#FFFFFF",
        1,
        0.05,
      );
    }
    line(
      [
        [110, TY(0)],
        [970, TY(0)],
      ],
      "#FFFFFF",
      2,
      0.35,
    );
    line(
      [
        [110, OY(0)],
        [970, OY(0)],
      ],
      "#FFFFFF",
      2,
      0.35,
    );
    line(
      [
        [X(0), TY(1.15)],
        [X(0), TY(0)],
      ],
      "#FFFFFF",
      2,
      0.35,
    );
    line(
      [
        [X(0), OY(1.05)],
        [X(0), OY(0)],
      ],
      "#FFFFFF",
      2,
      0.35,
    );
    ctx.restore();
  }
  const exactPts = ts.map((t) => [X(t), OY(yx(t))]);
  const ghost = (alpha) => withClip(OUT, () => line(exactPts, "#FFFFFF", 2, alpha, 0, [10, 12]));

  // ---------------------------------------------------------------- impulses and a single response
  function stem(u, h, grow, color, alpha) {
    if (grow <= 0.001 || alpha <= 0.001) return;
    const top = TY(h * grow);
    withClip(TOP, () => {
      line(
        [
          [X(u), TY(0)],
          [X(u), top],
        ],
        color,
        5,
        alpha,
        12,
      );
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(X(u), top - 12);
      ctx.lineTo(X(u) - 9, top + 8);
      ctx.lineTo(X(u) + 9, top + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }
  function response(u0, w, progress, alpha) {
    if (progress <= 0.001 || alpha <= 0.001) return;
    const pts = [];
    const end = GEO.tmin + (GEO.tmax - GEO.tmin) * progress;
    for (let i = 0; i < ts.length && ts[i] <= end; i++)
      pts.push([X(ts[i]), TY(w * hf(ts[i] - u0))]);
    if (pts.length < 2) return;
    withClip(TOP, () => {
      area(
        [
          [X(Math.max(u0, GEO.tmin)), TY(0)],
          ...pts.filter((p) => p[0] >= X(u0) - 0.5),
          [pts[pts.length - 1][0], TY(0)],
        ],
        RED,
        0.18 * alpha,
      );
      line(pts, RED, 5, alpha, 14);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = RED;
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#fff";
      const last = pts[pts.length - 1];
      ctx.beginPath();
      ctx.arc(last[0], last[1], 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- the scenes
  function hookScene(alpha) {
    drawAxes();
    drawPulse(alpha, HOOK_N, 0.1);
    drawBands(HOOK_N, alpha);
    ghost(0.25 * alpha);
    drawSumN(HOOK_N, alpha);
  }
  function drawGlitch(t) {
    const p = clamp01((t - T.rewind0) / (T.s1 - T.rewind0));
    const a = 1 - smooth(p);
    const frame = Math.floor(t * 24);
    const strips = 14,
      y0 = 400,
      sh = 800 / strips;
    for (let s = 0; s < strips; s++) {
      const g = CFG.glitch[(s * 7 + frame * 3) % CFG.glitch.length];
      const dx = (g - 0.5) * 2 * 110 * (0.25 + p);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y0 + s * sh, 1080, sh + 1);
      ctx.clip();
      ctx.translate(dx, 0);
      hookScene(a);
      ctx.restore();
    }
    const sp = 4 + 14 * p;
    withClip(OUT, () => {
      const B = bands(HOOK_N);
      line(
        ts.map((tt, i) => [X(tt) - sp, OY(B.top[i])]),
        RED,
        3,
        0.6 * a,
      );
      line(
        ts.map((tt, i) => [X(tt) + sp, OY(B.top[i])]),
        BLUE,
        3,
        0.6 * a,
      );
    });
  }
  function drawS12(t) {
    if (t < T.s1 || t >= T.s3[0] + 0.3) return;
    const a = 1 - smooth((t - T.s3[0]) / 0.25);
    drawAxes();
    // the first kick and its ring
    const dim = t >= T.s2 ? 0.6 : 1;
    const g1 = easeOut((t - (T.s1 + 0.1)) / 0.3);
    stem(0, 1, g1, BLUE, a * 1);
    response(0, 1, clamp01((t - T.imp1) / 1.0), a * dim);
    // the second kick: later and weaker, so its ring is later and weaker
    const g2 = easeOut((t - (T.s2 + 0.2)) / 0.35);
    stem(1.2, 0.6, g2, BLUE, a);
    response(1.2, 0.6, clamp01((t - T.imp2) / 0.9), a);
    // the sum of the two rings, below
    const ps = clamp01((t - (T.imp2 + 0.6)) / 0.7);
    if (ps > 0) {
      const end = GEO.tmin + (GEO.tmax - GEO.tmin) * ps;
      const pts = [];
      for (let i = 0; i < ts.length && ts[i] <= end; i++)
        pts.push([X(ts[i]), OY(hf(ts[i]) + 0.6 * hf(ts[i] - 1.2))]);
      withClip(OUT, () => line(pts, PURPLE, 5, a, 14));
    }
  }
  function drawS34(t) {
    if (t < T.s3[0] || t >= T.s5 + 0.4) return;
    drawAxes();
    const steps = [T.s3[0], T.s3[1], T.s3[2], T.s4];
    const Ns = [T.sN[0], T.sN[1], T.sN[2], 120];
    let i = 0;
    for (let j = 0; j < steps.length; j++) if (t >= steps[j]) i = j;
    const w = smooth((t - steps[i]) / 0.3);
    const out = 1 - smooth((t - (T.s5 - 0.4)) / 0.4);
    const pulseA = 1;
    drawPulse(
      pulseA * Math.max(out, smooth((t - (T.s5 - 0.2)) / 0.3)),
      Ns[i] <= 24 ? Ns[i] : 0,
      t >= T.s5 ? 0.28 : 0.1,
    );
    if (i === 0) {
      drawBands(Ns[0], w * out);
      drawSumN(Ns[0], w * out);
    } else {
      drawBands(Ns[i - 1], (1 - w) * out);
      drawBands(Ns[i], w * out);
      drawSumN(Ns[i - 1], (1 - w) * out);
      drawSumN(Ns[i], w * out);
    }
    ghost(0.28 * out);
  }
  function slideT(t) {
    return -1 + clamp01((t - T.slide0) / (T.slide1 - T.slide0)) * (GEO.tmax - 1 - GEO.tmin);
  }
  function drawS5(t) {
    if (t < T.s5 - 0.3) return;
    const a = smooth((t - (T.s5 - 0.2)) / 0.3);
    const ts5 = slideT(t);
    drawAxes();
    if (t >= T.s5 + 0.4) drawPulse(1, 0, 0.28);
    // the flipped h(t - tau), anchored at tau = t: rises to 1 at tau = t, then 0 (the cliff)
    const hp = [];
    for (let u = Math.max(GEO.tmin, ts5 - 5); u <= ts5 + 1e-9; u += 0.04)
      hp.push([X(u), TY(hf(ts5 - u))]);
    if (ts5 >= GEO.tmin) hp.push([X(ts5), TY(0)]);
    // the overlap with x: the area that IS y(t)
    const hi = Math.min(ts5, PW);
    if (hi > 0) {
      const op = [[X(0), TY(0)]];
      for (let u = 0; u <= hi + 1e-9; u += 0.04) op.push([X(u), TY(hf(ts5 - u))]);
      op.push([X(hi), TY(hf(ts5 - hi))], [X(hi), TY(0)]);
      withClip(TOP, () => {
        area(op, PURPLE, 0.55 * a);
        line(op.slice(1, -1), PURPLE, 3, a, 12);
      });
    }
    withClip(TOP, () => line(hp, RED, 5, a, 14));
    // the link from the sliding position down to the output
    line(
      [
        [X(ts5), TOP[1] + 40],
        [X(ts5), OY(0)],
      ],
      "#FFFFFF",
      1.5,
      0.4 * a,
      0,
      [6, 8],
    );
    ghost(0.2 * a);
    const tr = [];
    for (let u = GEO.tmin; u <= ts5 + 1e-9; u += 0.04) tr.push([X(u), OY(yx(u))]);
    withClip(OUT, () => {
      line(tr, PURPLE, 5.5, a, 14);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.shadowColor = PURPLE;
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(X(ts5), OY(yx(ts5)), 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
  }
  function drawLock(t) {
    const u = t - T.lock;
    if (u < 0 || u > 1.3) return;
    const cx = 540,
      cy = 800;
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
      ctx.moveTo(x, 400);
      ctx.lineTo(x, 1200);
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    [
      [90, 400],
      [990, 400],
      [90, 1200],
      [990, 1200],
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
      [PURPLE, 640, 0, 0.7],
      [RED, 500, 0.1, 0.6],
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
    if (t < T.rewind0) hookScene(1);
    else if (t < T.s1) drawGlitch(t);
    drawS12(t);
    drawS34(t);
    drawS5(t);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
