---
layout: project
title:  "Bad Poetry One"
date:   2026-09-15
category: book
image_path: "/images/bad-poetry-one/jhuff-bad-poetry-one-"
shots: 5
description: |
  Eleven machine-written poems about the model out in the world:
  datacenters, warehouses, moderation queues, the physical bill for the
  magic. Five synthetic critics read the poems and gave notes before
  printing; the colophon says so and stops. The cover is a found sunset,
  credited in full — the series device is that every volume's cover is
  one. Set in Bye Bye Binary's post-binary faces, BBB Open Sans and
  EnclavAcadam. Pocketbook, saddle stitch, printed on demand. The first
  volume of an ongoing series from Internet Clubhouse.
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
