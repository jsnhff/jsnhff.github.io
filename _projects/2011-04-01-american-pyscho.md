---
layout: project
title:  "American Psycho"
date:   2011-04-01
categories: website 
image_path: "/images/american-psycho/jhuff-american-psycho-"
description: "This book was made by sending the entire text of Bret Easton Ellis' American Psycho between two GMail accounts page by page. We saved the relational ads for each page and added them back into the text as footnotes. In total, we collected over 800 relevant ads for the book. The constellations of footnoted ads throughout these pages retell the story of American Psycho in absence of the original text. This retelling reveals GMail's unpredictable insensitivity to violence, racism, and sex. It serves as a blurry portrait of an algorithm that exists in our everyday communication simultaneously forming a new portrait of the lead character, Patrick Bateman.
<a title='Available at TRAUMAWEIN Publishing' href='http://traumawien.at/prints/american-psycho/'>Available at TRAUMAWEIN Publishing</a>"
---

{% for num in (1...4) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" />
</div>
{% endfor %}
