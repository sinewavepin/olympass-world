
/* ============ THE SKY · DRAW: drawing into Ganymede's sky ============
   The brushes come from the Square Peg memory, where a loop drawn by hand is written out in
   characters that follow its slope (─ │ ╱ ╲). Here that writing is a brush of its own (DRAW), the
   loop-and-square finder is another (SQUARE), and two more are made of the same stuff (STIPPLE, SHADE).
   Drawings live in layers. Each layer has a colour, a level of detail and a way of moving (its
   animation keeps time with the card's pace). Under the playhead a drawing sounds: height picks the
   step of the card's five-note ladder, the layer's colour picks the voice, a square plays its four
   corners together. Nothing drawn is thrown away: lifted characters can be brought back with UNDO. */
const DR_BRUSHES = ["DRAW", "SQUARE", "STIPPLE", "SHADE"];
const DR_TOOLS = ["BRUSH", "SELECT", "FILL", "LIFT", "PICK"];
const DR_ANIMS = ["STILL", "TRACE", "SHIMMER", "FLOW", "BREATHE", "DRIFT"];
const DR_VOICE = { orange: ["arrays", 0], sun: ["seal", 12], gold: ["notes", 0], leaf: ["stars", 12], eblue: ["water", 0], foam: ["paths", 0], violet: ["craters", -12], red: ["radiation", 0], white: ["frequencies", 0] };
const DR_LADDER = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const DR_SHADE = [" ", "░", "▒", "▓", "█"], DR_DOTS = ["·", "∙", "•", "●"];
const DR_SHIM = { "─": "╌", "│": "╎", "╱": "⁄", "╲": "∖", "·": "∙", "∙": "·", "•": "∙", "░": "▒", "▒": "░", "▓": "▒", "█": "▓", "●": "•" };
const DR = { tab: "sky", brush: 0, tool: 0, size: 1, op: 1, col: "foam", res: 2, layers: [], act: 1, ord: 0, hist: [], stroke: null, sel: null, move: null, ver: 0, cache: new Map(), key: 220 };
function drLayer(name, col, res) { return { id: "L" + (++DR.ord) + "_" + Date.now().toString(36), name, vis: true, anim: 0, col, res: res || 2, cells: new Map(), sq: [], ord: 0 }; }
function drReset() { DR.layers = [{ id: "GLYPHS", glyphs: true, name: "GLYPHS", vis: true }, drLayer("INK 1", "foam", 2)]; DR.act = 1; DR.ver++; }
drReset();
const drL = () => DR.layers[DR.act] && !DR.layers[DR.act].glyphs ? DR.layers[DR.act] : null;
function drDims(L) { return [ST_CW * L.res, ST_CH * L.res]; }
function drSer(layers) { return (layers || DR.layers).map(L => L.glyphs ? { id: L.id, glyphs: true, name: L.name, vis: L.vis } : { id: L.id, name: L.name, vis: L.vis, anim: L.anim, col: L.col, res: L.res, ord: L.ord, sq: L.sq, cells: [...L.cells.entries()] }); }
function drDeser(a) { return (a || []).map(o => o.glyphs ? Object.assign({}, o) : Object.assign({}, o, { cells: new Map(o.cells || []), sq: o.sq || [] })); }
function drPush() { DR.hist.push({ layers: drSer(), act: DR.act }); if (DR.hist.length > 80) DR.hist.shift(); }
function drUndo() { const h = DR.hist.pop(); if (!h) { stSay("nothing to bring back"); return; } DR.layers = drDeser(h.layers); DR.act = Math.min(h.act, DR.layers.length - 1); drChanged(); drPanel(); }
function drChanged() { DR.ver++; DR.cache.clear(); if (window.__dkOn) dkDirty(); }
/* the Square Peg's own way of choosing a character for a slope */
function drSlope(dx, dy) { const a = Math.abs(Math.atan2(dy, dx)), f = a > Math.PI / 2 ? Math.PI - a : a; if (f < Math.PI / 8) return "─"; if (f > 3 * Math.PI / 8) return "│"; return (dx * dy < 0) ? "╱" : "╲"; }
function drSet(L, x, y, ch, col, a) {
  const [C, R] = drDims(L); x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= C || y >= R) return;
  if (ch === " ") { L.cells.delete(x + "," + y); return; }
  L.cells.set(x + "," + y, [ch, col, Math.round(a * 100) / 100, ++L.ord]);
}
function drCellF(e, L) { const r = stCv.getBoundingClientRect(), [C, R] = drDims(L); return [(e.clientX - r.left) / r.width * C, (e.clientY - r.top) / r.height * R]; }
function drLineChars(L, x0, y0, x1, y1, ch, col, a, thick) {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 1.6)), dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  for (let k = 0; k <= n; k++) { const t = k / n, px = x0 + dx * t, py = y0 + dy * t; for (let w = -(thick - 1) / 2; w <= (thick - 1) / 2; w++) drSet(L, px + nx * w, py + ny * w, ch, col, a); }
}
/* the inscribed-square finder, as in the Square Peg memory: four points of the loop that make a square */
function drResample(pts, N) {
  const cl = pts.concat([pts[0]]), Ls = [0]; for (let i = 1; i < cl.length; i++) Ls.push(Ls[i - 1] + Math.hypot(cl[i][0] - cl[i - 1][0], cl[i][1] - cl[i - 1][1]));
  const tot = Ls[Ls.length - 1], out = []; let j = 0;
  for (let i = 0; i < N; i++) { const tg = tot * i / N; while (j < Ls.length - 2 && Ls[j + 1] < tg) j++; const sg = (Ls[j + 1] - Ls[j]) || 1, f = (tg - Ls[j]) / sg; out.push([cl[j][0] + f * (cl[j + 1][0] - cl[j][0]), cl[j][1] + f * (cl[j + 1][1] - cl[j][1])]); }
  return out;
}
function drSquares(loop) {
  if (loop.length < 10) return [];
  const dense = drResample(loop, 900), pts = drResample(loop, 150);
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9; dense.forEach(p => { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); });
  const diag = Math.hypot(b - a, d - c), tol = Math.max(.35, diag * .009), cell = tol * 2, grid = new Map();
  dense.forEach(p => { const k = Math.floor(p[0] / cell) + "," + Math.floor(p[1] / cell); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(p); });
  const near = (x, y) => { const gx = Math.floor(x / cell), gy = Math.floor(y / cell); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const arr = grid.get((gx + i) + "," + (gy + j)); if (!arr) continue; for (const p of arr) if ((p[0] - x) ** 2 + (p[1] - y) ** 2 < tol * tol) return true; } return false; };
  const found = [], minS = diag * .06;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[j], dx = x2 - x1, dy = y2 - y1, s = Math.hypot(dx, dy); if (s < minS) continue;
    for (const sg of [1, -1]) { const rx = -dy * sg, ry = dx * sg, q1 = [x2 + rx, y2 + ry], q2 = [x1 + rx, y1 + ry]; if (near(q1[0], q1[1]) && near(q2[0], q2[1])) found.push({ s, poly: [[x1, y1], [x2, y2], q1, q2] }); }
  }
  found.sort((p, q) => q.s - p.s);
  const out = [], cen = [];
  found.forEach(f => { const cx = f.poly.reduce((s, p) => s + p[0], 0) / 4, cy = f.poly.reduce((s, p) => s + p[1], 0) / 4; if (cen.some(q => Math.hypot(q[0] - cx, q[1] - cy) < diag * .05 && Math.abs(q[2] - f.s) < diag * .05)) return; cen.push([cx, cy, f.s]); out.push(f); });
  return out.slice(0, 7);
}
/* ---- painting the layers into the sky ---- */
function drTick() { return stPlaying ? stAcc : Math.floor(performance.now() / stColMs); }
function drCellPaint(x, L, U, ch, col, a, cx, cy, cw, chh) {
  const p = PAL[col] || PAL.foam; x.fillStyle = "rgba(" + p[0] + "," + p[1] + "," + p[2] + "," + Math.max(0, Math.min(1, a)).toFixed(3) + ")";
  x.fillText(ch, cx * cw + cw / 2, cy * chh + chh * .82);
}
function drLayerPaint(x, L, k, U, now) {
  const [C, R] = drDims(L), cw = U * ST_CW / C, chh = U * ST_CH / R, tk = drTick();
  x.save(); x.font = Math.round(chh * 1.02) + 'px ui-monospace, "DejaVu Sans Mono", Menlo, Consolas, monospace'; x.textAlign = "center";
  if (!L.anim) {
    /* a still layer is painted once and kept as a picture until it changes */
    const key = L.id + "|" + DR.ver + "|" + k; let c = DR.cache.get(key);
    if (!c) { c = document.createElement("canvas"); c.width = Math.round(ST_CW * U); c.height = Math.round(ST_CH * U); const y = c.getContext("2d"); y.font = x.font; y.textAlign = "center"; L.cells.forEach((v, kk) => { const [cx, cy] = kk.split(",").map(Number); drCellPaint(y, L, U, v[0], v[1], v[2], cx, cy, cw, chh); }); drSqPaint(y, L, cw, chh, 1, -1); DR.cache.set(key, c); }
    x.drawImage(c, 0, 0); x.restore(); return;
  }
  const maxO = L.ord || 1, span = maxO + 24, head = (tk * Math.max(2, Math.round(maxO / 40))) % span;
  L.cells.forEach((v, kk) => {
    let [cx, cy] = kk.split(",").map(Number), ch = v[0], a = v[2];
    if (L.anim === 1 && v[3] > head) return;                                          /* TRACE: written out again in the order it was drawn */
    if (L.anim === 2 && (v[3] + tk) % 4 === 0) ch = DR_SHIM[ch] || ch;                /* SHIMMER */
    if (L.anim === 3) a *= .35 + .65 * (.5 + .5 * Math.cos((v[3] - tk * 3) / 5));      /* FLOW: brightness runs along the stroke */
    if (L.anim === 4) a *= .5 + .5 * (.5 + .5 * Math.sin(tk * .25));                    /* BREATHE */
    if (L.anim === 5) cx = (cx + Math.floor(tk / 4)) % C;                              /* DRIFT */
    drCellPaint(x, L, U, ch, v[1], a, cx, cy, cw, chh);
  });
  drSqPaint(x, L, cw, chh, 1, L.anim === 1 ? head - maxO : 1e9);
  x.restore();
}
function drSqPaint(x, L, cw, chh, a, upTo) {
  L.sq.forEach((s, i) => {
    if (upTo !== -1 && upTo < i * 6) return; const best = i === 0, P = PAL[s.col || "orange"];
    x.strokeStyle = "rgba(" + P.join(",") + "," + (best ? .9 : .4) + ")"; x.lineWidth = Math.max(1, cw * .12); x.beginPath();
    s.poly.forEach((p, j) => { const X = p[0] * cw, Y = p[1] * chh; j ? x.lineTo(X, Y) : x.moveTo(X, Y); }); x.closePath(); x.stroke();
    x.fillStyle = "rgba(" + PAL.foam.join(",") + "," + (best ? 1 : .6) + ")"; s.poly.forEach(p => { x.beginPath(); x.arc(p[0] * cw, p[1] * chh, Math.max(1.5, cw * (best ? .32 : .2)), 0, TAU); x.fill(); });
  });
}
function drPaintAll(x, k, ui, now, glyphsFn) {
  const U = ST_U * k;
  DR.layers.forEach((L, i) => {
    if (!L.vis) return; if (L.glyphs) { glyphsFn(); return; }
    drLayerPaint(x, L, k, U, now);
  });
  if (!ui || DR.tab !== "draw") return;
  const L = drL(); if (!L) return; const [C, R] = drDims(L), cw = U * ST_CW / C, chh = U * ST_CH / R;
  if (DR.sel) { const s = DR.sel, m = DR.move; const ox = m ? m.dx : 0, oy = m ? m.dy : 0; x.save(); x.strokeStyle = "#ffd36b"; x.setLineDash([k * 3, k * 2]); x.lineWidth = Math.max(1, k * .6); x.strokeRect((s.x0 + ox) * cw, (s.y0 + oy) * chh, (s.x1 - s.x0 + 1) * cw, (s.y1 - s.y0 + 1) * chh); x.restore(); }
  if (DR.stroke && DR.brush === 1 && DR.tool === 0) { const st = DR.stroke.pts; x.save(); x.strokeStyle = "rgba(200,240,255,.5)"; x.setLineDash([k * 2, k * 2]); x.beginPath(); st.forEach((p, j) => j ? x.lineTo(p[0] * cw, p[1] * chh) : x.moveTo(p[0] * cw, p[1] * chh)); x.stroke(); x.restore(); }
}
/* ---- the brushes and the tools ---- */
function drDown(e) {
  const L = drL(); if (!L) { stSay("pick an ink layer on the right to draw into"); return; }
  const [fx, fy] = drCellF(e, L), tool = DR_TOOLS[DR.tool];
  if (tool === "PICK") { const v = L.cells.get(Math.floor(fx) + "," + Math.floor(fy)); if (v) { DR.col = v[1]; drPanel(); stSay("picked " + v[0] + " in " + v[1]); } return; }
  if (tool === "FILL") { drPush(); drFill(L, Math.floor(fx), Math.floor(fy)); drChanged(); return; }
  if (tool === "SELECT") {
    const s = DR.sel; if (s && fx >= s.x0 && fx < s.x1 + 1 && fy >= s.y0 && fy < s.y1 + 1) { DR.move = { sx: fx, sy: fy, dx: 0, dy: 0 }; return; }
    DR.sel = { ax: Math.floor(fx), ay: Math.floor(fy), x0: Math.floor(fx), y0: Math.floor(fy), x1: Math.floor(fx), y1: Math.floor(fy) }; DR.stroke = { sel: true }; return;
  }
  drPush(); DR.stroke = { pts: [[fx, fy]], last: [fx, fy], L, n: 0 };
  if (tool === "LIFT") drLift(L, fx, fy); else if (DR.brush !== 1) drBrushAt(L, fx, fy, fx, fy);
}
function drMove(e) {
  const L = drL(); if (!L) return; const [fx, fy] = drCellF(e, L);
  if (DR.move) { DR.move.dx = Math.round(fx - DR.move.sx); DR.move.dy = Math.round(fy - DR.move.sy); return; }
  if (DR.stroke && DR.stroke.sel) { const s = DR.sel; s.x0 = Math.min(s.ax, Math.floor(fx)); s.x1 = Math.max(s.ax, Math.floor(fx)); s.y0 = Math.min(s.ay, Math.floor(fy)); s.y1 = Math.max(s.ay, Math.floor(fy)); return; }
  const st = DR.stroke; if (!st || !st.pts) return; const l = st.last; if (Math.hypot(fx - l[0], fy - l[1]) < .45) return;
  st.pts.push([fx, fy]);
  if (DR_TOOLS[DR.tool] === "LIFT") drLift(L, fx, fy); else if (DR.brush !== 1) drBrushAt(L, l[0], l[1], fx, fy);
  st.last = [fx, fy]; if (DR.brush !== 1) drChanged();
}
function drUp() {
  const L = drL();
  if (DR.move && L && DR.sel) { const m = DR.move, s = DR.sel; if (m.dx || m.dy) { drPush(); const take = []; L.cells.forEach((v, kk) => { const [x, y] = kk.split(",").map(Number); if (x >= s.x0 && x <= s.x1 && y >= s.y0 && y <= s.y1) take.push([x, y, v]); }); take.forEach(t => L.cells.delete(t[0] + "," + t[1])); take.forEach(t => { const [C, R] = drDims(L), nx = t[0] + m.dx, ny = t[1] + m.dy; if (nx >= 0 && ny >= 0 && nx < C && ny < R) L.cells.set(nx + "," + ny, t[2]); }); s.x0 += m.dx; s.x1 += m.dx; s.y0 += m.dy; s.y1 += m.dy; drChanged(); } DR.move = null; return; }
  const st = DR.stroke; DR.stroke = null; if (!st || !st.pts || !L) return;
  if (DR.brush === 1 && DR_TOOLS[DR.tool] === "BRUSH") {
    if (st.pts.length < 8) { stSay("draw one loop · it closes itself"); return; }
    const loop = drResample(st.pts, Math.max(60, st.pts.length * 2));
    for (let i = 0; i < loop.length; i++) { const p = loop[i], q = loop[(i + 1) % loop.length]; drSet(L, p[0], p[1], drSlope(q[0] - p[0], q[1] - p[1]), DR.col, DR.op); }
    const sq = drSquares(loop); sq.forEach(s => { s.col = "orange"; s.poly = s.poly.map(p => [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100]); }); L.sq = L.sq.concat(sq);
    stSay("SQUARE PEG · a new loop · " + sq.length + (sq.length >= 7 ? "+" : "") + (sq.length === 1 ? " square" : " squares") + " found on it");
  }
  drChanged();
}
function drBrushAt(L, x0, y0, x1, y1) {
  const b = DR_BRUSHES[DR.brush], sz = DR.size, a = DR.op, col = DR.col;
  if (b === "DRAW") { if (x0 === x1 && y0 === y1) { drSet(L, x1, y1, "·", col, a); return; } drLineChars(L, x0, y0, x1, y1, drSlope(x1 - x0, y1 - y0), col, a, sz); return; }
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let k = 0; k <= n; k++) {
    const px = x0 + (x1 - x0) * k / n, py = y0 + (y1 - y0) * k / n, r = sz - 1;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r + .5) continue; const cx = Math.floor(px + dx), cy = Math.floor(py + dy);
      if (b === "STIPPLE") { if (hash2(cx * 131 + cy, 7) > .42) continue; drSet(L, cx, cy, DR_DOTS[Math.min(3, Math.floor(hash2(cx, cy) * (1 + sz)))], col, a); }
      else { const v = L.cells.get(cx + "," + cy), lv = v ? Math.max(0, DR_SHADE.indexOf(v[0])) : 0; if (v && lv === 0 && v[0] !== " ") continue; drSet(L, cx, cy, DR_SHADE[Math.min(4, lv + 1)], col, a); }
    }
  }
}
function drLift(L, fx, fy) { const r = DR.size - .5; for (let dy = -DR.size; dy <= DR.size; dy++) for (let dx = -DR.size; dx <= DR.size; dx++) if (dx * dx + dy * dy <= r * r + .5) L.cells.delete(Math.floor(fx + dx) + "," + Math.floor(fy + dy)); drChanged(); }
function drFill(L, x, y) {
  const [C, R] = drDims(L); if (x < 0 || y < 0 || x >= C || y >= R || L.cells.has(x + "," + y)) { stSay("fill pours into an empty space"); return; }
  const ch = DR.brush === 2 ? "·" : DR.brush === 3 ? "░" : "·", seen = new Set([x + "," + y]), q = [[x, y]]; let n = 0;
  while (q.length && n < 4000) { const [a, b] = q.shift(); drSet(L, a, b, ch, DR.col, DR.op * .8); n++; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = a + dx, ny = b + dy, kk = nx + "," + ny; if (nx < 0 || ny < 0 || nx >= C || ny >= R || seen.has(kk) || L.cells.has(kk)) return; seen.add(kk); q.push([nx, ny]); }); }
  stSay("filled " + n + " cells");
}
/* ---- a drawing sounds under the playhead ---- */
function drSoundLayers(layers, col, vol, key) {
  let voices = 0;
  layers.forEach(L => {
    if (L.glyphs || !L.vis || voices >= 3) return; const res = L.res, R = ST_CH * res; let best = null;
    L.cells.forEach((v, kk) => { const [x, y] = kk.split(",").map(Number); if (x >= col * res && x < (col + 1) * res && (!best || y < best[0])) best = [y, v]; });
    if (best) {
      const [y, v] = best, vo = DR_VOICE[v[1]] || DR_VOICE.foam, T = TIMBRE[vo[0]] || TIMBRE.def, step = DR_LADDER[Math.min(DR_LADDER.length - 1, Math.floor((1 - y / R) * DR_LADDER.length))];
      playGlyph(vo[0] + ":draw", { hz: (key || DR.key) * Math.pow(2, (step + vo[1]) / 12), vol: (vol || .5) * (.25 + .5 * v[2]), x: (col + .5) / ST_CW }); voices++;
    }
    L.sq.forEach(s => {
      const minx = Math.min(...s.poly.map(p => p[0])); if (Math.floor(minx / res) !== col) return;
      s.poly.slice().sort((p, q) => q[1] - p[1]).forEach((p, j) => setTimeout(() => {
        const step = DR_LADDER[Math.min(DR_LADDER.length - 1, Math.floor((1 - p[1] / R) * DR_LADDER.length))];
        playGlyph("seal:square", { hz: (key || DR.key) * Math.pow(2, step / 12), vol: (vol || .5) * .32, x: (col + .5) / ST_CW });
      }, j * 45));
    });
  });
}
/* ---- the panel, the tabs, the brush menu, the size and opacity rails, the tools on the rim ---- */
function drPanel() {
  const host = $("drLayers"); if (!host) return; host.innerHTML = "";
  DR.layers.slice().reverse().forEach(L => {
    const i = DR.layers.indexOf(L), row = document.createElement("div"); row.className = "drRow" + (i === DR.act ? " on" : ""); row.dataset.i = i;
    const eye = document.createElement("button"); eye.type = "button"; eye.className = "drEye"; eye.textContent = L.vis ? "◉" : "○"; eye.title = L.vis ? "Hide" : "Show"; eye.setAttribute("aria-label", (L.vis ? "Hide " : "Show ") + L.name);
    eye.addEventListener("click", ev => { ev.stopPropagation(); drPush(); L.vis = !L.vis; drChanged(); drPanel(); });
    const nm = document.createElement("span"); nm.className = "drNm"; nm.textContent = L.name + (L.glyphs ? "" : " · " + DR_ANIMS[L.anim].toLowerCase());
    if (!L.glyphs) { nm.style.color = "rgb(" + PAL[L.col].join(",") + ")"; }
    row.appendChild(eye); row.appendChild(nm);
    row.addEventListener("click", () => { DR.act = i; if (!L.glyphs) DR.col = L.col; drPanel(); });
    host.appendChild(row);
  });
  const L = drL();
  document.querySelectorAll("#drAnim .chip").forEach(b => { b.setAttribute("aria-pressed", String(!!L && +b.dataset.i === L.anim)); b.disabled = !L; });
  document.querySelectorAll("#drDet .chip").forEach(b => { b.setAttribute("aria-pressed", String(!!L && +b.dataset.r === L.res)); b.disabled = !L; });
  document.querySelectorAll("#drSw .sw").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === DR.col)));
  document.querySelectorAll("#drTools button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.t === DR.tool)));
  $("drBrushBtn").textContent = DR_BRUSHES[DR.brush] + " ▾";
  document.querySelectorAll("#drBrushList button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.b === DR.brush)));
  $("drUndo").disabled = !DR.hist.length;
  const pb = $("drPlay"); if (pb) { pb.textContent = stPlaying ? "STOP" : "PLAY"; pb.classList.toggle("on", stPlaying); }
}
function drSetTab(t) {
  DR.tab = t; $("roomStudio").classList.toggle("drawing", t === "draw");
  document.querySelectorAll("#stTabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === t)));
  $("stPanel").hidden = t === "draw"; $("drPanel").hidden = t !== "draw"; DR.sel = null; DR.move = null;
  stCv.style.cursor = t === "draw" ? "crosshair" : ""; drPanel();
  stSay(t === "draw" ? "drawing into the sky · " + DR_BRUSHES[DR.brush].toLowerCase() + " brush" : "the sky");
}
function drInit() {
  $("stTabs").addEventListener("click", e => { const b = e.target.closest("button[data-tab]"); if (b) drSetTab(b.dataset.tab); });
  $("drBrushBtn").addEventListener("click", e => { e.stopPropagation(); const l = $("drBrushList"); l.hidden = !l.hidden; $("drBrushBtn").setAttribute("aria-expanded", String(!l.hidden)); });
  DR_BRUSHES.forEach((n, i) => { const b = document.createElement("button"); b.type = "button"; b.dataset.b = i; b.textContent = n; b.title = ["writes the stroke out in characters that follow its slope", "draw a loop; it closes itself, and the squares sitting on it are found", "dots, scattered by a fixed pattern", "each pass shades a little deeper: ░ ▒ ▓ █"][i]; b.addEventListener("click", () => { DR.brush = i; DR.tool = 0; $("drBrushList").hidden = true; $("drBrushBtn").setAttribute("aria-expanded", "false"); drPanel(); stSay(n.toLowerCase() + " brush"); }); $("drBrushList").appendChild(b); });
  document.addEventListener("click", e => { if (!e.target.closest("#drBrush")) { const l = $("drBrushList"); if (l && !l.hidden) { l.hidden = true; $("drBrushBtn").setAttribute("aria-expanded", "false"); } } });
  DR_TOOLS.forEach((n, i) => { const b = document.createElement("button"); b.type = "button"; b.dataset.t = i; b.textContent = n === "SELECT" ? "SELECT + MOVE" : n; b.addEventListener("click", () => { DR.tool = i; DR.sel = null; drPanel(); stSay(b.textContent.toLowerCase()); }); $("drTools").appendChild(b); });
  $("drSize").addEventListener("input", e => { DR.size = +e.target.value; $("drSizeV").textContent = DR.size; });
  $("drOp").addEventListener("input", e => { DR.op = +e.target.value / 100; $("drOpV").textContent = e.target.value + "%"; });
  DR_ANIMS.forEach((n, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.dataset.i = i; b.textContent = n; b.addEventListener("click", () => { const L = drL(); if (!L) return; drPush(); L.anim = i; drChanged(); drPanel(); }); $("drAnim").appendChild(b); });
  [[2, "COARSE"], [4, "FINE"]].forEach(([r, n]) => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.dataset.r = r; b.textContent = n; b.addEventListener("click", () => { const L = drL(); if (!L || L.res === r) return; drPush(); const f = r / L.res, m = new Map(); L.cells.forEach((v, kk) => { const [x, y] = kk.split(",").map(Number); m.set(Math.floor(x * f) + "," + Math.floor(y * f), v); }); L.cells = m; L.sq.forEach(s => s.poly = s.poly.map(p => [p[0] * f, p[1] * f])); L.res = r; drChanged(); drPanel(); }); $("drDet").appendChild(b); });
  ST_COLS.forEach(c => { const b = document.createElement("button"); b.type = "button"; b.className = "sw"; b.dataset.c = c; b.setAttribute("aria-label", "Colour " + c); b.style.background = "rgb(" + PAL[c].join(",") + ")"; b.addEventListener("click", () => { DR.col = c; const L = drL(); if (L) { L.col = c; drChanged(); } drPanel(); }); $("drSw").appendChild(b); });
  $("drAdd").addEventListener("click", () => { drPush(); const n = DR.layers.filter(l => !l.glyphs).length + 1; DR.layers.splice(DR.act + 1, 0, drLayer("INK " + n, DR.col, 2)); DR.act++; drChanged(); drPanel(); });
  $("drUpL").addEventListener("click", () => { const i = DR.act; if (i >= DR.layers.length - 1) return; drPush(); [DR.layers[i], DR.layers[i + 1]] = [DR.layers[i + 1], DR.layers[i]]; DR.act++; drChanged(); drPanel(); });
  $("drDnL").addEventListener("click", () => { const i = DR.act; if (i <= 0) return; drPush(); [DR.layers[i], DR.layers[i - 1]] = [DR.layers[i - 1], DR.layers[i]]; DR.act--; drChanged(); drPanel(); });
  $("drUndo").addEventListener("click", drUndo);
  $("drPlay").addEventListener("click", () => { stPlay(); drPanel(); });
  /* the sky's own pointer handling stays as it is; while drawing, the pointer is taken here first */
  const gl = $("sglass"), mine = e => DR.tab === "draw" && e.target === stCv;
  gl.addEventListener("pointerdown", e => { if (!mine(e) || e.button > 0) return; e.stopPropagation(); e.preventDefault(); try { stCv.setPointerCapture(e.pointerId); } catch (er) {} drDown(e); }, true);
  gl.addEventListener("pointermove", e => { if (!mine(e)) return; e.stopPropagation(); drMove(e); }, true);
  const up = e => { if (!mine(e)) return; e.stopPropagation(); drUp(); drPanel(); };
  gl.addEventListener("pointerup", up, true); gl.addEventListener("pointercancel", up, true);
  window.addEventListener("keydown", e => {
    if (curRoom !== "studio" || DR.tab !== "draw") return; const tg = e.target; if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { drUndo(); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (e.key === " ") { stPlay(); drPanel(); e.preventDefault(); e.stopImmediatePropagation(); }
    else if (e.key === "Escape") { DR.sel = null; e.stopImmediatePropagation(); }
    else if (["Delete", "Backspace", "r", "f", "d", "[", "]"].includes(e.key)) e.stopImmediatePropagation();   /* the sky's glyph keys rest while drawing */
  }, true);
  drPanel();
}
