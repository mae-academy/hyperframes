/* MAE Academy · "Where does the R matrix come from?" GSAP 3.12.5, one paused root timeline: window.__timelines["main"].
   DATA (beats, fly offsets) is injected by build_index.py. Whole file, rewritten as a unit. */

// @CUES-BEGIN
const CUES = [
  { id: "w0", t: 0.25, v: "click", g: 0.3 },
  { id: "w1", t: 0.4, v: "click", g: 0.3 },
  { id: "w2", t: 0.55, v: "click", g: 0.3 },
  { id: "w3", t: 0.7, v: "click", g: 0.3 },
  { id: "w4", t: 0.85, v: "click", g: 0.3 },
  { id: "w5", t: 1.0, v: "click", g: 0.3 },
  { id: "w6", t: 1.15, v: "click", g: 0.3 },
  { id: "w7", t: 1.3, v: "click", g: 0.3 },
  { id: "w8", t: 1.45, v: "click", g: 0.3 },
  { id: "e0", t: 1.6, v: "thump", g: 0.45 },
  { id: "e1", t: 1.75, v: "click", g: 0.5 },
  { id: "e2", t: 1.9, v: "click", g: 0.5 },
  { id: "e3", t: 2.05, v: "thump", g: 0.45 },
  { id: "e4", t: 2.2, v: "click", g: 0.5 },
  { id: "e5", t: 2.35, v: "click", g: 0.5 },
  { id: "e6", t: 2.5, v: "click", g: 0.5 },
  { id: "e7", t: 2.65, v: "thump", g: 0.45 },
  { id: "drawn", t: 3.0, v: "chime", g: 0.45 },
  { id: "m1", t: 3.5, v: "snap", g: 0.45 },
  { id: "m2", t: 4.1, v: "snap", g: 0.45 },
  { id: "m3", t: 4.7, v: "snap", g: 0.45 },
  { id: "br_R", t: 6.0, v: "thump", g: 0.55 },
  { id: "br_V", t: 6.6, v: "thump", g: 0.45 },
  { id: "eqs", t: 6.9, v: "snap", g: 0.4 },
  { id: "b_d1", t: 7.2, v: "snap", g: 0.6 },
  { id: "l_d1", t: 8.25, v: "click", g: 0.65 },
  { id: "b_d2", t: 9.2, v: "snap", g: 0.6 },
  { id: "l_d2", t: 10.25, v: "click", g: 0.65 },
  { id: "b_d3", t: 11.2, v: "snap", g: 0.6 },
  { id: "l_d3", t: 12.25, v: "click", g: 0.65 },
  { id: "b_o12", t: 13.2, v: "snap", g: 0.6 },
  { id: "l_o12", t: 14.25, v: "click", g: 0.65 },
  { id: "b_o23", t: 15.2, v: "snap", g: 0.6 },
  { id: "l_o23", t: 16.25, v: "click", g: 0.65 },
  { id: "b_o13", t: 17.2, v: "snap", g: 0.6 },
  { id: "l_o13", t: 18.25, v: "click", g: 0.65 },
  { id: "b_v1", t: 19.2, v: "snap", g: 0.6 },
  { id: "l_v1", t: 20.25, v: "click", g: 0.65 },
  { id: "b_v2", t: 21.2, v: "snap", g: 0.6 },
  { id: "l_v2", t: 22.25, v: "click", g: 0.65 },
  { id: "b_v3", t: 23.2, v: "snap", g: 0.6 },
  { id: "l_v3", t: 24.25, v: "click", g: 0.65 },
  { id: "final", t: 25.2, v: "chime", g: 0.55 },
  { id: "cta", t: 25.9, v: "thump", g: 0.55 },
  { id: "rip1", t: 26.6, v: "click", g: 0.35 },
  { id: "rip2", t: 26.95, v: "click", g: 0.35 },
  { id: "press", t: 28.0, v: "relay_thump", g: 1.0 },
  { id: "open", t: 28.12, v: "chime", g: 0.5 },
];
// @CUES-END

const T = (id) => {
  const c = CUES.find((x) => x.id === id);
  if (!c) throw new Error("missing cue " + id);
  return c.t;
};

