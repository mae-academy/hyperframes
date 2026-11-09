#!/usr/bin/env node
// theme-1 lint: checks a built reel project against the theme-1 rules.
//   node .claude/skills/theme-1/theme1-lint.mjs reels/<project>
// Reads index.html and assets/sfx.wav + assets/cues.json. Exit code 1 when a rule is broken.
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve(process.argv[2] || ".");
const fails = [],
  warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => warns.push(m);

const htmlPath = path.join(dir, "index.html");
if (!fs.existsSync(htmlPath)) {
  console.error("theme-1 lint: no index.html in " + dir);
  process.exit(2);
}
let html = fs.readFileSync(htmlPath, "utf8");
const duration = Number((html.match(/data-duration="([0-9.]+)"/) || [])[1]);

// --- composition contract
if (!/data-composition-id="main"/.test(html)) fail('root must have data-composition-id="main"');
if (!/data-width="1080"/.test(html) || !/data-height="1920"/.test(html))
  fail("canvas must be 1080x1920 (render at portrait-4k for UHD)");
if (!/data-fps="60"/.test(html)) fail('root must declare data-fps="60"');
if (!duration) fail("root must declare data-duration");
if (!/gsap\/3\.12\.5/.test(html)) fail("GSAP 3.12.5 from cdnjs is expected in index.html");
if (!/__timelines\["main"\]\s*=/.test(html)) fail('window.__timelines["main"] must be registered');

// --- palette (the vendored KaTeX stylesheet is skipped; its error colour is never shown)
const cut = html.indexOf(".katex{font-size:1em !important");
const own = cut > 0 ? html.slice(cut) : html;
const allowedHex = new Set([
  "0a0a10",
  "161622",
  "1e1e2e",
  "0088ff",
  "ff0044",
  "b026ff",
  "ffffff",
  "fff",
  "000",
  "000000",
]);
// A project may opt in to extra colours the user asked for explicitly (a country's flag, a client brand):
// palette-extra.json = { "reason": "...", "hex": ["#009B3A", ...] }. Without that file the palette stays strict.
const extraPath = path.join(dir, "palette-extra.json");
if (fs.existsSync(extraPath)) {
  const extra = JSON.parse(fs.readFileSync(extraPath, "utf8"));
  for (const h of extra.hex || []) allowedHex.add(h.replace("#", "").toLowerCase());
  console.log(
    "palette-extra.json: " +
      (extra.hex || []).length +
      " extra colours allowed (" +
      (extra.reason || "no reason given") +
      ")",
  );
}
for (const m of own.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
  const h = m[1].toLowerCase();
  if (!allowedHex.has(h) && !allowedHex.has(h.slice(0, 6)))
    fail("colour outside the palette: #" + h);
}
const allowedRgb = new Set([
  "255,255,255",
  "255,0,68",
  "0,136,255",
  "176,38,255",
  "30,30,46",
  "10,10,16",
  "0,0,0",
  "22,22,34",
]);
for (const m of own.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
  const k = `${m[1]},${m[2]},${m[3]}`;
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (r > 200 && g > 170 && b < 130) fail("yellow-ish colour rgb(" + k + ")");
  else if (!allowedRgb.has(k))
    warn(
      "rgb(" + k + ") is not a palette colour (fine only as a blend between two palette colours)",
    );
}
if (
  /\b(yellow|gold|orange|lime|green)\b/i.test(
    own.replace(/<[^>]*>/g, " ").replace(/\/\/[^\n]*/g, ""),
  )
)
  warn("a colour word (yellow, gold, orange, lime, green) appears in the source");

// --- typography
if (/class="[^"]*\b(mathbf|mathrm|mathbb|mathsf|mathtt|textrm|textsf|texttt)\b/.test(html))
  fail("upright or bold math style found (mathbf / mathrm / textrm ...)");
const bold = (html.match(/class="[^"]*\btextbf\b/g) || []).length;
if (bold !== 1) warn("expected exactly one textbf (the title, as bold italic); found " + bold);

