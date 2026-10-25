# Robot love clip: white background to the page's near-black, and its fade from white becomes a fade from black.
import sys, glob, os, numpy as np
from PIL import Image
from scipy import ndimage as nd
src, dst = sys.argv[1], sys.argv[2]
BG = np.array([11, 10, 15], np.float32)  # dot.css --bg
for f in sorted(glob.glob(src + "/*.png")):
    rgb = np.asarray(Image.open(f).convert("RGB")).astype(np.float32)
    # the black outlines are the darkest thing on screen; how washed out they are tells the fade amount
    dark = np.percentile(rgb.min(axis=2), 0.5)
    a = np.clip(1 - dark / 255 / 0.92, 0.0, 1.0)
    if a < 0.02:
        out = np.broadcast_to(BG, rgb.shape).copy()
    else:
        true = np.clip((rgb - (1 - a) * 255) / a, 0, 255)  # undo the white wash
        bg = true.min(axis=2) > 244
        lab, _ = nd.label(bg)
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        sizes = nd.sum(bg, lab, range(1, lab.max() + 1))
        big = {i + 1 for i, s in enumerate(sizes) if s > 400}
        bgm = np.isin(lab, list(edge | big))
        bgm = nd.binary_dilation(bgm, iterations=3) & (true.min(axis=2) > 170)
        # the 1 to 2 pixel grey seam where black outlines used to meet white
        sat = true.max(axis=2) - true.min(axis=2)
        seam = nd.binary_dilation(bgm, iterations=3) & ~bgm & (sat < 25) & (true.min(axis=2) > 30)
        bgm = bgm | seam
        out = np.where(bgm[..., None], BG, true * a + BG * (1 - a))
    Image.fromarray(out.astype(np.uint8)).save(dst + "/" + os.path.basename(f))
print("done")
