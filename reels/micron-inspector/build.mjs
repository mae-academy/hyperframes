// THE MICRON INSPECTOR: AI VISION ON A CNC LINE (15.0 s).
//   node build.mjs  ->  index.html (GSAP from cdnjs) + dist/index.html (GSAP vendored, for offline render)
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const katexMod = require("./vendor/katex/katex.min.cjs");
const katex = katexMod.renderToString ? katexMod : katexMod.default;

const C = { red: "#FF0044", blue: "#0088FF", purple: "#B026FF", white: "#FFFFFF" };
const W = 1080,
  H = 1920,
  DUR = 15;

// ------------------------------------------------------------------ line geometry (canvas px) and timing
const V = 200; // belt speed, px / s
const XC = 600; // camera axis
const XD = 840; // diverter axis
const BELT_Y = 620; // belt centre line
const T_DIV = (XD - XC) / V; // camera -> diverter travel time
const SCANS = [2.4, 4.2, 6.0, 7.8]; // part i is centred under the camera at SCANS[i]
const PITCH = 360; // px between parts
const BIN = { x: [800, 880], y: 894, s: 0.5 }; // where the two rejected parts come to rest

// ------------------------------------------------------------------ the measurement (real maths, asserted)
// 1 px = 8 um at the part. A backlit hole of nominal diameter 20 mm is 2500 px wide on the line scan.
// Each edge is a step blurred by the optics (sigma 1.2 px). Sub-pixel edge = centroid of |gradient|.
const UM_PX = 8,
  SIGMA = 1.2,
  NOM = 20.0,
  TOL_UM = 15;
function erf(x) {
  const s = Math.sign(x),
    a = Math.abs(x),
    t = 1 / (1 + 0.3275911 * a);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-a * a);
  return s * y;
}
const stepProfile = (u, edge, rising) => {
  const v = 0.5 * (1 + erf((u - edge) / (SIGMA * Math.SQRT2)));
  return rising ? v : 1 - v;
};
// sample the pixels around an edge (pixel centres at integer u), centroid of the gradient
function subpixelEdge(trueEdge, rising) {
  const k0 = Math.round(trueEdge);
  let sw = 0,
    swu = 0;
  for (let k = k0 - 5; k <= k0 + 5; k++) {
    const g = (stepProfile(k + 1, trueEdge, rising) - stepProfile(k - 1, trueEdge, rising)) / 2;
    sw += Math.abs(g);
    swu += Math.abs(g) * k;
  }
  return swu / sw;
}
const TRUE_D = [20.004, 20.031, 19.996, 19.962]; // CNC output, mm (what the camera must recover)
let worstUm = 0;
const parts = TRUE_D.map((D, i) => {
  const dpx = (D * 1000) / UM_PX;
  const c = 1300 + 0.37 * i; // hole centre on the scan line, deliberately off the pixel grid
  const uL = subpixelEdge(c - dpx / 2, true),
    uR = subpixelEdge(c + dpx / 2, false);
  const meas = ((uR - uL) * UM_PX) / 1000; // mm
  const err = Math.abs(meas - D) * 1000; // um
  worstUm = Math.max(worstUm, err);
  const mm = Math.round(meas * 1000) / 1000;
  const dUm = Math.round((mm - NOM) * 1000);
  return { i, mm, dUm, reject: Math.abs(dUm) > TOL_UM, errUm: err };
});
(function assertMath() {
  if (worstUm >= 1)
    throw new Error("sub-pixel measurement error " + worstUm.toFixed(3) + " um >= 1 um");
  const want = [false, true, false, true];
  parts.forEach((p, i) => {
    if (p.reject !== want[i]) throw new Error("verdict of part " + (i + 1) + " is wrong");
  });
  SCANS.forEach((s, i) => {
    const x0 = XC - V * s;
    if (Math.abs(x0 + V * s - XC) > 1e-9) throw new Error("part not under camera at scan");
    if (i && Math.abs((SCANS[i] - SCANS[i - 1]) * V - PITCH) > 1e-9) throw new Error("pitch");
  });
  if (Math.abs(XC + V * T_DIV - XD) > 1e-9) throw new Error("diverter distance");
  // while a rejected part is under the diverter no other part is within a part width of it
  parts.forEach((p, i) => {
    if (!p.reject) return;
    const tR = SCANS[i] + T_DIV;
    SCANS.forEach((s, j) => {
      if (j !== i && Math.abs(XC + V * (tR - s) - XD) < 150)
        throw new Error("collision at diverter");
    });
  });
  console.log(
    `maths ok: 1 px = ${UM_PX} um; sub-pixel edge error worst ${worstUm.toFixed(3)} um (< 1 um); ` +
      parts
        .map(
          (p) =>
            `P${p.i + 1} ${p.mm.toFixed(3)} mm (${p.dUm >= 0 ? "+" : ""}${p.dUm} um) ${p.reject ? "REJECT" : "PASS"}`,
        )
        .join("; "),
  );
})();

