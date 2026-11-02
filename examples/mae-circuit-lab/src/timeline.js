/* THE R-MATRIX TRICK: 14.5 s, GSAP 3.12.5, one paused root timeline: window.__timelines["main"].
   DATA (groups, tracer waypoints, shard motion, flight offsets) is injected by build_index.py. Whole file, rewritten as a unit. */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"], // Hook strike
  [0.6, "snap"], // Paper shatter
  [1.8, "click"], // Mesh 1 tracer start
  [2.2, "click"], // R1 touched
  [2.6, "click"], // R2 touched
  [3.0, "snap"], // R11 locked (4)
  [3.2, "click"], // Mesh 2 tracer start
  [3.6, "click"], // R2 touched
  [4.0, "click"], // R3 touched
  [4.3, "click"], // R4 touched
  [4.6, "snap"], // R22 locked (9)
  [4.7, "click"], // Mesh 3 tracer start
  [5.1, "click"], // R4 touched
  [5.5, "click"], // R5 touched
  [6.0, "snap"], // R33 locked (5)
  [6.5, "snap"], // R12/R21 locked (-2)
  [7.6, "snap"], // R23/R32 locked (-4)
  [8.6, "click"], // R13/R31 locked (0)
  [9.2, "snap"], // v1 locked (-8)
  [9.9, "snap"], // v2 locked (-16)
  [10.6, "thump"], // v3 locked (13) and vector complete
  [11.2, "snap"], // Matrix glow confirmation
  [11.4, "thump"], // Massive CTA card impact
  [11.45, "snap"], // CTA glow lock
  [12.8, "click"], // Final subtle resonance
];
// @CUES-END

// every visual event that has a sound must sit on a cue: picture and audio cannot drift apart
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

// ---------------- banner (zone 3) ----------------
let curBanner = "#bv-0";
function bswap(to, t) {
  tl.to(curBanner, { opacity: 0, duration: 0.1 }, t);
  tl.fromTo(
    to,
    { opacity: 0, scale: 1.1 },
    { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2)", immediateRender: false },
    t + 0.08,
  );
  curBanner = to;
}
function variant(prev, next, t) {
  // second banner line changes inside a container
  if (prev) tl.to(prev, { opacity: 0, duration: 0.1 }, t);
  tl.fromTo(
    next,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.22, ease: "power2.out", immediateRender: false },
    t + 0.06,
  );
}