const BRK = ["V1", "R1", "R3", "V2", "R2", "R4", "R5", "V3"]; // draw order
const NODES = ["TL", "N1", "TR", "N3", "N2"];
const BLUE = "#0088FF";
const RGB = { "#0088FF": "0,136,255", "#B026FF": "176,38,255", "#FF0044": "255,0,68" };
const tl = gsap.timeline({ paused: true });

// helpers: opacity / transform only (never letter-spacing or font-size)
const fadeIn = (sel, t, d = 0.3, y = 8) =>
  tl.fromTo(
    sel,
    { opacity: 0, y },
    { opacity: 1, y: 0, duration: d, ease: "power2.out", immediateRender: false },
    t,
  );
const fadeOut = (sel, t, d = 0.25, y = -8) =>
  tl.to(sel, { opacity: 0, y, duration: d, ease: "power2.in" }, t);
const pop = (sel, t, d = 0.25) =>
  tl.fromTo(
    sel,
    { opacity: 0, scale: 0.35 },
    { opacity: 1, scale: 1, duration: d, ease: "back.out(2.2)", immediateRender: false },
    t,
  );
const swap = (from, to, t) => {
  fadeOut(from, t, 0.2);
  fadeIn(to, t + 0.12, 0.3);
};
const shadow = (rgb, a, px) => `drop-shadow(0px 0px ${px}px rgba(${rgb},${a}))`;

