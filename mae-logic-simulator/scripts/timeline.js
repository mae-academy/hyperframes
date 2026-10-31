/* =====================================================================================
         MAE Academy — Logic Circuit Simulator · master timeline (20.0 s, 1080×1920)
         Every visible value is a pure function of timeline time: no Date, no Math.random, no network.
         Geometry:  WORLD coords (SVG #world).  zoom 1 → page == world.  Zoom .82 about (560,760):
                    page = (560 + .82 (x-560), 760 + .82 (y-760)).
         Frame 0 is a LIVE half adder (A=B=1, C lit); t = 20.0 returns to exactly that state (loop anchor).
         ===================================================================================== */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"], // 0.0s: Frame 0 Hook impact
  [0.05, "snap"], // Active circuit state lock
  [0.8, "click"], // Hook question pulse
  [1.6, "click"], // Workspace clear
  [2.4, "snap"], // XOR gate drop
  [2.8, "snap"], // AND gate drop
  [3.4, "click"], // Input A & B snap
  [4.0, "click"], // Wire route 1
  [4.4, "click"], // Wire route 2
  [4.8, "click"], // Wire route 3
  [5.2, "snap"], // Sum/Carry outputs wired
  [5.8, "click"], // Toggle A=0, B=1 (Sum=1)
  [6.6, "click"], // Toggle A=1, B=1 (Sum=0, Carry=1)
  [6.8, "relay_thump"], // Relay switches carry
  [7.5, "click"], // Modular packaging start
  [8.2, "thump"], // Circuit collapses into [HA 1] IC block
  [9.0, "click"], // Duplicate [HA 2] drops
  [9.6, "snap"], // OR gate drops
  [10.2, "click"], // Cin input placed
  [10.8, "click"], // Internal S1 -> HA2 wiring
  [11.4, "click"], // C1 & C2 -> OR gate wiring
  [12.2, "snap"], // Full Adder output pins lock
  [13.0, "click"], // Input A toggled to 1
  [13.4, "click"], // Input B toggled to 1
  [13.8, "click"], // Cin toggled to 1 (1 + 1 + 1 = 3)
  [14.1, "relay_thump"], // Heavy dual relay thump (Sum=1, Cout=1)
  [14.3, "chime"], // Eureka harmonic tone
  [15.5, "click"], // Zone 3 Math confirmation: 1+1+1=3
  [16.5, "snap"], // Zone 4 Truth table active row glow
  [17.8, "click"], // CTA ribbon pulse
  [19.2, "click"], // Final loop anchor
];
// @CUES-END

