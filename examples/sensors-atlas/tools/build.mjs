// Builds index.html + compositions/*.html for the sensors atlas video.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { D, SENSORS, CHAPTERS, TAIL } from "./data.mjs";
import { sfxHtml } from "./sfx.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rd = (p) => fs.readFileSync(path.join(root, p), "utf8");
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
    hEm = parseFloat(vb[4]) / 1000,
    emPerEx = wEm / wEx;
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
const cache = new Map();
const svgOf = (k) => {
  if (!(k in D.tex)) throw new Error("unknown tex key " + k);
  if (!cache.has(k)) cache.set(k, texSvg(D.tex[k]));
  return cache.get(k);
};
const mathEl = (k) => `<bdi class="m" dir="ltr">${svgOf(k)}</bdi>`;
const get = (p) => p.split(".").reduce((o, k) => o[k], D);
const fmt = (v) => (typeof v === "number" ? (Number.isInteger(v) ? String(v) : v.toFixed(1)) : v);
const sub = (s) =>
  s.replace(/\{\{([\w.]+)(?:\|(\d))?\}\}/g, (_, p, n) =>
    n === undefined ? fmt(get(p)) : Number(get(p)).toFixed(+n),
  );
const COLS = {
  1: ["#1565FF", "#1565FF"],
  2: ["#00945E", "#00945E"],
  3: ["#18B5C8", "#0E8FA0"],
  4: ["#F26B00", "#D45A00"],
};

function wordsHtml(text) {
  const raw = sub(text).split(/\s+/),
    merged = [];
  for (const w of raw) {
    const lat = /^[A-Za-z][A-Za-z.,:؟!-]*$/.test(w);
    const last = merged[merged.length - 1];
    if (lat && last && last.lat) last.t += " " + w;
    else merged.push({ t: w, lat });
  }
  return merged
    .map(({ t: w }) => {
      const m = w.match(/^(.*?)\[\[(\w+)\]\](.*)$/);
      if (m)
        return `<span class="w ltr">${m[1] ? `<bdi dir="rtl">${m[1]}</bdi>` : ""}${mathEl(m[2])}${m[3] ? `<bdi dir="rtl">${m[3]}</bdi>` : ""}</span>`;
      return `<span class="w ${/[A-Za-z]/.test(w) ? "ltr" : "rtl"}">${w}</span>`;
    })
    .join(" ");
}
const cap = (ch, n, a, b, text, cls = "") =>
  `<div class="cap clip ${cls}" id="cap-${ch}-${String(n).padStart(3, "0")}" data-start="${a.toFixed(2)}" data-duration="${(b - a).toFixed(2)}"><div class="cap-in">${wordsHtml(text)}</div></div>`;
const chip = (id, k, sym, unit, dec, extra = "") =>
  `<div class="chip panel ${k}"><span class="cs">${mathEl(sym)}</span><span class="eq">=</span><span class="cv" id="n-${k === "in" ? "i" : "o"}-${id}">${(0).toFixed(dec)}</span><span class="cu">${unit}</span>${extra}</div>`;
