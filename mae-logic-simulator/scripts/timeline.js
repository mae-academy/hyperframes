/* =====================================================================================
         MAE Academy — Digital Full Adder Simulator · master timeline (25.0 s, 1080×1920)
         Every visible value is a pure function of timeline time: no Date, no Math.random, no network.
         Geometry:  WORLD coords (SVG #world).  zoom 1 → page == world.  Zoom .82 about (560,760):
                    page = (560 + .82 (x-560), 760 + .82 (y-760)).
         Frame 0 is a LIVE half adder (A=B=1, C lit). The hook banner is removed (display:none) after
         it clears and never returns; the end state holds the verified full adder + challenge card.
         ===================================================================================== */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"],
  [0.05, "snap"],
  [1.8, "click"],
  [2.8, "snap"],
  [3.6, "snap"],
  [4.5, "click"],
  [5.2, "click"],
  [6.2, "click"],
  [7.2, "snap"],
  [8.5, "thump"], // Modular packaging
  [10.0, "click"],
  [11.2, "snap"],
  [12.8, "click"],
  [14.0, "click"],
  [15.5, "snap"],
  [17.0, "click"], // Toggle A=1
  [17.6, "click"], // Toggle B=1
  [18.2, "click"], // Toggle Cin=1
  [19.2, "relay_thump"], // Climax LED explosion
  [19.4, "chime"],
  [21.5, "click"], // Challenge card reveals
  [23.2, "snap"], // Cursor clicks CTA button
  [24.5, "click"], // Loop anchor
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
      sub(c, out, t, 80, 0.55, 0.45);
      sub(c, out, t, 160, 0.2, 0.2);
      tone(c, out, t, 1400, 0.4, 0.014);
      tone(c, out, t + 0.03, 1400, 0.2, 0.01);
      sub(c, out, t + 0.09, 80, 0.4, 0.35);
      tone(c, out, t + 0.09, 1400, 0.28, 0.012);
    },
    chime(c, out, t) {
      [
        [1200, 0.16, 0.9],
        [1800, 0.1, 0.7],
        [2400, 0.07, 0.6],
        [3600, 0.04, 0.5],
      ].forEach(([f, p, d]) => tone(c, out, t, f, p, d, 0.003));
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
gsap.set("#ctaBtn", { transformOrigin: "50% 50%" });

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
  set("#haR3", { opacity: live ? 1 : 0.25 });
  set("#haR3 .bg, #haR3 .ck", { opacity: live ? 1 : 0 });
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

/* ---------- LIVING WIRES ----------
         • a luminous packet (white core + blue glow, stroke-dasharray "24 gap") races source → sink
         • every energised wire keeps a marching spark layer (.f) running for as long as it is HIGH
         • a gate that fires emits its own packet out of its output pin (the next lit() call) + a burst ring */
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
const FLOW = {}; // id -> time the wire became HIGH (flow layer start)
function flow(id, t0, t1) {
  if (t1 - t0 < 0.05) return;
  tl.fromTo(
    `#w_${id} .f`,
    { strokeDashoffset: 0, opacity: 0.6 },
    { strokeDashoffset: -(t1 - t0) * 150, duration: t1 - t0, ease: "none", immediateRender: false },
    t0,
  );
  tl.set(`#w_${id} .f`, { opacity: 0 }, t1);
}
function pulse(id, t, d) {
  tl.fromTo(
    `#w_${id} .p, #w_${id} .pg`,
    { strokeDashoffset: 24, opacity: 1 },
    { strokeDashoffset: -WL[id], duration: d, ease: "none", immediateRender: false },
    t,
  );
  tl.set(`#w_${id} .p, #w_${id} .pg`, { opacity: 0 }, t + d);
}
function lit(id, t, d) {
  tl.fromTo(
    `#w_${id} .l path`,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: d, ease: "none", immediateRender: false },
    t,
  );
  pulse(id, t, d);
  FLOW[id] = t + d;
}
function unlit(id, t, d) {
  tl.fromTo(
    `#w_${id} .l path`,
    { strokeDashoffset: 0 },
    { strokeDashoffset: -1, duration: d, ease: "none", immediateRender: false },
    t,
  );
  if (FLOW[id] != null) {
    flow(id, FLOW[id], t);
    FLOW[id] = null;
  }
}

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
const fire = (id, t, a = 1) => {
  partOn(id, t, a);
  sfx(id, t);
}; // gate fires: glow + burst ring
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
function explode(id, t) {
  // LED EXPLOSION: elastic 1 → 1.4 → 1 + radial bloom
  tl.to(`#${id} .on`, { opacity: 1, duration: 0.06 }, t);
  tl.fromTo(
    `#${id} .on`,
    { scale: 1 },
    { scale: 1.4, duration: 0.14, ease: "power3.out", immediateRender: false },
    t,
  );
  tl.to(`#${id} .on`, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.35)" }, t + 0.14);
  tl.fromTo(
    `#${id} .bloom`,
    { scale: 1, opacity: 0.6 },
    { scale: 5.5, opacity: 0, duration: 0.8, ease: "power2.out", immediateRender: false },
    t,
  );
  tl.fromTo(
    `#${id} .ring`,
    { scale: 1, opacity: 1 },
    { scale: 3.4, opacity: 0, duration: 0.7, ease: "power2.out", immediateRender: false },
    t + 0.05,
  );
}

