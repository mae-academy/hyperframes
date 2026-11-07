// Timeline for "THE KING'S PROPERTY" (42.0 s).
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the calm exam question
    [4.5, "click"], // integration by parts is chosen
    [5.0, "click"], // by-parts line
    [6.4, "click"], // boundary term evaluates
    [7.6, "snap"], // the monster is left behind
    [9.0, "click"], // arctan becomes a complex logarithm
    [10.2, "click"], // Euler expansion
    [11.6, "snap"], // the wall begins: 4 terms
    [13.4, "click"], // 16 terms
    [15.2, "click"], // 64 terms
    [17.0, "click"], // 100+ terms
    [18.8, "click"], // 4 days and 7 cups of coffee
    [25.9, "snap"], // the crimson slash
    [26.2, "thump"], // implosion into dust
    [27.0, "click"], // the original integral alone in the void
    [27.9, "thump"], // the King's property appears (bell)
    [29.0, "click"], // substitute pi - x
    [30.2, "click"], // identities
    [31.0, "click"], // the rewritten integral
    [31.9, "snap"], // the last term is I
    [32.6, "click"], // 2I = pi * integral
    [33.4, "click"], // u = cos x
    [33.9, "click"], // arctan form
    [34.5, "click"], // evaluate at the limits
    [35.0, "click"], // pi (pi/4 + pi/4)
    [35.8, "thump"], // lock: I = pi^2/4
    [36.6, "click"], // punchline
    [38.4, "snap"], // CTA reveal
    [40.0, "click"], // engagement pulse
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
  const pop = (sel, at, y) =>
    ft(
      sel,
      { opacity: 0, y: y === undefined ? 14 : y },
      { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
      at,
    );
  let curBanner = "#bn0";
  function bnSwap(n, t) {
    ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
    curBanner = n;
  }
  const burst = (el, r0, r1, dur, at) =>
    ft(
      el,
      { attr: { r: r0 }, opacity: 0.95 },
      { attr: { r: r1 }, opacity: 0, duration: dur, ease: "power2.out" },
      at,
    );

  // frame 0 shows the calm question, fully formed
  gsap.set("#I0,#lab0", { opacity: 1 });

  // ---------------------------------------------------------------- Act I  0.0 - 4.5  the deceptive calm
  hit(0.0, "thump", "#flash0");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  ft("#I0", { scale: 1.035 }, { scale: 1, duration: 0.45, ease: "power3.out" }, 0);

  // ---------------------------------------------------------------- Act II  4.5 - 11.6  the brute-force trap
  hit(4.5, "click", "#bn1");
  bnSwap("#bn1", 4.5);
  tl.fromTo(
    "#pg0",
    { opacity: 1 },
    { opacity: 0, duration: 0.2, ease: "power1.in", immediateRender: false },
    4.5,
  );
  ft("#pg1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, 4.6);
  hit(5.0, "click", "#L1");
  pop("#L1", 5.0);
  hit(6.4, "click", "#L2");
  pop("#L2", 6.4);
  hit(7.6, "snap", "#L3");
  pop("#L3", 7.6);
  bnSwap("#bn2", 7.6);
  hit(9.0, "click", "#L4");
  pop("#L4", 9.0);
  bnSwap("#bn3", 9.0);
  hit(10.2, "click", "#L5");
  pop("#L5", 10.2);

  // ---------------------------------------------------------------- Act III  11.6 - 25.0  the wall
  const S = CFG.stages;
  hit(11.6, "snap", "#chip");
  tl.fromTo(
    "#pg1",
    { opacity: 1 },
    { opacity: 0, duration: 0.3, ease: "power1.in", immediateRender: false },
    11.5,
  );
  ft("#wall", { opacity: 0 }, { opacity: 1, duration: 0.1, ease: "none" }, 11.6);
  ft(
    "#chip",
    { opacity: 0, scale: 0.85 },
    { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" },
    11.6,
  );
  bnSwap("#bn4", 11.6);
  // the camera pulls back: 3.0 -> 1.0 while the wall fills up, then drifts
  ft("#wall", { scale: 3 }, { scale: 1, duration: 8.4, ease: "power2.inOut" }, 11.6);
  ft("#wall", { x: 0, y: 0 }, { x: -34, y: 22, duration: 5, ease: "none" }, 20);
  for (const c of CFG.cells)
    ft(
      "#c" + c.id,
      { opacity: 0, scale: 1.25 },
      { opacity: 1, scale: 1, duration: 0.12, ease: "power2.out" },
      c.t,
    );
  S.forEach((s, i) => {
    if (!i) return;
    const sel = "#n" + i;
    hit(s.t, "click", sel);
    ft("#n" + (i - 1), { opacity: 1 }, { opacity: 0, duration: 0.1, ease: "power1.in" }, s.t);
    ft(
      sel,
      { opacity: 0, scale: 1.3 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
      s.t,
    );
  });
  bnSwap("#bn5", 13.4);
  bnSwap("#bn6", 15.2);
  // in-place recalculation: each flash swaps a cell between its two renderings
  for (const f of CFG.flashes) {
    ft(
      "#c" + f.cell + "a",
      { opacity: f.toB ? 1 : 0 },
      { opacity: f.toB ? 0 : 1, duration: 0.001, ease: "none" },
      f.t,
    );
    ft(
      "#c" + f.cell + "b",
      { opacity: f.toB ? 0 : 1 },
      { opacity: f.toB ? 1 : 0, duration: 0.001, ease: "none" },
      f.t,
    );
  }
  hit(18.8, "click", "#bn7");
  bnSwap("#bn7", 18.8);

  // ---------------------------------------------------------------- Act IV  25.0 - 38.3  the collapse and the shortcut
  ft(
    "#wall",
    { filter: "brightness(1)" },
    { filter: "brightness(0.55)", duration: 0.2, ease: "power2.out" },
    25.0,
  ); // everything halts
  bnSwap("#bn8", 25.2);
  hit(25.9, "snap", "#slash");
  ft("#slash", { opacity: 0 }, { opacity: 1, duration: 0.02, ease: "none" }, 25.9);
  ft(
    "#slash",
    { strokeDashoffset: 1338 },
    { strokeDashoffset: 0, duration: 0.24, ease: "power2.in" },
    25.9,
  );
  hit(26.2, "thump", "#dust");
  ft("#dust", { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, 26.2);
  ft("#dust", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, 26.65);
  const wc = CFG.wallCenter;
  CFG.dust.forEach((d, i) =>
    ft(
      "#d" + i,
      { x: 0, y: 0 },
      { x: wc.x - d.x, y: wc.y - d.y, duration: 0.7, ease: "power3.in" },
      26.2,
    ),
  );
  ft(
    "#wall",
    { scale: 1, opacity: 1 },
    { scale: 0.02, opacity: 0, duration: 0.7, ease: "power3.in" },
    26.2,
  );
  ft("#slash", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, 26.5);
  ft("#chip", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, 26.2);
  ft(
    "#ringC",
    { attr: { r: 300 }, opacity: 0.8 },
    { attr: { r: 8 }, opacity: 0, duration: 0.7, ease: "power3.in" },
    26.2,
  );

  // Step 1: the King's property
  ft("#pg3", { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, 26.95);
  hit(27.0, "click", "#I1");
  pop("#I1", 27.0, 10);
  hit(27.9, "thump", "#KP");
  ft("#kpLab", { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, 27.9);
  ft(
    "#KP",
    { opacity: 0, scale: 1.2 },
    { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
    27.9,
  );
  bnSwap("#bn9", 27.9);
  hit(29.0, "click", "#S1");
  pop("#S1", 29.0);
  bnSwap("#bn10", 29.0);
  hit(30.2, "click", "#S2");
  pop("#S2", 30.2);
  hit(31.0, "click", "#rowE");
  pop("#rowE", 31.0);
  hit(31.9, "snap", "#hlbox");
  ft(
    "#hlbox",
    { opacity: 0, scale: 1.2 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
    31.9,
  );
  pop("#tagI", 32.0, 8);
  bnSwap("#bn11", 31.9);

  // Step 2: the two-second execution
  tl.fromTo(
    "#pg3",
    { opacity: 1 },
    { opacity: 0, duration: 0.2, ease: "power1.in", immediateRender: false },
    32.4,
  );
  ft("#pg4", { opacity: 0 }, { opacity: 1, duration: 0.05, ease: "none" }, 32.55);
  hit(32.6, "click", "#Q1");
  pop("#Q1", 32.6);
  hit(33.4, "click", "#Q2");
  pop("#Q2", 33.4);
  bnSwap("#bn12", 33.4);
  hit(33.9, "click", "#Q3");
  pop("#Q3", 33.9);
  hit(34.5, "click", "#Q4");
  pop("#Q4", 34.5);
  hit(35.0, "click", "#Q5");
  pop("#Q5", 35.0);

  // the lock: sweep, glints, sparks, two shock rings, glow, check mark, pulse
  const R = CFG.res,
    T = 35.8;
  hit(T, "thump", "#glow");
  ft("#glow", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, T);
  tl.fromTo(
    "#glow",
    { opacity: 1 },
    { opacity: 0.4, duration: 0.8, ease: "power2.inOut", immediateRender: false },
    T + 0.15,
  );
  ft(
    "#R",
    { opacity: 0, scale: 1.25 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
    T,
  );
  ft(
    "#resbox",
    { opacity: 0, strokeDashoffset: 2 * (R.w + R.h) },
    { opacity: 1, strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" },
    T,
  );
  ft(
    "#sweep",
    { opacity: 0, x: R.cx - R.w / 2 },
    { opacity: 1, x: R.cx + R.w / 2, duration: 0.45, ease: "power2.inOut" },
    T,
  );
  ft("#sweep", { opacity: 1 }, { opacity: 0, duration: 0.1, ease: "none" }, T + 0.45);
  for (let i = 0; i < 4; i++) {
    ft(
      "#gl" + i,
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 0.15, ease: "power2.out" },
      T + 0.1 + i * 0.05,
    );
    ft(
      "#gl" + i,
      { opacity: 1 },
      { opacity: 0, duration: 0.3, ease: "power1.in" },
      T + 0.3 + i * 0.05,
    );
  }
  for (let i = 0; i < 16; i++) {
    const el = document.getElementById("sk" + i);
    const a = parseFloat(el.dataset.a),
      d = parseFloat(el.dataset.d);
    ft(
      el,
      { opacity: 0.95, x: 0, y: 0 },
      { opacity: 0, x: Math.cos(a) * d, y: Math.sin(a) * d, duration: 0.75, ease: "power2.out" },
      T + 0.05,
    );
  }
  burst("#ringL1", 10, 260, 0.6, T);
  burst("#ringL2", 10, 200, 0.5, T + 0.1);
  ft(
    "#check",
    { opacity: 1, strokeDashoffset: 130 },
    { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" },
    T + 0.35,
  );
  ft(
    "#resbox",
    { strokeWidth: 5 },
    { strokeWidth: 9, duration: 0.15, ease: "power2.out" },
    T + 0.5,
  );
  tl.fromTo(
    "#resbox",
    { strokeWidth: 9 },
    { strokeWidth: 5, duration: 0.35, ease: "power2.inOut", immediateRender: false },
    T + 0.65,
  );

  hit(36.6, "click", "#bn13");
  bnSwap("#bn13", 36.6);

  // ---------------------------------------------------------------- CTA  38.3 - 42.0
  hit(38.4, "snap", "#card");
  ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 38.3);
  ft("#banner", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 38.3);
  ft("#card", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, 38.4);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 38.5);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 38.8);
  ft("#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 39.1);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 39.5);
  hit(40.0, "click", "#ctaglow");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.9, duration: 0.2, ease: "power2.out" }, 40.0);
  tl.fromTo(
    "#ctaglow",
    { opacity: 0.9 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    40.3,
  );

  tl.to({}, { duration: 0.0001 }, 41.9999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
