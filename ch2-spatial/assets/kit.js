/* eslint-disable no-unused-vars */
/* Scene kit: panels, matrices, captions, cards, checks, counters, seams, sound cues. */
(function (g) {
  const { Stage, mj, mk } = g.HF3D;
  const DATA = g.DATA,
    C = DATA.C;
  g.__cues = g.__cues || {};

  function tex(t, px, color, o = {}) {
    const m = mj(t, px),
      s = document.createElement("span");
    s.className = "mj";
    s.style.cssText = `display:inline-block;color:${color || C.navy};line-height:0;vertical-align:${-m.desc.toFixed(2)}px;`;
    s.appendChild(m.el);
    s.dataset.tex = t;
    s._m = m;
    return s;
  }
  function el(tag, cls, css, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (css) e.style.cssText = css;
    if (parent) parent.appendChild(e);
    return e;
  }

  /* matrix with per-cell elements. rows: [[tex|{t,c}]]; returns {el, cells} */
  function mx(rows, o = {}) {
    const px = o.px || 44,
      cw = o.cw || px * 2.6,
      rh = o.rh || px * 1.5,
      col = o.c || C.navy,
      bw = o.bw || 6;
    const wrap = el("div", "mx", `position:relative;display:inline-block;padding:0 ${px * 0.5}px;`);
    const br = (side) =>
      el(
        "div",
        "br",
        `position:absolute;top:0;bottom:0;${side}:0;width:${px * 0.3}px;border:${bw}px solid ${col};border-${side === "left" ? "right" : "left"}:none;border-radius:2px;`,
        wrap,
      );
    br("left");
    br("right");
    const cols = (o.cws || rows[0].map(() => cw)).map((w) => w + "px").join(" ");
    const grid = el(
      "div",
      "mxg",
      `display:grid;grid-template-columns:${cols};grid-auto-rows:${rh}px;direction:ltr;`,
      wrap,
    );
    const cells = rows.map((r, ri) =>
      r.map((c, cj) => {
        const cc = typeof c === "string" ? { t: c, j: cj } : Object.assign({ j: cj }, c);
        const cell = el(
          "div",
          "cell",
          `display:flex;align-items:center;justify-content:center;border-radius:12px;margin:3px 2px;color:${cc.c || col};`,
          grid,
        );
        cell.appendChild(tex(cc.t, px, cc.c || col));
        cell._base = cc.c || col;
        if (o.vline !== undefined && o.vline === cc.j) cell.style.borderLeft = "4px solid " + col;
        return cell;
      }),
    );
    return { el: wrap, cells, rh, cw, px };
  }
  /* index stack + body, so each index is its own handle: {el, top, bot, body} */
  function tchip(top, bot, body, px, color, ic) {
    const e = el(
      "span",
      "tchip",
      "display:inline-flex;align-items:center;gap:2px;direction:ltr;vertical-align:middle;",
    );
    const st = el(
      "span",
      "",
      "display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;margin-right:2px;",
      e,
    );
    const a = top ? tex(top, px * 0.62, ic || color) : null,
      b = bot ? tex(bot, px * 0.62, ic || color) : null;
    const slotA = el(
      "span",
      "slot",
      `display:inline-block;min-width:${px * 0.45}px;height:${px * 0.6}px;display:flex;align-items:center;justify-content:center;`,
      st,
    );
    const slotB = el(
      "span",
      "slot",
      `min-width:${px * 0.45}px;height:${px * 0.6}px;display:flex;align-items:center;justify-content:center;`,
      st,
    );
    if (a) slotA.appendChild(a);
    if (b) slotB.appendChild(b);
    const t = tex(body, px, color);
    e.appendChild(t);
    return { el: e, top: a, bot: b, body: t, slotA, slotB };
  }
  const row = (items, css) => {
    const r = el(
      "div",
      "eqrow",
      "display:flex;align-items:center;direction:ltr;gap:18px;" + (css || ""),
    );
    items.forEach((i) => r.appendChild(i));
    return r;
  };

  function scene(id, o = {}) {
    const host = document.querySelector('[data-composition-id="' + id + '"]');
    const root = host.querySelector('[data-hf-authored-id="root"]') || host;
    const T = DATA.T[id],
      dur = T.dur,
      off = T.start;
    const sc = el("div", "sc", "", root);
    const cams = o.cam || {};
    const stage = new Stage(sc, { cam: cams });
    const st = stage;
    const layer = el("div", "ui", "position:absolute;inset:0;", sc);
    g.__cues[id] = [];
    const S = { id, root, sc, st, layer, dur, off, drawHooks: [] };
    S.tl = g.gsap.timeline({
      paused: true,
      onUpdate: () => {
        st.draw();
        S.drawHooks.forEach((f) => f());
      },
    });
    const tl = S.tl;
    S.stage2 = (cam) => {
      const s2 = new Stage(sc, { cam });
      sc.insertBefore(s2.svg, layer);
      S.drawHooks.push(() => s2.draw());
      return s2;
    };
    S.rect = (e) => {
      const r = e.getBoundingClientRect(),
        L = layer.getBoundingClientRect(),
        k = L.width / 1920 || 1;
      return { x: (r.left - L.left) / k, y: (r.top - L.top) / k, w: r.width / k, h: r.height / k };
    };
    /* pin an HTML element to a 3D point (billboard): left/top follow the projection every draw */
    S.anchor = (e, pt, dx, dy, stg) => {
      e.style.position = "absolute";
      const f = () => {
        const q = (stg || st).pr(typeof pt === "function" ? pt() : pt);
        e.style.left = q.x + (dx || 0) + "px";
        e.style.top = q.y + (dy || 0) + "px";
      };
      S.drawHooks.push(f);
      f();
    };
    S.sfx = (name, t, vol, d) => {
      g.__cues[id].push([+(off + t).toFixed(3), name, vol || 1, d || 0]);
    };
    S.panel = (x, y, w, h, c, css) =>
      el(
        "div",
        "panel",
        `left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-color:${c || C.blue};${css || ""}`,
        layer,
      );
    S.at = (parent, x, y, css) =>
      el("div", "abs", `position:absolute;left:${x}px;top:${y}px;${css || ""}`, parent || layer);
    /* show element over [t0,t1] (t1 optional): arrival from below, binary start */
    S.pop = (e, t0, t1, o2 = {}) => {
      tl.fromTo(
        e,
        { opacity: 0, y: o2.dy === undefined ? 26 : o2.dy, scale: o2.s0 || 1 },
        { opacity: 1, y: 0, scale: 1, duration: o2.d || 0.28, ease: "power4.out" },
        t0,
      );
      if (t1) tl.to(e, { opacity: 0, duration: 0.2, ease: "none" }, t1 - 0.2);
      if (o2.sfx !== false) S.sfx(o2.sfx || "pop", t0, o2.vol || 0.8);
    };
    S.hide = (e, t, d) => tl.to(e, { opacity: 0, duration: d || 0.25, ease: "power2.in" }, t);
    /* amber glow on a matrix cell */
    S.glow = (cell, t0, t1) => {
      tl.to(
        cell,
        {
          backgroundColor: "rgba(255,194,26,.55)",
          boxShadow: "0 0 0 4px rgba(255,194,26,.9), 0 0 26px 8px rgba(255,194,26,.55)",
          duration: 0.22,
          ease: "power4.out",
        },
        t0,
      );
      if (t1)
        tl.to(
          cell,
          {
            backgroundColor: "rgba(255,194,26,0)",
            boxShadow: "0 0 0 0px rgba(255,194,26,0), 0 0 0 0 rgba(255,194,26,0)",
            duration: 0.3,
            ease: "power2.in",
          },
          t1,
        );
    };
    S.card = (t0, t1, n, text, color) => {
      const d = el("div", "card", `--c:${color || C.blue};left:96px;top:70px;`, layer);
      const nn = el("span", "n", "", d);
      nn.textContent = n;
      if (color === C.gold || color === C.teal) nn.style.color = C.navy;
      el("span", "t", "", d).textContent = text;
      tl.fromTo(
        d,
        { opacity: 0, x: 80 },
        { opacity: 1, x: 0, duration: 0.34, ease: "power4.out" },
        t0,
      );
      tl.to(d, { opacity: 0, x: -60, duration: 0.28, ease: "power4.in" }, t1 - 0.28);
      S.sfx("pop", t0, 0.8);
      return d;
    };
    /* caption: tokens = ["word", {m:"tex"}, ...]; arabic words are split by space */
    S.cap = (t0, t1, tokens, o2 = {}) => {
      const wrap = el("div", "capw", "", layer),
        pill = el("div", "cap", "", wrap);
      const words = [];
      tokens.forEach((tk) => {
        if (typeof tk === "string")
          tk.split(" ")
            .filter(Boolean)
            .forEach((w) => {
              const s = el("span", "w", "", pill);
              s.textContent = w;
              words.push(s);
            });
        else {
          const s = el("span", "w m", `color:${tk.c || C.navy}`, pill);
          s.appendChild(tex(tk.m, 50, tk.c || C.navy));
          words.push(s);
        }
      });
      tl.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.01 }, t0);
      tl.fromTo(
        words,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.2, ease: "power4.out", stagger: 0.075 },
        t0,
      );
      tl.to(wrap, { opacity: 0, x: -50, duration: 0.24, ease: "power4.in" }, t1 - 0.24);
      return wrap;
    };
    S.check = (x, y, t, o2 = {}) => {
      const c = el("div", "chk", `left:${x}px;top:${y}px;`, layer);
      c.innerHTML =
        '<svg viewBox="0 0 64 64" width="64" height="64"><circle cx="32" cy="32" r="30" fill="#00945E"/><path d="M17 33 L28 44 L47 21" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      tl.fromTo(
        c,
        { opacity: 0, scale: 0.55 },
        { opacity: 1, scale: 1, duration: 0.24, ease: "power4.out" },
        t,
      );
      if (o2.out) tl.to(c, { opacity: 0, duration: 0.2, ease: "none" }, o2.out);
      S.sfx("click", t, 0.9);
      return c;
    };
    /* counter: tweens obj.v from a to b and writes fmt(v) into node */
    S.counter = (node, a, b, t0, t1, fmt, ease) => {
      const o3 = { v: a };
      node.textContent = fmt(a);
      tl.to(
        o3,
        {
          v: b,
          duration: t1 - t0,
          ease: ease || "power2.inOut",
          onUpdate: () => {
            node.textContent = fmt(o3.v);
          },
        },
        t0,
      );
      return o3;
    };
    S.cam = (to, t0, d, ease) => {
      tl.to(st.cam, Object.assign({ duration: d, ease: ease || "power3.inOut" }, to), t0);
      S.sfx("whoosh", t0, 0.5);
    };
    S.seam = (opt = {}) => {
      if (!opt.noIn) {
        tl.fromTo(
          sc,
          { x: 230, opacity: 0.35 },
          { x: 0, opacity: 1, duration: 0.34, ease: "power4.out" },
          0,
        );
        S.sfx("whoosh", 0, 0.7);
      }
      if (!opt.noOut) {
        tl.to(sc, { x: -230, duration: 0.32, ease: "power4.in" }, dur - 0.32);
        tl.to(sc, { opacity: 0, duration: 0.3, ease: "none" }, dur - 0.32);
      }
    };
    S.finish = () => {
      // hold the timeline to the exact scene length
      tl.to({}, { duration: 0.001 }, dur - 0.001);
      g.__timelines = g.__timelines || {};
      g.__timelines[id] = tl;
      st.draw();
      S.drawHooks.forEach((f) => f());
    };
    return S;
  }
  g.K = { tex, el, mx, row, tchip, scene };
})(window);
