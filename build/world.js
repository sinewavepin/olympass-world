
/* ============ the world: the moon at the centre, five doors, a sound for every glyph ============ */
function iconCanvas(id, col) {
  const c = document.createElement("canvas"); c.width = c.height = 16;
  const x = c.getContext("2d"), im = x.createImageData(16, 16), g = LUN.glyphs[id], [r, gg, b] = PAL[col];
  if (g) for (let y = 0; y < 16; y++) for (let k = 0; k < 16; k++) if ((g.rows[y] >> (15 - k)) & 1) { const o = (y * 16 + k) * 4; im.data[o] = r; im.data[o + 1] = gg; im.data[o + 2] = b; im.data[o + 3] = 255; }
  x.putImageData(im, 0, 0); return c;
}
const body = document.body, term = $("term"), worldEl = $("world"), wc = $("wc"), wx = wc.getContext("2d");
const fieldCv = $("field"), fctx = fieldCv.getContext("2d"), bloomCv = $("bloomF"), bctx = bloomCv.getContext("2d");
const t0 = performance.now(); let kick = -99;
const WD = { w: 0, h: 0, cx: 0, cy: 0, R: 100, MK: 3, MNp: 66, DPR: 1, oy: 38, spinOff: 0, vel: 0, drag: false, lastX: 0 };
const AR = { on: false, done: false, t0: 0 };
const DL0 = 0.4, DL1 = 4.6, UL0 = 4.6, UL1 = 7.0, DR0 = 6.1, END = 8.8;
const RINGS = [], PART = [], FLASH = [];

/* ---------- the doors ---------- */
const DOORS = [
  { id: "river", name: "RIVER.COM", sub: "the terminal", ang: -90, rgb: "47,168,255", col: "eblue", pool: ["paths", "signals", "water", "bridge1", "frequencies"] },
  { id: "engine", name: "THE ENGINE", sub: "olympass.world", ang: -18, rgb: "255,138,40", col: "orange", pool: ["structure", "iron", "arrays", "core", "magnetism"] },
  { id: "terminal", name: "THE TERMINAL", sub: "olympass.world", ang: 54, rgb: "168,214,120", col: "leaf", pool: ["stars", "orbits", "signals", "bridge2", "bridge4"] },
  { id: "case", name: "THE CASE", sub: "olympass.world", ang: 126, rgb: "205,176,255", col: "violet", pool: ["craters", "radiation", "magnetism", "bridge3"] },
  { id: "studio", name: "STUDIO", sub: "the third window", ang: 198, rgb: "255,236,96", col: "gold", pool: ["notes"] }
];
const SONGSEQ = ["G4", "G4", "A4", "G4", "C5", "B4"];
const doorsEl = $("doors");
DOORS.forEach((d, di) => {
  const pool = GL_ALL.filter(id => d.pool.includes(id.split(":")[0]));
  d.poolIds = pool.length ? pool : GL_ORDER.slice(0, 12);
  const el = document.createElement("button"); el.type = "button"; el.className = "door"; el.dataset.door = d.id;
  el.setAttribute("aria-label", d.name + ", " + d.sub + ". Hover or focus to hear its glyphs.");
  el.style.setProperty("--dc", d.rgb);
  el.innerHTML = '<span class="arch"></span><b>' + d.name + "</b><i>" + d.sub + "</i>";
  const arch = el.firstChild; d.el = el; d.cells = []; d.last = 0;
  const picked = d.id === "studio" ? d.poolIds.slice(0, 12) : Array.from({ length: 12 }, (_, i) => d.poolIds[Math.floor(hash2(i + 1, di * 7 + 3) * d.poolIds.length)]);
  picked.forEach((id, i) => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 16; arch.appendChild(cv);
    const col = i % 3, row = Math.floor(i / 3), c = { cv, id, i, ph: hash2(i, di + 40) * 6.28, sp: .7 + hash2(i, di + 50) * 1.3, next: 2 + hash2(i, di + 60) * 5, dist: Math.hypot(col - 1, row - 1.5), d };
    drawCell(c); d.cells.push(c);
    cv.addEventListener("pointerenter", e => { if (e.pointerType === "touch") return; wake(); fire(c, 1); });
  });
  el.addEventListener("pointerenter", e => { if (e.pointerType !== "touch") cascade(d); });
  el.addEventListener("focus", () => cascade(d));
  el.addEventListener("pointerdown", e => { if (e.pointerType === "touch") { wake(); cascade(d); } });
  el.addEventListener("click", () => { wake(); enterDoor(d.id); });
  doorsEl.appendChild(el);
});
function drawCell(c) { const x = c.cv.getContext("2d"); x.clearRect(0, 0, 16, 16); x.drawImage(stBmp(c.id, c.d.col), 0, 0); }

