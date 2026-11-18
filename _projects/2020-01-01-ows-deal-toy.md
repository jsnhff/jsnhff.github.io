---
layout: project
title:  "OWS 10th Anniversary Deal Toy"
date:   2020-01-01
category: sculpture
image_path: "/images/ows-deal-toy/jhuff-ows-deal-toy-"
# The plate is shot 1 recropped around the object, so the wall does not
# show the same view twice.
shots: 6
plate_shot: 1
video: "/images/ows-deal-toy/jhuff-ows-deal-toy.mp4"
video_poster: "/images/ows-deal-toy/jhuff-ows-deal-toy-poster.jpg"
description: |
  A speculative object in the style of a twentieth-century banker's deal toy:
  six Occupy Wall Street protesters setting off from the corner of Broadway and
  Liberty Street, beside Zuccotti Park. Gold under glass, on a marble base cut
  with the date of Occupy's tenth anniversary.

  Ten years on, income inequality had widened. The work takes the visual
  language of the deal toy, the desk ornament a bank commissions to mark a
  deal, and gives it to the movement those deals defeated. It was issued as a
  digital edition.

  The figures come from photo research on the people in and around the park:
  the hand-painted signs, the accessories, the outfits, the corners they stood
  on. The form comes from the deal toys themselves, and from working in the
  graphics department of a real estate investment bank during the 2008 crash.

  Modelled with Peter Valkanoff. All proceeds assigned to W.A.G.E., Working
  Artists and the Greater Economy.
plate: "/images/plates/ows-deal-toy.webp"
plate_w: 1000
plate_h: 1690
# On the wall the piece turns, as it was made to: one full turn of the
# 360 video, cut close around the object, muted and looping. The 3D model
# below is set aside for now.
plate_video: "/images/plates/ows-deal-toy-loop.mp4"
plate_video_poster: "/images/plates/ows-deal-toy-loop.webp"
plate_video_w: 540
plate_video_h: 900
# # The 3D object on the wall: the gold from the print file (_penny/toy_prep.py, 200,000 triangles, nearly all of
# # them on the figures), the marble and its engraving (_penny/toy_marble.py), and a still of it face on.
# # 136 mm wide, 230 mm tall, 136 mm deep; the figures are in clear acrylic on a block of black Nero Marquina.
# toy:
#   model: "/images/ows3d/figures.bin.gz"
#   marble: "/images/ows3d/marble.webp"
#   engraving: "/images/ows3d/marble-front.webp"
#   front: "/images/ows3d/front.webp"
#   front_w: 900
#   front_h: 1522
#   h: 1.6912    # 230 / 136
#   d: 1.0       # 136 / 136
section: studio
dark: true
---
<div class="row pj-shot">
<img src="{{ page.image_path }}1.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>

{%- comment -%}
  The piece was made to turn — it was listed as a looping 360. Muted and
  inline so a phone will actually play it, and paused for anyone who has asked
  the system for less motion (js/site.js).
{%- endcomment -%}
<div class="row pj-video">
<video src="{{ page.video }}" poster="{{ page.video_poster }}"
       width="1200" height="1200" preload="metadata"
       autoplay muted loop playsinline
       aria-label="{{ page.title }}, turning"></video>
</div>

<div class="row pj-shot">
<img src="{{ page.image_path }}2.jpg" alt="{{ page.title }}, the six figures" loading="lazy" decoding="async">
</div>

<div class="row pj-shot">
<img src="{{ page.image_path }}3.jpg" alt="{{ page.title }}, the cut base" loading="lazy" decoding="async">
</div>

<div class="row pj-shot">
<img src="{{ page.image_path }}4.jpg" alt="{{ page.title }}, three-quarter view" loading="lazy" decoding="async">
</div>

<div class="row pj-shot">
<img src="{{ page.image_path }}5.jpg" alt="{{ page.title }}, the figures in the glass" loading="lazy" decoding="async">
</div>

<div class="row pj-shot">
<img src="{{ page.image_path }}6.jpg" alt="{{ page.title }}, from behind" loading="lazy" decoding="async">
</div>