/* ---------- procedural Web Audio (live preview). scripts/make_sfx.py mirrors these voices with numpy ---------- */
const SFX = (() => {
  let ctx, master;
  // linear attack, then exponential decay to -80 dB over `dec` seconds
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
    // damped square-sine (tanh-shaped) relay body
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
    }, // down 1400 / up 1800 Hz
    snap(c, out, t) {
      tone(c, out, t, 2200, 0.42, 0.016);
      tone(c, out, t, 4400, 0.12, 0.009);
    }, // 2200 Hz micro-click
    thump(c, out, t) {
      sub(c, out, t, 85, 0.6, 0.45);
      tone(c, out, t, 1400, 0.25, 0.014);
    }, // heavy relay: 85 Hz sub + 1400 Hz strike
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
        [50, 0.05],
        [100, 0.03],
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
const BSH0 = "0 0 26px rgba(255,0,68,0.12), inset 0 0 22px rgba(255,0,68,0.06)";

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

/* ---------- t = 0 state: a live half adder, A = B = 1, AND/Carry high, Sum low ---------- */
const ON1 = ["tgA", "tgB"];
function liveState(set) {
  // `set(sel, props)` either gsap.set (t=0) or tl.set at a time (rebuild reset)
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
  ON1.forEach((id) => {
    set(`#${id} .kn`, { x: live ? 40 : 0 });
    set(`#${id} .knOn, #${id} .trkOn, #${id} .stubOn`, { opacity: live ? 1 : 0 });
    set(`#${id} .d0`, { opacity: live ? 0 : 1 });
    set(`#${id} .d1`, { opacity: live ? 1 : 0 });
  });
  set("#faR6 .bg", { opacity: live ? 1 : 0 });
  set("#faR6 .ci, #faR6 .os", { color: live ? WHITE : DIM });
  set("#faR6 .oc", { color: live ? RED : DIM });
}
const g0 = (sel, p) => gsap.set(sel, p);
g0.live = true;
liveState(g0);

/* ---------- cursor ---------- */
let cx = 540,
  cy = 745;
function mv(t, x, y, d, over = true) {
  // glide with inertia + a short overshoot settle
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
const TILE = { tog: [188, 363], xor: [364, 363], and: [540, 363], or: [716, 363], led: [892, 363] };
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
// item follows the cursor (shared ease + duration); offsets in WORLD units; components snap with power3.out
function dragItem(id, t0, t1, a, b, finWorld, z, ghostScale = 0.5, appear = true) {
  const f = w2p(finWorld[0], finWorld[1], z);
  const oa = [(a[0] - f[0]) / z, (a[1] - f[1]) / z],
    ob = [(b[0] - f[0]) / z, (b[1] - f[1]) / z];
  tl.fromTo(
    "#cursor",
    { x: a[0], y: a[1] },
    { x: b[0], y: b[1], duration: t1 - t0, ease: "power3.out", immediateRender: false },
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
      ease: "power3.out",
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
  // quick-add from a palette tile
  const w = p2w(tile[0], tile[1], z);
  tl.fromTo(
    "#" + id,
    { x: w[0] - itemWorld[0], y: w[1] - itemWorld[1], scale: 0.4 },
    { x: 0, y: 0, scale: 1, duration: t1 - t0, ease: "power3.out", immediateRender: false },
    t0,
  );
  tl.fromTo("#" + id, { opacity: 0 }, { opacity: 1, duration: 0.08, immediateRender: false }, t0);
  pop(id, t1, 1.07);
  sfx(id, t1);
}

/* ---------- wires ---------- */
const wl = (pts, z) => pts.map((p) => w2p(p[0], p[1], z));
const plen = (p) =>
  p.reduce((L, q, i) => (i ? L + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
function dragWire(t0, t1, ids, z) {
  // cursor drags; wire draws exactly as far as the cursor has travelled
  const segs = ids.map((id) => ({ id, pts: wl(WP[id], z) }));
  const lens = segs.map((s) => plen(s.pts)),
    total = lens.reduce((a, b) => a + b, 0);
  let t = t0;
  segs.forEach((s, k) => {
    const dur = ((t1 - t0) * lens[k]) / total;
    tl.fromTo(
      `#w_${s.id} .b, #w_${s.id} .g`,
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: dur, ease: "none", immediateRender: false },
      t,
    );
    let tt = t;
    for (let i = 1; i < s.pts.length; i++) {
      const d =
        (dur * Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1])) / lens[k];
      tl.fromTo(
        "#cursor",
        { x: s.pts[i - 1][0], y: s.pts[i - 1][1] },
        { x: s.pts[i][0], y: s.pts[i][1], duration: d, ease: "none", immediateRender: false },
        tt,
      );
      tt += d;
    }
    t += dur;
  });
  const lp = segs[segs.length - 1].pts;
  cx = lp[lp.length - 1][0];
  cy = lp[lp.length - 1][1];
}
const autoWire = (t0, t1, id) =>
  // auto-route burst
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
  // logic-1 current travelling source → sink, with a bright head
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
  // active row: blue outline + glow; outputs coloured (S blue, C red)
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
         0.0 – 2.5  INSTANT LIVE HOOK — half adder already active: 1 + 1 = 10₂
         ===================================================================================== */
tl.fromTo(
  "#ledC .ring",
  { scale: 1, opacity: 0.9 },
  { scale: 2.2, opacity: 0, duration: 0.55, ease: "power2.out", immediateRender: false },
  0.02,
);
sfx("gAnd", 0.05); // 0.05 state lock
down(0.8);
up(0.87); // 0.8 hook-question pulse
tl.to(
  "#banner",
  { boxShadow: "0 0 46px rgba(255,0,68,0.65), inset 0 0 30px rgba(255,0,68,0.25)", duration: 0.15 },
  0.8,
);
tl.to("#banner", { boxShadow: BSH0, duration: 0.4 }, 0.95);
// 1.6 workspace clear: snappy box-select + delete
hop(0.9, 110, 440, 0.28);
down(1.2, false);
tl.fromTo(
  "#mq0",
  { scaleX: 0, scaleY: 0, opacity: 1 },
  { scaleX: 1, scaleY: 1, duration: 0.38, ease: "power1.inOut", immediateRender: false },
  1.22,
);
tl.fromTo(
  "#cursor",
  { x: 110, y: 440 },
  { x: 900, y: 880, duration: 0.38, ease: "power1.inOut", immediateRender: false },
  1.22,
);
cx = 900;
cy = 880;
up(1.6);
ring(1.6);
tl.to("#circ", { opacity: 0, duration: 0.25, ease: "power2.in" }, 1.62);
tl.to("#mq0", { opacity: 0, duration: 0.22 }, 1.62);
// invisible reset to a blank board
const g1 = (sel, p) => tl.set(sel, p, 1.95);
g1.live = false;
liveState(g1);
tl.set("#circ", { opacity: 1 }, 1.95);
rowOff("faR6", 1.95);

/* =====================================================================================
         2.5 – 7.5  RAPID REBUILD OF THE HALF ADDER + 4-STATE STRESS TEST
         ===================================================================================== */
hop(1.65, TILE.xor[0], TILE.xor[1], 0.35);
down(2.0, false);
tilePick("xor", 2.0, 2.4);
dragItem("gXor", 2.05, 2.4, TILE.xor, [540, 560], [540, 560], 1, 0.55);
up(2.4);
pop("gXor", 2.4, 1.08);
sfx("gXor", 2.4);
banner(2.4, "bn1"); // 2.4 snap
hop(2.4, TILE.and[0], TILE.and[1], 0.1);
down(2.5, false);
tilePick("and", 2.5, 2.8);
dragItem("gAnd", 2.5, 2.8, TILE.and, [540, 760], [540, 760], 1, 0.55);
up(2.8);
pop("gAnd", 2.8, 1.08);
sfx("gAnd", 2.8); // 2.8 snap
hop(2.85, 280, 520, 0.4);
tilePick("tog", 3.05, 3.4);
tilePick("led", 3.15, 3.55);
fly("tgA", 3.05, 3.4, TILE.tog, [220, 520], 1); // 3.4 inputs snap in
fly("tgB", 3.1, 3.4, TILE.tog, [220, 800], 1);
fly("ledS", 3.15, 3.5, TILE.led, [840, 560], 1);
fly("ledC", 3.2, 3.55, TILE.led, [840, 760], 1);
click(3.4);
// wire routing in 0.2 s bursts (release = cue)
down(3.75, false);
dragWire(3.8, 4.0, ["A1", "A2"], 1);
autoWire(3.86, 4.0, "A3");
tl.fromTo(
  "#j_A",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.15, ease: "back.out(3)", immediateRender: false },
  3.9,
);
up(4.0);
ring(4.0);
settleWires(4.0, ["A1", "A2", "A3"]);
hop(4.0, 280, 800, 0.15);
down(4.17, false);
dragWire(4.2, 4.4, ["B1", "B2"], 1);
autoWire(4.26, 4.4, "B3");
tl.fromTo(
  "#j_B",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.15, ease: "back.out(3)", immediateRender: false },
  4.3,
);
up(4.4);
ring(4.4);
settleWires(4.4, ["B1", "B2", "B3"]);
hop(4.4, 620, 560, 0.15);
down(4.57, false);
dragWire(4.6, 4.8, ["S0"], 1);
up(4.8);
ring(4.8);
settleWires(4.8, ["S0"]);
hop(4.8, 620, 760, 0.15);
down(4.97, false);
dragWire(5.0, 5.2, ["C0"], 1);
up(5.2);
ring(5.2);
settleWires(5.2, ["C0"]);
[
  ["A1", 5.25, 0.1],
  ["B1", 5.25, 0.1],
  ["A2", 5.35, 0.05],
  ["A3", 5.35, 0.12],
  ["B2", 5.35, 0.06],
  ["B3", 5.35, 0.14],
  ["S0", 5.45, 0.1],
  ["C0", 5.45, 0.1],
].forEach(([id, t, d]) => pulse(id, t, d));
rowOn("faR0", 5.3, 0, 0); // [0,0]
hop(5.3, 220, 800, 0.35);
// 5.8 [0,1]
down(5.8);
flip("tgB", 5.8, 1);
up(5.87);
rowOff("faR0", 5.8);
rowOn("faR2", 5.82, 1, 0, 0.1);
lit("B1", 5.82, 0.04);
lit("B2", 5.86, 0.05);
lit("B3", 5.86, 0.12);
partOn("gXor", 5.98);
lit("S0", 5.99, 0.08);
ledOn("ledS", 6.08);
// 6.2 [1,0]
hop(5.95, 220, 520, 0.22);
flip("tgB", 6.2, 0);
partOff("gXor", 6.2);
rowOff("faR2", 6.2);
unlit("B1", 6.2, 0.08);
unlit("B2", 6.2, 0.08);
unlit("B3", 6.2, 0.08);
unlit("S0", 6.2, 0.08);
ledOff("ledS", 6.3);
down(6.25);
flip("tgA", 6.25, 1);
up(6.32);
rowOn("faR4", 6.25, 1, 0, 0.1);
lit("A1", 6.27, 0.06);
lit("A2", 6.33, 0.03);
lit("A3", 6.33, 0.1);
partOn("gXor", 6.36);
lit("S0", 6.37, 0.08);
ledOn("ledS", 6.46);
// 6.6 [1,1] — carry high at 6.8 (relay)
hop(6.35, 220, 800, 0.22);
down(6.6);
flip("tgB", 6.6, 1);
up(6.67);
rowOff("faR4", 6.6);
rowOn("faR6", 6.62, 0, 1, 0.35);
lit("B1", 6.62, 0.04);
lit("B2", 6.66, 0.14);
lit("B3", 6.66, 0.14);
partOn("gAnd", 6.8);
lit("C0", 6.82, 0.1);
ledOn("ledC", 6.94);
partOff("gXor", 6.8);
unlit("S0", 6.8, 0.08);
ledOff("ledS", 6.9);
banner(6.9, "bn2");

