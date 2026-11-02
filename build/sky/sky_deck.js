
/* ============ THE DECK: cards of sky, laid out freely, played by a head or poured by a cup ============
   The Sky above is one Card: it keeps its own glyphs, drawings, pace and key. The Deck underneath
   holds every card. There is no grid and no timeline: a card can sit anywhere, zoom in and out.
   PLAY  a head sweeps left to right across the deck; whatever it passes over sounds. It does not
         stop on its own: a Ringer stops it, holds it, or sends it back to loop a card.
   FLOW  the cup in the top left corner tips and pours into the nearest card; when that card has
         played through, the flow follows its SparkNodes on to the next cards.
   Nothing is thrown away: a card, a ringer or a link that is not wanted is PUT AWAY on the tray
   below the deck and can be brought back. The deck is kept in this browser between visits. */
const CARD_W = 180, CARD_H = 140;
const DK = { cards: [], links: [], ringers: [], tray: [], cur: 0, nid: 1, view: { x: -40, y: -60, z: 1 }, head: 0, play: false, flow: null, sel: null, drag: null, arm: null, ver: 0, last: 0, lastCol: new Map(), rc: new Map(), hold: null, thumbs: new Map(), dirty: false, savedAt: 0 };
const dkCv = $("dkc"), dkX = dkCv.getContext("2d");
const cardDur = c => ST_CW * 15000 / (c.bpm || 120) / 1000;           /* seconds for one sweep of a card at its own pace */
function dkNew(x, y, from) { return { id: "C" + (DK.nid++), name: "CARD " + (DK.nid - 1), x, y, bpm: from ? from.bpm : 120, key: from ? from.key : 220, items: from ? JSON.parse(JSON.stringify(from.items)) : [], layers: from ? JSON.parse(JSON.stringify(from.layers)) : drSer([{ id: "GLYPHS", glyphs: true, name: "GLYPHS", vis: true }, drLayer("INK 1", "foam", 2)]) }; }
function dkCur() { return DK.cards[DK.cur]; }
/* the Sky is the card that is open: keep the card up to date with it */
function dkStore() { const c = dkCur(); if (!c) return; c.items = JSON.parse(JSON.stringify(ST.items)); c.layers = drSer(); c.bpm = stBpm; c.key = DR.key; DK.thumbs.delete(c.id); }
function dkOpen(i) {
  if (i === DK.cur && DK.cards[i]) return; dkStore(); DK.cur = i; const c = dkCur();
  ST.items = JSON.parse(JSON.stringify(c.items)); ST.sel = new Set(); ST.hist = []; DR.layers = drDeser(c.layers); DR.act = Math.min(DR.act, DR.layers.length - 1); DR.hist = []; DR.key = c.key || 220;
  stBpm = c.bpm || 120; stColMs = 15000 / stBpm; $("stTempo").value = stBpm; $("stBpm").textContent = stBpm + " BPM";
  DR.cache.clear(); DR.ver++; stSync(); drPanel(); dkSave(); stSay(c.name + " is open in the sky");
}
function dkDirty() { DK.dirty = true; }
function dkSave() { try { localStorage.setItem("olympass.deck.v1", JSON.stringify({ cards: DK.cards, links: DK.links, ringers: DK.ringers, tray: DK.tray, cur: DK.cur, nid: DK.nid, view: DK.view })); DK.savedAt = performance.now(); } catch (e) {} }
function dkLoad() {
  let o = null; try { o = JSON.parse(localStorage.getItem("olympass.deck.v1") || "null"); } catch (e) {}
  if (o && o.cards && o.cards.length) { Object.assign(DK, { cards: o.cards, links: o.links || [], ringers: o.ringers || [], tray: o.tray || [], nid: o.nid || o.cards.length + 1, view: o.view || DK.view }); DK.cur = -1; dkOpen(Math.min(o.cur || 0, DK.cards.length - 1)); }
  else { DK.cards = [dkNew(0, 0)]; DK.cur = 0; dkStore(); }
}
/* ---- view ---- */
function dkSize() { const r = dkCv.parentElement.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2); if (!r.width) return; dkCv.width = Math.round(r.width * d); dkCv.height = Math.round(r.height * d); dkCv.style.width = r.width + "px"; dkCv.style.height = r.height + "px"; DK.d = d; DK.w = r.width; DK.h = r.height; }
const dkW2S = (x, y) => [(x - DK.view.x) * DK.view.z, (y - DK.view.y) * DK.view.z];
const dkS2W = (x, y) => [x / DK.view.z + DK.view.x, y / DK.view.z + DK.view.y];
function dkThumb(c) {
  let t = DK.thumbs.get(c.id); if (t) return t;
  t = document.createElement("canvas"); t.width = ST_CW * ST_U; t.height = ST_CH * ST_U;
  const keepI = ST.items, keepL = DR.layers, keepT = DR.tab, keepS = ST.sel; if (c !== dkCur()) { ST.items = c.items; DR.layers = drDeser(c.layers); }
  DR.tab = "sky"; ST.sel = new Set(); try { stPaint(t.getContext("2d"), 1, false); } catch (e) {} ST.items = keepI; DR.layers = keepL; DR.tab = keepT; ST.sel = keepS;
  DK.thumbs.set(c.id, t); return t;
}
function dkContent() { const xs = DK.cards.map(c => c.x).concat(DK.ringers.map(r => r.x)), xe = DK.cards.map(c => c.x + CARD_W).concat(DK.ringers.map(r => r.x)); return [Math.min(0, ...xs) - 40, Math.max(CARD_W, ...xe, DK.head) + 80]; }
function dkNode(c, side) { return [c.x + (side > 0 ? CARD_W : 0), c.y + CARD_H / 2]; }
function dkLinkPath(x, a, b) { const [x0, y0] = dkW2S(...a), [x1, y1] = dkW2S(...b), m = Math.max(40, Math.abs(x1 - x0) * .5); x.moveTo(x0, y0); x.bezierCurveTo(x0 + m, y0, x1 - m, y1, x1, y1); return [x0, y0, x1, y1, m]; }
function bez(p0, p1, p2, p3, t) { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; }
function dkPaint(now) {
  const x = dkX, d = DK.d || 1, z = DK.view.z; x.setTransform(d, 0, 0, d, 0, 0); x.fillStyle = "#05070c"; x.fillRect(0, 0, DK.w, DK.h);
  for (let i = 0; i < 70; i++) { const sx = ((hash2(i, 31) * 3000 - DK.view.x * .3) % DK.w + DK.w) % DK.w, sy = ((hash2(i, 32) * 2000 - DK.view.y * .3) % DK.h + DK.h) % DK.h; x.fillStyle = "rgba(207,224,255," + (.12 + .3 * hash2(i, 33)).toFixed(2) + ")"; x.fillRect(sx, sy, 1, 1); }
  /* ringer lines: a ringer acts on the head wherever the head crosses its line */
  DK.ringers.forEach(r => { const [sx] = dkW2S(r.x, 0); x.strokeStyle = "rgba(255,211,107,.18)"; x.setLineDash([3, 5]); x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx, DK.h); x.stroke(); x.setLineDash([]); });
  /* spark links */
  DK.links.forEach(l => {
    const a = DK.cards.find(c => c.id === l.from), b = DK.cards.find(c => c.id === l.to); if (!a || !b) return; const on = DK.sel && DK.sel.link === l;
    x.strokeStyle = on ? "rgba(255,211,107,.95)" : "rgba(47,168,255,.55)"; x.lineWidth = on ? 2 : 1.4; x.beginPath(); dkLinkPath(x, dkNode(a, 1), dkNode(b, -1)); x.stroke();
  });
  if (DK.drag && DK.drag.type === "link") { x.strokeStyle = "rgba(255,211,107,.8)"; x.setLineDash([4, 4]); x.beginPath(); dkLinkPath(x, dkNode(DK.drag.card, 1), dkS2W(DK.drag.mx, DK.drag.my)); x.stroke(); x.setLineDash([]); }
  /* cards */
  DK.cards.forEach((c, i) => {
    const [sx, sy] = dkW2S(c.x, c.y), w = CARD_W * z, h = CARD_H * z; if (sx > DK.w || sy > DK.h || sx + w < 0 || sy + h < 0) return;
    x.save(); x.globalAlpha = .92; x.imageSmoothingEnabled = z < 1; x.drawImage(dkThumb(c), sx, sy, w, h); x.restore();
    const fl = DK.flow && DK.flow.fill.get(c.id); if (fl !== undefined) { x.fillStyle = "rgba(47,168,255,.22)"; x.fillRect(sx, sy + h * (1 - fl), w, h * fl); x.fillStyle = "rgba(160,220,255,.7)"; x.fillRect(sx, sy + h * (1 - fl), w, Math.max(1, z)); }
    const cur = i === DK.cur, sel = DK.sel && DK.sel.card === c;
    x.strokeStyle = cur ? "#ffd36b" : sel ? "#2fa8ff" : "rgba(126,144,180,.55)"; x.lineWidth = cur || sel ? 2 : 1; x.strokeRect(sx + .5, sy + .5, w - 1, h - 1);
    x.fillStyle = cur ? "#ffd36b" : "#7e90b4"; x.font = "600 " + Math.max(8, Math.round(9 * Math.min(1.4, z))) + "px ui-monospace, monospace"; x.textAlign = "left"; x.fillText(c.name + " · " + c.bpm + " BPM", sx + 3, sy - 4);
    [[-1, "#2fa8ff"], [1, "#ffd36b"]].forEach(([s, col]) => { const [nx, ny] = dkW2S(...dkNode(c, s)); x.fillStyle = col; x.beginPath(); x.moveTo(nx, ny - 5); x.lineTo(nx + 5, ny); x.lineTo(nx, ny + 5); x.lineTo(nx - 5, ny); x.closePath(); x.fill(); });
  });
  /* ringers */
  DK.ringers.forEach(r => { const [sx, sy] = dkW2S(r.x, r.y), on = DK.sel && DK.sel.ringer === r; dkBell(x, sx, sy, on); x.fillStyle = on ? "#ffd36b" : "#cfc6b1"; x.font = "600 9px ui-monospace, monospace"; x.textAlign = "center"; x.fillText(r.mode === "loop" ? "LOOP ×" + r.n : r.mode.toUpperCase(), sx, sy + 20); });
  /* sparks travelling along links during a flow */
  if (DK.flow) DK.flow.sparks.forEach(s => {
    const a = DK.cards.find(c => c.id === s.from), b = DK.cards.find(c => c.id === s.to); if (!a || !b) return; const t = Math.min(1, (now - s.t0) / 700);
    const [x0, y0] = dkW2S(...dkNode(a, 1)), [x1, y1] = dkW2S(...dkNode(b, -1)), m = Math.max(40, Math.abs(x1 - x0) * .5);
    const px = bez(x0, x0 + m, x1 - m, x1, t), py = bez(y0, y0, y1, y1, t); x.fillStyle = "#c8f0ff"; x.beginPath(); x.arc(px, py, 3.2, 0, TAU); x.fill(); x.fillStyle = "rgba(200,240,255,.25)"; x.beginPath(); x.arc(px, py, 8, 0, TAU); x.fill();
  });
  /* the pour from the cup */
  if (DK.flow && DK.flow.pour) { const c = DK.flow.pour, [tx, ty] = dkW2S(c.x + 10, c.y + 6), t = (now - DK.flow.t0) / 1000; x.strokeStyle = "rgba(120,200,255,.75)"; x.lineWidth = 2.4; x.beginPath(); x.moveTo(44, 40); x.quadraticCurveTo(44 + (tx - 44) * .2, ty * .2 + 40, tx, ty); x.stroke(); for (let i = 0; i < 6; i++) { const f = ((t * 1.4 + i / 6) % 1); x.fillStyle = "rgba(200,240,255,.8)"; x.fillRect(44 + (tx - 44) * f - 1, 40 + (ty - 40) * f * f - 1, 2, 2); } }
  /* the head */
  if (DK.play || DK.head > 0) { const [hx] = dkW2S(DK.head, 0); x.fillStyle = "rgba(120,200,255,.18)"; x.fillRect(hx - 6, 0, 12, DK.h); x.fillStyle = "rgba(160,220,255,.95)"; x.fillRect(hx - .5, 0, 1.5, DK.h); }
}
function dkBell(x, cx, cy, on) {
  x.save(); x.translate(Math.round(cx), Math.round(cy)); const c = on ? "#ffd36b" : "#e6c56a";
  x.fillStyle = c; x.beginPath(); x.moveTo(-7, 6); x.quadraticCurveTo(-7, -7, 0, -8); x.quadraticCurveTo(7, -7, 7, 6); x.closePath(); x.fill(); x.fillRect(-9, 6, 18, 2); x.fillStyle = "#7a5a1a"; x.fillRect(-1, 8, 2, 3); x.restore();
}
/* ---- sounding a card's column ---- */
function dkSoundCol(c, col, vol) {
  const live = c === dkCur(), items = live ? ST.items : c.items, layers = live ? DR.layers : drDeser(c.layers);
  if (live) { stHead = col; }
  items.forEach(it => { if (it.k !== "f" && it.x === col) { if (live) skyHit(it, vol); else playGlyph(it.g, { x: (col + .5) / ST_CW, vol }); } });
  drSoundLayers(layers, col, vol, c.key);
}
/* ---- PLAY ---- */
function dkPlay() {
  if (DK.flow) dkFlowStop();
  if (DK.play) { DK.play = false; dkBar(); stHead = -1; return; }
  dkStore(); wake(); DK.play = true; DK.lastCol.clear(); DK.rc.clear(); DK.hold = null; DK.last = 0;
  if (DK.head >= dkContent()[1] - 60) DK.head = dkContent()[0] + 20;
  dkBar();
}
function dkInside(xh) { return DK.cards.filter(c => xh >= c.x && xh < c.x + CARD_W).sort((a, b) => a.y - b.y); }
function dkPrevCard(rx) { let best = null; DK.cards.forEach(c => { if (c.x < rx && (!best || c.x > best.x)) best = c; }); return best; }
function dkStep(now) {
  const dt = DK.last ? Math.min(.05, (now - DK.last) / 1000) : 0; DK.last = now;
  if (DK.hold) {                                                    /* a ringer holds the head while the card before it plays through */
    const h = DK.hold, c = h.card, col = Math.floor((now - h.t0) / 1000 / cardDur(c) * ST_CW);
    if (col >= ST_CW) { DK.hold = null; return; }
    if (col !== h.col) { h.col = col; dkSoundCol(c, col, .6); } return;
  }
  const inn = dkInside(DK.head), v = inn.length ? CARD_W / cardDur(inn[0]) : CARD_W / cardDur({ bpm: 120 }), prev = DK.head; DK.head += v * dt;
  inn.forEach(c => { const col = Math.floor((DK.head - c.x) / CARD_W * ST_CW); if (col >= 0 && col < ST_CW && DK.lastCol.get(c.id) !== col) { DK.lastCol.set(c.id, col); dkSoundCol(c, col, .62); } });
  DK.cards.forEach(c => { if (DK.head < c.x || DK.head >= c.x + CARD_W) DK.lastCol.delete(c.id); });
  DK.ringers.slice().sort((a, b) => a.x - b.x).forEach(r => {
    if (!(prev < r.x && DK.head >= r.x) || !DK.play) return;
    const pc = dkPrevCard(r.x);
    if (r.mode === "stop") { DK.head = r.x; DK.play = false; stHead = -1; dkBar(); stSay("a ringer stopped the head"); }
    else if (r.mode === "loop") { const n = DK.rc.get(r.id) || 0; if (pc && n < r.n) { DK.rc.set(r.id, n + 1); DK.head = pc.x; DK.lastCol.delete(pc.id); stSay("ringer · loop " + (n + 1) + " of " + r.n); } }
    else if (r.mode === "hold" && pc) { DK.head = r.x; DK.hold = { card: pc, t0: now, col: -1 }; stSay("ringer · holding while " + pc.name + " plays through"); }
  });
  /* the view keeps the head in sight unless someone is moving it */
  const [hx] = dkW2S(DK.head, 0); if (!DK.drag && (hx > DK.w * .85 || hx < 0)) DK.view.x = DK.head - DK.w * .2 / DK.view.z;
}
/* ---- FLOW ---- */
function dkFlow() {
  if (DK.flow) { dkFlowStop(); return; }
  if (DK.play) { DK.play = false; stHead = -1; }
  dkStore(); wake(); const [wx, wy] = dkS2W(44, 40); let best = null, bd = 1e18;
  DK.cards.forEach(c => { const d = Math.hypot(c.x + CARD_W / 2 - wx, c.y + CARD_H / 2 - wy); if (d < bd) { bd = d; best = c; } });
  if (!best) return; $("dkCup").classList.add("pour");
  DK.flow = { t0: performance.now(), pour: best, run: [], sparks: [], fill: new Map(), poured: 0 };
  setTimeout(() => { if (DK.flow) { DK.flow.pour = null; dkFlowInto(best); } }, 900); dkBar(); stSay("the cup tips into " + best.name);
}
function dkFlowInto(c) { if (!DK.flow || DK.flow.run.length > 8) return; DK.flow.run.push({ card: c, t0: performance.now(), col: -1 }); DK.flow.poured++; }
function dkFlowStep(now) {
  const F = DK.flow; if (!F) return;
  F.run = F.run.filter(r => {
    const f = (now - r.t0) / 1000 / cardDur(r.card), col = Math.floor(f * ST_CW); F.fill.set(r.card.id, Math.min(1, f));
    if (col !== r.col && col < ST_CW) { r.col = col; dkSoundCol(r.card, col, .6); }
    if (f >= 1) { F.fill.delete(r.card.id); DK.links.filter(l => l.from === r.card.id).forEach(l => F.sparks.push({ from: l.from, to: l.to, t0: now })); return false; }
    return true;
  });
  F.sparks = F.sparks.filter(s => { if (now - s.t0 >= 700) { const c = DK.cards.find(k => k.id === s.to); if (c) dkFlowInto(c); return false; } return true; });
  if (!F.pour && !F.run.length && !F.sparks.length) dkFlowStop(true);
}
function dkFlowStop(done) { DK.flow = null; $("dkCup").classList.remove("pour"); stHead = -1; dkBar(); if (done) stSay("the flow has run its course"); }
/* ---- the bar and the tray ---- */
function dkBar() {
  const p = $("dkPlay"), f = $("dkFlow"); p.textContent = DK.play ? "STOP" : "PLAY"; p.classList.toggle("on", DK.play); f.textContent = DK.flow ? "STILL" : "FLOW"; f.classList.toggle("on", !!DK.flow);
  const [a, b] = dkContent(), sc = $("dkScrub"); sc.min = Math.floor(a); sc.max = Math.ceil(b); if (!DK.scrubbing) sc.value = Math.round(DK.head);
  $("dkArm").classList.toggle("on", !!DK.arm); $("dkAway").disabled = !DK.sel || (DK.sel.card && DK.cards.length < 2);
  const tr = $("dkTray"); tr.innerHTML = ""; tr.hidden = !DK.tray.length;
  DK.tray.forEach((o, i) => { const b = document.createElement("button"); b.type = "button"; b.textContent = o.t === "card" ? o.v.name : o.t === "ringer" ? "RINGER " + (o.v.mode === "loop" ? "LOOP ×" + o.v.n : o.v.mode.toUpperCase()) : "LINK"; b.title = "Bring it back"; b.addEventListener("click", () => dkBack(i)); tr.appendChild(b); });
}
function dkAway() {
  const s = DK.sel; if (!s) return; dkStore();
  if (s.card) { if (DK.cards.length < 2) return; const i = DK.cards.indexOf(s.card); DK.tray.push({ t: "card", v: s.card, links: DK.links.filter(l => l.from === s.card.id || l.to === s.card.id) }); DK.links = DK.links.filter(l => l.from !== s.card.id && l.to !== s.card.id); DK.cards.splice(i, 1); if (DK.cur >= DK.cards.length || i === DK.cur) { DK.cur = -1; dkOpen(0); } else if (i < DK.cur) DK.cur--; }
  else if (s.ringer) { DK.tray.push({ t: "ringer", v: s.ringer }); DK.ringers.splice(DK.ringers.indexOf(s.ringer), 1); }
  else if (s.link) { DK.tray.push({ t: "link", v: s.link }); DK.links.splice(DK.links.indexOf(s.link), 1); }
  DK.sel = null; dkSave(); dkBar(); stSay("put away on the tray · nothing is lost");
}
function dkBack(i) {
  const o = DK.tray.splice(i, 1)[0]; if (!o) return; const [cx, cy] = dkS2W(DK.w / 2, DK.h / 2);
  if (o.t === "card") { o.v.x = cx - CARD_W / 2; o.v.y = cy - CARD_H / 2; DK.cards.push(o.v); (o.links || []).forEach(l => { if (DK.cards.some(c => c.id === l.from) && DK.cards.some(c => c.id === l.to)) DK.links.push(l); }); }
  else if (o.t === "ringer") { o.v.x = cx; o.v.y = cy; DK.ringers.push(o.v); }
  else if (DK.cards.some(c => c.id === o.v.from) && DK.cards.some(c => c.id === o.v.to)) DK.links.push(o.v); else DK.tray.splice(i, 0, o);
  dkSave(); dkBar();
}
/* ---- pointer on the deck ---- */
function dkHit(sx, sy) {
  const [wx, wy] = dkS2W(sx, sy), z = DK.view.z;
  for (const r of DK.ringers) { const [rx, ry] = dkW2S(r.x, r.y); if (Math.abs(sx - rx) < 11 && sy > ry - 11 && sy < ry + 24) return { ringer: r }; }
  for (let i = DK.cards.length - 1; i >= 0; i--) { const c = DK.cards[i], [nx, ny] = dkW2S(...dkNode(c, 1)); if (Math.hypot(sx - nx, sy - ny) < 9) return { node: c }; }
  for (let i = DK.cards.length - 1; i >= 0; i--) { const c = DK.cards[i]; if (wx >= c.x && wx <= c.x + CARD_W && wy >= c.y && wy <= c.y + CARD_H) return { card: c }; }
  for (const l of DK.links) { const a = DK.cards.find(c => c.id === l.from), b = DK.cards.find(c => c.id === l.to); if (!a || !b) continue; const [x0, y0] = dkW2S(...dkNode(a, 1)), [x1, y1] = dkW2S(...dkNode(b, -1)), m = Math.max(40, Math.abs(x1 - x0) * .5); for (let t = 0; t <= 1; t += .04) { if (Math.hypot(bez(x0, x0 + m, x1 - m, x1, t) - sx, bez(y0, y0, y1, y1, t) - sy) < 6) return { link: l }; } }
  return null;
}
function dkPos(e) { const r = dkCv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function dkInit() {
  dkLoad();
  dkCv.addEventListener("pointerdown", e => {
    const [sx, sy] = dkPos(e), h = dkHit(sx, sy); try { dkCv.setPointerCapture(e.pointerId); } catch (er) {}
    if (DK.arm) { const [wx, wy] = dkS2W(sx, sy); DK.ringers.push({ id: "R" + (DK.nid++), x: wx, y: wy, mode: DK.arm.mode, n: DK.arm.n }); DK.arm = null; dkSave(); dkBar(); stSay("ringer placed"); return; }
    if (h && h.node) { DK.drag = { type: "link", card: h.node, mx: sx, my: sy }; return; }
    if (h && h.card) { DK.sel = { card: h.card }; DK.drag = { type: "card", card: h.card, sx, sy, ox: h.card.x, oy: h.card.y, moved: false }; dkBar(); return; }
    if (h && h.ringer) { DK.sel = { ringer: h.ringer }; DK.drag = { type: "ringer", r: h.ringer, sx, sy, ox: h.ringer.x, oy: h.ringer.y }; dkBar(); return; }
    if (h && h.link) { DK.sel = { link: h.link }; dkBar(); return; }
    DK.sel = null; DK.drag = { type: "pan", sx, sy, vx: DK.view.x, vy: DK.view.y }; dkBar();
  });
  dkCv.addEventListener("pointermove", e => {
    const g = DK.drag; if (!g) return; const [sx, sy] = dkPos(e), z = DK.view.z;
    if (g.type === "pan") { DK.view.x = g.vx - (sx - g.sx) / z; DK.view.y = g.vy - (sy - g.sy) / z; }
    else if (g.type === "card") { if (Math.hypot(sx - g.sx, sy - g.sy) > 4) g.moved = true; g.card.x = g.ox + (sx - g.sx) / z; g.card.y = g.oy + (sy - g.sy) / z; }
    else if (g.type === "ringer") { g.r.x = g.ox + (sx - g.sx) / z; g.r.y = g.oy + (sy - g.sy) / z; }
    else if (g.type === "link") { g.mx = sx; g.my = sy; }
  });
  const end = e => {
    const g = DK.drag; DK.drag = null; if (!g) return; const [sx, sy] = dkPos(e);
    if (g.type === "link") { const h = dkHit(sx, sy), t = h && (h.card || h.node); if (t && t !== g.card && !DK.links.some(l => l.from === g.card.id && l.to === t.id)) { DK.links.push({ from: g.card.id, to: t.id }); stSay("SparkNode · " + g.card.name + " → " + t.name); } }
    if (g.type === "card" && !g.moved) dkOpen(DK.cards.indexOf(g.card));
    dkSave(); dkBar();
  };
  dkCv.addEventListener("pointerup", end); dkCv.addEventListener("pointercancel", end);
  dkCv.addEventListener("wheel", e => { e.preventDefault(); const [sx, sy] = dkPos(e); dkZoom(Math.exp(-e.deltaY * .0015), sx, sy); }, { passive: false });
  $("dkPlay").addEventListener("click", dkPlay); $("dkFlow").addEventListener("click", dkFlow); $("dkCup").addEventListener("click", dkFlow);
  $("dkZin").addEventListener("click", () => dkZoom(1.25, DK.w / 2, DK.h / 2)); $("dkZout").addEventListener("click", () => dkZoom(.8, DK.w / 2, DK.h / 2));
  $("dkAdd").addEventListener("click", () => { dkStore(); const mx = Math.max(...DK.cards.map(c => c.x)), c0 = DK.cards.find(c => c.x === mx); DK.cards.push(dkNew(mx + CARD_W + 40, c0 ? c0.y : 0)); dkOpen(DK.cards.length - 1); dkBar(); });
  $("dkCopy").addEventListener("click", () => { dkStore(); const c = dkCur(); DK.cards.push(dkNew(c.x + 24, c.y + CARD_H + 30, c)); DK.cards[DK.cards.length - 1].name = c.name + " ·"; dkOpen(DK.cards.length - 1); dkBar(); });
  $("dkArm").addEventListener("click", () => { DK.arm = DK.arm ? null : { mode: $("dkMode").value, n: Math.max(1, Math.min(64, +$("dkN").value || 2)) }; dkBar(); stSay(DK.arm ? "click on the deck to place the ringer" : ""); });
  $("dkMode").addEventListener("change", () => { $("dkN").hidden = $("dkMode").value !== "loop"; if (DK.arm) DK.arm.mode = $("dkMode").value; });
  $("dkAway").addEventListener("click", dkAway);
  const sc = $("dkScrub"); sc.addEventListener("input", () => { DK.scrubbing = true; DK.head = +sc.value; DK.lastCol.clear(); const [hx] = dkW2S(DK.head, 0); if (hx < 0 || hx > DK.w) DK.view.x = DK.head - DK.w * .3 / DK.view.z; }); sc.addEventListener("change", () => { DK.scrubbing = false; });
  new ResizeObserver(dkSize).observe(dkCv.parentElement); dkSize(); dkBar();
  requestAnimationFrame(function deckLoop(now) {
    requestAnimationFrame(deckLoop); if (curRoom !== "studio") { DK.last = 0; return; }
    if (DK.play) dkStep(now); else DK.last = 0; if (DK.flow) dkFlowStep(now);
    if (now - DK.savedAt > 1500) { const sig = JSON.stringify(ST.items) + "|" + DR.ver + "|" + stBpm; if (sig !== DK.sig) { DK.sig = sig; dkStore(); dkSave(); } else DK.savedAt = now; }
    if (DK.play) { const sc2 = $("dkScrub"); if (!DK.scrubbing) { const [a, b] = dkContent(); sc2.min = Math.floor(a); sc2.max = Math.ceil(b); sc2.value = Math.round(DK.head); } }
    dkPaint(now);
  });
}
function dkZoom(f, sx, sy) { const [wx, wy] = dkS2W(sx, sy); DK.view.z = clamp(DK.view.z * f, .25, 3); DK.view.x = wx - sx / DK.view.z; DK.view.y = wy - sy / DK.view.z; dkDirty(); }