/* ---------- sound: every glyph has a voice from its domain; it radiates outward ---------- */
const SND = { on: true, ctx: null, master: null, send: null };
const TIMBRE = {
  stars: { t: "sine", base: 523.25, dur: .95, part: 2.01, g: .8 }, paths: { t: "triangle", base: 293.66, dur: .5 }, orbits: { t: "sine", base: 220, dur: 1.1, vib: 5.5 },
  signals: { t: "square", base: 392, dur: .32, lp: 1500, g: .6 }, magnetism: { t: "sawtooth", base: 110, dur: 1.0, lp: 650, g: .8 }, water: { t: "sine", base: 329.63, dur: .8, gl: 1 },
  structure: { t: "square", base: 164.81, dur: .4, lp: 900, g: .6 }, frequencies: { t: "sine", base: 440, dur: .6, part: 3 }, craters: { t: "triangle", base: 130.81, dur: .7 },
  arrays: { t: "triangle", base: 349.23, dur: .3 }, radiation: { t: "sawtooth", base: 196, dur: .22, lp: 2600, g: .5 }, iron: { t: "square", base: 98, dur: .55, lp: 520, g: .7 },
  core: { t: "sine", base: 73.42, dur: 1.4, g: 1.2 }, bridge1: { t: "triangle", base: 246.94, dur: .6, part: 1.5 }, bridge2: { t: "triangle", base: 277.18, dur: .6, part: 1.5 },
  bridge3: { t: "triangle", base: 311.13, dur: .6, part: 1.5 }, bridge4: { t: "triangle", base: 369.99, dur: .6, part: 1.5 }, seal: { t: "sine", base: 392, dur: 1.3, part: 2.01 },
  notes: { t: "sine", base: 440, dur: .55, part: 2, g: .9 }, def: { t: "sine", base: 330, dur: .5 }
};
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
function glyphHz(id) {
  const g = LUN.glyphs[id]; if (g && g.tone !== undefined && !isNaN(+g.tone)) return +g.tone;
  const T = TIMBRE[id.split(":")[0]] || TIMBRE.def; let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return T.base * Math.pow(2, PENTA[h % PENTA.length] / 12);
}
function wake() {
  if (SND.ctx) { if (SND.ctx.state === "suspended") SND.ctx.resume(); return; }
  try {
    const C = window.AudioContext || window.webkitAudioContext, c = new C(); SND.ctx = c;
    SND.master = c.createGain(); SND.master.gain.value = .9; SND.master.connect(c.destination);
    SND.send = c.createGain(); SND.send.gain.value = .32;
    const dl = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(); dl.delayTime.value = .21; fb.gain.value = .4; lp.type = "lowpass"; lp.frequency.value = 2200;
    SND.send.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(SND.master);
    $("hint").classList.remove("on");
  } catch (e) {}
}
["pointerdown", "keydown"].forEach(ev => addEventListener(ev, wake, true));
function playGlyph(id, o) {
  o = o || {}; if (!SND.on || !SND.ctx) return; const c = SND.ctx, T = TIMBRE[id.split(":")[0]] || TIMBRE.def, hz = glyphHz(id); if (!hz) return;
  const t = c.currentTime + .01, vol = (o.vol === undefined ? .6 : o.vol) * (T.g || 1), dur = o.dur || T.dur;
  const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol * .2), t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let head = g;
  if (T.lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = T.lp; f.connect(g); head = f; }
  const voice = (type, f0, amp) => {
    const os = c.createOscillator(); os.type = type; os.frequency.setValueAtTime(f0, t); if (T.gl) os.frequency.exponentialRampToValueAtTime(f0 * .7, t + dur);
    if (T.vib) { const lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = T.vib; lg.gain.value = f0 * .012; lf.connect(lg); lg.connect(os.frequency); lf.start(t); lf.stop(t + dur + .05); }
    const a = c.createGain(); a.gain.value = amp; os.connect(a); a.connect(head); os.start(t); os.stop(t + dur + .05);
  };
  voice(T.t, hz, 1); if (T.part) voice("sine", hz * T.part, .35);
  let out = g; if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = clamp(((o.x === undefined ? .5 : o.x) - .5) * 1.7, -1, 1); g.connect(p); out = p; }
  out.connect(SND.master); out.connect(SND.send);
}
function ring(x, y, rgb, max, dur) { RINGS.push({ x, y, t: performance.now(), rgb, max: max || 130, dur: dur || 1100 }); if (RINGS.length > 60) RINGS.shift(); }
function cellPos(c) { const r = c.cv.getBoundingClientRect(), w = worldEl.getBoundingClientRect(); return [r.left - w.left + r.width / 2, r.top - w.top + r.height / 2]; }
function fire(c, vol) {
  const [x, y] = cellPos(c); playGlyph(c.id, { x: x / (WD.w || 1), vol: vol || .6 });
  ring(x, y, c.d.rgb, 70 + c.dist * 30); c.cv.classList.add("ping"); setTimeout(() => c.cv.classList.remove("ping"), 280);
}
function cascade(d) {
  const now = performance.now(); if (now - d.last < 1100 || !AR.done && AR.on && !d.el.classList.contains("in")) return; d.last = now;
  d.token = (d.token || 0) + 1; const tk = d.token, studio = d.id === "studio";
  const seq = studio ? SONGSEQ.map(n => d.cells.find(c => c.id === "notes:" + n)).filter(Boolean) : d.cells.slice().sort((a, b) => a.dist - b.dist);
  seq.forEach((c, i) => setTimeout(() => { if (d.token === tk) fire(c, studio ? .8 : .5); }, i * (studio ? 280 : 80)));
  const [dx, dy] = [d.px, d.py]; ring(dx, dy, d.rgb, 190, 1500);
}

