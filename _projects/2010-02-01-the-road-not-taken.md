---
layout: project
title:  "The Road Not Taken"
date:   2010-02-01
categories: website 
image_path: "/images/the-road-not-taken/jhuff-the-road-not-taken-"
description: "This project takes Robert Frost's seminal 1916 poem, The Road Not Taken, and recodes it five times through Google's autocomplete search function. As technology automates suggestions and routes data algorithmically, our decisions about the information we navigate to becomes increasingly important. 

Printed in a limited edition of 50."
---

{% for num in (1..1) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" />
</div>
{% endfor %}

