/* THE R-MATRIX TRICK: THE COMPLETE MASTERCLASS. 21.0 s, GSAP 3.12.5, one paused root timeline: window.__timelines["main"].
   DATA (groups, comet laps, flights) is injected by build_index.py, which also writes the CUES block below from the same schedule.
   The circuit in zone 2 is never dimmed, hidden or moved. Every value that reaches an equation or the matrix first lifts off its
   own component as a glowing ghost clone and flies there along a curved path; nothing is ever spawned out of thin air. */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"],
  [1.2, "snap"],
  [2.0, "click"],
  [2.565, "whoosh"],
  [2.811, "whoosh"],
  [3.015, "click"],
  [3.261, "click"],
  [3.6, "whoosh"],
  [3.9, "snap"],
  [4.2, "click"],
  [4.344, "whoosh"],
  [4.719, "whoosh"],
  [4.794, "click"],
  [5.169, "click"],
  [5.469, "whoosh"],
  [5.919, "click"],
  [6.0, "whoosh"],
  [6.3, "snap"],
  [6.6, "click"],
  [7.098, "whoosh"],
  [7.473, "whoosh"],
  [7.548, "click"],
  [7.923, "click"],
  [8.2, "whoosh"],
  [8.5, "snap"],
  [8.8, "click"],
  [9.3, "whoosh"],
  [9.9, "snap"],
  [10.3, "click"],
  [10.8, "whoosh"],
  [11.4, "snap"],
  [11.8, "click"],
  [12.0, "whoosh"],
  [12.4, "click"],
  [12.8, "click"],
  [12.9, "whoosh"],
  [13.0, "whoosh"],
  [13.35, "click"],
  [13.45, "click"],
  [13.6, "whoosh"],
  [13.9, "snap"],
  [14.2, "click"],
  [14.4, "whoosh"],
  [15.0, "snap"],
  [15.3, "click"],
  [15.5, "whoosh"],
  [16.1, "thump"],
  [16.5, "thump"],
  [17.5, "snap"],
  [18.2, "click"],
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
const root = document.getElementById("root");

