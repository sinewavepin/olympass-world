#!/usr/bin/env python3
"""
make_solar_chart.py -- glyph <-> object <-> name chart for the whole solar system,
with group membership. Reuses the glyph generator of make_asteroid_chart.py
(16x16 one-bit, left-right symmetric, SEED 20261030) so glyphs stay unique across
both charts. Inputs are raw source dumps (JPL SBDB / JPL satellite table /
Wikipedia wikitext); outputs are written to <outdir>.
usage: python3 make_solar_chart.py <srcdir> <asteroid_chart.json> <outdir>
"""
import json, re, sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_asteroid_chart import unique_glyph, SEED

src, astchart, out = sys.argv[1:4]
os.makedirs(out, exist_ok=True)
J = lambda f: json.load(open(os.path.join(src, f), encoding="utf-8"))

used = set()
for e in json.load(open(astchart))["entries"]:
    used.add(tuple(int(r, 16) for r in e["rows"]))
OFF = {"S": 1000000, "P": 1001000, "D": 1002000, "M": 2000000, "J": 3000000, "C": 4000000,
       "T": 4100000, "N": 4200000, "Y": 5000000, "Z": 6000000, "H": 6100000, "X": 6200000}
counter = collections.Counter()
groups = collections.OrderedDict()

def gdef(gid, label, definition, source):
    groups.setdefault(gid, {"id": gid, "label": label, "definition": definition, "source": source, "members": []})

def entry(prefix, name, kind, groupids, **data):
    counter[prefix] += 1
    n = OFF[prefix] + counter[prefix]
    seed, rows = unique_glyph(n, used)
    eid = "%s%06d" % (prefix, counter[prefix])
    for g in groupids:
        groups[g]["members"].append(eid)
    d = {k: v for k, v in data.items() if v not in (None, "")}
    return {"id": eid, "seed": seed, "rows": ["%04X" % r for r in rows], "kind": kind,
            "name": name, "groups": groupids, **d}

SBDB = "NASA/JPL SBDB (ssd-api.jpl.nasa.gov/sbdb_query.api)"
WP = "Wikipedia"
files = {}

# ---------- Sun, planets, dwarf planets ----------
gdef("star", "Star", "The Sun.", WP)
gdef("planet", "Planet", "The eight IAU planets.", "IAU")
gdef("dwarf-iau", "Dwarf planet (IAU-recognised)", "Ceres, Pluto, Haumea, Makemake, Eris.", "IAU")
gdef("dwarf-probable", "Dwarf planet (probable / candidate)", "Trans-Neptunian objects and others listed as probable dwarf planets, not formally named by the IAU.", "https://en.wikipedia.org/wiki/Dwarf_planet")
bodies = [entry("S", "Sun", "star", ["star"])]
for p in ["Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"]:
    bodies.append(entry("P", p, "planet", ["planet"]))
dw = open(os.path.join(src, "dwarf.wiki"), encoding="utf-8").read()
tbl = dw[dw.index("|+ Orbital attributes"):]
tbl = tbl[:tbl.index("|}")]
dnames = []
for line in tbl.splitlines():
    if not line.startswith("! scope=row"): continue
    cell = line.split("|", 1)[1] if False else line[line.index("|", line.index("scope=row")) + 1:]
    m = re.search(r"\{\{dp\|([^}|]+)", cell) or re.search(r"\[\[(?:[^\]|]*\|)?([^\]]+)\]\]", cell)
    if m: dnames.append(m.group(1).strip())
IAU5 = ["Ceres", "Pluto", "Haumea", "Makemake", "Eris"]
for nme in dnames:
    g = "dwarf-iau" if nme in IAU5 else "dwarf-probable"
    bodies.append(entry("D", nme, "dwarf-planet", [g]))
files["bodies.json"] = bodies
body_id = {b["name"]: b["id"] for b in bodies}

# ---------- Moons ----------
jpl = J("jpl_sats.json")["rows"]
wm = {re.sub(r"\s", "", r["name"]): r for r in J("moons_raw.json")}
def wgroup(r):
    if not r: return None
    for c in reversed(r["cells"]):
        if re.search(r"moon|irregular|trojan|moonlet|co-orbital|shepherd|ring|binary system", c, re.I):
            return c
    return None
