
/* ============ THE WIDE WSK: the sky across the whole page, moving past a still playhead ============
   The sky is no longer a screen in a cabinet: it runs the full width of the page, and it can be
   made longer (ADD WSK lays another stretch of eighteen columns on its right). When it plays, the
   playhead stays still at the centre and cannot be seen; the sky itself moves, and each glyph and
   drawing sounds as it passes the middle. While playing, the sky comes round again on its far side,
   so the loop is seamless. The deck and the side panel sit side by side underneath. */
var WSK = { off: 0, vis: 18, fit: 2, hf: -1, col: -1, held: false, lastT: 0, ease: null, brushG: null, brushI: 0, gs: null, gone: [] };
try { WSK.held = localStorage.getItem("olympass.sky.held") === "1"; } catch (e) {}
const SKY_SEG = 18;
/* the fit for a given width: whole-number pixel scales, a wide frame, room left for the deck beneath */
function skyFitFor(aw) {
  const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--bar")) || 46, avail = innerHeight - bar - 44 - 44 - 210;
  const fit = Math.max(1, Math.min(3, Math.floor(avail / (ST_CH * ST_U)), Math.floor(aw / (ST_CH * ST_U * 2.2))));
  return { fit, vis: aw / (ST_U * fit) };
}
/* a new card's sky fills the screen: as many stretches as it takes to reach across */
function skyDefaultW() { const aw = ($("sglass") && $("sglass").clientWidth) || Math.min(1500, innerWidth - 16); return 18 * Math.max(1, Math.ceil(skyFitFor(aw).vis / 18)); }
function skyAfterOpen() { WSK.off = 0; WSK.ease = null; skyClamp(true); skyUI(); }
function skyMax() { return Math.max(0, ST_CW - WSK.vis); }
function skyClamp(now) {
  const to = ST_CW <= WSK.vis ? (ST_CW - WSK.vis) / 2 : clamp(WSK.off, 0, skyMax());
  if (now || reduce) { WSK.off = to; WSK.ease = null; } else if (Math.abs(to - WSK.off) > .01) WSK.ease = { from: WSK.off, to, t0: performance.now() };
}

stFit = function () {
  const g = $("sglass"), aw = g.clientWidth || 560, f = skyFitFor(aw);
  stDpr = Math.min(window.devicePixelRatio || 1, 3); stK = Math.max(1, Math.ceil(f.fit * stDpr)); WSK.fit = f.fit; WSK.vis = f.vis;
  stCv.width = Math.round(aw / f.fit * stK); stCv.height = ST_CH * ST_U * stK; stCv.style.width = "100%"; stCv.style.height = (ST_CH * ST_U * f.fit) + "px";
  if (!stPlaying) skyClamp(true); skyUI();
};

