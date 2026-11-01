import re, sys, json, html, collections
t = open(sys.argv[1], encoding="utf-8", errors="replace").read()
rows = []; parent = None; declared = {}
for tr in re.findall(r"<tr[^>]*>.*?</tr>", t, flags=re.S):
    m = re.search(r"Satellites of\s+([^:<]+):\s*(\d+)", tr)
    if m:
        parent = html.unescape(m.group(1)).strip(); declared[parent] = int(m.group(2)); continue
    tds = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", x))).strip()
           for x in re.findall(r"<td[^>]*>(.*?)</td>", tr, flags=re.S)]
    if len(tds) >= 5 and parent:
        rows.append({"parent": parent, "numeral": tds[0], "name": tds[1], "designation": tds[2],
                     "year": tds[3], "discoverer": tds[4]})
cnt = collections.Counter(r["parent"] for r in rows)
print("declared:", declared)
print("parsed:  ", dict(cnt))
print("mismatch:", {k: (declared[k], cnt.get(k, 0)) for k in declared if declared[k] != cnt.get(k, 0)})
json.dump({"declared": declared, "rows": rows}, open(sys.argv[2], "w"), ensure_ascii=False)
