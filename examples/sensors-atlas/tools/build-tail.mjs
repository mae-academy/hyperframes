// Act-1 comparison table, Act-5 arena, two worked examples, outro, index.html
const B = globalThis.__B,
  { fs, path, root, rd, D, CHAPTERS, mathEl } = B;
const common = (h) =>
  h
    .replace("/*__COMMON_CSS__*/", rd("src/common.css"))
    .replace("/*__COMMON_JS__*/", rd("src/common.inc"));
const write = (n, h) => {
  fs.writeFileSync(path.join(root, n), common(h));
  console.log("built", n, h.length);
};
const cap = (sc, n, a, b, text, cls = "") => B.cap(sc, n, a, b, text, cls);
const T = (k) => mathEl(k);
const L = D.layout,
  len = (id) => L[id][1] - L[id][0];
const floor = (id) =>
  `<svg class="floor" id="fl-${id}" data-layout-ignore viewBox="0 0 1920 1080" width="1920" height="1080"></svg>`;
const SHELL = (id, css, body, js) => `<template>
  <style>
/*__COMMON_CSS__*/
${css}
  </style>
  <div id="root" data-composition-id="${id}" data-width="1920" data-height="1080">
    <div class="stage" id="st-${id}">${floor(id)}
${body}
    </div></div>
  <script>
/*__COMMON_JS__*/
  (function () {
    const tl = gsap.timeline({ paused: true }); drawFloor(document.getElementById("fl-${id}")); seamIn(tl, "#st-${id}");
    const pop = (s, t, x = 230) => tl.fromTo(s, { opacity: 0, x }, { opacity: 1, x: 0, duration: 0.45, ease: "power4.out" }, t);
${js}
    capCascade(tl, "${id}"); seamOut(tl, ${len(id)}, "#st-${id}"); window.__timelines["${id}"] = tl;
  })();
  </script>
</template>`;

