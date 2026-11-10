// Snapshots + cue/visual consistency check against the dist page (vendored GSAP).
//   node verify.mjs [t1 t2 ...]   default: the review set
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const times = process.argv
  .slice(2)
  .map(Number)
  .filter((x) => !Number.isNaN(x));
const T = times.length
  ? times
  : [
      0.0, 1.4, 2.4, 3.6, 5.0, 6.2, 7.6, 8.2, 9.4, 10.5, 12.0, 13.9, 14.6, 15.8, 17.0, 17.9, 18.8,
      20.0, 21.5, 21.99,
    ];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await page.goto("file://" + path.join(dir, "dist/index.html"));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
const seek = (t) =>
  page.evaluate((t) => {
    window.__timelines.main.seek(t, false);
  }, t);
fs.mkdirSync(path.join(dir, "snapshots"), { recursive: true });
for (const t of T) {
  await seek(t);
  await page.screenshot({
    path: path.join(dir, `snapshots/t${t.toFixed(2)}.png`),
    clip: { x: 0, y: 0, width: 1080, height: 1920 },
  });
}
const cues = await page.evaluate(() => window.__CUES);
let bad = 0;
const state = (sel, prop) =>
  page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
const probe = {
  open: () => ["#flash0", "opacity", (b4, af) => Number(af) > 0.15],
  rew: () => ["#flashG", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.3],
  stage: (c) => [
    "#B" + c.ref.split(":")[1],
    "opacity",
    (b4, af) => Number(b4) === 0 && Number(af) > 0.5,
  ],
  tick: (c) => [
    "#pn" + c.ref.split(":")[1],
    "opacity",
    (b4, af) => Number(b4) === 0 && Number(af) === 1,
  ],
  verd: () => ["#verd", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.5],
  rej: () => ["#ringR", "opacity", (b4, af) => Number(b4) < 0.05 && Number(af) > 0.3],
  final: () => ["#lockb", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.5],
  cta: () => ["#ct1a", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.1],
  pulse: () => ["#ctaglow", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.2],
};
for (const c of cues) {
  const key = c.ref.split(":")[0];
  const [sel, prop, ok] = probe[key](c);
  const dt = key === "final" || key === "stage" || key === "verd" ? 0.3 : 0.03;
  await seek(Math.max(0, c.t - 0.02));
  const b4 = c.t === 0 ? "0" : await state(sel, prop);
  await seek(c.t + dt);
  const af = await state(sel, prop);
  if (!ok(b4, af)) {
    bad++;
    console.log("CUE MISMATCH", c, b4, af);
  }
}
const n = (k) => cues.filter((c) => c.kind === k).length;
console.log(
  `cues: ${n("click")} click / ${n("tick")} tick / ${n("snap")} snap / ${n("thump")} thump; mismatches: ${bad}`,
);
// the pixel grid on screen must show exactly the numbers the build measured: sample a cell corner at the zoomed patch
const cfg = await page.evaluate(() => window.__CFG);
await seek(6.0);
const shot = await page.evaluate(() => {
  const cv = document.getElementById("cv"),
    c = cv.getContext("2d"),
    d = cv.width / 900;
  const out = [];
  for (const [i, j] of [
    [1, 1],
    [4, 5],
    [5, 5],
    [6, 2],
    [8, 8],
  ])
    out.push([
      i,
      j,
      Array.from(
        c.getImageData(Math.round((20 + 56 * i + 5) * d), Math.round((25 + 56 * j + 5) * d), 1, 1)
          .data,
      ),
    ]);
  return out;
});
for (const [i, j, px] of shot) {
  const v = cfg.patchI[j][i],
    want = 10 + v * 0.96;
  if (Math.abs(px[0] - want) > 3) {
    bad++;
    console.log("PIXEL MISMATCH", i, j, px, v, want);
  }
}
console.log("pixel grid shows the measured values: " + (bad ? "NO" : "yes"));
// the two edge chips must not overlap
await seek(15.5);
const ch = await page.evaluate(() =>
  ["chM", "chN"].map((id) => {
    const r = document.getElementById(id).getBoundingClientRect();
    return [r.left, r.right];
  }),
);
if (ch[0][1] > ch[1][0]) {
  bad++;
  console.log("CHIPS OVERLAP", ch);
}
console.log(errs.length ? "PAGE ERRORS: " + errs.join(" | ") : "no page errors");
await browser.close();
process.exit(bad || errs.length ? 1 : 0);
