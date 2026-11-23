"""Build the traced MAE rig from the 4 reference poses.
 outputs (all in the reference pixel space 2473x3024 so every part overlays exactly):
   rig/head/{white,hair,ink,glasses}.svg   rig/poses/body-<pose>.svg  rig/poses/overlay-think.svg
   rig/parts/{brows,eyes,mouths}/<pose>-*.svg      rig/rig.json      rig/assembled/<pose>.svg"""
import sys, json, os, numpy as np, cv2
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from segment import load, segment
from split import split, dil, HAND2, disc, R
from vec import mask_to_path
import glasses as gl
from ringfit import samples, fit, closed_path, radius, CX as RCX, CY as RCY

FILL = {"rim": "#271a17", "white": "#ffffff", "hair": "#271a17", "red": "#c82138", "mouth": "#51413e", "tongue": "#d48881", "ink": "#030401"}
POSES = {"wave": ("ref1_wave", None), "think": ("ref2_think", HAND2), "wink_point": ("ref3_wink_point", None), "talk_point": ("ref4_talk_point", None)}
W, H = 2473, 3024
INK_DIL = 0     # traced ink is drawn at the reference weight (a 2px dilation made lines ~2px heavier)
os.makedirs("rig/head", exist_ok=True)
for d in ("poses", "parts/brows", "parts/eyes", "parts/mouths", "assembled"): os.makedirs(f"rig/{d}", exist_ok=True)

def er(m, k):
    return cv2.erode(m.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))).astype(bool)

def layer(mask, key, dilate=0, sigma=3.0):
    if not mask.any(): return None
    d = mask_to_path(mask, sigma=sigma, dilate=dilate)
    return {"id": key, "fill": FILL[key], "d": d} if d else None

def bbox(mask, pad=12):
    ys, xs = np.where(mask)
    return [int(xs.min()) - pad, int(ys.min()) - pad, int(xs.max() - xs.min()) + 2 * pad, int(ys.max() - ys.min()) + 2 * pad]

def path_tag(l):
    if l.get("stroke"):
        return f'<path fill="none" stroke="{l["stroke"]}" stroke-width="{l["width"]}" stroke-linecap="round" stroke-linejoin="round" d="{l["d"]}"/>'
    return f'<path fill="{l["fill"]}" fill-rule="evenodd" d="{l["d"]}"/>'

def svg(layers, vb=(0, 0, W, H)):
    body = "".join(path_tag(l) for l in layers if l)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]} {vb[1]} {vb[2]} {vb[3]}">{body}</svg>'

def write(path, layers, vb=(0, 0, W, H)):
    open(f"rig/{path}", "w").write(svg(layers, vb))

# ---- pass 1: smooth closed head outline (Fourier fit of the traced ring) from the first pose
_seg1 = segment(load("reference/ref1_wave_1.png")); _s1 = split(_seg1)
_yy, _xx = np.mgrid[:_seg1["ink"].shape[0], :_seg1["ink"].shape[1]]
_pts = samples(_seg1["ink"], _s1["hair_d"], (_xx > 690) & (_xx < 1990) & (_yy > 985) & (_yy < 1300))
COEF, RING_SD, RING_N = fit(_pts)
def head_disc(shape):      # inside the OUTER edge of the head outline: everything beyond it (shirt collar, arm lines) belongs to the body
    yy, xx = np.mgrid[:shape[0], :shape[1]]
    return np.hypot(xx - RCX, yy - RCY) < radius(COEF, np.arctan2(yy - RCY, xx - RCX).ravel()).reshape(shape) + 9
def keep_big(m, area):
    n, cc, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    out = np.zeros_like(m)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] >= area: out |= cc == i
    return out

