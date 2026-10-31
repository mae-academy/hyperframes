/* =====================================================================================
         MAE Academy — Logic Circuit Simulator · master timeline (27.0 s, 1080×1920)
         Every visible value is a pure function of timeline time: no Date, no Math.random, no network.
         Geometry:  WORLD coords (SVG #world).  zoom 1 → page == world.  Zoom .82 about (560,760):
                    page = (560 + .82 (x-560), 760 + .82 (y-760)).
         Frame 0 is a LIVE half adder (A=B=1, C lit). The hook banner is removed (display:none) after
         2.2 s and never returns; the end state simply holds the verified full adder + CTA.
         ===================================================================================== */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"],
  [0.05, "snap"],
  [2.2, "click"],
  [3.2, "snap"],
  [4.2, "snap"],
  [5.2, "click"],
  [6.0, "click"],
  [7.0, "click"],
  [8.2, "click"],
  [9.5, "snap"],
  [9.7, "relay_thump"],
  [11.0, "click"],
  [12.0, "thump"],
  [13.5, "click"],
  [14.5, "snap"],
  [16.0, "click"],
  [17.5, "click"],
  [19.0, "snap"],
  [20.0, "click"],
  [20.8, "click"],
  [21.6, "click"],
  [22.6, "relay_thump"],
  [22.8, "chime"],
  [24.5, "snap"],
  [25.8, "click"],
];
// @CUES-END

/* ---------- procedural Web Audio (live preview). scripts/make_sfx.py mirrors these voices with numpy ---------- */
const SFX = (() => {
  let ctx, master;
  const env = (g, t, pk, dec, att = 0.001) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pk, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec);
  };
  const tone = (c, out, t, f, pk, dec, att) => {
    const o = c.createOscillator(),
      g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    o.connect(g);
    g.connect(out);
    env(g, t, pk, dec, att);
    o.start(t);
    o.stop(t + dec + 0.05);
  };
  const sub = (c, out, t, f, pk, dec) => {
    const o = c.createOscillator(),
      s = c.createWaveShaper(),
      g = c.createGain(),
      k = new Float32Array(512);
    for (let i = 0; i < 512; i++) k[i] = Math.tanh(2.2 * (i / 255.5 - 1));
    s.curve = k;
    o.type = "sine";
    o.frequency.value = f;
    o.connect(s);
    s.connect(g);
    g.connect(out);
    env(g, t, pk, dec, 0.002);
    o.start(t);
    o.stop(t + dec + 0.05);
  };
  const V = {
    click(c, out, t) {
      tone(c, out, t, 1400, 0.34, 0.03);
      tone(c, out, t + 0.06, 1800, 0.22, 0.026);
    },
    snap(c, out, t) {
      tone(c, out, t, 2200, 0.42, 0.016);
      tone(c, out, t, 4400, 0.12, 0.009);
    },
    thump(c, out, t) {
      sub(c, out, t, 85, 0.6, 0.45);
      tone(c, out, t, 1400, 0.25, 0.014);
    },
    relay_thump(c, out, t) {
      sub(c, out, t, 85, 0.5, 0.4);
      sub(c, out, t, 170, 0.18, 0.2);
      tone(c, out, t, 1400, 0.4, 0.014);
      tone(c, out, t + 0.03, 1400, 0.2, 0.01);
    },
    chime(c, out, t) {
      tone(c, out, t, 1200, 0.16, 0.9, 0.003);
      tone(c, out, t, 1800, 0.1, 0.7, 0.003);
    },
  };
  return {
    live: false,
    arm() {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      [
        [50, 0.0631],
        [100, 0.02],
      ].forEach(([f, a]) => {
        const h = ctx.createOscillator(),
          hg = ctx.createGain();
        h.frequency.value = f;
        hg.gain.value = a;
        h.connect(hg);
        hg.connect(ctx.destination);
        h.start();
      });
      this.live = true;
    },
    play(k) {
      if (ctx && V[k]) V[k](ctx, master, ctx.currentTime + 0.005);
    },
  };
})();
window.addEventListener("pointerdown", () => SFX.arm(), { once: true });

