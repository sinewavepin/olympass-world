/* ============ aurora: magnetic field threads, coloured by Ganymede's auroras ============ */
const auCv = $("aurora"), actx = auCv.getContext("2d");
let AW = 0, AH = 0;
function sizeAurora() { AW = innerWidth; AH = innerHeight; auCv.width = AW; auCv.height = AH; }
sizeAurora(); addEventListener("resize", sizeAurora);
const AUR = [[205, 176, 255], [47, 168, 255], [168, 214, 120], [200, 240, 255]];
function auCol(L, a) {
  const k = clamp((L - 1.4) / 5.6, 0, 1) * 2.999, i = Math.floor(k), f = k - i, c1 = AUR[i], c2 = AUR[i + 1];
  return "rgba(" + Math.round(c1[0] + (c2[0] - c1[0]) * f) + "," + Math.round(c1[1] + (c2[1] - c1[1]) * f) + "," + Math.round(c1[2] + (c2[2] - c1[2]) * f) + "," + a + ")";
}
let acx = innerWidth * .5, acy = innerHeight * .56, asc = Math.min(innerWidth, innerHeight) * .075;
function threadFrame(x, r, t, boost) {
  for (let k = 0; k < 6; k++) {
    const inset = -(3 + k * 5), L = 2.2 + k * 0.9, wob = 1.5 + k * 1.1;
    const x0 = r.left + inset, y0 = r.top + inset, w = r.width - inset * 2, h = r.height - inset * 2;
    if (w < 40 || h < 40) continue;
    const per = 2 * (w + h), stepL = 14, n = Math.max(8, Math.floor(per / stepL));
    x.beginPath();
    for (let i = 0; i <= n; i++) {
      const s = (i % n) / n * per; let px, py, nx = 0, ny = 0;
      if (s < w) { px = x0 + s; py = y0; ny = -1; }
      else if (s < w + h) { px = x0 + w; py = y0 + (s - w); nx = 1; }
      else if (s < 2 * w + h) { px = x0 + w - (s - w - h); py = y0 + h; ny = 1; }
      else { px = x0; py = y0 + h - (s - 2 * w - h); nx = -1; }
      const d = Math.sin(s * .021 + t * .6 + k * 1.3) * wob + Math.sin(s * .047 - t * .35 + k) * wob * .5;
      px += nx * d; py += ny * d;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath(); x.strokeStyle = auCol(L, (.62 - k * .085) * boost); x.lineWidth = k < 2 ? 1.5 : 1; x.stroke();
  }
}
function drawAurora(now) {
  requestAnimationFrame(drawAurora);
  const x = actx, t = reduce ? 0 : now / 1000, splash = document.body.classList.contains("splash");
  let tx = AW * .5, ty = AH * .56, tu = Math.min(AW, AH) * .075;
  if (splash && gw) { const g = mglass.getBoundingClientRect(); if (g.width) { tx = g.left + MCX; ty = g.top + MCY; tu = Math.max(MR, 40) / 1.15; } }
  acx += (tx - acx) * .06; acy += (ty - acy) * .06; asc += (tu - asc) * .06;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, AW, AH); x.globalCompositeOperation = "lighter";
  /* auroral curtains from the top edge */
  const nC = Math.max(14, Math.floor(AW / 26));
  for (let i = 0; i < nC; i++) {
    const px = (i + .5) / nC * AW + Math.sin(t * .35 + i * .6) * 9, hh = AH * (.16 + .1 * Math.sin(i * .7 + t * .3) + .06 * Math.sin(i * 1.9 - t * .2));
    const g = x.createLinearGradient(0, 0, 0, hh); const c = i % 5 === 0 ? AUR[0] : AUR[2];
    g.addColorStop(0, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",.0)"); g.addColorStop(.35, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",.17)"); g.addColorStop(1, "rgba(" + c[0] + "," + c[1] + "," + c[2] + ",0)");
    x.fillStyle = g; x.fillRect(px - 1, 0, 2.2, hh);
  }
  /* dipole field lines around the moon: three planes, each a family of shells */
  const tilt = -.35 + Math.sin(t * .05) * .08;
  x.lineWidth = 1;
  for (let ax = 0; ax < 3; ax++) {
    const ang = tilt + ax * Math.PI / 3, sq = [1, .62, .34][ax], ca = Math.cos(ang), sa = Math.sin(ang), ab = ax === 0 ? 1 : .62;
    for (let li = 0; li < 15; li++) {
      const L = 1.5 + li * .42 + li * li * .03, lam0 = Math.acos(Math.sqrt(1 / L)), n = 34;
      for (const side of [-1, 1]) {
        x.beginPath();
        for (let i = 0; i <= n; i++) {
          const lam = -lam0 + 2 * lam0 * i / n, r = L * Math.cos(lam) * Math.cos(lam), w = Math.sin(lam * 5 + t * .5 + L * 2 + ax) * .05 * L;
          const px = side * r * Math.cos(lam) + w, py = r * Math.sin(lam) + w * .5;
          const X = px * ca - py * sa, Y = (px * sa + py * ca) * sq;
          const sx = acx + X * asc, sy = acy + Y * asc;
          i ? x.lineTo(sx, sy) : x.moveTo(sx, sy);
        }
        x.strokeStyle = auCol(L, .46 * (1 - li / 15 * .5) * ab); x.stroke();
      }
    }
  }
  /* the terminal is made of threads: bowed field lines hugging its frame */
  const base = splash ? $("pathL") : term;
  const rr = base.getBoundingClientRect();
  if (rr.width) threadFrame(x, rr, t, splash ? .9 : 1);
  x.globalCompositeOperation = "source-over";
}
requestAnimationFrame(drawAurora);

