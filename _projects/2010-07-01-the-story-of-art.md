---
layout: project
title:  "The Story of Art"
date:   2010-07-01
category: book
image_path: "/images/the-story-of-art/jhuff-the-story-of-art-"
description: "This project is a conflation of a common Internet error and a seminal book of the history of art that relies heavily on images. All the images in E. H. Gombrich's The Story of Art are replaced with 'broken image link' icons that typically appear on outdated web sites."
plate: "/images/plates/the-story-of-art.webp"
plate_w: 760
plate_h: 1024
section: studio
dark: true
---
{% for num in (1..3) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
