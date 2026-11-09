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
SRC_AS10 = os.environ.get("SRC_AS10", "as10_3600.png")
SRC_AP = os.environ.get("SRC_AP", "ap3600.png")
SRC_EO = os.environ.get("SRC_EO", "eo3600.png")
SRC_BFE = os.environ.get("SRC_BFE", "bfe3000.png")
SRC_SOA = os.environ.get("SRC_SOA", "soa6000.png")
SRC_RNT = os.environ.get("SRC_RNT", "rnt3600.png")
SRC_RG = os.environ.get("SRC_RG", os.path.expanduser("~/regender-xyz-theme/assets-src/pp-swapped-wrap.jpg"))
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
    # a tile on the wall shows it at most ~600px across: 1200 a cover is plenty
    if wrap.size[0] > 2400:
        wrap = wrap.resize((2400, round(2400 * wrap.size[1] / wrap.size[0])), Image.LANCZOS)
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    fw = wrap.size[0] * W // (2 * W + spine_w)
    save(wrap.crop((wrap.size[0] - fw, 0, wrap.size[0], wrap.size[1])).resize((600, round(600 * H / W)), Image.LANCZOS),
         slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (H / W, spine_w / W))


def road_not_taken():
    """The press cover: one mirrored picture, each half a cover, with no spine in
    the artwork and the printer's marks around it. The book is thin; its page
    count is not on record, so ~0.1 in is an estimate (32 pages, saddle-stitched)."""
    page = Image.open(SRC_RNT).convert("RGBA")
    white = Image.new("RGBA", page.size, (255, 255, 255, 255))
    white.alpha_composite(page)
    rgb = white.convert("RGB")
    a = np.asarray(rgb).astype(int)
    ink = a.sum(2) < 720
    cols = np.where(ink.sum(0) > 0.33 * rgb.height)[0]        # the marks are slivers
    rows = np.where(ink.sum(1) > 0.5 * rgb.width)[0]
    art = rgb.crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1))
    W, H = art.size[0] // 2, art.size[1]
    spine_w = round(0.1 / 5.865 * W)
    left, right = art.crop((0, 0, W, H)), art.crop((W, 0, 2 * W, H))
    l = np.asarray(left.crop((W - 1, 0, W, H))).astype(float)
    r = np.asarray(right.crop((0, 0, 1, H))).astype(float)
    t = np.linspace(0, 1, spine_w)[None, :, None]
    strip = Image.fromarray((l * (1 - t) + r * t).astype(np.uint8))
    wrap = Image.new("RGB", (2 * W + spine_w, H))
    wrap.paste(left, (0, 0)); wrap.paste(strip, (W, 0)); wrap.paste(right, (W + spine_w, 0))
    front = wrap.crop((W + spine_w, 0, 2 * W + spine_w, H)).resize((600, round(600 * H / W)), Image.LANCZOS)
    if wrap.size[0] > 2400:
        wrap = wrap.resize((2400, round(2400 * wrap.size[1] / wrap.size[0])), Image.LANCZOS)
    slug = "the-road-not-taken"
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    save(front, slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f  (%.3f x %.3f in a cover)" % (H / W, spine_w / W, W / 3600 * 1302 / 72 * (3600 / rgb.width), H / 3600 * 1302 / 72 * (3600 / rgb.width)))


def _flat(path):
    page = Image.open(path).convert("RGBA")
    white = Image.new("RGBA", page.size, (255, 255, 255, 255))
    white.alpha_composite(page)
    return white.convert("RGB")


def _finish(slug, wrap, front, W, H, spine_px):
    fr = front.resize((600, round(600 * H / W)), Image.LANCZOS)
    if wrap.width > 2400:
        wrap = wrap.resize((2400, round(2400 * wrap.height / wrap.width)), Image.LANCZOS)
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    save(fr, slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (H / W, spine_px / W))


def autosummarize_2010():
    """Trim 14.5 x 22 cm (5.709 x 8.661 in). The press page, 13.25 x 10.25 in, is
    a casewrap: the boards with an equal margin all round, (10.25 - 8.661) / 2 =
    0.795 in. That leaves 13.25 - 2 x 5.709 - 2 x 0.795 = 0.243 in of spine, and
    the printed frames sit centred in the boards, which it bears out."""
    art = _flat(SRC_AS10)
    ppi = art.width / 13.25
    W, H = round(5.709 * ppi), round(8.661 * ppi)
    m = round((10.25 - 8.661) / 2 * ppi)
    spine = art.width - 2 * W - 2 * m
    wrap = art.crop((m, m, art.width - m, m + H))
    front = wrap.crop((wrap.width - W, 0, wrap.width, H))
    _finish("autosummarize", wrap, front, W, H, spine)


def american_psycho():
    """Trim 15.2 x 22.9 cm (5.984 x 9.016 in). The artwork is found on the page as
    the black rectangle, 13.26 x 9.51 in; 9.51 - 9.016 is a bleed of 0.247 in top
    and bottom. Across, the grey ELLIS bar on the spine is the width of the spine
    (set to the guides): its edges are the spine's, and a cover's width of art
    lies either side. Taken that way the panels fall on the bar to the pixel;
    the spine comes out about 0.95 in."""
    page = _flat(SRC_AP)
    a = np.asarray(page).astype(int)
    ink = a.sum(2) < 600
    cols = np.where(ink.sum(0) > 0.3 * page.height * 0.5)[0]
    rows = np.where(ink.sum(1) > 0.3 * page.width * 0.5)[0]
    art = page.crop((cols.min(), rows.min(), cols.max() + 1, rows.max() + 1))
    ppi = art.height / 9.51
    by = round((art.height / ppi - 9.016) / 2 * ppi)
    art = art.crop((0, by, art.width, art.height - by))
    H = art.height
    W = round(5.984 * ppi)
    g = np.asarray(art).astype(int)
    grey = (g[..., 0] > 100) & (g[..., 0] < 175) & (abs(g[..., 0] - g[..., 1]) < 8) & (abs(g[..., 1] - g[..., 2]) < 8)
    band = grey[round(0.06 * H):round(0.13 * H), round(0.4 * art.width):round(0.6 * art.width)]
    xs = np.where(band.mean(0) > 0.8)[0] + round(0.4 * art.width)
    x0, x1 = xs.min(), xs.max() + 1
    wrap = art.crop((x0 - W, 0, x1 + W, H))
    _finish("american-psycho", wrap, wrap.crop((wrap.width - W, 0, wrap.width, H)), W, H, x1 - x0)
    print("  spine %.3f in; bleed at the sides %.3f in" % ((x1 - x0) / ppi, (x0 - W) / ppi))


def endless_opportunities():
    """The print cover is one page, 16.196 x 9.931 in. Its height is Lulu's Crown
    Quarto, 9.6875 in, with a 0.125 in bleed top and bottom; across, that leaves
    16.196 - 2 x 7.4375 - 0.25 = 1.071 in of spine. Worked out, not recorded:
    the page count would confirm it."""
    page = Image.open(SRC_EO).convert("RGBA")
    white = Image.new("RGBA", page.size, (255, 255, 255, 255))
    white.alpha_composite(page)
    art = white.convert("RGB")
    ppi = art.width / 16.196
    b = round(0.125 * ppi)
    art = art.crop((b, b, art.width - b, art.height - b))
    H = art.height
    W = round(7.4375 * ppi)
    fr = art.crop((art.width - W, 0, art.width, H)).resize((600, round(600 * H / W)), Image.LANCZOS)
    wrap = art
    if wrap.width > 2400:
        wrap = wrap.resize((2400, round(2400 * wrap.height / wrap.width)), Image.LANCZOS)
    slug = "endless-opportunities-book"
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    save(fr, slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (H / W, (art.width - 2 * W) / W))


def best_fight_ever():
    """Lulu pocketbook, 4.25 x 6.875 in, 116 pages. The press cover is 9.011 x
    7.125 in: trim plus a 0.125 in bleed all round, and what is left between the
    two covers is the spine, 9.011 - 8.5 - 0.25 = 0.261 in. A front on each side:
    the book has two, and flips."""
    page = Image.open(SRC_BFE).convert("RGBA")
    white = Image.new("RGBA", page.size, (255, 255, 255, 255))
    white.alpha_composite(page)
    art = white.convert("RGB")
    ppi = art.width / 9.011
    b = round(0.125 * ppi)
    art = art.crop((b, b, art.width - b, art.height - b))
    H = art.height
    W = round(4.25 * ppi)
    wrap = art
    fr = wrap.crop((wrap.width - W, 0, wrap.width, H)).resize((600, round(600 * H / W)), Image.LANCZOS)
    if wrap.width > 2400:
        wrap = wrap.resize((2400, round(2400 * wrap.height / wrap.width)), Image.LANCZOS)
    slug = "best-fight-ever"
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    save(fr, slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (H / W, (art.width - 2 * W) / W))


def story_of_art():
    """The jacket PDF is the whole flat: flaps of text either side, margins above
    and below. The boards are blank but for a few marks, and those find the
    edges: GOMBRICH and PHAIDON x2 sit tight to the spine; the broken-image icon
    sits near the front's top right. Anchors are in the PDF's 2000px-wide view,
    scaled to the render. The model is given the original hardcover's own
    proportions, 179 x 252 x 45 mm, so the cut art is stretched a few percent
    to match; on boards this plain it cannot be seen."""
    page = Image.open(SRC_SOA).convert("RGBA")
    white = Image.new("RGBA", page.size, (255, 255, 255, 255))
    white.alpha_composite(page)
    rgb = white.convert("RGB")
    k = rgb.width / 2000.0
    back_x0, back_x1 = 443, 942
    spine_x1, front_x1 = 1058, 1557
    top, bottom = 150, 876
    box = lambda a, b: (round(a * k), round(top * k), round(b * k), round(bottom * k))
    back, spine, front = rgb.crop(box(back_x0, back_x1)), rgb.crop(box(back_x1, spine_x1)), rgb.crop(box(spine_x1, front_x1))
    H_RATIO, D_RATIO = 252 / 179, 45 / 179
    W = back.width
    H = round(W * H_RATIO)
    D = round(W * D_RATIO)
    wrap = Image.new("RGB", (2 * W + D, H))
    wrap.paste(back.resize((W, H), Image.LANCZOS), (0, 0))
    wrap.paste(spine.resize((D, H), Image.LANCZOS), (W, 0))
    wrap.paste(front.resize((W, H), Image.LANCZOS), (W + D, 0))
    fr = wrap.crop((W + D, 0, 2 * W + D, H)).resize((600, round(600 * H / W)), Image.LANCZOS)
    if wrap.width > 2400:
        wrap = wrap.resize((2400, round(2400 * wrap.height / wrap.width)), Image.LANCZOS)
    slug = "the-story-of-art"
    save(wrap, slug + "-wrap.webp", quality=92, method=6)
    save(fr, slug + "-front.webp", quality=90, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (H / W, D / W))


def regender_pride_and_prejudice():
    """The product page's own wrap, measured off the press files: 4.25 x 6.875 in,
    586 pages, so 0.324 of a width deep."""
    wrap = Image.open(SRC_RG).convert("RGB")
    w, h = wrap.size
    W = round(w / 2.324)                  # back | spine | front = 1 : .324 : 1
    slug = "regender-pride-and-prejudice"
    save(wrap, slug + "-wrap.webp", quality=90, method=6)
    save(wrap.crop((w - W, 0, w, h)).resize((600, round(600 * h / W)), Image.LANCZOS),
         slug + "-front.webp", quality=88, method=6)
    print("ratio h/w %.4f  d/w %.4f" % (h / W, (w - 2 * W) / W))


if __name__ == "__main__":
    which = sys.argv[1:] or ["autosummarize-second-edition", "bad-poetry-one", "regender-pride-and-prejudice", "the-road-not-taken", "the-story-of-art", "best-fight-ever", "endless-opportunities-book", "autosummarize", "american-psycho"]
    if "autosummarize-second-edition" in which:
        autosummarize_second_edition()
    if "bad-poetry-one" in which:
        bad_poetry_one()
    if "regender-pride-and-prejudice" in which:
        regender_pride_and_prejudice()
    if "the-road-not-taken" in which:
        road_not_taken()
    if "the-story-of-art" in which:
        story_of_art()
    if "best-fight-ever" in which:
        best_fight_ever()
    if "endless-opportunities-book" in which:
        endless_opportunities()
    if "autosummarize" in which:
        autosummarize_2010()
    if "american-psycho" in which:
        american_psycho()
