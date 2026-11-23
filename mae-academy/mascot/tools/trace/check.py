"""render trace svg over green and diff against the reference. usage: check.py name"""
import sys, subprocess, numpy as np, cv2
from PIL import Image
name = sys.argv[1]; SVG = sys.argv[2] if len(sys.argv) > 2 else f"trace/{name}.svg"
ref = np.array(Image.open(f"reference/{name}_1.png").convert("RGB"))
H, W = ref.shape[:2]
html = f'<html><body style="margin:0;background:rgb({",".join(map(str,np.median(ref[:150,:150].reshape(-1,3),0).astype(int)))})"><img src="file://{__import__("os").getcwd()}/{SVG}" style="display:block;width:{W//2}px"></body></html>'
open("/tmp/chk.html", "w").write(html)
subprocess.run(["node", "tools/render.mjs", "/tmp/chk.html", "/tmp/chk.png", str(W // 2), str(H // 2)], check=True)
out = np.array(Image.open("/tmp/chk.png").convert("RGB"))[:H // 2, :W // 2]
r2 = cv2.resize(ref, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
d = np.abs(out.astype(int) - r2.astype(int)).sum(-1)
bad = d > 150
# ignore the watermark corner
bad[-int(H*0.09)//2:, -int(W*0.13)//2:] = False
print("mismatch px:", int(bad.sum()), f"({bad.mean()*100:.3f}% of frame)")
vis = r2.copy(); vis[bad] = (255, 0, 255)
Image.fromarray(np.hstack([r2, out, vis])).save(f"/tmp/diff_{name}.png")
Image.fromarray(out).save(f"/tmp/out_{name}.png")
