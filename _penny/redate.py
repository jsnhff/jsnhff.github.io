# Replace the 2023 on the Mint's cent image with 1981, drawn the way the
# image draws its own date: a dark contour with a bright core, lit from the
# upper left, so the coin carries his birth year. Run from _penny/:
#   python3 redate.py source/us-mint-cent.png source/us-mint-cent-1981.png LiberationSans-Regular.ttf
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
src, out, fontp = sys.argv[1:4]
a = np.asarray(Image.open(src).convert('RGB')).astype(float)
x0, x1, y0, y1 = 207, 268, 183, 209
top = a[y0-3:y0, x0:x1].mean(0); bot = a[y1:y1+3, x0:x1].mean(0)
rng = np.random.default_rng(7)
for y in range(y0, y1):
    t = (y-y0)/(y1-y0)
    a[y, x0:x1] = top*(1-t) + bot*t + rng.normal(0, 2.5, (x1-x0, 1))
S = 8; pad = 4
W, H = (x1-x0+2*pad)*S, (y1-y0+2*pad)*S
font = ImageFont.truetype(fontp, 24*S)
def glyphs(dx=0, dy=0, sw=0):
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    for ch, lx in zip('1981', [210, 224, 238, 251]):
        g = Image.new('L', (40*S, 40*S), 0); gd = ImageDraw.Draw(g)
        gd.text((4*S, 2*S), ch, fill=255, font=font, stroke_width=sw, stroke_fill=255)
        bb = g.getbbox(); g = g.crop(bb)
        # every digit to the old cap height (18px) and a 10px cell, a touch condensed
        h = 18*S; w = int(g.width*h/g.height*0.86)
        g = g.resize((w, h), Image.LANCZOS)
        cx = (lx - x0 + pad)*S + (10*S - w)//2
        m.paste(255, (int(cx+dx*S), int((186-y0+pad+dy)*S)), g)
    return np.asarray(m).astype(float)/255
def down(m): return m.reshape(H//S, S, W//S, S).mean((1, 3))
outer = down(glyphs(sw=S))                      # stroke plus a pixel: the contour
core  = down(glyphs(-0.35, -0.35, sw=-0) )      # the glyph itself, nudged to the light
core  = np.clip(core*1.0, 0, 1)
inner = down(glyphs(-0.45, -0.45))
# a thinner bright line inside the stroke
thin = np.asarray(Image.fromarray((glyphs(-0.45,-0.45)*255).astype(np.uint8)).filter(ImageFilter.MinFilter(int(S*0.9)//2*2+1))).astype(float)/255
thin = down(thin)
light = np.array([255, 232, 214.]); dark = np.array([50, 6, 4.])
reg = a[y0-pad:y1+pad, x0-pad:x1+pad]
reg = reg*(1-outer[..., None]) + dark*outer[..., None]
reg = reg*(1-0.9*thin[..., None]) + light*0.9*thin[..., None]
a[y0-pad:y1+pad, x0-pad:x1+pad] = reg
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(out)
