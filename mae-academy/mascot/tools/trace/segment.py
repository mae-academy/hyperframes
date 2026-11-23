"""Segment a mascot reference PNG into flat colour classes (high-res)."""
import numpy as np, cv2
from PIL import Image

# centroids measured with k-means on the references (RGB)
CEN = {
    "white":  (254, 254, 254),
    "ink":    (3, 4, 1),
    "hair":   (39, 26, 23),
    "red":    (200, 33, 56),
    "mouth":  (62, 38, 36),
    "tongue": (212, 136, 129),
}
NAMES = list(CEN)

def load(path):
    return np.array(Image.open(path).convert("RGB"))

def segment(rgb):
    a = rgb.astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    bg = (g > r + 35) & (g > b + 35)
    # ✦ watermark & dust live on bg only, so they vanish with it
    blur = cv2.GaussianBlur(rgb, (0, 0), 1.0).astype(np.float32)
    cen = np.array([CEN[n] for n in NAMES], np.float32)
    d = np.stack([((blur - c) ** 2).sum(-1) for c in cen], -1)
    lab = d.argmin(-1)
    masks = {n: (lab == i) & ~bg for i, n in enumerate(NAMES)}
    raw_hair = masks["hair"].copy()
    # anti-aliased rims (ink↔white) get mis-labelled as colour fills: open + area-filter them away
    for n in ("hair", "red", "mouth", "tongue"):
        k_ = 5 if n == "hair" else 9      # hair also holds the thin dark-brown shirt rim (~9px) – keep it
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k_, k_))
        m = cv2.morphologyEx(masks[n].astype(np.uint8), cv2.MORPH_OPEN, ker)
        k, cc, st, _ = cv2.connectedComponentsWithStats(m, 8)
        keep = np.zeros_like(m)
        for i in range(1, k):
            if st[i, cv2.CC_STAT_AREA] > (1500 if n == 'hair' else 2500): keep[cc == i] = 1
        masks[n] = keep.astype(bool)
    # silhouette = everything that is not background, specks removed, holes filled
    sil = (~bg).astype(np.uint8)
    n, cc, stats, _ = cv2.connectedComponentsWithStats(sil, 8)
    big = np.zeros_like(sil)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 40000: big[cc == i] = 1
    # fill only tiny holes (specks); enclosed background (e.g. arm/torso gap) must stay empty
    inv = (1 - big).astype(np.uint8)
    n2, cc2, st2, _ = cv2.connectedComponentsWithStats(inv, 4)
    filled = big.copy()
    for i in range(1, n2):
        if st2[i, cv2.CC_STAT_AREA] < 3000: filled[cc2 == i] = 1
    return {"bg": bg, "sil": filled.astype(bool), "hair_raw": raw_hair, **masks}
