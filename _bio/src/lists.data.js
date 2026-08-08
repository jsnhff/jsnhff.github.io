/* ---------------------------------------------------------------
   lists.data.js — the sections that sit below the bio.

   These are plain data, rendered as static HTML. They are the
   crawlable, linkable version of the record; the bio above is the
   readable one. Same pill style for links.

   Everything here traces to jason-huff-credentials-MERGED.md.
   Items marked TODO need a fact or a URL before they go live.
--------------------------------------------------------------- */

/* `works` lists the project slugs an entry belongs to, so a project page can
   carry its own credentials without that fact being written down twice. Only
   what the entry itself already claims — nothing inferred. Leave it off where
   the credit is not attributable to a specific work.

   A bare string uses the entry's own href. An object takes a per-work href
   instead, for archives that give each title its own page: without that, every
   work in a collection points at whichever one happened to be linked from the
   record, which is how American Psycho ended up pointing at AutoSummarize. */
export const COLLECTIONS = [
  { name:"MoMA Library, Museum of Modern Art",
    note:"AutoSummarize and American Psycho, acquired 2017 with the Library of the Printed Web",
    href:"https://library.moma.org/permalink/01NYA_INST/13u92is/alma991013562918507141",
    works:["autosummarize", "american-psycho"] },
  { name:"Library of the Printed Web, full index",
    note:"Paul Soulellis's list of every title in the collection",
    href:"https://docs.google.com/spreadsheets/d/1kk7dYKk12ON7RgtZ-wg7Vmp44Fqv7OEi6Z90nu7WNpU/edit?gid=0#gid=0",
    works:["autosummarize", "american-psycho"] },
  { name:"Whitney Museum of American Art, Special Collections",
    note:"AutoSummarize. Call no. N6537.H8251 A8 2010",
    href:"http://library.whitney.org/cgi-bin/koha/opac-detail.pl?biblionumber=46618",
    works:["autosummarize"] },
  { name:"Bayerische Staatsbibliothek, Munich",
    note:"Three works in the Library of Artistic Print on Demand collection",
    href:"https://apod.li/auto-summarize",
    works:[
      { slug:"autosummarize",   href:"https://www.apod.li/auto-summarize" },
      { slug:"american-psycho", href:"https://www.apod.li/american-psycho" },
      { slug:"best-fight-ever", href:"https://www.apod.li/best-fight-ever-worst-fight-ever" },
    ] },
];

export const ANTHOLOGIES = [
  { year:"2025", title:"Library of Artistic Print on Demand",
    note:"Spector Books. Dedicated entries for three works",
    href:"https://apod.li/american-psycho",
    works:[
      { slug:"autosummarize",   href:"https://www.apod.li/auto-summarize" },
      { slug:"american-psycho", href:"https://www.apod.li/american-psycho" },
      { slug:"best-fight-ever", href:"https://www.apod.li/best-fight-ever-worst-fight-ever" },
    ] },
  { year:"2024", title:"Output: An Anthology of Computer-Generated Text, 1953\u20132023",
    note:"MIT Press / Counterpath, p. 64",
    href:"https://mitpress.mit.edu/9780262549813/output/",
    works:["american-psycho"] },
  { year:"2022", title:"Conceptualisms",
    note:"University of Alabama Press, p. 247",
    href:"https://conceptualisms.info",
    works:["autosummarize"] },
  { year:"2016", title:"KUNSTFORUM International, Band 243",
    note:"Postdigital 2",
    href:"https://www.kunstforum.de/band/2016-243-postdigital2/",
    works:["american-psycho"] },
  { year:"2015", title:"Printed Web 3", note:"Curated by Paul Soulellis",
    works:["real-beauty-pics"] },
  { year:"2014", title:"The Enemy, Issue 1", note:"Edited by Charlie White" },
  { year:"2013", title:"Best of Rhizome 2012", note:"Link Editions" },
  { year:"2011", title:"Collect the WWWorld", note:"Link Editions, catalogue",
    works:["endless-opportunities"] },
];

