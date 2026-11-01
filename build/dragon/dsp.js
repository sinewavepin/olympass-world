"use strict";
const $ = id => document.getElementById(id);
const F_SYNC = 1200, F_BLACK = 1500, F_WHITE = 2300, F_MID = 1900;
const MODES = {
  fine: { name: "fine", n: 256, px: 0.001, sync: 0.020 },
  fast: { name: "fast", n: 128, px: 0.002, sync: 0.040 },
  chroma: { name: "chroma", n: 64, px: 0.004, sync: 0.030 }
};
const LEAD = 0.6, HDR_PRE = 0.05, HDR_SYM = 0.025, HDR_N = 19, HDR_POST = 0.05, HDR_F0 = 2700, HDR_DF = 100, TAIL = 0.4;
const GAPT = HDR_PRE + HDR_N * HDR_SYM + HDR_POST;
const periodOf = M => M.sync + M.n * M.px;

/* ---------- header: plane + time stamp, spoken as 19 short tones ---------- */
function headerNibbles(plane, stamp) {
  const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, stamp);
  const nib = [plane & 15];
  for (let i = 0; i < 8; i++) { const b = dv.getUint8(i); nib.push(b >> 4, b & 15); }
  let s = 0; nib.forEach(v => s += v); s &= 255; nib.push(s >> 4, s & 15);
  return nib;
}
function parseHeader(nib) {
  if (nib.length !== HDR_N || nib.some(v => v < 0)) return null;
  let s = 0; for (let i = 0; i < 17; i++) s += nib[i];
  if ((s & 255) !== nib[17] * 16 + nib[18]) return null;
  const dv = new DataView(new ArrayBuffer(8));
  for (let i = 0; i < 8; i++) dv.setUint8(i, nib[1 + i * 2] * 16 + nib[2 + i * 2]);
  const stamp = dv.getFloat64(0);
  return { plane: nib[0], stamp: isFinite(stamp) ? stamp : null };
}
function goertzelPow(buf, a, len, f, fs) {
  const c = 2 * Math.cos(2 * Math.PI * f / fs); let s1 = 0, s2 = 0;
  for (let k = 0; k < len; k++) { const x = buf[a + k] * (0.5 - 0.5 * Math.cos(2 * Math.PI * k / (len - 1))); const s0 = x + c * s1 - s2; s2 = s1; s1 = s0; }
  return s1 * s1 + s2 * s2 - c * s1 * s2;
}

/* ---------- the signal ---------- */
function synthPlane(grey, M, fs, plane, stamp) {
  const lineS = periodOf(M), total = LEAD + GAPT + M.n * lineS + TAIL;
  const out = new Float32Array(Math.ceil(total * fs) + 8);
  let ph = 0, i = 0;
  const put = (f, secs) => { const cnt = Math.round(secs * fs), w = 2 * Math.PI * f / fs; for (let k = 0; k < cnt && i < out.length; k++) { ph += w; out[i++] = 0.8 * Math.sin(ph); } };
  const gap = secs => { i += Math.round(secs * fs); };
  put(F_SYNC, LEAD); gap(HDR_PRE);
  headerNibbles(plane, stamp).forEach(v => put(HDR_F0 + v * HDR_DF, HDR_SYM));
  gap(HDR_POST);
  for (let y = 0; y < M.n; y++) {
    put(F_SYNC, M.sync);
    for (let x = 0; x < M.n; x++) put(F_BLACK + (grey[y * M.n + x] / 255) * (F_WHITE - F_BLACK), M.px);
  }
  const fade = Math.round(fs * 0.004);
  for (let k = 0; k < fade; k++) out[k] *= k / fade;
  return { data: out, seconds: total };
}
function wavBlob(samples, fs) {
  const n = samples.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b);
  const s = (o, t) => { for (let k = 0; k < t.length; k++) v.setUint8(o + k, t.charCodeAt(k)); };
  s(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); s(8, "WAVE"); s(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, fs, true); v.setUint32(28, fs * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, "data"); v.setUint32(40, n * 2, true);
  for (let k = 0; k < n; k++) v.setInt16(44 + k * 2, Math.max(-1, Math.min(1, samples[k])) * 32767, true);
  return new Blob([b], { type: "audio/wav" });
}

