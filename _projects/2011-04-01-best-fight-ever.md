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
description: "Two YouTube fight scenes — one from a 1993 Hong Kong martial arts film, one from a 1967 episode of <em>Star Trek</em> — cut into three-second clips and described in writing by Amazon Mechanical Turk workers. Isolated by outsourcing, the descriptions still reveal the fights as step-by-step choreographies. The book has two front covers, one on each side, and flips. 116 pages."
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
