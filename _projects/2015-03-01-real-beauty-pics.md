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
# The 3D browser: a loop of the site itself, recorded by _penny/loops.mjs, in a
# window of the same proportions as the plate. Rebuilt by `node loops.mjs real-beauty-pics`.
browser:
  video: "/images/browser3d/real-beauty-pics.mp4"
  chrome: "/images/browser3d/real-beauty-pics-chrome.webp"
  poster: "/images/browser3d/real-beauty-pics-poster.webp"
  front: "/images/browser3d/real-beauty-pics-front.webp"
  front_w: 1280
  front_h: 856
  h: 0.66875   # 856 / 1280: the bar of chrome (56) over the screen (800)
  d: 0.022
  fit: 0.7       # camera in closer than a book's, so a wide window fills its tile
section: studio
dark: true
live_url: "http://www.real-beauty.pics"
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
