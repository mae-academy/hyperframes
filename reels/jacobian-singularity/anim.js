// Timeline for "THE JACOBIAN: WHY A ROBOT SOMETIMES FREEZES" (24.4 s): a two-link arm drawn in 3D on a canvas from the two joint angles alone
// (hf-seek protocol). The tip velocity per joint is an arrow on the floor; the two arrows are the columns of the Jacobian and the area
// between them is det J = L1 L2 sin(theta2). Text, counters and cards are GSAP. Everything is a pure function of timeline time.
(function () {
  const CFG = window.__CFG;
  const { T, VIEW, HUD, DK, L1, L2, PL } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind: the arm folds
    [2.4, "click"], // a two-link arm
    [2.6, "snap"], // v = J theta-dot
    [2.8, "click"], // the velocity space opens
    [3.0, "click"], // the joint-rate readout
    [4.2, "click"], // joint 1 only
    [4.4, "snap"],
    [6.0, "click"], // joint 2 only
    [6.2, "snap"],
    [7.8, "click"], // both
    [8.0, "snap"], // v = sum of the arrows
    [9.8, "click"], // the Jacobian
    [10.0, "snap"], // J = [a1 a2]
    [10.2, "click"], // the matrix appears
    [12.4, "click"], // the area between the arrows
    [12.6, "snap"], // det J = L1 L2 sin(theta2)
    [12.8, "click"], // the determinant readout
    [15.0, "click"], // straighten the arm
    [15.2, "snap"], // theta2 = 0 => det J = 0
    [15.6, "click"], // the speed meter
    [17.4, "click"], // a singularity
    [17.6, "snap"], // theta-dot = J^-1 v -> infinity
    [19.8, "thump"], // lock
    [20.6, "click"], // stay away from singularities
    [21.8, "snap"], // CTA reveal
    [23.4, "click"], // engagement pulse
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

  // ---------------------------------------------------------------- 0.0 - 2.4  the finished picture (a straight arm), then it folds
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
  ["#lJ", "#lRB", "#ldet", "#lsp"].forEach((s) => fade(s, T.rewind0, 0.3));
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
  const popAt = (i, sels) => {
    hit(T.pops[i], "click", sels[0]);
    sels.forEach((s) => pop(s, T.pops[i], 8));
  };
  bannerAt(0);
  beat(1, T.sw[0]);
  popAt(0, ["#lVS"]);
  popAt(1, ["#lrt1", "#lrt2", "#lrtv", "#lRA"]);
  bannerAt(1);
  beat(2, T.sw[1]);
  bannerAt(2);
  beat(3, T.sw[2]);
  bannerAt(3);
  beat(4, T.sw[3]);
  bannerAt(4);
  beat(5, T.sw[4]);
  // the joint-rate readout gives way to the matrix J
  ["#lrt1", "#lrt2", "#lrtv", "#lRA"].forEach((s) => fade(s, T.sw[4] - 0.1, 0.2));
  popAt(2, ["#lJ", "#lRB"]);
  bannerAt(5);
  beat(6, T.sw[5]);
  popAt(3, ["#ldet"]);
  bannerAt(6);
  beat(7, T.sw[6]);
  popAt(4, ["#lsp"]);
  bannerAt(7);
  beat(8, T.sw[7]);

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
    PURPLE = "#B026FF",
    WHITE = "#FFFFFF";
  const DEG = Math.PI / 180;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
  const box = (t, a, b, fi, fo) => smooth((t - a) / fi) * (1 - smooth((t - b) / fo));
  const mixc = (c0, c1, u) => {
    const h = (s) => [
      parseInt(s.slice(1, 3), 16),
      parseInt(s.slice(3, 5), 16),
      parseInt(s.slice(5, 7), 16),
    ];
    const a = h(c0),
      b = h(c1);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * u)},${Math.round(a[1] + (b[1] - a[1]) * u)},${Math.round(a[2] + (b[2] - a[2]) * u)})`;
  };

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
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
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
  /** a line with an arrow head at its end (screen coordinates) */
  function arrow2(a, b, color, w, alpha, blur) {
    if (alpha <= 0.01) return;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 3) return;
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const hs = Math.min(15, len * 0.45);
    line(
      [a, [b[0] - Math.cos(ang) * hs * 0.6, b[1] - Math.sin(ang) * hs * 0.6]],
      color,
      w,
      alpha,
      blur === undefined ? 10 : blur,
    );
    arrowHead(b[0], b[1], ang, color, alpha, hs);
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  const hookA = (t) => (t < T.rewind0 ? 1 : 1 - smooth((t - T.rewind0) / 0.5));
  /** alpha of something that is on screen in the finished picture, leaves with the rewind and returns at `start` */
  const stageA = (t, start, fi) => (t < 2.1 ? hookA(t) : smooth((t - start) / (fi || 0.3)));

  // ---------------------------------------------------------------- the joint angles: a monotone cubic through the keyframes
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
  const thAt = (t) => monoEval(DK, t);
  /** forward kinematics, the Jacobian (columns = tip velocity per rad/s of each joint) and its determinant, units of 100 mm */
  function kin(th) {
    const a = th[0] * DEG,
      ab = (th[0] + th[1]) * DEG;
    const e = [L1 * Math.cos(a), L1 * Math.sin(a)];
    const p = [e[0] + L2 * Math.cos(ab), e[1] + L2 * Math.sin(ab)];
    const J = [
      [-L1 * Math.sin(a) - L2 * Math.sin(ab), -L2 * Math.sin(ab)],
      [L1 * Math.cos(a) + L2 * Math.cos(ab), L2 * Math.cos(ab)],
    ];
    return { e, p, J, det: J[0][0] * J[1][1] - J[0][1] * J[1][0] };
  }

  // ================================================================ the 3D engine: a camera, polygons, a light, painter's order
  // page axes: x right, y up, z towards the viewer. The arm's plane: X = x, Y = -z (away from the viewer).
  const toPage = (X, Y, h) => [X, h === undefined ? 0.06 : h, -Y];
  const cam = {
    yaw: 0,
    pitch: 0,
    dist: 22,
    tx: 0,
    ty: 0,
    tz: -2.6,
    cx: VIEW.cx,
    cy: VIEW.cy,
    F: VIEW.F,
  };
  // [t, yaw, pitch, distance]
  const CAMK = [
    [0.0, 12, 54, 22],
    [4.0, 2, 56, 22],
    [8.0, -10, 55, 22],
    [12.4, 6, 57, 22],
    [15.0, 0, 62, 22],
    [18.0, -8, 59, 22],
    [23, 0, 55, 22],
    [40, 0, 55, 22],
  ];
  function setCam(t) {
    const k = monoEval(CAMK, t);
    cam.yaw = k[0] * DEG;
    cam.pitch = k[1] * DEG;
    cam.dist = k[2];
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

  // ---- model building: polygons in page coordinates at the home pose (all angles zero); a part turns about vertical axes (its rots)
  const mkPart = () => ({ polys: [], rots: [], alpha: 1 });
  const EDGE = "rgba(228,234,255,0.66)";
  const addPoly = (part, v, n, c, o) =>
    part.polys.push({
      v,
      n,
      c,
      em: (o && o.em) || 0,
      emc: (o && o.emc) || null,
      edge: (o && o.edge) || null,
    });
  function boxP(part, x0, x1, y0, y1, z0, z1, c, o) {
    const q = (a, b, cc, d, n) => addPoly(part, [a, b, cc, d], n, c, o);
    q([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0]);
    q([x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [x0, y0, z0], [-1, 0, 0]);
    q([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0]);
    q([x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [0, -1, 0]);
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
    q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  }
  /** a vertical frustum (cylinder when r0 = r1) at (cx, cz) from y0 to y1; sides are not outlined (they read as fine hatching) */
  function vcyl(part, cx, cz, r0, r1, y0, y1, col, o) {
    const da = 10,
      k = (r1 - r0) / (y1 - y0),
      kn = Math.hypot(1, k);
    const so = Object.assign({}, o, { edge: null });
    for (let a = 0; a < 360 - 1e-9; a += da) {
      const b = a + da,
        m = ((a + b) / 2) * DEG;
      const ca = Math.cos(a * DEG),
        sa = Math.sin(a * DEG),
        cb = Math.cos(b * DEG),
        sb = Math.sin(b * DEG);
      addPoly(
        part,
        [
          [cx + r0 * ca, y0, cz + r0 * sa],
          [cx + r0 * cb, y0, cz + r0 * sb],
          [cx + r1 * cb, y1, cz + r1 * sb],
          [cx + r1 * ca, y1, cz + r1 * sa],
        ],
        [Math.cos(m) / kn, -k / kn, Math.sin(m) / kn],
        col,
        so,
      );
    }
    if (o && o.caps) {
      const ring = (r, y) => {
        const pts = [];
        for (let a = 0; a < 360 - 1e-9; a += da)
          pts.push([cx + r * Math.cos(a * DEG), y, cz + r * Math.sin(a * DEG)]);
        return pts;
      };
      if (r1 > 0) addPoly(part, ring(r1, y1), [0, 1, 0], col, o);
      if (r0 > 0) addPoly(part, ring(r0, y0).reverse(), [0, -1, 0], col, o);
    }
  }
  function ribbedV(part, cx, cz, r, y0, y1, n, body, rib) {
    vcyl(part, cx, cz, r, r, y0, y1, body, {});
    for (let i = 0; i < n; i++) {
      const y = y0 + ((y1 - y0) * (i + 0.5)) / n;
      vcyl(part, cx, cz, r * 1.12, r * 1.12, y - 0.05, y + 0.05, rib, { caps: true, edge: EDGE });
    }
  }
  const GLOW = { em: 0.9, emc: [0, 136, 255] };
  const BODY = [26, 30, 56],
    BODYD = [17, 19, 36],
    RIB = [58, 64, 104],
    GRIP = [88, 94, 132];

  // the arm: a pedestal, link 1 (turns about the base), link 2 (turns about the elbow, which turns with link 1), a conical tip on the floor
  const base = mkPart(),
    link1 = mkPart(),
    link2 = mkPart();
  vcyl(base, 0, 0, 1.2, 1.2, 0, 0.14, BODYD, { caps: true, edge: EDGE });
  ribbedV(base, 0, 0, 0.95, 0.14, 0.85, 3, BODY, RIB);
  vcyl(base, 0, 0, 0.95, 0.95, 0.85, 0.92, [0, 136, 255], Object.assign({ caps: true }, GLOW));
  ribbedV(link1, 0, 0, 0.6, 0.92, 1.55, 3, BODY, RIB);
  boxP(link1, 0, L1, 1.05, 1.35, -0.28, 0.28, BODY, { edge: EDGE });
  vcyl(link1, L1, 0, 0.28, 0.28, 1.05, 1.35, BODY, { caps: true, edge: EDGE });
  ribbedV(link1, L1, 0, 0.45, 1.35, 1.95, 3, BODY, RIB);
  vcyl(link1, L1, 0, 0.45, 0.45, 1.95, 2.0, [0, 136, 255], Object.assign({ caps: true }, GLOW));
  link2.rots = [[L1, 0, 0]];
  boxP(link2, L1, L1 + L2, 2.0, 2.3, -0.26, 0.26, BODY, { edge: EDGE });
  vcyl(link2, L1, 0, 0.26, 0.26, 2.0, 2.3, BODY, { caps: true, edge: EDGE });
  vcyl(link2, L1 + L2, 0, 0.26, 0.26, 2.0, 2.3, BODY, { caps: true, edge: EDGE });
  vcyl(link2, L1 + L2, 0, 0.13, 0.13, 0.6, 2.0, GRIP, { caps: true });
  vcyl(link2, L1 + L2, 0, 0.3, 0.3, 0.6, 0.7, [0, 136, 255], Object.assign({ caps: true }, GLOW));
  vcyl(link2, L1 + L2, 0, 0, 0.22, 0.06, 0.6, GRIP, {});
  const PARTS = [base, link1, link2];

  function xf(part, v) {
    let x = v[0],
      z = v[2];
    for (const [px, pz, ang] of part.rots) {
      const c = Math.cos(ang),
        s = Math.sin(ang),
        dx = x - px,
        dz = z - pz;
      x = px + dx * c + dz * s;
      z = pz - dx * s + dz * c;
    }
    return [x, v[1], z];
  }
  function rotNorm(part, n) {
    let x = n[0],
      z = n[2];
    for (const r of part.rots) {
      const c = Math.cos(r[2]),
        s = Math.sin(r[2]);
      const nx = x * c + z * s;
      z = -x * s + z * c;
      x = nx;
    }
    return [x, n[1], z];
  }
  function drawParts(list) {
    const items = [];
    for (const part of list) {
      if (part.alpha <= 0.003) continue;
      for (const pl of part.polys) {
        const vv = [];
        let mx = 0,
          my = 0,
          mz = 0;
        for (const v of pl.v) {
          const vw = toView(xf(part, v));
          vv.push(vw);
          mx += vw[0];
          my += vw[1];
          mz += vw[2];
        }
        const nv = vv.length;
        mx /= nv;
        my /= nv;
        mz /= nv;
        const n = rotN(rotNorm(part, pl.n));
        const toCam = [-mx, -my, cam.dist - mz];
        if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] <= 0) continue;
        const d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const k = 0.8 + 0.4 * d;
        let r = pl.c[0] * k,
          g = pl.c[1] * k,
          b = pl.c[2] * k;
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
          edge: pl.edge,
          glow: pl.em > 0.45 ? pl.emc : null,
        });
      }
    }
    items.sort((p, q) => p.d - q.d);
    ctx.lineJoin = "round";
    for (const it of items) {
      ctx.globalAlpha = it.a;
      ctx.fillStyle = it.col;
      ctx.strokeStyle = it.edge || "rgba(215,224,255,0.30)";
      ctx.lineWidth = it.edge ? 1.9 : 1.0;
      if (it.edge && !it.glow) {
        ctx.shadowColor = "rgba(140,180,255,0.6)";
        ctx.shadowBlur = 5;
      }
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
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  // ---------------------------------------------------------------- DOM labels that follow a point
  const EL = {};
  ["lth1", "lth2", "la1", "la2", "lv", "pa1", "pa2", "pv"].forEach(
    (id) => (EL[id] = document.getElementById(id)),
  );
  const labelOp = (id, a) => {
    if (EL[id]) EL[id].style.opacity = String(Math.max(0, Math.min(1, 3.6 * a)));
  };
  function labelAt(id, p, a, dx, dy) {
    labelOp(id, a);
    if (EL[id])
      EL[id].style.transform =
        `translate(${(p[0] - VIEW.cx + (dx || 0)).toFixed(1)}px,${(p[1] - VIEW.cy + (dy || 0)).toFixed(1)}px)`;
  }

  // ================================================================ the scene at time t
  const KA = 0.55; // the arrows at the tip show the Jacobian columns scaled by this factor (page units per unit of J)
  function drawScene(t, th, K) {
    const rad1 = th[0] * DEG,
      rad2 = th[1] * DEG;
    link1.rots = [[0, 0, rad1]];
    link2.rots = [
      [L1, 0, rad2],
      [0, 0, rad1],
    ];
    // a soft glow under the arm: it stands on a lit floor
    const b0 = screenOf([0, 0, 0]);
    const g = ctx.createRadialGradient(b0[0], b0[1] - 40, 20, b0[0], b0[1] - 40, 360);
    g.addColorStop(0, "rgba(0,136,255,0.20)");
    g.addColorStop(1, "rgba(0,136,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(90, 330, 900, 620);

    // the reach: the outer and inner circles of the workspace on the floor (the edges where the arm is straight or folded)
    const aReach = stageA(t, T.st[6], 0.4);
    if (aReach > 0.01) {
      for (const [R, col] of [
        [L1 + L2, PURPLE],
        [Math.abs(L1 - L2), PURPLE],
      ]) {
        const pts = [];
        for (let a = 0; a <= 180; a += 3)
          pts.push(screenOf(toPage(R * Math.cos(a * DEG), R * Math.sin(a * DEG), 0.03)));
        line(pts, col, 3, 0.8 * aReach, 10, [10, 8]);
      }
    }
    drawParts(PARTS);

    const tip = toPage(K.p[0], K.p[1], 0.06);
    const elbow = toPage(K.e[0], K.e[1], 0.06);
    const origin = toPage(0, 0, 0.06);
    const ts = screenOf(tip);
    // the joint angles as arcs on the floor
    const aAng = stageA(t, T.sw[0], 0.4);
    if (aAng > 0.01) {
      const arc = (c, r, a0, a1, col) => {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const a = a0 + ((a1 - a0) * i) / 24;
          pts.push(screenOf(toPage(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), 0.06)));
        }
        line(pts, col, 4, 0.9 * aAng, 8);
        return pts;
      };
      arc([0, 0], 1.5, 0, rad1, RED);
      arc(K.e, 1.1, rad1, rad1 + rad2, PURPLE);
      // the guide lines of the angles
      line(
        [screenOf(origin), screenOf(toPage(1.9, 0, 0.06))],
        "rgba(255,255,255,0.35)",
        2,
        aAng,
        0,
        [6, 6],
      );
      line(
        [
          screenOf(elbow),
          screenOf(toPage(K.e[0] + 1.4 * Math.cos(rad1), K.e[1] + 1.4 * Math.sin(rad1), 0.06)),
        ],
        "rgba(255,255,255,0.35)",
        2,
        aAng,
        0,
        [6, 6],
      );
      labelAt(
        "lth1",
        screenOf(toPage(2.0 * Math.cos(rad1 / 2), 2.0 * Math.sin(rad1 / 2), 0.06)),
        aAng,
      );
      const mid = rad1 + rad2 / 2;
      labelAt(
        "lth2",
        screenOf(toPage(K.e[0] + 1.6 * Math.cos(mid), K.e[1] + 1.6 * Math.sin(mid), 0.06)),
        aAng,
      );
    } else {
      labelOp("lth1", 0);
      labelOp("lth2", 0);
    }

    // the two columns of the Jacobian as arrows at the tip: a1 from joint 1 (red), a2 from joint 2 (purple)
    const a1 = [K.J[0][0] * KA, K.J[1][0] * KA],
      a2 = [K.J[0][1] * KA, K.J[1][1] * KA];
    const aA1 = stageA(t, T.st[1], 0.3),
      aA2 = stageA(t, T.st[2], 0.3),
      aPar = stageA(t, T.st[3], 0.4);
    const P = (v) => screenOf(toPage(K.p[0] + v[0], K.p[1] + v[1], 0.06));
    // the parallelogram spanned by the arrows: its area is |det J|
    const low = smooth(1 - Math.abs(Math.sin(rad2)) / 0.3);
    if (aPar > 0.01) {
      ctx.save();
      ctx.globalAlpha = 0.28 * aPar;
      ctx.fillStyle = mixc(BLUE, RED, low);
      ctx.beginPath();
      [[0, 0], a1, [a1[0] + a2[0], a1[1] + a2[1]], a2].forEach((v, i) => {
        const s = P(v);
        if (i === 0) ctx.moveTo(s[0], s[1]);
        else ctx.lineTo(s[0], s[1]);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      line(
        [P([0, 0]), P(a1), P([a1[0] + a2[0], a1[1] + a2[1]]), P(a2), P([0, 0])],
        mixc(BLUE, RED, low),
        2.5,
        aPar,
        8,
      );
    }
    arrow2(P([0, 0]), P(a1), RED, 6, aA1, 12);
    arrow2(P([0, 0]), P(a2), PURPLE, 6, aA2, 12);
    labelAt("la1", P([a1[0] * 1.0, a1[1] * 1.0]), aA1, a1[0] < 0 ? -26 : 26, -22);
    labelAt("la2", P([a2[0] * 1.0, a2[1] * 1.0]), aA2, a2[0] < 0 ? -26 : 26, 22);
    // a combination of the two arrows: 0.7 a1 + 0.55 a2, drawn head to tail, and the sum v
    const w1 = 0.7,
      w2 = 0.55;
    const vv = [w1 * a1[0] + w2 * a2[0], w1 * a1[1] + w2 * a2[1]];
    const aV = box(t, T.st[3] + 0.5, T.sw[4] + 0.6, 0.4, 0.4);
    if (aV > 0.01) {
      line(
        [P([0, 0]), P([w1 * a1[0], w1 * a1[1]]), P(vv)],
        "rgba(255,255,255,0.55)",
        2,
        aV,
        0,
        [6, 6],
      );
      arrow2(P([0, 0]), P(vv), BLUE, 7, aV, 14);
    }
    labelAt("lv", P(vv), aV, vv[0] < 0 ? -22 : 22, -18);
    // the target, further out along the straight arm than the arm can reach: the hand cannot go there along the arm
    const aTg = box(t, T.sw[6] + 0.9, T.lock + 0.4, 0.4, 0.5);
    const TG = [6.7 * Math.cos(75 * DEG), 6.7 * Math.sin(75 * DEG)];
    if (aTg > 0.01) {
      const tgs = screenOf(toPage(TG[0], TG[1], 0.06));
      line([ts, tgs], RED, 4, 0.8 * aTg, 10, [10, 8]);
      ctx.save();
      ctx.globalAlpha = aTg;
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 4;
      ctx.shadowColor = WHITE;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(tgs[0], tgs[1], 20, 0, 2 * Math.PI);
      ctx.moveTo(tgs[0] - 30, tgs[1]);
      ctx.lineTo(tgs[0] + 30, tgs[1]);
      ctx.moveTo(tgs[0], tgs[1] - 30);
      ctx.lineTo(tgs[0], tgs[1] + 30);
      ctx.stroke();
      ctx.restore();
      // a red cross over the way there
      const mid = [(ts[0] + tgs[0]) / 2, (ts[1] + tgs[1]) / 2];
      line(
        [
          [mid[0] - 14, mid[1] - 14],
          [mid[0] + 14, mid[1] + 14],
        ],
        RED,
        7,
        aTg,
        10,
      );
      line(
        [
          [mid[0] - 14, mid[1] + 14],
          [mid[0] + 14, mid[1] - 14],
        ],
        RED,
        7,
        aTg,
        10,
      );
      labelAt("lTg", tgs, aTg, 84, 0);
    } else {
      labelOp("lTg", 0);
    }
    // the path of the hand over the last second: a fading trail
    const aTr = stageA(t, T.st[1], 0.4);
    if (aTr > 0.01) {
      let prev = null;
      for (let k = 0; k <= 30; k++) {
        const tt = Math.max(0, t - k * 0.04);
        const p = screenOf(toPage(kin(thAt(tt)).p[0], kin(thAt(tt)).p[1], 0.06));
        if (prev) line([prev, p], WHITE, 4, aTr * 0.65 * (1 - k / 30), 8);
        prev = p;
      }
    }
    // the tip: a red marker with a white core
    dot(ts[0], ts[1], 16, RED, 0.3, 24);
    dot(ts[0], ts[1], 8, RED, 1, 12);
    dot(ts[0], ts[1], 3.5, WHITE, 1, 0);
  }

  // ---------------------------------------------------------------- numbers drawn in the KaTeX digits
  function numText(s, x, y, size, color, a, align) {
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.font = `${size}px KaTeX_Main`;
    ctx.textAlign = align || "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  const f2 = (v) => (Math.abs(v) < 0.005 ? "0.00" : v.toFixed(2));
  function hudBox(x, y, w, h, a) {
    ctx.save();
    ctx.globalAlpha = a;
    rrect(x, y, w, h, 20);
    ctx.fillStyle = "rgba(10,12,28,0.88)";
    ctx.shadowColor = BLUE;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawHud(t, th, K, v) {
    hudBox(HUD.xj, HUD.y, HUD.wj, HUD.h, 1);
    hudBox(HUD.xt, HUD.y, HUD.wt, HUD.h, 1);
    [0, 1].forEach((i) => {
      const y = HUD.y + 60 + 38 * i,
        x0 = HUD.xj + 100,
        x1 = HUD.xj + 290,
        f = clamp01(th[i] / 180);
      line(
        [
          [x0, y],
          [x1, y],
        ],
        "rgba(255,255,255,0.28)",
        4,
        1,
        0,
      );
      line(
        [
          [x0, y],
          [x0 + (x1 - x0) * f, y],
        ],
        i ? PURPLE : RED,
        4,
        1,
        8,
      );
      dot(x0 + (x1 - x0) * f, y, 9, WHITE, 1, 10);
      dot(x0 + (x1 - x0) * f, y, 5, i ? PURPLE : RED, 1, 0);
      numText(Math.round(th[i]) + "°", HUD.xj + 345, y, 28, WHITE, 1);
    });
    numText(String(Math.round(K.p[0] * 100)), HUD.xt + 60, HUD.y + 98, 32, RED, 1);
    numText(String(Math.round(K.p[1] * 100)), HUD.xt + 205, HUD.y + 98, 32, PURPLE, 1);
    numText(v.toFixed(2), HUD.xt + 350, HUD.y + 98, 32, BLUE, 1);
  }

  // ---------------------------------------------------------------- velocity space: the same two arrows from one origin, and their parallelogram
  function drawVelocity(t, K) {
    const cx = PL[0] + PL[2] / 2,
      cy = PL[1] + 172,
      kp = 22;
    // the axes
    line(
      [
        [PL[0] + 24, cy],
        [PL[0] + PL[2] - 24, cy],
      ],
      "rgba(255,255,255,0.22)",
      2,
      1,
      0,
    );
    line(
      [
        [cx, PL[1] + 54],
        [cx, PL[1] + PL[3] - 14],
      ],
      "rgba(255,255,255,0.22)",
      2,
      1,
      0,
    );
    const S = (v) => [cx + v[0] * kp, cy - v[1] * kp];
    const a1 = [K.J[0][0], K.J[1][0]],
      a2 = [K.J[0][1], K.J[1][1]];
    const aA1 = stageA(t, T.st[1], 0.3),
      aA2 = stageA(t, T.st[2], 0.3),
      aPar = stageA(t, T.st[3], 0.4);
    const low = smooth(1 - Math.abs(K.det) / (L1 * L2) / 0.3);
    if (aPar > 0.01) {
      ctx.save();
      ctx.globalAlpha = 0.3 * aPar;
      ctx.fillStyle = mixc(BLUE, RED, low);
      ctx.beginPath();
      [[0, 0], a1, [a1[0] + a2[0], a1[1] + a2[1]], a2].forEach((v, i) => {
        const s = S(v);
        if (i === 0) ctx.moveTo(s[0], s[1]);
        else ctx.lineTo(s[0], s[1]);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      line(
        [S([0, 0]), S(a1), S([a1[0] + a2[0], a1[1] + a2[1]]), S(a2), S([0, 0])],
        mixc(BLUE, RED, low),
        2.5,
        aPar,
        8,
      );
    }
    arrow2(S([0, 0]), S(a1), RED, 6, aA1, 12);
    arrow2(S([0, 0]), S(a2), PURPLE, 6, aA2, 12);
    labelAt("pa1", S(a1), aA1, a1[0] < 0 ? -26 : 26, -4);
    labelAt("pa2", S(a2), aA2, a2[0] < 0 ? -26 : 26, 8);
    const w1 = 0.7,
      w2 = 0.55,
      vv = [w1 * a1[0] + w2 * a2[0], w1 * a1[1] + w2 * a2[1]];
    const aV = box(t, T.st[3] + 0.5, T.sw[4] + 0.6, 0.4, 0.4);
    if (aV > 0.01) arrow2(S([0, 0]), S(vv), BLUE, 7, aV, 14);
    labelOp("pv", 0);
    // the lost direction: the arrows are parallel, nothing points across them, and the way along the arm is crossed out
    const aLost = box(t, T.sw[6] + 0.9, T.lock + 0.4, 0.4, 0.5);
    if (aLost > 0.01) {
      const rr = Math.hypot(K.p[0], K.p[1]) || 1,
        u = [K.p[0] / rr, K.p[1] / rr];
      const q = S([u[0] * 6, u[1] * 6]);
      line([S([0, 0]), q], RED, 4, aLost, 12, [10, 8]);
      line(
        [
          [q[0] - 11, q[1] - 11],
          [q[0] + 11, q[1] + 11],
        ],
        RED,
        5,
        aLost,
        8,
      );
      line(
        [
          [q[0] - 11, q[1] + 11],
          [q[0] + 11, q[1] - 11],
        ],
        RED,
        5,
        aLost,
        8,
      );
    }
  }

  // ---------------------------------------------------------------- the right panel: joint rates and tip speed, then J, det J and the speed meter
  function drawRight(t, th, K, thd, v) {
    // before J: the joint speeds in and the tip speed out
    const aRT = box(t, T.pops[1], T.sw[4] - 0.1, 0.25, 0.2);
    if (aRT > 0.01) {
      numText(f2(thd[0]), 830, 1030, 36, RED, aRT, "right");
      numText(f2(thd[1]), 830, 1100, 36, PURPLE, aRT, "right");
      numText(f2(v), 830, 1170, 36, BLUE, aRT, "right");
      numText("rad/s", 905, 1030, 24, "rgba(255,255,255,0.7)", aRT * 0.0, "center");
    }
    // J: the two columns coloured like the arrows
    const aJ = stageA(t, T.pops[2], 0.3);
    if (aJ > 0.01) {
      const mx0 = 660,
        mx1 = 960,
        my0 = 1000,
        my1 = 1118;
      const br = (x, dir) =>
        line(
          [
            [x + dir * 12, my0],
            [x, my0],
            [x, my1],
            [x + dir * 12, my1],
          ],
          WHITE,
          3,
          aJ,
          0,
        );
      br(mx0, 1);
      br(mx1, -1);
      const Jm = [
        [K.J[0][0] * 0.1, K.J[0][1] * 0.1],
        [K.J[1][0] * 0.1, K.J[1][1] * 0.1],
      ];
      numText(f2(Jm[0][0]), 735, 1030, 36, RED, aJ);
      numText(f2(Jm[1][0]), 735, 1090, 36, RED, aJ);
      numText(f2(Jm[0][1]), 885, 1030, 36, PURPLE, aJ);
      numText(f2(Jm[1][1]), 885, 1090, 36, PURPLE, aJ);
    }
    // freedom: how much of the hand's wiggle room is left, |sin(theta2)| = |det J| / (L1 L2); it turns red as it goes to zero
    const aD = stageA(t, T.pops[3], 0.3);
    if (aD > 0.01) {
      const fr = clamp01(Math.abs(K.det) / (L1 * L2));
      const x0 = 775,
        x1 = 905,
        y = 1170;
      line(
        [
          [x0, y],
          [x1, y],
        ],
        "rgba(255,255,255,0.28)",
        10,
        aD,
        0,
      );
      line(
        [
          [x0, y],
          [x0 + (x1 - x0) * fr, y],
        ],
        mixc(RED, BLUE, fr),
        10,
        aD,
        12,
      );
      numText(Math.round(fr * 100) + "%", 950, y, 30, mixc(RED, BLUE, fr), aD, "center");
    }
    // the joint speed needed to move the tip straight out, relative to the best case: 1 / |sin(theta2)|
    const aS = stageA(t, T.pops[4], 0.3);
    if (aS > 0.01) {
      const s = 1 / Math.max(1e-9, Math.abs(Math.sin(th[1] * DEG)));
      const fr = clamp01(Math.log10(s) / 1.7);
      const x0 = 830,
        x1 = 930,
        y = 1232;
      line(
        [
          [x0, y],
          [x1, y],
        ],
        "rgba(255,255,255,0.28)",
        10,
        aS,
        0,
      );
      line(
        [
          [x0, y],
          [x0 + (x1 - x0) * fr, y],
        ],
        mixc(BLUE, RED, fr),
        10,
        aS,
        12,
      );
      numText(
        s > 50 ? "∞" : "×" + (s < 10 ? s.toFixed(1) : s.toFixed(0)),
        962,
        y,
        30,
        mixc(BLUE, RED, fr),
        aS,
        "center",
      );
    }
  }

  function drawLock(t) {
    const u = t - T.lock;
    if (u < 0 || u > 1.3) return;
    const cx = 540,
      cy = 640;
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
      ctx.lineTo(x, 950);
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    [
      [90, 330],
      [990, 330],
      [90, 950],
      [990, 950],
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
    const th = thAt(t);
    const K = kin(th);
    // the joint speeds (rad/s) by a central difference of the same curve, and the tip speed they give: v = J theta-dot
    const h = 0.01,
      tp = thAt(t + h),
      tm = thAt(Math.max(0, t - h));
    const thd = [((tp[0] - tm[0]) / (2 * h)) * DEG, ((tp[1] - tm[1]) / (2 * h)) * DEG];
    const vx = K.J[0][0] * thd[0] + K.J[0][1] * thd[1],
      vy = K.J[1][0] * thd[0] + K.J[1][1] * thd[1];
    const speed = Math.hypot(vx, vy) * 0.1;
    setCam(t);
    drawScene(t, th, K);
    drawHud(t, th, K, speed);
    drawVelocity(t, K);
    drawRight(t, th, K, thd, speed);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
