---
layout: project
title:  "Are We Not Drawn Onward to New Era"
date:   2010-03-01
category: prints
image_path: "/images/are-we-not-drawn-onward-to-new-era/jhuff-are-we-not-drawn-onward-to-new-era-"
shots: 12
# The plate is this shot re-encoded, so the wall does not show it twice.
plate_shot: 1
description: "Digital images are made of code, and altering the code alters the image's stability and meaning. This series of TIFFs searches for code that reads as a palindrome, working the boundary between human language and its digital form. Each pair is shown side by side: original and palindrome."
plate: "/images/plates/are-we-not-drawn-onward-to-new-era.webp"
plate_w: 625
plate_h: 203
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
