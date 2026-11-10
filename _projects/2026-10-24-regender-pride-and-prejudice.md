---
layout: project
title:  "Regender: Pride & Prejudice"
date:   2026-10-24
category: book
image_path: "/images/regender/jhuff-regender-"
shots: 8
description: |
  Jane Austen's 1813 novel in four editions: Swapped, All Female, All Male and
  Non-Binary. In Swapped, shown here, every character's gender is reversed. The
  men become women, the women become men, and the marriage plot runs its
  course with the roles exchanged.

  Rewritten by [regender.xyz](https://regender.xyz). Names, honorifics,
  pronouns, gendered words, and the grammar that follows them are transformed
  throughout; Austen's sentences are otherwise untouched.

  Illustration: [Raman Djafari](https://ramandjafari.com/)  
  Design: [Matthew Bucknall](https://www.matthewbucknall.com)  
  Engineering: William Barnes  
  Type: [*BBB Baskervvol*](https://typo-inclusive.net/inventaire/bbb-baskervvol/) and [*BBB Herthey Futural*](https://typo-inclusive.net/inventaire/bbb-herthey-futural/) ([Bye Bye Binary](https://typotheque.byebyebinary.space); Clara Sambot, Laure Giletti), [*PicNic*](https://typo-inclusive.net/inventaire/picnic/) (Mariel Nils)  
  Text: Transformed by claude-opus-4-5-20251101, September 13, 2026  
  Format: 4.25 × 6.875 in · perfect bound, printed on demand
plate: "/images/plates/regender-pride-and-prejudice.webp"
plate_w: 1100
plate_h: 1779
# The 3D model: the Swapped edition's wrap, the same one the product page turns.
# 4.25 x 6.875 in, 586 pages, perfect bound. Rebuilt by _penny/wraps.py.
book:
  wrap: "/images/book3d/regender-pride-and-prejudice-wrap.webp"
  front: "/images/book3d/regender-pride-and-prejudice-front.webp"
  front_w: 600
  front_h: 971
  h: 1.6176    # 6.875 / 4.25
  d: 0.3235    # spine / width
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
