// Timeline for "THE LAPLACE TRANSFORM: THE s-PLANE AS A LANDSCAPE" (24.2 s).
// |H(s)| over the s-plane is drawn on a canvas from the time alone (hf-seek protocol): the 3D surface with the simulator's
// grid, height law, heat colormap and isometric camera; poles (rose x) and zeros (blue o) on the floor and on the map; h(t) and |H(jw)|.
// Text, counters and cards are GSAP. Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, MORPH, CAM, PS, PR, MAP, RP } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished landscape
    [1.6, "snap"], // rewind
    [2.2, "click"], // a pole is a mountain
    [2.4, "snap"], // the first landscape rises: 1/(s+1)
    [4.9, "click"], // swap the function
    [5.1, "snap"], // complex poles
    [7.6, "click"], // push the poles right
    [7.8, "snap"], // unstable
    [10.3, "click"], // on the jw axis
    [10.5, "snap"], // a pure sine
    [13.0, "click"], // add zeros
    [13.2, "snap"], // the notch
    [15.7, "click"], // cut along the jw axis
    [15.9, "snap"], // the slice
    [17.9, "thump"], // lock
    [18.9, "click"], // poles make peaks, zeros make holes
    [20.2, "snap"], // CTA reveal
    [22.6, "click"], // engagement pulse
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

  // ---------------------------------------------------------------- 0.0 - 2.2  the finished landscape, then the rewind
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
  fade("#c0", T.rewind0, 0.2);
  fade("#fm0", T.rewind0, 0.2);
  curCount = null;
  curForm = null;

  // ---------------------------------------------------------------- the five functions: the landscape snaps from one to the next
  for (let k = 0; k < 5; k++) {
    const st = T.st[k],
      sw = T.sw[k];
    hit(st, "click", "#bn" + (k + 1));
    bnSwap("#bn" + (k + 1), st);
    hit(sw, "snap", "#c" + (k + 1));
    cswap("#c" + (k + 1), sw, true);
    fswap("#f" + (k + 1), sw + 0.1);
    ft("#sw", { opacity: 0 }, { opacity: 0.5, duration: 0.08, ease: "power2.out" }, sw);
    tl.fromTo(
      "#sw",
      { opacity: 0.5 },
      { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
      sw + 0.08,
    );
  }

  // ---------------------------------------------------------------- the cut along the jw axis: the frequency response
  hit(T.cutBan, "click", "#bn6");
  bnSwap("#bn6", T.cutBan);
  hit(T.cut, "snap", "#c6");
  cswap("#c6", T.cut, true);
  fswap("#f6", T.cut + 0.1);
  fade("#lt", T.cut, 0.15);
  pop("#lw", T.cut, 6);

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
  fswap("#f7", LK + 0.5);
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

  tl.to({}, { duration: 0.0001 }, 24.1999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t || a.kind.localeCompare(b.kind));

  // ================================================================ canvas
  const cvs = document.getElementById("cv");
  const mainCtx = cvs.getContext("2d");
  let ctx = mainCtx;
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = Math.round(1080 * DPR);
  cvs.height = Math.round(1920 * DPR);
  const oc = document.createElement("canvas"); // off-screen copy of the hook scene (the rewind glitch cuts it into strips)
  oc.width = cvs.width;
  oc.height = cvs.height;
  const octx = oc.getContext("2d");

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
  const { N, EXT, NV, HA, SYS, ORDER, SURF, LUT, gx, gy, proj } = LAP;
  const N1 = N + 1;
  const CPH = Math.cos(LAP.PH),
    SPH = Math.sin(LAP.PH);
  const XP = new Float32Array(NV),
    ZP = new Float32Array(NV);
  for (let i = 0; i <= N; i++)
    for (let j = 0; j <= N; j++) {
      const r = proj(gx[j] / EXT, 0, -gy[i] / EXT);
      XP[i * N1 + j] = r[0];
      ZP[i * N1 + j] = r[2];
    }
  // quads painted far to near (depth of the centre on the floor)
  const QORD = (() => {
    const ids = [],
      d = [];
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const a = i * N1 + j;
        ids.push(a);
        d.push(ZP[a] + ZP[a + 1] + ZP[a + N1] + ZP[a + N1 + 1]);
      }
    const o = ids.map((_, k) => k).sort((p, q) => d[p] - d[q]);
    return Uint32Array.from(o.map((k) => ids[k]));
  })();
  const HG = new Float32Array(NV),
    CO = new Float32Array(NV),
    SH = new Float32Array(NV),
    PX = new Float32Array(NV),
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
  /** screen position of the s-plane point (sigma, omega) lifted to the surface height hh (0 = on the floor) */
  const P3 = (sig, om, hh) => {
    const r = proj(sig / EXT, hh * CAM.HM, -om / EXT);
    return [CAM.CX + CAM.S * r[0], CAM.CY - CAM.S * r[1]];
  };
  function floorGrid(alpha) {
    // the floor: a slate plate, one-unit grid, the two axes (the jw axis is sigma = 0)
    const c = [P3(-EXT, -EXT, 0), P3(EXT, -EXT, 0), P3(EXT, EXT, 0), P3(-EXT, EXT, 0)];
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(15,23,42,.9)";
    poly(c);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (let v = -3; v <= 3; v++) {
      const ax = v === 0;
      line([P3(v, -EXT, 0), P3(v, EXT, 0)], SLATE, ax ? 2.4 : 1.2, alpha * (ax ? 0.6 : 0.16));
      line([P3(-EXT, v, 0), P3(EXT, v, 0)], SLATE, ax ? 2.4 : 1.2, alpha * (ax ? 0.6 : 0.16));
    }
    line([...c, c[0]], SLATE, 2, alpha * 0.45);
  }
  function drawSurface(a, b, m, alpha) {
    if (alpha <= 0.001) return;
    const S = CAM.S;
    for (let v = 0; v < NV; v++) {
      const hh = a.hgt[v] + (b.hgt[v] - a.hgt[v]) * m;
      HG[v] = hh;
      CO[v] = a.col[v] + (b.col[v] - a.col[v]) * m;
      SH[v] = a.shade[v] + (b.shade[v] - a.shade[v]) * m;
      PX[v] = CAM.CX + S * XP[v];
      PY[v] = CAM.CY - S * (hh * CAM.HM * CPH - ZP[v] * SPH);
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 0.8;
    ctx.lineJoin = "round";
    for (let q = 0; q < QORD.length; q++) {
      const v0 = QORD[q],
        v1 = v0 + 1,
        v2 = v0 + N1 + 1,
        v3 = v0 + N1;
      const ci = Math.max(
        0,
        Math.min(255, Math.round(((CO[v0] + CO[v1] + CO[v2] + CO[v3]) / 4) * 255)),
      );
      const fi = Math.max(
        0,
        Math.min(15, Math.round(((SH[v0] + SH[v1] + SH[v2] + SH[v3]) / 4) * 15)),
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
  /** poles (rose x with a stem up to the peak) and zeros (blue o) of a system, standing on the floor of the landscape */
  function drawMarks3D(key, alpha) {
    if (alpha <= 0.001) return;
    const S = SYS[key];
    for (const p of S.p) {
      const f = P3(p[0], p[1], 0),
        tp = P3(p[0], p[1], HA);
      line([f, tp], ROSE, 3, 0.85 * alpha, 8, [6, 6]);
      cross(f[0], f[1], 9 * (0.6 + 0.4 * alpha), ROSE, alpha, 4);
      dot(tp[0], tp[1], 6 * (0.6 + 0.4 * alpha), WHITE, alpha, 16);
    }
    for (const z of S.z) {
      const f = P3(z[0], z[1], 0);
      ring(f[0], f[1], 10 * (0.6 + 0.4 * alpha), SBLUE, alpha, 4);
    }
  }
  function ripple(u) {
    // a ring runs over the floor from the origin when the landscape snaps
    if (u < 0 || u > 0.6) return;
    const v = u / 0.6,
      r = EXT * 1.5 * easeOut(v);
    const pts = [];
    for (let a = 0; a <= 64; a++) {
      const ph = (a / 64) * 2 * Math.PI;
      pts.push(P3(r * Math.cos(ph), r * Math.sin(ph), 0));
    }
    withClip(PS, () => line(pts, CYAN, 4, 0.8 * (1 - v), 12));
  }
  function legend() {
    cross(815, 392, 9, ROSE, 1, 4);
    ring(815, 436, 10, SBLUE, 1, 4);
  }

  // ---------------------------------------------------------------- the pole-zero map (bottom left)
  const mp = (sig, om) => [MAP.cx + (sig / EXT) * MAP.half, MAP.cy - (om / EXT) * MAP.half];
  function drawMapFrame(alpha, rhp, jwp) {
    const c = [mp(-EXT, -EXT), mp(EXT, -EXT), mp(EXT, EXT), mp(-EXT, EXT)];
    if (rhp > 0.001) {
      ctx.save();
      ctx.globalAlpha = 0.22 * rhp;
      ctx.fillStyle = ROSE;
      ctx.fillRect(mp(0, EXT)[0], mp(0, EXT)[1], MAP.half, 2 * MAP.half);
      ctx.restore();
    }
    for (let v = -3; v <= 3; v++) {
      const ax = v === 0;
      line([mp(v, -EXT), mp(v, EXT)], SLATE, ax ? 2 : 1, alpha * (ax ? 0.6 : 0.14));
      line([mp(-EXT, v), mp(EXT, v)], SLATE, ax ? 2 : 1, alpha * (ax ? 0.6 : 0.14));
    }
    line([...c, c[0]], SLATE, 1.6, alpha * 0.4);
    if (jwp > 0.001) line([mp(0, -EXT), mp(0, -EXT + 2 * EXT * jwp)], CYAN, 4, 0.95, 10);
  }
  function drawMapMarks(key, alpha) {
    if (alpha <= 0.001) return;
    const S = SYS[key];
    for (const p of S.p) {
      const q = mp(p[0], p[1]);
      cross(q[0], q[1], 8 * (0.6 + 0.4 * alpha), ROSE, alpha, 3.5);
    }
    for (const z of S.z) {
      const q = mp(z[0], z[1]);
      ring(q[0], q[1], 8 * (0.6 + 0.4 * alpha), SBLUE, alpha, 3.5);
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
    rightAxes(alpha, "t");
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
  function freqAt(om) {
    return LAP.mag(SYS.E, 0, om);
  }
  function drawFreq(p, alpha) {
    rightAxes(alpha, "w");
    const pts = [];
    const n = Math.round(400 * clamp01(p));
    for (let i = 0; i <= n; i++) {
      const om = -EXT + (2 * EXT * i) / 400;
      pts.push([rx((om + EXT) / (2 * EXT)), RP.y0 - freqAt(om) * fScale]);
    }
    withClip(PR, () => {
      line(pts, SBLUE, 5, alpha, 12);
      for (const om of [-1, 1])
        if (p * 2 * EXT - EXT >= om) ring(rx((om + EXT) / (2 * EXT)), RP.y0, 8, SBLUE, alpha, 3.5);
      if (pts.length > 1) dot(pts[pts.length - 1][0], pts[pts.length - 1][1], 6, WHITE, alpha, 14);
    });
  }

  // ---------------------------------------------------------------- the jw cut on the landscape
  const JC = (() => {
    let j = 0;
    for (let k = 0; k < gx.length; k++) if (Math.abs(gx[k]) < 1e-12) j = k;
    return j;
  })();
  function drawCut(p, alpha) {
    // the sigma = 0 section of the landscape, a curtain down to the floor, and a point that travels along it
    const top = [],
      bot = [];
    const n = Math.round(N * clamp01(p));
    const surfE = SURF.E;
    for (let i = 0; i <= n; i++) {
      const hh = surfE.hgt[i * N1 + JC];
      top.push(P3(0, gy[i], hh + 0.02));
      bot.push(P3(0, gy[i], 0));
    }
    if (top.length > 1) {
      ctx.save();
      ctx.globalAlpha = 0.2 * alpha;
      ctx.fillStyle = CYAN;
      poly([...top, ...bot.slice().reverse()]);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      line(top, CYAN, 5, alpha, 14);
      const e = top[top.length - 1];
      dot(e[0], e[1], 7, WHITE, alpha, 18);
    }
  }

  // ---------------------------------------------------------------- the scenes
  function flatSet() {
    return SURF.FLAT;
  }
  function hookScene(a) {
    ctx.save();
    ctx.globalAlpha = a;
    floorGrid(1);
    drawSurface(SURF.E, SURF.E, 0, 1);
    drawMarks3D("E", 1);
    drawMapFrame(1, 0, 0);
    drawMapMarks("E", 1);
    drawH("E", 1, 1);
    legend();
    ctx.restore();
  }
  function drawGlitch(t) {
    const p = clamp01((t - T.rewind0) / (T.s1 - T.rewind0));
    const a = 1 - smooth(p);
    const frame = Math.floor(t * 24);
    // the hook scene is drawn once off-screen, then cut into shifted strips
    ctx = octx;
    octx.setTransform(DPR, 0, 0, DPR, 0, 0);
    octx.clearRect(0, 0, 1080, 1920);
    hookScene(1);
    ctx = mainCtx;
    floorGrid(1);
    const strips = 16,
      y0 = 340,
      sh = 890 / strips;
    for (let s = 0; s < strips; s++) {
      const g = CFG.glitch[(s * 7 + frame * 3) % CFG.glitch.length];
      const dx = (g - 0.5) * 2 * 110 * (0.25 + p);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.drawImage(
        oc,
        0,
        (y0 + s * sh) * DPR,
        oc.width,
        (sh + 1) * DPR,
        dx,
        y0 + s * sh,
        1080,
        sh + 1,
      );
      ctx.restore();
    }
    legend();
  }
  function stagedScene(t) {
    floorGrid(1);
    legend();
    let k = -1;
    for (let i = 0; i < T.sw.length; i++) if (t >= T.sw[i]) k = i;
    if (k < 0) {
      drawMapFrame(1, 0, 0);
      rightAxes(1, "t");
      return;
    }
    const to = SURF[ORDER[k]],
      from = k === 0 ? flatSet() : SURF[ORDER[k - 1]];
    const u = t - T.sw[k],
      m = easeOut(u / MORPH[k]);
    drawSurface(from, to, m, 1);
    // markers: the new ones come up, the old ones go
    if (k > 0) {
      drawMarks3D(ORDER[k - 1], 1 - m);
    }
    drawMarks3D(ORDER[k], k === 0 ? easeOut(u / 0.35) : m);
    if (t >= T.cut) drawCut(clamp01((t - T.cut) / 1.6), 1);
    // the cut is a section of the surface: its travelling dot keeps running after the lock
    if (t >= T.cut + 1.6) {
      const ph = ((((t - T.cut - 1.6) / 2.6) % 1) + 1) % 1;
      const om = -EXT + 2 * EXT * smooth(ph);
      const i = Math.max(
        0,
        Math.min(
          N,
          gy.findIndex((v) => v >= om - 1e-9),
        ),
      );
      const q = P3(0, gy[i], SURF.E.hgt[i * N1 + JC] + 0.02);
      dot(q[0], q[1], 8, WHITE, 1, 20);
      cutDot = [q, gy[i]];
    } else cutDot = null;
    ripple(u);
    // the map
    const rhp = k === 2 ? m : k === 3 ? 1 - m : 0; // the right half-plane is shaded while the poles are in it
    const jwp = t >= T.cut ? clamp01((t - T.cut) / 1.6) : 0;
    drawMapFrame(1, rhp, jwp);
    if (k > 0) drawMapMarks(ORDER[k - 1], 1 - m);
    drawMapMarks(ORDER[k], k === 0 ? easeOut(u / 0.35) : m);
    // right panel: h(t) of the current function, then |H(jw)| after the cut
    if (t < T.cut) drawH(ORDER[k], (t - T.sw[k] - 0.1) / 1.0, 1);
    else {
      const pf = clamp01((t - T.cut) / 1.6);
      drawFreq(pf, 1);
      if (cutDot) {
        const om = cutDot[1];
        withClip(PR, () =>
          dot(rx((om + EXT) / (2 * EXT)), RP.y0 - freqAt(om) * fScale, 8, WHITE, 1, 18),
        );
      }
    }
  }
  let cutDot = null;
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
    ctx = mainCtx;
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
