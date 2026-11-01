# Handoff: the glyph field, and where Ganymede is taking it

Written Nov 1, 2026 for the next working session. Read this before touching the background glyph field, the moon's surface glyphs, or anything about asteroids and craters. Not served on the site; lives on `main` only.

## Where we left off

- Live site = `shell/index.html` (copy at root `index.html` on gh-pages). Latest commit on main: `b9d654f` "DRAGONET.FLY orbits Ganymede; a nearby cursor pulls it like a magnet…". Built by `build/p9_dragonet_orbit.py` (assert-once replace patch on the built page, same pattern as p6/p7).
- A broken attempt (commit `83eb05c`: a zoom-in from space opening plus a free-flying satellite) was reverted in `fe78fef`. The opening zoom was NOT what he meant; he said it was his own unclear wording. Do not rebuild an opening zoom unless he re-describes it.
- DRAGONET.FLY now orbits the moon, is pulled by a nearby cursor (range ~150px), glows when touched, and falls back into orbit when released. Click opens `dragonet.html`.
- He asked for the field explanation below so he can say how he wants it changed. He has not changed the field yet. Next step is his direction in the section after the explanation.

## How the glyph field animates today (`drawField`)

Source of truth: the page's inline script. Functions: `drawField`, `cachedSprite`, `spriteFor`, `glyphSprite`, `tileSprite`, `SHAPES`, `FAM`. Parameters come from the `[field]` block of the embedded TESELA.lun: `step=1.19`, `ring=36`, `speed=0.075`, `glyph_share=0.30`, `pulse_every=9`. Called every frame from `drawWorld` on the `#field` canvas, with `#bloomF` a blurred copy drawn over it with screen blending.

- **Geometry:** a log-polar tessellation centred on the moon. Ring radius `r = R0 * step^(frac + i)`. `N = 36` tiles per ring, each rotated to face outward, size about `rm * (2π/36) * 0.93`, where `rm = r * sqrt(step)`.
- **Flow:** `T = t * speed + .37`. `m0 = floor(T)`, `frac = T - m0`. Every ring slides outward as `frac` grows; at `frac` rollover ring index shifts by one, so the pattern is endless. Ring number `m = m0 - i` is the tile's identity. A tile keeps its look as it travels.
- **Rotation:** the whole field turns at `t * 0.004`.
- **Sprite choice (`spriteFor(m, j, side)`):** deterministic from ring `m` and tile `j` via `hash2` and `SEED = 20261030`. If `hash < glyph_share (0.30)` the tile is a lunar glyph from `GL_ORDER` (the glyphs in TESELA.lun excluding the `ring:` and `frame:` families; the file has 102 glyph entries in total). Otherwise it is a "tile": one primary shape from `SHAPES` (ring, target, dots, plus, ex, rosette, pie, disc, quincunx, checker) and, 55% of the time, a second shape layered with additive blending.
- **Colour:** four families in `FAM`: red/violet/orange, eblue/foam/violet, leaf/foam/sun, orange/sun/gold. Family chosen by two slow sine waves over angle and ring, so colour forms drifting bands. About 10% of tiles jump to another family.
- **Cache:** sprites are cached per (ring, tile), max 6000 entries.
- **Twinkle and fade:** alpha is multiplied by `0.8 + 0.2*sin(t*0.9 + tw*40)` (per-tile phase). Rings fade in over `1.0R0..1.5R0` and fade out over `0.32*maxR..1.0*maxR`. Overall alpha is `.22 * I * boost` where `I` ramps up during the arrival, and `boost` is raised by a moon tap (`kick`) and during the upload moment.
- **Pulse:** every `pulse_every` seconds a bright band travels outward: tiles within about one ring of the pulse index get alpha times `(1 + 1.1*pul)`.
- **Why it feels like one sheet:** the whole field is one mathematical surface (a cone-like spiral) wrapped around the moon. Tiles do not exist as individual things; they are samples of a function of (ring, tile).

### The magnetic field lines (`drawAurora`, `#aurora`)

Separate canvas. Dipole loops `r = L cos²λ` for shell numbers `L = 1.5 + li*.42 + li²*.03`, 15 shells, two halves each, in three planes at 60° apart (vertical squash 1, .62, .34), tilt `-.35 + sin(t*.05)*.08`, ripple `sin(lam*5 + t*.5 + L*2 + ax)*.05*L`. Colour by shell: violet → blue → green → pale. Position and scale ease (6% per frame) toward the moon. Also thin vertical aurora curtains from the top edge and, inside rooms, `threadFrame` wavy threads around the room frame. He has NOT asked to change these yet.

