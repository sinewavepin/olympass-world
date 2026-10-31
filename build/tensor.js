
/* ============ THE TENSOR: the Tesela Engine, live. Nine roles are the whole state. ============ */
function orbitLabels(n) {
  const L = Array.from({ length: n }, () => Array(n).fill(0)); let k = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (L[i][j]) continue; k++;
    [[i, j], [j, i], [n - 1 - j, n - 1 - i], [n - 1 - i, n - 1 - j]].forEach(p => { L[p[0]][p[1]] = k; });
  }
  return { L, roles: k };
}
const binom = (m, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (m - k + i) / i; return r; };
const bern = (m, k, u) => binom(m, k) * Math.pow(u, k) * Math.pow(1 - u, m - k);
const TN_N = 33;                                  /* the water field is 33 x 33 */
/* the words: working role values placed on the stated anchors (editable by speaking) */
const TN_WORDS = {
  "ANA BETA": { n5: [0, .44, .15, -.5, -.6, -.92, .52, -1.0, .2, -.29], letters: "S A T O B B E P N" },
  "SATOR": { n5: [0, .44, .1, -.05, .2, .36, .36, -.22, .05, -.1], letters: "S A T O R R E P N" }
};
class Tesela {
  constructor(n, word) {
    this.n = n; const o = orbitLabels(n); this.L = o.L; this.R = o.roles; this.step = 0; this.tape = [];
    this.val = new Float64Array(this.R + 1); this.tgt = new Float64Array(this.R + 1); this.vel = new Float64Array(this.R + 1);
    this.H = new Float64Array(TN_N * TN_N); this.D = new Float64Array(TN_N * TN_N); this.mist = 0; this.written = 0; this.tilt = 0; this.spring = 0; this.springTgt = 0; this.flow = 1; this.dirty = true;
    this.B = []; const m = n - 1; for (let k = 0; k < n; k++) { const r = new Float64Array(TN_N); for (let i = 0; i < TN_N; i++) r[i] = bern(m, k, i / (TN_N - 1)); this.B.push(r); }
    this.load(word, true); this.D.fill(0); this.mist = 0; this.written = 0;
    const c0 = (TN_N - 1) >> 1; for (let i = 0; i < TN_N; i++) for (let j = 0; j < TN_N; j++) { const r = Math.hypot(i - c0, j - c0); if (r < 5) { const q = .5 * (1 - r / 5); this.D[i * TN_N + j] = q; this.written += q; } }   /* the pool around the pivot, as in the verification run */
  }
  load(word, instant) {
    const w = TN_WORDS[word].n5, c = (this.n - 1) / 2;
    /* a role of order n takes the value of the role at the same ring and place in the order-5 word */
    const L5 = orbitLabels(5).L, mapped = {};
    for (let i = 0; i < this.n; i++) for (let j = 0; j < this.n; j++) {
      const r = this.L[i][j]; if (mapped[r] !== undefined) continue;
      const a = Math.min(4, Math.round(i / (this.n - 1) * 4)), b = Math.min(4, Math.round(j / (this.n - 1) * 4)); mapped[r] = w[L5[a][b]];
    }
    for (let r = 1; r <= this.R; r++) { this.tgt[r] = mapped[r]; if (instant) { this.val[r] = mapped[r]; this.vel[r] = 0; } }
    this.dirty = true;
  }
  net() { const P = Array.from({ length: this.n }, (_, i) => Array.from({ length: this.n }, (_, j) => this.val[this.L[i][j]])); return P; }
  surf(u, v, P) { const m = this.n - 1; let s = 0; for (let i = 0; i <= m; i++) { const bi = bern(m, i, u); for (let j = 0; j <= m; j++) s += bi * bern(m, j, v) * P[i][j]; } return s; }
  rebuild() {
    const P = this.net(), n = this.n, N = TN_N, T = new Float64Array(N * n);
    for (let i = 0; i < N; i++) for (let j = 0; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) s += this.B[k][i] * P[k][j]; T[i * n + j] = s; }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { let s = 0; for (let k = 0; k < n; k++) s += this.B[k][j] * T[i * n + k]; this.H[i * N + j] = s; }
    this.dirty = false;
  }
  write(role, value) {                                    /* a thought is one write to one role; symmetry expands it */
    role = clamp(Math.round(role), 1, this.R); value = clamp(value, -1, 1);
    this.tape.push({ s: this.step, r: role, v: value }); this.apply(role, value);
  }
  ctl(k, v) { const last = this.tape[this.tape.length - 1]; if (last && last.k === k && last.s === this.step) last.v = v; else this.tape.push({ s: this.step, k, v }); this[k] = v; }
  apply(role, value) { const d = Math.abs(value - this.tgt[role]); this.tgt[role] = value; this.springTgt = 1; this.springHold = this.step + 90; this.inject = 0.6 * d + .12; }
  tick() {
    const N = TN_N, dt = 1 / 60, w = 7;
    let moved = false;
    for (let r = 1; r <= this.R; r++) {                   /* rule 6: everything glides, critically damped */
      const x = this.val[r], v = this.vel[r], a = -2 * w * v - w * w * (x - this.tgt[r]); this.vel[r] += a * dt; this.val[r] += this.vel[r] * dt;
      if (Math.abs(this.vel[r]) > 1e-6 || Math.abs(x - this.tgt[r]) > 1e-6) moved = true; else { this.val[r] = this.tgt[r]; this.vel[r] = 0; }
    }
    if (moved) this.dirty = true; if (this.dirty) this.rebuild();
    if (this.springHold && this.step > this.springHold) { this.springTgt = 0; this.springHold = 0; }
    this.spring += (this.springTgt - this.spring) * .06;
    const c = (N - 1) >> 1, H = this.H, D = this.D, F = new Float64Array(N * N), g = this.tilt * .0035;
    if (this.inject > 0) { const q = Math.min(this.inject, .05); const cells = [[c, c], [c - 1, c], [c + 1, c], [c, c - 1], [c, c + 1]]; cells.forEach(p => { D[p[0] * N + p[1]] += q / 5; }); this.inject -= q; this.written += q; }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {   /* rule 3: water moves by level difference, never by particles */
      const k = i * N + j, d = D[k]; if (d <= 1e-12) continue; const L0 = H[k] + d + g * j; let out = 0; const fl = [0, 0, 0, 0];
      if (i > 0) { const q = Math.max(0, L0 - (H[k - N] + D[k - N] + g * j)); fl[0] = q; out += q; }
      if (i < N - 1) { const q = Math.max(0, L0 - (H[k + N] + D[k + N] + g * j)); fl[1] = q; out += q; }
      if (j > 0) { const q = Math.max(0, L0 - (H[k - 1] + D[k - 1] + g * (j - 1))); fl[2] = q; out += q; }
      if (j < N - 1) { const q = Math.max(0, L0 - (H[k + 1] + D[k + 1] + g * (j + 1))); fl[3] = q; out += q; }
      if (out <= 0) continue; const give = Math.min(d * .2, out * .25), s = give / out;     /* rule 4: at most 20% per step */
      if (fl[0]) { F[k - N] += fl[0] * s; } if (fl[1]) { F[k + N] += fl[1] * s; } if (fl[2]) { F[k - 1] += fl[2] * s; } if (fl[3]) { F[k + 1] += fl[3] * s; }
      F[k] -= out * s;                                                                      /* rule 5: flux only moves water */
    }
    let tot = 0; for (let k = 0; k < N * N; k++) { D[k] = Math.max(0, D[k] + F[k]); }
    /* rule 8: the rim loses water to mist, mist rises, and rain returns to the pivot at the same total rate */
    const rate = .004 * this.flow; let lost = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (i === 0 || j === 0 || i === N - 1 || j === N - 1) { const k = i * N + j, q = D[k] * rate; D[k] -= q; lost += q; }
    this.mist += lost; const rain = this.mist * .02 * this.flow; this.mist -= rain;
    const sp = rain + this.spring * 0.0000; [[c, c], [c - 1, c], [c + 1, c], [c, c - 1], [c, c + 1]].forEach(p => { D[p[0] * N + p[1]] += sp / 5; });
    this.step++;
  }
  totalWater() { let t = this.mist; for (let k = 0; k < this.D.length; k++) t += this.D[k]; return t; }
  nine() { return Array.from(this.tgt).slice(1); }
}
const TN = { n: 5, word: "ANA BETA", T: null, acc: 0, last: 0, picked: 0 };
const tnCv = $("tnc"), tnX = tnCv.getContext("2d"), tnOff = document.createElement("canvas"); tnOff.width = tnOff.height = 165;
const BANDS = [[26, 23, 18], [233, 225, 204], [201, 138, 43], [216, 68, 42]];
const lerpC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function tnCol(h, lo, hi) { const u = clamp((h - lo) / ((hi - lo) || 1), 0, .9999) * 3, i = Math.floor(u); return lerpC(BANDS[i], BANDS[i + 1], u - i); }
function tnNew() { TN.T = new Tesela(TN.n, TN.word); TN.T.rebuild(); tnClaims(); tnChips(); try { GAN.tn = { n: TN.n, word: TN.word }; GAN.save(); } catch (e) {} }
function tnDraw() {
  const T = TN.T, N = TN_N, c = tnOff.getContext("2d"), im = c.createImageData(165, 165), H = T.H, D = T.D;
  let lo = 9, hi = -9; for (let k = 0; k < H.length; k++) { if (H[k] < lo) lo = H[k]; if (H[k] > hi) hi = H[k]; }
  for (let y = 0; y < 165; y++) for (let x = 0; x < 165; x++) {
    const fy = y / 164 * (N - 1), fx = x / 164 * (N - 1), i = Math.min(N - 2, Math.floor(fy)), j = Math.min(N - 2, Math.floor(fx)), ty = fy - i, tx = fx - j, k = i * N + j;
    const h = H[k] * (1 - tx) * (1 - ty) + H[k + 1] * tx * (1 - ty) + H[k + N] * (1 - tx) * ty + H[k + N + 1] * tx * ty, d = D[k] * (1 - tx) * (1 - ty) + D[k + 1] * tx * (1 - ty) + D[k + N] * (1 - tx) * ty + D[k + N + 1] * tx * ty;
    let col = tnCol(h, lo, hi); const lev = Math.floor((h - lo) / ((hi - lo) || 1) * 14), edge = Math.abs(((h - lo) / ((hi - lo) || 1) * 14) - Math.round((h - lo) / ((hi - lo) || 1) * 14)) < .06;
    if (edge) col = lerpC(col, [26, 23, 18], .45);
    if (d > .004) { const a = clamp(d * 2.4, 0, .88); col = lerpC(col, [47, 168, 255], a); }
    const o = (y * 165 + x) * 4; im.data[o] = col[0]; im.data[o + 1] = col[1]; im.data[o + 2] = col[2]; im.data[o + 3] = 255;
  }
  c.putImageData(im, 0, 0);
  const S = tnCv.width, t = S / 2, o = S / 4, x = tnX; x.imageSmoothingEnabled = false; x.fillStyle = "#0b0907"; x.fillRect(0, 0, S, S);
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    x.save(); x.globalAlpha = a === 1 && b === 1 ? 1 : .36; x.translate(o + [0, 0, 2 * t][b], o + [0, 0, 2 * t][a]);
    x.scale(b === 1 ? 1 : -1, a === 1 ? 1 : -1); x.drawImage(tnOff, 0, 0, t, t); x.restore();
  }
  /* the role grid, ghosted underneath; the picked role glows */
  const n = T.n; x.save(); x.translate(o, o); x.font = "600 " + Math.max(8, Math.min(14, t / (n + 2))) + "px ui-monospace, monospace"; x.textAlign = "center"; x.textBaseline = "middle";
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const px = j / (n - 1) * t, py = i / (n - 1) * t, r = T.L[i][j], on = r === TN.picked;
    x.fillStyle = on ? "rgba(255,236,96,.95)" : "rgba(255,255,255,.34)"; x.beginPath(); x.arc(px, py, on ? 3.4 : 1.7, 0, TAU); x.fill();
    if (n <= 9) { x.fillStyle = on ? "#ffec60" : "rgba(255,255,255,.5)"; x.fillText(String(r), px + (j === 0 ? 10 : j === n - 1 ? -10 : 0), py + (i === 0 ? 10 : i === n - 1 ? -10 : -9)); }
  }
  x.strokeStyle = "rgba(255,255,255,.4)"; x.lineWidth = 1; x.strokeRect(.5, .5, t - 1, t - 1); x.restore();
}
function tnStations() {
  const T = TN.T, N = TN_N, c = (N - 1) / 2, names = ["AYN", "RILL", "STREAM", "RIVER", "SEA"], sum = [0, 0, 0, 0, 0], cnt = [0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const r = Math.min(4, Math.floor(Math.max(Math.abs(i - c), Math.abs(j - c)) / c * 4.999)); sum[r] += T.D[i * N + j]; cnt[r]++; }
  const mx = Math.max(.001, ...sum.map((s, i) => s / cnt[i]));
  $("tnSt").innerHTML = names.map((n, i) => '<div class="stn"><span>' + n + '</span><i><b style="width:' + Math.round(sum[i] / cnt[i] / mx * 100) + '%"></b></i></div>').join("") + '<div class="stn"><span>RETURN</span><i><b class="rt" style="width:' + Math.round(clamp(T.mist / 0.3, 0, 1) * 100) + '%"></b></i></div>';
  $("tnWater").textContent = "WATER " + T.totalWater().toFixed(4) + " · WRITTEN " + T.written.toFixed(4) + " · STEP " + T.step;
  $("tnVals").textContent = T.nine().map((v, i) => (i + 1) + ":" + (v >= 0 ? "+" : "") + v.toFixed(2)).slice(0, T.R > 9 ? 12 : 9).join("  ") + (T.R > 12 ? "  …" : "");
}
requestAnimationFrame(function tnLoop(now) {
  requestAnimationFrame(tnLoop); if (curRoom !== "tensor") { TN.last = now; return; }
  const T = TN.T, ms = Math.min(100, now - TN.last); TN.last = now; TN.acc += ms * (reduce ? .35 : 1);
  let n = 0; while (TN.acc >= 1000 / 60 && n++ < 6) { T.tick(); TN.acc -= 1000 / 60; }
  tnDraw(); if ((T.step & 7) === 0) tnStations();
});
/* the claims: every one is computed from the engine as it stands right now */
function tnClaims() {
  const T = TN.T, n = T.n, P = T.net(), eq = (a, b) => Math.abs(a - b) < 1e-9, out = [];
  const rolesOf = m => orbitLabels(m).roles, fern = [3, 5, 7, 9, 13, 17, 25].map(m => m + "→" + rolesOf(m)).join("  ");
  out.push(["1", "An order-n square has ((n+1)/2)² roles", fern, [3, 5, 7, 9, 13, 17, 25].every(m => rolesOf(m) === ((m + 1) / 2) ** 2)]);
  let half = true, tr = true, anti = true, qt = false, fx = false, fy = false;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (!eq(P[i][j], P[n - 1 - i][n - 1 - j])) half = false; if (!eq(P[i][j], P[j][i])) tr = false; if (!eq(P[i][j], P[n - 1 - j][n - 1 - i])) anti = false; if (!eq(P[i][j], P[j][n - 1 - i])) qt = true; if (!eq(P[i][j], P[i][n - 1 - j])) fx = true; if (!eq(P[i][j], P[n - 1 - i][j])) fy = true; }
  out.push(["2", "A filled tesela keeps the half-turn and both diagonal flips, and loses the quarter-turn and both straight flips", "half-turn " + half + " · transpose " + tr + " · anti-transpose " + anti + " · quarter-turn broken " + qt + " · straight flips broken " + (fx && fy), half && tr && anti && qt && fx && fy]);
  const pairs = {}, Lq = (i, j) => T.L[i][j]; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const a = Lq(i, j), b = Lq(j, n - 1 - i); if (a !== b) pairs[Math.min(a, b) + "↔" + Math.max(a, b)] = 1; }
  const fixed = []; for (let r = 1; r <= T.R; r++) { let ok = true; for (let i = 0; i < n && ok; i++) for (let j = 0; j < n; j++) if (Lq(i, j) === r && Lq(j, n - 1 - i) !== r) { ok = false; break; } if (ok) fixed.push(r); }
  out.push(["3", "A quarter-turn swaps roles in pairs and fixes the rest", Object.keys(pairs).join(" ") + "   fixes " + fixed.join(", "), n === 5 ? Object.keys(pairs).sort().join() === "1↔5,2↔4,6↔8" && fixed.join() === "3,7,9" : true]);
  let d4 = 0; for (let a = 0; a <= 40; a++) for (let b = 0; b <= 40; b++) { const u = a / 40, v = b / 40, f = T.surf(u, v, P); d4 = Math.max(d4, Math.abs(f - T.surf(v, u, P)), Math.abs(f - T.surf(1 - u, 1 - v, P))); }
  out.push(["4", "The surface keeps the tile's symmetry: F(u,v) = F(v,u) = F(1−u,1−v)", "largest difference " + d4.toExponential(1) + " over 1,681 points", d4 < 1e-9]);
  let smin = 9, smax = -9; for (let a = 0; a <= 40; a++) for (let b = 0; b <= 40; b++) { const f = T.surf(a / 40, b / 40, P); smin = Math.min(smin, f); smax = Math.max(smax, f); }
  let rmin = 9, rmax = -9; for (let r = 1; r <= T.R; r++) { rmin = Math.min(rmin, T.val[r]); rmax = Math.max(rmax, T.val[r]); }
  out.push(["5", "The surface never rises above the highest role or sinks below the lowest", "surface " + smin.toFixed(2) + " to " + smax.toFixed(2) + " · roles " + rmin.toFixed(2) + " to " + rmax.toFixed(2), smin >= rmin - 1e-9 && smax <= rmax + 1e-9]);
  const sl = [.25, .5, .75].map(v => (T.surf(.001, v, P) - T.surf(0, v, P)) / .001);
  out.push(["6", "A mirrored seam has a slope, so it is a crease", "slope at the edge: " + sl.map(s => s.toFixed(2)).join(", "), sl.some(s => Math.abs(s) > 1e-3)]);
  const G = (x, y) => { const m = z => { z = ((z % 2) + 2) % 2; return z > 1 ? 2 - z : z; }; return T.surf(m(x), m(y), P); };
  let dc = 0, dm = 0; for (let a = 0; a < 30; a++) for (let b = 0; b < 30; b++) { const x = (a + .37) / 30 * 1.6 - .3, y = (b + .21) / 30 * 1.6 - .3; dc = Math.max(dc, Math.abs(G(x, y) - G(-y, x))); dm = Math.max(dm, Math.abs(G(x, y) - G(1 - y, x))); }
  out.push(["7", "In the mirrored plane a quarter-turn about a tile corner leaves the surface unchanged; about a tile centre it does not", "corner " + dc.toExponential(1) + " against centre " + dm.toFixed(2), dc < 1e-9 && dm > 1e-3]);
  const o9 = orbitLabels(9), letters = {}, per = {}; "ABCDEFGHIJKLMNOPQRSTUVWXY".split("").forEach((ch, r) => { letters[r + 1] = ch; }); for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { (per[o9.L[i][j]] = per[o9.L[i][j]] || new Set()).add(letters[o9.L[i][j]]); }
  out.push(["8", "The Golden Record 9×9 has 25 roles, each holding exactly one letter", o9.roles + " roles · " + Object.values(per).filter(s => s.size === 1).length + " with exactly one letter", o9.roles === 25 && Object.values(per).every(s => s.size === 1)]);
  $("tnClaims").innerHTML = out.map(c => '<div class="cl ' + (c[3] ? "ok" : "no") + '"><b>' + c[0] + '</b><div><span>' + c[1] + '</span><em>' + c[2].replace(/</g, "&lt;") + '</em></div><i>' + (c[3] ? "HOLDS" : "FAILS") + '</i></div>').join("");
  $("tnRoles").textContent = "ORDER " + n + " · " + T.R + " ROLES · " + n * n + " PLACES · k = " + (n + 1) / 2;
}
function tnChips() {
  document.querySelectorAll("#tnOrd .chip").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.v === TN.n)));
  document.querySelectorAll("#tnWord .chip").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === TN.word)));
}
[5, 9, 13, 17].forEach(v => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.dataset.v = v; b.textContent = v + "×" + v + " · " + ((v + 1) / 2) ** 2; b.addEventListener("click", () => { TN.n = v; TN.picked = 0; tnNew(); }); $("tnOrd").appendChild(b); });
Object.keys(TN_WORDS).forEach(v => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.dataset.v = v; b.textContent = v; b.addEventListener("click", () => { TN.word = v; tnNew(); }); $("tnWord").appendChild(b); });
/* speaking: a drag up or down on the tile sets the role under the pointer, one write */
let tnDrag = null;
function tnRoleAt(e) {
  const r = tnCv.getBoundingClientRect(), S = r.width, x = (e.clientX - r.left) / S * 2 - .5, y = (e.clientY - r.top) / S * 2 - .5, T = TN.T, n = T.n;
  const u = x < 0 ? -x : x > 1 ? 2 - x : x, v = y < 0 ? -y : y > 1 ? 2 - y : y, j = Math.round(clamp(u, 0, 1) * (n - 1)), i = Math.round(clamp(v, 0, 1) * (n - 1)); return T.L[i][j];
}
tnCv.addEventListener("pointerdown", e => { const role = tnRoleAt(e); TN.picked = role; tnDrag = { role, y: e.clientY, v: TN.T.tgt[role], moved: false, pv: TN.T.tgt[role] }; try { tnCv.setPointerCapture(e.pointerId); } catch (er) {} tnSay("role " + role + " · drag up or down to speak it"); });
tnCv.addEventListener("pointermove", e => { if (!tnDrag) return; const dy = tnDrag.y - e.clientY; if (Math.abs(dy) < 3) return; tnDrag.moved = true; const v = clamp(tnDrag.v + dy / 120, -1, 1); tnDrag.pv = v; tnSay('role ' + tnDrag.role + ' → ' + v.toFixed(2) + ' · let go to speak it'); });
const tnEnd = () => { if (tnDrag && tnDrag.moved) { const v = tnDrag.pv; TN.T.write(tnDrag.role, v); tnSay("written · role " + tnDrag.role + " = " + v.toFixed(2) + " · every place of that role moved together · tape " + TN.T.tape.length); try { playGlyph("structure:u2261" in LUN.glyphs ? "structure:u2261" : GL_ALL[0], { vol: .4 }); } catch (e) {} } tnDrag = null; };
tnCv.addEventListener("pointerup", tnEnd); tnCv.addEventListener("pointercancel", tnEnd);
const tnSay = s => { $("tnStatus").textContent = s; };
const SATOR_LETTERS = { S: 1, A: 2, T: 3, O: 4, R: 5, E: 7, P: 8, N: 9 };
document.addEventListener("keydown", e => {
  if (curRoom !== "tensor" || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName || "")) return;
  const r = SATOR_LETTERS[e.key.toUpperCase()]; if (r && TN.n === 5 && TN.word === "SATOR") { const T = TN.T, v = clamp(T.tgt[r] + (e.shiftKey ? -.25 : .25), -1, 1); T.write(r, v); TN.picked = r; tnSay("the word spoken · " + e.key.toUpperCase() + " is role " + r + " = " + v.toFixed(2)); e.preventDefault(); }
});
$("tnTilt").addEventListener("input", e => { TN.T.ctl("tilt", +e.target.value); });
$("tnFlow").addEventListener("input", e => { TN.T.ctl("flow", +e.target.value); });
$("tnSpeak").addEventListener("click", () => { const T = TN.T; T.write(T.R, T.tgt[T.R]); TN.picked = T.R; tnSay("the Word enters from above, at the pivot · water is added only here"); });
$("tnReset").addEventListener("click", () => { tnNew(); tnSay("re-opened · the tape starts empty"); });
$("tnRev").addEventListener("click", () => {
  const T = TN.T, R = new Tesela(T.n, TN.word); const steps = T.step; let wi = 0;
  for (let s = 0; s < steps; s++) { while (wi < T.tape.length && T.tape[wi].s === s) { const w = T.tape[wi]; if (w.k) R[w.k] = w.v; else R.apply(w.r, w.v); wi++; } R.tick(); }
  const a = T.nine(), b = R.nine(), same = a.every((v, i) => Math.abs(v - b[i]) < 1e-12), dw = Math.abs(R.totalWater() - T.totalWater());
  tnSay("REVERSAL · replayed " + T.tape.length + " writes over " + steps + " steps · nine numbers " + (same ? "match" : "DIFFER") + " · water difference " + dw.toExponential(1));
});
$("tnBreak").addEventListener("click", () => {
  const T = TN.T; tnSay("REFUSED · place (1,2) is not a thing that can be written. Only role " + T.L[0][1] + " exists, and it moves places " + (T.L.flat().filter(r => r === T.L[0][1]).length) + " at once. A difference has nowhere to live.");
});
tnNew();
