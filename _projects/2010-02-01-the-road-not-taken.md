---
layout: project
title:  "The Road Not Taken"
date:   2010-02-01
category: book
image_path: "/images/the-road-not-taken/jhuff-the-road-not-taken-"
description: "This project takes Robert Frost's seminal 1916 poem, The Road Not Taken, and recodes it five times through Google's autocomplete search function. As technology automates suggestions and routes data algorithmically, our decisions about the information we navigate to becomes increasingly important. 

Printed in a limited edition of 50."
plate: "/images/plates/the-road-not-taken.webp"
plate_w: 800
plate_h: 1078
section: studio
dark: true
---
{%- comment -%}
  1 the book, 2 Frost's poem as printed, 3 and 4 the first and last of the five
  recodings, 5 the appendix: every autocomplete capture the book was built from.
{%- endcomment -%}
{%- comment -%} Split on a pipe: the captions carry commas of their own. {%- endcomment -%}
{% assign shots = "The book|The poem as Frost wrote it|The first recoding — Thesaurus Roadrunner Notre Dame Taken|The fifth recoding — The Road Not Taken for Granted|The appendix: Google's autocomplete suggestions, captured in 2010" | split: "|" %}
{% for shot in shots %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ forloop.index }}.jpg" alt="{{ shot }}" loading="lazy" decoding="async">
</div>
{% endfor %}
