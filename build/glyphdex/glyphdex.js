
/* ============ THE GLYPH-DEX · the Sine Language ============
   Every glyph is a vector (an SVG path), so it can be drawn at any size. Each one carries tags, and
   is chained to the glyphs it shares meaning with. Words in a story find their glyphs through those
   tags; the story visualizer, a mosaic screen over the reader, shows them as the words arrive.
   THE MARK  أ ꙲ أ with 𓃾 in the middle of the many-myriads sign. One motion drives the whole mark:
   the + at the top turns like a wheel; the two alifs orbit at a quarter of its pace, the ox head
   looks one way and the other at half its pace, and the nine strokes of the sign swell one after
   another as the wheel comes round to them. */
const GD = { dex: null, by: new Map(), tagIdx: new Map(), loading: null, th: 0, last: 0, mark: null, sel: null, set: "all", q: "" };
const GD_SET_NAMES = { all: "ALL", moon: "MOON SPEAK", sky: "SKY", elements: "ELEMENTS", numbers: "NUMBERS", letters: "LETTERS", hieroglyphs: "HIEROGLYPHS", bodies: "BODIES", primitives: "SHAPES", made: "MADE HERE" };
function gdLoad() {
  if (GD.loading) return GD.loading;
  GD.loading = fetch(new URL("glyphdex/dex.json", location.href).href).then(r => r.ok ? r.json() : null).then(d => {
    if (!d) return null; GD.dex = d; d.glyphs.forEach(g => { GD.by.set(g.id, g); g.tags.forEach(t => { if (!GD.tagIdx.has(t)) GD.tagIdx.set(t, []); GD.tagIdx.get(t).push(g.id); }); });
    gdMarkBuild(); return d;
  }).catch(() => null);
  return GD.loading;
}
/* ---- drawing a glyph as SVG ---- */
const SVGNS = "http://www.w3.org/2000/svg";
function gdInner(g, depth) {
  if (!g) return "";
  if (g.parts) return g.parts.map(p => { const c = GD.by.get(p.ref); if (!c || depth > 3) return ""; const k = p.s * 100 / (c.vb || 100); return '<g transform="translate(' + (p.x - 50 * p.s) + " " + (p.y - 50 * p.s) + ") scale(" + k + ')" opacity="' + p.a + '">' + gdInner(c, (depth || 0) + 1) + "</g>"; }).join("");
  return g.stroke ? '<path d="' + g.d + '" fill="none" stroke="currentColor" stroke-width="' + (g.vb === 16 ? .9 : 5) + '" stroke-linecap="round" stroke-linejoin="round"/>' : '<path d="' + g.d + '" fill="currentColor"' + (g.vb === 16 ? ' shape-rendering="crispEdges"' : "") + "/>";
}
function gdSvg(g, cls) { return '<svg class="' + (cls || "") + '" viewBox="0 0 ' + (g.parts ? 100 : g.vb || 100) + " " + (g.parts ? 100 : g.vb || 100) + '" aria-hidden="true">' + gdInner(g) + "</svg>"; }
/* ---- the mark ---- */
function gdMarkBuild() {
  const host = $("gdMark"); if (!host || GD.mark) return; const A = GD.by.get("u0623"), O = GD.by.get("u130fe"); if (!A || !O) return;
  /* the many-myriads sign is drawn here stroke by stroke so each stroke can move on its own */
  const strokes = [];
  [24, 30, 36].forEach(y => strokes.push({ x1: 37, y1: y, x2: 46, y2: y, ox: 46, oy: y }));      /* left three */
  [24, 30, 36].forEach(y => strokes.push({ x1: 74, y1: y, x2: 83, y2: y, ox: 74, oy: y }));      /* right three */
  [54, 60, 66].forEach(x => strokes.push({ x1: x, y1: 47, x2: x, y2: 56, ox: x, oy: 47 }));      /* lower three */
  let s = '<svg viewBox="0 0 120 62" role="img" aria-label="Glyph-Dex">';
  s += '<g class="gdA" data-i="0">' + '<g transform="translate(-15 -15) scale(.3)">' + gdInner(A) + "</g></g>";
  s += '<g class="gdA" data-i="1">' + '<g transform="translate(-15 -15) scale(.3)">' + gdInner(A) + "</g></g>";
  strokes.forEach((k, i) => { s += '<line class="gdS" data-i="' + i + '" x1="' + k.x1 + '" y1="' + k.y1 + '" x2="' + k.x2 + '" y2="' + k.y2 + '" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'; });
  s += '<g class="gdP" transform="translate(60 12)"><path d="M-4.5 0H4.5M0 -4.5V4.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></g>';
  s += '<g class="gdO" transform="translate(60 33)"><g transform="translate(-11 -11) scale(.22)">' + gdInner(O) + "</g></g></svg>";
  host.innerHTML = s; GD.mark = { A: [...host.querySelectorAll(".gdA")], S: [...host.querySelectorAll(".gdS")], P: host.querySelector(".gdP"), O: host.querySelector(".gdO"), st: strokes, r: 29.5 };
  /* the alifs sit two and a half units clear of the sign at the ends of their orbit */
  try { const bb = GD.mark.A[0].firstChild.getBBox(), half = bb.width * .3 / 2; if (half > 0) GD.mark.r = 23 + 2.5 + half; } catch (e) {}
}
function gdMarkStep(now) {
  const M = GD.mark; if (!M) return; const dt = GD.last ? Math.min(.05, (now - GD.last) / 1000) : 0; GD.last = now;
  if (!reduce) GD.th += dt * .9; const th = GD.th;
  M.P.setAttribute("transform", "translate(60 12) rotate(" + (th * 57.2958).toFixed(2) + ")");
  M.A.forEach((a, i) => {
    const ph = th / 4 + (i ? 0 : Math.PI), x = 60 + Math.cos(ph) * M.r, y = 30 + Math.sin(ph) * 9, near = Math.sin(ph) > 0, sc = .86 + .14 * Math.sin(ph);
    a.setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + sc.toFixed(3) + ")"); a.style.opacity = (near ? 1 : .55).toString();
    /* in front of the sign on the near half of the orbit, behind it on the far half */
    if (a.dataset.near !== String(near)) { a.dataset.near = String(near); const svg = a.parentNode; if (near) svg.appendChild(a); else svg.insertBefore(a, svg.firstChild); }
  });
  const yaw = Math.sin(th / 2), sx = 1 - .28 * Math.abs(yaw);
  M.O.setAttribute("transform", "translate(" + (60 + yaw * 2.4).toFixed(2) + " 33) scale(" + (sx * (yaw < -.02 ? -1 : 1)).toFixed(3) + " 1)");
  M.S.forEach((l, i) => {
    const k = M.st[i], f = Math.max(0, Math.sin(th - i * TAU / 9)), e = 1 + .45 * f * f, x2 = k.ox + (k.x2 - k.ox + k.x1 - k.ox) * 0, dx = (k.x1 === k.ox ? k.x2 - k.ox : k.x1 - k.ox), dy = (k.y1 === k.oy ? k.y2 - k.oy : k.y1 - k.oy);
    if (k.x1 === k.ox && k.y1 === k.oy) { l.setAttribute("x2", (k.ox + dx * e).toFixed(2)); l.setAttribute("y2", (k.oy + dy * e).toFixed(2)); } else { l.setAttribute("x1", (k.ox + dx * e).toFixed(2)); l.setAttribute("y1", (k.oy + dy * e).toFixed(2)); }
    l.style.opacity = (.6 + .4 * f).toFixed(2);
  });
}
/* ---- the Dex panel ---- */
function gdOpen() { gdLoad().then(d => { if (!d) { $("gdStatus").textContent = "the Glyph-Dex could not be read"; return; } $("gdPanel").hidden = false; gdChips(); gdGrid(); if (!GD.sel) gdSelect("ua672"); }); }
function gdChips() {
  const h = $("gdSets"); if (h.childElementCount) return;
  ["all"].concat(GD.dex.sets).forEach(s => { const b = document.createElement("button"); b.type = "button"; b.textContent = GD_SET_NAMES[s] || s; b.dataset.s = s; b.addEventListener("click", () => { GD.set = s; gdGrid(); }); h.appendChild(b); });
}
function gdMatch(g) {
  if (GD.set !== "all" && g.set !== GD.set) return false; const q = GD.q.trim().toLowerCase(); if (!q) return true;
  return q.split(/\s+/).every(w => g.name.toLowerCase().includes(w) || g.tags.some(t => t.startsWith(w.replace(/^#/, ""))) || (g.chars || "") === w);
}
function gdGrid() {
  const host = $("gdGrid"), l = GD.dex.glyphs.filter(gdMatch); host.innerHTML = "";
  document.querySelectorAll("#gdSets button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.s === GD.set)));
  l.forEach(g => { const b = document.createElement("button"); b.type = "button"; b.className = "gdT" + (GD.sel === g.id ? " on" : ""); b.title = g.name; b.setAttribute("aria-label", g.name); b.innerHTML = gdSvg(g); b.addEventListener("click", () => gdSelect(g.id)); host.appendChild(b); });
  $("gdStatus").textContent = l.length + (l.length === 1 ? " glyph" : " glyphs") + (GD.q ? " for “" + GD.q + "”" : "");
}
function gdSelect(id) {
  const g = GD.by.get(id); if (!g) return; GD.sel = id;
  document.querySelectorAll("#gdGrid .gdT").forEach(b => b.classList.toggle("on", b.title === g.name));
  const d = $("gdDetail"); d.innerHTML = "";
  const big = document.createElement("div"); big.className = "gdBig"; big.innerHTML = gdSvg(g); d.appendChild(big);
  const t = document.createElement("div"); t.className = "gdName"; t.textContent = g.name; d.appendChild(t);
  const m = document.createElement("div"); m.className = "gdMean"; m.textContent = (g.meaning || "") + (g.code ? "  ·  " + g.code : "") + "  ·  " + (GD_SET_NAMES[g.set] || g.set).toLowerCase(); d.appendChild(m);
  const tg = document.createElement("div"); tg.className = "gdTags"; g.tags.forEach(x => { const b = document.createElement("button"); b.type = "button"; b.textContent = "#" + x; b.title = "every glyph tagged " + x + ((GD.dex.tags[x] || {}).with || []).slice(0, 4).map(w => " · " + w).join(""); b.addEventListener("click", () => { GD.q = x; $("gdQ").value = x; GD.set = "all"; gdGrid(); }); tg.appendChild(b); }); d.appendChild(tg);
  if (g.links && g.links.length) { const lk = document.createElement("div"); lk.className = "gdLinks"; const lab = document.createElement("span"); lab.textContent = "CHAINED TO"; lk.appendChild(lab); g.links.forEach(i => { const c = GD.by.get(i); if (!c) return; const b = document.createElement("button"); b.type = "button"; b.className = "gdT"; b.title = c.name; b.setAttribute("aria-label", c.name); b.innerHTML = gdSvg(c); b.addEventListener("click", () => gdSelect(i)); lk.appendChild(b); }); d.appendChild(lk); }
  if (g.parts) { const p = document.createElement("div"); p.className = "gdMean"; p.textContent = "made from: " + g.parts.map(x => (GD.by.get(x.ref) || {}).name || x.ref).join(" + "); d.appendChild(p); }
}
/* ---- words to glyphs: a word finds its glyphs through the tags ---- */
const GD_RANK = { made: 0, hieroglyphs: 1, sky: 1, elements: 1, letters: 2, numbers: 2, moon: 3, bodies: 2, primitives: 4 };
function gdWord(w) {
  if (!GD.dex) return null; w = w.toLowerCase().replace(/[^a-z0-9-]/g, ""); if (w.length < 3) return null;
  const tag = GD.dex.words[w] || w, l = GD.tagIdx.get(tag) || (w.endsWith("s") && GD.tagIdx.get(w.slice(0, -1))); if (!l || !l.length) return null;
  const c = l.map(i => GD.by.get(i)).filter(g => g && g.set !== "primitives").sort((a, b) => (GD_RANK[a.set] - GD_RANK[b.set]) || (a.id < b.id ? -1 : 1));
  if (!c.length) return null; let h = 7; for (const ch of w) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return c[h % Math.min(3, c.length)];                                       /* the same word always finds the same glyph */
}
/* ---- the story visualizer: a mosaic of light that redraws itself from the glyphs a story calls up ---- */
const VZ = { on: false, cv: null, x: null, cols: 0, rows: 0, cell: 6, v: null, tg: null, shown: [], motes: [], pal: null, breath: 0, last: 0, tick: 0 };
const VZ_PAL = { night: [[6, 10, 22], [200, 220, 255]], dawn: [[24, 12, 18], [255, 214, 170]], day: [[12, 26, 40], [230, 240, 255]], sea: [[3, 18, 24], [150, 230, 220]], aurora: [[6, 10, 16], [180, 255, 200]], deep: [[2, 2, 6], [160, 170, 210]], ember: [[22, 8, 4], [255, 150, 80]] };
function vzSize() {
  const cv = $("arViz"); if (!cv) return; const r = cv.getBoundingClientRect(); if (!r.width) return; const d = Math.min(window.devicePixelRatio || 1, 2);
  VZ.cv = cv; VZ.x = cv.getContext("2d"); cv.width = r.width * d; cv.height = r.height * d; VZ.d = d; VZ.w = r.width; VZ.h = r.height;
  VZ.cols = Math.floor(r.width / VZ.cell); VZ.rows = Math.floor(r.height / VZ.cell); VZ.v = new Float32Array(VZ.cols * VZ.rows); VZ.tg = new Float32Array(VZ.cols * VZ.rows); VZ.col = new Array(VZ.cols * VZ.rows).fill(null);
}
function vzReset(scene) { vzSize(); VZ.shown = []; VZ.motes = []; VZ.scene = scene || "night"; VZ.on = true; }
function vzRaster(g, size, fx) {
  /* the vector glyph is laid onto the mosaic's own grid: this is where it is re-pixelized */
  const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d"), vb = g.parts ? 100 : g.vb || 100;
  const draw = (gg, tx, ty, k, a) => {
    if (gg.parts) { gg.parts.forEach(p => { const cc = GD.by.get(p.ref); if (cc) draw(cc, tx + (p.x - 50 * p.s) * k, ty + (p.y - 50 * p.s) * k, k * p.s * 100 / (cc.vb || 100), a * p.a); }); return; }
    x.save(); x.setTransform(k, 0, 0, k, tx, ty); x.globalAlpha = a; const P = new Path2D(gg.d);
    if (gg.stroke) { x.strokeStyle = "#fff"; x.lineWidth = gg.vb === 16 ? 1 : 6; x.stroke(P); } else { x.fillStyle = "#fff"; x.fill(P); } x.restore();
  };
  const k = size / vb * (fx && fx.swell ? 1 : .9), o = size * (fx && fx.swell ? 0 : .05); draw(g, o, o, k, 1);
  const im = x.getImageData(0, 0, size, size).data, out = new Float32Array(size * size); for (let i = 0; i < out.length; i++) out[i] = im[i * 4 + 3] / 255; return out;
}
function vzShow(g, fx) {
  if (!VZ.on || !g || !VZ.cols) return; fx = fx || {};
  if (VZ.shown.length && VZ.shown[VZ.shown.length - 1].g.id === g.id) return;
  const size = VZ.rows, img = vzRaster(g, size, fx), col = fx.glow ? PAL[fx.glow] : null;
  VZ.shown.push({ g, img, size, fx, col, born: performance.now() }); if (VZ.shown.length > 4) VZ.shown.shift();
  vzLayout();
  /* a small burst of light where the new glyph lands, settling into its cells */
  const s = VZ.shown[VZ.shown.length - 1], cx = (s.x + size / 2) * VZ.cell, cy = VZ.h / 2;
  for (let i = 0; i < 36; i++) { const a = hash2(i, VZ.tick) * TAU, sp = 40 + 120 * hash2(i, VZ.tick + 7); VZ.motes.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0 }); }
  VZ.tick++; $("arVizCap").textContent = g.name;
}
function vzLayout() {
  /* the newest glyph takes the middle; earlier ones drift left and dim, the way a thought passes */
  const n = VZ.shown.length, size = VZ.rows, gap = Math.max(2, Math.round(size * .25)), mid = Math.floor((VZ.cols - size) / 2);
  VZ.shown.forEach((s, i) => { s.x = mid - (n - 1 - i) * (size + gap); s.dim = Math.pow(.42, n - 1 - i); });
  VZ.tg.fill(0); VZ.col.fill(null);
  VZ.shown.forEach(s => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const gx = s.x + x; if (gx < 0 || gx >= VZ.cols || y >= VZ.rows) continue; const v = s.img[y * size + x] * s.dim * (s.fx.hush ? .5 : 1), k = y * VZ.cols + gx; if (v > VZ.tg[k]) { VZ.tg[k] = v; VZ.col[k] = s.col; } } });
}
function vzBreath() { VZ.breath = 1; }
function vzStep(now) {
  if (!VZ.on || !VZ.x) return; const dt = VZ.last ? Math.min(.05, (now - VZ.last) / 1000) : .016; VZ.last = now;
  const x = VZ.x, d = VZ.d, C = VZ.cell, pal = VZ_PAL[$("alRead").dataset.scene] || VZ_PAL.night, bg = pal[0], ink = pal[1], t = now / 1000;
  x.setTransform(d, 0, 0, d, 0, 0); x.fillStyle = "rgb(" + bg.join(",") + ")"; x.fillRect(0, 0, VZ.w, VZ.h);
  VZ.breath = Math.max(0, VZ.breath - dt * .9); const top = VZ.shown[VZ.shown.length - 1], trem = top && top.fx.tremble;
  for (let j = 0; j < VZ.rows; j++) for (let i = 0; i < VZ.cols; i++) {
    const k = j * VZ.cols + i, wave = .5 + .5 * Math.sin(i * .35 - t * 2.2 + j * .2);                 /* cells flow toward their target, a wave at a time */
    VZ.v[k] += (VZ.tg[k] - VZ.v[k]) * Math.min(1, dt * (2 + 5 * wave));
    let v = VZ.v[k]; if (trem && v > .3) v *= .75 + .25 * hash2(k, Math.floor(t * 12));
    const q = Math.round(v * 4) / 4;                                                                   /* four tones, like e-ink */
    const lit = Math.min(1, q + VZ.breath * .25 + .05 * (.5 + .5 * Math.sin(t * .7 + i * .11 + j * .17)));
    if (lit < .07) continue; const cc = VZ.col[k] || ink;
    x.fillStyle = "rgb(" + cc.map((c, n) => Math.round(bg[n] + (c - bg[n]) * lit)).join(",") + ")"; x.fillRect(i * C + .5, j * C + .5, C - 1.5, C - 1.5);
  }
  VZ.motes = VZ.motes.filter(m => { m.t += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vx *= .93; m.vy *= .93; const a = 1 - m.t / .9; if (a <= 0) return false; x.fillStyle = "rgba(" + ink.join(",") + "," + a.toFixed(3) + ")"; x.fillRect(m.x - 1, m.y - 1, 2, 2); return true; });
}
function gdInit() {
  $("gdMark").addEventListener("click", gdOpen);
  $("gdX").addEventListener("click", () => { $("gdPanel").hidden = true; });
  $("gdQ").addEventListener("input", e => { GD.q = e.target.value; gdGrid(); });
  addEventListener("resize", () => { if (VZ.on) { vzSize(); vzLayout(); } });
  requestAnimationFrame(function gdLoop(now) { requestAnimationFrame(gdLoop); if (!AL.open) { GD.last = 0; VZ.last = 0; return; } gdMarkStep(now); if (AL.read) vzStep(now); });
}

/* ---- chaining the reader to the Dex: each finished word looks for its glyph; {glyph …} names one outright ---- */
ADR_ONE.glyph = 1;
GD.word = ""; GD.wfx = null;
const _arEmitPlain = arEmit;
arEmit = function (e) {
  const R = AR_RD, auto = !R.p || String(R.p.meta.glyphs || "on").toLowerCase() !== "off";
  if (e.k === "ch") {
    if (/[A-Za-z0-9'\-]/.test(e.ch)) { GD.word += e.ch; GD.wfx = e.fx; }
    else if (GD.word) { const w = GD.word; GD.word = ""; if (auto) { const g = gdWord(w); if (g) vzShow(g, GD.wfx); } }
  } else if (e.k === "cue" && e.n === "glyph") { const g = GD.by.get(e.a) || gdWord(e.a || ""); if (g) vzShow(g, { swell: 1 }); return 0; }
  else if (e.k === "cue" && e.n === "breath") vzBreath();
  return _arEmitPlain(e);
};
const _alReadPlain = alRead;
alRead = function (b) { _alReadPlain(b); GD.word = ""; gdLoad().then(() => { vzReset(); }); };
const _alOpenPlain = alOpen;
alOpen = function () { _alOpenPlain(); gdLoad(); };
