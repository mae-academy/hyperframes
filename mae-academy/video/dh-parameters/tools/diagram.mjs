// The main scene: ONE continuous diagram. A frame travels from {i-1} to {i} in four moves = the four DH parameters.
import { C, FONT_CSS, BASE_CSS, S, EN, words, cue, exitTL, entryTL, MAS } from "./lib.mjs";

// ---------------------------------------------------------------- geometry (shared by build + runtime)
export const GEOM = `
const A=3.4, AL=35*Math.PI/180, D=1.25, TH=40*Math.PI/180;
const OX=330, OY=520, SC=160, PSI=-22*Math.PI/180, PHI=24*Math.PI/180;
const cps=Math.cos(PSI), sps=Math.sin(PSI), cph=Math.cos(PHI), sph=Math.sin(PHI);
const P=v=>{const y1=v[0]*sps+v[1]*cps; return [OX+SC*(v[0]*cps-v[1]*sps), OY-SC*(y1*sph+v[2]*cph)];};
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const Zd=al=>[0,-Math.sin(al),Math.cos(al)], Yd=al=>[0,Math.cos(al),Math.sin(al)];
const frame=(a,al,d,th)=>{const z=Zd(al),y=Yd(al);const x=[Math.cos(th),Math.sin(th)*y[1],Math.sin(th)*y[2]];return {o:add([a,0,0],mul(z,d)),x,z};};
const n1=v=>v.toFixed(1);
const arrow=(o,dir,len,head)=>{const s=P(o),e=P(add(o,mul(dir,len)));const dx=e[0]-s[0],dy=e[1]-s[1];const L=Math.hypot(dx,dy)||1;const ux=dx/L,uy=dy/L;const h=Math.min(head||28,L);const b=[e[0]-ux*h,e[1]-uy*h];const nx=-uy,ny=ux;
 return {line:'M'+n1(s[0])+','+n1(s[1])+'L'+n1(b[0])+','+n1(b[1]),head:'M'+n1(e[0])+','+n1(e[1])+'L'+n1(b[0]+nx*h*.46)+','+n1(b[1]+ny*h*.46)+'L'+n1(b[0]-nx*h*.46)+','+n1(b[1]-ny*h*.46)+'Z',tip:e};};
const seg=(p,q)=>{const s=P(p),e=P(q);return 'M'+n1(s[0])+','+n1(s[1])+'L'+n1(e[0])+','+n1(e[1]);};
const poly=(pts,close)=>'M'+pts.map(p=>{const q=P(p);return n1(q[0])+','+n1(q[1]);}).join('L')+(close?'Z':'');
`;
const G = new Function(
  `${GEOM}; return {A,AL,D,TH,P,add,mul,cross,Zd,Yd,frame,arrow,seg,poly,n1};`,
)();
const { A, AL, D, TH, P, add, mul, cross, Zd, Yd, arrow, seg, poly, frame } = G;

