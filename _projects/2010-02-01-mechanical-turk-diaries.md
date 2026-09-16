---
layout: project
title:  "Mechanical Turk Diaries"
date:   2009-02-01
category: website
image_path: "/images/mechanical-turk-diaries/jhuff-mechanical-turk-diaries-"
# A website is best seen running, so the wall shows its plate and links
# straight out to it. The screenshots are still in /images; nothing renders
# them. Put a count back here and they return, on the wall and the page both.
shots: 0
description: "Stories from Amazon's anonymous workforce. Are crowdsourcing platforms like Amazon's Mechanical Turk as bleak as the company's shipping warehouses?"
live_url: "https://mechanicalturkdiaries.tumblr.com"
plate: "/images/plates/mechanical-turk-diaries.webp"
plate_w: 640
plate_h: 550
section: studio
dark: true
live_url: "https://mechanicalturkdiaries.tumblr.com"
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" srcset="{{ page.image_path }}{{ num }}.jpg 1x, {{ page.image_path }}{{ num }}-2x.jpg 2x" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