// ------------------------------------------------------------------ helpers
const tx = (s) => {
  let h;
  try {
    h = katex.renderToString(s, { throwOnError: true, output: "html", strict: "error" });
  } catch (e) {
    throw new Error("KaTeX failed on: " + s + " -> " + String(e.message).slice(0, 200));
  }
  return h;
};
const it = (s) => `\\textit{${s}}`;
const col = (c, s) => `\\textcolor{${c}}{${s}}`;
let L = {};
try {
  L = JSON.parse(fs.readFileSync(new URL("./layout.json", import.meta.url), "utf8"));
} catch {
  L = {};
}
const M = (k) => L[k] || { cx: 0, cy: 0, w: 120, h: 50 };
function box({
  id,
  cx,
  cy,
  w,
  h,
  size,
  color,
  html,
  cls = "",
  m = false,
  style = "",
  left = false,
  right = false,
}) {
  const l = left || right ? cx : cx - w / 2;
  const just = left ? "justify-content:flex-start;" : right ? "justify-content:flex-end;" : "";
  return `<div ${id ? `id="${id}"` : ""} class="t ${cls}" ${m ? `data-m="${id}"` : ""} style="left:${l}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;font-size:${size}px;color:${color};${just}${style}">${html}</div>`;
}
const BOOKMARK = (s) =>
  `<svg width="${s}" height="${Math.round(s * 1.3)}" viewBox="0 0 24 32" style="margin-left:14px;flex:none"><path d="M3 2h18v28l-9-7-9 7z" fill="${C.red}"/></svg>`;
const GLYPH = (s, c = "#fff") =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5" fill="none" stroke="${c}" stroke-width="2.2"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="${c}" stroke-width="2.2"/><circle cx="17.6" cy="6.4" r="1.3" fill="${c}"/></svg>`;
const CHECK = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none;margin-right:10px"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CROSS = (s) =>
  `<svg width="${s}" height="${s}" viewBox="0 0 24 24" style="flex:none;margin-right:10px"><path d="M5 5l14 14M19 5L5 19" fill="none" stroke="${C.red}" stroke-width="3" stroke-linecap="round"/></svg>`;
const sgn = (v) => (v > 0 ? "+" : v < 0 ? "-" : "") + Math.abs(v);

// ------------------------------------------------------------------ zone 1: header
const header = `
<div id="flash0"></div>
${box({ id: "wm", cx: 540, cy: 640, w: 1000, h: 130, size: 100, color: C.red, html: tx(it("@MAE.Academy")), style: "opacity:.12" }).replace(`id="wm"`, `id="wm" data-layout-ignore`)}
${box({ id: "h-title", cx: 540, cy: 180, w: 1000, h: 90, size: 58, color: C.red, html: tx("\\textbf{\\textit{THE MICRON INSPECTOR}}"), style: "text-shadow:0 0 22px rgba(255,0,68,.35)" })}
${box({ id: "h-sub", cx: 540, cy: 232, w: 1000, h: 50, size: 35, color: C.purple, html: tx(it("AI VISION ON A CNC LINE")) })}
<div id="h-rule" style="position:absolute;left:480px;top:268px;width:120px;height:3px;border-radius:2px;background:linear-gradient(90deg,${C.red},${C.purple},${C.blue})"></div>`;