/* ---- the transport: the sky moves, the head stays at the centre ---- */
stPlay = function () {
  if (stPlaying) { stPlaying = false; clearInterval(stTimer); stHead = -1; WSK.hf = -1; WSK.off = ((WSK.off % ST_CW) + ST_CW) % ST_CW; if (WSK.off > ST_CW - WSK.vis / 2) WSK.off -= ST_CW; skyClamp(); stSync(); return; }
  const gl = ST.items.filter(o => o.k !== "f"); if (!gl.length && !(window.__drOn && DR.layers.some(L => !L.glyphs && (L.cells.size || L.sq.length)))) { stSay("the sky is empty · click a glyph below to put it here"); return; }
  if (window.__dkOn && DK.play) { DK.play = false; dkBar(); }
  stPlaying = true; stScrub = false; stTick = 0; stAcc = 0; clearInterval(stTimer);
  const first = gl.length ? Math.min(...gl.map(o => o.x)) : 0; WSK.hf = Math.max(0, first - 1) - .02; WSK.col = Math.floor(WSK.hf); WSK.ease = null; WSK.lastT = performance.now();
  WSK.off = WSK.hf - WSK.vis / 2; stSync();
};
function skyColumn(c) {
  stHead = c; stAcc++; if (stAcc % 4 === 0) stTick++;
  ST.items.forEach(it => { if (it.k !== "f" && it.x === c) skyHit(it, .7); });
  if (window.__drOn) drSoundLayers(DR.layers, c, .62);
}
function skyAdvance(now) {
  const dt = WSK.lastT ? Math.min(.1, (now - WSK.lastT) / 1000) : 0; WSK.lastT = now;
  if (stPlaying && WSK.hf > -1e8) {
    WSK.hf += dt * 1000 / stColMs;
    let guard = 0; while (Math.floor(WSK.hf) > WSK.col && guard++ < 64) { WSK.col++; if (WSK.col >= ST_CW) { WSK.col -= ST_CW; WSK.hf -= ST_CW; } skyColumn(WSK.col); }
    WSK.off = WSK.hf - WSK.vis / 2; return;
  }
  /* the deck's head, passing through the open card, carries the sky the same way */
  if (window.__dkOn && (DK.play || DK.flow) && stHead >= 0) {
    const c = dkCur(); let hf = null;
    if (DK.play && !DK.hold && c && DK.head >= c.x && DK.head < c.x + dkCW(c)) hf = (DK.head - c.x) / 10;
    if (hf !== null) { WSK.off = hf - WSK.vis / 2; WSK.ease = null; }
    else { const to = stHead + .5 - WSK.vis / 2; WSK.off += (to - WSK.off) * Math.min(1, dt * 6); }
    WSK.follow = true; return;
  }
  if (WSK.follow) { WSK.follow = false; skyClamp(); }
  if (WSK.ease) { const e = WSK.ease, f = Math.min(1, (now - e.t0) / 320), s = 1 - Math.pow(1 - f, 3); WSK.off = e.from + (e.to - e.from) * s; if (f >= 1) WSK.ease = null; }
}
$("stPanel").addEventListener("input", e => {
  if (e.target.id !== "stTempo") return; e.stopPropagation();           /* a change of pace carries on from where the sky is */
  stBpm = +e.target.value; stColMs = 15000 / stBpm; $("stBpm").textContent = stBpm + " BPM";
}, true);

/* ---- shooting stars, held back on request; they fly across whatever part of the sky is in view ---- */
rocksStep = function (now) {
  skyAdvance(now);
  const dt = Math.min(.05, (now - stLastT) / 1000 || .016); stLastT = now; if (reduce) return;
  const L = WSK.off, R = WSK.off + WSK.vis, w = R - L;
  rockIn -= dt; if (!WSK.held && rockIn <= 0 && ST.rocks.length < Math.max(4, Math.round(w / 6))) {
    rockIn = (1.2 + Math.random() * 3) * 18 / Math.max(18, w); const side = Math.floor(Math.random() * 4), sp = 14 + Math.random() * 18, a = (Math.random() - .5) * .8;
    const r = side === 0 ? { x: L - 1, y: Math.random() * ST_CH, vx: sp, vy: sp * a } : side === 1 ? { x: R + 1, y: Math.random() * ST_CH, vx: -sp, vy: sp * a } : side === 2 ? { x: L + Math.random() * w, y: -1, vx: sp * a, vy: sp } : { x: L + Math.random() * w, y: ST_CH + 1, vx: sp * a, vy: -sp };
    r.sz = Math.random() < .3 ? 2 : 1; r.hit = new Set(); ST.rocks.push(r);
  }
  ST.rocks.forEach(r => {
    r.x += r.vx * dt; r.y += r.vy * dt; const rx = stPlaying ? ((r.x % ST_CW) + ST_CW) % ST_CW : r.x;
    ST.items.forEach((it, i) => { if (it.k === "f" || r.hit.has(i)) return; if (Math.hypot(rx - (it.x + it.s / 2), r.y - (it.y + it.s / 2)) < it.s / 2 + .8) { r.hit.add(i); skyHit(it, .14); } });
  });
  ST.rocks = ST.rocks.filter(r => r.x > L - 4 && r.x < R + 4 && r.y > -4 && r.y < ST_CH + 4);
};
skyHit = function (it, vol) {
  stPing.set(it, performance.now()); ST.rip.push({ x: it.x + it.s / 2, y: it.y + it.s / 2, t: performance.now() });
  const r = stCv.getBoundingClientRect(), d = it.x + it.s / 2 - WSK.off, f = (stPlaying ? ((d % ST_CW) + ST_CW) % ST_CW : d) / WSK.vis;
  playGlyph(it.g, { x: (r.left + clamp(f, 0, 1) * r.width) / innerWidth, vol: vol || .5 });
};

