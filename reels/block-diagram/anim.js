// Timeline for "BLOCK DIAGRAM REDUCTION" (31.0 s).
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const r2 = (v) => Math.round(v * 100) / 100;

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the monster diagram
    [2.2, "click"], // rule 1 named
    [2.9, "snap"], // G3 and G4 merge
    [3.55, "click"], // ledger line 1
    [4.9, "click"], // rule 2 named
    [5.6, "snap"], // take-off point slides past G7
    [6.25, "click"], // ledger line 2
    [7.6, "click"], // rule 3 named
    [8.3, "snap"], // G6 and G7 fold into one loop block
    [8.95, "click"], // ledger line 3
    [10.3, "click"], // rule 4 named
    [11.0, "snap"], // series blocks multiply
    [11.65, "click"], // ledger line 4
    [13.0, "click"], // rule 2 again
    [13.7, "snap"], // take-off point moves back
    [14.35, "click"], // ledger line 5
    [15.7, "click"], // rule 1 again
    [16.4, "snap"], // G2 and the new branch merge
    [17.05, "click"], // ledger line 6
    [18.4, "click"], // close the loops
    [19.2, "click"], // loop 1 named
    [19.75, "click"], // loop 2 named
    [20.4, "click"], // loop formula
    [21.6, "snap"], // four blocks become one
    [22.6, "click"], // substitute and clear the fractions
    [23.2, "click"], // the full expression
    [24.4, "thump"], // lock
    [25.6, "click"], // 8 blocks gone in 6 moves
    [27.6, "snap"], // CTA reveal
    [29.8, "click"], // engagement pulse
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
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
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

  // ---------------------------------------------------------------- 0.0 - 2.2  the monster, the crossed-out brute force
  hit(0.0, "thump", "#flash0");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  ft("#dgw", { scale: 1.035 }, { scale: 1, duration: 0.45, ease: "power3.out" }, 0);

  // ---------------------------------------------------------------- stages 1 - 7
  const ST = CFG.ST;
  const HL = {
    1: ["g3", "g4"],
    2: ["g5"],
    3: ["g6", "g7"],
    4: ["g34", "gl"],
    5: ["g57b"],
    6: ["g2b", "g5n"],
  };
  /** the diagram changes: elements of state k-1 leave (merging blocks slide together), elements of state k arrive */
  function merge(k, m) {
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
            { x: e.mergeTo[0] - e.cx, y: e.mergeTo[1] - e.cy, duration: 0.4, ease: "power2.in" },
            m,
          );
          ft(
            "#" + e.id,
            { opacity: 1 },
            { opacity: 0, duration: 0.15, ease: "power1.in" },
            m + 0.25,
          );
        } else {
          ft("#" + e.id, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, m);
        }
      });
    CFG.el
      .filter((e) => e.from === k)
      .forEach((e) => {
        if (e.blk)
          ft(
            "#" + e.id,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
            m + 0.3,
          );
        else
          ft(
            "#" + e.id,
            { opacity: 0 },
            { opacity: 1, duration: 0.25, ease: "power1.out" },
            m + 0.2,
          );
      });
  }
  const glow = (ids, at) =>
    ids.forEach((id) =>
      ft(
        "#" + id,
        { borderColor: "rgba(255,255,255,0.7)", boxShadow: "0 0 0px rgba(176,38,255,0)" },
        {
          borderColor: "#B026FF",
          boxShadow: "0 0 26px rgba(176,38,255,0.85)",
          duration: 0.3,
          ease: "power2.out",
        },
        at,
      ),
    );

  for (let k = 1; k <= 6; k++) {
    const s0 = ST[k],
      m = r2(s0 + 0.7);
    hit(s0, "click", "#bn" + k);
    bnSwap("#bn" + k, s0);
    if (k === 1) ft("#hook", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, s0);
    glow(HL[k], s0 + 0.2);
    merge(k, m);
    if (k === 2) {
      // the take-off point travels along the wire past G7
      const T = CFG.tap;
      ft("#tapd", { opacity: 0, x: 0 }, { opacity: 1, duration: 0.01 }, m - 0.1);
      ft("#tapd", { x: 0 }, { x: T.x1 - T.x0, duration: 0.55, ease: "power2.inOut" }, m);
      ft("#tapd", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, m + 0.55);
    }
    hit(r2(s0 + 1.35), "click", "#f" + k);
    pop("#f" + k, r2(s0 + 1.35));
  }

  // ---------------------------------------------------------------- stage 7: name the two loops, close them, clear the fractions
  const S7 = ST[7];
  hit(S7, "click", "#bn7");
  bnSwap("#bn7", S7);
  for (let k = 1; k <= 6; k++)
    ft("#f" + k, { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, S7);
  const paint = (c, o, at) => {
    const sel = o.wires.map((w) => `#${w} path`).join(",");
    const hd = o.wires.map((w) => `#${w} polygon`).join(",");
    ft(
      sel,
      { stroke: "rgba(255,255,255,0.78)", strokeWidth: 3 },
      { stroke: c, strokeWidth: 6, duration: 0.3, ease: "power2.out" },
      at,
    );
    ft(hd, { fill: "rgba(255,255,255,0.9)" }, { fill: c, duration: 0.3, ease: "power2.out" }, at);
    o.blocks.forEach((id) =>
      ft(
        "#" + id,
        { borderColor: "rgba(255,255,255,0.7)" },
        { borderColor: c, duration: 0.3, ease: "power2.out" },
        at,
      ),
    );
  };
  hit(19.2, "click", "#l1");
  paint("#B026FF", CFG.loop1, 19.2);
  pop("#l1", 19.2);
  hit(19.75, "click", "#l2");
  paint("#FF0044", CFG.loop2, 19.75);
  pop("#l2", 19.75);
  hit(20.4, "click", "#l3");
  pop("#l3", 20.4);
  merge(7, 21.6);
  hit(22.6, "click", "#cap");
  pop("#cap", 22.6, 8);
  hit(23.2, "click", "#fin");
  pop("#fin", 23.2);

  // ---------------------------------------------------------------- the lock: sweep, glints, sparks, two rings, glow, check, pulse
  const R = CFG.res,
    T = 24.4;
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

  hit(25.6, "click", "#bnF");
  bnSwap("#bnF", 25.6);

  // ---------------------------------------------------------------- CTA
  hit(27.6, "snap", "#card");
  ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 27.5);
  ft("#banner", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 27.5);
  ft("#card", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, 27.6);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 27.7);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 28.0);
  ft("#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 28.3);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 28.7);
  hit(29.8, "click", "#ctaglow");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.45, duration: 0.2, ease: "power2.out" }, 29.8);
  tl.fromTo(
    "#ctaglow",
    { opacity: 0.45 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    30.1,
  );

  tl.to({}, { duration: 0.0001 }, 30.9999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
