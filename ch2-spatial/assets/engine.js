/* eslint-disable no-unused-vars */
/* Small SVG 3D engine. Z is up. Pure function of state: Stage.draw() reads live objects
   that GSAP tweens, so every frame is deterministic and seekable. */
(function (g) {
  const NS = "http://www.w3.org/2000/svg",
    D2R = Math.PI / 180;
  const mk = (n, a, p) => {
    const e = document.createElementNS(NS, n);
    if (a) for (const k in a) e.setAttribute(k, a[k]);
    if (p) p.appendChild(e);
    return e;
  };
  const ev = (x) => (typeof x === "function" ? x() : x);
  const V = (x, y, z) => ({ x, y, z });
  const add = (a, b) => V(a.x + b.x, a.y + b.y, a.z + b.z);
  const sub = (a, b) => V(a.x - b.x, a.y - b.y, a.z - b.z);
  const mul = (a, k) => V(a.x * k, a.y * k, a.z * k);
  const lerp = (a, b, t) => add(a, mul(sub(b, a), t));
  const len = (a) => Math.hypot(a.x, a.y, a.z);
  const M = {
    I: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
    x(t) {
      const c = Math.cos(t),
        s = Math.sin(t);
      return [1, 0, 0, 0, c, -s, 0, s, c];
    },
    y(t) {
      const c = Math.cos(t),
        s = Math.sin(t);
      return [c, 0, s, 0, 1, 0, -s, 0, c];
    },
    z(t) {
      const c = Math.cos(t),
        s = Math.sin(t);
      return [c, -s, 0, s, c, 0, 0, 0, 1];
    },
    mul(a, b) {
      const r = [];
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
          r.push(a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j]);
      return r;
    },
    T: (a) => [a[0], a[3], a[6], a[1], a[4], a[7], a[2], a[5], a[8]],
    mv: (a, p) =>
      V(
        a[0] * p.x + a[1] * p.y + a[2] * p.z,
        a[3] * p.x + a[4] * p.y + a[5] * p.z,
        a[6] * p.x + a[7] * p.y + a[8] * p.z,
      ),
    col: (a, j) => V(a[j], a[3 + j], a[6 + j]),
  };

  // ---------- MathJax -> SVG (local file, synchronous) ----------
  const mjCache = {};
  function mjSvg(tex) {
    if (mjCache[tex]) return mjCache[tex];
    const node = g.MathJax.tex2svg(tex, { display: false });
    const svg = node.querySelector("svg");
    const vb = svg.getAttribute("viewBox").split(/\s+/).map(Number);
    svg.removeAttribute("style");
    svg.removeAttribute("focusable");
    svg.removeAttribute("role");
    svg.removeAttribute("aria-hidden");
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    return (mjCache[tex] = { svg, vb });
  }
  /* returns {el, w, h, desc}: a sized <svg> for the TeX at font-size px, colour via CSS `color` */
  function mj(tex, px) {
    const { svg, vb } = mjSvg(tex);
    const el = svg.cloneNode(true);
    const w = (vb[2] / 1000) * px,
      h = (vb[3] / 1000) * px;
    el.setAttribute("width", w.toFixed(2));
    el.setAttribute("height", h.toFixed(2));
    el.setAttribute("fill", "currentColor");
    return { el, w, h, desc: ((vb[1] + vb[3]) / 1000) * px, asc: (-vb[1] / 1000) * px };
  }

  // ---------- colour helper ----------
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16,
      gg = (n >> 8) & 255,
      b = n & 255;
    const f = (c) =>
      Math.max(0, Math.min(255, Math.round(k >= 0 ? c + (255 - c) * k : c * (1 + k))));
    return "#" + [f(r), f(gg), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("");
  }

  class Stage {
    constructor(host, o = {}) {
      this.cam = Object.assign(
        { a: 30, e: 25, d: 9, tx: 0, ty: 0, tz: 0.6, f: 1750, cx: 560, cy: 520 },
        o.cam || {},
      );
      this.svg = mk(
        "svg",
        { class: "stage", viewBox: "0 0 1920 1080", width: 1920, height: 1080 },
        host,
      );
      this.gFloor = mk("g", null, this.svg);
      this.gLines = mk("g", null, this.svg);
      this.gSolid = mk("g", null, this.svg);
      this.gTop = mk("g", null, this.svg);
      this.gLab = mk("g", null, this.svg);
      this.items = [];
      this.faces = [];
      this.pool = [];
    }
    pr(p) {
      const c = this.cam,
        a = c.a * D2R,
        e = c.e * D2R;
      const qx = p.x - c.tx,
        qy = p.y - c.ty,
        qz = p.z - c.tz;
      const xr = qx * Math.cos(a) + qy * Math.sin(a),
        yr = -qx * Math.sin(a) + qy * Math.cos(a);
      const up = qz * Math.cos(e) + yr * Math.sin(e),
        fw = yr * Math.cos(e) - qz * Math.sin(e);
      const d = Math.max(0.4, c.d + fw),
        s = c.f / d;
      return { x: c.cx + xr * s, y: c.cy - up * s, d, s };
    }
    draw() {
      this.faces.length = 0;
      for (const it of this.items) it.draw(this);
      if (this.faces.length) this.drawFaces();
    }
    drawFaces() {
      const F = this.faces.sort((p, q) => q.d - p.d);
      while (this.pool.length < F.length)
        this.pool.push(mk("polygon", { "stroke-linejoin": "round" }, this.gSolid));
      this.pool.forEach((pg, i) => {
        const f = F[i];
        if (!f) {
          pg.setAttribute("display", "none");
          return;
        }
        pg.setAttribute("display", "inline");
        pg.setAttribute("points", f.pts);
        pg.setAttribute("fill", f.fill);
        pg.setAttribute("stroke", f.stroke);
        pg.setAttribute("stroke-width", 2);
        pg.setAttribute("opacity", f.op);
      });
    }
    _add(it, layer) {
      it.op = it.op === undefined ? 1 : it.op;
      this.items.push(it);
      (layer || this.gLines).appendChild(it.el);
      return it;
    }

    /* ---- primitives ---- */
    seg(a, b, o = {}) {
      const it = { op: o.op, prog: o.prog === undefined ? 1 : o.prog, o };
      it.el = mk("g");
      const ln = mk("line", { "stroke-linecap": "round" }, it.el),
        hd = mk("polygon", null, it.el);
      it.draw = (st) => {
        const op = it.op * (o.k ? ev(o.k) : 1);
        if (op < 0.01 || it.prog <= 0) {
          it.el.setAttribute("display", "none");
          return;
        }
        it.el.removeAttribute("display");
        const A3 = ev(a),
          B3 = ev(b),
          E3 = lerp(A3, B3, it.prog),
          A = st.pr(A3),
          B = st.pr(E3);
        const w = ev(o.w || 6),
          col = ev(o.c || "#0B1F3A");
        let ex = B.x,
          ey = B.y;
        const dx = B.x - A.x,
          dy = B.y - A.y,
          L = Math.hypot(dx, dy) || 1;
        if (o.head) {
          const hs = ev(o.hs) || Math.max(24, w * 3.6),
            ux = dx / L,
            uy = dy / L;
          ex = B.x - ux * hs * 0.7;
          ey = B.y - uy * hs * 0.7;
          hd.setAttribute(
            "points",
            `${B.x},${B.y} ${B.x - ux * hs + -uy * hs * 0.45},${B.y - uy * hs + ux * hs * 0.45} ${B.x - ux * hs - -uy * hs * 0.45},${B.y - uy * hs - ux * hs * 0.45}`,
          );
          hd.setAttribute("fill", col);
          hd.setAttribute("display", "inline");
        } else hd.setAttribute("display", "none");
        ln.setAttribute("x1", A.x);
        ln.setAttribute("y1", A.y);
        ln.setAttribute("x2", ex);
        ln.setAttribute("y2", ey);
        ln.setAttribute("stroke", col);
        ln.setAttribute("stroke-width", w);
        ln.setAttribute("stroke-dasharray", o.dash ? `${w * 1.6} ${w * 1.9}` : "none");
        it.el.setAttribute("opacity", op);
      };
      return this._add(it);
    }
    /* polyline in 3D: pts() -> array of vecs; prog trims from the start; optional arrow head at the end */
    path(pts, o = {}) {
      const it = { op: o.op, prog: o.prog === undefined ? 1 : o.prog, o };
      it.el = mk("g");
      const fill = o.fill ? mk("polygon", null, it.el) : null;
      const pl = mk(
          "polyline",
          { fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" },
          it.el,
        ),
        hd = mk("polygon", null, it.el);
      it.draw = (st) => {
        const op = it.op * (o.k ? ev(o.k) : 1);
        if (op < 0.01 || it.prog <= 0) {
          it.el.setAttribute("display", "none");
          return;
        }
        it.el.removeAttribute("display");
        const P = ev(pts),
          n = P.length - 1,
          f = Math.min(1, it.prog) * n,
          i = Math.floor(f),
          t = f - i;
        const use = P.slice(0, i + 1);
        if (i < n) use.push(lerp(P[i], P[i + 1], t));
        const S = use.map((p) => st.pr(p)),
          w = ev(o.w || 6),
          col = ev(o.c || "#0B1F3A");
        let end = S.length - 1,
          trim = 0;
        if (o.head && S.length > 1) {
          const hs = ev(o.hs) || Math.max(26, w * 3.8),
            B = S[end];
          let k = end - 1;
          while (k > 0 && Math.hypot(S[k].x - B.x, S[k].y - B.y) < 2) k--;
          const dx = B.x - S[k].x,
            dy = B.y - S[k].y,
            L = Math.hypot(dx, dy) || 1,
            ux = dx / L,
            uy = dy / L;
          hd.setAttribute(
            "points",
            `${B.x},${B.y} ${B.x - ux * hs - uy * hs * 0.45},${B.y - uy * hs + ux * hs * 0.45} ${B.x - ux * hs + uy * hs * 0.45},${B.y - uy * hs - ux * hs * 0.45}`,
          );
          hd.setAttribute("fill", col);
          hd.setAttribute("display", "inline");
          S[end] = { x: B.x - ux * hs * 0.6, y: B.y - uy * hs * 0.6 };
        } else hd.setAttribute("display", "none");
        pl.setAttribute("points", S.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "));
        pl.setAttribute("stroke", col);
        pl.setAttribute("stroke-width", w);
        pl.setAttribute("stroke-dasharray", o.dash ? `${w * 1.6} ${w * 1.9}` : "none");
        if (fill) {
          fill.setAttribute(
            "points",
            S.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "),
          );
          fill.setAttribute("fill", o.fill);
          fill.setAttribute("opacity", o.fillOp || 0.18);
        }
        it.el.setAttribute("opacity", op);
      };
      return this._add(it);
    }
    dot(p, o = {}) {
      const it = { op: o.op, o };
      it.el = mk("g");
      const ring = mk("circle", { fill: "#fff" }, it.el),
        c = mk("circle", null, it.el);
      it.draw = (st) => {
        const op = it.op * (o.k ? ev(o.k) : 1);
        if (op < 0.01) {
          it.el.setAttribute("display", "none");
          return;
        }
        it.el.removeAttribute("display");
        const q = st.pr(ev(p)),
          r = ev(o.r || 15);
        ring.setAttribute("cx", q.x);
        ring.setAttribute("cy", q.y);
        ring.setAttribute("r", r + 5);
        c.setAttribute("cx", q.x);
        c.setAttribute("cy", q.y);
        c.setAttribute("r", r);
        c.setAttribute("fill", ev(o.c || "#F26B00"));
        it.el.setAttribute("opacity", op);
      };
      return this._add(it, this.gTop);
    }
    /* label anchored at a 3D point; TeX (math). o.dx/o.dy screen offsets, o.px size, o.c colour */
    label(p, tex, o = {}) {
      const it = { op: o.op, o };
      it.el = mk("g", { style: "color:" + (o.c || "#0B1F3A") });
      const px = o.px || 40,
        m = mj(tex, px);
      const pad = o.bg ? 10 : 0;
      const bg = o.bg
        ? mk("rect", { rx: 12, fill: o.bg, stroke: o.bd || "none", "stroke-width": 3 }, it.el)
        : null;
      const holder = mk("g", null, it.el);
      holder.appendChild(m.el);
      if (bg) {
        bg.setAttribute("width", m.w + pad * 2);
        bg.setAttribute("height", m.h + pad * 2);
      }
      it.draw = (st) => {
        const op = it.op * (o.k ? ev(o.k) : 1);
        if (op < 0.01) {
          it.el.setAttribute("display", "none");
          return;
        }
        it.el.removeAttribute("display");
        const q = st.pr(ev(p)),
          x = q.x + (ev(o.dx) || 0) - m.w / 2 - pad,
          y = q.y + (ev(o.dy) || 0) - m.h / 2 - pad;
        if (bg) {
          bg.setAttribute("x", x);
          bg.setAttribute("y", y);
        }
        holder.setAttribute("transform", `translate(${x + pad},${y + pad})`);
        it.el.setAttribute("opacity", op);
      };
      return this._add(it, this.gLab);
    }
    floor(o = {}) {
      const n = o.n || 5,
        step = o.step || 1,
        it = { op: o.op === undefined ? 1 : o.op };
      it.el = mk("path", {
        fill: "none",
        stroke: "#1565FF",
        "stroke-width": 2,
        "stroke-opacity": 0.16,
      });
      it.draw = (st) => {
        let d = "";
        for (let i = -n; i <= n; i++) {
          const a = st.pr(V(i * step, -n * step, 0)),
            b = st.pr(V(i * step, n * step, 0));
          const c = st.pr(V(-n * step, i * step, 0)),
            e = st.pr(V(n * step, i * step, 0));
          d += `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}M${c.x.toFixed(1)} ${c.y.toFixed(1)}L${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
        }
        it.el.setAttribute("d", d);
        it.el.setAttribute("opacity", it.op);
      };
      this.items.push(it);
      this.gFloor.appendChild(it.el);
      return it;
    }
    /* flat-shaded box: c centre (fn), R rotation (fn), s size [sx,sy,sz] */
    box(c, R, s, color, o = {}) {
      const it = { op: o.op === undefined ? 1 : o.op, el: mk("g") };
      this.gSolid.appendChild(it.el);
      const sg = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1],
      ];
      const fc = [
        [0, 1, 2, 3, [0, 0, -1]],
        [4, 5, 6, 7, [0, 0, 1]],
        [0, 1, 5, 4, [0, -1, 0]],
        [2, 3, 7, 6, [0, 1, 0]],
        [1, 2, 6, 5, [1, 0, 0]],
        [0, 3, 7, 4, [-1, 0, 0]],
      ];
      const light = V(0.35, -0.5, 0.8);
      it.draw = (st) => {
        if (it.op < 0.01) return;
        const Rm = ev(R) || M.I(),
          C = ev(c),
          S = ev(s);
        const W = sg.map((q) =>
          add(C, M.mv(Rm, V((q[0] * S[0]) / 2, (q[1] * S[1]) / 2, (q[2] * S[2]) / 2))),
        );
        const P = W.map((q) => st.pr(q));
        for (const f of fc) {
          const q = f.slice(0, 4).map((i) => P[i]);
          const area =
            (q[1].x - q[0].x) * (q[2].y - q[0].y) - (q[1].y - q[0].y) * (q[2].x - q[0].x);
          const nw = M.mv(Rm, V(...f[4]));
          // outward faces: screen winding test against the face normal via centre dot
          const cen = V(
            (W[f[0]].x + W[f[2]].x) / 2,
            (W[f[0]].y + W[f[2]].y) / 2,
            (W[f[0]].z + W[f[2]].z) / 2,
          );
          const ca = st.cam,
            a = ca.a * D2R,
            e = ca.e * D2R;
          const viewDir = V(Math.sin(a) * Math.cos(e) * 1, -Math.cos(a) * Math.cos(e), Math.sin(e)); // camera position direction from target
          const toCam = V(
            ca.tx + viewDir.x * ca.d * 1 - cen.x,
            ca.ty + viewDir.y * ca.d * 1 - cen.y,
            ca.tz + viewDir.z * ca.d - cen.z,
          );
          if (nw.x * toCam.x + nw.y * toCam.y + nw.z * toCam.z <= 0) continue;
          const lum = Math.max(-1, Math.min(1, nw.x * light.x + nw.y * light.y + nw.z * light.z));
          st.faces.push({
            d: q.reduce((s2, p) => s2 + p.d, 0) / 4,
            pts: q.map((p) => p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" "),
            fill: shade(color, lum * 0.28 - 0.05),
            stroke: shade(color, -0.45),
            op: it.op,
          });
        }
      };
      this.items.push(it);
      return it;
    }
    /* a coordinate frame: o origin (fn/vec), R rotation (fn/array); names like ["X_A","Y_A","Z_A"] */
    frame(o) {
      const L = o.len || 1.6,
        w = o.w || 7,
        F = { op: o.op === undefined ? 1 : o.op, parts: [] };
      const cols = o.cols || [o.c, o.c, "#E5173F"];
      const org = () => ev(o.o) || V(0, 0, 0),
        Rm = () => ev(o.R) || M.I();
      const tip = (j) => () => add(org(), mul(M.col(Rm(), j), L));
      for (let j = 0; j < 3; j++) {
        const s = this.seg(org, tip(j), {
          c: cols[j],
          w,
          head: true,
          k: () => F.op * (F.k ? ev(F.k) : 1),
        });
        s.prog = 1;
        F.parts.push(s);
        if (o.names && o.names[j]) {
          const lb = this.label(() => add(org(), mul(M.col(Rm(), j), L * 1.0)), o.names[j], {
            c: cols[j],
            px: o.px || 42,
            dx: o.dx ? o.dx[j] : 0,
            dy: o.dy ? o.dy[j] : -34,
            k: () => F.op * (F.k ? ev(F.k) : 1),
          });
          F.parts.push(lb);
        }
      }
      F.axes = F.parts.filter((p, i) => !p.el.querySelector || true);
      F.setOp = (v) => {
        F.op = v;
      };
      F.tip = tip;
      F.org = org;
      F.R = Rm;
      return F;
    }
    ring(c, u, v, r, a0, a1, n = 48) {
      return () => {
        const C = ev(c),
          R = ev(r),
          A0 = ev(a0),
          A1 = ev(a1),
          out = [];
        for (let i = 0; i <= n; i++) {
          const t = (A0 + (A1 - A0) * (i / n)) * D2R;
          out.push(add(C, add(mul(u, R * Math.cos(t)), mul(v, R * Math.sin(t)))));
        }
        return out;
      };
    }
  }
  g.HF3D = { Stage, V, M, add, sub, mul, lerp, len, mj, shade, mk, ev, D2R };
})(window);
