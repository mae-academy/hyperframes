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
      0, 1.5, 2.3, 5.0, 7.4, 10.0, 12.5, 15.0, 16.5, 17.5, 18.4, 19.0, 19.8, 20.5, 21.0, 22.2, 24.0,
      26.4,
    ];
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 2 / 3,
});
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
  await page.screenshot({ path: path.join(dir, `snapshots/t${t.toFixed(2)}.png`) });
}
// every cue must show the visual event it is tied to: the element's opacity rises (t - 0.02 -> t + 0.25)
const cues = await page.evaluate(() => window.__CUES);
const op = (sel) =>
  page.evaluate((s) => Number(getComputedStyle(document.querySelector(s)).opacity), sel);
let bad = 0;
for (const c of cues) {
  await seek(Math.max(0, c.t - 0.02));
  const b4 = c.t === 0 ? 0 : await op(c.sel);
  await seek(c.t + (c.t === 0 ? 0.05 : 0.25));
  const af = await op(c.sel);
  if (!(af - b4 > 0.15)) {
    bad++;
    console.log("CUE MISMATCH", c, b4, af);
  }
}
const n = (k) => cues.filter((c) => c.kind === k).length;
console.log(
  `cues: ${n("click")} click / ${n("snap")} snap / ${n("thump")} thump; mismatches: ${bad}`,
);
// determinism: the same time must render the same pixels after a forward and a backward seek
await seek(12.0);
const a = await page.screenshot();
await seek(6.0);
await seek(12.0);
const b = await page.screenshot();
const same = Buffer.compare(a, b) === 0;
console.log("seek determinism (12.0 s forward vs after 6.0 s):", same ? "identical" : "DIFFERENT");
// zones
const geo = await page.evaluate(() => {
  const r = {};
  for (const id of ["plate", "banner", "card"]) {
    const b = document.getElementById(id).getBoundingClientRect();
    r[id] = [b.left, b.top, b.width, b.height].map(Math.round);
  }
  return r;
});
console.log("zones", JSON.stringify(geo));
console.log(errs.length ? "PAGE ERRORS: " + errs.join(" | ") : "no page errors");
await browser.close();
process.exit(bad || errs.length || !same ? 1 : 0);
