/* THE R-MATRIX TRICK: THE COMPLETE MASTERCLASS. 21.0 s, GSAP 3.12.5, one paused root timeline: window.__timelines["main"].
   DATA (groups, comet laps, flights, hook) is injected by build_index.py, which also writes the CUES block below from the same schedule.
   The circuit in zone 2 is never dimmed, hidden or moved. Pop-and-drop: the NUMBER that is already written on a component pops to 2.2x
   right where it sits, then that very number glides along a curve into its equation slot or matrix cell and settles to scale 1.0 there.
   There are no badge backgrounds: the only things that move are the numbers themselves. */

// @CUES-BEGIN
const CUES = [
  [2.696, "click"],
  [3.0, "click"],
  [4.336, "click"],
  [4.691, "click"],
  [5.4, "click"],
  [7.17, "click"],
  [7.6, "click"],
  [9.3, "click"],
  [10.8, "click"],
  [11.4, "thump"],
  [12.4, "thump"],
  [12.85, "click"],
  [13.0, "click"],
  [14.4, "click"],
  [15.5, "click"],
  [16.1, "thump"],
];
// @CUES-END

// every sound sits on a cue (clicks = component pops, thumps = completed rows / vector); picture and audio cannot drift apart
const cue = (t) => {
  if (!CUES.some((c) => c[0] === t)) throw new Error("no audio cue at " + t);
  return t;
};

const BLUE = "#0088FF",
  PURPLE = "#B026FF",
  RED = "#FF0044";
const RGB = { "#0088FF": "0,136,255", "#B026FF": "176,38,255", "#FF0044": "255,0,68" };
const HOT = { "#0088FF": "#A8D4FF", "#B026FF": "#DDA8FF", "#FF0044": "#FF8AA6" };
const COL = { d: BLUE, p: PURPLE, s: RED };
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
    t + 0.075,
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
    t + 0.075,
  );
  curVar = next;
}

