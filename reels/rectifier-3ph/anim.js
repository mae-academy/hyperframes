// Timeline for "THE THREE-PHASE HALF-WAVE RECTIFIER" (26.2 s).
// The circuit (conducting diode lit, the others faded), the three input waves and the output v_o = max(van, vbn, vcn) are drawn on a canvas
// from the time alone (hf-seek protocol); text, counters, read-outs and cards are GSAP.
// Everything is a pure function of timeline time: no callbacks, no clocks, no unseeded randomness.
(function () {
  const CFG = window.__CFG;
  const { T, SEG, COMM, PLOT, CKT, SRC_Y, PH } = CFG;
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const r3 = (v) => Math.round(v * 1000) / 1000;

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished circuit
    [1.6, "snap"], // rewind
    [2.2, "snap"], // source a and its wave
    [3.3, "snap"], // source b
    [4.4, "snap"], // source c
    [5.8, "click"], // one diode per phase
    [6.1, "click"], // D1
    [6.4, "click"], // D2
    [6.7, "click"], // D3
    [7.1, "click"], // the load
    [7.5, "click"], // the return to neutral
    [8.0, "click"], // the output voltage v_o
    [8.4, "click"], // the highest phase turns its diode on
    [8.85, "snap"], // D1 takes over at 30 degrees
    [10.65, "snap"], // D2 at 150
    [12.45, "snap"], // D3 at 270
    [14.25, "snap"], // D1 at 390
    [16.05, "snap"], // D2 at 510
    [17.85, "snap"], // D3 at 630
    [19.5, "thump"], // lock
    [20.5, "click"], // three pulses per cycle
    [22.0, "snap"], // CTA reveal
    [25.0, "click"], // engagement pulse
  ];
  // @CUES-END
  const EXPORT = [];
  const used = new Set();
  /** every cue is tied to the element that visibly appears at that instant (probed by verify.mjs) */
  function hit(t, kind, sel) {
    const i = CUES.findIndex((c) => c[0] === t && c[1] === kind);
    if (i < 0) throw new Error(`visual event at ${t}s (${kind}) has no CUES entry`);
    used.add(i);
    EXPORT.push({ t, kind, sel });
    return t;
  }
  let curBanner = "#bn0",
    curCount = "#c0",
    curForm = "#fm0";
  function bnSwap(n, t) {
    ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
    curBanner = n;
  }
  function cswap(n, t, pop) {
    ft(curCount, { opacity: 1 }, { opacity: 0, duration: pop ? 0.06 : 0.03, ease: "power1.in" }, t);
    ft(
      n,
      { opacity: 0, scale: pop ? 1.3 : 1.08 },
      {
        opacity: 1,
        scale: 1,
        duration: pop ? 0.28 : 0.1,
        ease: pop ? "back.out(2)" : "power2.out",
      },
      t,
    );
    curCount = n;
  }
  function fswap(n, t) {
    ft(curForm, { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.06);
    curForm = n;
  }
  const pop = (sel, at, y) =>
    ft(
      sel,
      { opacity: 0, y: y === undefined ? 10 : y },
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" },
      at,
    );

  // the labels of the finished circuit are on screen at frame 0; they leave with the rewind and come back one by one
  const HOOKED = ["#sl0", "#sl1", "#sl2", "#dl1", "#dl2", "#dl3", "#rl", "#nl", "#vo"];
  gsap.set(HOOKED.join(","), { opacity: 1 });
  gsap.set("#sg1,#sg2,#sg3,#sg4,#sg5,#sg6", { opacity: 1 });

  // ---------------------------------------------------------------- 0.0 - 2.2  the finished picture, then the rewind
  hit(0.0, "thump", "#flash0");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  hit(T.rewind0, "snap", "#rw");
  ft("#rw", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, T.rewind0);
  tl.fromTo(
    "#rw",
    { opacity: 1 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    T.rewind0 + 0.4,
  );
  [1, 2, 3, 4, 5].forEach((n, i) => cswap("#r" + n, r3(T.rewind0 + 0.08 * i), false));
  HOOKED.concat([
    "#lg0",
    "#lg1",
    "#lg2",
    "#lgo",
    "#sg1",
    "#sg2",
    "#sg3",
    "#sg4",
    "#sg5",
    "#sg6",
  ]).forEach((s) =>
    ft(s, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in" }, T.rewind0),
  );

  // ---------------------------------------------------------------- 2.2 - 5.5  three sources, 120 degrees apart
  T.ph.forEach((t0, k) => {
    hit(t0, "snap", "#s" + (k + 1));
    cswap("#s" + (k + 1), t0, true);
    fswap("#f" + (k + 1), t0);
    pop("#sl" + k, t0, 8);
    pop("#lg" + k, t0 + 0.1, 6);
  });
  bnSwap("#bnP", T.ph[0]);

  // ---------------------------------------------------------------- 5.8 - 8.4  the circuit closes: diodes, common node, load, return to neutral
  hit(T.bnC, "click", "#bnC");
  bnSwap("#bnC", T.bnC);
  T.dio.forEach((t0, k) => {
    hit(t0, "click", "#dl" + (k + 1));
    pop("#dl" + (k + 1), t0, 6);
  });
  hit(T.load, "click", "#rl");
  pop("#rl", T.load, 6);
  hit(T.ret, "click", "#bnR");
  bnSwap("#bnR", T.ret);
  pop("#nl", T.ret + 0.4, 6);
  hit(T.vo, "click", "#vo");
  pop("#vo", T.vo, 6);
  fswap("#f4", T.vo);

  // ---------------------------------------------------------------- 8.4 - 19.2  the cursor sweeps: the highest phase conducts, the output forms
  hit(T.sw0, "click", "#bnS1");
  bnSwap("#bnS1", T.sw0);
  ft("#s3", { opacity: 1 }, { opacity: 0, duration: 0.12, ease: "power1.in" }, T.sw0);
  pop("#lgo", T.sw0, 6);
  ["#sg1", "#sg2", "#sg3", "#sg4", "#sg5", "#sg6"].forEach((s) =>
    ft(s, { opacity: 0 }, { opacity: 0.25, duration: 0.3, ease: "power1.out" }, T.sw0 - 0.2),
  );
  COMM.forEach((tc, i) => {
    hit(tc, "snap", "#sg" + (i + 1));
    ft("#sg" + (i + 1), { opacity: 0.25 }, { opacity: 1, duration: 0.12, ease: "power2.out" }, tc);
  });
  bnSwap("#bnS2", T.bnS2);
  CFG.HUD.forEach((h, k) => {
    const a = r3(T.sw0 + 0.1 * k);
    if (k === 0)
      ft(
        "#" + h.id,
        { opacity: 0, scale: 1.08 },
        { opacity: 1, scale: 1, duration: 0.09, ease: "power2.out" },
        a,
      );
    else ft("#" + h.id, { opacity: 0 }, { opacity: 1, duration: 0.001, ease: "none" }, a);
    if (k < CFG.HUD.length - 1)
      ft("#" + h.id, { opacity: 1 }, { opacity: 0, duration: 0.001, ease: "none" }, r3(a + 0.1));
  });

  // ---------------------------------------------------------------- the lock
  const LK = T.lock;
  hit(LK, "thump", "#glow");
  ft("#glow", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power2.out" }, LK);
  tl.fromTo(
    "#glow",
    { opacity: 1 },
    { opacity: 0, duration: 0.9, ease: "power2.inOut", immediateRender: false },
    LK + 0.15,
  );
  const lastHud = "#" + CFG.HUD[CFG.HUD.length - 1].id;
  ft(lastHud, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "power1.in" }, LK + 0.2);
  cswap("#c0", LK + 0.4, true);
  fswap("#f5", LK + 0.5);
  ft(
    "#chkp",
    { opacity: 1, strokeDashoffset: 120 },
    { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" },
    LK + 0.35,
  );
  hit(T.banF, "click", "#bnF");
  bnSwap("#bnF", T.banF);

  // ---------------------------------------------------------------- CTA
  hit(T.card, "snap", "#card");
  ft(curBanner, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, T.card - 0.1);
  ft("#banner", { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "power1.in" }, T.card - 0.1);
  ft("#card", { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, T.card);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 0.1);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 0.4);
  ft("#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 0.7);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, T.card + 1.1);
  hit(T.pulse, "click", "#ctaglow");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.45, duration: 0.2, ease: "power2.out" }, T.pulse);
  tl.fromTo(
    "#ctaglow",
    { opacity: 0.45 },
    { opacity: 0, duration: 0.5, ease: "power2.in", immediateRender: false },
    T.pulse + 0.3,
  );

  tl.to({}, { duration: 0.0001 }, 26.1999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t || a.kind.localeCompare(b.kind));

  // ================================================================ canvas
  const cvs = document.getElementById("cv");
  const ctx = cvs.getContext("2d");
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = Math.round(1080 * DPR);
  cvs.height = Math.round(1920 * DPR);

  const WHITE = "#FFFFFF",
    PURPLE = "#B026FF";
  const D2R = Math.PI / 180;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => {
    v = clamp01(v);
    return v * v * (3 - 2 * v);
  };
  const easeOut = (v) => 1 - Math.pow(1 - clamp01(v), 3);
  const vk = (k, th) => Math.sin((th - 120 * k) * D2R);
  const vo = (th) => Math.max(vk(0, th), vk(1, th), vk(2, th));
  const act = (th) => {
    // how much of the load current phase k carries: 1 while it is the highest phase, a short smooth hand-over at the crossovers
    return [0, 1, 2].map((k) => {
      let m = -2;
      for (let j = 0; j < 3; j++) if (j !== k) m = Math.max(m, vk(j, th));
      return clamp01(0.5 + (vk(k, th) - m) / 0.16);
    });
  };
  const X = (deg) => PLOT.x0 + deg * PLOT.k;
  const Y = (v) => PLOT.zero - v * PLOT.amp;
  const PANEL = [90, 800, 900, 400];
  const CKTPANEL = [90, 340, 900, 440];

  function withClip(r, fn) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(r[0], r[1], r[2], r[3]);
    ctx.clip();
    fn();
    ctx.restore();
  }
  function poly(pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  }
  function line(pts, color, width, alpha, blur, dash) {
    if (pts.length < 2 || alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (dash) ctx.setLineDash(dash);
    if (blur) {
      ctx.shadowColor = color;
      ctx.shadowBlur = blur;
    }
    poly(pts);
    ctx.stroke();
    ctx.restore();
  }
  function plen(pts) {
    let s = 0;
    for (let i = 1; i < pts.length; i++)
      s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return s;
  }
  function upto(pts, p) {
    // the first fraction p of the path (by length)
    if (p >= 1) return pts;
    const total = plen(pts) * p;
    const out = [pts[0]];
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d >= total) {
        const u = d ? (total - acc) / d : 0;
        out.push([
          pts[i - 1][0] + u * (pts[i][0] - pts[i - 1][0]),
          pts[i - 1][1] + u * (pts[i][1] - pts[i - 1][1]),
        ]);
        return out;
      }
      out.push(pts[i]);
      acc += d;
    }
    return out;
  }
  function at(pts, s) {
    // the point at distance s along the path
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc + d >= s) {
        const u = d ? (s - acc) / d : 0;
        return [
          pts[i - 1][0] + u * (pts[i][0] - pts[i - 1][0]),
          pts[i - 1][1] + u * (pts[i][1] - pts[i - 1][1]),
        ];
      }
      acc += d;
    }
    return pts[pts.length - 1];
  }

  // ---------------------------------------------------------------- the circuit
  const { srcX, negX, dioX0, dioX1, busX, nodeY, loadX0, loadX1, rightX, retY } = CKT;
  const R = 34;
  const WIRE = "#FFFFFF";
  const zig = [];
  {
    zig.push([loadX0, nodeY]);
    const n = 6,
      w = (loadX1 - loadX0) / n;
    for (let i = 0; i < n; i++) zig.push([loadX0 + w * (i + 0.5), nodeY + (i % 2 ? 16 : -16)]);
    zig.push([loadX1, nodeY]);
  }
  const loadPath = [[busX, nodeY], ...zig, [rightX, nodeY]];
  const retPath = [
    [rightX, nodeY],
    [rightX, retY],
    [negX, retY],
    [negX, SRC_Y[2]],
  ];
  // the loop a phase's current follows: source -> diode -> bus -> load -> return -> source
  const loop = (k) => {
    const y = SRC_Y[k];
    return [
      [srcX + R, y],
      [busX, y],
      [busX, nodeY],
      [loadX0, nodeY],
      [loadX1, nodeY],
      [rightX, nodeY],
      [rightX, retY],
      [negX, retY],
      [negX, y],
      [srcX - R, y],
    ];
  };
  const SINE = Array.from({ length: 21 }, (_, i) => [
    srcX - 20 + (40 * i) / 20,
    -Math.sin((i / 20) * 2 * Math.PI) * 11,
  ]);

  function drawCircuit(S, t) {
    const sw = S.sweepW; // 0: plain circuit being built, 1: the diodes show who conducts
    const a = S.act;
    const phaseAlpha = (k) => (1 - sw) * 0.78 + sw * (0.2 + 0.8 * a[k]);
    withClip(CKTPANEL, () => {
      // neutral bus and the left wires of the sources
      for (let k = 0; k < 3; k++) {
        const p = S.pSrc[k];
        if (p <= 0.001) continue;
        line(
          upto(
            [
              [srcX - R, SRC_Y[k]],
              [negX, SRC_Y[k]],
            ],
            p,
          ),
          WIRE,
          3,
          0.55,
        );
        if (k > 0)
          line(
            upto(
              [
                [negX, SRC_Y[k - 1]],
                [negX, SRC_Y[k]],
              ],
              p,
            ),
            WIRE,
            3,
            0.55,
          );
      }
      // the common bus
      line(
        upto(
          [
            [busX, SRC_Y[0]],
            [busX, SRC_Y[2]],
          ],
          S.pBus,
        ),
        WIRE,
        3,
        0.55,
      );
      // the load and the return
      line(upto(loadPath, S.pLoad), WIRE, 3, 0.55);
      line(upto(retPath, S.pRet), WIRE, 3, 0.55);
      if (S.pBus > 0.5) {
        ctx.save();
        ctx.fillStyle = WIRE;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(busX, nodeY, 7, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
      // v_o: a double arrow across the load
      if (S.pVo > 0.01) {
        const p = S.pVo;
        line(
          upto(
            [
              [rightX, nodeY],
              [940, nodeY],
            ],
            p,
          ),
          PURPLE,
          2,
          0.6,
          0,
          [4, 5],
        );
        line(
          upto(
            [
              [rightX, retY],
              [940, retY],
            ],
            p,
          ),
          PURPLE,
          2,
          0.6,
          0,
          [4, 5],
        );
        line(
          upto(
            [
              [940, nodeY + 8],
              [940, retY - 8],
            ],
            p,
          ),
          PURPLE,
          3,
          0.95,
          8,
        );
        if (p > 0.9) {
          for (const [yy, dir] of [
            [nodeY + 2, 1],
            [retY - 2, -1],
          ]) {
            ctx.save();
            ctx.fillStyle = PURPLE;
            ctx.beginPath();
            ctx.moveTo(940, yy + dir * 0);
            ctx.lineTo(933, yy + dir * 16);
            ctx.lineTo(947, yy + dir * 16);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
      }
      for (let k = 0; k < 3; k++) {
        const y = SRC_Y[k],
          c = PH[k],
          al = phaseAlpha(k);
        // source
        if (S.pSrc[k] > 0.001) {
          ctx.save();
          ctx.globalAlpha = S.pSrc[k] * (0.35 + 0.65 * al);
          ctx.strokeStyle = c;
          ctx.lineWidth = 4;
          if (sw > 0.5 && a[k] > 0.5) {
            ctx.shadowColor = c;
            ctx.shadowBlur = 16;
          }
          ctx.beginPath();
          ctx.arc(srcX, y, R * (0.6 + 0.4 * S.pSrc[k]), 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();
          line(
            SINE.map(([x, yy]) => [x, y + yy]),
            c,
            3,
            S.pSrc[k] * (0.4 + 0.6 * al),
          );
        }
        // diode k and its wires
        const pd = S.pDio[k];
        if (pd > 0.001) {
          line(
            upto(
              [
                [srcX + R, y],
                [dioX0, y],
              ],
              pd,
            ),
            WIRE,
            3,
            0.55,
          );
          line(
            upto(
              [
                [dioX1, y],
                [busX, y],
              ],
              pd,
            ),
            WIRE,
            3,
            0.55,
          );
          const on = sw * a[k];
          ctx.save();
          ctx.globalAlpha = pd * (0.18 + 0.82 * ((1 - sw) * 0.78 + sw * a[k]));
          ctx.strokeStyle = on > 0.5 ? c : WIRE;
          ctx.lineWidth = 4;
          ctx.lineJoin = "round";
          if (on > 0.5) {
            ctx.shadowColor = c;
            ctx.shadowBlur = 22;
          }
          ctx.beginPath();
          ctx.moveTo(dioX0, y - 22);
          ctx.lineTo(dioX0, y + 22);
          ctx.lineTo(dioX1 - 4, y);
          ctx.closePath();
          ctx.stroke();
          ctx.globalAlpha *= 0.6 * on;
          ctx.fillStyle = c;
          ctx.fill();
          ctx.restore();
          line(
            [
              [dioX1, y - 22],
              [dioX1, y + 22],
            ],
            on > 0.5 ? c : WIRE,
            5,
            pd * (0.18 + 0.82 * ((1 - sw) * 0.78 + sw * a[k])),
            on > 0.5 ? 14 : 0,
          );
        }
      }
      // the current: the active phase's loop lights up and dots run around it
      if (S.flow) {
        const vv = vo(S.th);
        for (let k = 0; k < 3; k++) {
          const al = a[k] * sw;
          if (al < 0.03) continue;
          const path = loop(k),
            L = plen(path);
          line(path, PH[k], 4.5, 0.35 * al, 10);
          const off = (t * 300) % 70;
          for (let s = off; s < L; s += 70) {
            const [x, y] = at(path, s);
            ctx.save();
            ctx.globalAlpha = al * (0.55 + 0.45 * vv);
            ctx.shadowColor = PH[k];
            ctx.shadowBlur = 12;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(x, y, 5.5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------- the waves, the output and the conduction chart
  const STEP = 1;
  const wavePts = (k, upDeg) => {
    const pts = [];
    for (let th = 0; th <= upDeg + 1e-9; th += STEP) pts.push([X(th), Y(vk(k, th))]);
    return pts;
  };
  function drawPlot(S) {
    const sw = S.sweepW;
    const thOut = S.outFull ? 720 : S.th;
    withClip(PANEL, () => {
      // axes and grid
      line(
        [
          [PLOT.x0, PLOT.zero],
          [PLOT.x0 + 860, PLOT.zero],
        ],
        WHITE,
        2,
        0.4,
      );
      line(
        [
          [PLOT.x0, Y(1.1)],
          [PLOT.x0, Y(-1.1)],
        ],
        WHITE,
        2,
        0.4,
      );
      for (let d = 180; d <= 720; d += 180)
        line(
          [
            [X(d), Y(1.1)],
            [X(d), Y(-1.1)],
          ],
          WHITE,
          1,
          0.06,
        );
      // the dashed target: the output in full
      line(
        Array.from({ length: 721 }, (_, th) => [X(th), Y(vo(th))]),
        WHITE,
        2,
        0.12 * sw,
        0,
        [8, 10],
      );
      // the three input waves: bright while they are being drawn, dim once the sweep starts, bright where they conduct
      for (let k = 0; k < 3; k++) {
        const p = S.pw[k];
        if (p <= 0.001) continue;
        const full = wavePts(k, 720 * p);
        line(full, PH[k], 3.5, (1 - sw) * 0.85 + sw * 0.24, (1 - sw) * 8);
        if (sw > 0.01) {
          let seg = [];
          const flush = () => {
            if (seg.length > 1) line(seg, PH[k], 6, sw, 12);
            seg = [];
          };
          for (let th = 0; th <= thOut + 1e-9; th += STEP) {
            if (vk(k, th) >= Math.max(vk((k + 1) % 3, th), vk((k + 2) % 3, th)) - 1e-9)
              seg.push([X(th), Y(vk(k, th))]);
            else flush();
          }
          flush();
        }
      }
      // the output so far, with its area
      if (sw > 0.01 && thOut > 0) {
        const o = [];
        for (let th = 0; th <= thOut + 1e-9; th += STEP) o.push([X(th), Y(vo(th))]);
        ctx.save();
        ctx.globalAlpha = 0.16 * sw;
        ctx.fillStyle = PURPLE;
        poly([[X(0), Y(0)], ...o, [X(thOut), Y(0)]]);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        line(o, WHITE, 6.5, sw, 16);
        // the cursor
        line(
          [
            [X(S.th), Y(1.15)],
            [X(S.th), Y(-1.1)],
          ],
          WHITE,
          1.5,
          0.5 * sw,
          0,
          [6, 8],
        );
        const a = S.act;
        for (let k = 0; k < 3; k++) {
          ctx.save();
          ctx.globalAlpha = sw;
          ctx.shadowColor = PH[k];
          ctx.shadowBlur = 10 + 12 * a[k];
          ctx.fillStyle = a[k] > 0.5 ? WHITE : PH[k];
          ctx.beginPath();
          ctx.arc(X(S.th), Y(vk(k, S.th)), 5 + 4 * a[k], 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }
      }
      // the average, once the picture is complete
      if (S.avg > 0.001) {
        const y = Y(0.827);
        line(
          [
            [PLOT.x0, y],
            [PLOT.x0 + 860 * S.avg, y],
          ],
          PURPLE,
          3,
          0.95,
          10,
          [14, 9],
        );
      }
      // the conduction chart: which diode carries the load, lit as the cursor passes
      for (const [a0, b0, d] of SEG) {
        const x0 = X(a0),
          x1 = X(b0),
          k = d - 1;
        const done = clamp01((thOut - a0) / (b0 - a0));
        ctx.save();
        ctx.globalAlpha = 0.14 + 0.1 * (1 - sw);
        ctx.fillStyle = PH[k];
        ctx.fillRect(x0 + 1, 1116, x1 - x0 - 2, 30);
        if (sw > 0.01 && done > 0) {
          ctx.globalAlpha = sw * 0.85;
          if (done < 1) {
            ctx.shadowColor = PH[k];
            ctx.shadowBlur = 14;
          }
          ctx.fillRect(x0 + 1, 1116, (x1 - x0 - 2) * done, 30);
        }
        ctx.restore();
      }
    });
  }

  // ---------------------------------------------------------------- the state at time t
  function stateAt(t) {
    const hookState = {
      pSrc: [1, 1, 1],
      pDio: [1, 1, 1],
      pBus: 1,
      pLoad: 1,
      pRet: 1,
      pVo: 1,
      pw: [1, 1, 1],
      sweepW: 1,
      th: 100,
      flow: true,
      avg: 0,
    };
    if (t < T.rewind0) return { ...hookState, outFull: true, th: 100, act: act(100) };
    const S = {
      pSrc: T.ph.map((t0) => easeOut((t - t0) / 0.5)),
      pDio: T.dio.map((t0) => easeOut((t - t0) / 0.4)),
      pBus: easeOut((t - (T.dio[0] + 0.1)) / 0.7),
      pLoad: easeOut((t - T.load) / 0.5),
      pRet: clamp01((t - T.ret) / 0.6),
      pVo: easeOut((t - T.vo) / 0.4),
      pw: T.ph.map((t0) => easeOut((t - t0) / 1.0)),
      sweepW: smooth((t - (T.sw0 - 0.2)) / 0.3),
    };
    S.th = 720 * clamp01((t - T.sw0) / (T.sw1 - T.sw0));
    S.act = S.sweepW > 0.001 ? act(S.th) : [0, 0, 0];
    S.flow = S.sweepW > 0.05;
    S.avg = easeOut((t - (T.lock + 0.2)) / 0.8);
    return S;
  }
  function scene(S, t) {
    drawPlot(S);
    drawCircuit(S, t);
  }
  function drawGlitch(t) {
    const p = clamp01((t - T.rewind0) / (T.ph[0] - T.rewind0));
    const a = 1 - smooth(p);
    const S = stateAt(0);
    const frame = Math.floor(t * 24);
    const strips = 16,
      y0 = 340,
      sh = 860 / strips;
    for (let s = 0; s < strips; s++) {
      const g = CFG.glitch[(s * 7 + frame * 3) % CFG.glitch.length];
      const dx = (g - 0.5) * 2 * 110 * (0.25 + p);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.rect(0, y0 + s * sh, 1080, sh + 1);
      ctx.clip();
      ctx.translate(dx, 0);
      scene(S, 0);
      ctx.restore();
    }
    const sp = 4 + 14 * p;
    withClip(PANEL, () => {
      const o = Array.from({ length: 721 }, (_, th) => [X(th), Y(vo(th))]);
      line(
        o.map(([x, y]) => [x - sp, y]),
        PH[1],
        3,
        0.6 * a,
      );
      line(
        o.map(([x, y]) => [x + sp, y]),
        PH[0],
        3,
        0.6 * a,
      );
    });
  }
  function drawLock(t) {
    const u = t - T.lock;
    if (u < 0 || u > 1.3) return;
    const cx = 540,
      cy = 770;
    if (u < 0.5) {
      const g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 700);
      g.addColorStop(0, "rgba(176,38,255," + (0.3 * (1 - u / 0.5)).toFixed(3) + ")");
      g.addColorStop(1, "rgba(176,38,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1920);
    }
    if (u < 0.6) {
      const x = 90 + 900 * easeOut(u / 0.55);
      ctx.save();
      ctx.globalAlpha = 1 - smooth((u - 0.45) / 0.15);
      ctx.shadowColor = PURPLE;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.moveTo(x, 340);
      ctx.lineTo(x, 1200);
      ctx.strokeStyle = PURPLE;
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }
    [
      [90, 340],
      [990, 340],
      [90, 1200],
      [990, 1200],
    ].forEach(([x, y], i) => {
      const v = clamp01((u - 0.1 - i * 0.05) / 0.5);
      if (v <= 0 || v >= 1) return;
      const r = 20 * Math.sin(Math.PI * v) + 4;
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.shadowColor = "#fff";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x - r, y);
      ctx.lineTo(x + r, y);
      ctx.moveTo(x, y - r);
      ctx.lineTo(x, y + r);
      ctx.stroke();
      ctx.restore();
    });
    [
      [PURPLE, 660, 0, 0.7],
      ["#FF0044", 520, 0.1, 0.6],
    ].forEach(([c, Rr, d0, dur]) => {
      const v = clamp01((u - d0) / dur);
      if (v <= 0 || v >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - v;
      ctx.strokeStyle = c;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + Rr * easeOut(v), 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    });
    CFG.spark.forEach((sp, i) => {
      const v = clamp01((u - 0.05) / 0.8);
      if (v <= 0 || v >= 1) return;
      ctx.save();
      ctx.globalAlpha = 1 - v;
      ctx.fillStyle = i % 3 === 0 ? "#FF0044" : i % 3 === 1 ? PURPLE : "#fff";
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(sp.a) * sp.d * easeOut(v),
        cy + Math.sin(sp.a) * sp.d * easeOut(v),
        sp.r,
        0,
        2 * Math.PI,
      );
      ctx.fill();
      ctx.restore();
    });
  }

  function draw(t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, 1080, 1920);
    if (t < T.rewind0) scene(stateAt(t), t);
    else if (t < T.ph[0]) drawGlitch(t);
    else scene(stateAt(t), t);
    drawLock(t);
  }

  window.__SCHED = T;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (ev) => draw(ev.detail.time));
  draw(0);
})();
