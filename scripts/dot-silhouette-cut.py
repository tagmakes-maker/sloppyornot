import sys
from rembg import remove, new_session
from PIL import Image
s = new_session(sys.argv[3] if len(sys.argv)>3 else "isnet-general-use")
im = Image.open(sys.argv[1])
remove(im, session=s, alpha_matting=False).save(sys.argv[2])
