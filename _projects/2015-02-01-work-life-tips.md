---
layout: project
title:  "work-life.tips"
date:   2015-02-01
category: website
image_path: "/images/work-life-tips/jhuff-work-life-tips-"
description: "Visit <a title='work-life.tips' href='http://www.work-life.tips'>work-life.tips</a>. Relax your mind and optimize your life."
plate: "/images/plates/work-life-tips.webp"
plate_w: 640
plate_h: 550
section: studio
dark: true
live_url: "http://www.work-life.tips"
---
{% for num in (1..4) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" srcset="{{ page.image_path }}{{ num }}.jpg 1x, {{ page.image_path }}{{ num }}-2x.jpg 2x" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
