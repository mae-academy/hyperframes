/* =====================================================================================
         MAE Academy — Logic Circuit Simulator · master timeline (36.0 s, 1080×1920)
         Every visible value is a pure function of timeline time: no Date, no Math.random, no network.
         Geometry:  WORLD coords (SVG #world).  zoom 1 → page == world.  zoom .75 about (560,760):
                    page = (140 + .75 x, 190 + .75 y).
         ===================================================================================== */

// @CUES-BEGIN
const CUES = [
  [0.0, "thump"],
  [0.05, "click"],
  [1.8, "click"],
  [2.8, "snap"],
  [3.6, "snap"],
  [4.8, "click"],
  [5.8, "click"],
  [6.8, "click"],
  [7.8, "snap"],
  [8.8, "click"],
  [10.5, "click"],
  [10.7, "thump"],
  [14.2, "click"],
  [15.8, "thump"],
  [17.5, "click"],
  [18.8, "snap"],
  [20.5, "click"],
  [21.5, "click"],
  [22.5, "click"],
  [23.8, "snap"],
  [25.0, "click"],
  [25.6, "click"],
  [26.2, "click"],
  [26.5, "thump"],
  [26.5, "chime"], // + brief Act III: "relay_thump + chime"
  [27.0, "snap"],
  [29.5, "click"],
  [33.0, "click"],
];
// @CUES-END

/* ---------- procedural Web Audio (live preview). scripts/make_sfx.py mirrors these voices with numpy ---------- */
const SFX = (() => {
  let ctx, master;
  // linear 1 ms attack, then exponential decay to -80 dB over `dec` seconds
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
  const V = {
    click(c, out, t) {
      tone(c, out, t, 1400, 0.34, 0.03);
      tone(c, out, t + 0.06, 1800, 0.22, 0.026);
    }, // down 1400 Hz / up 1800 Hz
    snap(c, out, t) {
      tone(c, out, t, 2400, 0.42, 0.016);
      tone(c, out, t, 4800, 0.12, 0.009);
    }, // wire snap tick
    thump(c, out, t) {
      // relay: damped 80 Hz square-sine
      const o = c.createOscillator(),
        s = c.createWaveShaper(),
        g = c.createGain(),
        k = new Float32Array(512);
      for (let i = 0; i < 512; i++) k[i] = Math.tanh(2.2 * (i / 255.5 - 1));
      s.curve = k;
      o.type = "sine";
      o.frequency.value = 80;
      o.connect(s);
      s.connect(g);
      g.connect(out);
      env(g, t, 0.6, 0.45, 0.002);
      o.start(t);
      o.stop(t + 0.5);
    },
    chime(c, out, t) {
      tone(c, out, t, 1318.5, 0.16, 0.9, 0.003);
      tone(c, out, t, 1975.5, 0.1, 0.7, 0.003);
    },
  };
  return {
    live: false,
    arm() {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
      const h = ctx.createOscillator(),
        hg = ctx.createGain(); // 50 Hz lab hum, -24 dB
      h.frequency.value = 50;
      hg.gain.value = 0.0631;
      h.connect(hg);
      hg.connect(ctx.destination);
      h.start();
      this.live = true;
    },
    play(k) {
      if (ctx && V[k]) V[k](ctx, master, ctx.currentTime + 0.005);
    },
  };
})();
window.addEventListener("pointerdown", () => SFX.arm(), { once: true });

/* ---------- geometry helpers ---------- */
const Z = 0.75,
  ZO = [560, 760];
const w2p = (x, y, z = Z) => [ZO[0] + z * (x - ZO[0]), ZO[1] + z * (y - ZO[1])];
const p2w = (x, y, z = Z) => [ZO[0] + (x - ZO[0]) / z, ZO[1] + (y - ZO[1]) / z];
const BLUE = "#0088FF",
  RED = "#FF0044",
  DIM = "#8A8AA8",
  WHITE = "#FFFFFF";

const tl = gsap.timeline({ paused: true });

// initial (t = 0) state — identical to the state restored at t = 36 for a seamless loop
gsap.set(".mv", { transformOrigin: "0px 0px" });
gsap.set("#world", { svgOrigin: "560 760" });
gsap.set("#half", { svgOrigin: "490 660" });
gsap.set("#mq", { svgOrigin: "320 470" });
gsap.set("#mq2", { svgOrigin: "495 660" });
gsap.set("#cArrow", { svgOrigin: "0 0" });
gsap.set("#cursor", { x: 540, y: 745 });
gsap.set("#ring", { x: 540, y: 745 });
gsap.set("#bn0", { opacity: 1 });
gsap.set("#ttFA", { opacity: 0 });

