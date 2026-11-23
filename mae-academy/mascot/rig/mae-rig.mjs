// MAE rig runtime — composes traced assets (rig.json, reference pixel space 2473x3024) into SVG.
// Extra eye / brow / mouth states are built from the traced shapes (rigid transforms) or drawn in the same ink weight.
import { readFileSync } from "node:fs";
export const RIG = JSON.parse(readFileSync(new URL("./rig.json", import.meta.url), "utf8"));
export const SIZE = RIG.size,
  HEAD = RIG.head_circle; // [cx, cy, r]
const INK = "#060606",
  MOUTH = "#3e2624",
  TONGUE = "#d48881";
const path = (l) => `<path fill="${l.fill}" fill-rule="evenodd" d="${l.d}"/>`;
const paths = (ls = []) => ls.map(path).join("");

/* ---------------- eyes ---------------- */
const eyeBase = (side) => RIG.poses.wave.eyes["eye" + side];
const center = (p) => [p.viewBox[0] + p.viewBox[2] / 2, p.viewBox[1] + p.viewBox[3] / 2];
const tf = (cx, cy, { dx = 0, dy = 0, s = 1, sy = s, rot = 0 } = {}) =>
  `translate(${cx + dx} ${cy + dy}) rotate(${rot}) scale(${s} ${sy}) translate(${-cx} ${-cy})`;
