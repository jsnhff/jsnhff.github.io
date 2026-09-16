---
layout: project
title:  "Bad Poetry One"
date:   2026-09-15
category: book
image_path: "/images/bad-poetry-one/jhuff-bad-poetry-one-"
shots: 5
description: |
  Eleven poems about the strangeness of life now, written with a
  machine. Five synthetic critics gave notes before printing; the
  colophon says so and stops. The cover is a found sunset.
plate: "/images/plates/bad-poetry-one.webp"
plate_w: 800
plate_h: 1304
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