/* ---------- Zone 3 banner / Zone 4 reactive truth table ---------- */
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
  // rows rest at .25; the live row snaps to 1 with a blue glow border + ✓
  tl.to(`#${id}`, { opacity: 1, duration: 0.1 }, t);
  tl.fromTo(
    `#${id}`,
    { scaleX: 1.05 },
    { scaleX: 1, duration: 0.25, ease: "back.out(3)", immediateRender: false },
    t,
  );
  tl.to(
    `#${id} .bg`,
    { opacity: 1, boxShadow: "0 0 14px rgba(0,136,255,0.8)", duration: 0.12, ease: "power2.out" },
    t,
  );
  tl.to(`#${id} .ck`, { opacity: 1, duration: 0.12 }, t);
  tl.to(`#${id} .ci`, { color: WHITE, duration: 0.1 }, t);
  tl.to(`#${id} .os`, { color: s ? BLUE : WHITE, duration: 0.15 }, t + outDelay);
  tl.to(`#${id} .oc`, { color: c ? RED : WHITE, duration: 0.15 }, t + outDelay);
}
function rowOff(id, t) {
  tl.to(`#${id}`, { opacity: 0.25, duration: 0.15 }, t);
  tl.to(`#${id} .bg`, { opacity: 0, boxShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.15 }, t);
  tl.to(`#${id} .ck`, { opacity: 0, duration: 0.1 }, t);
  tl.to(`#${id} .c`, { color: DIM, duration: 0.15 }, t);
}

/* =====================================================================================
         ACT I (0 – 8.5)  LIVE HOOK → BUILD → 4-STATE HALF-ADDER TEST
         ===================================================================================== */
["A1", "A2", "A3", "B1", "B2", "B3", "C0"].forEach((id) => flow(id, 0, 1.85)); // frame 0 is already alive
tl.fromTo(
  "#ledC .ring",
  { scale: 1, opacity: 0.9 },
  { scale: 2.2, opacity: 0, duration: 0.55, ease: "power2.out", immediateRender: false },
  0.02,
);
sfx("gAnd", 0.05);
hop(0.9, 110, 440, 0.45);
down(1.35, false); // 1.8 box-select + delete
tl.fromTo(
  "#mq0",
  { scaleX: 0, scaleY: 0, opacity: 1 },
  { scaleX: 1, scaleY: 1, duration: 0.4, ease: "power1.inOut", immediateRender: false },
  1.4,
);
tl.fromTo(
  "#cursor",
  { x: 110, y: 440 },
  { x: 900, y: 880, duration: 0.4, ease: "power1.inOut", immediateRender: false },
  1.4,
);
cx = 900;
cy = 880;
up(1.8);
ring(1.8);
tl.to("#circ", { opacity: 0, duration: 0.28, ease: "power2.in" }, 1.82);
tl.to("#mq0", { opacity: 0, duration: 0.22 }, 1.82);
banner(1.8, "bn1");
tl.set("#bn0", { display: "none" }, 2.1); // hook banner can NEVER reappear
const g1 = (sel, p) => tl.set(sel, p, 2.15);
g1.live = false;
liveState(g1);
tl.set("#circ", { opacity: 1 }, 2.15);

