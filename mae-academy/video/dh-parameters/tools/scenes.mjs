import { C, FONT_CSS, BASE_CSS, EN, TX, words, cue, exitTL, entryTL } from "./lib.mjs";
import { ENGINE, jointDom, axisDom, capsuleDom, CSS3D } from "./engine.mjs";

const CAP_CSS = (right, width) => `
.cap{position:absolute;right:${right}px;width:${width}px;bottom:48px;min-height:150px;direction:rtl}
.cap-in{background:#fff;border:4px solid ${C.line};border-radius:30px;padding:20px 34px;font-size:50px;line-height:1.45;font-weight:600;text-align:right;box-shadow:0 10px 28px rgba(11,31,58,.10)}
.cap .w{opacity:0}`;
const CASCADE = `
function cascade(sel,t0,gap0){ const els=document.querySelectorAll(sel+' .w'); let t=t0,gap=gap0||0.085; els.forEach(el=>{ tl.set(el,{opacity:0},0); tl.set(el,{opacity:1},t); tl.fromTo(el,{y:38},{y:0,duration:0.17,ease:'power4.out'},t); t+=gap; gap*=0.93; }); }`;
const capClip = (pre, id, s, dur, html) =>
  `<div id="${pre}-${id}" class="cap clip" data-start="${s}" data-duration="${dur}"><div class="cap-in">${words(html)}</div></div>`;
const capJs = (pre, id, s, dur) =>
  `cascade('#${pre}-${id}',${s});tl.fromTo('#${pre}-${id} .cap-in',{opacity:1},{opacity:0,duration:0.2,ease:'none'},${(s + dur - 0.22).toFixed(2)});`;
const colorOf = { a: C.blue, al: C.purple, d: C.orange, th: C.green };
const symOf = { a: "a_{i-1}", al: "\\alpha_{i-1}", d: "d_i", th: "\\theta_i" };
const BADGE_CSS = `.bdg{min-width:150px;height:118px;padding:0 26px;border-radius:59px;border:8px solid var(--c);color:var(--c);display:flex;align-items:center;justify-content:center;background:#fff;direction:ltr;box-shadow:0 10px 24px rgba(11,31,58,.12)}`;
const badge = (id, k, px = 66) =>
  `<div id="${id}" class="bdg" style="--c:${colorOf[k]}">${TX(symOf[k], px, colorOf[k])}</div>`;

// ---- a small static 3D assembly (joint {i-1}, link, joint {i}) used by intro and outro; the camera orbits it
const A = 3.4,
  AL = 35,
  D = 1.0,
  TH = 40;
const mini3d = (cx, cy, sc) => ({
  dom: `<svg id="m3" viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;left:0;top:0" data-layout-ignore>
 <g><path id="m3-fl-p" fill="#D3E1FA" fill-opacity=".75"/><path id="m3-fl-g" fill="none" stroke="#A9C0EC" stroke-width="2.5"/></g>
 <g id="m3-obj">${jointDom("m3-j0")}${capsuleDom("m3-lk")}${jointDom("m3-j1")}</g>
 <g>${axisDom("m3-z0", C.red)}${axisDom("m3-z1", C.red)}${axisDom("m3-x0", C.ink, 8)}</g>
 <g id="m3-gh">${jointDom("m3-g", true)}</g>
</svg>`,
  js: (psi0, psi1, dur, ghost) => `
${ENGINE}
const A=${A},AL=${AL}*DEG,D=${D},TH=${TH}*DEG;
const Zd=al=>[0,-Math.sin(al),Math.cos(al)],Yd=al=>[0,Math.cos(al),Math.sin(al)];
const frame=(a,al,d,th)=>{const z=Zd(al),y=Yd(al);const x=[Math.cos(th),Math.sin(th)*y[1],Math.sin(th)*y[2]];return {o:add([a,0,0],mul(z,d)),x,z,y:cross(z,x)};};
const Q=[A,0,0],O0=[0,0,0],FI=frame(A,AL,D,TH);
Object.assign(cam,{psi:${psi0},phi:20,sc:${sc},tx:1.9,ty:0,tz:0.5,sx:1560,sy:600});
function R3(){camSet();floor('m3-fl',-1.2,-1.5,6,-3,3,1);
  drawJoint('m3-j0',O0,[1,0,0],[0,1,0],[0,0,1]);drawJoint('m3-j1',FI.o,FI.x,FI.y,FI.z);capsule('m3-lk',[0.62,0,0],[A-0.53,0,0]);
  const obj=sel('#m3-obj');[['m3-j0',dep(O0)],['m3-lk',dep([A/2,0,0])],['m3-j1',dep(FI.o)]].sort((p,q)=>q[1]-p[1]).forEach(it=>obj.appendChild(sel('#'+it[0])));
  setAxis('m3-z0',O0,[0,0,1],3.5,34,-1.4);setAxis('m3-z1',Q,Zd(AL),3.2,34,-1.9);setAxis('m3-x0',O0,[1,0,0],A+1.7,34,0);
  ${ghost ? "drawJoint('m3-g',FI.o,FI.x,FI.y,FI.z);" : "setD('#m3-g-base-b','');"}}
tl.to(cam,{psi:${psi1},duration:${dur},ease:'power1.inOut'},0);
tl.eventCallback('onUpdate',R3);`,
});