// ------------------------------------------------------------------ zone 2: arena (plate 90..990 x 340..950, canvas coordinates)
const BAND = { y0: 530, y1: 710 };
const ticks = [];
for (let x = -3040; x <= 1040; x += 40)
  ticks.push(
    `<line x1="${x}" y1="${BAND.y0}" x2="${x}" y2="${BAND.y0 + 12}"/><line x1="${x}" y1="${BAND.y1 - 12}" x2="${x}" y2="${BAND.y1}"/>`,
  );

// one CNC part, local origin at its centre: 150 x 120 plate, 20 mm bore, four mounting holes
const HOLE_R = 24;
const partSvg = (p) => {
  const burr = `<path d="M${(HOLE_R * Math.cos(0.7)).toFixed(1)},${(HOLE_R * Math.sin(0.7)).toFixed(1)}l-11,-3l4,-9z" fill="${C.red}"/>`;
  return `<g id="p${p.i}">
  <rect x="-80" y="-65" width="160" height="130" fill="none" stroke="none"/>
  <rect id="pb${p.i}" x="-75" y="-60" width="150" height="120" rx="14" fill="rgba(0,136,255,.18)" stroke="${C.blue}" stroke-width="4"/>
  <rect id="pr${p.i}" x="-75" y="-60" width="150" height="120" rx="14" fill="rgba(255,0,68,.14)" stroke="${C.red}" stroke-width="5" style="opacity:0"/>
  ${[
    [-54, -36],
    [54, -36],
    [-54, 36],
    [54, 36],
  ]
    .map(
      ([x, y]) =>
        `<circle cx="${x}" cy="${y}" r="5" fill="#0A0A10" stroke="rgba(255,255,255,.6)" stroke-width="2"/>`,
    )
    .join("")}
  <circle cx="0" cy="0" r="${HOLE_R}" fill="#0A0A10" stroke="#fff" stroke-width="3"/>
  <g id="dm${p.i}" style="opacity:0"><line x1="${-HOLE_R}" y1="0" x2="${HOLE_R}" y2="0" stroke="${C.purple}" stroke-width="3.5"/><line x1="${-HOLE_R}" y1="-9" x2="${-HOLE_R}" y2="9" stroke="${C.purple}" stroke-width="3.5"/><line x1="${HOLE_R}" y1="-9" x2="${HOLE_R}" y2="9" stroke="${C.purple}" stroke-width="3.5"/></g>
  <circle id="ok${p.i}" cx="0" cy="0" r="${HOLE_R}" fill="none" stroke="${C.purple}" stroke-width="4" style="opacity:0"/>
  ${p.reject ? (p.dUm > 0 ? `<circle id="df${p.i}" cx="0" cy="0" r="${HOLE_R + 4}" fill="none" stroke="${C.red}" stroke-width="4" stroke-dasharray="6 5" style="opacity:0"/>` : `<g id="df${p.i}" style="opacity:0">${burr}</g>`) : ""}
  <g id="tg${p.i}" style="opacity:0"><circle cx="0" cy="42" r="15" fill="#0A0A10" stroke="${p.reject ? C.red : "#fff"}" stroke-width="3"/>${p.reject ? `<path d="M-6,36l12,12M6,36l-12,12" stroke="${C.red}" stroke-width="3.2" stroke-linecap="round"/>` : `<path d="M-7,42l5,5l9,-10" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`}</g>
</g>`;
};

// HUD (stacked readouts, one per part)
const hline = (t) =>
  `<div style="height:34px;display:flex;align-items:center;font-size:26px;color:#fff">${tx(t)}</div>`;
