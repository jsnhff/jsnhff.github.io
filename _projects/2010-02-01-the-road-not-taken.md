---
layout: project
title:  "The Road Not Taken"
date:   2010-02-01
category: book
image_path: "/images/the-road-not-taken/jhuff-the-road-not-taken-"
shots: 4
description: "Robert Frost's 1916 poem, recoded five times through Google's autocomplete. As suggestion is automated and data routed by algorithm, the choice of what to navigate to matters more. Printed in an edition of 50."
plate: "/images/plates/the-road-not-taken.webp"
plate_w: 800
plate_h: 1078
section: studio
dark: true
---
{%- comment -%}
  1 the cover flat from the press file, 2 the colophon and contents,
  3 two recodings facing each other, 4 the appendix: the autocomplete
  captures the book was built from.
{%- endcomment -%}
{%- comment -%} Split on a pipe: the captions carry commas of their own. {%- endcomment -%}
{% assign shots = "The cover flat: Frost's woods, pixelated, with a search bar|The colophon and the contents: five recodings|Two of the recodings, facing|The appendix: Google's autocomplete suggestions, captured in 2010" | split: "|" %}
{% for shot in shots %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ forloop.index }}.jpg" alt="{{ shot }}" loading="lazy" decoding="async">
</div>
{% endfor %}
