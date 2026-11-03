#!/usr/bin/env python3
"""
p14_glyphdex.py -- assert-once patch on the built Shell (after p13).
The Glyph-Dex (build/glyphdex/glyphdex.js, data in shell/glyphdex/dex.json): its animated mark in
the top right corner of Aster's Library, the Dex panel, and the story visualizer over the reader.
usage: python3 build/p14_glyphdex.py
"""
import os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
P = B + "shell/index.html"
s = open(P, encoding="utf-8").read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)
rep('  <div id="alTop"><button type="button" id="alBack">&#9666; BACK</button><span id="alName">ASTER\'S LIBRARY OF LIGHT</span></div>\n',
    '  <div id="alTop"><button type="button" id="alBack">&#9666; BACK</button><span id="alName">ASTER\'S LIBRARY OF LIGHT</span></div>\n'
    '  <button type="button" id="gdMark" title="Glyph-Dex" aria-label="Open the Glyph-Dex"></button>\n'
    '  <div id="gdPanel" hidden role="dialog" aria-label="Glyph-Dex"><div id="gdHead"><b>GLYPH-DEX</b><span>THE SINE LANGUAGE</span><input type="search" id="gdQ" placeholder="a word or a #tag" aria-label="Find a glyph by word or tag"><button type="button" id="gdX" aria-label="Close">&times;</button></div>'
    '<div id="gdSets" role="group" aria-label="Sets"></div><div id="gdBody"><div id="gdGrid"></div><div id="gdDetail" aria-live="polite"></div></div><div id="gdStatus" role="status"></div></div>\n')
rep('<div id="alRead" hidden role="region" aria-label="Book" data-scene="night"><div id="arHead"><b id="arTitle"></b><span id="arBy"></span></div>',
    '<div id="alRead" hidden role="region" aria-label="Book" data-scene="night"><div id="arHead"><b id="arTitle"></b><span id="arBy"></span></div>'
    '<div id="arVizWrap"><canvas id="arViz" aria-label="The story visualizer: the glyphs the words call up"></canvas><span id="arVizCap"></span></div>')
rep("#arText { flex: 1;",
    "#gdMark { position: absolute; right: 14px; top: 6px; z-index: 4; width: 150px; height: 78px; padding: 0; background: none !important; border: 0 !important; color: #ffd36b; cursor: pointer; filter: drop-shadow(0 0 6px rgba(255,211,107,.45)); min-height: 0 !important; }\n"
    "#gdMark svg { width: 100%; height: 100%; display: block; overflow: visible; }\n"
    "#gdMark:hover { color: #fff3c4; }\n"
    "#gdPanel { position: absolute; left: 50%; top: 52%; transform: translate(-50%,-50%); width: min(980px, 96vw); height: min(80vh, 700px); z-index: 5; display: flex; flex-direction: column; background: rgba(4,6,14,.97); border: 1px solid rgba(255,211,107,.35); box-shadow: 0 0 50px rgba(0,0,0,.7); font: 500 10px/1.5 var(--font-crt); color: #9fb0d2; }\n"
    "#gdPanel[hidden] { display: none; }\n"
    "#gdHead { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.06); letter-spacing: .2em; }\n"
    "#gdHead b { color: #ffd36b; letter-spacing: .3em; } #gdHead span { color: #6c7a99; flex: 1; }\n"
    "#gdQ { background: #03050a; color: #d9d2bf; border: 1px solid #2a2f44; font: 500 11px/1 var(--font-crt); padding: 7px 9px; width: 200px; }\n"
    "#gdSets { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 12px; }\n"
    "#gdBody { flex: 1; display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(240px, 1fr); min-height: 0; }\n"
    "#gdGrid { overflow-y: auto; padding: 8px 12px; display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 4px; align-content: start; }\n"
    "#asterLib .gdT { padding: 5px !important; min-height: 0 !important; aspect-ratio: 1; color: #e8dcc0; display: flex; align-items: center; justify-content: center; }\n"
    "#asterLib .gdT.on { border-color: #ffd36b !important; color: #ffd36b; background: #241a0e !important; }\n"
    ".gdT svg { width: 100%; height: 100%; display: block; }\n"
    "#gdDetail { overflow-y: auto; padding: 12px 14px; border-left: 1px solid rgba(255,255,255,.06); display: flex; flex-direction: column; gap: 10px; }\n"
    ".gdBig { width: min(180px, 60%); aspect-ratio: 1; color: #ffd36b; filter: drop-shadow(0 0 10px rgba(255,211,107,.35)); align-self: center; }\n"
    ".gdBig svg { width: 100%; height: 100%; }\n"
    ".gdName { font: 600 13px/1.3 var(--font-crt); letter-spacing: .14em; color: #f0e6cc; text-align: center; }\n"
    ".gdMean { color: #8fa1c6; text-align: center; letter-spacing: .06em; }\n"
    ".gdTags { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }\n"
    "#asterLib .gdTags button { padding: 4px 6px; min-height: 0; font-size: 9px; letter-spacing: .06em; color: #9fb0d2; }\n"
    ".gdLinks { display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 4px; }\n"
    ".gdLinks span { grid-column: 1 / -1; letter-spacing: .24em; color: #6c7a99; }\n"
    "#gdStatus { padding: 6px 12px; border-top: 1px solid rgba(255,255,255,.06); color: #6c7a99; letter-spacing: .12em; }\n"
    "@media (max-width: 700px) { #gdBody { grid-template-columns: 1fr; grid-template-rows: 1fr auto; } #gdDetail { border-left: 0; border-top: 1px solid rgba(255,255,255,.06); max-height: 40%; } #gdQ { width: 120px; } }\n"
    "#arVizWrap { position: relative; height: clamp(90px, 18vh, 150px); border-bottom: 1px solid rgba(255,255,255,.06); }\n"
    "#arViz { display: block; width: 100%; height: 100%; }\n"
    "#arVizCap { position: absolute; right: 10px; bottom: 6px; font: 500 9px/1 var(--font-crt); letter-spacing: .18em; color: rgba(200,210,235,.55); text-transform: uppercase; }\n"
    "#arText { flex: 1;")
mod = open(B + "build/glyphdex/glyphdex.js", encoding="utf-8").read(); assert "</script" not in mod
rep("\nhfInit(); window.__hfOn = true; alInit(); window.__AL = AL; window.__HF = HF;", "\n" + mod + "\nhfInit(); window.__hfOn = true; alInit(); gdInit(); window.__AL = AL; window.__HF = HF; window.__GD = GD; window.__VZ = VZ;")
open(P, "w", encoding="utf-8").write(s)
print("patched", P, len(s))
