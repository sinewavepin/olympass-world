#!/usr/bin/env python3
"""
p12_sky_cards.py -- assert-once patch on the built Shell (after p11).

THE SKY gets:
- two tabs on its screen: SKY (as it was) and DRAW (build/sky/sky_draw.js): brushes from the
  Square Peg memory in a menu at the top right, size and opacity rails on the left, layers on the
  right, tools on the bottom rim, motion per layer, and drawings that sound under the playhead;
- the DECK underneath (build/sky/sky_deck.js): the Sky is one card; cards sit anywhere on a
  zoomable deck with a playhead and scrubber on top, PLAY, FLOW from a cup, Ringers and SparkNodes.
usage: python3 build/p12_sky_cards.py
"""
import os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
P = B + "shell/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

CUP = ('<svg viewBox="0 0 16 16" width="30" height="30" aria-hidden="true" shape-rendering="crispEdges">'
       '<path fill="#ffd36b" d="M2 2h12v1h-1v3h-1v2h-1v1H5V8H4V6H3V3H2z"/><path fill="#b4520c" d="M7 9h2v3H7z"/><path fill="#ffd36b" d="M4 12h8v2H4z"/>'
       '<path fill="#2fa8ff" d="M4 3h8v2H4z" class="cupw"/></svg>')

# ---- markup: tabs, brush menu and rails over the sky glass; tools on the rim; the deck; the layers panel ----
rep('<canvas id="stc" tabindex="0" role="application" aria-label="Ganymede\'s sky"></canvas>',
    '<canvas id="stc" tabindex="0" role="application" aria-label="Ganymede\'s sky"></canvas>'
    '<div id="stTabs" role="tablist" aria-label="The sky"><button type="button" role="tab" data-tab="sky" aria-selected="true">SKY</button><button type="button" role="tab" data-tab="draw" aria-selected="false">DRAW</button></div>'
    '<div id="drBrush" class="dro"><button type="button" id="drBrushBtn" aria-haspopup="true" aria-expanded="false">DRAW ▾</button><div id="drBrushList" hidden></div></div>'
    '<div id="drRails" class="dro"><label><span>SIZE</span><input type="range" id="drSize" min="1" max="4" value="1" aria-label="Brush size"><b id="drSizeV">1</b></label>'
    '<label><span>OPACITY</span><input type="range" id="drOp" min="10" max="100" value="100" aria-label="Opacity"><b id="drOpV">100%</b></label></div>')
rep('<div class="chin"><div class="plate"><span id="splate"><span class="o">T</span>HE SKY</span><span id="smodel">GANYMEDE\'S POINT OF VIEW</span></div>',
    '<div class="chin"><div class="plate"><span id="splate"><span class="o">T</span>HE SKY</span><span id="smodel">GANYMEDE\'S POINT OF VIEW</span></div><div id="drTools" class="dro" role="toolbar" aria-label="Drawing tools"></div>')
rep('      </div>\n      <div class="sui" id="stPanel">',
    '        <div id="deck" aria-label="The deck">\n'
    '          <div id="dkBar">\n'
    '            <button type="button" id="dkPlay" class="big" title="A head sweeps the deck; whatever it passes sounds. Only a ringer stops it.">PLAY</button>'
    '<button type="button" id="dkFlow" class="big" title="The cup tips into the nearest card, then the flow follows the SparkNodes">FLOW</button>'
    '<input type="range" id="dkScrub" min="0" max="400" value="0" aria-label="Playhead">\n'
    '            <button type="button" id="dkAdd" title="A new, empty card, opened in the sky">+ CARD</button><button type="button" id="dkCopy" title="A copy of the open card">COPY CARD</button>'
    '<span class="dkR"><select id="dkMode" aria-label="What the ringer will do"><option value="hold">HOLD · the card before it plays through</option><option value="loop">LOOP · back to the card before it</option><option value="stop">STOP · the head stops here</option></select>'
    '<input type="number" id="dkN" min="1" max="64" value="2" aria-label="How many loops" hidden><button type="button" id="dkArm" title="Set what the ringer does, then click the deck to place it">RINGER</button></span>'
    '<button type="button" id="dkAway" disabled title="Put the selected card, ringer or link away on the tray">PUT AWAY</button>'
    '<span class="dkZ"><button type="button" id="dkZout" aria-label="Zoom out">&minus;</button><button type="button" id="dkZin" aria-label="Zoom in">+</button></span>\n'
    '          </div>\n'
    '          <div id="dkView"><canvas id="dkc" role="application" aria-label="The deck: cards, ringers and spark links. Drag empty space to move, the wheel or the buttons to zoom, a card to place it, the gold diamond on a card to link it to the next."></canvas>'
    '<button type="button" id="dkCup" title="FLOW · tip the cup into the nearest card" aria-label="The cup">' + CUP + '</button></div>\n'
    '          <div id="dkTray" hidden></div>\n'
    '        </div>\n'
    '      </div>\n'
    '      <div class="sui" id="drPanel" hidden>\n'
    '        <div class="row"><button type="button" id="drPlay" class="big" title="Space · the playhead sweeps the sky; drawings and glyphs sound as it passes">PLAY</button><button type="button" id="drUndo" title="Ctrl Z">UNDO</button></div>\n'
    '        <div class="grp"><span class="glab">LAYERS</span><div id="drLayers"></div><div class="row"><button type="button" id="drAdd">+ LAYER</button><button type="button" id="drUpL" aria-label="Move layer up">&#9650;</button><button type="button" id="drDnL" aria-label="Move layer down">&#9660;</button></div></div>\n'
    '        <div class="grp"><span class="glab">MOTION OF THIS LAYER</span><div class="row" id="drAnim" role="group" aria-label="Motion of this layer"></div></div>\n'
    '        <div class="grp"><span class="glab">DETAIL</span><div class="row" id="drDet" role="group" aria-label="Detail"></div></div>\n'
    '        <div class="grp"><span class="glab">INK</span><div class="row" id="drSw" role="group" aria-label="Ink colour"></div></div>\n'
    '        <p class="drNote">Under the playhead a drawing sounds: higher is higher, the ink picks the voice, and a square plays its four corners.</p>\n'
    '      </div>\n'
    '      <div class="sui" id="stPanel">')