// ---------------- Act 1 mini-comparison ----------------
{
  const rows = [
    ["Potentiometer", "مقاومة R", "f_pot", "بسيط ورخيص، بس بطيء ودقّته قليلة", "#1565FF"],
    ["Capacitance", "سعة C", "f_cap", "حسّاس جداً، بس مش خطّي", "#18B5C8"],
    ["Differential capacitor", "فرق جهد ΔE", "f_diff", "خطّي، وبالنص صفر", "#00945E"],
    ["LVDT", "حث متبادل M ← جهد E₀", "f_lvdt", "دقيق وثابت، ومدى خطّي واسع", "#7A3CFF"],
  ];
  const html = rows
    .map(
      ([n, c, f, note, col], i) =>
        `<div class="tr panel" id="r${i}" style="--c:${col}"><div class="c1">${n}</div><div class="c2">${c}</div><div class="c3">${T(f)}</div><div class="c4">${note}</div></div>`,
    )
    .join("");
  const caps = [
    cap("t1", 1, 0.8, 3.6, "مقارنة سريعة للفصل الأول."),
    cap("t1", 2, 3.9, 7.6, "كل واحد غيّر شي واحد: R أو C أو M."),
    cap("t1", 3, 7.9, 11.4, "اختار حسب الدقة والكلفة."),
  ].join("\n      ");
  const css = `.ttl{position:absolute;left:0;right:0;top:46px;text-align:center;font-size:104px;font-weight:700;direction:rtl;line-height:1.15}
    .tb{position:absolute;left:100px;top:210px;width:1720px}
    .tr{display:flex;direction:rtl;align-items:center;gap:16px;height:136px;margin-bottom:14px;padding:0 24px;opacity:0}
    .tr.hd{height:64px;border:none;background:none;box-shadow:none;font-size:32px;color:rgba(11,31,58,.78);font-weight:700;margin-bottom:6px}
    .c1{width:360px;font-family:"Inter",sans-serif;font-weight:900;font-size:44px;direction:ltr;text-align:right;line-height:1.1}
    .c2{width:310px;font-size:42px;font-weight:700;color:var(--green);direction:rtl}
    .c3{width:480px;font-size:46px;display:flex;justify-content:center;direction:ltr}
    .c4{width:440px;font-size:34px;line-height:1.3;font-weight:600;direction:rtl}`;
  const body = `      <div class="ttl" id="ttl-t1">مقارنة الفصل الأول</div>
      <div class="tb"><div class="tr hd" id="hd"><div class="c1" style="font-family:inherit;direction:rtl">الحسّاس</div><div class="c2" style="color:inherit">شو بيتغيّر؟</div><div class="c3" style="font-family:inherit;font-size:32px">المعادلة</div><div class="c4" style="font-size:32px">ملاحظة</div></div>${html}</div>
${caps}`;
  const js = `    pop("#hd", 0.7); [1.4, 3.6, 5.8, 8.0].forEach((t, i) => pop("#r" + i, t));`;
  write("compositions/t1.html", SHELL("t1", css, body, js));
}
// ---------------- Act 5 arena: four response curves on one axis ----------------
{
  const caps = [
    cap("arena", 1, 0.8, 4.4, "أربع حسّاسات حرارة على محور واحد."),
    cap("arena", 2, 4.7, 9.4, "RTD والمزدوج الحراري خطّيين تقريباً."),
    cap("arena", 3, 9.7, 14.4, "الثرمستور حسّاس جداً بس مش خطّي أبداً."),
    cap("arena", 4, 14.7, 19.2, "والبيرومتر بيقيس عن بعد، بس بأُس أربعة."),
  ].join("\n      ");
  const rows = [
    ["RTD", "#F26B00", "خطّي", "متوسطة", "−100…850 °C", "تلامس"],
    ["NTC thermistor", "#7A3CFF", "غير خطّي", "عالية جداً", "−50…150 °C", "تلامس"],
    ["Thermocouple", "#00945E", "شبه خطّي", "قليلة", "0…1000 °C", "تلامس"],
    ["Pyrometer", "#E5173F", "أُس أربعة", "تزيد مع الحرارة", "200…1000 °C", "بدون تلامس"],
  ];
  const lg = rows
    .map(
      ([n, col, a, b, c, d], i) =>
        `<div class="lg panel" id="lg${i}" style="--c:${col}"><div class="n" style="color:${col === "#F26B00" ? "#D45A00" : col}">${n}</div><div>${a}</div><div>${b}</div><div style="direction:ltr;font-family:Inter">${c}</div><div>${d}</div></div>`,
    )
    .join("");
  const css = `.ttl{position:absolute;right:90px;top:40px;font-size:96px;font-weight:700;direction:rtl}
    #ch{position:absolute;left:70px;top:170px;width:900px;height:660px;--c:var(--blue);opacity:0}
    #ch svg{position:absolute;left:0;top:0}
    #lgs{position:absolute;left:1000px;top:170px;width:880px}
    .lgh,.lg{display:grid;grid-template-columns:1.7fr 1fr 1.25fr 1.5fr 1.1fr;gap:8px;align-items:center;direction:rtl;font-size:30px;font-weight:700;padding:0 14px}
    .lgh{height:60px;color:rgba(11,31,58,.78);opacity:0;font-size:29px}
    .lg{height:134px;margin-bottom:12px;border-width:6px;opacity:0;line-height:1.25}
    .lg .n{font-family:"Inter",sans-serif;font-weight:900;font-size:32px;direction:ltr;text-align:right}`;
  const body = `      <div class="ttl" id="ttl-arena">مقارنة حسّاسات الحرارة</div>
      <div id="ch" class="panel clip" data-start="0.9" data-duration="18.8"><svg id="chs" viewBox="0 0 980 640" width="900" height="660"></svg></div>
      <div id="lgs" class="clip" data-start="1.2" data-duration="18.5"><div class="lgh" id="lgh"><div>الحسّاس</div><div>الخطّية</div><div>الحساسية</div><div>المدى</div><div>التلامس</div></div>${lg}</div>
${caps}`;
  const js = `    const K = ${JSON.stringify(D.k)};
    const X0 = 90, X1 = 940, Y0 = 570, Y1 = 40, T0 = -100, T1 = 1000, X = (t) => X0 + ((t - T0) / (T1 - T0)) * (X1 - X0), Y = (v) => Y0 - v * (Y0 - Y1);
    const rtd = (t) => 100 * (1 + 0.00385 * t), thm = (t) => K.thm.R0 * Math.exp(K.thm.beta * (1 / (t + 273.15) - 1 / (K.thm.T0 + 273.15))), rad = (t) => Math.pow(t + 273.15, 4);
    const C = [
      ["#F26B00", -100, 850, (t) => (rtd(t) - rtd(-100)) / (rtd(850) - rtd(-100))],
      ["#7A3CFF", -50, 150, (t) => (thm(-50) - thm(t)) / (thm(-50) - thm(150))],
      ["#00945E", 0, 1000, (t) => t / 1000],
      ["#E5173F", 200, 1000, (t) => (rad(t) - rad(200)) / (rad(1000) - rad(200))],
    ];
    let s = \`<line x1="\${X0}" y1="\${Y0}" x2="\${X1}" y2="\${Y0}" stroke="#0B1F3A" stroke-width="4" stroke-linecap="round"/><line x1="\${X0}" y1="\${Y1 - 10}" x2="\${X0}" y2="\${Y0}" stroke="#0B1F3A" stroke-width="4" stroke-linecap="round"/>\`;
    for (const t of [-100, 200, 500, 800, 1000]) s += \`<line x1="\${X(t)}" y1="\${Y0}" x2="\${X(t)}" y2="\${Y0 + 10}" stroke="#0B1F3A" stroke-width="4"/><text x="\${X(t)}" y="\${Y0 + 48}" font-family="Inter" font-weight="700" font-size="30" fill="#0B1F3A" text-anchor="middle">\${t}</text>\`;
    s += \`<text x="\${X1}" y="\${Y0 - 14}" font-family="Inter" font-weight="900" font-size="32" fill="#0B1F3A" text-anchor="end">T (°C)</text><text x="\${X0 + 16}" y="\${Y1 + 8}" font-family="Inter" font-weight="900" font-size="30" fill="#0B1F3A">1.0</text>\`;
    C.forEach(([col, a, b, f], k) => { let d = ""; for (let i = 0; i <= 80; i++) { const t = a + ((b - a) * i) / 80; d += (i ? "L" : "M") + X(t).toFixed(1) + " " + Y(f(t)).toFixed(1); } s += \`<path id="cv\${k}" d="\${d}" fill="none" stroke="\${col}" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>\`; });
    document.getElementById("chs").innerHTML = s;
    pop("#ttl-arena", 0.4, 0); pop("#ch", 1.0); pop("#lgh", 1.3, 120);
    C.forEach((c, k) => { const t = 4.4 + k * 4.8; pop("#lg" + k, t - 3.2, 120); tl.fromTo("#cv" + k, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.2, ease: "power1.inOut" }, t - 3.0); });`;
  write("compositions/arena.html", SHELL("arena", css, body, js));
}
// ---------------- worked example 1: speed control (book) ----------------
{
  const E = D.ex,
    mm = (v) => v.toFixed(4);
  const caps = [
    cap("ex1", 1, 0.8, 5.0, "مثال من الكتاب: سرعة الدوران [[om]] من القوة والكتلة والنصف قطر."),
    cap("ex1", 2, 5.3, 9.2, "القيمة الاسمية: [[om]] تساوي جذر [[F]] على [[m]][[r]]."),
    cap("ex1", 3, 9.5, 13.4, "بنجمع خطأ كل مدخل بوزنه: القانون اللي شفناه."),
    cap("ex1", 4, 13.8, 17.4, `خطأ [[xF]]: ${mm(E.c[0])} راد/ث.`),
    cap("ex1", 5, 17.6, 21.2, `خطأ [[xm]]: ${mm(E.c[1])} راد/ث، صغير كتير.`),
    cap("ex1", 6, 21.4, 25.0, `خطأ [[xr]]: ${mm(E.c[2])} راد/ث.`),
    cap(
      "ex1",
      7,
      25.3,
      29.4,
      `المجموع ${E.sum.toFixed(3)} راد/ث، يعني ${E.pct.toFixed(3)}٪ تقريباً.`,
    ),
  ].join("\n      ");
  const defs = [
    ["xF", "giv_F", "dF_v", E.p[0], E.c[0], 13.6],
    ["xm", "giv_m", "dm_v", E.p[1], E.c[1], 17.4],
    ["xr", "giv_r", "dr_v", E.p[2], E.c[2], 21.2],
  ];
  const rows = defs
    .map(
      ([x, g, dd], i) =>
        `<div class="row panel" id="r${i}" style="--c:var(--orange)"><div class="k1">${T(x)}</div><div class="k2">${T(g)}</div><div class="k3">${T(dd)}</div><div class="k4"><span class="num" id="w${i}"></span></div><div class="k5"><span class="num g" id="c${i}"></span></div></div>`,
    )
    .join("");
  const css = `.ttl{position:absolute;right:90px;top:46px;font-size:92px;font-weight:700;direction:rtl;line-height:1.15}
    #giv{position:absolute;left:1180px;top:176px;width:650px;height:470px;padding:18px 30px;--c:var(--blue);opacity:0}
    #giv h3{font-size:40px;font-weight:700;direction:rtl;margin-bottom:6px}
    .gl{font-size:46px;height:80px;display:flex;align-items:center;justify-content:center;opacity:0}
    #dN{position:absolute;left:90px;top:176px;width:1060px;height:112px;--c:var(--teal);display:flex;align-items:center;justify-content:center;font-size:44px;opacity:0}
    #tbl{position:absolute;left:90px;top:300px;width:1060px}
    .row{display:flex;direction:rtl;align-items:center;height:92px;padding:0 14px;margin-bottom:8px;opacity:0;gap:6px}
    .row.hd{height:64px;font-size:30px;font-weight:700;color:rgba(11,31,58,.72)}
    .row > div{flex:none;display:flex;align-items:center;justify-content:center;direction:ltr;font-size:40px}
    .k1{width:100px}.k2{width:310px;font-size:32px}.k3{width:210px;font-size:34px}.k4{width:190px}.k5{width:210px}
    .row.hd > div{direction:rtl;font-size:28px}
    .num{font-family:"Inter",sans-serif;font-weight:900;font-variant-numeric:tabular-nums;font-size:42px}
    .num.g{color:var(--green)}
    #res{position:absolute;left:90px;top:724px;width:1060px;height:96px;--c:var(--green);display:flex;align-items:center;justify-content:space-around;font-size:48px;opacity:0;padding:0 18px}
    #resChk{position:absolute;left:-30px;top:-34px;width:68px;height:68px;opacity:0}
    #fom{position:absolute;left:1180px;top:676px;width:650px;height:140px;--c:var(--purple);display:flex;align-items:center;justify-content:center;font-size:64px;opacity:0}`;
  const body = `      <div class="ttl" id="ttl-ex1">مثال ١ من الكتاب: تحكّم بالسرعة</div>
      <div id="giv" class="panel clip" data-start="0.9" data-duration="28.6"><h3>المعطيات</h3><div class="gl" id="g1">${T("giv_F")}</div><div class="gl" id="g2">${T("giv_m")}</div><div class="gl" id="g3">${T("giv_r")}</div><div class="gl" id="g4" style="font-size:44px">${T("v_om")}</div></div>
      <div id="fom" class="panel clip" data-start="5.4" data-duration="24.1">${T("f_om")}</div>
      <div id="dN" class="panel clip" data-start="9.6" data-duration="19.9">${T("f_dN")}</div>
      <div id="tbl" class="clip" data-start="10.4" data-duration="19.1">
        <div class="row hd" id="h"><div class="k1">المدخل</div><div class="k2">القيمة والخطأ</div><div class="k3">الخطأ Δx</div><div class="k4">الوزن |∂ω/∂x|</div><div class="k5">المساهمة (راد/ث)</div></div>
        ${rows}
      </div>
      <div id="res" class="panel clip" data-start="25.4" data-duration="4.1"><span>${T("tot")}</span><span>${T("pct")}</span><svg id="resChk" viewBox="0 0 64 64"><circle cx="32" cy="32" r="29" fill="#00945E" stroke="#fff" stroke-width="5"/><path d="M17 33l10 10 20-22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
${caps}`;
  const js = `    const E = ${JSON.stringify(E)};
    pop("#giv", 0.9); ["#g1", "#g2", "#g3", "#g4"].forEach((s, i) => pop(s, 1.5 + i * 0.7, 60)); pop("#fom", 5.5); pop("#dN", 9.7); pop("#h", 10.5);
    const cnt = (id, to, dec, t, dur) => { const el = document.getElementById(id), o = { v: 0 }; el.textContent = (0).toFixed(dec); tl.fromTo(o, { v: 0 }, { v: to, duration: dur, ease: "power1.out", onUpdate: () => { el.textContent = o.v.toFixed(dec); } }, t); };
    [["#r0", "w0", E.p[0], "c0", E.c[0], 13.6], ["#r1", "w1", E.p[1], "c1", E.c[1], 17.4], ["#r2", "w2", E.p[2], "c2", E.c[2], 21.2]].forEach(([row, w, pv, c, cv, t]) => { pop(row, t); cnt(w, pv, 3, t + 0.8, 0.8); cnt(c, cv, 4, t + 1.8, 1.0); });
    pop("#res", 25.5); tl.fromTo("#resChk", { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: "power3.out" }, 28.0);`;
  write("compositions/ex1.html", SHELL("ex1", css, body, js));
}
// ---------------- worked example 2: RLC impedance (book) ----------------
{
  let h = fs.readFileSync(path.resolve(root, "../sensors-arena/src/example.src.html"), "utf8");
  const R = D.rlc;
  h = h.replace("الخطأ [[dR]]…", "الخطأ Δx");
  h = h.replace(/\[\[(?:tex:)?(\w+)\]\]/g, (_, k) =>
    mathEl(k === "tot" ? "tot2" : k === "pct" ? "pct2" : k),
  );
  h = h.split("example").join("ex2").split("fl-ex2").join("fl-ex2");
  h = h.replace('"__DATA__"', JSON.stringify({ rlcOut: R }));
  const caps = [
    cap("ex2", 1, 0.8, 4.2, "مثال ٢ من الكتاب: دارة RLC، وبدنا خطأ [[Z]]."),
    cap("ex2", 2, 4.6, 8.6, "أول شي: [[XL]] و [[XC]] ومنهم [[Z]]."),
    cap("ex2", 3, 9.0, 12.6, "بعدها بنجمع خطأ كل واحد بوزنه."),
    cap("ex2", 4, 13.0, 16.6, "خطأ [[R]]: ±100 أوم… وهو الأكبر."),
    cap("ex2", 5, 17.0, 20.6, `خطأ [[XL]]: بس ${R.c.XL.toFixed(1)} أوم.`),
    cap("ex2", 6, 21.0, 24.6, `خطأ [[XC]]: ${R.c.XC.toFixed(1)} أوم تقريباً.`),
    cap("ex2", 7, 25.0, 29.4, `المجموع ${R.sum.toFixed(1)} أوم، يعني ${R.pct.toFixed(2)}٪ من Z.`),
  ].join("\n      ");
  h = h.replace("/*__CAPTIONS__*/", caps).replace("seamOut(tl, 29,", "seamOut(tl, 30,");
  h = h.replace(/\{\{[\w.|]+\}\}/g, "");
  write("compositions/ex2.html", h);
}
// ---------------- outro ----------------
{
  const css = `#line{position:absolute;left:120px;right:120px;top:150px;text-align:center;font-size:104px;font-weight:700;line-height:1.3;direction:rtl}
    #brand{position:absolute;left:380px;top:590px;width:1160px;height:290px;--c:var(--blue);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;opacity:0}
    #brand .b1{font-family:"Inter",sans-serif;font-weight:900;font-size:124px;letter-spacing:-2px;color:var(--navy);line-height:1;white-space:nowrap}
    #brand .b1 em{font-style:normal;color:var(--blue)}
    #brand .b2{font-size:44px;font-weight:700;color:var(--navy);direction:rtl}`;
  const body = `      <div id="line">كل حسّاس بيحوّل <span style="color:var(--orange)">ظاهرة فيزيائية</span> لإشارة <span style="color:var(--green)">يفهمها المتحكم</span></div>
      <div id="brand" class="panel clip" data-start="3.6" data-duration="4.4"><div class="b1">MAE <em>Academy</em></div><div class="b2">هندسة بالبسيط</div></div>`;
  let h = SHELL(
    "outro",
    css,
    body,
    `    pop("#brand", 3.7, 0); tl.fromTo("#brand", { y: 80 }, { y: 0, duration: 0.45, ease: "power4.out" }, 3.7);`,
  );
  h = h
    .replace(
      'seamIn(tl, "#st-outro");',
      'tl.fromTo("#st-outro", { x: 230, opacity: 0.35 }, { x: 0, opacity: 1, duration: 0.42, ease: "power4.out" }, 0);',
    )
    .replace('capCascade(tl, "outro"); seamOut(tl, 8, "#st-outro");', "");
  write("compositions/outro.html", h);
}
// ---------------- index ----------------
{
  const host = (id) =>
    `<div id="${id}" class="clip" data-composition-id="${id}" data-composition-src="compositions/${id}.html" data-start="${L[id][0]}" data-duration="${len(id)}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>`;
  const hosts = ["a1", "t1", "a2", "a3", "a4", "a5", "arena", "ex1", "ex2", "outro"]
    .map(host)
    .join("\n      ");
  const audio = fs.existsSync(path.join(root, "assets/mix.m4a"))
    ? `<audio id="mix" class="clip" src="assets/mix.m4a" data-start="0" data-duration="${D.total}" data-track-index="20" data-volume="1"></audio>`
    : "";
  const h = `<!doctype html>
<html lang="ar">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>*{margin:0;padding:0;box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#F4F7FB}#root{position:relative;width:1920px;height:1080px;overflow:hidden}.ground{position:absolute;inset:0;background:linear-gradient(160deg,#F6F9FF 0%,#E4EDFD 100%)}</style>
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
  fs.writeFileSync(path.join(root, "index.html"), h);
  console.log("built index.html");
}
void CHAPTERS;
