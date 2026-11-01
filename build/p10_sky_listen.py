#!/usr/bin/env python3
"""
p10_sky_listen.py -- assert-once patch on the built Shell (shell/index.html).

1. THE SKY is held off the page. The full glyph charts (build/chart) are reduced to lean files
   in shell/sky/ (build/sky/make_sky_data.py). The page carries only the Jupiter system inline;
   a background worker (build/sky/sky_worker.js, inlined) gathers the rest after the arrival,
   unhurried, so the page never waits on it and nothing on screen changes.
2. One tap on the moon sends a wave out past the screen. Bodies the wave meets return it; each
   return arrives after its out-and-back travel time and the body answers with its glyph's note.
   When a return reaches the moon, a small console bottom right says "I hear you."
   Two taps open the close-up of the moon (aurora above, ocean under). Three taps: the song.
3. The magnetic field lines around the moon are thinned from 90 to 24 and dimmed.
4. Words: the glyphs of the download are sent down and taken in; nothing is "spawned".
usage: python3 build/p10_sky_listen.py
"""
import json, os
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..") + "/"
P = B + "shell/index.html"
s = open(P, encoding="utf-8").read()

def rep(old, new, n=1):
    global s
    assert s.count(old) == n, (s.count(old), old[:90])
    s = s.replace(old, new)

# ---- 4. words ----
import re
assert len(re.findall(r"\bspawnAcc\b", s)) == 6 and len(re.findall(r"\bspawn\(\)", s)) == 2
s = re.sub(r"\bspawnAcc\b", "dlAcc", s)
s = re.sub(r"\bfunction spawn\(\)", "function sendGlyphDown()", s)
s = re.sub(r"\bspawn\(\);", "sendGlyphDown();", s)
assert len(re.findall(r"\bspawnQ\b", s)) == 4
s = re.sub(r"\bspawnQ\b", "fallQ", s)
n_part = len(re.findall(r"\bPART\b", s)); assert n_part >= 5
s = re.sub(r"\bPART\b", "INBOUND", s)
assert "spawn" not in s.replace("spawned", "")

# ---- 3. field lines: three planes of four shells instead of fifteen, a little dimmer ----
rep("    for (let li = 0; li < 15; li++) {\n      const L = 1.5 + li * .42",
    "    for (let li = 0; li < 15; li += 4) {\n      const L = 1.5 + li * .42")
rep("x.strokeStyle = auCol(L, .46 * (1 - li / 15 * .5) * ab); x.stroke();",
    "x.strokeStyle = auCol(L, .3 * (1 - li / 15 * .5) * ab); x.stroke();")

# ---- glyph notes can carry their own pitch ----
rep("const c = SND.ctx, T = TIMBRE[id.split(\":\")[0]] || TIMBRE.def, hz = glyphHz(id); if (!hz) return;",
    "const c = SND.ctx, T = TIMBRE[id.split(\":\")[0]] || TIMBRE.def, hz = o.hz || glyphHz(id); if (!hz) return;")

# ---- rings can travel inward (a return arriving) ----
rep("function ring(x, y, rgb, max, dur) { RINGS.push({ x, y, t: performance.now(), rgb, max: max || 130, dur: dur || 1100 });",
    "function ring(x, y, rgb, max, dur, inward) { RINGS.push({ x, y, t: performance.now(), rgb, max: max || 130, dur: dur || 1100, inward: !!inward });")
rep('x.strokeStyle = "rgba(" + r.rgb + "," + (.7 * (1 - a) * (1 - a)) + ")"; x.lineWidth = 1.6; x.beginPath(); x.arc(r.x, r.y, 6 + r.max * Math.sqrt(a), 0, TAU); x.stroke();',
    'x.strokeStyle = "rgba(" + r.rgb + "," + (r.inward ? 1.1 * a * (1 - a) : .7 * (1 - a) * (1 - a)) + ")"; x.lineWidth = r.inward ? 1.1 : 1.6; x.beginPath(); x.arc(r.x, r.y, r.inward ? 6 + r.max * (1 - a) * (1 - a) : 6 + r.max * Math.sqrt(a), 0, TAU); x.stroke();')

