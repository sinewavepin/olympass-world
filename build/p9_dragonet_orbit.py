P = 'shell/index.html'
s = open(P, encoding='utf-8').read()
def rep(a, b, n=1):
    global s
    assert s.count(a) == n, (a[:70], s.count(a))
    s = s.replace(a, b)

rep('<nav id="doors" aria-label="Doors"></nav>',
    '<nav id="doors" aria-label="Doors"></nav>\n    <button type="button" id="dragonet" aria-label="DRAGONET.FLY, the satellite of Ganymede. Open it."><canvas id="dnSat" width="40" height="28" aria-hidden="true"></canvas></button>')
rep('#strip canvas.hl {', '''#dragonet { position: absolute; left: 0; top: 0; width: 56px; height: 39px; padding: 0; border: 0; background: none; cursor: pointer; z-index: 4; opacity: 0; pointer-events: none; will-change: transform; }
#dragonet.on { opacity: 1; pointer-events: auto; }
#dragonet canvas { width: 100%; height: 100%; image-rendering: pixelated; display: block; }
#dragonet:focus-visible { outline: 1px dashed #ffd36b; outline-offset: 4px; }
#strip canvas.hl {''')

JS = r'''/* DRAGONET.FLY, the satellite of Ganymede. It circles the moon on its own. A cursor that comes near pulls it in like a magnet;
   a cursor that touches it makes it glow; when the cursor leaves it falls back into its orbit. */
(function () {
  const el = $("dragonet"), cv = $("dnSat"), c = cv.getContext("2d");
  const P = { x: 0, y: 0, vx: 0, vy: 0, ph: 0, g: 0, init: false, last: 0 }, M = { x: 0, y: 0, on: false };
  function sat(t, g) {
    c.clearRect(0, 0, 40, 28); const cx = 20, cy = 14, R = (a, b, w, h, col) => { c.fillStyle = col; c.fillRect(a, b, w, h); }, flap = Math.sin(t * (1.4 + 2.2 * g) * 3) * 0.45;
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
  function mv(e) { const r = worldEl.getBoundingClientRect(); M.x = e.clientX - r.left; M.y = e.clientY - r.top; M.on = true; }
  addEventListener("pointermove", mv, { passive: true });
  addEventListener("pointerdown", mv, { passive: true });
  addEventListener("pointerup", e => { if (e.pointerType !== "mouse") M.on = false; }, { passive: true });
  addEventListener("pointercancel", () => { M.on = false; }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { M.on = false; });
  function orbit(ph) {
    const a = WD.R * 1.75 + 34, b = a * .4, tilt = -.38, ex = Math.cos(ph) * a, ey = Math.sin(ph) * b;
    return { x: WD.cx + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: WD.cy + ex * Math.sin(tilt) + ey * Math.cos(tilt), far: Math.sin(ph) < 0 };
  }
  if (reduce) {
    sat(0, 0); el.addEventListener("focus", () => {});
  }
  requestAnimationFrame(function loop(now) {
    requestAnimationFrame(loop);
    if (!WD.w || document.body.classList.contains("inroom")) { P.last = 0; return; }
    const ready = AR.done || (AR.on && (now - AR.t0) / 1000 > DR0 + 1.2);
    if (!ready) { el.classList.remove("on"); P.init = false; P.last = 0; return; }
    const dt = P.last ? Math.min(.05, (now - P.last) / 1000) : .016; P.last = now; const t = now / 1000;
    if (!reduce) P.ph += dt * .55;
    const o = orbit(P.ph);
    if (!P.init) { P.x = o.x; P.y = o.y; P.vx = P.vy = 0; P.init = true; el.classList.add("on"); }
    let ax = 0, ay = 0, grip = 0, dm = 1e9;
    if (M.on && !reduce) {
      dm = Math.hypot(M.x - P.x, M.y - P.y); const RANGE = 150;
      if (dm < RANGE) { grip = Math.pow(1 - dm / RANGE, .8); const k = 46 * grip; ax += (M.x - P.x) * k; ay += (M.y - P.y) * k; }
    }
    const ks = 7 * (1 - .93 * Math.min(1, grip * 1.6));                     /* the orbit's hold loosens while the magnet has him */
    ax += (o.x - P.x) * ks; ay += (o.y - P.y) * ks;
    const damp = 3.2 + 2.2 * grip; ax -= P.vx * damp; ay -= P.vy * damp;
    P.vx += ax * dt; P.vy += ay * dt; P.x += P.vx * dt; P.y += P.vy * dt;
    const touch = M.on && dm < 30, gt = touch ? 1 : 0; P.g += (gt - P.g) * Math.min(1, dt * (touch ? 7 : 2.4));
    sat(t, P.g);
    const far = o.far && grip < .1, sc = (far ? .82 : 1) + .1 * P.g;
    cv.style.filter = "drop-shadow(0 0 " + (5 + 20 * P.g).toFixed(1) + "px rgba(255," + Math.round(170 + 60 * P.g) + "," + Math.round(70 + 120 * P.g) + "," + (.45 + .5 * P.g).toFixed(2) + ")) brightness(" + (1 + .55 * P.g).toFixed(2) + ")";
    el.style.transform = "translate(" + (P.x - 28).toFixed(1) + "px," + (P.y - 20).toFixed(1) + "px) rotate(" + Math.max(-.3, Math.min(.3, P.vx / 260)).toFixed(3) + "rad) scale(" + sc.toFixed(3) + ")";
  });
})();
'''
rep('let upSounded = false;\nfunction finishArrival', 'let upSounded = false;\n' + JS + 'function finishArrival')
open(P, 'w', encoding='utf-8').write(s)
print('ok', len(s))