/* ---------- geometry helpers ---------- */
const Z = 0.82,
  ZO = [560, 760];
const w2p = (x, y, z = Z) => [ZO[0] + z * (x - ZO[0]), ZO[1] + z * (y - ZO[1])];
const p2w = (x, y, z = Z) => [ZO[0] + (x - ZO[0]) / z, ZO[1] + (y - ZO[1]) / z];
const BLUE = "#0088FF",
  RED = "#FF0044",
  DIM = "#8A8AA8",
  WHITE = "#FFFFFF";

const tl = gsap.timeline({ paused: true });

gsap.set(".mv", { transformOrigin: "0px 0px" });
gsap.set("#world", { svgOrigin: "560 760" });
gsap.set("#half", { svgOrigin: "490 660" });
gsap.set("#mq0", { svgOrigin: "110 440" });
gsap.set("#mq", { svgOrigin: "320 470" });
gsap.set("#mq2", { svgOrigin: "495 660" });
gsap.set("#cArrow", { svgOrigin: "0 0" });
gsap.set("#cursor", { x: 540, y: 745 });
gsap.set("#ring", { x: 540, y: 745 });
gsap.set("#bn0", { opacity: 1 });
gsap.set("#ttFA", { opacity: 0 });

/* ---------- t = 0 state: a live half adder, A = B = 1, AND/Carry high, Sum low ---------- */
function liveState(set) {
  const live = set.live;
  set("#gXor, #gAnd, #tgA, #tgB, #ledS, #ledC", { opacity: live ? 1 : 0 });
  set("#half .wire .b", { strokeDashoffset: live ? 0 : 1 });
  set("#half .wire .g, #half .wire .l path", { strokeDashoffset: 1 });
  if (live)
    set(
      "#w_A1 .l path, #w_A2 .l path, #w_A3 .l path, #w_B1 .l path, #w_B2 .l path, #w_B3 .l path, #w_C0 .l path",
      { strokeDashoffset: 0 },
    );
  set("#j_A, #j_B", { opacity: live ? 1 : 0 });
  set("#gXor .on, #ledS .on", { opacity: 0 });
  set("#gAnd .on, #ledC .on", { opacity: live ? 1 : 0 });
  ["tgA", "tgB"].forEach((id) => {
    set(`#${id} .kn`, { x: live ? 40 : 0 });
    set(`#${id} .knOn, #${id} .trkOn, #${id} .stubOn`, { opacity: live ? 1 : 0 });
    set(`#${id} .d0`, { opacity: live ? 0 : 1 });
    set(`#${id} .d1`, { opacity: live ? 1 : 0 });
  });
  set("#haR3 .bg", { opacity: live ? 1 : 0 });
  set("#haR3 .ci, #haR3 .os", { color: live ? WHITE : DIM });
  set("#haR3 .oc", { color: live ? RED : DIM });
}
const g0 = (sel, p) => gsap.set(sel, p);
g0.live = true;
liveState(g0);

/* ---------- cursor ---------- */
let cx = 540,
  cy = 745;
function mv(t, x, y, d, over = true) {
  const dx = x - cx,
    dy = y - cy,
    dist = Math.hypot(dx, dy) || 1;
  const o = over ? Math.min(9, dist * 0.035) : 0;
  tl.fromTo(
    "#cursor",
    { x: cx, y: cy },
    {
      x: x + (dx / dist) * o,
      y: y + (dy / dist) * o,
      duration: d,
      ease: "power3.out",
      immediateRender: false,
    },
    t,
  );
  if (o > 0.5)
    tl.fromTo(
      "#cursor",
      { x: x + (dx / dist) * o, y: y + (dy / dist) * o },
      { x, y, duration: 0.1, ease: "power2.inOut", immediateRender: false },
      t + d,
    );
  cx = x;
  cy = y;
}
const hop = (t, x, y, d) => mv(t, x, y, d, false);
function ring(t) {
  tl.set("#ring", { x: cx, y: cy }, t);
  tl.fromTo(
    "#ring i",
    { scale: 0.3, opacity: 0.95 },
    { scale: 1.5, opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false },
    t,
  );
}
function down(t, withRing = true) {
  tl.to("#cArrow", { scale: 0.85, duration: 0.06, ease: "power2.out" }, t);
  if (withRing) ring(t);
}
const up = (t) => tl.to("#cArrow", { scale: 1, duration: 0.15, ease: "back.out(3)" }, t);
const click = (t) => {
  down(t);
  up(t + 0.07);
};

