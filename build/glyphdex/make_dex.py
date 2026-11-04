#!/usr/bin/env python3
"""
make_dex.py -- builds the Glyph-Dex: every glyph as a vector, with tags and chains.

Sets
  moon        the 102 moon-speak glyphs of TESELA.lun (16x16 pixel glyphs kept as vector squares,
              so they scale without blurring)
  sky         astronomical signs        elements  alchemical and weather signs
  numbers     mathematical signs and the Cyrillic great-number signs
  letters     Arabic letters            hieroglyphs  Egyptian signs, with Gardiner codes
  bodies      glyphs of named bodies from the charts (Sun, planets, dwarf planets, Jupiter's moons)
  primitives  plain shapes the made glyphs are built from
  made        glyphs made here from other glyphs, for things that have no glyph of their own
Every entry has tags. Tags are examined (how often each is used, which tags travel together)
and every glyph is chained to the glyphs it shares the most meaning with.

Vector outlines of the Unicode signs come from fonts under the SIL Open Font License
(Noto Sans Symbols, Noto Sans Symbols 2, Noto Naskh Arabic, Noto Sans Math, Noto Sans Egyptian
Hieroglyphs); the notice is kept in shell/glyphdex/FONTS.txt.
usage: python3 make_dex.py <font dir> <out json>
"""
import glob, json, os, re, sys, unicodedata
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "chart"))
from make_asteroid_chart import make_glyph

fdir, out = sys.argv[1], sys.argv[2]
FONTS = []
for pat in ["*symbols-symbols-400*", "*symbols-2-symbols-400*", "*symbols-2-math-400*", "*naskh-arabic-arabic-400*", "*noto-sans-math*400*", "*egyptian-hieroglyphs-400*"]:
    FONTS += sorted(glob.glob(os.path.join(fdir, "**", pat + ".woff"), recursive=True))[:1]
FONTS += ["/usr/share/fonts/truetype/freefont/FreeSerif.ttf"]  # GNU FreeFont (GPL + font exception): the Cyrillic great-number signs
FONTS = [(f, TTFont(f)) for f in FONTS if os.path.exists(f)]

def outline(ch):
    for f, t in FONTS:
        cm = t.getBestCmap()
        if ord(ch) not in cm: continue
        gs = t.getGlyphSet(); g = gs[cm[ord(ch)]]; bp = BoundsPen(gs); g.draw(bp)
        if not bp.bounds: continue
        x0, y0, x1, y1 = bp.bounds; w, h = x1 - x0, y1 - y0; s = 84.0 / max(w, h)
        ox, oy = 50 - (x0 + w / 2) * s, 50 + (y0 + h / 2) * s
        sp = SVGPathPen(gs, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip(".")); g.draw(TransformPen(sp, (s, 0, 0, -s, ox, oy)))
        return sp.getCommands(), os.path.basename(f).split("-400")[0].replace(".ttf", "")
    return None, None

def em_outline(ch):
    """one character's outline in em units (y up), from the first font that has it"""
    for f, t in FONTS:
        cm = t.getBestCmap()
        if ord(ch) not in cm: continue
        gs = t.getGlyphSet(); g = gs[cm[ord(ch)]]; bp = BoundsPen(gs); g.draw(bp)
        if not bp.bounds: continue
        u = t["head"].unitsPerEm; return g, gs, bp.bounds, 1.0 / u
    return None

def outline_multi(chars):
    """a base character with its enclosing marks, each mark centred on the base, as one vector in a 100 box"""
    parts = [em_outline(c) for c in chars]
    if not parts or not parts[0]: return None
    g0, gs0, b0, k0 = parts[0]; cx0, cy0 = (b0[0] + b0[2]) / 2 * k0, (b0[1] + b0[3]) / 2 * k0
    placed = [(parts[0], 0.0, 0.0)]
    for p in parts[1:]:
        if not p: continue
        g, gs, b, k = p; placed.append((p, cx0 - (b[0] + b[2]) / 2 * k, cy0 - (b[1] + b[3]) / 2 * k))
    xs, ys = [], []
    for (g, gs, b, k), dx, dy in placed: xs += [b[0] * k + dx, b[2] * k + dx]; ys += [b[1] * k + dy, b[3] * k + dy]
    w, h = max(xs) - min(xs), max(ys) - min(ys); s = 84.0 / max(w, h); ox, oy = 50 - (min(xs) + w / 2) * s, 50 + (min(ys) + h / 2) * s
    d = ""
    for (g, gs, b, k), dx, dy in placed:
        sp = SVGPathPen(gs, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip(".")); g.draw(TransformPen(sp, (s * k, 0, 0, -s * k, ox + dx * s, oy - dy * s))); d += sp.getCommands()
    return d

