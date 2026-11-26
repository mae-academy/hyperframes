/* eslint-disable no-unused-vars */
const D = DATA,
  C = D.C;
const S = K.scene("table", {});
const tl = S.tl;
S.seam();
S.card(0.2, 7.9, "11", "جدول الملخص", C.navy);
const rows = [
  ["2.1", "دوران نقطة", "{}^{A}P_2=R_u(\\theta)\\,{}^{A}P_1", C.purple],
  ["2.2", "دوران فريمين", "{}^{A}_{B}R^{-1}={}^{A}_{B}R^{T}", C.blue],
  ["2.3", "ثابت = أويلر", "R_z(\\alpha)\\,R_y(\\beta)\\,R_x(\\gamma)", C.purple],
  ["2.4", "تغيير الفريم: دوران", "{}^{A}P={}^{A}_{B}R\\,{}^{B}P", C.purple],
  ["2.5", "إزاحة نقطة", "{}^{A}P_2={}^{A}P_1+{}^{A}Q", C.green],
  ["2.6", "تغيير الفريم: إزاحة", "{}^{A}P={}^{B}P+{}^{A}P_{BORG}", C.green],
  ["2.7–2.8", "دوران + إزاحة", "{}^{A}P={}^{A}_{B}T\\,{}^{B}P", C.gold],
  ["2.9", "ضرب وعكس", "{}^{A}_{C}T={}^{A}_{B}T\\,{}^{B}_{C}T", C.navy],
];
const x0 = 150,
  w = 1620,
  top = 182,
  rh = 85;
rows.forEach(([sec, name, tex, c], i) => {
  const d = K.el(
    "div",
    "",
    `position:absolute;left:${x0}px;top:${top + i * rh}px;width:${w}px;height:${rh - 10}px;background:#fff;border:5px solid ${c};border-radius:20px;display:flex;align-items:center;direction:rtl;padding:0 24px;gap:28px;box-shadow:0 8px 24px rgba(11,31,58,.10);`,
    S.layer,
  );
  const chip = K.el(
    "div",
    "",
    `min-width:130px;text-align:center;font:800 36px Inter;color:#fff;background:${c};border-radius:12px;padding:2px 10px;direction:ltr;${c === C.gold ? "color:#0B1F3A;" : ""}`,
    d,
  );
  chip.textContent = sec;
  const n = K.el("div", "", "font-size:40px;font-weight:700;flex:1;", d);
  n.textContent = name;
  const f = K.el("div", "", "direction:ltr;width:760px;text-align:left;", d);
  f.appendChild(K.tex(tex, 40, C.navy));
  const t = 0.6 + i * 0.7;
  tl.fromTo(d, { opacity: 0, x: 120 }, { opacity: 1, x: 0, duration: 0.34, ease: "power4.out" }, t);
  S.sfx("pop", t, 0.6);
  S.sfx("click", t + 0.3, 0.5);
});
S.cap(0.5, 7.7, ["كل", "حالة", "بمعادلتها", "— من", "الكتاب"]);
S.finish();
