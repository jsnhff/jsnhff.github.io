---
layout: project
title:  "AutoSummarize"
date:   2010-05-01
category: book
image_path: "/images/autosummarize/jhuff-autosummarize-"
shots: 3
description: |
  The hundred most downloaded copyright-free books, each reduced to ten sentences by Microsoft Word 2008’s AutoSummarize function and arranged alphabetically. "Word has examined the document and picked the sentences most relevant to the main theme." ~ Word 2008

plate: "/images/plates/autosummarize.webp"
plate_w: 800
plate_h: 1078
# The 3D model: the press cover. Trim 14.5 x 22 cm (5.709 x 8.661 in). The press
# page is a casewrap with an even margin all round, which leaves a 0.243 in spine;
# the printed frames fall at the centres of the boards, which bears it out.
# Rebuilt by _penny/wraps.py.
book:
  wrap: "/images/book3d/autosummarize-wrap.webp"
  front: "/images/book3d/autosummarize-front.webp"
  front_w: 600
  front_h: 910
  h: 1.5171    # 8.661 / 5.709
  d: 0.0426    # 0.243 / 5.709
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