/* ---------- picture -> planes ---------- */
function planesOf(srcCanvas, n, colour) {
  const grab = size => { const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high"; x.drawImage(srcCanvas, 0, 0, size, size); return x.getImageData(0, 0, size, size).data; };
  const d = grab(n), y = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i++) y[i] = Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]);
  const res = { y };
  if (colour) {
    const e = grab(64), cb = new Uint8Array(4096), cr = new Uint8Array(4096), cl = v => v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
    for (let i = 0; i < 4096; i++) { const r = e[i * 4], g = e[i * 4 + 1], b = e[i * 4 + 2]; cb[i] = cl(128 - 0.168736 * r - 0.331264 * g + 0.5 * b); cr[i] = cl(128 + 0.5 * r - 0.418688 * g - 0.081312 * b); }
    res.cb = cb; res.cr = cr;
  }
  return res;
}
function buildTx(srcCanvas, modeName, colour, stamp, fs) {
  const M = MODES[modeName], pl = planesOf(srcCanvas, M.n, colour), parts = [], marks = [];
  const add = (grey, MM, plane, label) => { const s = synthPlane(grey, MM, fs, plane, stamp); marks.push({ label, M: MM, t: parts.reduce((a, p) => a + p.length, 0) / fs }); parts.push(s.data); };
  add(pl.y, M, colour ? 1 : 0, colour ? "grey" : "mono");
  if (colour) { add(pl.cb, MODES.chroma, 2, "blue-yellow"); add(pl.cr, MODES.chroma, 3, "red-green"); }
  const len = parts.reduce((a, p) => a + p.length, 0), data = new Float32Array(len); let o = 0;
  parts.forEach(p => { data.set(p, o); o += p.length; });
  return { data, marks, seconds: len / fs };
}

