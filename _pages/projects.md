---
layout: default
title: Projects
permalink: /projects/
exclude: true
---

<div class="flex flex-wrap mxn2 p1 mt2">
    {% for project in site.projects reversed %}
    <div class="flex col-6 sm-col-4 md-col-4 lg-col-3 p1">
        <div class="full-width">
            <a href="{{ project.url | prepend: site.baseurl }}"><img src="{{ project.image_path }}thumb.jpg" srcset="{{ project.image_path }}thumb.jpg 1x, {{ project.image_path }}thumb-2x.jpg 2x" class="full-width"></a>
        </div>
      </div>
    {% endfor %}
</div>
