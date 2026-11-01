#!/usr/bin/env python3
"""
make_asteroid_chart.py

Builds the glyph <-> asteroid <-> asteroid-name chart for minor planets 1-1000.

Input : wikitext of "List of minor planets: 1-1000" (data from MPC / JPL)
Output: asteroid_chart.json

Each entry:
  id        glyph id, "A0001" .. "A1000"
  seed      integer seed; the glyph is fully reproducible from it
  rows      16 hex words (4 digits each, top bit = leftmost pixel), same
            format as the glyph rows in TESELA.lun
  asteroid  { number, name, designation, discovered, diameter_km }

Glyphs are 16 x 16, one-bit, left-right symmetric, drawn from a seeded PRNG
(SEED = 20261030, the same SEED the glyph field uses). No two glyphs in the
chart share the same pixels.

usage: python3 make_asteroid_chart.py <wikitext file> <output json>
"""
import json
import re
import sys

SEED = 20261030
MIN_PIXELS = 14


def mulberry32(a):
    a &= 0xFFFFFFFF

    def nxt():
        nonlocal a
        a = (a + 0x6D2B79F5) & 0xFFFFFFFF
        t = a
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xFFFFFFFF
        t ^= (t + (((t ^ (t >> 7)) * (t | 61)) & 0xFFFFFFFF)) & 0xFFFFFFFF
        return ((t ^ (t >> 14)) & 0xFFFFFFFF) / 4294967296.0

    return nxt


def make_glyph(seed):
    """Left-right symmetric 16x16 glyph. Core area: rows 3-12, columns 2-7, mirrored."""
    rnd = mulberry32(seed)
    grid = [[0] * 16 for _ in range(16)]
    dens = 0.38 + 0.2 * rnd()
    for y in range(3, 13):
        for x in range(2, 8):
            if rnd() < dens:
                grid[y][x] = 1
                grid[y][15 - x] = 1
    # always give the glyph a spine on the centre line, so it reads as one piece
    for y in range(4, 12):
        if rnd() < 0.5:
            grid[y][7] = grid[y][8] = 1
    rows = []
    for y in range(16):
        v = 0
        for x in range(16):
            if grid[y][x]:
                v |= 1 << (15 - x)
        rows.append(v)
    px = sum(bin(v).count("1") for v in rows)
    return rows, px


def unique_glyph(number, used):
    base = SEED ^ (number * 2654435761 & 0xFFFFFFFF)
    bump = 0
    while True:
        seed = (base + bump * 40503) & 0xFFFFFFFF
        rows, px = make_glyph(seed)
        key = tuple(rows)
        if px >= MIN_PIXELS and key not in used:
            used.add(key)
            return seed, rows
        bump += 1


def clean(cell):
    cell = re.sub(r"\{\{[^{}]*\}\}", "", cell)
    cell = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", cell)
    cell = re.sub(r"_\{([^}]*)\}", r"\1", cell)
    cell = re.sub(r"<[^>]+>", "", cell)
    return cell.replace("&nbsp;", " ").strip()


def parse(path):
    out = {}
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for line in text.splitlines():
        if not line.startswith("| "):
            continue
        cells = [c.strip() for c in line[2:].split("||")]
        if len(cells) < 8:
            continue
        m = re.match(r"\[\[(\d+) ([^\]|]+?)(?:\|[^\]]*)?\]\]$", cells[0]) or \
            re.match(r"(\d+) (.+)$", cells[0])
        if not m:
            continue
        number = int(m.group(1))
        name = clean(m.group(2))
        prov = clean(cells[1])
        prov = None if prov in ("", "—", "-") else prov
        date = clean(cells[3])
        dm = re.search(r"\{\{cvt\|([\d.]+)\|km", cells[7])
        out[number] = {
            "number": number,
            "name": name,
            "designation": prov,
            "discovered": date,
            "diameter_km": float(dm.group(1)) if dm else None,
        }
    return out


def main():
    src, dst = sys.argv[1], sys.argv[2]
    ast = parse(src)
    missing = [n for n in range(1, 1001) if n not in ast]
    if missing:
        sys.exit("missing numbers: %s" % missing)
    used = set()
    entries = []
    for n in range(1, 1001):
        seed, rows = unique_glyph(n, used)
        entries.append({
            "id": "A%04d" % n,
            "seed": seed,
            "rows": ["%04X" % r for r in rows],
            "asteroid": ast[n],
        })
    chart = {
        "chart": "glyph-asteroid",
        "range": [1, 1000],
        "grid": 16,
        "seed": SEED,
        "source": "https://en.wikipedia.org/wiki/List_of_minor_planets:_1%E2%80%931000",
        "count": len(entries),
        "entries": entries,
    }
    head = {k: v for k, v in chart.items() if k != "entries"}
    with open(dst, "w", encoding="utf-8") as f:
        f.write(json.dumps(head, ensure_ascii=False)[:-1] + ',\n"entries": [\n')
        f.write(",\n".join(json.dumps(e, ensure_ascii=False) for e in entries))
        f.write("\n]}\n")
    print("wrote", dst, len(entries), "entries")


if __name__ == "__main__":
    main()