const arc = (cx, cy, d) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="23" stroke-linecap="round" stroke-linejoin="round" transform="translate(${cx} ${cy})"/>`;
export const EYES = {
  open: () => ({}),
  wide: () => ({ s: 1.28 }),
  small: () => ({ s: 0.78 }),
  lookLeft: () => ({ dx: -30 }),
  lookRight: () => ({ dx: 30 }),
  lookUp: () => ({ dy: -22 }),
  lookDown: () => ({ dy: 18, sy: 0.9 }),
  lookUpLeft: () => ({ dx: -26, dy: -20 }),
  lookUpRight: () => ({ dx: 26, dy: -20 }),
};
const eyeSvg = (state, side) => {
  const base = eyeBase(side),
    [cx, cy] = center(base);
  if (state.startsWith("native:")) {
    const n = RIG.poses[state.slice(7)].eyes?.["eye" + side];
    return n ? paths(n.layers) : "";
  }
  if (state === "blink") return arc(cx, cy, "M-46,-6 Q0,34 46,-6");
  if (state === "happy") return arc(cx, cy, "M-46,16 Q0,-36 46,16");
  if (state === "squint") return arc(cx, cy, "M-44,8 Q0,-18 44,8");
  if (state === "half")
    return (
      `<g clip-path="url(#lid${side})">${paths(base.layers)}</g><clipPath id="lid${side}"><rect x="${cx - 80}" y="${cy + 2}" width="160" height="120"/></clipPath>` +
      arc(cx, cy + 2, "M-50,0 L50,0")
    );
  if (state === "shine")
    return `<g transform="${tf(cx, cy, { s: 1.22 })}">${paths(base.layers)}</g><circle cx="${cx - 10}" cy="${cy - 26}" r="14" fill="#fff"/>`;
  return `<g transform="${tf(cx, cy, EYES[state]())}">${paths(base.layers)}</g>`;
};

/* ---------------- brows ---------------- */
const browBase = (side) => RIG.poses.wave.brows["brow" + side];
const B = (L, R) => ({ L, R });
export const BROWS = {
  neutral: B({}, {}),
  raised: B({ dy: -26 }, { dy: -26 }),
  high: B({ dy: -44, sy: 1.08 }, { dy: -44, sy: 1.08 }),
  low: B({ dy: 28 }, { dy: 28 }),
  sad: B({ dy: -12, rot: -13 }, { dy: -12, rot: 13 }),
  worried: B({ dy: -20, rot: -9 }, { dy: -20, rot: 9 }),
  angry: B({ dy: 16, rot: 15 }, { dy: 16, rot: -15 }),
  skeptic: B({ dy: -44 }, { dy: 20, rot: -5 }),
  skepticR: B({ dy: 20, rot: 5 }, { dy: -44 }),
  flat: B({ sy: 0.8 }, { sy: 0.8 }),
  winkR: B({ dy: -18 }, { dy: 22 }),
};
const browSvg = (name, side) => {
  if (name.startsWith("native:")) {
    const n = RIG.poses[name.slice(7)].brows?.["brow" + side];
    return n ? paths(n.layers) : "";
  }
  const base = browBase(side),
    [cx, cy] = center(base);
  return `<g transform="${tf(cx, cy, BROWS[name][side])}">${paths(base.layers)}</g>`;
};

/* ---------------- mouths (procedural ones share the traced ink weight) ---------------- */
const M0 = [1245, 1425],
  MS = 6.0,
  SWm = 23 / MS;
const ms = `stroke="${INK}" stroke-width="${SWm}" stroke-linecap="round" stroke-linejoin="round"`;
const dark = `fill="${MOUTH}" ${ms}`;
const tg = (d) => `<path d="${d}" fill="${TONGUE}"/>`;
export const MOUTHS = {
  closed: `<path d="M-24,1 Q0,8 24,-2" fill="none" ${ms}/>`,
  mm: `<path d="M-22,0 L22,-1" fill="none" ${ms}/>`,
  smile: `<path d="M-32,-4 Q0,26 32,-7" fill="none" ${ms}/>`,
  smirk: `<path d="M-24,4 Q0,8 14,2 Q26,-4 32,-14" fill="none" ${ms}/>`,
  sad: `<path d="M-24,10 Q0,-10 24,10" fill="none" ${ms}/>`,
  wavy: `<path d="M-28,2 Q-14,-8 0,2 T28,2" fill="none" ${ms}/>`,
  small: `<path d="M-14,-4 Q0,-9 14,-5 Q14,10 0,12 Q-14,10 -14,-4 Z" ${dark}/>`,
  open_a:
    `<path d="M-22,-8 Q0,-14 22,-9 Q26,16 2,22 Q-22,20 -22,-8 Z" ${dark}/>` +
    tg("M-12,14 Q2,6 16,12 Q10,20 2,20 Q-8,19 -12,14 Z"),
  open_wide:
    `<path d="M-26,-12 Q0,-20 26,-14 Q30,26 2,34 Q-30,30 -26,-12 Z" ${dark}/>` +
    tg("M-14,22 Q2,10 18,20 Q10,30 2,30 Q-8,30 -14,22 Z"),
  open_e: `<path d="M-32,-6 Q0,-12 32,-8 Q26,12 0,14 Q-26,12 -32,-6 Z" ${dark}/>`,
  open_o: `<ellipse cx="0" cy="4" rx="12" ry="15" ${dark}/>`,
  ooh: `<circle cx="0" cy="3" r="9" ${dark}/>`,
  grin:
    `<path d="M-36,-9 Q0,-3 36,-11 C32,14 10,30 -6,29 C-24,27 -36,10 -36,-9 Z" ${dark}/>` +
    tg("M-20,21 Q-2,9 18,19 Q8,28 -6,28 Q-16,27 -20,21 Z"),
  laugh:
    `<path d="M-42,-13 Q0,-5 42,-15 C40,26 14,46 0,46 C-22,46 -42,26 -42,-13 Z" ${dark}/>` +
    tg("M-24,32 Q0,14 26,30 Q12,44 0,44 Q-14,44 -24,32 Z"),
  teeth: `<path d="M-30,-8 Q0,-14 30,-10 Q28,14 0,16 Q-28,14 -30,-8 Z" fill="#fff" ${ms}/><path d="M-29,2 Q0,0 29,0" fill="none" ${ms}/>`,
  surprised: `<ellipse cx="0" cy="8" rx="14" ry="22" ${dark}/>`,
};
const mouthSvg = (name) =>
  name.startsWith("native:")
    ? paths(RIG.poses[name.slice(7)].mouths.mouth.layers)
    : `<g transform="translate(${M0[0]} ${M0[1]}) scale(${MS})">${MOUTHS[name]}</g>`;

/* ---------------- expressions ---------------- */
export const EXPRESSIONS = {
  neutral: { eyeL: "open", eyeR: "open", brow: "neutral", mouth: "closed", tilt: 0 },
  talk: { eyeL: "open", eyeR: "open", brow: "neutral", mouth: "open_a", tilt: 0 },
  explain: { eyeL: "open", eyeR: "open", brow: "raised", mouth: "open_e", tilt: -2 },
  happy: { eyeL: "open", eyeR: "open", brow: "raised", mouth: "grin", tilt: 2 },
  joy: { eyeL: "happy", eyeR: "happy", brow: "high", mouth: "laugh", tilt: 3 },
  wink: { eyeL: "open", eyeR: "native:wink_point", brow: "winkR", mouth: "smile", tilt: 4 },
  think: { eyeL: "lookUpLeft", eyeR: "lookUpLeft", brow: "skeptic", mouth: "mm", tilt: -4 },
  curious: { eyeL: "lookRight", eyeR: "lookRight", brow: "skepticR", mouth: "small", tilt: 3 },
  surprised: { eyeL: "wide", eyeR: "wide", brow: "high", mouth: "surprised", tilt: 0 },
  eureka: { eyeL: "shine", eyeR: "shine", brow: "high", mouth: "open_wide", tilt: 2 },
  confused: { eyeL: "lookLeft", eyeR: "lookLeft", brow: "skeptic", mouth: "wavy", tilt: -5 },
  serious: { eyeL: "open", eyeR: "open", brow: "angry", mouth: "mm", tilt: 0 },
  proud: { eyeL: "half", eyeR: "half", brow: "raised", mouth: "smirk", tilt: 3 },
  sad: { eyeL: "lookDown", eyeR: "lookDown", brow: "sad", mouth: "sad", tilt: -3 },
  worried: { eyeL: "small", eyeR: "small", brow: "worried", mouth: "small", tilt: -2 },
  sleepy: { eyeL: "half", eyeR: "half", brow: "low", mouth: "closed", tilt: -4 },
};
// the four original poses, reproduced exactly from their own traced parts
export const NATIVE = (p) => ({
  eyeL: "native:" + p,
  eyeR: "native:" + p,
  brow: "native:" + p,
  mouth: "native:" + p,
  tilt: 0,
});

/* ---------------- composer ---------------- */
export function head(e) {
  const h = RIG.head,
    [cx, cy] = HEAD;
  return `<g transform="rotate(${e.tilt || 0} ${cx} ${cy})">${path(h.white)}${eyeSvg(e.eyeL, "L")}${eyeSvg(e.eyeR, "R")}${path(h.hair)}${path(h.ink)}${path(h.glasses)}${browSvg(e.brow, "L")}${browSvg(e.brow, "R")}${mouthSvg(e.mouth)}</g>`;
}
export function pose(
  poseName,
  e = NATIVE(poseName),
  { vb = `0 0 ${SIZE[0]} ${SIZE[1]}`, bg = null } = {},
) {
  const P = RIG.poses[poseName];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${bg ? `<rect x="-5000" y="-5000" width="20000" height="20000" fill="${bg}"/>` : ""}${paths(P.body)}${head(e)}${P.overlay ? paths(P.overlay) : ""}</svg>`;
}
export const headDoc = (e, bg = "#fff") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="640 470 1340 1340"><rect x="0" y="0" width="3000" height="3200" fill="${bg}"/>${head(e)}</svg>`;