/* =====================================================================================
         7.5 – 12.0  MODULAR COLLAPSE → [HA 1], DUPLICATE [HA 2], OR GATE, Cin
         ===================================================================================== */
hop(6.7, 320, 470, 0.4);
down(7.15, false);
tl.fromTo(
  "#mq",
  { scaleX: 0, scaleY: 0, opacity: 1 },
  { scaleX: 1, scaleY: 1, duration: 0.3, ease: "power1.inOut", immediateRender: false },
  7.2,
);
tl.fromTo(
  "#cursor",
  { x: 320, y: 470 },
  { x: 670, y: 850, duration: 0.3, ease: "power1.inOut", immediateRender: false },
  7.2,
);
cx = 670;
cy = 850;
up(7.5);
ring(7.5); // 7.5 select
banner(7.55, "bn3");
tl.set("#mq2", { opacity: 1 }, 7.5);
tl.set("#mq", { opacity: 0 }, 7.5);
tl.to("#mq2", { scaleX: 0.514, scaleY: 0.526, duration: 0.5, ease: "power3.inOut" }, 7.5);
tl.to("#mq2", { opacity: 0, duration: 0.18, ease: "power1.in" }, 8.0);
tl.to("#world", { scale: Z, duration: 0.7, ease: "power2.inOut" }, 7.8); // 7.8 smooth zoom-out (0.82 over 0.7 s)
tl.to("#z100", { opacity: 0, duration: 0.15 }, 8.0);
tl.to("#z75", { opacity: 1, duration: 0.15 }, 8.05);
tl.fromTo(
  "#half",
  { scale: 1, opacity: 1 },
  { scale: 0.3, opacity: 0, duration: 0.4, ease: "power3.in", immediateRender: false },
  7.8,
);
tl.fromTo(
  "#ha1",
  { scale: 0.5, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.8)", immediateRender: false },
  8.2,
);
sfx("ha1", 8.2); // 8.2 thump: collapsed into IC
flip("tgA", 8.25, 0);
flip("tgB", 8.25, 0);
ledOff("ledC", 8.25);
rowOff("faR6", 8.25);
rowOn("faR0", 8.27, 0, 0);
tl.to("#ha1", { x: -150, y: -140, duration: 0.4, ease: "power2.inOut" }, 8.2);
tl.to("#tgA", { x: -120, y: -50, duration: 0.4, ease: "power2.inOut" }, 8.2);
tl.to("#tgB", { x: -120, y: -230, duration: 0.4, ease: "power2.inOut" }, 8.2);
tl.to("#ledS", { x: 180, y: -90, duration: 0.4, ease: "power2.inOut" }, 8.2);
tl.to("#ledC", { x: 180, y: 80, duration: 0.4, ease: "power2.inOut" }, 8.2);
tl.to("#ledC .lblI", { opacity: 0, duration: 0.15 }, 8.4);
tl.to("#ledC .lblIII", { opacity: 1, duration: 0.2 }, 8.45);
const HA1P = w2p(340, 520),
  HA2P = w2p(640, 520),
  ORP = w2p(880, 840);
