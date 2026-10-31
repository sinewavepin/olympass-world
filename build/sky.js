
/* ============ THE SKY: Ganymede's point of view, with the scrapbook composer living inside it ============ */
const ST_CW = 18, ST_CH = 14, ST_U = 16;
const stCv = $("stc"), stX = stCv.getContext("2d");
const ST = { items: [], sel: new Set(), col: "orange", mat: 0, mo: 0, hist: [], dom: "all", ptr: null, rip: [], rocks: [], marq: null };
const ST_COLS = ["orange", "sun", "gold", "leaf", "eblue", "foam", "violet", "red", "white"];
const MAT_NAMES = ["PLAIN", "DITHER", "STITCH", "MOSAIC", "GOUACHE"];
const MO_NAMES = ["STILL", "PULSE", "DRIFT", "ORBIT", "BLINK", "MELT", "BLEED", "FLICKER"];
const BORDERS = ["SINGLE", "DOUBLE", "DOTTED", "STITCH"];
let stK = 1, stDpr = 1, stTick = 0, stPlaying = false, stScrub = false, stHead = -1, stTimer = null, stBpm = 120, stColMs = 125, stAcc = 0;
const stSay = s => { $("stStatus").textContent = s; };
const _bm = new Map();
function stBmp(id, col) { const k = id + "|" + col; let c = _bm.get(k); if (!c) { c = iconCanvas(id, col); _bm.set(k, c); } return c; }

/* materials: the stencil fills of the scrapbook, drawn on a 3x3 sub-lattice per pixel */
const _mb = new Map();
function matBmp(id, col, mat) {
  const key = id + "|" + col + "|" + mat; let c = _mb.get(key); if (c) return c;
  c = document.createElement("canvas"); c.width = c.height = 48; const x = c.getContext("2d"), g = LUN.glyphs[id], P = PAL[col];
  const rgb = (m) => "rgb(" + P.map(v => Math.round(Math.min(255, v * m))).join(",") + ")", on = (px, py) => g && ((g.rows[py] >> (15 - px)) & 1);
  if (mat === 4) { try { x.filter = "blur(2.5px)"; } catch (e) {} x.fillStyle = "rgba(" + P.join(",") + ",.6)"; for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) if (on(px, py)) x.fillRect(px * 3 - 1, py * 3 - 1, 5, 5); x.filter = "none"; }
  for (let py = 0; py < 16; py++) for (let px = 0; px < 16; px++) {
    if (!on(px, py)) continue; const X = px * 3, Y = py * 3;
    if (mat === 0 || mat === 4) { x.fillStyle = rgb(1); x.fillRect(X, Y, 3, 3); }
    else if (mat === 1) { x.fillStyle = rgb(1); for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) if (((sx + sy) & 1) === 0) x.fillRect(X + sx, Y + sy, 1, 1); }
    else if (mat === 2) { x.fillStyle = rgb(1); [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]].forEach(q => x.fillRect(X + q[0], Y + q[1], 1, 1)); }
    else if (mat === 3) { x.fillStyle = rgb(1.18); x.fillRect(X, Y, 2, 2); x.fillStyle = rgb(.5); x.fillRect(X + 2, Y, 1, 3); x.fillRect(X, Y + 2, 2, 1); }
  }
  _mb.set(key, c); return c;
}

