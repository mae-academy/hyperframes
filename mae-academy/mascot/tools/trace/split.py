"""Split a segmented reference into: body / head / glasses / face parts / overlay. All in source-pixel coords."""
import sys, numpy as np, cv2
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from segment import load, segment
from headfit import head_circle

CX, CY, R = 1312.0, 1136.0, 600.0     # shared head circle (fits agree within ±3px on all refs)
YY, XX = None, None
# chin-glove polygon on the "think" pose (full-res px), traced along the glove stroke centres
_hp = [(700,215),(740,222),(765,250),(745,310),(715,380),(720,460),(740,505),(752,540),(735,600),(690,640),(650,650),(600,640),(500,610),(430,595),(395,570),(385,520),(375,475),(380,448),(300,415),(255,375),(238,335),(250,312),(330,303),(440,338),(555,378),(595,358),(622,300),(648,252),(675,225)]
HAND2 = [(850 + x * 0.9, 1250 + y * 0.9) for x, y in _hp]

def disc(shape, r):
    global YY, XX
    if YY is None or YY.shape != shape:
        YY, XX = np.mgrid[:shape[0], :shape[1]]
    return (XX - CX) ** 2 + (YY - CY) ** 2 <= r * r

def dil(m, k):
    return cv2.dilate(m.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * k + 1, 2 * k + 1))).astype(bool)

def comps(m, min_area=200):
    n, cc, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    return [dict(id=i, mask=(cc == i), area=int(st[i, 4]), bbox=tuple(int(v) for v in st[i, :4]), c=tuple(cen[i]))
            for i in range(1, n) if st[i, 4] >= min_area]

def split(seg, hand_box=None, D_over=None):
    H, W = seg["ink"].shape
    ink, sil = seg["ink"], seg["sil"]
    D = D_over if D_over is not None else disc((H, W), R + 3)
    hair_h = seg["hair"].copy(); hair_h[1350:] = False      # real hair only (the shirt rim is hair-coloured too)
    hair_d = dil(hair_h, 30)
    # the head is not a perfect circle at the chin (flatter than the fit): carve the shirt top (+ its outline) out of the head region
    B = dil(seg["red"] | (seg["hair"] & ~hair_h), 14); B[:1600] = False
    headReg = (D | hair_d) & ~B
    # ---- glove overlay (hand on chin): manual polygon, the glove outline is open against the face
    overlay = np.zeros_like(ink); poly = np.zeros_like(ink)
    if hand_box:
        m = np.zeros(ink.shape, np.uint8)
        cv2.fillPoly(m, [np.array(hand_box, np.int32)], 1)
        overlay = dil(m, 14); poly = m.astype(bool)
    # ---- ink inside the face
    ring = D & ~disc((H, W), R - 36)                      # head outline stroke
    inner = disc((H, W), R - 60)
    faceInk = ink & inner & ~hair_d & ~overlay
    parts = {"brow": [], "eye": [], "mouth": [], "glasses": []}
    for c in comps(faceInk, 150):
        cx, cy = c["c"]; x, y, w, h = c["bbox"]
        if y < 1030 and w > 700:                        parts["glasses"].append(c)
        elif cy < 990:                                  parts["brow"].append(c)
        elif cy < 1330:                                 parts["eye"].append(c)
        else:                                           parts["mouth"].append(c)
    return dict(hair_h=hair_h, D=D, headReg=headReg, hair_d=hair_d, ring=ring, overlay=overlay, poly=poly, parts=parts, faceInk=faceInk)

if __name__ == "__main__":
    names = {"ref1_wave": None, "ref2_think": HAND2, "ref3_wink_point": None, "ref4_talk_point": None}
    for n, hb in names.items():
        seg = segment(load(f"reference/{n}_1.png"))
        s = split(seg, hb)
        print(n, {k: [(c["area"], c["bbox"]) for c in v] for k, v in s["parts"].items()}, "overlay px", int(s["overlay"].sum()))
