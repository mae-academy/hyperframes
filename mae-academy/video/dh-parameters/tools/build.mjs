// node tools/build.mjs  ->  index.html + compositions/*.html
import { writeFileSync, mkdirSync } from "node:fs";
import { cues, cue, SFX_DUR } from "./lib.mjs";
import { buildDiagram } from "./diagram.mjs";
import { buildIntro, buildHook, buildSummary, buildOutro } from "./scenes.mjs";
import { buildExample, EX_DUR } from "./example.mjs";
mkdirSync("compositions", { recursive: true });

const plan = [
  ["intro", buildIntro, 6.0],
  ["hook", buildHook, 12.0],
  ["diagram", buildDiagram, 80.4],
  ["summary", buildSummary, 13.0],
  ["example", buildExample, EX_DUR],
  ["outro", buildOutro, 6.0],
];
let t = 0;
const hosts = [];
for (const [id, fn, dur] of plan) {
  const r = fn(t);
  if (Math.abs(r.dur - dur) > 1e-6) throw new Error(`${id}: planned ${dur} built ${r.dur}`);
  writeFileSync(`compositions/${id}.html`, r.html);
  if (t > 0) cue("whoosh-short", t - 0.12, 0.45); // one whoosh on every seam
  hosts.push(
    `  <div id="${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${t}" data-duration="${dur}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`,
  );
  t = +(t + dur).toFixed(3);
}
const total = t;
// audio lanes
const sorted = [...cues].filter((c) => c.t >= 0 && c.t < total).sort((a, b) => a.t - b.t);
const lanes = [];
const audio = sorted.map((c, i) => {
  const dur = Math.min(SFX_DUR[c.name], +(total - c.t).toFixed(2));
  let lane = lanes.findIndex((end) => end <= c.t + 0.001);
  if (lane < 0) {
    lane = lanes.length;
    lanes.push(0);
  }
  lanes[lane] = c.t + dur;
  return `  <audio id="sfx-${i + 1}" class="clip" data-start="${c.t}" data-duration="${dur}" data-track-index="${10 + lane}" data-volume="${c.vol}" src="assets/sfx/${c.name}.mp3"></audio>`;
});
const index = `<!doctype html>
<html lang="ar" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1920, height=1080">
<title>DH Parameters</title>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#fff}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
${hosts.join("\n")}
${audio.join("\n")}
</div>
<script>
const tl = gsap.timeline({ paused: true });
window.__timelines["main"] = tl;
tl.seek(0);
</script>
</body>
</html>
`;
writeFileSync("index.html", index);
console.log("built", total, "s;", sorted.length, "sfx cues;", lanes.length, "lanes");
