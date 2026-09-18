---
layout: project
title:  "American Psycho"
date:   2010-04-01
redirect_from:
  - /projects/american-pyscho/
category: book
image_path: "/images/american-psycho/jhuff-american-psycho-"
shots: 4
description: |
    <p>Google reads our emails, builds a profile from them and uses it to select "relevant" ads. It then shows those ads beside the very emails the information came from.</p>

    <p>We sent the whole of Bret Easton Ellis' violent, gratuitous novel through Gmail, one page at a time, and collected the ads that appeared beside each email. Those ads became footnotes to the original text, page by page. In the printed, perfect-bound book, Ellis' text is erased. What remains is <em>American Psycho</em> told through its chapter titles and constellations of Google ads.</p>

    <p>We were most curious how Google would handle the violence, racism and graphic language. Sometimes the ads tracked the content. Sometimes they were out of time or out of place. In one scene, where a dog and then a man are murdered with a knife, Google supplied ads for knives and knife sharpeners. When the narrator makes a racial slur, the ads disappeared altogether. The most frequent ad of all was a coupon for Crest Whitestrips, which appeared beside the most graphic and the most mundane pages alike, with no logic to be found. The misreading echoes the hollowness at the center of advertising and consumer culture, the theme the novel explores in excess.</p>

    <p>In collaboration with Mimi Cabell.</p>
plate: "/images/plates/american-psycho.webp"
plate_w: 800
plate_h: 1078
section: studio
dark: true
---
{% for num in (1..page.shots) %}
<div class="row pj-shot">
<img src="{{ page.image_path }}{{ num }}.jpg" alt="{{ page.title }}" loading="lazy" decoding="async">
</div>
{% endfor %}