/* ---------- cursor ---------- */
let cx = 540,
  cy = 745;
// glide with inertia: power3.out toward a point slightly past the target, then a short settle (overshoot on stop)
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
      { x, y, duration: 0.14, ease: "power2.inOut", immediateRender: false },
      t + d,
    );
  cx = x;
  cy = y;
}
const hop = (t, x, y, d) => mv(t, x, y, d, false); // short repositioning, no overshoot
function ring(t) {
  tl.set("#ring", { x: cx, y: cy }, t);
  tl.fromTo(
    "#ring i",
    { scale: 0.3, opacity: 0.95 },
    { scale: 1.5, opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false },
    t,
  );
}
function down(t, withRing = true) {
  tl.to("#cArrow", { scale: 0.85, duration: 0.07, ease: "power2.out" }, t);
  if (withRing) ring(t);
}
const up = (t) => tl.to("#cArrow", { scale: 1, duration: 0.2, ease: "back.out(3)" }, t);

/* ---------- generic helpers ---------- */
const sfx = (id, t) =>
  tl.fromTo(
    "#sf_" + id,
    { scale: 0.85, opacity: 0.95 },
    { scale: 1.35, opacity: 0, duration: 0.42, ease: "power2.out", immediateRender: false },
    t,
  );
const pop = (id, t, s = 1.1) =>
  tl.fromTo(
    "#" + id,
    { scale: s },
    { scale: 1, duration: 0.3, ease: "back.out(2.2)", immediateRender: false },
    t,
  );
const fade = (sel, t, to, d = 0.25) =>
  tl.to(sel, { opacity: to, duration: d, ease: "power2.out" }, t);

function tilePick(k, t0, t1) {
  tl.to(
    "#tile_" + k,
    { borderColor: BLUE, backgroundColor: "rgba(0,136,255,0.18)", duration: 0.12 },
    t0,
  );
  tl.to(
    "#tile_" + k,
    { borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(30,30,46,0.6)", duration: 0.3 },
    t1,
  );
}
const TILE = { tog: [188, 363], xor: [364, 363], and: [540, 363], or: [716, 363], led: [892, 363] };

// item follows the cursor (cursor and item share ease + duration); offsets are in WORLD units
function dragItem(id, t0, t1, a, b, finWorld, z, ghostScale = 0.5, appear = true) {
  const f = w2p(finWorld[0], finWorld[1], z);
  const oa = [(a[0] - f[0]) / z, (a[1] - f[1]) / z],
    ob = [(b[0] - f[0]) / z, (b[1] - f[1]) / z];
  tl.fromTo(
    "#cursor",
    { x: a[0], y: a[1] },
    { x: b[0], y: b[1], duration: t1 - t0, ease: "power2.inOut", immediateRender: false },
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
      ease: "power2.inOut",
      immediateRender: false,
    },
    t0,
  );
  if (appear)
    tl.fromTo("#" + id, { opacity: 0 }, { opacity: 1, duration: 0.12, immediateRender: false }, t0);
  cx = b[0];
  cy = b[1];
}
// item flies in from a palette tile by itself ("quick-add"), landing with a snap pulse
function fly(id, t0, t1, tile, itemWorld, z) {
  const w = p2w(tile[0], tile[1], z);
  tl.fromTo(
    "#" + id,
    { x: w[0] - itemWorld[0], y: w[1] - itemWorld[1], scale: 0.4 },
    { x: 0, y: 0, scale: 1, duration: t1 - t0, ease: "power3.out", immediateRender: false },
    t0,
  );
  tl.fromTo("#" + id, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, t0);
  pop(id, t1, 1.07);
  sfx(id, t1);
}