/* ---------- generic helpers ---------- */
const sfx = (id, t) =>
  tl.fromTo(
    "#sf_" + id,
    { scale: 0.85, opacity: 0.95 },
    { scale: 1.35, opacity: 0, duration: 0.35, ease: "power2.out", immediateRender: false },
    t,
  );
const pop = (id, t, s = 1.1) =>
  tl.fromTo(
    "#" + id,
    { scale: s },
    { scale: 1, duration: 0.25, ease: "back.out(2.2)", immediateRender: false },
    t,
  );
const fade = (sel, t, to, d = 0.2) =>
  tl.to(sel, { opacity: to, duration: d, ease: "power2.out" }, t);
const TILE = { tog: [188, 383], xor: [364, 383], and: [540, 383], or: [716, 383], led: [892, 383] };
function tilePick(k, t0, t1) {
  tl.to(
    "#tile_" + k,
    { borderColor: BLUE, backgroundColor: "rgba(0,136,255,0.18)", duration: 0.1 },
    t0,
  );
  tl.to(
    "#tile_" + k,
    { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(30,30,46,0.6)", duration: 0.25 },
    t1,
  );
}
// item follows the cursor (shared power2.out ease + duration); offsets in WORLD units
function dragItem(id, t0, t1, a, b, finWorld, z, ghostScale = 0.5, appear = true) {
  const f = w2p(finWorld[0], finWorld[1], z);
  const oa = [(a[0] - f[0]) / z, (a[1] - f[1]) / z],
    ob = [(b[0] - f[0]) / z, (b[1] - f[1]) / z];
  tl.fromTo(
    "#cursor",
    { x: a[0], y: a[1] },
    { x: b[0], y: b[1], duration: t1 - t0, ease: "power2.out", immediateRender: false },
    t0,
  );
  tl.fromTo(
    "#" + id,
    { x: oa[0], y: oa[1], scale: ghostScale },
    {
      x: ob[0],
      y: ob[1],
      scale: 0.92,
      duration: t1 - t0,
      ease: "power2.out",
      immediateRender: false,
    },
    t0,
  );
  if (appear)
    tl.fromTo("#" + id, { opacity: 0 }, { opacity: 1, duration: 0.08, immediateRender: false }, t0);
  cx = b[0];
  cy = b[1];
}
function fly(id, t0, t1, tile, itemWorld, z) {
  const w = p2w(tile[0], tile[1], z);
  tl.fromTo(
    "#" + id,
    { x: w[0] - itemWorld[0], y: w[1] - itemWorld[1], scale: 0.4 },
    { x: 0, y: 0, scale: 1, duration: t1 - t0, ease: "power2.out", immediateRender: false },
    t0,
  );
  tl.fromTo("#" + id, { opacity: 0 }, { opacity: 1, duration: 0.08, immediateRender: false }, t0);
  pop(id, t1, 1.07);
  sfx(id, t1);
}

/* ---------- wires ---------- */
const autoWire = (t0, t1, id) =>
  tl.fromTo(
    `#w_${id} .b, #w_${id} .g`,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: t1 - t0, ease: "power2.out", immediateRender: false },
    t0,
  );
const settleWires = (t, ids) =>
  tl.to(
    ids.map((i) => `#w_${i} .g`).join(","),
    { opacity: 0, duration: 0.25, ease: "power2.out" },
    t,
  );
