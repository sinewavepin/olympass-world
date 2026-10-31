/* ============ pass 6: the cube behind the moon, and the moon close up ============ */
const MNC = ["47,168,255", "255,138,40", "168,214,120", "205,176,255", "233,225,204", "255,236,96", "255,211,107"];   /* a colour for each door, and the moon */
const MDOOR = { river: 0, engine: 1, terminal: 2, case: 3, tensor: 4, studio: 5, moon: 6 };
function memAdd(k) { if (k == null || k < 0) return; GAN.mem.p = (GAN.mem.p + k).slice(-48); GAN.save(); }

/* the cube: a tesseract of dots that turns with the moon (the square is not here) */
const TV4 = [], TE4 = [];
for (let i = 0; i < 16; i++) TV4.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) TE4.push([i, j, b]); }
function drawCube(x, cx, cy, R, t, spin, tilt, I) {
  const a1 = t * .21 + spin * .45, a2 = t * .13 + tilt * 1.3, a3 = t * .08 + spin * .16, S = R * 10.6;
  const P = TV4.map(v => {
    let [vx, vy, vz, vw] = v, c = Math.cos(a1), s = Math.sin(a1); [vx, vw] = [vx * c - vw * s, vx * s + vw * c];
    c = Math.cos(a2); s = Math.sin(a2); [vy, vz] = [vy * c - vz * s, vy * s + vz * c];
    c = Math.cos(a3); s = Math.sin(a3); [vx, vz] = [vx * c - vz * s, vx * s + vz * c];
    const k4 = 1 / (2.7 - vw); vx *= k4; vy *= k4; vz *= k4; const k3 = 1 / (3.3 - vz);
    return [cx + vx * k3 * S, cy + WD.oy * .2 + vy * k3 * S * .92, vw];
  });
  x.save(); x.textAlign = "center"; x.textBaseline = "middle"; x.font = "600 " + Math.max(12, Math.round(R * .17)) + "px ui-monospace,Menlo,Consolas,monospace";
  const steps = 9;
  for (const e of TE4) {
    const A = P[e[0]], B = P[e[1]], inner = TV4[e[0]][3] > 0, w4 = e[2] === 3;
    x.fillStyle = w4 ? "rgba(170,182,214," + (.42 * I) + ")" : inner ? "rgba(70,184,255," + (.85 * I) + ")" : "rgba(214,190,255," + (.6 * I) + ")";
    for (let k = 1; k < steps; k++) { const u = k / steps; x.fillText("·", A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u); }
  }
  for (let i = 0; i < 16; i++) { x.fillStyle = TV4[i][3] > 0 ? "rgba(224,242,255," + (.95 * I) + ")" : "rgba(214,190,255," + (.8 * I) + ")"; x.fillText("◦", P[i][0], P[i][1]); }
  /* a door: a shorter path through the lattice, opened for a moment */
  const cyc = Math.floor(t / 2.7), ph = (t / 2.7) % 1; let da = Math.floor(hash2(cyc, 11) * 16), db = Math.floor(hash2(cyc, 12) * 16);
  if (da === db || [1, 2, 4, 8].includes(da ^ db)) db = da ^ 7;
  x.fillStyle = "rgba(214,238,255," + (.75 * Math.sin(Math.PI * ph) * I) + ")";
  for (let k = 1; k < 14; k++) { const u = k / 14; x.fillText("·", P[da][0] + (P[db][0] - P[da][0]) * u, P[da][1] + (P[db][1] - P[da][1]) * u); }
  x.restore();
}