/* ============ STUDIO: the third window ============ */
const ST_CW = 18, ST_CH = 14, ST_U = 16;
const stCv = $("stc"), stX = stCv.getContext("2d");
const ST = { items: [], sel: -1, col: "orange", hist: [], dom: "all" };
const ST_COLS = ["orange", "sun", "gold", "leaf", "eblue", "foam", "violet", "red", "white"];
let stK = 1, stDpr = 1, stDrag = null;
const _bm = new Map();
function stBmp(id, col) { const k = id + "|" + col; let c = _bm.get(k); if (!c) { c = iconCanvas(id, col); _bm.set(k, c); } return c; }
const stSay = s => { $("stStatus").textContent = s; };
function stSnap() { return JSON.stringify({ items: ST.items, sel: ST.sel }); }
function stPush(s) { ST.hist.push(s || stSnap()); if (ST.hist.length > 60) ST.hist.shift(); }
/* motion: QUANT steps on the field tick (one tick = tick_ms) */
const MO_NAMES = ["NONE", "PULSE", "DRIFT", "ORBIT", "BLINK"];
let stTick = 0, stPlaying = false, stScrub = false, stMs = 1000, stTimer = null;
function stCycle() { const gcd = (a, b) => b ? gcd(b, a % b) : a; let n = 2; ST.items.forEach(o => { if (o.m === 2) n = n / gcd(n, ST_CW - o.s + 1) * (ST_CW - o.s + 1); if (o.m === 3) n = n / gcd(n, 4) * 4; }); return Math.min(48, Math.max(2, Math.round(n))); }
function stDisp(it) {
  if (!(stPlaying || stScrub) || !it.m) return it;
  const t = stTick, o = Object.assign({}, it);
  if (it.m === 1) { o.s = Math.min(8, it.s + (t % 2)); o.x = Math.min(it.x, ST_CW - o.s); o.y = Math.min(it.y, ST_CH - o.s); }
  else if (it.m === 2) { o.x = (it.x + t) % (ST_CW - it.s + 1); }
  else if (it.m === 3) { const q = [[0, 0], [1, 0], [1, 1], [0, 1]][t % 4]; o.x = Math.min(it.x + q[0], ST_CW - it.s); o.y = Math.min(it.y + q[1], ST_CH - it.s); }
  else if (it.m === 4) { if (t % 2) return null; }
  return o;
}
function stRunTimer() { clearInterval(stTimer); stTimer = null; if (stPlaying) stTimer = setInterval(() => { stTick++; stDraw(); stTl(); }, stMs); }
function stTl() { const N = stCycle(), sc = $("stScrub"); sc.max = N - 1; sc.value = stTick % N; $("stTlLab").textContent = "TICK " + (stTick % N) + " / " + N; }
function stFit() {
  const avail = $("sglass").clientWidth || (($("pathR").clientWidth || 400) - 56);
  stDpr = Math.min(window.devicePixelRatio || 1, 3);
  stK = Math.max(1, Math.floor(Math.min(avail, ST_CW * ST_U * 3) * stDpr / (ST_CW * ST_U)));
  stCv.width = ST_CW * ST_U * stK; stCv.height = ST_CH * ST_U * stK;
  stCv.style.width = (stCv.width / stDpr) + "px"; stCv.style.height = (stCv.height / stDpr) + "px";
  stDraw();
}
function stItem(x, k, it, glow) {
  const S = it.s * ST_U * k, cxp = it.x * ST_U * k + S / 2, cyp = it.y * ST_U * k + S / 2, p = PAL[it.c];
  x.save(); x.translate(cxp, cyp); x.rotate(it.r * Math.PI / 2); x.scale(it.f ? -1 : 1, 1);
  if (glow) { x.shadowColor = "rgba(" + p[0] + "," + p[1] + "," + p[2] + ",.75)"; x.shadowBlur = S * .06; }
  x.imageSmoothingEnabled = false; x.drawImage(stBmp(it.g, it.c), -S / 2, -S / 2, S, S); x.restore();
}
function stPaint(x, k, ui) {
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = "#04070b"; x.fillRect(0, 0, ST_CW * ST_U * k, ST_CH * ST_U * k);
  if (ui) {
    x.fillStyle = "rgba(47,168,255,.55)"; const d = Math.max(1, Math.round(k * .6));
    for (let j = 0; j <= ST_CH; j++) for (let i = 0; i <= ST_CW; i++) x.fillRect(i * ST_U * k - (i === ST_CW ? d : 0), j * ST_U * k - (j === ST_CH ? d : 0), d, d);
  }
  ST.items.forEach(it => { const d = stDisp(it); if (d) stItem(x, k, d, ui); });
  if (ui && ST.hover) { x.save(); x.strokeStyle = "#ffd36b"; x.lineWidth = Math.max(1, stK); x.strokeRect(ST.hover[0] * ST_U * stK + .5, ST.hover[1] * ST_U * stK + .5, ST_U * stK - 1, ST_U * stK - 1); x.restore(); }
  if (ui && ST.sel >= 0 && ST.items[ST.sel]) {
    const it = ST.items[ST.sel], S = it.s * ST_U * stK; x.save(); x.strokeStyle = "#2fa8ff"; x.lineWidth = Math.max(1, stK * .5); x.setLineDash([stK * 3, stK * 2]);
    x.strokeRect(it.x * ST_U * stK + .5, it.y * ST_U * stK + .5, S - 1, S - 1); x.restore();
  }
}
function stDraw() { stPaint(stX, stK, true); }
function stSync() {
  const it = ST.items[ST.sel], has = !!it, B = a => document.querySelector('.sui [data-a="' + a + '"]');
  ["shrink", "grow", "rot", "flip", "dup", "del"].forEach(a => { B(a).disabled = !has; });
  B("motion").disabled = !has; B("motion").textContent = has ? "MOTION " + MO_NAMES[it.m || 0] : "MOTION";
  B("play").textContent = stPlaying ? "STOP" : "PLAY"; B("play").classList.toggle("on", stPlaying); B("play").disabled = !ST.items.some(o => o.m);
  B("speed").textContent = "TICK " + stMs; B("ear").classList.toggle("on", ROV.ear); B("haptic").classList.toggle("on", ROV.haptic);
  B("ear").setAttribute("aria-pressed", String(ROV.ear)); B("haptic").setAttribute("aria-pressed", String(ROV.haptic));
  B("song").disabled = ROV.on; B("stopsong").disabled = !ROV.on;
  B("gif").disabled = !ST.items.some(o => o.m); B("route").disabled = !(has && ROUTES[it.g]); stTl();
  B("undo").disabled = !ST.hist.length; B("clear").disabled = !ST.items.length; B("png").disabled = !ST.items.length; B("copy").disabled = !ST.items.length;
  if (has) { B("shrink").disabled = it.s <= 1; B("grow").disabled = it.s >= 8; }
  document.querySelectorAll("#stSw .sw").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.c === (has ? it.c : ST.col))));
  stCv.setAttribute("aria-label", "Studio stage, " + ST.items.length + (ST.items.length === 1 ? " glyph" : " glyphs") + (has ? ", selected " + it.g : ""));
  stSay(has ? it.g + " · cell " + it.x + "," + it.y + " · scale " + it.s + "x · " + (it.r * 90) + " deg" + (it.f ? " · mirrored" : "") : ST.items.length ? "tap a glyph on the stage to select it" : "tap a glyph below to place it on the stage");
  stDraw();
}
function stMut(fn) { if (ST.sel < 0 || !ST.items[ST.sel]) return; stPush(); fn(ST.items[ST.sel]); stSync(); }
function stAddAt(id, x, y) { stPush(); x = clamp(x, 0, ST_CW - 1); y = clamp(y, 0, ST_CH - 1); ST.items.push({ g: id, x, y, s: 1, r: 0, f: 0, c: ST.col, m: 0 }); ST.sel = ST.items.length - 1; stSync(); }
function stAdd(id) {
  stPush(); let x = ST_CW / 2 - 1, y = ST_CH / 2 - 1, guard = 0;
  while (ST.items.some(o => o.x === x && o.y === y && o.s === 1) && guard++ < 40) { x++; if (x > ST_CW - 1) { x = 0; y = (y + 1) % ST_CH; } }
  ST.items.push({ g: id, x, y, s: 1, r: 0, f: 0, c: ST.col, m: 0 }); ST.sel = ST.items.length - 1; stSync();
}
function stUndo() { const s = ST.hist.pop(); if (!s) return; const o = JSON.parse(s); ST.items = o.items; ST.sel = o.sel; stSync(); }
const stOps = {
  shrink: () => stMut(it => { it.s = Math.max(1, it.s - 1); }),
  grow: () => stMut(it => { it.s = Math.min(8, it.s + 1); it.x = Math.min(it.x, ST_CW - it.s); it.y = Math.min(it.y, ST_CH - it.s); }),
  rot: () => stMut(it => { it.r = (it.r + 1) % 4; }),
  flip: () => stMut(it => { it.f ^= 1; }),
  dup: () => { const it = ST.items[ST.sel]; if (!it) return; stPush(); ST.items.push(Object.assign({}, it, { x: Math.min(it.x + 1, ST_CW - it.s), y: Math.min(it.y + 1, ST_CH - it.s) })); ST.sel = ST.items.length - 1; stSync(); },
  del: () => { if (!ST.items[ST.sel]) return; stPush(); ST.items.splice(ST.sel, 1); ST.sel = -1; stSync(); },
  motion: () => stMut(it => { it.m = ((it.m || 0) + 1) % MO_NAMES.length; }),
  play: () => { stPlaying = !stPlaying; stScrub = false; stTick = 0; stRunTimer(); stSync(); },
  gif: () => stGif(),
  route: () => stRoute(),
  hash: () => stHash(),
  speed: () => { stMs = stMs === 1000 ? 500 : stMs === 500 ? 250 : 1000; stRunTimer(); stSync(); },
  song: () => roverSong(),
  stopsong: () => { ROV.on = false; },
  ear: () => { ROV.ear = !ROV.ear; stSync(); },
  haptic: () => { ROV.haptic = !ROV.haptic; stSync(); },
  undo: stUndo,
  clear: () => { if (!ST.items.length) return; stPush(); ST.items = []; ST.sel = -1; stSync(); },
  png() {
    const c = document.createElement("canvas"), k = 8; c.width = ST_CW * ST_U * k; c.height = ST_CH * ST_U * k; stPaint(c.getContext("2d"), k, false);
    c.toBlob(b => { if (!b) { stSay("export failed"); return; } try { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "GAN.MOON-studio.png"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); stSay("PNG exported · " + c.width + " x " + c.height); } catch (e) { stSay("export is blocked in this view · open the full page"); } });
  },
  copy() {
    const txt = ["[compose]", "; GAN.MOON studio session", "stage = " + ST_CW * ST_U + "x" + ST_CH * ST_U].concat(ST.items.map(it => "PLACE " + it.g + " " + it.x + " " + it.y + " scale=" + it.s + " rot=" + it.r * 90 + (it.f ? " mirror" : "") + " color=" + it.c + (it.m ? " motion=" + MO_NAMES[it.m].toLowerCase() : ""))).join("\n");
    const ok = () => stSay("copied " + ST.items.length + " placements as a [compose] block"), no = () => stSay("copy is blocked in this view");
    try { navigator.clipboard.writeText(txt).then(ok, no); } catch (e) { no(); }
  }
};
document.querySelector(".sui").addEventListener("click", e => { const b = e.target.closest("button[data-a]"); if (b && !b.disabled) stOps[b.dataset.a](); });
function stCell(e) { const r = stCv.getBoundingClientRect(); return [Math.floor((e.clientX - r.left) / r.width * ST_CW), Math.floor((e.clientY - r.top) / r.height * ST_CH)]; }
stCv.addEventListener("pointerdown", e => {
  const [i, j] = stCell(e); let h = -1;
  for (let n = ST.items.length - 1; n >= 0; n--) { const it = ST.items[n]; if (i >= it.x && i < it.x + it.s && j >= it.y && j < it.y + it.s) { h = n; break; } }
  ST.sel = h; stDrag = null;
  if (h >= 0) { stDrag = { dx: i - ST.items[h].x, dy: j - ST.items[h].y, snap: stSnap(), pushed: false }; try { stCv.setPointerCapture(e.pointerId); } catch (er) {} }
  stSync(); try { stCv.focus({ preventScroll: true }); } catch (er) {}
});
stCv.addEventListener("pointermove", e => {
  if (!stDrag) return; const it = ST.items[ST.sel]; if (!it) return;
  const [i, j] = stCell(e), nx = clamp(i - stDrag.dx, 0, ST_CW - it.s), ny = clamp(j - stDrag.dy, 0, ST_CH - it.s);
  if (nx !== it.x || ny !== it.y) { if (!stDrag.pushed) { stPush(stDrag.snap); stDrag.pushed = true; } it.x = nx; it.y = ny; stSync(); }
});
const stEnd = () => { stDrag = null; };
stCv.addEventListener("pointerup", stEnd); stCv.addEventListener("pointercancel", stEnd);
document.addEventListener("keydown", e => {
  if ($("pathR").dataset.tab !== "studio" || !document.body.classList.contains("splash")) return;
  const tg = e.target; if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return;
  const k = e.key; let used = true;
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "z") stUndo();
  else if (k === "[") stOps.shrink(); else if (k === "]") stOps.grow();
  else if (k === "r" || k === "R") stOps.rot(); else if (k === "f" || k === "F") stOps.flip(); else if (k === "d" || k === "D") stOps.dup();
  else if (k === "Delete" || k === "Backspace") stOps.del();
  else if (k.startsWith("Arrow") && ST.items[ST.sel]) { const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k]; stMut(it => { it.x = clamp(it.x + d[0], 0, ST_CW - it.s); it.y = clamp(it.y + d[1], 0, ST_CH - it.s); }); }
  else if (k === "Escape") { ST.sel = -1; stSync(); } else used = false;
  if (used) e.preventDefault();
});
/* ============ the rover: sound as vibration ============ */
const ROV = { on: false, ear: false, haptic: false, sh: 0 };
const HZ = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.26, F5: 698.46, G5: 783.99 };
const SONG = [["Hap-py birth-day to you", "G4 G4 A4 G4 C5 B4"], ["Hap-py birth-day to you", "G4 G4 A4 G4 D5 C5"], ["Hap-py birth-day dear Gan-y-mede", "G4 G4 G5 E5 C5 B4 A4"], ["Hap-py birth-day to you", "F5 F5 E5 C5 D5 C5"]];
const fold = f => { while (f > 13) f /= 2; while (f < 6.5) f *= 2; return f; };
const rwait = ms => new Promise(r => setTimeout(r, ms));
let actxA = null;
function beep(hz, ms) { try { actxA = actxA || new (window.AudioContext || window.webkitAudioContext)(); const o = actxA.createOscillator(), g = actxA.createGain(), t = actxA.currentTime; o.type = "sine"; o.frequency.value = hz; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + ms / 1000); o.connect(g); g.connect(actxA.destination); o.start(t); o.stop(t + ms / 1000 + .05); } catch (e) {} }
const stageEl = $("stage");
(function shiverLoop(now) {
  requestAnimationFrame(shiverLoop);
  if (ROV.sh && !reduce) { const t = now / 1000; stageEl.style.transform = "translate(" + (Math.sin(TAU * ROV.sh * t) * 1.4).toFixed(2) + "px," + (Math.cos(TAU * ROV.sh * t * 1.01) * .8).toFixed(2) + "px)"; }
  else if (stageEl.style.transform) stageEl.style.transform = "";
})(0);
function postSay(lines) { try { term.contentWindow.postMessage({ tesela: "say", lines }, "*"); } catch (e) {} }
async function roverSong() {
  if (ROV.on) return; ROV.on = true; stSync(); const beat = 550;
  for (let p = 0; p < SONG.length && ROV.on; p++) {
    const notes = SONG[p][1].split(" "), d = notes.length === 7 ? [.75, .25, 1, 1, 1, 1, 2] : [.75, .25, 1, 1, 1, 2];
    postSay(["phrase " + (p + 1) + " · " + SONG[p][0]]);
    for (let i = 0; i < notes.length && ROV.on; i++) {
      const n = notes[i], hz = HZ[n], sh = fold(hz), ms = d[i] * beat;
      stSay("[signal · " + n + " " + hz.toFixed(2) + " Hz → " + sh.toFixed(1) + " Hz shiver]");
      ROV.sh = sh; if (ROV.ear) beep(hz, ms * .9);
      if (ROV.haptic && navigator.vibrate) { const per = 1000 / sh, pat = []; for (let k = 0; k < Math.floor(ms * .9 / per); k++) pat.push(per * .5, per * .5); try { navigator.vibrate(pat); } catch (e) {} }
      await rwait(ms * .9); ROV.sh = 0; await rwait(ms * .1 + 40);
    }
    await rwait(beat);
  }
  const done = ROV.on; ROV.on = false; ROV.sh = 0; stSync(); stSay(done ? "[signal · song complete · once is the performance]" : "[signal · hushed]");
}
/* ============ drag a glyph from the shelf onto the stage ============ */
let shD = null, shSuppress = false;
function shCell(e) { const r = stCv.getBoundingClientRect(); if (e.clientX < r.left || e.clientX >= r.right || e.clientY < r.top || e.clientY >= r.bottom) return null; return [Math.floor((e.clientX - r.left) / r.width * ST_CW), Math.floor((e.clientY - r.top) / r.height * ST_CH)]; }
function shStart(e) {
  if (!shD || shD.on) return; shD.on = true;
  const g = document.createElement("canvas"); g.width = g.height = 16; g.id = "dragGhost"; g.getContext("2d").drawImage(stBmp(shD.id, ST.col), 0, 0); document.body.appendChild(g); shD.ghost = g; shMove(e);
}
function shMove(e) { if (!shD || !shD.on) return; shD.ghost.style.left = e.clientX + "px"; shD.ghost.style.top = e.clientY + "px"; const c = shCell(e); ST.hover = c; stDraw(); }
function shDown(e, id) {
  if (e.button > 0) return; if (e.pointerType !== "touch") e.preventDefault(); shD = { id, sx: e.clientX, sy: e.clientY, on: false, touch: e.pointerType === "touch", pid: e.pointerId, timer: 0 };
  if (shD.touch) shD.timer = setTimeout(() => { if (shD && !shD.on) { shD.armed = true; shStart(e); try { navigator.vibrate && navigator.vibrate(12); } catch (er) {} } }, 260);
}
document.addEventListener("pointermove", e => {
  if (!shD || e.pointerId !== shD.pid) return;
  if (!shD.on) { if (shD.touch) { if (Math.hypot(e.clientX - shD.sx, e.clientY - shD.sy) > 10) { clearTimeout(shD.timer); shD = null; } return; } if (Math.hypot(e.clientX - shD.sx, e.clientY - shD.sy) > 6) shStart(e); }
  else shMove(e);
});
document.addEventListener("touchmove", e => { if (shD && shD.on) e.preventDefault(); }, { passive: false });
function shEnd(e, cancel) {
  if (!shD || (e.pointerId !== undefined && e.pointerId !== shD.pid)) return;
  clearTimeout(shD.timer);
  if (shD.on) { shSuppress = true; setTimeout(() => { shSuppress = false; }, 60); const c = cancel ? null : shCell(e); shD.ghost.remove(); ST.hover = null; if (c) { stAddAt(shD.id, c[0], c[1]); stSay(shD.id + " placed at " + c[0] + "," + c[1]); } else stDraw(); }
  shD = null;
}
document.addEventListener("pointerup", e => shEnd(e, false)); document.addEventListener("pointercancel", e => shEnd(e, true));
/* ============ routes, hash, GIF ============ */
const ROUTES = {
  "craters:u25e1": { stage: 2, txt: "route · stage 2 · CUP · OPEN CUP.DRV" },
  "signals:u22cb": { txt: "route · arrow paths:u27ff · Earth bridge, outward" },
  "paths:u2944": { stage: 6, txt: "route · stage 6 · SIGNAL · FAN SIGNAL.EXE, return path" },
  "core:u2609": { txt: "route · seal · solar-burst" }
};
function stRoute() { const it = ST.items[ST.sel], r = it && ROUTES[it.g]; if (!r) return; stSay("[" + r.txt + "]"); postSay([r.txt]); kick = (performance.now() - t0) / 1000; setTab("moon"); }
async function stHash() {
  try { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode($("lun").textContent)); const h = [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join(""); stSay("TESELA.lun sha256 " + h.slice(0, 16) + "… (informational, nothing is gated on it)"); postSay(["TESELA.lun sha256", h.slice(0, 32), h.slice(32)]); }
  catch (e) { stSay("hash is not available in this view"); }
}
$("stScrub").addEventListener("input", e => { stPlaying = false; stRunTimer(); stScrub = true; stTick = +e.target.value; stDraw(); stTl(); const p = document.querySelector('.sui [data-a="play"]'); p.textContent = "PLAY"; p.classList.remove("on"); });
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
  const keepP = stPlaying, keepS = stScrub, keepT = stTick, frames = [];
  stScrub = true;
  for (let t = 0; t < N; t++) {
    stTick = t; stPaint(x, k, false); const d = x.getImageData(0, 0, w, h).data, ix = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) { const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]; let v = map.get(key); if (v === undefined) { let bd = 1e9; pal.forEach((p, q) => { const dd = (p[0] - d[i]) ** 2 + (p[1] - d[i + 1]) ** 2 + (p[2] - d[i + 2]) ** 2; if (dd < bd) { bd = dd; v = q; } }); map.set(key, v); } ix[j] = v; }
    frames.push(ix);
  }
  stPlaying = keepP; stScrub = keepS; stTick = keepT;
  return { bytes: gifBytes(w, h, frames, pal, Math.max(2, Math.round(stMs / 10))), N, w, h };
}
function stGif() {
  if (!ST.items.some(o => o.m)) return;
  try {
    const g = stGifBuild(); window.__gif = g.bytes; stDraw();
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([g.bytes], { type: "image/gif" })); a.download = "GAN.MOON-studio.gif"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    stSay("GIF exported · " + g.N + " frames · " + g.w + " x " + g.h);
  } catch (e) { stSay("GIF export is blocked in this view · open the full page"); }
}
/* colours and shelf */
ST_COLS.forEach(c => { const b = document.createElement("button"); b.type = "button"; b.className = "sw"; b.dataset.c = c; b.setAttribute("aria-label", "Colour " + c); b.style.background = "rgb(" + PAL[c].join(",") + ")"; b.setAttribute("aria-pressed", String(c === ST.col));
  b.addEventListener("click", () => { ST.col = c; const it = ST.items[ST.sel]; if (it) { stPush(); it.c = c; } stSync(); }); $("stSw").appendChild(b); });