// ---------------- banner (zone 3): crossfades are 0.15 s out, then 0.15 s in, never a hard cut ----------------
let curBanner = "#bv-h2";
function bswap(to, t) {
  tl.to(curBanner, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
  tl.fromTo(
    to,
    { opacity: 0 },
    { opacity: 1, duration: 0.15, ease: "power1.out", immediateRender: false },
    t + 0.15,
  );
  curBanner = to;
}
let curVar = null;
function variant(next, t) {
  // the second banner line changes inside a container
  if (curVar) tl.to(curVar, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
  tl.fromTo(
    next,
    { opacity: 0 },
    { opacity: 1, duration: 0.15, ease: "power1.out", immediateRender: false },
    t + 0.15,
  );
  curVar = next;
}

// ---------------- helpers ----------------
function halo(k, t0, t1, color, rel = 0.5) {
  // a component blooms in `color` from t0, and relaxes to its base glow between t1 and t1 + rel
  const isR = k[0] === "R",
    part = `#el-${k} ${isR ? ".res" : ".src"}`;
  const base = isR ? BLUE : RED,
    baseRgb = RGB[base];
  tl.fromTo(
    part,
    { stroke: base, filter: glow(baseRgb, 0.6, 6) },
    {
      stroke: HOT[color],
      filter: glow(RGB[color], 1, 24),
      duration: 0.3,
      ease: "power2.out",
      immediateRender: false,
    },
    t0,
  );
  tl.to(
    part,
    { stroke: base, filter: glow(baseRgb, 0.6, 6), duration: rel, ease: "power2.inOut" },
    t1,
  );
}
function contour(m, t0, t1) {
  // a mesh boundary glows while it is the active mesh
  tl.fromTo(
    `#perim-${m}`,
    { opacity: 0 },
    { opacity: 0.55, duration: 0.3, ease: "power2.out", immediateRender: false },
    t0,
  );
  tl.to(`#perim-${m}`, { opacity: 0, duration: 0.4, ease: "power2.in" }, t1);
}
function lockCell(cid, t, color) {
  // the value lands in its matrix cell
  const rgb = RGB[color];
  tl.to(`#${cid} .ghost`, { opacity: 0, duration: 0.1 }, t);
  tl.fromTo(
    `#${cid} .val`,
    { opacity: 0, scale: 1.9 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "power4.out", immediateRender: false },
    t,
  );
  tl.fromTo(
    `#${cid} .val`,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    {
      textShadow: `0 0 28px rgba(${rgb},1)`,
      duration: 0.25,
      ease: "power2.out",
      immediateRender: false,
    },
    t,
  );
  tl.to(
    `#${cid} .val`,
    { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.7, ease: "power2.in" },
    t + 0.35,
  );
  tl.fromTo(
    `#${cid} .ring`,
    { opacity: 0.9, scale: 0.5 },
    { opacity: 0, scale: 1.8, duration: 0.6, ease: "power2.out", immediateRender: false },
    t,
  );
}
function ignite(sel, t, rgb = RGB[BLUE]) {
  // a term of the equation lights up
  tl.fromTo(
    sel,
    { opacity: 0.3, scale: 1.2 },
    { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)", immediateRender: false },
    t,
  );
  tl.fromTo(
    sel,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    { textShadow: `0 0 22px rgba(${rgb},1)`, duration: 0.2, immediateRender: false },
    t,
  );
  tl.to(sel, { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.5 }, t + 0.3);
}

// canvas-space centre of a flight end: a fixed coordinate (a component or a matrix cell) or a live equation slot in the banner.
// Slots are measured when their tween first renders, i.e. after the KaTeX fonts have loaded and the layout is final.
function centre(spec) {
  if (!spec.slot) return { x: spec.x, y: spec.y };
  const r = document.querySelector(spec.slot).getBoundingClientRect(),
    R = root.getBoundingClientRect(),
    k = R.width / 1080;
  return { x: (r.left + r.width / 2 - R.left) / k, y: (r.top + r.height / 2 - R.top) / k };
}
function fly(f) {
  // a ghost clone lifts off its source, arcs to its target and vanishes into it
  const el = "#" + f.id,
    d = f.t1 - f.t0,
    lift = 0.16,
    W = 65,
    H = 28;
  cue(f.t0);
  if (f.tgt.slot) cue(f.t1);
  tl.set(el, { opacity: f.cls === "z" ? 0.75 : 1 }, f.t0);
  tl.fromTo(
    el,
    { scale: 0.7 },
    { scale: 1.3, duration: lift, ease: "power2.out", immediateRender: false },
    f.t0,
  ); // lift-off pop
  tl.to(el, { scale: 0.95, duration: d - lift, ease: "power1.inOut" }, f.t0 + lift);
  tl.fromTo(
    el,
    { x: () => centre(f.src).x - W },
    { x: () => centre(f.tgt).x - W, duration: d, ease: "power2.inOut", immediateRender: false },
    f.t0,
  );
  tl.fromTo(
    el,
    { y: () => centre(f.src).y - H },
    {
      y: () => centre(f.src).y - H - 34,
      duration: lift,
      ease: "power2.out",
      immediateRender: false,
    },
    f.t0,
  );
  tl.fromTo(
    el,
    { y: () => centre(f.src).y - H - 34 },
    { y: () => centre(f.tgt).y - H, duration: d - lift, ease: "power2.in", immediateRender: false },
    f.t0 + lift,
  );
  tl.set(el, { opacity: 0 }, f.t1);
}

// ================= 0.0 - 2.0  HOOK: paper overlay and banner say the same thing; at 1.2 s both give way, zone 3 is never empty =================
cue(0.0);
cue(1.2);
DATA.base_rot.forEach((r, i) => tl.set("#ms-" + i, { rotation: r }, 0));
tl.fromTo("#ov", { scale: 1.04 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, 0);
tl.fromTo("#bv-h1", { scale: 1.06 }, { scale: 1, duration: 0.4, ease: "back.out(2)" }, 0);
tl.to("#ov", { opacity: 0, duration: 0.3, ease: "power1.inOut" }, 1.2);
tl.to("#bv-h1", { opacity: 0, duration: 0.3, ease: "power1.inOut" }, 1.2);
tl.fromTo(
  "#bv-h2",
  { opacity: 0 },
  { opacity: 1, duration: 0.3, ease: "power1.inOut", immediateRender: false },
  1.2,
);
tl.fromTo(
  "#plate",
  { boxShadow: "inset 0 0 0px rgba(0,136,255,0)" },
  {
    boxShadow: "inset 0 0 70px rgba(0,136,255,0.5)",
    duration: 0.3,
    ease: "power2.out",
    immediateRender: false,
  },
  1.5,
);
tl.to(
  "#plate",
  { boxShadow: "inset 0 0 0px rgba(0,136,255,0)", duration: 0.6, ease: "power2.in" },
  1.8,
);

// ================= 2.0 - 8.8  DIAGONALS: values lift off the resistors the comet touches and add up in the banner =================
DATA.groups.forEach((g) => {
  if (g.kind !== "diag") return;
  const m = g.mesh,
    tr = DATA.tracers[m],
    W = tr.wps;
  cue(g.start);
  cue(g.lock);
  bswap("#bv-d" + m, g.banner);
  tl.to(`#d${m}-p0`, { opacity: 1, duration: 0.2 }, g.banner + 0.2);
  tl.to(`#d${m}-e`, { opacity: 1, duration: 0.2 }, g.banner + 0.2);
  contour(m, g.start, g.until - 0.4);

  // the comet glides once around the inner boundary at constant speed, clockwise
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
  tl.to(`#head-${m}`, { opacity: 0, duration: 0.15 }, end);
  tl.to(`#trail-${m}`, { opacity: 0, duration: 0.4 }, end + 0.05);

  // each touched resistor blooms; a ghost of its value flies into its term and lights it
  g.touches.forEach((t) => halo(t.res, t.t, t.t + 0.5, BLUE));
  g.flights.forEach((f) => {
    fly(f);
    if (f.merge !== undefined) {
      ignite(`#d${m}-s${f.merge}`, f.t1);
      ignite(`#d${m}-n${f.merge}`, f.t1);
    } else {
      ignite(`#d${m}-f`, f.t0); // the sum lights up as it starts to fall into its matrix slot
    }
  });
  lockCell(g.cells[0], g.lock, g.color);
});

// ================= 8.8 - 12.8  OFF-DIAGONALS: -(shared resistor), split into two symmetric tags =================
DATA.groups.forEach((g) => {
  if (g.kind !== "off" && g.kind !== "zero") return;
  cue(g.start);
  cue(g.lock);
  const id = { o12: "#off-a", o23: "#off-b", o13: "#off-c" }[g.id];
  if (g.id === "o12") bswap("#bv-off", g.banner);
  variant(id, g.banner);
  if (g.kind === "off") {
    halo(g.shared, g.start + 0.15, g.until - 0.5, PURPLE);
  } else {
    // meshes 1 and 3 touch no common resistor: their boundaries glow, a zero tag appears between them
    [1, 3].forEach((m) => contour(m, g.start + 0.15, g.until - 0.4));
  }
  g.flights.forEach(fly);
  g.cells.forEach((cid) => lockCell(cid, g.lock, g.color));
});

// ================= 12.8 - 16.5  SOURCES: rises minus drops =================
DATA.groups.forEach((g) => {
  if (g.kind !== "src") return;
  cue(g.start);
  cue(g.lock);
  if (g.mesh === 1) bswap("#bv-src", g.banner);
  variant("#src-" + g.mesh, g.banner);
  g.src.forEach((k) => halo(k, g.start + 0.15, g.until - 0.5, RED)); // relaxes back to normal by the end of the mesh window
  contour(g.mesh, g.start + 0.15, g.until - 0.3);
  g.flights.forEach((f) => {
    fly(f);
    if (f.merge) ignite("#" + f.merge, f.t1, RGB[RED]);
    if (f.id === "gh-v1-r") ignite("#v1-f", f.t0, RGB[RED]);
  });
  lockCell(g.cells[0], g.lock, g.color);
});

// ================= 16.5 - 21.0  SYSTEM SOLVED, THEN THE CTA =================
cue(16.5);
cue(17.5);
cue(18.2);
bswap("#bv-fin", 16.5);
// the entire circuit glows in one harmonic Electric Blue (the last source has just relaxed back to normal)
[
  [".wire", 0.55, 5, 16],
  [".res", 0.6, 6, 18],
  [".src", 0.6, 6, 18],
  [".node", 0.6, 5, 14],
].forEach(([sel, a, px, big]) => {
  const base = sel === ".src" ? RGB[RED] : RGB[BLUE];
  tl.fromTo(
    sel,
    { filter: glow(base, a, px) },
    { filter: glow(RGB[BLUE], 1, big), duration: 0.4, ease: "power2.out", immediateRender: false },
    16.5,
  );
  tl.to(sel, { filter: glow(base, a, px), duration: 0.8, ease: "power2.inOut" }, 17.4);
});
// the matrix pulses as a neon energy wave, travelling along the diagonal from R11 to v3
const WAVE = [
  ["e-0-0"],
  ["e-0-1", "e-1-0"],
  ["e-0-2", "e-1-1", "e-2-0"],
  ["e-1-2", "e-2-1", "v-0"],
  ["e-2-2", "v-1"],
  ["v-2"],
];
const WCOL = (id) => (id.startsWith("v") ? RGB[RED] : id[2] === id[4] ? RGB[BLUE] : RGB[PURPLE]);
WAVE.forEach((cells, i) => {
  const t = 16.6 + i * 0.12;
  cells.forEach((cid) => {
    const rgb = WCOL(cid);
    tl.fromTo(
      `#${cid} .val`,
      { textShadow: `0 0 0px rgba(${rgb},0)` },
      {
        textShadow: `0 0 30px rgba(${rgb},1)`,
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
      { opacity: 0.9, scale: 0.6 },
      { opacity: 0, scale: 1.7, duration: 0.5, ease: "power2.out", immediateRender: false },
      t,
    );
  });
});
tl.fromTo(
  "#card",
  { boxShadow: "0 0 0px rgba(0,136,255,0)" },
  {
    boxShadow: "0 0 34px rgba(0,136,255,0.85), 0 0 54px rgba(176,38,255,0.55)",
    duration: 0.4,
    ease: "power2.out",
    immediateRender: false,
  },
  16.5,
);
tl.to(
  "#card",
  {
    boxShadow: "0 0 0px rgba(0,136,255,0), 0 0 0px rgba(176,38,255,0)",
    duration: 0.8,
    ease: "power2.in",
  },
  17.2,
);
tl.fromTo(
  "#eqhead",
  { textShadow: "0 0 0px rgba(255,255,255,0)" },
  { textShadow: "0 0 26px rgba(255,255,255,0.95)", duration: 0.4, immediateRender: false },
  16.5,
);
tl.to("#eqhead", { textShadow: "0 0 0px rgba(255,255,255,0)", duration: 0.8 }, 17.2);
// 17.5: the CTA card slides up into y 1380 - 1620. The matrix (y 1060 - 1360, scale 1.0) and the banner do not move or scale.
tl.fromTo(
  "#cta",
  { y: 40 },
  { y: 0, duration: 0.8, ease: "power3.out", immediateRender: false },
  17.5,
);
tl.fromTo(
  "#cta",
  { opacity: 0 },
  { opacity: 1, duration: 0.4, ease: "power1.out", immediateRender: false },
  17.5,
);
tl.fromTo(
  "#cta",
  { boxShadow: "inset 0 0 0px rgba(255,0,68,0)" },
  { boxShadow: "inset 0 0 50px rgba(255,0,68,0.5)", duration: 0.25, immediateRender: false },
  17.6,
);
tl.to("#cta", { boxShadow: "inset 0 0 0px rgba(255,0,68,0)", duration: 0.8 }, 17.9);
tl.fromTo(
  "#cta-t",
  { opacity: 0, y: 12 },
  { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false },
  17.7,
);
tl.fromTo(
  "#cta-q",
  { opacity: 0, y: 12 },
  { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false },
  18.0,
);
tl.fromTo("#cta-b", { opacity: 0 }, { opacity: 0.7, duration: 0.4, immediateRender: false }, 18.4);
tl.fromTo(
  "#cta-q",
  { textShadow: "0 0 0px rgba(0,136,255,0)" },
  { textShadow: "0 0 26px rgba(0,136,255,0.95)", duration: 0.3, immediateRender: false },
  18.2,
);
tl.to("#cta-q", { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.8 }, 18.6);
// 19.4 - 21.0: nothing moves. The solved matrix and the CTA hold for the rest of the film (3.5 s from the slide-up at 17.5)

window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