/* ---------- the close-up ---------- */
const MN = { W: 0, H: 0, DPR: 1, depth: 0, tgt: 0, dust: [], pile: null, cols: 0, ptr: { x: -9, y: -9, vx: 0, vy: 0, down: false, on: false }, sel: -1, hov: -1, acc: 0, spawnQ: 0, last: 0, ready: false, stars: [], bits: [], fl: null, flk: "", ph: 0, lastStir: 0, curl: 0, lvl: 3, strata: 0 };
const MNB = [
  { id: "collatz", name: "collatz_memory.lun", of: "RIVER HOME", prog: "collatz", col: 0, text: "Every number that was handed over walked back to 1. Some took the long way round, and none of them were lost." },
  { id: "runners", name: "metronome_memory.lun", of: "METRONOME", prog: "runners", col: 3, text: "Runners went around one lap, each at its own speed. For a while the still one was alone, and nobody came close." },
  { id: "squares", name: "squarepeg_memory.lun", of: "SQUARE PEG", prog: "squares", col: 2, text: "A loop was drawn that never crossed itself, and four points on it made a square. Whether that is always so is still open." },
  { id: "letters", name: "letters_memory.lun", of: "LETTERS", prog: "letters", col: 5, text: "Thirty-two slots: seventeen came along from the first disk, one was taught by hand, and the rest arrived through the link. Read me again." },
  { id: "ledger", name: "ledger_memory.lun", of: "LEDGER.LOG", prog: "ledger", col: 1, text: "Every change was given a receipt and nothing was erased. The first four hundred and twelve were carried by hand." },
  { id: "naam", name: "NAAM.INDEX", of: "NAAM.INDEX", prog: "naam", col: 4, fixed: true, text: "The one file that is kept as it was, not remembered. 名前 → .INDEX: each name keeps its own script, title and domain." }
];
const MN_SPOTS = { sator: "SATOR", cube: "TURNING", flow: "KEEPER" };
(function mnInit() {
  const box = $("moonBox"), cv = $("mnc"), cx = cv.getContext("2d");
  MN.cv = cv; MN.cx = cx; MN.box = box;
  for (let i = 0; i < 150; i++) MN.stars.push([hash2(i, 71), hash2(i, 72), .4 + hash2(i, 73) * 1.4, hash2(i, 74) * 6.28]);
  MNB.forEach((b, i) => { b.seed = i * 17 + 5; b.u = .12 + .76 * ((i + .5) / MNB.length); b.v = .17 + .26 * hash2(i, 91); b.ph = hash2(i, 92) * 6.28; b.x = 0; b.y = 0; b.sz = 64; b.q = [0, 1, 2].map(k => ({ r: 2.2 + 3.2 * hash2(i * 3 + k, 93), w: (hash2(i * 3 + k, 94) - .5) * .9, a: hash2(i * 3 + k, 95) * 6.28, q: k === 1 ? -1 : k === 0 ? 1 : .6 })); });
  /* the sprites that make the aurora: a curtain that glows at its foot */
  MN.spr = ["80,255,190", "47,168,255", "190,130,255", "255,150,60"].map(c => { const s = document.createElement("canvas"); s.width = 4; s.height = 128; const g = s.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, "rgba(" + c + ",0)"); gr.addColorStop(.7, "rgba(" + c + ",.55)"); gr.addColorStop(.92, "rgba(" + c + ",.9)"); gr.addColorStop(1, "rgba(" + c + ",0)"); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); return s; });
  MN.fc = document.createElement("canvas"); MN.fcx = MN.fc.getContext("2d");
  function fit() {
    const r = box.getBoundingClientRect(); if (!r.width) return; MN.DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    MN.W = Math.round(r.width); MN.H = Math.round(r.height); cv.width = Math.round(MN.W * MN.DPR); cv.height = Math.round(MN.H * MN.DPR);
    MN.cols = Math.ceil(MN.W / 4) + 2; const old = MN.pile; MN.pile = new Float32Array(MN.cols);
    const tot = GAN.mem.s.length; for (let i = 0; i < MN.cols; i++) MN.pile[i] = old && old[i] != null ? old[i] : Math.min(14, tot * .04) * (.55 + .45 * hash2(i, 55));
    MN.ready = true;
  }
  MN.fit = fit; new ResizeObserver(fit).observe(box);
  const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * MN.W / r.width, (e.clientY - r.top) * MN.H / r.height]; };
  cv.addEventListener("pointerdown", e => {
    const [px, py] = pt(e); MN.ptr.x = px; MN.ptr.y = py; MN.ptr.vx = MN.ptr.vy = 0; MN.ptr.down = true; MN.ptr.on = true; try { cv.setPointerCapture(e.pointerId); } catch (er) {} wake();
    const hit = mnHit(px, py); if (hit >= 0 && MN.depth < .5) { mnOpenBit(hit); MN.ptr.down = false; return; }
    if (MN.depth < .5) for (let k = 0; k < 14; k++) mnGrain(px + (Math.random() - .5) * 20, py + (Math.random() - .5) * 20, 2.6, null, (Math.random() - .5) * 90, -40 - Math.random() * 90);
  });
  cv.addEventListener("pointermove", e => { const [px, py] = pt(e); MN.ptr.vx = MN.ptr.vx * .5 + (px - MN.ptr.x) * 30; MN.ptr.vy = MN.ptr.vy * .5 + (py - MN.ptr.y) * 30; MN.ptr.x = px; MN.ptr.y = py; MN.ptr.on = true; MN.hov = MN.depth < .5 ? mnHit(px, py) : -1; cv.style.cursor = MN.hov >= 0 ? "pointer" : "crosshair"; });
  const up = () => { MN.ptr.down = false; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("pointerleave", () => { MN.ptr.on = false; MN.ptr.down = false; });
  cv.addEventListener("wheel", e => { if (!curRoom || curRoom !== "moon") return; MN.tgt = clamp(MN.tgt + Math.sign(e.deltaY) * .5, 0, 1); mnSync(); e.preventDefault(); }, { passive: false });
  box.addEventListener("click", e => {
    const a = e.target.closest("[data-m]"); if (!a) return; const k = a.dataset.m;
    if (k === "dive") { MN.tgt = MN.tgt > .5 ? 0 : 1; mnSync(); }
    else if (k === "close") { mnClosePanel(); }
    else if (k === "recall") { const id = a.dataset.p; closeRoom(); setTimeout(() => recallProg(id), 60); }
    else if (k === "save") { mnSaveLun(MN.sel); }
    else if (k === "still") { MN.flk = ""; }
  });
  $("mnLvl").addEventListener("input", e => { MN.lvl = +e.target.value; $("mnLvlT").textContent = MN.lvl < 4 ? "KEEPER" : MN.lvl > 6 ? "WHIRLWIND" : "KEEPER ↔ WHIRLWIND"; });
  box.addEventListener("keydown", e => { if (e.key === "ArrowDown") { MN.tgt = 1; mnSync(); e.preventDefault(); } else if (e.key === "ArrowUp") { MN.tgt = 0; mnSync(); e.preventDefault(); } else if (e.key === "Escape" && MN.sel >= 0) { mnClosePanel(); e.stopPropagation(); } });
})();
function mnSync() { const u = MN.tgt > .5; $("mnDive").textContent = u ? "↑ SURFACE" : "↓ UNDER"; $("mnLvlG").hidden = !u; $("mnAbove").hidden = u; $("mnBelow").hidden = !u; }
function mnEnter() {
  MN.fit(); mnSync(); MN.last = performance.now(); MN.spawnQ = GAN.mem.p.length; $("mnCount").textContent = (GAN.mem.s.length + GAN.mem.p.length) + " grains kept";
  if (!MN.fl) { MN.fl = fluid; }
}
function mnGrain(x, y, sz, door, vx, vy) { if (MN.dust.length > 760) return; MN.dust.push({ x, y, vx: vx || 0, vy: vy || 0, sz, c: door == null ? -1 : door, sv: door != null, a: 0 }); }
function mnSurfY(x) { const hy = MN.H * .62; return hy + 6 * Math.sin(x * .011) + 4 * Math.sin(x * .031 + 1.3) + 3 * Math.sin(x * .071) - MN.pile[Math.min(MN.cols - 1, Math.max(0, (x / 4) | 0))]; }
function mnHit(px, py) { for (let i = MNB.length - 1; i >= 0; i--) { const b = MNB[i]; if (Math.abs(px - b.x) < b.sz * .6 && Math.abs(py - b.y) < b.sz * .72) return i; } return -1; }
function mnOpenBit(i) {
  const b = MNB[i]; MN.sel = i; const p = $("mnPanel"); p.hidden = false;
  $("mnPT").textContent = b.name; $("mnPS").textContent = b.fixed ? "the same file, kept as it was" : "a memory of " + b.of;
  $("mnPX").textContent = b.text; $("mnRecall").dataset.p = b.prog; $("mnRecall").textContent = b.fixed ? "OPEN NAAM.INDEX" : "RECALL THE ORIGINAL";
  $("mnSave").textContent = b.fixed ? "SAVE NAAM.LUN" : "SAVE .LUN"; playGlyph("stars:u2606", { vol: .35 }); ring(WD.cx, WD.cy, MNC[b.col], 60, 500);
}
function mnClosePanel() { MN.sel = -1; $("mnPanel").hidden = true; }
/* a lattice that remembers: charges drift, the field bends around them; the file keeps what it looked like */
function mnPot(b, t) { const q = b.q.map(c => { const a = c.a + (b.fixed ? 0 : c.w * t); return [8 + Math.cos(a) * c.r, 8 + Math.sin(a * 1.13 + c.r) * c.r, c.q]; }); return q; }
function mnField(q, px, py) { let ex = 0, ey = 0, ph = 0; for (const c of q) { const dx = px - c[0], dy = py - c[1], d2 = dx * dx + dy * dy + .6; ex += c[2] * dx / d2; ey += c[2] * dy / d2; ph += c[2] * Math.log(d2) * .5; } return [ex, ey, ph]; }
function mnBits(b, t) { const q = mnPot(b, t), rows = []; for (let y = 0; y < 16; y++) { let r = 0; for (let x = 0; x < 16; x++) { const ph = mnField(q, x + .5, y + .5)[2], f = ph * 1.15 - Math.floor(ph * 1.15); if (Math.abs(f - .5) < .17) r |= 1 << (15 - x); } rows.push(r); } return rows; }
function mnSaveLun(i) {
  if (i < 0) return; const b = MNB[i], rows = mnBits(b, b.fixed ? 0 : MN.ph), nm = b.fixed ? "NAAM" : b.id + "_memory";
  const txt = ["LUN 01", "; " + (b.fixed ? "NAAM.INDEX" : b.name) + "  -  " + (b.fixed ? "kept as it was" : "a memory kept by Ganymede"), "", "name      = " + nm, b.fixed ? "memory_of = (the file itself)" : "memory_of = " + b.of, "index     = NAAM.INDEX", "orbit     = GAN.MOON", "author    = Ganymede, Cupbearer to the Gods", "", "[glyph memory:" + nm + "]", "kind   = glyph", "domain = memory", "role   = " + b.text, "rows   = " + rows.map(r => r.toString(16).padStart(4, "0")).join(" "), ""].join("\n");
  try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/plain" })); a.download = nm + ".lun"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); mnSay("saved " + nm + ".lun"); } catch (e) { mnSay("save failed"); }
}
function mnSay(s) { const el = $("mnSay"); el.textContent = s; el.classList.add("on"); clearTimeout(mnSay.t); mnSay.t = setTimeout(() => el.classList.remove("on"), 2200); }