/* the sky itself: stars, the dot lattice, rocks that wizz by */
const STARS = Array.from({ length: 150 }, (_, i) => ({ x: hash2(i, 901), y: hash2(i, 902), z: .15 + hash2(i, 903) * .85, ph: hash2(i, 904) * 6.28, sp: .6 + hash2(i, 905) * 2.4, c: ["#cfe0ff", "#cfe0ff", "#ffd36b", "#a8d678", "#cdb0ff"][Math.floor(hash2(i, 906) * 5)] }));
const stPing = new WeakMap();
function skyBack(x, W, H, U, k, now) {
  const t = reduce ? 0 : now / 1000, p = ST.ptr;
  const aw = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .28, W / 2, H / 2, Math.hypot(W, H) * .56);
  aw.addColorStop(0, "rgba(0,0,0,0)"); aw.addColorStop(.7, "rgba(60,40,120,.10)"); aw.addColorStop(1, "rgba(47,168,255,.20)");
  x.fillStyle = aw; x.fillRect(0, 0, W, H);
  const ox = p ? (.5 - p.nx) : 0, oy = p ? (.5 - p.ny) : 0;
  STARS.forEach((s, i) => {
    let px = (s.x * W - t * s.z * 3 * k + ox * s.z * U * 1.6) % W; if (px < 0) px += W; const py = s.y * H + oy * s.z * U * 1.6;
    x.globalAlpha = .25 + .75 * (.5 + .5 * Math.sin(t * s.sp + s.ph)) * (.4 + .6 * s.z); x.fillStyle = s.c; const sz = s.z > .8 ? 2 * k : Math.max(1, k); x.fillRect(Math.round(px), Math.round(py), sz, sz);
  });
  x.globalAlpha = 1;
  const d = Math.max(1, Math.round(k * .7)), now2 = performance.now();
  for (let j = 0; j <= ST_CH; j++) for (let i = 0; i <= ST_CW; i++) {
    let a = .26, dx = 0, dy = 0;
    if (p) { const dd = Math.hypot(i - p.cx, j - p.cy); if (dd < 3.4) { const f = 1 - dd / 3.4; a += f * .6; dx += (p.cx - i) * f * .22 * U; dy += (p.cy - j) * f * .22 * U; } }
    for (const r of ST.rip) { const age = (now2 - r.t) / 1500, dd = Math.hypot(i - r.x, j - r.y), rad = age * 10; if (age < 1 && Math.abs(dd - rad) < 1) { const f = (1 - Math.abs(dd - rad)) * (1 - age); a += f * .8; dx += (i - r.x) / (dd || 1) * f * .3 * U; dy += (j - r.y) / (dd || 1) * f * .3 * U; } }
    x.fillStyle = "rgba(" + (a > .6 ? "255,211,107" : "47,168,255") + "," + Math.min(1, a) + ")"; x.fillRect(Math.round(i * U + dx) - (i === ST_CW ? d : 0), Math.round(j * U + dy) - (j === ST_CH ? d : 0), d, d);
  }
  ST.rip = ST.rip.filter(r => now2 - r.t < 1500);
  /* micro asteroids */
  ST.rocks.forEach(r => {
    const L = 5; x.lineWidth = Math.max(1, k * .8); const g = x.createLinearGradient(r.x * U - r.vx * L * U / 30, r.y * U - r.vy * L * U / 30, r.x * U, r.y * U);
    g.addColorStop(0, "rgba(207,224,255,0)"); g.addColorStop(1, "rgba(207,224,255,.85)"); x.strokeStyle = g; x.beginPath(); x.moveTo(r.x * U - r.vx * L * U / 30, r.y * U - r.vy * L * U / 30); x.lineTo(r.x * U, r.y * U); x.stroke();
    x.fillStyle = "#e8eefc"; x.fillRect(Math.round(r.x * U), Math.round(r.y * U), Math.max(1, k * r.sz), Math.max(1, k * r.sz));
  });
}
let stLastT = 0, rockIn = 1.2;
function rocksStep(now) {
  const dt = Math.min(.05, (now - stLastT) / 1000 || .016); stLastT = now; if (reduce) return;
  rockIn -= dt; if (rockIn <= 0 && ST.rocks.length < 4) {
    rockIn = 1.2 + Math.random() * 3; const side = Math.floor(Math.random() * 4), sp = 14 + Math.random() * 18, a = (Math.random() - .5) * .8;
    const r = side === 0 ? { x: -1, y: Math.random() * ST_CH, vx: sp, vy: sp * a } : side === 1 ? { x: ST_CW + 1, y: Math.random() * ST_CH, vx: -sp, vy: sp * a } : side === 2 ? { x: Math.random() * ST_CW, y: -1, vx: sp * a, vy: sp } : { x: Math.random() * ST_CW, y: ST_CH + 1, vx: sp * a, vy: -sp };
    r.sz = Math.random() < .3 ? 2 : 1; r.hit = new Set(); ST.rocks.push(r);
  }
  ST.rocks.forEach(r => {
    r.x += r.vx * dt; r.y += r.vy * dt;
    ST.items.forEach((it, i) => { if (it.k === "f" || r.hit.has(i)) return; if (Math.hypot(r.x - (it.x + it.s / 2), r.y - (it.y + it.s / 2)) < it.s / 2 + .8) { r.hit.add(i); skyHit(it, .14); } });
  });
  ST.rocks = ST.rocks.filter(r => r.x > -4 && r.x < ST_CW + 4 && r.y > -4 && r.y < ST_CH + 4);
}
function skyHit(it, vol) {
  stPing.set(it, performance.now()); ST.rip.push({ x: it.x + it.s / 2, y: it.y + it.s / 2, t: performance.now() });
  const r = stCv.getBoundingClientRect(); playGlyph(it.g, { x: (r.left + (it.x + it.s / 2) / ST_CW * r.width) / innerWidth, vol: vol || .5 });
}

/* motion and liquid states */
function itemTick(it) { return (stPlaying || stScrub) ? stTick : (ST.sel.has(ST.items.indexOf(it)) && !reduce ? Math.floor(performance.now() / 420) : 0); }
function stCycle() { const gcd = (a, b) => b ? gcd(b, a % b) : a; let n = 2; ST.items.forEach(o => { if (o.k === "f") return; if (o.m === 2) n = n / gcd(n, ST_CW - o.s + 1) * (ST_CW - o.s + 1); if (o.m === 3) n = n / gcd(n, 4) * 4; if (o.m === 7) n = n / gcd(n, 6) * 6; if (o.m === 5) n = n / gcd(n, 4) * 4; }); return Math.min(48, Math.max(2, Math.round(n))); }
function stDisp(it, t) {
  if (!it.m) return it; const o = Object.assign({}, it);
  if (it.m === 1) { o.s = Math.min(8, it.s + (t % 2)); o.x = Math.min(it.x, ST_CW - o.s); o.y = Math.min(it.y, ST_CH - o.s); }
  else if (it.m === 2) o.x = (it.x + t) % (ST_CW - it.s + 1);
  else if (it.m === 3) { const q = [[0, 0], [1, 0], [1, 1], [0, 1]][t % 4]; o.x = Math.min(it.x + q[0], ST_CW - it.s); o.y = Math.min(it.y + q[1], ST_CH - it.s); }
  else if (it.m === 4) { if (t % 2) return null; }
  else if (it.m === 5) o.sy = [1, 1.15, 1.3, 1.15][t % 4];
  else if (it.m === 6) o.bleed = t % 2 ? 2 : 1;
  else if (it.m === 7) { if (![1, 0, 1, 1, 0, 1][t % 6]) return null; }
  return o;
}