function hull(pts) {
  // monotone chain
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up = [];
  for (const q of p.reverse()) {
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const d2 = (pts) => "M" + pts.map((q) => q[0].toFixed(1) + "," + q[1].toFixed(1)).join("L") + "Z";
function cylinder(center, dir, r, t0, t1, id) {
  const u = [1, 0, 0],
    v = cross(dir, u),
    N = 44;
  const ring = (t, rr) =>
    Array.from({ length: N }, (_, k) => {
      const a = (k / N) * Math.PI * 2;
      return P(
        add(add(center, mul(dir, t)), add(mul(u, rr * Math.cos(a)), mul(v, rr * Math.sin(a)))),
      );
    });
  const body = hull([...ring(t0, r), ...ring(t1, r)]);
  return (
    `<g id="${id}"><path d="${d2(body)}" fill="${C.gold}" stroke="${C.ink}" stroke-width="7" stroke-linejoin="round"/>` +
    `<path d="${d2(ring(t1, r))}" fill="#FFE18A" stroke="${C.ink}" stroke-width="6" stroke-linejoin="round"/>` +
    `<path d="${d2(ring(t1, r * 0.36))}" fill="${C.goldDark}" stroke="${C.ink}" stroke-width="5" stroke-linejoin="round"/></g>`
  );
}
const lab = (x, y, t, sub, fill, size = 46, id = "", anchor = "start") =>
  `<text ${id ? `id="${id}"` : ""} x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${fill}" font-family="Inter,sans-serif" font-weight="800" font-size="${size}" text-anchor="${anchor}">${t}${sub ? `<tspan font-size="${Math.round(size * 0.58)}" dy="${Math.round(size * 0.16)}">${sub}</tspan>` : ""}</text>`;
const pill = (x, y, t, sub, fill, size = 34, w = 190, id = "") =>
  `<g ${id ? `id="${id}"` : ""} opacity="0"><rect x="${x - w / 2}" y="${y - size * 0.95}" width="${w}" height="${size * 1.55}" rx="${size * 0.5}" fill="#fff" stroke="${fill}" stroke-width="4"/>${lab(x, y + size * 0.1, t, sub, fill, size, "", "middle")}</g>`;

// ---------------------------------------------------------------- timing (local seconds)
export const TM = { a: 19.8, al: 31.8, d: 44.3, th: 55.8, as: 68.3, end: 80.4 };

export function buildDiagram(startAbs) {
  const Q = [A, 0, 0],
    Zi = Zd(AL),
    Oend = add(Q, mul(Zi, D));
  const abs = (t) => startAbs + t;
  const sfx = (n, t, v) => cue(n, abs(t), v);

  // ---- static artwork
  const ground = (c) =>
    `<path d="${d2(
      Array.from({ length: 40 }, (_, k) => {
        const a = (k / 40) * Math.PI * 2;
        return P([c[0] + 0.85 * Math.cos(a), c[1] + 0.85 * Math.sin(a), -0.5]);
      }),
    )}" fill="#E6EDFA"/>`;
  const bar0 = P([0.5, 0, 0]),
    bar1 = P([A - 0.55, 0, 0]);
  const z0 = arrow([0, 0, -0.6], [0, 0, 1], 3.8),
    z1 = arrow(add(Q, mul(Zi, -0.6)), Zi, 3.8),
    x0 = arrow([0, 0, 0], [1, 0, 0], A + 1.6);
  const axis = (id, a, col, w = 9) =>
    `<g id="${id}"><path id="${id}-l" d="${a.line}" pathLength="1" stroke-dasharray="1 1.2" stroke-dashoffset="1.1" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path id="${id}-h" d="${a.head}" fill="${col}" opacity="0"/></g>`;
  const O0 = P([0, 0, 0]);
  const tape = [0, 0, -0.78];
  const svg = `
<svg id="dg-svg" viewBox="0 0 1260 720" width="1260" height="720" style="position:absolute;left:60px;top:110px;overflow:visible" data-layout-allow-overflow>
 <g id="dg-ground" opacity="0">${ground([0, 0])}${ground([A, 0])}</g>
 <g id="dg-j0" opacity="0">${cylinder([0, 0, 0], [0, 0, 1], 0.52, -0.45, 1.75, "dg-j0c")}</g>
 <g id="dg-link" opacity="0"><path id="dg-linkp" d="M${bar0[0].toFixed(1)},${bar0[1].toFixed(1)}L${bar1[0].toFixed(1)},${bar1[1].toFixed(1)}" pathLength="1" stroke-dasharray="1 1.2" stroke-dashoffset="1.1" stroke="${C.ink}" stroke-width="54" stroke-linecap="round" fill="none"/>
   <path id="dg-linkq" d="M${bar0[0].toFixed(1)},${bar0[1].toFixed(1)}L${bar1[0].toFixed(1)},${bar1[1].toFixed(1)}" pathLength="1" stroke-dasharray="1 1.2" stroke-dashoffset="1.1" stroke="${C.teal}" stroke-width="40" stroke-linecap="round" fill="none"/></g>
 <g id="dg-j1" opacity="0">${cylinder(Q, Zi, 0.52, -0.45, 1.75, "dg-j1c")}</g>
 ${axis("dg-z0", z0, C.red)}${axis("dg-z1", z1, C.red)}${axis("dg-x0", x0, C.ink, 8)}
 <circle id="dg-o0" cx="${O0[0].toFixed(1)}" cy="${O0[1].toFixed(1)}" r="12" fill="#fff" stroke="${C.ink}" stroke-width="6" opacity="0"/>
 <g id="dg-labels">
  ${pill(O0[0] - 150, O0[1] + 96, "Joint i−1", "", C.ink, 38, 250, "dg-lj0")}
  ${pill((bar0[0] + bar1[0]) / 2, (bar0[1] + bar1[1]) / 2 - 70, "Link i−1", "", C.teal, 38, 240, "dg-llink")}
  ${pill(P(Q)[0] + 120, P(Q)[1] + 98, "Joint i", "", C.ink, 38, 200, "dg-lj1")}
  <g id="dg-lz0" opacity="0">${lab(z0.tip[0] - 120, z0.tip[1] + 14, "Z", "i−1", C.red, 52)}</g>
  <g id="dg-lz1" opacity="0">${lab(z1.tip[0] + 26, z1.tip[1] + 18, "Z", "i", C.red, 52)}</g>
  <g id="dg-lx0" opacity="0">${lab(x0.tip[0] + 18, x0.tip[1] + 20, "X", "i−1", C.ink, 52)}</g>
  <g id="dg-lf0" opacity="0">${lab(O0[0] - 80, O0[1] - 38, "{i−1}", "", C.ink, 46, "", "middle")}</g>
 </g>
 <g id="dg-goal" opacity="0">
   ${(() => {
     const fe = frame(A, AL, D, TH),
       gx = arrow(fe.o, fe.x, 1.75, 30),
       gz = arrow(fe.o, fe.z, 2.0, 30);
     const po = P(fe.o),
       p0 = P([0, 0, 0]);
     const mx = (po[0] + p0[0]) / 2,
       my = (po[1] + p0[1]) / 2 - 150;
     return (
       `<path d="${gx.line}" stroke="${C.ink}" stroke-width="9" stroke-dasharray="16 12" stroke-linecap="round" fill="none"/><path d="${gx.head}" fill="${C.ink}"/><path d="${gz.line}" stroke="${C.red}" stroke-width="9" stroke-dasharray="16 12" stroke-linecap="round" fill="none"/><path d="${gz.head}" fill="${C.red}"/>` +
       `<circle cx="${po[0].toFixed(1)}" cy="${po[1].toFixed(1)}" r="13" fill="#fff" stroke="${C.ink}" stroke-width="6"/>` +
       `<rect x="${(po[0] + 22).toFixed(1)}" y="${(po[1] + 34).toFixed(1)}" width="118" height="68" rx="34" fill="#fff" stroke="${C.ink}" stroke-width="5" stroke-dasharray="12 8"/><text x="${(po[0] + 81).toFixed(1)}" y="${(po[1] + 81).toFixed(1)}" font-family="Inter,sans-serif" font-weight="800" font-size="40" fill="${C.ink}" text-anchor="middle">{i}</text>` +
       `<g id="dg-qm" opacity="0"><circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="52" fill="#fff" stroke="${C.red}" stroke-width="8"/><text x="${mx.toFixed(1)}" y="${(my + 24).toFixed(1)}" font-family="Inter,sans-serif" font-weight="900" font-size="72" fill="${C.red}" text-anchor="middle">?</text></g>` +
       `<path d="${seg([0, 0, 0.9], add([0, 0, 0.9], [0, 0, 0]))}" stroke="none"/>`
     );
   })()}
 </g>
 <!-- helper groups -->
 <g id="dg-ga" opacity="0">
   <path d="${seg([0, 0, -0.45], [0, 0, tape[2]])}" stroke="${C.blue}" stroke-width="4" stroke-dasharray="10 8" fill="none"/>
   <path d="${seg([A, 0, -0.45], [A, 0, tape[2]])}" stroke="${C.blue}" stroke-width="4" stroke-dasharray="10 8" fill="none"/>
   <path id="dg-atape" d="" stroke="${C.blue}" stroke-width="15" stroke-linecap="round" fill="none"/>
   <path id="dg-atk0" d="" stroke="${C.blue}" stroke-width="7" stroke-linecap="round" fill="none"/><path id="dg-atk1" d="" stroke="${C.blue}" stroke-width="7" stroke-linecap="round" fill="none"/>
   <text id="dg-la" font-family="Inter,sans-serif" font-weight="800" font-size="62" stroke="#fff" stroke-width="12" paint-order="stroke" stroke-linejoin="round" fill="${C.blue}" text-anchor="middle">a<tspan font-size="36" dy="9">i−1</tspan></text>
 </g>
 <g id="dg-gal" opacity="0">
   <path d="${poly(
     [
       [A, -1.7, -0.5],
       [A, 1.7, -0.5],
       [A, 1.7, 2.7],
       [A, -1.7, 2.7],
     ],
     true,
   )}" fill="${C.purple}" fill-opacity=".07" stroke="${C.purple}" stroke-opacity=".5" stroke-width="3" stroke-dasharray="12 9"/>
   <path d="${seg(Q, add(Q, [0, 0, 2.6]))}" stroke="${C.red}" stroke-width="6" stroke-dasharray="14 10" opacity=".75" fill="none"/>
   <path id="dg-alw" d="" fill="${C.purple}" fill-opacity=".30"/><path id="dg-alarc" d="" stroke="${C.purple}" stroke-width="12" stroke-linecap="round" fill="none"/><path id="dg-alhd" d="" fill="${C.purple}"/>
   <text id="dg-lal" font-family="Inter,sans-serif" font-weight="800" font-size="62" stroke="#fff" stroke-width="12" paint-order="stroke" stroke-linejoin="round" fill="${C.purple}" text-anchor="middle">α<tspan font-size="36" dy="9">i−1</tspan></text>
 </g>
 <g id="dg-gd" opacity="0">
   <path d="${seg(add(Q, [-1.3, 0, 0]), add(Q, [1.7, 0, 0]))}" stroke="${C.orange}" stroke-width="5" stroke-dasharray="14 10" fill="none"/>
   <path id="dg-dxl" d="" stroke="${C.orange}" stroke-width="5" stroke-dasharray="14 10" fill="none"/>
   <path id="dg-dtk" d="" stroke="${C.orange}" stroke-width="5" stroke-dasharray="6 6" fill="none"/>
   <path id="dg-dtape" d="" stroke="${C.orange}" stroke-width="15" stroke-linecap="round" fill="none"/>
   <text id="dg-ld" font-family="Inter,sans-serif" font-weight="800" font-size="62" stroke="#fff" stroke-width="12" paint-order="stroke" stroke-linejoin="round" fill="${C.orange}" text-anchor="middle">d<tspan font-size="36" dy="9">i</tspan></text>
 </g>
 <g id="dg-gth" opacity="0">
   <path d="${poly(
     Array.from({ length: 36 }, (_, k) => {
       const a = (k / 36) * Math.PI * 2;
       return add(Oend, add(mul([1, 0, 0], 1.55 * Math.cos(a)), mul(Yd(AL), 1.55 * Math.sin(a))));
     }),
     true,
   )}" fill="${C.green}" fill-opacity=".08" stroke="${C.green}" stroke-opacity=".5" stroke-width="3" stroke-dasharray="12 9"/>
   <path d="${seg(Oend, add(Oend, [2.0, 0, 0]))}" stroke="${C.ink}" stroke-width="6" stroke-dasharray="14 10" opacity=".7" fill="none"/>
   <path id="dg-thw" d="" fill="${C.green}" fill-opacity=".30"/><path id="dg-tharc" d="" stroke="${C.green}" stroke-width="12" stroke-linecap="round" fill="none"/><path id="dg-thhd" d="" fill="${C.green}"/>
   <text id="dg-lth" font-family="Inter,sans-serif" font-weight="800" font-size="62" stroke="#fff" stroke-width="12" paint-order="stroke" stroke-linejoin="round" fill="${C.green}" text-anchor="middle">θ<tspan font-size="36" dy="9">i</tspan></text>
 </g>
 <!-- the travelling frame -->
 <g id="dg-m" opacity="0">
   <path id="dg-mxl" d="" stroke="${C.ink}" stroke-width="13" stroke-linecap="round" fill="none"/><path id="dg-mxh" d="" fill="${C.ink}"/>
   <path id="dg-mzl" d="" stroke="${C.red}" stroke-width="13" stroke-linecap="round" fill="none"/><path id="dg-mzh" d="" fill="${C.red}"/>
   <circle id="dg-mo" r="15" fill="#fff" stroke="${C.ink}" stroke-width="7"/>
 </g>
 <g id="dg-fin" opacity="0">
   <text id="dg-lxi" font-family="Inter,sans-serif" font-weight="800" font-size="54" fill="${C.ink}">X<tspan font-size="32" dy="9">i</tspan></text>
   <text id="dg-lzi" font-family="Inter,sans-serif" font-weight="800" font-size="54" fill="${C.red}">Z<tspan font-size="32" dy="9">i</tspan></text>
   <g id="dg-lfi"><rect id="dg-lfir" x="0" y="0" width="118" height="68" rx="34" fill="${C.ink}"/><text id="dg-lfit" x="59" y="47" font-family="Inter,sans-serif" font-weight="800" font-size="40" fill="#fff" text-anchor="middle">{i}</text></g>
 </g>
</svg>`;

  // ---- captions (clips)
  const caps = [
    [
      "c1",
      0.9,
      4.3,
      `هاي ذراع روبوت بسيطة: ${"<b class=k>رابط</b>"} واحد (${EN("Link")}) بين مفصلين (${EN("Joints")})`,
    ],
    ["c2", 5.4, 4.2, `كل ${EN("Joint")} بيلف حوالين محور اسمه ${S("Z", "", "red")}`],
    ["c3", 9.8, 4.5, `وعلى كل مفصل بنحط نظام إحداثيات اسمه ${EN("Frame")}`],
    [
      "c4",
      14.6,
      4.6,
      `هدفنا: نوصف كيف بنروح من ${EN("Frame {i−1}", "")} إلى ${EN("Frame {i}", "")}`,
    ],
    [
      "a1",
      TM.a + 0.3,
      5.5,
      `الرقم الأول ${S("a", "i−1", "blue")}: المسافة بين المحورين ${S("Z", "", "red")}، <b class="k blue">على طول</b> المحور ${S("X", "i−1")}`,
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
      `الرقم الثاني ${S("α", "i−1", "purple")}: الزاوية بين المحورين ${S("Z", "", "red")}، <b class="k purple">حوالين</b> المحور ${S("X", "i−1")}`,
    ],
    [
      "l2",
      TM.al + 6.4,
      5.4,
      `اسمه ${EN("Link twist", "purple")} يعني كم الرابط ملتوي: لو ${S("α", "", "purple")} = 0 المحوران متوازيان`,
    ],
    [
      "d1",
      TM.d + 0.3,
      5.3,
      `الرقم الثالث ${S("d", "i", "orange")}: المسافة بين المحورين ${S("X", "")}، <b class="k orange">على طول</b> المحور ${S("Z", "i", "red")}`,
    ],
    [
      "d2",
      TM.d + 6.0,
      5.0,
      `اسمه ${EN("Link offset", "orange")} يعني كم بنطلع أو بننزل على محور ${S("Z", "i", "red")}`,
    ],
    [
      "t1",
      TM.th + 0.3,
      5.9,
      `الرقم الرابع ${S("θ", "i", "green")}: الزاوية بين المحورين ${S("X", "")}، <b class="k green">حوالين</b> المحور ${S("Z", "i", "red")}`,
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
      `نرجّع الإطار للبداية ونعيد الخطوات بالترتيب: ${S("a", "", "blue")} ثم ${S("α", "", "purple")} ثم ${S("d", "", "orange")} ثم ${S("θ", "", "green")}`,
    ],
    [
      "s2",
      TM.as + 7.4,
      4.9,
      `هيك وصلنا من ${EN("Frame {i−1}")} إلى ${EN("Frame {i}")} <b class="k">بأربع أرقام بس!</b>`,
    ],
  ];
  const capHtml = caps
    .map(
      ([id, s, dur, html]) =>
        `<div id="dg-${id}" class="cap clip" data-start="${s}" data-duration="${dur}"><div class="cap-in">${words(html)}</div></div>`,
    )
    .join("\n");

  // ---- right column
  const card = (id, col, symHtml, en, ar, op) =>
    `<div id="dg-pc-${id}" class="pc" style="--c:${col}"><div class="pc-sym">${symHtml}</div><div class="pc-en">${en}</div><div class="pc-ar">${ar}</div><div class="pc-op">${op}</div></div>`;
  const cards = [
    card(
      "a",
      C.blue,
      S("a", "i−1"),
      "Link length",
      "طول الرابط",
      `<span class="pc-ic">⟷</span> Along ${S("X", "i−1")}`,
    ),
    card(
      "al",
      C.purple,
      S("α", "i−1"),
      "Link twist",
      "التواء الرابط",
      `<span class="pc-ic">⟲</span> About ${S("X", "i−1")}`,
    ),
    card(
      "d",
      C.orange,
      S("d", "i"),
      "Link offset",
      "إزاحة الرابط",
      `<span class="pc-ic">⟷</span> Along ${S("Z", "i")}`,
    ),
    card(
      "th",
      C.green,
      S("θ", "i"),
      "Joint angle",
      "زاوية المفصل",
      `<span class="pc-ic">⟲</span> About ${S("Z", "i")}`,
    ),
    `<div id="dg-pc-as" class="pc pc-as"><div class="pc-en" style="font-size:38px">Frame&nbsp;{i−1} → Frame&nbsp;{i}</div><div class="chips">
       <div class="chip" id="dg-ch-a" style="--c:${C.blue}">${S("a", "")} <span id="dg-cn-a">0.0</span></div><div class="chip" id="dg-ch-al" style="--c:${C.purple}">${S("α", "")} <span id="dg-cn-al">0°</span></div>
       <div class="chip" id="dg-ch-d" style="--c:${C.orange}">${S("d", "")} <span id="dg-cn-d">0.0</span></div><div class="chip" id="dg-ch-th" style="--c:${C.green}">${S("θ", "")} <span id="dg-cn-th">0°</span></div></div></div>`,
  ].join("");
  const val = (id, col, sym, unit = "") =>
    `<div id="dg-v-${id}" class="val" style="color:${col}">${sym}<span class="eq">=</span><span id="dg-n-${id}">0.0</span>${unit ? `<span class="un">${unit}</span>` : ""}</div>`;
  const vals =
    val("a", C.blue, S("a", "i−1")) +
    val("al", C.purple, S("α", "i−1")) +
    val("d", C.orange, S("d", "i")) +
    val("th", C.green, S("θ", "i"));
  const dots = [
    ["a", C.blue, "a"],
    ["al", C.purple, "α"],
    ["d", C.orange, "d"],
    ["th", C.green, "θ"],
  ]
    .map(([id, c, s]) => `<div class="dot" id="dg-dot-${id}" style="--c:${c}">${s}</div>`)
    .join("");
  const mascots = [
    ["tn", "talk_point-native"],
    ["tz", "talk_point-neutral"],
    ["te", "talk_point-explain"],
    ["th", "talk_point-happy"],
    ["tu", "talk_point-eureka"],
    ["tp", "talk_point-proud"],
    ["wk", "wink_point-wink"],
  ];
  const masHtml = mascots
    .map(([k, f]) => `<img id="dg-m-${k}" class="mimg" src="${MAS(f)}" alt="" style="opacity:0">`)
    .join("");

  const css = `${FONT_CSS}${BASE_CSS}
.cap{position:absolute;right:${1920 - 1330}px;width:1230px;bottom:50px;min-height:150px;direction:rtl}
.cap-in{background:${C.soft};border:4px solid ${C.line};border-radius:30px;padding:20px 34px;font-size:50px;line-height:1.4;font-weight:600;text-align:right}
.cap .w{opacity:0}
.pcwrap{position:absolute;left:1380px;top:70px;width:440px;height:300px}
.pc{position:absolute;inset:0;border-radius:34px;border:6px solid var(--c,${C.ink});background:#fff;padding:10px 20px;text-align:center;direction:ltr;opacity:0}
.pc-sym{font-size:84px;line-height:1.0;color:var(--c)} .pc-en{font-family:'Inter';font-weight:800;font-size:46px;color:${C.ink};direction:ltr}
.pc-ar{font-size:36px;font-weight:600;color:${C.muted};direction:rtl} .pc-op{font-family:'Inter';font-weight:700;font-size:32px;color:var(--c);margin-top:6px;direction:ltr}
.pc-ic{font-size:36px;font-weight:700}
.pc-as{--c:${C.ink};padding-top:14px}
.chips{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}
.chip{border:5px solid var(--c);border-radius:20px;font-family:'Inter';font-weight:800;font-size:40px;color:var(--c);padding:4px 6px;background:#fff;white-space:nowrap}
.chip.on{background:var(--c);color:#fff}
.dots{position:absolute;left:1380px;top:395px;width:440px;display:flex;gap:16px;justify-content:center;direction:ltr}
.dot{width:80px;height:80px;border-radius:50%;border:6px solid var(--c);color:var(--c);font-family:'Inter';font-weight:800;font-size:44px;display:flex;align-items:center;justify-content:center;background:#fff}
.dot.on{background:var(--c);color:#fff}
.vals{position:absolute;left:1380px;top:500px;width:440px;height:100px}
.val{position:absolute;inset:0;font-size:84px;font-weight:800;text-align:center;direction:ltr;opacity:0;font-family:'Inter'}
.val .eq{margin:0 18px;color:${C.ink}} .val .un{font-size:.6em}
.mas{position:absolute;left:1430px;top:615px;width:380px;height:440px}
.mimg{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain}
`;

  const js = `
${GEOM}
const st={a:0,al:0,d:0,th:0};
const Q=[A,0,0], Zi=Zd(AL);
const $=s=>document.querySelector(s);
const setd=(id,d)=>{const e=$(id); if(e) e.setAttribute('d',d);};
const settxt=(id,x,y)=>{const e=$(id); if(e){e.setAttribute('x',n1(x)); e.setAttribute('y',n1(y));}};
function R(){
  const f=frame(st.a,st.al,st.d,st.th);
  const ax=arrow(f.o,f.x,1.75,30), az=arrow(f.o,f.z,2.0,30);
  setd('#dg-mxl',ax.line); setd('#dg-mxh',ax.head); setd('#dg-mzl',az.line); setd('#dg-mzh',az.head);
  const po=P(f.o); const mo=$('#dg-mo'); mo.setAttribute('cx',n1(po[0])); mo.setAttribute('cy',n1(po[1]));
  // a : tape below the object
  const t0=[0,0,-0.78], t1=[st.a,0,-0.78];
  setd('#dg-atape',seg(t0,t1)); setd('#dg-atk0',seg([0,0,-0.95],[0,0,-0.6])); setd('#dg-atk1',seg([st.a,0,-0.95],[st.a,0,-0.6]));
  const pa=P([st.a/2,0,-0.78]); settxt('#dg-la',pa[0],pa[1]+72);
  // alpha : arc about X, in the plane x=A
  const ap=[], N=26; for(let k=0;k<=N;k++){const u=st.al*k/N; ap.push(add(Q,mul(Zd(u),1.45)));}
  setd('#dg-alarc', st.al>0.01? poly(ap,false):''); setd('#dg-alw', st.al>0.01? poly([Q,...ap],true):'');
  if(st.al>0.05){const e=ap[N], p=ap[N-2]; const s2=P(p), e2=P(e); const dx=e2[0]-s2[0],dy=e2[1]-s2[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,h=30; setd('#dg-alhd','M'+n1(e2[0]+ux*h*.7)+','+n1(e2[1]+uy*h*.7)+'L'+n1(e2[0]+nx*h*.55)+','+n1(e2[1]+ny*h*.55)+'L'+n1(e2[0]-nx*h*.55)+','+n1(e2[1]-ny*h*.55)+'Z');} else setd('#dg-alhd','');
  const pl=P(add(Q,mul(Zd(AL/2),2.05))); settxt('#dg-lal',pl[0]+46,pl[1]-4);
  // d : tape offset to the side of Z_i
  const off=[-0.95,0,0], qd=add(Q,off), od=add(f.o,off);
  setd('#dg-dtape',seg(qd,od)); setd('#dg-dtk',seg(Q,qd)+seg(f.o,od)); setd('#dg-dxl',seg(add(f.o,[-1.3,0,0]),add(f.o,[1.7,0,0])));
  const pd=P(add(Q,mul(Zi,st.d/2))); settxt('#dg-ld',pd[0]-150,pd[1]+22);
  // theta : arc about Z_i at the frame origin
  const O=add([A,0,0],mul(Zi,D)), yd=Yd(AL), tp=[]; for(let k=0;k<=N;k++){const u=st.th*k/N; tp.push(add(O,mul(add(mul([1,0,0],Math.cos(u)),mul(yd,Math.sin(u))),1.15)));}
  setd('#dg-tharc', st.th>0.01? poly(tp,false):''); setd('#dg-thw', st.th>0.01? poly([O,...tp],true):'');
  if(st.th>0.05){const e=tp[N], p=tp[N-2]; const s2=P(p), e2=P(e); const dx=e2[0]-s2[0],dy=e2[1]-s2[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux,h=30; setd('#dg-thhd','M'+n1(e2[0]+ux*h*.7)+','+n1(e2[1]+uy*h*.7)+'L'+n1(e2[0]+nx*h*.55)+','+n1(e2[1]+ny*h*.55)+'L'+n1(e2[0]-nx*h*.55)+','+n1(e2[1]-ny*h*.55)+'Z');} else setd('#dg-thhd','');
  const um=Math.max(st.th,TH)/2, pt=P(add(O,mul(add(mul([1,0,0],Math.cos(um)),mul(yd,Math.sin(um))),1.75))); settxt('#dg-lth',pt[0]+8,pt[1]+4);
  // final labels
  settxt('#dg-lxi',ax.tip[0]+16,ax.tip[1]+22); settxt('#dg-lzi',az.tip[0]+22,az.tip[1]+14);
  const fi=$('#dg-lfi'); fi.setAttribute('transform','translate('+n1(po[0]+22)+','+n1(po[1]+34)+')');
  // numbers
  const deg=r=>Math.round(r*180/Math.PI)+'\\u00B0';
  $('#dg-n-a').textContent=n1(st.a); $('#dg-n-al').textContent=deg(st.al); $('#dg-n-d').textContent=n1(st.d); $('#dg-n-th').textContent=deg(st.th);
  $('#dg-cn-a').textContent=n1(st.a); $('#dg-cn-al').textContent=deg(st.al); $('#dg-cn-d').textContent=n1(st.d); $('#dg-cn-th').textContent=deg(st.th);
}
const tl=gsap.timeline({paused:true});
tl.eventCallback('onUpdate',R);
${entryTL(".wrap")}
${exitTL(".wrap", TM.end)}
// binary word cascade (waterfall entry, gaps shrink)
function cascade(id,t0,gap0){ const els=document.querySelectorAll('#dg-'+id+' .w'); let t=t0,gap=gap0||0.085; els.forEach(el=>{ tl.set(el,{opacity:0},0); tl.set(el,{opacity:1},t); tl.fromTo(el,{y:38},{y:0,duration:0.17,ease:'power4.out'},t); t+=gap; gap*=0.93; }); }
${caps.map(([id, s, dur]) => `cascade('${id}',${s});tl.fromTo('#dg-${id} .cap-in',{opacity:1},{opacity:0,duration:0.2,ease:'none'},${(s + dur - 0.22).toFixed(2)});`).join("\n")}
// mascot expression swaps
const MK=['tn','tz','te','th','tu','tp','wk'];
function mas(t,k){ MK.forEach(m=>tl.set('#dg-m-'+m,{opacity:m===k?1:0},t)); tl.fromTo('.mas',{scale:0.965,transformOrigin:'50% 100%'},{scale:1,duration:0.28,ease:'power4.out',immediateRender:false},t); }
tl.fromTo('.mas',{y:70,opacity:0},{y:0,opacity:1,duration:0.5,ease:'power4.out'},0.35);
mas(0.35,'tz'); mas(5.4,'te'); mas(9.8,'tz'); mas(14.6,'th');
mas(${TM.a},'te'); mas(${TM.a + 4.7},'th'); mas(${TM.a + 6.2},'tz'); mas(${TM.a + 7.0},'te');
mas(${TM.al},'te'); mas(${TM.al + 6.4},'tp'); mas(${TM.d},'tz'); mas(${TM.d + 6.0},'te');
mas(${TM.th},'te'); mas(${TM.th + 6.4},'tz'); mas(${TM.th + 8.1},'tu');
mas(${TM.as},'tz'); mas(${TM.as + 6.5},'wk'); mas(${TM.as + 8.6},'tp');

// ---------------- setup: link + two joints + axes + frame
const ease='power4.out';
tl.fromTo('#dg-ground',{opacity:0},{opacity:1,duration:0.5,ease:'none'},0.5);
tl.fromTo('#dg-j0',{opacity:0,y:40},{opacity:1,y:0,duration:0.45,ease},0.7);
tl.fromTo('#dg-lj0',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease},1.3);
tl.fromTo('#dg-link',{opacity:0},{opacity:1,duration:0.01},2.2); tl.fromTo('#dg-linkp,#dg-linkq',{strokeDashoffset:1.1},{strokeDashoffset:0,duration:1.1,ease:'power2.inOut'},2.2);
tl.fromTo('#dg-llink',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease},3.0);
tl.fromTo('#dg-j1',{opacity:0,y:40},{opacity:1,y:0,duration:0.45,ease},3.5);
tl.fromTo('#dg-lj1',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease},4.1);
tl.to('#dg-lj0,#dg-llink,#dg-lj1',{opacity:0,duration:0.3,ease:'none'},9.4);
tl.fromTo('#dg-z0-l',{strokeDashoffset:1.1},{strokeDashoffset:0,duration:0.9,ease:'power2.inOut'},5.6); tl.fromTo('#dg-z0-h',{opacity:0},{opacity:1,duration:0.05},6.45);
tl.fromTo('#dg-lz0',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},6.5);
tl.fromTo('#dg-z1-l',{strokeDashoffset:1.1},{strokeDashoffset:0,duration:0.9,ease:'power2.inOut'},7.2); tl.fromTo('#dg-z1-h',{opacity:0},{opacity:1,duration:0.05},8.05);
tl.fromTo('#dg-lz1',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},8.1);
tl.fromTo('#dg-o0',{opacity:0,scale:0.4,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:0.3,ease},10.0);
tl.fromTo('#dg-x0-l',{strokeDashoffset:1.1},{strokeDashoffset:0,duration:1.0,ease:'power2.inOut'},10.3); tl.fromTo('#dg-x0-h',{opacity:0},{opacity:1,duration:0.05},11.25);
tl.fromTo('#dg-lx0',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},11.3);
tl.fromTo('#dg-lf0',{opacity:0,y:18},{opacity:1,y:0,duration:0.3,ease},12.2);
tl.fromTo('#dg-pc-as',{opacity:0},{opacity:0,duration:0.01},0);
tl.fromTo('#dg-goal',{opacity:0},{opacity:1,duration:0.45,ease:'none'},15.1);
tl.fromTo('#dg-qm',{opacity:0,scale:0.3,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:0.35,ease:'back.out(1.7)'},17.3);
tl.to('#dg-goal',{opacity:0,duration:0.4,ease:'none'},${TM.a - 0.4});

// ---------------- parameter phases
function card(id,t,col){ ['a','al','d','th','as'].forEach(c=>tl.set('#dg-pc-'+c,{opacity:c===id?1:0},t)); tl.fromTo('#dg-pc-'+id,{x:90},{x:0,duration:0.4,ease:'power4.out'},t); }
function dot(id,t){ tl.set('#dg-dot-'+id,{className:'dot on'},t); }
function val(id,t){ ['a','al','d','th'].forEach(c=>tl.set('#dg-v-'+c,{opacity:c===id?1:0},t)); tl.fromTo('#dg-v-'+id,{y:24},{y:0,duration:0.3,ease:'power4.out'},t); }
tl.fromTo('.dots,.pcwrap',{opacity:0},{opacity:1,duration:0.4,ease:'none'},${TM.a - 0.8});
tl.set('.dot',{className:'dot'},0);

// a
card('a',${TM.a},'${C.blue}'); val('a',${TM.a + 0.4}); dot('a',${TM.a});
tl.fromTo('#dg-z0-l,#dg-z1-l',{strokeWidth:9},{strokeWidth:18,duration:0.3,ease:'power2.out',yoyo:true,repeat:1},${TM.a + 0.5});
tl.fromTo('#dg-m',{opacity:0},{opacity:1,duration:0.3,ease:'none'},${TM.a + 0.9});
tl.fromTo('#dg-ga',{opacity:0},{opacity:1,duration:0.4,ease:'none'},${TM.a + 1.0});
tl.to(st,{a:A,duration:3.0,ease:'power2.inOut'},${TM.a + 1.7});
tl.fromTo('#dg-la',{opacity:0},{opacity:1,duration:0.3,ease:'none'},${TM.a + 4.6});
tl.fromTo('#dg-llink',{opacity:0,y:20},{opacity:1,y:0,duration:0.3,ease:'power4.out',immediateRender:false},${TM.a + 6.6}); tl.to('#dg-llink',{opacity:0,duration:0.3,ease:'none'},${TM.a + 10.9});
tl.fromTo('#dg-la',{scale:1,transformOrigin:'50% 50%'},{scale:1.35,duration:0.3,ease:'power2.out',yoyo:true,repeat:1,immediateRender:false},${TM.a + 8.0}); mas(${TM.a + 8.4},'th');
[${TM.a + 6.9},${TM.a + 8.7}].forEach(t=>tl.fromTo('#dg-linkq',{strokeWidth:40},{strokeWidth:62,duration:0.35,ease:'power2.out',yoyo:true,repeat:1,immediateRender:false},t));
// alpha
tl.to('#dg-ga',{opacity:0.35,duration:0.4,ease:'none'},${TM.al}); tl.to('#dg-la',{opacity:0,duration:0.3,ease:'none'},${TM.al});
card('al',${TM.al},'${C.purple}'); val('al',${TM.al + 0.4}); dot('al',${TM.al});
tl.fromTo('#dg-gal',{opacity:0},{opacity:1,duration:0.5,ease:'none'},${TM.al + 1.0});
tl.to(st,{al:AL,duration:3.0,ease:'power2.inOut'},${TM.al + 1.8});
tl.to(st,{al:0,duration:1.1,ease:'power2.inOut'},${TM.al + 7.4}); tl.to(st,{al:AL,duration:1.1,ease:'power2.inOut'},${TM.al + 9.6});
// d
tl.to('#dg-gal',{opacity:0.3,duration:0.4,ease:'none'},${TM.d}); tl.to('#dg-lal',{opacity:0,duration:0.3,ease:'none'},${TM.d});
card('d',${TM.d},'${C.orange}'); val('d',${TM.d + 0.4}); dot('d',${TM.d});
tl.fromTo('#dg-gd',{opacity:0},{opacity:1,duration:0.5,ease:'none'},${TM.d + 1.0});
tl.to(st,{d:D,duration:2.8,ease:'power2.inOut'},${TM.d + 1.8});
tl.to(st,{d:-0.55,duration:1.2,ease:'power2.inOut'},${TM.d + 7.0}); tl.to(st,{d:D,duration:1.2,ease:'power2.inOut'},${TM.d + 9.0});
// theta
tl.to('#dg-gd',{opacity:0.3,duration:0.4,ease:'none'},${TM.th}); tl.to('#dg-ld',{opacity:0,duration:0.3,ease:'none'},${TM.th});
card('th',${TM.th},'${C.green}'); val('th',${TM.th + 0.4}); dot('th',${TM.th});
tl.fromTo('#dg-gth',{opacity:0},{opacity:1,duration:0.5,ease:'none'},${TM.th + 1.0});
tl.to(st,{th:TH,duration:3.0,ease:'power2.inOut'},${TM.th + 1.8});
tl.to(st,{th:1.48,duration:1.5,ease:'power2.inOut'},${TM.th + 8.0});
tl.to(st,{th:TH,duration:1.4,ease:'power2.inOut'},${TM.th + 9.9});

// assemble: rewind, replay the four moves, land on frame {i}
tl.to('#dg-ga,#dg-gal,#dg-gd,#dg-gth',{opacity:0,duration:0.4,ease:'none'},${TM.as});
card('as',${TM.as},'${C.ink}'); tl.to('#dg-v-th',{opacity:0,duration:0.2,ease:'none'},${TM.as});
tl.to(st,{th:0,d:0,al:0,a:0,duration:0.9,ease:'power2.inOut'},${TM.as + 0.2});
tl.to(st,{a:A,duration:1.1,ease:'power2.inOut'},${TM.as + 1.4}); tl.set('#dg-ch-a',{className:'chip on'},${TM.as + 1.4});
tl.to(st,{al:AL,duration:1.1,ease:'power2.inOut'},${TM.as + 2.7}); tl.set('#dg-ch-al',{className:'chip on'},${TM.as + 2.7});
tl.to(st,{d:D,duration:1.1,ease:'power2.inOut'},${TM.as + 4.0}); tl.set('#dg-ch-d',{className:'chip on'},${TM.as + 4.0});
tl.to(st,{th:TH,duration:1.1,ease:'power2.inOut'},${TM.as + 5.3}); tl.set('#dg-ch-th',{className:'chip on'},${TM.as + 5.3});
tl.set('#dg-ch-a,#dg-ch-al,#dg-ch-d,#dg-ch-th',{className:'chip'},${TM.as + 0.1});
tl.set('#dg-ch-a',{className:'chip on'},${TM.as + 1.4});
tl.to('#dg-lz1',{opacity:0,duration:0.2,ease:'none'},${TM.as + 6.3});
tl.fromTo('#dg-fin',{opacity:0,scale:0.6,transformOrigin:'50% 50%'},{opacity:1,scale:1,duration:0.4,ease:'back.out(1.5)'},${TM.as + 6.5});
R();
window.__timelines['diagram']=tl;
`;

  // ---- sound
  const T = TM;
  sfx("whoosh-short", 0.02, 0.35);
  [0.7, 3.5].forEach((t) => sfx("pop", t, 0.5));
  sfx("click-soft", 2.2, 0.4);
  [1.3, 3.0, 4.1].forEach((t) => sfx("pop", t, 0.35));
  sfx("click-soft", 5.6, 0.4);
  sfx("click-soft", 7.2, 0.4);
  sfx("pop", 10.0, 0.5);
  sfx("click-soft", 10.3, 0.4);
  sfx("pop", 12.2, 0.35);
  sfx("whoosh-short", T.a - 0.05, 0.4);
  sfx("click-soft", T.a + 1.7, 0.4);
  sfx("ping", T.a + 4.65, 0.55);
  sfx("whoosh-short", T.al - 0.05, 0.4);
  sfx("click-soft", T.al + 1.8, 0.4);
  sfx("ping", T.al + 4.85, 0.55);
  sfx("whoosh-short", T.d - 0.05, 0.4);
  sfx("click-soft", T.d + 1.8, 0.4);
  sfx("ping", T.d + 4.65, 0.55);
  sfx("whoosh-short", T.th - 0.05, 0.4);
  sfx("click-soft", T.th + 1.8, 0.4);
  sfx("ping", T.th + 4.85, 0.55);
  sfx("sparkle", T.th + 8.1, 0.45);
  sfx("notification", T.th + 10.9, 0.25);
  sfx("whoosh", T.as + 0.2, 0.45);
  [1.4, 2.7, 4.0, 5.3].forEach((t) => sfx("click-soft", T.as + t, 0.45));
  sfx("riser", T.as + 6.7 - 10.03, 0.3);
  sfx("impact-bass-1", T.as + 6.7, 0.7);
  sfx("sparkle", T.as + 6.75, 0.5);

  const html = `<template>
<style>${css}</style>
<div id="root" data-composition-id="diagram" data-width="1920" data-height="1080">
 <div class="wrap">
  ${svg}
  <div class="pcwrap">${cards}</div>
  <div class="dots">${dots}</div>
  <div class="vals">${vals}</div>
  <div class="mas">${masHtml}</div>
  ${capHtml}
 </div>
</div>
<script>${js}</script>
</template>`;
  return { html, dur: TM.end };
}