moons = []
def moon(name, parent, numeral, desig, year, by, grp):
    parent = parent.replace("Dwarf Planet ", "")
    gid = "moons-" + parent.lower()
    gdef(gid, "Moons of " + parent, "Natural satellites of " + parent + ".", "JPL SSD planetary satellite table / Wikipedia List of natural satellites")
    gl = [gid]
    if grp:
        sg = "mgroup-" + re.sub(r"[^a-z0-9]+", "-", grp.lower()).strip("-")[:60]
        gdef(sg, grp, "Sub-group label from Wikipedia's List of natural satellites.", WP)
        gl.append(sg)
    moons.append(entry("M", name or desig, "moon", gl, parent=parent, parent_id=body_id.get(parent),
                       numeral=numeral if numeral not in ("—", "") else None, designation=desig, year=year, discoverer=by))
for r in jpl:
    w = wm.get(re.sub(r"\s", "", r["name"] or r["designation"])) or wm.get(re.sub(r"\s", "", r["designation"]))
    moon(r["name"], r["parent"], r["numeral"], r["designation"], r["year"], r["discoverer"], wgroup(w))
have = {re.sub(r"\s", "", (m["name"])) for m in moons}
for r in J("moons_raw.json"):
    if r["parent"] in ("Earth", "Orcus", "Haumea", "Quaoar", "Makemake", "Gonggong", "Eris") and re.sub(r"\s", "", r["name"]) not in have:
        c = r["cells"]
        moon(r["name"], r["parent"], r["numeral"], None, None, None, wgroup(r))
# Namaka (second moon of Haumea; sits outside the main table in the wikitext)
if "Namaka" not in {m["name"] for m in moons}:
    moon("Namaka", "Haumea", "II", None, None, None, None)
files["moons.json"] = moons

# ---------- Jupiter Trojans ----------
gdef("jt-greek-camp", "Jupiter Trojans: Greek camp (L4)", "Leading cloud, ~60 deg ahead of Jupiter. Camp assigned from orbital longitude vs Jupiter at epoch JD 2461200.5.", "JPL SBDB class TJN; Wikipedia 'List of Jupiter trojans (Greek camp)'")
gdef("jt-trojan-camp", "Jupiter Trojans: Trojan camp (L5)", "Trailing cloud, ~60 deg behind Jupiter. Camp assigned from orbital longitude vs Jupiter at epoch JD 2461200.5.", "JPL SBDB class TJN; Wikipedia 'List of Jupiter trojans (Trojan camp)'")
gdef("jt-interloper-greek-camp", "Trojan-named body inside the Greek camp", "624 Hektor: named for a Trojan hero, orbits in the Greek (L4) camp; it was named before the convention existed.", "Wikipedia 'List of Jupiter trojans (Greek camp)'")
gdef("jt-interloper-trojan-camp", "Greek-named body inside the Trojan camp", "617 Patroclus: named for a Greek hero, orbits in the Trojan (L5) camp; it was named before the convention existed.", "Wikipedia 'List of Jupiter trojans (Trojan camp)'")
gdef("binary", "Asteroid with a known companion", "Objects flagged by JPL SBDB as having at least one known satellite (sb-sat filter).", SBDB)
gdef("lucy-target", "Lucy mission target", "Bodies Lucy flies by: 152830 Dinkinesh, 52246 Donaldjohanson, 3548 Eurybates, 15094 Polymele, 11351 Leucus, 21900 Orus, 617 Patroclus-Menoetius.", "https://en.wikipedia.org/wiki/Lucy_(spacecraft)")
sat = {r[0]: r for r in J("sat_all.json")["data"]}
LUCY = {"152830", "52246", "3548", "15094", "11351", "21900", "617"}
tj = {r["pdes"]: r for r in J("tjn_camps.json")}
rawj = {str(r[1]): r for r in J("tjn.json")["data"]}
trojans = []
trojan_ids = {}
for r in J("tjn.json")["data"]:
    spk, pdes, name, full, dia = r[:5]
    camp = tj[pdes]["camp"]
    g = ["jt-greek-camp" if camp == "L4" else "jt-trojan-camp"]
    if pdes == "624": g.append("jt-interloper-greek-camp")
    if pdes == "617": g.append("jt-interloper-trojan-camp")
    if spk in sat: g.append("binary")
    if pdes in LUCY: g.append("lucy-target")
    num = int(pdes) if pdes.isdigit() else None
    desig = re.search(r"\(([^)]*)\)\s*$", full.strip())
    trojans.append(entry("J", name or full.strip(), "jupiter-trojan", g, number=num,
                         designation=desig.group(1) if desig else (None if num else pdes),
                         camp=camp, diameter_km=float(dia) if dia else None, spkid=spk))
    trojan_ids[spk] = trojans[-1]["id"]
