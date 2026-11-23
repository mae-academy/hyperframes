import { C, FONT_CSS, BASE_CSS, S, EN, words, cue, exitTL, entryTL, MAS } from "./lib.mjs";

const CAP_CSS = (right, width) => `
.cap{position:absolute;right:${right}px;width:${width}px;bottom:50px;min-height:150px;direction:rtl}
.cap-in{background:${C.soft};border:4px solid ${C.line};border-radius:30px;padding:20px 34px;font-size:50px;line-height:1.4;font-weight:600;text-align:right}
.cap .w{opacity:0}`;
const CASCADE = `
function cascade(sel,t0,gap0){ const els=document.querySelectorAll(sel+' .w'); let t=t0,gap=gap0||0.085; els.forEach(el=>{ tl.set(el,{opacity:0},0); tl.set(el,{opacity:1},t); tl.fromTo(el,{y:38},{y:0,duration:0.17,ease:'power4.out'},t); t+=gap; gap*=0.93; }); }`;
const capClip = (pre, id, s, dur, html) =>
  `<div id="${pre}-${id}" class="cap clip" data-start="${s}" data-duration="${dur}"><div class="cap-in">${words(html)}</div></div>`;
const capJs = (pre, id, s, dur) =>
  `cascade('#${pre}-${id}',${s});tl.fromTo('#${pre}-${id} .cap-in',{opacity:1},{opacity:0,duration:0.2,ease:'none'},${(s + dur - 0.22).toFixed(2)});`;
const badge = (id, col, sym, sub = "") =>
  `<div id="${id}" class="bdg" style="--c:${col}">${S(sym, sub)}</div>`;
const BADGE_CSS = `.bdg{width:118px;height:118px;border-radius:50%;border:8px solid var(--c);color:var(--c);font-size:64px;display:flex;align-items:center;justify-content:center;background:#fff;direction:ltr}`;

