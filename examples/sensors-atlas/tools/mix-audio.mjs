// Offline sound design: builds assets/mix.m4a (48 kHz stereo AAC) from the film's own timing.
//  - every cue is aligned so its PEAK lands one frame after the picture (light before sound)
//  - hits are high-passed, trimmed, pitch-rotated (3 variants) and panned along the cut direction (right -> left)
//  - the servo is synthesised from filtered noise whose centre frequency and level follow the sweep speed
//  - master: 35 Hz high-pass, gentle compressor, two-pass loudnorm (-20 LUFS, TP -1.5), limiter at -2.2 dBFS
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { D, CHAPTERS } from "./data.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SFX = path.resolve(root, "../../skills/media-use/audio/assets/sfx");
const SR = 48000,
  FPS = 30,
  N = Math.ceil((D.total + 1) * SR);
const L = new Float32Array(N),
  R = new Float32Array(N);
const decode = (f) => {
  const r = spawnSync(
    "ffmpeg",
    ["-v", "error", "-i", path.join(SFX, f), "-f", "f32le", "-ac", "1", "-ar", String(SR), "-"],
    { maxBuffer: 1 << 28 },
  );
  if (r.status) throw new Error("decode " + f);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.byteLength / 4).slice();
};
const hp = (x, fc) => {
  const a = Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0,
    px = 0;
  return x.map((v) => {
    y = a * (y + v - px);
    px = v;
    return y;
  });
};
const lp = (x, fc) => {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  return x.map((v) => (y += a * (v - y)));
};
const trim = (x, d, fo = 0.08) => {
  const n = Math.min(x.length, Math.round(d * SR)),
    y = x.slice(0, n),
    f = Math.round(fo * SR);
  for (let i = 0; i < f && i < n; i++) y[n - 1 - i] *= i / f;
  return y;
};
const resample = (x, r) => {
  const n = Math.floor(x.length / r),
    y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = i * r,
      k = Math.floor(p),
      f = p - k;
    y[i] = x[k] * (1 - f) + (x[k + 1] || 0) * f;
  }
  return y;
};
const peakIdx = (x) => {
  let m = 0,
    k = 0;
  for (let i = 0; i < x.length; i++)
    if (Math.abs(x[i]) > m) {
      m = Math.abs(x[i]);
      k = i;
    }
  return k;
};
const rms = (x) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
const norm = (x, target) => {
  const r = target / (rms(x) || 1);
  return x.map((v) => v * r);
};
// ---- library ----
const raw = {
  pop: decode("pop.mp3"),
  click: decode("click.mp3"),
  clickS: decode("click-soft.mp3"),
  whoosh: decode("whoosh.mp3"),
  whooshS: decode("whoosh-short.mp3"),
  riser: decode("riser.mp3"),
  impact: decode("impact-bass-2.mp3"),
  sparkle: decode("sparkle.mp3"),
};
const variants = (x, rs) => rs.map((r) => resample(x, r));
const lib = {
  pop: variants(norm(trim(hp(raw.pop, 110), 0.42), 0.09), [0.9, 1.0, 1.12]),
  tick: variants(norm(trim(hp(raw.clickS, 400), 0.2, 0.05), 0.07), [0.95, 1.05, 1.15]),
  click: variants(norm(trim(hp(raw.click, 180), 0.3, 0.06), 0.11), [0.97, 1.0]),
  thump: [norm(trim(lp(raw.clickS, 170), 0.32, 0.2), 0.12)],
  whoosh: variants(norm(trim(hp(raw.whoosh, 160), 0.57, 0.18), 0.07), [0.92, 1.0, 1.08]),
  whooshS: variants(norm(trim(hp(raw.whooshS, 200), 0.5, 0.15), 0.06), [1.0, 1.1]),
  riser: [norm(trim(raw.riser.slice(Math.round(0.6 * SR), Math.round(4.2 * SR)), 3.6, 0.02), 0.09)],
  impact: [norm(trim(raw.impact, 2.4, 0.5), 0.15)],
  sparkle: [norm(trim(hp(raw.sparkle, 600), 1.6, 0.4), 0.06)],
};
const rot = {};
const pick = (k) => {
  rot[k] = ((rot[k] ?? -1) + 1) % lib[k].length;
  return lib[k][rot[k]];
};
function servo(d, seed) {
  let s = seed >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const n = Math.round(d * SR),
    y = new Float32Array(n);
  let low = 0,
    band = 0;
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    sp = (x) => (ease(x + 1e-3) - ease(x - 1e-3)) / 2e-3 / 3; // speed 0..~1
  for (let i = 0; i < n; i++) {
    const x = i / n,
      v = Math.min(1.2, sp(x)),
      fc = 60 + 150 * v,
      f = 2 * Math.sin((Math.PI * fc) / SR),
      q = 0.35;
    low += f * band;
    const high = rnd() - low - q * band;
    band += f * high;
    y[i] =
      band *
      Math.pow(Math.max(0, v), 0.9) *
      (0.7 + 0.3 * Math.sin(2 * Math.PI * (24 + 30 * v) * x * d));
    const e = Math.min(1, i / 2400, (n - 1 - i) / 4800);
    y[i] *= e;
  }
  return norm(lp(y, 900), 0.06);
}
// ---- cue placement ----
let n = 0;
function put(buf, t, gain, pan = 0, sweep = 0, align = true) {
  const start = Math.round((t + (align ? 1 / FPS : 0)) * SR) - (align ? peakIdx(buf) : 0);
  for (let i = 0; i < buf.length; i++) {
    const k = start + i;
    if (k < 0 || k >= N) continue;
    const p = pan + sweep * (i / buf.length),
      l = Math.cos(((p + 1) * Math.PI) / 4),
      r = Math.sin(((p + 1) * Math.PI) / 4);
    L[k] += buf[i] * gain * l * 1.2;
    R[k] += buf[i] * gain * r * 1.2;
  }
  n++;
}
const G = {
  whoosh: 0.32,
  pop: 0.3,
  click: 0.42,
  thump: 0.34,
  servo: 0.3,
  riser: 0.3,
  impact: 0.5,
  sparkle: 0.3,
  tick: 0.22,
};
const seam = (t) => put(pick("whoosh"), t - 0.1, G.whoosh, 0.5, -1.0); // cut-the-curve leftwards: right -> left
const popAt = (t, g = G.pop, pan = 0) => put(pick("pop"), t, g, pan);
const tickAt = (t, g = G.tick, pan = 0) => put(pick("tick"), t, g, pan);
let sv = 1;
for (const ch of CHAPTERS) {
  if (ch.g0 > 0) seam(ch.g0);
  ch.sensors.forEach((s, i) => {
    const t0 = ch.g0 + s.t0,
      T = s.T,
      pan = i % 2 ? 0.12 : -0.12;
    if (i > 0) put(pick("whooshS"), t0 - 0.05, 0.2, 0.4, -0.8);
    popAt(t0 + 0.12, G.pop, pan);
    popAt(t0 + 0.24, 0.2, 0.25);
    popAt(t0 + 0.34, 0.18, 0.3);
    put(servo(4.0, 1000 + sv++), t0 + 3.0, G.servo, pan, 0, false);
    put(pick("click"), t0 + 7.5, G.click);
    put(pick("thump"), t0 + 7.5, G.thump);
    popAt(t0 + 7.8, 0.24);
    put(servo(T - 4.0 - 8.2, 2000 + sv++), t0 + 8.2, G.servo * 0.7, pan, 0, false);
    popAt(t0 + T - 3.05, 0.28, pan);
  });
}
{
  // Act-1 comparison table
  const t = D.layout.t1[0];
  seam(t);
  [1.4, 3.6, 5.8, 8.0].forEach((r) => popAt(t + r + 0.05, 0.26));
  popAt(t + 0.75, 0.22);
}
{
  // arena
  const t = D.layout.arena[0];
  seam(t);
  popAt(t + 0.5, 0.22);
  popAt(t + 1.1, 0.22);
  [0, 1, 2, 3].forEach((k) => {
    const a = 4.4 + k * 4.8;
    popAt(t + a - 3.2 + 0.05, 0.24);
    put(servo(2.2, 4000 + k), t + a - 3.0, 0.2, 0, 0, false);
  });
}
{
  // examples
  for (const id of ["ex1", "ex2"]) {
    const t = D.layout[id][0],
      rows = id === "ex1" ? [13.6, 17.4, 21.2] : [12.6, 16.6, 20.6],
      fin = id === "ex1" ? 28.0 : 26.2;
    seam(t);
    popAt(t + 1.0, 0.26);
    [0, 1, 2, 3].forEach((i) => tickAt(t + 1.55 + i * 0.7, 0.22));
    popAt(t + 5.5, 0.26);
    popAt(t + 9.7, 0.26);
    popAt(t + 10.5, 0.22);
    rows.forEach((r, k) => {
      popAt(t + r + 0.05, 0.26);
      put(servo(1.0, 3000 + k + (id === "ex1" ? 0 : 10)), t + r + 1.8, 0.2, 0, 0, false);
    });
    popAt(t + (id === "ex1" ? 25.6 : 23.8), 0.26);
    put(pick("click"), t + fin, G.click);
    put(pick("thump"), t + fin, G.thump);
  }
}
{
  // outro: whoosh in, riser into the final impact, sparkle when the brand card aligns
  const t = D.layout.outro[0];
  seam(t);
  put(lib.riser[0], t + 3.7 - 3.6, G.riser, 0, 0, false);
  put(lib.impact[0], t + 3.7, G.impact);
  put(pick("thump"), t + 3.7, 0.4);
  put(lib.sparkle[0], t + 3.95, G.sparkle, 0, 0, false);
}
// ---- master ----
const out = Buffer.alloc(N * 8);
for (let i = 0; i < N; i++) {
  out.writeFloatLE(L[i], i * 8);
  out.writeFloatLE(R[i], i * 8 + 4);
}
const tmp = path.join(root, ".mix_raw.f32");
fs.writeFileSync(tmp, out);
const base = ["-v", "error", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", tmp];
const pre = "highpass=f=35,acompressor=threshold=0.2:ratio=2.2:attack=12:release=180:makeup=1";
const m1 = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-nostats",
    ...base.map((v) => (v === "error" ? "info" : v)),
    "-af",
    `${pre},loudnorm=I=-20:TP=-1.5:LRA=7:print_format=json`,
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf8" },
);
const J = JSON.parse(m1.stderr.slice(m1.stderr.lastIndexOf("{")));
const ln = `loudnorm=I=-20:TP=-1.5:LRA=7:measured_I=${J.input_i}:measured_TP=${J.input_tp}:measured_LRA=${J.input_lra}:measured_thresh=${J.input_thresh}:offset=${J.target_offset}:linear=true`;
const m2 = spawnSync(
  "ffmpeg",
  [
    "-y",
    ...base,
    "-af",
    `${pre},${ln},alimiter=limit=0.78:level=disabled`,
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    path.join(root, "assets/mix.m4a"),
  ],
  { encoding: "utf8" },
);
fs.unlinkSync(tmp);
console.log(
  m2.status
    ? m2.stderr
    : `mix.m4a ok: ${n} cues, measured ${J.input_i} LUFS / ${J.input_tp} dBTP -> target -20 LUFS`,
);
