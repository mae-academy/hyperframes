// Timeline for "THE LAPLACE TRANSFORM: THE s-PLANE AS A LANDSCAPE" (26.6 s).
// |H(s)| over the s-plane is drawn on a canvas from the time alone (hf-seek protocol): the 3D surface of a configuration of poles
// and zeros that slides, splits and fades in continuously, a keyframed orbit camera, probes that walk into a pole (|H| -> infinity)
// and into a zero (|H| -> 0), the pole-zero map, h(t) and |H(jw)|. Text, counters and cards are GSAP.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, PS, PR, MAP, RP, PD } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished landscape
    [1.6, "snap"], // the landscape sinks back to the floor
    [2.2, "click"], // a pole is a mountain
    [2.4, "snap"], // the first pole grows: 1/(s+1)
    [3.6, "click"], // get closer to the pole
    [3.8, "snap"], // d = 1
    [4.2, "click"], // d = 0.5
    [4.55, "click"], // d = 0.2
    [4.9, "click"], // d = 0.1
    [5.25, "click"], // d = 0.05
    [5.55, "click"], // d = 0.01
    [5.8, "snap"], // |H| -> infinity
    [6.4, "click"], // split it
    [6.6, "snap"], // complex pair
    [8.6, "click"], // slide the poles right
    [8.8, "snap"], // unstable
    [11.0, "click"], // back onto the jw axis
    [11.2, "snap"], // a pure sine
    [13.2, "click"], // add a pole and two zeros
    [13.4, "snap"], // the notch
    [15.2, "click"], // walk into a zero
    [15.4, "snap"], // d = 1
    [15.75, "click"], // d = 0.5
    [16.05, "click"], // d = 0.2
    [16.35, "click"], // d = 0.1
    [16.65, "click"], // d = 0.05
    [16.9, "click"], // d = 0.01
    [17.1, "snap"], // |H| -> 0
    [17.9, "click"], // cut along the jw axis
    [18.1, "snap"], // the slice
    [20.3, "thump"], // lock
    [21.3, "click"], // poles make peaks, zeros make holes
    [22.6, "snap"], // CTA reveal
    [25.0, "click"], // engagement pulse
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

  // ---------------------------------------------------------------- 0.0 - 2.2  the finished landscape, then it sinks back to the floor
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
  curCount = null;
  curForm = null;

  /** one stage: the banner, the counter H(s) and the formula h(t) of function k; the landscape itself moves in the canvas */
  function stage(k) {
    const st = T.st[k],
      sw = T.sw[k];
    hit(st, "click", "#bn" + (k + 1));
    bnSwap("#bn" + (k + 1), st);
    hit(sw, "snap", "#c" + (k + 1));
    cswap("#c" + (k + 1), sw, true);
    fswap("#f" + (k + 1), sw + 0.3);
    ft("#sw", { opacity: 0 }, { opacity: 0.3, duration: 0.25, ease: "power2.out" }, sw);
    tl.fromTo(
      "#sw",
      { opacity: 0.3 },
      { opacity: 0, duration: 0.8, ease: "power2.inOut", immediateRender: false },
      sw + 0.25,
    );
  }
  stage(0);

  // ---------------------------------------------------------------- the probe walks into the pole: d = 1 ... 0.01, then infinity
  const PA = T.probeA;
  hit(PA.ban, "click", "#bnP1");
  bnSwap("#bnP1", PA.ban);
  PA.t.forEach((t0, i) => {
    hit(t0, i === 0 ? "snap" : "click", "#hpa" + i);
    cswap("#hpa" + i, t0, i === 0);
  });
  hit(PA.inf, "snap", "#hpainf");
  cswap("#hpainf", PA.inf, true);
  ft(
    "#inf",
    { opacity: 0, scale: 0.6 },
    { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
    PA.inf,
  );
  fade("#inf", 6.2, 0.3);

  stage(1);
  stage(2);
  stage(3);
  stage(4);

  // ---------------------------------------------------------------- the probe walks into a zero: |H| sinks to 0
  const PZ = T.probeZ;
  hit(PZ.ban, "click", "#bnP2");
  bnSwap("#bnP2", PZ.ban);
  PZ.t.forEach((t0, i) => {
    hit(t0, i === 0 ? "snap" : "click", "#hpz" + i);
    cswap("#hpz" + i, t0, i === 0);
  });
  hit(PZ.zero, "snap", "#hpzero");
  cswap("#hpzero", PZ.zero, true);

  // ---------------------------------------------------------------- the camera swings round: the cut along the jw axis, the frequency response
  hit(T.cutBan, "click", "#bn6");
  bnSwap("#bn6", T.cutBan);
  hit(T.cut, "snap", "#c6");
  cswap("#c6", T.cut, true);
  fswap("#f6", T.cut + 0.3);
  fade("#lt", T.cut, 0.2);
  pop("#lw", T.cut + 0.1, 6);

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

  tl.to({}, { duration: 0.0001 }, 26.5999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t || a.kind.localeCompare(b.kind));

  // ================================================================ canvas
  const cvs = document.getElementById("cv");
  const ctx = cvs.getContext("2d");
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = Math.round(1080 * DPR);
  cvs.height = Math.round(1920 * DPR);

  const ROSE = "#E11D48",
    SBLUE = "#3B82F6",
    VIOLET = "#8B5CF6",
    CYAN = "#06B6D4",
    SLATE = "#94A3B8",
    WHITE = "#FFFFFF";
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);

  // ---------------------------------------------------------------- smooth keyframes: monotone cubic (no overshoot, zero velocity at holds)
  function monoEval(keys, t) {
    const n = keys.length,
      m = keys[0].length - 1;
    if (t <= keys[0][0]) return keys[0].slice(1);
    if (t >= keys[n - 1][0]) return keys[n - 1].slice(1);
    let i = 0;
    while (keys[i + 1][0] <= t) i++;
    const t0 = keys[i][0],
      t1 = keys[i + 1][0],
      dt = t1 - t0,
      u = (t - t0) / dt;
    const h00 = (1 + 2 * u) * (1 - u) * (1 - u),
      h10 = u * (1 - u) * (1 - u),
      h01 = u * u * (3 - 2 * u),
      h11 = u * u * (u - 1);
    const out = [];
    for (let c = 1; c <= m; c++) {
      const sl = (a, b) => (keys[b][c] - keys[a][c]) / (keys[b][0] - keys[a][0]);
      const tang = (k) => {
        if (k === 0 || k === n - 1) return 0;
        const s0 = sl(k - 1, k),
          s1 = sl(k, k + 1);
        return s0 * s1 <= 0 ? 0 : (2 * s0 * s1) / (s0 + s1);
      };
      out.push(
        h00 * keys[i][c] + h10 * dt * tang(i) + h01 * keys[i + 1][c] + h11 * dt * tang(i + 1),
      );
    }
    return out;
  }

  // ---------------------------------------------------------------- the configuration of poles and zeros through time
  // [t, p1 (re, im, w), p2, p3, z1, z2]: weight w grows a pole or zero out of the floor
  const FLAT = [-1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0];
  const SA = [-1, 0, 1, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0];
  const SB = [-1, 2, 1, -1, -2, 1, -1, 0, 0, 0, 1, 0, 0, -1, 0];
  const SC = [1, 2, 1, 1, -2, 1, -1, 0, 0, 0, 1, 0, 0, -1, 0];
  const SD = [0, 2, 1, 0, -2, 1, -1, 0, 0, 0, 1, 0, 0, -1, 0];
  const SE = [-1, 2, 1, -1, -2, 1, -1, 0, 1, 0, 1, 1, 0, -1, 1];
  const CFGK = [
    [0, ...SE],
    [1.6, ...SE],
    [2.3, ...FLAT],
    [T.sw[0], ...FLAT],
    [T.hs[0] - 0.1, ...SA],
    [T.sw[1], ...SA],
    [T.hs[1] - 0.1, ...SB],
    [T.sw[2], ...SB],
    [T.hs[2] - 0.1, ...SC],
    [T.sw[3], ...SC],
    [T.hs[3] - 0.1, ...SD],
    [T.sw[4], ...SD],
    [T.hs[4] - 0.1, ...SE],
    [40, ...SE],
  ];
  function cfgAt(t) {
    const v = monoEval(CFGK, t);
    const slot = (k) => [v[3 * k], v[3 * k + 1], Math.max(0, Math.min(1, v[3 * k + 2]))];
    return { poles: [slot(0), slot(1), slot(2)], zeros: [slot(3), slot(4)] };
  }

  // ---------------------------------------------------------------- the camera: [t, yaw deg, pitch deg, scale, target x, target z, floor-centre y]
  const POLE_X = -1 / LAP.EXT,
    ZERO_Z = -1 / LAP.EXT;
  const CAMK = [
    [0.0, 62, 20, 255, 0, 0, 800],
    [1.6, 40, 28, 275, 0, 0, 790],
    [2.4, 40, 30, 270, 0, 0, 790],
    [T.hs[0], 30, 26, 290, POLE_X, 0, 800],
    [3.8, 22, 20, 320, POLE_X, 0, 815],
    [5.8, 13, 13, 335, POLE_X, 0, 845],
    [6.4, 13, 13, 335, POLE_X, 0, 845],
    [T.hs[1], 40, 28, 275, 0, 0, 790],
    [T.sw[2], 52, 24, 285, 0, 0, 790],
    [T.hs[2], 72, 22, 290, 0, 0, 790],
    [T.sw[3], 66, 24, 285, 0, 0, 790],
    [T.hs[3], 44, 30, 285, 0, 0, 790],
    [T.sw[4], 36, 34, 285, 0, 0, 790],
    [T.hs[4], 28, 28, 285, 0, 0, 790],
    [15.4, 24, 24, 300, 0, ZERO_Z, 795],
    [17.1, 17, 15, 340, 0, ZERO_Z, 835],
    [17.9, 17, 15, 340, 0, ZERO_Z, 835],
    [19.4, -88, 9, 300, 0, 0, 800],
    [20.3, -88, 9, 300, 0, 0, 800],
    [22.5, -60, 22, 285, 0, 0, 790],
    [26.6, -25, 28, 275, 0, 0, 790],
  ];
  const HM = 0.5,
    CXS = 540;
  const cam = { ct: 1, st: 0, cp: 1, sp: 0, S: 275, tx: 0, tz: 0, cy: 790 };
  function setCam(t) {
    const k = monoEval(CAMK, t);
    const yaw = (k[0] * Math.PI) / 180,
      pit = (k[1] * Math.PI) / 180;
    cam.ct = Math.cos(yaw);
    cam.st = Math.sin(yaw);
    cam.cp = Math.cos(pit);
    cam.sp = Math.sin(pit);
    cam.S = k[2];
    cam.tx = k[3];
    cam.tz = k[4];
    cam.cy = k[5];
  }
  /** screen position of the s-plane point (sigma, omega) lifted to the surface height hh (0 = on the floor) */
  const P3 = (sig, om, hh) => {
    const x = sig / LAP.EXT - cam.tx,
      z = -om / LAP.EXT - cam.tz;
    const xp = x * cam.ct + z * cam.st,
      zp = -x * cam.st + z * cam.ct;
    return [CXS + cam.S * xp, cam.cy - cam.S * (hh * HM * cam.cp - zp * cam.sp)];
  };

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
  function cross(x, y, r, color, alpha, width) {
    if (alpha <= 0.001 || r <= 0) return;
    line(
      [
        [x - r, y - r],
        [x + r, y + r],
      ],
      color,
      width,
      alpha,
      10,
    );
    line(
      [
        [x - r, y + r],
        [x + r, y - r],
      ],
      color,
      width,
      alpha,
      10,
    );
  }
  function ring(x, y, r, color, alpha, width) {
    if (alpha <= 0.001 || r <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- the landscape
  const { N, EXT, NV, HA, SYS, ORDER, LUT } = LAP;
  const N1 = N + 1;
  const PX = new Float32Array(NV),
    PY = new Float32Array(NV);
  const STY = [];
  const quadStyle = (ci, fi) => {
    const key = ci * 16 + fi;
    let s = STY[key];
    if (!s) {
      const f = 0.6 + 0.4 * (fi / 15),
        c = LUT[ci];
      s = STY[key] = `rgb(${(c[0] * f) | 0},${(c[1] * f) | 0},${(c[2] * f) | 0})`;
    }
    return s;
  };
  function floorGrid() {
    const c = [P3(-EXT, -EXT, 0), P3(EXT, -EXT, 0), P3(EXT, EXT, 0), P3(-EXT, EXT, 0)];
    ctx.save();
    ctx.fillStyle = "rgba(15,23,42,.9)";
    poly(c);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (let v = -3; v <= 3; v++) {
      const ax = v === 0;
      line([P3(v, -EXT, 0), P3(v, EXT, 0)], SLATE, ax ? 2.4 : 1.2, ax ? 0.6 : 0.16);
      line([P3(-EXT, v, 0), P3(EXT, v, 0)], SLATE, ax ? 2.4 : 1.2, ax ? 0.6 : 0.16);
    }
    line([...c, c[0]], SLATE, 2, 0.45);
  }
  /** the surface, painted far to near for the current camera (nested loops run from the far corner to the near one) */
  function drawSurface(sf, alpha) {
    if (alpha <= 0.001) return;
    const { gx, gy, hgt, col, shade } = sf;
    const S = cam.S;
    for (let i = 0; i <= N; i++) {
      const z = -gy[i] / EXT - cam.tz;
      for (let j = 0; j <= N; j++) {
        const x = gx[j] / EXT - cam.tx,
          v = i * N1 + j;
        const xp = x * cam.ct + z * cam.st,
          zp = -x * cam.st + z * cam.ct;
        PX[v] = CXS + S * xp;
        PY[v] = cam.cy - S * (hgt[v] * HM * cam.cp - zp * cam.sp);
      }
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.8;
    ctx.lineJoin = "round";
    const iFar = cam.ct > 0 ? -1 : 1,
      jFar = cam.st > 0 ? -1 : 1; // direction of travel: far to near
    const i0 = iFar < 0 ? N - 1 : 0,
      j0 = jFar < 0 ? N - 1 : 0;
    for (let a = 0, i = i0; a < N; a++, i += iFar)
      for (let b = 0, j = j0; b < N; b++, j += jFar) {
        const v0 = i * N1 + j,
          v1 = v0 + 1,
          v2 = v0 + N1 + 1,
          v3 = v0 + N1;
        const ci = Math.max(
          0,
          Math.min(255, Math.round(((col[v0] + col[v1] + col[v2] + col[v3]) / 4) * 255)),
        );
        const fi = Math.max(
          0,
          Math.min(15, Math.round(((shade[v0] + shade[v1] + shade[v2] + shade[v3]) / 4) * 15)),
        );
        const st = quadStyle(ci, fi);
        ctx.fillStyle = st;
        ctx.strokeStyle = st;
        ctx.beginPath();
        ctx.moveTo(PX[v0], PY[v0]);
        ctx.lineTo(PX[v1], PY[v1]);
        ctx.lineTo(PX[v2], PY[v2]);
        ctx.lineTo(PX[v3], PY[v3]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    ctx.restore();
  }
  /** poles (rose x with a stem up to the peak) and zeros (blue o) standing on the floor of the landscape */
  function drawMarks3D(cfg) {
    for (const p of cfg.poles) {
      const a = smooth(p[2] / 0.6);
      if (a <= 0.001) continue;
      const f = P3(p[0], p[1], 0),
        tp = P3(p[0], p[1], HA * p[2]);
      line([f, tp], ROSE, 3, 0.85 * a, 8, [6, 6]);
      cross(f[0], f[1], 9 * (0.6 + 0.4 * a), ROSE, a, 4);
      dot(tp[0], tp[1], 6 * (0.6 + 0.4 * a), WHITE, a, 16);
    }
    for (const z of cfg.zeros) {
      const a = smooth(z[2] / 0.6);
      if (a <= 0.001) continue;
      const f = P3(z[0], z[1], 0);
      ring(f[0], f[1], 10 * (0.6 + 0.4 * a), SBLUE, a, 4);
    }
  }
  function ripple(u) {
    // a ring runs over the floor from the origin when the landscape starts to move
    if (u < 0 || u > 0.9) return;
    const v = u / 0.9,
      r = EXT * 1.5 * easeOut(v);
    const pts = [];
    for (let a = 0; a <= 64; a++) {
      const ph = (a / 64) * 2 * Math.PI;
      pts.push(P3(r * Math.cos(ph), r * Math.sin(ph), 0));
    }
    line(pts, CYAN, 4, 0.8 * (1 - v), 12);
  }
  function legend() {
    cross(815, 392, 9, ROSE, 1, 4);
    ring(815, 436, 10, SBLUE, 1, 4);
  }

  // ---------------------------------------------------------------- the probes: a point that walks over the landscape into a pole and into a zero
  const LN = Math.log;
  const KA = [
    [T.hs[0] - 0.1, LN(1.5)],
    [T.probeA.t[0], LN(PD[0])],
    ...T.probeA.t.slice(1).map((t0, i) => [t0, LN(PD[i + 1])]),
    [T.probeA.inf, LN(0.002)],
    [6.5, LN(0.002)],
  ];
  const KZ = [
    [T.hs[4], LN(1.4)],
    [T.probeZ.t[0], LN(PD[0])],
    ...T.probeZ.t.slice(1).map((t0, i) => [t0, LN(PD[i + 1])]),
    [T.probeZ.zero, LN(0.002)],
    [17.8, LN(0.002)],
  ];
  function drawProbes(t, cfg, sf) {
    // into the pole of 1/(s+1), along the real axis: |H| = 1/d
    const aA = smooth((t - 3.5) / 0.3) * (1 - smooth((t - 6.1) / 0.3));
    if (aA > 0.001) {
      const d = Math.exp(monoEval(KA, t)[0]),
        sg = -1 + d;
      const m = LAP.magC(cfg, sg, 0),
        hh = LAP.heightOf(sf, m);
      const fl = P3(sg, 0, 0),
        pl = P3(-1, 0, 0);
      line([fl, pl], WHITE, 3, 0.9 * aA, 8, [8, 6]);
      const q = P3(sg, 0, hh);
      line([q, fl], WHITE, 1.5, 0.35 * aA);
      dot(q[0], q[1], 9, WHITE, aA, 22);
      ring(q[0], q[1], 17, ROSE, aA, 3);
      // the pole flies to infinity: the peak goes on through the top of the panel
      const b = easeOut((t - (T.probeA.inf - 0.3)) / 0.5);
      if (b > 0.001) {
        const tp = P3(-1, 0, HA);
        const top = PS[1] + 6;
        const y1 = tp[1] - b * (tp[1] - top);
        const al = aA;
        line(
          [
            [tp[0], tp[1]],
            [tp[0], y1],
          ],
          ROSE,
          7,
          al,
          18,
        );
        line(
          [
            [tp[0], tp[1]],
            [tp[0], y1],
          ],
          WHITE,
          2.5,
          al * 0.9,
        );
        if (b > 0.85) {
          ctx.save();
          ctx.globalAlpha = al;
          ctx.fillStyle = WHITE;
          ctx.shadowColor = ROSE;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.moveTo(tp[0], y1 - 16);
          ctx.lineTo(tp[0] - 12, y1 + 8);
          ctx.lineTo(tp[0] + 12, y1 + 8);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }
    }
    // into the zero at j of the last function, along the line w = 1: |H| falls to 0
    const aZ = smooth((t - 15.0) / 0.3) * (1 - smooth((t - 17.6) / 0.3));
    if (aZ > 0.001) {
      const d = Math.exp(monoEval(KZ, t)[0]);
      const m = LAP.magC(cfg, d, 1),
        hh = LAP.heightOf(sf, m);
      const fl = P3(d, 1, 0),
        zl = P3(0, 1, 0);
      line([fl, zl], WHITE, 3, 0.9 * aZ, 8, [8, 6]);
      const q = P3(d, 1, hh);
      line([q, fl], WHITE, 1.5, 0.35 * aZ);
      dot(q[0], q[1], 9, WHITE, aZ, 22);
      ring(q[0], q[1], 17, SBLUE, aZ, 3);
      const u = (t - T.probeZ.zero) / 0.7;
      if (u > 0 && u < 1) ring(zl[0], zl[1], 12 + 50 * easeOut(u), SBLUE, 1 - u, 4);
    }
  }

  // ---------------------------------------------------------------- the jw cut on the landscape
  function drawCut(sf, cfg, t) {
    const p = clamp01((t - T.cut) / 1.8);
    let jc = 0;
    for (let k = 0; k < sf.gx.length; k++) if (Math.abs(sf.gx[k]) < 1e-9) jc = k;
    const top = [],
      bot = [];
    const n = Math.round(N * p);
    for (let i = 0; i <= n; i++) {
      top.push(P3(0, sf.gy[i], sf.hgt[i * N1 + jc] + 0.02));
      bot.push(P3(0, sf.gy[i], 0));
    }
    if (top.length > 1) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = CYAN;
      poly([...top, ...bot.slice().reverse()]);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      line(top, CYAN, 5, 1, 14);
    }
    // the travelling point: once along the cut, then round and round
    const q = cutPos(t);
    if (q !== null) {
      const hh = LAP.heightOf(sf, LAP.magC(cfg, 0, q));
      const e = P3(0, q, hh + 0.02);
      dot(e[0], e[1], 8, WHITE, 1, 20);
    }
  }
  function cutPos(t) {
    if (t < T.cut) return null;
    const p = (t - T.cut) / 1.8;
    if (p <= 1) return -EXT + 2 * EXT * smooth(p);
    const ph = ((((t - T.cut - 1.8) / 2.6) % 1) + 1) % 1;
    return -EXT + 2 * EXT * smooth(ph);
  }

  // ---------------------------------------------------------------- the pole-zero map (bottom left)
  const mp = (sig, om) => [MAP.cx + (sig / EXT) * MAP.half, MAP.cy - (om / EXT) * MAP.half];
  function drawMap(cfg, t) {
    const c = [mp(-EXT, -EXT), mp(EXT, -EXT), mp(EXT, EXT), mp(-EXT, EXT)];
    let rhp = 0;
    for (const p of cfg.poles) rhp = Math.max(rhp, p[2] * smooth(p[0] / 0.6));
    if (rhp > 0.001) {
      ctx.save();
      ctx.globalAlpha = 0.22 * rhp;
      ctx.fillStyle = ROSE;
      ctx.fillRect(mp(0, EXT)[0], mp(0, EXT)[1], MAP.half, 2 * MAP.half);
      ctx.restore();
    }
    for (let v = -3; v <= 3; v++) {
      const ax = v === 0;
      line([mp(v, -EXT), mp(v, EXT)], SLATE, ax ? 2 : 1, ax ? 0.6 : 0.14);
      line([mp(-EXT, v), mp(EXT, v)], SLATE, ax ? 2 : 1, ax ? 0.6 : 0.14);
    }
    line([...c, c[0]], SLATE, 1.6, 0.4);
    const jwp = clamp01((t - T.cut) / 1.8);
    if (t >= T.cut) line([mp(0, -EXT), mp(0, -EXT + 2 * EXT * jwp)], CYAN, 4, 0.95, 10);
    for (const p of cfg.poles) {
      const a = smooth(p[2] / 0.6);
      const q = mp(p[0], p[1]);
      cross(q[0], q[1], 8 * (0.6 + 0.4 * a), ROSE, a, 3.5);
    }
    for (const z of cfg.zeros) {
      const a = smooth(z[2] / 0.6);
      const q = mp(z[0], z[1]);
      ring(q[0], q[1], 8 * (0.6 + 0.4 * a), SBLUE, a, 3.5);
    }
  }

  // ---------------------------------------------------------------- h(t) and |H(jw)| (bottom right)
  const TMAX = 6;
  const hScale = {};
  for (const k of ORDER) {
    let m = 0;
    for (let i = 0; i <= 300; i++) m = Math.max(m, Math.abs(LAP.h(SYS[k], (i / 300) * TMAX)));
    hScale[k] = RP.amp / m;
  }
  let fScale = 0;
  for (let i = 0; i <= 400; i++)
    fScale = Math.max(fScale, LAP.mag(SYS.E, 0, -EXT + (2 * EXT * i) / 400));
  fScale = RP.amp / fScale;
  const rx = (u) => RP.x0 + u * (RP.x1 - RP.x0);
  function rightAxes(alpha, ticks) {
    line(
      [
        [RP.x0, RP.y0],
        [RP.x1, RP.y0],
      ],
      WHITE,
      2,
      0.4 * alpha,
    );
    if (ticks === "t")
      for (let v = 1; v <= TMAX; v++)
        line(
          [
            [rx(v / TMAX), RP.y0 - 6],
            [rx(v / TMAX), RP.y0 + 6],
          ],
          WHITE,
          1.5,
          0.35 * alpha,
        );
    else
      for (let v = -3; v <= 3; v++)
        line(
          [
            [rx((v + EXT) / (2 * EXT)), RP.y0 - 6],
            [rx((v + EXT) / (2 * EXT)), RP.y0 + 6],
          ],
          WHITE,
          1.5,
          v === 0 ? 0.5 * alpha : 0.3 * alpha,
        );
  }
  function drawH(key, p, alpha) {
    if (alpha <= 0.001) return;
    const pts = [];
    const n = Math.round(300 * clamp01(p));
    for (let i = 0; i <= n; i++) {
      const t = (i / 300) * TMAX;
      pts.push([rx(t / TMAX), RP.y0 - LAP.h(SYS[key], t) * hScale[key]]);
    }
    withClip(PR, () => {
      line(pts, VIOLET, 5, alpha, 12);
      if (pts.length > 1 && p < 1)
        dot(pts[pts.length - 1][0], pts[pts.length - 1][1], 6, WHITE, alpha, 14);
    });
  }
  const freqAt = (om) => LAP.mag(SYS.E, 0, om);
  function drawFreq(t) {
    const p = clamp01((t - T.cut) / 1.8);
    rightAxes(1, "w");
    const pts = [];
    const n = Math.round(400 * p);
    for (let i = 0; i <= n; i++) {
      const om = -EXT + (2 * EXT * i) / 400;
      pts.push([rx((om + EXT) / (2 * EXT)), RP.y0 - freqAt(om) * fScale]);
    }
    withClip(PR, () => {
      line(pts, SBLUE, 5, 1, 12);
      for (const om of [-1, 1])
        if (p * 2 * EXT - EXT >= om) ring(rx((om + EXT) / (2 * EXT)), RP.y0, 8, SBLUE, 1, 3.5);
      const q = cutPos(t);
      if (q !== null) dot(rx((q + EXT) / (2 * EXT)), RP.y0 - freqAt(q) * fScale, 8, WHITE, 1, 18);
    });
  }
  function drawRight(t) {
    if (t >= T.cut) return drawFreq(t);
    rightAxes(1, "t");
    let k = -1;
    for (let i = 0; i < T.sw.length; i++) if (t >= T.sw[i]) k = i;
    if (k < 0) {
      drawH("E", 1, t < 1.6 ? 1 : 1 - smooth((t - 1.6) / 0.4));
      return;
    }
    if (k === 0) drawH("E", 1, 1 - smooth((t - 1.6) / 0.4));
    else drawH(ORDER[k - 1], 1, 1 - smooth((t - T.sw[k]) / 0.3));
    if (t >= T.hs[k]) drawH(ORDER[k], (t - T.hs[k]) / 1.0, 1);
  }

  // ---------------------------------------------------------------- the labels that follow the camera (DOM, moved by transform)
  const tracked = [
    ["ax1", () => P3(EXT * 1.2, 0, 0), 6, 6],
    ["ax2", () => P3(0, EXT * 1.2, 0), -28, -4],
    ["inf", () => [P3(-1, 0, HA)[0], PS[1] + 40], 0, 0],
  ].map(([id, f, dx, dy]) => [document.getElementById(id), f, dx, dy]);
  function trackLabels() {
    for (const [el, f, dx, dy] of tracked) {
      if (!el) continue;
      const q = f();
      const x = q[0] + dx,
        y = q[1] + dy;
      const inside =
        x > PS[0] + 20 && x < PS[0] + PS[2] - 20 && y > PS[1] + 20 && y < PS[1] + PS[3] - 20;
      el.style.transform = `translate(${(x - 540).toFixed(1)}px,${(y - 790).toFixed(1)}px)`;
      el.style.visibility = inside ? "visible" : "hidden";
    }
  }

  function drawLock(t) {
    const u = t - T.lock;
    if (u < 0 || u > 1.3) return;
    const cx = 540,
      cy = 790;
    if (u < 0.5) {
      const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 700);
      g.addColorStop(0, "rgba(37,99,235," + (0.3 * (1 - u / 0.5)).toFixed(3) + ")");
      g.addColorStop(1, "rgba(37,99,235,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1920);
    }
    if (u < 0.6) {
      const x = 90 + 900 * easeOut(u / 0.55);
      ctx.save();
      ctx.globalAlpha = 1 - smooth((u - 0.45) / 0.15);
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.moveTo(x, 340);
      ctx.lineTo(x, 1230);
      ctx.strokeStyle = CYAN;
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
      [CYAN, 660, 0, 0.7],
      [ROSE, 520, 0.1, 0.6],
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
      ctx.fillStyle = i % 3 === 0 ? ROSE : i % 3 === 1 ? CYAN : "#fff";
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
    setCam(t);
    const cfg = cfgAt(t);
    const sf = LAP.surfaceFor(cfg);
    const wmax = Math.max(...cfg.poles.map((p) => p[2]), ...cfg.zeros.map((z) => z[2]));
    withClip(PS, () => {
      floorGrid();
      drawSurface(sf, smooth(wmax / 0.12));
      drawMarks3D(cfg);
      for (const sw of T.sw) ripple(t - sw);
      drawProbes(t, cfg, sf);
      if (t >= T.cut) drawCut(sf, cfg, t);
    });
    legend();
    drawMap(cfg, t);
    drawRight(t);
    trackLabels();
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