/* ---------- the listener: it never stops until told ---------- */
class Receiver {
  constructor(fs, cb, secs) {
    this.fs = fs; this.cb = cb || {}; this.B = Math.round(fs * 0.004); this.H = Math.max(1, Math.round(fs / 4000));
    this.coef = 2 * Math.cos(2 * Math.PI * F_SYNC / fs); this.cap = Math.ceil(fs * (secs || 90)); this.buf = new Float32Array(this.cap);
    this.Mf = Math.max(2, Math.round(fs / 3800)); this.reset();
  }
  reset() {
    this.n = 0; this.sp = 0; this.t0 = 0; this.inRun = false; this.miss = 0; this.stray = 0; this.lastRowAt = 0; this.totalRows = 0;
    this.resetTx(); this.leaderEnd = undefined;
  }
  resetTx() { this.mode = null; this.cands = []; this.pending = []; this.rows = 0; this.last = null; this.ref = null; this.hdr = null; this.hdrDone = false; }
  push(chunk) {
    if (this.n + chunk.length > this.cap) this.compact();
    if (this.n + chunk.length > this.cap) return false;
    this.buf.set(chunk, this.n); this.n += chunk.length;
    this.scan(); this.tryHeader(); this.flush(); return true;
  }
  compact() {
    const fs = this.fs; let keep = this.sp;
    for (const p of this.pending) keep = Math.min(keep, p.s - 32);
    if (this.leaderEnd !== undefined && !this.hdrDone) keep = Math.min(keep, Math.round((this.leaderEnd - this.t0) * fs) - Math.round(fs * 0.1));
    const drop = keep - Math.round(fs * 3); if (drop <= 0) return;
    this.buf.copyWithin(0, drop, this.n); this.n -= drop; this.sp -= drop; this.t0 += drop / fs;
    for (const p of this.pending) p.s -= drop;
  }
  scan() {
    const { fs, B, H, coef, buf } = this;
    while (this.sp + B <= this.n) {
      const a = this.sp; let s1 = 0, s2 = 0, e = 0;
      for (let k = 0; k < B; k++) { const x = buf[a + k]; e += x * x; const s0 = x + coef * s1 - s2; s2 = s1; s1 = s0; }
      const P = s1 * s1 + s2 * s2 - coef * s1 * s2, r = e / B > 4e-7 ? 2 * P / (B * e) : 0, c = (a + B / 2) / fs + this.t0;
      if (r > 0.55) { if (!this.inRun) { this.inRun = true; this.rf = c; } this.rl = c; this.miss = 0; }
      else if (this.inRun && ++this.miss >= 3) { this.inRun = false; this.endRun(); }
      this.sp += H;
    }
  }
  endRun() {
    const span = this.rl - this.rf;
    if (span > 0.25) {
      if (this.rows > 0 || this.mode) this.cb.onNew && this.cb.onNew();
      this.resetTx(); this.leaderEnd = this.rl; this.ref = this.rl + GAPT; this.cb.onLeader && this.cb.onLeader(); return;
    }
    if (span < 0.012 || span > 0.052) { this.stray++; return; }
    if (this.leaderEnd !== undefined && this.rf < this.leaderEnd + 0.07) return;
    const m = span < 0.0235 ? "fine" : span < 0.0335 ? "chroma" : "fast", center = (this.rf + this.rl) / 2;
    if (this.mode) { if (m === this.mode) this.accept(center); else this.stray++; return; }
    this.cands.push({ m, center }); if (this.cands.length > 16) this.cands.shift();
    for (const mm of ["fast", "fine", "chroma"]) {
      const P = periodOf(MODES[mm]), list = this.cands.filter(c => c.m === mm);
      if (list.length < 3) continue;
      for (const c of list) {
        const on = list.filter(o => { const q = (o.center - c.center) / P; return Math.abs(q - Math.round(q)) < 0.06; });
        if (on.length >= 3) {
          this.mode = mm; this.cb.onMode && this.cb.onMode(mm, this.hdr);
          on.sort((x, y) => x.center - y.center); on.forEach(o => this.accept(o.center)); this.cands = []; return;
        }
      }
    }
  }
  accept(center) {
    const M = MODES[this.mode], P = periodOf(M), fs = this.fs; let idx;
    if (this.last && center - this.last.center < 4) {
      const q = (center - this.last.center) / P, r = Math.round(q);
      if (r < 1) return; if (Math.abs(q - r) > 0.12) { this.stray++; return; }
      idx = this.last.idx + r;
    } else {
      if (this.ref === null) this.ref = center - M.sync / 2;
      idx = Math.round((center - M.sync / 2 - this.ref) / P);
    }
    if (idx < 0 || idx >= M.n) return;
    this.last = { idx, center };
    this.pending.push({ idx, s: Math.round((center + M.sync / 2 - this.t0) * fs) });
  }
  tryHeader() {
    if (this.hdrDone || this.leaderEnd === undefined) return;
    const fs = this.fs, start = this.leaderEnd + HDR_PRE;
    if (this.n / fs + this.t0 < start + HDR_N * HDR_SYM + 0.03) return;
    this.hdrDone = true; const len = Math.round(0.017 * fs);
    /* find where the first tone really begins, then read the 19 tones from there; try a few nudges */
    const ms = Math.round(fs / 1000), a0 = Math.round((this.leaderEnd + 0.025 - this.t0) * fs), nb = 100, env = [];
    for (let j = 0; j < nb; j++) { let e = 0; const o = a0 + j * ms; if (o < 0 || o + ms > this.n) { env.push(0); continue; } for (let k = 0; k < ms; k++) e += this.buf[o + k] * this.buf[o + k]; env.push(Math.sqrt(e / ms)); }
    const pk = Math.max.apply(null, env.slice(30, 90)); let on = start; for (let j = 0; j < nb; j++) if (env[j] > 0.4 * pk && j >= 5 && env[j + 2] > 0.4 * pk) { on = this.leaderEnd + 0.025 + j * 0.001; break; }
    const tries = [0, -0.003, 0.003, -0.006, 0.006, -0.009, 0.009], bases = [on, start];
    let nibs = null;
    for (const base of bases) for (const dt of tries) {
      const nib = [];
      for (let i = 0; i < HDR_N; i++) {
        const a = Math.round((base + dt + i * HDR_SYM + 0.004 - this.t0) * fs);
        if (a < 0 || a + len > this.n) { nib.push(-1); continue; }
        let best = -1, bp = 0, tot = 0;
        for (let k = 0; k < 16; k++) { const p = goertzelPow(this.buf, a, len, HDR_F0 + k * HDR_DF, fs); tot += p; if (p > bp) { bp = p; best = k; } }
        nib.push(best >= 0 && bp > tot * 0.4 ? best : -1);
      }
      if (!nibs) nibs = nib; const h = parseHeader(nib);
      if (h) { this.hdr = h; this.cb.onHeader && this.cb.onHeader(h); return; }
    }
    this.cb.onLog && this.cb.onLog("header unreadable: " + nibs.map(v => v < 0 ? "?" : v.toString(16)).join(""));
  }
  flush() {
    if (!this.mode) return;
    const M = MODES[this.mode], need = Math.round(M.n * M.px * this.fs) + 3 * this.Mf + 40;
    for (let k = this.pending.length - 1; k >= 0; k--) {
      const p = this.pending[k];
      if (this.n >= p.s + need) { this.pending.splice(k, 1); this.decodeRow(p, M); }
    }
  }
  decodeRow(p, M) {
    const fs = this.fs, Mf = this.Mf, px = M.px * fs, pad = 8, L = Math.round(M.n * px) + 3 * Mf + 24, s0 = p.s - pad, w = 2 * Math.PI * F_MID / fs;
    if (s0 < 0) return;
    let zr = new Float32Array(L), zi = new Float32Array(L);
    for (let j = 0; j < L; j++) { const x = this.buf[s0 + j]; zr[j] = x * Math.cos(w * j); zi[j] = -x * Math.sin(w * j); }
    const box = a => { const o = new Float32Array(L); let acc = 0; for (let j = 0; j < L; j++) { acc += a[j]; if (j >= Mf) acc -= a[j - Mf]; o[j] = acc / Mf; } return o; };
    zr = box(box(zr)); zi = box(box(zi));
    const pr = new Float32Array(L), pi = new Float32Array(L);
    for (let j = 1; j < L; j++) { pr[j] = zr[j] * zr[j - 1] + zi[j] * zi[j - 1]; pi[j] = zi[j] * zr[j - 1] - zr[j] * zi[j - 1]; }
    const delay = (Mf - 1) + 0.5, wa = M.name === "fine" ? 0.3 : 0.25, wb = M.name === "fine" ? 0.8 : 0.85, row = new Uint8Array(M.n);
    for (let k = 0; k < M.n; k++) {
      const i0 = Math.round(pad + delay + (k + wa) * px), i1 = Math.max(i0 + 1, Math.round(pad + delay + (k + wb) * px));
      let sr = 0, si = 0; for (let j = i0; j <= i1 && j < L; j++) { sr += pr[j]; si += pi[j]; }
      const f = F_MID + Math.atan2(si, sr) * fs / (2 * Math.PI);
      row[k] = Math.max(0, Math.min(255, Math.round((f - F_BLACK) / (F_WHITE - F_BLACK) * 255)));
    }
    this.rows++; this.totalRows++; this.lastRowAt = performance.now(); this.cb.onRow && this.cb.onRow(p.idx, row, M);
  }
}
