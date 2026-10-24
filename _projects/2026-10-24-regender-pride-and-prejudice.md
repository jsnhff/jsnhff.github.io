---
layout: project
title:  "Regender: Pride & Prejudice"
date:   2026-10-24
category: book
image_path: "/images/regender/jhuff-regender-"
shots: 4
description: |
  Jane Austen's *Pride & Prejudice* in four editions, each with every
  character's gender rewritten: Swapped, All Female, All Male and Non-Binary.
  Names, pronouns and titles change, and the grammar follows.

  The editions, and the tool that makes them, are at
  [regender.xyz](https://regender.xyz).
plate: "/images/plates/regender-pride-and-prejudice.webp"
plate_w: 1400
plate_h: 1050
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
