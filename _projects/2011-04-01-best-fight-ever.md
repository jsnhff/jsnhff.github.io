---
layout: project
title:  "Best Fight Ever / Worst Fight Ever"
date:   2011-04-01
category: book
image_path: "/images/best-fight-ever/jhuff-best-fight-ever-"
shots: 4
plate: "/images/plates/best-fight-ever-worst-fight-ever.webp"
plate_w: 800
plate_h: 1078
description: "Two YouTube fight scenes, one from a 1993 Hong Kong martial arts film and one from a 1967 episode of <em>Star Trek</em>, cut into three-second clips and described in writing by Amazon Mechanical Turk workers. Written in isolation, the descriptions still add up to step-by-step choreographies. The book has two front covers and flips. 116 pages."
# The 3D model: the Lulu press cover, 4.25 x 6.875 in, 116 pages, spine 0.261 in
# (the press page is 9.011 x 7.125 in: trim, bleed, and what lies between).
# Rebuilt by _penny/wraps.py.
book:
  wrap: "/images/book3d/best-fight-ever-wrap.webp"
  front: "/images/book3d/best-fight-ever-front.webp"
  front_w: 600
  front_h: 970
  h: 1.6176    # 6.875 / 4.25
  d: 0.0614    # 0.261 / 4.25
section: studio
dark: true
---
{%- comment -%}
  Split on a pipe: the captions carry commas.

  These are the press files themselves: the cover flat, then facing pages
  joined at the gutter. The upside-down page stays upside down, because
  that is what a flip binding looks like when you reach the middle.
{%- endcomment -%}
{% assign caps = "The cover flat: two front covers and a spine|Worst Fight Ever, from a 1967 episode of Star Trek|Worst Fight Ever: 9,795,566 views, 38 anonymous writers|The flip point, where Best Fight Ever arrives upside down" | split: "|" %}
{% for cap in caps %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ forloop.index }}.jpg" alt="{{ cap }}" loading="lazy" decoding="async">
</div>
{% endfor %}