def rows_path(rows):
    d = []
    for y, v in enumerate(rows):
        x = 0
        while x < 16:
            if (v >> (15 - x)) & 1:
                s = x
                while x < 16 and (v >> (15 - x)) & 1: x += 1
                d.append("M%d %dh%dv1h-%dz" % (s, y, x - s, x - s))
            else: x += 1
    return "".join(d)

STOP = set("a an the of and with or in on at to for by from sign symbol combining mark small capital letter form isolated with above below".split())
def tagify(*parts):
    out = []
    for p in parts:
        for w in re.split(r"[^a-z0-9]+", str(p).lower()):
            if w and w not in STOP and len(w) > 1 and w not in out: out.append(w)
    return out

E = []
def add(**k):
    k.setdefault("tags", []); k["tags"] = [t for i, t in enumerate(k["tags"]) if t and t not in k["tags"][:i]]; E.append(k)

# ---- moon speak: TESELA.lun ----
lun = open(os.path.join(HERE, "..", "TESELA.lun"), encoding="utf-8").read()
for m in re.finditer(r"\[glyph ([a-z0-9]+):([^\]]+)\]\n(.*?)(?=\n\[|\Z)", lun, flags=re.S):
    fam, gid, body = m.group(1), m.group(2), m.group(3)
    f = dict(re.findall(r"^(\w+)\s*=\s*(.*)$", body, flags=re.M))
    if "rows" not in f: continue
    rows = [int(h, 16) for h in f["rows"].split()]
    cps = re.findall(r"U\+([0-9A-Fa-f]+)", f.get("cp", ""))
    uni = []
    for c in cps:
        try: uni.append(unicodedata.name(chr(int(c, 16))))
        except ValueError: pass
    vec = outline_multi([chr(int(c, 16)) for c in cps]) if cps else None
    add(id=fam + ":" + gid, set="moon", name=f.get("role", fam + " " + gid), vb=16, d=rows_path(rows), v=vec, fam=fam,
        chars="".join(chr(int(c, 16)) for c in cps), tags=tagify(fam, f.get("domain", ""), f.get("role", ""), *uni) + ["moon-speak"],
        meaning=f.get("role", ""))