function lit(id, t, d) {
  tl.fromTo(
    `#w_${id} .l path`,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: d, ease: "none", immediateRender: false },
    t,
  );
  pulse(id, t, d);
}
function pulse(id, t, d) {
  tl.fromTo(
    `#w_${id} .p`,
    { strokeDashoffset: 0.1, opacity: 1 },
    { strokeDashoffset: -1.1, duration: d, ease: "none", immediateRender: false },
    t,
  );
  tl.set(`#w_${id} .p`, { opacity: 0 }, t + d);
}
const unlit = (id, t, d) =>
  tl.fromTo(
    `#w_${id} .l path`,
    { strokeDashoffset: 0 },
    { strokeDashoffset: -1, duration: d, ease: "none", immediateRender: false },
    t,
  );

/* ---------- logic parts ---------- */
function flip(id, t, v) {
  tl.to(`#${id} .kn`, { x: v ? 40 : 0, duration: 0.12, ease: "power2.out" }, t);
  tl.to(`#${id} .knOn, #${id} .trkOn, #${id} .stubOn`, { opacity: v, duration: 0.1 }, t);
  tl.to(`#${id} .d0`, { opacity: 1 - v, duration: 0.06 }, t);
  tl.to(`#${id} .d1`, { opacity: v, duration: 0.06 }, t);
}
const partOn = (id, t, a = 1) =>
  tl.to(`#${id} .on`, { opacity: a, duration: 0.12, ease: "power2.out" }, t);
const partOff = (id, t) =>
  tl.to(`#${id} .on`, { opacity: 0, duration: 0.18, ease: "power2.in" }, t);
function ledOn(id, t) {
  tl.to(`#${id} .on`, { opacity: 1, duration: 0.08, ease: "power2.out" }, t);
  tl.fromTo(
    `#${id} .ring`,
    { scale: 1, opacity: 0.9 },
    { scale: 2.2, opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false },
    t,
  );
}
const ledOff = (id, t) => tl.to(`#${id} .on`, { opacity: 0, duration: 0.18, ease: "power2.in" }, t);

/* ---------- Zone 3 banner / Zone 4 truth table ---------- */
let bn = "bn0";
function banner(t, id) {
  tl.to("#" + bn, { opacity: 0, y: -10, duration: 0.18, ease: "power2.in" }, t);
  tl.fromTo(
    "#" + id,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", immediateRender: false },
    t + 0.08,
  );
  bn = id;
}
function rowOn(id, t, s, c, outDelay = 0) {
  tl.to(`#${id} .bg`, { opacity: 1, duration: 0.12, ease: "power2.out" }, t);
  tl.to(`#${id} .ci`, { color: WHITE, duration: 0.12 }, t);
  tl.to(`#${id} .os`, { color: s ? BLUE : WHITE, duration: 0.15 }, t + outDelay);
  tl.to(`#${id} .oc`, { color: c ? RED : WHITE, duration: 0.15 }, t + outDelay);
}
function rowOff(id, t) {
  tl.to(`#${id} .bg`, { opacity: 0, duration: 0.15 }, t);
  tl.to(`#${id} .c`, { color: DIM, duration: 0.15 }, t);
}

/* =====================================================================================
         ACT I (0 – 10.5)  LIVE HOOK → MEASURED REBUILD → 4-STATE HALF-ADDER TEST
         ===================================================================================== */
tl.fromTo(
  "#ledC .ring",
  { scale: 1, opacity: 0.9 },
  { scale: 2.2, opacity: 0, duration: 0.55, ease: "power2.out", immediateRender: false },
  0.02,
);
sfx("gAnd", 0.05);
hop(1.2, 110, 440, 0.55);
down(1.75, false); // 2.2 box-select + delete
tl.fromTo(
  "#mq0",
  { scaleX: 0, scaleY: 0, opacity: 1 },
  { scaleX: 1, scaleY: 1, duration: 0.4, ease: "power1.inOut", immediateRender: false },
  1.8,
);
tl.fromTo(
  "#cursor",
  { x: 110, y: 440 },
  { x: 900, y: 880, duration: 0.4, ease: "power1.inOut", immediateRender: false },
  1.8,
);
cx = 900;
cy = 880;
up(2.2);
ring(2.2);
tl.to("#circ", { opacity: 0, duration: 0.28, ease: "power2.in" }, 2.22);
tl.to("#mq0", { opacity: 0, duration: 0.22 }, 2.22);
banner(2.2, "bn1");
tl.set("#bn0", { display: "none" }, 2.5); // hook banner can NEVER reappear
const g1 = (sel, p) => tl.set(sel, p, 2.55);
g1.live = false;
liveState(g1);
tl.set("#circ", { opacity: 1 }, 2.55);
rowOff("haR3", 2.55);