hop(1.85, TILE.xor[0], TILE.xor[1], 0.45);
down(2.32, false);
tilePick("xor", 2.32, 2.8);
dragItem("gXor", 2.35, 2.8, TILE.xor, [540, 560], [540, 560], 1, 0.55);
up(2.8);
pop("gXor", 2.8, 1.08);
sfx("gXor", 2.8); // 2.8 snap
hop(2.85, TILE.and[0], TILE.and[1], 0.15);
down(3.02, false);
tilePick("and", 3.02, 3.6);
dragItem("gAnd", 3.05, 3.6, TILE.and, [540, 760], [540, 760], 1, 0.55);
up(3.6);
pop("gAnd", 3.6, 1.08);
sfx("gAnd", 3.6); // 3.6 snap
hop(3.65, 280, 520, 0.7);
tilePick("tog", 4.05, 4.5);
tilePick("led", 4.15, 4.5);
fly("tgA", 4.05, 4.5, TILE.tog, [220, 520], 1); // 4.5 inputs + probes land
fly("tgB", 4.1, 4.5, TILE.tog, [220, 800], 1);
fly("ledS", 4.15, 4.5, TILE.led, [840, 560], 1);
fly("ledC", 4.2, 4.5, TILE.led, [840, 760], 1);
click(4.5);
// snap-to-grid wire routing
hop(4.55, 460, 640, 0.3);
autoWire(4.7, 4.95, "A1");
autoWire(4.9, 5.15, "A2");
autoWire(4.9, 5.15, "A3");
tl.fromTo(
  "#j_A",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.15, ease: "back.out(3)", immediateRender: false },
  4.92,
);
click(5.2); // 5.2 net A routed
hop(5.25, 460, 780, 0.2);
autoWire(5.3, 5.55, "B1");
autoWire(5.5, 5.75, "B2");
autoWire(5.5, 5.8, "B3");
tl.fromTo(
  "#j_B",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.15, ease: "back.out(3)", immediateRender: false },
  5.52,
);
autoWire(5.7, 5.95, "S0");
autoWire(5.85, 6.1, "C0");
hop(5.6, 700, 660, 0.4);
settleWires(6.12, ["A1", "A2", "A3", "B1", "B2", "B3", "S0", "C0"]);
click(6.2); // 6.2 all nets routed
[
  ["A1", 6.25, 0.2],
  ["B1", 6.25, 0.2],
  ["A2", 6.4, 0.1],
  ["A3", 6.4, 0.2],
  ["B2", 6.4, 0.12],
  ["B3", 6.4, 0.25],
  ["S0", 6.5, 0.2],
  ["C0", 6.5, 0.2],
].forEach(([id, t, d]) => pulse(id, t, d));
rowOn("haR0", 6.4, 0, 0); // (0,0)
hop(6.3, 220, 800, 0.35);
// (0,1)
click(6.7);
flip("tgB", 6.7, 1);
rowOff("haR0", 6.7);
rowOn("haR1", 6.72, 1, 0, 0.3);
lit("B1", 6.72, 0.06);
lit("B2", 6.78, 0.06);
lit("B3", 6.78, 0.14);
fire("gXor", 6.92);
lit("S0", 6.94, 0.1);
ledOn("ledS", 7.06);
// B off, then (1,0)
down(7.0, false);
flip("tgB", 7.0, 0);
up(7.07);
partOff("gXor", 7.0);
unlit("B1", 7.0, 0.15);
unlit("B2", 7.0, 0.15);
unlit("B3", 7.0, 0.15);
unlit("S0", 7.0, 0.15);
ledOff("ledS", 7.1);
rowOff("haR1", 7.0);
hop(7.08, 220, 520, 0.1);
click(7.2);
flip("tgA", 7.2, 1); // 7.2 snap
rowOn("haR2", 7.2, 1, 0, 0.3);
lit("A1", 7.22, 0.08);
lit("A2", 7.3, 0.04);
lit("A3", 7.3, 0.14);
fire("gXor", 7.34);
lit("S0", 7.36, 0.1);
ledOn("ledS", 7.48);
// (1,1): the relay switches the carry
hop(7.3, 220, 800, 0.35);
click(7.7);
flip("tgB", 7.7, 1);
rowOff("haR2", 7.7);
rowOn("haR3", 7.72, 0, 1, 0.4);
lit("B1", 7.72, 0.06);
lit("B2", 7.78, 0.12);
lit("B3", 7.78, 0.14);
fire("gAnd", 7.9);
lit("C0", 7.92, 0.18);
ledOn("ledC", 8.1);
partOff("gXor", 7.92);
unlit("S0", 7.92, 0.1);
ledOff("ledS", 8.02);
banner(8.0, "bn2");

