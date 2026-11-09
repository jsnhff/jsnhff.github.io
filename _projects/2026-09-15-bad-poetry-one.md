---
layout: project
title:  "Bad Poetry One"
date:   2026-09-15
category: book
image_path: "/images/bad-poetry-one/jhuff-bad-poetry-one-"
shots: 5
description: |
  Eleven poems about the strangeness of life now. The author directed,
  cut, and revised drafts with Claude Opus 5 to create this collection.
  The cover is a found sunset.
plate: "/images/plates/bad-poetry-one.webp"
plate_w: 800
plate_h: 1304
# The 3D model: the press cover. 4.25 x 6.875 in, saddle-stitched, 20 pages, so
# about 0.05 in deep. Rebuilt by _penny/wraps.py.
book:
  wrap: "/images/book3d/bad-poetry-one-wrap.webp"
  front: "/images/book3d/bad-poetry-one-front.webp"
  front_w: 600
  front_h: 971
  h: 1.6176    # 6.875 / 4.25
  d: 0.0118    # 0.05 / 4.25
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
