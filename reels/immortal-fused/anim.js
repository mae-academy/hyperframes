// Timeline for "THE IMMORTAL FUNCTION: FUSED" (16.0 s). Everything is a pure function of timeline time:
// no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const COL = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF" };
  const { XA, XB, T0, T1, steps, sparks, PW, geo, rig } = CFG;
  const { P, O, Q } = rig;
  const X = (x) => geo.x0 + geo.kx * (x + 2);
  const Y = (y) => geo.y0 - geo.ky * y;
  const f = Math.exp;
  const dnum = (x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h); // the tracer: numerical derivative
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"],
    [1.0, "snap"],
    [2.8, "click"],
    [4.0, "click"],
    [5.2, "click"],
    [6.5, "click"],
    [7.5, "snap"], // Triangle base clamp lock
    [9.0, "click"],
    [10.5, "click"],
    [11.5, "thump"], // Final formula lock
    [12.5, "snap"], // CTA reveal
    [14.0, "click"],
  ];
  // @CUES-END

  // Every cue is consumed by exactly one visual event; ticks (2.8 - 7.0) are generated from the scanner steps.
  const EXPORT = [];
  const used = new Set();
  function hit(t, kind, ref) {
    const i = CUES.findIndex((c) => c[0] === t && c[1] === kind);
    if (i < 0) throw new Error(`visual event at ${t}s (${kind}) has no CUES entry`);
    used.add(i);
    EXPORT.push({ t, kind, ref });
    return t;
  }

  const SW = T1 - T0;
  const xOf = (u) => XA + (XB - XA) * u;
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
  const burst = (el, r0, r1, dur, at) =>
    ft(
      el,
      { attr: { r: r0 }, opacity: 0.95 },
      { attr: { r: r1 }, opacity: 0, duration: dur, ease: "power2.out" },
      at,
    );
  const pulseW = (el, w0, w1, at) => {
    ft(el, { strokeWidth: w0 }, { strokeWidth: w1, duration: 0.15, ease: "power2.out" }, at);
    tl.to(el, { strokeWidth: w0, duration: 0.35, ease: "power2.inOut" }, at + 0.15);
  };

  gsap.set("#head", { x: X(XA), y: Y(f(XA)) });
  gsap.set(".axl", { opacity: 0.25 });

  // ---------------------------------------------------------------- 0.0 - 2.2  state A: the failures
  hit(0.0, "thump", "open");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  ft("#cmp", { scale: 1.035 }, { scale: 1, duration: 0.45, ease: "power3.out" }, 0);
  [
    [0, 0.15],
    [1, 0.3],
    [2, 1.1],
  ].forEach(([i, t]) =>
    ft(
      "#mcr" + i,
      { attr: { width: 0 } },
      { attr: { width: PW }, duration: 0.55, ease: "power1.inOut" },
      t,
    ),
  );
  const tStamp = hit(1.0, "snap", "stamp");
  ft(
    "#x0",
    { opacity: 0, scale: 1.5 },
    { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
    tStamp,
  );
  ft(
    "#x1",
    { opacity: 0, scale: 1.5 },
    { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
    tStamp,
  );
  ft(
    "#x2",
    { opacity: 0, scale: 1.3 },
    { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" },
    1.7,
  );

  // ---------------------------------------------------------------- 2.2 - 2.8  base curve illuminates
  ft("#gridg", { opacity: 0.25 }, { opacity: 1, duration: 0.6, ease: "power2.inOut" }, 2.2);
  ft(".axl", { opacity: 0.25 }, { opacity: 1, duration: 0.6, ease: "power2.inOut" }, 2.2);
  ft(
    "#revE-r",
    { attr: { width: 0 } },
    { attr: { width: X(2.5) - 130 + 12 }, duration: 0.6, ease: "power2.inOut" },
    2.2,
  );
  ft("#head", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, 2.6);
  ft("#hud", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out" }, 2.6);

  // ---------------------------------------------------------------- 2.8 - 7.5  Part A: the ghost-curve scan
  follow("#head", "x", (u) => X(xOf(u)), T0, SW, false);
  follow("#head", "y", (u) => Y(f(xOf(u))), T0, SW, false);
  follow("#needle", "y2", (u) => geo.ky * dnum(xOf(u)), T0, SW, true);
  const LT = 46;
  const ang = (u) => Math.atan((dnum(xOf(u)) * geo.ky) / geo.kx);
  follow("#tang", "x1", (u) => -LT * Math.cos(ang(u)), T0, SW, true);
  follow("#tang", "y1", (u) => LT * Math.sin(ang(u)), T0, SW, true);
  follow("#tang", "x2", (u) => LT * Math.cos(ang(u)), T0, SW, true);
  follow("#tang", "y2", (u) => -LT * Math.sin(ang(u)), T0, SW, true);
  const full = X(XB) - X(XA);
  ft("#revR-r", { attr: { width: 0 } }, { attr: { width: full }, duration: SW, ease: "none" }, T0);
  ft(
    "#revP-r",
    { attr: { width: 0 } },
    { attr: { width: full }, duration: SW, ease: "none" },
    T0 + 0.18,
  );
  steps.forEach((s) => {
    tl.set("#rd" + s.k, { opacity: 1 }, s.t);
    tl.set(
      "#rd" + s.k,
      { opacity: 0 },
      Math.round((s.t + 0.1) * 1000) / 1000 >= T1 ? 7.9 : Math.round((s.t + 0.1) * 1000) / 1000,
    );
    if (s.audible && !s.milestone) EXPORT.push({ t: s.t, kind: "tick", ref: "spark:" + s.k });
    if (s.milestone) {
      hit(s.t, "click", "milestone");
      burst("#ringm", 18, 64, 0.35, s.t);
    }
  });
  sparks.forEach((s) =>
    ft(
      "#" + s.id,
      { x: 0, y: 0, opacity: 1 },
      { x: s.dx, y: s.dy, opacity: 0, duration: 0.35, ease: "power2.out" },
      s.t,
    ),
  );
  tl.to("#hud", { opacity: 0, duration: 0.4, ease: "power1.in" }, 7.6);

  swap("#BA", "#BB", 2.5);
  swap("#BB", "#BC", 7.5);

  // ---------------------------------------------------------------- 7.5 - 11.5  Part B: the constant subtangent
  const tClamp = hit(7.5, "snap", "clamp");
  burst("#ringP", 10, 80, 0.5, tClamp); // scanner anchors at P(1, e)
  tl.set("#dotP", { opacity: 1 }, tClamp);
  ft("#brk", { opacity: 0 }, { opacity: 1, duration: 0.05 }, tClamp);
  ft(
    "#brkL",
    { attr: { x1: O.x - 54, x2: O.x - 54 } },
    { attr: { x1: O.x, x2: O.x }, duration: 0.2, ease: "power4.out" },
    tClamp,
  );
  ft(
    "#brkR",
    { attr: { x1: Q.x + 54, x2: Q.x + 54 } },
    { attr: { x1: Q.x, x2: Q.x }, duration: 0.2, ease: "power4.out" },
    tClamp,
  );
  ft(
    "#brkM",
    { attr: { x1: O.x - 54, x2: Q.x + 54 } },
    { attr: { x1: O.x, x2: Q.x }, duration: 0.2, ease: "power4.out" },
    tClamp,
  );
  ft(
    "#lbl-b",
    { opacity: 0, scale: 1.25 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
    tClamp + 0.1,
  );
  tl.set("#dotO", { opacity: 1 }, tClamp);
  tl.set("#dotQ", { opacity: 1 }, tClamp);
  pulseW(".brk", 5, 9, tClamp);
  ft("#lbl-p", { opacity: 0 }, { opacity: 1, duration: 0.25 }, 7.6);

  // zone 4: comparison card hands over to the triangle ledger
  tl.to("#cmp", { opacity: 0, duration: 0.3, ease: "power1.in" }, 7.5);
  ft("#led", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 7.5);
  ft("#ld2", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, 7.6);

  // height drop-line
  ft(
    "#drop",
    { opacity: 1, attr: { y2: P.y } },
    { attr: { y2: Q.y }, duration: 0.4, ease: "power2.out" },
    7.7,
  );
  ft("#lbl-h", { opacity: 0 }, { opacity: 1, duration: 0.25 }, 8.1);
  ft("#ld1", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, 8.1);

  // tangent shoots down to the base's left end
  const T_END = 9.0;
  const sx = X(1.35),
    sy = Y(f(1) * 2.35 - f(1)); // stub beyond P along the tangent
  ft(
    "#tgs",
    { opacity: 0.6, attr: { x2: P.x, y2: P.y } },
    { attr: { x2: sx, y2: sy }, duration: 0.3, ease: "power2.out" },
    8.3,
  );
  ft(
    "#tgl",
    { opacity: 1, attr: { x2: P.x, y2: P.y } },
    { attr: { x2: O.x, y2: O.y }, duration: T_END - 8.3, ease: "power2.in" },
    8.3,
  );
  hit(T_END, "click", "land");
  burst("#ringO", 10, 72, 0.5, T_END);
  ft("#tri", { opacity: 0 }, { opacity: 0.2, duration: 0.35, ease: "power2.out" }, T_END);
  ft("#rtang", { opacity: 0 }, { opacity: 1, duration: 0.25 }, T_END + 0.1);
  pulseW("#brkL", 5, 10, T_END);

  // slope readout locks on the triangle
  const T_SLOPE = hit(10.5, "click", "slope");
  ft(
    "#lbl-s",
    { opacity: 0, scale: 1.35 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
    T_SLOPE,
  );
  ft("#tri", { opacity: 0.2 }, { opacity: 0.38, duration: 0.15, ease: "power2.out" }, T_SLOPE);
  tl.to("#tri", { opacity: 0.2, duration: 0.4, ease: "power2.inOut" }, T_SLOPE + 0.15);
  ft("#ld3", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T_SLOPE);
  ft("#ld4", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, 10.9);

  // ---------------------------------------------------------------- 11.5 - 15.8  final lock + CTA
  const T_FINAL = hit(11.5, "thump", "final");
  swap("#BC", "#BD", T_FINAL);
  ft("#BD", { scale: 1.04 }, { scale: 1, duration: 0.3, ease: "power2.out" }, T_FINAL + 0.075);
  pulseW("#tgl", 5, 9, T_FINAL);
  pulseW("#drop", 5, 9, T_FINAL);
  tl.to("#led", { opacity: 0, y: 70, duration: 0.4, ease: "power2.in" }, T_FINAL);
  ft(
    "#cta",
    { opacity: 0, y: 90 },
    { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" },
    T_FINAL + 0.1,
  );
  const T_CTA = hit(12.5, "snap", "cta");
  ft(
    "#ct1a,#ct1b",
    { opacity: 0, scale: 1.12 },
    { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" },
    T_CTA,
  );
  ft("#ct2a,#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, 13.2);
  const T_PULSE = hit(14.0, "click", "cta-pulse");
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, T_PULSE);
  ft(
    "#ct2a,#ct2b",
    { textShadow: "0 0 0px rgba(0,136,255,0)" },
    { textShadow: `0 0 20px ${COL.blue}`, duration: 0.3, ease: "power2.out" },
    T_PULSE,
  );
  tl.to(
    "#ct2a,#ct2b",
    { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.4, ease: "power2.in" },
    T_PULSE + 0.3,
  );

  tl.to({}, { duration: 0.0001 }, 15.9999); // 15.8 - 16.0: static zero-delta hold
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
