// The main scene (3D): a transparent copy of joint {i-1} rides along with the frame and, in four moves
// (a, alpha, d, theta), lands exactly on joint {i}. The camera turns to face each move.
import { C, FONT_CSS, BASE_CSS, TX, TXG, EN, words, cue, exitTL, entryTL } from "./lib.mjs";
import { ENGINE, jointDom, axisDom, capsuleDom, CSS3D } from "./engine.mjs";

export const TM = { a: 19.8, al: 31.8, d: 44.3, th: 55.8, as: 68.3, end: 80.4 };
const A = 3.4,
  AL = 35,
  D = 1.0,
  TH = 40;

export function buildDiagram(startAbs) {
  const sfx = (n, t, v) => cue(n, startAbs + t, v);
  const colors = { a: C.blue, al: C.purple, d: C.orange, th: C.green };
  const sym = { a: "a_{i-1}", al: "\\alpha_{i-1}", d: "d_i", th: "\\theta_i" };

  // ---------------- captions
  const T = (l, c) => TX(l, 52, c);
  const caps = [
    [
      "c1",
      0.9,
      4.3,
      `ذراع روبوت بسيطة: <b class="k">رابط</b> واحد اسمه ${EN("Link")} بين مفصلين اسمهم ${EN("Joints")}`,
    ],
    ["c2", 5.4, 4.2, `كل ${EN("Joint")} بيلف حوالين محور اسمه ${T("Z", C.red)}`],
    ["c3", 9.8, 4.5, `وعلى كل مفصل بنحط نظام إحداثيات اسمه ${EN("Frame")}`],
    [
      "c4",
      14.6,
      4.7,
      `هدفنا: ننقل ${EN("Frame")} ${T("\\{i-1\\}")} لحد ما يصير فوق ${T("\\{i\\}")}`,
    ],
    [
      "a1",
      TM.a + 0.3,
      5.5,
      `الرقم الأول ${T(sym.a, C.blue)}: المسافة بين المحورين ${T("Z", C.red)}، <b class="k blue">على طول</b> المحور ${T("X_{i-1}")}`,
    ],
    [
      "a2",
      TM.a + 6.2,
      5.2,
      `اسمه ${EN("Link length", "blue")} يعني طول الرابط نفسه، مثل المسطرة بين المفصلين`,
    ],
    [
      "l1",
      TM.al + 0.3,
      5.7,
      `الرقم الثاني ${T(sym.al, C.purple)}: الزاوية بين المحورين ${T("Z", C.red)}، <b class="k purple">حوالين</b> المحور ${T("X_{i-1}")}`,
    ],
    [
      "l2",
      TM.al + 6.4,
      5.4,
      `اسمه ${EN("Link twist", "purple")} يعني كم الرابط ملتوي: لو ${T("\\alpha=0", C.purple)} المحوران متوازيان`,
    ],
    [
      "d1",
      TM.d + 0.3,
      5.3,
      `الرقم الثالث ${T(sym.d, C.orange)}: المسافة بين المحورين ${T("X")}، <b class="k orange">على طول</b> المحور ${T("Z_i", C.red)}`,
    ],
    [
      "d2",
      TM.d + 6.0,
      5.0,
      `اسمه ${EN("Link offset", "orange")} يعني كم بنطلع أو بننزل على محور ${T("Z_i", C.red)}`,
    ],
    [
      "t1",
      TM.th + 0.3,
      5.9,
      `الرقم الرابع ${T(sym.th, C.green)}: الزاوية بين المحورين ${T("X")}، <b class="k green">حوالين</b> المحور ${T("Z_i", C.red)}`,
    ],
    [
      "t2",
      TM.th + 6.4,
      6.0,
      `اسمه ${EN("Joint angle", "green")} وهو الرقم اللي <b class="k">المحرك بيغيّره</b> لما المفصل يلف!`,
    ],
    [
      "s1",
      TM.as + 0.5,
      6.2,
      `نرجّع المفصل الشفاف للبداية ونعيد الخطوات: ${T("a", C.blue)} ثم ${T("\\alpha", C.purple)} ثم ${T("d", C.orange)} ثم ${T("\\theta", C.green)}`,
    ],
    [
      "s2",
      TM.as + 7.4,
      4.9,
      `هيك انطبق على ${EN("Joint")} ${T("i")} <b class="k">بأربع أرقام بس!</b>`,
    ],
  ];
  const capHtml = caps
    .map(
      ([id, s, dur, html]) =>
        `<div id="dg-${id}" class="cap clip" data-start="${s}" data-duration="${dur}"><div class="cap-in">${words(html)}</div></div>`,
    )
    .join("\n");

  // ---------------- right column
  const card = (id, sy, en, ar, op) =>
    `<div id="dg-pc-${id}" class="pc" style="--c:${colors[id]}"><div class="pc-sym">${TX(sy, 96, colors[id])}</div><div class="pc-en">${en}</div><div class="pc-ar">${ar}</div><div class="pc-op">${op}</div></div>`;
  const cards = [
    card("a", sym.a, "Link length", "طول الرابط", `⟷ Along ${TX("X_{i-1}", 34)}`),
    card("al", sym.al, "Link twist", "التواء الرابط", `⟲ About ${TX("X_{i-1}", 34)}`),
    card("d", sym.d, "Link offset", "إزاحة الرابط", `⟷ Along ${TX("Z_i", 34)}`),
    card("th", sym.th, "Joint angle", "زاوية المفصل", `⟲ About ${TX("Z_i", 34)}`),
    `<div id="dg-pc-as" class="pc pc-as"><div class="pc-en" style="font-size:36px">Joint ${TX("i-1", 36)} → Joint ${TX("i", 36)}</div><div class="chips">${["a", "al", "d", "th"].map((k) => `<div class="chip" id="dg-ch-${k}" style="--c:${colors[k]}">${TX(k === "al" ? "\\alpha" : k === "th" ? "\\theta" : k, 44, "inherit")} <span id="dg-cn-${k}">0</span></div>`).join("")}</div></div>`,
  ].join("");
  const vals = ["a", "al", "d", "th"]
    .map(
      (k) =>
        `<div id="dg-v-${k}" class="val" style="color:${colors[k]}">${TX(sym[k], 84, colors[k])}<span class="eq">=</span><span id="dg-n-${k}">0.0</span></div>`,
    )
    .join("");
  const dots = [
    ["a", "a"],
    ["al", "\\alpha"],
    ["d", "d"],
    ["th", "\\theta"],
  ]
    .map(
      ([k, s]) =>
        `<div class="dot" id="dg-dot-${k}" style="--c:${colors[k]}">${TX(s, 46, "inherit")}</div>`,
    )
    .join("");
  const legend = `<div class="legend"><div class="lg"><i style="background:${C.red}"></i>${TX("Z", 40, C.red)}<span>محور الدوران</span></div><div class="lg"><i style="background:${C.ink}"></i>${TX("X", 40, C.ink)}<span>محور القياس</span></div><div class="lg"><i class="gh"></i><span>المفصل الشفاف ${TX("i-1", 34)} بيمشي مع الـ Frame</span></div></div>`;

  // ---------------- svg stage
  const lb = (id, latex, px, col, pill = true) => TXG(id, latex, px, col, pill);
  const labels = [
    lb("dg-L-j0", "\\text{Joint}\\ i{-}1", 40, C.ink),
    lb("dg-L-lk", "\\text{Link}\\ i{-}1", 40, C.teal),
    lb("dg-L-j1", "\\text{Joint}\\ i", 40, C.ink),
    lb("dg-L-z0", "Z_{i-1}", 58, C.red, false),
    lb("dg-L-z1", "Z_i", 58, C.red, false),
    lb("dg-L-x0", "X_{i-1}", 58, C.ink, false),
    lb("dg-L-f0", "\\{i-1\\}", 52, C.ink),
    lb("dg-L-a", "a_{i-1}", 70, C.blue),
    lb("dg-L-al", "\\alpha_{i-1}", 70, C.purple),
    lb("dg-L-d", "d_i", 70, C.orange),
    lb("dg-L-th", "\\theta_i", 70, C.green),
    lb("dg-L-xi", "X_i", 58, C.ink, false),
    lb("dg-L-zi", "Z_i", 58, C.red, false),
    lb("dg-L-fi", "\\{i\\}", 56, C.ink),
    lb("dg-L-gi", "\\{i\\}", 52, C.ink),
  ].join("");
  const svg = `
<svg id="dg-svg" viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;left:0;top:0" data-layout-ignore>
 <g id="dg-fl"><path id="dg-fl-p" fill="#D3E1FA" fill-opacity=".75"/><path id="dg-fl-g" fill="none" stroke="#A9C0EC" stroke-width="2.5"/></g>
 <g id="dg-obj">${jointDom("dg-j0")}${capsuleDom("dg-lk")}${jointDom("dg-j1")}</g>
 <g id="dg-ax">${axisDom("dg-z0", C.red)}${axisDom("dg-z1", C.red)}${axisDom("dg-x0", C.ink, 8)}<circle id="dg-o0" r="13" fill="#fff" stroke="${C.ink}" stroke-width="6"/></g>
 <g id="dg-goal" opacity="0"><path id="dg-gx-l" fill="none" stroke="${C.ink}" stroke-width="9" stroke-dasharray="16 12" stroke-linecap="round"/><path id="dg-gx-h" fill="${C.ink}"/><path id="dg-gz-l" fill="none" stroke="${C.red}" stroke-width="9" stroke-dasharray="16 12" stroke-linecap="round"/><path id="dg-gz-h" fill="${C.red}"/><circle id="dg-go" r="13" fill="#fff" stroke="${C.ink}" stroke-width="6"/>
   <g id="dg-qm" opacity="0"><circle id="dg-qc" r="52" fill="#fff" stroke="${C.red}" stroke-width="8"/><text id="dg-qt" font-family="Inter,sans-serif" font-weight="900" font-size="72" fill="${C.red}" text-anchor="middle" dy="25">?</text></g></g>
 <g id="dg-help">
  <g id="dg-hp-a" opacity="0"><path id="dg-a-t" fill="none" stroke="${C.blue}" stroke-width="16" stroke-linecap="round"/><circle id="dg-a-0" r="11" fill="${C.blue}"/><circle id="dg-a-1" r="11" fill="${C.blue}"/></g>
  <g id="dg-hp-al" opacity="0"><path id="dg-al-q" fill="${C.purple}" fill-opacity=".07" stroke="${C.purple}" stroke-opacity=".5" stroke-width="3" stroke-dasharray="12 9"/><path id="dg-al-z" fill="none" stroke="${C.red}" stroke-width="6" stroke-dasharray="14 10" opacity=".8"/><path id="dg-al-w" fill="${C.purple}" fill-opacity=".30"/><path id="dg-al-a" fill="none" stroke="${C.purple}" stroke-width="13" stroke-linecap="round"/><path id="dg-al-h" fill="${C.purple}"/></g>
  <g id="dg-hp-d" opacity="0"><path id="dg-d-xq" fill="none" stroke="${C.orange}" stroke-width="5" stroke-dasharray="14 10"/><path id="dg-d-xo" fill="none" stroke="${C.orange}" stroke-width="5" stroke-dasharray="14 10"/><path id="dg-d-t" fill="none" stroke="${C.orange}" stroke-width="16" stroke-linecap="round"/><circle id="dg-d-0" r="11" fill="${C.orange}"/><circle id="dg-d-1" r="11" fill="${C.orange}"/></g>
  <g id="dg-hp-th" opacity="0"><path id="dg-th-q" fill="${C.green}" fill-opacity=".08" stroke="${C.green}" stroke-opacity=".5" stroke-width="3" stroke-dasharray="12 9"/><path id="dg-th-x" fill="none" stroke="${C.ink}" stroke-width="6" stroke-dasharray="14 10" opacity=".75"/><path id="dg-th-w" fill="${C.green}" fill-opacity=".30"/><path id="dg-th-a" fill="none" stroke="${C.green}" stroke-width="13" stroke-linecap="round"/><path id="dg-th-h" fill="${C.green}"/></g>
  <path id="dg-trail" fill="none" stroke="${C.blue}" stroke-width="5" stroke-dasharray="3 12" stroke-linecap="round" opacity="0"/>
 </g>
 <g id="dg-gh" opacity="0">${jointDom("dg-g", true)}${axisDom("dg-gx", C.ink, 11)}${axisDom("dg-gz", C.red, 11)}<circle id="dg-go2" r="15" fill="#fff" stroke="${C.ink}" stroke-width="7"/></g>
 <g id="dg-lb">${labels}</g>
</svg>`;

  const css = `${FONT_CSS}${BASE_CSS}${CSS3D}
.cap{position:absolute;right:590px;width:1230px;bottom:48px;min-height:150px;direction:rtl}
.cap-in{background:#fff;border:4px solid ${C.line};border-radius:30px;padding:20px 34px;font-size:50px;line-height:1.45;font-weight:600;text-align:right;box-shadow:0 10px 28px rgba(11,31,58,.10)}
.cap .w{opacity:0}
.pcwrap{position:absolute;left:1380px;top:60px;width:440px;height:300px}
.pc{position:absolute;inset:0;border-radius:34px;border:6px solid var(--c,${C.ink});background:#fff;padding:12px 20px;text-align:center;direction:ltr;opacity:0;box-shadow:0 10px 28px rgba(11,31,58,.12)}
.pc-sym{height:100px;display:flex;align-items:center;justify-content:center}
.pc-en{font-family:'Inter';font-weight:800;font-size:46px;color:${C.ink};direction:ltr}
.pc-ar{font-size:36px;font-weight:600;color:${C.muted};direction:rtl} .pc-op{font-family:'Inter';font-weight:700;font-size:34px;color:var(--c);margin-top:4px;direction:ltr}
.pc-as{--c:${C.ink};padding-top:16px}
.chips{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.chip{border:5px solid var(--c);border-radius:20px;font-family:'Inter';font-weight:800;font-size:40px;color:var(--c);padding:2px 6px;background:#fff;white-space:nowrap;display:flex;align-items:center;justify-content:center;gap:10px}
.chip.on{background:var(--c);color:#fff}
.dots{position:absolute;left:1380px;top:385px;width:440px;display:flex;gap:16px;justify-content:center;direction:ltr}
.dot{width:84px;height:84px;border-radius:50%;border:6px solid var(--c);color:var(--c);display:flex;align-items:center;justify-content:center;background:#fff}
.dot.on{background:var(--c);color:#fff}
.vals{position:absolute;left:1380px;top:495px;width:440px;height:110px}
.val{position:absolute;inset:0;font-size:80px;font-weight:800;direction:ltr;opacity:0;font-family:'Inter';display:flex;align-items:center;justify-content:center;gap:16px}
.val .eq{color:${C.ink}}
.legend{position:absolute;left:1380px;top:650px;width:440px;display:flex;flex-direction:column;gap:14px;direction:rtl}
.lg{display:flex;align-items:center;gap:14px;font-size:34px;font-weight:600;background:#fff;border:3px solid ${C.line};border-radius:20px;padding:8px 18px}
.lg i{display:block;width:34px;height:10px;border-radius:5px} .lg i.gh{height:28px;width:34px;border:4px dashed ${C.blue};background:rgba(21,101,255,.16);border-radius:8px}
`;

  const js = `
${ENGINE}
const A=${A},AL=${AL}*DEG,D=${D},TH=${TH}*DEG;
const st={a:0,al:0,d:0,th:0}, ap={j0:1,j1:0,lk:0,z0:0,z1:0,x0:0};
const Zd=al=>[0,-Math.sin(al),Math.cos(al)],Yd=al=>[0,Math.cos(al),Math.sin(al)];
const frame=(a,al,d,th)=>{const z=Zd(al),y=Yd(al);const x=[Math.cos(th),Math.sin(th)*y[1],Math.sin(th)*y[2]];return {o:add([a,0,0],mul(z,d)),x,z,y:cross(z,x)};};
const Q=[A,0,0], O0=[0,0,0], FI=frame(A,AL,D,TH);
const deg=r=>Math.round(r/DEG)+'\\u00B0';
function R(){
  camSet();
  const FM=frame(st.a,st.al,st.d,st.th);
  floor('dg-fl',-1.2,-3,8.5,-4.5,4.5,1);
  // joint 0 (frame {i-1}) and joint i (frame {i}); parts drop in from above
  const c0=add(O0,[0,0,(1-ap.j0)*3]), cI=add(FI.o,[0,0,(1-ap.j1)*3]);
  drawJoint('dg-j0',c0,[1,0,0],[0,1,0],[0,0,1]);
  drawJoint('dg-j1',cI,FI.x,FI.y,FI.z);
  capsule('dg-lk',[0.62,0,0],[0.62+(A-1.15-0.62)*ap.lk,0,0]);
  // depth order of the solid objects
  const obj=sel('#dg-obj'), items=[['dg-j0',dep(c0)],['dg-lk',dep([A/2,0,0])],['dg-j1',dep(cI)]].sort((p,q)=>q[1]-p[1]);
  items.forEach(it=>obj.appendChild(sel('#'+it[0])));
  // axes
  setAxis('dg-z0',O0,[0,0,1],-1.4+4.4*ap.z0,34,-1.4); setAxis('dg-z1',Q,Zd(AL),-1.9+5.1*ap.z1,34,-1.9);
  const x0a=setAxis('dg-x0',O0,[1,0,0],(A+1.7)*ap.x0,34,0);
  const po=P(O0),o0=sel('#dg-o0');o0.setAttribute('cx',f1(po[0]));o0.setAttribute('cy',f1(po[1]));
  // goal preview (frame {i})
  const ga=arrowPaths(FI.o,FI.x,1.9,32),gb=arrowPaths(FI.o,FI.z,2.3,32);setD('#dg-gx-l',ga.line);setD('#dg-gx-h',ga.head);setD('#dg-gz-l',gb.line);setD('#dg-gz-h',gb.head);
  const pg=P(FI.o);const go=sel('#dg-go');go.setAttribute('cx',f1(pg[0]));go.setAttribute('cy',f1(pg[1]));
  const qm=sel('#dg-qm'),pq=P(add(FI.o,[0,0,2.9]));qm.setAttribute('transform','translate('+f1(pq[0])+','+f1(pq[1])+')');
  // ghost = transparent copy of joint {i-1} riding with the moving frame
  drawJoint('dg-g',FM.o,FM.x,FM.y,FM.z);
  const gx=setAxis('dg-gx',FM.o,FM.x,1.9,32,0),gz=setAxis('dg-gz',FM.o,FM.z,2.3,32,0);
  const pm=P(FM.o),go2=sel('#dg-go2');go2.setAttribute('cx',f1(pm[0]));go2.setAttribute('cy',f1(pm[1]));
  // trail of the moving origin
  setD('#dg-trail',Lp([P(O0),P([st.a,0,0]),P(FM.o)]));
  // a : tape on the X axis
  setD('#dg-a-t',seg3(O0,[st.a,0,0]));const pa0=P(O0),pa1=P([st.a,0,0]);[['dg-a-0',pa0],['dg-a-1',pa1]].forEach(([i,p])=>{const e=sel('#'+i);e.setAttribute('cx',f1(p[0]));e.setAttribute('cy',f1(p[1]));});
  place('dg-L-a',[st.a/2,0,0],0,-62);
  // alpha : plane x=A, wedge + arc about X
  setD('#dg-al-q',Dp([P([A,-1.8,-1.0]),P([A,1.8,-1.0]),P([A,1.8,3.2]),P([A,-1.8,3.2])]));setD('#dg-al-z',seg3(Q,add(Q,[0,0,2.9])));
  const ap2=[],N=28;for(let k=0;k<=N;k++){ap2.push(add(Q,mul(Zd(st.al*k/N),1.7)));}
  setD('#dg-al-a',st.al>0.01?Lp(ap2.map(P)):'');setD('#dg-al-w',st.al>0.01?Dp([P(Q)].concat(ap2.map(P))):'');
  if(st.al>0.05){const e=P(ap2[N]),s2=P(ap2[N-2]);const dx=e[0]-s2[0],dy=e[1]-s2[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,h=34;setD('#dg-al-h','M'+f1(e[0]+ux*h*.7)+','+f1(e[1]+uy*h*.7)+'L'+f1(e[0]+nx*h*.55)+','+f1(e[1]+ny*h*.55)+'L'+f1(e[0]-nx*h*.55)+','+f1(e[1]-ny*h*.55)+'Z');}else setD('#dg-al-h','');
  place('dg-L-al',add(Q,mul(Zd(AL/2),2.35)),30,-8);
  // d : two X lines + tape on Z_i
  setD('#dg-d-xq',seg3(add(Q,[-1.4,0,0]),add(Q,[1.8,0,0])));setD('#dg-d-xo',seg3(add(FM.o,[-1.4,0,0]),add(FM.o,[1.8,0,0])));
  setD('#dg-d-t',seg3(Q,FM.o));const pd0=P(Q),pd1=P(FM.o);[['dg-d-0',pd0],['dg-d-1',pd1]].forEach(([i,p])=>{const e=sel('#'+i);e.setAttribute('cx',f1(p[0]));e.setAttribute('cy',f1(p[1]));});
  place('dg-L-d',add(Q,mul(Zd(AL),st.d/2)),-105,0);
  // theta : disc + wedge about Z_i
  const yd=Yd(st.al),ring=[];for(let k=0;k<40;k++){const a=k/40*Math.PI*2;ring.push(P(add(FM.o,mul(add(mul([1,0,0],Math.cos(a)),mul(yd,Math.sin(a))),1.9))));}
  setD('#dg-th-q',Dp(ring));setD('#dg-th-x',seg3(FM.o,add(FM.o,[2.1,0,0])));
  const tp=[];for(let k=0;k<=N;k++){const u=st.th*k/N;tp.push(add(FM.o,mul(add(mul([1,0,0],Math.cos(u)),mul(yd,Math.sin(u))),1.25)));}
  setD('#dg-th-a',st.th>0.01?Lp(tp.map(P)):'');setD('#dg-th-w',st.th>0.01?Dp([P(FM.o)].concat(tp.map(P))):'');
  if(st.th>0.05){const e=P(tp[N]),s2=P(tp[N-2]);const dx=e[0]-s2[0],dy=e[1]-s2[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,h=34;setD('#dg-th-h','M'+f1(e[0]+ux*h*.7)+','+f1(e[1]+uy*h*.7)+'L'+f1(e[0]+nx*h*.55)+','+f1(e[1]+ny*h*.55)+'L'+f1(e[0]-nx*h*.55)+','+f1(e[1]-ny*h*.55)+'Z');}else setD('#dg-th-h','');
  const um=Math.max(st.th,TH)/2;place('dg-L-th',add(FM.o,mul(add(mul([1,0,0],Math.cos(um)),mul(yd,Math.sin(um))),2.2)),0,0);
  // static labels
  place('dg-L-j0',add(O0,[0,0,-1.15]),-30,70);place('dg-L-lk',[A/2,0,0],0,-80);place('dg-L-j1',add(FI.o,[0,0,-1.15]),70,70);
  place('dg-L-z0',add(O0,[0,0,3.1]),44,-2);place('dg-L-z1',add(Q,mul(Zd(AL),3.2)),48,-4);place('dg-L-x0',[A+1.7,0,0],48,18);place('dg-L-f0',O0,-88,-12);place('dg-L-gi',FI.o,90,62);
  place('dg-L-xi',add(FM.o,mul(FM.x,1.9)),40,-8);place('dg-L-zi',add(FM.o,mul(FM.z,2.3)),40,-8);place('dg-L-fi',FM.o,95,58);
  // numbers
  const set=(id,t)=>{const e=sel('#'+id);if(e)e.textContent=t;};
  set('dg-n-a',n1(st.a));set('dg-n-al',deg(st.al));set('dg-n-d',n1(st.d));set('dg-n-th',deg(st.th));
  set('dg-cn-a',n1(st.a));set('dg-cn-al',deg(st.al));set('dg-cn-d',n1(st.d));set('dg-cn-th',deg(st.th));
}
function n1(v){return v.toFixed(1);}
const tl=gsap.timeline({paused:true});
tl.eventCallback('onUpdate',R);
${entryTL(".wrap")}
${exitTL(".wrap", TM.end)}
function cascade(id,t0,gap0){ const els=document.querySelectorAll('#dg-'+id+' .w'); let t=t0,gap=gap0||0.085; els.forEach(el=>{ tl.set(el,{opacity:0},0); tl.set(el,{opacity:1},t); tl.fromTo(el,{y:38},{y:0,duration:0.17,ease:'power4.out'},t); t+=gap; gap*=0.93; }); }
${caps.map(([id, s, dur]) => `cascade('${id}',${s});tl.fromTo('#dg-${id} .cap-in',{opacity:1},{opacity:0,duration:0.2,ease:'none'},${(s + dur - 0.22).toFixed(2)});`).join("\n")}
// ---- camera presets
const CAMS={est:{psi:-32,phi:20,sc:128,tx:1.9,ty:0,tz:0.7,sx:690,sy:560},a:{psi:-12,phi:13,sc:146,tx:1.9,ty:0,tz:0.5,sx:690,sy:565},
  al:{psi:-74,phi:9,sc:165,tx:2.6,ty:0,tz:0.8,sx:690,sy:545},d:{psi:-24,phi:11,sc:180,tx:3.2,ty:0.2,tz:0.8,sx:690,sy:530},
  th:{psi:0,phi:55,sc:150,tx:3.0,ty:-0.4,tz:0.8,sx:690,sy:500},as:{psi:-38,phi:21,sc:130,tx:2.6,ty:0,tz:0.7,sx:690,sy:565}};
Object.assign(cam,CAMS.est,{psi:-58});
function camTo(name,t,dur){tl.to(cam,Object.assign({duration:dur||1.6,ease:'power2.inOut'},CAMS[name]),t);}
tl.to(cam,{psi:-32,duration:19,ease:'power1.inOut'},0);
// ---- setup: link, second joint, axes, frame
const ease='power4.out';
tl.fromTo('#dg-L-j0',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease},0.8);
tl.to(ap,{lk:1,duration:1.1,ease:'power2.inOut'},2.2); tl.fromTo('#dg-L-lk',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease},3.2);
tl.set('#dg-j1',{opacity:0},0); tl.set('#dg-j1',{opacity:1},3.5); tl.to(ap,{j1:1,duration:0.9,ease:'back.out(1.3)'},3.5);
tl.fromTo('#dg-L-j1',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease},4.5);
tl.to('#dg-L-j0,#dg-L-lk,#dg-L-j1',{opacity:0,duration:0.3,ease:'none'},9.4);
tl.to(ap,{z0:1,duration:0.9,ease:'power2.inOut'},5.6); tl.fromTo('#dg-L-z0',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},6.5);
tl.to(ap,{z1:1,duration:0.9,ease:'power2.inOut'},7.2); tl.fromTo('#dg-L-z1',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},8.1);
tl.fromTo('#dg-o0',{opacity:0},{opacity:1,duration:0.3,ease:'none'},10.0); tl.set('#dg-o0',{opacity:0},0);
tl.to(ap,{x0:1,duration:1.0,ease:'power2.inOut'},10.3); tl.fromTo('#dg-L-x0',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},11.3);
tl.fromTo('#dg-L-f0',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},12.2);
tl.fromTo('#dg-goal',{opacity:0},{opacity:1,duration:0.45,ease:'none'},15.1); tl.fromTo('#dg-L-gi',{opacity:0},{opacity:1,duration:0.3,ease:'none'},15.4);
tl.fromTo('#dg-qm',{opacity:0,scale:0.3,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:0.35,ease:'back.out(1.7)'},17.3);
tl.to('#dg-goal,#dg-L-gi',{opacity:0,duration:0.4,ease:'none'},${TM.a - 0.4});
// ---- parameter phases
function card(id,t){['a','al','d','th','as'].forEach(c=>tl.set('#dg-pc-'+c,{opacity:c===id?1:0},t));tl.fromTo('#dg-pc-'+id,{x:90},{x:0,duration:0.4,ease:'power4.out'},t);}
function dotOn(id,t){tl.set('#dg-dot-'+id,{className:'dot on'},t);}
function val(id,t){['a','al','d','th'].forEach(c=>tl.set('#dg-v-'+c,{opacity:c===id?1:0},t));tl.fromTo('#dg-v-'+id,{y:24},{y:0,duration:0.3,ease:'power4.out'},t);}
tl.fromTo('.dots,.pcwrap,.legend',{opacity:0},{opacity:1,duration:0.4,ease:'none'},${TM.a - 0.8});
tl.set('.dot',{className:'dot'},0);
const hp=(id,t)=>tl.fromTo('#dg-hp-'+id,{opacity:0},{opacity:1,duration:0.5,ease:'none'},t);
const dim=(id,t,o)=>tl.to('#dg-hp-'+id,{opacity:o,duration:0.4,ease:'none'},t);
// a
camTo('a',${TM.a - 0.2},1.8); card('a',${TM.a}); val('a',${TM.a + 0.4}); dotOn('a',${TM.a});
tl.fromTo('#dg-gh',{opacity:0},{opacity:1,duration:0.5,ease:'none'},${TM.a + 0.9}); tl.fromTo('#dg-trail',{opacity:0},{opacity:0.9,duration:0.4,ease:'none'},${TM.a + 1.4});
hp('a',${TM.a + 1.0}); tl.to(st,{a:A,duration:3.0,ease:'power2.inOut'},${TM.a + 1.7});
tl.fromTo('#dg-L-a',{opacity:0},{opacity:1,duration:0.3,ease:'none'},${TM.a + 4.6});
tl.fromTo('#dg-L-lk',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease:'power4.out',immediateRender:false},${TM.a + 6.6}); tl.to('#dg-L-lk',{opacity:0,duration:0.3,ease:'none'},${TM.a + 10.9});
[${TM.a + 6.9},${TM.a + 8.7}].forEach(t=>tl.fromTo('#dg-lk-t',{strokeWidth:48},{strokeWidth:70,duration:0.35,ease:'power2.out',yoyo:true,repeat:1,immediateRender:false},t));
// alpha
dim('a',${TM.al},0.3); tl.to('#dg-L-a',{opacity:0,duration:0.3,ease:'none'},${TM.al});
camTo('al',${TM.al - 0.2},1.8); card('al',${TM.al}); val('al',${TM.al + 0.4}); dotOn('al',${TM.al});
hp('al',${TM.al + 1.0}); tl.fromTo('#dg-L-al',{opacity:0},{opacity:1,duration:0.3,ease:'none'},${TM.al + 4.8});
tl.to(st,{al:AL,duration:3.0,ease:'power2.inOut'},${TM.al + 1.8});
tl.to(st,{al:0,duration:1.1,ease:'power2.inOut'},${TM.al + 7.4}); tl.to(st,{al:AL,duration:1.1,ease:'power2.inOut'},${TM.al + 9.6});
// d
dim('al',${TM.d},0.3); tl.to('#dg-L-al',{opacity:0,duration:0.3,ease:'none'},${TM.d});
camTo('d',${TM.d - 0.2},1.8); card('d',${TM.d}); val('d',${TM.d + 0.4}); dotOn('d',${TM.d});
hp('d',${TM.d + 1.0}); tl.fromTo('#dg-L-d',{opacity:0},{opacity:1,duration:0.3,ease:'none'},${TM.d + 4.5});
tl.to(st,{d:D,duration:2.8,ease:'power2.inOut'},${TM.d + 1.8});
tl.to(st,{d:-0.55,duration:1.2,ease:'power2.inOut'},${TM.d + 7.0}); tl.to(st,{d:D,duration:1.2,ease:'power2.inOut'},${TM.d + 9.0});
// theta
dim('d',${TM.th},0.3); tl.to('#dg-L-d',{opacity:0,duration:0.3,ease:'none'},${TM.th});
camTo('th',${TM.th - 0.2},1.8); card('th',${TM.th}); val('th',${TM.th + 0.4}); dotOn('th',${TM.th});
hp('th',${TM.th + 1.0}); tl.fromTo('#dg-L-th',{opacity:0},{opacity:1,duration:0.3,ease:'none'},${TM.th + 4.8});
tl.to(st,{th:TH,duration:3.0,ease:'power2.inOut'},${TM.th + 1.8});
tl.to(st,{th:1.48,duration:1.5,ease:'power2.inOut'},${TM.th + 8.0}); tl.to(st,{th:TH,duration:1.4,ease:'power2.inOut'},${TM.th + 9.9});
// assemble: rewind, replay, land
dim('th',${TM.as},0); tl.to('#dg-L-th,#dg-trail',{opacity:0,duration:0.3,ease:'none'},${TM.as}); camTo('as',${TM.as},2.0);
card('as',${TM.as}); tl.to('#dg-v-th',{opacity:0,duration:0.2,ease:'none'},${TM.as});
tl.to(st,{th:0,d:0,al:0,a:0,duration:0.9,ease:'power2.inOut'},${TM.as + 0.2});
tl.fromTo('#dg-trail',{opacity:0},{opacity:0.9,duration:0.3,ease:'none',immediateRender:false},${TM.as + 1.2});
tl.to(st,{a:A,duration:1.1,ease:'power2.inOut'},${TM.as + 1.4}); tl.set('#dg-ch-a',{className:'chip on'},${TM.as + 1.4});
tl.to(st,{al:AL,duration:1.1,ease:'power2.inOut'},${TM.as + 2.7}); tl.set('#dg-ch-al',{className:'chip on'},${TM.as + 2.7});
tl.to(st,{d:D,duration:1.1,ease:'power2.inOut'},${TM.as + 4.0}); tl.set('#dg-ch-d',{className:'chip on'},${TM.as + 4.0});
tl.to(st,{th:TH,duration:1.1,ease:'power2.inOut'},${TM.as + 5.3}); tl.set('#dg-ch-th',{className:'chip on'},${TM.as + 5.3});
tl.set('#dg-ch-a,#dg-ch-al,#dg-ch-d,#dg-ch-th',{className:'chip'},${TM.as + 0.1}); tl.set('#dg-ch-a',{className:'chip on'},${TM.as + 1.4});
tl.to('#dg-L-z1',{opacity:0,duration:0.2,ease:'none'},${TM.as + 6.3});
tl.fromTo('#dg-L-xi,#dg-L-zi,#dg-L-fi',{opacity:0,scale:0.6},{opacity:1,scale:1,duration:0.4,ease:'back.out(1.5)',immediateRender:false},${TM.as + 6.5});
R();
window.__timelines['diagram']=tl;
`;

  // ---- sound
  const t = TM;
  sfx("whoosh-short", 0.02, 0.3);
  [2.2, 5.6, 7.2, 10.3].forEach((x) => sfx("click-soft", x, 0.4));
  [0.8, 3.2, 4.5, 6.5, 8.1, 12.2].forEach((x) => sfx("pop", x, 0.35));
  sfx("impact-bass-1", 3.5, 0.45);
  sfx("pop", 10.0, 0.5);
  sfx("pop", 15.4, 0.4);
  sfx("pop", 17.3, 0.5);
  for (const [T0, dur] of [
    [t.a, 4.65],
    [t.al, 4.85],
    [t.d, 4.65],
    [t.th, 4.85],
  ]) {
    sfx("whoosh", T0 - 0.2, 0.4);
    sfx("click-soft", T0 + 1.8, 0.4);
    sfx("ping", T0 + dur, 0.5);
  }
  sfx("sparkle", t.th + 8.1, 0.45);
  sfx("notification", t.th + 10.9, 0.25);
  sfx("whoosh", t.as + 0.2, 0.4);
  [1.4, 2.7, 4.0, 5.3].forEach((x) => sfx("click-soft", t.as + x, 0.45));
  sfx("riser", t.as + 6.7 - 10.03, 0.25);
  sfx("impact-bass-1", t.as + 6.7, 0.55);
  sfx("sparkle", t.as + 6.75, 0.45);

  const html = `<template>
<style>${css}</style>
<div id="root" data-composition-id="diagram" data-width="1920" data-height="1080">
 <div class="wrap">
  ${svg}
  <div class="pcwrap">${cards}</div>
  <div class="dots">${dots}</div>
  <div class="vals">${vals}</div>
  ${legend}
  ${capHtml}
 </div>
</div>
<script>${js}</script>
</template>`;
  return { html, dur: TM.end };
}
