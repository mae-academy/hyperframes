// Timeline for "SIGNAL FLOW GRAPHS: MASON'S GAIN FORMULA" (24.0 s).
// The graph (nodes, branches with their gains, feedback arcs), the tracer that walks every forward path and every loop, and the lock effect
// are drawn on a canvas from the time alone (hf-seek protocol); the table, the counters and the cards are GSAP. Everything is a pure
// function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, NODES, NR, EDGES, HL, EN } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished picture
    [1.6, "snap"], // rewind
    [2.2, "click"], // a signal flow graph
    [2.4, "snap"], // Mason's formula
    [2.75, "click"], // the gain labels pop one by one as the branches are drawn
    [3.0, "click"],
    [3.25, "click"],
    [3.5, "click"],
    [3.75, "click"],
    [4.0, "click"],
    [4.45, "click"],
    [4.7, "click"],
    [4.95, "click"],
    [5.15, "click"],
    [5.2, "click"], // forward paths
    [5.4, "snap"], // P1
    [6.55, "snap"], // the number 6 leaves the graph
    [7.05, "click"], // ... and lands in the table
    [7.2, "snap"], // P2
    [8.25, "snap"], // the number 4 leaves
    [8.75, "click"], // ... and lands
    [8.8, "click"], // loops
    [9.0, "snap"], // sum of loops
    [9.55, "snap"], // the loop gains leave the graph one by one
    [10.0, "click"], // ... and land
    [10.25, "snap"],
    [10.7, "click"],
    [10.95, "snap"],
    [11.4, "click"],
    [11.65, "snap"],
    [12.1, "click"],
    [12.35, "snap"],
    [12.8, "click"],
    [13.05, "snap"],
    [13.5, "click"],
    [13.8, "click"], // non-touching loops
    [14.0, "snap"], // L1 L5
    [15.05, "snap"], // the product leaves
    [15.55, "click"], // ... and lands
    [15.8, "click"], // the determinant
    [16.0, "snap"], // Delta = 15
    [16.4, "click"], // Delta_1
    [16.7, "click"], // Delta_2
    [17.6, "snap"], // C/R = 2/3
    [19.4, "thump"], // lock
    [20.2, "click"], // every loop counts
    [21.4, "snap"], // CTA reveal
    [23.0, "click"], // engagement pulse
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
  const NODEL = [0, 1, 2, 3, 4, 5].map((i) => "#ln" + i);
  const EDGEL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => "#lg" + i);
  const CELLS = [
    "#tP1",
    "#tP2",
    "#tL1",
    "#tL2",
    "#tL3",
    "#tL4",
    "#tL5",
    "#tL6",
    "#tN",
    "#tD1",
    "#tD2",
  ];
  const HOOKED = [...NODEL, ...EDGEL, ...CELLS];

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

  // the graph builds: nodes, then the branches with their gains
  NODEL.forEach((s, i) => pop(s, T.ns[i], 6));
  EDGEL.forEach((s, i) => {
    hit(T.eg[i], "click", s);
    pop(s, T.eg[i], 6);
  });
  // the numbers leave the graph (pop, glide) and land in their cell of the table
  const flyAt = (i) => {
    const f = CFG.FLY[i],
      sel = "#fl" + i;
    hit(f.launch, "snap", sel);
    ft(
      sel,
      { opacity: 0, scale: 0.6, x: 0, y: 0 },
      { opacity: 1, scale: 2.3, duration: 0.12, ease: "back.out(2)" },
      f.launch,
    );
    ft(
      sel,
      { x: 0, y: 0, scale: 2.3 },
      { x: f.dx, y: f.dy, scale: 1, duration: f.land - f.launch - 0.12, ease: "power2.inOut" },
      f.launch + 0.12,
    );
    ft(sel, { opacity: 1 }, { opacity: 0, duration: 0.08, ease: "power1.in" }, f.land);
  };
  for (let i = 0; i < CFG.FLY.length; i++) flyAt(i);

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
  const cellAt = (i) => {
    hit(T.cells[i], "click", CELLS[i]);
    pop(CELLS[i], T.cells[i], 8);
  };
  bannerAt(0);
  beat(1, 1, T.sw[0]);
  bannerAt(1);
  beat(2, 2, T.sw[1]);
  cellAt(0);
  beat(3, 3, T.sw[2]);
  cellAt(1);
  bannerAt(2);
  beat(4, 4, T.sw[3]);
  for (let i = 2; i < 8; i++) cellAt(i);
  fswap("#fh4", T.cells[7] + 0.1);
  bannerAt(3);
  beat(5, 5, T.sw[4]);
  cellAt(8);
  bannerAt(4);
  beat(6, 6, T.sw[5]);
  cellAt(9);
  cellAt(10);
  fswap("#f7", T.cells[10] + 0.25);
  beat(7, 8, T.sw[6]);

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

  tl.to({}, { duration: 0.0001 }, 23.9999);
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
  const COL = { blue: BLUE, purple: PURPLE, red: RED };
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);

  function line(pts, color, width, alpha, blur) {
    if (pts.length < 2 || alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
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

  // ---------------------------------------------------------------- geometry of the branches: cumulative lengths
  const EG = EDGES.map((pts) => {
    const cum = [0];
    for (let i = 1; i < pts.length; i++)
      cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, cum, len: cum[cum.length - 1] };
  });
  /** the polyline of edge e from its start up to the fraction p of its length, and the angle at its end */
  function sub(e, p) {
    const g = EG[e],
      target = clamp01(p) * g.len,
      out = [g.pts[0]];
    let k = 1;
    while (k < g.pts.length && g.cum[k] <= target) {
      out.push(g.pts[k]);
      k++;
    }
    if (k < g.pts.length) {
      const u = (target - g.cum[k - 1]) / (g.cum[k] - g.cum[k - 1] || 1);
      out.push([
        g.pts[k - 1][0] + (g.pts[k][0] - g.pts[k - 1][0]) * u,
        g.pts[k - 1][1] + (g.pts[k][1] - g.pts[k - 1][1]) * u,
      ]);
    }
    const n = out.length,
      a = out[Math.max(0, n - 2)],
      b = out[n - 1];
    return { pts: out, ang: Math.atan2(b[1] - a[1], b[0] - a[0]), head: b };
  }
  const tangentEnd = (e) => {
    const p = EG[e].pts,
      n = p.length;
    return Math.atan2(p[n - 1][1] - p[n - 3][1], p[n - 1][0] - p[n - 3][0]);
  };

  const hookA = (t) => (t < T.rewind0 ? 1 : 1 - smooth((t - T.rewind0) / 0.5));
  /** alpha and reveal progress of something that is drawn from `start` over `dur` (full during the hook) */
  const tr = (t, start, dur) =>
    t < 2.1 ? { a: hookA(t), p: 1 } : { a: 1, p: clamp01((t - start) / dur) };

  // the moment each node is reached: by its own pop, and by the tracer of every highlighted path or loop
  const invSmooth = (f) => {
    let lo = 0,
      hi = 1;
    for (let k = 0; k < 30; k++) {
      const m = (lo + hi) / 2;
      if (m * m * (3 - 2 * m) < f) lo = m;
      else hi = m;
    }
    return (lo + hi) / 2;
  };
  const RIPPLES = [];
  NODES.forEach((_, i) =>
    RIPPLES.push({
      t: T.ns[i] + 0.05,
      node: i,
      col: i === 0 ? RED : i === NODES.length - 1 ? BLUE : WHITE,
    }),
  );
  HL.forEach((h) => {
    const total = h.e.reduce((s, e) => s + EG[e].len, 0);
    let acc = 0;
    h.e.forEach((e) => {
      acc += EG[e].len;
      RIPPLES.push({
        t: h.t0 + 0.05 + invSmooth(acc / total) * (h.t1 - h.t0 - 0.2),
        node: EN[e][1],
        col: COL[h.c],
      });
    });
  });
  /** the point at arc length s along branch e */
  function at(e, s) {
    const g = EG[e];
    let k = 1;
    while (k < g.pts.length - 1 && g.cum[k] < s) k++;
    const u = (s - g.cum[k - 1]) / (g.cum[k] - g.cum[k - 1] || 1);
    return [
      g.pts[k - 1][0] + (g.pts[k][0] - g.pts[k - 1][0]) * u,
      g.pts[k - 1][1] + (g.pts[k][1] - g.pts[k - 1][1]) * u,
    ];
  }

  function drawGraph(t) {
    const busy = HL.some((h) => t >= h.t0 - 0.1 && t <= h.t1 + 0.3);
    // the branches
    for (let e = 0; e < EG.length; e++) {
      const { a, p } = tr(t, T.es[e], T.ed[e]);
      if (a <= 0.001 || p <= 0) continue;
      const s = sub(e, easeOut(p));
      line(s.pts, WHITE, 4, 0.62 * a);
      if (p >= 0.98)
        arrowHead(
          EG[e].pts[EG[e].pts.length - 1][0],
          EG[e].pts[EG[e].pts.length - 1][1],
          tangentEnd(e),
          WHITE,
          0.9 * a,
          13,
        );
      else if (t >= 2.1) dot(s.head[0], s.head[1], 7, WHITE, 1, 18); // the spark at the tip of the branch that is being drawn
    }
    // the signal flows: dots travel along every finished branch (blue forward, red feedback), dimmed while a path or loop is traced
    for (let e = 0; e < EG.length; e++) {
      const done = t < 2.1 ? hookA(t) : smooth((t - T.es[e] - T.ed[e]) / 0.4);
      if (done <= 0.01) continue;
      const len = EG[e].len,
        n = Math.max(1, Math.round(len / 105)),
        gap = len / n;
      for (let j = 0; j < n; j++) {
        const s = (t * 170 + j * gap) % len;
        const edgeFade = clamp01(Math.min(s, len - s) / 26);
        const [x, y] = at(e, s);
        dot(x, y, 5.5, e >= 6 ? RED : BLUE, done * edgeFade * (busy ? 0.25 : 1), 16);
      }
    }
    // the highlights: a path or a loop is walked by a tracer that leaves a glowing wake
    for (const h of HL) {
      if (t < h.t0 || t > h.t1 + 0.35) continue;
      const col = COL[h.c];
      const fadeOut = t > h.t1 ? 1 - smooth((t - h.t1) / 0.35) : 1;
      const fadeIn = smooth((t - h.t0) / 0.15);
      const al = fadeOut * fadeIn;
      const total = h.e.reduce((s, e) => s + EG[e].len, 0);
      const prog = smooth((t - h.t0 - 0.05) / (h.t1 - h.t0 - 0.2));
      // the whole route, faint
      h.e.forEach((e) => line(EG[e].pts, col, 7, 0.22 * al));
      let left = prog * total,
        head = null;
      for (const e of h.e) {
        if (left <= 0) break;
        const fr = Math.min(1, left / EG[e].len);
        const s = sub(e, fr);
        line(s.pts, col, 9, 0.95 * al, 20);
        head = s.head;
        left -= EG[e].len;
      }
      if (head && prog < 0.995) {
        dot(head[0], head[1], 13, WHITE, al, 18);
        dot(head[0], head[1], 6, RED, al, 0);
      }
    }
    // the nodes
    for (let i = 0; i < NODES.length; i++) {
      const a = t < 2.1 ? hookA(t) : smooth((t - T.ns[i]) / 0.3);
      if (a <= 0.001) continue;
      const [x, y] = NODES[i];
      const edge = i === 0 ? RED : i === NODES.length - 1 ? BLUE : WHITE;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(10,10,16,0.96)";
      ctx.strokeStyle = edge;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = edge;
      ctx.shadowBlur = i === 0 || i === NODES.length - 1 ? 14 : 6;
      ctx.beginPath();
      ctx.arc(x, y, NR, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    // ripples: a ring leaves a node the instant it is reached
    for (const r of RIPPLES) {
      const u = (t - r.t) / 0.5;
      if (u <= 0 || u >= 1) continue;
      const [x, y] = NODES[r.node];
      ctx.save();
      ctx.globalAlpha = (1 - u) * 0.9;
      ctx.strokeStyle = r.col;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = r.col;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, NR + 4 + 34 * easeOut(u), 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawLock(t) {
    const u = t - T.lock;
    if (u < 0 || u > 1.3) return;
    const cx = 540,
      cy = 620;
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
      ctx.moveTo(x, 350);
      ctx.lineTo(x, 890);
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    [
      [90, 350],
      [990, 350],
      [90, 890],
      [990, 890],
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
    drawGraph(t);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
