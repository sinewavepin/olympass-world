
/* ============ THE PIXEL HANDLER: one vector per glyph, drawn as pixel art at the size it is needed ============
   Each glyph is stored once, as a vector outline (the Glyph-Dex). Wherever it is shown it is laid onto
   a pixel grid of the size that place needs, from 32 x 32 to 64 x 64, so it is always crisp pixel art
   and never a scaled-up bitmap. The glyphs of the named bodies keep their own 16-pixel shapes, drawn
   as clean blocks at the same sizes. In THE SKY the shelf now comes from the Glyph-Dex, grouped by the
   sound family each glyph plays in; each family's shelf is patterned after its sound. */
const PX = { vec: new Map(), grid: new Map(), can: new Map(), ready: false, fams: [] };
const PX_MIN = 32, PX_MAX = 64;
function pxSkyId(g) { return g.set === "moon" ? g.id : (g.fam || "def") + ":dx-" + g.id; }
function pxLoad() {
  if (PX.ready || PX.loading) return PX.loading; PX.loading = gdLoad().then(d => {
    if (!d) return; d.glyphs.forEach(g => { if (g.set === "primitives" || g.parts) return; const id = pxSkyId(g); PX.vec.set(id, g.set === "moon" && g.v ? { d: g.v, vb: 100, name: g.name, g } : { d: g.d, vb: g.vb || 100, name: g.name, g }); });
    PX.ready = true; _mb.clear(); pxShelf(); stSync();
  }); return PX.loading;
}
const pxHas = id => PX.ready && PX.vec.has(id);
function pxN(cells) { return cells <= 2 ? PX_MIN : cells <= 4 ? 48 : PX_MAX; }
/* the outline laid onto an N x N grid: a cell is lit when the outline covers most of it */
function pxGrid(id, N) {
  const k = id + "|" + N; let g = PX.grid.get(k); if (g) return g; const v = PX.vec.get(id); if (!v) return null;
  const c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d"), pad = v.vb === 16 ? 0 : N * .06, s = (N - pad * 2) / v.vb;
  x.setTransform(s, 0, 0, s, pad, pad); x.fillStyle = "#fff"; x.imageSmoothingEnabled = false; x.fill(new Path2D(v.d));
  const im = x.getImageData(0, 0, N, N).data; g = new Uint8Array(N * N); for (let i = 0; i < g.length; i++) g[i] = im[i * 4 + 3] > (v.vb === 16 ? 10 : 110) ? 1 : 0;
  PX.grid.set(k, g); return g;
}
/* the Sky's materials, laid out on the glyph's own grid, three sub-cells to a pixel */
function pxMat(id, col, mat, N) {
  const key = id + "|" + col + "|" + mat + "|" + N; let c = PX.can.get(key); if (c) return c; const g = pxGrid(id, N), P = PAL[col] || PAL.orange; if (!g) return null;
  c = document.createElement("canvas"); c.width = c.height = N * 3; const x = c.getContext("2d"), rgb = m => "rgb(" + P.map(v => Math.round(Math.min(255, v * m))).join(",") + ")", on = (px, py) => g[py * N + px];
  if (mat === 4) { try { x.filter = "blur(" + (N / 13).toFixed(1) + "px)"; } catch (e) {} x.fillStyle = "rgba(" + P.join(",") + ",.6)"; for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) if (on(px, py)) x.fillRect(px * 3 - 1, py * 3 - 1, 5, 5); x.filter = "none"; }
  for (let py = 0; py < N; py++) for (let px = 0; px < N; px++) {
    if (!on(px, py)) continue; const X = px * 3, Y = py * 3;
    if (mat === 0 || mat === 4) { x.fillStyle = rgb(1); x.fillRect(X, Y, 3, 3); }
    else if (mat === 1) { x.fillStyle = rgb(1); for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) if (((sx + sy) & 1) === 0) x.fillRect(X + sx, Y + sy, 1, 1); }
    else if (mat === 2) { x.fillStyle = rgb(1); [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]].forEach(q => x.fillRect(X + q[0], Y + q[1], 1, 1)); }
    else if (mat === 3) { x.fillStyle = rgb(1.18); x.fillRect(X, Y, 2, 2); x.fillStyle = rgb(.5); x.fillRect(X + 2, Y, 1, 3); x.fillRect(X, Y + 2, 2, 1); }
  }
  PX.can.set(key, c); if (PX.can.size > 900) PX.can.delete(PX.can.keys().next().value); return c;
}
function pxCanvas(id, col, N) {
  const key = id + "|" + col + "|plain|" + N; let c = PX.can.get(key); if (c) return c; const g = pxGrid(id, N); if (!g) return null; const P = PAL[col] || PAL.orange;
  c = document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d"), im = x.createImageData(N, N);
  for (let i = 0; i < g.length; i++) if (g[i]) { im.data[i * 4] = P[0]; im.data[i * 4 + 1] = P[1]; im.data[i * 4 + 2] = P[2]; im.data[i * 4 + 3] = 255; }
  x.putImageData(im, 0, 0); PX.can.set(key, c); return c;
}
/* ---- a shelf for each sound family, patterned after the sound ----
   wave shape -> pattern: sine = soft dithered swell, square = blocks, triangle = zigzag, sawtooth = ramps;
   the home note sets the scale of the pattern (lower notes, broader pattern); a muffled voice is fainter */
