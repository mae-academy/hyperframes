import { writeFileSync, mkdirSync } from "node:fs";
import { headDoc, pose, EXPRESSIONS, NATIVE, EYES, BROWS, MOUTHS } from "../rig/mae-rig.mjs";
mkdirSync("previews", { recursive: true });
const base = { eyeL: "open", eyeR: "open", brow: "neutral", mouth: "closed", tilt: 0 };
const cell = (svg, label, w = 190) =>
  `<div class="c" style="width:${w}px"><div style="width:${w - 10}px;height:${w - 10}px">${svg.replace("<svg ", `<svg width="${w - 10}" height="${w - 10}" `)}</div><span>${label}</span></div>`;
const sheet = (t, cells, cols) =>
  `<html><body style="margin:0;background:#fff;font-family:Arial,sans-serif"><style>.g{display:grid;grid-template-columns:repeat(${cols},auto);gap:10px;padding:0 24px 24px;justify-content:start}.c{text-align:center;border:2px solid #cfd8e3;border-radius:12px;padding:5px 0 6px}.c span{font-size:17px;font-weight:700;color:#0b1f3a}h1{margin:0;padding:18px 24px 12px;font-size:30px;color:#0b1f3a}</style><h1>${t}</h1><div class="g">${cells.join("")}</div></body></html>`;
const f = (o) => headDoc({ ...base, ...o });
const natives = ["wave", "think", "wink_point", "talk_point"];
writeFileSync(
  "/tmp/s-eyes.html",
  sheet(
    "MAE — eye states",
    [
      ...Object.keys(EYES).map((k) => [k, { eyeL: k, eyeR: k }]),
      ...["blink", "happy", "squint", "half", "shine"].map((k) => [k, { eyeL: k, eyeR: k }]),
      ...natives.map((p) => ["native:" + p, { eyeL: "native:" + p, eyeR: "native:" + p }]),
    ].map(([k, o]) => cell(f(o), k)),
    6,
  ),
);
writeFileSync(
  "/tmp/s-brows.html",
  sheet(
    "MAE — brow states",
    [...Object.keys(BROWS), ...natives.map((p) => "native:" + p)].map((k) =>
      cell(f({ brow: k }), k),
    ),
    6,
  ),
);
writeFileSync(
  "/tmp/s-mouths.html",
  sheet(
    "MAE — mouth shapes",
    [...Object.keys(MOUTHS), ...natives.map((p) => "native:" + p)].map((k) =>
      cell(f({ mouth: k }), k),
    ),
    6,
  ),
);
writeFileSync(
  "/tmp/s-expr.html",
  sheet(
    "MAE — expression presets",
    Object.entries(EXPRESSIONS).map(([k, e]) => cell(headDoc(e), k, 230)),
    5,
  ),
);
const cmp = natives.map((p) => cell(pose(p, NATIVE(p), { bg: "#33bb3f" }), "rig · " + p, 300));
writeFileSync(
  "/tmp/s-poses.html",
  sheet("MAE — the 4 original poses, rebuilt from the rig", cmp, 4),
);
console.log("sheets ok");
