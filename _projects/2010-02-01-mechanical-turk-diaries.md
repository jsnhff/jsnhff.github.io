---
layout: project
title:  "Mechanical Turk Diaries"
date:   2009 — Ongoing
categories: website 
image_path: "/images/mechanical-turk-diaries/jhuff-mechanical-turk-diaries-"
description: "<a title='The Mechanical Turk Diaries' href='http://themechanicalturkdiaries.com/'>Stories from Amazon's Anonymous Workforce</a>. Are crowdsourcing platforms like Amazon's Mechanical Turk as bleak as the company's shipping warehouses? Read my essay for The New Inquiry, <a title='Serf Boards' href='http://thenewinquiry.com/essays/serf-boards/''>Serf Boards</a>, to find out more about this project."
---

{% for num in (1...5) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" srcset="{{ page.image_path }}{{ num }}.jpg 1x, {{ page.image_path }}{{ num }}-2x.jpg 2x"/>
</div>
{% endfor %}