# ---- styles ----
rep("#stc { display: block; image-rendering: pixelated; touch-action: none; cursor: crosshair; }",
    "#stc { display: block; image-rendering: pixelated; touch-action: none; cursor: crosshair; }\n"
    "#sglass { position: relative; }\n"
    "#stTabs { position: absolute; left: 8px; top: 8px; z-index: 6; display: flex; gap: 2px; }\n"
    "#stTabs button, .dro button { font: 600 9.5px/1 var(--font-crt); letter-spacing: .16em; color: #9fb0d2; background: rgba(4,7,14,.78); border: 1px solid rgba(47,168,255,.3); padding: 6px 9px; cursor: pointer; min-height: 26px; }\n"
    "#stTabs button[aria-selected=\"true\"], .dro button[aria-pressed=\"true\"] { color: #ffd36b; border-color: rgba(255,211,107,.6); background: rgba(36,26,14,.9); }\n"
    "#stTabs button:focus-visible, .dro button:focus-visible, #deck button:focus-visible { outline: 2px solid var(--eblue); outline-offset: 1px; }\n"
    "#roomStudio:not(.drawing) .dro { display: none !important; }\n"
    "#roomStudio.drawing #smodel { display: none; }\n"
    "#drBrush { position: absolute; right: 8px; top: 8px; z-index: 6; }\n"
    "#drBrushList { position: absolute; right: 0; top: 30px; display: flex; flex-direction: column; gap: 2px; min-width: 120px; }\n"
    "#drBrushList[hidden] { display: none; }\n"
    "#drRails { position: absolute; left: 8px; top: 44px; z-index: 6; display: flex; flex-direction: column; gap: 10px; padding: 8px 6px; background: rgba(4,7,14,.7); border: 1px solid rgba(47,168,255,.22); }\n"
    "#drRails label { display: flex; flex-direction: column; align-items: center; gap: 4px; font: 500 8px/1 var(--font-crt); letter-spacing: .18em; color: #7e90b4; }\n"
    "#drRails input { writing-mode: vertical-lr; direction: rtl; width: 18px; height: 84px; accent-color: #ffd36b; }\n"
    "#drRails b { font: 600 9px/1 var(--font-crt); color: #cfc6b1; }\n"
    "#drTools { display: flex; flex-wrap: wrap; gap: 3px; justify-content: center; flex: 1; }\n"
    "#drLayers { display: flex; flex-direction: column; gap: 3px; max-height: 210px; overflow: auto; }\n"
    ".drRow { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border: 1px solid #2a2418; border-radius: 3px; cursor: pointer; font: 600 10px/1 var(--font-crt); letter-spacing: .12em; color: #cfc6b1; }\n"
    ".drRow.on { border-color: #b4520c; background: #241a0e; }\n"
    ".sui .drEye { min-height: 24px; padding: 3px 6px; font-size: 11px; }\n"
    ".drNote { font: 500 9px/1.5 var(--font-crt); letter-spacing: .08em; color: #6c7a99; margin: 0; }\n"
    "#deck { margin-top: 10px; background: #0c0a07; border-radius: 8px; box-shadow: inset 0 0 0 1px #2a2418; padding: 8px; display: flex; flex-direction: column; gap: 6px; }\n"
    "#dkBar { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; }\n"
    "#deck button, #deck select, #deck input[type=number] { font: 600 9.5px/1 var(--font-crt); letter-spacing: .12em; color: #cfc6b1; background: #17130d; border: 1px solid #3b3324; border-radius: 3px; padding: 7px 8px; cursor: pointer; min-height: 30px; }\n"
    "#deck button:hover:not(:disabled) { border-color: #b4520c; color: #ffd36b; }\n"
    "#deck button.on { color: #ffd36b; border-color: #b4520c; background: #241a0e; }\n"
    "#deck button:disabled { opacity: .35; cursor: default; }\n"
    "#deck input[type=number] { width: 52px; }\n"
    "#dkScrub { flex: 1 1 160px; accent-color: #2fa8ff; min-width: 120px; }\n"
    ".dkR, .dkZ { display: inline-flex; gap: 3px; }\n"
    "#dkView { position: relative; height: clamp(170px, 26vh, 290px); border-radius: 4px; overflow: hidden; box-shadow: inset 0 0 0 1px #1b2233; }\n"
    "#dkc { display: block; width: 100%; height: 100%; touch-action: none; cursor: grab; }\n"
    "#deck #dkCup { position: absolute; left: 6px; top: 6px; padding: 2px; min-height: 0; background: rgba(4,7,14,.6); border-color: rgba(255,211,107,.35); transform-origin: 70% 80%; transition: transform .6s cubic-bezier(.3,1.4,.5,1); }\n"
    "#deck #dkCup.pour { transform: rotate(-38deg); }\n"
    "#dkCup .cupw { opacity: .9; }\n"
    "#dkTray { display: flex; flex-wrap: wrap; gap: 4px; }\n"
    "#dkTray[hidden] { display: none; }\n"
    "@media (prefers-reduced-motion: reduce) { #deck #dkCup { transition: none; } }")

