/* ---------------------------------------------------------------
   bio.data.js — the entire bio lives here. Edit this file, nothing else.

   A paragraph is a list of nodes. A node is one of:

     "plain text"
     { w:"phrase", m:"glyph", add:[ ...nodes ] }   a chip: opens in place
     { l:"label",  h:"https://..." }                a link: leaves the page

   RULES, learned the hard way:

   1. Every `add` must read as a grammatical continuation of the phrase
      before it. Read the sentence closed, then open. Both must work.
      Run `node proof.js` to print both states.

   2. Put chips at the END of a sentence, not mid-list. A long reveal
      inserted mid-clause separates a subject from its verb by a
      paragraph. Where several chips are siblings, give each its own
      short sentence ("The first was X. Then Y. Then Z.") so any one
      can open without shoving the others down the page.

   3. A link's label must be the noun the sentence needs, never a
      citation stapled to the end. If the label repeats the word next
      to it, delete the word and let the pill be it.

   4. Nothing goes in that can't be traced to a source. No invented
      color, no guessed dates.
--------------------------------------------------------------- */

export const DOC = [

[
  "Jason Huff (b. 1981) is an artist, writer, and designer living and working in ",
  { w:"Los Angeles", m:"sun", add:[
      ", by way of Georgia, fifteen years in ",
      { w:"New York", m:"skyline", add:[
          ", and two in Providence for graduate school at ",
          { l:"RISD", h:"https://www.risd.edu" }
      ]}
  ]},
  ". He makes ",
  { w:"books", m:"stack", add:[
      " by running familiar texts through machines and publishing what comes back. The first was ",
      { w:"AutoSummarize", m:"funnel", add:[
          " (2010), which put the hundred most-downloaded books on Project Gutenberg through Microsoft Word's summarize function, reducing A Doll's House to the name Nora, repeated. ",
          { l:"The New Yorker", h:"https://www.newyorker.com/books/page-turner/rise-of-the-literature-machines" },
          " called the results absurd and quite funny, and the ",
          { l:"edition", h:"https://p-dpa.net/work/autosummarize/" },
          " is catalogued in the Post-Digital Publishing Archive"
      ]},
      ". Then ",
      { w:"American Psycho", m:"envelope", add:[
          " (2012), made with ",
          { l:"Mimi Cabell", h:"https://www.mimicabell.com/" },
          ", which mailed Bret Easton Ellis's novel through Gmail one page at a time and collected the 819 ads it generated; the most common was a coupon for Crest Whitestrips. It has its own ",
          { l:"Wikipedia", h:"https://en.wikipedia.org/wiki/American_Psycho_(conceptual_novel)" },
          " entry and sits in the ",
          { l:"Printed Matter", h:"https://www.printedmatter.org/catalog/41638" },
          " catalog"
      ]},
      ". Then ",
      { w:"Best Fight Ever / Worst Fight Ever", m:"film", add:[
          " (2011), which cut two YouTube fight scenes, one famously good and one famously bad, into three-second clips and had Mechanical Turk workers describe them in writing. The book has two front covers and no back"
      ]},
      ". And then ",
      { w:"Endless Opportunities", m:"lens", add:[
          " (2012), which queries Google image search on a loop and prints the results, watching for the ranking to change. It ran live for the length of an exhibition at ",
          { l:"Artspace", h:"https://www.artspacenewhaven.org" },
          " in New Haven"
      ]}
  ]},
  ". He builds ",
  { w:"software", m:"code", add:[
      ", most recently ",
      { l:"regender-xyz", h:"https://github.com/jsnhff/regender-xyz" },
      ", free and open source, which transforms the gendered structure of English texts. Its first publication is Pride & Prejudice in four volumes"
  ]},
  ". And he ",
  { w:"writes", m:"pen", add:[
      " about the cultural impact of technology, for ",
      { w:"Rhizome", m:"branch", add:[
          ", where he was an Editorial Fellow, wrote ",
          { l:"Beyond the Surface: 15 Years of Desktop Aesthetics", h:"https://rhizome.org/editorial/2012/mar/14/beyond-surface-15-years-desktop-aesthetics/" },
          ", profiled ",
          { l:"Damon Zucconi", h:"https://rhizome.org/editorial/2016/nov/01/artist-profile-damon-zucconi/" },
          ", and left four more in the ",
          { l:"archive", h:"https://rhizome.org/tags/jason-huff/" }
      ]},
      ". Also for ",
      { w:"The New Inquiry", m:"quote", add:[
          ", where ",
          { l:"Serf Boards", h:"https://thenewinquiry.com/serf-boards/" },
          " took apart Amazon Mechanical Turk and crowdsourced labor"
      ]},
      ". And once for ",
      { w:"The Creative Independent", m:"window", add:[
          ", whose ",
          { l:"guide", h:"https://thecreativeindependent.com/guides/how-to-make-a-website-for-your-creative-work/" },
          " to making a website for your creative work he wrote, illustrated by ",
          { l:"Sean Suchara", h:"https://seansuchara.info/" }
      ]}
  ]},
  "."
],

[
  "His books are held in ",
  { w:"museums", m:"pediment", add:[
      ": the ",
      { l:"MoMA Library", h:"https://library.moma.org/permalink/01NYA_INST/13u92is/alma991013562918507141" },
      ", acquired in 2017 as part of Paul Soulellis's ",
      { l:"Printed Web", h:"https://soulellis.com/entries/lotpw.html" },
      ", every title of which he lists in a public ",
      { l:"index", h:"https://docs.google.com/spreadsheets/d/1kk7dYKk12ON7RgtZ-wg7Vmp44Fqv7OEi6Z90nu7WNpU/edit?gid=0#gid=0" },
      "; the Whitney Museum's ",
      { l:"Special Collections", h:"http://library.whitney.org/cgi-bin/koha/opac-detail.pl?biblionumber=46618" },
      "; and the Bavarian State Library in ",
      { w:"Munich", m:"shelf", add:[
          ", which holds three of them in the ",
          { l:"Library of Artistic Print on Demand", h:"https://apod.li/auto-summarize" },
          " collection"
      ]}
  ]},
  ". They appear in ",
  { w:"anthologies", m:"book", add:[
      " including Output (MIT Press, 2024), ",
      { l:"Conceptualisms", h:"https://conceptualisms.info" },
      " (University of Alabama Press, 2022), Printed Web 3, and a Kunstforum International ",
      { l:"issue", h:"https://www.kunstforum.de/band/2016-243-postdigital2/" },
      " on the postdigital"
  ]},
  ". The work has been exhibited in ",
  { w:"galleries", m:"frame", add:[
      " in Brooklyn; Paris, at the ",
      { l:"Jeu de Paume", h:"https://jeudepaume.org/en/evenement/american-psycho-mimi-cabell-jason-huff/" },
      "; Tel Aviv; Dallas; Belgium; and New Haven"
  ]},
  ". It has been written about in ",
  { w:"academic journals", m:"asterisk", add:[
      " by Karl Wolfgang Flender in ",
      { l:"Interface Critique", h:"https://journals.ub.uni-heidelberg.de/index.php/ic/article/view/66992" },
      " and Kaja Marczewska in ",
      { l:"Media-N", h:"https://median.newmediacaucus.org" },
      ", discussed by Hannes Bajohr, Silvio Lorusso, and Scott Rettberg, and catalogued in the ",
      { l:"ELMCIP", h:"https://elmcip.net/person/jason-huff" },
      " knowledge base"
  ]},
  "."
],

[
  "He has taught in ",
  { w:"classrooms", m:"easel", add:[
      " at ",
      { l:"RISD", h:"https://www.risd.edu" },
      ", ",
      { l:"Parsons", h:"https://www.newschool.edu/parsons/" },
      ", ",
      { l:"NEW INC", h:"https://www.newinc.org" },
      ", and ",
      { w:"PRAKSIS", m:"compass", add:[
          " in Oslo, a month-long ",
          { l:"residency", h:"https://praksisoslo.org" },
          " on the artist as entrepreneur, with Marisa Olson, Silvio Lorusso, and Stephanie Pereira, among others"
      ]}
  ]},
  ". He has spent years ",
  { w:"making space for other artists", m:"door", add:[
      " to show their work: three seasons of ",
      { l:"Living Room Light Exchange", h:"https://livingroomlightexchange.com/lrlxny" },
      " with Nicholas O'Brien, and before that ",
      { w:"Black Sheep Projects", m:"flock", add:[
          ", an alternative space he co-founded with Derek Paul Boyle to give RISD undergraduates a show before graduation, written up in ",
          { l:"Hyperallergic", h:"https://hyperallergic.com/risd-black-sheep-projects/" },
          " in 2010"
      ]}
  ]},
  ". He spends his days ",
  { w:"leading design teams", m:"team", add:[
      " as Design Director for Retail at Shopify, across hardware, software, brand, content, research, and systems. Previously he was Design Director at ",
      { w:"Netflix", m:"screen", add:[
          ", the first design manager hired into the Los Angeles office; and Director of Product Design at ",
          { w:"Etsy", m:"tag", add:[
              ", where he was one of the first dozen designers and led design through the 2015 public offering. Before that, straight out of RISD, he was on the early team at ",
              { w:"a startup", m:"sprout", add:[
                  " called ",
                  { l:"Weft", h:"https://www.risd.edu/news/stories/breakthrough-tool-wins-nsf-funding" },
                  ", a textile design platform founded by Brooks Hagan and Steve Marschner"
              ]}
          ]}
      ]}
  ]},
  "."
],

[
  "He holds an MFA in Digital+Media from ",
  { l:"RISD", h:"https://www.risd.edu" },
  " and a BFA in New Media from the ",
  { l:"University of Georgia", h:"https://www.uga.edu" },
  ". He can be reached by ",
  { l:"email", h:"mailto:jsnhff@gmail.com" },
  " or ",
  { l:"Instagram", h:"https://instagram.com/jsnhff" },
  "."
]

];
