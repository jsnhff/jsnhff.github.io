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
{% for num in (1..1) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