hop(7.55, HA1P[0], HA1P[1], 1.0);
down(8.6, false);
partOn("ha1", 8.55, 0.55);
tl.set("#ha2", { x: -300, y: 0 }, 8.5);
tl.fromTo("#ha2", { opacity: 0 }, { opacity: 0.7, duration: 0.12, immediateRender: false }, 8.6);
dragItem("ha2", 8.65, 9.0, HA1P, HA2P, [640, 520], Z, 1, false); // 9.0 HA 2 drops
up(9.0);
ring(9.0);
fade("#ha2", 9.0, 1, 0.1);
pop("ha2", 9.0, 1.07);
sfx("ha2", 9.0);
partOff("ha1", 9.05);
hop(9.02, TILE.or[0], TILE.or[1], 0.18);
down(9.22, false);
tilePick("or", 9.22, 9.6);
dragItem("gOr", 9.25, 9.6, TILE.or, ORP, [880, 840], Z, 0.5); // 9.6 OR drops
up(9.6);
pop("gOr", 9.6, 1.08);
sfx("gOr", 9.6);
const PCin = w2p(100, 960);
hop(9.62, PCin[0], PCin[1], 0.4);
tilePick("tog", 9.85, 10.2);
fly("tgC", 9.85, 10.2, TILE.tog, [100, 960], Z); // 10.2 Cin placed
click(10.2);
banner(10.25, "bn4");
// Full-adder wiring bursts
const PA = w2p(160, 470),
  PS1 = w2p(550, 470),
  POR2 = w2p(780, 860),
  PLS = w2p(1010, 470);
