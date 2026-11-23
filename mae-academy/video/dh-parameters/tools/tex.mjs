// LaTeX -> inline SVG (MathJax, no font files needed: glyphs are paths, colour = currentColor)
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const doc = mathjax.document("", {
  InputJax: new TeX({ packages: AllPackages }),
  OutputJax: new SVG({ fontCache: "none" }),
});
const cache = new Map();
const EX = 0.431; // 1ex in em for the MathJax TeX font
/** returns {svg, w, h, va} for a font size in px; svg has explicit px width/height, preserved aspect */
export function tex(latex, px = 48) {
  const key = latex + "|" + px;
  if (cache.has(key)) return cache.get(key);
  const html = adaptor.outerHTML(doc.convert(latex, { display: false }));
  const m = html.match(/<svg([^>]*)>([\s\S]*)<\/svg>/);
  const attrs = m[1],
    inner = m[2];
  const num = (n) => parseFloat(attrs.match(new RegExp(n + '="([-\\d.]+)ex"'))[1]);
  const w = num("width") * EX * px,
    h = num("height") * EX * px;
  const va = parseFloat((attrs.match(/vertical-align:\s*([-\d.]+)ex/) || [0, "0"])[1]) * EX * px;
  const vb = attrs.match(/viewBox="([^"]+)"/)[1];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="${vb}" style="vertical-align:${va.toFixed(1)}px;overflow:visible" focusable="false">${inner.replace(/ data-mml-node="[^"]*"/g, "")}</svg>`;
  const r = { svg, w, h, va };
  cache.set(key, r);
  return r;
}