/* ---------- 30 alphabet slots: Ganymede is learning to speak. His own marks first, the real letters as he is taught ---------- */
const ALPHA = { lang: "en", slots: 30, letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ.,?!".split("") };
const GAN = { taught: {}, seen: {}, save() { try { localStorage.setItem("gan.v1", JSON.stringify({ taught: this.taught, seen: this.seen })); } catch (e) {} }, load() { try { const o = JSON.parse(localStorage.getItem("gan.v1") || "{}"); this.taught = o.taught || {}; this.seen = o.seen || {}; } catch (e) {} } };
GAN.load();
const _lb = document.createElement("canvas"); _lb.width = _lb.height = 8;
function letterBits(ch) { const x = _lb.getContext("2d", { willReadFrequently: true }); x.clearRect(0, 0, 8, 8); x.fillStyle = "#000"; x.font = "bold 9px monospace"; x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillText(ch, 4, 7.5); const d = x.getImageData(0, 0, 8, 8).data, r = []; for (let i = 0; i < 64; i++) r.push(d[i * 4 + 3] > 110); return r; }
const slotsEl = $("slots"), SLOTS = [];
function taughtCount() { return ALPHA.letters.filter(l => (GAN.taught[l] || 0) >= 3).length; }
function alphaLabel() { const n = taughtCount(); $("alab").textContent = "ALPHA · 30 SLOTS · " + (n >= 26 ? "LANG EN" : n ? n + " TAUGHT · LANG ??" : "LANG ??"); }
for (let i = 0; i < ALPHA.slots; i++) {
  const s = document.createElement("span"); s.className = "slot"; s.style.animationDelay = (-hash2(i, 77) * 3.7).toFixed(2) + "s"; s.style.animationDuration = (2.6 + hash2(i, 78) * 3).toFixed(2) + "s";
  const cv = document.createElement("canvas"); cv.width = cv.height = 8; s.appendChild(cv); slotsEl.appendChild(s); SLOTS.push({ cv, el: s, seed: i * 13 + 1, ch: ALPHA.letters[i], bits: letterBits(ALPHA.letters[i]) });
  s.addEventListener("pointerenter", e => { if (e.pointerType === "touch") return; wake(); slotBlip(i, s); });
  s.addEventListener("pointerdown", e => { wake(); teach(i); });
}
function slotDraw(S) {
  const x = S.cv.getContext("2d"), lv = GAN.taught[S.ch] || 0; x.clearRect(0, 0, 8, 8); S.seed++;
  S.el.style.animationPlayState = lv >= 3 ? "paused" : "running"; S.el.style.opacity = lv >= 3 ? 1 : "";
  for (let y = 0; y < 8; y++) {
    let bits = 0; for (let k = 0; k < 8; k++) if (hash2(S.seed, y * 8 + k) < .42) bits |= 1 << k;
    const r = hash2(S.seed, 900 + y); if (r < .16) bits = 0; else if (r < .24) bits = 255; else if (r < .42) bits = ((bits << 2) | (bits >> 6)) & 255;
    for (let k = 0; k < 8; k++) {
      const real = S.bits[y * 8 + k], pick = lv >= 3 ? 1 : hash2(S.seed, 300 + y * 8 + k) < lv * .3;
      if (pick ? real : (bits & (1 << k)) && lv < 3) { x.fillStyle = lv >= 3 ? "#ffd36b" : pick ? "#ffd36b" : hash2(S.seed, 400 + y * 8 + k) < .07 ? "#ff8a28" : hash2(S.seed, 700 + k) < .5 ? "#5f6f95" : "#8ea0c8"; x.fillRect(k, y, 1, 1); }
    }
  }
}
function teach(i) {
  const S = SLOTS[i], ch = S.ch; GAN.taught[ch] = Math.min(3, (GAN.taught[ch] || 0) + 1); GAN.save(); slotBlip(i, S.el); alphaLabel();
  const r = S.el.getBoundingClientRect(), w = worldEl.getBoundingClientRect(); ring(r.left - w.left + r.width / 2, r.top - w.top + r.height / 2, "255,211,107", 120, 1200);
  if (GAN.taught[ch] >= 3) playGlyph("stars:u2606", { vol: .7, x: (r.left + r.width / 2) / innerWidth });
}
SLOTS.forEach(slotDraw); alphaLabel();
if (!reduce) setInterval(() => { if (body.classList.contains("inroom")) return; for (let n = 0; n < 3; n++) slotDraw(SLOTS[Math.floor(Math.random() * SLOTS.length)]); }, 420);
function slotBlip(i, el) {
  if (SND.on && SND.ctx) {
    const c = SND.ctx, t = c.currentTime + .01, o = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.setValueAtTime(160 + i * 21 + hash2(i, 5) * 40, t); o.frequency.exponentialRampToValueAtTime(90 + i * 9, t + .14);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + .16);
    const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 900; o.connect(f); f.connect(g); g.connect(SND.master); g.connect(SND.send); o.start(t); o.stop(t + .2);
  }
  const r = el.getBoundingClientRect(), w = worldEl.getBoundingClientRect(); ring(r.left - w.left + r.width / 2, r.top - w.top + r.height / 2, "255,138,40", 46, 700);
  slotDraw(SLOTS[i]);
}

