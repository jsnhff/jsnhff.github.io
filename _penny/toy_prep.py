#!/usr/bin/env python3
"""The gold of the OWS Deal Toy, from the print file to something a page can load.

    pip install "numpy<2" scipy "fast-simplification==0.1.7"
    python3 toy_prep.py ~/Downloads/OWS_F_ForPrint.stl ../images/ows3d/figures.bin.gz [triangles]

The STL is the gold alone, the six figures and the plinth they stand on, a million
triangles. What a wall tile needs from it is the figures, so that is where the
triangles go:

  - The plinth's four sides carry a pitted texture, ~300,000 vertices of it, displaced
    about a millimetre. It is flattened onto the plane each side would have without it,
    and the simplifier then reduces four plain walls to a few triangles. (The pitting is
    a surface the shader can add; geometry is the wrong place for it.)
  - The plinth's underside sits on the stone and is never seen: dropped.
  - 37 shells of a few triangles each (specks from the sculpt) are dropped.
  - What is left is simplified by quadric error, which spends triangles where the form is,
    not where the noise is: faces, hands, the lettering on the signs.

The file is little-endian:  "OWS1", V, T (u32), bbox min xyz, bbox max xyz (f32), then V x 3
positions as u16 across the bbox, then T x 3 vertex indices as u32. The whole file is gzipped.
Units are the STL's, millimetres, z up, the front of the piece towards -y.
"""
import gzip
import struct
import sys
import time

import numpy as np
import scipy.sparse as sp
from scipy.sparse.csgraph import connected_components
import fast_simplification as fs


def read_stl(path):
    raw = open(path, "rb").read()
    n = struct.unpack("<I", raw[80:84])[0]
    assert 84 + n * 50 == len(raw), "not a binary STL"
    rec = np.frombuffer(raw, dtype=np.dtype([("n", "<3f4"), ("v", "<9f4"), ("a", "<u2")]), count=n, offset=84)
    tri = rec["v"].reshape(-1, 3)
    # weld: the STL repeats every vertex once per face that uses it
    key = np.round(tri.astype(np.float64) * 1e4).astype(np.int64)
    uniq, inv = np.unique(key, axis=0, return_inverse=True)
    verts = (uniq / 1e4).astype(np.float32)
    faces = inv.reshape(-1, 3).astype(np.int32)
    return verts, faces


def largest_shell(v, f):
    n = len(v)
    a = np.concatenate([f[:, 0], f[:, 1], f[:, 2]])
    b = np.concatenate([f[:, 1], f[:, 2], f[:, 0]])
    g = sp.coo_matrix((np.ones(len(a), dtype=np.int8), (a, b)), shape=(n, n))
    k, lab = connected_components(g, directed=False)
    fl = lab[f[:, 0]]
    main = np.argmax(np.bincount(fl, minlength=k))
    return f[fl == main], k


def compact(v, f):
    used = np.unique(f.ravel())
    remap = np.full(len(v), -1, np.int64)
    remap[used] = np.arange(len(used))
    return v[used], remap[f].astype(np.int32)


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def flatten_plinth(v):
    """Press the pitted band of the plinth's sides onto the planes |x| + |y| = R (the plinth is a square
    turned 45 degrees, corner to the viewer), eased in and out so its top and bottom edges stay as they were."""
    R = 44.75
    z = v[:, 2].astype(np.float64)
    r = np.abs(v[:, 0]) + np.abs(v[:, 1])
    w = smoothstep(-18.6, -17.4, z) * (1 - smoothstep(-7.0, -6.1, z)) * (r > 43.0)
    s = 1 + (R / np.maximum(r, 1e-6) - 1) * w
    v = v.copy()
    v[:, 0] *= s
    v[:, 1] *= s
    return v


def main():
    src, dst = sys.argv[1], sys.argv[2]
    target = int(sys.argv[3]) if len(sys.argv) > 3 else 200_000
    t0 = time.time()
    v, f = read_stl(src)
    print(f"read {len(f):,} triangles, {len(v):,} unique vertices")
    f, shells = largest_shell(v, f)
    v, f = compact(v, f)
    print(f"largest of {shells} shells: {len(f):,} triangles (the rest were specks)")
    v = flatten_plinth(v)
    keep = v[f].mean(1)[:, 2] > -25.0          # the underside of the plinth
    v, f = compact(v, f[keep])
    v2, f2 = fs.simplify(v, f, target_reduction=1 - target / len(f), agg=5)
    v2 = v2.astype(np.float32)
    f2 = f2.astype(np.int32)
    lo, hi = v2.min(0), v2.max(0)
    q = np.round((v2 - lo) / (hi - lo) * 65535).astype(np.uint16)
    head = b"OWS1" + struct.pack("<II", len(v2), len(f2)) + struct.pack("<6f", *lo, *hi)
    blob = head + q.astype("<u2").tobytes() + f2.astype("<u4").tobytes()
    with open(dst, "wb") as out:
        out.write(gzip.compress(blob, 9))
    z = v2[:, 2]
    figures = int((z > -6).sum())
    print(f"wrote {dst}: {len(v2):,} vertices, {len(f2):,} triangles; {100 * figures / len(v2):.0f}% of the vertices are above the sidewalk")
    print(f"raw {len(blob) / 1e6:.2f} MB, gzipped {len(gzip.compress(blob, 9)) / 1e6:.2f} MB, bbox {lo.round(1)} to {hi.round(1)}, {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
