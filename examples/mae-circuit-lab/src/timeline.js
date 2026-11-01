/* MAE Academy · Circuit Lab · mesh-analysis film. GSAP 3.12.5, one paused root timeline: window.__timelines["main"].
   DATA (END, steps, I) is injected by build_index.py from scripts/solve.py. Whole file, rewritten as a unit. */

// @CUES-BEGIN
const CUES = [
  { id: "hk_drop", t: 1.4, v: "click", g: 0.55 },
  { id: "hk_toast", t: 1.52, v: "chime", g: 0.3 },
  { id: "cut", t: 3.0, v: "thump", g: 0.7 },
  { id: "w0", t: 3.1, v: "click", g: 0.3 },
  { id: "w1", t: 3.3, v: "click", g: 0.3 },
  { id: "w2", t: 3.5, v: "click", g: 0.3 },
  { id: "w3", t: 3.7, v: "click", g: 0.3 },
  { id: "w4", t: 3.9, v: "click", g: 0.3 },
  { id: "w5", t: 4.1, v: "click", g: 0.3 },
  { id: "w6", t: 4.3, v: "click", g: 0.3 },
  { id: "w7", t: 4.5, v: "click", g: 0.3 },
  { id: "w8", t: 4.7, v: "click", g: 0.3 },
  { id: "e0", t: 5.0, v: "thump", g: 0.45 },
  { id: "e1", t: 5.2, v: "click", g: 0.5 },
  { id: "e2", t: 5.4, v: "click", g: 0.5 },
  { id: "e3", t: 5.6, v: "thump", g: 0.45 },
  { id: "e4", t: 5.8, v: "click", g: 0.5 },
  { id: "e5", t: 6.0, v: "click", g: 0.5 },
  { id: "e6", t: 6.2, v: "click", g: 0.5 },
  { id: "e7", t: 6.4, v: "thump", g: 0.45 },
  { id: "drawn", t: 6.8, v: "chime", g: 0.45 },
  { id: "m1", t: 7.1, v: "snap", g: 0.45 },
  { id: "k1", t: 7.7, v: "click", g: 0.4 },
  { id: "m2", t: 8.0, v: "snap", g: 0.45 },
  { id: "k2", t: 8.6, v: "click", g: 0.4 },
  { id: "m3", t: 8.9, v: "snap", g: 0.45 },
  { id: "k3", t: 9.5, v: "click", g: 0.4 },
  { id: "br_R", t: 11.0, v: "thump", g: 0.55 },
  { id: "r0", t: 12.0, v: "click", g: 0.28 },
  { id: "r1", t: 12.15, v: "click", g: 0.28 },
  { id: "r2", t: 12.3, v: "click", g: 0.28 },
  { id: "r3", t: 12.45, v: "click", g: 0.28 },
  { id: "r4", t: 12.6, v: "click", g: 0.28 },
  { id: "r5", t: 12.75, v: "click", g: 0.28 },
  { id: "r6", t: 12.9, v: "click", g: 0.28 },
  { id: "r7", t: 13.05, v: "click", g: 0.28 },
  { id: "r8", t: 13.2, v: "click", g: 0.28 },
  { id: "eqs", t: 13.6, v: "snap", g: 0.4 },
  { id: "br_V", t: 13.7, v: "thump", g: 0.45 },
  { id: "v0", t: 14.2, v: "click", g: 0.3 },
  { id: "v1", t: 14.35, v: "click", g: 0.3 },
  { id: "v2", t: 14.5, v: "click", g: 0.3 },
  { id: "glow", t: 15.3, v: "chime", g: 0.45 },
  { id: "s1", t: 16.0, v: "snap", g: 0.7 },
  { id: "s2", t: 17.6, v: "snap", g: 0.7 },
  { id: "s3", t: 19.0, v: "snap", g: 0.7 },
  { id: "s4", t: 20.1, v: "snap", g: 0.7 },
  { id: "s5", t: 21.2, v: "snap", g: 0.7 },
  { id: "vals", t: 22.0, v: "chime", g: 0.35 },
  { id: "c1", t: 22.3, v: "click", g: 0.65 },
  { id: "c2", t: 23.1, v: "click", g: 0.65 },
  { id: "c3", t: 23.9, v: "click", g: 0.65 },
  { id: "t1", t: 22.6, v: "click", g: 0.3 },
  { id: "t2", t: 23.4, v: "click", g: 0.3 },
  { id: "t3", t: 24.2, v: "click", g: 0.3 },
  { id: "box", t: 25.0, v: "chime", g: 0.6 },
  { id: "pw1", t: 25.3, v: "snap", g: 0.5 },
  { id: "pw2", t: 25.8, v: "click", g: 0.4 },
  { id: "cta", t: 26.3, v: "thump", g: 0.55 },
  { id: "rip1", t: 27.0, v: "click", g: 0.35 },
  { id: "rip2", t: 27.35, v: "click", g: 0.35 },
  { id: "press", t: 28.5, v: "relay_thump", g: 1.0 },
  { id: "open", t: 28.62, v: "chime", g: 0.5 },
];
// @CUES-END