// ---------------- helpers ----------------
function halo(k, t0, t1, color, rel = 0.35) {
  // the component blooms in `color` (0.15 s attack) from t0 and relaxes to its base glow from t1
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
      duration: 0.15,
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
  // the placeholder becomes the final value instantly, with a brief glow
  const rgb = RGB[color];
  tl.set(`#${cid} .ghost`, { opacity: 0 }, t);
  tl.set(`#${cid} .val`, { opacity: 1 }, t);
  tl.fromTo(
    `#${cid} .val`,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    {
      textShadow: `0 0 26px rgba(${rgb},1)`,
      duration: 0.1,
      ease: "power2.out",
      immediateRender: false,
    },
    t,
  );
  tl.to(
    `#${cid} .val`,
    { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.5, ease: "power2.in" },
    t + 0.15,
  );
}
function cellPulse(cid, t) {
  // a number has landed: the cell pulses 1.2x and settles back to 1.0
  tl.fromTo(
    "#" + cid,
    { scale: 1.2 },
    { scale: 1, duration: 0.25, ease: "power2.out", immediateRender: false },
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

// canvas-space centre of a flight end: a fixed point (a matrix cell) or a live element (the number on a component, a slot in the banner).
// Measured when the tween first renders, i.e. after the KaTeX fonts have loaded and the layout is final.
function centre(spec) {
  if (!spec.slot) return { x: spec.x, y: spec.y };
  const r = document.querySelector(spec.slot).getBoundingClientRect(),
    R = root.getBoundingClientRect(),
    k = R.width / 1080;
  return { x: (r.left + r.width / 2 - R.left) / k, y: (r.top + r.height / 2 - R.top) / k };
}

// 1. POP: the number text already on the component scales to 2.2x instantly, with a neon pulse, right at its schematic coordinate.
// 2. DROP: that number glides along a curve (x and y on different eases) into its slot / cell, shrinking to the size of its destination.
// 3. LAND: it settles at scale 1.0, the target cell pulses 1.2x and locks, the clone is gone.
const SRC_FONT = 24,
  CLONE_FONT = 42; // px of the number on the circuit label and of the travelling number
const popped = new Set();
function extract(f) {
  const el = "#" + f.id,
    W = 65,
    H = 28;
  if (f.kind === "pop") {
    const col = COL[f.cls],
      rgb = RGB[col],
      key = f.num + "@" + f.t0;
    if (!popped.has(key)) {
      // a shared resistor pops once and its number splits into two
      popped.add(key);
      cue(f.t0);
      tl.set(f.num, { scale: 2.2, color: col }, f.t0);
      tl.fromTo(
        f.num,
        { textShadow: `0 0 0px rgba(${rgb},0)` },
        {
          textShadow: `0 0 22px rgba(${rgb},1)`,
          duration: 0.1,
          ease: "power2.out",
          immediateRender: false,
        },
        f.t0,
      );
      tl.to(
        f.num,
        {
          scale: 1,
          color: "#ffffff",
          textShadow: `0 0 0px rgba(${rgb},0)`,
          duration: 0.12,
          ease: "power2.out",
        },
        f.t1,
      ); // the label keeps its number
    }
  }
  const src = f.kind === "pop" ? { slot: f.num } : f.src;
  const s0 = f.kind === "pop" ? (2.2 * SRC_FONT) / CLONE_FONT : 0.76;
  tl.set(el, { display: "block", opacity: 1 }, f.t1);
  tl.fromTo(
    el,
    { x: () => centre(src).x - W, scale: s0 },
    {
      x: () => centre(f.tgt).x - W,
      scale: f.s1,
      duration: f.t2 - f.t1,
      ease: "power1.inOut",
      immediateRender: false,
    },
    f.t1,
  );
  tl.fromTo(
    el,
    { y: () => centre(src).y - H },
    {
      y: () => centre(f.tgt).y - H,
      duration: f.t2 - f.t1,
      ease: "power2.in",
      immediateRender: false,
    },
    f.t1,
  );
  tl.set(el, { opacity: 0, display: "none" }, f.t2);
  if (f.cell) cellPulse(f.cell, f.t2);
}

// ================= 0.0 - 2.0  HOOK: the circuit is live from frame 0; the crossed-out graphic in zone 3 shatters into particles at 0.8 s =================
DATA.hook.pieces.forEach((p) => tl.set("#" + p.id, { rotation: p.r0 }, 0));
tl.to("#hk-bg", { opacity: 0, duration: 0.12, ease: "power1.in" }, 0.8);
DATA.hook.pieces.forEach((p) =>
  tl.fromTo(
    "#" + p.id,
    { x: 0, y: 0, rotation: p.r0 },
    {
      x: p.x,
      y: p.y,
      rotation: p.rot,
      duration: 0.42,
      delay: p.d,
      ease: "power2.in",
      immediateRender: false,
    },
    0.8,
  ),
);
DATA.hook.pieces.forEach((p) =>
  tl.to("#" + p.id, { opacity: 0, duration: 0.18, ease: "power1.in" }, 0.8 + p.d + 0.05),
); // gone before it can touch the revealed line
DATA.hook.particles.forEach((p) => {
  tl.set("#" + p.id, { opacity: 1 }, 0.8);
  tl.fromTo(
    "#" + p.id,
    { x: 0, y: 0, rotation: 0, opacity: 1 },
    {
      x: p.x,
      y: p.y,
      rotation: p.rot,
      opacity: 0,
      duration: 0.7,
      delay: p.d,
      ease: "power2.out",
      immediateRender: false,
    },
    0.8,
  );
});

// ================= 2.0 - 8.8  DIAGONALS: the comet touches a resistor, its number pops and glides into the equation; the sum drops into the matrix =================
DATA.groups.forEach((g) => {
  if (g.kind !== "diag") return;
  const m = g.mesh,
    tr = DATA.tracers[m],
    W = tr.wps;
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

  g.touches.forEach((t) => halo(t.res, t.t, t.t + 0.15, BLUE)); // the touched resistor flashes (0.15 s bloom)
  g.flights.forEach((f) => {
    extract(f);
    if (f.kind === "pop") {
      ignite(`#d${m}-s${f.merge}`, f.t2); // the number has arrived: its term lights up
      ignite(`#d${m}-n${f.merge}`, f.t2);
    } else {
      ignite(`#d${m}-f`, f.t0); // the sum lights up as it drops
    }
  });
  lockCell(g.cells[0], g.lock, g.color);
});

// ================= 8.8 - 12.8  OFF-DIAGONALS: the number on the shared resistor doubles in size and splits into two negative numbers =================
DATA.groups.forEach((g) => {
  if (g.kind !== "off" && g.kind !== "zero") return;
  const id = { o12: "#off-a", o23: "#off-b", o13: "#off-c" }[g.id];
  if (g.id === "o12") bswap("#bv-off", g.banner);
  variant(id, g.banner);
  if (g.kind === "off") {
    const f0 = g.flights[0];
    halo(g.shared, f0.t0, f0.t2, PURPLE); // the shared resistor glows Neon Purple until its numbers have landed
    g.flights.forEach(extract);
  } else {
    // meshes 1 and 3 share no resistor: their boundaries glow, the zeros lock
    [1, 3].forEach((m) => contour(m, g.start + 0.15, g.until - 0.4));
    g.cells.forEach((cid) => cellPulse(cid, g.lock));
  }
  g.cells.forEach((cid) => lockCell(cid, g.lock, g.color));
});

// ================= 12.8 - 16.5  SOURCES: rises minus drops =================
DATA.groups.forEach((g) => {
  if (g.kind !== "src") return;
  if (g.mesh === 1) bswap("#bv-src", g.banner);
  variant("#src-" + g.mesh, g.banner);
  contour(g.mesh, g.start + 0.15, g.until - 0.3);
  g.flights.forEach((f) => {
    extract(f);
    if (f.kind === "pop") {
      halo(f.comp, f.t0, f.t2, RED); // the source blooms while its number leaves and relaxes once it has landed
      if (f.merge) ignite("#" + f.merge, f.t2, RGB[RED]);
    } else {
      ignite("#v1-f", f.t0, RGB[RED]);
    }
  });
  lockCell(g.cells[0], g.lock, g.color);
});

// ================= 16.5 - 21.0  SYSTEM SOLVED, THEN THE CTA =================
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
// the matrix pulses as a neon energy wave, travelling along the diagonal from R11 to v3 (glow only: no extra shapes)
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
