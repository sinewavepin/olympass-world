#!/usr/bin/env python3
"""
p15_stardust_pixels.py -- assert-once patch on the built Shell (after p14).
- The pixel handler (build/glyphdex/sky_glyphs.js): one vector per glyph, drawn as pixel art from
  32 to 64 pixels; THE SKY draws its glyphs this way and its shelf comes from the Glyph-Dex, grouped
  by sound family, each family's shelf patterned after its sound.
- Stardust kinematics for Aster's Library (build/aster/stardust.js), on a space-scrapbook page.
- The deck: PLAY starts from the beginning; the playhead can be dragged.
usage: python3 build/p15_stardust_pixels.py
"""
import os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
P = B + "shell/index.html"
s = open(P, encoding="utf-8").read()
def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

# ---- the Sky draws its glyphs through the pixel handler ----
rep("const S = it.s * ST_U * k, cxp = it.x * ST_U * k + S / 2, cyp = it.y * ST_U * k + S / 2, p = PAL[it.c], bm = matBmp(it.g, it.c, it.mat || 0);",
    "const S = it.s * ST_U * k, cxp = it.x * ST_U * k + S / 2, cyp = it.y * ST_U * k + S / 2, p = PAL[it.c], bm = (window.__pxOn && pxHas(it.g) && pxMat(it.g, it.c, it.mat || 0, pxN(it.s))) || matBmp(it.g, it.c, it.mat || 0);")
rep('g.getContext("2d").drawImage(stBmp(shD.id, ST.col), 0, 0);',
    '{ const pc = window.__pxOn && pxHas(shD.id) && pxCanvas(shD.id, ST.col, PX_MIN); if (pc) { g.width = g.height = PX_MIN; g.getContext("2d").drawImage(pc, 0, 0); } else g.getContext("2d").drawImage(stBmp(shD.id, ST.col), 0, 0); }')
rep("else if (name === \"studio\") { stFit(); stSync(); if (window.__dkOn) { dkSize(); dkBar(); } }",
    "else if (name === \"studio\") { stFit(); stSync(); if (window.__dkOn) { dkSize(); dkBar(); } if (window.__pxOn) pxLoad(); }")

# ---- styles: the shelf by family; the library as a space scrapbook (paper, grid, tape; no glows) ----
rep("#gdMark { position: absolute;",
    "#shelf.pxShelf { display: flex; flex-direction: column; gap: 8px; grid-auto-rows: auto; height: clamp(160px, calc(100dvh - var(--bar) - 470px), 360px); }\n"
    "#shelf.pxShelf .pxGrid button { aspect-ratio: 1; }\n"
    "#shelf.pxShelf canvas { width: 100%; height: auto; max-width: 32px; }\n"
    ".pxFam { border: 1px solid #2a2418; border-radius: 3px; padding: 6px 6px 7px; background-color: #0c0a07; background-repeat: repeat; }\n"
    ".pxHead { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; font: 500 8.5px/1.2 var(--font-crt); letter-spacing: .16em; color: #6c7a99; margin-bottom: 5px; background: rgba(12,10,7,.82); padding: 3px 4px; }\n"
    ".pxHead b { font-weight: 600; letter-spacing: .24em; }\n"
    ".pxGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 3px; }\n"
    ".pxGrid button { padding: 3px !important; min-height: 0 !important; background: rgba(12,10,7,.78) !important; display: flex; align-items: center; justify-content: center; }\n"
    ".pxGrid canvas { width: 100%; max-width: 32px; height: auto; aspect-ratio: 1; image-rendering: pixelated; display: block; pointer-events: none; }\n"
    "#asterLib { background-color: #0a0d19 !important; background-image: linear-gradient(rgba(150,170,230,.065) 1px, transparent 1px), linear-gradient(90deg, rgba(150,170,230,.065) 1px, transparent 1px), linear-gradient(rgba(150,170,230,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(150,170,230,.035) 1px, transparent 1px) !important; background-size: 96px 96px, 96px 96px, 24px 24px, 24px 24px !important; }\n"
    "#asterLib #alName { text-shadow: none; }\n"
    "#asterLib #gdMark { filter: none; }\n"
    "#asterLib #alRead, #asterLib #gdPanel, #asterLib #alPlace { box-shadow: none; border: 1px solid rgba(220,210,180,.32); }\n"
    "#asterLib #alRead::before, #asterLib #gdPanel::before, #asterLib #alPlace::before, #asterLib #alRead::after, #asterLib #gdPanel::after { content: ''; position: absolute; width: 92px; height: 20px; background: repeating-linear-gradient(90deg, rgba(232,224,200,.2) 0 3px, rgba(232,224,200,.13) 3px 6px); border-left: 1px dashed rgba(232,224,200,.25); border-right: 1px dashed rgba(232,224,200,.25); pointer-events: none; z-index: 2; }\n"
    "#asterLib #alRead::before, #asterLib #gdPanel::before, #asterLib #alPlace::before { left: 18px; top: -10px; transform: rotate(-3deg); }\n"
    "#asterLib #alRead::after, #asterLib #gdPanel::after { right: 22px; bottom: -10px; transform: rotate(2.5deg); }\n"
    "#asterLib button:hover:not(:disabled), #asterLib .alFileL:hover { background: #12162a; }\n"
    "#gdMark { position: absolute;")

# ---- the modules, and the deck's play from the start and draggable head ----
px = open(B + "build/glyphdex/sky_glyphs.js", encoding="utf-8").read()
sd = open(B + "build/aster/stardust.js", encoding="utf-8").read()
deck = r'''
/* ---- the deck: PLAY starts from the beginning; the playhead can be taken and dragged ---- */
$("dkBar").addEventListener("click", e => { if (e.target.closest("#dkPlay") && !DK.play) { DK.head = dkContent()[0] + 20; DK.lastCol.clear(); DK.view.x = DK.head - 30 / DK.view.z; } }, true);
{
  let hd = null; const view = $("dkView");
  view.addEventListener("pointerdown", e => {
    if (e.target !== dkCv) return; const [sx] = dkPos(e), [hx] = dkW2S(DK.head, 0); if (Math.abs(sx - hx) > 8) return;
    e.stopPropagation(); hd = e.pointerId; try { dkCv.setPointerCapture(e.pointerId); } catch (er) {} DK.scrubbing = true;
  }, true);
  view.addEventListener("pointermove", e => { if (hd === null) { if (e.target === dkCv) { const [sx] = dkPos(e), [hx] = dkW2S(DK.head, 0); dkCv.style.cursor = Math.abs(sx - hx) <= 8 ? "ew-resize" : ""; } return; } e.stopPropagation(); const [sx] = dkPos(e); DK.head = dkS2W(sx, 0)[0]; DK.lastCol.clear(); DK.hold = null; }, true);
  const up = e => { if (hd === null) return; e.stopPropagation(); hd = null; DK.scrubbing = false; dkBar(); };
  view.addEventListener("pointerup", up, true); view.addEventListener("pointercancel", up, true);
}
'''
const_stshelf = r'''
const _stShelfPlain = stShelf;
stShelf = function () { if (window.__pxOn && PX.ready) pxShelf(); else _stShelfPlain(); };
'''
assert "</script" not in px + sd + deck
rep("\nhfInit(); window.__hfOn = true; alInit(); gdInit();",
    "\n" + px + const_stshelf + sd + deck + "\nwindow.__pxOn = true; window.__PX = PX; window.__SD = SD;\nhfInit(); window.__hfOn = true; alInit(); gdInit();")
open(P, "w", encoding="utf-8").write(s)
print("patched", P, len(s))
