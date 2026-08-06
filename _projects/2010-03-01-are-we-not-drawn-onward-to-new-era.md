---
layout: project
title:  "Are We Not Drawn Onward to New Era"
date:   2010-03-01
category: prints
image_path: "/images/are-we-not-drawn-onward-to-new-era/jhuff-are-we-not-drawn-onward-to-new-era-"
description: "The language of digitally mediated images is code. Code constructs the images we see and by altering the code we alter the image's stability and meaning. This series of TIFFs searches for code that works as a palindrome challenging the blurring boundary between human language and it's digital mediated manifestations. Images are side by side: original vs. palindrome."
plate: "/images/plates/are-we-not-drawn-onward-to-new-era.webp"
plate_w: 625
plate_h: 203
section: studio
dark: true
---
{% for num in (1..12) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
