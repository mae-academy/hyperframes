// Timeline for "BLOCK DIAGRAM REDUCTION" (46.0 s).
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the monster diagram
    [3.6, "click"], // forget the equations
    [4.8, "click"], // rule 1 named
    [6.0, "snap"], // G3 and G4 merge
    [6.8, "click"], // ledger line 1
    [9.4, "click"], // rule 2 named
    [10.6, "snap"], // take-off point slides past G7
    [11.4, "click"], // ledger line 2
    [14.0, "click"], // rule 3 named
    [15.2, "snap"], // G6 and G7 fold into one loop block
    [16.0, "click"], // ledger line 3
    [18.6, "click"], // rule 4 named
    [19.8, "snap"], // series blocks multiply
    [20.6, "click"], // ledger line 4
    [23.2, "click"], // rule 2 again
    [24.4, "snap"], // take-off point moves back
    [25.2, "click"], // ledger line 5
    [27.8, "click"], // rule 1 again
    [29.0, "snap"], // G2 and the new branch merge
    [29.8, "click"], // ledger line 6
    [32.4, "click"], // close the loops
    [33.6, "snap"], // four blocks become one
    [34.4, "click"], // the closing formula
    [35.7, "click"], // the full expression
    [36.6, "thump"], // lock
    [37.8, "click"], // 8 blocks gone in 6 moves
    [40.8, "snap"], // CTA reveal
    [43.2, "click"], // engagement pulse
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

  // ---------------------------------------------------------------- 0.0 - 3.6  the monster, the crossed-out brute force
  hit(0.0, "thump", "#flash0");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  ft("#dgw", { scale: 1.035 }, { scale: 1, duration: 0.45, ease: "power3.out" }, 0);
  hit(3.6, "click", "#bnH");
  bnSwap("#bnH", 3.6);
  ft("#hook", { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, 3.6);

  // ---------------------------------------------------------------- stages 1 - 6: one rule each, then the ledger line
  const ST = CFG.ST;
  const HL = {
    1: ["g3", "g4"],
    2: ["g5"],
    3: ["g6", "g7"],
    4: ["g34", "gl"],
    5: ["g57b"],
    6: ["g2b", "g5n"],
    7: ["g1b", "gf", "ga", "g8b"],
  };
  function stage(k) {
    const s0 = ST[k],
      m = s0 + 1.2;
    hit(s0, "click", "#bn" + k);
    bnSwap("#bn" + k, s0);
    // the blocks about to be merged light up
    HL[k].forEach((id) =>
      ft(
        "#" + id,
        { borderColor: "rgba(255,255,255,0.7)", boxShadow: "0 0 0px rgba(176,38,255,0)" },
        {
          borderColor: "#B026FF",
          boxShadow: "0 0 26px rgba(176,38,255,0.85)",
          duration: 0.4,
          ease: "power2.out",
        },
        s0 + 0.5,
      ),
    );
    // the merge
    hit(m, "snap", "#n" + k);
    ft("#n" + (k - 1), { opacity: 1 }, { opacity: 0, duration: 0.1, ease: "power1.in" }, m);
    ft(
      "#n" + k,
      { opacity: 0, scale: 1.3 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
      m,
    );
    CFG.el
      .filter((e) => e.to === k - 1)
      .forEach((e) => {
        if (e.blk && e.mergeTo) {
          ft(
            "#" + e.id,
            { x: 0, y: 0 },
            { x: e.mergeTo[0] - e.cx, y: e.mergeTo[1] - e.cy, duration: 0.5, ease: "power2.in" },
            m,
          );
          ft("#" + e.id, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in" }, m + 0.3);
        } else {
          ft("#" + e.id, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, m);
        }
      });
    CFG.el
      .filter((e) => e.from === k)
      .forEach((e) => {
        if (e.blk)
          ft(
            "#" + e.id,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
            m + 0.4,
          );
        else
          ft(
            "#" + e.id,
            { opacity: 0 },
            { opacity: 1, duration: 0.3, ease: "power1.out" },
            m + 0.3,
          );
      });
    return m;
  }
  for (let k = 1; k <= 6; k++) {
    const m = stage(k);
    if (k === 2) {
      // the take-off point travels along the wire past G7
      const T = CFG.tap;
      ft("#tapd", { opacity: 0, x: 0 }, { opacity: 1, duration: 0.01 }, m - 0.2);
      ft("#tapd", { x: 0 }, { x: T.x1 - T.x0, duration: 0.7, ease: "power2.inOut" }, m);
      ft("#tapd", { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in" }, m + 0.75);
    }
    hit(ST[k] + 2.0, "click", "#f" + k);
    pop("#f" + k, ST[k] + 2.0);
  }

  // ---------------------------------------------------------------- stage 7: four blocks become one, the loops close
  const m7 = stage(7);
  for (let k = 1; k <= 6; k++)
    ft("#f" + k, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: "power1.in" }, ST[7]);
  hit(34.4, "click", "#clos");
  pop("#clos", 34.4);
  pop("#closcap", 34.6, 8);
  hit(35.7, "click", "#fin");
  pop("#fin", 35.7);
  void m7;

  // ---------------------------------------------------------------- the lock: sweep, glints, sparks, two rings, glow, check, pulse
  const R = CFG.res,
    T = 36.6;
  hit(T, "thump", "#glow");
  ft("#glow", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, T);
  tl.fromTo(
    "#glow",
    { opacity: 1 },
    { opacity: 0.4, duration: 0.8, ease: "power2.inOut", immediateRender: false },
    T + 0.15,
  );
  ft("#fin", { scale: 1.06 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, T);
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
  burst("#ringL1", 10, 300, 0.6, T);
  burst("#ringL2", 10, 230, 0.5, T + 0.1);
  ft(
    "#check",
    { opacity: 1, strokeDashoffset: 120 },
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

  hit(37.8, "click", "#bnF");
  bnSwap("#bnF", 37.8);

  // ---------------------------------------------------------------- CTA
  hit(40.8, "snap", "#card");
  ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 40.7);
  ft("#banner", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 40.7);
  ft("#card", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, 40.8);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 40.9);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 41.2);
  ft("#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 41.5);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 41.9);
  hit(43.2, "click", "#ctaglow");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.9, duration: 0.2, ease: "power2.out" }, 43.2);
  tl.fromTo(
    "#ctaglow",
    { opacity: 0.9 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    43.5,
  );

  tl.to({}, { duration: 0.0001 }, 45.9999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