// ---------------- helpers ----------------
function hold(k, t0, t1, color) {
  // a branch blooms between t0 and t1, then relaxes to its base glow
  const isR = k[0] === "R",
    part = `#el-${k} ${isR ? ".res" : ".src"}`;
  const base = isR ? BLUE : RED,
    baseRgb = RGB[base];
  tl.fromTo(
    part,
    { stroke: base, filter: glow(baseRgb, 0.6, 6) },
    {
      stroke: HOT[color],
      filter: glow(RGB[color], 1, 22),
      duration: 0.1,
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
function lockCell(cid, t, color) {
  // the value slams into its matrix cell
  const rgb = RGB[color];
  tl.to(`#${cid} .ghost`, { opacity: 0, duration: 0.08 }, t);
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
function ignite(sel, t, rgb = RGB[BLUE]) {
  // a term of the equation lights up and pops
  tl.fromTo(
    sel,
    { opacity: 0.22, scale: 1.25 },
    { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2.5)", immediateRender: false },
    t,
  );
  tl.fromTo(
    sel,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    { textShadow: `0 0 22px rgba(${rgb},1)`, duration: 0.15, immediateRender: false },
    t,
  );
  tl.to(sel, { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.4 }, t + 0.25);
}
function flights(g) {
  // numerals hurled from the part into the matrix (off-diagonals, sources)
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

// ================= 0.0 - 1.8  HOOK: crossed-out KVL algebra shatters, the circuit illuminates =================
cue(0.0);
cue(0.6);
DATA.pieces.forEach((p) => tl.set("#" + p.id, { rotation: p.r0 }, 0));
tl.fromTo("#ov", { scale: 1.05 }, { scale: 1, duration: 0.28, ease: "back.out(2.4)" }, 0);
tl.fromTo("#bv-0", { scale: 1.12 }, { scale: 1, duration: 0.28, ease: "back.out(2.4)" }, 0);
tl.set("#ov .shbg", { opacity: 0 }, 0.6); // the glass sheet hands over to its 24 shards
DATA.pieces.forEach((p) => {
  // the crossed-out algebra breaks apart line by line
  tl.fromTo(
    "#" + p.id,
    { x: 0, y: 0, rotation: p.r0, opacity: 1 },
    {
      x: p.x,
      y: p.y,
      rotation: p.rot,
      opacity: 0,
      duration: 0.6,
      delay: p.d,
      ease: "power2.in",
      immediateRender: false,
    },
    0.6,
  );
});
DATA.shards.forEach((s) => {
  tl.set("#" + s.id, { opacity: 1 }, 0.6);
  tl.fromTo(
    "#" + s.id,
    { x: 0, y: 0, rotation: 0, opacity: 1 },
    {
      x: s.x,
      y: s.y,
      rotation: s.rot,
      opacity: 0,
      duration: 0.6,
      delay: s.d,
      ease: "power2.in",
      immediateRender: false,
    },
    0.6,
  );
});
tl.fromTo(
  ["#circuit", "#labels"],
  { opacity: 0.3 },
  { opacity: 1, duration: 0.35, ease: "power2.out", immediateRender: false },
  0.6,
);
tl.fromTo(
  "#plate",
  { boxShadow: "inset 0 0 0px rgba(0,136,255,0)" },
  {
    boxShadow: "inset 0 0 90px rgba(0,136,255,0.55)",
    duration: 0.2,
    ease: "power2.out",
    immediateRender: false,
  },
  0.6,
);
tl.to(
  "#plate",
  { boxShadow: "inset 0 0 0px rgba(0,136,255,0)", duration: 0.6, ease: "power2.in" },
  0.8,
);
bswap("#bv-1", 0.6);

// ================= 1.8 - 6.2  DIAGONALS: the comet touches each resistor and the sum builds up =================
DATA.groups.forEach((g) => {
  if (g.kind !== "diag") return;
  const m = g.mesh,
    tr = DATA.tracers[m],
    W = tr.wps;
  cue(g.start);
  cue(g.lock);
  g.touches.forEach((t) => cue(t.t));
  bswap("#bv-d" + m, g.start - 0.05);
  tl.to(`#d${m}-p0`, { opacity: 1, duration: 0.15 }, g.start);
  tl.to(`#d${m}-e`, { opacity: 1, duration: 0.15 }, g.start);
  focus(g.focus[0], g.focus[1], g.active);

  // the comet: piecewise-linear laps so it reaches every resistor exactly on its tick
  const dash = tr.total;
  tl.set(`#head-${m}`, { opacity: 1 }, W[0].t);
  tl.set(`#trail-${m}`, { opacity: 1 }, W[0].t);
  for (let i = 0; i < W.length - 1; i++) {
    const a = W[i],
      b = W[i + 1],
      dur = b.t - a.t;
    tl.fromTo(
      `#head-${m}`,
      { x: a.x - W[0].x, y: a.y - W[0].y },
      { x: b.x - W[0].x, y: b.y - W[0].y, duration: dur, ease: "none", immediateRender: false },
      a.t,
    );
    tl.fromTo(
      `#trail-${m}`,
      { strokeDashoffset: dash - a.d },
      { strokeDashoffset: dash - b.d, duration: dur, ease: "none", immediateRender: false },
      a.t,
    );
  }
  const end = W[W.length - 1].t;
  tl.to(`#head-${m}`, { opacity: 0, duration: 0.1 }, end);
  tl.to(`#trail-${m}`, { opacity: 0, duration: 0.3 }, end + 0.05);

  // every touch: the resistor blooms, its value is pulled down into a pill, the equation term ignites
  g.touches.forEach((t, i) => {
    hold(t.res, t.t, t.t + 0.12, BLUE);
    tl.set("#" + t.pill, { opacity: 1 }, t.t);
    tl.fromTo(
      "#" + t.pill,
      { x: t.dx, y: t.dy, scale: 1.15 },
      { x: 0, y: 0, scale: 0.9, duration: 0.14, ease: "power2.in", immediateRender: false },
      t.t,
    );
    tl.set("#" + t.pill, { opacity: 0 }, t.t + 0.14);
    ignite(`#d${m}-s${i}`, t.t + 0.14);
    ignite(`#d${m}-n${i}`, t.t + 0.14);
  });

  // lock: final number appears in the equation, drops into the matrix slot, cell slams
  tl.fromTo(
    `#d${m}-f`,
    { opacity: 0, scale: 1.5 },
    { opacity: 1, scale: 1, duration: 0.22, ease: "back.out(2.2)", immediateRender: false },
    g.lock,
  );
  tl.fromTo(
    `#d${m}-f`,
    { textShadow: "0 0 0px rgba(0,136,255,0)" },
    { textShadow: "0 0 26px rgba(0,136,255,1)", duration: 0.2, immediateRender: false },
    g.lock,
  );
  tl.to(`#d${m}-f`, { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.5 }, g.lock + 0.3);
  const nf = g.numfly,
    el = "#" + nf.id;
  tl.set(el, { opacity: 1 }, g.lock - 0.16);
  tl.fromTo(
    el,
    { x: nf.dx, y: nf.dy, scale: 1.4 },
    { x: 0, y: 0, scale: 0.9, duration: 0.16, ease: "power3.in", immediateRender: false },
    g.lock - 0.16,
  );
  tl.set(el, { opacity: 0 }, g.lock);
  lockCell(g.cells[0], g.lock, g.color);
});

// ================= 6.2 - 9.0  OFF-DIAGONALS: -(shared resistor) =================
bswap("#bv-off", 6.15);
let curVar = null;
DATA.groups.forEach((g) => {
  if (g.kind !== "off" && g.kind !== "zero") return;
  cue(g.lock);
  const id = { o12: "#off-a", o23: "#off-b", o13: "#off-c" }[g.id];
  variant(curVar, id, g.start);
  curVar = id;
  if (g.focus) focus(g.focus[0], g.focus[1], g.active);
  if (g.kind === "off") {
    hold(g.shared, g.start, g.focus[1], PURPLE);
    // two currents slide past each other, in opposite directions, inside the shared resistor
    DATA.sparks[g.shared].forEach(([sid, a, b]) => {
      tl.set("#" + sid, { opacity: 1 }, g.start);
      tl.fromTo(
        "#" + sid,
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
      tl.to("#" + sid, { opacity: 0, duration: 0.1 }, g.lock);
    });
    flights(g);
  } else {
    // meshes 1 and 3 touch no common resistor: their boundaries flash
    [1, 3].forEach((m) => {
      tl.fromTo(
        `#perim-${m}`,
        { opacity: 0 },
        { opacity: 0.95, duration: 0.1, immediateRender: false },
        g.start,
      );
      tl.to(`#perim-${m}`, { opacity: 0, duration: 0.45, ease: "power2.in" }, g.start + 0.14);
    });
  }
  g.cells.forEach((cid) => lockCell(cid, g.lock, g.color));
});

// ================= 9.0 - 11.2  SOURCES: rises minus drops =================
bswap("#bv-src", 8.95);
DATA.groups.forEach((g) => {
  if (g.kind !== "src") return;
  cue(g.lock);
  variant(curVar, "#src-" + g.mesh, g.start);
  curVar = "#src-" + g.mesh;
  focus(g.focus[0], g.focus[1], g.active);
  g.items.forEach((it) => hold(it.src, it.launch, it.launch + 0.4, RED));
  flights(g);
  lockCell(g.cells[0], g.lock, g.color);
});

// ================= 11.2 - 14.5  MATRIX LOCK, THEN THE CTA TAKEOVER =================
cue(11.2);
cue(11.4);
cue(11.45);
cue(12.8);
tl.fromTo(
  "#card",
  { boxShadow: "0 0 0px rgba(0,136,255,0)" },
  {
    boxShadow: "0 0 46px rgba(0,136,255,0.9)",
    duration: 0.2,
    ease: "power2.out",
    immediateRender: false,
  },
  11.2,
);
tl.to("#card", { boxShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.6, ease: "power2.in" }, 11.6);
[
  ["#card .cell.d .val", "0,136,255"],
  ["#card .cell.p .val", "176,38,255"],
  ["#card .cell.s .val", "255,0,68"],
].forEach(([sel, rgb]) => {
  tl.fromTo(
    sel,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    {
      textShadow: `0 0 26px rgba(${rgb},1)`,
      duration: 0.2,
      ease: "power2.out",
      immediateRender: false,
    },
    11.2,
  );
  tl.to(sel, { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.6, ease: "power2.in" }, 11.6);
});
tl.to("#banner", { opacity: 0, duration: 0.25 }, 11.25);
tl.to("#plate", { opacity: 0, duration: 0.3 }, 11.25);
tl.to("#card", { y: -630, duration: 0.6, ease: "power3.inOut" }, 11.4); // the matrix pushes up to centre stage
tl.fromTo(
  "#cta",
  { y: 60 },
  { y: 0, duration: 0.5, ease: "power3.out", immediateRender: false },
  11.4,
); // sweeps up from below
tl.fromTo("#cta", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, 11.6); // and appears only once the matrix has cleared it
tl.fromTo(
  "#cta",
  { boxShadow: "inset 0 0 0px rgba(255,0,68,0)" },
  { boxShadow: "inset 0 0 50px rgba(255,0,68,0.55)", duration: 0.15, immediateRender: false },
  11.45,
);
tl.to("#cta", { boxShadow: "inset 0 0 0px rgba(255,0,68,0)", duration: 0.6 }, 11.7);
tl.fromTo(
  "#cta-t",
  { opacity: 0, y: 16 },
  { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
  11.5,
);
tl.fromTo(
  "#cta-div",
  { opacity: 0, scale: 0.4 },
  { opacity: 1, scale: 1, duration: 0.3, immediateRender: false },
  11.7,
);
tl.fromTo(
  "#cta-q",
  { opacity: 0, y: 16 },
  { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
  11.85,
);
tl.fromTo("#cta-b", { opacity: 0 }, { opacity: 0.7, duration: 0.3, immediateRender: false }, 12.15);
tl.fromTo(
  "#cta-q",
  { textShadow: "0 0 0px rgba(0,136,255,0)" },
  { textShadow: "0 0 24px rgba(0,136,255,0.9)", duration: 0.2, immediateRender: false },
  12.8,
);
tl.to("#cta-q", { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.5 }, 13.0);
// 13.5 - 14.5: nothing moves

window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