/* painting */
function stItem(x, k, it, ui, src, now) {
  const S = it.s * ST_U * k, cxp = it.x * ST_U * k + S / 2, cyp = it.y * ST_U * k + S / 2, p = PAL[it.c], bm = matBmp(it.g, it.c, it.mat || 0);
  const pg = stPing.get(src), pa = pg ? Math.max(0, 1 - (now - pg) / 600) : 0;
  x.save(); x.translate(cxp, cyp); x.rotate(it.r * Math.PI / 2); x.scale(it.f ? -1 : 1, 1); x.imageSmoothingEnabled = false;
  if (it.sy) { x.translate(0, -S / 2); x.scale(1, it.sy); x.translate(0, S / 2); }
  if (it.bleed) { x.globalAlpha = .45; x.drawImage(bm, -S / 2 - k * 2 * it.bleed, -S / 2, S, S); x.drawImage(bm, -S / 2 + k * 2 * it.bleed, -S / 2, S, S); x.globalAlpha = 1; }
  if (ui) { x.shadowColor = "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + (.7 + .3 * pa) + ")"; x.shadowBlur = S * (.07 + .35 * pa); }
  x.drawImage(bm, -S / 2, -S / 2, S, S); x.restore();
}
function drawFrame(x, f, U, k, sel) {
  const X = f.x * U, Y = f.y * U, W = f.w * U, H = f.h * U, p = PAL[f.c], lw = Math.max(1, k * 1.5); x.save(); x.strokeStyle = "rgb(" + p.join(",") + ")"; x.lineWidth = lw;
  const r = (i) => x.strokeRect(X + i + lw / 2, Y + i + lw / 2, W - 2 * i - lw, H - 2 * i - lw);
  if (f.b === 1) { r(0); r(lw * 2.4); } else if (f.b === 2) { x.setLineDash([lw, lw * 2]); r(0); } else if (f.b === 3) { x.setLineDash([lw * 4, lw * 2]); r(0); } else r(0);
  x.restore();
}
function stPaint(x, k, ui, now) {
  now = now || performance.now(); const W = ST_CW * ST_U * k, H = ST_CH * ST_U * k, U = ST_U * k;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = "#04070b"; x.fillRect(0, 0, W, H);
  if (ui) skyBack(x, W, H, U, k, now);
  ST.items.forEach((it, i) => { if (it.k === "f") drawFrame(x, it, U, k); });
  ST.items.forEach((it, i) => { if (it.k === "f") return; const d = stDisp(it, itemTick(it)); if (d) stItem(x, k, d, ui, it, now); });
  if (!ui) return;
  if (stPlaying && stHead >= 0) { const hg = x.createLinearGradient((stHead - 1) * U, 0, (stHead + 1) * U, 0); hg.addColorStop(0, "rgba(47,168,255,0)"); hg.addColorStop(.5, "rgba(120,200,255,.35)"); hg.addColorStop(1, "rgba(47,168,255,0)"); x.fillStyle = hg; x.fillRect((stHead - 1) * U, 0, 2 * U, H); }
  ST.sel.forEach(i => { const it = ST.items[i]; if (!it) return; const w = it.k === "f" ? it.w : it.s, h = it.k === "f" ? it.h : it.s; x.save(); x.strokeStyle = "#2fa8ff"; x.lineWidth = Math.max(1, k * .6); x.setLineDash([k * 3, k * 2]); x.strokeRect(it.x * U + .5, it.y * U + .5, w * U - 1, h * U - 1); x.restore(); });
  if (ST.marq) { const m = ST.marq; x.save(); x.fillStyle = "rgba(255,211,107,.08)"; x.strokeStyle = "#ffd36b"; x.lineWidth = Math.max(1, k * .6); x.setLineDash([k * 3, k * 2]); x.fillRect(m.x0 * U, m.y0 * U, (m.x1 - m.x0) * U, (m.y1 - m.y0) * U); x.strokeRect(m.x0 * U, m.y0 * U, (m.x1 - m.x0) * U, (m.y1 - m.y0) * U); x.restore(); }
}
requestAnimationFrame(function skyLoop(now) { requestAnimationFrame(skyLoop); if (curRoom !== "studio") return; rocksStep(now); stPaint(stX, stK, true, now); });
function stDraw() { /* the loop repaints continuously */ }

