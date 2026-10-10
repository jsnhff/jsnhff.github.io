# Act three's poems

The home page's third act performs a script: a poem's first draft, the
critic's rounds of marks, the poem as it stands after each round, and the
critic's last word. `js/poem.js` plays it (reading, considering, marking,
writing in the margin); this folder describes the script and checks it.

Right now the scripts are a corpus written ahead of time by Claude,
`js/poem-corpus.json`. The page picks one this browser hasn't seen lately.
Later a language model can write them live: ask it for exactly this shape,
run `check()` from `check.mjs` on what comes back, and fall back to the
corpus if it fails.

## The shape

```json
{
  "title": "the creek in march",
  "draft": ["the beautiful creek runs so gently", "..."],
  "rounds": [
    {
      "marks": [
        { "line": 0, "text": "beautiful", "how": "replace", "rep": "brown" },
        { "line": 0, "text": "so gently", "how": "delete" },
        { "line": 1, "text": "peaceful valley of my soul", "how": "underline", "note": "whose valley?" }
      ],
      "after": ["the brown creek runs", "..."]
    }
  ],
  "verdict": "better. the boots stay."
}
```

- `draft` and every `after` have the same number of lines. Lowercase, at
  most 44 characters a line, so a line fits a phone without wrapping.
- A mark's `text` is a run of words in its `line` as the poem stands at
  that round, punctuation aside.
- `how` is the editor's mark:
  - `delete`: struck through with the deleatur's curl. Usually no note.
  - `replace`: struck through, `rep` written above it. `rep` has to be in
    the revised line.
  - `circle` or `underline`: look at this. Optional `note`, at most 24
    characters, written in the margin.
- At most 4 marks a round, three rounds. Each line that is marked is
  revised, and only marked lines are: every change answers a mark.
- `verdict`: the critic's last word, at most 26 characters.

`node _poems/check.mjs` checks the corpus (or a file you pass it).

## Writing them

What made the corpus work, and what a prompt for a model should ask for:

- The draft starts from one real scene with a person in it (a laundromat
  at 11pm, a father's garage), then buries it in the ways people actually
  write badly: abstractions (soul, eternity), cliché (whispers secrets),
  filler (so, very, truly), adverbs, and lines that explain the feeling.
- The critic is short and specific. It asks for the thing ("which song?",
  "show me one face"), names the problem ("cliché", "op-ed. cut."), or
  says nothing and strikes.
- Each round makes the poem more particular, not just cleaner: the
  revision finds the detail the draft was hiding.
- The ending stays open. It stops on an image, not a punchline: no
  two-beat zinger ("i make a snowball. i miss."), no line that sums the
  poem up or clicks it shut. Leave something unresolved.
- The verdict points at what saved it ("the boots stay.").

A starting prompt:

> Write a short poem as a script for an editing performance, as JSON in
> this shape: [the shape above]. The draft: six lines about one specific,
> ordinary scene with a person in it, written badly the way an earnest
> beginner writes (abstraction, cliché, filler words, adverbs, explaining
> the feeling), with the real poem hidden inside it. Then three rounds of a
> sharp editor's marks, each with the revised poem, that make it more
> specific each time. End on an image, not a punchline; leave it open. Notes are terse and
> concrete. Follow the limits exactly.