const CHK = (id) =>
  `<svg class="chk" id="chk-${id}" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="#00945E" stroke="#fff" stroke-width="5"/><path d="M17 33l10 10 20-22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
function sensorHtml(s, ch) {
  const [c, ct] = COLS[ch.n],
    T = s.T,
    t0 = s.t0,
    gi = SENSORS.indexOf(s) + 1;
  const nm = s.name.length <= 13 ? 84 : s.name.length <= 22 ? 62 : 54;
  const q = sub(s.q);
  const card = `<div id="card-${s.id}" class="card clip" data-start="${t0}" data-duration="${T}"><div class="panel" style="--c:${c};--ct:${ct}"><div class="step">حسّاس ${gi} من ${SENSORS.length}</div><div class="q">${q}</div><div class="nm" style="font-size:${nm}px">${s.name
    .split(" ")
    .map((w) => `<span class="tw">${w}</span>`)
    .join(" ")}</div></div></div>`;
  const fp = `<div id="fp-${s.id}" class="fpanel clip" data-start="${(t0 + 7.7).toFixed(2)}" data-duration="${(T - 7.7).toFixed(2)}"><div class="panel" style="--c:${c}">${s.f
    .map((k, i) => {
      const L = D.tex[k].length,
        fs = L > 80 ? 34 : L > 55 ? 42 : L > 38 ? 50 : i ? 46 : 62;
      return `<div class="${i ? "f2" : "f1"}" style="font-size:${fs}px">${mathEl(k)}</div>`;
    })
    .join("")}</div></div>`;
  const [ti, ui, di, to, uo, dout] = s.io;
  const hud = `<div id="hi-${s.id}" class="hud clip" data-start="${t0}" data-duration="${T}" style="left:1000px;width:420px">${chip(s.id, "in", ti, ui, di).replace('class="chip panel in"', 'class="chip panel in" style="left:0"')}</div><div id="ho-${s.id}" class="hud clip" data-start="${t0}" data-duration="${T}" style="left:1446px;width:414px">${chip(s.id, "out", to, uo, dout, CHK(s.id)).replace('class="chip panel out"', 'class="chip panel out" style="left:0"')}</div>`;
  return card + "\n      " + fp + "\n      " + hud;
}
function chapterHtml(ch) {
  const [c] = COLS[ch.n];
  const intro = ch.hook
    ? `<div id="intro" class="clip hook" data-start="0" data-duration="${ch.intro}"><div class="blk"><div class="panel" style="--c:${c}"><div class="t1">كيف بتحس الآلة؟</div><div class="t2">${SENSORS.length} حسّاس · 4 فصول · فكرة وحدة</div></div></div></div>`
    : `<div id="intro" class="clip" data-start="0" data-duration="${ch.intro}"><div class="blk"><div class="t1" style="color:${COLS[ch.n][1]}">${ch.title}</div><div class="t2">${ch.sensors.length} حسّاسات</div></div></div>`;
  const sens = ch.sensors.map((s) => sensorHtml(s, ch)).join("\n      ");
  const axes = ch.sensors
    .map(
      (s) =>
        `<div class="axl" id="ax-${s.id}" style="left:640px;top:224px">${mathEl(s.io[0])}</div><div class="axl" id="ay-${s.id}" style="left:108px;top:-2px">${mathEl(s.io[3])}</div>`,
    )
    .join("");
  let n = 0;
  const caps = [];
  if (ch.hook)
    caps.push(cap(ch.id, ++n, 0.6, 6.2, "الروبوت ما عنده عيون ولا جلد… كيف بيعرف شو حواليه؟"));
  if (ch.hook) caps.push(cap(ch.id, ++n, 6.4, 7.7, "نبدأ بالحركة."));
  if (!ch.hook) caps.push(cap(ch.id, ++n, 0.6, ch.intro - 0.6, `فصل ${ch.title}.`));
  for (const s of ch.sensors) {
    const [a, b, c3] = s.caps,
      t0 = s.t0,
      T = s.T;
    caps.push(
      cap(ch.id, ++n, t0 + 0.5, t0 + 3.4, a),
      cap(ch.id, ++n, t0 + 3.7, t0 + 7.0, b),
      cap(ch.id, ++n, t0 + 7.9, t0 + T - 2.3, c3, "edge"),
      cap(ch.id, ++n, t0 + T - 2.0, t0 + T - 0.4, `اسمه ${s.name}.`),
    );
  }
  return { intro, sens, axes, caps: caps.join("\n      ") };
}
fs.mkdirSync(path.join(root, "compositions"), { recursive: true });
for (const ch of CHAPTERS) {
  const mf = `src/models-${ch.id}.inc`;
  if (!fs.existsSync(path.join(root, mf))) {
    console.log("skip", ch.id);
    continue;
  }
  const models = rd(mf),
    parts = chapterHtml(ch);
  const keys = new Set([...models.matchAll(/\[\s*"(\w+)"\s*,\s*\(/g)].map((m) => m[1]));
  const pool = {};
  for (const k of keys) pool[k] = svgOf(k);
  const chj = {
    id: ch.id,
    n: ch.n,
    intro: ch.intro,
    len: ch.len,
    sensors: ch.sensors.map((s) => ({ id: s.id, t0: s.t0, T: s.T, io: s.io, col: COLS[ch.n][0] })),
  };
  let h = rd("src/chapter.src.html");
  h = h
    .replace("/*__INTRO__*/", parts.intro)
    .replace("/*__SENS_HTML__*/", parts.sens)
    .replace("/*__AXES__*/", parts.axes)
    .replace("/*__CAPTIONS__*/", parts.caps);
  h = h.replace("/*__ENGINE__*/", rd("src/engine.inc")).replace("/*__MODELS__*/", models);
  h = h
    .split("__CH__")
    .join(ch.id)
    .replace('"__CHJSON__"', JSON.stringify(chj))
    .replace('"__TEXPOOL__"', JSON.stringify(pool))
    .replace('"__DATA__"', JSON.stringify(D));
  h = h
    .replace("__SCOPE0__", String(ch.sensors[0].t0))
    .replace("__SCOPEDUR__", String(ch.len - ch.sensors[0].t0));
  h = h
    .replace("/*__COMMON_CSS__*/", rd("src/common.css"))
    .replace("/*__COMMON_JS__*/", rd("src/common.inc"));
  fs.writeFileSync(path.join(root, `compositions/${ch.id}.html`), h);
  console.log("built", ch.id, h.length);
}
globalThis.__B = {
  fs,
  path,
  root,
  rd,
  D,
  SENSORS,
  CHAPTERS,
  TAIL,
  mathEl,
  wordsHtml,
  cap,
  sfxHtml,
  sub,
};
// tail scenes (table / example / outro) and index are produced by build-tail.mjs
await import("./build-tail.mjs").catch((e) => console.log("tail:", e.message));
