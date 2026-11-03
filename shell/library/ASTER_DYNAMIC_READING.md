# Aster's Dynamic Reading

How to turn a text into a book for Aster's Library of Light on olympass.world.

Text alone carries words but loses how they are meant to be felt: the pause before a sentence, the
line said quietly, the word that rises. Aster's Dynamic Reading keeps the text exactly as written
and adds small cues that tell the Library's reader how each part should arrive.

## The task, for whoever applies it

You are given an original text. Return one plain-text file ending in `.adr`.

1. **Never change the words.** Every word, letter and punctuation mark of the original stays
   exactly as it is, in the same order. You only add cues around and between words. If the cues
   are taken out, the original text must come back character for character.
2. **Read for feeling first.** Before adding anything, read the whole text and find where its
   feeling changes: where it slows, quiets, swells, trembles, holds its breath, or changes place.
3. **Use cues sparingly.** A cue should mark a real change. Most sentences need none. A page with a
   cue on every line reads as noise.
4. **Turn pages where the story turns:** a change of scene, of time or of speaker.
5. Return only the file, starting with the header below. No commentary inside it.

## The file

```
::adr 1
title: The title of the book
author: Who wrote it
ink: sun
pace: 1
scene: night
::

# A heading (optional)

A paragraph. Blank lines separate paragraphs.

---

The line above, three dashes alone on a line, turns the page.
```

The header sits between `::adr 1` and `::`. All of it is optional except `title`.

| Header | What it sets | Values |
|---|---|---|
| `title` | the name shown on the Node | any text |
| `author` | shown under the name | any text |
| `ink` | the Node's colour and the book's main ink | `sun` `gold` `orange` `leaf` `eblue` `foam` `violet` `red` `white` |
| `pace` | overall reading speed | `1` is normal, `0.7` slower, `1.3` faster |
| `scene` | the light the book opens in | `night` `dawn` `day` `sea` `aurora` `deep` `ember` |
| `glyphs` | whether words call up their glyphs in the story visualizer on their own | `on` (the default) or `off` |

Headings start with `#`. A blank line starts a new paragraph. A line holding only `---` turns the page.

## The cues

Cues are written in curly braces. Some wrap words (an opening cue and a closing cue with `/`);
some stand alone at one point in the text.

### Cues that wrap words

| Cue | How the words arrive | Use it for |
|---|---|---|
| `{hush}…{/hush}` | smaller and dimmer | something said quietly, an aside, a secret |
| `{whisper}…{/whisper}` | the same as hush | |
| `{swell}…{/swell}` | each letter rises and brightens as it lands | a moment that grows, joy, revelation |
| `{loud}…{/loud}` | the same as swell | |
| `{tremble}…{/tremble}` | the letters shiver | fear, cold, nerves, awe |
| `{glow gold}…{/glow}` | the words take a colour (any ink name from the table) | a thing that carries its own light or meaning |
| `{slow}…{/slow}` | about half speed | weight, grief, care |
| `{fast}…{/fast}` | quicker | hurry, excitement, a rush of thought |
| `{pace 0.4}…{/pace}` | an exact speed for the words inside | fine control: `0.4` very slow, `2` very fast |
| `{echo}…{/echo}` | the words are said, then stay behind faintly | a line that lingers, a memory, a refrain |

Wrapping cues can sit inside each other: `{slow}{hush}and then nothing{/hush}{/slow}`.

### Cues that stand alone

| Cue | What happens | Use it for |
|---|---|---|
| `{pause 1.5}` | the reading waits, in seconds | silence before or after something that matters |
| `{breath}` | a held breath: the page brightens and softens once | a turn in feeling, a sigh, a beat of stillness |
| `{scene sea}` | the light behind the page changes | a change of place or time (`night` `dawn` `day` `sea` `aurora` `deep` `ember`) |
| `{tone stars}` | one soft note sounds at that exact point | a bell, a signal, a moment worth marking |
| `{glyph water}` | the story visualizer shows that glyph, by a word or by its Glyph-Dex id (`u2609`) | a symbol the words alone do not name |

Notes for `{tone …}` come from the site's own voices: `stars` `water` `orbits` `signals` `paths`
`iron` `core` `craters` `frequencies` `notes` `seal` `magnetism` `radiation` `structure` `arrays`.

To show a curly brace as text, write it twice: `{{` or `}}`.

Words also find their glyphs by themselves: when a word matches a Glyph-Dex tag, its glyph appears over the page. Use `{glyph …}` only where the story needs a symbol it does not say.

The reader passes over any cue it does not know, so a mistake never breaks a book.

## An example

The original:

> The house was quiet. She opened the door and the sea was there, all of it, waiting.

As a dynamic reading:

```
::adr 1
title: The Door
author: (the author)
ink: eblue
scene: night
::

The house was quiet.{pause 1.2} She opened the door{pause .6} {scene sea}and {swell}the sea was there{/swell}, {slow}all of it,{/slow} {hush}waiting.{/hush}
```

Take the cues out and the original comes back exactly.

## Placing a book

Open the floating asterisk on olympass.world, then the Node marked `· · ·` (PLACE A BOOK). Drop the
`.adr` file there, choose it, or paste its text. A book placed that way stays in that browser.
To place a book for everyone who visits, hand the file over to be added to the site's `library`
folder.