/* state helpers */
const clean = o => JSON.stringify(o);
function stSnap() { return JSON.stringify({ items: ST.items, sel: [...ST.sel] }); }
function stPush(s) { ST.hist.push(s || stSnap()); if (ST.hist.length > 60) ST.hist.shift(); }
function stUndo() { const s = ST.hist.pop(); if (!s) return; const o = JSON.parse(s); ST.items = o.items; ST.sel = new Set(o.sel); stSync(); }
const glyphsSel = () => [...ST.sel].map(i => ST.items[i]).filter(it => it && it.k !== "f");
const allSel = () => [...ST.sel].map(i => ST.items[i]).filter(Boolean);
function stNew(id, x, y) { return { k: "g", g: id, x: clamp(x, 0, ST_CW - 2), y: clamp(y, 0, ST_CH - 2), s: 2, r: 0, f: 0, c: ST.col, m: ST.mo, mat: ST.mat }; }
function stAddAt(id, x, y) { ST.auto = true; stPush(); ST.items.push(stNew(id, x, y)); ST.sel = new Set([ST.items.length - 1]); stSync(); }
function stAdd(id) {
  ST.auto = true; stPush(); let x = ST_CW / 2 - 1, y = ST_CH / 2 - 1, guard = 0;
  while (ST.items.some(o => o.k !== "f" && o.x === x && o.y === y) && guard++ < 60) { x += 2; if (x > ST_CW - 2) { x = 0; y = (y + 2) % (ST_CH - 1); } }
  ST.items.push(stNew(id, x, y)); ST.sel = new Set([ST.items.length - 1]); stSync();
}
function stClamp(it) { const w = it.k === "f" ? it.w : it.s, h = it.k === "f" ? it.h : it.s; it.x = clamp(it.x, 0, ST_CW - w); it.y = clamp(it.y, 0, ST_CH - h); }
function stEach(fn, glyphsOnly) { const l = glyphsOnly ? glyphsSel() : allSel(); if (!l.length) return false; stPush(); l.forEach(it => { fn(it); stClamp(it); }); stSync(); return true; }

/* transport: a playhead sweeps the sky; every glyph sounds as it passes, in its own voice */
const readingOrder = l => l.slice().sort((a, b) => a.x - b.x || a.y - b.y);
function stPlay() {
  if (stPlaying) { stPlaying = false; clearInterval(stTimer); stHead = -1; stSync(); return; }
  const gl = ST.items.filter(o => o.k !== "f"); if (!gl.length) { stSay("the sky is empty · click a glyph below to put it here"); return; }
  stPlaying = true; stScrub = false; stTick = 0; stAcc = 0; stHead = Math.min(...gl.map(o => o.x)) - 1;
  clearInterval(stTimer); const step = () => {
    stHead = (stHead + 1) % ST_CW; stAcc++; if (stAcc % 4 === 0) stTick++;
    ST.items.forEach(it => { if (it.k !== "f" && it.x === stHead) skyHit(it, .7); });
  };
  step(); stTimer = setInterval(step, stColMs); stSync();
}
function stHum() {
  const sel = glyphsSel(), l = readingOrder(sel.length ? sel : ST.items.filter(o => o.k !== "f")); if (!l.length) { stSay("nothing to hum yet · click a glyph below"); return; }
  const x0 = l[0].x; l.forEach(it => setTimeout(() => skyHit(it, .75), (it.x - x0) * stColMs * 1.4 + (it.y * 12))); stSay("Ganymede hums " + l.length + (l.length === 1 ? " glyph" : " glyphs") + " in the voice of " + [...new Set(l.map(i => i.g.split(":")[0]))].join(" · "));
}

/* the panel */
function chips(host, names, get, set, label) {
  const el = $(host); el.setAttribute("aria-label", label); el.innerHTML = "";
  names.forEach((n, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = n; b.dataset.i = i; b.addEventListener("click", () => set(i)); el.appendChild(b); });
}
chips("stMo", MO_NAMES, 0, i => { ST.mo = i; if (!stEach(it => { if (it.k !== "f") it.m = i; }, true)) stSync(); }, "Motion");
chips("stMat", MAT_NAMES, 0, i => { ST.mat = i; if (!stEach(it => { if (it.k !== "f") it.mat = i; }, true)) stSync(); }, "Material");
chips("stBord", BORDERS, 0, i => { stEach(it => { if (it.k === "f") it.b = i; }); }, "Border");
ST_COLS.forEach(c => { const b = document.createElement("button"); b.type = "button"; b.className = "sw"; b.dataset.c = c; b.setAttribute("aria-label", "Colour " + c); b.style.background = "rgb(" + PAL[c].join(",") + ")"; b.setAttribute("aria-pressed", "false");
  b.addEventListener("click", () => { ST.col = c; if (!stEach(it => { it.c = c; })) stSync(); }); $("stSw").appendChild(b); });