# ---- the sky paints its layers; the glyphs are one of them ----
rep("  ST.items.forEach((it, i) => { if (it.k === \"f\") drawFrame(x, it, U, k); });\n  ST.items.forEach((it, i) => { if (it.k === \"f\") return; const d = stDisp(it, itemTick(it)); if (d) stItem(x, k, d, ui, it, now); });",
    "  const glyphsFn = () => { ST.items.forEach((it, i) => { if (it.k === \"f\") drawFrame(x, it, U, k); });\n  ST.items.forEach((it, i) => { if (it.k === \"f\") return; const d = stDisp(it, itemTick(it)); if (d) stItem(x, k, d, ui, it, now); }); };\n"
    "  if (window.__drOn) drPaintAll(x, k, ui, now, glyphsFn); else glyphsFn();")
# ---- PLAY sounds drawings too, and can play a sky that holds only drawings ----
rep("const gl = ST.items.filter(o => o.k !== \"f\"); if (!gl.length) { stSay(",
    "const gl = ST.items.filter(o => o.k !== \"f\"); if (!gl.length && !(window.__drOn && DR.layers.some(L => !L.glyphs && (L.cells.size || L.sq.length)))) { stSay(")
rep("stHead = Math.min(...gl.map(o => o.x)) - 1;", "stHead = gl.length ? Math.min(...gl.map(o => o.x)) - 1 : -1;")
rep("    ST.items.forEach(it => { if (it.k !== \"f\" && it.x === stHead) skyHit(it, .7); });",
    "    ST.items.forEach(it => { if (it.k !== \"f\" && it.x === stHead) skyHit(it, .7); });\n    if (window.__drOn) drSoundLayers(DR.layers, stHead, .62);")
rep("  const has = ST.items.some(o => o.m); $(\"stTl\").hidden = !has; stTl();",
    "  const has = ST.items.some(o => o.m); $(\"stTl\").hidden = !has; stTl(); if (window.__drOn) drPanel();")
# ---- the sky leaves room for the deck underneath ----
rep("const aw = $(\"sglass\").clientWidth || 560, ah = Math.max(224, innerHeight - 38 - 44 - 96);",
    "const aw = $(\"sglass\").clientWidth || 560, ah = Math.max(224, innerHeight - 38 - 44 - 96 - ($(\"deck\") ? $(\"deck\").offsetHeight + 12 : 0));")
rep("else if (name === \"studio\") { stFit(); stSync(); }",
    "else if (name === \"studio\") { stFit(); stSync(); if (window.__dkOn) { dkSize(); dkBar(); } }")

# ---- the modules ----
draw = open(B + "build/sky/sky_draw.js", encoding="utf-8").read()
deck = open(B + "build/sky/sky_deck.js", encoding="utf-8").read()
assert "</script" not in draw + deck
rep("\nwindow.__deepOn = true; window.__DEEP = DEEP;",
    "\n" + draw + "\n" + deck + "\ndrInit(); window.__drOn = true; dkInit(); window.__dkOn = true; window.__DR = DR; window.__DK = DK;\nwindow.__deepOn = true; window.__DEEP = DEEP;")

open(P, "w", encoding="utf-8").write(s)
print("patched", P, len(s))