/* ---- painting the wide sky ---- */
const SKY_STARS = Array.from({ length: 380 }, (_, i) => ({ x: hash2(i, 951), y: hash2(i, 952), z: .15 + hash2(i, 953) * .85, ph: hash2(i, 954) * 6.28, sp: .6 + hash2(i, 955) * 2.4, c: ["#cfe0ff", "#cfe0ff", "#ffd36b", "#a8d678", "#cdb0ff"][Math.floor(hash2(i, 956) * 5)] }));
function skyBackWide(x, W, H, U, k, now) {
  const t = reduce ? 0 : now / 1000, p = ST.ptr, off = WSK.off, tiled = stPlaying;
  const aw = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .28, W / 2, H / 2, Math.hypot(W, H) * .56);
  aw.addColorStop(0, "rgba(0,0,0,0)"); aw.addColorStop(.7, "rgba(60,40,120,.10)"); aw.addColorStop(1, "rgba(47,168,255,.20)"); x.fillStyle = aw; x.fillRect(0, 0, W, H);
  const pnx = p ? clamp((p.cx - off) / WSK.vis, 0, 1) : .5, pny = p ? p.ny : .5, ox = p ? (.5 - pnx) : 0, oy = p ? (.5 - pny) : 0;
  SKY_STARS.forEach(s => {                                                       /* the stars are far away: they move past more slowly than the sky's glyphs */
    let px = (s.x * W - t * s.z * 3 * k - off * U * s.z * .35 + ox * s.z * U * 1.6) % W; if (px < 0) px += W; const py = s.y * H + oy * s.z * U * 1.6;
    x.globalAlpha = .25 + .75 * (.5 + .5 * Math.sin(t * s.sp + s.ph)) * (.4 + .6 * s.z); x.fillStyle = s.c; const sz = s.z > .8 ? 2 * k : Math.max(1, k); x.fillRect(Math.round(px), Math.round(py), sz, sz);
  });
  x.globalAlpha = 1;
  const d = Math.max(1, Math.round(k * .7)), now2 = performance.now(), i0 = Math.floor(off), i1 = Math.ceil(off + WSK.vis);
  for (let i = i0; i <= i1; i++) {
    if (!tiled && (i < 0 || i > ST_CW)) continue; const wi = tiled ? ((i % ST_CW) + ST_CW) % ST_CW : i, sx = (i - off) * U;
    for (let j = 0; j <= ST_CH; j++) {
      let a = .26, dx = 0, dy = 0;
      if (p) { const dd = Math.hypot(wi - p.cx, j - p.cy); if (dd < 3.4) { const f = 1 - dd / 3.4; a += f * .6; dx += (p.cx - wi) * f * .22 * U; dy += (p.cy - j) * f * .22 * U; } }
      for (const r of ST.rip) { const age = (now2 - r.t) / 1500, dd = Math.hypot(wi - r.x, j - r.y), rad = age * 10; if (age < 1 && Math.abs(dd - rad) < 1) { const f = (1 - Math.abs(dd - rad)) * (1 - age); a += f * .8; dx += (wi - r.x) / (dd || 1) * f * .3 * U; dy += (j - r.y) / (dd || 1) * f * .3 * U; } }
      x.fillStyle = "rgba(" + (a > .6 ? "255,211,107" : "47,168,255") + "," + Math.min(1, a) + ")"; x.fillRect(Math.round(sx + dx), Math.round(j * U + dy) - (j === ST_CH ? d : 0), d, d);
    }
  }
  ST.rip = ST.rip.filter(r => now2 - r.t < 1500);
  ST.rocks.forEach(r => {
    const X = (r.x - off) * U, Y = r.y * U, L = 5; x.lineWidth = Math.max(1, k * .8); const g = x.createLinearGradient(X - r.vx * L * U / 30, Y - r.vy * L * U / 30, X, Y);
    g.addColorStop(0, "rgba(207,224,255,0)"); g.addColorStop(1, "rgba(207,224,255,.85)"); x.strokeStyle = g; x.beginPath(); x.moveTo(X - r.vx * L * U / 30, Y - r.vy * L * U / 30); x.lineTo(X, Y); x.stroke();
    x.fillStyle = "#e8eefc"; x.fillRect(Math.round(X), Math.round(Y), Math.max(1, k * r.sz), Math.max(1, k * r.sz));
  });
}
const _stPaintPlain = stPaint;
stPaint = function (x, k, ui, now) {
  if (x !== stX) return _stPaintPlain(x, k, ui, now);
  now = now || performance.now(); const U = ST_U * k, W = stCv.width, H = stCv.height, off = WSK.off, WW = ST_CW * U;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = "#04070b"; x.fillRect(0, 0, W, H);
  if (ui) skyBackWide(x, W, H, U, k, now);
  const glyphsFn = () => { ST.items.forEach(it => { if (it.k === "f") drawFrame(x, it, U, k); }); ST.items.forEach(it => { if (it.k === "f") return; const dd = stDisp(it, itemTick(it)); if (dd) stItem(x, k, dd, ui, it, now); }); };
  const n0 = stPlaying ? Math.floor(off / ST_CW) : 0, n1 = stPlaying ? Math.floor((off + WSK.vis) / ST_CW) : 0;
  for (let n = n0; n <= n1; n++) {
    x.save(); x.translate(Math.round((n * ST_CW - off) * U), 0); x.beginPath(); x.rect(0, 0, WW, H); x.clip();
    if (window.__drOn) drPaintAll(x, k, ui, now, glyphsFn); else glyphsFn(); x.restore();
  }
  if (!ui) return;
  const nc = stPlaying ? Math.floor((off + WSK.vis / 2) / ST_CW) : 0, X0 = Math.round((nc * ST_CW - off) * U);
  x.save(); x.translate(X0, 0);
  ST.sel.forEach(i => { const it = ST.items[i]; if (!it) return; const w = it.k === "f" ? it.w : it.s, h = it.k === "f" ? it.h : it.s; x.save(); x.strokeStyle = "#2fa8ff"; x.lineWidth = Math.max(1, k * .6); x.setLineDash([k * 3, k * 2]); x.strokeRect(it.x * U + .5, it.y * U + .5, w * U - 1, h * U - 1); x.restore(); });
  if (ST.marq) { const m = ST.marq; x.save(); x.fillStyle = "rgba(255,211,107,.08)"; x.strokeStyle = "#ffd36b"; x.lineWidth = Math.max(1, k * .6); x.setLineDash([k * 3, k * 2]); x.fillRect(m.x0 * U, m.y0 * U, (m.x1 - m.x0) * U, (m.y1 - m.y0) * U); x.strokeRect(m.x0 * U, m.y0 * U, (m.x1 - m.x0) * U, (m.y1 - m.y0) * U); x.restore(); }
  x.restore();
  /* the seams between stretches, faint, like the joins of taped paper; outside the sky it is dimmer */
  x.save(); x.lineWidth = Math.max(1, Math.round(k * .5));
  for (let n = n0; n <= n1; n++) for (let s = 0; s <= ST_CW; s += SKY_SEG) {
    const sx = Math.round((n * ST_CW + s - off) * U) + .5; if (sx < -2 || sx > W + 2) continue; const edge = !stPlaying && (s === 0 || s === ST_CW);
    x.strokeStyle = edge ? "rgba(220,210,180,.26)" : "rgba(220,210,180,.07)"; x.setLineDash(edge ? [k * 2, k * 3] : [k, k * 5]); x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx, H); x.stroke();
  }
  x.restore();
  if (!stPlaying) { x.fillStyle = "rgba(4,7,11,.62)"; const a = Math.round(-off * U), b = Math.round((ST_CW - off) * U); if (a > 0) x.fillRect(0, 0, a, H); if (b < W) x.fillRect(b, 0, W - b, H); }
};

