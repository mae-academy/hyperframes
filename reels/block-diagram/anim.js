// Timeline for "BLOCK DIAGRAM REDUCTION" (26.5 s).
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
    [2.0, "click"], // rule 1 named
    [2.55, "snap"], // G3 and G4 merge
    [3.1, "click"], // ledger line 1
    [4.3, "click"], // rule 2 named
    [4.85, "snap"], // take-off point slides past G7
    [5.4, "click"], // ledger line 2
    [6.6, "click"], // rule 3 named
    [7.15, "snap"], // G6 and G7 fold into one loop block
    [7.7, "click"], // ledger line 3
    [8.9, "click"], // rule 4 named
    [9.45, "snap"], // series blocks multiply
    [10.0, "click"], // ledger line 4
    [11.2, "click"], // rule 2 again
    [11.75, "snap"], // take-off point moves back
    [12.3, "click"], // ledger line 5
    [13.5, "click"], // rule 1 again
    [14.05, "snap"], // G2 and the new branch merge
    [14.6, "click"], // ledger line 6
    [15.8, "click"], // close the loops
    [16.2, "click"], // loop 1 traced and named
    [17.2, "click"], // loop 2 traced and named
    [18.2, "click"], // both loops touch at p: 1 - (L1 + L2)
    [19.4, "snap"], // four blocks become one
    [20.2, "click"], // substitute and clear the fractions
    [20.8, "click"], // the full expression
    [21.8, "thump"], // lock
    [23.6, "snap"], // CTA reveal
    [25.6, "click"], // engagement pulse
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
      m = r2(s0 + 0.55);
    hit(s0, "click", "#bn" + k);
    bnSwap("#bn" + k, s0);
    if (k === 1) ft("#hook", { opacity: 1 }, { opacity: 0, duration: 0.25, ease: "power1.in" }, s0);
    glow(HL[k], s0 + 0.15);
    merge(k, m);
    if (k === 2) {
      // the take-off point travels along the wire past G7
      const T = CFG.tap;
      ft("#tapd", { opacity: 0, x: 0 }, { opacity: 1, duration: 0.01 }, m - 0.1);
      ft("#tapd", { x: 0 }, { x: T.x1 - T.x0, duration: 0.55, ease: "power2.inOut" }, m);
      ft("#tapd", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, m + 0.55);
    }
    hit(r2(s0 + 1.1), "click", "#f" + k);
    pop("#f" + k, r2(s0 + 1.1));
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
  /** a dot runs once around a loop (the loop gain is the product of everything it passes) */
  const trace = (id, pts, at) => {
    let t = at;
    ft("#" + id, { opacity: 0, x: pts[0][0], y: pts[0][1] }, { opacity: 1, duration: 0.01 }, t);
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / 1100;
      ft(
        "#" + id,
        { x: pts[i - 1][0], y: pts[i - 1][1] },
        { x: pts[i][0], y: pts[i][1], duration: d, ease: "none" },
        t,
      );
      t += d;
    }
    ft("#" + id, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in" }, t);
  };
  const tag = (id, c, at) => {
    ft(
      "#" + id,
      { borderColor: "rgba(255,255,255,0.7)" },
      { borderColor: c, duration: 0.2, ease: "power2.out" },
      at,
    );
    ft(
      "#" + id,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
      at,
    );
  };
  hit(16.2, "click", "#l1");
  paint("#B026FF", CFG.loop1, 16.2);
  trace("tr1", CFG.lp1, 16.2);
  tag("dl1", "#B026FF", 16.2);
  pop("#l1", 16.2);
  hit(17.2, "click", "#l2");
  paint("#FF0044", CFG.loop2, 17.2);
  trace("tr2", CFG.lp2, 17.2);
  tag("dl2", "#FF0044", 17.2);
  pop("#l2", 17.2);
  hit(18.2, "click", "#l3");
  burst("#ringP", 8, 46, 0.5, 18.2);
  pop("#l3", 18.2);
  merge(7, 19.4);
  hit(20.2, "click", "#cap");
  pop("#cap", 20.2, 8);
  hit(20.8, "click", "#fin");
  pop("#fin", 20.8);

  // ---------------------------------------------------------------- the lock: sweep, glints, sparks, two rings, glow, check, pulse
  const R = CFG.res,
    T = 21.8;
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

  bnSwap("#bnF", T);

  // ---------------------------------------------------------------- CTA
  hit(23.6, "snap", "#card");
  ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 23.5);
  ft("#banner", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, 23.5);
  ft("#card", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, 23.6);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 23.7);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 24.0);
  ft("#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 24.3);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 24.7);
  hit(25.6, "click", "#ctaglow");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.45, duration: 0.2, ease: "power2.out" }, 25.6);
  tl.fromTo(
    "#ctaglow",
    { opacity: 0.45 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    25.9,
  );

  tl.to({}, { duration: 0.0001 }, 26.4999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
})();
