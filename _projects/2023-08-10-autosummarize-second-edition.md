---
layout: project
title:  "AutoSummarize, Second Edition"
date:   2023-08-10
category: book
image_path: "/images/autosummarize-second-edition/jhuff-autosummarize-second-edition-"
shots: 3
description: |
  A new edition of the 2010 book, published by Specific Ideas and
  designed by Adam Swift Lucas: foreword by ChatGPT, barcode by DALL·E,
  silver foil stamp, an edition of 100. It launched at Printed Matter's
  Los Angeles Art Book Fair in 2023. Working with Adam on it was a joy.
plate: "/images/plates/autosummarize-second-edition.webp"
plate_w: 800
plate_h: 533
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
