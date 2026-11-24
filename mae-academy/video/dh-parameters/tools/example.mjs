// Worked example (book Example 3.1): planar 3R manipulator -> frames {0}..{3} -> the D-H table, filled row by row.
import { C, FONT_CSS, BASE_CSS, EN, TX, words, cue, exitTL, entryTL } from "./lib.mjs";
import { ENGINE, jointDom, axisDom, capsuleDom, gripperDom, CSS3D } from "./engine.mjs";
import { TXG } from "./lib.mjs";

const CASCADE = `
function cascade(sel,t0,gap0){ const els=document.querySelectorAll(sel+' .w'); let t=t0,gap=gap0||0.085; els.forEach(el=>{ tl.set(el,{opacity:0},0); tl.set(el,{opacity:1},t); tl.fromTo(el,{y:38},{y:0,duration:0.17,ease:'power4.out'},t); t+=gap; gap*=0.93; }); }`;

export const EX_DUR = 56.0;

export function buildExample(startAbs) {
  const sfx = (n, t, v) => cue(n, startAbs + t, v);
  const T = (l, c, px = 48) => TX(l, px, c);
  const caps = [
    [
      "e1",
      0.8,
      6.6,
      `مثال عملي: ذراع مستوية بثلاث مفاصل دوّارة، اسمها ${EN("3R", "blue")}. نبغى نحسب جدول ${EN("D-H")} تبعها`,
    ],
    [
      "e2",
      7.6,
      8.0,
      `نحط الفريمات والمتغيرات كلها صفر: المفاصل على خط واحد، و${T("\\{0\\}")} و${T("\\{1\\}")} ينطبقوا على بعض`,
    ],
    [
      "e3",
      16.0,
      7.8,
      `كل محاور ${T("Z", C.red)} متوازية ، فـ ${T("\\alpha_{i-1}=0", C.purple)} لكل المفاصل`,
    ],
    ["e4", 24.0, 7.6, `ما في إزاحة على ${T("Z", C.red)} ، فـ ${T("d_i=0", C.orange)} لكل المفاصل`],
    [
      "e5",
      32.0,
      9.6,
      `المسافة بين ${T("Z_1")} و ${T("Z_2")} هي ${T("L_1", C.blue)} ، وبين ${T("Z_2")} و ${T("Z_3")} هي ${T("L_2", C.blue)}`,
    ],
    [
      "e6",
      42.0,
      9.6,
      `كل المفاصل دوّارة ، فـ ${T("\\theta_1,\\theta_2,\\theta_3", C.green)} هي المتغيرات`,
    ],
    ["e7", 52.0, 3.4, `خلصنا جدول ${EN("D-H")}!`],
  ];
  const capHtml = caps
    .map(
      ([id, s, dur, html]) =>
        `<div id="ex-${id}" class="cap clip" data-start="${s}" data-duration="${dur}"><div class="cap-in">${words(html)}</div></div>`,
    )
    .join("\n");

  // ---- the D-H table (book Table 3.2.2): Joint | alpha_{i-1} | a_{i-1} | d_i | theta_i | q_i
  const notes = [
    ["n2", C.ink, TX("\\{0\\}\\equiv\\{1\\}", 84, C.ink)],
    ["n3", C.purple, TX("\\alpha_{i-1}=0\\quad Z_i\\parallel Z_{i-1}", 76, C.purple)],
    ["n4", C.orange, TX("d_i=0", 96, C.orange)],
    ["n5", C.blue, TX("a_0=0,\\ a_1=L_1,\\ a_2=L_2", 70, C.blue)],
    ["n6", C.green, TX("q_i=\\theta_i\\quad (i=1,2,3)", 80, C.green)],
  ];
  const hdr = [
    ["Joint\\ (i)", C.ink],
    ["\\alpha_{i-1}", C.purple],
    ["a_{i-1}", C.blue],
    ["d_i", C.orange],
    ["\\theta_i", C.green],
    ["q_i", C.ink],
  ];
  const vals = [
    ["0", "0", "0", "\\theta_1"],
    ["0", "L_1", "0", "\\theta_2"],
    ["0", "L_2", "0", "\\theta_3"],
  ];
  const cols = [C.purple, C.blue, C.orange, C.green];
  const tab = `<div class="dtab">${hdr.map(([l, c], k) => `<div class="th" id="ex-h${k}" style="color:${c}">${TX(l, 40, c)}</div>`).join("")}
${vals.map((r, i) => `<div class="td" id="ex-c${i}-j">${TX(String(i + 1), 44, C.ink)}</div>${r.map((v, k) => `<div class="td v" id="ex-c${i}-${k}" style="--c:${cols[k]}">${TX(v, 46, cols[k])}</div>`).join("")}<div class="td v" id="ex-c${i}-q" style="--c:${C.green}">${TX("\\theta", 46, C.green)}<small>(variable)</small></div>`).join("")}
</div>`;

  const lb = (id, latex, px, col, pill = true) => TXG(id, latex, px, col, pill);
  const labels = [
    lb("ex-L-f0", "\\{0\\}", 46, C.ink),
    lb("ex-L-f1", "\\{1\\}", 46, C.ink),
    lb("ex-L-f2", "\\{2\\}", 46, C.ink),
    lb("ex-L-f3", "\\{3\\}", 46, C.ink),
    lb("ex-L-z1", "Z_1", 52, C.red, false),
    lb("ex-L-z2", "Z_2", 52, C.red, false),
    lb("ex-L-z3", "Z_3", 52, C.red, false),
    lb("ex-L-l1", "L_1", 64, C.blue),
    lb("ex-L-l2", "L_2", 64, C.blue),
    lb("ex-L-t1", "\\theta_1", 60, C.green),
    lb("ex-L-t2", "\\theta_2", 60, C.green),
    lb("ex-L-t3", "\\theta_3", 60, C.green),
    lb("ex-L-xy", "(x,y)", 56, C.red),
  ].join("");
  const svg = `<svg id="ex-svg" viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;left:0;top:0" data-layout-ignore>
 <g><path id="ex-fl-p" fill="#D3E1FA" fill-opacity=".75"/><path id="ex-fl-g" fill="none" stroke="#A9C0EC" stroke-width="2.5"/></g>
 <g id="ex-obj">${jointDom("ex-j1")}${capsuleDom("ex-k1")}${jointDom("ex-j2")}${capsuleDom("ex-k2")}${jointDom("ex-j3")}${gripperDom("ex-gp")}</g>
 <g id="ex-fr">${axisDom("ex-z1", C.red, 9)}${axisDom("ex-z2", C.red, 9)}${axisDom("ex-z3", C.red, 9)}${axisDom("ex-x0", "#7C8CA8", 8)}${axisDom("ex-x1", C.ink, 9)}${axisDom("ex-x2", C.ink, 9)}${axisDom("ex-x3", C.ink, 9)}</g>
 <g id="ex-hp"><g id="ex-hp-a" opacity="0"><path id="ex-a1" fill="none" stroke="${C.blue}" stroke-width="16" stroke-linecap="round"/><path id="ex-a2" fill="none" stroke="${C.blue}" stroke-width="16" stroke-linecap="round"/></g>
   <g id="ex-hp-t" opacity="0"><path id="ex-w1" fill="${C.green}" fill-opacity=".3"/><path id="ex-r1" fill="none" stroke="${C.green}" stroke-width="12" stroke-linecap="round"/><path id="ex-w2" fill="${C.green}" fill-opacity=".3"/><path id="ex-r2" fill="none" stroke="${C.green}" stroke-width="12" stroke-linecap="round"/><path id="ex-w3" fill="${C.green}" fill-opacity=".3"/><path id="ex-r3" fill="none" stroke="${C.green}" stroke-width="12" stroke-linecap="round"/></g></g>
 <g id="ex-lb">${labels}</g>
</svg>`;

  const css = `${FONT_CSS}${BASE_CSS}${CSS3D}
.cap{position:absolute;right:880px;width:940px;bottom:48px;min-height:150px;direction:rtl}
.cap-in{background:#fff;border:4px solid ${C.line};border-radius:30px;padding:20px 30px;font-size:46px;line-height:1.45;font-weight:600;text-align:right;box-shadow:0 10px 28px rgba(11,31,58,.10)}
.cap .w{opacity:0}
.ttl{position:absolute;left:1040px;top:46px;font-family:'Inter';font-weight:800;font-size:44px;color:${C.muted};direction:ltr;white-space:nowrap}
.dtab{position:absolute;left:1040px;top:124px;width:790px;display:grid;grid-template-columns:140px repeat(4,1fr) 170px;gap:10px;direction:ltr}
.th{height:104px;border-radius:20px;background:#fff;border:4px solid ${C.line};display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(11,31,58,.08)}
.td{height:124px;border-radius:20px;background:#fff;border:4px solid ${C.line};display:flex;align-items:center;justify-content:center;gap:8px;font-family:'Inter';font-weight:700;font-size:50px;box-shadow:0 6px 16px rgba(11,31,58,.08)}
.td.v{border-color:var(--c);opacity:0}.td small{font-size:20px;color:${C.muted};font-weight:600;line-height:1.1;margin-left:4px}

.notes{position:absolute;left:1040px;top:640px;width:790px;height:230px}.nc{position:absolute;inset:0;border-radius:30px;background:#fff;border:6px solid var(--c);display:flex;align-items:center;justify-content:center;gap:26px;opacity:0;box-shadow:0 10px 26px rgba(11,31,58,.12);direction:ltr;font-family:'Inter';font-weight:700;font-size:40px;color:${C.ink}}
`;

  const js = `
${ENGINE}
const L1=2.6,L2=2.2,L3=1.1,st={t1:70*DEG,t2:-52*DEG,t3:38*DEG},ap={z:0,f0:0,f1:0,f2:0,f3:0};
Object.assign(cam,{psi:-34,phi:26,sc:126,tx:2.4,ty:0.6,tz:0,sx:490,sy:590});
const Z=[0,0,1];
function R(){camSet();floor('ex-fl',-1.45,-2.5,6.8,-4,4.2,1);
  const t1=st.t1,t2=st.t2,t3=st.t3,a2=t1+t2,a3=a2+t3;
  const d1=[Math.cos(t1),Math.sin(t1),0],d2=[Math.cos(a2),Math.sin(a2),0],d3=[Math.cos(a3),Math.sin(a3),0];
  const J1=[0,0,0],J2=add(J1,mul(d1,L1)),J3=add(J2,mul(d2,L2)),EE=add(J3,mul(d3,L3));
  const bs=d=>[-d[1],d[0],0];
  drawJoint('ex-j1',J1,d1,bs(d1),Z);drawJoint('ex-j2',J2,d2,bs(d2),Z);drawJoint('ex-j3',J3,d3,bs(d3),Z);
  capsule('ex-k1',J1,J2);capsule('ex-k2',J2,J3);drawGripper('ex-gp',add(J3,mul(d3,0.5)),d3,bs(d3),0.4);
  const obj=sel('#ex-obj');[['ex-j1',dep(J1)],['ex-k1',dep(add(J1,mul(d1,L1/2)))],['ex-j2',dep(J2)],['ex-k2',dep(add(J2,mul(d2,L2/2)))],['ex-j3',dep(J3)],['ex-gp',dep(add(J3,mul(d3,1.2)))]].sort((p,q)=>q[1]-p[1]).forEach(it=>obj.appendChild(sel('#'+it[0])));
  // frames: X along each link, Z up (all parallel)
  setAxis('ex-z1',J1,Z,-1.4+3.4*ap.z,32,-1.4);setAxis('ex-z2',J2,Z,-1.4+3.4*ap.z,32,-1.4);setAxis('ex-z3',J3,Z,-1.4+3.4*ap.z,32,-1.4);
  setAxis('ex-x0',J1,[1,0,0],1.9*ap.f0,32,0);setAxis('ex-x1',J1,d1,1.9*ap.f1,32,0);setAxis('ex-x2',J2,d2,1.9*ap.f2,32,0);setAxis('ex-x3',J3,d3,1.9*ap.f3,32,0);
  // L1, L2 tapes
  const off=[0,-0.0,0.02];setD('#ex-a1',seg3(add(J1,off),add(J2,off)));setD('#ex-a2',seg3(add(J2,off),add(J3,off)));
  // theta arcs
  const arc=(id,wid,c,a0,a1)=>{const pts=[];const n=24;for(let k=0;k<=n;k++){const a=a0+(a1-a0)*k/n;pts.push(add(c,[Math.cos(a)*1.0,Math.sin(a)*1.0,0.0]));}setD('#'+id,Lp(pts.map(P)));setD('#'+wid,Dp([P(c)].concat(pts.map(P))));};
  arc('ex-r1','ex-w1',J1,0,t1);arc('ex-r2','ex-w2',J2,t1,a2);arc('ex-r3','ex-w3',J3,a2,a3);
  // labels
  place('ex-L-f0',J1,-95,52);place('ex-L-f1',J1,85,70);place('ex-L-f2',J2,70,70);place('ex-L-f3',J3,70,70);
  place('ex-L-z1',add(J1,[0,0,2.2]),44,0);place('ex-L-z2',add(J2,[0,0,2.2]),44,0);place('ex-L-z3',add(J3,[0,0,2.2]),44,0);
  place('ex-L-l1',add(J1,mul(d1,L1/2)),0,-64);place('ex-L-l2',add(J2,mul(d2,L2/2)),0,-64);
  const mid=(c,a0,a1)=>add(c,[Math.cos((a0+a1)/2)*1.55,Math.sin((a0+a1)/2)*1.55,0]);
  place('ex-L-t1',mid(J1,0,t1),0,0);place('ex-L-t2',mid(J2,t1,a2),0,0);place('ex-L-t3',mid(J3,a2,a3),0,0);
  place('ex-L-xy',EE,70,-60);}
const tl=gsap.timeline({paused:true});
tl.eventCallback('onUpdate',R);
${entryTL(".wrap")}
${exitTL(".wrap", EX_DUR)}
${CASCADE}
${caps.map(([id, s, dur]) => `cascade('#ex-${id}',${s});tl.fromTo('#ex-${id} .cap-in',{opacity:1},{opacity:0,duration:0.2,ease:'none'},${(s + dur - 0.22).toFixed(2)});`).join("\n")}
const ease='power4.out';
tl.set('.td.v',{opacity:0},0);tl.set('.nc',{opacity:0},0);
const note=(id,t0,t1)=>{tl.fromTo('#ex-'+id,{opacity:0,y:30},{opacity:1,y:0,duration:0.35,ease:'power4.out',immediateRender:false},t0);tl.to('#ex-'+id,{opacity:0,duration:0.3,ease:'none'},t1);};
const pop=(id,t)=>{tl.set('#'+id,{opacity:1},t);tl.fromTo('#'+id,{scale:0.5,transformOrigin:'50% 50%'},{scale:1,duration:0.34,ease:'back.out(1.8)'},t);};
const hl=(ids,t0,t1)=>ids.forEach(i=>{tl.set('#'+i,{backgroundColor:'#FFF4C2',borderColor:'#FFC21A'},t0);tl.set('#'+i,{backgroundColor:'#FFFFFF',borderColor:'#BFD0F0'},t1);});
// first beat: the arm in its book pose, (x,y) marker
tl.fromTo('#ex-L-xy',{opacity:0},{opacity:1,duration:0.3,ease:'none'},2.2);
tl.fromTo('.dtab .th',{opacity:0,y:30},{opacity:1,y:0,duration:0.3,ease,stagger:0.08},1.4);
tl.to(cam,{psi:-48,duration:7,ease:'power1.inOut'},0);
// e2: all joint variables to zero, frames appear
tl.to('#ex-L-xy',{opacity:0,duration:0.3,ease:'none'},7.4);
tl.to(st,{t1:0,t2:0,t3:0,duration:2.4,ease:'power2.inOut'},8.2);
tl.to(cam,{psi:-30,phi:24,sc:126,tx:2.6,ty:0,duration:3.2,ease:'power2.inOut'},7.6);
tl.to(ap,{f1:1,duration:0.8,ease:'power2.inOut'},10.8); tl.fromTo('#ex-L-f1',{opacity:0},{opacity:1,duration:0.3,ease:'none'},11.5);
tl.to(ap,{f0:1,duration:0.8,ease:'power2.inOut'},11.9); tl.fromTo('#ex-L-f0',{opacity:0},{opacity:1,duration:0.3,ease:'none'},12.6);
tl.to(ap,{f2:1,duration:0.8,ease:'power2.inOut'},13.0); tl.fromTo('#ex-L-f2',{opacity:0},{opacity:1,duration:0.3,ease:'none'},13.7);
tl.to(ap,{f3:1,duration:0.8,ease:'power2.inOut'},14.1); tl.fromTo('#ex-L-f3',{opacity:0},{opacity:1,duration:0.3,ease:'none'},14.8);
note('n2',12.0,15.6);note('n3',17.0,23.6);note('n4',25.0,31.6);note('n5',35.0,41.6);note('n6',44.0,51.6);
// e3: z axes parallel -> alpha column
tl.to(ap,{z:1,duration:1.0,ease:'power2.inOut'},16.2);
tl.fromTo('#ex-L-z1,#ex-L-z2,#ex-L-z3',{opacity:0},{opacity:1,duration:0.3,ease:'none'},17.0);
tl.to(cam,{psi:-6,phi:10,sc:126,tx:2.6,duration:3.0,ease:'power2.inOut'},15.4);
hl(['ex-h1'],17.2,23.6);['ex-c0-0','ex-c1-0','ex-c2-0'].forEach((id,i)=>pop(id,19.6+i*0.9));
// e4: d column
tl.to(cam,{psi:-32,phi:34,duration:3.0,ease:'power2.inOut'},23.2);
hl(['ex-h3'],24.4,31.6);['ex-c0-2','ex-c1-2','ex-c2-2'].forEach((id,i)=>pop(id,27.4+i*0.9));
// e5: a column with L1, L2
tl.to(cam,{psi:-8,phi:72,sc:126,tx:2.6,ty:0,duration:3.4,ease:'power2.inOut'},31.0);
tl.fromTo('#ex-hp-a',{opacity:0},{opacity:1,duration:0.5,ease:'none'},34.4); tl.fromTo('#ex-L-l1',{opacity:0},{opacity:1,duration:0.3,ease:'none'},35.0); tl.fromTo('#ex-L-l2',{opacity:0},{opacity:1,duration:0.3,ease:'none'},36.8);
hl(['ex-h2'],34.0,41.6);pop('ex-c0-1',35.6);pop('ex-c1-1',37.4);pop('ex-c2-1',39.0);
tl.to('#ex-hp-a',{opacity:0.25,duration:0.4,ease:'none'},41.6);
// e6: theta column and the arm turns
tl.to(cam,{psi:-34,phi:60,duration:2.6,ease:'power2.inOut'},41.0);
tl.fromTo('#ex-hp-t',{opacity:0},{opacity:1,duration:0.4,ease:'none'},43.4); tl.fromTo('#ex-L-t1,#ex-L-t2,#ex-L-t3',{opacity:0},{opacity:1,duration:0.3,ease:'none'},43.6);
tl.to(st,{t1:62*DEG,duration:1.6,ease:'power2.inOut'},43.4); tl.to(st,{t2:-48*DEG,duration:1.6,ease:'power2.inOut'},44.6); tl.to(st,{t3:36*DEG,duration:1.6,ease:'power2.inOut'},45.8);
hl(['ex-h4','ex-h5'],43.4,51.6);['ex-c0-3','ex-c1-3','ex-c2-3'].forEach((id,i)=>pop(id,44.2+i*0.8));['ex-c0-q','ex-c1-q','ex-c2-q'].forEach((id,i)=>pop(id,47.0+i*0.6));
tl.to(cam,{psi:-52,phi:30,sc:126,tx:2.4,ty:0.6,duration:3.6,ease:'power1.inOut'},47.6);
tl.fromTo('#ex-L-xy',{opacity:0},{opacity:1,duration:0.3,ease:'none'},51.0);
R();
window.__timelines['example']=tl;
`;
  // sound: softly mechanical (clicks, one servo whirr per joint move)
  sfx("whoosh-short", 0.02, 0.3);
  sfx("pop", 2.2, 0.35);
  sfx("servo", 8.2, 0.22);
  [11.5, 12.6, 13.7, 14.8].forEach((t) => sfx("pop", t, 0.35));
  sfx("click-soft", 16.2, 0.4);
  [19.6, 20.5, 21.4].forEach((t) => sfx("pop", t, 0.4));
  [27.4, 28.3, 29.2].forEach((t) => sfx("pop", t, 0.4));
  sfx("click-soft", 34.4, 0.4);
  [35.6, 37.4, 39.0].forEach((t) => sfx("pop", t, 0.4));
  sfx("servo", 43.4, 0.22);
  sfx("servo", 44.6, 0.22);
  sfx("servo", 45.8, 0.22);
  [44.2, 45.0, 45.8, 47.0, 47.6, 48.2].forEach((t) => sfx("pop", t, 0.4));
  sfx("ping", 52.0, 0.45);
  const html = `<template><style>${css}</style>
<div id="root" data-composition-id="example" data-width="1920" data-height="1080"><div class="wrap">
 ${svg}
 <div class="ttl">Example · 3R planar manipulator</div>
 ${tab}
 <div class="notes">${notes.map(([id, c, html]) => `<div class="nc" id="ex-${id}" style="--c:${c}">${html}</div>`).join("")}</div>
 ${capHtml}
</div></div><script>${js}</script></template>`;
  return { html, dur: EX_DUR };
}