const stDoms = ["all"].concat([...new Set(GL_ALL.map(id => id.split(":")[0]))]);
function stShelf() {
  const sh = $("shelf"); sh.innerHTML = "";
  GL_ALL.filter(id => ST.dom === "all" || id.split(":")[0] === ST.dom).forEach(id => {
    const b = document.createElement("button"); b.type = "button"; b.title = id; b.setAttribute("aria-label", "Glyph " + id);
    const c = document.createElement("canvas"); c.width = c.height = 16; c.getContext("2d").drawImage(stBmp(id, "orange"), 0, 0); b.appendChild(c);
    b.addEventListener("click", () => { if (shSuppress) { shSuppress = false; return; } if (ST.auto || !stEach(it => { it.g = id; }, true)) stAdd(id); });
    b.addEventListener("pointerdown", e => shDown(e, id)); sh.appendChild(b);
  });
}
{ const sel = document.createElement("select"); sel.id = "shDom"; sel.setAttribute("aria-label", "Shelf domain"); stDoms.forEach(d => { const o = document.createElement("option"); o.value = d; o.textContent = d === "all" ? "ALL GLYPHS" : d.toUpperCase(); sel.appendChild(o); }); sel.addEventListener("change", () => { ST.dom = sel.value; stShelf(); }); $("shHead").appendChild(sel); }
stShelf();
function stSync() {
  const n = ST.sel.size, gl = glyphsSel(), fr = allSel().filter(i => i.k === "f"), first = gl[0], B = a => document.querySelector('#stPanel [data-a="' + a + '"]');
  $("selBar").hidden = !n; $("selCount").textContent = n + (n === 1 ? " SELECTED" : " SELECTED");
  ["shrink", "grow", "rot", "flip"].forEach(a => { B(a).disabled = !gl.length; }); B("frame").disabled = !gl.length; B("route").hidden = !(first && ROUTES[first.g]);
  $("stBord").hidden = !fr.length; B("play").textContent = stPlaying ? "STOP" : "PLAY"; B("play").classList.toggle("on", stPlaying);
  B("undo").disabled = !ST.hist.length; B("clear").disabled = !ST.items.length; B("png").disabled = !ST.items.length; B("copy").disabled = !ST.items.length; B("gif").disabled = !ST.items.some(o => o.m);
  const uni = (l, f, d) => l.length && l.every(o => f(o) === f(l[0])) ? f(l[0]) : d;
  const mo = uni(gl, o => o.m || 0, ST.mo), mat = uni(gl, o => o.mat || 0, ST.mat), col = uni(allSel(), o => o.c, ST.col), bd = uni(fr, o => o.b || 0, -1);
  document.querySelectorAll("#stMo .chip").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.i === mo)));
  document.querySelectorAll("#stMat .chip").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.i === mat)));
  document.querySelectorAll("#stBord .chip").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.i === bd)));
  document.querySelectorAll("#stSw .sw").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === col)));
  const has = ST.items.some(o => o.m); $("stTl").hidden = !has; stTl();
  stCv.setAttribute("aria-label", "Ganymede's sky, " + ST.items.length + " items" + (n ? ", " + n + " selected" : ""));
  stSay(first ? first.g + " · " + MAT_NAMES[first.mat || 0].toLowerCase() + " · " + MO_NAMES[first.m || 0].toLowerCase() + (gl.length > 1 ? " · +" + (gl.length - 1) + " more" : "") : n ? "frame selected" : ST.items.length ? "drag across glyphs to select · drag a glyph to move it" : "the sky is empty · click a glyph below to put it here, or drag one in");
}
function stTl() { const N = stCycle(), sc = $("stScrub"); sc.max = N - 1; sc.value = stTick % N; $("stTlLab").textContent = "TICK " + (stTick % N) + " / " + N; }
$("stScrub").addEventListener("input", e => { stPlaying = false; clearInterval(stTimer); stHead = -1; stScrub = true; stTick = +e.target.value; stSync(); });
$("stTempo").addEventListener("input", e => { stBpm = +e.target.value; stColMs = 15000 / stBpm; $("stBpm").textContent = stBpm + " BPM"; if (stPlaying) { clearInterval(stTimer); stPlaying = false; stPlay(); } });