hop(2.25, TILE.xor[0], TILE.xor[1], 0.45);
down(2.72, false);
tilePick("xor", 2.72, 3.2);
dragItem("gXor", 2.75, 3.2, TILE.xor, [540, 560], [540, 560], 1, 0.55);
up(3.2);
pop("gXor", 3.2, 1.08);
sfx("gXor", 3.2); // 3.2 snap
hop(3.25, TILE.and[0], TILE.and[1], 0.25);
down(3.55, false);
tilePick("and", 3.55, 4.2);
dragItem("gAnd", 3.6, 4.2, TILE.and, [540, 760], [540, 760], 1, 0.55);
up(4.2);
pop("gAnd", 4.2, 1.08);
sfx("gAnd", 4.2); // 4.2 snap
hop(4.25, 280, 520, 0.6);
tilePick("tog", 4.7, 5.2);
tilePick("led", 4.8, 5.2);
fly("tgA", 4.7, 5.2, TILE.tog, [220, 520], 1); // 5.2 inputs + probes land
fly("tgB", 4.75, 5.2, TILE.tog, [220, 800], 1);
fly("ledS", 4.8, 5.2, TILE.led, [840, 560], 1);
fly("ledC", 4.85, 5.2, TILE.led, [840, 760], 1);
click(5.2);
// snap-to-grid wires route one net after another
hop(5.28, 460, 660, 0.3);
autoWire(5.3, 5.45, "A1");
autoWire(5.42, 5.55, "A2");
autoWire(5.42, 5.55, "A3");
tl.fromTo(
  "#j_A",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.15, ease: "back.out(3)", immediateRender: false },
  5.42,
);
autoWire(5.5, 5.62, "B1");
autoWire(5.6, 5.72, "B2");
autoWire(5.6, 5.74, "B3");
tl.fromTo(
  "#j_B",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.15, ease: "back.out(3)", immediateRender: false },
  5.58,
);
autoWire(5.68, 5.82, "S0");
autoWire(5.78, 5.92, "C0");
hop(5.6, 700, 660, 0.3);
settleWires(5.95, ["A1", "A2", "A3", "B1", "B2", "B3", "S0", "C0"]);
click(6.0); // 6.0 all nets routed
[
  ["A1", 6.05, 0.12],
  ["B1", 6.05, 0.12],
  ["A2", 6.17, 0.06],
  ["A3", 6.17, 0.14],
  ["B2", 6.17, 0.08],
  ["B3", 6.17, 0.16],
  ["S0", 6.3, 0.12],
  ["C0", 6.3, 0.12],
].forEach(([id, t, d]) => pulse(id, t, d));
rowOn("haR0", 6.5, 0, 0); // (0,0)
hop(6.3, 220, 800, 0.6);
// 7.0 (0,1)
click(7.0);
flip("tgB", 7.0, 1);
rowOff("haR0", 7.0);
rowOn("haR1", 7.02, 1, 0, 0.3);
lit("B1", 7.02, 0.1);
lit("B2", 7.12, 0.12);
lit("B3", 7.12, 0.24);
partOn("gXor", 7.36);
lit("S0", 7.38, 0.22);
ledOn("ledS", 7.62);
// B back to 0, then 8.2 (1,0)
down(7.9, false);
flip("tgB", 7.9, 0);
up(7.97);
partOff("gXor", 7.9);
unlit("B1", 7.9, 0.15);
unlit("B2", 7.9, 0.15);
unlit("B3", 7.9, 0.15);
unlit("S0", 7.9, 0.15);
ledOff("ledS", 8.0);
rowOff("haR1", 7.9);
rowOn("haR0", 7.92, 0, 0);
hop(7.98, 220, 520, 0.2);
click(8.2);
flip("tgA", 8.2, 1);
rowOff("haR0", 8.2);
rowOn("haR2", 8.2, 1, 0, 0.3);
lit("A1", 8.22, 0.12);
lit("A2", 8.34, 0.06);
lit("A3", 8.34, 0.16);
partOn("gXor", 8.4);
lit("S0", 8.42, 0.2);
ledOn("ledS", 8.64);
// 9.5 (1,1): the relay switches the carry at 9.7
hop(8.3, 220, 800, 1.0);
click(9.5);
flip("tgB", 9.5, 1);
rowOff("haR2", 9.5);
rowOn("haR3", 9.5, 0, 1, 0.4);
lit("B1", 9.52, 0.06);
lit("B2", 9.58, 0.12);
lit("B3", 9.58, 0.22);
partOn("gAnd", 9.7);
lit("C0", 9.72, 0.23);
ledOn("ledC", 9.97);
partOff("gXor", 9.8);
unlit("S0", 9.8, 0.15);
ledOff("ledS", 9.97);
banner(10.0, "bn2");

