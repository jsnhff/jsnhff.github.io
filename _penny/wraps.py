"""Builds the flat wraps the 3D book (js/book.js) is dressed in.

Each book gets, in images/book3d/:
  <slug>-wrap.webp   back | spine | front, cut to the edges of the paper, in
                     those proportions (the model maps the path round the book
                     straight onto the image, so the proportions are the model)
  <slug>-front.webp  the front alone: the poster shown while the model loads,
                     drawn the same size as the model's first frame
  <slug>-foil.webp   where there is foil, white on black: a mask for a metal layer
                     laid over the cover

Run with Pillow, numpy and scipy:  python3 wraps.py
The sources are not in the repo. AutoSummarize's are Adam Lucas's flat shots
from specificideas.com/autosummarize (SRC_AS); Bad Poetry One's is the press
cover PDF rendered with `sips -s format png --resampleWidth 3500`.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC_AS = os.environ.get("SRC_AS", "adam/img")
SRC_BP = os.environ.get("SRC_BP", "bp-press-3500.png")
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images", "book3d")

SILVER = np.array([196, 199, 205], dtype=float)


def bounds(img, thresh=90, min_cols=200, min_rows=60):
    """The paper's box on a black ground."""
    a = np.asarray(img.convert("L")).astype(int)
    m = a > thresh
    cols = np.where(m.sum(0) > min_cols)[0]
    rows = np.where(m.sum(1) > min_rows)[0]
    return cols.min(), rows.min(), cols.max() + 1, rows.max() + 1


def save(img, name, **kw):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    img.save(path, "WEBP", **kw)
    print(name, img.size, os.path.getsize(path) // 1024, "KB")


def foil_mask(front):
    """The title is foil: broad strokes. The list around it is thin type, which
    an opening the width of a stroke removes."""
    g = np.asarray(front.convert("L")).astype(int)
    dark = g < 135
    # round, so a diagonal stroke the same weight as a vertical one survives
    yy, xx = np.mgrid[-3:4, -3:4]
    disk = (xx * xx + yy * yy) <= 7
    core = ndimage.binary_opening(dark, structure=disk)
    # give back the soft edge the opening shaved off
    grown = ndimage.binary_dilation(core, structure=np.ones((3, 3)), iterations=2) & (g < 175)
    return Image.fromarray((grown * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.9))


def dress_foil(wrap, mask_front, back_w, spine_w):
    """Silver in the albedo where the foil is (what shows when the metal layer
    above it is dark), and the mask for that layer."""
    w, h = wrap.size
    full = Image.new("L", (w, h), 0)
    full.paste(mask_front, (back_w + spine_w, 0))
    m = np.asarray(full).astype(float) / 255.0
    rgb = np.asarray(wrap).astype(float)
    rgb = rgb * (1 - m[..., None]) + SILVER * m[..., None]
    return Image.fromarray(rgb.clip(0, 255).astype(np.uint8)), full


def autosummarize_second_edition():
    front_src = Image.open(os.path.join(SRC_AS, "autosummarize-web-01.jpg")).convert("RGB")
    back_src = Image.open(os.path.join(SRC_AS, "autosummarize-web-14.jpg")).convert("RGB")
    # the paper's own edges are shaded a few pixels in; trim them
    TR = 3
    fx0, fy0, fx1, fy1 = 674 + TR, 149 + TR, 1557 - TR, 1489 - TR
    front = front_src.crop((fx0, fy0, fx1, fy1))
    bx0, by0, bx1, by1 = bounds(back_src)
    back = back_src.crop((bx0 + TR, by0 + TR, bx1 - TR, by1 - TR)).resize(front.size, Image.LANCZOS)

    # the spine: two copies stand to the right of the front, leaning 3 degrees.
    # Straighten the near one and cut it to its own edges.
    lean = -3.0
    st = front_src.rotate(lean, resample=Image.BICUBIC, center=(1650, 820), fillcolor=(0, 0, 0))
    a = np.asarray(st.convert("L")).astype(int)
    row = a[820, 1560:1800] > 70
    runs, s = [], None
    for i, v in enumerate(row):
        if v and s is None:
            s = i
        if not v and s is not None:
            runs.append((1560 + s, 1560 + i)); s = None
    x0, x1 = runs[0]
    top = np.where(a[:, (x0 + x1) // 2] > 70)[0]
    spine = st.crop((x0 + 2, top.min() + TR, x1 - 2, top.max() + 1 - TR))
    print("spine strip", spine.size, "front", front.size)
    spine_w = round(front.size[0] * (x1 - x0) / (fx1 - fx0 + 2 * TR))
    spine = spine.resize((spine_w, front.size[1]), Image.LANCZOS)

    W, H = front.size
    wrap = Image.new("RGB", (W + spine_w + W, H))
    wrap.paste(back, (0, 0)); wrap.paste(spine, (W, 0)); wrap.paste(front, (W + spine_w, 0))
    wrap, mask = dress_foil(wrap, foil_mask(front), W, spine_w)
    slug = "autosummarize-second-edition"
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    save(mask, slug + "-foil.webp", lossless=True, method=6)
    save(wrap.crop((W + spine_w, 0, 2 * W + spine_w, H)).resize((600, round(600 * H / W)), Image.LANCZOS),
         slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (H / W, spine_w / W))


def bad_poetry_one():
    spread = Image.open(SRC_BP).convert("RGB")
    sw, sh = spread.size
    ppi = sw / 8.75                       # 8.75 x 7.125 in, bleed on every side
    b = round(0.125 * ppi)
    spread = spread.crop((b, b, sw - b, sh - b))   # trim: 8.5 x 6.875
    W, H = spread.size[0] // 2, spread.size[1]
    depth_in = 0.05                       # 20 pages, saddle-stitched, 60# uncoated
    spine_w = round(depth_in / 4.25 * W)
    # no spine in the artwork: the sky runs straight across the fold, so the
    # strip is the blend of the two edges that meet there
    left, right = spread.crop((0, 0, W, H)), spread.crop((W, 0, 2 * W, H))
    l = np.asarray(left.crop((W - 1, 0, W, H))).astype(float)
    r = np.asarray(right.crop((0, 0, 1, H))).astype(float)
    t = np.linspace(0, 1, spine_w)[None, :, None]
    strip = Image.fromarray((l * (1 - t) + r * t).astype(np.uint8))
    wrap = Image.new("RGB", (2 * W + spine_w, H))
    wrap.paste(left, (0, 0)); wrap.paste(strip, (W, 0)); wrap.paste(right, (W + spine_w, 0))
    slug = "bad-poetry-one"
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    save(wrap.crop((W + spine_w, 0, 2 * W + spine_w, H)).resize((600, round(600 * H / W)), Image.LANCZOS),
         slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (H / W, spine_w / W))


if __name__ == "__main__":
    which = sys.argv[1:] or ["autosummarize-second-edition", "bad-poetry-one"]
    if "autosummarize-second-edition" in which:
        autosummarize_second_edition()
    if "bad-poetry-one" in which:
        bad_poetry_one()
