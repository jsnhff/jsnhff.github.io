---
layout: project
title:  "Endless Opportunities"
date:   2014-01-01
category: book
image_path: "/images/endless-opportunities-book/jhuff-endless-opportunities-book-"
plate: "/images/plates/endless-opportunities-book.webp"
plate_w: 1200
plate_h: 1553
section: studio
dark: true
---
{% for num in (1..1) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
