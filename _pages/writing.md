---
layout: page
title: Writing
permalink: /writing/
exclude: true
---

{% for post in site.posts %}
<div class="">
        <div class="flex flex-center mb2">
            <a class="flex-none mr2 sm-show" href="{{ post.url | prepend: site.baseurl }}"><img src="{{ post.thumbnail }}" width="200" height="200"></a>
            <div class="flex-auto">
                <p class="mid-gray mb0 caps h6">{{ post.date | date: "%b %-d, %Y" }}</p>
                <a class="" href="{{ post.url | prepend: site.baseurl }}"><h3 class="mt0">{{ post.title }}</h3></a>
                {{ post.excerpt | strip_html | truncatewords:45 }}
            </div>
        </div>
</div>
{% endfor %}