# ---- Unicode signs with their meanings ----
CUR = [
 # sky
 ("☉", "sky", "Sun", "sun star day light gold center life", "the Sun; also gold in alchemy"),
 ("☽", "sky", "Moon, first quarter", "moon night silver crescent waxing", "the Moon as it grows"),
 ("☾", "sky", "Moon, last quarter", "moon night silver crescent waning", "the Moon as it wanes"),
 ("☿", "sky", "Mercury", "mercury planet messenger quicksilver swift", "the sign of Mercury; quicksilver"),
 ("♀", "sky", "Venus", "venus planet copper love morning-star", "the sign of Venus; copper"),
 ("♁", "sky", "Earth", "earth planet world ground home", "the Earth"),
 ("♂", "sky", "Mars", "mars planet iron war red", "the sign of Mars; iron"),
 ("♃", "sky", "Jupiter", "jupiter planet tin king giant zeus", "the sign of Jupiter; tin; Zeus"),
 ("♄", "sky", "Saturn", "saturn planet lead time rings", "the sign of Saturn; lead"),
 ("⛢", "sky", "Uranus", "uranus planet sky ice-giant", "the sign of Uranus"),
 ("♆", "sky", "Neptune", "neptune planet sea trident ice-giant", "the sign of Neptune"),
 ("♇", "sky", "Pluto", "pluto dwarf-planet underworld far", "the sign of Pluto"),
 ("⚳", "sky", "Ceres", "ceres dwarf-planet harvest asteroid-belt", "the sign of Ceres"),
 ("⚴", "sky", "Pallas", "pallas asteroid wisdom", "the sign of Pallas"),
 ("⚵", "sky", "Juno", "juno asteroid", "the sign of Juno"),
 ("⚶", "sky", "Vesta", "vesta asteroid hearth fire", "the sign of Vesta"),
 ("⚷", "sky", "Chiron", "chiron centaur healer key", "the sign of Chiron"),
 ("☄", "sky", "Comet", "comet tail travel omen ice", "a comet"),
 ("★", "sky", "Star", "star light night bright", "a star"),
 ("☆", "sky", "Star, open", "star light night outline", "a star, drawn open"),
 ("✦", "sky", "Four-point star", "star spark light twinkle", "a spark of starlight"),
 ("✧", "sky", "Four-point star, open", "star spark light twinkle outline", "a spark, drawn open"),
 # elements and weather
 ("🜁", "elements", "Air", "air element wind breath sky", "the element air"),
 ("🜂", "elements", "Fire", "fire element heat flame ember", "the element fire"),
 ("🜃", "elements", "Earth (element)", "earth element ground stone", "the element earth"),
 ("🜄", "elements", "Water", "water element sea river flow", "the element water"),
 ("🜍", "elements", "Sulfur", "sulfur alchemy fire soul", "sulfur, in alchemy"),
 ("🜔", "elements", "Salt", "salt alchemy body crystal", "salt, in alchemy"),
 ("🝆", "elements", "Oil", "oil alchemy", "oil, in alchemy"),
 ("☀", "elements", "Sunlight", "sun day light warm bright", "sunlight, a clear day"),
 ("☁", "elements", "Cloud", "cloud sky weather grey", "a cloud"),
 ("☂", "elements", "Umbrella", "rain weather shelter", "rain, shelter"),
 ("❄", "elements", "Snowflake", "snow cold ice winter", "snow, cold"),
 ("⚡", "elements", "Lightning", "lightning storm power zeus thunder", "lightning; Zeus"),
 ("☘", "elements", "Shamrock", "leaf plant green life", "a leaf, growing things"),
 # numbers and great numbers
 ("∞", "numbers", "Infinity", "infinity endless loop eight forever", "without end"),
 ("∅", "numbers", "Empty set", "empty nothing void zero", "nothing, the empty"),
 ("∴", "numbers", "Therefore", "therefore because-of reason three-dots", "so it follows"),
 ("∵", "numbers", "Because", "because reason three-dots", "because"),
 ("∆", "numbers", "Delta", "change difference triangle", "a change"),
 ("∇", "numbers", "Nabla", "descent gradient triangle down", "the way down"),
 ("⊙", "numbers", "Circled dot", "center point sun eye", "a centre"),
 ("⊗", "numbers", "Circled times", "cross joining product", "a joining"),
 ("⊕", "numbers", "Circled plus", "plus whole earth union", "a union; also Earth"),
 ("≈", "numbers", "Almost equal", "near similar wave", "nearly the same"),
 ("∿", "numbers", "Sine wave", "sine wave signal sound flow", "a sine wave: sound, signal"),
 ("҈", "numbers", "Hundred thousands sign", "great-number myriad hundred-thousand legion circle", "a hundred thousand (Cyrillic, legion)"),
 ("҉", "numbers", "Millions sign", "great-number myriad million circle rays", "a million (Cyrillic, leodr)"),
 ("꙰", "numbers", "Ten millions sign", "great-number myriad ten-million circle", "ten million"),
 ("꙱", "numbers", "Hundred millions sign", "great-number myriad hundred-million circle frame", "a hundred million"),
 ("꙲", "numbers", "Thousand millions sign", "great-number many-myriads thousand-million plus wheel", "a thousand million: many myriads"),
 # letters
 ("ا", "letters", "Alif", "alif first one upright arabic", "alif, the first letter; one"),
 ("أ", "letters", "Alif with hamza", "alif hamza beginning arabic", "alif carrying a hamza"),
 ("ب", "letters", "Ba", "ba house arabic", "ba"),
 ("ن", "letters", "Nun", "nun fish point arabic", "nun"),
 ("و", "letters", "Waw", "waw and joining arabic", "waw: and"),
 ("ه", "letters", "Ha", "ha breath arabic", "ha"),
 ("ع", "letters", "Ayn", "ayn eye spring arabic", "ayn: eye, spring of water"),
 ("س", "letters", "Sin", "sin teeth arabic", "sin"),
 # hieroglyphs (Gardiner code, meaning)
 ("𓃾", "hieroglyphs", "Ox head (F1)", "ox head strength first aleph cattle", "the ox head; the ancestor of aleph and alif"),
 ("𓂀", "hieroglyphs", "Eye of Horus (D10)", "eye whole protection healing sky", "the whole, healed eye"),
 ("𓇳", "hieroglyphs", "Sun (N5)", "sun day ra light time", "the sun; day; Ra"),
 ("𓈗", "hieroglyphs", "Water (N35A)", "water river flow nile", "water, the river"),
 ("𓆣", "hieroglyphs", "Scarab (L1)", "scarab becoming transformation morning", "to come into being"),
 ("𓋹", "hieroglyphs", "Ankh (S34)", "ankh life breath", "life"),
 ("𓊹", "hieroglyphs", "Netjer (R8)", "netjer god divine flag", "the divine"),
 ("𓇯", "hieroglyphs", "Sky (N1)", "sky heaven above", "the sky"),
 ("𓉐", "hieroglyphs", "House (O1)", "house home room", "a house"),
 ("𓅓", "hieroglyphs", "Owl (G17)", "owl bird m night", "the owl; the sound m"),
 ("𓆓", "hieroglyphs", "Cobra (I10)", "cobra snake d protection", "the cobra; the sound dj"),
 ("𓀀", "hieroglyphs", "Seated man (A1)", "man person i classifier", "a man; I"),
 ("𓁐", "hieroglyphs", "Seated woman (B1)", "woman person classifier", "a woman"),
 ("𓀭", "hieroglyphs", "Seated god (A40)", "god king divine classifier", "a god, a king"),
 ("𓇋", "hieroglyphs", "Reed (M17)", "reed i writing", "the reed; the sound i"),
 ("𓎛", "hieroglyphs", "Wick (V28)", "wick twisted h light", "the twisted wick; the sound h"),
 ("𓏏", "hieroglyphs", "Bread loaf (X1)", "bread loaf t food", "the bread loaf; the sound t"),
 ("𓊃", "hieroglyphs", "Bolt (O34)", "bolt door s", "the door bolt; the sound s"),
 ("𓂋", "hieroglyphs", "Mouth (D21)", "mouth speech r word", "the mouth; speech"),
 ("𓈖", "hieroglyphs", "Water ripple (N35)", "water ripple n wave", "a ripple of water; the sound n"),
 ("𓅱", "hieroglyphs", "Quail chick (G43)", "quail chick bird w young", "the quail chick; the sound w"),
 ("𓆑", "hieroglyphs", "Horned viper (I9)", "viper snake f", "the horned viper; the sound f"),
 ("𓄿", "hieroglyphs", "Vulture (G1)", "vulture bird aleph", "the vulture"),
 ("𓃀", "hieroglyphs", "Foot (D58)", "foot walk b", "the foot; the sound b"),
 ("𓇼", "hieroglyphs", "Star (N14)", "star night hour", "a star"),
 ("𓆸", "hieroglyphs", "Lotus (M9)", "lotus flower dawn rebirth", "the lotus"),
 ("𓋴", "hieroglyphs", "Folded cloth (S29)", "cloth s", "the folded cloth; the sound s"),
 ("𓍝", "hieroglyphs", "Cartouche loop", "cartouche name ring", "the ring that holds a name"),
]
for ch, st, name, tags, mean in CUR:
    d, font = outline(ch)
    if not d: print("no outline for", ch, name); continue
    try: un = unicodedata.name(ch)
    except ValueError: un = ""
    add(id="u" + "%04x" % ord(ch), set=st, name=name, vb=100, d=d, chars=ch, code="U+%04X" % ord(ch), font=font, tags=tagify(tags) + tagify(un) + [st], meaning=mean)

