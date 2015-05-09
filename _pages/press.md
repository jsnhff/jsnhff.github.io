---
layout: page
title: News
permalink: /news/
---
<div>
{% for update in site.updates reversed %}
    <div class="">
        <p class="inline-block mid-gray mb0 caps h6">{{ update.update-type }} /</p>
        <p class="update-time inline-block mid-gray mb0 caps h6">{{ update.date | date: "%B %-d, %Y" }}</p>
        {{ update.content }}
    </div>
{% endfor %}
</div>
