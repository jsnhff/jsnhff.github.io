---
layout: project
title:  "American Psycho"
date:   2010-04-01
category: book 
image_path: "/images/american-psycho/jhuff-american-psycho-"
description: |
    <p>Google reads our emails, garners information from our personal messages and uses that profiling strategy to select "relevant" ads. It then displays those ads on the screen next to the very emails from which the information was initially taken.</p>

    <p><em>American Psycho</em> was created by sending the entirety of Bret Easton Ellis' violent, masochistic and gratuitous novel American Psycho through GMail, one page at a time. We collected the ads that appeared next to each email and used them to annotate the original text, page by page. In printing it as a perfect bound book, we erased the body of Ellis' text and left only chapter titles and constellations of our added footnotes. What remains is American Psycho, told through its chapter titles and annotated relational Google ads.</p>

    <p>We were most curious how Google would handle the violence, racism and graphic language in <em>American Psycho</em>. In some instances the ads related to the content of the email, in others they were completely irrelevant, either out of time or out of place. In one scene, where first a dog and then a man are brutally murdered with a knife, Google supplied ample ads regarding knives and knife sharpeners. In another scene the ads disappeared altogether when the narrator makes a racial slur. Google's choice and use of standard ads unrelated to the content next to which they appeared offered an alternate window into how Google ads function — the ad for Crest Whitestrips Coupons appeared the highest number of times, next to both the most graphic and the most mundane sections of the book, leaving no clear logic as to how it was selected to appear. This "misreading" ultimately echoes the hollowness at the center of advertising and consumer culture, a theme explored in excess in <em>American Psycho</em>.</p>

    <p>In collaboration with <a hreff="https://www.mimicabell.com/#/american-psycho/" alt="Mimi Cabell, my friend.">Mimi Cabell</a>.</p>
---

{% for num in (1..4) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" />
</div>
{% endfor %}