# ---- the full alchemical set (U+1F700 to U+1F773) and the zodiac's constellation signs ----
have = {e["id"] for e in E}
for cp in range(0x1F700, 0x1F774):
    ch = chr(cp); i = "u%04x" % cp
    if i in have: continue
    try: un = unicodedata.name(ch)
    except ValueError: continue
    d, font = outline(ch)
    if not d: continue
    nm = un.replace("ALCHEMICAL SYMBOL FOR ", "").title()
    add(id=i, set="alchemy", name=nm, vb=100, d=d, chars=ch, code="U+%04X" % cp, font=font, tags=tagify(nm, "alchemy alchemical"), meaning="the alchemical sign for " + nm.lower())
ZOD = [("♈", "Aries", "aries ram fire spring beginning march"), ("♉", "Taurus", "taurus bull earth april strength"), ("♊", "Gemini", "gemini twins air two may"),
       ("♋", "Cancer", "cancer crab water june shell"), ("♌", "Leo", "leo lion fire july sun"), ("♍", "Virgo", "virgo maiden earth august harvest"),
       ("♎", "Libra", "libra scales air balance september"), ("♏", "Scorpius", "scorpius scorpion water october"), ("♐", "Sagittarius", "sagittarius archer fire arrow november"),
       ("♑", "Capricornus", "capricornus sea-goat earth december"), ("♒", "Aquarius", "aquarius water-bearer air january water"), ("♓", "Pisces", "pisces fish water february two"),
       ("⛎", "Ophiuchus", "ophiuchus serpent-bearer healer thirteenth")]
