const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
function capCascade(tl, scene) {
  document.querySelectorAll('[id^="cap-' + scene + '-"]').forEach((el) => {
    const t0 = parseFloat(el.dataset.start),
      dur = parseFloat(el.dataset.duration);
    const ws = el.querySelectorAll(".w");
    ws.forEach((w, i) =>
      tl.fromTo(
        w,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.16, ease: "power3.out" },
        t0 + 0.04 + i * 0.085,
      ),
    );
    tl.fromTo(
      el.querySelector(".cap-in"),
      { opacity: 1 },
      { opacity: 0, duration: 0.14, ease: "power2.in", immediateRender: false },
      t0 + dur - 0.14,
    );
  });
}
// cut-the-curve LEFT: exit x 0 -> -230 (power4.in 0.34s, fade done by 0.2s), entry +230 -> 0 (power4.out, 0.42s, ignites at .35)
function seamIn(tl, st) {
  tl.fromTo(
    st,
    { x: 230, opacity: 0.35 },
    { x: 0, opacity: 1, duration: 0.42, ease: "power4.out" },
    0,
  );
}
function seamOut(tl, dur, st) {
  tl.fromTo(
    st,
    { x: 0 },
    { x: -230, duration: 0.34, ease: "power4.in", immediateRender: false },
    dur - 0.34,
  );
  tl.fromTo(
    st,
    { opacity: 1 },
    { opacity: 0, duration: 0.2, ease: "none", immediateRender: false },
    dur - 0.34,
  );
}
// word-by-word entry (waterfall entry, binary opacity) for title blocks
function wordsIn(tl, sel, t0, gap = 0.09) {
  document
    .querySelectorAll(sel + " .tw")
    .forEach((w, i) =>
      tl.fromTo(
        w,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power4.out" },
        t0 + i * gap,
      ),
    );
}
// fade-and-rise for a block inside a clip
function popIn(tl, sel, t0, dur = 0.38, from = { x: 230, opacity: 0 }) {
  tl.fromTo(sel, from, { x: 0, y: 0, opacity: 1, duration: dur, ease: "power4.out" }, t0);
}
function slideOut(tl, sel, t0, dur = 0.34) {
  tl.fromTo(
    sel,
    { x: 0, opacity: 1 },
    { x: -230, opacity: 0, duration: dur, ease: "power4.in", immediateRender: false },
    t0,
  );
}

// faint perspective floor grid for the 2D scenes (static)
function drawFloor(svg) {
  let s = "";
  const vx = 960,
    hz = 360;
  for (let i = 0; i <= 14; i++) {
    const y = hz + (1080 - hz) * Math.pow(i / 14, 1.8);
    s += `<line x1="0" y1="${y.toFixed(1)}" x2="1920" y2="${y.toFixed(1)}" stroke="#1565FF" stroke-opacity=".11" stroke-width="2"/>`;
  }
  for (let j = -14; j <= 14; j++) {
    const xb = 960 + j * 230;
    s += `<line x1="${vx}" y1="${hz}" x2="${xb}" y2="1080" stroke="#1565FF" stroke-opacity=".11" stroke-width="2"/>`;
  }
  svg.innerHTML = s;
}
