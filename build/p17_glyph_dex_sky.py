#!/usr/bin/env python3
"""Patch the approved Shell: separate Glyph-Dex cells and streamline Sky note entry."""
from pathlib import Path

def patch_dex_cells(html):
    old = '#gdGrid { overflow-y: auto; padding: 8px 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 4px; align-content: start; }'
    new = old.replace(' gap: 4px;', ' grid-auto-rows: max-content; gap: 4px;')
    assert html.count(old) == 1, "Missing or ambiguous Glyph-Dex grid anchor"
    return html.replace(old, new, 1)

def patch_sky(page):
    def rep(old, new, count=1):
        nonlocal page
        found = page.count(old)
        if found != count:
            raise ValueError(f"Expected {count} match(es), found {found}: {old[:120]!r}")
        page = page.replace(old, new)

    rep("grid-template-areas: 'sky sky' 'deck side'", "grid-template-areas: 'sky sky' 'glyphs glyphs' 'deck side'")
    rep("grid-template-areas: 'sky' 'deck' 'side'", "grid-template-areas: 'sky' 'glyphs' 'deck' 'side'")
    rep('#stSide { grid-area: side;', '#shBox { grid-area: glyphs; }\n#stSide { grid-area: side;')
    rep('      <div class="sui" id="shBox"></div>\n', '')
    rep('        <div id="deck" aria-label="The deck">', '        <div class="sui" id="shBox"></div>\n        <div id="deck" aria-label="The deck">')
    rep('/* the layers, the side panel and the shelf move into the side column; the shelf serves both tabs */', '/* the shelf sits beneath the sky and serves both tabs */')

    rep('function stAddAt(id, x, y) { ST.auto = true; stPush();', 'function stAddAt(id, x, y) { stPush();')
    rep('if (e.button > 0) return; ST.auto = false; const [fx, fy]', 'if (e.button > 0) return; const [fx, fy]')
    rep('if (ST.auto || !stEach(it => { it.g = id; }, true)) stAdd(id);', 'stAdd(id);', 2)
    rep('''function stAdd(id) {
  ST.auto = true; stPush(); let x = ST_CW / 2 - 1, y = ST_CH / 2 - 1, guard = 0;
  while (ST.items.some(o => o.k !== "f" && o.x === x && o.y === y) && guard++ < 60) { x += 2; if (x > ST_CW - 2) { x = 0; y = (y + 2) % (ST_CH - 1); } }
  ST.items.push(stNew(id, x, y)); ST.sel = new Set([ST.items.length - 1]); stSync();
}''', '''function stAdd(id) {
  const glyphs = ST.items.filter(o => o.k !== "f"), last = glyphs[glyphs.length - 1];
  const row = last ? Math.min(last.y, ST_CH - 2) : 0;
  const start = last ? last.x + last.s : 0;
  const rows = new Map([[row, start]]);
  for (let y = row + 2; y <= ST_CH - 2; y += 2) rows.set(y, 0);
  for (let y = 0; y < row; y += 2) rows.set(y, 0);
  const space = (x, y) => !glyphs.some(o => x < o.x + o.s && x + 2 > o.x && y < o.y + o.s && y + 2 > o.y);
  const find = (y, from, to) => {
    for (let x = from; x <= to; x++) if (space(x, y)) return [x, y];
  };
  let spot;
  for (const [y, x] of rows) { spot = find(y, x, ST_CW - 2); if (spot) break; }
  // At the end of the sky, also check gaps before the anchor and between rows.
  for (let y = 0; !spot && y <= ST_CH - 2; y++) {
    if (y === row) spot = find(y, 0, Math.min(start - 1, ST_CW - 2));
    else if (!rows.has(y)) spot = find(y, 0, ST_CW - 2);
  }
  if (!spot) { stSay("the sky is full · add more sky to place another glyph"); return; }
  const [x, y] = spot;
  stAddAt(id, x, y);
  if (window.__sky && !stPlaying && (x < WSK.off || x + 2 > WSK.off + WSK.vis)) {
    WSK.off = x < WSK.off ? x : x + 2 - WSK.vis;
    skyClamp(true); skyUI();
  }
}''')
    return page

if __name__ == "__main__":
    import sys
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "shell" / "index.html"
    shell = target.read_bytes().decode("utf-8")
    target.write_bytes(patch_sky(patch_dex_cells(shell)).encode("utf-8"))
