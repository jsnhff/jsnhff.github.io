---
layout: project
title:  "work-life.tips"
date:   2015-02-01
categories: website 
image_path: "/images/work-life-tips/jhuff-work-life-tips-"
description: "Visit <a title='work-life.tips' href='http://www.work-life.tips'>work-life.tips</a>. Relax your mind and optimize your life."
---

{% for num in (1..4) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" srcset="{{ page.image_path }}{{ num }}.jpg 1x, {{ page.image_path }}{{ num }}-2x.jpg 2x"/>
</div>
{% endfor %}