// ======================================================================= INTRO (6.0 s)
export function buildIntro(startAbs) {
  const abs = (t) => startAbs + t,
    sfx = (n, t, v) => cue(n, abs(t), v);
  const dur = 6.0;
  const sub = words(`كيف نوصف أي مفصل بالروبوت <b class="k">بأربع أرقام</b> فقط؟`);
  const css = `${FONT_CSS}${BASE_CSS}${BADGE_CSS}
.kicker{position:absolute;left:130px;top:150px;font-family:'Inter';font-weight:700;font-size:40px;color:${C.muted};letter-spacing:.04em;direction:ltr}
.ttl{position:absolute;left:120px;top:250px;font-family:'Inter';font-weight:900;font-size:170px;line-height:1;direction:ltr;white-space:nowrap}
.ttl .dh{color:${C.blue}} .ttl .par{color:${C.ink};margin-left:34px}
.ttl .u{display:inline-block}
.sub{position:absolute;left:130px;width:1160px;top:500px;font-size:68px;line-height:1.35;font-weight:600;text-align:right;direction:rtl}
.sub .w{opacity:0}
.row{position:absolute;left:130px;top:790px;display:flex;gap:30px;direction:ltr}
.bdg{opacity:0}
.mas{position:absolute;left:1380px;top:380px;width:470px;height:640px}
.mimg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.rule{position:absolute;left:130px;top:225px;width:260px;height:10px;border-radius:5px;background:${C.red};transform-origin:left center}`;
  const js = `
const tl=gsap.timeline({paused:true});
${exitTL(".wrap", dur)}


tl.fromTo('#in-t1',{scale:1.0,transformOrigin:'50% 100%'},{scale:1.07,duration:0.16,ease:'power4.out',immediateRender:false},0.35); tl.to('#in-t1',{scale:1,duration:0.4,ease:'power2.out'},0.51);
tl.fromTo('#in-t2',{y:0},{y:-14,duration:0.16,ease:'power4.out',immediateRender:false},0.4); tl.to('#in-t2',{y:0,duration:0.4,ease:'power2.out'},0.56);
${CASCADE}
cascade('.sub',1.0,0.1);
['in-b1','in-b2','in-b3','in-b4'].forEach((id,i)=>{ const t=2.5+i*0.22; tl.set('#'+id,{opacity:1},t); tl.fromTo('#'+id,{scale:0.3,transformOrigin:'50% 50%'},{scale:1,duration:0.34,ease:'back.out(1.6)'},t); });
tl.set('#in-mh',{opacity:0},0); tl.set('#in-mh',{opacity:1},3.0); tl.set('#in-mw',{opacity:0},3.0);
tl.fromTo('.mas',{y:90},{y:0,duration:0.5,ease:'power4.out'},0.2);
tl.fromTo('.mas',{scale:1},{scale:1.04,duration:0.2,ease:'power4.out',transformOrigin:'50% 100%'},3.0); tl.to('.mas',{scale:1,duration:0.25,ease:'power2.out'},3.2);
window.__timelines['intro']=tl;`;
  sfx("impact-bass-1", 0.35, 0.75);
  sfx("whoosh-short", 0.22, 0.4);
  sfx("pop", 1.0, 0.45);
  sfx("sparkle", 2.4, 0.3);
  [2.5, 2.72, 2.94, 3.16].forEach((t, i) => sfx("pop", t, 0.5 - i * 0.04));
  sfx("sparkle", 3.0, 0.35);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="intro" data-width="1920" data-height="1080"><div class="wrap">
 <div class="rule"></div><div class="kicker">Robotics · Forward Kinematics</div>
 <div class="ttl"><span class="u dh" id="in-t1">DH</span><span class="u par" id="in-t2">Parameters</span></div>
 <div class="sub">${sub}</div>
 <div class="row">${badge("in-b1", C.blue, "a", "i−1")}${badge("in-b2", C.purple, "α", "i−1")}${badge("in-b3", C.orange, "d", "i")}${badge("in-b4", C.green, "θ", "i")}</div>
 <div class="mas"><img id="in-mw" class="mimg" src="${MAS("wave-native")}" alt=""><img id="in-mh" class="mimg" src="${MAS("wave-happy")}" alt="" style="opacity:0"></div>
</div></div><script>${js}</script></template>`;
  return { html, dur };
}

// ======================================================================= HOOK (12.0 s)
export function buildHook(startAbs) {
  const abs = (t) => startAbs + t,
    sfx = (n, t, v) => cue(n, abs(t), v);
  const dur = 12.0;
  const caps = [
    ["h1", 0.8, 4.4, `الروبوت عنده ذراع... بس وين <b class="k red">طرف الذراع</b> بالضبط؟`],
    [
      "h2",
      5.6,
      4.0,
      `الحل: نوصف كل مفصل <b class="k">بأربع أرقام</b> بس! اسمها ${EN("DH Parameters", "blue")}`,
    ],
    ["h3", 9.8, 1.9, `وأسهل من ما بتتخيل!`],
  ];
  const css = `${FONT_CSS}${BASE_CSS}${BADGE_CSS}${CAP_CSS(590, 1230)}
.arm{position:absolute;left:60px;top:90px;overflow:visible}
.qb{opacity:0}
.mas{position:absolute;left:1350px;top:210px;width:500px;height:830px}
.mimg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
.row{position:absolute;left:130px;top:140px;display:flex;gap:26px;direction:ltr}
.bdg{opacity:0;width:104px;height:104px;font-size:56px}
.coord{font-family:'Inter';font-weight:800;font-size:44px;fill:${C.red}}`;
  const L1 = 420,
    L2 = 380,
    BX = 300,
    BY = 640;
  const arm = `<svg class="arm" viewBox="0 0 1260 700" width="1260" height="700" data-layout-allow-overflow>
 <rect x="150" y="${BY + 2}" width="300" height="50" rx="16" fill="${C.ink}"/>
 <g id="hk-arm" opacity="0">
  <path id="hk-l1" d="" stroke="${C.ink}" stroke-width="60" stroke-linecap="round" fill="none"/><path id="hk-l1b" d="" stroke="${C.teal}" stroke-width="44" stroke-linecap="round" fill="none"/>
  <path id="hk-l2" d="" stroke="${C.ink}" stroke-width="54" stroke-linecap="round" fill="none"/><path id="hk-l2b" d="" stroke="${C.teal}" stroke-width="38" stroke-linecap="round" fill="none"/>
  <circle id="hk-j0" r="46" fill="${C.gold}" stroke="${C.ink}" stroke-width="8"/><circle id="hk-j1" r="42" fill="${C.gold}" stroke="${C.ink}" stroke-width="8"/>
  <path id="hk-grip" d="" stroke="${C.ink}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
 </g>
 <g id="hk-q" class="qb"><circle id="hk-qc" r="46" fill="#fff" stroke="${C.red}" stroke-width="8"/><text id="hk-qt" font-family="Inter" font-weight="900" font-size="64" fill="${C.red}" text-anchor="middle" dy="22">?</text></g>
 <text id="hk-coord" class="coord qb" text-anchor="start">(x, y, z) = ?</text>
</svg>`;
  const js = `
const tl=gsap.timeline({paused:true});
${entryTL(".wrap")}
${exitTL(".wrap", dur)}
const BX=${BX},BY=${BY},L1=${L1},L2=${L2},$=s=>document.querySelector(s);
const st={t1:70*Math.PI/180,t2:-15*Math.PI/180};
function R(){
  const j1=[BX+L1*Math.cos(st.t1),BY-L1*Math.sin(st.t1)], a2=st.t1+st.t2, h=[j1[0]+L2*Math.cos(a2),j1[1]-L2*Math.sin(a2)];
  const f=n=>n.toFixed(1), set=(id,d)=>$(id).setAttribute('d',d);
  set('#hk-l1','M'+BX+','+BY+'L'+f(j1[0])+','+f(j1[1])); set('#hk-l1b','M'+BX+','+BY+'L'+f(j1[0])+','+f(j1[1]));
  set('#hk-l2','M'+f(j1[0])+','+f(j1[1])+'L'+f(h[0])+','+f(h[1])); set('#hk-l2b','M'+f(j1[0])+','+f(j1[1])+'L'+f(h[0])+','+f(h[1]));
  [['#hk-j0',BX,BY],['#hk-j1',j1[0],j1[1]]].forEach(([id,x,y])=>{$(id).setAttribute('cx',f(x));$(id).setAttribute('cy',f(y));});
  const ux=Math.cos(a2),uy=-Math.sin(a2),nx=-uy,ny=ux, tip=[h[0]+ux*38,h[1]+uy*38];
  set('#hk-grip','M'+f(h[0]+ux*24+nx*26)+','+f(h[1]+uy*24+ny*26)+'L'+f(tip[0]+nx*26)+','+f(tip[1]+ny*26)+'M'+f(h[0]+ux*24-nx*26)+','+f(h[1]+uy*24-ny*26)+'L'+f(tip[0]-nx*26)+','+f(tip[1]-ny*26)+'M'+f(h[0]+nx*26)+','+f(h[1]+ny*26)+'L'+f(h[0]-nx*26)+','+f(h[1]-ny*26));
  const q=$('#hk-q'); q.setAttribute('transform','translate('+f(tip[0]+120)+','+f(tip[1]-90)+')');
  const c=$('#hk-coord'); c.setAttribute('x',f(tip[0]+30)); c.setAttribute('y',f(tip[1]+110));
}
tl.eventCallback('onUpdate',R);
${CASCADE}
${caps.map(([id, s, d]) => capJs("hk", id, s, d)).join("\n")}
tl.fromTo('#hk-arm',{opacity:0,y:40},{opacity:1,y:0,duration:0.5,ease:'power4.out'},0.45);
tl.to(st,{t1:30*Math.PI/180,t2:-55*Math.PI/180,duration:2.2,ease:'power2.inOut'},1.2);
tl.fromTo('#hk-q',{opacity:0,scale:0.2,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:0.35,ease:'back.out(1.7)'},3.7);
tl.fromTo('#hk-coord',{opacity:0},{opacity:1,duration:0.3,ease:'none'},4.0);
tl.to('#hk-q,#hk-coord',{opacity:0,duration:0.3,ease:'none'},5.4);
['hk-b1','hk-b2','hk-b3','hk-b4'].forEach((id,i)=>{ const t=6.0+i*0.28; tl.set('#'+id,{opacity:1},t); tl.fromTo('#'+id,{scale:0.3,transformOrigin:'50% 50%'},{scale:1,duration:0.34,ease:'back.out(1.6)'},t); });
tl.fromTo('.mas',{y:80,opacity:0},{y:0,opacity:1,duration:0.5,ease:'power4.out'},0.3);
tl.set('#hk-mt',{opacity:1},0.3); tl.set('#hk-mt',{opacity:0},9.6); tl.set('#hk-mw',{opacity:0},0); tl.set('#hk-mw',{opacity:1},9.6);
tl.fromTo('.mas',{scale:0.96,transformOrigin:'50% 100%'},{scale:1,duration:0.3,ease:'power4.out'},9.6);
R();
window.__timelines['hook']=tl;`;
  sfx("whoosh", 1.2, 0.4);
  sfx("pop", 3.7, 0.55);
  sfx("ping", 4.0, 0.3);
  [6.0, 6.28, 6.56, 6.84].forEach((t) => sfx("pop", t, 0.5));
  sfx("sparkle", 9.6, 0.5);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="hook" data-width="1920" data-height="1080"><div class="wrap">
 ${arm}
 <div class="row">${badge("hk-b1", C.blue, "a", "")}${badge("hk-b2", C.purple, "α", "")}${badge("hk-b3", C.orange, "d", "")}${badge("hk-b4", C.green, "θ", "")}</div>
 <div class="mas"><img id="hk-mt" class="mimg" src="${MAS("think-native")}" alt="" style="opacity:0"><img id="hk-mw" class="mimg" src="${MAS("wink_point-wink")}" alt="" style="opacity:0"></div>
 ${caps.map(([id, s, d, h]) => capClip("hk", id, s, d, h)).join("\n")}
</div></div><script>${js}</script></template>`;
  return { html, dur };
}

