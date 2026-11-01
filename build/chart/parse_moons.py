import re, sys, json, collections
src, dst = sys.argv[1], sys.argv[2]
t = open(src, encoding="utf-8").read()
i = t.index('{| class="wikitable sortable"')
j = t.index("\n|}", i)
body = t[i:j]
chunks = re.split(r"\n\|-[^\n]*\n", body)[1:]
def clean(s):
    s = re.sub(r"<ref[^>]*/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\{\{efn[^{}]*\}\}", "", s)
    s = re.sub(r"\{\{sort\|[^|]*\|(.*?)\}\}", r"\1", s)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[File:[^\]]*\]\]|\[\[Image:[^\]]*\]\]", "", s, flags=re.I)
    s = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"<[^>]+>", "", s)
    s = s.replace("'''''", "").replace("'''", "").replace("''", "").replace("&nbsp;", " ")
    return re.sub(r"\s+", " ", s).strip()
rows = []
for c in chunks:
    lines = c.split("\n")
    if len(lines) < 5: continue
    first = lines[0]
    name = clean(re.sub(r"^\|\s*", "", first))
    # find parent / numeral on line 2
    l2 = lines[1]
    m = re.search(r"\|\|\s*(.*?)\s*\|\|\s*(?:data-sort-value=\"[^\"]*\"\s*\|)?\s*(.*)$", l2)
    if not m: continue
    parent = clean(m.group(1)); numeral = clean(m.group(2))
    rest = " ".join(lines[2:])
    cells = [x for x in re.split(r"\|\|", "\n".join(lines[2:]))]
    flat = "\n".join(lines[2:])
    cells = re.split(r"\|\||\n\|", flat)
    cells = [clean(x) for x in cells]
    rows.append({"name": name, "parent": parent, "numeral": numeral, "cells": cells})
print(len(rows))
cnt = collections.Counter(r["parent"] for r in rows)
print(cnt)
json.dump(rows, open(dst, "w"), ensure_ascii=False, indent=0)
for r in rows[:3] + rows[200:203]: print(r)
