/* THE R-MATRIX TRICK: 13.0 s, GSAP 3.12.5, one paused root timeline: window.__timelines["main"].
   DATA (groups, tracer paths, flight offsets) is injected by build_index.py. Whole file, rewritten as a unit. */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"], // Hook strike
  [0.04, "snap"], // Stage activation
  [2.0, "click"], // Mesh 1 tracer start
  [2.8, "snap"], // R11 locks (4)
  [3.2, "click"], // Mesh 2 tracer start
  [4.0, "snap"], // R22 locks (9)
  [4.4, "click"], // Mesh 3 tracer start
  [5.2, "snap"], // R33 locks (5)
  [5.8, "snap"], // R12/R21 lock (-2)
  [7.0, "snap"], // R23/R32 lock (-4)
  [8.2, "click"], // R13/R31 lock (0)
  [9.2, "snap"], // v1 locks (-8)
  [10.2, "snap"], // v2 locks (-16)
  [11.1, "thump"], // v3 locks (13) and vector complete
  [11.8, "snap"], // Final equation glow
  [12.2, "click"], // Verification checkmark
];
// @CUES-END

// every visual lock must sit on a cue: picture and sound cannot drift apart
const cue = (t) => {
  if (!CUES.some((c) => c[0] === t)) throw new Error("no audio cue at " + t);
  return t;
};

const BLUE = "#0088FF",
  PURPLE = "#B026FF",
  RED = "#FF0044";
const RGB = { "#0088FF": "0,136,255", "#B026FF": "176,38,255", "#FF0044": "255,0,68" };
const HOT = { "#0088FF": "#A8D4FF", "#B026FF": "#DDA8FF", "#FF0044": "#FF8AA6" };
const glow = (rgb, a, px) => `drop-shadow(0px 0px ${px}px rgba(${rgb},${a}))`;
const tl = gsap.timeline({ paused: true });