/* ---------- the strip under the moon: the six stages, the arrows, the seal ---------- */
const stripEl = $("strip"), STRIP = { stages: [], arrows: [], seal: null };
(function () {
  LUN.stages.forEach((s, i) => {
    if (i) { const a = iconCanvas(LUN.head.arrow, "violet"); a.className = "arrow"; stripEl.appendChild(a); STRIP.arrows.push(a); }
    const c = iconCanvas(s.glyph, "orange"); c.title = s.role || ""; stripEl.appendChild(c); STRIP.stages.push(c);
  });
  const sp = document.createElement("i"); sp.style.width = "8px"; stripEl.appendChild(sp);
  STRIP.seal = iconCanvas(LUN.head.seal, "gold"); stripEl.appendChild(STRIP.seal);
})();
let hlUntil = 0, hlSpec = null;
function routeShow(r) { hlSpec = { stage: r.stage || 0, arrow: /arrow/.test(r.txt), seal: /seal/.test(r.txt) }; hlUntil = performance.now() + 7000; }
function stripState(dlP) {
  const hl = performance.now() < hlUntil ? hlSpec : null, n = STRIP.stages.length;
  STRIP.stages.forEach((c, i) => { c.classList.toggle("on", dlP >= (i + .6) / (n + 1)); c.classList.toggle("hl", !!hl && hl.stage === i + 1); });
  STRIP.arrows.forEach(c => { c.classList.toggle("on", dlP >= (STRIP.arrows.indexOf(c) + 1.2) / (n + 1)); c.classList.toggle("hl", !!hl && hl.arrow); });
  STRIP.seal.classList.toggle("on", dlP >= 1); STRIP.seal.classList.toggle("hl", !!hl && hl.seal);
}

/* ---------- layout ---------- */
function layoutWorld() {
  const w = worldEl.clientWidth, h = worldEl.clientHeight; if (!w || !h) return;
  WD.w = w; WD.h = h; WD.DPR = Math.min(window.devicePixelRatio || 1, 2); WD.oy = worldEl.getBoundingClientRect().top;
  wc.width = Math.round(w * WD.DPR); wc.height = Math.round(h * WD.DPR);
  const phone = w < 700; WD.cx = w / 2; WD.cy = h / 2;
  const R0 = clamp(Math.min(w, h) * .135, 56, 150); WD.MK = Math.max(2, Math.round(R0 * 2 / 150)); WD.MNp = Math.round(R0 * 2 / WD.MK); WD.R = WD.MNp * WD.MK / 2;
  const fd = Math.min(WD.DPR, 1.5); fieldCv.width = Math.round(innerWidth * fd); fieldCv.height = Math.round(innerHeight * fd);
  bloomCv.width = Math.max(1, fieldCv.width >> 2); bloomCv.height = Math.max(1, fieldCv.height >> 2);
  const rx = w * (phone ? .36 : .33), ry = h * (phone ? .34 : .335), dw = clamp(w * .085, 80, 122), Hd = dw * 1.35 + 36;
  DOORS.forEach(d => {
    const a = d.ang * Math.PI / 180; d.px = clamp(WD.cx + Math.cos(a) * rx, dw / 2 + 6, w - dw / 2 - 6); d.py = clamp(WD.cy + Math.sin(a) * ry, Hd / 2 + 6, h - 66 - Hd / 2);
    d.el.style.left = d.px + "px"; d.el.style.top = d.py + "px"; d.el.style.width = dw + "px";
  });
  stripEl.style.left = WD.cx + "px"; stripEl.style.top = (WD.cy + WD.R + 16) + "px";
  const hn = $("hint"); hn.style.top = (WD.cy + WD.R + 92) + "px"; hn.style.bottom = "auto"; hn.style.left = "50%"; hn.style.transform = "translateX(-50%)"; hn.style.width = Math.min(300, w - 20) + "px";
  const ro = $("readout"); ro.style.top = (WD.cy + WD.R + 50) + "px"; ro.style.left = "50%"; ro.style.transform = "translateX(-50%)"; ro.style.width = Math.min(360, w - 20) + "px"; ro.style.whiteSpace = "normal";
}
addEventListener("resize", () => { clearTimeout(window.__rzw); window.__rzw = setTimeout(() => { layoutWorld(); if (curRoom === "studio") stFit(); }, 120); });

