// Renders src/*.src.html -> index.html + compositions/*.html (MathJax -> inline SVG, captions, data injection).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { D } from "./data.mjs";
import { CAPTIONS } from "./captions.mjs";
import { sfxHtml } from "./sfx.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const doc = mathjax.document("", {
  InputJax: new TeX({ packages: AllPackages }),
  OutputJax: new SVG({ fontCache: "none" }),
});

function texSvg(src) {
  const node = doc.convert(src, { display: false });
  const svg = adaptor.outerHTML(adaptor.firstChild(node));
  const vb = svg.match(/viewBox="([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)"/);
  const wEx = parseFloat(svg.match(/width="([\d.]+)ex"/)[1]);
  const wEm = parseFloat(vb[3]) / 1000,
    hEm = parseFloat(vb[4]) / 1000;
  const emPerEx = wEm / wEx;
  const va = svg.match(/vertical-align: (-?[\d.]+)ex/);
  const vaEm = va ? parseFloat(va[1]) * emPerEx : 0;
  return svg
    .replace(/ width="[^"]+"/, "")
    .replace(/ height="[^"]+"/, "")
    .replace(
      / style="[^"]*"/,
      ` style="width:${wEm.toFixed(3)}em;height:${hEm.toFixed(3)}em;vertical-align:${vaEm.toFixed(3)}em;overflow:visible"`,
    )
    .replace(/<svg /, '<svg aria-hidden="true" ');
}
const texCache = new Map();
const mathEl = (key) => {
  if (!D.tex[key]) throw new Error("unknown tex key " + key);
  if (!texCache.has(key)) texCache.set(key, texSvg(D.tex[key]));
  return `<bdi class="m" dir="ltr">${texCache.get(key)}</bdi>`;
};
const get = (p) => p.split(".").reduce((o, k) => o[k], D);
const fmt = (v) =>
  typeof v === "number"
    ? Number.isInteger(v)
      ? String(v)
      : v.toFixed(Math.abs(v) >= 100 ? 1 : 1)
    : v;
const fmtN = (v, n) => (n === undefined ? fmt(v) : Number(v).toFixed(+n));
const sub = (s) => s.replace(/\{\{([\w.]+)(?:\|(\d))?\}\}/g, (_, p, n) => fmtN(get(p), n));

function captionHtml(scene, startOffset) {
  return CAPTIONS[scene]
    .map(([a, b, text], i) => {
      const raw = sub(text).split(/\s+/),
        merged = [];
      for (const w of raw) {
        const lat = /^[A-Za-z][A-Za-z.,:؟!]*$/.test(w);
        const last = merged[merged.length - 1];
        if (lat && last && last.lat) last.t += " " + w;
        else merged.push({ t: w, lat });
      }
      const words = merged
        .map(({ t: w }) => {
          const m = w.match(/^(.*?)\[\[(\w+)\]\](.*)$/);
          if (m)
            return `<span class="w ltr">${m[1] ? `<bdi dir="rtl">${m[1]}</bdi>` : ""}${mathEl(m[2])}${m[3] ? `<bdi dir="rtl">${m[3]}</bdi>` : ""}</span>`;
          const latin = /[A-Za-z]/.test(w);
          return `<span class="w ${latin ? "ltr" : "rtl"}">${w}</span>`;
        })
        .join(" ");
      const id = `cap-${scene}-${String(i + 1).padStart(2, "0")}`;
      return `<div class="cap clip" id="${id}" data-start="${(a - startOffset).toFixed(2)}" data-duration="${(b - a).toFixed(2)}"><div class="cap-in">${words}</div></div>`;
    })
    .join("\n      ");
}

function render(name, out, scene) {
  let html = fs.readFileSync(path.join(root, "src", name), "utf8");
  const start = scene ? D.scenes[scene][0] : 0;
  html = html
    .replace("/*__COMMON_CSS__*/", fs.readFileSync(path.join(root, "src/common.css"), "utf8"))
    .replace("/*__COMMON_JS__*/", fs.readFileSync(path.join(root, "src/common.inc"), "utf8"));
  html = html.replace("/*__SFX__*/", sfxHtml());
  html = html.replace("/*__CAPTIONS__*/", scene ? captionHtml(scene, start) : "");
  html = html
    .replace(/\[\[(?:tex:)?(\w+)\]\]/g, (_, k) => mathEl(k))
    .replace(/\{\{([\w.]+)(?:\|(\d))?\}\}/g, (_, p, n) => fmtN(get(p), n));
  html = html.replace('"__DATA__"', JSON.stringify(D));
  fs.writeFileSync(path.join(root, out), html);
  console.log("built", out, html.length);
}
fs.mkdirSync(path.join(root, "compositions"), { recursive: true });
render("index.src.html", "index.html");
for (const s of ["lab", "table", "example", "outro"])
  render(`${s}.src.html`, `compositions/${s}.html`, s);