files["jupiter_trojans.json"] = trojans

# ---------- Centaurs, TNOs, NEO classes, hyperbolic ----------
CL = {"CEN": ("C", "centaur", "Centaur", "Orbits between Jupiter and Neptune (JPL class CEN)."),
      "TNO": ("T", "tno", "Trans-Neptunian object", "Orbits beyond Neptune (JPL class TNO)."),
      "IEO": ("N", "neo-ieo", "Interior-Earth object (Atira-type)", "Orbit entirely inside Earth's (JPL class IEO)."),
      "ATE": ("N", "neo-aten", "Aten", "Earth-crossing, a < 1 AU (JPL class ATE)."),
      "HYA": ("H", "hyperbolic", "Hyperbolic asteroid", "Unbound orbit (JPL class HYA).")}
sat_done = set(trojan_ids)
small = collections.defaultdict(list)
for c, (pre, gid, lab, dfn) in CL.items():
    gdef(gid, lab, dfn, SBDB)
    for r in J("cls_%s.json" % c)["data"]:
        spk, pdes, name, full, cls, dia = r[:6]
        g = [gid]
        if spk in sat: g.append("binary"); sat_done.add(spk)
        num = int(pdes) if pdes.isdigit() else None
        if num and num <= 1000:   # already in the 1-1000 asteroid chart
            for gg in g: groups[gg]["members"].append("A%04d" % num)
            continue
        desig = re.search(r"\(([^)]*)\)\s*$", full.strip())
        small[c].append(entry(pre, name or full.strip(), gid, g, number=num,
                              designation=desig.group(1) if desig else (None if num else pdes),
                              diameter_km=float(dia) if dia else None, a_au=float(r[6]) if r[6] else None, spkid=spk))
files["centaurs_tno.json"] = small["CEN"] + small["TNO"]
files["neo_hyperbolic.json"] = small["IEO"] + small["ATE"] + small["HYA"]

# ---------- other asteroids that have companions (belt, Mars-crossers, Apollo, Amor, Hungaria-like) ----------
CLN = {"MBA": "Main-belt asteroid", "IMB": "Inner main-belt asteroid", "OMB": "Outer main-belt asteroid",
       "MCA": "Mars-crosser", "APO": "Apollo", "AMO": "Amor", "ATE": "Aten", "TNO": "Trans-Neptunian object"}
others = []
others_src = J("sat_all.json")["data"]
sat_fields = J("sat_all.json")["fields"]
for row in others_src:
    d = dict(zip(sat_fields, row))
    if d["spkid"] in sat_done: continue
    num = int(d["pdes"]) if d["pdes"].isdigit() else None
    if num and num <= 1000:
        groups["binary"]["members"].append("A%04d" % num); continue
    desig = re.search(r"\(([^)]*)\)\s*$", d["full_name"].strip())
    others.append(entry("Z", d["name"] or d["full_name"].strip(), "asteroid-with-companion", ["binary"],
                        number=num, designation=desig.group(1) if desig else None,
                        sbdb_class=d["class"], class_label=CLN.get(d["class"]),
                        diameter_km=float(d["diameter"]) if d["diameter"] else None, spkid=d["spkid"]))
files["binary_asteroids_other.json"] = others

# ---------- Comets ----------
gdef("comet", "Comet", "All comets in JPL SBDB (sb-kind=c).", SBDB)
for c in ("C", "P", "D"):
    lab = {"C": "Non-periodic or long-period comet (C/)", "P": "Periodic comet (P/)", "D": "Defunct / disappeared comet (D/)"}[c]
    gdef("comet-" + c, lab, "Comet prefix " + c + "/.", SBDB)