/* ---------- the arrival: download into the moon, upload out of it, doors appear ---------- */
let roText = "";
function readout(s) { if (s !== roText) { roText = s; $("readout").innerHTML = s; } }
function startArrival() {
  AR.on = true; AR.done = false; AR.t0 = performance.now(); PART.length = 0; FLASH.length = 0; upSounded = false;
  DOORS.forEach(d => d.el.classList.remove("in")); $("hint").classList.remove("on");
  if (reduce) finishArrival();
}
let upSounded = false;
function finishArrival() {
  AR.on = false; AR.done = true; DOORS.forEach(d => d.el.classList.add("in"));
  readout("<b>5 PORTALS OPEN</b><br>hover a door to hear its glyphs");
  setTimeout(() => { if (!SND.ctx && !curRoom) $("hint").classList.add("on"); }, 1200);
}
function spawn() {
  const Rs = Math.hypot(WD.w, WD.h) * .56, a = -Math.PI / 2 + (Math.random() - .5) * 2.7;
  PART.push({ a, r: Rs * (.82 + Math.random() * .22), Rs, tw: (Math.random() - .5) * 1.1, sp: .42 + Math.random() * .5, g: GL_ORDER[Math.floor(Math.random() * GL_ORDER.length)], col: ["violet", "eblue", "leaf", "foam"][Math.floor(Math.random() * 4)] });
}
let lastNow = performance.now(), spawnAcc = 0;
function drawWorld(now) {
  const w = WD.w, h = WD.h; if (!w) return;
  const dt = Math.min(.05, (now - lastNow) / 1000); lastNow = now;
  const t = (now - t0) / 1000, ts = AR.done ? 99 : (now - AR.t0) / 1000;
  if (AR.on && ts >= END) finishArrival();
  const dlP = clamp((ts - DL0) / (DL1 - DL0), 0, 1), ulP = clamp((ts - UL0) / (UL1 - UL0), 0, 1);
  const I = reduce ? 1 : AR.done ? 1 : .35 + .65 * sm(.2, 6, ts);
  const upB = ts > UL0 && ts < UL1 + 1.2 ? Math.sin(Math.PI * clamp((ts - UL0) / (UL1 + 1.2 - UL0), 0, 1)) : 0;
  const boost = 1 + 1.2 * Math.exp(-(t - kick) * 1.2) + .9 * upB;
  const T = (reduce ? 0 : t * F.speed) + .37;
  if (!WD.drag) { WD.spinOff += WD.vel * .016; WD.vel *= .96; }
  const spin = (reduce ? 0 : t * .026) + WD.spinOff, cx = WD.cx, cy = WD.cy, R = WD.R;

  /* the room: the tessellation flows out of the moon */
  const fd = Math.min(WD.DPR, 1.5);
  fctx.setTransform(fd, 0, 0, fd, 0, 0); fctx.clearRect(0, 0, innerWidth, innerHeight);
  drawField(fctx, fd, innerWidth, innerHeight, cx, cy + WD.oy, R * 1.06, Math.hypot(innerWidth, innerHeight) * .78, T, .22 * I * boost, t, !reduce);
  bctx.clearRect(0, 0, bloomCv.width, bloomCv.height); bctx.drawImage(fieldCv, 0, 0, bloomCv.width, bloomCv.height);

  /* the world canvas */
  const x = wx; x.setTransform(WD.DPR, 0, 0, WD.DPR, 0, 0); x.clearRect(0, 0, w, h);
  const appear = AR.done ? 1 : sm(0, .8, ts);
  const gl = x.createRadialGradient(cx - R * .2, cy - R * .2, R * .5, cx, cy, R * (1.8 + upB * .8));
  gl.addColorStop(0, "rgba(255,170,90," + (.22 + .3 * upB) + ")"); gl.addColorStop(.45, "rgba(255,138,40,.05)"); gl.addColorStop(1, "rgba(255,138,40,0)");
  x.globalCompositeOperation = "lighter"; x.fillStyle = gl; x.fillRect(0, 0, w, h); x.globalCompositeOperation = "source-over";
  const mb = renderMoon(WD.MNp, spin, -.22); x.imageSmoothingEnabled = false;
  x.globalAlpha = appear; x.drawImage(mb, cx - R, cy - R, R * 2, R * 2); x.globalAlpha = 1;
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, TAU); x.clip(); drawDisc(x, cx, cy, R, 1, t, .5 * I, 21); x.restore();
  x.strokeStyle = "rgba(255,200,130,.16)"; x.lineWidth = 1; x.beginPath(); x.arc(cx, cy, R + .5, 0, TAU); x.stroke();

  /* download: glyphs fall out of the sky into the moon */
  if (AR.on && ts > DL0 && ts < DL1 && !reduce) { spawnAcc += dt * (16 + 70 * dlP); while (spawnAcc >= 1 && PART.length < 240) { spawn(); spawnAcc -= 1; } spawnAcc = Math.min(spawnAcc, 4); }
  for (let i = PART.length - 1; i >= 0; i--) {
    const p = PART[i]; p.r -= ((p.r - R) * p.sp + 70) * dt;
    if (p.r <= R * 1.03) { const ang = p.a + p.tw * (1 - R / p.Rs); FLASH.push({ x: cx + Math.cos(ang) * R, y: cy + Math.sin(ang) * R, t: now }); PART.splice(i, 1); continue; }
    const k = 1 - (p.r - R) / (p.Rs - R), ang = p.a + p.tw * k, px = cx + Math.cos(ang) * p.r, py = cy + Math.sin(ang) * p.r, s = 12 + 12 * k;
    x.globalAlpha = .25 + .75 * k; x.drawImage(stBmp(p.g, p.col), px - s / 2, py - s / 2, s, s);
    x.globalAlpha = .12 * k; x.drawImage(stBmp(p.g, p.col), cx + Math.cos(ang) * (p.r + 22) - s / 2, cy + Math.sin(ang) * (p.r + 22) - s / 2, s, s);
  }
  x.globalAlpha = 1;
  for (let i = FLASH.length - 1; i >= 0; i--) { const f = FLASH[i], a = (now - f.t) / 380; if (a >= 1) { FLASH.splice(i, 1); continue; } x.fillStyle = "rgba(255,236,160," + (.7 * (1 - a)) + ")"; x.beginPath(); x.arc(f.x, f.y, 3 + 9 * a, 0, TAU); x.fill(); }
  if (AR.on && ts > DL0 && ts < UL0 + .6) {
    x.lineWidth = 2; x.strokeStyle = "rgba(255,211,107,.9)"; x.beginPath(); x.arc(cx, cy, R + 12, -Math.PI / 2, -Math.PI / 2 + dlP * TAU); x.stroke();
    x.strokeStyle = "rgba(255,211,107,.18)"; x.setLineDash([2, 5]); x.beginPath(); x.arc(cx, cy, R + 12, 0, TAU); x.stroke(); x.setLineDash([]);
  }

  /* upload: the moon takes it in, and sends it out as itself */
  if (AR.on) {
    for (let k = 0; k < 3; k++) {
      const ph = ts - (UL0 + k * .6); if (ph <= 0 || ph > 1.8) continue;
      const rr = R * 1.1 + ph * Math.max(w, h) * .36, a = (1 - ph / 1.8) * .75;
      x.setLineDash([2, 7]); x.lineWidth = 2; x.strokeStyle = k === 1 ? "rgba(168,214,120," + a + ")" : k === 2 ? "rgba(200,240,255," + a + ")" : "rgba(205,176,255," + a + ")";
      x.beginPath(); x.arc(cx, cy, rr, 0, TAU); x.stroke(); x.setLineDash([]);
    }
    if (ts > UL0 && !upSounded) { upSounded = true; ["core:u2609", "stars:u2606", "signals:u22cb"].forEach((id, i) => setTimeout(() => playGlyph(id, { vol: .8 }), i * 260)); }
  }

  /* the beams to the doors, then a quiet pulse that never stops */
  DOORS.forEach((d, i) => {
    const pr = AR.done ? 1 : clamp((ts - (DR0 + i * .45)) / .8, 0, 1); if (pr <= 0) return;
    const ux = d.px - cx, uy = d.py - cy, L = Math.hypot(ux, uy), nx = ux / L, ny = uy / L, sx = cx + nx * R * 1.1, sy = cy + ny * R * 1.1;
    const ex = sx + (d.px - nx * 30 - sx) * pr, ey = sy + (d.py - ny * 30 - sy) * pr;
    x.setLineDash([3, 7]); x.lineDashOffset = -t * 26; x.lineWidth = 1; x.strokeStyle = "rgba(" + d.rgb + "," + (.12 + .22 * pr) + ")"; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke(); x.setLineDash([]); x.lineDashOffset = 0;
    if (pr >= 1 && !reduce) { const f = ((t * .22 + i * .19) % 1), bx = sx + (d.px - nx * 30 - sx) * f, by = sy + (d.py - ny * 30 - sy) * f; x.fillStyle = "rgba(" + d.rgb + "," + (.75 * Math.sin(Math.PI * f)) + ")"; x.beginPath(); x.arc(bx, by, 2.4, 0, TAU); x.fill(); }
    if (AR.on && !d.el.classList.contains("in") && ts >= DR0 + i * .45 + .3) { d.el.classList.add("in"); ring(d.px, d.py, d.rgb, 160, 1100); playGlyph(d.cells[4].id, { x: d.px / w, vol: .6 }); }
  });

  /* rings that radiate from every glyph that sounds */
  for (let i = RINGS.length - 1; i >= 0; i--) {
    const r = RINGS[i], a = (now - r.t) / r.dur; if (a >= 1) { RINGS.splice(i, 1); continue; }
    x.strokeStyle = "rgba(" + r.rgb + "," + (.7 * (1 - a) * (1 - a)) + ")"; x.lineWidth = 1.6; x.beginPath(); x.arc(r.x, r.y, 6 + r.max * Math.sqrt(a), 0, TAU); x.stroke();
  }

  /* strip and words */
  stripState(AR.done ? 1 : dlP);
  if (AR.on) {
    const si = Math.min(LUN.stages.length - 1, Math.floor(dlP * LUN.stages.length));
    if (ts < DL0) readout("LINK · JUPITER III<br>standing by");
    else if (ts < UL0) readout("<b>DOWNLOAD</b> " + String(Math.round(dlP * 100)).padStart(3, "0") + "%<br>" + (LUN.stages[si].role || "stage " + (si + 1)));
    else if (ts < DR0) readout("<b>UPLOAD</b> " + String(Math.round(ulP * 100)).padStart(3, "0") + "%<br>the moon takes it into itself");
    else readout("<b>THE MOON OPENS DOORS</b><br>" + DOORS.filter(d => d.el.classList.contains("in")).length + " of 5");
  }

  /* the door glyphs are alive */
  if (!reduce) DOORS.forEach(d => {
    const hot = d.el.matches(":hover") || d.el === document.activeElement;
    d.cells.forEach(c => {
      if (d.id !== "studio" && t > c.next) { c.next = t + 2.5 + Math.random() * 5; c.id = d.poolIds[Math.floor(Math.random() * d.poolIds.length)]; drawCell(c); }
      c.cv.style.opacity = (.4 + .6 * (.5 + .5 * Math.sin(t * c.sp * (hot ? 3 : 1.2) + c.ph + (hot ? c.dist : 0)))).toFixed(2);
    });
  });
}
(function loop(now) { requestAnimationFrame(loop); if (!body.classList.contains("inroom")) drawWorld(now); })(performance.now());

