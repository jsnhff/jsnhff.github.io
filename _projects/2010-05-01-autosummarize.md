---
layout: project
title:  "AutoSummarize"
date:   2010-05-01
category: book 
image_path: "/images/autosummarize/jhuff-autosummarize-"
description: |
  The top 100 most downloaded copyright free books summarized using Microsoft Word 2008’s AutoSummarize 10-sentence function and organized alphabetically. "Word has examined the document and picked the sentences most relevant to the main theme." ~ Word 2008<br>
  <a href='http://www.newyorker.com/online/blogs/books/2010/07/rise-of-the-literature-machines.html'>Mentioned in the <em>New Yorker</em></a>,
   <a href='http://therumpus.net/2010/08/autosummarize-applied-to-popular-works/'>Mentioned on <em>The Rumpus</em></a><br>
  <a href='http://www.mcnallyjackson.com/bookmachine/autosummarize-jason-huff'>Available at McNally Jackson</a>
---

{% for num in (1..5) %}
<div>
    <img class="mb3" src="{{ page.image_path }}{{ num }}.jpg" />
</div>
{% endfor %}