/* =====================================================================================
         ACT II (10.5 – 19.5)  CARRY-IN CHALLENGE → PACKAGE → FULL-ADDER HIERARCHY
         ===================================================================================== */
banner(10.5, "bn3");
hop(9.7, 320, 470, 0.8);
down(10.55, false);
tl.fromTo(
  "#mq",
  { scaleX: 0, scaleY: 0, opacity: 1 },
  { scaleX: 1, scaleY: 1, duration: 0.4, ease: "power1.inOut", immediateRender: false },
  10.6,
);
tl.fromTo(
  "#cursor",
  { x: 320, y: 470 },
  { x: 670, y: 850, duration: 0.4, ease: "power1.inOut", immediateRender: false },
  10.6,
);
cx = 670;
cy = 850;
up(11.0);
ring(11.0); // 11.0 select
tl.set("#mq2", { opacity: 1 }, 11.0);
tl.set("#mq", { opacity: 0 }, 11.0);
tl.to("#mq2", { scaleX: 0.514, scaleY: 0.526, duration: 0.6, ease: "power3.inOut" }, 11.0);
tl.to("#mq2", { opacity: 0, duration: 0.2, ease: "power1.in" }, 11.65);
tl.to("#world", { scale: Z, duration: 0.8, ease: "power2.inOut" }, 11.2); // smooth zoom-out to 0.82
tl.to("#z100", { opacity: 0, duration: 0.15 }, 11.6);
tl.to("#z75", { opacity: 1, duration: 0.15 }, 11.65);
tl.fromTo(
  "#half",
  { scale: 1, opacity: 1 },
  { scale: 0.3, opacity: 0, duration: 0.5, ease: "power3.in", immediateRender: false },
  11.5,
);
tl.fromTo(
  "#ha1",
  { scale: 0.5, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.8)", immediateRender: false },
  12.0,
);
sfx("ha1", 12.0); // 12.0 collapse into [HALF ADDER 1]
flip("tgA", 12.05, 0);
flip("tgB", 12.05, 0);
ledOff("ledC", 12.05);
tl.to("#ha1", { x: -150, y: -140, duration: 0.6, ease: "power2.inOut" }, 12.0);
tl.to("#tgA", { x: -120, y: -50, duration: 0.6, ease: "power2.inOut" }, 12.0);
tl.to("#tgB", { x: -120, y: -230, duration: 0.6, ease: "power2.inOut" }, 12.0);
tl.to("#ledS", { x: 180, y: -90, duration: 0.6, ease: "power2.inOut" }, 12.0);
tl.to("#ledC", { x: 180, y: 80, duration: 0.6, ease: "power2.inOut" }, 12.0);
tl.to("#ledC .lblI", { opacity: 0, duration: 0.15 }, 12.2);
tl.to("#ledC .lblIII", { opacity: 1, duration: 0.2 }, 12.25);
// truth-table card morphs: 4-row half-adder table → full 8-row table (adds the C_in column)
rowOff("haR3", 12.05);
tl.to("#ttHA", { opacity: 0, scale: 0.96, duration: 0.5, ease: "power2.in" }, 12.15);
tl.fromTo(
  "#ttFA",
  { opacity: 0, scale: 1.03 },
  { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", immediateRender: false },
  12.4,
);
rowOn("faR0", 13.0, 0, 0);
const HA1P = w2p(340, 520),
  HA2P = w2p(640, 520),
  ORP = w2p(880, 840);
hop(11.1, HA1P[0], HA1P[1], 1.7);
down(13.0, false);
partOn("ha1", 12.95, 0.55);
tl.set("#ha2", { x: -300, y: 0 }, 12.9);
tl.fromTo("#ha2", { opacity: 0 }, { opacity: 0.7, duration: 0.15, immediateRender: false }, 13.0);
dragItem("ha2", 13.05, 13.5, HA1P, HA2P, [640, 520], Z, 1, false); // 13.5 HA 2 drops
up(13.5);
ring(13.5);
fade("#ha2", 13.5, 1, 0.1);
pop("ha2", 13.5, 1.07);
sfx("ha2", 13.5);
partOff("ha1", 13.55);
hop(13.55, TILE.or[0], TILE.or[1], 0.35);
down(13.92, false);
tilePick("or", 13.92, 14.5);
dragItem("gOr", 13.95, 14.5, TILE.or, ORP, [880, 840], Z, 0.5); // 14.5 OR drops
up(14.5);
pop("gOr", 14.5, 1.08);
sfx("gOr", 14.5);
const PCin = w2p(100, 960);
hop(14.55, PCin[0], PCin[1], 0.85);
tilePick("tog", 15.55, 16.0);
fly("tgC", 15.55, 16.0, TILE.tog, [100, 960], Z); // 16.0 C_in placed
click(16.0);
banner(16.0, "bn4");
const PA = w2p(160, 470),
  PS1 = w2p(550, 470),
  POR2 = w2p(780, 860),
  PLS = w2p(1010, 470);
hop(16.1, PA[0], PA[1], 0.3);
autoWire(16.4, 16.7, "FA");
autoWire(16.4, 16.7, "FB");
hop(16.7, PS1[0], PS1[1], 0.25);
autoWire(16.9, 17.2, "FS1");
autoWire(17.0, 17.45, "FCIN");
tl.to("#bdS1", { opacity: 1, duration: 0.15 }, 17.2);
click(17.5);
settleWires(17.5, ["FA", "FB", "FS1", "FCIN"]); // 17.5 S1 → HA2, C_in → HA2
hop(17.6, POR2[0], POR2[1], 0.4);
autoWire(17.9, 18.4, "FC1");
autoWire(18.1, 18.5, "FC2");
tl.to("#bdC1, #bdC2", { opacity: 1, duration: 0.15 }, 18.4);
banner(18.3, "bn6"); // OR ≡ ADD logic bridge
hop(18.5, PLS[0], PLS[1], 0.35);
autoWire(18.45, 18.8, "FS2");
autoWire(18.65, 19.0, "FOR");
up(19.0);
ring(19.0);
settleWires(19.0, ["FC1", "FC2", "FS2", "FOR"]); // 19.0 outputs lock
sfx("gOr", 19.0);
sfx("ha2", 19.0);

/* =====================================================================================
         ACT III (19.5 – 24.5)  1 + 1 + 1 = 3
         ===================================================================================== */
[
  ["FA", 19.1, 0.1],
  ["FB", 19.1, 0.1],
  ["FCIN", 19.1, 0.35],
  ["FS1", 19.2, 0.12],
  ["FC1", 19.2, 0.4],
  ["FC2", 19.3, 0.2],
  ["FS2", 19.3, 0.2],
  ["FOR", 19.45, 0.05],
].forEach(([id, t, d]) => pulse(id, t, d));
const PAt = w2p(100, 470),
  PBt = w2p(100, 570),
  PCt = w2p(100, 960);
hop(19.3, PAt[0], PAt[1], 0.6);
click(20.0);
flip("tgA", 20.0, 1); // 20.0 A = 1
rowOff("faR0", 20.0);
rowOn("faR4", 20.02, 1, 0, 0.1);
lit("FA", 20.02, 0.12);
hop(20.1, PBt[0], PBt[1], 0.55);
click(20.8);
flip("tgB", 20.8, 1); // 20.8 B = 1
rowOff("faR4", 20.8);
rowOn("faR6", 20.82, 0, 1, 0.1);
lit("FB", 20.82, 0.12);
hop(20.9, PCt[0], PCt[1], 0.55);
click(21.6);
flip("tgC", 21.6, 1); // 21.6 C_in = 1
rowOff("faR6", 21.6);
rowOn("faR7", 21.62, 1, 1, 1.2);
lit("FCIN", 21.62, 0.48);
// 22.0–23.1 pulses ripple through both stages
partOn("ha1", 22.0, 0.8);
lit("FC1", 22.05, 0.5); // HA1: S1 = 0, C1 = 1
partOn("gOr", 22.6);
lit("FOR", 22.6, 0.08);
ledOn("ledC", 22.7);
sfx("gOr", 22.6); // 22.6 relay thump: C_out = 1 (red)
partOn("ha2", 22.8, 0.8);
lit("FS2", 22.8, 0.3);
ledOn("ledS", 23.12);
sfx("ha2", 22.8); // 22.8 chime: S = 1 (blue)
banner(23.0, "bn5");
const PLEDS = w2p(1020, 470);
hop(21.8, PLEDS[0], PLEDS[1], 1.2);
// 24.5 active row [1 1 1 | 1 1] pulses
tl.to(
  "#faR7 .bg",
  { borderColor: "#0088FF", boxShadow: "0 0 18px rgba(0,136,255,0.85)", duration: 0.2 },
  24.5,
);
tl.fromTo(
  "#faR7",
  { scaleY: 1 },
  {
    scaleY: 1.1,
    duration: 0.12,
    yoyo: true,
    repeat: 1,
    ease: "power2.out",
    immediateRender: false,
  },
  24.5,
);
tl.fromTo(
  "#faR7 .ck",
  { opacity: 0, scale: 0.3 },
  { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: false },
  24.52,
);

/* =====================================================================================
         ACT IV (24.5 – 27.0)  CTA — strictly inside y 1580–1630; final hold
         ===================================================================================== */
tl.fromTo(
  "#cta",
  { opacity: 0, y: 14 },
  { opacity: 1, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false },
  24.8,
);
hop(25.0, 820, 1605, 0.6);
down(25.8);
tl.to("#cta", { scale: 0.975, duration: 0.06, ease: "power2.out" }, 25.8);
tl.to("#cta", { scale: 1, duration: 0.2, ease: "back.out(3)" }, 25.86);
up(25.9);
tl.to(
  "#cta",
  {
    boxShadow: "0 0 30px 3px rgba(0,136,255,0.7)",
    borderColor: "rgba(0,136,255,1)",
    duration: 0.3,
    ease: "sine.inOut",
  },
  25.8,
);
tl.to(
  "#cta",
  {
    boxShadow: "0 0 8px 0px rgba(0,136,255,0.1)",
    borderColor: "rgba(0,136,255,0.5)",
    duration: 0.3,
    ease: "sine.inOut",
  },
  26.1,
);
tl.to(
  "#cta",
  {
    boxShadow: "0 0 30px 3px rgba(0,136,255,0.7)",
    borderColor: "rgba(0,136,255,1)",
    duration: 0.3,
    ease: "sine.inOut",
  },
  26.4,
);
tl.to(
  "#cta",
  {
    boxShadow: "0 0 8px 0px rgba(0,136,255,0.1)",
    borderColor: "rgba(0,136,255,0.5)",
    duration: 0.25,
    ease: "sine.inOut",
  },
  26.7,
);

// single source of truth for sound: CUES drive the live preview voices (the baked WAV uses the same list)
CUES.forEach(([t, k]) =>
  tl.call(
    () => {
      if (SFX.live) SFX.play(k);
    },
    null,
    t,
  ),
);

tl.to({}, { duration: 0.01 }, 26.99); // anchor the end of the 27.0 s timeline
window.__timelines["main"] = tl;
window.__timeline = tl;
tl.seek(0);