/* ---------- wires ---------- */
const wl = (pts, z) => pts.map((p) => w2p(p[0], p[1], z));
const plen = (p) =>
  p.reduce((L, q, i) => (i ? L + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
// cursor drags wires out; every wire draws exactly as far as the cursor has travelled along its vertices
function dragWire(t0, t1, ids, z) {
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
  tl.fromTo(
    `#w_${id} .b, #w_${id} .g`,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: t1 - t0, ease: "power1.inOut", immediateRender: false },
    t0,
  );
const settleWires = (t, ids) =>
  tl.to(
    ids.map((i) => `#w_${i} .g`).join(","),
    { opacity: 0, duration: 0.3, ease: "power2.out" },
    t,
  );
// logic-1 current travelling source → sink, with a bright head
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
  tl.to(`#${id} .kn`, { x: v ? 40 : 0, duration: 0.14, ease: "power2.out" }, t);
  tl.to(`#${id} .knOn, #${id} .trkOn, #${id} .stubOn`, { opacity: v, duration: 0.12 }, t);
  tl.to(`#${id} .d0`, { opacity: 1 - v, duration: 0.08 }, t);
  tl.to(`#${id} .d1`, { opacity: v, duration: 0.08 }, t);
}
const partOn = (id, t, a = 1) =>
  tl.to(`#${id} .on`, { opacity: a, duration: 0.16, ease: "power2.out" }, t);
const partOff = (id, t) =>
  tl.to(`#${id} .on`, { opacity: 0, duration: 0.25, ease: "power2.in" }, t);
function ledOn(id, t) {
  tl.to(`#${id} .on`, { opacity: 1, duration: 0.1, ease: "power2.out" }, t);
  tl.fromTo(
    `#${id} .ring`,
    { scale: 1, opacity: 0.9 },
    { scale: 2.2, opacity: 0, duration: 0.6, ease: "power2.out", immediateRender: false },
    t,
  );
}
const ledOff = (id, t) => tl.to(`#${id} .on`, { opacity: 0, duration: 0.25, ease: "power2.in" }, t);

/* ---------- Zone 3 banner / Zone 4 table / CTA ---------- */
let bn = "bn0";
function banner(t, id) {
  tl.to("#" + bn, { opacity: 0, y: -10, duration: 0.22, ease: "power2.in" }, t);
  tl.fromTo(
    "#" + id,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.38, ease: "power3.out", immediateRender: false },
    t + 0.12,
  );
  bn = id;
}
function rowOn(id, t, s, c, outDelay = 0) {
  tl.to(`#${id} .bg`, { opacity: 1, duration: 0.15, ease: "power2.out" }, t);
  tl.to(`#${id} .ci`, { color: WHITE, duration: 0.15 }, t);
  tl.to(`#${id} .os`, { color: s ? BLUE : WHITE, duration: 0.2 }, t + outDelay);
  tl.to(`#${id} .oc`, { color: c ? RED : WHITE, duration: 0.2 }, t + outDelay);
}
function rowOff(id, t) {
  tl.to(`#${id} .bg`, { opacity: 0, duration: 0.2 }, t);
  tl.to(`#${id} .c`, { color: DIM, duration: 0.2 }, t);
}

/* =====================================================================================
         ACT I — THE HOOK & THE HALF ADDER (0 – 14 s)
         ===================================================================================== */
// 0.0  boot thump + first click — frame 0 is already live
tl.fromTo(
  "#liveDot",
  { scale: 1 },
  { scale: 1.7, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false },
  0,
);
down(0.05);
up(0.12);
tl.fromTo(
  "#cursor",
  { x: 540, y: 745 },
  { x: 556, y: 732, duration: 0.9, ease: "sine.inOut", immediateRender: false },
  0.2,
);
cx = 556;
cy = 732; // hover near centre

// 1.2  building the half adder
banner(1.2, "bn1");
mv(1.15, TILE.xor[0], TILE.xor[1], 0.5);
down(1.8);
tilePick("xor", 1.8, 2.8);
dragItem("gXor", 1.85, 2.75, TILE.xor, [540, 560], [540, 560], 1, 0.55);
up(2.8);
pop("gXor", 2.8, 1.08);
sfx("gXor", 2.8);

hop(2.82, TILE.and[0], TILE.and[1], 0.3);
down(3.12, false);
tilePick("and", 3.12, 3.6);
dragItem("gAnd", 3.15, 3.55, TILE.and, [540, 760], [540, 760], 1, 0.55);
up(3.6);
pop("gAnd", 3.6, 1.08);
sfx("gAnd", 3.6);

