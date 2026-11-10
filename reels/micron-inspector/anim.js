// Timeline for "HOW A CAMERA MEASURES 31 MICRONS" (22.0 s).
// The picture (sensor image, pixel grid, gradient, edge points, circle fit, gauge, belt) is drawn on a canvas from
// the time alone; the banners, card rows, labels and counters are one GSAP timeline. Nothing depends on the previous frame.
(function () {
  const CFG = window.__CFG;
  const {
    S,
    T_PTS,
    K,
    WORLD,
    HOLE,
    ix0,
    iy0,
    patchI,
    patchG,
    rowXc,
    xe,
    nomX,
    gMax,
    pts,
    fit,
    dUm,
    TOL_UM,
    rows,
  } = CFG;
  const COL = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF" };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ramp = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const eio = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2); // power2.inOut
  const eout = (p) => 1 - Math.pow(1 - p, 3); // power2.out
  const FIN = 15.9; // the finished result shown on frame 0

  // ------------------------------------------------------------------ canvas
  const cvs = document.getElementById("cv");
  const ctx = cvs.getContext("2d");
  const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = 900 * DPR;
  cvs.height = 610 * DPR;
  const IMG = { x: 20, y: 25, s: 560 };
  const CX = IMG.x + 280,
    CY = IMG.y + 280; // screen position of the view centre
  const ZMAX = 56 / WORLD; // zoom at which one sensor pixel is 56 screen px
  const s2w = (v) => 280 + (v - 1750) * WORLD; // sensor px -> world px (full view)
  const PATCH_W = { x: s2w(ix0 + 5), y: s2w(iy0 + 5) };

  // the sensor image, rendered once (deterministic): backlit part, big bore, four mounting holes
  const prev = document.createElement("canvas");
  prev.width = prev.height = 560;
  (function () {
    const pc = prev.getContext("2d");
    const im = pc.createImageData(560, 560);
    const mounts = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].map(([a, b]) => [1750 + a * 1175, 1750 + b * 1175]);
    for (let y = 0; y < 560; y++)
      for (let x = 0; x < 560; x++) {
        const sx = 1750 + (x + 0.5 - 280) / WORLD,
          sy = 1750 + (y + 0.5 - 280) / WORLD;
        const cov = (d) => clamp(0.5 - d, 0, 1); // 1 px antialiased edge, d in world px
        let m = cov((Math.hypot(sx - HOLE.cx, sy - HOLE.cy) - HOLE.R) * WORLD);
        for (const [mx, my] of mounts)
          m = Math.max(m, cov((Math.hypot(sx - mx, sy - my) - 150) * WORLD));
        const qx = Math.abs(sx - 1750) - (1575 - 300),
          qy = Math.abs(sy - 1750) - (1575 - 300);
        const db =
          (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 300) *
          WORLD;
        m = Math.max(m, cov(-db));
        const v = CV.clip(CV.DARK + (CV.BRIGHT - CV.DARK) * m + CV.NOISE * CV.gauss(x, y, 3));
        const o = (y * 560 + x) * 4;
        im.data[o] = 10 + v * 0.96;
        im.data[o + 1] = 10 + v * 0.96;
        im.data[o + 2] = 16 + v * 0.94;
        im.data[o + 3] = 255;
      }
    pc.putImageData(im, 0, 0);
  })();
  const gray = (v) =>
    `rgb(${Math.round(10 + v * 0.96)},${Math.round(10 + v * 0.96)},${Math.round(16 + v * 0.94)})`;

  // ------------------------------------------------------------------ camera: zoom into the patch and back
  function zoomT(tau) {
    if (tau < S[2]) return 0;
    if (tau < 5.4) return eio(ramp(tau, 4.0, 5.4));
    if (tau < S[5]) return 1;
    if (tau < 11.6) return 1 - eio(ramp(tau, 10.8, 11.6));
    if (tau < S[6]) return 0;
    if (tau < 14.8) return eio(ramp(tau, 14.0, 14.8));
    return 1;
  }
  function view(tau) {
    const zt = zoomT(tau);
    const z = Math.exp(Math.log(ZMAX) * zt);
    const u = (1 - 1 / z) / (1 - 1 / ZMAX); // zoom toward the patch: it stays in view the whole way
    return { zt, z, cx: 280 + (PATCH_W.x - 280) * u, cy: 280 + (PATCH_W.y - 280) * u };
  }
  let V = view(0);
  const w2s = (wx, wy) => [CX + (wx - V.cx) * V.z, CY + (wy - V.cy) * V.z];
  const sen2s = (sx, sy) => w2s(s2w(sx), s2w(sy));
  const p2s = (u, v) => sen2s(ix0 + u, iy0 + v); // patch coordinates (px) -> screen

  function font(px) {
    ctx.font = `${px}px KaTeX_Main, serif`;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ------------------------------------------------------------------ vision view (steps 1 - 6)
  function drawVision(tau) {
    V = view(tau);
    const { z } = V;
    ctx.save();
    roundRect(IMG.x, IMG.y, IMG.s, IMG.s, 18);
    ctx.fillStyle = "rgba(10,10,16,.85)";
    ctx.fill();
    ctx.clip();
    // step 1: the sensor reads out row by row
    const rv = ramp(tau, 1.75, 3.3);
    const rows1 = tau < S[2] ? rv : 1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(IMG.x, IMG.y, IMG.s, IMG.s * rows1 + (rows1 >= 1 ? 2000 : 0));
    ctx.clip();
    const aS = 1 - ramp(z, 8, 40);
    if (aS > 0) {
      ctx.globalAlpha = aS;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(prev, CX - V.cx * z, CY - V.cy * z, 560 * z, 560 * z);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // pixel grid (the real sensor pixels) once the zoom is deep enough
    const aG = ramp(z, 25, 60);
    if (aG > 0) {
      const cs = WORLD * z;
      const sx0 = 1750 + (V.cx - 280 - 280 / z) / WORLD,
        sx1 = 1750 + (V.cx - 280 + 280 / z) / WORLD;
      const sy0 = 1750 + (V.cy - 280 - 280 / z) / WORLD,
        sy1 = 1750 + (V.cy - 280 + 280 / z) / WORLD;
      const gap = cs >= 20 ? 2 : 0;
      ctx.globalAlpha = aG;
      for (let iy = Math.floor(sy0); iy <= Math.ceil(sy1); iy++)
        for (let ix = Math.floor(sx0); ix <= Math.ceil(sx1); ix++) {
          const [x, y] = sen2s(ix, iy);
          ctx.fillStyle = gray(CV.pix(ix, iy, HOLE, 7));
          ctx.fillRect(x + gap / 2, y + gap / 2, cs - gap, cs - gap);
        }
      ctx.globalAlpha = 1;
    }
    // step 1 extras: sensor grid hint, read-out line, flash
    if (tau < 4.4) {
      const ag = 0.16 * (1 - ramp(tau, 3.6, 4.2));
      ctx.strokeStyle = `rgba(255,255,255,${ag})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        ctx.moveTo(IMG.x + k * 28, IMG.y);
        ctx.lineTo(IMG.x + k * 28, IMG.y + IMG.s);
        ctx.moveTo(IMG.x, IMG.y + k * 28);
        ctx.lineTo(IMG.x + IMG.s, IMG.y + k * 28);
      }
      ctx.stroke();
    }
    if (tau >= 1.75 && tau < 3.4) {
      const y = IMG.y + IMG.s * rv;
      ctx.fillStyle = COL.red;
      ctx.shadowColor = COL.red;
      ctx.shadowBlur = 14;
      ctx.fillRect(IMG.x, y - 2, IMG.s, 4);
      ctx.shadowBlur = 0;
    }
    if (tau >= S[1] && tau < S[1] + 0.3) {
      ctx.fillStyle = `rgba(255,255,255,${0.45 * (1 - (tau - S[1]) / 0.3)})`;
      ctx.fillRect(IMG.x, IMG.y, IMG.s, IMG.s);
    }
    // ring on the point we are about to zoom into
    if (tau >= 3.4 && tau < 5.2) {
      const [rx, ry] = w2s(PATCH_W.x, PATCH_W.y);
      const k = ramp(tau, 3.4, 3.6) * (1 - ramp(tau, 4.8, 5.2));
      ctx.strokeStyle = `rgba(255,0,68,${k})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(rx, ry, 18 + 4 * Math.sin((tau - 3.4) * 9) * (1 - V.zt), 0, 6.2832);
      ctx.stroke();
    }
    // step 2: numbers.  step 3: gradient numbers, heat, edge pixels
    if (V.zt > 0.99) {
      const cs = 56;
      const aI = ramp(tau, 5.4, 6.0) * (1 - ramp(tau, 6.6, 7.0));
      const aGn = ramp(tau, 6.6, 7.0) * (1 - ramp(tau, 10.6, 11.0));
      const aH = ramp(tau, 6.8, 7.6) * (1 - ramp(tau, 10.4, 10.9));
      for (let j = 0; j < 10; j++)
        for (let i = 0; i < 10; i++) {
          const x = IMG.x + i * cs,
            y = IMG.y + j * cs;
          const g = patchG[j][i];
          if (aH > 0) {
            ctx.fillStyle = `rgba(0,136,255,${aH * 0.85 * Math.min(1, Math.abs(g) / gMax)})`;
            ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          }
          const v = patchI[j][i];
          font(22);
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          if (aI > 0) {
            ctx.globalAlpha = aI;
            ctx.fillStyle = v > 130 ? "#0A0A10" : "#FFFFFF";
            ctx.fillText(String(v), x + cs / 2, y + cs / 2);
          }
          if (aGn > 0) {
            ctx.globalAlpha = aGn;
            const bright = aH > 0.5 && Math.abs(g) > gMax * 0.35;
            ctx.fillStyle = bright || v <= 130 ? "#FFFFFF" : "#0A0A10";
            ctx.fillText(String(Math.round(g)).replace("-", "−"), x + cs / 2, y + cs / 2);
          }
          ctx.globalAlpha = 1;
        }
    }
    // the working row (profile plot) and the strongest-gradient pixel of every row
    if (V.zt > 0.99 && tau >= 5.8 && tau < S[5]) {
      const [x, y] = p2s(0, 5);
      ctx.strokeStyle = "rgba(255,255,255,.9)";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 1.5, y + 1.5, 560 - 3, 56 - 3);
    }
    if (V.zt > 0.99 && tau >= 7.8 && tau < 10.8) {
      const a = ramp(tau, 7.8, 8.1);
      ctx.strokeStyle = `rgba(255,255,255,${a})`;
      ctx.lineWidth = 3;
      for (let j = 0; j < 10; j++) {
        let am = 0;
        patchG[j].forEach((g, i) => {
          if (Math.abs(g) > Math.abs(patchG[j][am])) am = i;
        });
        const [x, y] = p2s(am, j);
        ctx.strokeRect(x + 4, y + 4, 56 - 8, 56 - 8);
      }
    }
    // step 4: per-row centroids, then their mean
    if (tau >= 8.9) {
      for (let j = 0; j < 10; j++) {
        const a = ramp(tau, 8.9 + 0.07 * j, 9.0 + 0.07 * j) * (tau < S[5] ? 1 : 0);
        if (a <= 0) continue;
        const [x, y] = p2s(rowXc[j], j + 0.5);
        ctx.globalAlpha = a;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = COL.purple;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, 6.2832);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    if (tau >= 9.6) {
      const p = ramp(tau, 9.6, 10.0);
      const [x, y0] = p2s(xe, -1),
        [, y1] = p2s(xe, -1 + 12 * p);
      ctx.strokeStyle = COL.purple;
      ctx.lineWidth = 5;
      ctx.shadowColor = COL.purple;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // step 5: edge points on the contour, probe lines, then the fitted circle
    if (tau >= T_PTS[0]) {
      for (let k = 0; k < K; k++) {
        const a = ramp(tau, T_PTS[k], T_PTS[k] + 0.05);
        if (a <= 0) continue;
        const [x, y] = sen2s(pts[k].x, pts[k].y);
        const th = Math.PI + (k * 2 * Math.PI) / K;
        const pr = 1 - ramp(tau, T_PTS[k], T_PTS[k] + 0.4);
        if (pr > 0 && V.z < 3) {
          ctx.strokeStyle = `rgba(255,0,68,${pr})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 22 * Math.cos(th), y - 22 * Math.sin(th));
          ctx.lineTo(x + 22 * Math.cos(th), y + 22 * Math.sin(th));
          ctx.stroke();
        }
        if (V.z < 3 || k === 0) {
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = COL.red;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x, y, V.z < 3 ? 6 : 8, 0, 6.2832);
          ctx.fill();
          ctx.stroke();
        }
      }
    }
    if (tau >= 13.5 && V.z < 3) {
      const p = ramp(tau, 13.5, 14.0);
      const [x, y] = sen2s(fit.cx, fit.cy);
      ctx.strokeStyle = COL.purple;
      ctx.lineWidth = 4;
      ctx.shadowColor = COL.purple;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(x, y, fit.R * WORLD * V.z, Math.PI, Math.PI + 2 * Math.PI * eio(p));
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 9, y);
      ctx.lineTo(x + 9, y);
      ctx.moveTo(x, y - 9);
      ctx.lineTo(x, y + 9);
      ctx.stroke();
    }
    // step 6: the nominal edge and the gap
    if (tau >= 14.0) {
      const a = ramp(tau, 14.0, 14.4);
      const [x, y0] = p2s(nomX, -1),
        [, y1] = p2s(nomX, 11);
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * a})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 9]);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
      ctx.setLineDash([]);
      if (V.zt > 0.99) {
        const [xa] = p2s(xe, 0),
          [xb] = p2s(nomX, 0);
        const g = ramp(tau, 14.8, 15.1);
        ctx.strokeStyle = `rgba(176,38,255,${g})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(xa, 526);
        ctx.lineTo(xa + (xb - xa) * g, 526);
        ctx.moveTo(xa, 514);
        ctx.lineTo(xa, 538);
        ctx.moveTo(xa + (xb - xa) * g, 514);
        ctx.lineTo(xa + (xb - xa) * g, 538);
        ctx.stroke();
      }
    }
    // step 2 scale bar
    if (V.zt > 0.99 && tau >= 5.6 && tau < 6.6) {
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(IMG.x, 560);
      ctx.lineTo(IMG.x + 56, 560);
      ctx.moveTo(IMG.x, 550);
      ctx.lineTo(IMG.x, 570);
      ctx.moveTo(IMG.x + 56, 550);
      ctx.lineTo(IMG.x + 56, 570);
      ctx.stroke();
    }
    ctx.restore();
    // frame around the image
    roundRect(IMG.x, IMG.y, IMG.s, IMG.s, 18);
    ctx.strokeStyle = "rgba(255,255,255,.28)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // ---- right panel: profile plots (steps 2 - 4) and the tolerance gauge (step 6)
    const a1 = ramp(tau, 5.8, 6.2) * (1 - ramp(tau, 10.6, 10.9));
    const a2 = ramp(tau, 7.0, 7.4) * (1 - ramp(tau, 10.6, 10.9));
    const row = 5;
    if (a1 > 0) {
      ctx.globalAlpha = a1;
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(610, 240);
      ctx.lineTo(870, 240);
      ctx.moveTo(610, 70);
      ctx.lineTo(610, 240);
      ctx.stroke();
      ctx.strokeStyle = COL.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const x = 610 + (i + 0.5) * 26,
          y = 240 - (patchI[row][i] / 255) * 170;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < 10; i++) {
        ctx.globalAlpha = a1 * ramp(tau, 5.8 + 0.04 * i, 5.9 + 0.04 * i);
        ctx.fillStyle = COL.blue;
        ctx.beginPath();
        ctx.arc(610 + (i + 0.5) * 26, 240 - (patchI[row][i] / 255) * 170, 6, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (a2 > 0) {
      ctx.globalAlpha = a2;
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(610, 470);
      ctx.lineTo(870, 470);
      ctx.moveTo(610, 300);
      ctx.lineTo(610, 470);
      ctx.stroke();
      for (let i = 0; i < 10; i++) {
        const h = (Math.abs(patchG[row][i]) / (gMax * 1.1)) * 170;
        ctx.fillStyle = COL.red;
        ctx.fillRect(610 + (i + 0.5) * 26 - 9, 470 - h, 18, h);
      }
      ctx.globalAlpha = 1;
    }
    if (tau >= 9.6 && tau < 10.9) {
      const p = ramp(tau, 9.6, 10.0) * (1 - ramp(tau, 10.6, 10.9));
      const x = 610 + xe * 26;
      ctx.strokeStyle = `rgba(176,38,255,${p})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, 66);
      ctx.lineTo(x, 478);
      ctx.stroke();
    }
    if (tau >= 14.4) {
      const ag = ramp(tau, 14.4, 14.8);
      const gx = (v) => 740 + 2.6 * v;
      ctx.globalAlpha = ag;
      ctx.strokeStyle = "rgba(255,255,255,.45)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(gx(-50), 400);
      ctx.lineTo(gx(50), 400);
      for (let v = -50; v <= 50; v += 10) {
        ctx.moveTo(gx(v), 400);
        ctx.lineTo(gx(v), 400 + (v % 50 === 0 ? 14 : 8));
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(176,38,255,.2)";
      ctx.strokeStyle = COL.purple;
      ctx.lineWidth = 3;
      roundRect(gx(-TOL_UM), 372, gx(TOL_UM) - gx(-TOL_UM), 56, 6);
      ctx.fill();
      ctx.stroke();
      font(24);
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const v of [-50, 0, 50])
        ctx.fillText((v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v), gx(v), 444);
      const v = dUm * eout(ramp(tau, 14.9, 15.5));
      const bad = Math.abs(v) > TOL_UM;
      ctx.fillStyle = bad ? COL.red : "#FFFFFF";
      ctx.shadowColor = bad ? COL.red : "#FFFFFF";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(gx(v) - 13, 340);
      ctx.lineTo(gx(v) + 13, 340);
      ctx.lineTo(gx(v), 372);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------------ line view (sorting)
  const BELT = { y0: 250, y1: 430, yc: 340 },
    CAMX = 300,
    DIVX = 540,
    VBELT = 200;
  function part(x, y, s, o) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    roundRect(-75, -60, 150, 120, 14);
    ctx.fillStyle = o.bad ? "rgba(255,0,68,.14)" : "rgba(0,136,255,.18)";
    ctx.fill();
    ctx.strokeStyle = o.bad ? COL.red : COL.blue;
    ctx.lineWidth = o.bad ? 5 : 4;
    ctx.stroke();
    ctx.fillStyle = "#0A0A10";
    ctx.strokeStyle = "rgba(255,255,255,.6)";
    ctx.lineWidth = 2;
    for (const [a, b] of [
      [-54, -36],
      [54, -36],
      [-54, 36],
      [54, 36],
    ]) {
      ctx.beginPath();
      ctx.arc(a, b, 5, 0, 6.2832);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    if (o.bad) {
      ctx.strokeStyle = COL.red;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, 6.2832);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (o.tag) {
      ctx.globalAlpha = o.tag;
      ctx.fillStyle = "#0A0A10";
      ctx.strokeStyle = o.bad ? COL.red : "#FFFFFF";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 42, 15, 0, 6.2832);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      if (o.bad) {
        ctx.moveTo(-6, 36);
        ctx.lineTo(6, 48);
        ctx.moveTo(6, 36);
        ctx.lineTo(-6, 48);
      } else {
        ctx.moveTo(-7, 42);
        ctx.lineTo(-2, 47);
        ctx.lineTo(7, 37);
      }
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
  function drawBelt(tau) {
    const e = tau - 16.6;
    ctx.fillStyle = "rgba(255,255,255,.04)";
    ctx.fillRect(0, BELT.y0, 900, BELT.y1 - BELT.y0);
    ctx.strokeStyle = "rgba(255,255,255,.4)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, BELT.y0);
    ctx.lineTo(900, BELT.y0);
    ctx.moveTo(0, BELT.y1);
    ctx.lineTo(900, BELT.y1);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 3;
    const off = (VBELT * Math.max(0, e)) % 40;
    ctx.beginPath();
    for (let x = -40 + off; x < 940; x += 40) {
      ctx.moveTo(x, BELT.y0);
      ctx.lineTo(x, BELT.y0 + 12);
      ctx.moveTo(x, BELT.y1 - 12);
      ctx.lineTo(x, BELT.y1);
    }
    ctx.stroke();
    // camera
    ctx.setLineDash([7, 7]);
    ctx.strokeStyle = "rgba(176,38,255,.6)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(CAMX - 30, 206);
    ctx.lineTo(CAMX - 85, BELT.y0);
    ctx.moveTo(CAMX + 30, 206);
    ctx.lineTo(CAMX + 85, BELT.y0);
    ctx.stroke();
    ctx.setLineDash([]);
    roundRect(CAMX - 60, 150, 120, 56, 12);
    ctx.fillStyle = "rgba(10,10,16,.8)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = COL.red;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(CAMX, 178, 14, 0, 6.2832);
    ctx.stroke();
    ctx.fillStyle = COL.red;
    ctx.beginPath();
    ctx.arc(CAMX, 178, 5, 0, 6.2832);
    ctx.fill();
    // bin
    ctx.setLineDash([8, 7]);
    ctx.strokeStyle = "rgba(255,0,68,.55)";
    ctx.fillStyle = "rgba(255,0,68,.06)";
    ctx.lineWidth = 2.5;
    roundRect(460, 455, 160, 140, 18);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    // pusher
    const dy = 190 * eout(ramp(tau, 17.8, 18.2)) * (1 - eio(ramp(tau, 18.35, 18.85)));
    ctx.strokeStyle = "rgba(255,255,255,.7)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(DIVX, 40);
    ctx.lineTo(DIVX, 214 + dy);
    ctx.stroke();
    ctx.fillStyle = "#FFFFFF";
    roundRect(DIVX - 50, 214 + dy, 100, 16, 6);
    ctx.fill();
    // scan flashes
    for (const t0 of [16.6, 18.4]) {
      const a = 1 - ramp(tau, t0, t0 + 0.25);
      if (tau >= t0 && a > 0) {
        ctx.fillStyle = `rgba(255,0,68,${a})`;
        ctx.fillRect(CAMX - 2.5, BELT.y0, 5, BELT.y1 - BELT.y0);
      }
    }
    // part A (the defective one) and part B (a good one right behind it)
    const k = eout(ramp(tau, 17.8, 18.35));
    const ax = tau < 17.8 ? CAMX + VBELT * e : DIVX;
    part(ax, BELT.yc + 195 * k, 1 - 0.5 * k, { bad: tau >= 16.8, tag: ramp(tau, 16.85, 17.0) });
    const bx = CAMX + VBELT * (tau - 18.4);
    if (bx > -100 && bx < 1000) part(bx, BELT.yc, 1, { bad: false, tag: ramp(tau, 18.65, 18.8) });
  }

  // ------------------------------------------------------------------ the frame
  function draw(t) {
    // frame 0 shows the finished result, then a quick rewind into step 1
    const tau = t < 1.2 ? FIN : t < 1.6 ? FIN + (1.6 - FIN) * eio((t - 1.2) / 0.4) : t;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, 900, 610);
    const f = ramp(tau, 16.45, 16.8);
    if (f < 1) {
      ctx.globalAlpha = 1 - f;
      drawVision(Math.min(tau, 16.6));
      ctx.globalAlpha = 1;
    }
    if (f > 0) {
      ctx.globalAlpha = f;
      drawBelt(tau);
      ctx.globalAlpha = 1;
    }
    if (t >= 1.2 && t < 1.6) {
      // glitch tear while it rewinds: seeded bars, changing every frame
      const fr = Math.floor(t * 60);
      for (let b = 0; b < 12; b++) {
        const h = CV.hash(fr, b, 5);
        const y = h % 590,
          hh = 4 + ((h >>> 8) % 20);
        ctx.fillStyle = b % 2 ? "rgba(255,0,68,.22)" : "rgba(0,136,255,.22)";
        ctx.fillRect(((h >>> 16) % 60) - 30, y, 900, hh);
      }
    }
  }

  // ------------------------------------------------------------------ GSAP timeline: text, rows, labels, effects
  const tl = gsap.timeline({ paused: true });
  const ft = (target, from, to, at) =>
    tl.fromTo(target, from, Object.assign({ immediateRender: false }, to), at);
  const r3 = (v) => Math.round(v * 1000) / 1000;
  const show = (sel, at, dur = 0.2) =>
    ft(sel, { opacity: 0 }, { opacity: 1, duration: dur, ease: "power2.out" }, at);
  const hide = (sel, at, dur = 0.2) =>
    tl.to(sel, { opacity: 0, duration: dur, ease: "power1.in" }, at);

  // @CUES-BEGIN
  const CUES = [
    [0.0, "thump"], // opening impact on the finished result
    [1.2, "snap"], // rewind glitch
    [1.6, "click"], // step 1 capture
    [4.0, "click"], // step 2 zoom into the pixels
    [6.6, "click"], // step 3 gradient
    [8.8, "click"], // step 4 sub-pixel edge
    [10.8, "click"], // step 5 circle fit
    ...T_PTS.map((t) => [t, "tick"]), // one tick per edge point
    [14.0, "click"], // step 6 compare
    [15.3, "snap"], // the marker leaves the tolerance band: REJECT
    [16.6, "click"], // decision, the part moves to the pusher
    [17.8, "snap"], // pusher fires
    [18.6, "thump"], // lock: sorted
    [19.4, "snap"], // CTA reveal
    [21.0, "click"], // engagement pulse
  ];
  // @CUES-END
  const EXPORT = [];
  const used = new Set();
  function hit(t, kind, ref) {
    const i = CUES.findIndex((c) => c[0] === t && c[1] === kind);
    if (i < 0) throw new Error(`visual event at ${t}s (${kind}) has no CUES entry`);
    used.add(i);
    EXPORT.push({ t, kind, ref });
    return t;
  }
  function swap(o, n, t) {
    tl.to(o, { opacity: 0, duration: 0.15, ease: "power1.in" }, t);
    ft(n, { opacity: 0 }, { opacity: 1, duration: 0.15, ease: "power1.out" }, t + 0.075);
  }
  const burst = (el, r0, r1, dur, at) =>
    ft(
      el,
      { attr: { r: r0 }, opacity: 0.95 },
      { attr: { r: r1 }, opacity: 0, duration: dur, ease: "power2.out" },
      at,
    );

  // frame 0 is the finished result: these start visible and leave during the rewind
  const FINAL_DOM = ["#dres", "#dnom", "#ddel", "#gax", "#gtl", "#verd", "#chM", "#chN", "#chG"];
  gsap.set(FINAL_DOM, { opacity: 1 });

  // ---------------------------------------------------------------- hook: result, thump, rewind
  hit(0.0, "thump", "open");
  ft("#flash0", { opacity: 0.6 }, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
  ft("#card", { scale: 1.035 }, { scale: 1, duration: 0.45, ease: "power3.out" }, 0);
  hit(1.2, "snap", "rew");
  ft("#flashG", { opacity: 0.9 }, { opacity: 0, duration: 0.4, ease: "power2.out" }, 1.2);
  tl.to(FINAL_DOM, { opacity: 0, duration: 0.25, ease: "power1.in" }, 1.2);
  for (let i = rows.n - 1; i >= 0; i--) {
    const t0 = r3(1.2 + 0.05 * (rows.n - 1 - i));
    tl.to(`#rs${i},#ck${i}`, { opacity: 0, duration: 0.1 }, t0);
    ft(`#nm${i}`, { opacity: 0 }, { opacity: 1, duration: 0.1 }, t0);
    tl.to(`#rw${i}`, { opacity: 0.55, duration: 0.1 }, t0);
  }

  // ---------------------------------------------------------------- the six steps
  const RES = [3.5, 6.1, 8.3, 10.3, 13.95, 15.5];
  for (let n = 1; n <= 6; n++) {
    const i = n - 1,
      t0 = S[n],
      t1 = S[n + 1];
    hit(t0, "click", "stage:" + n);
    swap(n === 1 ? "#BA" : "#B" + (n - 1), "#B" + n, t0);
    ft(`#rb${i}`, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t0);
    ft(`#rw${i}`, { opacity: 0.55 }, { opacity: 1, duration: 0.15 }, t0);
    ft(`#rs${i}`, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" }, RES[i]);
    tl.to(`#rb${i}`, { opacity: 0, duration: 0.15 }, t1);
    tl.to(`#nm${i}`, { opacity: 0, duration: 0.1 }, t1);
    ft(`#ck${i}`, { opacity: 0 }, { opacity: 1, duration: 0.15 }, t1);
    ft(`#nm${i}`, { opacity: 0 }, { opacity: 1, duration: 0.1 }, t0); // number badge while active
  }

  // labels in the arena
  ["#s1a", "#s1b", "#s1c"].forEach((s, k) => show(s, 2.0 + 0.15 * k));
  hide("#s1a,#s1b,#s1c", 3.9);
  show("#pI", 5.8);
  show("#pG", 7.0);
  hide("#pI,#pG", 10.6);
  show("#chS", 5.6);
  hide("#chS", 6.5);
  show("#xeR", 9.9);
  show("#chM", 9.9);
  hide("#xeR,#chM", 10.7);
  show("#ep", 11.6);
  hide("#ep", 13.9);
  T_PTS.forEach((t, k) => {
    hit(t, "tick", "tick:" + k);
    tl.set("#pn" + k, { opacity: 1 }, t);
    tl.set("#pn" + k, { opacity: 0 }, k < K - 1 ? T_PTS[k + 1] : 14.0);
  });
  show("#dres", 13.95);
  show("#chM", 14.6);
  show("#chN", 14.8);
  show("#chG", 15.0);
  show("#dnom", 14.5);
  show("#gax,#gtl", 14.5);
  show("#ddel", 15.1);
  hit(15.3, "snap", "verd");
  ft(
    "#verd",
    { opacity: 0, scale: 1.2 },
    { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" },
    15.3,
  );
  hide(FINAL_DOM, 16.4, 0.3);

  // ---------------------------------------------------------------- sorting
  swap("#B6", "#B7", 16.6);
  hit(16.6, "click", "stage:7");
  ["#bl1", "#bl2", "#bl3", "#bl4", "#bl5"].forEach((s, k) => show(s, 16.7 + 0.1 * k));
  hit(17.8, "snap", "rej");
  burst("#ringR", 20, 110, 0.5, 17.8);
  const T_FINAL = hit(18.6, "thump", "final");
  ft("#sweep", { opacity: 0.9, x: 0 }, { x: 895, duration: 0.5, ease: "power2.inOut" }, T_FINAL);
  tl.to("#sweep", { opacity: 0, duration: 0.15 }, T_FINAL + 0.4);
  ft("#lockb", { opacity: 0 }, { opacity: 1, duration: 0.15 }, T_FINAL + 0.1);
  ft(
    "#lockk",
    { attr: { "stroke-dashoffset": 50 } },
    { attr: { "stroke-dashoffset": 0 }, duration: 0.3, ease: "power2.out" },
    T_FINAL + 0.15,
  );

  // ---------------------------------------------------------------- CTA
  swap("#B7", "#B8", S[8]);
  tl.to("#pA", { opacity: 0, duration: 0.1, ease: "power1.in" }, S[8] - 0.1);
  ft("#card", { scale: 1 }, { scale: 1.1, duration: 0.6, ease: "power2.inOut" }, S[8]);
  hit(S[8], "snap", "cta");
  ft("#ct1a,#ct1b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, S[8]);
  ft("#ct2a,#ct2b", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, S[8] + 0.15);
  ft("#ct3", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "power2.out" }, S[8] + 0.3);
  hit(21.0, "click", "pulse");
  ft("#ctaglow", { opacity: 0 }, { opacity: 0.9, duration: 0.2, ease: "power2.out" }, 21.0);
  tl.to("#ctaglow", { opacity: 0, duration: 0.5, ease: "power2.in" }, 21.3);
  ft(
    "#ct2a,#ct2b",
    { textShadow: "0 0 0px rgba(0,136,255,0)" },
    { textShadow: "0 0 18px #0088FF", duration: 0.25, ease: "power2.out" },
    21.0,
  );
  tl.to(
    "#ct2a,#ct2b",
    { textShadow: "0 0 0px rgba(0,136,255,0)", duration: 0.4, ease: "power2.in" },
    21.3,
  );

  tl.to({}, { duration: 0.0001 }, 21.9999);
  if (used.size !== CUES.length) throw new Error("some CUES entries have no visual event");
  window.__CUES = EXPORT.sort((a, b) => a.t - b.t);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  tl.eventCallback("onUpdate", () => draw(tl.time()));
  window.addEventListener("hf-seek", (e) => draw(e.detail.time));
  draw(0);
})();
