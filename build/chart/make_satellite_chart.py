#!/usr/bin/env python3
"""
make_satellite_chart.py -- glyph <-> artificial satellite <-> name chart.
Source: UCS Satellite Database (operating satellites): https://www.ucs.org/resources/satellite-database
Glyphs from the same generator/seed as the asteroid and solar-system charts, unique across all three.
usage: python3 make_satellite_chart.py <ucs tsv> <asteroid_chart.json> <solar dir> <out json>
"""
import csv, io, json, os, re, sys, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_asteroid_chart import unique_glyph, SEED
tsv, ast, solar, dst = sys.argv[1:5]
used = {tuple(int(r, 16) for r in e["rows"]) for e in json.load(open(ast))["entries"]}
for f in glob.glob(os.path.join(solar, "*.json")):
    if f.endswith("groups.json"): continue
    for e in json.load(open(f))["entries"]: used.add(tuple(int(r, 16) for r in e["rows"]))
rows = list(csv.reader(io.StringIO(open(tsv, encoding="latin-1").read()), delimiter="\t"))
H = rows[0]
col = lambda n: H.index(n)
sl = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
groups = collections.OrderedDict()
def grp(gid, label):
    groups.setdefault(gid, {"id": gid, "label": label, "count": 0}); groups[gid]["count"] += 1; return gid
entries = []
for r in rows[1:]:
    if len(r) < 27 or not r[1].strip(): continue
    n = len(entries) + 1
    seed, gl = unique_glyph(7000000 + n, used)
    g = []
    if r[8].strip(): g.append(grp("orbit-" + sl(r[8]), "Orbit class " + r[8].strip()))
    if r[5].strip():
        for u in re.split(r"[/,]", r[5]):
            if u.strip(): g.append(grp("users-" + sl(u), "Users: " + u.strip()))
    if r[6].strip(): g.append(grp("purpose-" + sl(r[6].split("/")[0])[:40], "Purpose: " + r[6].split("/")[0].strip()))
    if r[3].strip(): g.append(grp("operator-country-" + sl(r[3])[:40], "Operator country: " + r[3].strip()))
    if re.search(r"starlink", r[1], re.I): g.append(grp("constellation-starlink", "Starlink"))
    d = {"country_operator": r[3].strip(), "operator": r[4].strip(), "users": r[5].strip(), "purpose": r[6].strip(),
         "orbit_class": r[8].strip(), "orbit_type": r[9].strip(), "launch_date": r[19].strip(), "launch_vehicle": r[24].strip(),
         "cospar": r[25].strip(), "norad": r[26].strip(), "alt_names": r[0].strip() if r[0].strip() != r[1].strip() else ""}
    entries.append({"id": "K%05d" % n, "seed": seed, "rows": ["%04X" % x for x in gl], "kind": "artificial-satellite",
                    "name": r[1].strip(), "groups": g, **{k: v for k, v in d.items() if v}})
head = {"chart": "glyph-artificial-satellites", "source": "https://www.ucs.org/resources/satellite-database",
        "scope": "operating satellites in the UCS database (not debris, not rocket bodies)", "grid": 16, "seed": SEED, "count": len(entries)}
with open(dst, "w", encoding="utf-8") as f:
    f.write(json.dumps(head, ensure_ascii=False)[:-1] + ',\n"groups": ' + json.dumps(list(groups.values()), ensure_ascii=False) + ',\n"entries": [\n')
    f.write(",\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in entries)); f.write("\n]}\n")
print(len(entries), "entries;", len(groups), "groups")