// --- determinism
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");
for (const [re, why] of [
  [/Date\.now|new Date\(|performance\.now/, "wall-clock time"],
  [/Math\.random/, "unseeded random"],
  [/setTimeout|setInterval/, "timers"],
  [/requestAnimationFrame/, "rAF as a clock"],
  [/\bfetch\(|XMLHttpRequest/, "network at render time"],
  [/repeat:\s*-1/, "infinite repeat"],
])
  if (re.test(scripts)) fail("determinism: " + why + " in the page script");

// --- brand watermark policy
if (/id="bd\d"|class="bd"/.test(html))
  fail("drifting platform badge found (theme-1 has no corner Instagram badges)");
if (!/@MAE\.Academy/.test(html) && !/MAE\.Academy/.test(html))
  warn("brand watermark @MAE.Academy (about 12 percent, red, behind the graph) not found");

// --- audio
const wavPath = path.join(dir, "assets", "sfx.wav");
if (!fs.existsSync(wavPath)) warn("assets/sfx.wav missing (run scripts/make_sfx.py)");
else {
  const b = fs.readFileSync(wavPath);
  const ch = b.readUInt16LE(22),
    sr = b.readUInt32LE(24),
    bits = b.readUInt16LE(34);
  let off = 12,
    dataOff = 0,
    dataLen = 0;
  while (off < b.length - 8) {
    const id = b.toString("ascii", off, off + 4),
      len = b.readUInt32LE(off + 4);
    if (id === "data") {
      dataOff = off + 8;
      dataLen = len;
      break;
    }
    off += 8 + len;
  }
  if (sr !== 48000 || bits !== 16 || ch !== 2)
    fail(`sfx.wav must be 48 kHz 16-bit stereo (got ${sr} Hz, ${bits}-bit, ${ch} ch)`);
  const n = Math.floor(dataLen / (2 * ch));
  const x = new Float64Array(n);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    const v = b.readInt16LE(dataOff + i * 2 * ch) / 32768;
    x[i] = v;
    peak = Math.max(peak, Math.abs(v));
  }
  const dur = n / sr;
  if (duration && Math.abs(dur - duration) > 0.06)
    fail(`sfx.wav is ${dur.toFixed(2)} s but data-duration is ${duration} s`);
  if (peak >= 0.98) fail("sfx.wav peak " + peak.toFixed(3) + " is not below 0.98");
  let quietest = 0,
    humMin = 1e9;
  const win = Math.floor(sr * 0.5);
  for (let s = 0; s + win <= n; s += win) {
    let e = 0;
    for (let i = s; i < s + win; i++) e += x[i] * x[i];
    const db = 10 * Math.log10(e / win + 1e-12);
    quietest = Math.min(quietest, db);
  }
  // unbroken 50 Hz hum: Goertzel magnitude per second
  const w = (2 * Math.PI * 50) / sr;
  for (let s = 0; s + sr <= n; s += sr) {
    let re = 0,
      im = 0;
    for (let i = 0; i < sr; i++) {
      re += x[s + i] * Math.cos(w * i);
      im -= x[s + i] * Math.sin(w * i);
    }
    humMin = Math.min(humMin, (2 * Math.hypot(re, im)) / sr);
  }
  if (quietest < -40)
    fail(
      "sfx.wav has a nearly silent half-second window (" +
        quietest.toFixed(1) +
        " dBFS): sound must be continuous",
    );
  if (humMin < 0.03)
    fail(
      "50 Hz hum is not unbroken (weakest second amplitude " +
        humMin.toFixed(3) +
        ", expected about 0.08)",
    );
  console.log(
    `audio: ${dur.toFixed(2)} s, peak ${peak.toFixed(3)}, weakest 50 Hz second ${humMin.toFixed(3)}`,
  );
}
const cuesPath = path.join(dir, "assets", "cues.json");
if (!fs.existsSync(cuesPath))
  warn("assets/cues.json missing (measure.mjs exports it from the page)");
else {
  const cues = JSON.parse(fs.readFileSync(cuesPath, "utf8"));
  const kinds = {};
  for (const c of cues) {
    kinds[c.kind] = (kinds[c.kind] || 0) + 1;
    if (duration && (c.t < 0 || c.t > duration)) fail("cue outside the film: " + JSON.stringify(c));
  }
  console.log("cues: " + cues.length + " " + JSON.stringify(kinds));
}

for (const w of warns) console.log("WARN  " + w);
for (const f of fails) console.log("FAIL  " + f);
console.log(
  fails.length
    ? `theme-1 lint: ${fails.length} failure(s)`
    : "theme-1 lint: PASS" + (warns.length ? ` (${warns.length} warning(s))` : ""),
);
process.exit(fails.length ? 1 : 0);