/* every control on the panel */
const stOps = {
  shrink: () => stEach(it => { it.s = Math.max(1, it.s - 1); }, true), grow: () => stEach(it => { it.s = Math.min(8, it.s + 1); }, true),
  rot: () => stEach(it => { it.r = (it.r + 1) % 4; }, true), flip: () => stEach(it => { it.f ^= 1; }, true),
  dup: () => { const l = allSel(); if (!l.length) return; stPush(); const add = l.map(it => { const c = Object.assign({}, it, { x: it.x + 1, y: it.y + 1 }); stClamp(c); return c; }); const base = ST.items.length; ST.items.push(...add); ST.sel = new Set(add.map((_, i) => base + i)); stSync(); },
  del: () => { if (!ST.sel.size) return; stPush(); ST.items = ST.items.filter((_, i) => !ST.sel.has(i)); ST.sel = new Set(); stSync(); },
  frame: () => {
    const l = glyphsSel(); if (!l.length) return; stPush(); const x0 = Math.max(0, Math.min(...l.map(o => o.x)) - 1), y0 = Math.max(0, Math.min(...l.map(o => o.y)) - 1), x1 = Math.min(ST_CW, Math.max(...l.map(o => o.x + o.s)) + 1), y1 = Math.min(ST_CH, Math.max(...l.map(o => o.y + o.s)) + 1);
    ST.items.unshift({ k: "f", x: x0, y: y0, w: x1 - x0, h: y1 - y0, b: 0, c: ST.col }); ST.sel = new Set([0]); stSync();
  },
  play: stPlay, hum: stHum, route: () => stRoute(), undo: stUndo,
  clear: () => { if (!ST.items.length) return; stPush(); ST.items = []; ST.sel = new Set(); stSync(); },
  gif: () => stGif(),
  png() {
    const c = document.createElement("canvas"), k = 8; c.width = ST_CW * ST_U * k; c.height = ST_CH * ST_U * k; stPaint(c.getContext("2d"), k, false);
    c.toBlob(b => { if (!b) { stSay("export failed"); return; } try { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "GAN.MOON-sky.png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); stSay("PNG exported · " + c.width + " x " + c.height); } catch (e) { stSay("PNG export is blocked in this view · open the full page"); } });
  },
  copy() {
    const txt = ["[compose]", "; GAN.MOON sky session", "stage = " + ST_CW * ST_U + "x" + ST_CH * ST_U].concat(ST.items.map(it => it.k === "f" ? "FRAME " + it.x + " " + it.y + " " + it.w + " " + it.h + " border=" + BORDERS[it.b].toLowerCase() + " color=" + it.c : "PLACE " + it.g + " " + it.x + " " + it.y + " scale=" + it.s + " rot=" + it.r * 90 + (it.f ? " mirror" : "") + " color=" + it.c + " material=" + MAT_NAMES[it.mat || 0].toLowerCase() + (it.m ? " motion=" + MO_NAMES[it.m].toLowerCase() : ""))).join("\n");
    const ok = () => stSay("copied " + ST.items.length + " placements as a [compose] block"), no = () => stSay("copy is blocked in this view");
    try { navigator.clipboard.writeText(txt).then(ok, no); } catch (e) { no(); }
  }
};
$("stPanel").addEventListener("click", e => { const b = e.target.closest("button[data-a]"); if (b && !b.disabled && stOps[b.dataset.a]) stOps[b.dataset.a](); });

/* the sky reacts to touch and movement; a drag on empty sky selects, a drag on a glyph moves it */
function stCellF(e) { const r = stCv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * ST_CW, (e.clientY - r.top) / r.height * ST_CH]; }
function stHit(fx, fy) {
  for (let n = ST.items.length - 1; n >= 0; n--) { const it = ST.items[n]; if (it.k !== "f" && fx >= it.x && fx < it.x + it.s && fy >= it.y && fy < it.y + it.s) return n; }
  for (let n = ST.items.length - 1; n >= 0; n--) { const f = ST.items[n]; if (f.k !== "f") continue; const inside = fx >= f.x && fx <= f.x + f.w && fy >= f.y && fy <= f.y + f.h, deep = fx > f.x + .7 && fx < f.x + f.w - .7 && fy > f.y + .7 && fy < f.y + f.h - .7; if (inside && !deep) return n; }
  return -1;
}
let stDrag = null;
const ptrSet = e => { const [fx, fy] = stCellF(e); ST.ptr = { cx: fx, cy: fy, nx: clamp(fx / ST_CW, 0, 1), ny: clamp(fy / ST_CH, 0, 1) }; return [fx, fy]; };
stCv.addEventListener("pointerdown", e => {
  if (e.button > 0) return; ST.auto = false; const [fx, fy] = ptrSet(e); ST.rip.push({ x: fx, y: fy, t: performance.now() }); const h = stHit(fx, fy), multi = e.shiftKey || e.ctrlKey || e.metaKey; stDrag = null;
  if (h >= 0) {
    if (multi) { ST.sel.has(h) ? ST.sel.delete(h) : ST.sel.add(h); } else if (!ST.sel.has(h)) ST.sel = new Set([h]);
    const mv = new Set(ST.sel); ST.sel.forEach(i => { const f = ST.items[i]; if (f && f.k === "f") ST.items.forEach((o, j) => { if (o.k !== "f" && o.x >= f.x && o.y >= f.y && o.x + o.s <= f.x + f.w && o.y + o.s <= f.y + f.h) mv.add(j); }); });
    stDrag = { type: "move", sx: fx, sy: fy, orig: [...mv].map(i => { const o = ST.items[i]; return [i, o.x, o.y, o.k === "f" ? o.w : o.s, o.k === "f" ? o.h : o.s]; }), snap: stSnap(), pushed: false };
  } else { stDrag = { type: "marq", sx: fx, sy: fy, base: multi ? new Set(ST.sel) : new Set(), moved: false }; if (!multi) ST.sel = new Set(); }
  try { stCv.setPointerCapture(e.pointerId); } catch (er) {} stSync(); try { stCv.focus({ preventScroll: true }); } catch (er) {}
});
stCv.addEventListener("pointermove", e => {
  const [fx, fy] = ptrSet(e); if (!stDrag) return;
  if (stDrag.type === "move") {
    let dx = Math.round(fx - stDrag.sx), dy = Math.round(fy - stDrag.sy); stDrag.orig.forEach(o => { dx = clamp(dx, -o[1], ST_CW - o[3] - o[1]); dy = clamp(dy, -o[2], ST_CH - o[4] - o[2]); });
    if (dx || dy || stDrag.pushed) { if (!stDrag.pushed) { stPush(stDrag.snap); stDrag.pushed = true; } stDrag.orig.forEach(o => { const it = ST.items[o[0]]; it.x = o[1] + dx; it.y = o[2] + dy; }); }
  } else {
    const x0 = Math.min(stDrag.sx, fx), x1 = Math.max(stDrag.sx, fx), y0 = Math.min(stDrag.sy, fy), y1 = Math.max(stDrag.sy, fy); if (Math.hypot(fx - stDrag.sx, fy - stDrag.sy) > .3) stDrag.moved = true;
    ST.marq = stDrag.moved ? { x0, y0, x1, y1 } : null; const s = new Set(stDrag.base);
    if (stDrag.moved) ST.items.forEach((o, i) => { const w = o.k === "f" ? o.w : o.s, h = o.k === "f" ? o.h : o.s, hit = o.k === "f" ? (o.x >= x0 && o.y >= y0 && o.x + w <= x1 && o.y + h <= y1) : (o.x < x1 && o.x + w > x0 && o.y < y1 && o.y + h > y0); if (hit) s.add(i); });
    ST.sel = s; stSync();
  }
});
const stEnd = () => { if (stDrag && stDrag.type === "move" && stDrag.pushed) stSync(); stDrag = null; ST.marq = null; };
stCv.addEventListener("pointerup", stEnd); stCv.addEventListener("pointercancel", stEnd); stCv.addEventListener("pointerleave", () => { if (!stDrag) ST.ptr = null; });
document.addEventListener("keydown", e => {
  if (curRoom !== "studio") return; const tg = e.target; if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return; const k = e.key; let used = true;
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "z") stUndo(); else if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "a") { ST.sel = new Set(ST.items.map((_, i) => i)); stSync(); }
  else if (k === "[") stOps.shrink(); else if (k === "]") stOps.grow(); else if (k.toLowerCase() === "r") stOps.rot(); else if (k.toLowerCase() === "f") stOps.flip(); else if (k.toLowerCase() === "d") stOps.dup();
  else if (k === "Delete" || k === "Backspace") stOps.del(); else if (k === " ") stPlay();
  else if (k.startsWith("Arrow") && ST.sel.size) { const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]; stEach(it => { it.x += d[0]; it.y += d[1]; }); }
  else if (k === "Escape") { ST.sel = new Set(); stSync(); } else used = false;
  if (used) e.preventDefault();
});