/* the moon can be turned, and a tap on the sky skips the arrival */
worldEl.addEventListener("pointerdown", e => {
  if (AR.on && !e.target.closest("button")) finishArrival();
  if (e.target.closest(".door,#alpha")) return;
  const r = worldEl.getBoundingClientRect();
  if (Math.hypot(e.clientX - r.left - WD.cx, e.clientY - r.top - WD.cy) < WD.R * 1.2) { WD.drag = true; WD.lastX = e.clientX; WD.vel = 0; try { worldEl.setPointerCapture(e.pointerId); } catch (er) {} }
});
worldEl.addEventListener("pointermove", e => { if (!WD.drag) return; const dx = e.clientX - WD.lastX; WD.lastX = e.clientX; WD.spinOff += dx * .008; WD.vel = dx * .008 / .016 * .5; });
const endSpin = () => { WD.drag = false; }; worldEl.addEventListener("pointerup", endSpin); worldEl.addEventListener("pointercancel", endSpin);

/* ---------- rooms: fixed size, always centred ---------- */
const ROOM = { river: $("roomRiver"), site: $("roomSite"), studio: $("roomStudio") };
let curRoom = null, termLoaded = false, siteLoaded = false;
function openRoom(name, arg) {
  GAN.seen[name === "site" ? arg || "site" : name] = (GAN.seen[name === "site" ? arg || "site" : name] || 0) + 1; GAN.save();
  if (AR.on) finishArrival();
  if (curRoom && curRoom !== name) { ROOM[curRoom].classList.remove("open", "show"); }
  curRoom = name; const el = ROOM[name]; el.classList.add("show"); body.classList.add("inroom"); void el.offsetWidth; el.classList.add("open");
  if (name === "river") loadTerm(); else if (name === "site") loadSite(arg); else if (name === "studio") { stFit(); stSync(); }
}
function closeRoom() { if (!curRoom) return; ROOM[curRoom].classList.remove("open", "show"); curRoom = null; body.classList.remove("inroom"); layoutWorld(); }
function enterDoor(id) { if (id === "river") openRoom("river"); else if (id === "studio") openRoom("studio"); else openRoom("site", id); }
function loadTerm() {
  if (!termLoaded) {
    termLoaded = true; term.name = "river-world";
    term.srcdoc = new TextDecoder("utf-8").decode(Uint8Array.from(atob($("termdata").textContent.trim()), c => c.charCodeAt(0)));
    term.addEventListener("load", () => { try { term.contentWindow.focus(); } catch (e) {} }, { once: true });
  } else { try { term.contentWindow.focus(); term.contentWindow.postMessage({ tesela: "enter" }, "*"); } catch (e) {} }
}
let siteReady = false, siteHtml = "";
function siteInject(go) {
  const inj = "<script>(function(){window.__go=" + JSON.stringify(go || "") + ';function r(){dispatchEvent(new Event("hashchange"))}'
    + 'addEventListener("message",function(e){if(e.data&&typeof e.data.go==="string"){window.__go=e.data.go;r()}});'
    + 'document.addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest(\'a[href^="#"]\');if(a){e.preventDefault();window.__go=a.getAttribute("href").slice(1);r()}},true);'
    + 'addEventListener("load",function(){try{parent.postMessage({site:"ready"},"*")}catch(x){}})})()<\/script>';
  return siteHtml.replace("<head>", '<head><base href="about:srcdoc">' + inj)
    .replace("const h = location.hash.slice(1),", "const h = (window.__go !== undefined ? window.__go : location.hash.slice(1)),")
    .replace("location.hash = d === 'home' ? '' : d;", "window.__go = d === 'home' ? '' : d; dispatchEvent(new Event('hashchange'));");
}
function loadSite(go) {
  const f = $("siteFrame");
  if (!siteLoaded) {
    siteLoaded = true; siteReady = false;
    siteHtml = new TextDecoder("utf-8").decode(Uint8Array.from(atob($("sitedata").textContent.trim()), c => c.charCodeAt(0)));
    f.srcdoc = siteInject(go);
    setTimeout(() => { if (!siteReady) { try { f.removeAttribute("srcdoc"); f.src = URL.createObjectURL(new Blob([siteInject(go)], { type: "text/html" })); } catch (e) {} } }, 2600);
  } else if (go) { try { f.contentWindow.postMessage({ go }, "*"); } catch (e) {} }
}
addEventListener("message", e => { if (e.data && e.data.site === "ready") siteReady = true; });
document.querySelectorAll("[data-back]").forEach(b => b.addEventListener("click", closeRoom));
document.querySelectorAll("#qlinks [data-go]").forEach(b => b.addEventListener("click", () => enterDoor(b.dataset.go)));
addEventListener("keydown", e => {
  if (e.key === "Escape") { if (curRoom === "studio" && ST.sel >= 0) return; if (curRoom) { closeRoom(); e.preventDefault(); } else if (AR.on) finishArrival(); }
  else if (!curRoom && !AR.on && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) { const i = ALPHA.letters.indexOf(e.key.toUpperCase()); if (i >= 0) teach(i); }
  else if (AR.on && (e.key === "Enter" || e.key === " ") && document.activeElement === body) finishArrival();
}, true);
$("btnSkip").addEventListener("click", () => { if (AR.on) finishArrival(); else if (curRoom) closeRoom(); });
$("btnReplay").addEventListener("click", () => { closeRoom(); startArrival(); });
$("btnSnd").addEventListener("click", () => { SND.on = !SND.on; $("btnSnd").setAttribute("aria-pressed", String(SND.on)); if (SND.on) wake(); });

