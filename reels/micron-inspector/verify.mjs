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
  : [0.0, 1.0, 2.0, 2.6, 4.6, 5.5, 6.3, 8.1, 9.2, 9.8, 10.4, 10.7, 12.2, 14.99];
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
  ignite: () => ["#ringI", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.3],
  scan: () => ["#scanline", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.3],
  rej: () => ["#ringR", "opacity", (b4, af) => Number(b4) < 0.05 && Number(af) > 0.3],
  final: () => ["#BD", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.5],
  cta: () => ["#ct1a", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.1],
  pulse: () => ["#ctaglow", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.2],
};
for (const c of cues) {
  const key = c.ref.split(":")[0];
  const [sel, prop, ok] = probe[key](c);
  const dt = key === "final" ? 0.3 : 0.05;
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
  `cues: ${n("click")} click / ${n("snap")} snap / ${n("thump")} thump; mismatches: ${bad}`,
);
// geometry: every part is centred under the camera at its scan time; rejected parts end in the bin
const geo = await page.evaluate(() => window.__CFG);
for (const p of geo.parts) {
  await seek(geo.SCANS[p.i]);
  const b = await page.evaluate((i) => {
    const r = document.getElementById("p" + i).getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }, p.i);
  const okc = Math.abs(b[0] - geo.XC) < 1.5 && Math.abs(b[1] - geo.BELT_Y) < 1.5;
  if (!okc) {
    bad++;
    console.log("PART NOT UNDER CAMERA", p.i, b);
  }
}
await seek(12);
for (const p of geo.parts.filter((p) => p.reject)) {
  const b = await page.evaluate((i) => {
    const r = document.getElementById("p" + i).getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  }, p.i);
  if (b[1] < 860) {
    bad++;
    console.log("REJECT NOT IN BIN", p.i, b);
  }
}
console.log(errs.length ? "PAGE ERRORS: " + errs.join(" | ") : "no page errors");
await browser.close();
process.exit(bad || errs.length ? 1 : 0);
