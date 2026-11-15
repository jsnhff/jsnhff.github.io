#!/usr/bin/env python3
"""The stone of the OWS Deal Toy: black Nero Marquina with white veining, and the front face with its engraving.

    pip install "numpy<2" scipy pillow
    python3 toy_marble.py ../images/ows3d [font.ttf]

Writes marble.webp (the stone, for the top and the three plain sides) and marble-front.webp (the same stone with
"Occupy Wall Street / September 17, 2021" cut into it, sized and placed as on the object). The stone is made, not
photographed: warped noise, its zero contours drawn as veins at two scales, a faint cloud under them.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy.ndimage import map_coordinates

SEED = 20210917          # the date on the front of it


def noise(n, cells, rng):
    """Smooth value noise: a random grid, cubic-interpolated, with no seams to see."""
    g = int(cells) + 4
    grid = rng.uniform(-1, 1, (g, g))
    c = np.arange(n, dtype=np.float64) * cells / n + 1.0
    return map_coordinates(grid, np.meshgrid(c, c, indexing="ij"), order=3, mode="nearest")


def fbm(n, cells, octaves, rng):
    out = np.zeros((n, n), np.float64)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out += amp * noise(n, cells * 2 ** o, rng)
        tot += amp
        amp *= 0.5
    return out / tot


def stone(n, rng):
    base = np.zeros((n, n, 3), np.float64) + np.array([8.0, 8.0, 10.0])
    base += fbm(n, 2.5, 5, rng)[..., None] * 3.5                       # a faint mottling
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float64)
    veins = np.zeros((n, n))
    # three scales of vein, from the long ones that cross the whole face to the hairlines between them
    for cells, octs, width, strength, warp in ((2.0, 4, 0.0042, 0.92, 0.13), (4.5, 4, 0.0030, 0.62, 0.08), (9.0, 3, 0.0020, 0.36, 0.045)):
        field = fbm(n, cells, octs, rng)
        wx, wy = fbm(n, 1.6, 3, rng) * warp * n, fbm(n, 1.6, 3, rng) * warp * n
        field = map_coordinates(field, [(yy + wy) % n, (xx + wx) % n], order=1, mode="wrap")
        # a vein runs along a contour of the field; the gate lets it come and go along its length
        line = np.exp(-np.abs(field - np.median(field)) / (width * field.std() * 3.0))
        gate = np.clip(fbm(n, 2.4, 3, rng) * 3.0 + 0.6, 0, 1)
        veins = np.maximum(veins, line * strength * gate)
    veins = np.clip(veins, 0, 1) ** 1.2
    glow = np.array(Image.fromarray((veins * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(n / 500))) / 255.0
    white = np.array([214.0, 214.0, 212.0])                           # greyer than white: the veins are not lit from inside
    img = base * (1 - veins[..., None]) + white * veins[..., None] + glow[..., None] * np.array([7.0, 7.0, 8.0])
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))


def engrave(img, font_path, w_mm=136.0, h_mm=118.0):
    W, H = img.size
    d = ImageDraw.Draw(img, "RGBA")
    champagne = (206, 184, 160, 255)
    for text, width_share, y_share in (("Occupy Wall Street", 0.335, 0.452), ("September 17, 2021", 0.668, 0.533)):
        lo, hi = 8, 400
        for _ in range(18):                    # find the size that sets the line to its width on the stone
            mid = (lo + hi) / 2
            f = ImageFont.truetype(font_path, int(mid))
            if d.textlength(text, font=f) < width_share * W:
                lo = mid
            else:
                hi = mid
        f = ImageFont.truetype(font_path, int(lo))
        tw = d.textlength(text, font=f)
        x, y = (W - tw) / 2, y_share * H
        d.text((x + 2, y + 2), text, font=f, fill=(0, 0, 0, 150), anchor="ls")    # the cut's shadow
        d.text((x, y), text, font=f, fill=champagne, anchor="ls")
        d.text((x - 1, y - 1), text, font=f, fill=(244, 228, 208, 70), anchor="ls")  # a catch of light on the lip
    return img


def main():
    out = sys.argv[1]
    font = sys.argv[2] if len(sys.argv) > 2 else "/System/Library/Fonts/Supplemental/Times New Roman.ttf"
    os.makedirs(out, exist_ok=True)
    rng = np.random.default_rng(SEED)
    plain = stone(1536, rng)
    plain.save(os.path.join(out, "marble.webp"), quality=86, method=6)
    # the front is the same stone, in the proportions of the face (136 x 118 mm)
    front = stone(1536, np.random.default_rng(SEED + 1)).resize((1536, 1332), Image.LANCZOS)
    engrave(front, font).save(os.path.join(out, "marble-front.webp"), quality=90, method=6)
    for n in ("marble.webp", "marble-front.webp"):
        print(n, os.path.getsize(os.path.join(out, n)) // 1024, "KB")


if __name__ == "__main__":
    main()
