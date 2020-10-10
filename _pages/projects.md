---
layout: default
title: Projects
permalink: /projects/
---

<h5 class="mb0"><a href="/" alt="Go home.">&larr; Head back to the homepage</a></h5>
<h1 class="mt1 mb4">A selection of my projects by category.</h1>

<h2 class="h3 col-12">Books</h2>
<div class="flex flex-wrap mxn2 p1 mt2">
    {% for project in site.projects reversed %}
		{% if project.category == "book" %}
			<div class="flex col-6 sm-col-4 md-col-4 lg-col-3 p1">
				<div class="">
					<a href="{{ project.url | prepend: site.baseurl }}"><img src="{{ project.image_path }}thumb.jpg" srcset="{{ project.image_path }}thumb.jpg 1x, {{ project.image_path }}thumb-2x.jpg 2x" class="full-width bw-filter"></a>
				</div>
			  </div>
		{% endif %}
    {% endfor %}
</div>

<h2 class="h3 col-12">Diagrams</h2>
<div class="flex flex-wrap mxn2 p1 mt2">
    {% for project in site.projects reversed %}
		{% if project.category == "diagrams" %}
			<div class="flex col-6 sm-col-4 md-col-4 lg-col-3 p1">
				<div class="">
					<a href="{{ project.url | prepend: site.baseurl }}"><img src="{{ project.image_path }}thumb.jpg" srcset="{{ project.image_path }}thumb.jpg 1x, {{ project.image_path }}thumb-2x.jpg 2x" class="full-width bw-filter"></a>
				</div>
			  </div>
		{% endif %}
    {% endfor %}
</div>

<h2 class="h3 col-12">Websites</h2>
<div class="flex flex-wrap mxn2 p1 mt2">
    {% for project in site.projects reversed %}
		{% if project.category == "website" %}
			<div class="flex col-6 sm-col-4 md-col-4 lg-col-3 p1">
				<div class="">
					<a href="{{ project.url | prepend: site.baseurl }}"><img src="{{ project.image_path }}thumb.jpg" srcset="{{ project.image_path }}thumb.jpg 1x, {{ project.image_path }}thumb-2x.jpg 2x" class="full-width bw-filter"></a>
				</div>
			  </div>
		{% endif %}
    {% endfor %}
</div>

<h2 class="h3 col-12">Misc.</h2>
<div class="flex flex-wrap mxn2 p1 mt2">
    {% for project in site.projects reversed %}
		{% if project.category != "book" and project.category != "diagrams" and project.category != "website" %}
			<div class="flex col-6 sm-col-4 md-col-4 lg-col-3 p1">
				<div class="">
					<a href="{{ project.url | prepend: site.baseurl }}"><img src="{{ project.image_path }}thumb.jpg" srcset="{{ project.image_path }}thumb.jpg 1x, {{ project.image_path }}thumb-2x.jpg 2x" class="full-width bw-filter"></a>
				</div>
			  </div>
		{% endif %}
    {% endfor %}
</div>
