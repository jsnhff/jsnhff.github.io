---
layout: project
title:  "Regender: Pride & Prejudice"
date:   2026-10-24
category: book
image_path: "/images/regender/jhuff-regender-"
shots: 8
description: |
  [regender.xyz](https://regender.xyz) is free and open source software I
  created that changes the gender and name of every character in a public
  domain book. It's also a set of print on demand books.

  The first set is Jane Austen's *Pride and Prejudice* (1813) in four
  versions: [swapped](https://regender.xyz/products/pride-prejudice-swapped),
  [all male](https://regender.xyz/products/pride-prejudice-all-male),
  [all female](https://regender.xyz/products/pride-prejudice-all-female) and
  [nonbinary](https://regender.xyz/products/pride-prejudice-non-binary). In the
  swapped edition, shown here, the men become women, the women become men,
  and the marriage plot runs its course with the roles exchanged. The books
  launched at the Cleveland Art Book Fair in October 2026.

  I first tried to make this in 2015. Find and replace broke on the first
  "her," which can mean "him" or "his." Now a language model reads each
  passage in context and works out who every "he," "her" and "they" belongs
  to. You can use Claude, an OpenAI model or an open model running on your
  own computer. This edition used Claude. A set of fixed rules goes over the
  result to catch what the model missed, and a quality check reads every
  chapter.

  Everything else in Austen's sentences stays as she wrote it. When only the
  gender moves, you can see what the story was asking gender to do.

  Illustration: [Raman Djafari](https://ramandjafari.com/)  
  Design: [Matthew Bucknall](https://www.matthewbucknall.com)  
  Engineering: William Barnes  
  Code: [regender.xyz on GitHub](https://github.com/jsnhff/regender-xyz)  
  Type: [*BBB Baskervvol*](https://typo-inclusive.net/inventaire/bbb-baskervvol/) and [*BBB Herthey Futural*](https://typo-inclusive.net/inventaire/bbb-herthey-futural/) ([Bye Bye Binary](https://typotheque.byebyebinary.space); Clara Sambot, Laure Giletti), [*PicNic*](https://typo-inclusive.net/inventaire/picnic/) (Mariel Nils)  
  Text: Jane Austen, 1813. Transformed with regender.xyz and claude-opus-4-5-20251101, September 13, 2026  
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