hop(10.3, PA[0], PA[1], 0.1);
autoWire(10.4, 10.6, "FA");
autoWire(10.4, 10.6, "FB");
hop(10.55, PS1[0], PS1[1], 0.2);
autoWire(10.6, 10.8, "FS1");
autoWire(10.55, 10.8, "FCIN");
tl.to("#bdS1", { opacity: 1, duration: 0.15 }, 10.75);
click(10.8);
settleWires(10.8, ["FA", "FB", "FS1", "FCIN"]); // 10.8 S1 → HA2
hop(10.87, POR2[0], POR2[1], 0.3);
autoWire(11.15, 11.4, "FC1");
autoWire(11.2, 11.4, "FC2");
tl.to("#bdC1, #bdC2", { opacity: 1, duration: 0.15 }, 11.3);
click(11.4);
settleWires(11.4, ["FC1", "FC2"]); // 11.4 C1, C2 → OR
hop(11.5, PLS[0], PLS[1], 0.35);
autoWire(11.95, 12.2, "FS2");
autoWire(12.05, 12.2, "FOR");
up(12.2);
ring(12.2);
settleWires(12.2, ["FS2", "FOR"]); // 12.2 output pins lock
sfx("gOr", 12.2);
sfx("ha2", 12.2);

/* =====================================================================================
         12.0 – 17.5  THE ULTIMATE TEST  1 + 1 + 1 = 3  (11₂)
         ===================================================================================== */