const hud = parts
  .map(
    (p) =>
      `<div id="hd${p.i}" class="rd" style="opacity:0">${hline(it("PART 0") + (p.i + 1))}${hline("\\varnothing=" + col(C.blue, p.mm.toFixed(3)) + "\\ mm")}${hline("\\Delta=" + col(p.reject ? C.red : C.purple, sgn(p.dUm)) + "\\ \\mu m")}${hline(col(p.reject ? C.red : "#FFFFFF", it(p.reject ? "REJECT" : "PASS")))}</div>`,
  )
  .join("");

const plate = `
<div id="plate"><div id="pc">
  <svg id="g" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.purple}" stop-opacity=".55"/><stop offset="1" stop-color="${C.purple}" stop-opacity=".05"/></linearGradient>
    </defs>
    <g id="arena" style="opacity:.3">
      <rect x="90" y="${BAND.y0}" width="900" height="${BAND.y1 - BAND.y0}" fill="rgba(255,255,255,.04)"/>
      <line x1="90" y1="${BAND.y0}" x2="990" y2="${BAND.y0}" stroke="rgba(255,255,255,.4)" stroke-width="2.5"/>
      <line x1="90" y1="${BAND.y1}" x2="990" y2="${BAND.y1}" stroke="rgba(255,255,255,.4)" stroke-width="2.5"/>
      <g id="ticks" stroke="rgba(255,255,255,.35)" stroke-width="3">${ticks.join("")}</g>
      <path d="M${XC - 30},431L${XC - 85},${BAND.y0}M${XC + 30},431L${XC + 85},${BAND.y0}" stroke="${C.purple}" stroke-width="2.5" stroke-dasharray="7 7" opacity=".6"/>
      <rect x="${XC - 60}" y="375" width="120" height="56" rx="12" fill="rgba(10,10,16,.8)" stroke="rgba(255,255,255,.7)" stroke-width="3"/>
      <circle cx="${XC}" cy="403" r="14" fill="none" stroke="${C.red}" stroke-width="4"/><circle cx="${XC}" cy="403" r="5" fill="${C.red}"/>
      <rect x="${XD - 50}" y="${BAND.y0 - 36}" width="100" height="16" rx="6" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2.5" stroke-dasharray="5 5"/>
      <rect x="760" y="790" width="160" height="140" rx="18" fill="rgba(255,0,68,.06)" stroke="rgba(255,0,68,.55)" stroke-width="2.5" stroke-dasharray="8 7"/>
    </g>
    <circle id="ringI" cx="${XC}" cy="403" r="10" fill="none" stroke="${C.blue}" stroke-width="4" style="opacity:0"/>
    <circle id="ringR" cx="${XD}" cy="${BELT_Y}" r="10" fill="none" stroke="${C.red}" stroke-width="4" style="opacity:0"/>
    <g id="ret" style="opacity:0" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round">
      <path d="M${XC - 95},${BELT_Y - 62}v-22h22M${XC + 95},${BELT_Y - 62}v-22h-22M${XC - 95},${BELT_Y + 62}v22h22M${XC + 95},${BELT_Y + 62}v22h-22" transform="translate(0,0)"/>
    </g>
    <rect id="scanline" x="${XC - 2.5}" y="${BAND.y0}" width="5" height="${BAND.y1 - BAND.y0}" fill="${C.red}" style="opacity:0;filter:drop-shadow(0 0 8px ${C.red})"/>
    <g id="arm" style="opacity:.95"><line x1="${XD}" y1="345" x2="${XD}" y2="${BAND.y0 - 36}" stroke="rgba(255,255,255,.7)" stroke-width="6" stroke-linecap="round"/><rect x="${XD - 50}" y="${BAND.y0 - 36}" width="100" height="16" rx="6" fill="#fff"/></g>
    ${parts.map(partSvg).join("")}
    <rect id="sweep" x="90" y="340" width="5" height="610" fill="${C.purple}" style="opacity:0;filter:drop-shadow(0 0 10px ${C.purple})"/>
    <g id="lockb" transform="translate(725,447)" style="opacity:0;filter:drop-shadow(0 0 8px ${C.purple})"><circle id="lockc" r="32" fill="rgba(10,10,16,.8)" stroke="${C.purple}" stroke-width="4"/><path id="lockk" d="M-14,2L-4,13L15,-10" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="50" stroke-dashoffset="50"/></g>
  </svg>
  ${box({ cx: 180, cy: 745, w: 190, h: 28, size: 24, color: "rgba(255,255,255,.6)", html: tx(it("FROM CNC ") + "\\rightarrow"), cls: "axl", left: true }).replace("left:180px", "left:110px")}
  ${box({ cx: 905, cy: 745, w: 140, h: 28, size: 24, color: "rgba(255,255,255,.6)", html: tx("\\rightarrow" + it(" PASS")), cls: "axl", right: true }).replace("left:905px", "left:765px")}
  ${box({ cx: 840, cy: 806, w: 150, h: 28, size: 24, color: C.red, html: tx(it("REJECT BIN")), cls: "axl" })}
  <div id="hud" style="opacity:0">
    <div class="hbg"></div>
    ${hud}
  </div>
</div></div>`;