for ch, nm, tg in ZOD:
    d, font = outline(ch)
    if not d: print("no outline for", nm); continue
    add(id="u%04x" % ord(ch), set="zodiac", name=nm, vb=100, d=d, chars=ch, code="U+%04X" % ord(ch), font=font, tags=tagify(tg, "constellation zodiac star"), meaning="the constellation " + nm)

# ---- bodies from the charts ----
core = json.load(open(os.path.join(HERE, "..", "..", "shell", "sky", "core.json"), encoding="utf-8"))
KIND = {"S": "star", "P": "planet", "D": "dwarf-planet", "M": "moon", "X": "lucy"}
keep = {"Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Ceres", "Pluto", "Haumea", "Makemake", "Eris", "Io", "Europa", "Ganymede", "Callisto", "Amalthea", "Lucy"}
for r in core["r"]:
    o = dict(zip(core["f"], r))
    if o["name"] not in keep: continue
    rows, _ = make_glyph(o["seed"])
    add(id="b:" + o["id"], set="bodies", name=o["name"], vb=16, d=rows_path(rows), body=o["id"],
        tags=tagify(o["name"], KIND.get(o["id"][0], "body"), o.get("p") and "moon-of-" + o["p"], "jupiter-system" if o.get("p") == "Jupiter" or o["name"] == "Jupiter" else "", "named-body"),
        meaning="the glyph of " + o["name"] + " in the charts")

# ---- primitives and made glyphs (for what has no glyph of its own) ----
PRIM = {
 "disc": ("Disc", "M50 8a42 42 0 1 0 .1 0z", "disc round body planet whole"),
 "ring": ("Ring", "M50 8a42 42 0 1 0 .1 0zM50 16a34 34 0 1 1-.1 0z", "ring circle orbit around"),
 "cube": ("Implied cube", "M50 8L86 29V71L50 92L14 71V29Z M50 50L86 29 M50 50L50 92 M50 50L14 29", "cube node book space dimension"),
 "craters": ("Craters", "M32 38a6 6 0 1 0 .1 0zM58 60a9 9 0 1 0 .1 0zM62 30a4 4 0 1 0 .1 0zM36 66a3 3 0 1 0 .1 0z", "crater surface rock old"),
 "wave": ("Wave", "M6 50C18 26 32 26 44 50S70 74 82 50S94 34 96 42", "wave sine flow signal river"),
}
for k, (nm, d, tg) in PRIM.items():
    add(id="p:" + k, set="primitives", name=nm, vb=100, d=d, stroke=k in ("cube", "wave", "ring"), tags=tagify(tg) + ["primitive"], meaning=nm.lower())
MADE = [
 ("m:mercury-planet", "Mercury, the planet", [("p:disc", 50, 50, 1, .18), ("p:craters", 50, 50, .9, .6), ("u263f", 72, 72, .34, 1)], "mercury planet picture surface craters", "the planet itself, not only its sign: a cratered disc carrying ☿"),
 ("m:library", "Aster's Library of Light", [("p:cube", 50, 50, 1, .7), ("u2726", 50, 50, .4, 1)], "library book node light aster", "a Node: a spark inside an implied cube"),
 ("m:glyph-dex", "Glyph-Dex", [("u0623", 16, 50, .42, 1), ("ua672", 50, 50, .62, 1), ("u130fe", 50, 50, .26, 1), ("u0623", 84, 50, .42, 1)], "glyph dex index sine-language alif many-myriads ox-head", "alif, many myriads holding the ox head, alif"),
 ("m:river-light", "River of light", [("p:wave", 50, 56, 1, .8), ("u2726", 50, 28, .3, 1)], "river light flow star", "a river with a star over it"),
]
for mid, nm, parts, tg, mean in MADE:
    add(id=mid, set="made", name=nm, vb=100, parts=[{"ref": r, "x": x, "y": y, "s": s, "a": a} for r, x, y, s, a in parts], tags=tagify(tg) + ["made"], meaning=mean)

