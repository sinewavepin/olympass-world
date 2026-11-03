/* THE SKY, held off the page.
   Every named body lives here with its glyph seed, its name, its parent and its groups.
   The page asks one question: a wave leaves Ganymede now; which bodies return it, and when?
   The answer is worked out the way radar works:
     - the wave travels outward at a fixed speed; it meets every body at the body's range;
     - each body returns some of it, according to its size and how it is turned;
     - the return travels back the same distance, so it arrives after twice the one-way time;
     - a return weakens with the fourth power of range (out and back), so far small bodies are faint;
     - two returns closer together than the pulse length arrive as one: the stronger is heard;
     - the receiver hears returns down to a floor, and within its dynamic range of the strongest.
   Distances are compressed (log scale) so the whole system fits a few seconds of listening;
   inside that compressed space the rules above are applied exactly.
   Nothing is removed from the sky: bodies are only read. */
"use strict";
const AU = 1.495978707e8, TAU = Math.PI * 2, DAY_PER_SEC = 2;           /* scene clock: two days pass per second */
const S = 1.4, D0 = 1e5;                                                  /* one-way travel (s) = S * log10(1 + d / D0), d in km */
let PULSE = .7, GATE = 14, FLOOR = .05, RANGE_DB = 20, CHANNELS = 8, STC = 2;  /* pulse length (s), listening gate (s), receiver floor, dynamic range (dB), most returns told apart, sensitivity-time-control power */
const MASS = { Jupiter: 1, Saturn: .299, Uranus: .0457, Neptune: .054, Earth: .00315, Mars: .000338, Pluto: 6.9e-6 };
const SKY = [], BY = new Map(), HELIO = new Map();
let born = 0, GANY = null;
const KIND = new Map(), FAM = new Map(), WALK = new Map();

/* which bodies come to mind next: each kind is walked in a fixed order with a long stride,
   so over time every body of that kind is visited and none is picked by chance */
function stride(n) { const P = [7919, 6007, 4049, 2003, 1009, 499, 97, 31, 7, 3]; for (const p of P) if (n % p) return p % n || 1; return 1; }
function walk(key, list, n, run) {
  if (!list || !list.length) return [];
  let i = WALK.has(key) ? WALK.get(key) : 0; const s = run ? 1 : stride(list.length), out = [];
  for (let c = 0; c < Math.min(n, list.length); c++) { out.push(list[i % list.length]); i = (i + s) % list.length; }
  WALK.set(key, i); return out;
}
function picked(b) { const n = glyphNote(b.seed); return { id: b.id, k: b.k, seed: b.seed, name: b.name, p: b.p, x: b.x, a: b.a, D: b.D, rows: n.rows.map(v => v.toString(16).toUpperCase().padStart(4, "0")), step: n.step, oct: n.oct }; }
function nextBodies(m) {
  if (m.rule === "family") {
    const parents = [...FAM.keys()].sort(); if (!parents.length) return [];
    const pi = (WALK.get("fam") || 0) % parents.length; WALK.set("fam", pi + 1);
    const l = FAM.get(parents[pi]).slice().sort((a, c) => a.a - c.a);
    return walk("fam:" + parents[pi], l, m.n, true).sort((a, c) => a.a - c.a).map(picked);
  }
  const key = m.k === "J" ? "J" + m.camp : m.k;
  return walk("lane:" + key + ":" + (m.rule || ""), KIND.get(key), m.n, m.rule === "train").map(picked);
}