/* drag a glyph from the shelf onto the sky */
let shD = null, shSuppress = false;
function shCell(e) { const r = stCv.getBoundingClientRect(); if (e.clientX < r.left || e.clientX >= r.right || e.clientY < r.top || e.clientY >= r.bottom) return null; return [Math.floor((e.clientX - r.left) / r.width * ST_CW), Math.floor((e.clientY - r.top) / r.height * ST_CH)]; }
function shStart(e) { if (!shD || shD.on) return; shD.on = true; const g = document.createElement("canvas"); g.width = g.height = 16; g.id = "dragGhost"; g.getContext("2d").drawImage(stBmp(shD.id, ST.col), 0, 0); document.body.appendChild(g); shD.ghost = g; shMove(e); }
function shMove(e) { if (!shD || !shD.on) return; shD.ghost.style.left = e.clientX + "px"; shD.ghost.style.top = e.clientY + "px"; const c = shCell(e); ST.ptr = c ? { cx: c[0] + .5, cy: c[1] + .5, nx: (c[0] + .5) / ST_CW, ny: (c[1] + .5) / ST_CH } : null; }
function shDown(e, id) {
  if (e.button > 0) return; if (e.pointerType !== "touch") e.preventDefault(); shD = { id, sx: e.clientX, sy: e.clientY, on: false, touch: e.pointerType === "touch", pid: e.pointerId, timer: 0 };
  if (shD.touch) shD.timer = setTimeout(() => { if (shD && !shD.on) { shStart(e); try { navigator.vibrate && navigator.vibrate(12); } catch (er) {} } }, 260);
}
document.addEventListener("pointermove", e => {
  if (!shD || e.pointerId !== shD.pid) return;
  if (!shD.on) { if (shD.touch) { if (Math.hypot(e.clientX - shD.sx, e.clientY - shD.sy) > 10) { clearTimeout(shD.timer); shD = null; } return; } if (Math.hypot(e.clientX - shD.sx, e.clientY - shD.sy) > 6) shStart(e); } else shMove(e);
});
document.addEventListener("touchmove", e => { if (shD && shD.on) e.preventDefault(); }, { passive: false });
function shEnd(e, cancel) {
  if (!shD || (e.pointerId !== undefined && e.pointerId !== shD.pid)) return; clearTimeout(shD.timer);
  if (shD.on) { shSuppress = true; setTimeout(() => { shSuppress = false; }, 60); const c = cancel ? null : shCell(e); shD.ghost.remove(); ST.ptr = null; if (c) { stAddAt(shD.id, c[0], c[1]); } }
  shD = null;
}
document.addEventListener("pointerup", e => shEnd(e, false)); document.addEventListener("pointercancel", e => shEnd(e, true));

