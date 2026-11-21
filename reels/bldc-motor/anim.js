// Timeline for "THE BRUSHLESS DC MOTOR" (28.6 s): a real-time 3D scene drawn on a canvas from the time alone (hf-seek protocol).
// A brushed motor (commutator, carbon brushes, sparks) is replaced by a brushless one that assembles part by part: laminated stator with
// three phases of coils, a magnet rotor, Hall sensors. The stator field turns smoothly through the six commutation steps; the speed follows
// the duty cycle. Text, counters and cards are GSAP. Everything is a pure function of timeline time: no callbacks, no clocks, no randomness.
(function () {
  const CFG = window.__CFG;
  const { T, PAT, PB1, PB2, PLOT, BR, VIEW } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind
    [2.2, "click"], // a brushed motor
    [2.4, "snap"], // sparks, wear, noise
    [5.2, "click"], // swap the roles
    [5.4, "snap"], // no sliding contact
    [8.6, "click"], // electronics replace the brushes
    [8.8, "snap"], // six steps of 60 degrees
    [12.0, "click"], // three Hall sensors
    [12.2, "snap"], // 3 bits = 6 steps
    [15.4, "click"], // more duty, more speed
    [15.6, "snap"], // D = 0.4
    [17.2, "snap"], // D = 0.7
    [19.4, "snap"], // D = 1
    [22.2, "thump"], // lock
    [23.2, "click"], // a magnet, three coils, six switches
    [24.6, "snap"], // CTA reveal
    [27.0, "click"], // engagement pulse
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
  const fade = (sel, at, d) =>
    ft(sel, { opacity: 1 }, { opacity: 0, duration: d || 0.25, ease: "power1.in" }, at);

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
  bannerAt(1);
  beat(2, T.sw[1]);
  bannerAt(2);
  beat(3, T.sw[2]);
  bannerAt(3);
  beat(4, T.sw[3]);
  bannerAt(4);
  beat(5, T.sw[4]);
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

  tl.to({}, { duration: 0.0001 }, 28.5999);
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
  const PHRGB = [
    [255, 0, 68],
    [0, 136, 255],
    [176, 38, 255],
  ];
  const DEG = Math.PI / 180;
  let gA = 1; // a multiplier on the alpha of everything drawn by the 2D helpers
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
  const box = (t, a, b, fi, fo) => smooth((t - a) / fi) * (1 - smooth((t - b) / fo));

  function poly2(pts) {
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
    poly2(pts);
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
    ctx.globalAlpha = a * gA;
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
    ctx.globalAlpha = alpha * gA;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
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
  function panel(x, y, w, h, a) {
    if (a <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 28);
    ctx.fillStyle = "rgba(30,30,46,.55)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.10)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- the rotor angle: the integral of a speed that follows the duty cycle
  const DT = 0.001,
    NT = Math.ceil(28.6 / DT) + 5;
  const THETA = new Float64Array(NT);
  {
    let acc = 100 * DEG;
    for (let i = 0; i < NT; i++) {
      THETA[i] = acc;
      const tt = i * DT,
        mul = 1 + 1.6 * smooth((tt - T.sw[0]) / 0.4) * (1 - smooth((tt - (T.st[1] - 0.2)) / 0.4));
      acc += BLDC.omegaVis(BLDC.Dat(tt)) * mul * DT;
    }
  }
  const thetaDeg = (t) => {
    const f = Math.max(0, t) / DT,
      i = Math.min(NT - 2, Math.floor(f)),
      u = f - i;
    return ((THETA[i] + (THETA[i + 1] - THETA[i]) * u) / DEG) % 360;
  };
  const hookA = (t) => (t < T.rewind0 ? 1 : 1 - smooth((t - T.rewind0) / 0.5));
  const norm180 = (d) => (((d % 360) + 540) % 360) - 180;

  // commutation, smoothed: a real commutation takes a short, finite time
  const BW = 10;
  function blendCur(th) {
    const x = (((th - 30) % 360) + 360) % 360,
      k = Math.floor(x / 60),
      s = x - 60 * k;
    const cur = BLDC.currents(30 + 60 * k + 0.01, 1),
      prev = BLDC.currents(30 + 60 * (k - 1) + 0.01, 1);
    const w = s < BW ? smooth(s / BW) : 1;
    return { i: cur.map((v, n) => prev[n] * (1 - w) + v * w), w, k };
  }
  const HC = [120, 240, 0];
  const hallSoft = (th, n) => 1 - smooth((Math.abs(norm180(th - HC[n])) - 87) / 6);

  // multi-column monotone cubic keyframes (the camera)
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

  // ================================================================ the 3D engine: a camera, polygons, a light, painter's order
  const cam = {
    yaw: 0,
    pitch: 0,
    dist: 8,
    tx: 0,
    ty: 0,
    tz: 0.4,
    cx: VIEW.cx,
    cy: VIEW.cy,
    F: VIEW.F,
  };
  // [t, yaw, pitch, camera distance, target z]
  const CAMK = [
    [0.0, 38, 20, 9.2, 0.4],
    [T.rewind0, 30, 18, 9.2, 0.4],
    [2.4, 20, 14, 7.0, 0.8],
    [5.2, 56, 18, 7.2, 0.8],
    [5.4, -30, 22, 10.2, 0.3],
    [7.6, -12, 22, 9.4, 0.3],
    [8.8, 18, 18, 8.6, 0.4],
    [12.0, -20, 30, 7.8, 0.5],
    [15.4, 34, 16, 8.8, 0.4],
    [19.4, 56, 14, 10.2, 0.4],
    [21.4, 26, 18, 8.6, 0.4],
    [28.6, -22, 20, 9.2, 0.4],
  ];
  function setCam(t, cy) {
    const k = monoEval(CAMK, t);
    cam.yaw = k[0] * DEG;
    cam.pitch = k[1] * DEG;
    cam.dist = k[2];
    cam.tz = k[3];
    cam.cy = cy;
  }
  function toView(p) {
    const x = p[0] - cam.tx,
      y = p[1] - cam.ty,
      z = p[2] - cam.tz;
    const cyw = Math.cos(cam.yaw),
      syw = Math.sin(cam.yaw),
      cp = Math.cos(cam.pitch),
      sp = Math.sin(cam.pitch);
    const x1 = x * cyw + z * syw,
      z1 = -x * syw + z * cyw;
    return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
  }
  function rotN(n) {
    const cyw = Math.cos(cam.yaw),
      syw = Math.sin(cam.yaw),
      cp = Math.cos(cam.pitch),
      sp = Math.sin(cam.pitch);
    const x1 = n[0] * cyw + n[2] * syw,
      z1 = -n[0] * syw + n[2] * cyw;
    return [x1, n[1] * cp - z1 * sp, n[1] * sp + z1 * cp];
  }
  const proj = (v) => {
    const s = cam.F / (cam.dist - v[2]);
    return [cam.cx + v[0] * s, cam.cy - v[1] * s];
  };
  const screenOf = (p) => proj(toView(p));
  const LIGHT = (() => {
    const l = [-0.38, 0.62, 0.7],
      n = Math.hypot(l[0], l[1], l[2]);
    return [l[0] / n, l[1] / n, l[2] / n];
  })();
  const HALF = (() => {
    const h = [LIGHT[0], LIGHT[1], LIGHT[2] + 1],
      n = Math.hypot(h[0], h[1], h[2]);
    return [h[0] / n, h[1] / n, h[2] / n];
  })();

  // ---- model building: polygons in a part's local coordinates (z is the motor axis, +z towards the viewer)
  const mkPart = () => ({ polys: [], rot: 0, off: [0, 0, 0], alpha: 1, sc: 1 });
  const addPoly = (part, v, n, c, sp, tag) =>
    part.polys.push({ v, n, c, sp: sp || 0, em: 0, emc: null, tag: tag === undefined ? -1 : tag });
  const pol = (r, a, z) => [r * Math.cos(a * DEG), r * Math.sin(a * DEG), z];
  function sideSurf(part, r, z0, z1, a0, a1, da, col, sp, inward, tag) {
    for (let a = a0; a < a1 - 1e-9; a += da) {
      const b = Math.min(a + da, a1),
        m = ((a + b) / 2) * DEG,
        sg = inward ? -1 : 1;
      addPoly(
        part,
        [pol(r, a, z0), pol(r, b, z0), pol(r, b, z1), pol(r, a, z1)],
        [sg * Math.cos(m), sg * Math.sin(m), 0],
        typeof col === "function" ? col((a + b) / 2) : col,
        sp,
        tag,
      );
    }
  }
  function annulus(part, r0, r1, z, a0, a1, da, nz, col, sp, tag) {
    for (let a = a0; a < a1 - 1e-9; a += da) {
      const b = Math.min(a + da, a1);
      addPoly(
        part,
        [pol(r0, a, z), pol(r1, a, z), pol(r1, b, z), pol(r0, b, z)],
        [0, 0, nz],
        typeof col === "function" ? col((a + b) / 2) : col,
        sp,
        tag,
      );
    }
  }
  const scaleC = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
  function sectorBlock(part, r0, r1, a0, a1, z0, z1, col, o) {
    const strips = (o && o.strips) || 1,
      sp = (o && o.sp) || 0,
      tag = o && o.tag !== undefined ? o.tag : -1;
    const na = 4,
      da = (a1 - a0) / na;
    for (let s = 0; s < strips; s++) {
      const ra = r0 + ((r1 - r0) * s) / strips,
        rb = r0 + ((r1 - r0) * (s + 1)) / strips,
        c = scaleC(col, s % 2 ? 0.8 : 1);
      const v = [];
      for (let j = 0; j <= na; j++) v.push(pol(rb, a0 + da * j, z1));
      for (let j = na; j >= 0; j--) v.push(pol(ra, a0 + da * j, z1));
      addPoly(part, v, [0, 0, 1], c, sp, tag);
    }
    sideSurf(part, r1, z0, z1, a0, a1, da, col, sp, false, tag);
    sideSurf(part, r0, z0, z1, a0, a1, da, scaleC(col, 0.7), sp, true, tag);
    const sa = a0 * DEG,
      sb = a1 * DEG;
    addPoly(
      part,
      [pol(r0, a0, z0), pol(r1, a0, z0), pol(r1, a0, z1), pol(r0, a0, z1)],
      [Math.sin(sa), -Math.cos(sa), 0],
      scaleC(col, 0.85),
      sp,
      tag,
    );
    addPoly(
      part,
      [pol(r1, a1, z0), pol(r0, a1, z0), pol(r0, a1, z1), pol(r1, a1, z1)],
      [-Math.sin(sb), Math.cos(sb), 0],
      scaleC(col, 0.85),
      sp,
      tag,
    );
  }
  function boxPart(part, cx, cy, cz, hx, hy, hz, rotZ, col, sp, tag) {
    const cr = Math.cos(rotZ * DEG),
      sr = Math.sin(rotZ * DEG);
    const P = (x, y, z) => [cx + x * cr - y * sr, cy + x * sr + y * cr, cz + z];
    const N = (x, y, z) => [x * cr - y * sr, x * sr + y * cr, z];
    const f = (a, b, c, d, n) => addPoly(part, [a, b, c, d], n, col, sp, tag);
    f(P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), N(0, 0, 1));
    f(P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz), P(hx, -hy, -hz), N(0, 0, -1));
    f(P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), P(hx, -hy, hz), N(1, 0, 0));
    f(P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz), N(-1, 0, 0));
    f(P(-hx, hy, -hz), P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), N(0, 1, 0));
    f(P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), N(0, -1, 0));
  }

  const STEEL = [74, 78, 100],
    STEELD = [46, 48, 66],
    STEELL = [150, 154, 172],
    COPPER = [196, 104, 74],
    CARBON = [30, 30, 42];
  const TOOTH = [
    [0, 1],
    [2, -1],
    [1, 1],
    [0, -1],
    [2, 1],
    [1, -1],
  ]; // tooth at 60 k degrees: [phase, winding sense]

  // ---- the brushless motor: stator (yoke, teeth, three phases of coils), Hall boards, magnet rotor with its shaft
  const stator = mkPart(),
    rotor = mkPart(),
    hall = mkPart();
  for (let s = 0; s < 14; s++) {
    const z0 = -0.7 + (1.4 * s) / 14,
      z1 = -0.7 + (1.4 * (s + 1)) / 14;
    sideSurf(
      stator,
      1.95,
      z0,
      z1,
      0,
      360,
      5,
      (a) => scaleC(STEEL, (s % 2 ? 0.86 : 1) * (0.9 + 0.1 * Math.cos(a * DEG * 3))),
      0.3,
      false,
    );
  }
  sideSurf(stator, 2.12, -0.98, -0.7, 0, 360, 6, STEELD, 0.25, false);
  annulus(stator, 1.95, 2.12, -0.7, 0, 360, 6, 1, STEELD, 0.25);
  annulus(stator, 1.5, 1.95, 0.7, 0, 360, 5, 1, STEEL, 0.25);
  sideSurf(stator, 1.5, -0.7, 0.7, 0, 360, 6, STEELD, 0, true);
  for (let k = 0; k < 6; k++) {
    const a = 60 * k,
      n = TOOTH[k][0];
    sectorBlock(stator, 1.05, 1.5, a - 10, a + 10, -0.7, 0.7, STEEL, { sp: 0.2 });
    sectorBlock(stator, 1.05, 1.14, a - 17, a + 17, -0.7, 0.7, STEEL, { sp: 0.2 });
    sectorBlock(stator, 1.17, 1.47, a - 15.5, a + 15.5, -0.86, 0.86, scaleC(PHRGB[n], 0.55), {
      strips: 4,
      sp: 0.15,
      tag: k,
    });
  }
  // the rotor: a permanent magnet (north half red, south half blue) on a steel shaft; its local angle 0 is the north pole
  sideSurf(rotor, 0.95, -0.6, 0.6, -90, 90, 3, [235, 20, 70], 0.55, false);
  sideSurf(rotor, 0.95, -0.6, 0.6, 90, 270, 3, [20, 120, 235], 0.55, false);
  annulus(rotor, 0.3, 0.95, 0.6, -90, 90, 3, 1, [255, 60, 100], 0.45);
  annulus(rotor, 0.3, 0.95, 0.6, 90, 270, 3, 1, [40, 150, 255], 0.45);
  annulus(rotor, 0, 0.3, 0.64, 0, 360, 10, 1, STEELL, 0.8);
  sideSurf(rotor, 0.22, 0.6, 1.9, 0, 360, 15, STEELL, 0.85, false);
  sideSurf(rotor, 0.22, -1.4, -0.6, 0, 360, 15, STEELL, 0.85, false);
  annulus(rotor, 0, 0.22, 1.9, 0, 360, 15, 1, [215, 218, 232], 0.9);
  // three Hall boards on the front of the stator, between the teeth; each carries a sensor chip that lights up when it reads 1
  [30, 150, 270].forEach((a, i) => {
    const c = pol(1.32, a, 0),
      cr = Math.cos(a * DEG),
      sr = Math.sin(a * DEG);
    boxPart(hall, c[0], c[1], 0.74, 0.17, 0.12, 0.035, a, [26, 30, 50], 0.2);
    boxPart(
      hall,
      c[0] + cr * 0.02,
      c[1] + sr * 0.02,
      0.84,
      0.11,
      0.11,
      0.07,
      a,
      [200, 204, 222],
      0.3,
      10 + i,
    );
  });

  // ---- the brushed motor: magnets in a housing, an armature with copper windings, a commutator, two carbon brushes
  const bHouse = mkPart(),
    bRotor = mkPart(),
    bBrush = mkPart();
  sideSurf(bHouse, 1.75, -0.8, 0.8, 0, 360, 6, STEELD, 0.25, false);
  annulus(bHouse, 1.55, 1.75, 0.8, 0, 360, 6, 1, STEEL, 0.25);
  sectorBlock(bHouse, 1.1, 1.55, -48, 48, -0.7, 0.7, [235, 20, 70], { sp: 0.5 });
  sectorBlock(bHouse, 1.1, 1.55, 132, 228, -0.7, 0.7, [20, 120, 235], { sp: 0.5 });
  sideSurf(bRotor, 0.98, -0.6, 0.6, 0, 360, 6, STEELD, 0.3, false);
  for (let k = 0; k < 6; k++)
    annulus(bRotor, 0.44, 0.98, 0.6, 60 * k, 60 * k + 60, 6, 1, k % 2 ? STEEL : COPPER, 0.4);
  for (let k = 0; k < 6; k++) {
    sideSurf(bRotor, 0.42, 0.6, 1.15, 60 * k + 3, 60 * k + 57, 6, [214, 124, 90], 0.7, false);
    sideSurf(bRotor, 0.42, 0.6, 1.15, 60 * k + 57, 60 * k + 63, 3, [14, 14, 24], 0, false);
  }
  annulus(bRotor, 0, 0.42, 1.15, 0, 360, 10, 1, [24, 24, 38], 0.3);
  sideSurf(bRotor, 0.16, 1.15, 1.75, 0, 360, 15, STEELL, 0.85, false);
  sideSurf(bRotor, 0.16, -1.2, -0.6, 0, 360, 15, STEELL, 0.85, false);
  annulus(bRotor, 0, 0.16, 1.75, 0, 360, 15, 1, [215, 218, 232], 0.9);
  boxPart(bBrush, 0, 0.66, 0.88, 0.17, 0.26, 0.26, 0, CARBON, 0.1);
  boxPart(bBrush, 0, -0.66, 0.88, 0.17, 0.26, 0.26, 0, CARBON, 0.1);
  boxPart(bBrush, 0, 1.06, 0.88, 0.24, 0.14, 0.32, 0, STEELL, 0.5);
  boxPart(bBrush, 0, -1.06, 0.88, 0.24, 0.14, 0.32, 0, STEELL, 0.5);

  /** draw a list of parts: transform, cull the faces that look away, shade, sort far to near, fill */
  function drawParts(list) {
    const items = [];
    for (const part of list) {
      if (part.alpha <= 0.003) continue;
      const cr = Math.cos(part.rot * DEG),
        sr = Math.sin(part.rot * DEG),
        sc = part.sc;
      for (const pl of part.polys) {
        const vv = [];
        let mx = 0,
          my = 0,
          mz = 0;
        for (const v of pl.v) {
          const w = [
            (v[0] * cr - v[1] * sr) * sc + part.off[0],
            (v[0] * sr + v[1] * cr) * sc + part.off[1],
            v[2] * sc + part.off[2],
          ];
          const vw = toView(w);
          vv.push(vw);
          mx += vw[0];
          my += vw[1];
          mz += vw[2];
        }
        const nv = vv.length;
        mx /= nv;
        my /= nv;
        mz /= nv;
        const n = rotN([pl.n[0] * cr - pl.n[1] * sr, pl.n[0] * sr + pl.n[1] * cr, pl.n[2]]);
        const toCam = [-mx, -my, cam.dist - mz];
        if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] <= 0) continue;
        // light: ambient + diffuse + a specular highlight for the metals and the magnets
        const d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const k = 0.36 + 0.72 * d;
        let r = pl.c[0] * k,
          g = pl.c[1] * k,
          b = pl.c[2] * k;
        if (pl.sp > 0) {
          const s =
            Math.pow(Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]), 28) *
            pl.sp *
            255;
          r += s;
          g += s;
          b += s;
        }
        if (pl.em > 0.01) {
          r += pl.emc[0] * pl.em;
          g += pl.emc[1] * pl.em;
          b += pl.emc[2] * pl.em;
        }
        items.push({
          d: mz,
          pts: vv.map(proj),
          col: `rgb(${Math.min(255, r) | 0},${Math.min(255, g) | 0},${Math.min(255, b) | 0})`,
          a: part.alpha,
          glow: pl.em > 0.45 ? pl.emc : null,
        });
      }
    }
    items.sort((p, q) => p.d - q.d);
    ctx.lineJoin = "round";
    ctx.lineWidth = 0.9;
    for (const it of items) {
      ctx.globalAlpha = it.a;
      ctx.fillStyle = it.col;
      ctx.strokeStyle = it.col;
      if (it.glow) {
        ctx.shadowColor = `rgb(${it.glow[0]},${it.glow[1]},${it.glow[2]})`;
        ctx.shadowBlur = 16;
      }
      ctx.beginPath();
      ctx.moveTo(it.pts[0][0], it.pts[0][1]);
      for (let i = 1; i < it.pts.length; i++) ctx.lineTo(it.pts[i][0], it.pts[i][1]);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (it.glow) ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- the labels that follow the parts (DOM, moved by transform; opacity set here)
  const EL = {};
  [
    "l3brush",
    "l3comm",
    "l3stator",
    "l3rotor",
    "l3hall",
    "lNp",
    "lSp",
    "lLegCur",
    "lLegHall",
    "lLegEmf",
    "lrp",
    "lrn",
    "lla",
    "llb",
    "llc",
    "lKV1",
    "lKV2",
  ].forEach((id) => (EL[id] = document.getElementById(id)));
  const setOp = (id, v) => {
    if (EL[id]) EL[id].style.opacity = String(Math.max(0, Math.min(1, v)));
  };
  /** annotate a part: a dot on it, a leader line, the label at the end of the line */
  function annotate(id, anchor, off, a) {
    setOp(id, a);
    const p = screenOf(anchor),
      q = [p[0] + off[0], p[1] + off[1]];
    if (EL[id])
      EL[id].style.transform =
        `translate(${(q[0] - VIEW.cx).toFixed(1)}px,${(q[1] - VIEW.cy).toFixed(1)}px)`;
    if (a > 0.01) {
      const e = [q[0] - Math.sign(off[0]) * 8, q[1] + (off[1] > 0 ? -22 : 22)];
      line([p, [e[0], e[1]]], WHITE, 2, 0.8 * a, 6);
      dot(p[0], p[1], 5, WHITE, a, 10);
    }
  }
  function tagLabel(id, world, a) {
    setOp(id, a);
    if (EL[id]) {
      const p = screenOf(world);
      EL[id].style.transform =
        `translate(${(p[0] - VIEW.cx).toFixed(1)}px,${(p[1] - VIEW.cy).toFixed(1)}px)`;
    }
  }

  // ================================================================ the scene at time t
  function drawScene(t, th, bl, aLow, panelH) {
    const phi = BLDC.rotorAngle(th);
    const hook = t < 2.1;
    // ---- visibility and the assembly of the brushless motor
    const aBrushed = hook ? 0 : box(t, T.sw[0], T.st[1], 0.4, 0.5);
    const part = (a, b, dz0) => {
      const u = easeOut((t - a) / (b - a));
      return { dz: hook ? 0 : dz0 * (1 - u), al: hook ? hookA(t) : smooth((t - a) / 0.4) };
    };
    const ps = part(T.st[1] + 0.3, T.asm[0], -3.6),
      ph = part(T.asm[0] - 0.4, T.asm[1], 3.2),
      pr = part(T.asm[1] - 0.4, T.asm[2], 5.6);
    stator.off = [0, 0, ps.dz];
    stator.alpha = ps.al;
    hall.off = [0, 0, ph.dz];
    hall.alpha = ph.al;
    rotor.off = [0, 0, pr.dz];
    rotor.alpha = pr.al;
    rotor.rot = phi;
    bRotor.rot = phi;
    bHouse.alpha = bRotor.alpha = bBrush.alpha = aBrushed;
    const sc = 1 - 0.1 * (1 - aBrushed);
    bHouse.sc = bRotor.sc = bBrush.sc = sc;
    // ---- the coils glow with their currents, the Hall chips with their signals
    const aOn = hook ? hookA(t) : smooth((t - T.sw[2]) / 0.5),
      aHs = hook ? hookA(t) : smooth((t - T.sw[3]) / 0.5);
    for (const pl of stator.polys)
      if (pl.tag >= 0) {
        const [n, s] = TOOTH[pl.tag],
          on = Math.abs(s * bl.i[n]);
        pl.em = 0.85 * on * aOn;
        pl.emc = PHRGB[n];
      }
    for (const pl of hall.polys)
      if (pl.tag >= 10) {
        pl.em = 0.9 * hallSoft(th, pl.tag - 10) * aHs;
        pl.emc = [255, 255, 255];
      }
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(90, PAT, 900, panelH, 28);
    ctx.clip();
    const gc = screenOf([0, 0, 0.2]),
      sc0 = cam.F / cam.dist;
    const halo = ctx.createRadialGradient(gc[0], gc[1], 30, gc[0], gc[1], 3.4 * sc0);
    halo.addColorStop(0, "rgba(176,38,255,0.20)");
    halo.addColorStop(0.55, "rgba(0,136,255,0.07)");
    halo.addColorStop(1, "rgba(176,38,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(90, PAT, 900, panelH);
    const gs = screenOf([0, -2.35, 0.2]);
    ctx.save();
    ctx.translate(gs[0], gs[1]);
    ctx.scale(1, 0.16);
    const sh = ctx.createRadialGradient(0, 0, 10, 0, 0, 2.3 * sc0);
    sh.addColorStop(0, "rgba(0,0,0,0.55)");
    sh.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(0, 0, 2.3 * sc0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    drawParts([bHouse, stator, hall, bRotor, rotor, bBrush]);
    // ---- the brushed motor: sparks where a brush leaves a commutator segment, with a spring pressing each brush
    if (aBrushed > 0.01) {
      [90, 270].forEach((b) => {
        const cp = [0, 0.43 * Math.sin(b * DEG), 0.88],
          p0 = screenOf(cp);
        let dmin = 99;
        for (let k = 0; k < 6; k++) dmin = Math.min(dmin, Math.abs(norm180(phi + 60 * k + 60 - b)));
        const I = clamp01(1 - dmin / 9);
        if (I > 0.04) {
          const rev = Math.floor((phi + 3600) / 60);
          for (let j = 0; j < 9; j++) {
            const hsh = Math.sin((rev * 12.9898 + j * 78.233 + b) * 43758.5453),
              ang = (hsh - Math.floor(hsh)) * 2 * Math.PI,
              len = 16 + 34 * I * (0.5 + 0.5 * Math.sin(j * 7.1 + rev));
            line(
              [p0, [p0[0] + Math.cos(ang) * len, p0[1] + Math.sin(ang) * len]],
              WHITE,
              2.5,
              I * aBrushed,
              10,
            );
          }
          dot(p0[0], p0[1], 10 * I, WHITE, I * aBrushed, 26);
          dot(p0[0], p0[1], 20 * I, RED, 0.5 * I * aBrushed, 30);
        }
      });
    }
    // ---- the stator field (white) is the sum of the phase axes weighted by the currents; the rotor's north pole is the red arrow
    let vx = 0,
      vy = 0;
    for (let n = 0; n < 3; n++) {
      vx += bl.i[n] * Math.cos(120 * n * DEG);
      vy += bl.i[n] * Math.sin(120 * n * DEG);
    }
    const m = Math.atan2(vy, vx) / DEG,
      len = (1.5 * Math.hypot(vx, vy)) / 1.7321;
    const aArrow = aOn * (hook ? 1 : pr.al);
    if (aArrow > 0.01) {
      const z = 1.0 + ps.dz * 0,
        o = screenOf([0, 0, z]);
      const tip = screenOf([len * Math.cos(m * DEG), len * Math.sin(m * DEG), z]);
      line([o, tip], WHITE, 7, aArrow, 16);
      arrowHead(tip[0], tip[1], Math.atan2(tip[1] - o[1], tip[0] - o[0]), WHITE, aArrow, 15);
      const rtip = screenOf([1.0 * Math.cos(phi * DEG), 1.0 * Math.sin(phi * DEG), z]);
      line([o, rtip], RED, 5, aArrow * 0.9, 10);
      arrowHead(
        rtip[0],
        rtip[1],
        Math.atan2(rtip[1] - o[1], rtip[0] - o[0]),
        RED,
        aArrow * 0.9,
        11,
      );
    }
    ctx.restore();
    // ---- annotations
    const aS1 = box(t, 2.8, T.st[1], 0.3, 0.3),
      aS2 = box(t, T.asm[2] + 0.5, T.st[3], 0.4, 0.3),
      aS4 = box(t, T.sw[3] + 0.1, T.st[4], 0.4, 0.3);
    annotate("l3brush", [0, 0.88, 0.9], [150, -70], aS1);
    annotate("l3comm", [0.36, -0.1, 1.15], [-150, 80], aS1);
    annotate("l3stator", pol(1.32, 60, 0.88), [170, -90], aS2);
    annotate("l3rotor", pol(0.8, -50, 0.64), [-185, 92], aS2);
    annotate("l3hall", pol(1.3, 150, 0.84), [-170, -80], aS4);
    const aNS = hook ? hookA(t) : smooth((t - T.asm[2] - 0.3) / 0.4);
    tagLabel(
      "lNp",
      [0.62 * Math.cos(phi * DEG), 0.62 * Math.sin(phi * DEG), 0.7 + rotor.off[2]],
      aNS,
    );
    tagLabel(
      "lSp",
      [0.62 * Math.cos((phi + 180) * DEG), 0.62 * Math.sin((phi + 180) * DEG), 0.7 + rotor.off[2]],
      aNS,
    );
  }

  // ================================================================ the 2D insets
  const X0 = PLOT.x0,
    PW = PLOT.w,
    Y0 = PLOT.y0,
    K = PLOT.k;
  const xU = (u) => X0 + (PW * u) / 360;
  function drawWaves(t, th, D, bl, aLow) {
    const aHook = t < 2.1 ? hookA(t) : 0;
    const aCur = t < 2.1 ? 0 : box(t, T.sw[2], T.sw[3], 0.4, 0.3) * aLow;
    const aHall = t < 2.1 ? 0 : box(t, T.sw[3], T.sw[4], 0.3, 0.3) * aLow;
    const aEmf = (t < 2.1 ? aHook : smooth((t - T.sw[4]) / 0.4)) * (t < 2.1 ? 1 : aLow);
    seg(X0, Y0, X0 + PW, Y0, WHITE, 2, 0.3 * Math.max(aCur, aHall, aEmf));
    const U = [];
    for (let u = 0; u <= 360; u += 3) U.push(u);
    if (aCur > 0.001)
      for (let n = 0; n < 3; n++)
        line(
          U.map((u) => [xU(u), Y0 - K * BLDC.currents(30 + u + 0.01, 1)[n] + (n - 1) * 2.5]),
          PHC[n],
          4,
          aCur,
          8,
        );
    if (aHall > 0.001)
      for (let n = 0; n < 3; n++) {
        const yb = Y0 - 26 + n * 26;
        line(
          U.map((u) => [xU(u), yb - 17 * BLDC.hall(30 + u + 0.01)[n]]),
          PHC[n],
          4,
          aHall,
          8,
        );
        seg(X0, yb, X0 + PW, yb, WHITE, 1, 0.15 * aHall);
      }
    const ratio = BLDC.steadyW(D) / BLDC.steadyW(1);
    if (aEmf > 0.001) {
      for (let n = 0; n < 3; n++)
        line(
          U.map((u) => [xU(u), Y0 - 48 * ratio * BLDC.emf(n, 30 + u)]),
          PHC[n],
          4,
          aEmf,
          8,
        );
      line(
        U.map((u) => [xU(u), Y0 - 30 * BLDC.currents(30 + u + 0.01, 1)[0]]),
        WHITE,
        3,
        0.9 * aEmf,
        6,
        [9, 6],
      );
    }
    const swA = Math.max(aCur, aHall, aEmf);
    [0, 1, 2].forEach((n) => seg(562 + 18 * n, 1010, 575 + 18 * n, 1010, PHC[n], 4, swA));
    const u = (((th - 30) % 360) + 360) % 360,
      xc = xU(u);
    seg(xc, PB2[1] + 14, xc, PB2[1] + PB2[3] - 14, WHITE, 2, 0.4 * Math.max(swA, 0));
    for (let n = 0; n < 3; n++) {
      if (aEmf > 0.001) dot(xc, Y0 - 48 * ratio * BLDC.emf(n, th), 5, PHC[n], aEmf, 10);
      if (aCur > 0.001) dot(xc, Y0 - K * bl.i[n] + (n - 1) * 2.5, 5, PHC[n], aCur, 10);
    }
    setOp("lLegCur", aCur);
    setOp("lLegHall", aHall);
    setOp("lLegEmf", aEmf);
  }
  function drawBridge(bl, a) {
    setOp("lrp", a);
    setOp("lrn", a);
    ["lla", "llb", "llc"].forEach((id) => setOp(id, a));
    if (a <= 0.001) return;
    gA = a;
    seg(135, BR.top, 430, BR.top, WHITE, 3, 0.7);
    seg(150, BR.top - 16, 150, BR.top, WHITE, 3, 0.7);
    seg(130, BR.top - 16, 170, BR.top - 16, WHITE, 3, 0.7);
    seg(135, BR.bot, 430, BR.bot, WHITE, 3, 0.7);
    seg(150, BR.bot, 150, BR.bot + 14, WHITE, 3, 0.7);
    seg(130, BR.bot + 14, 170, BR.bot + 14, WHITE, 3, 0.7);
    BR.xs.forEach((x, n) => {
      const up = clamp01(bl.i[n]),
        lo = clamp01(-bl.i[n]);
      const sw = (cy, on) => {
        ctx.save();
        ctx.globalAlpha = gA * (0.35 * (1 - on));
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 16, cy - 18, 32, 36);
        ctx.globalAlpha = gA * on;
        ctx.fillStyle = PHC[n];
        ctx.shadowColor = PHC[n];
        ctx.shadowBlur = 16;
        ctx.fillRect(x - 16, cy - 18, 32, 36);
        ctx.restore();
      };
      const wire = (y0, y1, on) => {
        seg(x, y0, x, y1, WHITE, 3, 0.35);
        seg(x, y0, x, y1, PHC[n], 3, on);
      };
      wire(BR.top, 1058, up);
      sw(1076, up);
      wire(1094, 1122, up);
      wire(1122, 1148, lo);
      sw(1166, lo);
      wire(1184, BR.bot, lo);
      dot(x, 1122, 6, up + lo > 0.2 ? PHC[n] : WHITE, up + lo > 0.2 ? 1 : 0.5, 10);
    });
    gA = 1;
  }
  function drawKV(D, a) {
    setOp("lKV1", a);
    setOp("lKV2", a);
    if (a <= 0.001) return;
    const sx = 330,
      k = 6.5,
      vin = D * BLDC.VDC,
      ir = BLDC.steadyI * BLDC.RLL,
      ke = vin - ir;
    rect(sx, 1072, vin * k, 26, RED, 0.95 * a, 12);
    rect(sx, 1127, ke * k, 26, BLUE, 0.95 * a, 12);
    rect(sx + ke * k, 1127, ir * k, 26, WHITE, 0.95 * a, 8);
    seg(sx + vin * k, 1062, sx + vin * k, 1165, WHITE, 2, 0.4 * a, 0, [6, 5]);
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
      ctx.moveTo(x, 330);
      ctx.lineTo(x, 1230);
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    [
      [90, 330],
      [990, 330],
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
    // the lower panels slide in when the electronics are introduced; the 3D panel gives them room
    const aLow = t < 2.1 ? hookA(t) : smooth((t - T.st[2]) / 0.5);
    const panelH = 640 + (1 - aLow) * 260;
    panel(90, PAT, 900, panelH, 1);
    panel(PB1[0], PB1[1], PB1[2], PB1[3], aLow);
    panel(PB2[0], PB2[1], PB2[2], PB2[3], aLow);
    setCam(t, PAT + panelH / 2);
    drawScene(t, th, bl, aLow, panelH);
    drawWaves(t, th, D, bl, aLow);
    const aBridge = t < 2.1 ? 0 : box(t, T.sw[2], T.st[4], 0.4, 0.3) * aLow;
    const aKV = (t < 2.1 ? hookA(t) : smooth((t - T.sw[4]) / 0.4)) * (t < 2.1 ? 1 : aLow);
    drawBridge(bl, aBridge);
    drawKV(D, aKV);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
