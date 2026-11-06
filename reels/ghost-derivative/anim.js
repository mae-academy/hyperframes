// Timeline for "THE IMMORTAL FUNCTION" (15.0 s). Everything is a pure function of timeline time:
// no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const COL = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF" };
  const { XA, XB, T0, T1, TICK, ticks, sparks, geo, PW } = CFG;
  const X = (x) => geo.x0 + geo.kx * (x + 2);
  const Y = (y) => geo.y0 - geo.ky * y;
  const f = Math.exp;
  const dnum = (x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h); // the tracer: numerical derivative
  const tl = gsap.timeline({ paused: true });
  const CUES = [];
  const cue = (t, kind, ref) => CUES.push({ t: Math.round(t * 1000) / 1000, kind, ref });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const SW = T1 - T0; // scan duration
  const xOf = (u) => XA + (XB - XA) * u; // u in [0,1] across the scan

  /** tween `prop` of target so that its value follows fn(u) (u = eased progress 0..1) exactly */
  function follow(target, prop, fn, at, dur, isAttr) {
    const a = fn(0),
      b = fn(1);
    const ease = Math.abs(b - a) < 1e-9 ? "none" : (u) => (fn(u) - a) / (b - a);
    const from = isAttr ? { attr: { [prop]: a } } : { [prop]: a };
    const to = isAttr ? { attr: { [prop]: b } } : { [prop]: b };
    ft(target, from, Object.assign(to, { duration: dur, ease }), at);
  }
  /** banner swap: 0.15 s out, 0.075 s overlap, 0.15 s in */
  function swap(o, n, t) {
    tl.to(o, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
  }

  // ---------------------------------------------------------------- initial state
  gsap.set("#head", { x: X(XA), y: Y(f(XA)) });
  gsap.set("#pc > .t", { opacity: 0.25 }); // axis labels start dim with the grid

  // ---------------------------------------------------------------- 0.0 - 2.2  zone 4 state A: the failures
  const miniW = PW;
  [
    [0, 0.3],
    [1, 0.9],
    [2, 1.5],
  ].forEach(([i, t]) =>
    ft(
      "#mcr" + i,
      { attr: { width: 0 } },
      { attr: { width: miniW }, duration: 0.55, ease: "power1.inOut" },
      t,
    ),
  );
  ft(
    "#x0",
    { opacity: 0, scale: 1.5 },
    { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
    0.9,
  );
  ft(
    "#x1",
    { opacity: 0, scale: 1.5 },
    { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
    1.5,
  );
  ft(
    "#x2",
    { opacity: 0, scale: 1.3 },
    { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" },
    2.05,
  );

  // ---------------------------------------------------------------- 2.2 - 2.8  zone 2 illuminates, base curve locks in
  ft("#gridg", { opacity: 0.25 }, { opacity: 1, duration: 0.6, ease: "power2.inOut" }, 2.2);
  ft("#pc > .t", { opacity: 0.25 }, { opacity: 1, duration: 0.6, ease: "power2.inOut" }, 2.2);
  ft(
    "#revE-r",
    { attr: { width: 0 } },
    { attr: { width: X(3) - 130 + 12 }, duration: 0.6, ease: "power2.inOut" },
    2.2,
  );
  ft("#head", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, 2.6);
  ft("#hud", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, 2.6);

  // ---------------------------------------------------------------- 2.8 - 8.5  the dual-sensor scan
  follow("#head", "x", (u) => X(xOf(u)), T0, SW, false); // linear in x
  follow("#head", "y", (u) => Y(f(xOf(u))), T0, SW, false); // sensor A rides the curve
  follow("#needle", "y2", (u) => geo.ky * dnum(xOf(u)), T0, SW, true); // sensor B stylus height = measured slope
  const LT = 46; // half length of the tangent tick
  const ang = (u) => Math.atan((dnum(xOf(u)) * geo.ky) / geo.kx);
  follow("#tang", "x1", (u) => -LT * Math.cos(ang(u)), T0, SW, true);
  follow("#tang", "y1", (u) => LT * Math.sin(ang(u)), T0, SW, true);
  follow("#tang", "x2", (u) => LT * Math.cos(ang(u)), T0, SW, true);
  follow("#tang", "y2", (u) => -LT * Math.sin(ang(u)), T0, SW, true);
  const full = X(XB) - X(XA);
  ft("#revR-r", { attr: { width: 0 } }, { attr: { width: full }, duration: SW, ease: "none" }, T0); // red laser trace
  ft(
    "#revP-r",
    { attr: { width: 0 } },
    { attr: { width: full }, duration: SW, ease: "none" },
    T0 + 0.18,
  ); // fusion beam follows
  ticks.forEach((tk) => {
    tl.set("#rd" + tk.k, { opacity: 1 }, tk.t);
    if (tk.k < ticks.length - 1) tl.set("#rd" + tk.k, { opacity: 0 }, tk.t + TICK);
    cue(tk.t, "tick", "spark:" + tk.k);
  });
  sparks.forEach((s) => {
    const t = ticks[s.k].t;
    ft(
      "#" + s.id,
      { x: 0, y: 0, opacity: 1 },
      { x: s.dx, y: s.dy, opacity: 0, duration: 0.35, ease: "power2.out" },
      t,
    );
  });

  // ---------------------------------------------------------------- banner telemetry
  swap("#BA", "#BB", 2.5);
  swap("#BB", "#BC", 9.0);

  // ---------------------------------------------------------------- 8.5 - 10.5  zero deviation locks, shockwave
  ft(
    "#ring1",
    { attr: { r: 10 }, opacity: 0.95 },
    { attr: { r: 140 }, opacity: 0, duration: 0.7, ease: "power2.out" },
    T1,
  );
  ft(
    "#ring2",
    { attr: { r: 10 }, opacity: 0.95 },
    { attr: { r: 95 }, opacity: 0, duration: 0.6, ease: "power2.out" },
    T1 + 0.12,
  );
  ft("#trR", { strokeWidth: 7 }, { strokeWidth: 12, duration: 0.18, ease: "power2.out" }, T1);
  tl.to("#trR", { strokeWidth: 7, duration: 0.4, ease: "power2.inOut" }, T1 + 0.18);
  ft("#trP", { strokeWidth: 4 }, { strokeWidth: 8, duration: 0.18, ease: "power2.out" }, T1);
  tl.to("#trP", { strokeWidth: 4, duration: 0.4, ease: "power2.inOut" }, T1 + 0.18);
  ft(
    "#hud-a,#hud-b",
    { textShadow: "0 0 0px rgba(255,255,255,0)" },
    { textShadow: "0 0 16px rgba(255,255,255,0.8)", duration: 0.2, ease: "power2.out" },
    T1,
  );
  tl.to(
    "#hud-a,#hud-b",
    { textShadow: "0 0 0px rgba(255,255,255,0)", duration: 0.4, ease: "power2.in" },
    T1 + 0.2,
  );
  ft(
    "#dev",
    { scale: 1.3, color: COL.red, textShadow: `0 0 18px ${COL.red}` },
    {
      scale: 1,
      color: COL.purple,
      textShadow: `0 0 10px ${COL.purple}`,
      duration: 0.35,
      ease: "back.out(2)",
    },
    T1,
  );
  ft("#x2", { scale: 1 }, { scale: 1.07, duration: 0.15, ease: "power2.out" }, T1);
  tl.to("#x2", { scale: 1, duration: 0.3, ease: "power2.inOut" }, T1 + 0.15);
  cue(T1, "snap", "lock:deviation");
  ft("#BC", { scale: 1.04 }, { scale: 1, duration: 0.3, ease: "power2.out" }, 9.0);
  cue(9.0, "thump", "eigenfunction");
  tl.to("#head", { opacity: 0, duration: 0.4, ease: "power1.in" }, 9.6);

  // ---------------------------------------------------------------- 10.5 - 14.8  zone 4 state B: CTA slides up
  tl.to("#cmp", { opacity: 0, y: 70, duration: 0.4, ease: "power2.in" }, 10.5);
  ft("#cta", { opacity: 0, y: 90 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, 10.6);
  [
    ["#ct1", 11.0],
    ["#ct2", 11.15],
    ["#ct3", 11.6],
    ["#ct4", 11.75],
    ["#ct5", 12.1],
  ].forEach(([s, t]) =>
    ft(s, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, t),
  );
  ft(
    "#ct3,#ct4",
    { textShadow: "0 0 0px rgba(0,136,255,0)" },
    { textShadow: `0 0 20px ${COL.blue}`, duration: 0.3, ease: "power2.out" },
    12.4,
  );
  tl.to(
    "#ct3,#ct4",
    { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.4, ease: "power2.in" },
    12.7,
  );

  tl.to({}, { duration: 0.0001 }, 14.9999); // 14.8 - 15.0: static zero-delta hold
  window.__CUES = CUES.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
