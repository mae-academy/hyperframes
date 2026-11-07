// Snapshots + cue/visual consistency check against the dist page (vendored GSAP).
//   node verify.mjs [t1 t2 ...]   default: the review set. Seeks the GSAP timeline and sends hf-seek (canvas).
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
  : [0.0, 0.5, 1.1, 2.0, 3.5, 6.5, 9.5, 12.0, 14.5, 16.0, 16.4, 17.5, 19.0, 20.3, 21.99];
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
    window.dispatchEvent(new CustomEvent("hf-seek", { detail: { time: t } }));
  }, t);
fs.mkdirSync(path.join(dir, "snapshots"), { recursive: true });
for (const t of T) {
  await seek(t);
  await page.screenshot({ path: path.join(dir, `snapshots/t${t.toFixed(2)}.png`) });
}
const cues = await page.evaluate(() => window.__CUES);
let bad = 0;
const state = (sel, prop) =>
  page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
const up = (v) => Number(v);
// [selector, property, predicate(before, after), dt]
const probe = {
  slam: () => ["#flash0", "opacity", (b, a) => up(a) > 0.3, 0.05],
  "square-preview": () => ["#flash0", "opacity", (b, a) => up(a) > 0.3, 0.05],
  count: (c) => ["#" + c.ref.split(":")[1], "opacity", (b, a) => up(b) === 0 && up(a) === 1, 0.05],
  engage: () => ["#c1", "opacity", (b, a) => up(b) === 0 && up(a) > 0.5, 0.3],
  lock: () => ["#lockflash", "opacity", (b, a) => up(b) === 0 && up(a) > 0.2, 0.05],
  "square-lock": () => ["#lockflash", "opacity", (b, a) => up(b) === 0 && up(a) > 0.2, 0.05],
  corners: () => ["#lockflash", "opacity", (b, a) => up(b) === 0 && up(a) > 0.2, 0.05],
  check: () => [
    "#chkp",
    "strokeDashoffset",
    (b, a) => parseFloat(b) >= 0 && parseFloat(a) < 0.01,
    0.05,
  ],
  cta: () => ["#cta", "opacity", (b, a) => up(b) === 0 && up(a) > 0.1, 0.05],
  press: () => ["#rip", "opacity", (b, a) => up(b) === 0 && up(a) > 0.3, 0.05],
  grab: () => ["#trkf", "opacity", (b, a) => up(b) === 0 && up(a) > 0.5, 0.06],
  infinity: () => ["#infr", "opacity", (b, a) => up(b) === 0 && up(a) > 0.3, 0.05],
};
for (const c of cues) {
  const key = c.ref.split(":")[0];
  if (!probe[key]) {
    bad++;
    console.log("NO PROBE for", c);
    continue;
  }
  const [sel, prop, ok, dt] = probe[key](c);
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
  `cues: ${cues.length} (${["tick", "click", "snap", "thump", "stab"].map((k) => n(k) + " " + k).join(", ")}); mismatches: ${bad}`,
);
console.log(errs.length ? "PAGE ERRORS: " + errs.join(" | ") : "no page errors");
await browser.close();
process.exit(bad || errs.length ? 1 : 0);