/* =====================================================================================
         ACT II (8.5 – 17.0)  PACKAGE → CARRY-IN → FULL-ADDER HIERARCHY
         ===================================================================================== */
banner(8.4, "bn3");
hop(7.85, 320, 470, 0.3);
down(8.1, false);
tl.fromTo(
  "#mq",
  { scaleX: 0, scaleY: 0, opacity: 1 },
  { scaleX: 1, scaleY: 1, duration: 0.3, ease: "power1.inOut", immediateRender: false },
  8.15,
);
tl.fromTo(
  "#cursor",
  { x: 320, y: 470 },
  { x: 670, y: 850, duration: 0.3, ease: "power1.inOut", immediateRender: false },
  8.15,
);
cx = 670;
cy = 850;
up(8.45);
ring(8.45);
tl.set("#mq2", { opacity: 1 }, 8.45);
tl.set("#mq", { opacity: 0 }, 8.45);
tl.to("#mq2", { scaleX: 0.514, scaleY: 0.526, duration: 0.5, ease: "power3.inOut" }, 8.45);
tl.to("#mq2", { opacity: 0, duration: 0.2, ease: "power1.in" }, 8.8);
tl.fromTo(
  "#half",
  { scale: 1, opacity: 1 },
  { scale: 0.3, opacity: 0, duration: 0.35, ease: "power3.in", immediateRender: false },
  8.2,
);
tl.to("#world", { scale: Z, duration: 0.8, ease: "power2.inOut" }, 8.5); // smooth zoom-out to 0.82
tl.to("#z100", { opacity: 0, duration: 0.15 }, 8.9);
tl.to("#z75", { opacity: 1, duration: 0.15 }, 8.95);
tl.fromTo(
  "#ha1",
  { scale: 0.5, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.8)", immediateRender: false },
  8.5,
);
sfx("ha1", 8.5); // 8.5 thump: modular packaging
flip("tgA", 8.55, 0);
flip("tgB", 8.55, 0);
ledOff("ledC", 8.55);
tl.to("#ha1", { x: -150, y: -140, duration: 0.6, ease: "power2.inOut" }, 8.5);
tl.to("#tgA", { x: -120, y: -50, duration: 0.6, ease: "power2.inOut" }, 8.5);
tl.to("#tgB", { x: -120, y: -230, duration: 0.6, ease: "power2.inOut" }, 8.5);
tl.to("#ledS", { x: 180, y: -90, duration: 0.6, ease: "power2.inOut" }, 8.5);
tl.to("#ledC", { x: 180, y: 80, duration: 0.6, ease: "power2.inOut" }, 8.5);
tl.to("#ledC .lblI", { opacity: 0, duration: 0.15 }, 8.7);
tl.to("#ledC .lblIII", { opacity: 1, duration: 0.2 }, 8.75);
// truth-table card morphs: 4-row half-adder table → full 8-row table (adds the C_in column)
rowOff("haR3", 8.6);
tl.to("#ttHA", { opacity: 0, scale: 0.96, duration: 0.5, ease: "power2.in" }, 9.0);
tl.fromTo(
  "#ttFA",
  { opacity: 0, scale: 1.03 },
  { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out", immediateRender: false },
  9.3,
);
rowOn("faR0", 9.9, 0, 0);
const HA1P = w2p(340, 520),
  HA2P = w2p(640, 520),
  ORP = w2p(880, 840);
hop(8.6, HA1P[0], HA1P[1], 0.8);
down(9.5, false);
partOn("ha1", 9.45, 0.55);
tl.set("#ha2", { x: -300, y: 0 }, 9.4);
tl.fromTo("#ha2", { opacity: 0 }, { opacity: 0.7, duration: 0.15, immediateRender: false }, 9.5);
dragItem("ha2", 9.55, 10.0, HA1P, HA2P, [640, 520], Z, 1, false); // 10.0 HA 2 drops
up(10.0);
ring(10.0);
fade("#ha2", 10.0, 1, 0.1);
pop("ha2", 10.0, 1.07);
sfx("ha2", 10.0);
partOff("ha1", 10.05);
hop(10.05, TILE.or[0], TILE.or[1], 0.5);
down(10.6, false);
tilePick("or", 10.6, 11.2);
dragItem("gOr", 10.65, 11.2, TILE.or, ORP, [880, 840], Z, 0.5); // 11.2 OR drops
up(11.2);
pop("gOr", 11.2, 1.08);
sfx("gOr", 11.2);
const PCin = w2p(100, 960);
hop(11.25, PCin[0], PCin[1], 1.1);
tilePick("tog", 12.3, 12.8);
fly("tgC", 12.3, 12.8, TILE.tog, [100, 960], Z); // 12.8 C_in placed
click(12.8);
banner(12.8, "bn4");
const PA = w2p(160, 470),
  PS1 = w2p(550, 470),
  POR2 = w2p(780, 860),
  PLS = w2p(1010, 470);
hop(12.9, PA[0], PA[1], 0.3);
autoWire(13.0, 13.3, "FA");
autoWire(13.0, 13.3, "FB");
hop(13.3, PS1[0], PS1[1], 0.3);
autoWire(13.4, 13.7, "FS1");
autoWire(13.5, 14.0, "FCIN");
tl.to("#bdS1", { opacity: 1, duration: 0.15 }, 13.7);
click(14.0);
settleWires(14.0, ["FA", "FB", "FS1", "FCIN"]); // 14.0 S1 → HA2, C_in → HA2
hop(14.1, POR2[0], POR2[1], 0.4);
autoWire(14.3, 14.85, "FC1");
autoWire(14.5, 14.95, "FC2");
tl.to("#bdC1, #bdC2", { opacity: 1, duration: 0.15 }, 14.85);
banner(14.7, "bn6"); // OR ≡ ADD logic bridge
hop(14.9, PLS[0], PLS[1], 0.4);
autoWire(15.0, 15.35, "FS2");
autoWire(15.1, 15.5, "FOR");
up(15.5);
ring(15.5);
settleWires(15.5, ["FC1", "FC2", "FS2", "FOR"]); // 15.5 outputs lock
sfx("gOr", 15.5);
sfx("ha2", 15.5);

/* =====================================================================================
         ACT III (17 – 21.5)  1 + 1 + 1 = 3 — THE EUREKA CLIMAX
         ===================================================================================== */
[
  ["FA", 15.7, 0.2],
  ["FB", 15.7, 0.2],
  ["FCIN", 15.7, 0.45],
  ["FS1", 15.85, 0.2],
  ["FC1", 15.85, 0.5],
  ["FC2", 16.0, 0.3],
  ["FS2", 16.0, 0.3],
  ["FOR", 16.3, 0.1],
].forEach(([id, t, d]) => pulse(id, t, d));
const PAt = w2p(100, 470),
  PBt = w2p(100, 570),
  PCt = w2p(100, 960);
hop(16.2, PAt[0], PAt[1], 0.7);
click(17.0);
flip("tgA", 17.0, 1); // 17.0 A = 1
rowOff("faR0", 17.0);
rowOn("faR4", 17.02, 1, 0, 0.1);
lit("FA", 17.02, 0.3);
hop(17.1, PBt[0], PBt[1], 0.45);
click(17.6);
flip("tgB", 17.6, 1); // 17.6 B = 1
rowOff("faR4", 17.6);
rowOn("faR6", 17.62, 0, 1, 0.1);
lit("FB", 17.62, 0.3);
hop(17.7, PCt[0], PCt[1], 0.45);
click(18.2);
flip("tgC", 18.2, 1); // 18.2 C_in = 1
rowOff("faR6", 18.2);
rowOn("faR7", 18.22, 1, 1, 1.1);
lit("FCIN", 18.22, 0.48);
// converge: all three packets have arrived → HA1 fires, its carry packet streams toward the OR gate
fire("ha1", 18.7, 0.8);
lit("FC1", 18.72, 0.48); // HA1: S1 = 0, C1 = 1
fire("gOr", 19.2);
lit("FOR", 19.2, 0.1); // 19.2 relay thump: OR → C_out = 1
explode("ledC", 19.3);
fire("ha2", 19.4, 0.8);
lit("FS2", 19.4, 0.25); // 19.4 chime: HA2 → S = 1
explode("ledS", 19.65);
tl.fromTo(
  "#plate",
  { boxShadow: "inset 0 0 0px rgba(0,136,255,0)" },
  {
    boxShadow: "inset 0 0 90px rgba(0,136,255,0.4)",
    duration: 0.15,
    yoyo: true,
    repeat: 1,
    ease: "power2.out",
    immediateRender: false,
  },
  19.2,
);
tl.to(
  "#faR7 .bg",
  { borderColor: "#0088FF", boxShadow: "0 0 22px rgba(0,136,255,1)", duration: 0.2 },
  19.4,
);
tl.fromTo(
  "#faR7",
  { scaleY: 1 },
  {
    scaleY: 1.12,
    duration: 0.12,
    yoyo: true,
    repeat: 1,
    ease: "power2.out",
    immediateRender: false,
  },
  19.4,
);
banner(19.7, "bn5");
hop(18.8, w2p(1020, 470)[0] - 60, w2p(1020, 470)[1] + 90, 1.2);

/* =====================================================================================
         ACT IV (21.5 – 25.0)  GAMIFIED CHALLENGE CARD — strictly inside y 1460–1640
         ===================================================================================== */
click(21.5); // 21.5 card reveals
tl.fromTo(
  "#cta",
  { opacity: 0, y: 24 },
  { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: false },
  21.5,
);
[22.5, 22.9].forEach((t) =>
  tl.fromTo(
    "#ctaRing",
    { scaleX: 1, scaleY: 1, opacity: 0.9 },
    {
      scaleX: 1.07,
      scaleY: 1.45,
      opacity: 0,
      duration: 0.55,
      ease: "power2.out",
      immediateRender: false,
    },
    t,
  ),
);
tl.to(
  "#ctaBtn",
  { boxShadow: "0 0 34px rgba(0,136,255,0.8)", duration: 0.25, ease: "sine.inOut" },
  22.5,
);
tl.to(
  "#ctaBtn",
  { boxShadow: "0 0 10px rgba(0,136,255,0.25)", duration: 0.25, ease: "sine.inOut" },
  22.8,
);
tl.to(
  "#ctaBtn",
  { boxShadow: "0 0 34px rgba(0,136,255,0.8)", duration: 0.25, ease: "sine.inOut" },
  22.9,
);
tl.to(
  "#ctaBtn",
  { boxShadow: "0 0 10px rgba(0,136,255,0.25)", duration: 0.2, ease: "sine.inOut" },
  23.15,
);
hop(21.9, 850, 1588, 1.1); // cursor glides onto the button
down(23.2); // 23.2 heavy switch snap
tl.to("#ctaBtn", { scale: 0.94, duration: 0.06, ease: "power2.out" }, 23.2);
tl.to("#ctaBtn", { scale: 1, duration: 0.3, ease: "back.out(3)" }, 23.27);
tl.to(
  "#ctaBtn",
  {
    backgroundColor: "rgba(255,255,255,0.95)",
    boxShadow: "0 0 50px rgba(255,255,255,0.9)",
    duration: 0.05,
  },
  23.2,
);
tl.to(
  "#ctaBtn",
  {
    backgroundColor: "rgba(0,136,255,0.32)",
    boxShadow: "0 0 26px rgba(0,136,255,0.8)",
    duration: 0.35,
    ease: "power2.out",
  },
  23.27,
);
tl.to("#ctaA", { opacity: 0, duration: 0.08 }, 23.22);
tl.to("#ctaB", { opacity: 1, duration: 0.15 }, 23.25);
up(23.3);
click(24.5); // 24.5 anchor

// wires that are still HIGH keep their spark layer marching until the end
Object.keys(FLOW).forEach((id) => {
  if (FLOW[id] != null) flow(id, FLOW[id], 25);
});

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

tl.to({}, { duration: 0.01 }, 24.99); // anchor the end of the 25.0 s timeline
window.__timelines["main"] = tl;
window.__timeline = tl;
tl.seek(0);
