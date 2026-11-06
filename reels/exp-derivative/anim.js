// Timeline for "THE e^x TRICK". Everything is a pure function of timeline time (no callbacks, no clocks).
(function () {
  const L = window.__LAYOUT || {};
  const CFG = window.__CFG;
  const COL = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF" };
  const X = (x) => CFG.X.x0 + CFG.X.k * (x + 1);
  const Y = (y) => CFG.Y.y0 - CFG.Y.k * y;
  const m = (k) => L[k] || { cx: 0, cy: 0, w: 0, h: 0 };
  const tl = gsap.timeline({ paused: true });
  const CUES = []; // {t, kind, ref}: the single source for scripts/make_sfx.py
  const cue = (t, kind, ref) => CUES.push({ t: Math.round(t * 1000) / 1000, kind, ref });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const dnum = (x, h = 1e-5) => (Math.exp(x + h) - Math.exp(x - h)) / (2 * h);

  // ------------------------------------------------------------------ initial state
  gsap.set(".clone", { display: "none", xPercent: -50, yPercent: -50 });
  document
    .querySelectorAll(".shard")
    .forEach((s) => gsap.set(s, { x: +s.dataset.cx, y: +s.dataset.cy }));

  // ------------------------------------------------------------------ helpers
  /** move an svg point along y = fn(x): x eased, y eased by the same law so it stays exactly on the curve */
  function along(el, ax, ay, xa, xb, at, dur, easeName, fn) {
    const E = gsap.parseEase(easeName);
    const fa = fn(xa),
      fb = fn(xb);
    const yEase = (t) => (fn(xa + (xb - xa) * E(t)) - fa) / (fb - fa);
    ft(el, { attr: { [ax]: X(xa) } }, { attr: { [ax]: X(xb) }, duration: dur, ease: easeName }, at);
    ft(el, { attr: { [ay]: Y(fa) } }, { attr: { [ay]: Y(fb) }, duration: dur, ease: yEase }, at);
  }
  /** banner swap: 0.15 s out, 0.075 s overlap, 0.15 s in */
  function swap(oldA, newA, oldT, newT, t) {
    tl.to(oldA, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft(newA, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
    if (oldT && newT) {
      tl.to(oldT, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
      ft(newT, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
    }
  }
  /** the extraction mechanic: POP 0.15 -> GLIDE 0.45 -> (lit) -> DROP 0.30 -> LAND */
  function travel(id, t, color) {
    const o = m("o_" + id),
      b = m("bs_" + id),
      c = m("cell_" + id);
    const clone = "#c_" + id,
      orig = "#o_" + id,
      cell = "#cell_" + id;
    const S1 = 32 / 24,
      S2 = 42 / 24;
    tl.set(orig, { opacity: 0 }, t); // the number leaves its component...
    tl.set(clone, { display: "block", x: o.cx, y: o.cy, scale: 1 }, t); // ...and the clone takes over at the same spot
    ft(clone, { scale: 1 }, { scale: 2.5, duration: 0.15, ease: "power2.out" }, t); // POP
    ft(clone, { x: o.cx }, { x: b.cx, duration: 0.45, ease: "power2.inOut" }, t + 0.15); // GLIDE (x and y on different eases = curved path)
    ft(clone, { y: o.cy }, { y: b.cy, duration: 0.45, ease: "power3.inOut" }, t + 0.15);
    ft(clone, { scale: 2.5 }, { scale: S1, duration: 0.45, ease: "power2.inOut" }, t + 0.15);
    tl.set(orig, { opacity: 1 }, t + 0.6); // original comes back when the clone lands
    ft(clone, { scale: S1 * 1.25 }, { scale: S1, duration: 0.3, ease: "back.out(2)" }, t + 0.6); // banner term lights up
    ft(clone, { x: b.cx }, { x: c.cx, duration: 0.3, ease: "power2.inOut" }, t + 0.85); // DROP into the cell
    ft(clone, { y: b.cy }, { y: c.cy, duration: 0.3, ease: "power3.inOut" }, t + 0.85);
    ft(clone, { scale: S1 }, { scale: S2, duration: 0.3, ease: "power2.inOut" }, t + 0.85);
    tl.set(clone, { display: "none" }, t + 1.15);
    tl.set(cell, { opacity: 1 }, t + 1.15); // LAND: the cell locks
    ft(
      cell,
      { scale: 1.2, textShadow: `0 0 22px ${color}` },
      { scale: 1, textShadow: `0 0 6px ${color}`, duration: 0.3, ease: "power2.out" },
      t + 1.15,
    );
    cue(t, "click", "pop:" + id);
    cue(t + 1.15, "snap", "lock:" + id);
  }
  function touchNode(i, t) {
    ft("#node" + i, { attr: { r: 8 } }, { attr: { r: 15 }, duration: 0.1, ease: "power2.out" }, t);
    ft(
      "#node" + i,
      { attr: { r: 15 } },
      { attr: { r: 8 }, duration: 0.2, ease: "power2.in" },
      t + 0.1,
    );
  }
  function sensor(i, at, withTangent) {
    const T = CFG.tangents[i];
    if (withTangent)
      ft(
        "#tan" + i,
        { attr: { x1: T.px, y1: T.py, x2: T.px, y2: T.py } },
        { attr: { x1: T.x1, y1: T.y1, x2: T.x2, y2: T.y2 }, duration: 0.4, ease: "power2.out" },
        at,
      );
    ft(
      "#bar" + i,
      { attr: { y2: Y(0) } },
      { attr: { y2: T.py }, duration: 0.4, ease: "power2.out" },
      at,
    );
  }
  function slopeLabel(i, tIn, tOut) {
    ft("#lab_s" + i, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, tIn);
    tl.to("#lab_s" + i, { opacity: 0, duration: 0.25, ease: "power1.in" }, tOut);
  }

  // ------------------------------------------------------------------ 0.0 - 1.8  hook
  tl.set("#card", { opacity: 0 }, 0.8);
  document.querySelectorAll(".shard").forEach((s) => {
    const cx = +s.dataset.cx,
      cy = +s.dataset.cy,
      dx = +s.dataset.dx,
      dy = +s.dataset.dy,
      rot = +s.dataset.rot;
    tl.set(s, { opacity: 1 }, 0.8);
    ft(
      s,
      { x: cx, y: cy, rotation: 0 },
      { x: cx + dx, y: cy + dy, rotation: rot, duration: 0.9, ease: "power2.out" },
      0.8,
    );
    tl.to(s, { opacity: 0, duration: 0.8, ease: "power1.in" }, 0.9);
  });

  // ------------------------------------------------------------------ schedule
  const c0 = 2.15;
  const sec = { in: 3.0, q1: 3.5, swB: 4.0, q2: 4.5, swC: 4.75 };
  const p0 = 5.0;
  const drop = (t) => t + 0.85;
  const c1 = drop(p0) + 0.7; // 6.55
  const p1 = c1 + 1.45;
  const c2 = drop(p1) + 0.7;
  const p2 = c2 + 1.45;
  const REVEAL = drop(p2); // banner swap to the sweep
  const SW0 = REVEAL + 0.6,
    SWD = 2.5,
    THUMP = SW0 + SWD;

  // ------------------------------------------------------------------ comet
  const tails = Array.from(document.querySelectorAll(".tail"));
  function cometSeg(xa, xb, at, dur) {
    along("#comet", "cx", "cy", xa, xb, at, dur, "power2.inOut", Math.exp);
    tails.forEach((tail) => {
      const k = +tail.dataset.k,
        d = 0.035 * k;
      along(tail, "cx", "cy", xa, xb, at + d, dur, "power2.inOut", Math.exp);
      tl.set(tail, { opacity: 0.6 - 0.08 * k }, at + d);
      tl.to(tail, { opacity: 0, duration: 0.12 }, at + d + dur - 0.1);
    });
  }
  cometSeg(-1, 0, 1.3, c0 - 1.3);
  cometSeg(0, 1, drop(p0), c1 - drop(p0));
  cometSeg(1, 2, drop(p1), c2 - drop(p1));

  // ------------------------------------------------------------------ sample x = 0  (height, then secant -> tangent)
  swap("#A0", "#A1", "#T0", "#T1", c0 - 0.1);
  touchNode(0, c0);
  travel("v0", c0, COL.blue);

  const secEnds = (h) => {
    const s = h === 0 ? 1 : (Math.exp(h) - 1) / h;
    const ur = Math.max(h + 0.25, 0.3);
    return { x1: X(-0.3), y1: Y(1 - 0.3 * s), x2: X(ur), y2: Y(1 + ur * s) };
  };
  const p0pt = { x: X(0), y: Y(1) };
  swap("#A1", "#A2a", "#T1", "#T2", drop(c0));
  ft(
    "#sec",
    { opacity: 0, attr: { x1: p0pt.x, y1: p0pt.y, x2: p0pt.x, y2: p0pt.y } },
    Object.assign({ opacity: 1, duration: 0.3, ease: "power2.out" }, { attr: secEnds(1) }),
    sec.in + 0.05,
  );
  ft("#qdot", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, sec.in + 0.05);
  along("#qdot", "cx", "cy", 1, 0.1, sec.q1, 0.5, "power2.inOut", Math.exp);
  ft(
    "#sec",
    { attr: secEnds(1) },
    { attr: secEnds(0.1), duration: 0.5, ease: "power2.inOut" },
    sec.q1,
  );
  swap("#A2a", "#A2b", null, null, sec.swB);
  along("#qdot", "cx", "cy", 0.1, 0, sec.q2, 0.25, "power2.inOut", Math.exp);
  ft(
    "#sec",
    { attr: secEnds(0.1) },
    { attr: secEnds(0), duration: 0.25, ease: "power2.inOut" },
    sec.q2,
  );
  swap("#A2b", "#A2c", null, null, sec.swC);
  tl.to("#qdot", { opacity: 0, duration: 0.2, ease: "power1.in" }, sec.swC + 0.1);
  sensor(0, 4.55, false);
  slopeLabel(0, 4.85, drop(p0) + 0.3);
  touchNode(0, p0);
  travel("s0", p0, COL.purple);

  // ------------------------------------------------------------------ sample x = 1
  swap("#A2c", "#A3", "#T2", "#T1", drop(p0));
  touchNode(1, c1);
  travel("v1", c1, COL.blue);
  swap("#A3", "#A4", "#T1", "#T3", drop(c1));
  sensor(1, c1 + 1.0, true);
  slopeLabel(1, c1 + 1.25, drop(p1) + 0.3);
  touchNode(1, p1);
  travel("s1", p1, COL.purple);

  // ------------------------------------------------------------------ sample x = 2
  swap("#A4", "#A5", "#T3", "#T1", drop(p1));
  touchNode(2, c2);
  travel("v2", c2, COL.blue);
  swap("#A5", "#A6", "#T1", "#T3", drop(c2));
  sensor(2, c2 + 1.0, true);
  slopeLabel(2, c2 + 1.25, drop(p2) + 0.3);
  touchNode(2, p2);
  travel("s2", p2, COL.purple);

  // ------------------------------------------------------------------ reveal: the slope sensor sweeps the whole curve
  swap("#A6", "#A7", "#T3", "#T4", REVEAL);
  tl.to(
    ["#sec", "#tan1", "#tan2", "#bar0", "#bar1", "#bar2", "#comet"],
    { opacity: 0, duration: 0.25, ease: "power1.in" },
    REVEAL + 0.25,
  );
  const fadeTails = tails.length;
  void fadeTails;
  ft("#swb", { opacity: 0 }, { opacity: 0.9, duration: 0.2 }, SW0 - 0.2);
  ft("#swt", { opacity: 0 }, { opacity: 1, duration: 0.2 }, SW0 - 0.2);
  const E = gsap.parseEase("power1.inOut");
  const xa = -1,
    xb = 2.3;
  const yE = (t) => (dnum(xa + (xb - xa) * E(t)) - dnum(xa)) / (dnum(xb) - dnum(xa));
  ft(
    "#swb",
    { attr: { x1: X(xa), x2: X(xa) } },
    { attr: { x1: X(xb), x2: X(xb) }, duration: SWD, ease: "power1.inOut" },
    SW0,
  );
  ft(
    "#swb",
    { attr: { y2: Y(dnum(xa)) } },
    { attr: { y2: Y(dnum(xb)) }, duration: SWD, ease: yE },
    SW0,
  );
  ft(
    "#swt",
    { attr: { cx: X(xa) } },
    { attr: { cx: X(xb) }, duration: SWD, ease: "power1.inOut" },
    SW0,
  );
  ft(
    "#swt",
    { attr: { cy: Y(dnum(xa)) } },
    { attr: { cy: Y(dnum(xb)) }, duration: SWD, ease: yE },
    SW0,
  );
  ft(
    "#trace-rect",
    { attr: { width: X(xa) - 140 } },
    { attr: { width: X(xb) - 140 + 8 }, duration: SWD, ease: "power1.inOut" },
    SW0,
  );

  // ------------------------------------------------------------------ climax: slope curve == the curve
  tl.to(["#swb", "#swt"], { opacity: 0, duration: 0.25, ease: "power1.in" }, THUMP);
  ft("#trace", { strokeWidth: 3.5 }, { strokeWidth: 8, duration: 0.2, ease: "power2.out" }, THUMP);
  ft(
    "#trace",
    { strokeWidth: 8 },
    { strokeWidth: 3.5, duration: 0.35, ease: "power2.inOut" },
    THUMP + 0.2,
  );
  ft("#lbl-yp", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, THUMP);
  ft(
    "#m-hs,#m-hv",
    { textShadow: "0 0 0px rgba(255,0,68,0)" },
    { textShadow: `0 0 18px ${COL.red}`, duration: 0.3, ease: "power2.out" },
    THUMP,
  );
  ft(
    "#m-eq",
    { color: "rgba(255,255,255,0.45)", textShadow: "0 0 0px rgba(255,0,68,0)" },
    { color: COL.red, textShadow: `0 0 18px ${COL.red}`, duration: 0.3, ease: "power2.out" },
    THUMP,
  );
  swap("#A7", "#A8", "#T4", "#T5", THUMP);
  cue(THUMP, "thump", "identity:f'=f");

  // ------------------------------------------------------------------ CTA 16.6 - 19.1
  tl.set("#cta", { opacity: 1 }, 16.6);
  ft(
    "#cta-panel",
    { opacity: 0, scale: 0.94 },
    { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" },
    16.6,
  );
  [
    ["#cta1", 16.9],
    ["#cta2", 17.1],
    ["#cta3", 17.6],
    ["#cta4", 17.9],
    ["#cta5", 18.3],
  ].forEach(([s, t]) =>
    ft(s, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, t),
  );
  ft(
    "#cta3",
    { textShadow: "0 0 0px rgba(0,136,255,0)" },
    { textShadow: `0 0 22px ${COL.blue}`, duration: 0.3, ease: "power2.out" },
    17.9,
  );
  tl.to(
    "#cta3",
    { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.35, ease: "power2.in" },
    18.2,
  );

  tl.to({}, { duration: 0.0001 }, 20.9999);
  window.__CUES = CUES.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
