// Shared helpers for the DH-parameters film generator.
export const C = {
  ink: "#0B1F3A",
  blue: "#1565FF",
  purple: "#7A3CFF",
  orange: "#F26B00",
  green: "#00945E",
  red: "#E5173F",
  gold: "#FFC21A",
  goldDark: "#E89B00",
  teal: "#18B5C8",
  soft: "#F1F5FF",
  muted: "#4A5B73",
  line: "#C9D6EE",
};

export const FONT_CSS = `
@font-face{font-family:'Plex Arabic';font-weight:500;src:url('assets/fonts/IBMPlexSansArabic-Medium.ttf')}
@font-face{font-family:'Plex Arabic';font-weight:600;src:url('assets/fonts/IBMPlexSansArabic-SemiBold.ttf')}
@font-face{font-family:'Plex Arabic';font-weight:700;src:url('assets/fonts/IBMPlexSansArabic-Bold.ttf')}
`;

export const BASE_CSS = `
#root{position:absolute;inset:0;background:#fff;overflow:hidden;font-family:'Plex Arabic','Inter',sans-serif;color:${C.ink};direction:rtl}
#root *{box-sizing:border-box}
.wrap{position:absolute;inset:0}
.sym{font-family:'Inter',sans-serif;font-weight:800;direction:ltr;unicode-bidi:isolate;display:inline-block;letter-spacing:0}
.sym sub{font-size:max(.6em,28px);font-weight:700;vertical-align:-.22em;line-height:0;margin-left:.04em}
.en{font-family:'Inter','Plex Arabic',sans-serif;font-weight:700;direction:ltr;unicode-bidi:isolate;display:inline-block}
.w{display:inline-block;white-space:nowrap}
.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
.blue{color:${C.blue}} .purple{color:${C.purple}} .orange{color:${C.orange}} .green{color:${C.green}} .red{color:${C.red}}
b.k{font-weight:700}
`;

// symbol with subscript, e.g. S('a','i−1')
export const S = (name, sub = "", color = "") =>
  `<span class="sym${color ? " " + color : ""}">${name}${sub ? `<sub>${sub}</sub>` : ""}</span>`;
export const EN = (t, color = "") =>
  `<span class="en${color ? " " + color : ""}">${t.replace(/ /g, "&nbsp;")}</span>`;

// split caption html into animatable word units (top-level words / whole inline elements stay together)
export function words(html) {
  const parts = html.split(/(<[^>]+>)/).filter((x) => x !== "");
  const units = [];
  let buf = "",
    depth = 0;
  for (const p of parts) {
    if (p.startsWith("<")) {
      const closing = p.startsWith("</"),
        selfc = p.endsWith("/>") || /^<(br|img|path|circle)/.test(p);
      if (depth === 0 && !closing) {
        depth = selfc ? 0 : 1;
        buf = p;
        if (selfc) {
          units.push(buf);
          buf = "";
        }
        continue;
      }
      buf += p;
      if (!selfc) depth += closing ? -1 : 1;
      if (depth === 0) {
        units.push(buf);
        buf = "";
      }
    } else if (depth > 0) buf += p;
    else for (const t of p.split(/\s+/)) if (t) units.push(t);
  }
  return units.map((u) => `<span class="w">${u}</span>`).join(" ");
}

// ---- audio cues, collected across scenes (absolute film seconds)
export const SFX_DUR = {
  "whoosh-short": 0.57,
  whoosh: 0.57,
  pop: 0.72,
  "click-soft": 0.37,
  click: 0.37,
  ping: 1.32,
  sparkle: 1.8,
  chime: 2.5,
  "impact-bass-1": 2.12,
  "impact-bass-2": 2.59,
  riser: 10.03,
  notification: 2.46,
  typing: 1.5,
  "key-press": 0.4,
};
export const cues = [];
export const cue = (name, t, vol = 0.5) => cues.push({ name, t: +t.toFixed(3), vol });

// seam helpers (cut-the-curve, current = LEFT): exit last 0.34s, entry first 0.34s, mirrored power4 eases, partial travel 230px
export const SEAM = { dur: 0.34, dx: 230 };
export const exitTL = (sel, endT) =>
  `tl.to("${sel}",{x:-${SEAM.dx},duration:${SEAM.dur},ease:"power4.in"},${(endT - SEAM.dur).toFixed(3)});` +
  `tl.to("${sel}",{opacity:0,duration:${(SEAM.dur - 0.03).toFixed(2)},ease:"none"},${(endT - SEAM.dur).toFixed(3)});`;
export const entryTL = (sel) =>
  `tl.fromTo("${sel}",{x:${SEAM.dx},opacity:0.35},{x:0,opacity:1,duration:${SEAM.dur},ease:"power4.out"},0);`;

export const MAS = (name) => `assets/mascot/${name}.svg`;
