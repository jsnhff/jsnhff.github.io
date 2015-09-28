---
layout: project
title:  "Are We Not Drawn Onward to New Era"
date:   2010-03-01
categories: prints 
image_path: "/images/are-we-not-drawn-onward-to-new-era/jhuff-are-we-not-drawn-onward-to-new-era-"
description: "The language of digitally mediated images is code. Code constructs the images we see and by altering the code we alter the image's stability and meaning. This series of TIFFs searches for code that works as a palindrome challenging the blurring boundary between human language and it's digital mediated manifestations. Images are show side by side: original vs. palindrome."
---

{% for num in (1...12) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" />
</div>
{% endfor %}
