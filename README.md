# olympass-world

The Super Power Shell: the moon at the centre, six doors (RIVER.COM, THE ENGINE, THE TERMINAL, THE CASE, THE TENSOR, THE SKY), the River terminal, the Olympass.world site and TESELA.lun, in one self-contained page.

- `shell/index.html` is the built Shell (open it in any browser).
- `build/` holds the sources and `build4.py`, which assembles the Shell: `python3 build/build4.py`.
- `src/RIVER.COM.html` is the River terminal; the build patches it by assert-once replacements.
- `baseline/` holds the approved site, TESELA.lun and the terminal as received. Treat it as read-only: changes go on top as additions, never as rewrites.

The live site is not touched by anything here until a deploy is connected.
