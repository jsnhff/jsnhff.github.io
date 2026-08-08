---
layout: project
title:  "Best Fight Ever / Worst Fight Ever"
date:   2011-04-01
category: book
image_path: "/images/best-fight-ever/jhuff-best-fight-ever-"
plate: "/images/plates/best-fight-ever-worst-fight-ever.webp"
plate_w: 800
plate_h: 1078
description: "Two YouTube fight scenes — one from a 1993 Hong Kong martial arts film, one from a 1967 episode of <em>Star Trek</em> — cut into three-second clips and described in writing by Amazon Mechanical Turk workers. Isolated by outsourcing, the descriptions still reveal the fights as step-by-step choreographies. The book has two front covers, one on each side, and flips. 116 pages."
section: studio
dark: true
---
{%- comment -%}
  Split on a pipe: the captions carry commas.

  The Best Fight pages are printed upside down in the book, which is what a
  flip binding is; they are turned here so they read as they do in the hand.
{%- endcomment -%}
{% assign caps = "The cover flat: two front covers and a spine|Worst Fight Ever, from a 1967 episode of Star Trek|Worst Fight Ever: 9,795,566 views, 38 anonymous writers|Best Fight Ever, from a 1993 Hong Kong martial arts film|Best Fight Ever: 8,189,047 views, 65 anonymous writers" | split: "|" %}
{% for cap in caps %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ forloop.index }}.jpg" alt="{{ cap }}" loading="lazy" decoding="async">
</div>
{% endfor %}
