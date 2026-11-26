/* eslint-disable no-unused-vars */
// Collects every sound cue the scenes registered (window.__cues, absolute seconds) and synthesises assets/sfx.wav.
// Noise- and transient-based effects only (no tonal chimes). Usage: node tools/make-sfx.mjs <preview-url>
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("/opt/node-tools/node_modules/playwright");
const url = process.argv[2] || "http://localhost:3002/api/projects/ch2-spatial/preview";
const root = new URL("..", import.meta.url).pathname;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(url);
await p.waitForTimeout(5000);
const cues = await p.evaluate(() => Object.values(window.__cues || {}).flat());
await b.close();
cues.sort((a, c) => a[0] - c[0]);
fs.writeFileSync(root + "assets/cues.json", JSON.stringify(cues));
const SR = 48000,
  TOTAL = 178,
  N = SR * TOTAL;
const L = new Float32Array(N),
  R = new Float32Array(N);
let seed = 12345;
const rnd = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const noise = () => rnd() * 2 - 1;
const lp = (fc) => {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  return (x) => (y += a * (x - y));
};
const hp = (fc) => {
  const l = lp(fc);
  return (x) => x - l(x);
};
const base = {
  whoosh: 0.34,
  pop: 0.3,
  click: 0.28,
  tick: 0.18,
  servo: 0.2,
  sparkle: 0.26,
  riser: 0.42,
};
const gens = {
  whoosh(n) {
    const d = 0.62,
      out = new Float32Array(d * SR);
    const f1 = lp(1),
      f2 = lp(1);
    let y1 = 0,
      y2 = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / out.length,
        fc = 250 + 3200 * Math.sin((Math.PI * Math.min(1, t * 1.2)) / 2) ** 2,
        a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
      const x = noise();
      y1 += a * (x - y1);
      y2 += a * (y1 - y2);
      const env = Math.sin(Math.PI * Math.pow(t, 0.8)) ** 1.5;
      out[i] = (y1 - y2 * 0.6) * env * 2.2;
    }
    return out;
  },
  pop() {
    const d = 0.16,
      out = new Float32Array(d * SR);
    let ph = 0;
    const nz = hp(2500);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR,
        f = 90 + 260 * Math.exp(-t * 45);
      ph += (2 * Math.PI * f) / SR;
      out[i] = (Math.sin(ph) * Math.exp(-t * 32) + nz(noise()) * Math.exp(-t * 260) * 0.5) * 1.0;
    }
    return out;
  },
  click() {
    const d = 0.06,
      out = new Float32Array(d * SR);
    const h = hp(1800);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * 1500) / SR;
      out[i] = h(noise()) * Math.exp(-t * 480) * 0.9 + Math.sin(ph) * Math.exp(-t * 260) * 0.35;
    }
    return out;
  },
  tick() {
    const d = 0.04,
      out = new Float32Array(d * SR);
    const h = hp(3000);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] = h(noise()) * Math.exp(-t * 700) * 0.8;
    }
    return out;
  },
  servo(n, dur) {
    const d = Math.max(0.4, dur || 1.5),
      out = new Float32Array(d * SR),
      f = lp(700);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / out.length,
        fr = 70 + 55 * Math.sin(Math.PI * t);
      ph += (2 * Math.PI * fr) / SR;
      const saw = ((ph / (2 * Math.PI)) % 1) * 2 - 1;
      const env = Math.min(1, t * 8) * Math.min(1, (1 - t) * 8);
      out[i] = f(saw * 0.7 + noise() * 0.12) * env * 1.4;
    }
    return out;
  },
  sparkle() {
    const d = 0.9,
      out = new Float32Array(d * SR);
    const h = hp(5000);
    const grains = 22;
    for (let g = 0; g < grains; g++) {
      const t0 = Math.floor(rnd() * 0.55 * SR),
        len = Math.floor((0.03 + rnd() * 0.05) * SR),
        amp = 0.25 + rnd() * 0.4;
      for (let i = 0; i < len && t0 + i < out.length; i++)
        out[t0 + i] += h(noise()) * Math.exp(-(i / SR) * 70) * amp;
    }
    return out;
  },
  riser(n, dur) {
    const d = Math.max(1, dur || 2.9),
      out = new Float32Array(Math.floor((d + 0.8) * SR)),
      tot = Math.floor(d * SR);
    let y1 = 0;
    for (let i = 0; i < tot; i++) {
      const t = i / tot,
        fc = 180 + 7000 * t * t,
        a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
      y1 += a * (noise() - y1);
      out[i] = y1 * (0.08 + 1.5 * t * t * t);
    }
    let ph = 0;
    for (let i = 0; i < 0.8 * SR; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (55 + 40 * Math.exp(-t * 9))) / SR;
      out[tot + i] += Math.sin(ph) * Math.exp(-t * 6) * 1.1 + noise() * Math.exp(-t * 40) * 0.5;
    }
    return out;
  },
};
cues.forEach(([t, name, vol, dur], k) => {
  const g = gens[name];
  if (!g) return;
  const s = g(k, dur),
    pan = (rnd() - 0.5) * 0.4,
    gain = (base[name] || 0.3) * (vol || 1);
  const i0 = Math.max(0, Math.round(t * SR));
  for (let i = 0; i < s.length && i0 + i < N; i++) {
    L[i0 + i] += s[i] * gain * (1 - pan);
    R[i0 + i] += s[i] * gain * (1 + pan);
  }
});
let pk = 0;
for (let i = 0; i < N; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
const target = 0.7;
const k = pk > target ? target / pk : 1;
const buf = Buffer.alloc(N * 4 + 44);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[i] * k * 32767))), 44 + i * 4);
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[i] * k * 32767))), 46 + i * 4);
}
fs.writeFileSync(root + "assets/sfx.wav", buf);
const by = {};
cues.forEach((c) => (by[c[1]] = (by[c[1]] || 0) + 1));
console.log(
  "cues",
  cues.length,
  JSON.stringify(by),
  "raw peak",
  pk.toFixed(3),
  "scale",
  k.toFixed(3),
);
