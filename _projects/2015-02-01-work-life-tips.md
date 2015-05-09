---
layout: project
title:  "work-life.tips"
date:   2015-02-01
categories: website 
image_path: "/images/work-life-tips/jhuff-work-life-tips-"
description: "Visit <a title='work-life.tips' href='http://www.work-life.tips'>work-life.tips</a>. Relax your mind and optimize your life."
---

{% for num in (1...4) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" />
</div>
{% endfor %}
