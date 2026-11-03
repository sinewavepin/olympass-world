#!/usr/bin/env python3
"""
p13_aster_library.py -- assert-once patch on the built Shell (after p12).

- "I hear you." opens a small terminal feed of the bodies that answered (build/aster/hears_feed.js).
  After the first answer the console rests faintly in its corner so it can be clicked.
- Aster's Library of Light (build/aster/aster_library.js, build/aster/adr_reader.js): the floating
  asterisk, the astral fountain, the Nodes and the dynamic reader for .adr books in shell/library/.
usage: python3 build/p13_aster_library.py
"""
import os, json
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
P = B + "shell/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

rep('<div id="hears" role="status" aria-live="polite">I hear you.</div>',
    '<div id="hears" role="status" aria-live="polite">I hear you.</div>\n'
    '<div id="hearsFeed" role="log" aria-label="Who answered" hidden><div id="hfHead"><span>WHO ANSWERED · <b id="hfN">0</b></span><button type="button" id="hfX" aria-label="Close">&times;</button></div><div id="hfLog"></div></div>\n'
    '<canvas id="aster" tabindex="0" role="button" aria-label="Aster\'s Library of Light"></canvas>\n'
    '<div id="asterLib" hidden role="dialog" aria-label="Aster\'s Library of Light">\n'
    '  <canvas id="alc" aria-label="The Nodes of the library. Each one opens a book."></canvas>\n'
    '  <div id="alTop"><button type="button" id="alBack">&#9666; BACK</button><span id="alName">ASTER\'S LIBRARY OF LIGHT</span></div>\n'
    '  <div id="alPlace" hidden><b>PLACE A BOOK</b><p>Drop an .adr file here, choose one, or paste its text. It stays in this browser.</p>'
    '<label class="alFileL">CHOOSE A FILE<input type="file" id="alFile" accept=".adr,.txt,.md,text/plain"></label>'
    '<textarea id="alPaste" rows="6" spellcheck="false" aria-label="Paste the book here" placeholder="::adr 1&#10;title: ...&#10;::&#10;&#10;The text..."></textarea>'
    '<div class="alRow"><button type="button" id="alPlaceGo">PLACE IT</button><button type="button" id="alPlaceX">NOT NOW</button></div></div>\n'
    '  <div id="alRead" hidden role="region" aria-label="Book" data-scene="night"><div id="arHead"><b id="arTitle"></b><span id="arBy"></span></div><div id="arText"></div>'
    '<div id="arBar"><button type="button" id="arPrev">&#9666; PAGE</button><button type="button" id="arGo">PAUSE</button><button type="button" id="arNext">PAGE &#9656;</button>'
    '<button type="button" id="arAll" title="Show the rest of this page at once">THE WHOLE PAGE</button><label>PACE <input type="range" id="arPace" min="25" max="300" value="100" aria-label="Reading pace"><span id="arPaceV">1.00×</span></label><span id="arPg"></span></div></div>\n'
    '</div>')