### The moon's own glyphs (`drawDisc`, `renderMoon`)

The moon's surface texture is `renderMoon` (a pixel-art sphere); on top, `drawDisc` draws a 21x21 grid of glyph/tile sprites clipped to the disc: 50% lunar glyph (`GL_ORDER`), 50% tile, shaded by a light direction, with a diagonal wave of extra brightness and a gentle size pulse. Interactions today: drag to spin; single tap on the moon plays `core:u2609`; three quick taps play the birthday-song egg. No double-click handler exists (check `endSpin` taps logic before adding one: a double-click collides with the single-tap sound and the 3-tap counter).

## The direction (Ganymede's words, condensed; he is not a coder, so plan and build it for him)

1. **Take the glyph field apart.** Keep the glyphs that are there now, but stop making them as one big sheet wrapped in a cone. Each glyph should be an individual piece with its own identity. This is NOT "each thing its own page/website". It is a chart: one system that autofills the background glyphs from entries on the chart.
2. **The chart (a floating database, casually).** Each entry: a glyph (an id from the lunar file, or a generative one), a specific identity (a name; a meaning is optional, identity is what matters), chained to a real asteroid in our solar system, chained to that asteroid's name. Glyph ↔ asteroid ↔ asteroid name.
3. **Glyph pool.** The background glyphs look different from the ones in the Sky room, but it is fine if Sky glyphs appear too. Fine if all glyphs are part of the chart. Starting point: make them generative so every glyph can be produced and stored individually.
4. **Appearance is undecided.** He has not decided how the chart shows on the background. First job: give the glyphs identity and store the chart. Do not redesign the look until he says.
5. **Second chart, later.** A completely separate chart with completely new glyphs representing the **craters on Ganymede's surface**. New interaction: **double-click Ganymede** → the moon comes close to the screen, and the glyphs now on the moon's surface are replaced with the new crater glyphs.

## Suggestions for building it (mine, not his; offer in chat, do not put caveats on the page)

- Store the chart as plain JSON inside the build (or a file next to the page), read by the same code that now calls `spriteFor`. Entry shape: `{ id, glyph, asteroid: { number, name, designation }, note? }`. A second file for craters: `{ id, glyph, crater: name, ... }`.
- `spriteFor` should look up the entry for (ring, tile) from the chart (map entries onto tiles deterministically, so the field keeps flowing) instead of hashing into `GL_ORDER`. Keep the animation parameters untouched while he decides what he wants changed.
- Asteroid names and numbers must come from a real source (JPL Small-Body Database or the Minor Planet Center). Do not write them from memory. The sandbox only reaches allowlisted hosts, so use `WebFetch`/`WebSearch` for the lookup and store the fetched values. Ask him no cell-by-cell questions: choose the asteroids (a spread of well-known ones is fine) and fill the chart.
- Real Ganymede crater names exist (USGS Gazetteer of Planetary Nomenclature); same rule, look them up.
- Generative glyphs: the lunar glyphs are 16x16 one-bit bitmaps (`g.rows`, 16 ints). A generator can build symmetric pixel glyphs from a seed (the same bisymmetric roles idea as the tesela, see `/areas/satorian-tensor.md`) and store the seed with the chart entry so each glyph is reproducible.

## Standing rules from him (apply to everything)

- Every build goes live; git history is the revert. Edit the approved version, never regenerate whole pages.
- He cannot code and has file and menu accessibility problems: do the work and publish straight to GitHub; no copy-paste commands for him; no cell-by-cell questions.
- Never call him "Murad"; he is Ganymede. Keep pages free of defensive or "computed vs applied" labelling; put caveats in chat.
- Publish flow: edit → commit main (`git push origin HEAD:main`) → `git fetch origin gh-pages && git worktree add --detach /tmp/ghpN FETCH_HEAD` → copy `shell/index.html` to `index.html` and `shell/index.html` → commit → `git push origin HEAD:gh-pages` → curl-verify after ~50 s. Commit trailers: none. No assistant names or attribution lines go on anything in this repo or on the site.
- Patch scripts in `build/` (`p6_*`, `p7_*`, `p9_*`) are assert-once replacements on the built page; follow that pattern and keep the script in the repo.
