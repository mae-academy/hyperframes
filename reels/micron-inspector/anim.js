// Timeline for "THE MICRON INSPECTOR: AI VISION ON A CNC LINE" (15.0 s).
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { V, XC, XD, BELT_Y, T_DIV, SCANS, BIN, PW, parts } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const r3 = (v) => Math.round(v * 1000) / 1000;

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact
    [1.5, "snap"], // the line wakes up
    [2.4, "click"], // scan part 1 (PASS)
    [4.2, "click"], // scan part 2 (REJECT)
    [5.4, "snap"], // diverter fires on part 2
    [6.0, "click"], // scan part 3 (PASS)
    [7.8, "click"], // scan part 4 (REJECT)
    [9.0, "snap"], // diverter fires on part 4
    [9.5, "thump"], // 100 % inspected, lock
    [10.5, "snap"], // CTA reveal
    [12.0, "click"], // engagement pulse
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

  // initial pose: every part rides the belt at constant speed, centred under the camera at its scan time
  parts.forEach((p) => gsap.set("#p" + p.i, { x: XC - V * SCANS[p.i], y: BELT_Y }));

  // ---------------------------------------------------------------- belt: constant speed (ticks), parts follow the same law
  ft("#ticks", { x: 0 }, { x: V * 15, duration: 15, ease: "none" }, 0);
  let nRej = 0;
  const rejAt = [];
  parts.forEach((p) => {
    const i = p.i,
      S = SCANS[i],
      X0 = XC - V * S;
    if (!p.reject) {
      ft("#p" + i, { x: X0 }, { x: X0 + V * 15, duration: 15, ease: "none" }, 0);
      return;
    }
    const tR = r3(S + T_DIV);
    rejAt.push(tR);
    ft("#p" + i, { x: X0 }, { x: XD, duration: tR, ease: "none" }, 0);
    // the diverter pushes it off the belt into the bin
    const k = nRej++;
    ft("#p" + i, { x: XD }, { x: BIN.x[k], duration: 0.55, ease: "power2.out" }, tR);
    ft("#p" + i, { y: BELT_Y }, { y: BIN.y, duration: 0.55, ease: "power2.out" }, tR);
    ft("#p" + i, { scale: 1 }, { scale: BIN.s, duration: 0.55, ease: "power2.out" }, tR);
    ft("#arm", { y: 0 }, { y: 270, duration: 0.4, ease: "power2.out" }, tR);
    tl.to("#arm", { y: 0, duration: 0.5, ease: "power2.inOut" }, tR + 0.55);
  });

  // ---------------------------------------------------------------- 0.0 - 1.5  hook: the failures, crossed out
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

  // ---------------------------------------------------------------- 1.5  the line wakes up
  hit(1.5, "snap", "ignite");
  burst("#ringI", 10, 120, 0.5, 1.5);
  ft("#arena", { opacity: 0.3 }, { opacity: 1, duration: 0.5, ease: "power2.out" }, 1.5);
  ft("#hud", { opacity: 0 }, { opacity: 1, duration: 0.15 }, 2.3);

  // ---------------------------------------------------------------- the four scans
  parts.forEach((p) => {
    const i = p.i,
      S = SCANS[i];
    hit(S, "click", "scan:" + (p.reject ? "R" : "P"));
    ft("#scanline", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power2.out" }, S);
    ft("#ret", { opacity: 1 }, { opacity: 0, duration: 0.5, ease: "power2.out" }, S);
    ft("#dm" + i, { opacity: 0 }, { opacity: 1, duration: 0.1 }, S);
    tl.to("#dm" + i, { opacity: 0, duration: 0.15 }, S + 0.4);
    if (p.reject) {
      ft("#df" + i, { opacity: 0 }, { opacity: 1, duration: 0.1 }, S + 0.1);
      ft("#pr" + i, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, S + 0.2);
    } else burst("#ok" + i, HOLE_R(), 40, 0.45, S + 0.05);
    ft("#tg" + i, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, S + 0.35);
    // readouts: HUD holds the latest part, the log accumulates
    tl.set("#hd" + i, { opacity: 1 }, r3(S + 0.1));
    if (i < SCANS.length - 1) tl.set("#hd" + i, { opacity: 0 }, r3(SCANS[i + 1] + 0.1));
    ft(
      "#lg" + i,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
      S + 0.35,
    );
  });
  function HOLE_R() {
    return 24;
  }

  rejAt.forEach((tR) => {
    hit(tR, "snap", "rej");
    burst("#ringR", 20, 120, 0.5, tR);
  });

  // ---------------------------------------------------------------- 9.5  everything inspected: lock
  const T_FINAL = hit(9.5, "thump", "final");
  swap("#BC", "#BD", T_FINAL);
  ft("#BD", { scale: 1.04 }, { scale: 1, duration: 0.3, ease: "power2.out" }, T_FINAL + 0.075);
  ft("#sweep", { opacity: 0.9, x: 0 }, { x: 895, duration: 0.5, ease: "power2.inOut" }, T_FINAL);
  tl.to("#sweep", { opacity: 0, duration: 0.15 }, T_FINAL + 0.4);
  ft("#lockb", { opacity: 0 }, { opacity: 1, duration: 0.15 }, T_FINAL + 0.1);
  ft(
    "#lockk",
    { attr: { "stroke-dashoffset": 50 } },
    { attr: { "stroke-dashoffset": 0 }, duration: 0.3, ease: "power2.out" },
    T_FINAL + 0.15,
  );
  burst("#ringI", 14, 110, 0.6, T_FINAL);

  // ---------------------------------------------------------------- banner and card pages
  swap("#BA", "#BB", 2.5);
  swap("#BB", "#BC", 5.5);
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
    { textShadow: "0 0 18px #0088FF", duration: 0.25, ease: "power2.out" },
    12.0,
  );
  tl.to(
    "#ct2a,#ct2b",
    { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.4, ease: "power2.in" },
    12.3,
  );

  tl.to({}, { duration: 0.0001 }, 14.9999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
