---
layout: page
title: News
permalink: /news/
---
<div>
{% for update in site.updates reversed %}
    <div class="">
        <p class="inline-block mid-gray mb0 caps h6">{{ update.update-type }} /</p>
        <p class="update-time inline-block mid-gray mb0 caps h6">
            <!-- Whitespace added for readability -->
            {% assign d = update.date | date: "%-d"  %}
            {{ update.date | date: "%B" }} 
            {% case d %}
              {% when '1' or '21' or '31' %}{{ d }}st,
              {% when '2' or '22' %}{{ d }}nd,
              {% when '3' or '23' %}{{ d }}rd,
              {% else %}{{ d }}th,
              {% endcase %} 
            {{ update.date | date: "%Y" }}
        </p>
        {{ update.content }}
    </div>
{% endfor %}
</div>
