import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
// usage: render.mjs in.(svg|html) out.png width height [scale]
const [, , inp, out, w = "600", h = "733", s = "1"] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +s });
await p.goto("file://" + (inp.startsWith("/") ? inp : process.cwd() + "/" + inp));
await p.waitForTimeout(300);
await p.screenshot({ path: out, fullPage: true });
await b.close();