// ------------------------------------------------------------------ zone 3: banner (820x100, y 980 - 1080)
const BN = { x: 130, y: 980, w: 820, h: 100 };
const ba = (id, html, on = false) =>
  `<div id="${id}" class="ba" style="opacity:${on ? 1 : 0}">${html}</div>`;
const banner = `<div id="banner">
${ba("BA", `<div class="l1">${tx(it("THE EYE MISSES 30 MICRONS..."))}</div><div class="l2">${tx(it("THE CAMERA DOES NOT."))}</div>`, true)}
${ba("BB", `<div class="row c">${tx(it("SUBPIXEL EDGE FIT: 8 ") + "\\mu m" + it(" PIXELS RESOLVE ") + "\\lt 1\\,\\mu m")}</div>`)}
${ba("BC", `<div class="row c">${tx("|\\Delta|\\gt 15\\,\\mu m" + "\\implies" + it(" REJECTED IN ") + "1.2\\,s")}</div>`)}
${ba("BD", `<div class="row c">${tx(it("100 \\% INSPECTED ") + "\\bullet" + it(" 2 REJECTED ") + "\\bullet" + it(" 0 ESCAPED"))}</div>`)}
</div>`;

// ------------------------------------------------------------------ zone 4: one persistent glass card, three pages
const CARD = { x: 150, y: 1140, w: 780, h: 460 };
const ROWY = [80, 230, 380];
const PW = 280,
  PH = 116;
