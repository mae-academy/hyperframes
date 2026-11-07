// FOURIER EPICYCLES: SQUARE WAVE SYNTHESIS (22.0 s).
// The epicycles, the wave and the spectrum are drawn on a canvas from the time alone (hf-seek protocol);
// the text, counters and CTA are a GSAP timeline. Nothing depends on the previous frame.
(function () {
  const CFG = window.__CFG;
  const G = CFG.G,
    S = CFG.SCHED;
  const COL = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
  const OM = (2 * Math.PI) / G.T; // angular speed of the fundamental
  const R1 = (4 / Math.PI) * G.H; // radius of the first circle: 4/pi * plateau height
  const c3 = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2); // power2.inOut
  const out3 = (p) => 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3); // power2.out
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (x) => x * x * (3 - 2 * x);

  // ------------------------------------------------------------------ the one number everything follows: how many harmonics are present
  function Neff(t) {
    let v = S.start;
    for (const r of S.ramps) {
      if (t >= r.t1) v = r.to;
      else if (t >= r.t0) return r.from + (r.to - r.from) * c3((t - r.t0) / (r.t1 - r.t0));
      else break;
    }
    return v;
  }
  const wN = (n, N) => smooth(clamp(N - (n - 1), 0, 1)); // weight of the n-th odd harmonic (k = 2n - 1)
  const tauOf = (t) => (t < 1.6 ? t : t - 1.7); // phase clock of the fundamental
  const rigOff = (t) => (t < 1.6 ? 0 : t < 1.7 ? -300 : -300 * (1 - out3((t - 1.7) / 0.7)));
  const axisAlpha = (t) =>
    t < 1.3 ? 1 : t < 1.5 ? 1 - (t - 1.3) / 0.2 : t < 1.7 ? 0 : clamp((t - 1.7) / 0.3, 0, 1);
  const tgtAlpha = (t) =>
    t < 1.1 ? 1 : t < 1.5 ? 1 - (t - 1.1) / 0.4 : t < 1.7 ? 0 : clamp((t - 1.7) / 0.6, 0, 1);
  const sweepX = (t) => -90 + 1260 * c3(clamp((t - S.lock) / 0.42, 0, 1));

  const NMAX = 200;
  function sumAt(tp, N) {
    let s = 0;
    const nmax = Math.min(NMAX, Math.ceil(N));
    for (let n = 1; n <= nmax; n++) {
      const w = wN(n, N);
      if (w <= 0) continue;
      const k = 2 * n - 1;
      s += (w * Math.sin(k * OM * tp)) / k;
    }
    return (4 / Math.PI) * s;
  }

  // ------------------------------------------------------------------ canvas
  const cvs = document.getElementById("cv");
  const ctx = cvs.getContext("2d");
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = Math.round(1080 * DPR);
  cvs.height = Math.round(1920 * DPR);

  function mulberry(a) {
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function glow(color, blur) {
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
  }
  const noGlow = () => {
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
  };

  function strokePoly(pts, color, width, alpha, blur) {
    if (pts.length < 2 || alpha <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    if (blur) glow(color, blur);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  }

  function corners(t, dotx, tau) {
    // screen x of every jump of the square wave; returns [{m, x}] for jumps near the view
    const half = G.T / 2;
    const m0 = Math.ceil((tau - 7) / half),
      m1 = Math.floor((tau + 3) / half);
    const res = [];
    for (let m = m0; m <= m1; m++) res.push({ m, x: dotx - (tau - m * half) * G.SPEED });
    return res;
  }

  function draw(t) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, 1080, 1920);
    const N = Neff(t);
    const tau = tauOf(t);
    const off = rigOff(t);
    const dotx = G.DOTX + off;
    const ax = G.AX + off;
    const CY = G.CY;
    const preview = t < 0.9;
    const locked = t >= S.lock;
    const xs = locked ? sweepX(t) : preview ? 1e9 : -1e9; // x < xs : the "perfect square" look
    const hasRig = !(t >= 1.5 && t < 1.7) && !(t >= 1.6 && tau < 0);

    // --- axes
    const aa = axisAlpha(t);
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = COL.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CY);
    ctx.lineTo(1080, CY);
    ctx.stroke();
    ctx.globalAlpha = 0.34 * aa;
    ctx.beginPath();
    ctx.moveTo(ax, 716);
    ctx.lineTo(ax, 1336);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.globalAlpha = aa;
    ctx.beginPath();
    ctx.moveTo(ax, 688);
    ctx.lineTo(ax - 13, 716);
    ctx.lineTo(ax + 13, 716);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // --- ghost target: the perfect square wave, scrolling with the trace (dashed)
    const ta = tgtAlpha(t);
    const half = G.T / 2;
    if (ta > 0.01) {
      ctx.save();
      ctx.setLineDash([14, 12]);
      ctx.lineWidth = 2.2;
      const jumps = corners(t, dotx, tau);
      const sgnAfter = (m) => (m % 2 === 0 ? 1 : -1); // after the jump at tau = m*T/2 the wave is +1 for even m
      for (let i = 0; i < jumps.length; i++) {
        const a = jumps[i],
          b = jumps[i + 1] || { x: a.x + G.SPEED * half };
        const lvl = sgnAfter(a.m);
        const exact = a.x < xs && b.x < xs;
        ctx.strokeStyle = exact ? COL.purple : COL.white;
        ctx.globalAlpha = ta * (exact ? 0.5 : 0.3);
        ctx.beginPath();
        ctx.moveTo(a.x, CY - lvl * G.H);
        ctx.lineTo(b.x, CY - lvl * G.H);
        ctx.stroke();
        ctx.globalAlpha = ta * 0.26;
        ctx.strokeStyle = COL.white;
        ctx.beginPath();
        ctx.moveTo(a.x, CY - G.H * 1.0);
        ctx.lineTo(a.x, CY + G.H * 1.0);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- the epicycle chain (circles + red radius arms)
    let tipx = ax,
      tipy = CY;
    if (hasRig) {
      let cx = ax,
        cy = CY;
      const nmax = Math.min(NMAX, Math.ceil(N));
      for (let n = 1; n <= nmax; n++) {
        const w = wN(n, N);
        if (w <= 0) continue;
        const k = 2 * n - 1;
        const r = (R1 / k) * w;
        const ang = k * OM * tau;
        const nx = cx + r * Math.cos(ang),
          ny = cy - r * Math.sin(ang);
        if (r > 0.45) {
          ctx.save();
          ctx.globalAlpha = (n < 6 ? 0.85 : 0.6) * aa;
          ctx.strokeStyle = COL.purple;
          ctx.lineWidth = n < 3 ? 2.4 : 1.6;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.globalAlpha = 0.9 * aa;
          ctx.strokeStyle = COL.red;
          ctx.lineWidth = n < 3 ? 3 : 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          ctx.restore();
        }
        cx = nx;
        cy = ny;
      }
      tipx = cx;
      tipy = cy;
    }

    // --- the trace is a RECORD: every point keeps the shape it had at the moment the dot drew it.
    //     Adding a harmonic only changes the points drawn from then on; the old part never changes.
    if (hasRig) {
      const xa = t >= 1.6 ? Math.max(-20, dotx - tau * G.SPEED) : -20;
      const xb = dotx;
      const aHist = t < 1.2 ? 1 : t < 1.55 ? clamp(1 - (t - 1.2) / 0.35, 0, 1) : t < 1.7 ? 0 : 1; // the preview's record fades out in the rewind
      const glitch = t >= 0.9 && t < 1.5;
      const twOf = (x) => t - (dotx - x) / G.SPEED; // the moment the dot drew the point that is now at screen x
      const fuseOf = (x) => {
        const tw = twOf(x);
        const byTime = tw < 0.9 ? 1 : tw < 1.3 ? 1 - (tw - 0.9) / 0.4 : tw >= S.lock ? 1 : 0;
        return locked && x < xs ? 1 : byTime; // the sweep line only recolours; it never reshapes
      };
      const mixCol = (f) => `rgb(${Math.round(0 + 176 * f)},${Math.round(136 - 98 * f)},255)`; // blue -> purple
      const pts = [];
      for (let x = xa; x <= xb; x += 0.5) {
        const tw = twOf(x);
        pts.push([x, CY - G.H * sumAt(tauOf(tw), Neff(tw))]);
      }
      if (pts.length > 1 && aHist > 0.001) {
        const span = Math.max(1, xb - xa);
        const g = ctx.createLinearGradient(xa, 0, xb, 0);
        const keys = [xa, xb];
        for (const tk of [0.9, 1.3, S.lock]) {
          const kx = dotx - (t - tk) * G.SPEED;
          if (kx > xa && kx < xb) keys.push(kx - 0.5, kx + 0.5);
        }
        if (locked) keys.push(clamp(xs - 0.5, xa, xb), clamp(xs + 0.5, xa, xb));
        for (let i = 0; i <= 24; i++) keys.push(xa + (span * i) / 24);
        keys.sort((p, q) => p - q);
        for (const kx of keys) g.addColorStop(clamp((kx - xa) / span, 0, 1), mixCol(fuseOf(kx)));
        ctx.save();
        ctx.globalAlpha = aHist;
        ctx.strokeStyle = g;
        ctx.lineWidth = 7;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        glow(preview || locked ? COL.purple : COL.blue, 16);
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
        ctx.restore();
        strokePoly(pts, COL.white, 2.4, 0.65 * aHist, 0);
        if (glitch) {
          const gx = 7 * Math.sin(t * 91) + 3;
          strokePoly(
            pts.map((p) => [p[0] + gx, p[1]]),
            COL.red,
            3,
            0.7 * aHist,
            0,
          );
          strokePoly(
            pts.map((p) => [p[0] - gx, p[1]]),
            COL.blue,
            3,
            0.7 * aHist,
            0,
          );
        }
      }
      // connector + dot
      ctx.save();
      ctx.globalAlpha = 0.9 * aa;
      ctx.setLineDash([10, 9]);
      ctx.strokeStyle = COL.white;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(tipx, tipy);
      ctx.lineTo(dotx, tipy);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      glow(COL.white, 22);
      ctx.fillStyle = COL.white;
      ctx.beginPath();
      ctx.arc(dotx, tipy, 11, 0, Math.PI * 2);
      ctx.fill();
      noGlow();
      ctx.fillStyle = COL.red;
      ctx.beginPath();
      ctx.arc(dotx, tipy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // --- perfect-square look: glints on the sharp corners, shock rings, sweep, sparks
    const lookExact = preview || locked;
    if (lookExact && hasRig) {
      const jumps = corners(t, dotx, tau);
      const t0 = locked ? S.lock : 0;
      for (const j of jumps) {
        if (j.x < -30 || j.x > 1110 || j.x > xs) continue;
        // time at which the sweep reaches this corner (bisection); preview corners are lit from t = 0
        let te = t0;
        if (locked) {
          let lo = S.lock,
            hi = S.lock + 0.42;
          const xcAt = (tt) => dotx - (tauOf(tt) - j.m * half) * G.SPEED;
          for (let i = 0; i < 18; i++) {
            const mid = (lo + hi) / 2;
            if (sweepX(mid) >= xcAt(mid)) hi = mid;
            else lo = mid;
          }
          te = hi;
          if (te > t) continue;
        }
        const pulse = 0.65 + 0.35 * Math.sin(2 * Math.PI * (t * 1.6 + j.m * 0.31));
        for (const end of [-1, 1]) {
          const px = j.x,
            py = CY + end * G.H;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          glow(COL.purple, 26);
          ctx.fillStyle = "rgba(255,255,255," + (0.85 * pulse).toFixed(3) + ")";
          const s = 15 * pulse + 5;
          ctx.beginPath();
          ctx.moveTo(px, py - s * 1.9);
          ctx.lineTo(px + s * 0.28, py - s * 0.28);
          ctx.lineTo(px + s * 1.9, py);
          ctx.lineTo(px + s * 0.28, py + s * 0.28);
          ctx.lineTo(px, py + s * 1.9);
          ctx.lineTo(px - s * 0.28, py + s * 0.28);
          ctx.lineTo(px - s * 1.9, py);
          ctx.lineTo(px - s * 0.28, py - s * 0.28);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          // sparks thrown off the corner when the sweep (or, in the preview, the opening slam) hits it
          const dt = t - te;
          if (locked && dt >= 0 && dt < 0.8) {
            const rnd = mulberry(j.m * 977 + (end > 0 ? 5 : 11));
            for (let q = 0; q < 8; q++) {
              const a = (end < 0 ? -Math.PI / 2 : Math.PI / 2) + (rnd() - 0.5) * 2.6;
              const sp = 140 + rnd() * 260;
              const x = px + Math.cos(a) * sp * dt + (t - te) * -G.SPEED * 0.0;
              const y = py + Math.sin(a) * sp * dt + 380 * dt * dt * 0.5;
              const al = 1 - dt / 0.8;
              ctx.save();
              ctx.globalAlpha = al;
              ctx.strokeStyle = [COL.white, COL.purple, COL.red, COL.blue][q % 4];
              ctx.lineWidth = 3;
              ctx.lineCap = "round";
              glow(ctx.strokeStyle, 8);
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x - Math.cos(a) * 14 * al, y - Math.sin(a) * 14 * al);
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }
    }
    // shock rings from the dot (opening slam and lock)
    const rings = [];
    if (t < 1.0) rings.push((t - 0) / 0.8, (t - 0.12) / 0.8);
    if (t >= S.lock) rings.push((t - S.lock) / 0.9, (t - S.lock - 0.14) / 0.9);
    for (let i = 0; i < rings.length; i++) {
      const p = rings[i];
      if (p < 0 || p > 1) continue;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = (1 - p) * 0.95;
      ctx.strokeStyle = i % 2 ? COL.white : COL.purple;
      ctx.lineWidth = 7 * (1 - p) + 1.5;
      glow(COL.purple, 20);
      ctx.beginPath();
      ctx.arc(dotx, tipy, 24 + 520 * out3(p), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // the sweep line
    if (locked && t < S.lock + 0.5) {
      const x = sweepX(t);
      const g = ctx.createLinearGradient(x - 130, 0, x + 30, 0);
      g.addColorStop(0, "rgba(176,38,255,0)");
      g.addColorStop(0.7, "rgba(176,38,255,.55)");
      g.addColorStop(0.97, "rgba(255,255,255,.95)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.fillRect(x - 130, 640, 160, 700);
      ctx.restore();
    }

    // --- harmonic spectrum (the sound's ingredient list): one bar per harmonic, height 1/k
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = COL.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(130, G.SB);
    ctx.lineTo(950, G.SB);
    ctx.stroke();
    ctx.restore();
    for (let i = 0; i < G.NBARS; i++) {
      const n = i + 1,
        k = 2 * n - 1;
      const w = wN(n, N);
      if (w <= 0.01) continue;
      const bh = Math.max(4, (G.HMAX * w) / k);
      const x = G.BARX0 + i * G.BARP,
        y = G.SB - bh;
      const growing = w < 0.98;
      const fused = (preview || locked) && !growing;
      const wave = locked ? 0.5 + 0.5 * Math.sin(2 * Math.PI * (t * 1.3 - i * 0.07)) : 0;
      ctx.save();
      ctx.globalAlpha = 0.95;
      const col = growing ? COL.purple : fused ? COL.purple : COL.blue;
      glow(growing ? COL.white : col, growing ? 22 : 10 + 14 * wave);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.roundRect(x, y, G.BARW, bh, 6);
      ctx.fill();
      noGlow();
      ctx.fillStyle = "rgba(255,255,255,.85)";
      ctx.fillRect(x, y, G.BARW, 3);
      ctx.restore();
    }
  }

  // ------------------------------------------------------------------ GSAP timeline: text, counters, CTA
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening slam: the finished square wave
    [0.0, "stab"], // square-wave stab (preview of infinity)
    [0.9, "tick"], // rewind: N = 50
    [1.0, "tick"], //          N = 15
    [1.1, "tick"], //          N = 7
    [1.2, "tick"], //          N = 3
    [1.3, "tick"], //          N = 1
    [1.7, "snap"], // the first circle slides in
    [4.6, "click"], // N = 3
    [7.6, "click"], // N = 7
    [10.2, "click"], // N = 15
    [12.8, "click"], // N = 50
    [15.2, "click"], // N -> infinity
    [16.2, "thump"], // LOCK: perfect square
    [16.2, "stab"], //  square-wave stab
    [16.2, "snap"], //  corners lock
    [16.7, "click"], // the check mark lands
    [18.6, "snap"], // CTA reveal
    [19.5, "click"], // cursor presses the button
    [19.7, "tick"], // cursor grabs the slider
    [20.9, "click"], // slider reaches infinity
  ];
  // @CUES-END
  const EXPORT = [];
  const used = new Set();
  function hit(t, kind, ref) {
    const i = CUES.findIndex((c, ix) => c[0] === t && c[1] === kind && !used.has(ix));
    if (i < 0) throw new Error(`visual event at ${t}s (${kind}) has no CUES entry`);
    used.add(i);
    EXPORT.push({ t, kind, ref });
    return t;
  }

  // counter + formula states (hard switch, with a pop on the new counter)
  const seq = [
    [0.0, "sINF"],
    [0.9, "s50"],
    [1.0, "s15"],
    [1.1, "s7"],
    [1.2, "s3"],
    [1.3, "s1"],
    [4.6, "s3"],
    [7.6, "s7"],
    [10.2, "s15"],
    [12.8, "s50"],
    [15.2, "sINF"],
  ];
  seq.forEach(([t, id], i) => {
    if (i > 0) tl.set("#" + seq[i - 1][1], { opacity: 0 }, t);
    tl.set("#" + id, { opacity: 1 }, t);
    if (i > 0) {
      ft("#" + id + "n", { scale: 1.3 }, { scale: 1, duration: 0.2, ease: "back.out(2)" }, t);
      const kind = t < 2 ? "tick" : "click";
      hit(t, kind, "count:" + id);
    }
  });
  gsap.set("#sINFn", { textShadow: `0 0 26px ${COL.purple}` });
  tl.set("#sINFn", { textShadow: "0 0 0px rgba(176,38,255,0)" }, 0.9);
  ft(
    "#sINFn",
    { textShadow: "0 0 0px rgba(176,38,255,0)" },
    { textShadow: `0 0 30px ${COL.purple}`, duration: 0.3, ease: "power2.out" },
    15.2,
  );

  // banner captions (0.15 s out, 0.075 s overlap, 0.15 s in)
  const caps = [
    [0.9, "cA", "cB"],
    [1.7, "cB", "c1"],
    [4.6, "c1", "c3"],
    [7.6, "c3", "c7"],
    [10.2, "c7", "c15"],
    [12.8, "c15", "c50"],
    [15.2, "c50", "cX"],
    [S.lock, "cX", "cI"],
  ];
  caps.forEach(([t, o, n]) => {
    tl.to("#" + o, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft("#" + n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
  });

  // the opening slam
  hit(0.0, "thump", "slam");
  hit(0.0, "stab", "square-preview");
  ft("#flash0", { opacity: 0.85 }, { opacity: 0, duration: 0.9, ease: "power2.out" }, 0);

  // rig engages
  hit(1.7, "snap", "engage");

  // lock: flash + check mark + glow on N = infinity
  const LK = S.lock;
  hit(LK, "thump", "lock");
  hit(LK, "stab", "square-lock");
  hit(LK, "snap", "corners");
  ft("#lockflash", { opacity: 0 }, { opacity: 0.9, duration: 0.14, ease: "power2.out" }, LK);
  tl.to("#lockflash", { opacity: 0, duration: 0.7, ease: "power2.in" }, LK + 0.14);
  ft("#sINFn", { scale: 1 }, { scale: 1.18, duration: 0.14, ease: "power2.out" }, LK);
  tl.to("#sINFn", { scale: 1, duration: 0.5, ease: "power3.out" }, LK + 0.14);
  hit(16.7, "click", "check");
  tl.set("#chk", { opacity: 1 }, 16.48);
  ft(
    "#chkp",
    { attr: { "stroke-dashoffset": 150 } },
    { attr: { "stroke-dashoffset": 0 }, duration: 0.22, ease: "power2.out" },
    16.48,
  );
  ft("#chk", { scale: 1.35 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, 16.7);

  // ------------------------------------------------------------------ CTA (the stage dims, the glass card takes over)
  hit(18.6, "snap", "cta");
  tl.to("#stage", { opacity: 0.13, duration: 0.5, ease: "power2.inOut" }, 18.6);
  ft("#cta", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, 18.6);
  ft("#ctacard", { scale: 0.94 }, { scale: 1, duration: 0.45, ease: "power3.out" }, 18.6);
  ft("#ct1", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 18.65);
  ft("#ct2", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 18.8);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 18.95);
  ft("#btn", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 19.05);
  ft("#slid", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 19.15);
  ft("#hnd", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, 19.25);
  // oversized cursor: enters from below, tip on the button centre (540, 1080), click ignites the slider
  const TIP = { x: 25, y: 15 }; // arrow tip inside the 120 px cursor
  const curAt = (x, y) => ({ x: x - TIP.x, y: y - TIP.y });
  ft(
    "#cursor",
    Object.assign({ opacity: 1 }, curAt(640, 2060)),
    Object.assign({ duration: 0.65, ease: "power3.out" }, curAt(540, 1082)),
    18.85,
  );
  hit(19.5, "click", "press");
  tl.to(
    "#cursor",
    { scale: 0.84, duration: 0.1, ease: "power2.in", transformOrigin: "21% 14%" },
    19.5,
  );
  tl.to(
    "#cursor",
    { scale: 1, duration: 0.22, ease: "power2.out", transformOrigin: "21% 14%" },
    19.6,
  );
  tl.to("#btn", { scale: 0.94, duration: 0.1, ease: "power2.in" }, 19.5);
  tl.to("#btn", { scale: 1, duration: 0.25, ease: "power2.out" }, 19.6);
  ft(
    "#rip",
    { opacity: 0.9, scale: 1 },
    { opacity: 0, scale: 1.12, duration: 0.5, ease: "power2.out" },
    19.5,
  );
  // cursor walks to the knob and drags it to infinity
  tl.to("#cursor", Object.assign({ duration: 0.2, ease: "power2.inOut" }, curAt(294, 1208)), 19.52);
  hit(19.7, "tick", "grab");
  ft("#trkf", { opacity: 0 }, { opacity: 1, duration: 0.05 }, 19.7);
  ft("#knob", { x: 0 }, { x: 500, duration: 1.2, ease: "power1.inOut" }, 19.7);
  ft(
    "#trkf",
    { scaleX: 0.02, transformOrigin: "0% 50%" },
    { scaleX: 1, duration: 1.2, ease: "power1.inOut" },
    19.7,
  );
  ft(
    "#cursor",
    Object.assign({}, curAt(294, 1208)),
    Object.assign({ duration: 1.2, ease: "power1.inOut" }, curAt(794, 1208)),
    19.7,
  );
  hit(20.9, "click", "infinity");
  ft(
    "#infr",
    { opacity: 0.95, scale: 1 },
    { opacity: 0, scale: 1.5, duration: 0.5, ease: "power2.out" },
    20.9,
  );
  ft(
    "#knob",
    { boxShadow: `0 0 14px ${COL.purple}` },
    { boxShadow: `0 0 34px ${COL.purple}`, duration: 0.2, ease: "power2.out" },
    20.9,
  );
  tl.to("#cursor", { x: 1220, y: 1165, duration: 0.55, ease: "power2.in" }, 21.15);

  tl.to({}, { duration: 0.0001 }, 21.9999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t || a.kind.localeCompare(b.kind));
  window.__SCHED = S;
  window.__draw = draw;
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  window.addEventListener("hf-seek", (e) => draw(e.detail.time));
  draw(0);
})();