// ---------------- 0.0 hook: everything is already on screen; the banner and the plate punch ----------------
tl.fromTo("#bv-0", { scale: 1.14 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, 0);
tl.fromTo(
  "#plate",
  { boxShadow: "inset 0 0 80px rgba(0,136,255,0.6)" },
  { boxShadow: "inset 0 0 0px rgba(0,136,255,0)", duration: 0.6, ease: "power2.out" },
  0,
);

// ---------------- banner changes (zone 3) ----------------
const banner = (from, to, t) => {
  tl.to("#bv-" + from, { opacity: 0, duration: 0.1 }, t);
  tl.fromTo(
    "#bv-" + to,
    { opacity: 0, scale: 1.12 },
    { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)", immediateRender: false },
    t + 0.1,
  );
};
banner(0, 1, 2.0);
banner(1, 2, 5.5);
banner(2, 3, 9.0);
banner(3, 4, 11.8);

// ---------------- helpers ----------------
function hold(k, t0, t1, color) {
  // a branch glows hot between t0 and t1, then relaxes to its base glow
  const isR = k[0] === "R",
    part = `#el-${k} ${isR ? ".res" : ".src"}`;
  const base = isR ? BLUE : RED,
    baseRgb = RGB[base];
  tl.fromTo(
    part,
    { stroke: base, filter: glow(baseRgb, 0.6, 6) },
    {
      stroke: HOT[color],
      filter: glow(RGB[color], 1, 20),
      duration: 0.12,
      ease: "power2.out",
      immediateRender: false,
    },
    t0,
  );
  tl.to(
    part,
    { stroke: base, filter: glow(baseRgb, 0.6, 6), duration: 0.3, ease: "power2.in" },
    t1,
  );
}

function focus(t0, t1, active) {
  // dim every branch that is not part of the current explanation
  DATA.BRK.forEach((k) => {
    if (active.includes(k)) return;
    const sel = [`#el-${k}`, `#lb-${k}`, `#w-${k}`];
    tl.fromTo(sel, { opacity: 1 }, { opacity: 0.3, duration: 0.15, immediateRender: false }, t0);
    tl.to(sel, { opacity: 1, duration: 0.12 }, t1);
  });
}

function lock(cid, t, color) {
  // the value slams into its matrix cell
  const rgb = RGB[color];
  tl.to(`#${cid} .ghost`, { opacity: 0, duration: 0.08 }, t);
  tl.set(`#${cid} .sum`, { opacity: 0, display: "none" }, t);
  tl.fromTo(
    `#${cid} .val`,
    { opacity: 0, scale: 2.2 },
    { opacity: 1, scale: 1, duration: 0.22, ease: "power4.out", immediateRender: false },
    t,
  );
  tl.fromTo(
    `#${cid} .val`,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    {
      textShadow: `0 0 26px rgba(${rgb},1)`,
      duration: 0.2,
      ease: "power2.out",
      immediateRender: false,
    },
    t,
  );
  tl.to(
    `#${cid} .val`,
    { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.5, ease: "power2.in" },
    t + 0.3,
  );
  tl.fromTo(
    `#${cid} .ring`,
    { opacity: 0.9, scale: 0.5 },
    { opacity: 0, scale: 1.7, duration: 0.45, ease: "power2.out", immediateRender: false },
    t,
  );
}

function sweep(g) {
  // the Electric Blue tracer laps the inner perimeter of the mesh, clockwise
  const m = g.mesh,
    P = DATA.tracers[m].pts,
    seg = DATA.tracers[m].seg,
    total = seg.reduce((a, b) => a + b, 0),
    s = g.start;
  const dash = +document.getElementById("trail-" + m).getAttribute("stroke-dasharray");
  tl.set(`#head-${m}`, { opacity: 1 }, s);
  tl.set(`#trail-${m}`, { opacity: 1 }, s);
  tl.fromTo(
    `#trail-${m}`,
    { strokeDashoffset: dash },
    { strokeDashoffset: 0, duration: DATA.SWEEP, ease: "none", immediateRender: false },
    s,
  );
  let t = s;
  for (let i = 0; i < 4; i++) {
    const a = P[i],
      b = P[(i + 1) % 4],
      d = (DATA.SWEEP * seg[i]) / total;
    tl.fromTo(
      `#head-${m}`,
      { x: a[0] - P[0][0], y: a[1] - P[0][1] },
      { x: b[0] - P[0][0], y: b[1] - P[0][1], duration: d, ease: "none", immediateRender: false },
      t,
    );
    t += d;
  }
  tl.to(`#head-${m}`, { opacity: 0, duration: 0.1 }, s + DATA.SWEEP);
  tl.to(`#trail-${m}`, { opacity: 0, duration: 0.3 }, s + DATA.SWEEP + 0.05);
}

function flights(g) {
  // numerals hurled from the part into the matrix
  g.items.forEach((it) => {
    const el = "#" + it.id,
      dur = it.arrive - it.launch;
    tl.set(el, { opacity: 1 }, it.launch);
    tl.fromTo(
      el,
      { x: it.dx, y: it.dy, scale: 1.25 },
      { x: 0, y: 0, scale: 0.85, duration: dur, ease: "power3.in", immediateRender: false },
      it.launch,
    );
    tl.set(el, { opacity: 0 }, it.arrive);
    if (it.beam) {
      const L = +document.getElementById(it.beam).getAttribute("stroke-dasharray");
      tl.set("#" + it.beam, { opacity: 1 }, it.launch);
      tl.fromTo(
        "#" + it.beam,
        { strokeDashoffset: L },
        { strokeDashoffset: 0, duration: dur, ease: "power2.out", immediateRender: false },
        it.launch,
      );
      tl.to("#" + it.beam, { opacity: 0, duration: 0.3 }, g.lock + 0.1);
    }
  });
}

// ---------------- 2.0 - 11.1: one group per set of entries ----------------
DATA.groups.forEach((g) => {
  cue(g.lock);
  if (g.kind === "diag") cue(g.start); // tracer start has its own click
  if (g.active) focus(g.focus[0], g.focus[1], g.active);

  if (g.kind === "diag") {
    sweep(g);
    g.items.forEach((it) => hold(it.src, it.pulse, it.pulse + 0.1, BLUE));
  }
  if (g.kind === "off") {
    hold(g.shared, g.start, g.focus[1], PURPLE);
    // two blue currents slide past each other in opposite directions inside the shared resistor
    DATA.sparks[g.shared].forEach(([id, a, b]) => {
      tl.set("#" + id, { opacity: 1 }, g.start);
      tl.fromTo(
        "#" + id,
        { x: 0, y: 0 },
        {
          x: b[0] - a[0],
          y: b[1] - a[1],
          duration: g.lock - g.start,
          ease: "power1.inOut",
          immediateRender: false,
        },
        g.start,
      );
      tl.to("#" + id, { opacity: 0, duration: 0.1 }, g.lock);
    });
  }
  if (g.kind === "zero") {
    // meshes 1 and 3 touch no common resistor: their boundaries flash, then 0
    [1, 3].forEach((m) => {
      tl.fromTo(
        `#perim-${m}`,
        { opacity: 0 },
        { opacity: 0.95, duration: 0.1, immediateRender: false },
        g.start,
      );
      tl.to(`#perim-${m}`, { opacity: 0, duration: 0.45, ease: "power2.in" }, g.start + 0.12);
    });
  }
  if (g.kind === "src") {
    g.items.forEach((it) => hold(it.src, it.launch, it.launch + 0.45, RED));
  }
  flights(g);
  if (g.sum) {
    // "2+2", "2+3+4", "5-13": the numerals combine in the cell just before the lock
    const sumAt = Math.max(...g.items.map((i) => i.arrive));
    tl.to(`#${g.cells[0]} .ghost`, { opacity: 0, duration: 0.06 }, sumAt);
    tl.set(`#${g.cells[0]} .sum`, { display: "block" }, sumAt);
    tl.fromTo(
      `#${g.cells[0]} .sum`,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.15, ease: "back.out(2)", immediateRender: false },
      sumAt,
    );
  }
  g.cells.forEach((cid) => lock(cid, g.lock, g.color));
});

