---
layout: project
title:  "Regender: Pride & Prejudice"
date:   2026-10-24
category: book
image_path: "/images/regender/jhuff-regender-"
shots: 5
description: |
  Jane Austen's *Pride & Prejudice* in four editions: Swapped, All Female,
  All Male and Non-Binary. Each is a complete, unabridged novel, rewritten by
  [regender.xyz](https://regender.xyz). Names, honorifics, pronouns, gendered
  words, and the grammar that follows them are transformed throughout;
  Austen's sentences are otherwise untouched.

  Cover illustrations by Raman Djafari.

  Credit to Adam Lucas at Specific Ideas for the Gutenberg attribution format.
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
