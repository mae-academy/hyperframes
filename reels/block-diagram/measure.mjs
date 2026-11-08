// Measures every [data-m] element (centre + size, canvas coordinates) after fonts load, and exports the cue list.
//   node measure.mjs          write layout.json + assets/cues.json
//   node measure.mjs --check  fail if layout.json is stale
import fs from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto("file://" + path.join(dir, "dist/index.html"));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);
const out = await page.evaluate(() => {
  const r = {};
  document.querySelectorAll("[data-m]").forEach((el) => {
    const b = (el.querySelector(":scope > .katex") || el).getBoundingClientRect();
    r[el.dataset.m] = {
      cx: +(b.left + b.width / 2).toFixed(1),
      cy: +(b.top + b.height / 2).toFixed(1),
      w: +b.width.toFixed(1),
      h: +b.height.toFixed(1),
    };
  });
  return { layout: r, cues: window.__CUES || null };
});
await browser.close();
if (errs.length) console.log("page errors:", errs.join(" | "));
const prev = fs.existsSync(path.join(dir, "layout.json"))
  ? fs.readFileSync(path.join(dir, "layout.json"), "utf8")
  : "";
const next = JSON.stringify(out.layout, null, 1);
if (process.argv.includes("--check")) {
  if (prev !== next) {
    console.error("layout.json is stale: re-run build.sh");
    process.exit(1);
  }
  console.log("layout ok (" + Object.keys(out.layout).length + " measured elements)");
} else {
  fs.writeFileSync(path.join(dir, "layout.json"), next);
  if (out.cues)
    fs.writeFileSync(path.join(dir, "assets/cues.json"), JSON.stringify(out.cues, null, 1));
  console.log(
    "measured",
    Object.keys(out.layout).length,
    "elements;",
    out.cues ? out.cues.length + " cues" : "no cues",
  );
}