// ======================================================================= INTRO (6.0 s)
export function buildIntro(startAbs) {
  const sfx = (n, t, v) => cue(n, startAbs + t, v);
  const dur = 6.0,
    m = mini3d(0, 0, 92);
  const sub = words(`كيف نوصف أي مفصل بالروبوت <b class="k">بأربع أرقام</b> فقط؟`);
  const css = `${FONT_CSS}${BASE_CSS}${CSS3D}${BADGE_CSS}
.kicker{position:absolute;left:130px;top:150px;font-family:'Inter';font-weight:700;font-size:40px;color:${C.muted};letter-spacing:.04em;direction:ltr}
.rule{position:absolute;left:130px;top:225px;width:260px;height:10px;border-radius:5px;background:${C.red}}
.ttl{position:absolute;left:120px;top:250px;font-family:'Inter';font-weight:900;font-size:160px;line-height:1;direction:ltr;white-space:nowrap}
.ttl .dh{color:${C.blue}} .ttl .par{color:${C.ink};margin-left:30px} .ttl .u{display:inline-block}
.sub{position:absolute;left:130px;width:900px;top:500px;font-size:66px;line-height:1.4;font-weight:600;text-align:right;direction:rtl}
.sub .w{opacity:0}
.row{position:absolute;left:130px;top:790px;display:flex;gap:26px;direction:ltr}.bdg{opacity:0}`;
  const js = `
const tl=gsap.timeline({paused:true});
${exitTL(".wrap", dur)}
${m.js(-78, -24, dur, false)}
tl.fromTo('#in-t1',{scale:1.0,transformOrigin:'50% 100%'},{scale:1.07,duration:0.16,ease:'power4.out',immediateRender:false},0.35); tl.to('#in-t1',{scale:1,duration:0.4,ease:'power2.out'},0.51);
tl.fromTo('#in-t2',{y:0},{y:-14,duration:0.16,ease:'power4.out',immediateRender:false},0.4); tl.to('#in-t2',{y:0,duration:0.4,ease:'power2.out'},0.56);
${CASCADE}
cascade('.sub',1.0,0.1);
['in-b1','in-b2','in-b3','in-b4'].forEach((id,i)=>{ const t=2.5+i*0.22; tl.set('#'+id,{opacity:1},t); tl.fromTo('#'+id,{scale:0.3,transformOrigin:'50% 50%'},{scale:1,duration:0.34,ease:'back.out(1.6)'},t); });
R3();
window.__timelines['intro']=tl;`;
  sfx("impact-bass-1", 0.35, 0.7);
  sfx("whoosh", 0.1, 0.35);
  sfx("pop", 1.0, 0.45);
  sfx("sparkle", 2.4, 0.3);
  [2.5, 2.72, 2.94, 3.16].forEach((t, i) => sfx("pop", t, 0.5 - i * 0.04));
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="intro" data-width="1920" data-height="1080"><div class="wrap">
 ${m.dom}
 <div class="rule"></div><div class="kicker">Robotics · Forward Kinematics</div>
 <div class="ttl"><span class="u dh" id="in-t1">DH</span><span class="u par" id="in-t2">Parameters</span></div>
 <div class="sub">${sub}</div>
 <div class="row">${badge("in-b1", "a")}${badge("in-b2", "al")}${badge("in-b3", "d")}${badge("in-b4", "th")}</div>
</div></div><script>${js}</script></template>`;
  return { html, dur };
}

// ======================================================================= HOOK (12.0 s): a 3D arm, where is its hand?
export function buildHook(startAbs) {
  const sfx = (n, t, v) => cue(n, startAbs + t, v);
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
  const names = { a: "Link length", al: "Link twist", d: "Link offset", th: "Joint angle" };
  const cards = ["a", "al", "d", "th"]
    .map(
      (k) =>
        `<div class="hc" id="hk-c-${k}" style="--c:${colorOf[k]}">${TX(symOf[k], 64, colorOf[k])}<span>${names[k]}</span></div>`,
    )
    .join("");
  const css = `${FONT_CSS}${BASE_CSS}${CSS3D}${CAP_CSS(590, 1230)}
.hc{display:flex;align-items:center;justify-content:space-between;gap:20px;height:120px;border:7px solid var(--c);border-radius:28px;background:#fff;padding:0 26px;font-family:'Inter';font-weight:800;font-size:40px;color:${C.ink};direction:ltr;opacity:0;box-shadow:0 10px 24px rgba(11,31,58,.12)}
.hcs{position:absolute;left:1380px;top:110px;width:440px;display:flex;flex-direction:column;gap:22px}
.coord{font-family:'Inter';font-weight:800;font-size:46px;fill:${C.red};direction:ltr}`;
  const svg = `<svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;left:0;top:0" data-layout-ignore>
 <g><path id="hk-fl-p" fill="#D3E1FA" fill-opacity=".75"/><path id="hk-fl-g" fill="none" stroke="#A9C0EC" stroke-width="2.5"/></g>
 <g id="hk-obj"><g id="hk-pd"><path id="hk-pd-b" class="joint" fill="#16294D" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/><path id="hk-pd-l" fill="#2E4D80" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/><path id="hk-pd-c" fill="#4A6DAA" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/></g>
  ${jointDom("hk-j0")}${capsuleDom("hk-k1")}${jointDom("hk-j1")}${capsuleDom("hk-k2")}
  <path id="hk-gr" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></g>
 <g id="hk-q" opacity="0"><circle r="50" fill="#fff" stroke="${C.red}" stroke-width="8"/><text font-family="Inter,sans-serif" font-weight="900" font-size="70" fill="${C.red}" text-anchor="middle" dy="24">?</text></g>
 <text id="hk-co" class="coord" opacity="0" style="direction:ltr;unicode-bidi:isolate">(x, y, z) = ?</text>
</svg>`;
  const js = `
${ENGINE}
const L1=2.7,L2=2.4,J0=[0,0,1.0],st={t1:62*DEG,t2:-14*DEG};
Object.assign(cam,{psi:-40,phi:17,sc:128,tx:2.3,ty:0,tz:1.3,sx:640,sy:530});
function R(){camSet();floor('hk-fl',-0.05,-3,8,-4.5,4.5,1);
  const j1=add(J0,[L1*Math.cos(st.t1),0,L1*Math.sin(st.t1)]),a2=st.t1+st.t2,H=add(j1,[L2*Math.cos(a2),0,L2*Math.sin(a2)]);
  const ZA=[0,1,0],XA=[1,0,0],YA=cross(ZA,XA);
  drawJoint('hk-j0',J0,XA,YA,ZA,0.55,0.55);drawJoint('hk-j1',j1,XA,YA,ZA,0.5,0.55);
  capsule('hk-k1',J0,j1);capsule('hk-k2',j1,H);
  const q=cyl([0,0,0],[1,0,0],[0,1,0],[0,0,1],0.75,0,J0[2]-0.2);setD('#hk-pd-b',q.body);setD('#hk-pd-l',q.lit);setD('#hk-pd-c',q.cap);
  const u=[Math.cos(a2),0,Math.sin(a2)],n=[-Math.sin(a2),0,Math.cos(a2)],tip=add(H,mul(u,0.55));
  setD('#hk-gr',Lp([P(add(add(H,mul(u,0.3)),mul(n,0.4))),P(add(tip,mul(n,0.4))),P(add(H,mul(n,0.4))),P(add(H,mul(n,-0.4))),P(add(tip,mul(n,-0.4))),P(add(add(H,mul(u,0.3)),mul(n,-0.4)))]));
  const obj=sel('#hk-obj');[['hk-pd',dep([0,0,0.4])],['hk-j0',dep(J0)],['hk-k1',dep(add(J0,mul(sub(j1,J0),0.5)))],['hk-j1',dep(j1)],['hk-k2',dep(add(j1,mul(sub(H,j1),0.5)))],['hk-gr',dep(tip)]].sort((p,q)=>q[1]-p[1]).forEach(it=>obj.appendChild(sel('#'+it[0])));
  const ph=P(H),qb=sel('#hk-q');qb.setAttribute('transform','translate('+f1(ph[0]+150)+','+f1(ph[1]-110)+')');const co=sel('#hk-co');co.setAttribute('x',f1(ph[0]+60));co.setAttribute('y',f1(ph[1]+130));}
const tl=gsap.timeline({paused:true});
tl.eventCallback('onUpdate',R);
${entryTL(".wrap")}
${exitTL(".wrap", dur)}
${CASCADE}
${caps.map(([id, s, d]) => capJs("hk", id, s, d)).join("\n")}
tl.to(cam,{psi:-62,phi:20,duration:12,ease:'power1.inOut'},0);
tl.to(st,{t1:28*DEG,t2:-58*DEG,duration:2.2,ease:'power2.inOut'},1.2);
tl.fromTo('#hk-q',{opacity:0,scale:0.2,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:0.35,ease:'back.out(1.7)'},3.7);
tl.fromTo('#hk-co',{opacity:0},{opacity:1,duration:0.3,ease:'none'},4.0);
tl.to('#hk-q,#hk-co',{opacity:0,duration:0.3,ease:'none'},5.4);
['a','al','d','th'].forEach((k,i)=>{ const t=6.0+i*0.3; tl.set('#hk-c-'+k,{opacity:1},t); tl.fromTo('#hk-c-'+k,{x:120},{x:0,duration:0.35,ease:'power4.out'},t); });
tl.set('.hc',{opacity:0},0);
R();
window.__timelines['hook']=tl;`;
  sfx("whoosh", 1.2, 0.4);
  sfx("pop", 3.7, 0.55);
  sfx("ping", 4.0, 0.3);
  [6.0, 6.3, 6.6, 6.9].forEach((t) => sfx("pop", t, 0.5));
  sfx("sparkle", 9.8, 0.45);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="hook" data-width="1920" data-height="1080"><div class="wrap">
 ${svg}
 <div class="hcs">${cards}</div>
 ${caps.map(([id, s, d, h]) => capClip("hk", id, s, d, h)).join("\n")}
</div></div><script>${js}</script></template>`;
  return { html, dur };
}

// ======================================================================= SUMMARY (13.0 s)
export function buildSummary(startAbs) {
  const sfx = (n, t, v) => cue(n, startAbs + t, v);
  const dur = 13.0;
  const T = (l, px = 44, c = "") => TX(l, px, c);
  const rows = [
    ["a", "Link length", "طول الرابط", T("Z_{i-1}\\to Z_i"), `Along ${T("X_{i-1}", 38)}`],
    ["al", "Link twist", "التواء الرابط", T("Z_{i-1}\\to Z_i"), `About ${T("X_{i-1}", 38)}`],
    ["d", "Link offset", "إزاحة الرابط", T("X_{i-1}\\to X_i"), `Along ${T("Z_i", 38)}`],
    ["th", "Joint angle", "زاوية المفصل", T("X_{i-1}\\to X_i"), `About ${T("Z_i", 38)}`],
  ];
  const rowHtml = rows
    .map(
      ([k, en, ar, ft, ab]) =>
        `<div class="r" id="sm-r-${k}" style="--c:${colorOf[k]}"><div class="c1">${TX(symOf[k], 68, colorOf[k])}</div><div class="c2"><span class="en2">${en}</span><span class="ar2">${ar}</span></div><div class="c3">${ft}</div><div class="c4">${ab}</div></div>`,
    )
    .join("");
  // two little animated icons: a revolute joint turns, a prismatic joint slides
  const rev = `<svg class="ic" viewBox="0 0 220 150" width="220" height="150"><path d="M30 120H190" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/><g id="sm-rv"><rect x="0" y="-16" width="120" height="32" rx="16" fill="${C.teal}" stroke="${C.ink}" stroke-width="6"/></g><circle cx="52" cy="104" r="22" fill="${C.gold}" stroke="${C.ink}" stroke-width="6"/><path id="sm-ra" d="M118 80A66 66 0 0 0 100 52" fill="none" stroke="${C.green}" stroke-width="9" stroke-linecap="round"/></svg>`;
  const pri = `<svg class="ic" viewBox="0 0 220 150" width="220" height="150"><rect x="24" y="70" width="110" height="46" rx="14" fill="#fff" stroke="${C.ink}" stroke-width="6"/><g id="sm-pr"><rect x="40" y="82" width="110" height="22" rx="11" fill="${C.teal}" stroke="${C.ink}" stroke-width="5"/></g><path id="sm-pa" d="M150 52H196" stroke="${C.orange}" stroke-width="9" stroke-linecap="round"/><path d="M186 40L200 52L186 64" fill="none" stroke="${C.orange}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const css = `${FONT_CSS}${BASE_CSS}
.ttl{position:absolute;right:110px;top:40px;font-size:76px;font-weight:700}
.ttl2{position:absolute;left:120px;top:66px;font-family:'Inter';font-weight:800;font-size:44px;color:${C.muted};direction:ltr}
.tbl{position:absolute;left:100px;top:150px;width:1720px;direction:rtl}
.hd,.r{display:grid;grid-template-columns:300px 430px 520px 470px;align-items:center}
.hd{height:60px;font-size:34px;font-weight:700;color:${C.muted};border-bottom:4px solid ${C.line};padding:0 10px}
.r{height:104px;margin-top:10px;border-radius:24px;border:5px solid var(--c);background:#fff;padding:0 10px;opacity:0;box-shadow:0 8px 20px rgba(11,31,58,.08)}
.r>div{text-align:center;direction:ltr;display:flex;align-items:center;justify-content:center;gap:10px}
.c2{flex-direction:column;line-height:1.18}.en2{font-family:'Inter';font-weight:800;font-size:40px}.ar2{font-size:34px;font-weight:600;color:${C.muted};direction:rtl}
.c4{font-family:'Inter';font-weight:700;font-size:40px;color:var(--c)}
.cards{position:absolute;left:100px;top:692px;width:1720px;display:flex;gap:40px;direction:rtl}
.cd{flex:1;border-radius:30px;border:6px solid var(--c);padding:12px 30px;background:#fff;opacity:0;height:206px;display:flex;align-items:center;gap:24px;box-shadow:0 10px 24px rgba(11,31,58,.10)}
.cd .tt{flex:1}.cd h3{margin:0;font-size:40px;font-weight:700}.cd p{margin:4px 0 0;font-size:38px;font-weight:600;line-height:1.3}
.foot{position:absolute;right:110px;left:110px;bottom:34px;font-size:50px;font-weight:700;text-align:center;opacity:0;direction:rtl}`;
  const js = `
const tl=gsap.timeline({paused:true});
${entryTL(".wrap")}
${exitTL(".wrap", dur)}
['a','al','d','th'].forEach((id,i)=>{ const t=1.2+i*1.15; tl.set('#sm-r-'+id,{opacity:1},t); tl.fromTo('#sm-r-'+id,{y:60},{y:0,duration:0.22,ease:'power4.out'},t); });
['sm-cd1','sm-cd2'].forEach((id,i)=>{ const t=6.2+i*1.3; tl.set('#'+id,{opacity:1},t); tl.fromTo('#'+id,{y:70},{y:0,duration:0.25,ease:'power4.out'},t); });
tl.set('.foot',{opacity:1},10.0); tl.fromTo('.foot',{y:50},{y:0,duration:0.3,ease:'power4.out'},10.0);
tl.set('#sm-rv',{attr:{transform:'translate(52 104) rotate(-8)'}},0);
tl.to('#sm-rv',{attr:{transform:'translate(52 104) rotate(-52)'},duration:1.6,ease:'power2.inOut'},6.6); tl.to('#sm-rv',{attr:{transform:'translate(52 104) rotate(-8)'},duration:1.6,ease:'power2.inOut'},9.0);
tl.to('#sm-pr',{x:46,duration:1.6,ease:'power2.inOut'},7.9); tl.to('#sm-pr',{x:0,duration:1.4,ease:'power2.inOut'},9.8);
window.__timelines['summary']=tl;`;
  [1.2, 2.35, 3.5, 4.65].forEach((t) => {
    sfx("pop", t, 0.45);
    sfx("click-soft", t + 0.05, 0.3);
  });
  sfx("whoosh-short", 6.15, 0.35);
  sfx("pop", 6.2, 0.5);
  sfx("pop", 7.5, 0.5);
  sfx("ping", 10.05, 0.5);
  sfx("chime", 10.1, 0.3);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="summary" data-width="1920" data-height="1080"><div class="wrap">
 <div class="ttl">ملخص: الأرقام الأربعة</div><div class="ttl2">DH Parameters</div>
 <div class="tbl"><div class="hd"><div>الرمز</div><div>الاسم</div><div>القياس من ← إلى</div><div>على طول / حوالين</div></div>${rowHtml}</div>
 <div class="cards">
  <div class="cd" id="sm-cd1" style="--c:${C.green}">${rev}<div class="tt"><h3>${EN("Revolute joint")} · مفصل دوّار</h3><p>المتغير: ${T("\\theta_i", 52, C.green)}<br>الثوابت: <span class="ltr">${T("a", 44, C.blue)} ${T("\\alpha", 44, C.purple)} ${T("d", 44, C.orange)}</span></p></div></div>
  <div class="cd" id="sm-cd2" style="--c:${C.orange}">${pri}<div class="tt"><h3>${EN("Prismatic joint")} · مفصل انزلاقي</h3><p>المتغير: ${T("d_i", 52, C.orange)}<br>الثوابت: <span class="ltr">${T("a", 44, C.blue)} ${T("\\alpha", 44, C.purple)} ${T("\\theta", 44, C.green)}</span></p></div></div>
 </div>
 <div class="foot">روبوت بـ ${T("n", 50)} مفصل = <span class="ltr green">${T("3n", 56, C.green)}</span> رقم ثابت + ${T("n", 50)} رقم متغير</div>
</div></div><script>${js}</script></template>`;
  return { html, dur };
}

// ======================================================================= OUTRO (6.0 s)
export function buildOutro(startAbs) {
  const sfx = (n, t, v) => cue(n, startAbs + t, v);
  const dur = 6.0,
    m = mini3d(0, 0, 92);
  const line = words(
    `<span class="en blue" style="font-size:1.25em">4</span> أرقام = وصف كامل لأي مفصل`,
  );
  const css = `${FONT_CSS}${BASE_CSS}${CSS3D}${BADGE_CSS}
.line{position:absolute;left:100px;width:860px;top:230px;font-size:84px;font-weight:700;line-height:1.35;text-align:right;direction:rtl}
.row{position:absolute;left:130px;top:560px;display:grid;grid-template-columns:auto auto;gap:22px;direction:ltr}.bdg{opacity:0}
.brand{position:absolute;left:130px;top:830px;font-family:'Inter';font-weight:900;font-size:110px;color:${C.ink};direction:ltr;opacity:0;display:flex;align-items:center;gap:26px}
.brand i{display:block;width:26px;height:110px;border-radius:13px;background:${C.red}} .brand span{color:${C.blue}}`;
  const js = `
const tl=gsap.timeline({paused:true});
${entryTL(".wrap")}
${m.js(-24, -52, dur, true)}
['ou-b1','ou-b2','ou-b3','ou-b4'].forEach((id,i)=>{ const t=1.2+i*0.22; tl.set('#'+id,{opacity:1},t); tl.fromTo('#'+id,{scale:0.3,transformOrigin:'50% 50%'},{scale:1,duration:0.34,ease:'back.out(1.6)'},t); });
tl.set('.brand',{opacity:1},3.2); tl.fromTo('.brand',{y:70},{y:0,duration:0.3,ease:'power4.out'},3.2);
tl.fromTo('#m3-gh',{opacity:0},{opacity:1,duration:0.6,ease:'none'},0.4);
R3();
window.__timelines['outro']=tl;`;
  sfx("whoosh-short", 0.05, 0.3);
  sfx("pop", 0.55, 0.4);
  [1.2, 1.42, 1.64, 1.86].forEach((t, i) => sfx("pop", t, 0.5 - i * 0.04));
  sfx("chime", 3.2, 0.4);
  sfx("sparkle", 3.3, 0.45);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="outro" data-width="1920" data-height="1080"><div class="wrap">
 ${m.dom}
 <div class="line">${line}</div>
 <div class="row">${badge("ou-b1", "a")}${badge("ou-b2", "al")}${badge("ou-b3", "d")}${badge("ou-b4", "th")}</div>
 <div class="brand"><i></i>MAE <span>Academy</span></div>
</div></div><script>${js}</script></template>`;
  return { html, dur };
}