/* ---- the pointer finds its place in the sky, wherever the sky has been moved to ---- */
stCellF = function (e) { const r = stCv.getBoundingClientRect(); let fx = WSK.off + (e.clientX - r.left) / r.width * WSK.vis; if (stPlaying) fx = ((fx % ST_CW) + ST_CW) % ST_CW; return [fx, (e.clientY - r.top) / r.height * ST_CH]; };
shCell = function (e) { const r = stCv.getBoundingClientRect(); if (e.clientX < r.left || e.clientX >= r.right || e.clientY < r.top || e.clientY >= r.bottom) return null; const [fx, fy] = stCellF(e); return [clamp(Math.floor(fx), 0, ST_CW - 1), Math.floor(fy)]; };
shMove = function (e) { if (!shD || !shD.on) return; shD.ghost.style.left = e.clientX + "px"; shD.ghost.style.top = e.clientY + "px"; const c = shCell(e); ST.ptr = c ? { cx: c[0] + .5, cy: c[1] + .5, nx: (c[0] + .5) / ST_CW, ny: (c[1] + .5) / ST_CH } : null; };
drCellF = function (e, L) { const [fx, fy] = stCellF(e); return [fx * L.res, fy * L.res]; };
/* moving along the sky: the bar under it, a sideways scroll, or shift and the wheel */
stCv.addEventListener("wheel", e => {
  if (stPlaying || ST_CW <= WSK.vis) return; const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0; if (!dx) return;
  e.preventDefault(); WSK.ease = null; WSK.off = clamp(WSK.off + dx / (ST_U * WSK.fit), 0, skyMax()); skyUI();
}, { passive: false });