export const WRITING = [
  { year:"2019", title:"How to Make a Website for Your Creative Work",
    outlet:"The Creative Independent",
    href:"https://thecreativeindependent.com/guides/how-to-make-a-website-for-your-creative-work/" },
  { year:"2016", title:"Artist Profile: Damon Zucconi", outlet:"Rhizome",
    href:"https://rhizome.org/editorial/2016/nov/01/artist-profile-damon-zucconi/" },
  { year:"2014", title:"Serf Boards", outlet:"The New Inquiry",
    href:"https://thenewinquiry.com/serf-boards/" },
  { year:"2012", title:"Beyond the Surface: 15 Years of Desktop Aesthetics", outlet:"Rhizome",
    href:"https://rhizome.org/editorial/2012/mar/14/beyond-surface-15-years-desktop-aesthetics/" },
  { year:"2012", title:"Interface Aesthetics: An Introduction", outlet:"Rhizome",
    href:"https://rhizome.org/editorial/2012/aug/03/interface-aesthetics/" },
  { year:"2012", title:"Thoughts on Wikipedia\u2019s Future", outlet:"Rhizome",
    href:"https://rhizome.org/editorial/2012/aug/01/thoughts-wikipedias-future/" },
  { year:"2012", title:"Invisible Participation: Language and the Internet",
    outlet:"ELMCIP Conference on Remediating the Social",
    note:"with Daniel C. Howe, John Cayley, and Mimi Cabell",
    href:"https://elmcip.net/event/elmcip-conference-remediating-social" },
  { year:"2011", title:"Technology is Not Enough: The Story of NYU\u2019s ITP", outlet:"Rhizome",
    href:"https://rhizome.org/editorial/2011/dec/15/technology-not-enough-story-nyus-interactive-telec/" },
];

export const PRESS = [
  { year:"2016", outlet:"Inverse", author:"Gabe Bergado", note:"AutoSummarize at Internet Yami-Ichi",
    works:["autosummarize"] },
  { year:"2014", outlet:"Dazed", author:"Thomas Gorton", note:"American Psycho",
    href:"https://www.dazeddigital.com/artsandculture/article/21553/1/download-american-psycho-reimagined-using-google-ads",
    works:["american-psycho"] },
  { year:"2014", outlet:"Daily Dot", author:"Miles Klee", note:"American Psycho",
    works:["american-psycho"] },
  { year:"2014", outlet:"Adweek", author:"Miles Klee", note:"American Psycho",
    works:["american-psycho"] },
  { year:"2014", outlet:"Electric Literature", author:"Maru Pab\u00f3n", note:"American Psycho",
    href:"https://electricliterature.com/rewriting-through-google-ads-mimi-cabell-and-jason-huffs-american-psycho/",
    works:["american-psycho"] },
  { year:"2010", outlet:"The New Yorker", author:"Madeleine Schwartz",
    note:"Rise of the Literature Machines",
    href:"https://www.newyorker.com/books/page-turner/rise-of-the-literature-machines",
    works:["autosummarize"] },
  { year:"2010", outlet:"The Rumpus", author:"Jeremy Hatch", note:"AutoSummarize",
    href:"https://therumpus.net/2010/08/02/autosummarize-applied-to-popular-works/",
    works:["autosummarize"] },
  { year:"2010", outlet:"Hyperallergic", author:"Liz Hall", note:"Black Sheep Projects",
    href:"https://hyperallergic.com/risd-black-sheep-projects/" },
];

export const SCHOLARSHIP = [
  { year:"2025", author:"Hannes Bajohr",
    title:"Print on Demand as Strategy and Genre", venue:"Library of Artistic Print on Demand" },
  { year:"2019", author:"Karl Wolfgang Flender",
    title:"American Psycho: Reading an Algorithm in Reverse", venue:"Interface Critique 2",
    href:"https://interfacecritique.net",
    works:["american-psycho"] },
  { year:"2015", author:"Lea Muldtofte Olsen",
    title:"Grammatized Psychopath: American Psycho Online and Offline",
    venue:"A Peer-Reviewed Journal About (APRJA), Vol. 4 No. 1, pp. 78–86. Aarhus University / transmediale. DOI 10.7146/aprja.v4i1.116107",
    href:"https://aprja.net/article/view/116107",
    works:["american-psycho"] },
  { year:"2015", author:"Kaja Marczewska",
    title:"Erasing in the Algorithmic Extreme", venue:"Media-N, Vol. 11 No. 1",
    href:"https://median.newmediacaucus.org/the_aesthetics_of_erasure/erasing-in-the-algorithmic-extreme-mimi-cabell-and-jason-huffs-american-psycho/",
    works:["american-psycho"] },
  { author:"Scott Rettberg", title:"Electronic Literature, ch. 6: Network Writing",
    venue:"TODO \u2014 publisher, year, page range" },
];