# ---- examine the tags: how often, and which travel together ----
ids = {e["id"]: e for e in E}
freq = {}
for e in E:
    for t in e["tags"]: freq.setdefault(t, []).append(e["id"])
common = {t for t, l in freq.items() if len(l) > len(E) * .2}
co = {}
for e in E:
    ts = [t for t in e["tags"] if t not in common]
    for a in ts:
        for b in ts:
            if a != b: co.setdefault(a, {}).setdefault(b, 0); co[a][b] += 1
TAGS = {t: {"n": len(l), "with": [b for b, _ in sorted(co.get(t, {}).items(), key=lambda kv: -kv[1])[:8]]} for t, l in sorted(freq.items(), key=lambda kv: -len(kv[1]))}
# ---- chain the glyphs: by shared meaning, and by hand where the meaning is known ----
CHAIN = [("u2609", "b:S000001"), ("u263f", "m:mercury-planet"), ("u2643", "u26a1"), ("u2643", "u2609"), ("u130fe", "u0627"), ("u0627", "u0623"), ("u130fe", "ua672"),
         ("u1f704", "u13217"), ("u1f704", "u223f"), ("u221e", "ua672"), ("u2726", "m:library"), ("u263d", "u263e"), ("u2641", "u2295")]
for e in E:
    ts = set(e["tags"]) - common
    sc = []
    for o in E:
        if o is e: continue
        os_ = set(o["tags"]) - common; inter = len(ts & os_)
        if inter >= 1: sc.append((inter / len(ts | os_), o["id"]))
    sc.sort(reverse=True); e["links"] = [i for j, i in sc[:6] if j >= .18]
for a, b in CHAIN:
    for x, y in ((a, b), (b, a)):
        if x in ids and y in ids and y not in ids[x]["links"]: ids[x]["links"].insert(0, y)
for e in E:
    if e["set"] == "bodies":
        sym = {"Sun": "u2609", "Mercury": "u263f", "Venus": "u2640", "Earth": "u2641", "Mars": "u2642", "Jupiter": "u2643", "Saturn": "u2644", "Uranus": "u26e2", "Neptune": "u2646", "Pluto": "u2647", "Ceres": "u26b3"}.get(e["name"])
        if sym and sym in ids:
            e["links"].insert(0, sym); ids[sym]["links"].insert(0, e["id"])
for e in E:
    seen = []
    for i in e["links"]:
        if i not in seen and i != e["id"]: seen.append(i)
    e["links"] = seen[:8]
FAM_OF = {"sky": "stars", "zodiac": "orbits", "elements": "water", "alchemy": "iron", "numbers": "frequencies", "letters": "paths", "hieroglyphs": "craters", "bodies": "core", "made": "seal", "primitives": "structure"}
for e in E:
    if not e.get("fam"): e["fam"] = FAM_OF.get(e["set"], "def")
SYN = {"sea": "water", "ocean": "water", "river": "water", "rain": "water", "day": "sun", "light": "light", "dawn": "sun", "night": "night", "dark": "night", "cup": "cup", "fire": "fire", "flame": "fire", "storm": "lightning",
       "life": "life", "living": "life", "god": "divine", "home": "home", "house": "house", "word": "word", "words": "word", "name": "name", "eye": "eye", "star": "star", "stars": "star", "moon": "moon", "sky": "sky", "wind": "air",
       "breath": "breath", "change": "change", "nothing": "nothing", "forever": "forever", "endless": "endless", "king": "king", "gold": "gold", "ice": "ice", "cold": "cold", "leaf": "leaf", "leaves": "leaf", "tree": "plant", "flower": "flower", "book": "book", "books": "book",
       "signal": "signal", "song": "sound", "music": "sound", "sound": "sound", "wave": "wave", "door": "door", "speak": "speech", "spoke": "speech", "said": "speech", "mouth": "mouth", "walk": "walk", "bird": "bird", "snake": "snake", "time": "time", "orbit": "orbit", "ring": "ring", "spark": "spark"}
json.dump({"dex": "Glyph-Dex", "version": 1, "count": len(E), "sets": ["moon", "sky", "zodiac", "elements", "alchemy", "numbers", "letters", "hieroglyphs", "bodies", "primitives", "made"], "glyphs": E, "tags": TAGS, "words": SYN},
          open(out, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(E), "glyphs,", len(TAGS), "tags ->", out, os.path.getsize(out), "bytes")
