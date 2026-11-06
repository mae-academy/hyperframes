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
const T = times.length ? times : [0.0, 0.85, 1.1, 3.0, 16.7, 20.99];
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
// --- cue consistency: every click has a visible clone just after / none just before; every snap locks a cell
const cues = await page.evaluate(() => window.__CUES);
let bad = 0;
const state = (sel, prop) =>
  page.evaluate(([s, p]) => getComputedStyle(document.querySelector(s))[p], [sel, prop]);
for (const c of cues) {
  const [, id] = c.ref.split(":");
  if (c.kind === "click") {
    await seek(c.t - 0.03);
    const before = await state("#c_" + id, "display");
    await seek(c.t + 0.05);
    const after = await state("#c_" + id, "display");
    if (before !== "none" || after !== "block") {
      bad++;
      console.log("CUE MISMATCH click", c, before, after);
    }
  } else if (c.kind === "snap") {
    await seek(c.t - 0.03);
    const before = await state("#cell_" + id, "opacity");
    await seek(c.t + 0.05);
    const after = await state("#cell_" + id, "opacity");
    if (Number(before) !== 0 || Number(after) !== 1) {
      bad++;
      console.log("CUE MISMATCH snap", c, before, after);
    }
  } else if (c.kind === "thump") {
    await seek(c.t - 0.03);
    const before = await state("#lbl-yp", "opacity");
    await seek(c.t + 0.3);
    const after = await state("#lbl-yp", "opacity");
    if (Number(before) !== 0 || Number(after) < 0.9) {
      bad++;
      console.log("CUE MISMATCH thump", c, before, after);
    }
  }
}
const n = (k) => cues.filter((c) => c.kind === k).length;
console.log(
  `cues: ${n("click")} click / ${n("snap")} snap / ${n("thump")} thump; mismatches: ${bad}`,
);
// --- never two copies: the original is hidden while its clone flies
for (const c of cues.filter((c) => c.kind === "click")) {
  const id = c.ref.split(":")[1];
  await seek(c.t + 0.3);
  const o = await state("#o_" + id, "opacity");
  const d = await state("#c_" + id, "display");
  if (!(Number(o) === 0 && d === "block")) {
    bad++;
    console.log("DUPLICATE/ORPHAN", id, o, d);
  }
}
// --- zones & palette
const geo = await page.evaluate(() => {
  const r = {};
  for (const id of ["plate", "banner", "mcard", "cta-panel"]) {
    const b = document.getElementById(id).getBoundingClientRect();
    r[id] = [b.left, b.top, b.width, b.height].map(Math.round);
  }
  return r;
});
console.log("zones", JSON.stringify(geo));
console.log(errs.length ? "PAGE ERRORS: " + errs.join(" | ") : "no page errors");
await browser.close();
process.exit(bad || errs.length ? 1 : 0);
