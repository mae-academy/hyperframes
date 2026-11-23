import sys, numpy as np, cv2
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from segment import load, segment

def fit_circle(pts):
    x, y = pts[:, 0].astype(float), pts[:, 1].astype(float)
    A = np.c_[2 * x, 2 * y, np.ones(len(x))]; b = x**2 + y**2
    c, *_ = np.linalg.lstsq(A, b, rcond=None)
    return c[0], c[1], np.sqrt(c[2] + c[0]**2 + c[1]**2)

def head_circle(seg, guess=(1307, 1100, 590)):
    """RANSAC-ish: fit to silhouette boundary points close to the guess circle (lower 2/3 of the head)."""
    sil = seg["sil"].astype(np.uint8)
    cnt = max(cv2.findContours(sil, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=len)[:, 0]
    cx, cy, R = guess
    for _ in range(6):
        d = np.hypot(cnt[:, 0] - cx, cnt[:, 1] - cy)
        sel = (abs(d - R) < 14) & (cnt[:, 1] > cy - 60) & (cnt[:, 1] < cy + R * 0.92)
        cx, cy, R = fit_circle(cnt[sel])
    return cx, cy, R, int(sel.sum())

if __name__ == "__main__":
    for n in ["ref1_wave", "ref2_think", "ref3_wink_point", "ref4_talk_point"]:
        s = segment(load(f"reference/{n}_1.png"))
        print(n, [round(v, 1) for v in head_circle(s)])