// ======================================================================= SUMMARY (13.0 s)
export function buildSummary(startAbs) {
  const abs = (t) => startAbs + t,
    sfx = (n, t, v) => cue(n, abs(t), v);
  const dur = 13.0;
  const rows = [
    [
      "a",
      C.blue,
      S("a", "i−1"),
      "Link length",
      "طول الرابط",
      `${S("Z", "i−1")} → ${S("Z", "i")}`,
      `Along ${S("X", "i−1")}`,
    ],
    [
      "al",
      C.purple,
      S("α", "i−1"),
      "Link twist",
      "التواء الرابط",
      `${S("Z", "i−1")} → ${S("Z", "i")}`,
      `About ${S("X", "i−1")}`,
    ],
    [
      "d",
      C.orange,
      S("d", "i"),
      "Link offset",
      "إزاحة الرابط",
      `${S("X", "i−1")} → ${S("X", "i")}`,
      `Along ${S("Z", "i")}`,
    ],
    [
      "th",
      C.green,
      S("θ", "i"),
      "Joint angle",
      "زاوية المفصل",
      `${S("X", "i−1")} → ${S("X", "i")}`,
      `About ${S("Z", "i")}`,
    ],
  ];
  const rowHtml = rows
    .map(
      ([id, c, sym, en, ar, ft, ab]) =>
        `<div class="r" id="sm-r-${id}" style="--c:${c}"><div class="c1">${sym}</div><div class="c2"><span class="en2">${en}</span><span class="ar2">${ar}</span></div><div class="c3">${ft}</div><div class="c4">${ab}</div></div>`,
    )
    .join("");
  const css = `${FONT_CSS}${BASE_CSS}
.ttl{position:absolute;right:110px;top:50px;font-size:76px;font-weight:700}
.ttl2{position:absolute;left:120px;top:76px;font-family:'Inter';font-weight:800;font-size:44px;color:${C.muted};direction:ltr}
.tbl{position:absolute;left:100px;top:150px;width:1720px;direction:rtl}
.hd,.r{display:grid;grid-template-columns:260px 470px 520px 470px;align-items:center;column-gap:0}
.hd{height:60px;font-size:34px;font-weight:700;color:${C.muted};border-bottom:4px solid ${C.line};padding:0 10px;opacity:0}
.r{height:104px;margin-top:10px;border-radius:24px;border:5px solid var(--c);background:#fff;padding:0 10px;opacity:0}
.r>div{text-align:center;direction:ltr} .c1{font-size:68px;color:var(--c)} .c2{display:flex;flex-direction:column;line-height:1.18} .en2{font-family:'Inter';font-weight:800;font-size:40px} .ar2{font-size:34px;font-weight:600;color:${C.muted};direction:rtl}
.c3{font-size:46px} .c4{font-family:'Inter';font-weight:700;font-size:42px;color:var(--c)}
.cards{position:absolute;left:100px;top:692px;width:1720px;display:flex;gap:40px;direction:rtl}
.cd{flex:1;border-radius:30px;border:6px solid var(--c);padding:14px 30px;background:#fff;opacity:0;height:200px}
.cd h3{margin:0;font-size:40px;font-weight:700} .cd p{margin:4px 0 0;font-size:38px;font-weight:600;line-height:1.25} .cd .big{font-size:50px}
.foot{position:absolute;right:110px;left:110px;bottom:34px;font-size:50px;font-weight:700;text-align:center;opacity:0;direction:rtl}`;
  const js = `
const tl=gsap.timeline({paused:true});
${entryTL(".wrap")}
${exitTL(".wrap", dur)}
tl.fromTo('.ttl',{y:40},{y:0,duration:0.3,ease:'power4.out'},0.2); tl.set('.ttl,.ttl2',{opacity:0},0); tl.set('.ttl,.ttl2',{opacity:1},0.2);
tl.set('.hd',{opacity:1},0.6); tl.fromTo('.hd',{y:30},{y:0,duration:0.3,ease:'power4.out'},0.6);
['a','al','d','th'].forEach((id,i)=>{ const t=1.2+i*1.15; tl.set('#sm-r-'+id,{opacity:1},t); tl.fromTo('#sm-r-'+id,{y:60},{y:0,duration:0.22,ease:'power4.out'},t); });
['sm-cd1','sm-cd2'].forEach((id,i)=>{ const t=6.2+i*1.3; tl.set('#'+id,{opacity:1},t); tl.fromTo('#'+id,{y:70},{y:0,duration:0.25,ease:'power4.out'},t); });
tl.set('.foot',{opacity:1},10.0); tl.fromTo('.foot',{y:50},{y:0,duration:0.3,ease:'power4.out'},10.0);
tl.fromTo('#sm-cd1',{scale:1,transformOrigin:'50% 50%'},{scale:1.03,duration:0.2,ease:'power2.out',yoyo:true,repeat:1},8.2);
window.__timelines['summary']=tl;`;
  [1.2, 2.35, 3.5, 4.65].forEach((t) => {
    sfx("pop", t, 0.45);
    sfx("click-soft", t + 0.05, 0.3);
  });
  sfx("whoosh-short", 6.15, 0.35);
  sfx("pop", 6.2, 0.5);
  sfx("pop", 7.5, 0.5);
  sfx("ping", 10.05, 0.5);
  sfx("chime", 10.1, 0.35);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="summary" data-width="1920" data-height="1080"><div class="wrap">
 <div class="ttl">ملخص: الأرقام الأربعة</div><div class="ttl2">DH Parameters</div>
 <div class="tbl"><div class="hd"><div>الرمز</div><div>الاسم</div><div>القياس من ← إلى</div><div>على طول / حوالين</div></div>${rowHtml}</div>
 <div class="cards">
  <div class="cd" id="sm-cd1" style="--c:${C.green}"><h3>${EN("Revolute joint")} · مفصل دوّار</h3><p>المتغير: <span class="big">${S("θ", "i", "green")}</span><br>الثوابت: ${S("a", "", "blue")} ${S("α", "", "purple")} ${S("d", "", "orange")}</p></div>
  <div class="cd" id="sm-cd2" style="--c:${C.orange}"><h3>${EN("Prismatic joint")} · مفصل انزلاقي</h3><p>المتغير: <span class="big">${S("d", "i", "orange")}</span><br>الثوابت: ${S("a", "", "blue")} ${S("α", "", "purple")} ${S("θ", "", "green")}</p></div>
 </div>
 <div class="foot">روبوت بـ ${S("n")} مفصل = <span class="green">${"3"}${S("n")}</span> رقم ثابت + ${S("n")} رقم متغير</div>
</div></div><script>${js}</script></template>`;
  return { html, dur };
}

// ======================================================================= OUTRO (6.0 s)
export function buildOutro(startAbs) {
  const abs = (t) => startAbs + t,
    sfx = (n, t, v) => cue(n, abs(t), v);
  const dur = 6.0;
  const line = words(
    `<span class="en blue" style="font-size:1.25em">4</span> أرقام = وصف كامل لأي مفصل`,
  );
  const css = `${FONT_CSS}${BASE_CSS}${BADGE_CSS}
.line{position:absolute;left:100px;width:1230px;top:250px;font-size:92px;font-weight:700;line-height:1.3;text-align:right;direction:rtl}
.line .w{opacity:0}
.row{position:absolute;left:130px;top:520px;display:flex;gap:30px;direction:ltr} .bdg{opacity:0}
.brand{position:absolute;left:130px;top:760px;font-family:'Inter';font-weight:900;font-size:110px;color:${C.ink};direction:ltr;opacity:0;display:flex;align-items:center;gap:26px}
.brand i{display:block;width:26px;height:110px;border-radius:13px;background:${C.red}}
.brand span{color:${C.blue}}
.mas{position:absolute;left:1380px;top:400px;width:470px;height:620px}
.mimg{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}`;
  const js = `
const tl=gsap.timeline({paused:true});
${entryTL(".wrap")}
${CASCADE}
cascade('.line',0.5,0.11);
['ou-b1','ou-b2','ou-b3','ou-b4'].forEach((id,i)=>{ const t=1.8+i*0.22; tl.set('#'+id,{opacity:1},t); tl.fromTo('#'+id,{scale:0.3,transformOrigin:'50% 50%'},{scale:1,duration:0.34,ease:'back.out(1.6)'},t); });
tl.set('.brand',{opacity:1},3.2); tl.fromTo('.brand',{y:70},{y:0,duration:0.3,ease:'power4.out'},3.2);
tl.fromTo('.mas',{y:80,opacity:0},{y:0,opacity:1,duration:0.5,ease:'power4.out'},0.4);
tl.set('#ou-m1',{opacity:1},0.4); tl.set('#ou-m1',{opacity:0},2.8); tl.set('#ou-m2',{opacity:0},0); tl.set('#ou-m2',{opacity:1},2.8);
tl.fromTo('.mas',{scale:0.96,transformOrigin:'50% 100%'},{scale:1,duration:0.3,ease:'power4.out'},2.8);
window.__timelines['outro']=tl;`;
  sfx("whoosh-short", 0.05, 0.3);
  sfx("pop", 0.55, 0.4);
  [1.8, 2.02, 2.24, 2.46].forEach((t, i) => sfx("pop", t, 0.5 - i * 0.04));
  sfx("chime", 3.2, 0.45);
  sfx("sparkle", 3.3, 0.5);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="outro" data-width="1920" data-height="1080"><div class="wrap">
 <div class="line">${line}</div>
 <div class="row">${badge("ou-b1", C.blue, "a", "i−1")}${badge("ou-b2", C.purple, "α", "i−1")}${badge("ou-b3", C.orange, "d", "i")}${badge("ou-b4", C.green, "θ", "i")}</div>
 <div class="brand"><i></i>MAE <span>Academy</span></div>
 <div class="mas"><img id="ou-m1" class="mimg" src="${MAS("wink_point-wink")}" alt="" style="opacity:0"><img id="ou-m2" class="mimg" src="${MAS("wave-joy")}" alt="" style="opacity:0"></div>
</div></div><script>${js}</script></template>`;
  return { html, dur };
}