rep("#hears.on { opacity: 1; visibility: visible;",
    "#hears.rest { opacity: .34; visibility: visible; pointer-events: auto; cursor: pointer; transition: opacity .5s, visibility 0s, color .25s, border-color .25s; }\n"
    "#hears.rest:hover, #hears.open { opacity: 1; visibility: visible; pointer-events: auto; cursor: pointer; }\n"
    "#hears.on { pointer-events: auto; cursor: pointer; }\n"
    "#hears:focus-visible { outline: 2px solid var(--eblue); outline-offset: 2px; }\n"
    "#hearsFeed { position: fixed; right: 14px; bottom: 50px; z-index: 5; width: min(320px, calc(100vw - 28px)); background: rgba(3,6,12,.9); border: 1px solid rgba(47,168,255,.3); box-shadow: 0 0 18px rgba(47,168,255,.12); font: 500 10px/1.55 var(--font-crt); letter-spacing: .06em; color: #8fa1c6; }\n"
    "#hearsFeed[hidden] { display: none; }\n"
    "#hfHead { display: flex; justify-content: space-between; align-items: center; padding: 4px 6px 4px 10px; border-bottom: 1px solid rgba(47,168,255,.18); letter-spacing: .2em; color: #6c7a99; }\n"
    "#hfHead b { color: #ffd36b; font-weight: 600; }\n"
    "#hfX { font: 600 13px/1 var(--font-crt); color: #9fb0d2; background: none; border: 0; cursor: pointer; padding: 2px 6px; min-height: 24px; }\n"
    "#hfLog { max-height: 168px; overflow-y: auto; padding: 6px 10px 8px; scrollbar-width: thin; }\n"
    ".hfL { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n"
    ".hfL b { color: #cfe0ff; font-weight: 600; }\n"
    ".hfL span { color: #6c7a99; }\n"
    ".hfW { color: #4f5d7d; margin-top: 4px; }\n"
    ".hfL.new { animation: hfIn .5s steps(8) both; }\n"
    "@keyframes hfIn { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }\n"
    "body.inroom #hearsFeed { display: none; }\n"
    "#aster { position: fixed; left: 0; top: 0; z-index: 4; display: none; cursor: pointer; touch-action: none; }\n"
    "#aster.on { display: block; }\n"
    "#aster:focus-visible { outline: 2px solid var(--eblue); outline-offset: 2px; border-radius: 50%; }\n"
    "#asterLib { position: fixed; inset: 0; z-index: 50; background: radial-gradient(ellipse 80% 70% at 50% 45%, rgba(10,12,26,.86), rgba(2,3,8,.96)); opacity: 0; transition: opacity .45s; }\n"
    "#asterLib.open { opacity: 1; }\n"
    "#asterLib[hidden] { display: none; }\n"
    "#alc { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }\n"
    "#alTop { position: absolute; left: 14px; top: 12px; display: flex; align-items: center; gap: 16px; z-index: 2; }\n"
    "#alName { font: 600 11px/1 var(--font-crt); letter-spacing: .32em; color: #ffd36b; text-shadow: 0 0 12px rgba(255,211,107,.4); }\n"
    "#asterLib button, .alFileL { font: 600 10px/1 var(--font-crt); letter-spacing: .14em; color: #cfc6b1; background: #0d0f18; border: 1px solid #3b3a4a; border-radius: 3px; padding: 8px 10px; cursor: pointer; min-height: 32px; }\n"
    "#asterLib button:hover:not(:disabled), .alFileL:hover { border-color: #ffd36b; color: #ffd36b; }\n"
    "#asterLib button:disabled { opacity: .35; cursor: default; }\n"
    "#asterLib button:focus-visible { outline: 2px solid var(--eblue); outline-offset: 2px; }\n"
    "#alPlace { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: min(460px, 92vw); z-index: 3; background: rgba(5,7,14,.96); border: 1px dashed rgba(255,211,107,.5); padding: 16px; display: flex; flex-direction: column; gap: 10px; font: 500 10.5px/1.6 var(--font-crt); color: #9fb0d2; letter-spacing: .06em; }\n"
    "#alPlace[hidden] { display: none; }\n"
    "#alPlace.over { border-color: #ffd36b; background: rgba(36,26,14,.96); }\n"
    "#alPlace b { color: #ffd36b; letter-spacing: .28em; }\n"
    "#alPlace p { margin: 0; }\n"
    ".alFileL { display: inline-block; align-self: flex-start; }\n"
    ".alFileL input { position: absolute; width: 1px; height: 1px; opacity: 0; }\n"
    "#alPaste { width: 100%; box-sizing: border-box; background: #03050a; color: #d9d2bf; border: 1px solid #2a2f44; font: 500 11px/1.5 var(--font-crt); padding: 8px; resize: vertical; }\n"
    ".alRow { display: flex; gap: 8px; }\n"
    "#alRead { position: absolute; left: 50%; top: 52%; transform: translate(-50%,-50%); width: min(780px, 94vw); height: min(74vh, 660px); z-index: 3; display: flex; flex-direction: column; border: 1px solid rgba(255,211,107,.35); box-shadow: 0 0 40px rgba(0,0,0,.6), inset 0 0 60px rgba(0,0,0,.5); transition: background 1.4s, box-shadow .6s; --ink: rgb(255,211,107); }\n"
    "#alRead[hidden] { display: none; }\n"
    "#alRead[data-scene=night] { background: radial-gradient(ellipse 90% 80% at 50% 20%, #0b1226, #03050b); }\n"
    "#alRead[data-scene=dawn] { background: linear-gradient(180deg, #120c1c 0%, #3a1d24 62%, #6a3a26 100%); }\n"
    "#alRead[data-scene=day] { background: linear-gradient(180deg, #0f2236, #1d3b55); }\n"
    "#alRead[data-scene=sea] { background: linear-gradient(180deg, #031018 0%, #052a34 55%, #0a4048 100%); }\n"
    "#alRead[data-scene=aurora] { background: radial-gradient(ellipse 120% 60% at 50% 0%, rgba(120,220,160,.22), transparent 60%), radial-gradient(ellipse 80% 50% at 70% 10%, rgba(205,176,255,.25), transparent 70%), #04060d; }\n"
    "#alRead[data-scene=deep] { background: #010104; }\n"
    "#alRead[data-scene=ember] { background: radial-gradient(ellipse 90% 70% at 50% 100%, #3a1408, #0b0503 70%); }\n"
    "#alRead.breath { animation: arBreath 1.1s ease-in-out; }\n"
    "@keyframes arBreath { 50% { box-shadow: 0 0 60px rgba(255,236,200,.18), inset 0 0 120px rgba(255,236,200,.12); } }\n"
    "#arHead { padding: 14px 20px 8px; font: 600 12px/1.3 var(--font-crt); letter-spacing: .22em; color: var(--ink); border-bottom: 1px solid rgba(255,255,255,.06); }\n"
    "#arHead span { margin-left: 10px; color: #6c7a99; letter-spacing: .14em; font-weight: 500; }\n"
    "#arText { flex: 1; overflow-y: auto; padding: 18px 26px 30px; font: 400 15px/1.75 var(--font-crt); letter-spacing: .02em; color: #ddd6c4; }\n"
    "#arText .arH { font: 600 15px/1.4 var(--font-crt); letter-spacing: .24em; color: var(--ink); margin: 6px 0 16px; text-transform: uppercase; }\n"
    "#arText .arP { margin: 0 0 18px; }\n"
    "#arText .arP:last-child::after, #arText .arH:last-child::after { content: '\\258C'; color: var(--ink); margin-left: 2px; animation: arCur 1s steps(2) infinite; }\n"
    "@keyframes arCur { 50% { opacity: 0; } }\n"
    ".fx-hush { opacity: .55; font-size: .86em; }\n"
    ".fx-glow { text-shadow: 0 0 10px currentColor; }\n"
    ".fx-swell { display: inline-block; white-space: pre; animation: arSwell 1.2s ease-out both; }\n"
    "@keyframes arSwell { 0% { opacity: .1; transform: scale(.6); } 45% { opacity: 1; transform: scale(1.22); text-shadow: 0 0 14px currentColor; } 100% { transform: scale(1); text-shadow: 0 0 6px currentColor; } }\n"
    ".fx-tremble { display: inline-block; white-space: pre; animation: arTremble .16s infinite alternate; }\n"
    "@keyframes arTremble { from { transform: translate(-.6px, .4px); } to { transform: translate(.6px, -.5px); } }\n"
    ".fx-echo { opacity: 0; animation: arEcho 2.6s ease-out forwards; letter-spacing: .14em; font-style: italic; }\n"
    "@keyframes arEcho { 20% { opacity: .55; } 100% { opacity: .26; filter: blur(.4px); } }\n"
    "@media (prefers-reduced-motion: reduce) { .fx-tremble, .fx-swell, .fx-echo, #alRead.breath { animation: none; } .fx-echo { opacity: .3; } }\n"
    "#arBar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 10px 14px; border-top: 1px solid rgba(255,255,255,.06); font: 500 9.5px/1 var(--font-crt); letter-spacing: .14em; color: #7e90b4; }\n"
    "#arBar label { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; }\n"
    "#arBar input { accent-color: #ffd36b; width: 110px; }\n"
    "#arPg { min-width: 84px; text-align: right; }\n"
    "#hears.on { opacity: 1; visibility: visible;")

# the feed listens to every wave and every answer
rep("  const n = ++SKY.n; SKY.sent.set(n, performance.now());", "  const n = ++SKY.n; SKY.sent.set(n, performance.now()); if (window.__hfOn) hfWave();")
rep("  if (window.__deepOn) DEEP.flash.set(e.id, performance.now());", "  if (window.__deepOn) DEEP.flash.set(e.id, performance.now());\n  if (window.__hfOn) hfHeard(e);")

worker = open(B + "build/sky/sky_worker.js", encoding="utf-8").read()
i = s.index("const SKY_SRC = "); j = s.index(";\n", i)
s = s[:i] + "const SKY_SRC = " + json.dumps(worker) + s[j:]

mods = "".join(open(B + "build/aster/" + f, encoding="utf-8").read() for f in ("hears_feed.js", "adr_reader.js", "aster_library.js"))
assert "</script" not in mods
rep("\nwindow.__deepOn = true; window.__DEEP = DEEP;", "\n" + mods + "\nhfInit(); window.__hfOn = true; alInit(); window.__AL = AL; window.__HF = HF;\nwindow.__deepOn = true; window.__DEEP = DEEP;")

open(P, "w", encoding="utf-8").write(s)
print("patched", P, len(s))