[
  ["FA", 12.3, 0.1],
  ["FB", 12.3, 0.1],
  ["FCIN", 12.3, 0.3],
  ["FS1", 12.4, 0.12],
  ["FC1", 12.4, 0.35],
  ["FC2", 12.5, 0.2],
  ["FS2", 12.5, 0.2],
  ["FOR", 12.65, 0.05],
].forEach(([id, t, d]) => pulse(id, t, d));
const PAt = w2p(100, 470),
  PBt = w2p(100, 570),
  PCt = w2p(100, 960);
hop(12.3, PAt[0], PAt[1], 0.6);
// 13.0 A = 1 → S1 = 1 → S = 1
click(13.0);
flip("tgA", 13.0, 1);
rowOff("faR0", 13.0);
rowOn("faR4", 13.02, 1, 0, 0.15);
lit("FA", 13.02, 0.07);
partOn("ha1", 13.1, 0.8);
lit("FS1", 13.1, 0.1);
partOn("ha2", 13.2, 0.8);
lit("FS2", 13.2, 0.18);
ledOn("ledS", 13.4);
hop(13.07, PBt[0], PBt[1], 0.28);
// 13.4 B = 1 → HA1: S1 = 0, C1 = 1
click(13.4);
flip("tgB", 13.4, 1);
rowOff("faR4", 13.4);
rowOn("faR6", 13.42, 0, 1, 0.2);
lit("FB", 13.42, 0.08);
unlit("FS1", 13.52, 0.08);
lit("FC1", 13.55, 0.55);
unlit("FS2", 13.62, 0.16);
partOff("ha2", 13.65);
ledOff("ledS", 13.8);
hop(13.47, PCt[0], PCt[1], 0.28);
// 13.8 Cin = 1 ; 14.1 OR → Cout = 1 (relay thump) ; 14.3 HA2 → S = 1 (chime)
click(13.8);
flip("tgC", 13.8, 1);
rowOff("faR6", 13.8);
rowOn("faR7", 13.82, 1, 1, 0.5);
lit("FCIN", 13.82, 0.48);
partOn("gOr", 14.1);
lit("FOR", 14.1, 0.05);
ledOn("ledC", 14.18);
sfx("gOr", 14.1);
partOn("ha2", 14.3, 0.8);
lit("FS2", 14.3, 0.2);
ledOn("ledS", 14.52);
sfx("ha2", 14.3);
const PLEDS = w2p(1020, 470);
hop(14.4, PLEDS[0], PLEDS[1], 1.0);
// 15.5 math confirmation ; 16.5 truth-table row locks
click(15.5);
banner(15.5, "bn5");
tl.to(
  "#faR7 .bg",
  { borderColor: "#0088FF", boxShadow: "0 0 18px rgba(0,136,255,0.85)", duration: 0.2 },
  16.5,
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
  16.5,
);
tl.fromTo(
  "#faR7 .ck",
  { opacity: 0, scale: 0.3 },
  { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: false },
  16.52,
);