# ---- 2. taps: one sends the wave, two open the close-up, three the song ----
rep('WD.tapT = setTimeout(() => { if (WD.taps.length && !curRoom && !AR.on) { WD.taps = []; openRoom("moon"); } }, 430);',
    'WD.tapT = setTimeout(() => { const k = WD.taps.length; if (k && !curRoom && !AR.on) { WD.taps = []; if (k === 1) sendWave(); else openRoom("moon"); } }, 430);')
rep("/* the moon can be turned in four directions, with momentum; three taps on it wake a song */",
    "/* the moon can be turned in four directions, with momentum; one tap sends a wave out to the sky, two open the close-up, three wake a song */")

# ---- the dragonet and the moon do not collide: a cursor resting on the moon draws the dragonet only to the moon's rim,
#      so it never settles over the moon and catches the taps meant for it ----
rep("""    if (M.on && !reduce) {
      dm = Math.hypot(M.x - P.x, M.y - P.y); const RANGE = 150;
      if (dm < RANGE) { grip = Math.pow(1 - dm / RANGE, .8); const k = 46 * grip; ax += (M.x - P.x) * k; ay += (M.y - P.y) * k; }
    }""", """    if (M.on && !reduce) {
      let mx = M.x, my = M.y; const dcx = mx - WD.cx, dcy = my - WD.cy, dc = Math.hypot(dcx, dcy), rim = WD.R * 1.25 + 24;
      if (dc < rim) { const ux = dc > 1 ? dcx / dc : (P.x - WD.cx) / (Math.hypot(P.x - WD.cx, P.y - WD.cy) || 1), uy = dc > 1 ? dcy / dc : (P.y - WD.cy) / (Math.hypot(P.x - WD.cx, P.y - WD.cy) || 1); mx = WD.cx + ux * rim; my = WD.cy + uy * rim; }
      dm = Math.hypot(mx - P.x, my - P.y); const RANGE = 150;
      if (dm < RANGE) { grip = Math.pow(1 - dm / RANGE, .8); const k = 46 * grip; ax += (mx - P.x) * k; ay += (my - P.y) * k; }
    }""")

# ---- the console ----
rep("#readout b { color: #ffd36b; font-weight: 600; }",
    "#readout b { color: #ffd36b; font-weight: 600; }\n"
    "#hears { position: fixed; right: 14px; bottom: 16px; z-index: 5; padding: 7px 12px 6px; font: 500 10px/1.5 var(--font-crt); letter-spacing: .22em; color: #9fb0d2; background: rgba(4,7,14,.74); border: 1px solid rgba(47,168,255,.3); box-shadow: 0 0 14px rgba(47,168,255,.12); text-shadow: 0 0 8px rgba(47,168,255,.35); pointer-events: none; opacity: 0; visibility: hidden; transition: opacity .5s, visibility 0s .5s, color .25s, border-color .25s; }\n"
    "#hears.on { opacity: 1; visibility: visible; transition: opacity .35s, visibility 0s, color .25s, border-color .25s; }\n"
    "#hears.lit { color: #ffd36b; border-color: rgba(255,211,107,.55); }\n"
    "body.inroom #hears { opacity: 0; visibility: hidden; }")
rep('<canvas id="bloomF" aria-hidden="true"></canvas>',
    '<canvas id="bloomF" aria-hidden="true"></canvas>\n<div id="hears" role="status" aria-live="polite">I hear you.</div>')