/* layout: the sky fits the room, whatever the screen */
function stFit() {
  const aw = $("sglass").clientWidth || 560, ah = Math.max(224, innerHeight - 38 - 44 - 96);
  stDpr = Math.min(window.devicePixelRatio || 1, 3);
  let fit = Math.min(aw / (ST_CW * ST_U), ah / (ST_CH * ST_U), 3); if (fit >= 2) fit = Math.floor(fit);
  stK = Math.max(1, Math.ceil(fit * stDpr));
  stCv.width = ST_CW * ST_U * stK; stCv.height = ST_CH * ST_U * stK; stCv.style.width = (ST_CW * ST_U * fit) + "px"; stCv.style.height = (ST_CH * ST_U * fit) + "px";
}

/* routes, GIF */
const ROUTES = {
  "craters:u25e1": { stage: 2, txt: "route · stage 2 · CUP · OPEN CUP.DRV" },
  "signals:u22cb": { txt: "route · arrow paths:u27ff · Earth bridge, outward" },
  "paths:u2944": { stage: 6, txt: "route · stage 6 · SIGNAL · FAN SIGNAL.EXE, return path" },
  "core:u2609": { txt: "route · seal · solar-burst" }
};
function stRoute() { const it = glyphsSel()[0], r = it && ROUTES[it.g]; if (!r) return; kick = (performance.now() - t0) / 1000; closeRoom(); routeShow(r); postSay([r.txt]); }
function lzw(idx, mc) {
  const clear = 1 << mc, eoi = clear + 1; let cs = mc + 1, next = eoi + 1, dict = new Map(), cur = 0, bits = 0; const out = [];
  const emit = c => { cur |= c << bits; bits += cs; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } };
  emit(clear); let pre = idx[0];
  for (let i = 1; i < idx.length; i++) {
    const k = idx[i], key = (pre << 8) | k, v = dict.get(key);
    if (v !== undefined) { pre = v; continue; }
    emit(pre);
    if (next < 4096) { dict.set(key, next++); if (next - 1 === (1 << cs) && cs < 12) cs++; }
    else { emit(clear); dict.clear(); cs = mc + 1; next = eoi + 1; }
    pre = k;
  }
  emit(pre); emit(eoi); if (bits > 0) out.push(cur & 255); return out;
}
function gifBytes(w, h, frames, pal, delay) {
  const o = []; const w16 = v => o.push(v & 255, (v >> 8) & 255); const str = s => [...s].forEach(c => o.push(c.charCodeAt(0)));
  str("GIF89a"); w16(w); w16(h); o.push(0xF3, 0, 0);
  for (let i = 0; i < 16; i++) { const c = pal[i] || [0, 0, 0]; o.push(c[0], c[1], c[2]); }
  o.push(0x21, 0xFF, 0x0B); str("NETSCAPE2.0"); o.push(3, 1, 0, 0, 0);
  frames.forEach(f => {
    o.push(0x21, 0xF9, 4, 0x04); w16(delay); o.push(0, 0);
    o.push(0x2C); w16(0); w16(0); w16(w); w16(h); o.push(0, 4);
    const d = lzw(f, 4); for (let i = 0; i < d.length; i += 255) { const n = Math.min(255, d.length - i); o.push(n); for (let j = 0; j < n; j++) o.push(d[i + j]); } o.push(0);
  });
  o.push(0x3B); return new Uint8Array(o);
}
function stGifBuild() {
  const N = stCycle(), k = 3, w = ST_CW * ST_U * k, h = ST_CH * ST_U * k, c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d");
  const pal = [[4, 7, 11]].concat(ST_COLS.map(n => PAL[n])), map = new Map(pal.map((p, i) => [(p[0] << 16) | (p[1] << 8) | p[2], i]));
  const keepS = stScrub, keepT = stTick, keepP = stPlaying, frames = []; stScrub = true; stPlaying = false;
  for (let t = 0; t < N; t++) {
    stTick = t; stPaint(x, k, false); const d = x.getImageData(0, 0, w, h).data, ix = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) { const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; let v = map.get(key); if (v === undefined) { let bd = 1e9; pal.forEach((p, q) => { const dd = (p[0] - d[i]) ** 2 + (p[1] - d[i + 1]) ** 2 + (p[2] - d[i + 2]) ** 2; if (dd < bd) { bd = dd; v = q; } }); map.set(key, v); } ix[j] = v; }
    frames.push(ix);
  }
  stScrub = keepS; stTick = keepT; stPlaying = keepP;
  return { bytes: gifBytes(w, h, frames, pal, 40), N, w, h };
}
function stGif() {
  if (!ST.items.some(o => o.m)) return;
  try {
    const g = stGifBuild(); window.__gif = g.bytes;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([g.bytes], { type: "image/gif" })); a.download = "GAN.MOON-sky.gif"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    stSay("GIF exported · " + g.N + " frames · " + g.w + " x " + g.h);
  } catch (e) { stSay("GIF export is blocked in this view · open the full page"); }
}
stFit(); stSync();