comets = []
cf = J("comets.json")["fields"]
for row in J("comets.json")["data"]:
    d = dict(zip(cf, row))
    g = ["comet", "comet-" + (d["prefix"] or "C")]
    comets.append(entry("Y", d["name"] or d["full_name"].strip(), "comet", g, designation=d["pdes"],
                        comet_class=d["class"], diameter_km=float(d["diameter"]) if d["diameter"] else None, spkid=d["spkid"]))
files["comets.json"] = comets


# ---------- Lucy extras and named companions (Wikipedia: Lucy (spacecraft); Minor-planet moon) ----------
WPL = "https://en.wikipedia.org/wiki/Lucy_(spacecraft)"
extras = []
def ex(name, kind, groups_, **kw):
    extras.append(entry("X", name, kind, groups_, **kw))
for g_ in ("binary", "lucy-target"):
    pass
ex("152830 Dinkinesh", "asteroid", ["lucy-target", "binary"], number=152830, region="inner main belt", note="Lucy flyby 1 Nov 2023; binary S-type")
ex("Selam", "asteroid-moon", ["binary"], parent="152830 Dinkinesh", note="satellite of Dinkinesh, ~0.2 km")
ex("52246 Donaldjohanson", "asteroid", ["lucy-target"], number=52246, region="inner main belt", note="Lucy flyby 20 Apr 2025; C-type, Erigone family")
ex("Menoetius", "asteroid-moon", ["binary", "lucy-target", "jt-trojan-camp"], parent="617 Patroclus", note="Patroclus I; Lucy flyby 2 Mar 2033")
ex("Skamandrios", "asteroid-moon", ["binary", "jt-greek-camp"], parent="624 Hektor", note="Hektor I")
ex("Queta", "asteroid-moon", ["binary", "lucy-target", "jt-greek-camp"], parent="3548 Eurybates", note="Eurybates I")
ex("Shaun", "asteroid-moon", ["binary", "lucy-target", "jt-greek-camp"], parent="15094 Polymele", note="temporary name for Polymele's companion")
gdef("spacecraft", "Spacecraft", "Spacecraft to small bodies (so far: Lucy).", WPL)
ex("Lucy", "spacecraft", ["spacecraft"], launched="2021-10-16", note="NASA mission to the Jupiter Trojans; encounters: Dinkinesh 2023-11-01, Donaldjohanson 2025-04-20, Eurybates/Queta 2027-08-12, Polymele/Shaun 2027-09-15, Leucus 2028-04-18, Orus 2028-11-11, Patroclus-Menoetius 2033-03-02")
files["lucy_and_companions.json"] = extras
# Polymele has a confirmed companion (Shaun) although the SBDB satellite flag is not set for it
for e in trojans:
    if e.get("number") == 15094 and "binary" not in e["groups"]:
        e["groups"].append("binary"); groups["binary"]["members"].append(e["id"])

# ---------- group catalogue, counts, write ----------
catalog = []
for g in groups.values():
    n = len(g["members"])
    cat = {k: g[k] for k in ("id", "label", "definition", "source")}
    cat["count"] = n
    if n <= 700: cat["members"] = g["members"]
    catalog.append(cat)
# groups that are not enumerated
NOT_YET = [("MBA", 1395192), ("IMB", 33150), ("OMB", 50987), ("MCA", 30524), ("APO", 24362), ("AMO", 14936)]
pending = [{"jpl_class": c, "count_in_sbdb": n, "status": "counted, not enumerated"} for c, n in NOT_YET]
for fname, rows in files.items():
    head = {"chart": "glyph-solar-system", "file": fname, "count": len(rows), "grid": 16, "seed": SEED}
    with open(os.path.join(out, fname), "w", encoding="utf-8") as f:
        f.write(json.dumps(head, ensure_ascii=False)[:-1] + ',\n"entries": [\n')
        f.write(",\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in rows))
        f.write("\n]}\n")
with open(os.path.join(out, "groups.json"), "w", encoding="utf-8") as f:
    json.dump({"chart": "glyph-solar-system", "groups": catalog, "not_enumerated": pending,
               "files": {k: len(v) for k, v in files.items()},
               "total_entries": sum(len(v) for v in files.values())}, f, ensure_ascii=False, indent=1)
print({k: len(v) for k, v in files.items()}, "total", sum(len(v) for v in files.values()))