const T = (id) => {
  const c = CUES.find((x) => x.id === id);
  if (!c) throw new Error("missing cue " + id);
  return c.t;
};

const BRK = ["V1", "R1", "R3", "V2", "R2", "R4", "R5", "V3"]; // branch draw order
const NODES = ["TL", "N1", "TR", "N3", "N2"];
const tl = gsap.timeline({ paused: true });

// ---- helpers (opacity / transform only: never letter-spacing or font-size) ----
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

// ================= 0.0 - 3.0  HOOK (video clip is timed by its own data-start/data-duration) =================
// the banner (#sb-hook), subtitle #sub-0 and the stage caption are on screen at frame 0
tl.fromTo(
  "#cutflash",
  { opacity: 0.55 },
  { opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false },
  DATA.T_HOOK,
);
fadeOut("#hookcap", DATA.T_HOOK, 0.12, 0);
fadeOut("#sub-0", DATA.T_HOOK, 0.2, -6);
fadeIn("#sub-1", DATA.T_HOOK + 0.1, 0.3, 6);
swap("#sb-hook", "#sb-redraw", DATA.T_HOOK);

// ================= 3.0 - 7.0  REDRAW =================
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
    d = 0.55,
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

// ================= 7.0 - 11.0  MESH CURRENTS (clockwise) + KVL =================
swap("#sub-1", "#sub-2", 7.0);
swap("#sb-redraw", "#sb-kvl", T("m1"));
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
  fadeIn("#kvl-" + n, T("k" + n), 0.35, 10);
});

// ================= 11.0 - 16.0  MATRIX =================
swap("#sub-2", "#sub-3", 10.95);
swap("#sb-kvl", "#sb-mx", 10.95);
tl.fromTo(
  "#card",
  { opacity: 0.55 },
  { opacity: 1, duration: 0.3, immediateRender: false },
  T("br_R") - 0.2,
);
["brl-R", "brr-R"].forEach((id) => {
  const L = +document.getElementById(id).getAttribute("stroke-dasharray");
  tl.fromTo(
    "#" + id,
    { strokeDashoffset: L },
    { strokeDashoffset: 0, duration: 0.6, ease: "power2.inOut", immediateRender: false },
    T("br_R"),
  );
});
[1, 2, 3].forEach((c, i) => {
  fadeIn("#col-" + c, T("br_R") + 0.7 + i * 0.1, 0.3, 6);
  fadeIn("#rl-" + c, T("br_R") + 0.7 + i * 0.1, 0.3, 0);
});
for (let r = 0; r < 3; r++)
  for (let c = 0; c < 3; c++) pop(`#e-${r}-${c}`, T("r" + (r * 3 + c)), 0.25);
fadeIn("#eqsign", T("eqs"), 0.25, 0);
["brl-V", "brr-V"].forEach((id) => {
  const L = +document.getElementById(id).getAttribute("stroke-dasharray");
  tl.fromTo(
    "#" + id,
    { strokeDashoffset: L },
    { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut", immediateRender: false },
    T("br_V"),
  );
});
fadeIn("#col-V", T("br_V") + 0.4, 0.3, 6);
for (let r = 0; r < 3; r++) pop(`#v-${r}`, T("v" + r), 0.25);
// glow pulse on every entry (colour-matched), once the matrix is complete
[
  ["#card .cell.d .o", "0,136,255"],
  ["#card .cell.p .o", "176,38,255"],
  ["#card .cell.s .o", "255,0,68"],
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
    T("glow"),
  );
  tl.to(
    sel,
    { textShadow: `0 0 0px rgba(${rgb},0)`, duration: 0.45, ease: "power2.in" },
    T("glow") + 0.4,
  );
});

