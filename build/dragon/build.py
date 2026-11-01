import json, os
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: open(os.path.join(here, n), encoding="utf-8").read()
glyphs = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "glyphs.json")))
js = "\n".join(rd(n) for n in ["dsp.js", "time.js", "glyph.js", "art.js", "deck.js", "main.js"])
js = js.replace("/*GLYPHS*/[]", json.dumps(glyphs, separators=(",", ":")))
out = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>DRAGONET.FLY</title>
<meta name="theme-color" content="#0d0a07">
<style>
{rd("style.css")}</style>
</head>
<body>
{rd("body.html")}
<script>
{js}
</script>
</body>
</html>
"""
dst = os.path.abspath(os.path.join(here, "..", "..", "dragonet.html"))
open(dst, "w", encoding="utf-8").write(out)
print(dst, len(out))
