---
layout: project
title:  "AutoSummarize"
date:   2010-05-01
category: book
image_path: "/images/autosummarize/jhuff-autosummarize-"
shots: 6
description: |
  The top 100 most downloaded copyright free books summarized using Microsoft Word 2008’s AutoSummarize 10-sentence function and organized alphabetically. "Word has examined the document and picked the sentences most relevant to the main theme." ~ Word 2008

  In 2023 Specific Ideas published a second edition, designed by Adam Swift Lucas: foreword by ChatGPT, barcode by DALL·E, silver foil, an edition of 100. It launched at Printed Matter’s Los Angeles Art Book Fair. Working with Adam on it was a joy.
plate: "/images/plates/autosummarize.webp"
plate_w: 800
plate_h: 1078
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