const stDoms = ["all"].concat([...new Set(GL_ORDER.map(id => id.split(":")[0]))]);
function stShelf() {
  const sh = $("shelf"); sh.innerHTML = "";
  GL_ORDER.filter(id => ST.dom === "all" || id.split(":")[0] === ST.dom).forEach(id => {
    const b = document.createElement("button"); b.type = "button"; b.title = id; b.setAttribute("aria-label", "Place " + id);
    const c = document.createElement("canvas"); c.width = c.height = 16; c.getContext("2d").drawImage(stBmp(id, "orange"), 0, 0); b.appendChild(c);
    b.addEventListener("click", () => { if (shSuppress) { shSuppress = false; return; } stAdd(id); });
    b.addEventListener("pointerdown", e => shDown(e, id)); sh.appendChild(b);
  });
}
{ const sel = document.createElement("select"); sel.id = "shDom"; sel.setAttribute("aria-label", "Shelf domain"); stDoms.forEach(d => { const o = document.createElement("option"); o.value = d; o.textContent = d === "all" ? "ALL GLYPHS" : d.toUpperCase(); sel.appendChild(o); }); sel.addEventListener("change", () => { ST.dom = sel.value; stShelf(); }); $("stSw").appendChild(sel); }
stShelf();
/* tabs */
let siteLoaded = false;
function setTab(t) {
  $("pathR").dataset.tab = t;
  ["Moon", "Studio", "Site"].forEach(n => $("tab" + n).setAttribute("aria-selected", String(t === n.toLowerCase())));
  if (t === "site" && !siteLoaded) { siteLoaded = true; const b = Uint8Array.from(atob($("sitedata").textContent.trim()), c => c.charCodeAt(0)); $("siteFrame").srcdoc = new TextDecoder("utf-8").decode(b).replace("<head>", '<head><base href="about:srcdoc">'); }
  if (t === "studio") { stFit(); stSync(); } else if (t === "moon") layoutMoon();
}
["Moon", "Studio", "Site"].forEach(n => $("tab" + n).addEventListener("click", () => setTab(n.toLowerCase())));
addEventListener("resize", () => { clearTimeout(window.__rz2); window.__rz2 = setTimeout(() => { if ($("pathR").dataset.tab === "studio") stFit(); }, 140); });
stFit(); stSync(); window.__ST = ST;

