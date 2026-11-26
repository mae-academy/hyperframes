/* eslint-disable no-unused-vars */
// Renders whole-second segments in parallel (HYPERFRAMES_RENDER_LOCK=off) with retries, then concatenates.
// usage: node tools/render-segments.mjs <fps> <quality> <segSeconds> <parallel> <outfile> [total=178]
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const [fps, q, segS, par, out, totalArg] = process.argv.slice(2);
const total = +(totalArg || 178);
const dir = `/tmp/segs_${fps}_${q}`;
fs.mkdirSync(dir, { recursive: true });
const jobs = [];
for (let s = 0; s < total; s += +segS)
  jobs.push({
    s,
    e: Math.min(total, s + +segS),
    f: path.join(dir, `seg_${String(s).padStart(3, "0")}.mp4`),
  });
const run = (j, attempt = 1) =>
  new Promise((res) => {
    if (fs.existsSync(j.f) && fs.statSync(j.f).size > 10000 && j.done) return res();
    const p = spawn(
      "npx",
      [
        "hyperframes",
        "render",
        "--start",
        String(j.s),
        "--end",
        String(j.e),
        "-f",
        fps,
        "-q",
        q,
        "-w",
        "1",
        "-o",
        j.f,
        "--quiet",
      ],
      {
        env: { ...process.env, HYPERFRAMES_RENDER_LOCK: "off" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let err = "";
    p.stderr.on("data", (d) => (err += d));
    p.stdout.on("data", (d) => (err += d));
    p.on("close", (c) => {
      const ok = c === 0 && fs.existsSync(j.f) && fs.statSync(j.f).size > 10000;
      if (ok) {
        j.done = true;
        console.log("ok", j.s, "-", j.e);
        res();
      } else if (attempt < 4) {
        console.log("retry", j.s, attempt, err.slice(-200));
        res(run(j, attempt + 1));
      } else {
        console.log("FAILED", j.s, err.slice(-400));
        res();
      }
    });
  });
let i = 0;
await Promise.all(
  Array.from({ length: +par }, async () => {
    while (i < jobs.length) {
      const j = jobs[i++];
      await run(j);
    }
  }),
);
const bad = jobs.filter((j) => !j.done);
if (bad.length) {
  console.log(
    "missing",
    bad.map((j) => j.s),
  );
  process.exit(1);
}
fs.writeFileSync(path.join(dir, "list.txt"), jobs.map((j) => `file '${j.f}'`).join("\n"));
console.log("segments done", jobs.length);
