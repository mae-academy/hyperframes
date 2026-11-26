/* eslint-disable no-unused-vars */
const D = DATA,
  C = D.C;
const S = K.scene("outro", {});
const tl = S.tl;
S.seam({ noOut: true });
S.sfx("riser", -2.9, 0.8, 2.9); // one riser into the final impact
const line = K.el(
  "div",
  "",
  "position:absolute;left:96px;right:96px;top:250px;display:flex;flex-wrap:wrap;justify-content:center;gap:0 24px;direction:rtl;font-size:84px;font-weight:700;line-height:1.35;color:#0B1F3A;text-align:center;",
  S.layer,
);
const words = [
  ["مصفوفة", null],
  ["وحدة", null],
  ["بتحكي", null],
  ["وين", null],
  ["الجسم", null],
  ["وكيف", null],
  ["مايل", C.blue],
];
const spans = words.map(([w, c]) => {
  const s = K.el("span", "", "display:inline-block;" + (c ? "color:" + c : ""), line);
  s.textContent = w;
  return s;
});
tl.fromTo(
  spans,
  { opacity: 0, y: 60 },
  { opacity: 1, y: 0, duration: 0.2, ease: "power4.out", stagger: 0.09 },
  0.3,
);
S.sfx("pop", 0.3, 0.8);
const T = K.el(
  "div",
  "panel",
  `left:690px;top:520px;width:540px;height:170px;border-color:${C.gold};border-width:9px;display:flex;align-items:center;justify-content:center;`,
  S.layer,
);
T.appendChild(K.tex("{}^{A}_{B}T", 96, C.navy));
tl.fromTo(T, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, ease: "power4.out" }, 1.4);
S.sfx("sparkle", 1.4, 0.8);
const br = K.el(
  "div",
  "panel",
  `left:620px;top:790px;width:680px;height:130px;border-color:${C.navy};display:flex;align-items:center;justify-content:center;font:800 64px Inter;letter-spacing:.02em;color:#0B1F3A;border-width:7px;`,
  S.layer,
);
br.textContent = "MAE Academy";
tl.fromTo(br, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "power4.out" }, 2.4);
S.sfx("pop", 2.4, 0.8);
S.finish();
