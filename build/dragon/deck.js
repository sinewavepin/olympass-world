/* ---------- the receiving deck: pictures, colour planes, shelf ---------- */
const outC = $("outCanvas"), outX = outC.getContext("2d");
const deck = { cur: null, pend: null, hdr: null, last: null, view: "eye", showP: null, im: null, glyphLive: [] };
const bus = new EventTarget();
let bc = null; try { bc = new BroadcastChannel("dragonet.fly"); } catch (e) {}
const tapeLines = [];
function plog(msg) {
  const d = new Date(), t = String(d.getMinutes()).padStart(2, "0") + ":" + String(d.getSeconds()).padStart(2, "0");
  tapeLines.push(t + "  " + msg); if (tapeLines.length > 400) tapeLines.shift();
  const el = $("tape"); if (el) { el.textContent = tapeLines.slice(-60).join("\n"); el.scrollTop = el.scrollHeight; }
}
function say(el, text, bad) { el.className = "status" + (bad ? " bad" : ""); el.textContent = text; }
function barText(frac, w) { const k = Math.round(Math.max(0, Math.min(1, frac)) * w); return "[" + "#".repeat(k) + "-".repeat(w - k) + "]"; }
function setProg(frac) { $("progBar").textContent = barText(frac, 20) + " " + String(Math.round(frac * 100)).padStart(3, " ") + "%"; }

function mkPic(kind, n, target) { return { kind, n, target, data: new Uint8Array(n * n), have: new Uint8Array(n), count: 0, stamp: null, plane: null }; }
function sizeOut(n) { if (outC.width !== n || outC.height !== n) { outC.width = outC.height = n; } }
function clearOut(n) { sizeOut(n); deck.im = outX.createImageData(n, n); const d = deck.im.data; for (let i = 0; i < n * n; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = 14; d[i * 4 + 3] = 255; } outX.putImageData(deck.im, 0, 0); }
function paintGreyRow(pic, idx) {
  if (!deck.im || deck.im.width !== pic.n) clearOut(pic.n);
  const d = deck.im.data, n = pic.n; for (let k = 0; k < n; k++) { const o = (idx * n + k) * 4, v = pic.data[idx * n + k]; d[o] = d[o + 1] = d[o + 2] = v; }
  if (deck.view === "eye") outX.putImageData(deck.im, 0, 0, 0, idx, n, 1);
}
function repair(have, data, n, w) {
  for (let y = 0; y < n; y++) if (!have[y]) {
    let s = y - 1; while (s >= 0 && !have[s]) s--; let t = y + 1; while (t < n && !have[t]) t++;
    const src = s >= 0 ? s : t; if (src < 0 || src >= n) continue;
    data.copyWithin(y * w, src * w, src * w + w);
  }
}
function composeInto(p, ctx2, im) {
  const n = p.n, d = im.data, c = 64, ax = new Int32Array(n), bx = new Int32Array(n), fx = new Float32Array(n);
  for (let x = 0; x < n; x++) { const cx = Math.min(c - 1, x * (c - 1) / (n - 1)), x0 = cx | 0; ax[x] = x0; bx[x] = Math.min(c - 1, x0 + 1); fx[x] = cx - x0; }
  for (let y = 0; y < n; y++) {
    const cy = Math.min(c - 1, y * (c - 1) / (n - 1)), y0 = cy | 0, y1 = Math.min(c - 1, y0 + 1), fy = cy - y0;
    for (let x = 0; x < n; x++) {
      const a = ax[x], b = bx[x], f = fx[x];
      const cb = ((p.cb[y0 * c + a] * (1 - f) + p.cb[y0 * c + b] * f) * (1 - fy) + (p.cb[y1 * c + a] * (1 - f) + p.cb[y1 * c + b] * f) * fy) - 128;
      const cr = ((p.cr[y0 * c + a] * (1 - f) + p.cr[y0 * c + b] * f) * (1 - fy) + (p.cr[y1 * c + a] * (1 - f) + p.cr[y1 * c + b] * f) * fy) - 128;
      const Y = p.y[y * n + x], o = (y * n + x) * 4;
      const R = Y + 1.402 * cr, G = Y - 0.344136 * cb - 0.714136 * cr, B = Y + 1.772 * cb;
      d[o] = R < 0 ? 0 : R > 255 ? 255 : R; d[o + 1] = G < 0 ? 0 : G > 255 ? 255 : G; d[o + 2] = B < 0 ? 0 : B > 255 ? 255 : B; d[o + 3] = 255;
    }
  }
  ctx2.putImageData(im, 0, 0);
}
function recompose(p) {
  if (!p.im) p.im = new ImageData(p.n, p.n);
  composeInto(p, p.canvas.getContext("2d"), p.im);
  if (deck.showP === p && deck.view === "eye") { sizeOut(p.n); outX.drawImage(p.canvas, 0, 0); }
}

/* the shelf: every finished picture, with its stamp */
function saveBlob(blob, name) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
const shelfItems = [];
function shelve(pic, mono) {
  const c = document.createElement("canvas"); c.width = c.height = pic.n; const x = c.getContext("2d"), im = x.createImageData(pic.n, pic.n);
  for (let i = 0; i < pic.n * pic.n; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = pic.data[i]; im.data[i * 4 + 3] = 255; } x.putImageData(im, 0, 0);
  const fig = document.createElement("figure"), cap = document.createElement("figcaption"), mini = document.createElement("div"), sv = document.createElement("button"), mu = document.createElement("button");
  const t = new Date(), name = "dragonet-" + t.toTimeString().slice(0, 8).replace(/:/g, "") + ".png";
  sv.type = mu.type = "button"; sv.textContent = "Save"; mu.textContent = "Music"; mini.className = "mini";
  sv.addEventListener("click", () => c.toBlob(b => saveBlob(b, name)));
  const item = { pic, canvas: c, cap, stamp: pic.stamp };
  mu.addEventListener("click", () => { const g = glyphGrid(pic.data, pic.n); deck.last = pic; say($("glyphStatus"), "Playing a picture as music: 16 phrases, one per row of glyphs."); playGrid(g, () => say($("glyphStatus"), "The picture has finished playing.")); });
  mini.append(sv, mu); fig.append(c, cap, mini); $("shelf").prepend(fig); shelfItems.push(item); paintCap(item);
  return item;
}
function paintCap(it) { it.cap.textContent = (it.stamp != null ? stampText(it.stamp) : "") || (it.pic.n + " x " + it.pic.n); }
function shelfRestamp() { shelfItems.forEach(paintCap); }