/* ---- more sky ---- */
function skyResize(add) {
  const c = window.__dkOn ? dkCur() : null, old = ST_CW;
  if (add < 0) {
    if (ST_CW <= SKY_SEG) { stSay("the sky is one stretch long · it cannot be shorter"); return; }
    const cut = ST_CW - SKY_SEG, busy = ST.items.some(o => o.x + (o.k === "f" ? o.w : o.s) > cut) || (window.__drOn && DR.layers.some(L => !L.glyphs && ([...L.cells.keys()].some(kk => +kk.split(",")[0] >= cut * L.res) || L.sq.some(s => s.poly.some(p => p[0] >= cut * L.res)))));
    if (busy) { stSay("the last stretch of sky still holds glyphs or drawing · move them first"); return; }
  }
  ST_CW += add * SKY_SEG;
  if (c) { c.w = ST_CW; DK.thumbs.delete(c.id);
    const dx = (ST_CW - old) * 10; DK.cards.forEach(o => { if (o !== c && o.x >= c.x + old * 10 - 1) o.x += dx; }); DK.ringers.forEach(r => { if (r.x >= c.x + old * 10 - 1) r.x += dx; }); dkSave(); }
  if (window.__drOn) drChanged();
  WSK.ease = null; if (add > 0) WSK.off = Math.max(0, ST_CW - WSK.vis); skyClamp(true); skyUI(); stSync();
  stSay("the sky is " + ST_CW + " columns long · " + ST_CW / SKY_SEG + (ST_CW / SKY_SEG === 1 ? " stretch" : " stretches"));
}
function skyUI() {
  const pan = $("skyPan"); if (!pan) return; const need = ST_CW > WSK.vis + .01; pan.hidden = !need;
  if (need) { pan.max = Math.round(skyMax() * 100); pan.value = Math.round(clamp(WSK.off, 0, skyMax()) * 100); }
  $("skyLen").textContent = ST_CW + " COL"; $("skyLess").disabled = ST_CW <= SKY_SEG;
  const cm = $("skyComet"); cm.setAttribute("aria-pressed", String(!WSK.held)); cm.title = WSK.held ? "Shooting stars are held back · click to let them fly" : "Shooting stars are flying · click to hold them back";
}

