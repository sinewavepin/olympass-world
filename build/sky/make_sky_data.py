#!/usr/bin/env python3
"""
make_sky_data.py -- the lean sky the page carries. Reads the full glyph charts in
build/chart and writes small files the Shell fetches after it has arrived:
  <out>/index.json        groups (labels), files, kinds
  <out>/<part>.json       {"f":[fields], "r":[[...], ...]}
Fields per body: id, seed (the glyph is rebuilt from it), name, parent, a, D, x, g
  a  orbit size: AU around the Sun, or km around the parent body
  D  diameter in km (0 when unknown)
  x  Jupiter Trojans: 4 or 5 (camp L4 / L5); comets: eccentricity
  g  group indices into index.json "groups"
The full charts stay the master record; nothing here replaces them.
usage: python3 make_sky_data.py <build/chart dir> <out dir>
"""
import json, os, sys, glob
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
L = lambda p: json.load(open(os.path.join(src, p), encoding="utf-8"))
# orbit sizes (AU) and diameters (km) of the large bodies, standard values
BIG = {"Sun": (0, 1392700), "Mercury": (0.387, 4879), "Venus": (0.723, 12104), "Earth": (1.0, 12742), "Mars": (1.524, 6779),
       "Jupiter": (5.203, 139820), "Saturn": (9.537, 116460), "Uranus": (19.19, 50724), "Neptune": (30.07, 49244),
       "Ceres": (2.77, 939), "Orcus": (39.4, 910), "Pluto": (39.48, 2377), "Salacia": (42.2, 846), "Haumea": (43.1, 1560),
       "Quaoar": (43.7, 1110), "Makemake": (45.4, 1430), "Gonggong": (67.5, 1230), "Eris": (67.9, 2326), "Sedna": (506, 1000)}
groups, gi = [], {}
def G(tags):
    o = []
    for t in tags:
        if t not in gi: gi[t] = len(groups); groups.append(t)
        o.append(gi[t])
    return o
labels = {g["id"]: g["label"] for g in L("solar/groups.json")["groups"]}
F = ["id", "seed", "name", "p", "a", "D", "x", "g"]
parts = {}
def put(part, e, name, p, a, D, x, tags):
    parts.setdefault(part, []).append([e["id"], e["seed"], name, p or "", round(a, 4) if a else 0, round(D, 4) if D else 0, x or 0, G(tags)])
for e in L("solar/bodies.json")["entries"]:
    a, D = BIG.get(e["name"], (0, 0)); put("core", e, e["name"], "", a, D, 0, e["groups"])
for e in L("solar/moons.json")["entries"]:
    put("core" if e["parent"] == "Jupiter" else "moons", e, e["name"], e["parent"], e.get("a_km"), 2 * e["radius_km"] if e.get("radius_km") else 0, 0, e["groups"])
for e in L("solar/lucy_and_companions.json")["entries"]:
    put("core", e, e["name"], e.get("parent", ""), 0, 0, 0, e["groups"])
for e in L("asteroid_chart.json")["entries"]:
    s = e["asteroid"]; put("asteroids", e, s["name"], "", 0, s.get("diameter_km"), 0, ["asteroid-1-1000"])
for e in L("solar/jupiter_trojans.json")["entries"]:
    put("trojans", e, e["name"], "", e.get("a_au"), e.get("diameter_km"), 4 if e["camp"] == "L4" else 5, e["groups"])
for f, part in (("centaurs_tno.json", "outer"), ("neo_hyperbolic.json", "near"), ("binary_asteroids_other.json", "pairs")):
    for e in L("solar/" + f)["entries"]:
        put(part, e, e["name"], "", e.get("a_au"), e.get("diameter_km"), 0, e["groups"])
for e in L("solar/comets.json")["entries"]:
    put("comets", e, e["name"], "", e.get("a_au"), e.get("diameter_km"), e.get("e"), e["groups"])
for e in L("satellites.json")["entries"]:
    put("satellites", e, e["name"], "Earth", 0, 0, 0, e["groups"])
labels["asteroid-1-1000"] = "Minor planets 1-1000"
for g in json.load(open(os.path.join(src, "satellites.json")))["groups"]: labels[g["id"]] = g["label"]
order = ["core", "moons", "asteroids", "trojans", "pairs", "near", "satellites", "outer", "comets"]
for p in order:
    with open(os.path.join(out, p + ".json"), "w", encoding="utf-8") as fh:
        json.dump({"f": F, "r": parts[p]}, fh, ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(out, "index.json"), "w", encoding="utf-8") as fh:
    json.dump({"sky": "olympass", "files": order, "counts": {p: len(parts[p]) for p in order},
               "groups": [[g, labels.get(g, g)] for g in groups],
               "kinds": {"S": "star", "P": "planet", "D": "dwarf planet", "M": "moon", "A": "minor planet", "J": "Jupiter Trojan",
                         "C": "centaur", "T": "trans-Neptunian object", "N": "near-Earth", "H": "hyperbolic", "Y": "comet",
                         "Z": "asteroid with companion", "X": "Lucy and companions", "K": "artificial satellite"}},
              fh, ensure_ascii=False, separators=(",", ":"))
print({p: len(parts[p]) for p in order}, "total", sum(len(v) for v in parts.values()))
