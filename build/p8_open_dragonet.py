P = 'shell/index.html'
s = open(P, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a))
    s = s.replace(a, b)

# ---------- the opening: from space, a push in at the eye, then the full zoom ----------
rep('AR.on = true; AR.done = false; AR.t0 = performance.now(); PART.length = 0; FLASH.length = 0; upSounded = false;',
    'AR.on = true; AR.done = false; AR.z0 = performance.now(); AR.t0 = AR.z0 + (reduce ? 0 : ZT * 1000); PART.length = 0; FLASH.length = 0; upSounded = false; camStart();')
rep('function finishArrival() {\n  AR.on = false; AR.done = true;',
    'function finishArrival() {\n  camClear(); AR.on = false; AR.done = true;')
rep('ts = AR.done ? 99 : (now - AR.t0) / 1000;', 'ts = AR.done ? 99 : (now - AR.t0) / 1000;\n  if (AR.on) camFrame(now, ts);')
rep('const appear = AR.done ? 1 : sm(0, .8, ts);', 'const appear = AR.done ? 1 : sm(-ZT, -ZT + .8, ts);')
rep('let upSounded = false;\nfunction finishArrival', '''let upSounded = false;
/* the camera. Seen from space the moon is small. The view first pushes in a little, beginning at the eye
   (the first glyph under the moon) and running along the rest of the glyphs; then it zooms the whole way in,
   carrying on from where the push left off, until the view is the ordinary one. */
const ZT = 5.6, ZH = .6, ZA = 2.7, S0 = .12, S1 = .5;
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2, lrp = (a, b, k) => a + (b - a) * k;
const CAM = { on: false, w: null, eye: null, last: null };
function ctr(el, wr) { const r = el.getBoundingClientRect(); return r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: wr.left + wr.width / 2, y: wr.top + wr.height / 2 }; }
function camStart() {
  camClear(); if (reduce) return;
  const wr = worldEl.getBoundingClientRect(); CAM.w = { left: wr.left, top: wr.top, width: wr.width, height: wr.height };
  CAM.eye = ctr(STRIP.stages[0], wr); CAM.last = ctr(STRIP.seal, wr); CAM.on = true; camFrame(performance.now(), -ZT);
}
function camSet(el, r0, s, f, q) { el.style.transformOrigin = "0 0"; el.style.transform = "translate(" + (q.x - r0.left - s * (f.x - r0.left)).toFixed(2) + "px," + (q.y - r0.top - s * (f.y - r0.top)).toFixed(2) + "px) scale(" + s.toFixed(4) + ")"; }
function camClear() { CAM.on = false; [worldEl, fieldCv, bloomCv].forEach(e => { e.style.transform = ""; e.style.transformOrigin = ""; }); STRIP.stages.concat(STRIP.arrows, [STRIP.seal]).forEach(c => c.classList.remove("look")); }
function camFrame(now, ts) {
  if (!CAM.on) return; const zs = ts + ZT, W = CAM.w;
  if (zs >= ZT) { worldEl.style.transform = fieldCv.style.transform = bloomCv.style.transform = ""; if (ts > 3) camClear(); return; }
  const cen = { x: W.left + W.width / 2, y: W.top + W.height / 2 }, moon = { x: W.left + WD.cx, y: W.top + WD.cy };
  let s, f, q;
  if (zs < ZA) {
    const p = Math.max(0, (zs - ZH) / (ZA - ZH)), e = eio(p); s = S0 + (S1 - S0) * e; f = { x: lrp(CAM.eye.x, CAM.last.x, e), y: lrp(CAM.eye.y, CAM.last.y, e) }; q = cen;
    const all = STRIP.stages.concat(STRIP.arrows, [STRIP.seal]).sort((a, b) => a.offsetLeft - b.offsetLeft);
    all.forEach((c, i) => c.classList.toggle("look", i <= e * (all.length - 1) + .001));
  } else {
    const p = (zs - ZA) / (ZT - ZA), e = eio(p); s = S1 * Math.pow(1 / S1, e);
    f = { x: lrp(CAM.last.x, moon.x, e), y: lrp(CAM.last.y, moon.y, e) }; q = { x: lrp(cen.x, f.x, e), y: lrp(cen.y, f.y, e) };
  }
  camSet(worldEl, W, s, f, q); camSet(fieldCv, { left: 0, top: 0 }, s, f, q); camSet(bloomCv, { left: 0, top: 0 }, s, f, q);
}
/* DRAGONET.FLY: four wings, any direction. It steers toward a place it picks, turns as it likes, and picks another. */
(function () {
  const el = $("dragonet"), cv = $("dnSat"), c = cv.getContext("2d"); let px = -80, py = 90, hd = 0, sp = 70, wp = null, wpT = 0, last = 0, t0d = performance.now();
  function sat(t) {
    c.clearRect(0, 0, 40, 28); const cx = 20, cy = 14, R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); }, flap = Math.sin(t * 1.4 * 4) * 0.45;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
      const lift = sy * flap * (sx > 0 ? 1 : -1) * 0.5 + sy * 0.55;
      for (let i = 0; i < 13; i++) { const x = cx + sx * (5 + i) - (sx < 0 ? 1 : 0), y = Math.round(cy + sy * 2 + lift * i - 1); R(x, y, 1, 3, i % 4 === 0 ? "#f4e6c3" : (i % 2 ? "#2aa7bd" : "#4df0ff")); }
      R(cx + sx * 3 - (sx < 0 ? 1 : 0), cy + sy * 2, 2, 1, "#b59a6a");
    }
    R(cx - 3, cy - 3, 6, 6, "#d9c7a0"); R(cx - 2, cy - 2, 4, 4, "#7a6642"); R(cx - 1, cy - 1, 2, 2, "#ff7a1f");
    R(cx - 1, cy - 6, 2, 1, "#f4e6c3"); R(cx - 2, cy - 7, 4, 1, "#b59a6a"); R(cx, cy - 8, 1, 1, "#ffb23e");
  }
  el.addEventListener("click", () => { location.href = "dragonet.html"; });
  el.addEventListener("pointerdown", e => e.stopPropagation());
  if (reduce) { sat(0); el.style.transform = "translate(" + Math.max(8, innerWidth - 80) + "px,72px)"; el.classList.add("fly"); return; }
  function pick(w, h) { wp = { x: 30 + Math.random() * (w - 60), y: 30 + Math.random() * (h - 100) }; wpT = 3.5 + Math.random() * 5; sp = 55 + Math.random() * 55; }
  requestAnimationFrame(function loop(now) {
    requestAnimationFrame(loop);
    const w = worldEl.clientWidth, h = worldEl.clientHeight; if (!w || document.body.classList.contains("inroom")) { last = 0; return; }
    const ready = AR.done || (AR.on && (now - AR.t0) / 1000 > DR0 + 1.2); if (!ready) { el.classList.remove("fly"); wp = null; last = 0; return; }
    el.classList.add("fly");
    const dt = last ? Math.min(.05, (now - last) / 1000) : .016; last = now; const t = (now - t0d) / 1000;
    if (!wp) { px = -60; py = 40 + Math.random() * (h - 140); hd = 0; pick(w, h); }
    wpT -= dt; const dx = wp.x - px, dy = wp.y - py;
    if (Math.hypot(dx, dy) < 50 || wpT <= 0) pick(w, h);
    let da = Math.atan2(wp.y - py, wp.x - px) - hd; da = Math.atan2(Math.sin(da), Math.cos(da));
    const turn = Math.max(-1.7 * dt, Math.min(1.7 * dt, da)); hd += turn;
    px += Math.cos(hd) * sp * dt; py += Math.sin(hd) * sp * dt + Math.sin(t * 2.1) * .25;
    px = Math.max(-90, Math.min(w + 90, px)); py = Math.max(-30, Math.min(h + 30, py));
    sat(t);
    el.style.transform = "translate(" + (px - 28).toFixed(1) + "px," + (py - 20).toFixed(1) + "px) rotate(" + (Math.sin(hd) * .28 + turn * 3).toFixed(3) + "rad)";
  });
})();
function finishArrival''')
rep('#strip canvas.hl {', '#strip canvas.look { opacity: 1; filter: drop-shadow(0 0 9px rgba(255,236,96,1)) drop-shadow(0 0 3px #fff); transition: opacity .35s, filter .35s; }\n#strip canvas.hl {')

# ---------- DRAGONET.FLY: a free satellite. It flies wherever it likes; no orbit, no gravity ----------
rep('<nav id="doors" aria-label="Doors"></nav>',
    '<nav id="doors" aria-label="Doors"></nav>\n    <button type="button" id="dragonet" aria-label="DRAGONET.FLY, the free satellite. Open it."><canvas id="dnSat" width="40" height="28" aria-hidden="true"></canvas></button>')
rep('#strip canvas.look {', '''#dragonet { position: absolute; left: 0; top: 0; width: 56px; height: 39px; padding: 0; border: 0; background: none; cursor: pointer; z-index: 4; opacity: 0; pointer-events: none; will-change: transform; }
#dragonet.fly { opacity: 1; pointer-events: auto; }
#dragonet canvas { width: 100%; height: 100%; image-rendering: pixelated; display: block; filter: drop-shadow(0 0 6px rgba(255,170,70,.55)); }
#dragonet:focus-visible { outline: 1px dashed #ffd36b; outline-offset: 4px; }
#strip canvas.look {''')

open(P, 'w', encoding='utf-8').write(s)
print('ok', len(s))
