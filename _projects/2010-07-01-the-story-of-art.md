---
layout: project
title:  "The Story of Art"
date:   2010-07-01
categories: book 
image_path: "/images/the-story-of-art/jhuff-the-story-of-art-"
description: "This project is a conflation of a common Internet error and a seminal book of the history of art that relies heavily on images. All the images in E. H. Gombrich's The Story of Art are replaced with 'broken image link' icons that typically appear on outdated web sites."
---

{% for num in (1...3) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" />
</div>
{% endfor %}
