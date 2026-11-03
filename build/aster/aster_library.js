
/* ============ ASTER'S LIBRARY OF LIGHT ============
   1 THE TRIGGER   a floating asterisk, a quarter of Ganymede's size, drifting by itself around the
                   view. Its colour comes from whatever it floats near (a door, the moon, Jupiter) or,
                   in open space, from where on the screen it is. While it waits it changes shape,
                   continuously: asterisk → aperture → cosmic void → star portal → asterisk.
   2 THE FOUNTAIN  a click and it breaks into an astral fountain of light; where the light comes
                   down, the library stands: a suspended grid, not shelves.
   3 THE NODES     each book is a Node: a cube that is never drawn, only implied, by light running
                   along its edges around an inner aperture (seen at an angle, like the hexagon at
                   Saturn's pole or a cube viewed corner-on).
   4 THE TITLES    a title leaves the centre, runs along the light that frames its cube, around the
                   aperture, and comes home to rest; then it turns: * → a cube holding 8 with * above
                   → the * comes down into the 8 → the 8 turns a quarter to ∞ → ∞ parts into two
                   squares of dots → the dots draw together into * → the title again.
   5 THE READER    a Node opens into a book read dynamically: the text arrives at its own pace with
                   the cues written into it (Aster's Dynamic Reading, files ending .adr). */
const AL = { open: false, t0: 0, drops: [], nodes: [], books: [], hover: -1, mx: .5, my: .5, read: null, ready: false };
const AS = { cv: $("aster"), x: 0, y: 0, vx: 0, vy: 0, s: 48, init: false, col: [205, 176, 255], last: 0 };
AS.ctx = AS.cv.getContext("2d");
/* ---- the asterisk and its four shapes: eight arms of twelve points each, carried from shape to shape ---- */
const AS_M = 12;
function asArm(form, i, j) {
  const t = j / (AS_M - 1), th = i * TAU / 8;
  if (form === 0) { const r = .14 + .86 * t; return [r * Math.cos(th), r * Math.sin(th)]; }                           /* asterisk */
  if (form === 1) { const a = [Math.cos(th), Math.sin(th)], b = [.38 * Math.cos(th + 1.15), .38 * Math.sin(th + 1.15)]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }  /* aperture: iris blades */
  if (form === 2) { const r = 1 - .58 * t, a = th + 1.7 * t; return [r * Math.cos(a), r * Math.sin(a)]; }             /* cosmic void: arms spiral in */
  const half = t < .5, f = half ? t * 2 : (t - .5) * 2, r = half ? 1 - .58 * f : .42 + .58 * f, a = th + (half ? f : 1 + f) * Math.PI / 8;   /* star portal */
  return [r * Math.cos(a), r * Math.sin(a)];
}
const smooth = f => f * f * (3 - 2 * f);
function asShape(t) {
  const P = 4.2, u = (t / P) % 4, a = Math.floor(u), fr = u - a, f = fr < .55 ? 0 : smooth((fr - .55) / .45), b = (a + 1) % 4;
  const w = [0, 0, 0, 0]; w[a] += 1 - f; w[b] += f;
  return { a, b, f, w };
}
function asDraw(x, cx, cy, R, t, col, alpha) {
  const sh = asShape(t), rot = t * .18, c = "rgba(" + col.join(",") + ",", lw = Math.max(1.2, R * .085);
  x.save(); x.translate(cx, cy); x.rotate(rot); x.lineCap = "round"; x.lineJoin = "round";
  if (sh.w[2] > .01) { const g = x.createRadialGradient(0, 0, 0, 0, 0, R * .62); g.addColorStop(0, "rgba(0,0,0," + (.9 * sh.w[2] * alpha).toFixed(3) + ")"); g.addColorStop(.8, "rgba(2,3,8," + (.7 * sh.w[2] * alpha).toFixed(3) + ")"); g.addColorStop(1, c + (.35 * sh.w[2] * alpha).toFixed(3) + ")"); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * .62, 0, TAU); x.fill(); }
  const ring = (sh.w[1] + sh.w[3] + .6 * sh.w[2]) * alpha; if (ring > .01) { x.strokeStyle = c + (.75 * ring).toFixed(3) + ")"; x.lineWidth = lw * .55; x.beginPath(); x.arc(0, 0, R, 0, TAU); x.stroke(); }
  if (sh.w[3] > .01) { const g = x.createRadialGradient(0, 0, 0, 0, 0, R * .5); g.addColorStop(0, "rgba(255,255,255," + (.8 * sh.w[3] * alpha).toFixed(3) + ")"); g.addColorStop(1, c + "0)"); x.fillStyle = g; x.beginPath(); x.arc(0, 0, R * .5, 0, TAU); x.fill(); }
  x.strokeStyle = c + alpha.toFixed(3) + ")"; x.lineWidth = lw; x.shadowColor = c + ".9)"; x.shadowBlur = R * .35;
  for (let i = 0; i < 8; i++) { x.beginPath(); for (let j = 0; j < AS_M; j++) { const p = asArm(sh.a, i, j), q = asArm(sh.b, i, j), X = (p[0] + (q[0] - p[0]) * sh.f) * R, Y = (p[1] + (q[1] - p[1]) * sh.f) * R; j ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); }
  x.restore();
}
/* colour from what is near: each door, the moon and Jupiter pull the colour toward their own, the
   nearer the stronger; in open space the colour comes from the place on the screen */