function hash(n, k) { let h = (n ^ (k * 0x9E3779B1)) >>> 0; h = Math.imul(h ^ (h >>> 16), 0x85EBCA6B) >>> 0; h = Math.imul(h ^ (h >>> 13), 0xC2B2AE35) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

/* the glyph, rebuilt from its seed (same generator as the charts) */
function mulberry32(a) { a >>>= 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0; t = (t ^ ((t + Math.imul(t ^ (t >>> 7), t | 61)) >>> 0)) >>> 0; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function glyphRows(seed) {
  const r = mulberry32(seed), g = Array.from({ length: 16 }, () => new Array(16).fill(0)), dens = .38 + .2 * r();
  for (let y = 3; y < 13; y++) for (let x = 2; x < 8; x++) if (r() < dens) { g[y][x] = 1; g[y][15 - x] = 1; }
  for (let y = 4; y < 12; y++) if (r() < .5) { g[y][7] = g[y][8] = 1; }
  return g.map(row => row.reduce((v, b, x) => v | (b << (15 - x)), 0));
}
/* the glyph's own note: how much of it is lit picks the step of the scale, where its weight sits picks the octave */
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16];
function glyphNote(seed) {
  const rows = glyphRows(seed); let n = 0, wy = 0;
  rows.forEach((v, y) => { let c = 0; for (let b = v; b; b &= b - 1) c++; n += c; wy += c * y; });
  const cy = n ? wy / n : 7.5;
  return { rows, step: PENTA[n % PENTA.length], oct: cy < 6.5 ? 1 : cy > 8.5 ? -1 : 0 };
}

function add(f, row, part) {
  const o = {}; f.forEach((k, i) => o[k] = row[i]);
  const k = o.id[0], b = { id: o.id, seed: o.seed >>> 0, name: o.name, p: o.p, a: +o.a || 0, D: +o.D || 0, x: +o.x || 0, g: o.g, k, part };
  if (BY.has(b.id)) return;
  const h = hash(b.seed, 1);
  b.th = h * TAU;                                     /* where on its path it is at the scene's start */
  b.spin = .2 + 1.8 * hash(b.seed, 2);                /* rotation period, days: turns its face to the wave */
  b.ph = hash(b.seed, 3) * TAU;
  b.flat = k === "K" || (k === "X" && b.name === "Lucy");           /* spacecraft: flat panels flash like mirrors when square to the wave */
  if (!b.a) {                                         /* no orbit size on record: a typical one for its family */
    const u = hash(b.seed, 4);
    b.a = k === "A" ? 2.2 + 1.1 * u : k === "M" ? 1e7 * (.4 + u) : k === "K" ? 6700 + 30000 * u * u : k === "X" ? 2.4 + u : 5 + 45 * u;
  }
  if (!b.D) b.D = k === "K" ? .003 + .02 * hash(b.seed, 5) : k === "X" ? (b.flat ? .015 : .5) : k === "Y" ? 1 + 4 * hash(b.seed, 5) : 2 + 10 * hash(b.seed, 5);
  b.z = Math.log10(1 + b.D * 1000);                   /* size in the compressed sky (from metres) */
  SKY.push(b); BY.set(b.id, b);
  if (k === "M" && b.name === "Ganymede") GANY = b;
  const kk = k === "J" ? "J" + (b.x || 4) : k; if (!KIND.has(kk)) KIND.set(kk, []); KIND.get(kk).push(b);
  if (k === "M" && b.p !== "Jupiter") { if (!FAM.has(b.p)) FAM.set(b.p, []); FAM.get(b.p).push(b); }
  if (!b.p && (k === "P" || k === "D" || k === "S")) HELIO.set(b.name, b);
}

/* position in the ecliptic plane, km, at scene day tau */
function helioAt(a, th, tau) { const P = 365.25 * Math.pow(Math.max(a, .05), 1.5), t = th + TAU * tau / P; return [a * AU * Math.cos(t), a * AU * Math.sin(t)]; }
function posAt(b, tau, depth) {
  if (b.k === "S") return [0, 0];
  if (b.p) {                                           /* a moon, a satellite, a companion: around its parent */
    const par = HELIO.get(b.p) || BY.get(b.p) || null;
    const pp = par && depth < 3 ? posAt(par, tau, depth + 1) : helioAt(5.203, 0, tau);
    const ak = b.a > 1000 ? b.a : 2000, m = MASS[b.p] || 2e-6, P = 7.155 * Math.pow(ak / 1070400, 1.5) / Math.sqrt(m), t = b.th + TAU * tau / P;
    return [pp[0] + ak * Math.cos(t), pp[1] + ak * Math.sin(t)];
  }
  if (b.k === "J") {                                   /* Trojans keep station 60 degrees ahead (L4) or behind (L5) of Jupiter, swaying about it */
    const J = HELIO.get("Jupiter"), tj = (J ? J.th : 0) + TAU * tau / (365.25 * Math.pow(5.203, 1.5));
    const lead = (b.x === 4 ? 1 : -1) * Math.PI / 3 + (hash(b.seed, 6) - .5) * 1.1, r = (b.a || 5.2) * AU;
    return [r * Math.cos(tj + lead), r * Math.sin(tj + lead)];
  }
  if (b.k === "Y" && b.x > 0 && b.a > 0) {             /* comets swing in and out along their ellipse */
    const P = 365.25 * Math.pow(b.a, 1.5), M = b.th + TAU * tau / P, r = Math.max(.1, b.a * (1 - Math.min(b.x, .999) * Math.cos(M)));
    return [r * AU * Math.cos(b.th + M * .5), r * AU * Math.sin(b.th + M * .5)];
  }
  return helioAt(b.a > 0 ? b.a : 30, b.th, tau);
}

/* one wave: returns the echoes the receiver will tell apart, in the order they arrive */
function listen(sec, n) {
  n = n | 0;
  const tau = sec * DAY_PER_SEC, G = GANY || null, g = G ? posAt(G, tau, 0) : helioAt(5.203, 0, tau);
  const bins = new Map(); let top = 0;
  for (const b of SKY) {
    if (b === G) continue;
    const p = posAt(b, tau, 0), d = Math.hypot(p[0] - g[0], p[1] - g[1]), s = S * Math.log10(1 + d / D0), back = 2 * s;
    if (back > GATE) continue;
    const face = .5 + .5 * Math.sin(TAU * tau / b.spin + b.ph);
    let glint = -Math.log(1 - hash(b.seed, 1000 + n)) * (.4 + .6 * face);  /* a tumbling body returns a different share each pulse (Swerling II) */
    if (b.flat) glint += 300 * Math.pow(hash(b.seed, 3000 + n), 40);   /* a panel square to the wave returns far more than its size */
    const P = b.z * b.z * glint / Math.pow(s, 4 - STC);  /* out and back: s^4; the receiver turns its gain up as it waits (sensitivity time control): s^STC back */
    if (P < FLOOR) continue;
    const key = Math.floor(back / PULSE), cur = bins.get(key);
    if (!cur || cur.P < P) bins.set(key, { b, P, back });
    if (P > top) top = P;
  }
  const lo = top * Math.pow(10, -RANGE_DB / 10);
  const heard = [...bins.values()].filter(e => e.P >= lo).sort((a, c) => c.P - a.P).slice(0, CHANNELS).sort((a, c) => a.back - c.back);
  return heard.map(e => { const n = glyphNote(e.b.seed); return { id: e.b.id, k: e.b.k, name: e.b.name, p: e.b.p, x: e.b.x, delay: e.back, strength: Math.log10(e.P / FLOOR), step: n.step, oct: n.oct }; });
}

async function gather(base, files) {
  for (const f of files) {
    try { const r = await fetch(base + f + ".json"); if (!r.ok) continue; const j = await r.json(); for (const row of j.r) add(j.f, row, f); }
    catch (e) {}
    await new Promise(res => setTimeout(res, 120));   /* unhurried: the page comes first */
  }
}

self.onmessage = e => {
  const m = e.data || {};
  if (m.core) { m.core.r.forEach(row => add(m.core.f, row, "core")); born = 1; }
  if (m.base) gather(m.base, m.files || []).then(() => self.postMessage({ held: SKY.length }));
  if (m.lane !== undefined) self.postMessage({ lane: m.lane, bodies: nextBodies(m) });
  if (m.ping !== undefined) self.postMessage({ ping: m.ping, echoes: listen(m.t, m.ping) });
  if (m.find) { const b = BY.get(m.find); self.postMessage({ found: b ? { id: b.id, name: b.name, p: b.p, g: b.g, rows: glyphRows(b.seed).map(v => v.toString(16).toUpperCase().padStart(4, "0")) } : null }); }
};
if (typeof module !== "undefined") module.exports = { add, listen, SKY, BY, glyphRows, posAt, set: o => { if ('PULSE' in o) PULSE = o.PULSE; if ('FLOOR' in o) FLOOR = o.FLOOR; if ('RANGE_DB' in o) RANGE_DB = o.RANGE_DB; if ('CHANNELS' in o) CHANNELS = o.CHANNELS; if ('STC' in o) STC = o.STC; } };
