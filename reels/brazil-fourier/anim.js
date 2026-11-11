// Timeline for "THE FLAG OF BRAZIL, DRAWN BY ROTATING CIRCLES" (22.4 s).
// The dots, circles, traces and fills are drawn on a canvas from the time alone (hf-seek protocol); text, counters and cards are GSAP.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, LIVE_N, FLAG: F } = CFG;
  const { CX, CY, PX } = CFG.px;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished flag
    [1.4, "snap"], // the flag lets go of its colour
    [2.0, "click"], // the field starts
    [4.4, "snap"], // the field is drawn
    [4.7, "click"], // the rhombus starts
    [6.9, "snap"], // the rhombus is drawn
    [7.2, "click"], // the disc starts
    [8.4, "snap"], // the disc is drawn
    [8.7, "click"], // the band starts
    [10.4, "snap"], // the band is drawn
    [10.7, "click"], // the stars start
    [12.8, "snap"], // the stars are drawn
    [13.4, "thump"], // lock
    [14.2, "click"], // only rotating circles
    [14.8, "snap"], // the flag turns back into dots
    [17.1, "snap"], // the equations are all there
    [17.6, "snap"], // CTA reveal
    [20.2, "click"], // engagement pulse
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
    curCount = "#ch",
    curForm = "#fh";
  function bnSwap(n, t) {
    ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
    curBanner = n;
  }
  function cswap(n, t) {
    if (curCount)
      ft(curCount, { opacity: 1 }, { opacity: 0, duration: 0.06, ease: "power1.in" }, t);
    ft(
      n,
      { opacity: 0, scale: 1.3 },
      { opacity: 1, scale: 1, duration: 0.28, ease: "back.out(2)" },
      t,
    );
    curCount = n;
  }
  function fswap(n, t) {
    if (curForm) ft(curForm, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.06);
    curForm = n;
  }

  // ---------------------------------------------------------------- 0.0 - 1.8  the finished flag, then it lets go of its colour
  hit(0.0, "thump", "#flash0");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  hit(T.hold, "snap", "#fc");
  ft("#fc", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, T.hold);
  tl.fromTo(
    "#fc",
    { opacity: 1 },
    { opacity: 0, duration: 0.6, ease: "power2.in", immediateRender: false },
    T.hold + 0.15,
  );

  // ---------------------------------------------------------------- the shapes, one after the other
  T.roles.forEach((role, i) => {
    hit(T.a[i], "click", "#l" + i);
    cswap("#l" + i, T.a[i]);
    fswap("#fl" + i, T.a[i]);
    bnSwap("#bnR" + i, T.a[i]);
    hit(T.b[i], "snap", "#pf" + i);
    ft("#pf" + i, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T.b[i]);
  });

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
  ft(curCount, { scale: 1 }, { scale: 1.12, duration: 0.15, ease: "power2.out" }, LK);
  tl.fromTo(
    curCount,
    { scale: 1.12 },
    { scale: 1, duration: 0.35, ease: "power2.inOut", immediateRender: false },
    LK + 0.15,
  );
  ft(
    "#chkp",
    { opacity: 1, strokeDashoffset: 130 },
    { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" },
    LK + 0.35,
  );
  hit(T.banF, "click", "#bnF2");
  bnSwap("#bnF2", T.banF);

  // ---------------------------------------------------------------- the ending: the flag turns back into the equations (the opening, played backwards)
  hit(T.xr0, "snap", "#rw");
  bnSwap("#bnE", T.xr0);
  // the counter, the formula, the progress squares and the check mark make room for the equations
  ft(curCount, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, T.xr0);
  ft(curForm, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, T.xr0);
  ft(".pip", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, T.xr0);
  ft("#chkp", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, T.xr0);
  ft("#rw", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, T.xr0);
  tl.fromTo(
    "#rw",
    { opacity: 1 },
    { opacity: 0, duration: 0.6, ease: "power2.in", immediateRender: false },
    T.xr0 + 0.45,
  );
  // each equation comes back as its dots land (the same delays as before, mirrored in time)
  CFG.items.forEach((q) =>
    ft(
      "#" + q.id,
      { opacity: 0, scale: 0.55 },
      { opacity: q.op, scale: 1, duration: 0.45, ease: "power2.out" },
      Math.round((T.xr0 + (T.xf1 - T.xf0) + 0.05 - q.delay) * 1000) / 1000,
    ),
  );
  hit(T.xr1, "snap", "#fe");
  ft("#fe", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, T.xr1);
  tl.fromTo(
    "#fe",
    { opacity: 1 },
    { opacity: 0, duration: 0.7, ease: "power2.in", immediateRender: false },
    T.xr1 + 0.15,
  );

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

  tl.to({}, { duration: 0.0001 }, 21.7999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t || a.kind.localeCompare(b.kind));

  // ================================================================ canvas
  const cvs = document.getElementById("cv");
  const ctx = cvs.getContext("2d");
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = Math.round(1080 * DPR);
  cvs.height = Math.round(1920 * DPR);

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);

  const FILL = { field: F.field, rhombus: F.rhombus, disc: F.disc, band: F.white, star: F.white };
  const LINE = {
    field: F.field,
    rhombus: F.rhombus,
    disc: F.discLine,
    band: F.white,
    star: F.white,
  };
  const RIDX = { field: 0, rhombus: 1, disc: 2, band: 3, star: 4 };

  // series as typed arrays, terms already sorted by descending |c_n|
  const S = CFG.contours.map((c) => {
    const k = c.terms.length;
    const s = {
      name: c.name,
      role: c.role,
      bx: c.base[0],
      by: c.base[1],
      k,
      n: new Int16Array(k),
      re: new Float64Array(k),
      im: new Float64Array(k),
      mag: new Float64Array(k),
    };
    c.terms.forEach(([n, re, im], i) => {
      s.n[i] = n;
      s.re[i] = re;
      s.im[i] = im;
      s.mag[i] = Math.hypot(re, im);
    });
    return s;
  });
  function at(s, th, N) {
    let x = s.bx,
      y = s.by;
    for (let i = 0; i < s.k; i++) {
      const n = s.n[i];
      if (n > N || n < -N) continue;
      const a = n * th,
        c = Math.cos(a),
        sn = Math.sin(a);
      x += s.re[i] * c - s.im[i] * sn;
      y += s.re[i] * sn + s.im[i] * c;
    }
    return [x, y];
  }
  const curve = (s, N, K) =>
    Array.from({ length: K + 1 }, (_, j) => at(s, (2 * Math.PI * j) / K, N));
  const KFIN = (s) => (s.role === "star" ? 140 : s.role === "disc" ? 180 : 520);
  const FIN = S.map((s) => curve(s, LIVE_N[s.role], KFIN(s)));

  function glow(color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  }
  function path(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }
  function fillShape(i, alpha) {
    const s = S[i];
    if (alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    path(FIN[i]);
    ctx.closePath();
    ctx.fillStyle = FILL[s.role];
    ctx.fill();
    ctx.restore();
  }
  function drawFlag(alpha) {
    for (let i = 0; i < S.length; i++) fillShape(i, alpha);
  }
  function stroke(pts, color, width, alpha, blur, dash) {
    if (pts.length < 2 || alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (dash) ctx.setLineDash(dash);
    if (blur) glow(color, blur);
    path(pts);
    ctx.stroke();
    ctx.restore();
  }

  // ---------------------------------------------------------------- the rig: base, then c_n e^{i n t} chained head to tail
  function tipsAt(s, th) {
    const out = [[s.bx, s.by]];
    let x = s.bx,
      y = s.by;
    for (let i = 0; i < s.k; i++) {
      const a = s.n[i] * th,
        c = Math.cos(a),
        sn = Math.sin(a);
      x += s.re[i] * c - s.im[i] * sn;
      y += s.re[i] * sn + s.im[i] * c;
      out.push([x, y]);
    }
    return out;
  }
  function drawRig(s, th, alpha) {
    const tips = tipsAt(s, th);
    ctx.save();
    ctx.beginPath();
    ctx.rect(30, 340, 1020, 800);
    ctx.clip();
    const K = 26;
    for (let i = 0; i < Math.min(K, s.k); i++) {
      if (s.mag[i] < 1.5) continue;
      ctx.beginPath();
      ctx.arc(tips[i][0], tips[i][1], s.mag[i], 0, 2 * Math.PI);
      ctx.strokeStyle =
        "rgba(255,255,255," + (alpha * (0.14 + 0.32 * (1 - i / K))).toFixed(3) + ")";
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    for (let i = 0; i < s.k; i++) {
      ctx.beginPath();
      ctx.moveTo(tips[i][0], tips[i][1]);
      ctx.lineTo(tips[i + 1][0], tips[i + 1][1]);
      ctx.strokeStyle = "rgba(176,38,255," + (alpha * (i < 14 ? 0.95 : 0.35)).toFixed(3) + ")";
      ctx.lineWidth = i < 14 ? 2.6 : 1.2;
      ctx.stroke();
    }
    const tip = tips[tips.length - 1];
    ctx.globalAlpha = alpha;
    glow(LINE[s.role], 16);
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 6.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }
  function drawTipOnly(s, th, alpha) {
    const tip = at(s, th, 999);
    ctx.save();
    ctx.globalAlpha = alpha;
    glow("#fff", 8);
    ctx.beginPath();
    ctx.arc(tip[0], tip[1], 3.6, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }
  function trace(s, th, alpha, width) {
    const K = Math.max(2, Math.ceil((th / (2 * Math.PI)) * (s.role === "star" ? 120 : 420)) + 2);
    const pts = Array.from({ length: K + 1 }, (_, j) => at(s, (th * j) / K, 999));
    stroke(pts, LINE[s.role], width, alpha, s.role === "star" ? 6 : 14);
  }

  // ---------------------------------------------------------------- the opening: dots leave the equations and form the flag
  function drawDots(t) {
    const t0 = T.xf0;
    if (t < t0 - 0.2 || t > T.xf1 + 0.7) return;
    const out = 1 - smooth((t - T.xf1) / 0.6);
    ctx.save();
    for (const p of CFG.parts) {
      const u = (t - (t0 + p.delay)) / p.dur;
      const appear = clamp01((t - (t0 + p.delay - 0.2)) / 0.2);
      if (appear <= 0) continue;
      const e = smooth(u),
        k = 1 - e;
      const x = k * k * p.sx + 2 * k * e * p.cx + e * e * p.tx;
      const y = k * k * p.sy + 2 * k * e * p.cy + e * e * p.ty;
      ctx.globalAlpha = appear * out;
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(x, y, p.r, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------- the shapes, one after the other
  function drawLive(t) {
    // in the ending the colour leaves the flag while its outline turns into dots
    const flagMul = t >= T.xr0 ? smooth((T.xf1 + 0.5 - (t - T.xr0) - (T.xf1 - 0.3)) / 0.5) : 1;
    const fade = 1 - smooth((t - (T.lock - 0.3)) / 0.3); // the dashed target leaves when the flag is complete
    if (fade > 0.01)
      for (let i = 0; i < S.length; i++)
        stroke(FIN[i], "#FFFFFF", 2, 0.17 * fade * smooth((t - (T.down - 0.2)) / 0.3), 0, [10, 12]);
    const active = [];
    for (let i = 0; i < S.length; i++) {
      const r = RIDX[S[i].role],
        a = T.a[r],
        b = T.b[r];
      if (t >= b) {
        fillShape(i, smooth((t - b) / 0.35) * flagMul);
        stroke(FIN[i], LINE[S[i].role], 2, 0.8 * smooth((t - b) / 0.35) * flagMul);
        if (t < b + 0.3) active.push([i, 2 * Math.PI, 1 - (t - b) / 0.3, true]);
      } else if (t >= a)
        active.push([i, (2 * Math.PI * (t - a)) / (b - a), clamp01((t - a) / 0.25), false]);
    }
    for (const [i, th, al, done] of active) {
      const s = S[i];
      if (s.role === "star") {
        trace(s, th, al * (done ? 0 : 1), 2.4);
        drawTipOnly(s, th, al);
      } else {
        trace(s, th, done ? al : 1, 4.5);
        drawRig(s, th, al);
      }
    }
  }
  function drawLock(t) {
    const u = t - T.lock;
    if (u < 0 || u > 1.3) return;
    const cx = CX,
      cy = CY;
    if (u < 0.5) {
      const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 700);
      g.addColorStop(0, "rgba(176,38,255," + (0.38 * (1 - u / 0.5)).toFixed(3) + ")");
      g.addColorStop(1, "rgba(176,38,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1920);
    }
    if (u < 0.6) {
      const x = CX - 10 * PX + 20 * PX * easeOut(u / 0.55);
      ctx.save();
      ctx.globalAlpha = 1 - smooth((u - 0.45) / 0.15);
      glow("#B026FF", 22);
      ctx.beginPath();
      ctx.moveTo(x, CY - 7 * PX - 10);
      ctx.lineTo(x, CY + 7 * PX + 10);
      ctx.strokeStyle = "#B026FF";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].forEach(([sx, sy], i) => {
      const v = clamp01((u - 0.1 - i * 0.05) / 0.5);
      if (v <= 0 || v >= 1) return;
      const r = 20 * Math.sin(Math.PI * v) + 4;
      const x = cx + sx * 10 * PX,
        y = cy + sy * 7 * PX;
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      glow("#fff", 10);
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r);
      ctx.lineTo(x, y + r);
      ctx.stroke();
      ctx.restore();
    });
    [
      ["#B026FF", 620, 0, 0.7],
      ["#FF0044", 480, 0.1, 0.6],
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
      ctx.fillStyle = i % 3 === 0 ? "#FF0044" : i % 3 === 1 ? "#B026FF" : "#fff";
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
    // frame 0 is the finished flag; it lets go of its colour and leaves the dashed target behind
    if (t < T.down + 0.1) drawFlag(1 - smooth((t - T.hold) / (T.down - T.hold)));
    if (t >= T.down - 0.2) drawLive(t);
    // the ending: the dots fly back from the outline to the equations (the opening, in mirrored time)
    if (t >= T.xr0 && t <= T.xr0 + T.rv) drawDots(T.xf1 + 0.5 - (t - T.xr0));
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (e) => draw(e.detail.time));
  draw(0);
})();
