---
layout: project
title:  "OWS 10th Anniversary Deal Toy"
date:   2020-01-01
category: sculpture
image_path: "/images/ows-deal-toy/jhuff-ows-deal-toy-"
video: "/images/ows-deal-toy/jhuff-ows-deal-toy.mp4"
video_poster: "/images/ows-deal-toy/jhuff-ows-deal-toy-poster.jpg"
description: |
  A speculative object in the style of a twentieth-century banker's deal toy:
  six Occupy Wall Street protesters setting off from the corner of Broadway and
  Liberty Street, beside Zuccotti Park, in gold under glass on a marble base cut
  with the date of Occupy's tenth anniversary.

  It had been ten years since I was walking through Zuccotti Park, meeting
  people and watching the general assemblies and the talks at the makeshift
  library organizers had set up on the corner. Income inequality had only
  increased. I wanted to use the visual language of Wall Street deal toys to
  make a commemorative object for a movement the people who commission those
  toys had defeated, and to have it exist inside a new form of speculative
  capitalism — a digital memento trying to subvert the triumph of wealth over
  equity.

  The figures come out of photo research on the people in and around the park,
  the hand-painted signs, the accessories, the outfits, the corners they stood
  on. The rest comes from the design patterns of the deal toys themselves, and
  from working in the graphics department of a real estate investment bank
  during the 2008 crash.

  Modelled with Peter Valkanoff. All proceeds were assigned to W.A.G.E.,
  Working Artists and the Greater Economy, and I set up the account for them to
  receive them.
plate: "/images/plates/ows-deal-toy.webp"
plate_w: 1000
plate_h: 1679
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
<img src="{{ page.image_path }}2.jpg" alt="{{ page.title }}, detail" loading="lazy" decoding="async">
</div>
