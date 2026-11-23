// Tiny 3D engine for SVG scenes (camera, projection, cylinders, joints, arrows). Runs inside the scene scripts
// (seek-safe: everything is a pure function of the state objects that GSAP tweens).
export const ENGINE = String.raw`
const DEG=Math.PI/180;
const cam={psi:-28,phi:22,sc:150,tx:1.7,ty:0,tz:0.6,sx:700,sy:470};
let cps,sps,cph,sph,OXc,OYc;
function camSet(){const p=cam.psi*DEG,f=cam.phi*DEG;cps=Math.cos(p);sps=Math.sin(p);cph=Math.cos(f);sph=Math.sin(f);
  OXc=cam.sx-cam.sc*(cam.tx*cps-cam.ty*sps);OYc=cam.sy+cam.sc*((cam.tx*sps+cam.ty*cps)*sph+cam.tz*cph);}
const P=v=>{const y1=v[0]*sps+v[1]*cps;return [OXc+cam.sc*(v[0]*cps-v[1]*sps),OYc-cam.sc*(y1*sph+v[2]*cph)];};
const FWD=()=>[sps*cph,cps*cph,-sph];
const dep=v=>(v[0]*sps+v[1]*cps)*cph-v[2]*sph;
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};
const f1=n=>n.toFixed(1);
const Dp=pts=>'M'+pts.map(q=>f1(q[0])+','+f1(q[1])).join('L')+'Z';
const Lp=pts=>'M'+pts.map(q=>f1(q[0])+','+f1(q[1])).join('L');
const sel=s=>document.querySelector(s);
const setD=(id,d)=>{const e=sel(id);if(e)e.setAttribute('d',d);};
function hull(pts){const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[];for(const q of p){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}
  const up=[];for(const q of p.reverse()){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q);}
  return lo.slice(0,-1).concat(up.slice(0,-1));}
const LIGHT=norm([-0.5,-0.45,0.75]);
function cyl(c,X,Y,Z,r,t0,t1,n){n=n||36;const f=FWD(),topVis=dot(Z,f)<0;const R0=[],R1=[],L0=[],L1=[];
  for(let k=0;k<n;k++){const a=k/n*Math.PI*2,nn=add(mul(X,Math.cos(a)),mul(Y,Math.sin(a)));
    const p0=add(add(c,mul(Z,t0)),mul(nn,r)),p1=add(add(c,mul(Z,t1)),mul(nn,r));R0.push(P(p0));R1.push(P(p1));
    if(dot(nn,LIGHT)>0.2&&dot(nn,f)<0.25){L0.push(P(p0));L1.push(P(p1));}}
  const tc=topVis?t1:t0,cap=[];for(let k=0;k<n;k++){const a=k/n*Math.PI*2;cap.push(P(add(add(c,mul(Z,tc)),mul(add(mul(X,Math.cos(a)),mul(Y,Math.sin(a))),r))));}
  return {body:Dp(hull(R0.concat(R1))),lit:L0.length>2?Dp(hull(L0.concat(L1))):'',cap:Dp(cap),topVis,tc};}
// the joint: base disc + steel body + gold rotating head + hub + a notch that shows the joint's own X direction
function drawJoint(p,c,X,Y,Z,s,ls){s=s||1;ls=ls||1;const parts=[['base',0.64*s,-1.15*ls,-1.0*ls],['body',0.5*s,-1.0*ls,0.45*ls],['head',0.44*s,0.45*ls,1.05*ls]];
  for(const [k,r,t0,t1] of parts){const q=cyl(c,X,Y,Z,r,t0,t1);setD('#'+p+'-'+k+'-b',q.body);setD('#'+p+'-'+k+'-l',q.lit);setD('#'+p+'-'+k+'-c',q.cap);}
  const f=FWD(),top=dot(Z,f)<0,ctop=add(c,mul(Z,1.05*ls));
  if(top){const ring=[];for(let k=0;k<20;k++){const a=k/20*Math.PI*2;ring.push(P(add(ctop,mul(add(mul(X,Math.cos(a)),mul(Y,Math.sin(a))),0.15*s))));}
    setD('#'+p+'-hub',Dp(ring));const a=P(ctop),b=P(add(ctop,mul(X,0.42*s)));setD('#'+p+'-notch',Lp([a,b]));
    const d=sel('#'+p+'-dot');if(d){d.setAttribute('cx',f1(b[0]));d.setAttribute('cy',f1(b[1]));}}
  else{setD('#'+p+'-hub','');setD('#'+p+'-notch','');}}
function arrowPaths(o,dir,len,head,len0){const s=P(add(o,mul(dir,len0||0))),e=P(add(o,mul(dir,len)));const dx=e[0]-s[0],dy=e[1]-s[1];const L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L;
  const h=Math.min(head||30,L*0.6),b=[e[0]-ux*h,e[1]-uy*h],nx=-uy,ny=ux;
  return {line:'M'+f1(s[0])+','+f1(s[1])+'L'+f1(b[0])+','+f1(b[1]),head:'M'+f1(e[0])+','+f1(e[1])+'L'+f1(b[0]+nx*h*.46)+','+f1(b[1]+ny*h*.46)+'L'+f1(b[0]-nx*h*.46)+','+f1(b[1]-ny*h*.46)+'Z',tip:e};}
function setAxis(id,o,dir,len,head,len0){const a=arrowPaths(o,dir,len,head,len0);setD('#'+id+'-l',a.line);setD('#'+id+'-h',a.head);return a;}
const seg3=(p,q)=>Lp([P(p),P(q)]);
function place(id,pt,dx,dy){const g=sel('#'+id);if(!g)return;const w=+g.getAttribute('data-w'),h=+g.getAttribute('data-h');const q=P(pt);g.setAttribute('transform','translate('+f1(q[0]+(dx||0)-w/2)+','+f1(q[1]+(dy||0)-h/2)+')');}
function placeXY(id,x,y){const g=sel('#'+id);if(!g)return;const w=+g.getAttribute('data-w'),h=+g.getAttribute('data-h');g.setAttribute('transform','translate('+f1(x-w/2)+','+f1(y-h/2)+')');}
function capsule(id,a,b,w){const A=P(a),B=P(b);const d='M'+f1(A[0])+','+f1(A[1])+'L'+f1(B[0])+','+f1(B[1]);setD('#'+id+'-o',d);setD('#'+id+'-t',d);
  const off=[-7,-8];setD('#'+id+'-s','M'+f1(A[0]+off[0])+','+f1(A[1]+off[1])+'L'+f1(B[0]+off[0])+','+f1(B[1]+off[1]));}
function floor(id,z,x0,x1,y0,y1,step){let d='';for(let x=x0;x<=x1+1e-6;x+=step)d+=seg3([x,y0,z],[x,y1,z]);for(let y=y0;y<=y1+1e-6;y+=step)d+=seg3([x0,y,z],[x1,y,z]);setD('#'+id+'-g',d);
  setD('#'+id+'-p',Dp([P([x0,y0,z]),P([x1,y0,z]),P([x1,y1,z]),P([x0,y1,z])]));}
`;

