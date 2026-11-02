/* THE R-MATRIX TRICK: THE COMPLETE MASTERCLASS. 21.0 s, GSAP 3.12.5, one paused root timeline: window.__timelines["main"].
   DATA (groups, comet laps, flights) is injected by build_index.py, which also writes the CUES block below from the same schedule.
   The circuit in zone 2 is never dimmed, hidden or moved. Every value reaches the matrix by lifting off its own component as a glowing
   numeric clone and projecting straight into its cell in 0.25 s; the clone then leaves the layout. No badges, no leftovers. */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"],
  [1.2, "snap"],
  [3.274, "click"],
  [3.524, "click"],
  [3.65, "click"],
  [3.9, "snap"],
  [3.9, "thump"],
  [4.41, "click"],
  [4.66, "click"],
  [4.957, "click"],
  [5.207, "click"],
  [6.05, "click"],
  [6.3, "snap"],
  [6.3, "thump"],
  [7.801, "click"],
  [8.051, "click"],
  [8.25, "click"],
  [8.5, "snap"],
  [8.5, "thump"],
  [9.65, "click"],
  [9.9, "snap"],
  [9.9, "thump"],
  [11.15, "click"],
  [11.4, "snap"],
  [11.4, "thump"],
  [12.15, "click"],
  [12.4, "snap"],
  [12.4, "thump"],
  [13.4, "click"],
  [13.65, "click"],
  [13.9, "snap"],
  [13.9, "thump"],
  [14.75, "click"],
  [15.0, "snap"],
  [15.0, "thump"],
  [15.85, "click"],
  [16.1, "snap"],
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
function halo(k, t0, t1, color, rel = 0.35) {
  // a component blooms in `color` (0.15 s attack) from t0 and relaxes to its base glow from t1
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

// A value is extracted: its numeric clone appears at the component's exact SVG coordinate and projects straight into the target cell in
// exactly 0.25 s (power3.out). On arrival the cell pulses 1.2x and the clone leaves at once (opacity 0, display none).
function fly(f) {
  const el = "#" + f.id,
    W = 65,
    H = 28;
  cue(f.t0);
  cue(f.t1);
  tl.set(el, { display: "block", opacity: f.cls === "z" ? 0.75 : 1 }, f.t0);
  tl.fromTo(
    el,
    { x: f.src.x - W, y: f.src.y - H },
    { x: f.tgt.x - W, y: f.tgt.y - H, duration: 0.25, ease: "power3.out", immediateRender: false },
    f.t0,
  );
  tl.set(el, { opacity: 0, display: "none" }, f.t1);
  tl.fromTo(
    "#" + f.cell,
    { scale: 1.2 },
    { scale: 1, duration: 0.25, ease: "power2.out", immediateRender: false },
    f.t1,
  );
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

// ================= 2.0 - 8.8  DIAGONALS: the comet touches a resistor, which flashes, and its value projects into the matrix cell =================
DATA.groups.forEach((g) => {
  if (g.kind !== "diag") return;
  const m = g.mesh,
    tr = DATA.tracers[m],
    W = tr.wps;
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

  // each touched resistor flashes (0.15 s bloom), its term ignites in the banner and its value projects into the cell
  g.touches.forEach((t) => halo(t.res, t.t, t.t + 0.15, BLUE));
  g.flights.forEach((f) => {
    fly(f);
    ignite(`#d${m}-s${f.merge}`, f.t0);
    ignite(`#d${m}-n${f.merge}`, f.t0);
  });
  ignite(`#d${m}-f`, g.lock); // the result lights up as the cell turns into its final value
  lockCell(g.cells[0], g.lock, g.color);
});

// ================= 8.8 - 12.8  OFF-DIAGONALS: -(shared resistor), split into two symmetric values =================
DATA.groups.forEach((g) => {
  if (g.kind !== "off" && g.kind !== "zero") return;
  cue(g.lock);
  const id = { o12: "#off-a", o23: "#off-b", o13: "#off-c" }[g.id];
  if (g.id === "o12") bswap("#bv-off", g.banner);
  variant(id, g.banner);
  if (g.kind === "off") {
    halo(g.shared, g.start + 0.15, g.until - 0.5, PURPLE); // the shared resistor glows Neon Purple until its values are away
  } else {
    // meshes 1 and 3 touch no common resistor: their boundaries glow
    [1, 3].forEach((m) => contour(m, g.start + 0.15, g.until - 0.4));
  }
  g.flights.forEach(fly);
  g.cells.forEach((cid) => lockCell(cid, g.lock, g.color));
});

// ================= 12.8 - 16.5  SOURCES: rises minus drops =================
DATA.groups.forEach((g) => {
  if (g.kind !== "src") return;
  cue(g.lock);
  if (g.mesh === 1) bswap("#bv-src", g.banner);
  variant("#src-" + g.mesh, g.banner);
  g.src.forEach((k) => halo(k, g.start + 0.15, g.until - 0.5, RED)); // relaxes back to normal by the end of the mesh window
  contour(g.mesh, g.start + 0.15, g.until - 0.3);
  g.flights.forEach((f) => {
    fly(f);
    if (f.merge) ignite("#" + f.merge, f.t0, RGB[RED]);
  });
  if (g.id === "v1") ignite("#v1-f", g.lock, RGB[RED]);
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
