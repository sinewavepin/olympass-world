#!/usr/bin/env python3
"""
p11_jupiter_view.py -- assert-once patch on the built Shell (after p10).

The main view becomes the inside of Ganymede's mind looking out on the Jupiter system:
- a new canvas (#deep) behind everything: stars, Jupiter always present, Io, Europa and Callisto
  on their rounds, and the bodies Ganymede keeps track of, each drawn as its glyph in its door's
  colour and moving by the rule of its kind (build/sky/world_deep.js);
- the glyph field is kept, carried as a case around the moon: it stays inside the screen and it
  turns and flows only as the moon is turned (the drag that turns the moon moves the field);
- a return heard from a body that is in view makes that body glow.
usage: python3 build/p11_jupiter_view.py
"""
import os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
P = B + "shell/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

rep('<canvas id="aurora" aria-hidden="true"></canvas>', '<canvas id="deep" aria-hidden="true"></canvas>\n<canvas id="aurora" aria-hidden="true"></canvas>')
rep("#aurora { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; display: block; }",
    "#deep { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; display: block; }\n"
    "#aurora { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; display: block; }")

# the field can be turned by the operator instead of by the clock
rep("function drawField(x, dpr, W, H, cx, cy, R0, maxR, T, alpha, t, pulseOn) {\n  const s = F.step, N = F.ring, side = TAU / N, lnS = Math.log(s);\n  const m0 = Math.floor(T), frac = T - m0, rot = t * 0.004 * MOT;",
    "function drawField(x, dpr, W, H, cx, cy, R0, maxR, T, alpha, t, pulseOn, rotO) {\n  const s = F.step, N = F.ring, side = TAU / N, lnS = Math.log(s);\n  const m0 = Math.floor(T), frac = T - m0, rot = rotO !== undefined ? rotO : t * 0.004 * MOT;")
rep("  drawField(fctx, fd, innerWidth, innerHeight, cx, cy + WD.oy, R * 1.06, Math.hypot(innerWidth, innerHeight) * .78, T, .22 * I * boost, t, !reduce);",
    "  if (window.__deepOn) deepDraw(now, dt);\n"
    "  /* the field is carried as a case around the moon: inside the screen, moved by whoever turns the moon */\n"
    "  if (window.__deepOn) drawField(fctx, fd, innerWidth, innerHeight, cx, cy + WD.oy, R * 1.06, Math.min(innerWidth, innerHeight) * .5, DEEP.caseT, .22 * I * boost, t, !reduce, WD.spinOff * .35 + WD.tilt * .5);\n"
    "  else drawField(fctx, fd, innerWidth, innerHeight, cx, cy + WD.oy, R * 1.06, Math.hypot(innerWidth, innerHeight) * .78, T, .22 * I * boost, t, !reduce);")

# the worker also answers which bodies come to mind next; a body heard in view glows
rep("SKY.w.onmessage = e => { const m = e.data || {}; if (m.held) SKY.held = m.held; if (m.echoes) skyReturns(m.ping, m.echoes); };",
    "SKY.w.onmessage = e => { const m = e.data || {}; if (m.held) SKY.held = m.held; if (m.echoes) skyReturns(m.ping, m.echoes); if (m.lane !== undefined && window.__deepOn) deepGot(m); };")
rep("  const el = $(\"hears\"); el.classList.add(\"on\", \"lit\");",
    "  if (window.__deepOn) DEEP.flash.set(e.id, performance.now());\n  const el = $(\"hears\"); el.classList.add(\"on\", \"lit\");")

# the worker source and the deep module
import json
worker = open(B + "build/sky/sky_worker.js", encoding="utf-8").read()
i = s.index("const SKY_SRC = "); j = s.index(";\n", i)
s = s[:i] + "const SKY_SRC = " + json.dumps(worker) + s[j:]
deep = open(B + "build/sky/world_deep.js", encoding="utf-8").read()
assert "</script" not in deep
rep("window.__SKY = SKY; window.__sendWave = sendWave;", deep + "\nwindow.__deepOn = true; window.__DEEP = DEEP;\nwindow.__SKY = SKY; window.__sendWave = sendWave;")

open(P, "w", encoding="utf-8").write(s)
print("patched", P, len(s))