/* messages from the River terminal */
addEventListener("message", e => {
  if (e.source !== term.contentWindow || !e.data || !e.data.tesela) return; const m = e.data.tesela;
  if (m === "replay") { closeRoom(); startArrival(); }
  else if (m === "moon") { closeRoom(); kick = (performance.now() - t0) / 1000; }
  else if (m === "studio" || m === "song") { openRoom("studio"); if (m === "song") roverSong(); }
  else if (m === "site") openRoom("site");
});

/* the song shows on the stage: the V02 note glyphs */
(function () {
  const row = $("noteRow"), ids = GL_ALL.filter(id => id.startsWith("notes:"));
  window.__notes = ids.map(id => { const c = iconCanvas(id, "gold"); c.className = "nt"; c.title = id.split(":")[1]; c.dataset.n = id.split(":")[1]; row.appendChild(c); return c; });
})();
function noteShow(n) {
  const big = $("noteGl").getContext("2d"); big.clearRect(0, 0, 16, 16);
  (window.__notes || []).forEach(c => c.classList.toggle("on", c.dataset.n === n));
  if (n) big.drawImage(stBmp("notes:" + n, "gold"), 0, 0);
  $("noteCap").textContent = n ? n + " · " + (HZ[n] ? HZ[n].toFixed(1) + " Hz" : "") : "SONG";
}

/* ---------- power on ---------- */
layoutWorld(); setTimeout(layoutWorld, 200); setTimeout(layoutWorld, 800);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutWorld);
function applyHash() {
  const h = (location.hash || "").slice(1);
  if (["river", "studio", "site", "engine", "terminal", "case"].includes(h)) { AR.done = true; AR.on = false; DOORS.forEach(d => d.el.classList.add("in")); readout("<b>5 PORTALS OPEN</b><br>hover a door to hear its glyphs"); enterDoor(h === "site" ? "engine" : h); return true; }
  if (h === "world" || h === "splash") { AR.done = true; DOORS.forEach(d => d.el.classList.add("in")); readout("<b>5 PORTALS OPEN</b><br>hover a door to hear its glyphs"); return true; }
  return false;
}
if (!applyHash()) startArrival();
addEventListener("hashchange", () => { applyHash(); });
window.__RINGS = RINGS; window.__SND = SND; window.__WD = WD; window.__ST = ST; window.__open = openRoom; window.__AR = AR;
