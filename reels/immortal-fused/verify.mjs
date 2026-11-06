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
const T = times.length ? times : [0.0, 1.0, 2.5, 5.0, 7.6, 8.8, 9.6, 10.8, 12.0, 15.99];
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
  await page.screenshot({ path: path.join(dir, `snapshots/t${t.toFixed(2)}.png`) });
}
// --- cue consistency: every tick shows a spark burst, the snap fires the shockwave, the thump lands the eigenfunction banner
const cues = await page.evaluate(() => window.__CUES);
let bad = 0;
const state = (sel, prop) =>
  page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
// [selector, property, predicate(before, after)] per cue ref; `after` is read 0.05 s later (0.3 s for the banner)
const probe = {
  open: () => ["#flash0", "opacity", (b4, af) => Number(af) > 0.15],
  stamp: () => ["#x0", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.5],
  milestone: () => ["#ringm", "opacity", (b4, af) => Number(b4) < 0.05 && Number(af) > 0.3],
  clamp: () => ["#brk", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.5],
  land: () => ["#tri", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.02],
  slope: () => ["#lbl-s", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.4],
  final: () => ["#BD", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.5],
  cta: () => ["#ct1a", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.3],
  "cta-pulse": () => ["#ct3", "opacity", (b4, af) => Number(b4) === 0 && Number(af) > 0.2],
  spark: (c) => [
    "#sp" + c.ref.split(":")[1] + "_0",
    "opacity",
    (b4, af) => Number(b4) === 0 && Number(af) > 0.2,
  ],
};
for (const c of cues) {
  const key = c.ref.split(":")[0];
  const [sel, prop, ok] = probe[key](c);
  const dt = key === "final" ? 0.3 : 0.05;
  const t0 = Math.max(0, c.t - 0.02);
  await seek(t0);
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
  `cues: ${n("tick")} tick / ${n("snap")} snap / ${n("thump")} thump; mismatches: ${bad}`,
);
// --- zones & palette
const geo = await page.evaluate(() => {
  const r = {};
  for (const id of ["plate", "banner", "cmp", "cta"]) {
    const b = document.getElementById(id).getBoundingClientRect();
    r[id] = [b.left, b.top, b.width, b.height].map(Math.round);
  }
  return r;
});
console.log("zones", JSON.stringify(geo));
console.log(errs.length ? "PAGE ERRORS: " + errs.join(" | ") : "no page errors");
await browser.close();
process.exit(bad || errs.length ? 1 : 0);
