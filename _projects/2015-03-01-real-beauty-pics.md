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
description: "Visit <a title='real-beauty.pics' href='http://www.real-beauty.pics'>real-beauty.pics</a> to see a persistent Google image search for \"beauty\" in hope of finding something different. This is a response to <a title='Joanne McNeil' ahref='http://www.joannemcneil.com'>Joanne McNeil's</a> essay on <a title='Google Beauty' href='https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=1&cad=rja&uact=8&ved=0CCIQFjAA&url=https%3A%2F%2Fmedium.com%2Fmessage%2Fgoogle-beauty-f73d7bf4e51b&ei=bQFFVbCUEsKhgwTXh4CgBw&usg=AFQjCNH6oyWZHFBp2-K_uMaTpMlUxqqkaw&sig2=wCuBxMtYM9kJDIHN2wkr8w&bvm=bv.92291466,d.eXY'>Google Beauty</a>."
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
