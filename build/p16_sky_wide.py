#!/usr/bin/env python3
"""
p16_sky_wide.py -- assert-once patch on the built Shell (after p15).
- THE SKY runs the full width of the page with no cabinet around it (its scan lines and glow stay);
  the deck and the side panel sit side by side underneath. ADD SKY makes the sky longer, eighteen
  columns at a time. Playing, the playhead stays at the centre unseen and the sky moves past it.
- The layers are always shown, each ink layer with a delete on its side (BRING BACK returns it).
- A GLYPHS brush paints with glyphs; a comet button holds back the shooting stars or lets them fly.
- The deck starts fresh under a new key (the old deck stays in the browser under its own key).
- Aster's Library: the Node titles are made of more grains, sampled finer, on two lines when long.
usage: python3 build/p16_sky_wide.py
"""
import os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
P = B + "shell/index.html"
s = open(P, encoding="utf-8").read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

# ---- the sky's length is now the open card's own ----
rep("const ST_CW = 18, ST_CH = 14, ST_U = 16;", "let ST_CW = 18; const ST_CH = 14, ST_U = 16;")
rep("play: stPlay, hum: stHum,", "play: () => stPlay(), hum: stHum,")

# ---- markup: tools on the sky, the bar to move along it, the side column ----
rep('<b id="drOpV">100%</b></label></div><div class="scan"></div>',
    '<b id="drOpV">100%</b></label></div>'
    '<div id="skyTools"><button type="button" id="skyComet" aria-pressed="true" aria-label="Shooting stars">'
    '<svg viewBox="0 0 20 10" width="34" height="17" aria-hidden="true" shape-rendering="crispEdges">'
    '<path fill="#2f6fb0" d="M1 5h5v1H1z"/><path fill="#4fa3e8" d="M4 4h6v1H4zM5 6h5v1H5z"/>'
    '<path fill="#9fd4ff" d="M8 5h6v1H8zM10 3h4v1h-4zM11 7h3v1h-3z"/>'
    '<path fill="#ffd36b" d="M14 3h3v1h-3zM14 7h3v1h-3zM17 4h1v3h-1zM13 4h1v3h-1z"/><path fill="#fff6dc" d="M14 4h3v3h-3z"/></svg></button>'
    '<button type="button" id="skyLess" title="Take the last stretch of sky away (only when it is empty)" aria-label="Less sky">&minus; SKY</button>'
    '<span id="skyLen">18 COL</span>'
    '<button type="button" id="skyMore" title="Lay another stretch of sky on the right" aria-label="Add sky">+ ADD SKY</button></div>'
    '<div class="scan"></div>')
rep('<div id="drTools" class="dro" role="toolbar" aria-label="Drawing tools"></div><div class="switch">',
    '<div id="drTools" class="dro" role="toolbar" aria-label="Drawing tools"></div><input type="range" id="skyPan" min="0" max="100" value="0" aria-label="Move along the sky" hidden><div class="switch">')
LAY = ('<div class="grp"><span class="glab">LAYERS</span><div id="drLayers"></div><div class="row"><button type="button" id="drAdd">+ LAYER</button>'
       '<button type="button" id="drUpL" aria-label="Move layer up">&#9650;</button><button type="button" id="drDnL" aria-label="Move layer down">&#9660;</button></div></div>')
rep(LAY + "\n", "")
rep('<div class="sui" id="drPanel" hidden>',
    '<div id="stSide">\n      <div class="sui" id="lyBox">' + LAY.replace('</button></div></div>', '</button><button type="button" id="drBack" hidden>BRING BACK</button></div></div>') + '</div>\n'
    '      <div class="sui" id="drPanel" hidden>')
rep('<div id="stStatus" role="status" aria-live="polite"></div>\n      </div>\n    </div>\n  </div>\n\n  <div class="room" id="roomMoon">',
    '<div id="stStatus" role="status" aria-live="polite"></div>\n      </div>\n      <div class="sui" id="shBox"></div>\n      </div>\n    </div>\n  </div>\n\n  <div class="room" id="roomMoon">')

