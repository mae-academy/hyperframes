// ===== SVG 3D engine v2: flat-shaded solids, frustums, glass, discs, spheres, shadows, streamlines =====
const COL = { navy: "#0B1F3A", blue: "#1565FF", purple: "#7A3CFF", orange: "#F26B00", green: "#00945E", red: "#E5173F", gold: "#FFC21A", teal: "#18B5C8", steel: "#8195B0", steelD: "#5E7391", glass: "#BFE3F2", white: "#F6F9FF" };
const mix = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
const ease = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const cam = { yaw: -0.5, pitch: 0.3, dist: 24, tx: 0, ty: 0, tz: 0.5, cx: 1310, cy: 395, f: 1500 };
let camPos = [0, 0, 0], OUT = [], EA = 1, MS = 1, MC = [0, 0, 0];
const FLOORZ = -1.6;
function project(p) {
  const x = p[0] - cam.tx, y = p[1] - cam.ty, z = p[2] - cam.tz;
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  const x1 = x * cy + y * sy, y1 = -x * sy + y * cy;
  const dep = y1 * cp - z * sp + cam.dist, k = cam.f / dep;
  return [cam.cx + x1 * k, cam.cy - (y1 * sp + z * cp) * k, dep, k];
}
const projectM = (p) => (MS === 1 ? project(p) : project([MC[0] + (p[0] - MC[0]) * MS, MC[1] + (p[1] - MC[1]) * MS, MC[2] + (p[2] - MC[2]) * MS]));
function setCamPos() {
  const dx = -Math.cos(cam.pitch) * Math.sin(cam.yaw), dy = Math.cos(cam.pitch) * Math.cos(cam.yaw), dz = -Math.sin(cam.pitch);
  camPos = [cam.tx - dx * cam.dist, cam.ty - dy * cam.dist, cam.tz - dz * cam.dist];
}
const LIGHT = (() => { const v = [-0.45, -0.7, 0.65], n = Math.hypot(...v); return v.map((a) => a / n); })();
const shade = (col, n) => { const k = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]; let c = k > 0 ? mix(col, "#ffffff", k * 0.4) : mix(col, "#0B1F3A", -k * 0.3); if (k < -0.6) c = mix(c, "#9CC4FF", 0.1); return c; };
const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const facing = (n, fc) => vdot(n, vsub(camPos, fc)) > 0;
function rotP(p, ax, ang, pv) { const q = vsub(p, pv), c = Math.cos(ang), s = Math.sin(ang); let r; if (ax === "x") r = [q[0], q[1] * c - q[2] * s, q[1] * s + q[2] * c]; else if (ax === "y") r = [q[0] * c + q[2] * s, q[1], -q[0] * s + q[2] * c]; else r = [q[0] * c - q[1] * s, q[0] * s + q[1] * c, q[2]]; return [r[0] + pv[0], r[1] + pv[1], r[2] + pv[2]]; }
const rotN = (n, ax, ang) => rotP(n, ax, ang, [0, 0, 0]);
function poly(pts, fill, o, sw, bias, stroke) { if (o * EA > 0.01) OUT.push({ k: "p", pts, fill, op: o * EA, sw: sw === undefined ? 4 : sw, bias: bias || 0, stroke: stroke || COL.navy }); }
const FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]], [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]], [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];
// box; rot = [axis, angle(rad), pivot?]
function box(c, s, col, o = 1, rot) {
  if (o * EA <= 0.01) return;
  for (const [n0, vs] of FACES) {
    let pts = vs.map((v) => [c[0] + (v[0] * s[0]) / 2, c[1] + (v[1] * s[1]) / 2, c[2] + (v[2] * s[2]) / 2]);
    let n = n0, fc = [c[0] + (n0[0] * s[0]) / 2, c[1] + (n0[1] * s[1]) / 2, c[2] + (n0[2] * s[2]) / 2];
    if (rot) { const pv = rot[2] || c; pts = pts.map((p) => rotP(p, rot[0], rot[1], pv)); n = rotN(n0, rot[0], rot[1]); fc = rotP(fc, rot[0], rot[1], pv); }
    if (!facing(n, fc)) continue;
    OUT.push({ k: "p", pts, fill: shade(col, n), op: o * EA, sw: 4, bias: 0, stroke: COL.navy });
  }
}
const BAS = { x: [[1, 0, 0], [0, 1, 0], [0, 0, 1]], y: [[0, 1, 0], [1, 0, 0], [0, 0, 1]], z: [[0, 0, 1], [1, 0, 0], [0, 1, 0]] };
// frustum / cylinder along an axis. opt: {n, glass, caps, a0, a1 (arc), inner}
function cone(ax, c, len, r0, r1, col, o = 1, opt = {}) {
  if (o * EA <= 0.01) return;
  const n = opt.n || 20, [A, V, W] = BAS[ax], a0 = opt.a0 || 0, a1 = opt.a1 === undefined ? Math.PI * 2 : opt.a1, arc = a1 - a0;
  const P = (t, a) => { const r = lerp(r0, r1, t + 0.5), ca = Math.cos(a), sa = Math.sin(a); return [0, 1, 2].map((j) => c[j] + A[j] * t * len + (V[j] * ca + W[j] * sa) * r); };
  const vis = [];
  for (let i = 0; i < n; i++) {
    const am = a0 + ((i + 0.5) / n) * arc, ca = Math.cos(am), sa = Math.sin(am), nm = [0, 1, 2].map((j) => V[j] * ca + W[j] * sa);
    const fc = P(0, am), v = facing(nm, fc); vis.push(v);
    if (!opt.glass && !v) continue;
    const pts = [P(-0.5, a0 + (i / n) * arc), P(0.5, a0 + (i / n) * arc), P(0.5, a0 + ((i + 1) / n) * arc), P(-0.5, a0 + ((i + 1) / n) * arc)];
    const f = opt.glass ? mix(col, "#ffffff", 0.3) : shade(col, nm);
    OUT.push({ k: "p", pts, fill: f, op: o * EA * (opt.glass ? 0.2 : 1), sw: 1.5, bias: opt.glass ? -0.3 : 0, stroke: opt.glass ? f : f });
  }
  if (!opt.glass && arc >= Math.PI * 2 - 1e-6) for (let i = 0; i < n; i++) if (vis[i] !== vis[(i + n - 1) % n]) { const a = a0 + (i / n) * arc; OUT.push({ k: "l", pts: [P(-0.5, a), P(0.5, a)], col: COL.navy, sw: 4, op: o * EA, bias: -0.2 }); }
  if (opt.caps !== false && arc >= Math.PI * 2 - 1e-6) {
    for (const sg of [-1, 1]) {
      const ring = []; for (let i = 0; i < n; i++) ring.push(P(sg * 0.5, (i / n) * Math.PI * 2));
      const nm = A.map((v) => v * sg), fc = P(sg * 0.5, 0).map((v, j) => v - (V[j] * (sg ? r0 : r0) * (sg > 0 ? r1 / r1 : 1)) * 0 );
      const ctr = [0, 1, 2].map((j) => c[j] + A[j] * sg * 0.5 * len);
      if (opt.glass) { OUT.push({ k: "l", pts: ring.concat([ring[0]]), col: COL.navy, sw: 3, op: o * EA * 0.6, bias: -0.3 }); continue; }
      if (facing(nm, ctr)) OUT.push({ k: "p", pts: ring, fill: shade(col, nm), op: o * EA, sw: 4, bias: -0.1, stroke: COL.navy });
    }
  }
}
const cyl = (ax, c, len, r, col, o = 1, opt) => cone(ax, c, len, r, r, col, o, opt);
const glassCyl = (ax, c, len, r, o = 1, col = COL.glass) => cone(ax, c, len, r, r, col, o, { glass: true, n: 22 });
function ln(pts, col, sw = 4, o = 1, dash, doff, bias) { if (o * EA > 0.01 && pts.length > 1) OUT.push({ k: "l", pts, col, sw, op: o * EA, dash, doff: doff || 0, bias: bias || 0 }); }
function arw(p0, p1, col, sw = 8, o = 1) { if (o * EA > 0.01) OUT.push({ k: "a", pts: [p0, p1], col, sw, op: o * EA }); }
function dot(p, r, col, o = 1) { if (o * EA > 0.01) OUT.push({ k: "d", pts: [p], r, col, op: o * EA }); }
function ring(ax, c, r, col, sw = 4, o = 1, a0 = 0, a1 = Math.PI * 2, n = 28) {
  const [, V, W] = BAS[ax], pts = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; pts.push([0, 1, 2].map((j) => c[j] + (V[j] * Math.cos(a) + W[j] * Math.sin(a)) * r)); } ln(pts, col, sw, o);
}
function sph(c, r, col, o = 1, nb = 6, nl = 10) {
  if (o * EA <= 0.01) return;
  const P = (b, l) => { const th = (b / nb) * Math.PI, ph = (l / nl) * Math.PI * 2; return [c[0] + r * Math.sin(th) * Math.cos(ph), c[1] + r * Math.sin(th) * Math.sin(ph), c[2] + r * Math.cos(th)]; };
  for (let b = 0; b < nb; b++) for (let l = 0; l < nl; l++) {
    const q = [P(b, l), P(b + 1, l), P(b + 1, l + 1), P(b, l + 1)], m = [0, 1, 2].map((j) => (q[0][j] + q[1][j] + q[2][j] + q[3][j]) / 4 - c[j]), L = Math.hypot(...m), nm = m.map((v) => v / L);
    if (!facing(nm, q[0])) continue;
    OUT.push({ k: "p", pts: q, fill: shade(col, nm), op: o * EA, sw: 1.5, bias: 0, stroke: shade(col, nm) });
  }
}
// annular sector solid, disc face in the XZ plane (axis y). angles in rad; thickness th along y
function sect(c, r0, r1, a0, a1, th, col, o = 1, n) {
  if (o * EA <= 0.01) return; n = n || Math.max(2, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 36));
  const pt = (r, a, y) => [c[0] + r * Math.cos(a), c[1] + y, c[2] + r * Math.sin(a)];
  for (const sy of [-1, 1]) { const pts = []; for (let i = 0; i <= n; i++) pts.push(pt(r1, a0 + ((a1 - a0) * i) / n, (sy * th) / 2)); for (let i = n; i >= 0; i--) pts.push(pt(r0, a0 + ((a1 - a0) * i) / n, (sy * th) / 2)); if (facing([0, sy, 0], [c[0], c[1] + (sy * th) / 2, c[2]])) OUT.push({ k: "p", pts, fill: shade(col, [0, sy, 0]), op: o * EA, sw: 3, bias: 0, stroke: COL.navy }); }
  const rim = (r, a, sg) => { const pts = []; for (let i = 0; i < n; i++) { const A0 = a0 + ((a1 - a0) * i) / n, A1 = a0 + ((a1 - a0) * (i + 1)) / n, am = (A0 + A1) / 2, nm = [Math.cos(am) * sg, 0, Math.sin(am) * sg]; if (facing(nm, pt(r, am, 0))) OUT.push({ k: "p", pts: [pt(r, A0, -th / 2), pt(r, A1, -th / 2), pt(r, A1, th / 2), pt(r, A0, th / 2)], fill: shade(col, nm), op: o * EA, sw: 1.5, bias: 0, stroke: shade(col, nm) }); } };
  rim(r1, 0, 1); rim(r0, 0, -1);
  for (const a of [a0, a1]) { const nm = [-Math.sin(a) * (a === a0 ? -1 : 1), 0, Math.cos(a) * (a === a0 ? -1 : 1)]; const pts = [pt(r0, a, -th / 2), pt(r1, a, -th / 2), pt(r1, a, th / 2), pt(r0, a, th / 2)]; if (facing(nm, pt((r0 + r1) / 2, a, 0))) OUT.push({ k: "p", pts, fill: shade(col, nm), op: o * EA, sw: 3, bias: 0, stroke: COL.navy }); }
}
function shadow(c, sx, sy, o = 0.16) { const pts = []; for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; pts.push([c[0] + Math.cos(a) * sx, c[1] + Math.sin(a) * sy, FLOORZ + 0.02]); } OUT.push({ k: "p", pts, fill: COL.navy, op: o * EA, sw: 0, bias: 500, stroke: "none" }); }
const partial = (pts, fr) => { if (fr >= 1) return pts; if (fr <= 0) return []; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(...vsub(pts[i], pts[i - 1])); seg.push(l); L += l; } let want = L * fr; const out = [pts[0]]; for (let i = 0; i < seg.length; i++) { if (want >= seg[i]) { out.push(pts[i + 1]); want -= seg[i]; } else { const t = want / seg[i]; out.push([0, 1, 2].map((j) => pts[i][j] + (pts[i + 1][j] - pts[i][j]) * t)); break; } } return out; };
// green output bar with frame (v in 0..1); bipolar: v in -1..1 from baseline
function outBar(x, v, o = 1, z0 = -0.9, H = 3.4, y = 0) { ln([[x - 0.6, y - 0.7, z0], [x - 0.6, y - 0.7, z0 + H], [x + 0.6, y - 0.7, z0 + H], [x + 0.6, y - 0.7, z0], [x - 0.6, y - 0.7, z0]], COL.navy, 4, o * 0.35); const h = Math.abs(v) * H; box([x, y, z0 + (v >= 0 ? h / 2 : -h / 2)], [1.1, 1.1, Math.max(h, 0.03)], COL.green, o); }
const biBar = (x, v, o = 1, zb = 0.9, H = 1.9) => { box([x, 0, zb], [2.0, 1.5, 0.05], COL.steel, 0.55 * o); ln([[x - 1.0, -0.8, zb + 0.03], [x + 1.0, -0.8, zb + 0.03]], COL.navy, 4, o * 0.8); const h = Math.abs(v) * H; box([x, 0, zb + (v >= 0 ? h / 2 : -h / 2)], [1.1, 1.1, Math.max(h, 0.03)], COL.green, o); };
// streamlines inside a pipe: n lines at fractions of radius rf(x); flow offset advances dashes downstream
function streams(x0, x1, rf, off, o = 1, n = 5, col = COL.teal, sw = 4) {
  for (let k = 0; k < n; k++) { const f = n === 1 ? 0 : -0.8 + (1.6 * k) / (n - 1), pts = []; for (let i = 0; i <= 28; i++) { const x = lerp(x0, x1, i / 28); pts.push([x, 0, rf(x) * f]); } ln(pts, col, sw, o, "16 14", -off, -0.5); }
}
function pipeFlange(x, r, o = 1) { cyl("x", [x, 0, 0], 0.4, r + 0.35, COL.steel, o, { n: 22 }); }
const seeded = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- frame renderer ----------
const fmtPts = (a) => a.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ");
function renderPrims(prims) {
  const items = [];
  for (const p of prims) {
    const pr = p.pts.map(projectM);
    if (p.k !== "l" && pr.some((q) => q[2] < 2)) continue;
    const dep = pr.reduce((s, q) => s + q[2], 0) / pr.length;
    items.push([dep - (p.bias || 0), p, pr]);
  }
  items.sort((a, b) => b[0] - a[0]);
  let s = "";
  for (const [, p, pr] of items) {
    if (p.k === "p") s += `<polygon points="${fmtPts(pr)}" fill="${p.fill}" fill-opacity="${p.op.toFixed(3)}"${p.stroke === "none" || p.sw === 0 ? "" : ` stroke="${p.stroke}" stroke-opacity="${Math.min(1, p.op * 1.1).toFixed(3)}" stroke-width="${p.sw}" stroke-linejoin="round"`}/>`;
    else if (p.k === "l") { const ok = pr.filter((q) => q[2] >= 2); if (ok.length < 2) continue; s += `<polyline points="${fmtPts(ok)}" fill="none" stroke="${p.col}" stroke-opacity="${p.op.toFixed(3)}" stroke-width="${p.sw}" stroke-linecap="round" stroke-linejoin="round"${p.dash ? ` stroke-dasharray="${p.dash}" stroke-dashoffset="${((p.doff || 0) * 55).toFixed(1)}"` : ""}/>`; }
    else if (p.k === "d") s += `<circle cx="${pr[0][0].toFixed(1)}" cy="${pr[0][1].toFixed(1)}" r="${Math.max(3, p.r * pr[0][3]).toFixed(1)}" fill="${p.col}" fill-opacity="${p.op.toFixed(3)}" stroke="#fff" stroke-width="3" stroke-opacity="${p.op.toFixed(3)}"/>`;
    else if (p.k === "a") {
      const [a, b] = pr, ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 26 + p.sw * 2, W = 14 + p.sw, bx = b[0] - Math.cos(ang) * L * 0.6, by = b[1] - Math.sin(ang) * L * 0.6;
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 8) continue;
      s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" stroke="${p.col}" stroke-opacity="${p.op.toFixed(3)}" stroke-width="${p.sw}" stroke-linecap="round"/>`;
      const h = [[b[0], b[1]], [b[0] - Math.cos(ang) * L + (Math.sin(ang) * W) / 2, b[1] - Math.sin(ang) * L - (Math.cos(ang) * W) / 2], [b[0] - Math.cos(ang) * L - (Math.sin(ang) * W) / 2, b[1] - Math.sin(ang) * L + (Math.cos(ang) * W) / 2]];
      s += `<polygon points="${fmtPts(h)}" fill="${p.col}" fill-opacity="${p.op.toFixed(3)}"/>`;
    }
  }
  return s;
}
function gridSvg(op) {
  if (op <= 0.01) return ""; let s = ""; const R = 28, step = 2;
  for (let i = -R; i <= R; i += step) for (const seg of [[[i, -R, FLOORZ], [i, R, FLOORZ]], [[-R, i, FLOORZ], [R, i, FLOORZ]]]) {
    let a = project(seg[0]), b = project(seg[1]); const n = 2; if (a[2] < n && b[2] < n) continue;
    if (a[2] < n) { const t = (n - a[2]) / (b[2] - a[2]); a = project([seg[0][0] + (seg[1][0] - seg[0][0]) * t, seg[0][1] + (seg[1][1] - seg[0][1]) * t, FLOORZ]); }
    if (b[2] < n) { const t = (n - b[2]) / (a[2] - b[2]); b = project([seg[1][0] + (seg[0][0] - seg[1][0]) * t, seg[1][1] + (seg[0][1] - seg[1][1]) * t, FLOORZ]); }
    const fade = clamp(1.25 - ((a[2] + b[2]) / 2 - 10) / 42, 0.2, 1);
    s += `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#1565FF" stroke-opacity="${(0.14 * op * fade).toFixed(3)}" stroke-width="2"/>`;
  }
  return s;
}
function gizmoSvg(op) {
  if (op <= 0.01) return ""; const o = [850, 650], L = 60, cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), sp = Math.sin(cam.pitch), cp = Math.cos(cam.pitch);
  const v = (x, y, z) => { const x1 = x * cy + y * sy, y1 = -x * sy + y * cy; return [o[0] + x1 * L, o[1] - (y1 * sp + z * cp) * L]; };
  let s = ""; for (const [d, c, n] of [[[1, 0, 0], COL.orange, "x"], [[0, 1, 0], COL.navy, "y"], [[0, 0, 1], COL.red, "z"]]) { const e = v(...d); s += `<line x1="${o[0]}" y1="${o[1]}" x2="${e[0].toFixed(1)}" y2="${e[1].toFixed(1)}" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-opacity="${op}"/><text x="${(o[0] + (e[0] - o[0]) * 1.28).toFixed(1)}" y="${(o[1] + (e[1] - o[1]) * 1.28 + 10).toFixed(1)}" font-family="Inter" font-weight="900" font-size="32" fill="${c}" fill-opacity="${op}" text-anchor="middle">${n}</text>`; }
  return s;
}
