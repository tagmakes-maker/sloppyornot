# Turn the rembg cut of Dot (scene 3, t=4.0s) into MST3K-style overlay layers.
import sys, numpy as np
from PIL import Image, ImageFilter
src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGBA")).astype(np.float32)
rgb, a = im[..., :3], im[..., 3]
# solidify alpha: kill faint ghosts (plant leaf), make chair slats solid
a = np.clip((a - 110) / (200 - 110), 0, 1)
# drop the leaf: greenish pixels behind the neck
g = (rgb[..., 1] > rgb[..., 0] * 1.05) & (rgb[..., 1] > rgb[..., 2] * 1.1)
a[g] = 0
A = Image.fromarray((a * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
a = np.asarray(A).astype(np.float32) / 255
from scipy import ndimage as nd
m = a > 0.3
m = nd.binary_closing(m, iterations=2)
# chair back: slats read as ghosts, so close the left side hard
H, W = m.shape
chair = np.zeros_like(m); chair[int(H*.55):, :int(W*.33)] = True
m = m | (nd.binary_closing(m, structure=np.ones((3,3)), iterations=22) & chair)
m = nd.binary_fill_holes(m)
lab, n = nd.label(m); sizes = nd.sum(m, lab, range(1, n+1))
m = lab == (1 + int(np.argmax(sizes)))
soft = np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)/255
a = soft
ys, xs = np.where(a > 0.05)
x0, x1, y0, y1 = xs.min() - 24, xs.max() + 24, max(ys.min() - 24, 0), im.shape[0]
crop = lambda arr: arr[y0:y1, x0:x1]
rgb, a = crop(rgb), crop(a)
lum = (rgb @ np.array([0.299, 0.587, 0.114])) / 255
# charcoal chrome: dark base, keep specular highlights as cool chrome
base = np.array([30, 30, 38], np.float32)
chrome = np.array([150, 155, 172], np.float32)
t = np.clip((lum - 0.45) / 0.5, 0, 1)[..., None] ** 1.6
col = base + (chrome - base) * t * 0.8 + (lum[..., None] * 42)
# pink rim on the right edge (facing the screen) and the top of the hair
alpha_img = Image.fromarray((a * 255).astype(np.uint8))
inner = np.asarray(alpha_img.filter(ImageFilter.MinFilter(9))).astype(np.float32) / 255
edge = np.clip(a - inner, 0, 1)
h, w = a.shape
xs_ = np.linspace(0, 1, w)[None, :]
ys_ = np.linspace(0, 1, h)[:, None]
rim = edge * np.clip((xs_ - 0.35) * 2.2, 0, 1) * np.clip(1.2 - ys_, 0, 1)
pink = np.array([255, 79, 160], np.float32)
col = col * (1 - rim[..., None] * 0.85) + pink * rim[..., None] * 0.85
col = np.clip(col, 0, 255)
def save(rgbarr, alpha, name):
    o = np.dstack([rgbarr, alpha * 255]).astype(np.uint8)
    Image.fromarray(o, "RGBA").save(f"{out}/{name}.png", optimize=True)
    Image.fromarray(o, "RGBA").save(f"{out}/{name}.webp", quality=92, method=6)
save(col, a, "dot-seated")
# glow layer: back panel + rim, for the speaking state
glow = rim.copy()
# back panel (4-dot plate) sits roughly at 40-55% x, 33-47% y of the crop
py0, py1, px0, px1 = int(h*.33), int(h*.47), int(w*.36), int(w*.50)
panel = np.zeros_like(a); panel[py0:py1, px0:px1] = 1
panel = np.asarray(Image.fromarray((panel*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(np.float32)/255
glow = np.clip(glow * 1.0 + panel * a * 0.9, 0, 1)
gimg = Image.fromarray((glow*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))
save(np.broadcast_to(pink, (h, w, 3)), np.asarray(gimg).astype(np.float32)/255, "dot-seated-glow")
# head layer split at the neck so it can move on its own
neck = int(sys.argv[3]) - y0 if len(sys.argv) > 3 else int(h * 0.33)
head_a = a.copy(); head_a[neck:] = 0
body_a = a.copy(); body_a[:neck - 6] = 0
save(col, head_a, "dot-seated-head")
save(col, body_a, "dot-seated-body")
print("crop", x0, y0, x1, y1, "size", w, h, "neck", neck)