// ================= 0.0 - 3.5  REDRAW (light packets, then the parts drop in) =================
const wires = BRK.concat(["GND"]);
const ENDS = {};
wires.forEach((k) => {
  const w = document.getElementById("w-" + k);
  ENDS[k] = {
    x: +w.getAttribute("x2") - +w.getAttribute("x1"),
    y: +w.getAttribute("y2") - +w.getAttribute("y1"),
    L: w.getTotalLength(),
  };
});
wires.forEach((k, i) => {
  const t = T("w" + i),
    d = 0.5,
    e = ENDS[k];
  tl.fromTo(
    "#w-" + k,
    { strokeDashoffset: e.L },
    { strokeDashoffset: 0, duration: d, ease: "none", immediateRender: false },
    t,
  );
  tl.fromTo(
    "#pk-" + k,
    { x: 0, y: 0, opacity: 1 },
    { x: e.x, y: e.y, duration: d, ease: "none", immediateRender: false },
    t,
  );
  tl.to("#pk-" + k, { opacity: 0, duration: 0.15 }, t + d);
  tl.fromTo(
    "#w-" + k,
    { stroke: "#CFE6FF" },
    { stroke: "#3E5C94", duration: 0.5, ease: "power1.out", immediateRender: false },
    t + d,
  );
});
tl.fromTo(
  "#gnd",
  { opacity: 0, y: -10 },
  { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
  T("w8") + 0.45,
);
tl.fromTo(
  ".gnode",
  { opacity: 0 },
  { opacity: 1, duration: 0.3, immediateRender: false },
  T("w8") + 0.45,
);
NODES.forEach((n, i) =>
  tl.fromTo(
    "#nd-" + n,
    { opacity: 0 },
    { opacity: 1, duration: 0.25, immediateRender: false },
    T("w" + (i + 1)) + 0.4,
  ),
);
BRK.forEach((k, i) => {
  const t = T("e" + i);
  tl.fromTo(
    "#el-" + k,
    { opacity: 0, y: -40 },
    { opacity: 1, y: 0, duration: 0.42, ease: "back.out(1.8)", immediateRender: false },
    t,
  );
  fadeIn("#lb-" + k, t + 0.14, 0.3, 10);
});
NODES.concat(["GND"]).forEach((n, i) => fadeIn("#nt-" + n, T("drawn") - 0.1 + i * 0.05, 0.3, 6));

// ================= 3.4 - 6.0  CLOCKWISE MESH CURRENTS =================
swap("#sub-0", "#sub-1", 3.35);
swap("#sb-hook", "#sb-mesh", 3.35);
[1, 2, 3].forEach((n) => {
  const t = T("m" + n);
  tl.fromTo(
    "#mesh-" + n,
    { strokeDashoffset: +document.getElementById("mesh-" + n).getAttribute("stroke-dasharray") },
    { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut", immediateRender: false },
    t,
  );
  tl.fromTo(
    "#mhead-" + n,
    { opacity: 0 },
    { opacity: 1, duration: 0.12, immediateRender: false },
    t + 0.55,
  );
  fadeIn("#ml-" + n, t + 0.25, 0.3, 0);
});

// ================= 6.0 - 7.2  SET UP  R . I = V =================
swap("#sub-1", "#sub-5", 5.95);
swap("#sb-mesh", "#sb-form", 5.95);
fadeIn("#rules", 6.1, 0.4, 0);
["brl-R", "brr-R"].forEach((id) => {
  const L = +document.getElementById(id).getAttribute("stroke-dasharray");
  tl.fromTo(
    "#" + id,
    { strokeDashoffset: L },
    { strokeDashoffset: 0, duration: 0.55, ease: "power2.inOut", immediateRender: false },
    T("br_R"),
  );
});
[1, 2, 3].forEach((c, i) => {
  fadeIn("#col-" + c, T("br_R") + 0.45 + i * 0.08, 0.3, 6);
  fadeIn("#rl-" + c, T("br_R") + 0.45 + i * 0.08, 0.3, 0);
});
["brl-V", "brr-V"].forEach((id) => {
  const L = +document.getElementById(id).getAttribute("stroke-dasharray");
  tl.fromTo(
    "#" + id,
    { strokeDashoffset: L },
    { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut", immediateRender: false },
    T("br_V"),
  );
});
fadeIn("#col-V", T("br_V") + 0.35, 0.3, 6);
fadeIn("#eqsign", T("eqs"), 0.25, 0);

// ================= 7.2 - 25.2  ONE BEAT PER GROUP OF ENTRIES =================
const state = {}; // last drawn style of each part, so every fromTo starts exactly where the previous one ended
BRK.forEach((k) => {
  state[k] = {
    op: 1,
    stroke: k[0] === "R" ? BLUE : "#FF0044",
    sh: shadow(k[0] === "R" ? RGB[BLUE] : RGB["#FF0044"], 0, 0),
  };
});
const meshOp = { 1: 1, 2: 1, 3: 1 };

function light(t, b) {
  // b = null -> restore everything
  BRK.forEach((k) => {
    const isR = k[0] === "R",
      base = isR ? BLUE : "#FF0044";
    const on = !b || b.res.includes(k) || b.src.includes(k);
    const hot = !!b && on;
    const to = {
      op: on ? 1 : 0.28,
      stroke: hot && isR ? b.color : base,
      sh: hot ? shadow(RGB[hot && isR ? b.color : base], 0.95, 9) : shadow(RGB[base], 0, 0),
    };
    const from = state[k];
    tl.fromTo(
      [`#el-${k}`, `#lb-${k}`, `#w-${k}`],
      { opacity: from.op },
      { opacity: to.op, duration: 0.3, immediateRender: false },
      t,
    );
    const part = isR ? `#el-${k} .res` : `#el-${k} .src`;
    tl.fromTo(
      part,
      { stroke: from.stroke, filter: from.sh },
      { stroke: to.stroke, filter: to.sh, duration: 0.3, immediateRender: false },
      t,
    );
    state[k] = to;
  });
  [1, 2, 3].forEach((m) => {
    const to = !b || b.meshes.includes(m) ? 1 : 0.25;
    tl.fromTo(
      [`#mesh-${m}`, `#mhead-${m}`, `#ml-${m}`],
      { opacity: meshOp[m] },
      { opacity: to, duration: 0.3, immediateRender: false },
      t,
    );
    meshOp[m] = to;
  });
}

const SUBS = { 2: "d1", 3: "o12", 4: "v1" }; // subtitle changes at the first beat of each group
let curSub = "#sub-5",
  curBt = "#sb-form";
DATA.beats.forEach((b) => {
  const t0 = T("b_" + b.id),
    tl_ = T("l_" + b.id);
  const sub = Object.keys(SUBS).find((k) => SUBS[k] === b.id);
  if (sub) {
    swap(curSub, "#sub-" + sub, t0 - 0.05);
    curSub = "#sub-" + sub;
  }
  swap(curBt, "#bt-" + b.id, t0 - 0.05);
  curBt = "#bt-" + b.id;
  light(t0, b);
  tl.to("#rule-" + b.rule, { opacity: 1, duration: 0.25 }, t0);
  tl.to("#rule-" + b.rule, { opacity: 0.4, duration: 0.25 }, t0 + 1.75);
  b.cells.forEach((cid) => {
    const f = DATA.fly[cid],
      rgb = RGB[b.color];
    tl.fromTo(
      "#fly-" + cid,
      { x: f.dx, y: f.dy, scale: 1.5, opacity: 0 },
      {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1,
        duration: tl_ - t0 - 0.5,
        ease: "power2.inOut",
        immediateRender: false,
      },
      t0 + 0.5,
    );
    tl.set("#fly-" + cid, { opacity: 0 }, tl_);
    pop("#" + cid, tl_, 0.3);
    tl.fromTo(
      `#${cid} b`,
      { textShadow: `0 0 0px rgba(${rgb},0)` },
      {
        textShadow: `0 0 22px rgba(${rgb},0.95)`,
        duration: 0.3,
        ease: "power2.out",
        immediateRender: false,
      },
      tl_,
    );
    tl.to(
      `#${cid} b`,
      { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.5, ease: "power2.in" },
      tl_ + 0.5,
    );
  });
});

// ================= 25.2 - 25.9  WHOLE MATRIX =================
swap("#sub-4", "#sub-6", T("final") - 0.05);
swap(curBt, "#sb-final", T("final") - 0.05);
light(T("final"), null);
fadeIn("#cardnote", T("final") + 0.1, 0.4, 0);
[
  ["#card .cell.d b", "0,136,255"],
  ["#card .cell.p b", "176,38,255"],
  ["#card .cell.s b", "255,0,68"],
].forEach(([sel, rgb]) => {
  tl.fromTo(
    sel,
    { textShadow: `0 0 0px rgba(${rgb},0)` },
    {
      textShadow: `0 0 20px rgba(${rgb},0.95)`,
      duration: 0.35,
      ease: "power2.out",
      immediateRender: false,
    },
    T("final"),
  );
  tl.to(
    sel,
    { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.45, ease: "power2.in" },
    T("final") + 0.45,
  );
});

// ================= 25.9 - 28.8  CTA =================
fadeOut("#rules", T("cta") - 0.3, 0.3, 0);
tl.fromTo(
  "#cta",
  { opacity: 0, y: -22 },
  { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: false },
  T("cta"),
);
[
  ["#rip-1", "rip1"],
  ["#rip-2", "rip2"],
].forEach(([id, c]) =>
  tl.fromTo(
    id,
    { scale: 1, opacity: 0.9 },
    { scale: 1.12, opacity: 0, duration: 0.75, ease: "power2.out", immediateRender: false },
    T(c),
  ),
);
// cursor tip is at (6,4) inside its 60px svg: glide from the lower right to the right end of the button
tl.set("#cursor", { x: 874, y: 1596 }, 0);
tl.fromTo("#cursor", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, 27.0);
tl.fromTo(
  "#cursor",
  { x: 874, y: 1596 },
  { x: 774, y: 1558, duration: 0.9, ease: "power2.inOut", immediateRender: false },
  27.0,
);
tl.fromTo(
  "#cta-btn",
  { scale: 1 },
  { scale: 0.94, duration: 0.08, ease: "power2.out", immediateRender: false },
  T("press"),
);
tl.to("#cta-btn", { scale: 1, duration: 0.25, ease: "back.out(2.5)" }, T("press") + 0.08);
tl.fromTo(
  "#btn-flash",
  { opacity: 0 },
  { opacity: 0.95, duration: 0.1, ease: "power1.out", immediateRender: false },
  T("press") + 0.02,
);
tl.set("#btn-a", { opacity: 0 }, T("open"));
tl.set("#btn-b", { opacity: 1 }, T("open"));
tl.to("#btn-flash", { opacity: 0, duration: 0.3, ease: "power2.in" }, T("open"));

window.__timelines = window.__timelines || {};
window.__timelines["main"] = tl;
