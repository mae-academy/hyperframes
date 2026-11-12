// Timeline for "THE GAMMA FUNCTION" (23.2 s).
// The integrand and its area, the graph with the factorial points and the poles, and the hops of the recurrence are drawn on a canvas from
// the time alone (hf-seek protocol); text, counters, read-outs and cards are GSAP.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, GB, GA, TAB, TAB0, HOPS_POS, HOPS_NEG, XS0, XS1 } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const r3 = (v) => Math.round(v * 1000) / 1000;

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished graph
    [1.6, "snap"], // rewind
    [2.2, "click"], // factorials live on the integers
    [2.4, "snap"], // Gamma(1) = 0!
    [2.9, "snap"], // Gamma(2) = 1!
    [3.4, "snap"], // Gamma(3) = 2!
    [3.9, "snap"], // Gamma(4) = 3!
    [4.6, "click"], // fill the gaps with an integral
    [4.8, "click"], // the definition
    [5.0, "snap"], // the integral starts to slide
    [10.2, "click"], // go left
    [10.4, "click"], // divide by x
    [11.6, "snap"], // Gamma(-1/2)
    [12.3, "snap"], // Gamma(-3/2)
    [13.0, "snap"], // Gamma(-5/2)
    [13.6, "click"], // go right
    [13.8, "snap"], // Gamma(1/2) = sqrt(pi)
    [14.4, "snap"], // Gamma(3/2)
    [15.4, "snap"], // Gamma(5/2)
    [16.4, "snap"], // Gamma(7/2)
    [16.8, "thump"], // lock
    [17.8, "click"], // a factorial for every number
    [19.2, "snap"], // CTA reveal
    [21.8, "click"], // engagement pulse
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
    if (curCount)
      ft(
        curCount,
        { opacity: 1 },
        { opacity: 0, duration: pop ? 0.06 : 0.03, ease: "power1.in" },
        t,
      );
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
    if (curForm) ft(curForm, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.06);
    curForm = n;
  }
  const pop = (sel, at, y) =>
    ft(
      sel,
      { opacity: 0, y: y === undefined ? 10 : y },
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
      at,
    );
  const fade = (sel, at, d) =>
    ft(sel, { opacity: 1 }, { opacity: 0, duration: d || 0.25, ease: "power1.in" }, at);

  // the labels of the finished graph are on screen at frame 0; they leave with the rewind
  const HOOKED = ["#fl1", "#fl2", "#fl3", "#fl4", "#pv3"];
  gsap.set(HOOKED.join(","), { opacity: 1 });

  // ---------------------------------------------------------------- 0.0 - 2.2  the finished graph, then the rewind
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
  [1, 2, 3, 4, 5].forEach((n) => cswap("#r" + n, r3(T.rewind0 + 0.08 * (n - 1)), false));
  HOOKED.forEach((s) => fade(s, T.rewind0, 0.2));

  // ---------------------------------------------------------------- 2.2 - 4.6  Gamma(n) = (n - 1)!: the factorials, one by one
  hit(T.s1, "click", "#bn1");
  bnSwap("#bn1", T.s1);
  T.dots.forEach((t0, i) => {
    hit(t0, "snap", "#n" + (i + 1));
    cswap("#n" + (i + 1), t0, true);
    pop("#fl" + (i + 1), t0 + 0.05, 8);
  });
  fswap("#f1", T.dots[0]);

  // ---------------------------------------------------------------- 4.6 - 10.2  the integral fills the gaps: x slides, the area is Gamma(x)
  hit(T.s2, "click", "#bn2");
  bnSwap("#bn2", T.s2);
  hit(T.fm2, "click", "#f2");
  fswap("#f2", T.fm2);
  hit(T.sw0, "snap", "#lt");
  pop("#lt", T.sw0, 6);
  fade("#n4", T.sw0, 0.12);
  CFG.HUD.forEach((h, k) => {
    const a = r3(T.sw0 + 0.1 * k);
    if (k === 0)
      ft("#" + h.id, { opacity: 0 }, { opacity: 1, duration: 0.09, ease: "power2.out" }, a);
    else ft("#" + h.id, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, a);
    if (k < CFG.HUD.length - 1)
      ft("#" + h.id, { opacity: 1 }, { opacity: 0, duration: 0.001, ease: "none" }, r3(a + 0.1));
  });

  // ---------------------------------------------------------------- 10.2 - 13.5  go left: divide by x, poles at 0, -1, -2 ...
  hit(T.s3, "click", "#bn3");
  bnSwap("#bn3", T.s3);
  fade("#" + CFG.HUD[CFG.HUD.length - 1].id, T.s3, 0.15);
  fade("#lt", T.s3, 0.2);
  ft(
    "#cp",
    { opacity: 0, scale: 1.2 },
    { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(2)" },
    T.s3,
  );
  curCount = "#cp";
  hit(T.fm3, "click", "#f3");
  fswap("#f3", T.fm3);
  pop("#pl", T.s3 + 0.5, 6);
  T.negHops.forEach((t0, i) => {
    hit(t0, "snap", "#nv" + i);
    pop("#nv" + i, t0 + 0.1, 8);
    pop("#nm" + i, t0, 6);
    pop("#ln" + i, t0, 10);
  });

  // ---------------------------------------------------------------- 13.6 - 16.8  go right: multiply by x, from sqrt(pi) up to 2.5!
  ["#ln0", "#ln1", "#ln2", "#nv0", "#nv1", "#nv2", "#nm0", "#nm1", "#nm2"].forEach((s) =>
    fade(s, T.clear, 0.25),
  );
  fade("#cp", T.clear, 0.2);
  curCount = null;
  hit(T.s4, "click", "#bn4");
  bnSwap("#bn4", T.s4);
  fswap("#f4", T.s4);
  T.posHops.forEach((t0, i) => {
    hit(t0, "snap", "#pv" + i);
    pop("#pv" + i, t0 + 0.05, 8);
    pop("#lp" + i, t0, 10);
    if (i > 0) pop("#pm" + (i - 1), t0 - 0.05, 6);
  });
  fade("#pl", T.clear, 0.25);

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
  cswap("#cfin", LK + 0.3, true);
  fswap("#f5", LK + 0.5);
  ft(
    "#chkp",
    { opacity: 1, strokeDashoffset: 120 },
    { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" },
    LK + 0.35,
  );
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

  tl.to({}, { duration: 0.0001 }, 23.1999);
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
  const PA = [90, 340, 900, 400],
    PB = [90, 760, 900, 470];
  const XB = (x) => GB.x0 + (x - GB.xmin) * GB.ku;
  const YB = (v) => GB.zero - v * GB.kv;
  const XA = (t) => GA.x0 + t * GA.ku;
  const YA = (v) => GA.base - v * GA.kv;
  // Gamma(x) by interpolation in the table built from the real function; null where the line leaves the plot
  const gam = (x) => {
    const f = (x - TAB0) / 0.01,
      i = Math.floor(f),
      u = f - i;
    const a = TAB[i],
      b = TAB[i + 1];
    return a === null || b === null || a === undefined || b === undefined ? null : a + (b - a) * u;
  };
  // exact values for the points that matter (the same law as the build: gamma at the integers and the half-integers)
  const GAM_AT = {
    1: 1,
    2: 1,
    3: 2,
    4: 6,
    0.5: 1.7724538509,
    1.5: 0.8862269255,
    2.5: 1.3293403882,
    3.5: 3.3233509704,
    "-0.5": -3.5449077018,
    "-1.5": 2.3632718012,
    "-2.5": -0.9453087205,
  };
  const ga = (x) => (GAM_AT[x] !== undefined ? GAM_AT[x] : gam(x));

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

  // ---------------------------------------------------------------- the graph of Gamma
  /** the pieces of the curve between xl and xr, broken wherever the value runs off the plot (the poles) */
  function pieces(xl, xr) {
    const out = [];
    let cur = [];
    for (let i = 0; i < TAB.length; i++) {
      const x = TAB0 + i * 0.01;
      if (x < xl - 1e-9 || x > xr + 1e-9) continue;
      const v = TAB[i];
      if (v === null) {
        if (cur.length > 1) out.push(cur);
        cur = [];
      } else cur.push([XB(x), YB(v)]);
    }
    if (cur.length > 1) out.push(cur);
    return out;
  }
  function drawAxesB() {
    withClip(PB, () => {
      line(
        [
          [GB.x0, YB(0)],
          [GB.x0 + 860, YB(0)],
        ],
        WHITE,
        2,
        0.4,
      );
      for (let v = -3; v <= 4; v++)
        line(
          [
            [XB(v), PB[1] + 14],
            [XB(v), PB[1] + PB[3] - 30],
          ],
          WHITE,
          1,
          v === 0 ? 0.3 : 0.06,
        );
    });
  }
  function drawCurve(xl, xr, alpha, width, blur, dash) {
    withClip(PB, () => pieces(xl, xr).forEach((p) => line(p, PURPLE, width, alpha, blur, dash)));
  }
  function drawPoles(upTo, alpha) {
    // dashed asymptotes at 0, -1, -2, -3, drawn as the left edge of the curve passes them
    withClip(PB, () => {
      for (const p of [0, -1, -2, -3]) {
        const a = alpha * smooth((p - upTo + 0.12) / 0.2);
        line(
          [
            [XB(p), PB[1] + 12],
            [XB(p), PB[1] + PB[3] - 30],
          ],
          WHITE,
          2,
          0.55 * a,
          0,
          [10, 9],
        );
      }
    });
  }
  const DOTN = [1, 2, 3, 4];
  function drawDots(t, mode) {
    DOTN.forEach((n, i) => {
      const appear = mode === "all" ? 1 : easeOut((t - T.dots[i]) / 0.3);
      if (appear <= 0.001) return;
      const tn = T.sw0 + ((n - XS0) / (XS1 - XS0)) * (T.sw1 - T.sw0); // the moment the sliding x reaches n
      const ring = mode === "sweep" ? Math.max(0, 1 - Math.abs(t - tn) / 0.5) : 0;
      const x = XB(n),
        y = YB(ga(n));
      withClip(PB, () => {
        dot(x, y, 7 * appear + 5 * ring, WHITE, appear, 12 + 14 * ring);
        if (ring > 0) {
          ctx.save();
          ctx.globalAlpha = ring;
          ctx.strokeStyle = PURPLE;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, 14 + 18 * (1 - ring), 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();
        }
      });
    });
  }

  // ---------------------------------------------------------------- the integrand and its area (the top panel)
  function drawIntegrand(x, alpha) {
    if (alpha <= 0.001) return;
    const pts = [];
    for (let t = 0.02; t <= 10 + 1e-9; t += 0.04)
      pts.push([XA(t), YA(Math.pow(t, x - 1) * Math.exp(-t))]);
    withClip(PA, () => {
      line(
        [
          [GA.x0, YA(0)],
          [GA.x0 + 860, YA(0)],
        ],
        WHITE,
        2,
        0.4 * alpha,
      );
      for (let t = 1; t <= 10; t++)
        line(
          [
            [XA(t), PA[1] + 24],
            [XA(t), YA(0)],
          ],
          WHITE,
          1,
          0.05 * alpha,
        );
      ctx.save();
      ctx.globalAlpha = 0.5 * alpha;
      ctx.fillStyle = PURPLE;
      poly([[XA(0.02), YA(0)], ...pts, [XA(10), YA(0)]]);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      line(pts, RED, 5, alpha, 14);
    });
  }

  // ---------------------------------------------------------------- the hops of the recurrence
  function drawHop(xa, xb, p, color, alpha) {
    if (p <= 0.001 || alpha <= 0.001) return;
    const A = [XB(xa), YB(ga(xa))],
      B = [XB(xb), YB(ga(xb))];
    const mx = (A[0] + B[0]) / 2,
      my = Math.min(A[1], B[1]) - 70;
    const pts = [];
    for (let u = 0; u <= p + 1e-9; u += 0.04) {
      const k = 1 - u;
      pts.push([
        k * k * A[0] + 2 * k * u * mx + u * u * B[0],
        k * k * A[1] + 2 * k * u * my + u * u * B[1],
      ]);
    }
    withClip(PB, () => {
      line(pts, color, 4, alpha, 10);
      if (p > 0.96) {
        const e = pts[pts.length - 1],
          q = pts[pts.length - 3];
        const ang = Math.atan2(e[1] - q[1], e[0] - q[0]);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.translate(e[0], e[1]);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(8, 0);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-10, 8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    });
  }
  function marker(x, appear, strong) {
    if (appear <= 0.001) return;
    withClip(PB, () => {
      dot(XB(x), YB(ga(x)), (strong ? 10 : 8) * appear, WHITE, appear, strong ? 22 : 14);
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(XB(x), YB(ga(x)), (strong ? 18 : 15) * appear, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- the scenes
  function hookScene(a) {
    ctx.save();
    ctx.globalAlpha = a;
    drawAxesB();
    drawPoles(-3.6, 1);
    drawCurve(-3.65, 4.6, 1, 5, 14);
    drawDots(0, "all");
    drawIntegrand(3.5, 1);
    marker(3.5, 1, true);
    ctx.restore();
  }
  function drawGlitch(t) {
    const p = clamp01((t - T.rewind0) / (T.s1 - T.rewind0));
    const a = 1 - smooth(p);
    const frame = Math.floor(t * 24);
    const strips = 16,
      y0 = 340,
      sh = 890 / strips;
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
    withClip(PB, () => {
      pieces(-3.65, 4.6).forEach((pc) => {
        line(
          pc.map(([x, y]) => [x - sp, y]),
          RED,
          3,
          0.6 * a,
        );
        line(
          pc.map(([x, y]) => [x + sp, y]),
          BLUE,
          3,
          0.6 * a,
        );
      });
    });
  }
  const xcur = (t) => XS0 + (XS1 - XS0) * clamp01((t - T.sw0) / (T.sw1 - T.sw0));
  function stagedScene(t) {
    drawAxesB();
    // the top panel: the integrand for the integer just placed, then for the sliding x
    const lastDot = (() => {
      let i = -1;
      for (let j = 0; j < T.dots.length; j++) if (t >= T.dots[j]) i = j;
      return i;
    })();
    const out = 1 - smooth((t - T.s3) / 0.3);
    if (t < T.sw0) {
      for (let j = 0; j < T.dots.length; j++) {
        if (j > lastDot) continue;
        const w = smooth((t - T.dots[j]) / 0.25);
        const next =
          j < T.dots.length - 1 ? smooth((t - T.dots[j + 1]) / 0.25) : smooth((t - T.sw0) / 0.3);
        drawIntegrand(j + 1, w * (1 - next));
      }
      if (t >= T.sw0 - 0.3) drawIntegrand(xcur(T.sw0), smooth((t - (T.sw0 - 0.3)) / 0.3));
    } else drawIntegrand(xcur(t), out);
    // the graph: the dashed target first, then the recorded history of the slide, then the whole curve
    if (t >= T.dots[0] && t < T.sw0) drawCurve(0.2, 4.6, 0.16, 2, 0, [10, 10]);
    if (t >= T.sw0) {
      const x = xcur(t);
      if (t < T.sw1 + 0.01) drawCurve(0.2, 4.6, 0.12, 2, 0, [10, 10]);
      drawCurve(0.2, x, 1, 5.5, 14);
      const g = gam(x);
      if (g !== null && t < T.s3) dot(XB(x), YB(g), 8, WHITE, 1, 18);
    }
    if (t >= T.s3) {
      drawCurve(0.2, 4.6, 1, 5, 12);
      // the left branches, drawn from 0 leftwards (progress from the moment the formula appears)
      const xl = -3.65 * easeOut((t - T.fm3) / 1.2);
      drawCurve(xl, 0, 1, 5, 12);
      drawPoles(xl, 1);
    }
    drawDots(t, t >= T.sw0 ? "sweep" : "place");
    // the hops: first to the left (division), then to the right (multiplication)
    if (t >= T.negHops[0] - 0.3 && t < T.clear + 0.25) {
      const o = 1 - smooth((t - T.clear) / 0.25);
      marker(0.5, easeOut((t - (T.negHops[0] - 0.3)) / 0.25) * o, false);
      T.negHops.forEach((t0, i) => {
        drawHop(HOPS_NEG[i], HOPS_NEG[i + 1], easeOut((t - (t0 - 0.05)) / 0.5), RED, o);
        marker(HOPS_NEG[i + 1], easeOut((t - t0) / 0.3) * o, false);
      });
    }
    if (t >= T.posHops[0]) {
      marker(0.5, easeOut((t - T.posHops[0]) / 0.3), false);
      T.posHops.slice(1).forEach((t0, i) => {
        drawHop(HOPS_POS[i], HOPS_POS[i + 1], easeOut((t - (t0 - 0.05)) / 0.5), RED, 1);
        marker(HOPS_POS[i + 1], easeOut((t - t0) / 0.3), i === 2);
      });
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
    if (t < T.rewind0) hookScene(1);
    else if (t < T.s1) drawGlitch(t);
    else stagedScene(t);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
