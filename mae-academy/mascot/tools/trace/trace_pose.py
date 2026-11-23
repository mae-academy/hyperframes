"""usage: trace_pose.py refN_name  -> trace/<name>.svg (layered, full pose, transparent bg)"""
import sys, time, numpy as np
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from segment import load, segment
from vec import mask_to_path
FILL = {"sil": "#ffffff", "hair": "#271a17", "red": "#c82138", "mouth": "#3e2624", "tongue": "#d48881", "ink": "#060606"}
name = sys.argv[1]
t = time.time()
rgb = load(f"reference/{name}_1.png"); H, W = rgb.shape[:2]
seg = segment(rgb)
import cv2
seg["sil"] = cv2.erode(seg["sil"].astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))).astype(bool)
layers = []
for k, dil in [("sil", 0), ("hair", 5), ("red", 5), ("mouth", 4), ("tongue", 4), ("ink", 2)]:
    d = mask_to_path(seg[k], sigma=3.0 if k != "ink" else 3.5, dilate=dil)
    layers.append(f'<path id="{k}" fill="{FILL[k]}" fill-rule="evenodd" d="{d}"/>')
    print(k, len(d), f"{time.time()-t:.1f}s", flush=True)
open(f"trace/{name}.svg", "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(layers)}</svg>')
