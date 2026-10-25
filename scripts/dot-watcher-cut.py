# Cut Dot's watcher pose (last frame of Dot_Enter.mp4) off its white background, keeping the pink glow.
# Background = everything reachable from the frame edge through white or pink-tinted pixels.
import sys, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as nd
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
im = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
rgb = np.asarray(im).astype(np.float32)
R, G, B = rgb[..., 0], rgb[..., 1], rgb[..., 2]
mn = rgb.min(axis=2)
passable = (mn > 238) | ((R - G > 10) & (B - G > 4) & (mn > 150))
lab, _ = nd.label(passable)
edge = set(np.unique(np.concatenate([lab[0], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(edge))
body = ~bg
body = nd.binary_opening(body, iterations=1)
body = nd.binary_fill_holes(body)
lab2, n = nd.label(body); sizes = nd.sum(body, lab2, range(1, n + 1))
body = lab2 == (1 + int(np.argmax(sizes)))
soft = np.asarray(Image.fromarray((body * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
# glow outside the body: how far the pixel is from white
glow = np.clip((255 - mn) / 255 * 3.0, 0, 0.9) * (~body)
a = np.maximum(soft, glow)
a[a < 0.03] = 0
safe = np.maximum(a, 1e-3)[..., None]
col = np.clip((rgb - 255 * (1 - a[..., None])) / safe, 0, 255)
col = np.where(soft[..., None] > 0.5, rgb, col)
o = Image.fromarray(np.dstack([col, a * 255]).astype(np.uint8), "RGBA")
bbox = o.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
o = o.crop((max(bbox[0] - 8, 0), max(bbox[1] - 8, 0), min(bbox[2] + 8, o.width), o.height))
o.save(out + ".png", optimize=True); o.save(out + ".webp", quality=92, method=6)
print(o.size)