// 3.6–4.3 quick-add: two toggles + two probe LEDs fly in from the dock while the cursor heads for pin A
tilePick("tog", 3.62, 4.0);
tilePick("led", 3.8, 4.25);
fly("tgA", 3.65, 3.95, TILE.tog, [220, 520], 1);
fly("tgB", 3.75, 4.05, TILE.tog, [220, 800], 1);
fly("ledS", 3.85, 4.15, TILE.led, [840, 560], 1);
fly("ledC", 3.95, 4.25, TILE.led, [840, 760], 1);
mv(3.62, 280, 520, 0.55);

// 4.5–8.5 snap-to-grid wiring (release = cue)
down(4.3, false);
dragWire(4.35, 4.8, ["A1", "A2"], 1);
autoWire(4.5, 4.8, "A3");
tl.fromTo(
  "#j_A",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(3)", immediateRender: false },
  4.52,
);
up(4.8);
ring(4.8);
settleWires(4.8, ["A1", "A2", "A3"]);
mv(4.85, 280, 800, 0.4);
down(5.35, false);
dragWire(5.38, 5.8, ["B1", "B2"], 1);
autoWire(5.48, 5.8, "B3");
tl.fromTo(
  "#j_B",
  { opacity: 0, scale: 0.2 },
  { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(3)", immediateRender: false },
  5.5,
);
up(5.8);
ring(5.8);
settleWires(5.8, ["B1", "B2", "B3"]);
mv(5.85, 620, 560, 0.4);
down(6.38, false);
dragWire(6.4, 6.8, ["S0"], 1);
up(6.8);
ring(6.8);
settleWires(6.8, ["S0"]);
mv(6.85, 620, 760, 0.35);
down(7.36, false);
dragWire(7.38, 7.8, ["C0"], 1);
up(7.8);
ring(7.8);
settleWires(7.8, ["C0"]);

// 7.8–8.5 continuity check sweep, truth-table row 0 0
[
  ["A1", 7.9, 0.25],
  ["B1", 7.95, 0.2],
  ["A2", 8.1, 0.1],
  ["A3", 8.1, 0.28],
  ["B2", 8.1, 0.12],
  ["B3", 8.1, 0.3],
  ["S0", 8.2, 0.25],
  ["C0", 8.2, 0.25],
].forEach(([id, t, d]) => pulse(id, t, d));
rowOn("haR0", 7.9, 0, 0);
mv(7.9, 220, 520, 0.75);

// 8.8  A → 1 : S = 1, C = 0
down(8.8);
flip("tgA", 8.8, 1);
up(8.88);
rowOff("haR0", 8.8);
rowOn("haR2", 8.82, 1, 0, 0.7);
lit("A1", 8.82, 0.25);
lit("A2", 9.07, 0.1);
lit("A3", 9.07, 0.28);
partOn("gXor", 9.18);
lit("S0", 9.2, 0.28);
ledOn("ledS", 9.5);
mv(8.95, 600, 650, 0.6);
// 10.5 B → 1 : AND shoots high, XOR drops
mv(9.85, 220, 800, 0.5);
down(10.5);
flip("tgB", 10.5, 1);
up(10.58);
rowOff("haR2", 10.5);
rowOn("haR3", 10.52, 0, 1, 0.5);
lit("B1", 10.52, 0.09);
lit("B2", 10.61, 0.12);
lit("B3", 10.61, 0.29);
partOn("gAnd", 10.7);
lit("C0", 10.72, 0.28);
ledOn("ledC", 11.0); // 10.7 relay thump — AND goes HIGH
partOff("gXor", 10.9);
unlit("S0", 10.92, 0.28);
ledOff("ledS", 11.2);
banner(10.9, "bn2");
mv(11.3, 800, 720, 0.6);
mv(13.3, 320, 470, 0.6);

/* =====================================================================================
         ACT II — PACKAGING & THE CARRY-IN PROBLEM (14 – 20 s)
         ===================================================================================== */
banner(14.0, "bn3");
down(14.2); // marquee select (cue click)
tl.fromTo(
  "#mq",
  { scaleX: 0, scaleY: 0, opacity: 1 },
  { scaleX: 1, scaleY: 1, duration: 0.95, ease: "power1.inOut", immediateRender: false },
  14.25,
);
tl.fromTo(
  "#cursor",
  { x: 320, y: 470 },
  { x: 670, y: 850, duration: 0.95, ease: "power1.inOut", immediateRender: false },
  14.25,
);
cx = 670;
cy = 850;
partOn("gXor", 15.05);
up(15.2);
tl.set("#mq2", { opacity: 1 }, 15.2);
tl.set("#mq", { opacity: 0 }, 15.2);
tl.to("#mq2", { scaleX: 0.514, scaleY: 0.526, duration: 0.6, ease: "power3.inOut" }, 15.2);
tl.to("#mq2", { opacity: 0, duration: 0.25, ease: "power1.in" }, 15.55);
tl.fromTo(
  "#half",
  { scale: 1, opacity: 1 },
  { scale: 0.3, opacity: 0, duration: 0.5, ease: "power3.in", immediateRender: false },
  15.3,
);
// 15.8 thump: collapsed into IC block [HALF ADDER 1]; inputs reset to 0
tl.fromTo(
  "#ha1",
  { scale: 0.5, opacity: 0 },
  { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.8)", immediateRender: false },
  15.8,
);
sfx("ha1", 15.8);
flip("tgA", 15.85, 0);
flip("tgB", 15.85, 0);
ledOff("ledC", 15.85);
mv(15.4, 760, 780, 0.5);

// 16.5–17.5 stage expansion: canvas zooms out 25 %, HA 1 shifts left, I/O re-flow
tl.to("#world", { scale: Z, duration: 1.0, ease: "power2.inOut" }, 16.5);
tl.to("#ha1", { x: -150, y: -140, duration: 1.0, ease: "power2.inOut" }, 16.5);
tl.to("#tgA", { x: -120, y: -50, duration: 1.0, ease: "power2.inOut" }, 16.5);
tl.to("#tgB", { x: -120, y: -230, duration: 1.0, ease: "power2.inOut" }, 16.5);
tl.to("#ledS", { x: 200, y: -90, duration: 1.0, ease: "power2.inOut" }, 16.5);
tl.to("#ledC", { x: 200, y: 80, duration: 1.0, ease: "power2.inOut" }, 16.5);
tl.to("#z100", { opacity: 0, duration: 0.2 }, 16.9);
tl.to("#z75", { opacity: 1, duration: 0.2 }, 16.95);
tl.to("#ledC .lblI", { opacity: 0, duration: 0.2 }, 17.0);
tl.to("#ledC .lblIII", { opacity: 1, duration: 0.25 }, 17.05); // C → C_out
const HA1P = w2p(340, 520),
  HA2P = w2p(640, 520),
  ORP = w2p(880, 840);
mv(16.9, HA1P[0], HA1P[1], 0.45);

// 17.5 duplicate HA 1 → HA 2 at (620,580)
down(17.5);
partOn("ha1", 17.52, 0.55);
tl.set("#ha2", { x: -300, y: 0 }, 17.5); // ghost copy spawns on top of HA 1 …
tl.fromTo("#ha2", { opacity: 0 }, { opacity: 0.7, duration: 0.25, immediateRender: false }, 17.55);
dragItem("ha2", 17.8, 18.8, HA1P, HA2P, [640, 520], Z, 1, false); // … and is dragged to (620,580)
up(18.8);
fade("#ha2", 18.8, 1, 0.12);
pop("ha2", 18.8, 1.07);
sfx("ha2", 18.8);
partOff("ha1", 18.85);
// OR gate from the dock → (800,820)
hop(18.85, TILE.or[0], TILE.or[1], 0.3);
down(19.2, false);
tilePick("or", 19.2, 19.6);
dragItem("gOr", 19.22, 19.6, TILE.or, ORP, [880, 840], Z, 0.5);
up(19.62);
pop("gOr", 19.62, 1.08);
sfx("gOr", 19.62);

/* =====================================================================================
         ACT III — BUILDING THE FULL ADDER (20 – 29 s)
         ===================================================================================== */
banner(20.0, "bn4");
rowOff("haR3", 19.95);
tl.to("#ttHA", { opacity: 0, duration: 0.3 }, 20.0);
tl.to("#ttFA", { opacity: 1, duration: 0.35 }, 20.1);
const PA = w2p(160, 470),
  PB = w2p(160, 570);
hop(19.68, PA[0], PA[1], 0.35);
down(20.05, false);
dragWire(20.05, 20.22, ["FA"], Z);
hop(20.22, PB[0], PB[1], 0.08);
dragWire(20.3, 20.5, ["FB"], Z);
up(20.5);
ring(20.5);
settleWires(20.5, ["FA", "FB"]);
// S1 → HA2 input 1
const PS1 = w2p(430, 470);
hop(20.55, PS1[0], PS1[1], 0.4);
down(21.0, false);
dragWire(21.0, 21.5, ["FS1"], Z);
tl.to("#nlS1", { opacity: 1, duration: 0.3 }, 21.4);
up(21.5);
ring(21.5);
settleWires(21.5, ["FS1"]);
// third switch C_in placed bottom-left, wired into HA2 input 2
const PC = w2p(160, 960);
fly("tgC", 21.55, 21.95, TILE.tog, [100, 960], Z);
tilePick("tog", 21.55, 21.95);
hop(21.55, PC[0], PC[1], 0.42);
down(22.0, false);
dragWire(22.0, 22.5, ["FCIN"], Z);
up(22.5);
ring(22.5);
settleWires(22.5, ["FCIN"]);
// S, C1, C2, OR output — final connection burst (S and OR output auto-route)
const PC1 = w2p(430, 570),
  PC2 = w2p(730, 570);
autoWire(22.8, 23.3, "FS2");
hop(22.55, PC1[0], PC1[1], 0.12);
down(22.7, false);
dragWire(22.7, 23.35, ["FC1"], Z);
tl.to("#nlC1", { opacity: 1, duration: 0.3 }, 23.2);
hop(23.35, PC2[0], PC2[1], 0.2);
down(23.55, false);
dragWire(23.55, 23.8, ["FC2"], Z);
autoWire(23.45, 23.76, "FOR");
tl.to("#nlC2", { opacity: 1, duration: 0.3 }, 23.7);
up(23.8);
ring(23.8);
settleWires(23.8, ["FS2", "FC1", "FC2", "FOR"]);
mv(23.9, w2p(100, 470)[0], w2p(100, 470)[1], 0.65);

// 24.0–24.7 continuity sweep, row 0 0 0
[
  ["FA", 24.0, 0.15],
  ["FB", 24.0, 0.15],
  ["FCIN", 24.0, 0.5],
  ["FS1", 24.1, 0.18],
  ["FC1", 24.1, 0.55],
  ["FC2", 24.25, 0.3],
  ["FS2", 24.3, 0.3],
  ["FOR", 24.5, 0.1],
].forEach(([id, t, d]) => pulse(id, t, d));
rowOn("faR0", 24.2, 0, 0);

// 25.0 A = 1 → S1 = 1 → S = 1
down(25.0);
flip("tgA", 25.0, 1);
up(25.08);
rowOff("faR0", 25.0);
rowOn("faR4", 25.02, 1, 0, 0.6);
lit("FA", 25.02, 0.1);
partOn("ha1", 25.14, 0.8);
lit("FS1", 25.14, 0.14);
partOn("ha2", 25.3, 0.8);
lit("FS2", 25.3, 0.3);
ledOn("ledS", 25.62);
const PBt = w2p(100, 570);
hop(25.15, PBt[0], PBt[1], 0.35);
// 25.6 B = 1 → HA1: S1 = 0, C1 = 1
down(25.6);
flip("tgB", 25.6, 1);
up(25.68);
rowOff("faR4", 25.6);
rowOn("faR6", 25.62, 0, 1, 0.9);
lit("FB", 25.62, 0.13);
unlit("FS1", 25.78, 0.14);
lit("FC1", 25.82, 0.68);
partOff("ha2", 25.95);
unlit("FS2", 25.92, 0.28);
ledOff("ledS", 26.2);
// 26.2 C_in = 1 → HA2 receives (0,1) → S = 1
const PCt = w2p(100, 960);
hop(25.7, PCt[0], PCt[1], 0.45);
down(26.2);
flip("tgC", 26.2, 1);
up(26.28);
rowOff("faR6", 26.2);
rowOn("faR7", 26.22, 1, 1, 0.8);
lit("FCIN", 26.22, 0.53);
// 26.5 OR receives (1,0) → C_out = 1  (relay thump + chime)
partOn("gOr", 26.5);
lit("FOR", 26.5, 0.06);
ledOn("ledC", 26.58);
partOn("ha2", 26.78, 0.8);
lit("FS2", 26.78, 0.22);
ledOn("ledS", 27.02);
mv(27.2, 640, 740, 0.9);

/* =====================================================================================
         ACT IV — COMPLETE VERIFICATION & OUTRO LOOP (29 – 36 s)
         ===================================================================================== */
banner(29.0, "bn5");
mv(28.55, 700, 1539, 0.8);
down(29.5);
tl.to(
  "#faR7 .bg",
  { borderColor: "#0088FF", boxShadow: "0 0 18px rgba(0,136,255,0.85)", duration: 0.2 },
  29.5,
);
tl.fromTo(
  "#faR7",
  { scaleY: 1 },
  {
    scaleY: 1.18,
    duration: 0.14,
    yoyo: true,
    repeat: 1,
    ease: "power2.out",
    immediateRender: false,
  },
  29.5,
);
tl.fromTo(
  "#faR7 .ck",
  { opacity: 0, scale: 0.3 },
  { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(3)", immediateRender: false },
  29.52,
);
up(29.58);
// 32.5 CTA pulses; cursor glides down and clicks the pinned-comment button at 33.0
tl.to("#cta0", { opacity: 0, duration: 0.2 }, 32.5);
tl.to("#cta1", { opacity: 1, duration: 0.3 }, 32.6);
for (let i = 0; i < 3; i++) {
  tl.to(
    "#cta",
    {
      boxShadow: "0 0 30px 3px rgba(0,136,255,0.7)",
      borderColor: "rgba(0,136,255,1)",
      duration: 0.5,
      ease: "sine.inOut",
    },
    32.5 + i,
  );
  tl.to(
    "#cta",
    {
      boxShadow: "0 0 8px 0px rgba(0,136,255,0.1)",
      borderColor: "rgba(0,136,255,0.5)",
      duration: 0.5,
      ease: "sine.inOut",
    },
    33.0 + i,
  );
}
mv(32.5, 820, 1612, 0.35);
down(33.0);
tl.to("#cta", { scale: 0.975, duration: 0.07, ease: "power2.out" }, 33.0);
tl.to("#cta", { scale: 1, duration: 0.25, ease: "back.out(3)" }, 33.07);
up(33.1);

// 35.5–36.0 reset: inputs → 0, circuit dissolves, UI returns to the frame-0 state (seamless loop; everything settles by ~35.92)
flip("tgA", 35.5, 0);
flip("tgB", 35.5, 0);
flip("tgC", 35.5, 0);
["FA", "FB", "FCIN", "FC1", "FOR", "FS2"].forEach((id) => unlit(id, 35.5, 0.2));
partOff("ha1", 35.5);
partOff("ha2", 35.5);
partOff("gOr", 35.5);
ledOff("ledS", 35.55);
ledOff("ledC", 35.55);
rowOff("faR7", 35.5);
tl.to("#faR7 .ck", { opacity: 0, duration: 0.2 }, 35.5);
tl.to(
  "#faR7 .bg",
  { borderColor: "rgba(0,136,255,0.75)", boxShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.01 },
  35.72,
);
tl.to("#ttFA", { opacity: 0, duration: 0.25 }, 35.5);
tl.to("#ttHA", { opacity: 1, duration: 0.3 }, 35.6);
tl.to("#cta1", { opacity: 0, duration: 0.2 }, 35.5);
tl.to("#cta0", { opacity: 1, duration: 0.3 }, 35.6);
banner(35.45, "bn0");
tl.to("#z75", { opacity: 0, duration: 0.2 }, 35.5);
tl.to("#z100", { opacity: 1, duration: 0.25 }, 35.6);
tl.fromTo(
  "#circ",
  { opacity: 1 },
  { opacity: 0, duration: 0.3, ease: "power2.out", immediateRender: false },
  35.55,
);
tl.fromTo(
  "#world",
  { scale: Z },
  { scale: 1, duration: 0.35, ease: "power2.inOut", immediateRender: false },
  35.55,
); // grid zooms back to 100 %
tl.fromTo(
  "#cursor",
  { x: 820, y: 1612 },
  { x: 540, y: 745, duration: 0.5, ease: "power3.inOut", immediateRender: false },
  35.5,
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

tl.to({}, { duration: 0.01 }, 35.99); // anchor the end of the 36.0 s timeline
window.__timelines["main"] = tl;
window.__timeline = tl;
tl.seek(0);
