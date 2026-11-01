/* ---------- Ganymede's glyphs: sight <-> sound <-> music ---------- */
const GLY = /*GLYPHS*/[];
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
  const T = TIMBRE[id.split(":")[0]] || TIMBRE.def; let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return T.base * Math.pow(2, PENTA[h % PENTA.length] / 12);
}
const pop16 = v => { v = v - ((v >> 1) & 0x5555); v = (v & 0x3333) + ((v >> 2) & 0x3333); v = (v + (v >> 4)) & 0x0f0f; return (v + (v >> 8)) & 0x1f; };
const GL = GLY.map(([id, hex]) => { const rows = new Uint16Array(16); let ink = 0; for (let r = 0; r < 16; r++) { rows[r] = parseInt(hex.substr(r * 4, 4), 16); ink += pop16(rows[r]); } return { id, rows, ink }; });
const GL_BY_INK = GL.map((g, i) => i).sort((a, b) => GL[a].ink - GL[b].ink);

/* a tile of the picture -> the glyph it most resembles */
function matchTile(data, n, tx, ty) {
  const ts = n / 16, vals = new Uint8Array(256); let sum = 0;
  for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
    const px = Math.min(n - 1, Math.floor(tx * ts + (i + .5) * ts / 16)), py = Math.min(n - 1, Math.floor(ty * ts + (j + .5) * ts / 16));
    const v = data[py * n + px]; vals[j * 16 + i] = v; sum += v;
  }
  const mean = sum / 256; let varc = 0; for (let k = 0; k < 256; k++) { const d = vals[k] - mean; varc += d * d; } const sd = Math.sqrt(varc / 256);
  if (mean < 36) return { g: -1, vol: 0 };
  const vol = Math.min(1, 0.25 + mean / 255 * 0.75);
  if (sd < 14 || !GL.length) { const want = Math.max(0, Math.min(1, (mean - 40) / 200)) * 0.75 * 256; let best = GL_BY_INK[0]; for (const i of GL_BY_INK) { if (GL[i].ink >= want) { best = i; break; } best = i; } return { g: best, vol }; }
  const bits = new Uint16Array(16);
  for (let j = 0; j < 16; j++) { let r = 0; for (let i = 0; i < 16; i++) if (vals[j * 16 + i] > mean) r |= 1 << (15 - i); bits[j] = r; }
  let bg = 0, bd = 1e9;
  for (let gi = 0; gi < GL.length; gi++) { const rows = GL[gi].rows; let d = 0; for (let j = 0; j < 16; j++) d += pop16(bits[j] ^ rows[j]); if (d < bd) { bd = d; bg = gi; } }
  return { g: bg, vol };
}
function glyphGrid(data, n) { const g = []; for (let ty = 0; ty < 16; ty++) for (let tx = 0; tx < 16; tx++) g.push(matchTile(data, n, tx, ty)); return g; }

/* the Shell's voices */
const MU = { ctx: null, master: null, send: null, tok: 0, on: false };
function muWake() {
  const c = audioCtx(); if (MU.ctx === c) return; MU.ctx = c;
  MU.master = c.createGain(); MU.master.gain.value = .9; MU.master.connect(c.destination);
  MU.send = c.createGain(); MU.send.gain.value = .32;
  const dl = c.createDelay(1), fb = c.createGain(), lp = c.createBiquadFilter(); dl.delayTime.value = .21; fb.gain.value = .4; lp.type = "lowpass"; lp.frequency.value = 2200;
  MU.send.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(MU.master);
}
function noteAt(id, when, vol, pan) {
  const c = MU.ctx, T = TIMBRE[id.split(":")[0]] || TIMBRE.def, hz = glyphHz(id), t = when, v = vol * (T.g || 1), dur = T.dur;
  const g = c.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.0002, v * .2), t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  let head = g; if (T.lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = T.lp; f.connect(g); head = f; }
  const voice = (type, f0, amp) => {
    const os = c.createOscillator(); os.type = type; os.frequency.setValueAtTime(f0, t); if (T.gl) os.frequency.exponentialRampToValueAtTime(f0 * .7, t + dur);
    if (T.vib) { const lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = T.vib; lg.gain.value = f0 * .012; lf.connect(lg); lg.connect(os.frequency); lf.start(t); lf.stop(t + dur + .05); }
    const a = c.createGain(); a.gain.value = amp; os.connect(a); a.connect(head); os.start(t); os.stop(t + dur + .05);
  };
  voice(T.t, hz, 1); if (T.part) voice("sine", hz * T.part, .35);
  let out = g; if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan || 0)); g.connect(p); out = p; }
  out.connect(MU.master); out.connect(MU.send);
}
function playRow(cells) {
  muWake(); const c = MU.ctx;
  cells.forEach((cell, i) => { if (cell && cell.g >= 0) noteAt(GL[cell.g].id, c.currentTime + 0.03 + i * 0.07, cell.vol * 0.6, (i / 15 - .5) * 1.4); });
}
function playGrid(grid, done) {
  muWake(); const tok = ++MU.tok; let r = 0;
  const step = () => { if (MU.tok !== tok) return; if (r >= 16) { done && done(); return; } playRow(grid.slice(r * 16, r * 16 + 16)); r++; setTimeout(step, 1250); };
  step();
}
function hush() { MU.tok++; }
function drawGlyphEye(grid) {
  const c = $("outCanvas"), x = c.getContext("2d"); c.width = c.height = 256; x.fillStyle = "#050302"; x.fillRect(0, 0, 256, 256);
  const im = x.createImageData(256, 256), d = im.data;
  for (let ty = 0; ty < 16; ty++) for (let tx = 0; tx < 16; tx++) {
    const cell = grid[ty * 16 + tx]; if (!cell || cell.g < 0) continue; const rows = GL[cell.g].rows, k = 0.35 + cell.vol * 0.65;
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) if (rows[j] & (1 << (15 - i))) { const o = ((ty * 16 + j) * 256 + tx * 16 + i) * 4; d[o] = 255 * k; d[o + 1] = 178 * k; d[o + 2] = 62 * k; d[o + 3] = 255; }
  }
  x.putImageData(im, 0, 0);
}
