---
layout: project
title:  "Endless Opportunities"
date:   2016-01-01
category: book
image_path: "/images/endless-opportunities-book/jhuff-endless-opportunities-book-"
description: |
  This is an essay about a project, and about algorithms.

  Algorithms shape the content we see. They filter the air we breathe online.
  We help design their output with our input, but the formulas are known to a
  few, and they change on schedules nobody announces.

  Before I learned any geography I wondered why the Appalachians are smooth
  and the Rockies are not. Approach the question as a child and any answer
  seems plausible — maybe they were made at the same time and one just happens
  to be softer. The answer is millions of years of rain. You cannot watch it
  happen. You stare at the mountain waiting for the tree line to shift.

  The image results are the mountain. Search the same words every day and look
  for the first thing that changes: a new picture, an outlier, one that
  quietly leaves. This book keeps fifty days of the first fifty Google image
  results for "endless opportunities", so the changes have somewhere to be
  seen. What moves is both the content of the web and the judgement of the
  algorithm. Neither is neutral.

  To most people none of this is visible. The mountain is on the horizon and
  in the background of every photograph, and nobody notices it move. Where is
  the image you liked last year? Last month? Here is a more useful and
  relevant one. Isn't that better.

  I would like people to watch the algorithms the way a shaman watches a
  mountain.
plate: "/images/plates/endless-opportunities-book.webp"
plate_w: 1200
plate_h: 1561
section: studio
dark: true
---
{% for num in (1..5) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