rig = {"size": [W, H], "head_circle": [1312, 1136, 600], "poses": {}, "head": {}}
for pose, (ref, hand) in POSES.items():
    seg = segment(load(f"reference/{ref}_1.png"))
    seg["sil"] = er(seg["sil"], 3)
    s = split(seg, hand, head_disc(seg["ink"].shape))
    P = s["parts"]
    face_ink = np.zeros_like(seg["ink"])
    for grp in P.values():
        for c in grp: face_ink |= c["mask"]
    # ---------- body (everything outside the head complex)
    yy, xx = np.mgrid[:seg['ink'].shape[0], :seg['ink'].shape[1]]
    neck = (yy > 1685) & (abs(xx - 1312) < 330) & ((xx - 1312) ** 2 + (yy - 1136) ** 2 > 550 ** 2)   # shirt collar strokes touching the chin
    out = ~s["headReg"]
    body = [layer(seg["sil"] & out, "white"), layer(seg["red"] & out, "red", 5), layer(keep_big(seg["hair_raw"] & dil(seg["red"], 16) & ~s["hair_h"] & out, 4000), "rim", 6), layer(seg["ink"] & out, "ink", INK_DIL, 3.5)]
    rgb_ = load(f"reference/{ref}_1.png")
    def med(mask, k=4):           # median colour of the eroded class (colours differ slightly between the 4 references)
        m = er(mask, k)
        return "#%02x%02x%02x" % tuple(np.median(rgb_[m], axis=0).astype(int)) if m.sum() > 50 else None
    col = {"red": med(seg["red"], 6), "rim": med(seg["hair_raw"] & dil(seg["red"], 16), 2), "mouth": med(seg["mouth"]), "tongue": med(seg["tongue"])}
    for l in body:
        if l and l["id"] in ("red", "rim") and col[l["id"]]: l["fill"] = col[l["id"]]
    write(f"poses/body-{pose}.svg", body)
    rig["poses"][pose] = {"body": [l for l in body if l]}
    # ---------- glove overlay
    if s["overlay"].any():
        ov = s["poly"] & seg["sil"]
        ovl = [layer(ov, "white"), layer(seg["ink"] & s["overlay"], "ink", INK_DIL, 3.5)]
        write(f"poses/overlay-{pose}.svg", ovl); rig["poses"][pose]["overlay"] = [l for l in ovl if l]
    # ---------- face parts (pose-specific)
    ovm = ~s["overlay"]
    def part(masks, name, kind):
        fm = {k: v & ovm for k, v in masks.items()}
        allm = np.zeros_like(seg["ink"])
        for v in fm.values(): allm |= v
        if not allm.any(): return
        ls = [layer(fm.get(k), k, 4 if k != "ink" else INK_DIL, 3.0 if k != "ink" else 3.5) for k in ("mouth", "tongue", "ink") if k in fm]
        for l in ls:
            if l and l["id"] in ("mouth", "tongue") and col[l["id"]]: l["fill"] = col[l["id"]]
        vb = bbox(allm, 16)
        write(f"parts/{kind}/{pose}-{name}.svg", ls, vb)
        rig["poses"][pose].setdefault(kind, {})[name] = {"layers": [l for l in ls if l], "viewBox": vb}
    brows = sorted(P["brow"], key=lambda c: c["c"][0])
    for c, side in zip(brows, ("L", "R")): part({"ink": c["mask"]}, f"brow{side}", "brows")
    eyes = sorted(P["eye"], key=lambda c: c["c"][0])
    for c, side in zip(eyes, ("L", "R")): part({"ink": c["mask"]}, f"eye{side}", "eyes")
    mink = np.zeros_like(seg["ink"])
    for c in P["mouth"]: mink |= c["mask"]
    mreg = dil(mink, 30)
    part({"ink": mink, "mouth": seg["mouth"] & mreg & s["D"], "tongue": seg["tongue"] & mreg & s["D"]}, "mouth", "mouths")
    # ---------- head from the first pose (shared by all poses; heads match within 3px)
    if pose == "wave":
        glasses_ink = np.zeros_like(seg["ink"])
        for c in P["glasses"]: glasses_ink |= c["mask"]
        band = (xx > 700) & (xx < 1990) & (yy > 985) & (yy < 1300)
        glasses_ink |= seg["ink"] & band & ~s["D"] & ~s["hair_d"]          # original (irregular) glasses incl. temple stubs: dropped, redrawn below
        # --- closed head outline: smooth Fourier fit of the traced ring (identical to the original silhouette, but complete at the chin)
        coef, sd, nfit = COEF, RING_SD, RING_N
        ring_d = closed_path(coef)
        th = np.arctan2(yy - RCY, xx - RCX); rr = np.hypot(xx - RCX, yy - RCY)
        ring_zone = np.abs(rr - radius(coef, th.ravel()).reshape(th.shape)) < 20
        hr = s["headReg"] | glasses_ink
        hair_near = dil(s["hair_h"], 22)
        kill = ((xx < 805) & (yy > 1070) & (yy < 1165) & ~hair_near) | (band & (xx > 1700) & (xx < 1885) & ~hair_near)
        head_ink = seg["ink"] & hr & ~face_ink & ~glasses_ink & ~(ring_zone & ~dil(s["hair_h"], 90) & ~((xx > 1898) & (yy > 1120) & (yy < 1260))) & ~kill   # drop leftovers of the old temples / ear hook
        # --- glasses redrawn clean from the ORIGINAL centre-lines (all the gentle curves of the frame are kept), ONE uniform stroke weight
        GW = 14
        gink = seg["ink"].copy()
        for grp in ("eye", "brow"):
            for c in P[grp]: gink[c["mask"]] = False
        gl_d = (gl.closed_path(gl.lens_loop(gink, gl.LENS_C["L"], GW)) + gl.closed_path(gl.lens_loop(gink, gl.LENS_C["R"], GW)) +
                gl.column_line(gink, 1166, 1262, 1030, 1115, 2, (6, 6)) +                                       # bridge
                gl.column_line(gink, 738, 816, 1070, 1150, 1, (30, 6)) +                                         # left temple (pokes just past the outline)
                gl.column_line(gink, 1652, 1862, 0, 0, 1, (6, 30), ybias=lambda x: 1084 + (x - 1632) * 0.217) +  # right temple -> original ear hook
                "M1898,1140C1914,1143 1925,1151 1932,1163")                                                     # root joining the traced hook to the outline
        glasses = {"id": "glasses", "stroke": FILL["ink"], "width": GW, "fill": "none", "d": gl_d}
        ring = {"id": "ring", "stroke": FILL["ink"], "width": 16, "fill": "none", "d": ring_d}
        white = {"id": "white", "fill": FILL["white"], "d": ring_d}
        head = {"white": white, "ring": ring, "hair": layer(s["hair_h"], "hair", 5), "ink": layer(head_ink, "ink", INK_DIL, 3.5), "glasses": glasses}
        for k, v in head.items(): write(f"head/{k}.svg", [v])
        rig["head"] = {k: v for k, v in head.items()}
        rig["ring_fit"] = {"resid_sd": round(float(sd), 2), "samples": nfit}
# ---------- full pose assemblies (z-order: body, head, eyes, glasses, brows, mouth, overlay)
h = rig["head"]
for pose, pr in rig["poses"].items():
    z = list(pr["body"]) + [h["white"], h["ring"]]
    for k in ("eyeL", "eyeR"): z += pr.get("eyes", {}).get(k, {}).get("layers", [])
    z += [h["hair"], h["ink"], h["glasses"]]
    for k in ("browL", "browR"): z += pr.get("brows", {}).get(k, {}).get("layers", [])
    z += pr.get("mouths", {}).get("mouth", {}).get("layers", [])
    z += pr.get("overlay", [])
    write(f"assembled/{pose}.svg", z)
json.dump(rig, open("rig/rig.json", "w"))
print("done", {p: list(v.keys()) for p, v in rig["poses"].items()})