# ---- styles ----
rep("#gdMark { position: absolute;",
    "#roomStudio #studioBox { width: min(1500px, 100%); grid-template-columns: minmax(0, 1fr) minmax(300px, 420px); grid-template-areas: 'sky sky' 'deck side'; gap: 10px 12px; }\n"
    "#roomStudio #stLeft { display: contents; }\n"
    "#roomStudio #stLeft > .bezel { grid-area: sky; min-width: 0; background: none; padding: 0; border-radius: 0; box-shadow: none; }\n"
    "#roomStudio #sglass { border-radius: 6px; box-shadow: 0 0 0 1px #2a2418, 0 0 60px rgba(47,168,255,.1); }\n"
    "#roomStudio #stLeft .chin { padding: 7px 2px 0; gap: 10px 14px; flex-wrap: wrap; }\n"
    "#roomStudio #splate { color: #cfc6b1; }\n#roomStudio #splate .o { color: #ff8a28; }\n#roomStudio #smodel { color: #6c7a99; }\n"
    "#skyPan { flex: 1 1 220px; min-width: 120px; accent-color: #2fa8ff; height: 14px; margin: 0; }\n#skyPan[hidden] { display: none; }\n"
    "#roomStudio #deck { grid-area: deck; margin-top: 0; min-width: 0; }\n"
    "#stSide { grid-area: side; min-width: 0; display: flex; flex-direction: column; gap: 10px; }\n"
    "#skyTools { position: absolute; right: 8px; bottom: 8px; z-index: 6; display: flex; gap: 2px; align-items: center; }\n"
    "#skyTools button { font: 600 9.5px/1 var(--font-crt); letter-spacing: .16em; color: #9fb0d2; background: rgba(4,7,14,.78); border: 1px solid rgba(47,168,255,.3); padding: 6px 9px; cursor: pointer; min-height: 28px; }\n"
    "#skyTools button:hover:not(:disabled) { color: #ffd36b; border-color: rgba(255,211,107,.6); }\n"
    "#skyTools button:disabled { opacity: .35; cursor: default; }\n"
    "#skyTools button:focus-visible { outline: 2px solid var(--eblue); outline-offset: 1px; }\n"
    "#skyLen { font: 500 9px/28px var(--font-crt); letter-spacing: .16em; color: #7e90b4; padding: 0 7px; background: rgba(4,7,14,.6); }\n"
    "#skyTools #skyComet { padding: 4px 7px; margin-right: 6px; }\n#skyComet svg { display: block; }\n"
    "#skyTools #skyComet[aria-pressed=\"true\"] { border-color: rgba(255,211,107,.6); background: rgba(36,26,14,.9); }\n"
    "#skyTools #skyComet[aria-pressed=\"false\"] { background: rgba(4,7,14,.9); border-color: rgba(126,144,180,.25); }\n"
    "#skyComet[aria-pressed=\"false\"] svg { filter: grayscale(1) brightness(.38); }\n"
    ".drRow .drNm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n"
    ".sui .drDel { margin-left: auto; min-height: 24px; padding: 3px 8px; font-size: 13px; line-height: 1; color: #8a8068; }\n"
    ".sui .drDel:hover:not(:disabled) { color: #ff8a6a; border-color: #8a3b24; }\n"
    "#lyBox #drLayers { max-height: 180px; }\n"
    "@media (max-width: 900px) { #roomStudio #studioBox { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'sky' 'deck' 'side'; } }\n"
    "#gdMark { position: absolute;")

# ---- the shelf tells which glyph each button is, and which family each section is ----
rep('b.title = v.name; b.setAttribute("aria-label", "Glyph " + v.name + ", " + f);',
    'b.title = v.name; b.dataset.g = id; b.setAttribute("aria-label", "Glyph " + v.name + ", " + f);')
rep('sec.className = "pxFam";', 'sec.className = "pxFam"; sec.dataset.f = f;')

# ---- the deck: every card keeps its own sky length; ten deck units to a column ----
rep('const cardDur = c => ST_CW * 15000 / (c.bpm || 120) / 1000;',
    'function dkCols(c) { return (c && c.w) || 18; }\nfunction dkCW(c) { return dkCols(c) * 10; }\nconst cardDur = c => dkCols(c) * 15000 / (c.bpm || 120) / 1000;')
rep('function dkNew(x, y, from) { return { id: "C" + (DK.nid++), name: "CARD " + (DK.nid - 1), x, y, bpm: from ? from.bpm : 120,',
    'function dkNew(x, y, from) { return { id: "C" + (DK.nid++), name: "CARD " + (DK.nid - 1), x, y, w: from ? dkCols(from) : skyDefaultW(), bpm: from ? from.bpm : 120,')
rep('function dkStore() { const c = dkCur(); if (!c) return; c.items = JSON.parse(JSON.stringify(ST.items));',
    'function dkStore() { const c = dkCur(); if (!c) return; c.w = ST_CW; c.items = JSON.parse(JSON.stringify(ST.items));')
rep('if (i === DK.cur && DK.cards[i]) return; dkStore(); DK.cur = i; const c = dkCur();',
    'if (i === DK.cur && DK.cards[i]) return; dkStore(); DK.cur = i; const c = dkCur(); ST_CW = dkCols(c);')