const rows = [
  { tex: it("HUMAN EYE ") + "\\pm 100\\,\\mu m", cap: "MISSES THE DEFECT" },
  { tex: it("CALIPER: 1 IN 50 PARTS"), cap: "49 ESCAPE" },
  { tex: it("AI VISION ") + "\\pm 1\\,\\mu m", cap: "EVERY PART, EVERY TIME" },
];
const mini = [
  // eye threshold (100 um) vs the defect (30 um)
  {
    base: `<rect x="14" y="30" width="252" height="16" rx="8" fill="rgba(255,255,255,.22)"/><rect x="14" y="72" width="76" height="16" rx="8" fill="rgba(255,255,255,.12)"/>`,
    over: `<rect x="14" y="72" width="76" height="16" rx="8" fill="${C.red}"/>`,
  },
  // 50 parts, one is measured
  (() => {
    let b = "",
      o = "";
    for (let k = 0; k < 50; k++) {
      const x = 8 + (k % 10) * 27,
        y = 8 + Math.floor(k / 10) * 21;
      b += `<rect x="${x}" y="${y}" width="22" height="16" rx="4" fill="rgba(255,255,255,.16)"/>`;
      if (k === 17) o += `<rect x="${x}" y="${y}" width="22" height="16" rx="4" fill="${C.blue}"/>`;
    }
    return { base: b, over: o };
  })(),
  // all 50 parts measured
  (() => {
    let b = "",
      o = "";
    for (let k = 0; k < 50; k++) {
      const x = 8 + (k % 10) * 27,
        y = 8 + Math.floor(k / 10) * 21;
      b += `<rect x="${x}" y="${y}" width="22" height="16" rx="4" fill="rgba(255,255,255,.16)"/>`;
      o += `<rect x="${x}" y="${y}" width="22" height="16" rx="4" fill="${C.blue}"/>`;
    }
    return { base: b, over: o };
  })(),
];
const pageA = rows
  .map((r, i) => {
    const cy = ROWY[i];
    const m = M("cf" + i);
    const px = m.cx - CARD.x,
      py = m.cy - CARD.y;
    const w = (m.w || 300) + 36,
      h = (m.h || 60) + 8;
    const mark =
      i < 2
        ? `<svg class="xmark" id="x${i}" style="left:${px - w / 2}px;top:${py - h / 2}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="M8,8L${w - 8},${h - 8}M${w - 8},8L8,${h - 8}" stroke="${C.red}" stroke-width="8" stroke-linecap="round" fill="none"/></svg>`
        : `<svg class="xmark" id="x2" style="left:${px - w / 2}px;top:${py - h / 2}px" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="18" stroke="${C.purple}" stroke-width="5" fill="none"/></svg>`;
    return `
    ${box({ id: "cf" + i, cx: 40, cy: cy - 20, w: 400, h: 62, size: 40, color: "rgba(255,255,255,.92)", html: tx(r.tex), left: true, m: true })}
    ${box({ id: "cc" + i, cx: 40, cy: cy + 34, w: 400, h: 30, size: 24, color: i < 2 ? C.red : C.purple, html: tx(it(r.cap)), left: true })}
    <svg class="mini" style="left:470px;top:${cy - PH / 2}px" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">
      <rect x="0" y="0" width="${PW}" height="${PH}" rx="14" fill="rgba(10,10,16,.55)" stroke="rgba(255,255,255,.08)"/>
      ${mini[i].base}
      <defs><clipPath id="mc${i}"><rect id="mcr${i}" x="0" y="0" width="0" height="${PH}"/></clipPath></defs>
      <g clip-path="url(#mc${i})">${mini[i].over}</g>
    </svg>
    ${mark}`;
  })
  .join("");

// page B: live inspection log (rows appear when the part is measured)
const COLX = { id: 36, d: 310, dl: 470, v: 590 };
const cellC = (cx, cy, tex, color, size = 34) =>
  box({ cx, cy, w: 150, h: 48, size, color, html: tx(tex) });
const ROWB = [168, 238, 308, 378];
const logRows = parts
  .map((p) => {
    const cy = ROWB[p.i];
    const verdict = `<div class="t" style="left:${COLX.v - 30}px;top:${cy - 24}px;width:160px;height:48px;font-size:32px;color:${p.reject ? C.red : "#fff"};justify-content:flex-start">${p.reject ? CROSS(28) : CHECK(28)}${tx(it(p.reject ? "REJECT" : "PASS"))}</div>`;
    return `<div id="lg${p.i}" class="lv" style="opacity:0">
    ${p.reject ? `<div style="position:absolute;left:18px;top:${cy - 31}px;width:744px;height:62px;border-radius:16px;background:rgba(255,0,68,.1);border:1px solid rgba(255,0,68,.5)"></div>` : ""}
    ${box({ cx: COLX.id, cy, w: 250, h: 40, size: 30, color: "#fff", html: tx(it("PART 0") + (p.i + 1)), left: true })}
    ${cellC(COLX.d, cy, p.mm.toFixed(3), C.blue)}
    ${cellC(COLX.dl, cy, sgn(p.dUm), p.reject ? C.red : C.purple)}
    ${verdict}</div>`;
  })
  .join("");