// DOM for one joint. ghost=true -> transparent copy that travels with a frame
export const jointDom = (p, ghost = false) => `<g id="${p}" class="joint${ghost ? " gh" : ""}">
 <path id="${p}-base-b" class="b j-base-b"/><path id="${p}-base-c" class="c j-base-c"/>
 <path id="${p}-body-b" class="b j-body-b"/><path id="${p}-body-l" class="l j-body-l"/><path id="${p}-body-c" class="c j-body-c"/>
 <path id="${p}-head-b" class="b j-head-b"/><path id="${p}-head-l" class="l j-head-l"/><path id="${p}-head-c" class="c j-head-c"/>
 <path id="${p}-hub" class="j-hub"/><path id="${p}-notch" class="j-notch" fill="none"/><circle id="${p}-dot" class="j-dot" r="9"/>
</g>`;
export const axisDom = (id, col, w = 9) =>
  `<g id="${id}"><path id="${id}-l" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/><path id="${id}-h" fill="${col}" stroke="${col}" stroke-width="2" stroke-linejoin="round"/></g>`;
export const capsuleDom = (id) =>
  `<g id="${id}" fill="none" stroke-linecap="round"><path id="${id}-o" stroke="#0B1F3A" stroke-width="62"/><path id="${id}-t" stroke="#18B5C8" stroke-width="48"/><path id="${id}-s" stroke="#8FE3EE" stroke-width="12" opacity=".75"/></g>`;

export const CSS3D = `
.joint path.b,.joint path.c{stroke:#0B1F3A;stroke-width:5;stroke-linejoin:round}
.joint path.l{stroke:none}
.j-base-b{fill:#16294D}.j-base-c{fill:#223A66}.j-body-b{fill:#2E4D80}.j-body-l{fill:#6E93D8}.j-body-c{fill:#4A6DAA}
.j-head-b{fill:#E8A300}.j-head-l{fill:#FFD54A}.j-head-c{fill:#FFE38A}.j-hub{fill:#0B1F3A;stroke:none}
.j-notch{stroke:#0B1F3A;stroke-width:12;stroke-linecap:round}.j-dot{fill:#E5173F;stroke:#fff;stroke-width:4}
.gh path.b,.gh path.c{fill:#8FB0F5;fill-opacity:.22;stroke:#1565FF;stroke-width:4.5;stroke-dasharray:14 9}
.gh path.l{display:none}.gh .j-hub{fill:#1565FF;fill-opacity:.55;stroke:none}.gh .j-notch{stroke:#1565FF}.gh .j-dot{fill:#1565FF}
.lbl{pointer-events:none}.tx{display:inline-block;direction:ltr;unicode-bidi:isolate}
`;
