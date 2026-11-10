---
layout: project
title:  "The Story of Art"
date:   2010-07-01
category: book
image_path: "/images/the-story-of-art/jhuff-the-story-of-art-"
shots: 4
description: "Every image in E. H. Gombrich's The Story of Art, a history of art that depends on its pictures, replaced with the broken-image icon of an outdated website."
plate: "/images/plates/the-story-of-art.webp"
plate_w: 1100
plate_h: 1528
# The 3D model: the hardcover's boards, cut from the jacket PDF. The dimensions are
# the original Phaidon hardcover's, 179 x 252 x 45 mm. Rebuilt by _penny/wraps.py.
book:
  wrap: "/images/book3d/the-story-of-art-wrap.webp"
  front: "/images/book3d/the-story-of-art-front.webp"
  front_w: 600
  front_h: 845
  h: 1.4081    # 252 / 179
  d: 0.2512    # 45 / 179
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