const pageB = `
  ${box({ id: "tb0", cx: 390, cy: 44, w: 760, h: 36, size: 28, color: "rgba(255,255,255,.85)", html: tx(it("LIVE LOG ") + "\\bullet" + it(" NOMINAL ") + "\\varnothing 20.000\\,mm" + "\\ \\bullet\\ \\pm 15\\,\\mu m") })}
  ${box({ cx: COLX.id, cy: 104, w: 160, h: 30, size: 24, color: "rgba(255,255,255,.6)", html: tx(it("PART")), left: true })}
  ${box({ cx: COLX.d, cy: 104, w: 160, h: 30, size: 24, color: C.blue, html: tx("\\varnothing\\,(mm)") })}
  ${box({ cx: COLX.dl, cy: 104, w: 160, h: 30, size: 24, color: C.purple, html: tx("\\Delta\\,(\\mu m)") })}
  ${box({ cx: COLX.v + 50, cy: 104, w: 160, h: 30, size: 24, color: "rgba(255,255,255,.85)", html: tx(it("VERDICT")) })}
  ${logRows}`;

// page C: CTA
const pageC = `
  <div id="ctaglow" style="position:absolute;left:60px;top:176px;width:660px;height:130px;border-radius:65px;background:radial-gradient(ellipse at center,rgba(0,136,255,.45),transparent 70%);opacity:0"></div>
  ${box({ id: "ct1a", cx: 390, cy: 62, w: 740, h: 56, size: 40, color: C.red, html: tx(it("SAVE THIS")), style: "opacity:0" })}
  <div id="ct1b" class="t" style="left:20px;top:92px;width:740px;height:56px;font-size:40px;color:${C.red};opacity:0">${tx(it("AI QUALITY GATE"))}${BOOKMARK(34)}</div>
  ${box({ id: "ct2a", cx: 390, cy: 216, w: 760, h: 48, size: 35, color: C.blue, html: tx(it("WHICH DEFECT WOULD YOU")), style: "opacity:0" })}
  ${box({ id: "ct2b", cx: 390, cy: 268, w: 760, h: 48, size: 35, color: C.blue, html: tx(it("TEACH IT FIRST? COMMENT ") + "\\downarrow"), style: "opacity:0" })}
  <div id="ct3" class="t" style="left:140px;top:366px;width:500px;height:56px;font-size:30px;color:rgba(255,255,255,.7);gap:14px;opacity:0">${GLYPH(36, "rgba(255,255,255,.7)")}${tx(it("@MAE.ACADEMY"))}</div>`;
const card = `<div id="card" style="left:${CARD.x}px;top:${CARD.y}px;width:${CARD.w}px;height:${CARD.h}px">
  <div id="pA" class="pg">${pageA}</div>
  <div id="pB" class="pg" style="opacity:0">${pageB}</div>
  <div id="pC" class="pg">${pageC}</div>
</div>`;

// ------------------------------------------------------------------ typography guard: strict KaTeX math italic
const allHtml = [header, plate, banner, card].join("");
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(allHtml))
  throw new Error("upright / bold math style found");
const boldCount = (allHtml.match(/class="[^"]*\btextbf\b/g) || []).length;
if (boldCount !== 1)
  throw new Error("expected exactly one \\textbf (the header title), found " + boldCount);
console.log(
  "typography ok: no \\mathbf / \\mathrm / upright math; one \\textbf (header title only, bold italic)",
);

// ------------------------------------------------------------------ css
let kcss = fs.readFileSync(new URL("./vendor/katex/katex.min.css", import.meta.url), "utf8");
kcss = kcss.replace(
  /url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\),url\(fonts\/[^)]+?\.woff\) format\("woff"\),url\(fonts\/[^)]+?\.ttf\) format\("truetype"\)/g,
  'url(assets/fonts/$1.woff2) format("woff2")',
);
if (/fonts\/[^)]*\.(woff|ttf)\b/.test(kcss.replace(/\.woff2/g, "")))
  throw new Error("katex css still references woff/ttf");
