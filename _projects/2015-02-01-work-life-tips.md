---
layout: project
title:  "work-life.tips"
date:   2015-02-01
category: website
image_path: "/images/work-life-tips/jhuff-work-life-tips-"
# A website is best seen running, so the wall shows its plate and links
# straight out to it. The screenshots are still in /images; nothing renders
# them. Put a count back here and they return, on the wall and the page both.
shots: 0
description: "Relax your mind and optimize your life."
live_url: "http://www.work-life.tips"
plate: "/images/plates/work-life-tips.webp"
plate_w: 640
plate_h: 550
# The 3D browser: a loop of the site itself, recorded by _penny/loops.mjs, in a
# window of the same proportions as the plate. Rebuilt by `node loops.mjs work-life-tips`.
browser:
  video: "/images/browser3d/work-life-tips.mp4"
  chrome: "/images/browser3d/work-life-tips-chrome.webp"
  poster: "/images/browser3d/work-life-tips-poster.webp"
  front: "/images/browser3d/work-life-tips-front.webp"
  front_w: 1280
  front_h: 880
  h: 0.6875    # 880 / 1280: the bar of chrome (80) over the screen (800)
  d: 0.03
  fit: 0.7       # camera in closer than a book's, so a wide window fills its tile
section: studio
dark: true
live_url: "http://www.work-life.tips"
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" srcset="{{ page.image_path }}{{ num }}.jpg 1x, {{ page.image_path }}{{ num }}-2x.jpg 2x" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
