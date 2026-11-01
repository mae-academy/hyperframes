// Records the REAL https://maeacademy.org/simulations/circuit-lab with headless Chromium.
// Usage: NODE_PATH=$(npm root -g) node scripts/record_site.cjs <outDir>
// Writes <outDir>/raw.webm and <outDir>/strings.json (visible text + seconds since video start).
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const OUT = process.argv[2] || "/tmp/cap";
const URL = "https://maeacademy.org/simulations/circuit-lab";
const W = 1080,
  H = 792; // H crops above the 3-phase icons (which contain yellow strokes)
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Text nodes actually rendered inside the recorded viewport (innerText-style, so CSS uppercase counts).
async function visibleStrings(page) {
  return page.evaluate((h) => {
    const seen = new Set();
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      const raw = n.textContent.replace(/\s+/g, " ").trim();
      if (!raw) continue;
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;
      if (r.width < 2 || r.bottom <= 0 || r.top >= h - 4) continue;
      const text = cs.textTransform === "uppercase" ? raw.toUpperCase() : raw;
      if (seen.has(text)) continue;
      seen.add(text);
      out.push({ text, x: Math.round(r.x), y: Math.round(r.y) });
    }
    return out;
  }, H);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  });
  const t0 = Date.now();
  const page = await ctx.newPage();
  const log = [];
  const mark = async (label) => {
    const t = (Date.now() - t0) / 1000;
    log.push({ label, t, strings: await visibleStrings(page) });
  };
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  // poll the DOM every ~100 ms so every visible string gets a first-seen time on the video clock
  const firstSeen = {};
  let polling = true;
  const poller = (async () => {
    while (polling) {
      const t = (Date.now() - t0) / 1000;
      for (const s of await visibleStrings(page))
        if (!(s.text in firstSeen)) firstSeen[s.text] = +t.toFixed(2);
      await sleep(60);
    }
  })();
  await mark("settled");
  const tStart = (Date.now() - t0) / 1000;
  await sleep(450);
  const tile = page.getByText("DC Voltage Source", { exact: true }).first();
  const box = await tile.boundingBox();
  const sx = box.x + box.width / 2,
    sy = box.y - 38;
  await page.mouse.move(sx, sy, { steps: 10 });
  await mark("pre-drag");
  await page.mouse.down();
  await page.mouse.move(520, 600, { steps: 16 });
  await page.mouse.move(700, 560, { steps: 16 });
  await page.mouse.up();
  await mark("after-drop");
  await sleep(1700);
  await mark("end");
  polling = false;
  await poller;
  await page.screenshot({ path: path.join(OUT, "end.png") });
  const video = page.video();
  await ctx.close();
  const vp = await video.path();
  fs.renameSync(vp, path.join(OUT, "raw.webm"));
  fs.writeFileSync(
    path.join(OUT, "strings.json"),
    JSON.stringify({ tStart, firstSeen, log }, null, 1),
  );
  await browser.close();
  console.log("tStart", tStart, "marks", log.map((l) => `${l.label}@${l.t.toFixed(2)}`).join(" "));
})();