/* ---- the layers, always at hand, with a delete on the side of each ink layer ---- */
const _drPanelPlain = drPanel;
drPanel = function () {
  _drPanelPlain();
  document.querySelectorAll("#drLayers .drRow").forEach(row => {
    const L = DR.layers[+row.dataset.i]; if (!L || L.glyphs) return; const b = document.createElement("button"); b.type = "button"; b.className = "drDel"; b.textContent = "×";
    b.title = "Delete this layer"; b.setAttribute("aria-label", "Delete " + L.name);
    b.addEventListener("click", ev => {
      ev.stopPropagation(); drPush(); const i = DR.layers.indexOf(L); if (i < 0) return; DR.layers.splice(i, 1); WSK.gone.push({ L, i });
      if (DR.act >= i) DR.act = Math.max(0, DR.act - 1); if (DR.layers[DR.act] && DR.layers[DR.act].glyphs && DR.layers.some(l => !l.glyphs)) DR.act = DR.layers.findIndex(l => !l.glyphs);
      drChanged(); drPanel(); stSay(L.name + " deleted · BRING BACK returns it");
    });
    row.appendChild(b);
  });
  const bb = $("drBack"); if (bb) { bb.hidden = !WSK.gone.length; bb.textContent = "BRING BACK" + (WSK.gone.length > 1 ? " · " + WSK.gone.length : ""); }
};
$("drBack").addEventListener("click", () => {
  const g = WSK.gone.pop(); if (!g) return; drPush(); DR.layers.splice(Math.min(g.i, DR.layers.length), 0, g.L); DR.act = DR.layers.indexOf(g.L); drChanged(); drPanel(); stSay(g.L.name + " is back");
});
/* choosing a layer chooses the tab that works on it: glyphs in WSK, ink in DRAW */
$("drLayers").addEventListener("click", e => {
  if (e.target.closest(".drEye, .drDel")) return; const row = e.target.closest(".drRow"); if (!row) return; const L = DR.layers[+row.dataset.i]; if (!L) return;
  if (L.glyphs && DR.tab === "draw" && DR_BRUSHES[DR.brush] !== "GLYPHS") drSetTab("sky"); else if (!L.glyphs && DR.tab !== "draw") drSetTab("draw");
});

