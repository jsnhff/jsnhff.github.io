---
layout: project
title:  "real-beauty.pics"
date:   2015-03-01
category: website
image_path: "/images/real-beauty-pics/jhuff-real-beauty-pics-"
# A website is best seen running, so the wall shows its plate and links
# straight out to it. The screenshots are still in /images; nothing renders
# them. Put a count back here and they return, on the wall and the page both.
shots: 0
description: "A persistent Google image search for \"beauty\", in hope of finding something different. A response to Joanne McNeil's essay Google Beauty."
live_url: "http://www.real-beauty.pics"
plate: "/images/plates/real-beauty-pics.webp"
plate_w: 640
plate_h: 550
section: studio
dark: true
live_url: "http://www.real-beauty.pics"
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