# ---- 1. the sky ----
core = json.load(open(B + "shell/sky/core.json", encoding="utf-8"))
files = json.load(open(B + "shell/sky/index.json", encoding="utf-8"))["files"]
worker = open(B + "build/sky/sky_worker.js", encoding="utf-8").read()
assert "</script" not in worker
sky = r'''
/* ============ THE SKY: every named body, held off the page ============
   The bodies of the Jupiter system ride along here; the rest of the sky (moons of the other worlds,
   the 1-1000 minor planets, both Trojan camps, pairs, near-Earth bodies, satellites, the outer
   bodies, comets) is gathered by a worker after the arrival, in sky/. One tap sends a wave out;
   the worker works out which bodies return it and when; the moon hears each return as it arrives. */
const SKY_CORE = __CORE__;
const SKY_FILES = __FILES__;
const SKY_SRC = __SRC__;
const SKY = { w: null, n: 0, sent: new Map(), held: SKY_CORE.r.length, lastHeard: 0, hideT: 0 };
const SKY_VOICE = { S: "core", P: "core", D: "craters", M: "orbits", A: "iron", J: "craters", C: "paths", T: "stars", N: "radiation", H: "radiation", Y: "water", Z: "bridge1", X: "bridge2", K: "signals" };
function skyWake() {
  if (SKY.w) return;
  try {
    const u = URL.createObjectURL(new Blob([SKY_SRC], { type: "text/javascript" }));
    SKY.w = new Worker(u);
    SKY.w.onmessage = e => { const m = e.data || {}; if (m.held) SKY.held = m.held; if (m.echoes) skyReturns(m.ping, m.echoes); };
    SKY.w.postMessage({ core: SKY_CORE });
    const gather = () => SKY.w && SKY.w.postMessage({ base: new URL("sky/", location.href).href, files: SKY_FILES.filter(f => f !== "core") });
    if (window.requestIdleCallback) requestIdleCallback(gather, { timeout: 5000 }); else setTimeout(gather, 1500);
  } catch (e) { SKY.w = null; }
}
/* the sky is woken only once the arrival is over, so the download is never shared */
setTimeout(function skyWhenArrived() { if (AR.on || !WD.w) return setTimeout(skyWhenArrived, 1200); skyWake(); }, 2500);
function skySec() { return Date.now() / 1000 - 1.7e9; }
function sendWave() {
  skyWake(); if (!SKY.w) return;
  const n = ++SKY.n; SKY.sent.set(n, performance.now());
  ring(WD.cx, WD.cy, "255,211,107", Math.hypot(WD.w, WD.h) + 60, 1600);     /* the wave leaves the moon and goes on past the screen */
  SKY.w.postMessage({ ping: n, t: skySec() });
}
function skyReturns(n, echoes) {
  const t0 = SKY.sent.get(n); SKY.sent.delete(n); if (t0 === undefined) return;
  const far = Math.hypot(WD.w, WD.h) + 60;
  echoes.forEach(e => {
    const at = t0 + e.delay * 1000, now = performance.now();
    /* the return is seen coming in for the last stretch of its way home */
    setTimeout(() => { if (!curRoom) ring(WD.cx, WD.cy, "205,176,255", far, 900, true); }, Math.max(0, at - 900 - now));
    setTimeout(() => skyHear(e), Math.max(0, at - now));
  });
}
function skyHear(e) {
  if (curRoom || AR.on || document.hidden) return;
  const v = SKY_VOICE[e.k] || "def", T = TIMBRE[v] || TIMBRE.def;
  playGlyph(v + ":" + e.id, { hz: T.base * Math.pow(2, e.step / 12 + e.oct), vol: Math.min(.42, .16 + .05 * e.strength), x: .5 });
  const el = $("hears"); el.classList.add("on", "lit"); setTimeout(() => el.classList.remove("lit"), 260);
  clearTimeout(SKY.hideT); SKY.hideT = setTimeout(() => el.classList.remove("on"), 3400);
}
'''
sky = sky.replace("__CORE__", json.dumps(core, ensure_ascii=False, separators=(",", ":"))).replace("__FILES__", json.dumps(files)).replace("__SRC__", json.dumps(worker))
rep("window.__RINGS = RINGS;", sky + "window.__SKY = SKY; window.__sendWave = sendWave;\nwindow.__RINGS = RINGS;")

open(P, "w", encoding="utf-8").write(s)
print("patched", P, len(s), "bytes")
