"""Build the traced MAE rig from the 4 reference poses.
 outputs (all in the reference pixel space 2473x3024 so every part overlays exactly):
   rig/head/{white,hair,ink,glasses}.svg   rig/poses/body-<pose>.svg  rig/poses/overlay-think.svg
   rig/parts/{brows,eyes,mouths}/<pose>-*.svg      rig/rig.json      rig/assembled/<pose>.svg"""
import sys, json, os, numpy as np, cv2
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from segment import load, segment
from split import split, dil, HAND2, disc, R
from vec import mask_to_path

FILL = {"rim": "#271a17", "white": "#ffffff", "hair": "#271a17", "red": "#c82138", "mouth": "#3e2624", "tongue": "#d48881", "ink": "#060606"}
POSES = {"wave": ("ref1_wave", None), "think": ("ref2_think", HAND2), "wink_point": ("ref3_wink_point", None), "talk_point": ("ref4_talk_point", None)}
W, H = 2473, 3024
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

def svg(layers, vb=(0, 0, W, H)):
    body = "".join(f'<path fill="{l["fill"]}" fill-rule="evenodd" d="{l["d"]}"/>' for l in layers if l)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]} {vb[1]} {vb[2]} {vb[3]}">{body}</svg>'

def write(path, layers, vb=(0, 0, W, H)):
    open(f"rig/{path}", "w").write(svg(layers, vb))

rig = {"size": [W, H], "head_circle": [1312, 1136, 600], "poses": {}, "head": {}}
for pose, (ref, hand) in POSES.items():
    seg = segment(load(f"reference/{ref}_1.png"))
    seg["sil"] = er(seg["sil"], 3)
    s = split(seg, hand)
    P = s["parts"]
    face_ink = np.zeros_like(seg["ink"])
    for grp in P.values():
        for c in grp: face_ink |= c["mask"]
    # ---------- body (everything outside the head complex)
    yy, xx = np.mgrid[:seg['ink'].shape[0], :seg['ink'].shape[1]]
    neck = (yy > 1685) & (abs(xx - 1312) < 330) & ((xx - 1312) ** 2 + (yy - 1136) ** 2 > 550 ** 2)   # shirt collar strokes touching the chin
    out = ~s["headReg"]
    body = [layer(seg["sil"] & out, "white"), layer(seg["red"] & out, "red", 5), layer(seg["hair"] & ~s["hair_h"] & out, "rim", 6), layer(seg["ink"] & out, "ink", 2, 3.5)]
    rc = np.median(load(f"reference/{ref}_1.png")[er(seg["red"], 6)], axis=0).astype(int)   # per-pose shirt red (the refs differ slightly)
    for l in body:
        if l and l["id"] == "red": l["fill"] = "#%02x%02x%02x" % tuple(rc)
    write(f"poses/body-{pose}.svg", body)
    rig["poses"][pose] = {"body": [l for l in body if l]}
    # ---------- glove overlay
    if s["overlay"].any():
        ov = s["poly"] & seg["sil"]
        ovl = [layer(ov, "white"), layer(seg["ink"] & s["overlay"], "ink", 2, 3.5)]
        write(f"poses/overlay-{pose}.svg", ovl); rig["poses"][pose]["overlay"] = [l for l in ovl if l]
    # ---------- face parts (pose-specific)
    ovm = ~s["overlay"]
    def part(masks, name, kind):
        fm = {k: v & ovm for k, v in masks.items()}
        allm = np.zeros_like(seg["ink"])
        for v in fm.values(): allm |= v
        if not allm.any(): return
        ls = [layer(fm.get(k), k, 4 if k != "ink" else 2, 3.0 if k != "ink" else 3.5) for k in ("mouth", "tongue", "ink") if k in fm]
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
        glasses_ink |= seg["ink"] & band & ~s["D"] & ~s["hair_d"]          # temple stubs / ear hook outside the circle
        hr = s["headReg"] | glasses_ink
        head_ink = seg["ink"] & hr & ~face_ink & ~glasses_ink
        head = {"white": layer(seg["sil"] & s["headReg"], "white"), "hair": layer(s["hair_h"], "hair", 5),
                "ink": layer(head_ink, "ink", 2, 3.5), "glasses": layer(glasses_ink, "ink", 2, 3.5)}
        for k, v in head.items(): write(f"head/{k}.svg", [v])
        rig["head"] = {k: v for k, v in head.items()}
        rig["head_mask"] = None
# ---------- full pose assemblies (z-order: body, head, eyes, glasses, brows, mouth, overlay)
h = rig["head"]
for pose, pr in rig["poses"].items():
    z = list(pr["body"]) + [h["white"], h["hair"], h["ink"]]
    for k in ("eyeL", "eyeR"): z += pr.get("eyes", {}).get(k, {}).get("layers", [])
    z += [h["glasses"]]
    for k in ("browL", "browR"): z += pr.get("brows", {}).get(k, {}).get("layers", [])
    z += pr.get("mouths", {}).get("mouth", {}).get("layers", [])
    z += pr.get("overlay", [])
    write(f"assembled/{pose}.svg", z)
json.dump(rig, open("rig/rig.json", "w"))
print("done", {p: list(v.keys()) for p, v in rig["poses"].items()})