/* callbacks from the receiver */
function startPic(m) {
  finishCur(); const M = MODES[m], h = deck.hdr; let kind = "Y", target = null;
  if (m === "chroma") {
    kind = "C"; const p = deck.pend;
    if (p) { if (h && (h.plane === 2 || h.plane === 3)) target = h.plane === 2 ? "cb" : "cr"; else if (!h) target = !p.cbDone ? "cb" : !p.crDone ? "cr" : null; }
  }
  const pic = mkPic(kind, M.n, target); pic.stamp = h ? h.stamp : null; pic.plane = h ? h.plane : null; deck.cur = pic;
  if (target) { deck.showP = deck.pend; plog("chroma plane " + target + " follows the grey picture"); }
  else { deck.showP = null; clearOut(M.n); }
  setProg(0); wheelState.rx = performance.now();
}
function finishCur() {
  const pic = deck.cur; if (!pic) return; deck.cur = null; if (pic.count === 0) return;
  repair(pic.have, pic.data, pic.n, pic.n);
  if (pic.target) {
    const p = deck.pend, arr = pic.target === "cb" ? p.cb : p.cr; arr.set(pic.data.subarray(0, 4096)); p[pic.target + "Done"] = true; recompose(p);
    const full = p.cbDone && p.crDone; say($("recvStatus"), full ? "Colour complete. River upgrade received." : "Colour plane " + pic.target + " received. Waiting for the next...");
    if (full) emitPicture(p.canvas, p.stamp, "colour"); return;
  }
  const item = shelve(pic); deck.last = pic; deck.glyphLive = [];
  if (pic.kind === "Y" && pic.plane !== 0) {
    deck.pend = { n: pic.n, y: pic.data, cb: new Uint8Array(4096).fill(128), cr: new Uint8Array(4096).fill(128), cbDone: false, crDone: false, canvas: item.canvas, stamp: pic.stamp, im: null };
    deck.showP = deck.pend;
  } else { deck.pend = null; deck.showP = null; }
  if (deck.view === "eye") { sizeOut(pic.n); outX.drawImage(item.canvas, 0, 0); } else if (deck.view === "glyph") drawGlyphEye(glyphGrid(pic.data, pic.n));
  say($("recvStatus"), "Picture received: " + pic.count + " lines" + (pic.stamp != null ? ". Stamped " + stampText(pic.stamp) : "") + ".");
  emitPicture(item.canvas, pic.stamp, pic.plane === 1 ? "grey" : "mono");
}
function emitPicture(canvas, stamp, kind) {
  const detail = { canvas, stamp, kind, text: stampText(stamp) };
  bus.dispatchEvent(new CustomEvent("picture", { detail })); window.dispatchEvent(new CustomEvent("dragonet:picture", { detail }));
  try { bc && bc.postMessage({ type: "picture", kind, stamp, w: canvas.width, h: canvas.height, png: canvas.toDataURL("image/png") }); } catch (e) {}
}
const rxCallbacks = {
  onLeader() { deck.hdr = null; plog("leader tone"); say($("recvStatus"), "Signal found. Reading the header..."); wheelState.rx = performance.now(); },
  onHeader(h) { deck.hdr = h; plog("header plane " + h.plane + " stamp " + (h.stamp == null ? "none" : h.stamp)); say($("recvStatus"), "Header read" + (h.stamp != null ? ": " + stampText(h.stamp) : "") + ". Waiting for the first line..."); },
  onLog(t) { plog(t); },
  onNew() { finishCur(); },
  onMode(m, h) { plog("locked on " + m); if (h) deck.hdr = h; startPic(m); },
  onRow(idx, row, M) {
    if (!deck.cur) startPic(M.name);
    const pic = deck.cur; if (idx >= pic.n) return;
    pic.data.set(row.subarray(0, pic.n), idx * pic.n); if (!pic.have[idx]) { pic.have[idx] = 1; pic.count++; }
    wheelState.rx = performance.now();
    if (pic.target) { const p = deck.pend, arr = pic.target === "cb" ? p.cb : p.cr; arr.set(row.subarray(0, 64), idx * 64); if (pic.count % 4 === 0) recompose(p); }
    else paintGreyRow(pic, idx);
    setProg(pic.count / pic.n);
    say($("recvStatus"), (pic.target ? "Colour " + pic.target + ": " : "Downloading: ") + "line " + pic.count + " of " + pic.n);
    if (MU.on && pic.kind === "Y" && !pic.target) { const per = pic.n / 16; if ((idx + 1) % per === 0) { const ty = (idx + 1) / per - 1, cells = []; for (let tx = 0; tx < 16; tx++) cells.push(matchTile(pic.data, pic.n, tx, ty)); playRow(cells); } }
    if (pic.count >= pic.n) finishCur();
  }
};
function clearDeck() { deck.cur = null; deck.pend = null; deck.showP = null; deck.hdr = null; clearOut(128); setProg(0); }
