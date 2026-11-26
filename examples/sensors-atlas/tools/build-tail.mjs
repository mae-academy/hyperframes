// table / example / outro scenes + index.html
import { CHG } from "./data.mjs";
const B = globalThis.__B,
  { fs, path, root, rd, D, CHAPTERS, TAIL, mathEl } = B;
const common = (h) =>
  h
    .replace("/*__COMMON_CSS__*/", rd("src/common.css"))
    .replace("/*__COMMON_JS__*/", rd("src/common.inc"));
const write = (n, h) => {
  fs.writeFileSync(path.join(root, n), h);
  console.log("built", n, h.length);
};
const cap = (sc, n, a, b, text, cls = "") => B.cap(sc, n, a, b, text, cls);
const CC = {
  1: ["#1565FF", "#1565FF"],
  2: ["#00945E", "#00945E"],
  3: ["#18B5C8", "#0E8FA0"],
  4: ["#F26B00", "#D45A00"],
};
const floorJs = (id) => `drawFloor(document.getElementById("${id}"));`;

// ---------------- summary table (4 pages, one per chapter) ----------------
{
  const PG = 6.4,
    pages = CHAPTERS.map((ch, k) => {
      const [c, ct] = CC[ch.n],
        t0 = 0.3 + PG * k;
      const rows = ch.sensors
        .map(
          (s) =>
            `<div class="rw panel" id="rw-${s.id}" style="--c:${c}"><div class="n">${s.name}</div><div class="g" style="color:${ct}">${CHG[s.id]}</div><div class="f">${mathEl("t_" + s.id)}</div></div>`,
        )
        .join("");
      return `<div id="pg${ch.n}" class="pg clip" data-start="${t0.toFixed(2)}" data-duration="${PG.toFixed(2)}"><div class="blk"><div class="ttl" style="color:${ct}">${ch.title}</div><div class="grid">${rows}</div></div></div>`;
    }).join("\n      ");
  const caps = [
    cap("table", 1, 0.6, 5.8, "الفصل ١: الحركة. كل حسّاس غيّر شي واحد."),
    cap("table", 2, 7.0, 12.4, "الفصل ٢: القوة واللمس والاهتزاز."),
    cap("table", 3, 13.4, 18.8, "الفصل ٣: الجريان. اثنا عشر حسّاس."),
    cap("table", 4, 19.8, 25.0, "الفصل ٤: الحرارة. والمعادلة دايماً من الكتاب."),
  ].join("\n      ");
  let h = `<template>
  <style>
/*__COMMON_CSS__*/
    .pg{position:absolute;left:0;top:0;width:1920px;height:1080px}
    .ttl{position:absolute;right:100px;top:34px;font-size:104px;font-weight:700;direction:rtl;line-height:1.15}
    .grid{position:absolute;left:100px;top:196px;width:1720px;display:grid;grid-template-columns:1fr 1fr;grid-auto-flow:column;grid-template-rows:repeat(5,1fr);gap:12px 24px;direction:rtl}
    .rw{display:flex;align-items:center;gap:14px;height:112px;padding:0 20px;opacity:0;border-width:6px}
    .rw .n{font-family:"Inter",sans-serif;font-weight:900;font-size:33px;width:300px;direction:ltr;text-align:right;line-height:1.1}
    .rw .g{font-size:34px;font-weight:700;width:190px;direction:rtl}
    .rw .f{flex:1;display:flex;justify-content:center;direction:ltr;font-size:38px;color:var(--navy)}
  </style>
  <div id="root" data-composition-id="table" data-width="1920" data-height="1080">
    <div class="stage" id="st-table"><svg class="floor" id="fl-table" data-layout-ignore viewBox="0 0 1920 1080" width="1920" height="1080"></svg>
      ${pages}
      ${caps}
    </div></div>
  <script>
/*__COMMON_JS__*/
  (function () {
    const tl = gsap.timeline({ paused: true }); ${floorJs("fl-table")} seamIn(tl, "#st-table");
    const PG = ${PG};
    for (let k = 0; k < 4; k++) { const t = 0.3 + PG * k; const pg = "#pg" + (k + 1);
      tl.fromTo(pg + " .ttl", { opacity: 0, x: 230 }, { opacity: 1, x: 0, duration: 0.4, ease: "power4.out" }, t);
      document.querySelectorAll(pg + " .rw").forEach((r, i) => tl.fromTo(r, { opacity: 0, x: 120 }, { opacity: 1, x: 0, duration: 0.32, ease: "power4.out" }, t + 0.5 + i * 0.38));
      if (k < 3) tl.fromTo(pg + " .blk", { x: 0, opacity: 1 }, { x: -230, opacity: 0, duration: 0.34, ease: "power4.in", immediateRender: false }, t + PG - 0.36); }
    capCascade(tl, "table"); seamOut(tl, ${TAIL.table}, "#st-table"); window.__timelines["table"] = tl;
  })();
  </script>
</template>`;
  write("compositions/table.html", common(h));
}
// ---------------- worked example (book: speed-control uncertainty) ----------------
{
  const E = D.ex,
    mm = (v) => (v * 1000).toFixed(2);
  const T = (k) => mathEl(k);
  const caps = [
    cap("example", 1, 0.8, 4.6, "مثال من الكتاب: سرعة الدوران [[om]] من القوة والكتلة والنصف قطر."),
    cap("example", 2, 5.0, 8.4, "أول شي: ما فيش خطأ بالقانون، الخطأ بالمدخلات."),
    cap("example", 3, 8.8, 12.6, "بنجمع خطأ كل مدخل بوزنه: القانون اللي شفناه."),
    cap("example", 4, 13.0, 16.6, `خطأ [[xF]]: {{ex.cF}} من ألف.`.replace("{{ex.cF}}", mm(E.c[0]))),
    cap("example", 5, 16.8, 20.2, `خطأ [[xr]]: ${mm(E.c[2])} من ألف.`),
    cap("example", 6, 20.4, 23.6, `خطأ [[xm]]: ${mm(E.c[1])} من ألف، صغير كتير.`),
    cap("example", 7, 23.9, 27.5, `المجموع ${mm(E.sum)} من ألف rad/s، يعني ${E.pct.toFixed(2)}٪.`),
  ].join("\n      ");
  const rowsDef = [
    ["xF", "giv_F", "dF_v", E.p[0], E.c[0], 12.6],
    ["xm", "giv_m", "dm_v", E.p[1], E.c[1], 16.6],
    ["xr", "giv_r", "dr_v", E.p[2], E.c[2], 20.6],
  ];
  D.tex.dF_v = "0.5\\,\\mathrm{N}";
  D.tex.dm_v = "0.01\\,\\mathrm{kg}";
  D.tex.dr_v = "0.01\\,\\mathrm{mm}";
  D.tex.v_om = `\\omega = ${E.om.toFixed(0)}\\ \\mathrm{rad/s}`;
  D.tex.tot = `\\Delta\\omega = ${(E.sum * 1000).toFixed(2)}\\times10^{-3}\\ \\mathrm{rad/s}`;
  D.tex.pct = `\\dfrac{\\Delta\\omega}{\\omega} = ${E.pct.toFixed(3)}\\,\\%`;
  const rows = rowsDef
    .map(
      ([x, g, dd], i) =>
        `<div class="row panel" id="r${i}" style="--c:var(--orange)"><div class="k1">${T(x)}</div><div class="k2">${T(g)}</div><div class="k3">${T(dd)}</div><div class="k4"><span class="num" id="w${i}"></span></div><div class="k5"><span class="num g" id="c${i}"></span></div></div>`,
    )
    .join("");
  let h = `<template>
  <style>
/*__COMMON_CSS__*/
    .ttl{position:absolute;right:90px;top:46px;font-size:92px;font-weight:700;direction:rtl;line-height:1.15}
    #giv{position:absolute;left:1180px;top:176px;width:650px;height:520px;padding:18px 30px;--c:var(--blue);opacity:0}
    #giv h3{font-size:40px;font-weight:700;direction:rtl;margin-bottom:6px}
    .gl{font-size:48px;height:78px;display:flex;align-items:center;justify-content:center;opacity:0}
    .gl.f{height:100px;font-size:62px}
    #dN{position:absolute;left:90px;top:176px;width:1060px;height:112px;--c:var(--teal);display:flex;align-items:center;justify-content:center;font-size:44px;opacity:0}
    #tbl{position:absolute;left:90px;top:300px;width:1060px}
    .row{display:flex;direction:rtl;align-items:center;height:92px;padding:0 14px;margin-bottom:8px;opacity:0;gap:6px}
    .row.hd{height:64px;font-size:30px;font-weight:700;color:rgba(11,31,58,.72)}
    .row > div{flex:none;display:flex;align-items:center;justify-content:center;direction:ltr;font-size:40px}
    .k1{width:120px}.k2{width:300px;font-size:32px}.k3{width:210px;font-size:34px}.k4{width:200px}.k5{width:190px}
    .row.hd > div{direction:rtl;font-size:30px}
    .num{font-family:"Inter",sans-serif;font-weight:900;font-variant-numeric:tabular-nums;font-size:44px}
    .num.g{color:var(--green)}
    #res{position:absolute;left:90px;top:724px;width:1060px;height:96px;--c:var(--green);display:flex;align-items:center;justify-content:space-around;font-size:50px;opacity:0;padding:0 18px}
    #resChk{position:absolute;left:-30px;top:-34px;width:68px;height:68px;opacity:0}
    #fom{position:absolute;left:1180px;top:716px;width:650px;height:104px;--c:var(--purple);display:flex;align-items:center;justify-content:center;font-size:62px;opacity:0}
  </style>
  <div id="root" data-composition-id="example" data-width="1920" data-height="1080">
    <div class="stage" id="st-example"><svg class="floor" id="fl-example" data-layout-ignore viewBox="0 0 1920 1080" width="1920" height="1080"></svg>
      <div class="ttl" id="ttl-example">مثال من الكتاب: تحكّم بالسرعة</div>
      <div id="giv" class="panel clip" data-start="0.9" data-duration="26.4"><h3>المعطيات</h3><div class="gl" id="g1">${T("giv_F")}</div><div class="gl" id="g2">${T("giv_m")}</div><div class="gl" id="g3">${T("giv_r")}</div><div class="gl" id="g4" style="font-size:44px">${T("v_om")}</div></div>
      <div id="fom" class="panel clip" data-start="5.2" data-duration="22.1">${T("f_om")}</div>
      <div id="dN" class="panel clip" data-start="8.8" data-duration="18.5">${T("f_dN")}</div>
      <div id="tbl" class="clip" data-start="9.6" data-duration="17.7">
        <div class="row hd" id="h"><div class="k1">المدخل</div><div class="k2">القيمة والخطأ</div><div class="k3">الخطأ</div><div class="k4">الوزن |∂ω/∂x|</div><div class="k5">المساهمة ×10⁻³</div></div>
        ${rows}
      </div>
      <div id="res" class="panel clip" data-start="23.6" data-duration="3.8"><span>${T("tot")}</span><span>${T("pct")}</span><svg id="resChk" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="#00945E" stroke="#fff" stroke-width="5"/><path d="M17 33l10 10 20-22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      ${caps}
    </div></div>
  <script>
/*__COMMON_JS__*/
  (function () {
    const E = ${JSON.stringify(E)};
    const tl = gsap.timeline({ paused: true }); ${floorJs("fl-example")} seamIn(tl, "#st-example");
    const pop = (s, t, x = 230) => tl.fromTo(s, { opacity: 0, x }, { opacity: 1, x: 0, duration: 0.45, ease: "power4.out" }, t);
    pop("#giv", 0.9); ["#g1", "#g2", "#g3", "#g4"].forEach((s, i) => pop(s, 1.5 + i * 0.6, 60)); pop("#fom", 5.3); pop("#dN", 8.9); pop("#h", 9.9);
    const cnt = (id, to, dec, t, dur, sc) => { const el = document.getElementById(id), o = { v: 0 }; el.textContent = (0).toFixed(dec); tl.fromTo(o, { v: 0 }, { v: to * sc, duration: dur, ease: "power1.out", onUpdate: () => { el.textContent = o.v.toFixed(dec); } }, t); };
    [["#r0", "w0", E.p[0], "c0", E.c[0], 12.6], ["#r1", "w1", E.p[1], "c1", E.c[1], 16.6], ["#r2", "w2", E.p[2], "c2", E.c[2], 20.6]].forEach(([row, w, pv, c, cv, t]) => { pop(row, t); cnt(w, pv, 3, t + 0.8, 0.8, 1); cnt(c, cv, 2, t + 1.8, 1.0, 1000); });
    pop("#res", 23.7); tl.fromTo("#resChk", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power3.out" }, 26.2);
    capCascade(tl, "example"); seamOut(tl, ${TAIL.example}, "#st-example"); window.__timelines["example"] = tl;
  })();
  </script>
</template>`;
  write("compositions/example.html", common(h));
}
// ---------------- outro ----------------
{
  const h = `<template>
  <style>
/*__COMMON_CSS__*/
    #line{position:absolute;left:0;right:0;top:170px;text-align:center;font-size:136px;font-weight:700;line-height:1.25;direction:rtl}
    #brand{position:absolute;left:380px;top:580px;width:1160px;height:290px;--c:var(--blue);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;opacity:0}
    #brand .b1{font-family:"Inter",sans-serif;font-weight:900;font-size:124px;letter-spacing:-2px;color:var(--navy);line-height:1;white-space:nowrap}
    #brand .b1 em{font-style:normal;color:var(--blue)}
    #brand .b2{font-size:44px;font-weight:700;color:var(--navy);direction:rtl}
  </style>
  <div id="root" data-composition-id="outro" data-width="1920" data-height="1080">
    <div class="stage" id="st-outro"><svg class="floor" id="fl-outro" data-layout-ignore viewBox="0 0 1920 1080" width="1920" height="1080"></svg>
      <div id="line">كل حسّاس: <span style="color:var(--orange)">تغيّر فيزيائي</span> ← <span style="color:var(--green)">تغيّر كهربائي</span></div>
      <div id="brand" class="panel clip" data-start="3.6" data-duration="4.4"><div class="b1">MAE <em>Academy</em></div><div class="b2">هندسة بالبسيط</div></div>
    </div></div>
  <script>
/*__COMMON_JS__*/
  (function () {
    const tl = gsap.timeline({ paused: true }); ${floorJs("fl-outro")}
    tl.fromTo("#st-outro", { x: 230, opacity: 0.35 }, { x: 0, opacity: 1, duration: 0.42, ease: "power4.out" }, 0);
    tl.fromTo("#brand", { opacity: 0, y: 80 }, { opacity: 1, y: 0, duration: 0.45, ease: "power4.out" }, 3.7);
    window.__timelines["outro"] = tl;
  })();
  </script>
</template>`;
  write("compositions/outro.html", common(h));
}
// ---------------- index ----------------
{
  const host = (id, a, d) =>
    `<div id="${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${a}" data-duration="${d}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`;
  const hosts = [
    ...CHAPTERS.map((c) => host(c.id, c.g0, c.len)),
    host("table", D.tail.table[0], TAIL.table),
    host("example", D.tail.example[0], TAIL.example),
    host("outro", D.tail.outro[0], TAIL.outro),
  ].join("\n      ");
  const audio = fs.existsSync(path.join(root, "assets/mix.m4a"))
    ? `<audio id="mix" class="clip" src="assets/mix.m4a" data-start="0" data-duration="${D.total}" data-track-index="20" data-volume="1"></audio>`
    : "";
  const h = `<!doctype html>
<html lang="ar">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>*{margin:0;padding:0;box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#F6F9FF}#root{position:relative;width:1920px;height:1080px;overflow:hidden}.ground{position:absolute;inset:0;background:linear-gradient(160deg,#F6F9FF 0%,#E4EDFD 100%)}</style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D.total}" data-width="1920" data-height="1080">
      <div class="ground"></div>
      ${hosts}
      ${audio}
    </div>
    <script>window.__timelines = window.__timelines || {}; window.__timelines["main"] = gsap.timeline({ paused: true });</script>
  </body>
</html>
`;
  write("index.html", h);
}