rep('DR.cache.clear(); DR.ver++; stSync(); drPanel(); dkSave(); stSay(c.name + " is open in the sky");',
    'DR.cache.clear(); DR.ver++; if (window.__sky) skyAfterOpen(); stSync(); drPanel(); dkSave(); stSay(c.name + " is open in the sky");')
rep('else { DK.cards = [dkNew(0, 0)]; DK.cur = 0; dkStore(); }', 'else { DK.cards = [dkNew(0, 0)]; DK.cur = 0; ST_CW = dkCols(DK.cards[0]); dkStore(); }')
rep('"olympass.deck.v1"', '"olympass.deck.v2"', 2)
rep('xe = DK.cards.map(c => c.x + CARD_W)', 'xe = DK.cards.map(c => c.x + dkCW(c))')
rep('function dkNode(c, side) { return [c.x + (side > 0 ? CARD_W : 0), c.y + CARD_H / 2]; }', 'function dkNode(c, side) { return [c.x + (side > 0 ? dkCW(c) : 0), c.y + CARD_H / 2]; }')
rep('const [sx, sy] = dkW2S(c.x, c.y), w = CARD_W * z, h = CARD_H * z;', 'const [sx, sy] = dkW2S(c.x, c.y), w = dkCW(c) * z, h = CARD_H * z;')
rep('function dkInside(xh) { return DK.cards.filter(c => xh >= c.x && xh < c.x + CARD_W)', 'function dkInside(xh) { return DK.cards.filter(c => xh >= c.x && xh < c.x + dkCW(c))')
rep('col = Math.floor((now - h.t0) / 1000 / cardDur(c) * ST_CW);\n    if (col >= ST_CW) { DK.hold = null; return; }',
    'col = Math.floor((now - h.t0) / 1000 / cardDur(c) * dkCols(c));\n    if (col >= dkCols(c)) { DK.hold = null; return; }')
rep('v = inn.length ? CARD_W / cardDur(inn[0]) : CARD_W / cardDur({ bpm: 120 })', 'v = inn.length ? dkCW(inn[0]) / cardDur(inn[0]) : CARD_W / cardDur({ bpm: 120 })')
rep('const col = Math.floor((DK.head - c.x) / CARD_W * ST_CW); if (col >= 0 && col < ST_CW &&', 'const col = Math.floor((DK.head - c.x) / 10); if (col >= 0 && col < dkCols(c) &&')
rep('DK.cards.forEach(c => { if (DK.head < c.x || DK.head >= c.x + CARD_W) DK.lastCol.delete(c.id); });', 'DK.cards.forEach(c => { if (DK.head < c.x || DK.head >= c.x + dkCW(c)) DK.lastCol.delete(c.id); });')
rep('const d = Math.hypot(c.x + CARD_W / 2 - wx, c.y + CARD_H / 2 - wy);', 'const d = Math.hypot(c.x + dkCW(c) / 2 - wx, c.y + CARD_H / 2 - wy);')
rep('col = Math.floor(f * ST_CW); F.fill.set(r.card.id, Math.min(1, f));\n    if (col !== r.col && col < ST_CW)', 'col = Math.floor(f * dkCols(r.card)); F.fill.set(r.card.id, Math.min(1, f));\n    if (col !== r.col && col < dkCols(r.card))')
rep('o.v.x = cx - CARD_W / 2;', 'o.v.x = cx - dkCW(o.v) / 2;')
rep('if (wx >= c.x && wx <= c.x + CARD_W && wy >= c.y', 'if (wx >= c.x && wx <= c.x + dkCW(c) && wy >= c.y')
rep('DK.cards.push(dkNew(mx + CARD_W + 40, c0 ? c0.y : 0));', 'DK.cards.push(dkNew(mx + (c0 ? dkCW(c0) : CARD_W) + 40, c0 ? c0.y : 0));')
rep('else playGlyph(it.g, { x: (col + .5) / ST_CW, vol }); } });', 'else playGlyph(it.g, { x: (col + .5) / dkCols(c), vol }); } });')

# ---- Aster's Library: titles in more grains, finer, on two lines when long ----
rep("const SD_EDGE = 230, SD_AP = 54, SD_TITLE = 162, SD_CORE = 520;", "const SD_EDGE = 230, SD_AP = 54, SD_TITLE = 640, SD_CORE = 520;")
rep("const grids = () => { const side = j < 81 ? -1 : 1, q = j % 81, gx = q % 9, gy = Math.floor(q / 9), step = s * .028; return [cx + side * s * .19 + (gx - 4) * step, cy + (gy - 4) * step]; };",
    "const grids = () => { const half = SD_TITLE / 2, cols = Math.ceil(Math.sqrt(half * 1.15)), rows = Math.ceil(half / cols), side = j < half ? -1 : 1, q = j % half, gx = q % cols, gy = Math.floor(q / cols), step = s * .25 / cols; return [cx + side * s * .19 + (gx - (cols - 1) / 2) * step, cy + (gy - (rows - 1) / 2) * step]; };")
