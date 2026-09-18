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
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
