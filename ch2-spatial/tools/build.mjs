/* eslint-disable no-unused-vars */
// Builds compositions/<id>.html from src/<id>.js and writes index.html.
import fs from "node:fs";
import vm from "node:vm";
const root = new URL("..", import.meta.url).pathname;
const ctx = { window: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(root + "assets/data.js", "utf8"), ctx);
const { T, scenes } = ctx.window.DATA;
const css = fs.readFileSync(root + "src/common.css", "utf8");
const ids = scenes.map((s) => s[0]).filter((id) => fs.existsSync(`${root}src/${id}.js`));
for (const id of ids) {
  const js = fs.readFileSync(`${root}src/${id}.js`, "utf8");
  fs.writeFileSync(
    `${root}compositions/${id}.html`,
    `<template>
<style>
${css}
</style>
<div id="root" data-composition-id="${id}" data-width="1920" data-height="1080"></div>
<script>
(function(){
${js}
})();
</script>
</template>
`,
  );
}
const hosts = ids
  .map(
    (id, i) =>
      `    <div id="${id}" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${T[id].start}" data-duration="${T[id].dur}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`,
  )
  .join("\n");
const total = scenes[scenes.length - 1][2];
const audio = fs.existsSync(root + "assets/sfx.wav")
  ? `    <audio id="sfx" src="assets/sfx.wav" data-start="0" data-duration="${total}" data-volume="1"></audio>\n`
  : "";
fs.writeFileSync(
  root + "index.html",
  `<!doctype html>
<html lang="ar">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<script src="assets/gsap.min.js"></script>
<script>window.MathJax={svg:{fontCache:'none'},startup:{typeset:false}};</script>
<script src="assets/mathjax-tex-svg.js"></script>
<script src="assets/data.js"></script>
<script src="assets/engine.js"></script>
<script src="assets/kit.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;overflow:hidden;background:#F6F9FF}
#root{position:absolute;inset:0;background:linear-gradient(160deg,#F6F9FF 0%,#E4EDFD 100%)}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
${hosts}
${audio}</div>
<script>
window.__timelines = window.__timelines || {};
const tl = gsap.timeline({ paused: true });
window.__timelines["main"] = tl;
</script>
</body>
</html>
`,
);
console.log("built", ids.join(","), "total", total);