rep("title: sdTextPts(title, Math.round(fs * 1.6), SD_TITLE).map(p => [p[0] / 1.6, p[1] / 1.6]),", "title: sdTitlePts(title, n.s, SD_TITLE),")
rep("function sdNodePlan() {", r'''/* a title laid out for its grains: on two lines when long, at a size where there is a grain for
   nearly every lit pixel, so that the letters come out whole and can be read */
function sdTitleLines(t) { if (t.length <= 13) return [t]; const mid = t.length / 2; let b = -1; for (let i = 1; i < t.length - 1; i++) if (t[i] === " " && (b < 0 || Math.abs(i - mid) < Math.abs(b - mid))) b = i; return b > 0 ? [t.slice(0, b), t.slice(b + 1)] : [t]; }
function sdTitlePts(title, s, n) {
  const lines = sdTitleLines(title), len = Math.max(1, ...lines.map(l => l.length)), fs = Math.max(10, Math.min(s * .095, s * 1.05 / (len * .6)));
  const SS = 1, px = Math.round(fs * SS), lh = Math.round(px * 1.15), c = document.createElement("canvas"), x = c.getContext("2d"), font = "500 " + px + "px " + getComputedStyle(document.documentElement).getPropertyValue("--font-crt");
  x.font = font; const w = Math.ceil(Math.max(...lines.map(l => x.measureText(l).width))) + 6, h = lh * lines.length + 6; c.width = w; c.height = h;
  x.font = font; x.textBaseline = "middle"; x.textAlign = "center"; x.fillStyle = "#fff"; lines.forEach((l, i) => x.fillText(l, w / 2, 3 + lh * (i + .5)));
  const im = x.getImageData(0, 0, w, h).data, pts = [];
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (im[(yy * w + xx) * 4 + 3] > 100) pts.push([xx - (w >> 1), yy - (h >> 1)]);
  if (!pts.length) return Array.from({ length: n }, () => [0, 0]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const out = [];
  for (let i = 0; i < n; i++) out.push(pts[Math.floor((i + .5) * pts.length / n)]);
  return out;
}
function sdNodePlan() {''')
rep("const sz = SD.seed[i] > .92 ? 2 : 1.3; x.fillRect(ox + SD.x[i] * scale - sz / 2, oy + SD.y[i] * scale - sz / 2, sz, sz);",
    "const ro = SD.role[i], ti = ro >= 0 && (ro & 3) === 2 && SD.mode !== \"aster\" && sp < .04, sz = SD.seed[i] > .92 ? 2 : 1.3;\n"
    "    if (ti) x.fillRect(Math.round(ox + SD.x[i] * scale), Math.round(oy + SD.y[i] * scale), 1, 1); else x.fillRect(ox + SD.x[i] * scale - sz / 2, oy + SD.y[i] * scale - sz / 2, sz, sz);")

# ---- a fix: with reduced motion asked for, Jupiter was never painted once, and the deep view stopped there ----
rep("if (now - DEEP.jupAt > (reduce ? 1e12 : 900)) { jupPaint(t); DEEP.jupAt = now; }", "if (!DEEP.jup || now - DEEP.jupAt > (reduce ? 1e12 : 900)) { jupPaint(t); DEEP.jupAt = now; }")

# ---- the wide sky module ----
sky = open(B + "build/sky/sky_wide.js", encoding="utf-8").read()
fix = r'''
dkThumb = (function (plain) { return function (c) { if (DK.thumbs.has(c.id)) return DK.thumbs.get(c.id); const keep = ST_CW, other = c !== dkCur(); if (other) { ST_CW = dkCols(c); DR.cache.clear(); } try { return plain(c); } finally { if (other) { ST_CW = keep; DR.cache.clear(); } } }; })(dkThumb);
$("drPanel").addEventListener("click", e => { if (e.target.closest("#drUndo")) { e.stopPropagation(); drUndo(); drPanel(); } }, true);
'''
assert "</script" not in sky + fix
rep("\nwindow.__pxOn = true; window.__PX = PX; window.__SD = SD;", "\n" + sky + fix + "\nwindow.__pxOn = true; window.__PX = PX; window.__SD = SD;")
open(P, "w", encoding="utf-8").write(s)
print("patched", P, len(s))
