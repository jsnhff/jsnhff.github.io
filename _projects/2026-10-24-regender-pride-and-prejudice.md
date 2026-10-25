---
layout: project
title:  "Regender: Pride & Prejudice"
date:   2026-10-24
category: book
image_path: "/images/regender/jhuff-regender-"
shots: 3
description: |
  Jane Austen's 1813 novel in four editions: Swapped, All Female, All Male and
  Non-Binary. In Swapped, shown here, every character's gender is reversed. The
  men become women, the women become men, and the marriage plot runs its
  course with the roles exchanged.

  Rewritten by [regender.xyz](https://regender.xyz). Names, honorifics,
  pronouns, gendered words, and the grammar that follows them are transformed
  throughout; Austen's sentences are otherwise untouched.

  illustration: [Raman Djafari](https://ramandjafari.com/)  
  design: [Matthew Bucknall](https://www.matthewbucknall.com)  
  engineering: William Barnes  
  type: *BBB Baskervvol* and *BBB Herthey Futural* ([Bye Bye Binary](https://typotheque.byebyebinary.space); Clara Sambot, Laure Giletti), *PicNic* (Mariel Nils)  
  text: Transformed by claude-opus-4-5-20251101, September 13, 2026  
  format: 4.25 × 6.875 in · perfect bound, printed on demand

  © Jason Huff, Los Angeles, 2026
plate: "/images/plates/regender-pride-and-prejudice.webp"
plate_w: 1100
plate_h: 1779
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