// ---------------- 11.8 - 13.0: whole equation pulses, then a static hold ----------------
cue(11.8);
cue(12.2);
tl.fromTo(
  "#card",
  { boxShadow: "0 0 0px rgba(176,38,255,0)" },
  {
    boxShadow: "0 0 44px rgba(176,38,255,0.85)",
    duration: 0.3,
    ease: "power2.out",
    immediateRender: false,
  },
  11.8,
);
tl.to("#card", { boxShadow: "0 0 0px rgba(176,38,255,0)", duration: 0.6, ease: "power2.in" }, 12.2);
tl.fromTo(
  "#eqhead",
  { textShadow: "0 0 0px rgba(255,255,255,0)" },
  { textShadow: "0 0 24px rgba(255,255,255,0.95)", duration: 0.3, immediateRender: false },
  11.8,
);
tl.to("#eqhead", { textShadow: "0 0 0px rgba(255,255,255,0)", duration: 0.6 }, 12.2);
[
  ["#card .cell.d .val", "0,136,255"],
  ["#card .cell.p .val", "176,38,255"],
  ["#card .cell.s .val", "255,0,68"],
].forEach(([sel, rgb]) => {
  tl.fromTo(
    sel,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    {
      textShadow: `0 0 24px rgba(${rgb},1)`,
      duration: 0.3,
      ease: "power2.out",
      immediateRender: false,
    },
    11.8,
  );
  tl.to(sel, { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.6, ease: "power2.in" }, 12.2);
});
tl.fromTo(
  "#ck",
  { strokeDashoffset: 30 },
  { strokeDashoffset: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
  12.2,
);
// 12.8 - 13.0: nothing moves

window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