const css = `
${kcss}
.katex{font-size:1em !important;text-rendering:geometricPrecision}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#0A0A10;width:${W}px;height:${H}px;overflow:hidden}
#root{position:absolute;left:0;top:0;width:${W}px;height:${H}px;background:#0A0A10;overflow:hidden;
  background-image:linear-gradient(#161622 2px,transparent 2px),linear-gradient(90deg,#161622 2px,transparent 2px);background-size:60px 60px}
#flash0{position:absolute;left:0;top:0;width:${W}px;height:700px;background:radial-gradient(ellipse at 50% 22%,rgba(255,0,68,.5),transparent 65%);opacity:0}
.t{position:absolute;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1}
#plate{position:absolute;left:90px;top:340px;width:900px;height:610px;border-radius:32px;overflow:hidden;background:rgba(30,30,46,.52);border:1px solid rgba(255,255,255,.08)}
#pc{position:absolute;left:-91px;top:-341px;width:${W}px;height:${H}px}
#g{position:absolute;left:0;top:0}
.hbg{position:absolute;left:110px;top:360px;width:340px;height:156px;border-radius:18px;background:rgba(10,10,16,.55);border:1px solid rgba(255,255,255,.08)}
.rd{position:absolute;left:128px;top:366px;width:310px;height:140px;white-space:nowrap}
#banner{position:absolute;left:${BN.x}px;top:${BN.y}px;width:${BN.w}px;height:${BN.h}px;border-radius:24px;background:rgba(255,0,68,.08);border:2px solid rgba(255,0,68,.55)}
.ba{position:absolute;left:0;top:0;width:${BN.w - 4}px;height:${BN.h - 4}px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;white-space:nowrap}
.ba .l1{font-size:25px;color:rgba(255,255,255,.88);line-height:1.15}
.ba .l2{font-size:38px;color:${C.red};line-height:1.15;margin-top:2px}
.ba .row{font-size:30px;display:flex;align-items:center;justify-content:center}
.ba .row.c{font-size:26px}
#card{position:absolute;border-radius:36px;background:rgba(30,30,46,.55);border:1px solid rgba(255,255,255,.1);overflow:hidden}
.pg{position:absolute;left:0;top:0;width:780px;height:460px}
.lv{position:absolute;left:0;top:0;width:780px;height:460px}
.mini{position:absolute}
.xmark{position:absolute;opacity:0;overflow:visible}
`;

const anim = fs.readFileSync(new URL("./anim.js", import.meta.url), "utf8");
const CFG = {
  V,
  XC,
  XD,
  BELT_Y,
  T_DIV,
  SCANS,
  BIN,
  PW,
  parts: parts.map((p) => ({ i: p.i, reject: p.reject })),
};

function page(gsapSrc) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, height=${H}">
<title>The Micron Inspector: AI Vision on a CNC Line</title>
<style>${css}</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}" data-fps="60">
${header}
${plate}
${banner}
${card}
<audio id="sfx" class="clip" src="assets/sfx.wav" data-start="0" data-duration="${DUR}" data-track-index="2" data-volume="1"></audio>
</div>
<script src="${gsapSrc}"></script>
<script>
window.__CFG = ${JSON.stringify(CFG)};
${anim}
</script>
</body>
</html>
`;
}
fs.writeFileSync(
  new URL("./index.html", import.meta.url),
  page("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
);
fs.mkdirSync(new URL("./dist/", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("./dist/index.html", import.meta.url), page("vendor/gsap/gsap.min.js"));
for (const d of ["vendor", "assets"]) {
  const link = new URL("./dist/" + d, import.meta.url);
  try {
    fs.lstatSync(link);
  } catch {
    fs.symlinkSync("../" + d, link);
  }
}
console.log("built index.html + dist/index.html");
