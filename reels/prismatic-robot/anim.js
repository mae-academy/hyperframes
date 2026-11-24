// Timeline for "THE PRISMATIC ROBOT" (24.4 s): a real-time 3D robot drawn on a canvas from the joint values alone (hf-seek protocol).
// Three sliding joints: the carriage along X, the arm along Y, the gripper along Z. The tip is the three slides added; the page draws the
// slides as coloured segments that add up, the joint-space and task-space readouts, the workspace box and the target. Text, counters and
// cards are GSAP. Everything is a pure function of timeline time: no callbacks, no clocks, no randomness.
(function () {
  const CFG = window.__CFG;
  const { T, VIEW, HUD, DK, RANGE } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind: the robot slides home
    [2.4, "click"], // three sliding joints
    [2.6, "snap"], // joint values in, tip position out
    [4.2, "click"], // joint 1
    [4.4, "snap"], // X = d1
    [4.7, "click"], // the relation X = d1 lands in the panel
    [6.0, "click"], // joint 2
    [6.2, "snap"], // Y = d2
    [6.5, "click"],
    [7.8, "click"], // joint 3
    [8.0, "snap"], // Z = d3
    [8.3, "click"],
    [9.8, "click"], // the tip is the three slides added
    [10.0, "snap"], // P = (d1, d2, d3)
    [10.3, "click"], // the column vectors
    [12.4, "click"], // each slide is a matrix
    [12.6, "snap"], // T = T1 T2 T3
    [12.9, "click"], // T1
    [13.3, "click"], // T2
    [13.7, "click"], // T3
    [14.1, "click"], // equals
    [14.5, "click"], // the product
    [15.2, "click"], // the workspace is a box
    [15.4, "snap"],
    [15.6, "click"], // the ranges
    [17.6, "click"], // inverse kinematics
    [17.8, "snap"], // d = P
    [18.0, "click"], // the target and its joint values
    [19.8, "thump"], // lock
    [20.6, "click"], // to slide is to add
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

  // ---------------------------------------------------------------- 0.0 - 2.4  the finished picture, then the robot slides home
  gsap.set("#g1", { opacity: 1 });
  gsap.set("#tX,#tY,#tZ", { opacity: 1 });
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
  ["#tX", "#tY", "#tZ"].forEach((s) => fade(s, T.rewind0, 0.3));
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
  const rowAt = (i, sel) => {
    hit(T.rows[i], "click", sel);
    pop(sel, T.rows[i], 8);
  };
  bannerAt(0);
  beat(1, 1, T.sw[0]);
  bannerAt(1);
  beat(2, 2, T.sw[1]);
  rowAt(0, "#tX");
  bannerAt(2);
  beat(3, 3, T.sw[2]);
  rowAt(1, "#tY");
  bannerAt(3);
  beat(4, 4, T.sw[3]);
  rowAt(2, "#tZ");
  bannerAt(4);
  beat(5, 5, T.sw[4]);
  // the three relations become one column-vector equation
  fade("#g1", T.vec - 0.12, 0.2);
  hit(T.vec, "click", "#g2");
  ft("#g2", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, T.vec);
  fade("#g2", T.mats[0] - 0.25, 0.2);
  bannerAt(5);
  beat(6, 6, T.sw[5]);
  // the matrices: one translation per slide, then their product
  ft("#g3", { opacity: 0 }, { opacity: 1, duration: 0.05 }, T.mats[0] - 0.05);
  const matAt = (k, sels) => {
    hit(T.mats[k], "click", sels[0]);
    sels.forEach((s) => pop(s, T.mats[k], 8));
  };
  matAt(0, ["#mT1", "#mC1"]);
  matAt(1, ["#mT2", "#mD1", "#mC2"]);
  matAt(2, ["#mT3", "#mD2", "#mC3"]);
  matAt(3, ["#mEq"]);
  matAt(4, ["#mT"]);
  fade("#g3", T.rng - 0.25, 0.2);
  bannerAt(6);
  beat(7, 7, T.sw[6]);
  hit(T.rng, "click", "#g4");
  ft("#g4", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, T.rng);
  fade("#g4", T.inv - 0.25, 0.2);
  bannerAt(7);
  beat(8, 8, T.sw[7]);
  hit(T.inv, "click", "#g5");
  ft("#g5", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, T.inv);

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
  const AX = [RED, PURPLE, BLUE]; // X, Y, Z
  const DEG = Math.PI / 180;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
  const box = (t, a, b, fi, fo) => smooth((t - a) / fi) * (1 - smooth((t - b) / fo));

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

  // ---------------------------------------------------------------- the joint values: a monotone cubic through the keyframes
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
  const dAt = (t) => monoEval(DK, t);

  // ================================================================ the 3D engine: a camera, polygons, a light, painter's order
  // world axes of the page: x to the right, y up, z towards the viewer. The robot's frame: X = x, Y = -z (away), Z = y (up).
  const O = [-3, 0.3, 2.0]; // the robot frame's origin in page coordinates (units of 100 mm)
  const toPage = (X, Y, Z) => [O[0] + X, O[1] + Z, O[2] - Y];
  const cam = {
    yaw: 0,
    pitch: 0,
    dist: 22,
    tx: 0,
    ty: 3.2,
    tz: 0,
    cx: VIEW.cx,
    cy: VIEW.cy,
    F: VIEW.F,
  };
  // [t, yaw, pitch, distance]: the side view for the Y slide, the front view for the X slide, a high view for the workspace box
  const CAMK = [
    [0.0, 38, 20, 22],
    [2.4, 34, 20, 22],
    [4.0, 18, 19, 21],
    [5.8, 18, 19, 21],
    [6.4, 72, 18, 21],
    [7.8, 72, 18, 21],
    [8.4, 40, 22, 21],
    [9.8, 40, 22, 21],
    [11.6, 28, 24, 22],
    [13.0, 44, 20, 22],
    [15.0, 44, 20, 22],
    [15.8, 32, 27, 24],
    [17.4, 50, 24, 24],
    [18.4, 38, 20, 22],
    [23, 38, 20, 22],
    [40, 38, 20, 22],
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
  const scaleAt = (p) => cam.F / (cam.dist - toView(p)[2]);
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

  // ---- model building: polygons in page coordinates at the home pose (all joint values zero); a part is moved by its offset
  const mkPart = () => ({ polys: [], off: [0, 0, 0], alpha: 1 });
  const EDGE = "rgba(228,234,255,0.62)";
  const addPoly = (part, v, n, c, o) =>
    part.polys.push({
      v,
      n,
      c,
      sp: (o && o.sp) || 0,
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
  /** a frustum (or cylinder when r0 = r1) around an axis: ax = "x" | "y" | "z", centred on (c0, c1) in the other two, from w0 to w1 */
  function cylP(part, ax, c0, c1, r0, r1, w0, w1, da, col, o) {
    const mp = (u, v, w) =>
      ax === "z" ? [c0 + u, c1 + v, w] : ax === "y" ? [c0 + u, w, c1 + v] : [w, c0 + u, c1 + v];
    const mn = (u, v, w) => (ax === "z" ? [u, v, w] : ax === "y" ? [u, w, v] : [w, u, v]);
    const k = (r1 - r0) / (w1 - w0);
    const kn = Math.hypot(1, k);
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
          mp(r0 * ca, r0 * sa, w0),
          mp(r0 * cb, r0 * sb, w0),
          mp(r1 * cb, r1 * sb, w1),
          mp(r1 * ca, r1 * sa, w1),
        ],
        mn(Math.cos(m) / kn, Math.sin(m) / kn, -k / kn),
        col,
        so,
      );
    }
    if (o && o.caps) {
      const ring = (r, w) => {
        const pts = [];
        for (let a = 0; a < 360 - 1e-9; a += da)
          pts.push(mp(r * Math.cos(a * DEG), r * Math.sin(a * DEG), w));
        return pts;
      };
      if (r1 > 0) addPoly(part, ring(r1, w1), mn(0, 0, 1), col, o);
      if (r0 > 0) addPoly(part, ring(r0, w0).reverse(), mn(0, 0, -1), col, o);
    }
  }
  /** a cylinder with flanges: n thin wider discs along it, like the ribbed housings of the real arm */
  function ribbed(part, ax, c0, c1, r, w0, w1, n, body, rib, o) {
    cylP(part, ax, c0, c1, r, r, w0, w1, 10, body, Object.assign({ sp: 0.2 }, o));
    for (let i = 0; i < n; i++) {
      const w = w0 + ((w1 - w0) * (i + 0.5)) / n;
      cylP(part, ax, c0, c1, r * 1.13, r * 1.13, w - 0.05, w + 0.05, 10, rib, {
        caps: true,
        edge: EDGE,
      });
    }
  }
  const GLOW = { em: 0.9, emc: [0, 136, 255] };

  // ---- the robot: the plate, the rail, the carriage with its post and arm, the slider with its sleeve, the vertical rod with the gripper
  const plate = mkPart(),
    cX = mkPart(),
    cS = mkPart(),
    cZ = mkPart();
  const BODY = [26, 30, 56],
    BODYD = [17, 19, 36],
    RIB = [58, 64, 104],
    GRIP = [88, 94, 132];
  // plate: a slab with two nested square outlines
  boxP(plate, -3.9, 3.9, 0, 0.3, -3.2, 3.2, BODYD, { edge: EDGE });
  for (const [hx, hz, w] of [
    [3.55, 2.75, 0.07],
    [3.35, 2.55, 0.05],
  ]) {
    boxP(plate, -hx, hx, 0.3, 0.33, -hz - w, -hz + w, [190, 196, 225], { edge: null });
    boxP(plate, -hx, hx, 0.3, 0.33, hz - w, hz + w, [190, 196, 225], { edge: null });
    boxP(plate, -hx - w, -hx + w, 0.3, 0.33, -hz, hz, [190, 196, 225], { edge: null });
    boxP(plate, hx - w, hx + w, 0.3, 0.33, -hz, hz, [190, 196, 225], { edge: null });
  }
  // the X rail with a glowing strip along it
  boxP(plate, -3.75, 3.75, 0.33, 0.5, 2.7, 3.1, BODY, { edge: EDGE });
  boxP(plate, -3.65, 3.65, 0.5, 0.54, 2.86, 2.94, [0, 136, 255], GLOW);
  boxP(plate, -3.85, -3.65, 0.33, 0.7, 2.65, 3.15, BODY, { edge: EDGE });
  boxP(plate, 3.65, 3.85, 0.33, 0.7, 2.65, 3.15, BODY, { edge: EDGE });
  // carriage (joint 1): the block on the rail, the post, the arm (a ribbed beam along Y) with its glowing end ring
  boxP(cX, -3.6, -2.4, 0.5, 1.0, 2.6, 3.2, BODY, { edge: EDGE });
  boxP(cX, -3.3, -2.7, 1.0, 5.6, 2.62, 3.18, BODY, { edge: EDGE });
  boxP(cX, -3.4, -2.6, 5.6, 5.72, 2.55, 3.25, BODYD, { edge: EDGE });
  ribbed(cX, "z", -3, 5.2, 0.32, -2.95, 2.62, 14, BODY, RIB, { caps: true });
  cylP(
    cX,
    "z",
    -3,
    5.2,
    0.4,
    0.4,
    -3.0,
    -2.93,
    10,
    [0, 136, 255],
    Object.assign({ caps: true }, GLOW),
  );
  // slider (joint 2): the block around the arm and the sleeve under it
  boxP(cS, -3.5, -2.5, 4.75, 5.65, 1.45, 2.55, BODY, { edge: EDGE });
  boxP(cS, -3.2, -2.8, 5.65, 5.8, 1.6, 2.4, BODYD, { edge: EDGE });
  ribbed(cS, "y", -3, 2.0, 0.4, 4.2, 4.75, 3, BODY, RIB, { caps: true });
  // vertical rod (joint 3) with the conical gripper; its apex is the tip of the robot
  cylP(cZ, "y", -3, 2.0, 0, 0.32, 0.3, 0.85, 10, GRIP, { sp: 0.8 });
  cylP(
    cZ,
    "y",
    -3,
    2.0,
    0.37,
    0.37,
    0.85,
    0.97,
    10,
    [0, 136, 255],
    Object.assign({ caps: true }, GLOW),
  );
  cylP(cZ, "y", -3, 2.0, 0.2, 0.2, 0.97, 4.5, 10, GRIP, { sp: 0.8, caps: true });
  const PARTS = [plate, cX, cS, cZ];

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
          const vw = toView([v[0] + part.off[0], v[1] + part.off[1], v[2] + part.off[2]]);
          vv.push(vw);
          mx += vw[0];
          my += vw[1];
          mz += vw[2];
        }
        const nv = vv.length;
        mx /= nv;
        my /= nv;
        mz /= nv;
        const n = rotN(pl.n);
        const toCam = [-mx, -my, cam.dist - mz];
        if (n[0] * toCam[0] + n[1] * toCam[1] + n[2] * toCam[2] <= 0) continue;
        const d = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const k = 0.8 + 0.4 * d;
        let r = pl.c[0] * k,
          g = pl.c[1] * k,
          b = pl.c[2] * k;
        if (pl.sp > 0) {
          const s =
            Math.pow(Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]), 24) *
            pl.sp *
            40;
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

  // ---------------------------------------------------------------- DOM labels that follow 3D points
  const EL = {};
  ["lX", "lY", "lZ", "ld1", "ld2", "ld3", "lP", "lPs", "lbox"].forEach(
    (id) => (EL[id] = document.getElementById(id)),
  );
  const setOp = (id, v) => {
    if (EL[id]) EL[id].style.opacity = String(Math.max(0, Math.min(1, v)));
  };
  function tagLabel(id, world, a, dx, dy) {
    setOp(id, a);
    if (EL[id]) {
      const p = screenOf(world);
      EL[id].style.transform =
        `translate(${(p[0] - VIEW.cx + (dx || 0)).toFixed(1)}px,${(p[1] - VIEW.cy + (dy || 0)).toFixed(1)}px)`;
    }
  }
  function arrow3(p, q, color, w, a, both) {
    if (a <= 0.01) return;
    const A = screenOf(p),
      B = screenOf(q);
    line([A, B], color, w, a, 8);
    const ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
    arrowHead(B[0], B[1], ang, color, a, 13);
    if (both) arrowHead(A[0], A[1], ang + Math.PI, color, a, 13);
  }

  // ================================================================ the scene at time t
  function drawScene(t, d) {
    const Xc = O[0] + d[0],
      zs = O[2] - d[1];
    cX.off = [d[0], 0, 0];
    cS.off = [d[0], 0, -d[1]];
    cZ.off = [d[0], d[2], -d[1]];
    // the soft glow under the plate: the robot stands on a lit floor
    const base = screenOf([0, 0, 0]);
    const g = ctx.createRadialGradient(base[0], base[1] + 10, 20, base[0], base[1] + 10, 330);
    g.addColorStop(0, "rgba(0,136,255,0.22)");
    g.addColorStop(1, "rgba(0,136,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(90, 330, 900, 620);
    drawParts(PARTS);

    const tcp = [Xc, O[1] + d[2], zs];
    // the axes of the robot frame at its origin, with their names
    const aAx = stageA(t, T.st[0], 0.4);
    const L0 = 1.5;
    [
      [[L0, 0, 0], 0, "lX"],
      [[0, L0, 0], 1, "lY"],
      [[0, 0, L0], 2, "lZ"],
    ].forEach(([v, k, id]) => {
      const q = toPage(v[0], v[1], v[2]);
      arrow3(O, q, AX[k], 4, aAx);
      const sa = screenOf(O),
        sb = screenOf(q),
        len = Math.hypot(sb[0] - sa[0], sb[1] - sa[1]) || 1;
      tagLabel(id, q, aAx, ((sb[0] - sa[0]) / len) * 30, ((sb[1] - sa[1]) / len) * 30);
    });
    // the slide arrows of the three joints: strong while they are introduced, faint afterwards
    const aSl = box(t, T.st[0] + 0.2, T.st[1] + 0.6, 0.35, 0.5);
    const fa = (a0, a1) => Math.max(0.28 * stageA(t, a0, 0.3), box(t, a0, a1, 0.3, 0.4));
    arrow3(
      [-3.5, 0.45, 3.55],
      [3.5, 0.45, 3.55],
      RED,
      5,
      Math.max(aSl, fa(T.st[1], T.st[1] + 1.8)),
      true,
    );
    arrow3(
      [Xc, 5.95, 2.85],
      [Xc, 5.95, -2.85],
      PURPLE,
      5,
      Math.max(aSl, fa(T.st[2], T.st[2] + 1.8)),
      true,
    );
    arrow3(
      [Xc + 0.85, 0.3, zs],
      [Xc + 0.85, 2.8, zs],
      BLUE,
      5,
      Math.max(aSl, fa(T.st[3], T.st[3] + 1.8)),
      true,
    );
    tagLabel(
      "ld1",
      [0, 0.45, 3.55],
      Math.min(1, 3.6 * Math.max(aSl, fa(T.st[1], T.st[1] + 1.8))),
      0,
      26,
    );
    tagLabel(
      "ld2",
      [Xc, 5.95, 0],
      Math.min(1, 3.6 * Math.max(aSl, fa(T.st[2], T.st[2] + 1.8))),
      0,
      -26,
    );
    tagLabel(
      "ld3",
      [Xc + 0.85, 1.6, zs],
      Math.min(1, 3.6 * Math.max(aSl, fa(T.st[3], T.st[3] + 1.8))),
      34,
      0,
    );

    // the three slides add up: X from the origin, then Y, then Z, to the tip
    const pX = [Xc, O[1], O[2]],
      pXY = [Xc, O[1], zs];
    const aSX = stageA(t, T.st[1], 0.3),
      aSY = stageA(t, T.st[2], 0.3),
      aSZ = stageA(t, T.st[3], 0.3);
    const seg3 = (p, q, col, a) => {
      if (a <= 0.01) return;
      const A = screenOf(p),
        B = screenOf(q);
      line([A, B], col, 6, a, 14);
    };
    seg3(O, pX, RED, aSX);
    seg3(pX, pXY, PURPLE, aSY);
    seg3(pXY, tcp, BLUE, aSZ);
    // a dashed drop line from the tip to the floor, as in the picture of the arm
    if (d[2] > 0.05 && aSZ > 0.01)
      line([screenOf(tcp), screenOf(pXY)], WHITE, 2, 0.5 * aSZ, 0, [7, 7]);

    // the workspace: a box 600 x 400 x 250 mm; its corners are the reach of the robot
    const aBox = box(t, T.st[6], T.lock + 0.3, 0.4, 0.6);
    if (aBox > 0.01) {
      const c = [];
      for (let i = 0; i < 8; i++)
        c.push(toPage(i & 1 ? RANGE[0] : 0, i & 2 ? RANGE[1] : 0, i & 4 ? RANGE[2] : 0));
      const edges = [
        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7],
        [0, 2],
        [1, 3],
        [4, 6],
        [5, 7],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ];
      edges.forEach(([a, b]) =>
        line([screenOf(c[a]), screenOf(c[b])], PURPLE, 3, 0.85 * aBox, 10, [10, 8]),
      );
      c.forEach((p) => {
        const s = screenOf(p);
        dot(s[0], s[1], 5, WHITE, 0.9 * aBox, 10);
      });
    }
    tagLabel("lbox", toPage(RANGE[0] / 2, RANGE[1], RANGE[2]), aBox, 0, -38);

    // the target P* (inverse kinematics): a blue sphere with a dashed orbit and a drop line to the floor
    const aT = box(t, T.sw[7], T.lock + 0.5, 0.3, 0.6);
    const Pt = toPage(4.5, 3, 1);
    if (aT > 0.01) {
      const s = screenOf(Pt),
        r = (15 * scaleAt(Pt)) / 60;
      const fl = screenOf(toPage(4.5, 3, 0));
      line([s, fl], WHITE, 2, 0.5 * aT, 0, [7, 7]);
      ctx.save();
      ctx.globalAlpha = 0.7 * aT;
      ctx.strokeStyle = WHITE;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(s[0], s[1], r * 2.4, r * 1.2, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
      const gg = ctx.createRadialGradient(s[0] - r * 0.3, s[1] - r * 0.3, 1, s[0], s[1], r * 1.2);
      gg.addColorStop(0, "#FFFFFF");
      gg.addColorStop(1, BLUE);
      ctx.save();
      ctx.globalAlpha = aT;
      ctx.fillStyle = gg;
      ctx.shadowColor = BLUE;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(s[0], s[1], r * 1.1, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    }
    tagLabel("lPs", Pt, aT, 26, -26);

    // the tip: a red marker with a white core, as in the picture of the arm; it flares when the target is reached
    const reach = box(t, 18.9, 19.8, 0.15, 0.5);
    const ts = screenOf(tcp);
    dot(ts[0], ts[1], 16 + 14 * reach, RED, 0.25 + 0.3 * reach, 26);
    dot(ts[0], ts[1], 8, RED, 1, 12);
    dot(ts[0], ts[1], 3.5, WHITE, 1, 0);
    tagLabel("lP", tcp, stageA(t, T.st[4], 0.4) * (1 - aT), 28, 24);
  }

  // ---------------------------------------------------------------- the readouts: joint space (input) and task space (output)
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
  function numText(s, x, y, size, color, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.font = `${size}px KaTeX_Main`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function drawHud(t, d) {
    const a = 1;
    hudBox(HUD.x, HUD.yi, HUD.w, HUD.hi, a);
    hudBox(HUD.x, HUD.yo, HUD.w, HUD.ho, a);
    for (let i = 0; i < 3; i++) {
      const y = HUD.yi + 64 + 40 * i,
        x0 = HUD.x + 80,
        x1 = HUD.x + 232;
      const f = clamp01(d[i] / RANGE[i]);
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
        AX[i],
        4,
        1,
        8,
      );
      dot(x0 + (x1 - x0) * f, y, 9, WHITE, 1, 10);
      dot(x0 + (x1 - x0) * f, y, 5, AX[i], 1, 0);
      numText(String(Math.round(d[i] * 100)), HUD.x + 272, y, 28, WHITE, 1);
    }
    const xs = [HUD.x + 52, HUD.x + 155, HUD.x + 258];
    for (let i = 0; i < 3; i++)
      numText(String(Math.round(d[i] * 100)), xs[i], HUD.yo + 92, 32, AX[i], 1);
  }

  // ---------------------------------------------------------------- the range bars (workspace stage)
  function drawRanges(t, d) {
    const a = box(t, T.rng, T.inv - 0.2, 0.3, 0.2);
    if (a <= 0.01) return;
    for (let i = 0; i < 3; i++) {
      const y = [1040, 1110, 1180][i],
        x0 = 540,
        x1 = 880;
      const f = clamp01(d[i] / RANGE[i]);
      line(
        [
          [x0, y],
          [x1, y],
        ],
        "rgba(255,255,255,0.28)",
        8,
        a,
        0,
      );
      line(
        [
          [x0, y],
          [x0 + (x1 - x0) * f, y],
        ],
        AX[i],
        8,
        a,
        12,
      );
      dot(x0 + (x1 - x0) * f, y, 12, WHITE, a, 12);
      numText(String(Math.round(d[i] * 100)), 940, y, 30, AX[i], a);
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
    const d = dAt(t);
    setCam(t);
    drawScene(t, d);
    drawHud(t, d);
    drawRanges(t, d);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