function asColour(px, py) {
  const W = innerWidth, H = innerHeight, fx = px / W, fy = py / H;
  let base = [205 + (47 - 205) * fx, 176 + (168 - 176) * fy, 255], wsum = 1, acc = base.map(v => v);
  const pull = (x, y, rgb, reach, k) => { const d = Math.hypot(px - x, py - y), w = k * Math.max(0, 1 - d / reach) ** 2; if (w <= 0) return; acc = acc.map((v, i) => v + rgb[i] * w); wsum += w; };
  if (typeof DOORS !== "undefined") DOORS.forEach(d => { if (d.px) pull(d.px, d.py + WD.oy, d.rgb.split(",").map(Number), 220, 3); });
  pull(WD.cx, WD.cy + WD.oy, [255, 211, 107], WD.R * 3.2, 2.5);
  if (window.__deepOn) pull(DEEP.jx, DEEP.jy, [222, 196, 156], DEEP.jr * 1.5, 2);
  const c = acc.map(v => v / wsum), near = Math.min(1, (wsum - 1) / 2.5), lum = .78 + .32 * near;
  return c.map(v => Math.round(Math.min(255, v * lum)));
}
function asStep(now) {
  const show = AR.done && !body.classList.contains("inroom") && !AL.open && WD.w;
  AS.cv.classList.toggle("on", !!show); if (!show) { AS.last = 0; return; }
  const dt = AS.last ? Math.min(.05, (now - AS.last) / 1000) : .016; AS.last = now; const t = now / 1000, W = innerWidth, H = innerHeight;
  AS.s = Math.max(30, WD.R * .5);
  const tx = W * (.5 + .38 * Math.sin(t * .043 + 1.3) + .07 * Math.sin(t * .11)), ty = H * (.5 + .34 * Math.sin(t * .031 + .4) + .07 * Math.sin(t * .13 + 2));
  if (!AS.init) { AS.x = W * .18; AS.y = H * .7; AS.init = true; }
  let ax = (tx - AS.x) * .35 - AS.vx * .9, ay = (ty - AS.y) * .35 - AS.vy * .9;
  /* it keeps clear of the moon, the doors, the bars and the console, so it never takes a tap meant for them */
  const away = (x, y, r, k) => { const dx = AS.x - x, dy = AS.y - y, d = Math.hypot(dx, dy) || 1; if (d < r) { const f = k * (1 - d / r); ax += dx / d * f; ay += dy / d * f; } };
  away(WD.cx, WD.cy + WD.oy, WD.R * 1.6 + AS.s, 900);
  if (typeof DOORS !== "undefined") DOORS.forEach(d => { if (d.px) away(d.px, d.py + WD.oy, 95 + AS.s * .5, 700); });
  if (AS.y < 70 + AS.s) ay += 400; if (AS.y > H - 96 - AS.s) ay -= 400; if (AS.x < AS.s) ax += 400; if (AS.x > W - AS.s) ax -= 400;
  away(W - 90, H - 30, 150, 600);
  if (reduce) { ax = ay = 0; AS.vx = AS.vy = 0; } AS.vx += ax * dt; AS.vy += ay * dt; AS.x += AS.vx * dt; AS.y += AS.vy * dt;
  const col = asColour(AS.x, AS.y); AS.col = AS.col.map((v, i) => v + (col[i] - v) * Math.min(1, dt * 2.5));
  const d = Math.min(window.devicePixelRatio || 1, 2), S = Math.ceil(AS.s * 2), cv = AS.cv;
  if (cv.width !== S * d) { cv.width = S * d; cv.height = S * d; cv.style.width = S + "px"; cv.style.height = S + "px"; }
  cv.style.transform = "translate(" + (AS.x - S / 2).toFixed(1) + "px," + (AS.y - S / 2).toFixed(1) + "px)";
  const x = AS.ctx; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, S, S); asDraw(x, S / 2, S / 2, AS.s * .5, reduce ? 0 : t, AS.col.map(Math.round), 1);
}
/* ---- the library ---- */
function alOpen() {
  if (AL.open) return; wake(); AL.open = true; AL.t0 = performance.now(); AL.read = null; $("alRead").hidden = true;
  const lib = $("asterLib"); lib.hidden = false; void lib.offsetWidth; lib.classList.add("open"); body.classList.add("inroom", "inlib");
  AL.ox = AS.x; AL.oy = AS.y; AL.col = AS.col.map(Math.round); AL.drops = [];
  for (let i = 0; i < 180; i++) { const a = -Math.PI / 2 + (hash2(i, 51) - .5) * 2.2, sp = 380 + 520 * hash2(i, 52); AL.drops.push({ x: AL.ox, y: AL.oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: hash2(i, 53) * .25, w: hash2(i, 54) < .3 }); }
  playGlyph("stars:u2606", { vol: .4 }); setTimeout(() => playGlyph("seal:light", { hz: 523.25, vol: .3 }), 220); setTimeout(() => playGlyph("seal:light", { hz: 783.99, vol: .26 }), 440);
  alLayout(); alSize(); try { $("alBack").focus({ preventScroll: true }); } catch (e) {}
}
function alClose() {
  if (!AL.open) return; AL.open = false; alStopRead(); const lib = $("asterLib"); lib.classList.remove("open"); body.classList.remove("inlib");
  if (!curRoom) body.classList.remove("inroom"); setTimeout(() => { if (!AL.open) lib.hidden = true; }, 420); layoutWorld();
}
function alSize() { const c = $("alc"), d = Math.min(window.devicePixelRatio || 1, 2); c.width = innerWidth * d; c.height = innerHeight * d; AL.d = d; alLayout(); }
function alLayout() {
  const list = AL.books.concat([{ empty: true, title: "· · ·", sub: "PLACE A BOOK" }]), n = list.length, W = innerWidth, H = innerHeight;
  const S = clamp(Math.min(W, H) * .2, 96, 170), cols = Math.max(1, Math.min(n, Math.floor((W - 40) / (S * 1.9)))), rows = Math.ceil(n / cols);
  const gx = S * 1.9, gy = S * 1.75, ox = W / 2 - (cols - 1) * gx / 2, oy = Math.max(S * 1.3 + 60, H / 2 - (rows - 1) * gy / 2 + 10);
  AL.nodes = list.map((b, i) => { const c = i % cols, r = Math.floor(i / cols); return { b, i, x: ox + c * gx + (r % 2 ? gx * .25 : -gx * .05), y: oy + r * gy, s: S * (1 - r * .04), z: r }; });
}
/* the implied cube: six outer corners and the three edges that meet at the hidden near corner */
function alHex(n) { const p = []; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 3; p.push([n.x + Math.cos(a) * n.s * .62, n.y + Math.sin(a) * n.s * .62]); } return p; }
function alPath(n) {
  /* the title's way: centre → top corner → around the frame → down to the aperture → once around it → centre */
  const h = alHex(n), ra = n.s * .2, pts = [[n.x, n.y]];
  h.forEach(p => pts.push(p)); pts.push(h[0]); pts.push([n.x, n.y - ra]);
  for (let k = 1; k <= 24; k++) { const a = -Math.PI / 2 + k / 24 * TAU; pts.push([n.x + Math.cos(a) * ra, n.y + Math.sin(a) * ra]); }
  pts.push([n.x, n.y]);
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, L, len: L[L.length - 1] };
}
function alAt(P, s) { if (s <= 0) return P.pts[0]; if (s >= P.len) return P.pts[P.pts.length - 1]; let i = 1; while (P.L[i] < s) i++; const f = (s - P.L[i - 1]) / (P.L[i] - P.L[i - 1]), a = P.pts[i - 1], b = P.pts[i]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; }
function alGlow(x, col, a) { x.strokeStyle = "rgba(" + col + "," + a.toFixed(3) + ")"; x.shadowColor = "rgba(" + col + ",.9)"; }
function alNode(x, n, t, reveal) {
  const h = alHex(n), col = n.b.empty ? "160,170,200" : (PAL[n.b.ink] || PAL.sun).join(","), hov = AL.hover === n.i, a0 = reveal * (n.b.empty ? .45 : 1) * (hov ? 1 : .85);
  /* faint faces: only enough to let the eye build the cube */
  const faces = [[0, 1, 2], [2, 3, 4], [4, 5, 0]], sh = [.05, .025, .012];
  faces.forEach((f, k) => { x.fillStyle = "rgba(" + col + "," + (sh[k] * reveal).toFixed(3) + ")"; x.beginPath(); x.moveTo(n.x, n.y); f.forEach(i => x.lineTo(...h[i])); x.closePath(); x.fill(); });
  /* the frame, drawn only by light running along it */
  x.save(); x.lineWidth = hov ? 1.8 : 1.3; x.shadowBlur = 10; x.setLineDash([n.s * .09, n.s * .05]); x.lineDashOffset = -t * n.s * .35;
  alGlow(x, col, .75 * a0); x.beginPath(); h.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.closePath(); x.stroke();
  const ra = n.s * .2; [1, 3, 5].forEach(k => { const p = h[k], dx = p[0] - n.x, dy = p[1] - n.y, d = Math.hypot(dx, dy); x.beginPath(); x.moveTo(n.x + dx / d * ra * 1.15, n.y + dy / d * ra * 1.15); x.lineTo(...p); x.stroke(); });
  /* the inner aperture */
  x.setLineDash([2, 4]); x.lineDashOffset = t * 8; alGlow(x, col, .6 * a0); x.beginPath(); x.arc(n.x, n.y, ra, 0, TAU); x.stroke(); x.restore();
  alTitle(x, n, t, reveal, col);
}
function alTitle(x, n, t, reveal, col) {
  const T = 16, off = n.i * 1.3, u = ((t - off) % T + T) % T, title = n.b.title || "untitled", nl = Math.min(26, [...title].length), fs = Math.max(7, Math.min(n.s * .085, n.s * .98 / (Math.max(1, nl) * .58))), C = "rgba(" + col + ",";
  x.save(); x.font = "600 " + fs.toFixed(1) + "px " + getComputedStyle(document.documentElement).getPropertyValue("--font-crt"); x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = C + ".9)"; x.shadowBlur = 8;
  const letters = [...title.slice(0, 26)], w = x.measureText("M").width * .86, home = (i) => [n.x + (i - (letters.length - 1) / 2) * w, n.y];
  const dot = (px, py, a, r) => { x.fillStyle = C + a.toFixed(3) + ")"; x.beginPath(); x.arc(px, py, r || Math.max(1.2, fs * .14), 0, TAU); x.fill(); };
  const glyph = (ch, px, py, sc, a, rot) => { x.save(); x.translate(px, py); if (rot) x.rotate(rot); x.scale(sc, sc); x.fillStyle = C + a.toFixed(3) + ")"; x.fillText(ch, 0, 0); x.restore(); };
  const A = reveal;
  if (u < 7.5) {
    /* phase 1: the trace, then rest */
    const P = n.P || (n.P = alPath(n)), sp = w * 1.15, head = u < 5.5 ? smooth(u / 5.5) * (P.len + letters.length * sp) : -1;
    letters.forEach((ch, i) => { let p = home(i); if (head >= 0) { const s = head - i * sp; if (s > 0 && s < P.len) p = alAt(P, s); } glyph(ch, p[0], p[1], 1, A, 0); });
  } else if (u < 8.3) {
    const f = smooth((u - 7.5) / .8); letters.forEach((ch, i) => { const p = home(i); glyph(ch, p[0] + (n.x - p[0]) * f, p[1], 1 - f, A * (1 - f), 0); }); glyph("*", n.x, n.y, .6 + 1.4 * f, A * f, 0);
  } else if (u < 9.3) {
    /* a small cube holding 8, with the * above it */
    const f = smooth((u - 8.3) / 1); alCubeMini(x, n, fs * 1.6, C, A * f); glyph("8", n.x, n.y + fs * .1, 1.5, A * f, 0); glyph("*", n.x, n.y - fs * 2.2 * f, 2 - .6 * f, A, 0);
  } else if (u < 10.3) {
    const f = smooth((u - 9.3) / 1); alCubeMini(x, n, fs * 1.6, C, A * (1 - f * .5)); glyph("8", n.x, n.y + fs * .1, 1.5, A, 0); glyph("*", n.x, n.y - fs * 2.2 * (1 - f), 1.4 * (1 - f * .8), A * (1 - f), 0);
  } else if (u < 11.3) {
    /* the 8 turns a quarter and lies down as ∞ */
    const f = smooth((u - 10.3) / 1); alCubeMini(x, n, fs * 1.6, C, A * .5 * (1 - f)); glyph("8", n.x, n.y + fs * .1, 1.5 + .3 * f, A, f * Math.PI / 2);
  } else if (u < 14) {
    /* ∞ parts into two squares of dots, and the dots draw together into * */
    const q = fs * .9, sep = fs * 1.05, pts = alDotSquares(n.x, n.y, q, sep), star = alDotStar(n.x, n.y, fs * 1.3);
    if (u < 12.5) { const f = smooth((u - 11.3) / 1.2); glyph("8", n.x, n.y + fs * .1, 1.8, A * (1 - f), Math.PI / 2); pts.forEach(p => { const cx = n.x + (p[0] - n.x) * f, cy = n.y + (p[1] - n.y) * f; dot(cx, cy, A * f); }); }
    else { const f = smooth((u - 12.5) / 1.5); pts.forEach((p, i) => { const s = star[i]; dot(p[0] + (s[0] - p[0]) * f, p[1] + (s[1] - p[1]) * f, A); }); }
  } else {
    const f = smooth((u - 14) / 2), star = alDotStar(n.x, n.y, fs * 1.3);
    if (f < .5) { star.forEach(s => dot(s[0], s[1], A * (1 - f * 2))); glyph("*", n.x, n.y, 2, A * f * 2, 0); }
    else { const g = (f - .5) * 2; glyph("*", n.x, n.y, 2 * (1 - g), A * (1 - g), 0); letters.forEach((ch, i) => { const p = home(i); glyph(ch, n.x + (p[0] - n.x) * g, p[1], g, A * g, 0); }); }
  }
  if (n.b.sub || n.b.author) { x.shadowBlur = 0; x.font = "500 " + Math.max(8, fs * .72).toFixed(1) + "px " + getComputedStyle(document.documentElement).getPropertyValue("--font-crt"); x.fillStyle = C + (.55 * reveal).toFixed(3) + ")"; x.fillText(n.b.sub || n.b.author, n.x, n.y + n.s * .78); }
  x.restore();
}
function alCubeMini(x, n, r, C, a) { const h = []; for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + k * Math.PI / 3; h.push([n.x + Math.cos(an) * r, n.y + Math.sin(an) * r]); } x.save(); x.setLineDash([]); x.shadowBlur = 0; x.strokeStyle = C + a.toFixed(3) + ")"; x.lineWidth = 1; x.beginPath(); h.forEach((p, i) => i ? x.lineTo(...p) : x.moveTo(...p)); x.closePath(); x.stroke(); [1, 3, 5].forEach(k => { x.beginPath(); x.moveTo(n.x, n.y); x.lineTo(...h[k]); x.stroke(); }); x.restore(); }
function alDotSquares(cx, cy, q, sep) { const out = []; [-1, 1].forEach(s => { for (let i = 0; i < 12; i++) { const side = Math.floor(i / 3), f = (i % 3) / 3, c = [[-1, -1], [1, -1], [1, 1], [-1, 1]], a = c[side], b = c[(side + 1) % 4]; out.push([cx + s * sep + (a[0] + (b[0] - a[0]) * f) * q / 2, cy + (a[1] + (b[1] - a[1]) * f) * q / 2]); } }); return out; }
function alDotStar(cx, cy, r) { const out = []; for (let k = 0; k < 8; k++) for (let j = 1; j <= 3; j++) { const a = k * TAU / 8 - Math.PI / 2; out.push([cx + Math.cos(a) * r * j / 3, cy + Math.sin(a) * r * j / 3]); } return out; }
function alPaint(now) {
  const c = $("alc"), x = c.getContext("2d"), d = AL.d || 1, W = innerWidth, H = innerHeight, e = (now - AL.t0) / 1000, t = reduce ? 0 : now / 1000;
  x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H);
  /* the fountain: light thrown up from where the asterisk was, falling back as it spreads */
  if (e < 2.4) {
    x.save(); x.globalCompositeOperation = "lighter";
    AL.drops.forEach(p => { const s = e - p.t; if (s < 0) return; const px = p.x + p.vx * s * .55, py = p.y + p.vy * s * .55 + 520 * s * s * .55, a = Math.max(0, 1 - s / 1.9); const col = p.w ? "255,255,255" : AL.col.join(","); x.strokeStyle = "rgba(" + col + "," + (a * .85).toFixed(3) + ")"; x.lineWidth = p.w ? 1.6 : 1.1; x.beginPath(); x.moveTo(px, py); x.lineTo(px - p.vx * .018, py - (p.vy + 520 * s) * .018); x.stroke(); });
    if (e < .5) { const g = x.createRadialGradient(AL.ox, AL.oy, 0, AL.ox, AL.oy, 140 * (1 + e * 4)); g.addColorStop(0, "rgba(255,255,255," + (.7 * (1 - e * 2)).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + AL.col.join(",") + ",0)"); x.fillStyle = g; x.fillRect(0, 0, W, H); }
    x.restore();
  }
  const reveal = clamp((e - .7) / 1.2, 0, 1); if (reveal <= 0) return;
  const px = (AL.mx - .5) * 14, py = (AL.my - .5) * 10;
  AL.nodes.forEach(n => { x.save(); const bob = reduce ? 0 : Math.sin(t * .6 + n.i * 1.7) * 4; x.translate(px * (1 + n.z * .3), py * (1 + n.z * .3) + bob); alNode(x, n, t, reveal * clamp((e - .7 - n.i * .15) / .8, 0, 1)); x.restore(); });
}
function alHit(sx, sy) { for (const n of AL.nodes) if (Math.hypot(sx - n.x, sy - n.y) < n.s * .62) return n; return null; }
/* ---- books: read from the library folder beside the page, and any placed here by hand ---- */
async function alLoadBooks() {
  const out = [];
  try { const r = await fetch(new URL("library/index.json", location.href).href); if (r.ok) { const j = await r.json(); for (const b of j.books || []) { try { const s = await fetch(new URL("library/" + b.file, location.href).href); if (s.ok) { const src = await s.text(), p = adrParse(src); out.push({ src, title: p.meta.title || b.file, author: p.meta.author, ink: p.meta.ink || "sun", file: b.file }); } } catch (e) {} } } } catch (e) {}
  try { (JSON.parse(localStorage.getItem("olympass.library.v1") || "[]") || []).forEach(o => { const p = adrParse(o.src); out.push({ src: o.src, title: p.meta.title || "placed book", author: p.meta.author || "placed here", ink: p.meta.ink || "leaf", local: true }); }); } catch (e) {}
  AL.books = out; AL.ready = true; alLayout();
}
function alPlace(src) {
  if (!src || !src.trim()) return; let a = []; try { a = JSON.parse(localStorage.getItem("olympass.library.v1") || "[]") || []; } catch (e) {}
  a.push({ src, at: Date.now() }); try { localStorage.setItem("olympass.library.v1", JSON.stringify(a)); } catch (e) {}
  const p = adrParse(src); AL.books.push({ src, title: p.meta.title || "placed book", author: p.meta.author || "placed here", ink: p.meta.ink || "leaf", local: true }); alLayout(); $("alPlace").hidden = true;
}
function alInit() {
  AS.cv.addEventListener("pointerdown", e => { e.stopPropagation(); e.preventDefault(); alOpen(); });
  AS.cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alOpen(); } });
  $("alBack").addEventListener("click", () => { if (AL.read) { alStopRead(); $("alRead").hidden = true; } else alClose(); });
  const c = $("alc");
  c.addEventListener("pointermove", e => { AL.mx = e.clientX / innerWidth; AL.my = e.clientY / innerHeight; const n = alHit(e.clientX, e.clientY); AL.hover = n ? n.i : -1; c.style.cursor = n ? "pointer" : "default"; });
  c.addEventListener("click", e => { const n = alHit(e.clientX, e.clientY); if (!n) return; if (n.b.empty) { $("alPlace").hidden = false; return; } alRead(n.b); });
  addEventListener("keydown", e => { if (AL.open && e.key === "Escape") { if (!$("alPlace").hidden) $("alPlace").hidden = true; else if (AL.read) { alStopRead(); $("alRead").hidden = true; } else alClose(); } });
  addEventListener("resize", () => { if (AL.open) alSize(); });
  $("alPlaceX").addEventListener("click", () => { $("alPlace").hidden = true; });
  $("alPlaceGo").addEventListener("click", () => alPlace($("alPaste").value));
  $("alFile").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; if (!f) return; f.text().then(alPlace); });
  const dz = $("alPlace"); dz.addEventListener("dragover", e => { e.preventDefault(); dz.classList.add("over"); }); dz.addEventListener("dragleave", () => dz.classList.remove("over"));
  dz.addEventListener("drop", e => { e.preventDefault(); dz.classList.remove("over"); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) f.text().then(alPlace); });
  alReaderInit(); alLoadBooks();
  requestAnimationFrame(function asterLoop(now) { requestAnimationFrame(asterLoop); asStep(now); if (AL.open) alPaint(now); if (AL.read) alReadStep(now); });
}