const PX_ORDER = ["core", "iron", "structure", "magnetism", "craters", "radiation", "arrays", "orbits", "stars", "seal", "frequencies", "signals", "paths", "water", "bridge1", "bridge2", "bridge3", "bridge4", "notes", "def"];
const PX_DOOR = {};
if (typeof DOORS !== "undefined") DOORS.forEach(d => (d.pool || []).forEach(f => { if (!PX_DOOR[f]) PX_DOOR[f] = d.col; }));
const PX_COL = f => PX_DOOR[f] || ({ seal: "gold", notes: "sun", def: "white", core: "orange" })[f] || "foam";
const _pxPat = new Map();
function pxPattern(f) {
  if (_pxPat.has(f)) return _pxPat.get(f); const T = TIMBRE[f] || TIMBRE.def, P = PAL[PX_COL(f)];
  const per = Math.round(clamp(28 - Math.log2(T.base / 60) * 5, 6, 26)), c = document.createElement("canvas"); c.width = per * 2; c.height = per; const x = c.getContext("2d");
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], a = T.lp ? .1 : .16;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) {
    const u = i / per; let v;
    if (T.t === "sine") v = .5 + .5 * Math.sin(u * Math.PI) * Math.sin(j / per * Math.PI);
    else if (T.t === "square") v = ((Math.floor(u * 2) + Math.floor(j / per * 2)) & 1) ? .85 : .1;
    else if (T.t === "triangle") { const tri = 1 - Math.abs(((u * 2) % 2) - 1); v = Math.abs(j / per - tri) < .14 ? .9 : .08; }
    else v = (u % 1) * .9;
    if (v > BAY[(j & 3) * 4 + (i & 3)] / 16) { x.fillStyle = "rgba(" + P.join(",") + "," + a + ")"; x.fillRect(i, j, 1, 1); }
  }
  const url = "url(" + c.toDataURL() + ")"; _pxPat.set(f, url); return url;
}
function pxShelf() {
  if (!PX.ready) return; const sh = $("shelf"); sh.innerHTML = ""; sh.classList.add("pxShelf");
  const groups = new Map(); PX.vec.forEach((v, id) => { const f = id.split(":")[0]; if (ST.dom !== "all" && f !== ST.dom) return; if (!groups.has(f)) groups.set(f, []); groups.get(f).push([id, v]); });
  const order = PX_ORDER.filter(f => groups.has(f)).concat([...groups.keys()].filter(f => !PX_ORDER.includes(f)));
  order.forEach(f => {
    const T = TIMBRE[f] || TIMBRE.def, sec = document.createElement("section"); sec.className = "pxFam"; sec.style.backgroundImage = pxPattern(f);
    const h = document.createElement("div"); h.className = "pxHead"; h.innerHTML = "<b></b><span></span>"; h.firstChild.textContent = f.toUpperCase(); h.lastChild.textContent = T.t + " · " + Math.round(T.base) + " Hz" + (T.part ? " · overtone ×" + T.part : "") + (T.lp ? " · muffled" : "") + " · " + groups.get(f).length;
    h.firstChild.style.color = "rgb(" + PAL[PX_COL(f)].join(",") + ")"; sec.appendChild(h);
    const grid = document.createElement("div"); grid.className = "pxGrid"; sec.appendChild(grid);
    groups.get(f).forEach(([id, v]) => {
      const b = document.createElement("button"); b.type = "button"; b.title = v.name; b.setAttribute("aria-label", "Glyph " + v.name + ", " + f);
      const c = pxCanvas(id, PX_COL(f), PX_MIN); if (c) { const k = document.createElement("canvas"); k.width = k.height = PX_MIN; k.getContext("2d").drawImage(c, 0, 0); b.appendChild(k); }
      b.addEventListener("click", () => { if (shSuppress) { shSuppress = false; return; } if (ST.auto || !stEach(it => { it.g = id; }, true)) stAdd(id); });
      b.addEventListener("pointerdown", e => shDown(e, id)); grid.appendChild(b);
    });
    sh.appendChild(sec);
  });
}