/* ---- painting with glyphs: a brush that lays the chosen glyph, or a whole family in turn, along the stroke ---- */
DR_BRUSHES.push("GLYPHS");
{
  const b = document.createElement("button"); b.type = "button"; b.dataset.b = DR_BRUSHES.length - 1; b.textContent = "GLYPHS"; b.title = "paints with glyphs: pick one on the shelf, or a family's name for all of them in turn";
  b.addEventListener("click", () => { DR.brush = DR_BRUSHES.length - 1; DR.tool = 0; $("drBrushList").hidden = true; $("drBrushBtn").setAttribute("aria-expanded", "false"); drPanel(); stSay(skyBrushName()); });
  $("drBrushList").appendChild(b);
}
const skyBrushOn = () => DR_BRUSHES[DR.brush] === "GLYPHS" && DR_TOOLS[DR.tool] === "BRUSH";
function skyBrushName() { const g = WSK.brushG; return !g ? "glyph brush · pick a glyph on the shelf, or a family's name" : g.length > 1 ? "glyph brush · the " + g.fam + " family, " + g.length + " glyphs in turn" : "glyph brush · " + (g.name || g[0]); }
function skyBrushNext() {
  let g = WSK.brushG; if (!g) { const last = ST.items.filter(o => o.k !== "f").pop(), b = document.querySelector("#shelf button[data-g]"); g = WSK.brushG = last ? [last.g] : b ? [b.dataset.g] : null; if (!g) return null; }
  const id = g[WSK.brushI % g.length]; WSK.brushI++; return id;
}
function skyStamp(fx, fy) {
  const s = clamp(DR.size + 1, 1, 8), x = clamp(Math.round(fx - s / 2), 0, ST_CW - s), y = clamp(Math.round(fy - s / 2), 0, ST_CH - s);
  if (ST.items.some(o => o.k !== "f" && o.x === x && o.y === y)) return; const id = skyBrushNext(); if (!id) { stSay(skyBrushName()); return; }
  const it = Object.assign(stNew(id, x, y), { s, c: DR.col }); stClamp(it); ST.items.push(it); WSK.gs.last = [fx, fy]; WSK.gs.n = (WSK.gs.n || 0) + 1; skyHit(it, .2);
}
const _drDownPlain = drDown, _drMovePlain = drMove, _drUpPlain = drUp, _drUndoPlain = drUndo;
drDown = function (e) {
  if (!skyBrushOn()) return _drDownPlain(e);
  const [fx, fy] = stCellF(e); stPush(); DR.hist.push({ sky: true }); ST.sel = new Set(); WSK.gs = { last: null }; skyStamp(fx, fy);
};
drMove = function (e) {
  if (!WSK.gs) return _drMovePlain(e);
  const [fx, fy] = stCellF(e), l = WSK.gs.last, s = clamp(DR.size + 1, 1, 8); if (!l || Math.hypot(fx - l[0], fy - l[1]) >= s * .9) skyStamp(fx, fy);
};
drUp = function () { if (!WSK.gs) return _drUpPlain(); const n = WSK.gs.n || 0; WSK.gs = null; stSync(); if (window.__dkOn) dkDirty(); stSay("painted " + n + (n === 1 ? " glyph" : " glyphs") + " into the sky · UNDO takes the stroke back"); };
drUndo = function () { const h = DR.hist[DR.hist.length - 1]; if (h && h.sky) { DR.hist.pop(); stUndo(); drPanel(); return; } _drUndoPlain(); };
/* on the shelf, while drawing: a glyph becomes the brush; a family's name makes the whole family the brush */
$("shelf").addEventListener("click", e => {
  if (DR.tab !== "draw" || shSuppress) return; const b = e.target.closest("button"), h = e.target.closest(".pxHead"); if (!b && !h) return; e.stopPropagation();
  if (b) { const id = b.dataset.g || b.title; WSK.brushG = [id]; WSK.brushG.name = b.title; }
  else { const sec = h.closest(".pxFam"), ids = [...sec.querySelectorAll("button[data-g]")].map(x => x.dataset.g); if (!ids.length) return; WSK.brushG = ids; WSK.brushG.fam = (sec.dataset.f || "").toUpperCase(); }
  WSK.brushI = 0; DR.brush = DR_BRUSHES.indexOf("GLYPHS"); DR.tool = 0; drPanel(); stSay(skyBrushName());
}, true);

/* ---- the controls on the sky: shooting stars, more sky, less sky, and the bar to move along it ---- */
$("skyComet").addEventListener("click", () => { WSK.held = !WSK.held; try { localStorage.setItem("olympass.sky.held", WSK.held ? "1" : "0"); } catch (e) {} skyUI(); stSay(WSK.held ? "shooting stars held back" : "shooting stars flying"); });
$("skyMore").addEventListener("click", () => skyResize(1));
$("skyLess").addEventListener("click", () => skyResize(-1));
$("skyPan").addEventListener("input", e => { if (stPlaying) return; WSK.ease = null; WSK.off = +e.target.value / 100; });
/* the layers, the side panel and the shelf move into the side column; the shelf serves both tabs */
$("shBox").appendChild($("shHead")); $("shBox").appendChild($("shelf"));
new ResizeObserver(() => { if (curRoom === "studio") stFit(); }).observe($("sglass"));
window.__sky = true; window.__WS = { W: WSK, ST, DR, DK, stCv, get cw() { return ST_CW; }, get playing() { return stPlaying; }, get head() { return stHead; } }; skyUI(); drPanel();
