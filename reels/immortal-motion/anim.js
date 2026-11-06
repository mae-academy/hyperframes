// Timeline for "THE IMMORTAL FUNCTION: THE e^x TRIANGLE IN MOTION" (15.0 s).
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const COL = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF" };
  const { geo, rig, scan, fly, sparks, PW } = CFG;
  const { P1, O1, Q1 } = rig;
  const KX = geo.kx,
    KY = geo.ky;
  const X = (x) => geo.x0 + KX * (x + 2);
  const Y = (y) => geo.y0 - KY * y;
  const f = Math.exp;
  const dnum = (x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
  const midY = (x) => (Y(f(x)) + Y(0)) / 2;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // the readouts were generated with these two laws; the tweens must use exactly the same ones
  if (
    Math.abs(gsap.parseEase("power1.inOut")(0.3) - CFG.q03) > 1e-9 ||
    Math.abs(gsap.parseEase("power2.inOut")(0.3) - CFG.c03) > 1e-9
  )
    throw new Error("ease laws differ from the generated readouts");

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // Opening impact
    [1.5, "snap"], // Curve ignition
    [3.2, "snap"], // Base 1.0 mechanical clamp lock
    [3.5, "click"], // Tangent lands on x = 0, triangle closes
    [4.5, "click"], // Start upward glide
    [6.5, "click"], // Passing x = 1.5
    [8.5, "snap"], // Lock at x = 2.0
    [9.5, "thump"], // Final formula confirmation
    [10.5, "snap"], // CTA reveal
    [12.0, "click"], // Engagement pulse
  ];
  // @CUES-END
  const EXPORT = [];
  const used = new Set();
  function hit(t, kind, ref) {
    const i = CUES.findIndex((c) => c[0] === t && c[1] === kind);
    if (i < 0) throw new Error(`visual event at ${t}s (${kind}) has no CUES entry`);
    used.add(i);
    EXPORT.push({ t, kind, ref });
    return t;
  }

  /** value of `prop` follows g(s), where s = easeName(raw progress) goes 0 -> 1 exactly over [at, at + dur] */
  function follow(target, prop, g, at, dur, isAttr, easeName) {
    const E = gsap.parseEase(easeName || "none");
    const fn = (u) => g(E(u));
    const a = fn(0),
      b = fn(1);
    const ease = Math.abs(b - a) < 1e-9 ? "none" : (u) => (fn(u) - a) / (b - a);
    const from = isAttr ? { attr: { [prop]: a } } : { [prop]: a };
    const to = isAttr ? { attr: { [prop]: b } } : { [prop]: b };
    ft(target, from, Object.assign(to, { duration: dur, ease }), at);
  }
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

  gsap.set("#head", { x: X(-1), y: Y(f(-1)) });
  gsap.set(".axl", { opacity: 0.25 });

  // ---------------------------------------------------------------- 0.0 - 1.5  rapid contrast hook
  hit(0.0, "thump", "open");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  ft("#card", { scale: 1.035 }, { scale: 1, duration: 0.45, ease: "power3.out" }, 0);
  [
    [0, 0.1],
    [1, 0.3],
    [2, 0.65],
  ].forEach(([i, t]) =>
    ft(
      "#mcr" + i,
      { attr: { width: 0 } },
      { attr: { width: PW }, duration: 0.45, ease: "power1.inOut" },
      t,
    ),
  );
  ft(
    "#x0",
    { opacity: 0, scale: 1.5 },
    { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
    0.55,
  );
  ft(
    "#x1",
    { opacity: 0, scale: 1.5 },
    { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
    0.95,
  );
  ft(
    "#x2",
    { opacity: 0, scale: 1.3 },
    { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" },
    1.25,
  );

  // ---------------------------------------------------------------- 1.5 - 2.0  the curve ignites
  hit(1.5, "snap", "ignite");
  burst("#ringI", 10, 110, 0.5, 1.5);
  ft("#gridg", { opacity: 0.25 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.5);
  ft(".axl", { opacity: 0.25 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.5);
  ft(
    "#revE-r",
    { attr: { width: 0 } },
    { attr: { width: X(2.5) - 130 + 12 }, duration: 0.5, ease: "power2.out" },
    1.5,
  );
  ft("#head", { opacity: 0 }, { opacity: 1, duration: 0.1 }, 1.9);
  ft("#hud", { opacity: 0 }, { opacity: 1, duration: 0.15 }, 1.9);

  // ---------------------------------------------------------------- 2.0 - 3.2  the swift scan
  const SC0 = 2.0,
    SC = 1.2,
    xs = (s) => -1 + 2 * s;
  follow("#head", "x", (s) => X(xs(s)), SC0, SC, false, "power2.inOut");
  follow("#head", "y", (s) => Y(f(xs(s))), SC0, SC, false, "power2.inOut");
  follow("#needle", "y2", (s) => KY * dnum(xs(s)), SC0, SC, true, "power2.inOut");
  const LT = 40,
    ang = (s) => Math.atan((dnum(xs(s)) * KY) / KX);
  follow("#tang", "x1", (s) => -LT * Math.cos(ang(s)), SC0, SC, true, "power2.inOut");
  follow("#tang", "y1", (s) => LT * Math.sin(ang(s)), SC0, SC, true, "power2.inOut");
  follow("#tang", "x2", (s) => LT * Math.cos(ang(s)), SC0, SC, true, "power2.inOut");
  follow("#tang", "y2", (s) => -LT * Math.sin(ang(s)), SC0, SC, true, "power2.inOut");
  follow("#revR-r", "width", (s) => 2 * KX * s, SC0, SC, true, "power2.inOut");
  follow("#revP-r", "width", (s) => 2 * KX * s, SC0 + 0.08, SC, true, "power2.inOut");
  scan.forEach((s, i) => {
    tl.set("#hs" + s.k, { opacity: 1 }, s.t);
    tl.set("#hs" + s.k, { opacity: 0 }, i < scan.length - 1 ? scan[i + 1].t : 3.2);
  });
  sparks.forEach((s) =>
    ft(
      "#" + s.id,
      { x: 0, y: 0, opacity: 1 },
      { x: s.dx, y: s.dy, opacity: 0, duration: 0.35, ease: "power2.out" },
      s.t,
    ),
  );

  // ---------------------------------------------------------------- 3.2 - 4.5  the base clamps shut, the tangent shoots down
  const T_LOCK = hit(3.2, "snap", "clamp");
  burst("#ringP", 10, 80, 0.5, T_LOCK);
  tl.to("#needle,#tang", { opacity: 0, duration: 0.1 }, T_LOCK);
  ft("#brk", { opacity: 0 }, { opacity: 1, duration: 0.05 }, T_LOCK);
  ft(
    "#brkL",
    { attr: { x1: O1.x - 54, x2: O1.x - 54 } },
    { attr: { x1: O1.x, x2: O1.x }, duration: 0.2, ease: "power4.out" },
    T_LOCK,
  );
  ft(
    "#brkR",
    { attr: { x1: Q1.x + 54, x2: Q1.x + 54 } },
    { attr: { x1: Q1.x, x2: Q1.x }, duration: 0.2, ease: "power4.out" },
    T_LOCK,
  );
  ft(
    "#brkM",
    { attr: { x1: O1.x - 54, x2: Q1.x + 54 } },
    { attr: { x1: O1.x, x2: Q1.x }, duration: 0.2, ease: "power4.out" },
    T_LOCK,
  );
  pulseW(".brk", 5, 9, T_LOCK);
  tl.set("#dotO,#dotQ", { opacity: 1 }, T_LOCK);
  ft(
    "#lbl-b",
    { opacity: 0, scale: 1.25 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
    T_LOCK + 0.1,
  );
  ft(
    "#drop",
    { opacity: 1, attr: { y2: P1.y } },
    { attr: { y2: Q1.y }, duration: 0.25, ease: "power2.out" },
    T_LOCK,
  );
  ft("#lbl-h", { opacity: 0 }, { opacity: 1, duration: 0.2 }, T_LOCK + 0.2);
  ft(
    "#tgs",
    { opacity: 0.55, attr: { x2: P1.x, y2: P1.y } },
    { attr: { x2: X(1.28), y2: Y(1.28 * f(1)) }, duration: 0.3, ease: "power2.out" },
    T_LOCK,
  );
  ft(
    "#tgl",
    { opacity: 1, attr: { x1: P1.x, y1: P1.y } },
    { attr: { x1: O1.x, y1: O1.y }, duration: 0.3, ease: "power2.in" },
    T_LOCK,
  );
  const T_LAND = hit(3.5, "click", "land");
  ft("#tri", { opacity: 0 }, { opacity: 0.2, duration: 0.3, ease: "power2.out" }, T_LAND);
  ft("#rtang", { opacity: 0 }, { opacity: 1, duration: 0.2 }, T_LAND + 0.05);
  pulseW("#brkL", 5, 10, T_LAND);

  // table + HUD: locked values appear
  tl.set("#hf0", { opacity: 1 }, T_LOCK);
  tl.set("#lv0", { opacity: 1 }, T_LOCK);
  ft("#livebg", { opacity: 0 }, { opacity: 1, duration: 0.25 }, T_LOCK);
  ft(
    "#tr1",
    { opacity: 0, scale: 1.12 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" },
    T_LOCK + 0.05,
  );

  // ---------------------------------------------------------------- 4.5 - 8.5  dynamic upward flight: x 1 -> 2, base rigid at 1.0
  const F0 = hit(4.5, "click", "fly");
  const F = 4.0,
    EF = "power1.inOut",
    xf = (s) => 1 + s;
  burst("#ringm", 18, 62, 0.35, F0);
  follow("#head", "x", (s) => X(xf(s)), F0, F, false, EF);
  follow("#head", "y", (s) => Y(f(xf(s))), F0, F, false, EF);
  follow("#tgl", "x1", (s) => X(xf(s) - 1), F0, F, true, EF);
  follow("#tgl", "x2", (s) => X(xf(s)), F0, F, true, EF);
  follow("#tgl", "y2", (s) => Y(f(xf(s))), F0, F, true, EF);
  follow("#tgs", "x1", (s) => X(xf(s)), F0, F, true, EF);
  follow("#tgs", "y1", (s) => Y(f(xf(s))), F0, F, true, EF);
  follow("#tgs", "x2", (s) => X(xf(s) + 0.28), F0, F, true, EF);
  follow("#tgs", "y2", (s) => Y(1.28 * f(xf(s))), F0, F, true, EF);
  follow("#drop", "x1", (s) => X(xf(s)), F0, F, true, EF);
  follow("#drop", "x2", (s) => X(xf(s)), F0, F, true, EF);
  follow("#drop", "y1", (s) => Y(f(xf(s))), F0, F, true, EF);
  // the clamped base slides rigidly: one translation for every part of it
  follow(["#brk", "#lbl-b", "#dotO", "#dotQ", "#rtang"], "x", (s) => KX * s, F0, F, false, EF);
  follow("#lbl-h", "x", (s) => KX * s, F0, F, false, EF);
  follow("#lbl-h", "y", (s) => midY(xf(s)) - midY(1), F0, F, false, EF);
  follow("#revR-r", "width", (s) => 2 * KX + KX * s, F0, F, true, EF);
  follow("#revP-r", "width", (s) => 2 * KX + KX * s, F0 + 0.1, F, true, EF);
  const triPts = (x) =>
    `${X(x - 1).toFixed(2)},${Y(0).toFixed(2)} ${X(x).toFixed(2)},${Y(0).toFixed(2)} ${X(x).toFixed(2)},${Y(f(x)).toFixed(2)}`;
  for (let k = 0; k < fly.length - 1; k++)
    ft(
      "#tri",
      { attr: { points: triPts(fly[k].x) } },
      { attr: { points: triPts(fly[k + 1].x) }, duration: 0.1, ease: "none" },
      fly[k].t,
    );
  fly.forEach((s, i) => {
    if (i > 0) {
      tl.set("#hf" + s.k, { opacity: 1 }, s.t);
      tl.set("#lv" + s.k, { opacity: 1 }, s.t);
    }
    if (i < fly.length - 1) {
      const tn = fly[i + 1].t;
      tl.set("#hf" + s.k, { opacity: 0 }, tn);
      tl.set("#lv" + s.k, { opacity: 0 }, tn);
    }
  });
  hit(6.5, "click", "mid");
  burst("#ringm", 18, 62, 0.35, 6.5);

  // ---------------------------------------------------------------- 8.5 - 9.5  anchored at x = 2.0, cohesive neon pulse
  const T_TOP = hit(8.5, "snap", "top");
  burst("#ringm", 18, 110, 0.6, T_TOP);
  pulseW("#tgl", 5, 10, T_TOP);
  pulseW("#drop", 5, 10, T_TOP);
  pulseW(".brk", 5, 10, T_TOP);
  pulseW("#trR", 7, 12, T_TOP);
  pulseW("#trP", 3.5, 7, T_TOP);
  pulseW("#base", 4, 8, T_TOP);
  ft("#tri", { opacity: 0.2 }, { opacity: 0.4, duration: 0.15, ease: "power2.out" }, T_TOP);
  tl.to("#tri", { opacity: 0.2, duration: 0.4, ease: "power2.inOut" }, T_TOP + 0.15);

  // ---------------------------------------------------------------- banner
  swap("#BA", "#BB", 2.5);
  swap("#BB", "#BC", 5.5);
  const T_FINAL = hit(9.5, "thump", "final");
  swap("#BC", "#BD", T_FINAL);
  ft("#BD", { scale: 1.04 }, { scale: 1, duration: 0.3, ease: "power2.out" }, T_FINAL + 0.075);

  // ---------------------------------------------------------------- zone 4: one card, pages cross-fade, never blank
  tl.to("#pA", { opacity: 0, duration: 0.3, ease: "power1.in" }, 2.5);
  ft("#pB", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power1.out" }, 2.55);
  tl.to("#pB", { opacity: 0, duration: 0.12, ease: "power1.in" }, 10.5);
  ft("#card", { scale: 1 }, { scale: 1.1, duration: 0.6, ease: "power2.inOut" }, 10.5);
  hit(10.5, "snap", "cta");
  ft("#ct1a,#ct1b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 10.5);
  ft("#ct2a,#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 10.65);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 10.8);
  hit(12.0, "click", "pulse");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.9, duration: 0.2, ease: "power2.out" }, 12.0);
  tl.to("#ctaglow", { opacity: 0, duration: 0.5, ease: "power2.in" }, 12.3);
  ft(
    "#ct2a,#ct2b",
    { textShadow: "0 0 0px rgba(0,136,255,0)" },
    { textShadow: `0 0 18px ${COL.blue}`, duration: 0.25, ease: "power2.out" },
    12.0,
  );
  tl.to(
    "#ct2a,#ct2b",
    { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.4, ease: "power2.in" },
    12.3,
  );

  tl.to({}, { duration: 0.0001 }, 14.9999); // 14.8 - 15.0: static zero-delta hold
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