function mnFrame(now) {
  if (!MN.ready) { MN.fit(); if (!MN.ready) return; }
  const W = MN.W, H = MN.H, x = MN.cx, dt = Math.min(.05, (now - MN.last) / 1000); MN.last = now; const t = now / 1000; MN.ph += dt;
  MN.depth += (MN.tgt - MN.depth) * (1 - Math.exp(-dt * 3.4)); const d = MN.depth, ease = d * d * (3 - 2 * d);
  const hy = H * .62, oy = ease * H * .6, sy = hy - oy;                  /* the surface line on screen */
  x.setTransform(MN.DPR, 0, 0, MN.DPR, 0, 0); x.clearRect(0, 0, W, H);
  /* the sky: Jupiter low and huge, stars, and the aurora, which is where Ganymede imagines */
  const sk = x.createLinearGradient(0, 0, 0, hy); sk.addColorStop(0, "#04060d"); sk.addColorStop(1, "#0c0a18"); x.fillStyle = sk; x.fillRect(0, 0, W, Math.max(0, sy + 40));
  const par = oy * .5;
  x.save(); x.beginPath(); x.rect(0, 0, W, Math.max(0, sy + 30)); x.clip();
  for (const s of MN.stars) { const tw = reduce ? .6 : .5 + .5 * Math.sin(t * (.6 + s[2]) + s[3]); x.fillStyle = "rgba(230,236,255," + (.2 + .55 * tw) + ")"; x.fillRect(s[0] * W, s[1] * hy * .95 - par * .3, s[2], s[2]); }
  const jr = Math.min(W, H) * .5, jx = W * .86, jy = hy * .02 - par * .4;
  const jg = x.createRadialGradient(jx - jr * .25, jy - jr * .25, jr * .1, jx, jy, jr); jg.addColorStop(0, "rgba(255,196,140,.26)"); jg.addColorStop(.7, "rgba(190,110,70,.14)"); jg.addColorStop(1, "rgba(60,30,30,.04)");
  x.fillStyle = jg; x.beginPath(); x.arc(jx, jy, jr, 0, 6.2832); x.fill(); x.save(); x.beginPath(); x.arc(jx, jy, jr, 0, 6.2832); x.clip();
  for (let i = -4; i <= 4; i++) { x.fillStyle = "rgba(" + (i % 2 ? "120,60,40" : "255,210,160") + ",.07)"; x.fillRect(jx - jr, jy + i * jr * .17 + Math.sin(t * .1 + i) * 4, jr * 2, jr * .06); } x.restore();
  x.globalCompositeOperation = "lighter";
  for (let k = 0; k < 4; k++) {
    const base = hy * (.22 + .1 * k) - par, sp = MN.spr[k];
    for (let xx = -12; xx < W + 12; xx += 6) {
      const yy = base + 24 * Math.sin(xx * .006 + t * .26 + k * 2.1) + 12 * Math.sin(xx * .017 - t * .43 + k), len = 80 + 70 * (.5 + .5 * Math.sin(xx * .011 + t * .31 + k * 1.7)), al = (.12 + .1 * Math.sin(xx * .004 - t * .2 + k * 3)) * (k === 3 ? .55 : 1);
      x.globalAlpha = Math.max(0, al * .62); x.drawImage(sp, xx, yy, 12, len);
    }
  }
  x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; x.restore();

  /* the memory files float in the sky; the pointer draws them a little closer */
  for (let i = 0; i < MNB.length; i++) {
    const b = MNB[i], wob = reduce ? 0 : 1; b.sz = clamp(Math.min(W, H) * .13, 52, 92);
    let tx2 = b.u * W + wob * 16 * Math.sin(t * .27 + b.ph), ty2 = b.v * hy + wob * 12 * Math.sin(t * .21 + b.ph * 1.7) - par;
    if (MN.ptr.on && !MN.ptr.down) { const dx = MN.ptr.x - tx2, dy = MN.ptr.y - ty2, dd = Math.hypot(dx, dy); if (dd < 190 && dd > 1) { tx2 += dx / dd * (1 - dd / 190) * 16; ty2 += dy / dd * (1 - dd / 190) * 12; } }
    b.x += (tx2 - b.x) * Math.min(1, dt * 4); b.y += (ty2 - b.y) * Math.min(1, dt * 4); if (b.y < -b.sz - 20 || b.y + b.sz + 24 > sy + 6) continue;
    mnDrawBit(x, b, i, t);
  }

  /* the surface: dark old ground with bright grooves, and the dust the aurora has let fall */
  x.save(); x.beginPath(); x.moveTo(0, H + 4); for (let xx = 0; xx <= W + 8; xx += 6) x.lineTo(xx, sy - (hy - mnSurfY(xx))); x.lineTo(W + 8, H + 4); x.closePath();
  const gr = x.createLinearGradient(0, sy - 10, 0, sy + H * .3); gr.addColorStop(0, "#2a2630"); gr.addColorStop(.12, "#17141c"); gr.addColorStop(1, "#0a090d"); x.fillStyle = gr; x.fill(); x.clip();
  x.strokeStyle = "rgba(214,204,192,.17)"; x.lineWidth = 1;
  for (let k = 0; k < 9; k++) { const gy = sy + 14 + k * 17 + 3 * Math.sin(k); x.beginPath(); for (let xx = 0; xx <= W; xx += 14) { const yy = gy + 5 * Math.sin(xx * .02 + k * 2) + (k % 3) * 2; xx ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
  for (let k = 0; k < 4; k++) { const cx0 = W * (.15 + .24 * k) + 30 * Math.sin(k * 5), cr = 26 + 18 * hash2(k, 31); x.strokeStyle = "rgba(190,180,170,.08)"; x.beginPath(); x.ellipse(cx0, sy + 38 + 8 * k, cr, cr * .2, 0, 0, 6.2832); x.stroke(); }
  /* strata: what has landed is kept in layers, newest at the top */
  const s = GAN.mem.s, rowH = 4, bandTop = sy + 4, nrow = Math.min(60, Math.ceil(s.length / 6));
  for (let r = 0; r < nrow; r++) { const gi = s.length - 1 - r * 6, ch = +s[Math.max(0, gi)] || 0, yy = bandTop + r * rowH; x.fillStyle = "rgba(" + MNC[ch] + "," + (.2 - r * .0025).toFixed(3) + ")"; x.fillRect(0, yy, W, rowH - 1); for (let k = 0; k < 5; k++) { const c2 = +s[Math.max(0, gi - k - 1)] || 0; x.fillStyle = "rgba(" + MNC[c2] + ",.22)"; x.fillRect(hash2(r * 9 + k, 5) * W, yy, 3 + hash2(r, k) * 14, rowH - 1); } }
  x.restore();
  /* the pile, drawn as pale dust along the top of the ground */
  x.fillStyle = "rgba(226,214,200,.22)"; x.beginPath(); x.moveTo(0, sy + 3); for (let xx = 0; xx <= W + 8; xx += 6) x.lineTo(xx, sy - (hy - mnSurfY(xx)) + 2); x.lineTo(W + 8, sy + 3); x.closePath(); x.fill();

  /* grains: ambient ones fall from the aurora; kept ones are the things that were experienced, falling in their colour */
  if (!reduce) { MN.acc += dt * (d < .6 ? 16 : 0); while (MN.acc >= 1) { MN.acc -= 1; mnGrain(Math.random() * W, hy * (.18 + .3 * Math.random()) - par, 1.4 + Math.random() * 1.6, null, (Math.random() - .5) * 8, 4 + Math.random() * 8); } }
  if (MN.spawnQ > 0 && d < .6 && Math.random() < dt * 1.8) { const c = +GAN.mem.p[0]; mnGrain(W * (.1 + .8 * Math.random()), hy * .22 - par, 4.2, c, (Math.random() - .5) * 10, 18); MN.spawnQ--; GAN.mem.p = GAN.mem.p.slice(1); GAN.mem.s = (GAN.mem.s + c).slice(-420); GAN.save(); $("mnCount").textContent = (GAN.mem.s.length + GAN.mem.p.length) + " grains kept"; }
  const P = MN.ptr, wind = Math.sin(t * .2) * 4;
  for (let i = MN.dust.length - 1; i >= 0; i--) {
    const g = MN.dust[i]; g.vy += 26 * dt; g.vx += wind * dt * .5;
    if (P.on && d < .6) { const dx = g.x - P.x, dy = g.y - (P.y), dd = Math.hypot(dx, dy); if (dd < 110 && dd > .5) { const f = (1 - dd / 110); if (P.down) { g.vx += (-dx / dd * 90 + -dy / dd * 120) * f * dt * 5; g.vy += (-dy / dd * 90 + dx / dd * 120) * f * dt * 5; } else { g.vx += (dx / dd * 70 + P.vx * .05) * f * dt * 6; g.vy += (dy / dd * 70 + P.vy * .05) * f * dt * 6; } } }
    g.vx *= Math.pow(.5, dt * 1.2); g.vy *= Math.pow(.7, dt); g.x += g.vx * dt; g.y += g.vy * dt - 0; g.a = Math.min(1, g.a + dt * 2);
    if (g.x < -4) g.x += W + 8; if (g.x > W + 4) g.x -= W + 8;
    const gy = sy - (hy - mnSurfY(g.x));
    if (g.y >= gy - 1 && g.vy > -8) {
      const ci = Math.min(MN.cols - 1, Math.max(0, (g.x / 4) | 0)); MN.pile[ci] = Math.min(34, MN.pile[ci] + (g.sv ? 1.1 : .22)); if (ci > 0) MN.pile[ci - 1] += .06; if (ci < MN.cols - 1) MN.pile[ci + 1] += .06;
      if (g.sv && SND.on && SND.ctx && Math.random() < .5) playGlyph("stars:u2606", { vol: .08, x: g.x / W });
      MN.dust.splice(i, 1); continue;
    }
    x.fillStyle = g.c >= 0 ? "rgba(" + MNC[g.c] + "," + (.95 * g.a) + ")" : "rgba(214,232,240," + (.55 * g.a) + ")";
    if (g.sv) { x.shadowColor = "rgba(" + MNC[g.c] + ",.9)"; x.shadowBlur = 8; } x.fillRect(g.x - g.sz / 2, g.y - g.sz / 2, g.sz, g.sz); if (g.sv) x.shadowBlur = 0;
  }
  /* the hand in the dust: near the ground it lifts the pile back into the air */
  if (P.on && d < .6 && P.y > sy - 40 && P.y < sy + 30) { const ci0 = (P.x / 4) | 0; for (let k = -6; k <= 6; k++) { const ci = ci0 + k; if (ci < 0 || ci >= MN.cols) continue; if (MN.pile[ci] > 1 && (P.down || Math.hypot(P.vx, P.vy) > 120)) { MN.pile[ci] -= .5; if (Math.random() < .5) mnGrain(ci * 4, sy - (hy - mnSurfY(ci * 4)) - 3, 1.8, null, P.vx * .12 + (Math.random() - .5) * 40, -50 - Math.random() * 60); } } }
  for (let i = 0; i < MN.cols; i++) MN.pile[i] += ((MN.pile[Math.max(0, i - 1)] + MN.pile[Math.min(MN.cols - 1, i + 1)]) * .5 - MN.pile[i]) * .004;

  /* under the surface: the ocean, and the keeper's water */
  if (d > .1) {
    const top = sy + 14 + Math.min(50, Math.ceil(s.length / 6)) * 4, oh = H - top, ow = W;
    if (oh > 20) {
      const NX = clamp(Math.round(ow / 9), 32, 110), NY = clamp(Math.round(oh / 9), 20, 70), key = NX + "x" + NY;
      if (key !== MN.flk) { MN.flk = key; fluid.init(NX, NY); MN.fc.width = NX; MN.fc.height = NY; MN.fim = MN.fcx.createImageData(NX, NY); }
      MN.oc = [0, top, ow, oh];
      if (!reduce && now - MN.lastStir > 2500 && (MN.fr = (MN.fr || 0) + 1) % 40 === 0) { MN.ph2 = (MN.ph2 || 0) + .02; fluid.swirl(NX * (.5 + .3 * Math.cos(MN.ph2)), NY * (.5 + .3 * Math.sin(MN.ph2 * 1.3)), Math.min(NX, NY) * .07, .02 * (Math.sin(MN.ph2 * .5) >= 0 ? 1 : -1), Math.sin(MN.ph2 * .25) > 0 ? "o" : "b"); }
      fluid.step(.1, Math.pow(10, -3 - 3 * (MN.lvl / 9))); for (let i = 0; i < fluid.o.length; i++) { fluid.o[i] *= .9985; fluid.b[i] *= .9985; }
      const Wd = NX + 2, im = MN.fim.data; let mc = 0;
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const id = (i + 1) + (j + 1) * Wd, o = Math.min(1.3, fluid.o[id]), bl = Math.min(1.3, fluid.b[id]), q = (j * NX + i) * 4, dp = j / NY;
        if ((i & 3) === 1 && (j & 3) === 1) { const c = Math.abs((fluid.v[id + 1] - fluid.v[id - 1]) - (fluid.u[id + Wd] - fluid.u[id - Wd])) * NX * .5; if (c > mc) mc = c; }
        const sh = .5 + .5 * Math.sin(i * .55 + j * .31 + t * 1.2) * Math.sin(j * .4 - i * .2 + t * .8); let r = 6 + 8 * (1 - dp) + 4 * sh, g2 = 18 + 16 * (1 - dp) + 10 * sh, b2 = 38 + 34 * (1 - dp) + 22 * sh;
        const oo = o * .75, bb = bl * .75; r += oo * 255 + bb * 47; g2 += oo * 138 + bb * 168; b2 += oo * 40 + bb * 255; const foam = Math.min(oo, bb); r += foam * 70; g2 += foam * 70; b2 += foam * 50;
        im[q] = Math.min(255, r); im[q + 1] = Math.min(255, g2); im[q + 2] = Math.min(255, b2); im[q + 3] = 255;
      }
      MN.curl = mc; MN.fcx.putImageData(MN.fim, 0, 0); x.save(); x.globalAlpha = clamp((d - .12) * 2.6, 0, 1); x.imageSmoothingEnabled = true; x.drawImage(MN.fc, 0, top, ow, oh);
      const vg = x.createLinearGradient(0, top, 0, top + 40); vg.addColorStop(0, "rgba(10,9,13,1)"); vg.addColorStop(1, "rgba(10,9,13,0)"); x.fillStyle = vg; x.fillRect(0, top, ow, 40); x.restore();
      if (d > .6) $("mnSw").textContent = "swirl " + mc.toFixed(1);
    }
  }
  /* the pointer drives the water when we are under */
  if (d > .5 && MN.oc) {
    const [ox, oy2, ow, oh] = MN.oc, gx = (P.x - ox) / ow * fluid.NX + 1, gy = (P.y - oy2) / oh * fluid.NY + 1;
    if (P.on && gx > 1 && gy > 1 && gx < fluid.NX && gy < fluid.NY && (P.down || Math.hypot(P.vx, P.vy) > 40)) {
      const W2 = fluid.NX + 2, i = Math.round(gx), j = Math.round(gy), k = P.down ? 1 : .55;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const ii = clamp(i + a, 1, fluid.NX), jj = clamp(j + b, 1, fluid.NY), f = 1 - (Math.abs(a) + Math.abs(b)) / 5, id = ii + jj * W2; fluid.u0[id] += P.vx * .035 * f * k * .1; fluid.v0[id] += P.vy * .035 * f * k * .1; if (P.down) { if ((i & 4) ^ (j & 4)) fluid.o0[id] += .6 * f; else fluid.b0[id] += .6 * f; } else if ((MN.ph * 3 | 0) % 2) fluid.o0[id] += .08 * f; else fluid.b0[id] += .08 * f; }
      MN.lastStir = now;
    }
  }
  P.vx *= .86; P.vy *= .86;
  /* the vignette */
  const vg2 = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .4, W / 2, H / 2, Math.hypot(W, H) * .6); vg2.addColorStop(0, "rgba(0,0,0,0)"); vg2.addColorStop(1, "rgba(0,0,0,.55)"); x.fillStyle = vg2; x.fillRect(0, 0, W, H);
}
function mnDrawBit(x, b, i, t) {
  const sz = b.sz, hx = b.x - sz / 2, hyy = b.y - sz / 2, col = MNC[b.col], hot = MN.hov === i || MN.sel === i, tt = reduce ? 0 : t;
  x.save(); x.globalAlpha = hot ? 1 : .88;
  x.fillStyle = "rgba(6,8,14," + (b.fixed ? .86 : .68) + ")"; x.fillRect(hx, hyy, sz, sz); x.strokeStyle = "rgba(" + col + "," + (hot ? .95 : .55) + ")"; x.lineWidth = 1; x.strokeRect(hx + .5, hyy + .5, sz - 1, sz - 1);
  const cs = sz / 16, rows = mnBits(b, tt * 1.0);                                          /* the glyph that the file keeps */
  x.fillStyle = "rgba(" + col + "," + (b.fixed ? .5 : .28) + ")"; for (let y = 0; y < 16; y++) for (let k = 0; k < 16; k++) if ((rows[y] >> (15 - k)) & 1) x.fillRect(hx + k * cs, hyy + y * cs, cs, cs);
  const q = mnPot(b, tt * 1.0), N = 7; x.strokeStyle = "rgba(" + col + ",.9)"; x.lineWidth = 1.2; x.beginPath();   /* the lattice of the field */
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) { const gx = 1.1 + xx * 2.3, gy = 1.1 + yy * 2.3, f = mnField(q, gx, gy), m = Math.hypot(f[0], f[1]) || 1, ex = f[0] / m, ey = f[1] / m, L = cs * 1.0; const px = hx + gx * cs, py = hyy + gy * cs; x.moveTo(px - ex * L, py - ey * L); x.lineTo(px + ex * L, py + ey * L); }
  x.stroke();
  x.fillStyle = "rgba(" + col + ",1)"; q.forEach(c => { x.fillRect(hx + c[0] * cs - 1.5, hyy + c[1] * cs - 1.5, 3, 3); });
  x.font = "600 " + clamp(Math.round(sz * .135), 8, 11) + "px ui-monospace,Menlo,Consolas,monospace"; x.textAlign = "center"; x.fillStyle = hot ? "#ffe9a8" : "rgba(214,206,186,.9)"; x.fillText(b.name, b.x, hyy + sz + 14);
  x.restore();
}
requestAnimationFrame(function mnLoop(now) { requestAnimationFrame(mnLoop); if (curRoom === "moon") mnFrame(now); });
