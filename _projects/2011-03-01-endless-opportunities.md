---
layout: project
title:  "Endless Opportunties"
date:   2011-05-01
category: installation
image_path: "/images/endless-opportunities/jhuff-endless-opportunities-"
description: "Searching for changes in image results algorithms. Printing the results onto paper. Looping. Searching. Finding. Printing. Endless opportunities."
plate: "/images/plates/endless-opportunties.webp"
plate_w: 1302
plate_h: 854
section: studio
dark: true
---
{% for num in (1..5) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" srcset="{{ page.image_path }}{{ num }}.jpg 1x, {{ page.image_path }}{{ num }}-2x.jpg 2x" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