// ================= 16.0 - 22.0  ELIMINATION (pivot glow + arrow + snap) =================
swap("#sub-3", "#sub-4", 15.95);
swap("#sb-mx", "#es-1", T("s1") - 0.05);
const SNAP = ["s1", "s2", "s3", "s4", "s5"];
DATA.steps.forEach((st, i) => {
  const t = T(SNAP[i]),
    n = i + 1;
  if (i > 0) swap("#es-" + i, "#es-" + n, t - 0.05);
  tl.set("#pivot", { y: st.pivot * 44 }, t);
  tl.to("#pivot", { opacity: 1, duration: 0.2, ease: "power2.out" }, t);
  const L = +document.getElementById("arr-" + n).getAttribute("stroke-dasharray");
  tl.set("#arr-" + n, { opacity: 1 }, t + 0.2);
  tl.fromTo(
    "#arr-" + n,
    { strokeDashoffset: L },
    { strokeDashoffset: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
    t + 0.2,
  );
  tl.fromTo(
    "#arrh-" + n,
    { opacity: 0 },
    { opacity: 1, duration: 0.1, immediateRender: false },
    t + 0.45,
  );
  if (st.kind === "fwd") {
    st.cells.forEach((cid, j) => {
      const ts = t + 0.7 + j * 0.06;
      tl.to(`#${cid} .o`, { opacity: 0, scale: 0.5, duration: 0.2, ease: "power2.in" }, ts);
      tl.fromTo(
        `#${cid} .n2`,
        { opacity: 0, scale: 1.7 },
        { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false },
        ts + 0.1,
      );
    });
    // result-row colour change is carried by the .n2 class: eliminated zeros stay purple, b-entries become white
    tl.to(`#pivot`, { opacity: 0, duration: 0.25 }, t + 1.25);
    tl.to(["#arr-" + n, "#arrh-" + n], { opacity: 0, duration: 0.25 }, t + 1.25);
  } else {
    const slot = "#slot-" + (st.pivot + 1);
    fadeIn(slot, t + 0.5, 0.3, 0);
    tl.to("#pivot", { opacity: 0, duration: 0.2 }, t + 0.72);
    tl.to(["#arr-" + n, "#arrh-" + n], { opacity: 0, duration: 0.2 }, t + 0.82);
  }
});

// ================= 22.0 - 25.0  SOLVED CURRENTS, KCL, VALUES ON THE CIRCUIT =================
swap("#sub-4", "#sub-5", 21.95);
swap("#es-5", "#sb-kcl", 22.15);
BRK.forEach((k, i) => pop("#bc-" + k, T("vals") + i * 0.06, 0.3));
NODES.concat(["GND"]).forEach((n, i) => pop("#nv-" + n, T("vals") + 0.1 + i * 0.06, 0.3));
[1, 2, 3].forEach((n, i) => {
  const t = T("c" + n),
    d = DATA.I[i];
  tl.to(`#q-${n}`, { opacity: 0, duration: 0.12 }, t);
  tl.fromTo(`#val-${n}`, { opacity: 0 }, { opacity: 1, duration: 0.12, immediateRender: false }, t);
  tl.fromTo(
    `#cnt-${n}`,
    { textContent: 0 },
    {
      textContent: d.abs,
      duration: 0.7,
      ease: "power2.out",
      snap: { textContent: d.dec ? 0.001 : 1 },
      immediateRender: false,
    },
    t,
  );
  fadeIn("#kcl-N" + n, T("t" + n) - 0.2, 0.3, 8);
  tl.fromTo(
    "#tk-N" + n,
    { strokeDashoffset: 32 },
    { strokeDashoffset: 0, duration: 0.25, ease: "power2.out", immediateRender: false },
    T("t" + n) + 0.15,
  );
});

// ================= 25.0 - 29.0  FINAL: BOX, POWER CHECK, CTA =================
swap("#sub-5", "#sub-6", T("box") - 0.05);
tl.fromTo(
  "#ibox",
  { opacity: 0, scale: 0.94 },
  { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.8)", immediateRender: false },
  T("box"),
);
tl.fromTo(
  "#card .sl-val",
  { textShadow: "0 0 0px rgba(0,136,255,0)" },
  { textShadow: "0 0 18px rgba(0,136,255,0.95)", duration: 0.4, immediateRender: false },
  T("box"),
);
swap("#sb-kcl", "#sb-pw", T("pw1") - 0.1);
fadeIn("#pw-1", T("pw1"), 0.3, 8);
fadeIn("#pw-2", T("pw2") - 0.25, 0.3, 8);
tl.fromTo(
  "#tk-P",
  { strokeDashoffset: 32 },
  { strokeDashoffset: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
  T("pw2") + 0.2,
);

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
// cursor: tip offset inside the 60px svg is (6,4); glide from lower right to the button centre
tl.set("#cursor", { x: 874, y: 1596 }, 0);
tl.fromTo("#cursor", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, 27.55);
tl.fromTo(
  "#cursor",
  { x: 874, y: 1596 },
  { x: 774, y: 1558, duration: 0.85, ease: "power2.inOut", immediateRender: false },
  27.55,
);
// click: scale 0.94, white flash, label swap
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