/* =====================================================================================
         17.5 – 20.0  CTA + LOOP ANCHOR (everything settles by 19.9 so t = 20.0 == frame 0)
         ===================================================================================== */
tl.to(
  "#cta",
  {
    boxShadow: "0 0 30px 3px rgba(0,136,255,0.7)",
    borderColor: "rgba(0,136,255,1)",
    duration: 0.35,
    ease: "sine.inOut",
  },
  17.8,
);
tl.to(
  "#cta",
  {
    boxShadow: "0 0 8px 0px rgba(0,136,255,0.1)",
    borderColor: "rgba(0,136,255,0.5)",
    duration: 0.35,
    ease: "sine.inOut",
  },
  18.15,
);
tl.to(
  "#cta",
  {
    boxShadow: "0 0 30px 3px rgba(0,136,255,0.7)",
    borderColor: "rgba(0,136,255,1)",
    duration: 0.35,
    ease: "sine.inOut",
  },
  18.5,
);
tl.to(
  "#cta",
  {
    boxShadow: "0 0 8px 0px rgba(0,136,255,0.1)",
    borderColor: "rgba(0,136,255,0.5)",
    duration: 0.35,
    ease: "sine.inOut",
  },
  18.85,
);
hop(18.4, 820, 1612, 0.6);
down(19.2);
tl.to("#cta", { scale: 0.975, duration: 0.06, ease: "power2.out" }, 19.2);
tl.to("#cta", { scale: 1, duration: 0.2, ease: "back.out(3)" }, 19.26);
up(19.3);
// loop anchor: full adder dissolves, grid zooms back to 100 %, the live half adder (A=B=1) returns
tl.to(
  "#full, #bdS1, #bdC1, #bdC2, #ha1, #ha2, #gOr, #tgC",
  { opacity: 0, duration: 0.25, ease: "power2.in" },
  19.3,
);
flip("tgC", 19.3, 0);
ledOff("ledS", 19.3);
tl.to("#tgA, #tgB, #ledS, #ledC", { x: 0, y: 0, duration: 0.5, ease: "power2.inOut" }, 19.3);
tl.fromTo(
  "#world",
  { scale: Z },
  { scale: 1, duration: 0.5, ease: "power2.inOut", immediateRender: false },
  19.3,
);
tl.fromTo(
  "#half",
  { scale: 0.3, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.45, ease: "power3.out", immediateRender: false },
  19.4,
);
tl.to("#ledC .lblIII", { opacity: 0, duration: 0.15 }, 19.4);
tl.to("#ledC .lblI", { opacity: 1, duration: 0.2 }, 19.45);
tl.to("#z75", { opacity: 0, duration: 0.15 }, 19.4);
tl.to("#z100", { opacity: 1, duration: 0.2 }, 19.45);
banner(19.35, "bn0");
rowOff("faR7", 19.3);
rowOn("faR6", 19.4, 0, 1, 0);
tl.to("#faR7 .ck", { opacity: 0, duration: 0.15 }, 19.3);
tl.to(
  "#faR7 .bg",
  { borderColor: "rgba(0,136,255,0.75)", boxShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.01 },
  19.55,
);
tl.fromTo(
  "#cursor",
  { x: cx, y: cy },
  { x: 540, y: 745, duration: 0.6, ease: "power3.inOut", immediateRender: false },
  19.32,
);
cx = 540;
cy = 745;

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

tl.to({}, { duration: 0.01 }, 19.99); // anchor the end of the 20.0 s timeline
window.__timelines["main"] = tl;
window.__timeline = tl;
tl.seek(0);
