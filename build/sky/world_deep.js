
/* ============ THE JUPITER SYSTEM, as Ganymede carries it ============
   Behind the moon: the stars, Jupiter always there, and Io, Europa and Callisto on their rounds
   (Ganymede is the one looking). In front of them, the bodies Ganymede keeps track of, each one
   shown as his glyph for it and moving the way that kind of body moves. This is the inside of
   his mind, not a map: distances and speeds are his, the names and relations are real.
   Bodies come to mind in a fixed walk through the charts; when one has crossed his view it rests
   and the next one in the walk comes to mind. Nothing is removed from the sky. */
const deepCv = $("deep"), dctx = deepCv.getContext("2d");
const DEEP = { W: 0, H: 0, dpr: 1, stars: null, jup: null, jupAt: -1e9, jx: 0, jy: 0, jr: 0, lanes: [], shown: new Map(), spr: new Map(), caseT: .37, last: 0, flash: new Map() };
/* each kind of body has its colour from the door its family lives behind */
const DOOR_OF = { S: "orange", P: "orange", D: "violet", M: "leaf", A: "orange", J: "violet", C: "eblue", T: "leaf", N: "violet", H: "violet", Y: "eblue", Z: "eblue", X: "leaf", K: "eblue" };
function deepSize() {
  const W = innerWidth, H = innerHeight, d = Math.min(window.devicePixelRatio || 1, 1.5); if (W === DEEP.W && H === DEEP.H && d === DEEP.dpr) return;
  DEEP.W = W; DEEP.H = H; DEEP.dpr = d; deepCv.width = Math.round(W * d); deepCv.height = Math.round(H * d);
  DEEP.jr = Math.max(W, H) * .36; DEEP.jx = W * .74; DEEP.jy = H * .04 - DEEP.jr * .08;
  /* the star field is painted once: faint dust, a few brighter stars with a touch of colour */
  const c = document.createElement("canvas"); c.width = deepCv.width; c.height = deepCv.height; const x = c.getContext("2d"), n = Math.round(W * H / 1700);
  for (let i = 0; i < n; i++) {
    const m = hash2(i, 71), px = hash2(i, 72) * c.width, py = hash2(i, 73) * c.height, b = Math.pow(hash2(i, 74), 3);
    const tint = m < .12 ? "255,214,170" : m < .22 ? "190,210,255" : "232,236,248";
    x.fillStyle = "rgba(" + tint + "," + (.12 + .7 * b).toFixed(3) + ")"; const s = b > .7 ? 2 * d : d; x.fillRect(Math.round(px), Math.round(py), s, s);
  }
  DEEP.stars = c; DEEP.jupAt = -1e9;
}
/* Jupiter, painted from latitude bands that drift past each other, the Great Red Spot, the limb and the terminator */
const JB = [[-90, [120, 104, 92]], [-60, [150, 128, 104]], [-40, [196, 170, 132]], [-28, [222, 204, 170]], [-19, [178, 118, 82]], [-9, [226, 214, 188]], [3, [236, 226, 204]], [8, [184, 126, 88]], [17, [214, 188, 150]], [24, [236, 224, 198]], [32, [176, 140, 106]], [45, [204, 184, 152]], [60, [150, 132, 112]], [90, [118, 104, 94]]];
function jupBand(lat) { for (let i = 1; i < JB.length; i++) if (lat <= JB[i][0]) { const a = JB[i - 1], b = JB[i], f = (lat - a[0]) / (b[0] - a[0]), g = f * f * (3 - 2 * f); return [a[1][0] + (b[1][0] - a[1][0]) * g, a[1][1] + (b[1][1] - a[1][1]) * g, a[1][2] + (b[1][2] - a[1][2]) * g]; } return JB[JB.length - 1][1]; }
function jupPaint(t) {
  const N = DEEP.W < 700 ? 180 : 280, c = DEEP.jup || document.createElement("canvas"); c.width = c.height = N; const x = c.getContext("2d"), im = x.createImageData(N, N), D = im.data;
  const L = [-.62, -.38, .68], ll = Math.hypot(L[0], L[1], L[2]), Lx = L[0] / ll, Ly = L[1] / ll, Lz = L[2] / ll, tilt = -.05;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const u = (i + .5) / N * 2 - 1, v = (j + .5) / N * 2 - 1, r2 = u * u + v * v; if (r2 > 1) continue;
    const z = Math.sqrt(1 - r2), yy = v * Math.cos(tilt) - u * Math.sin(tilt), xx = u * Math.cos(tilt) + v * Math.sin(tilt);
    const lat = Math.asin(Math.max(-1, Math.min(1, -yy))) * 57.2958, cl = Math.cos(lat / 57.2958) || 1e-6, lon = Math.atan2(xx / cl, z);
    const zone = Math.sin(lat * .21) > 0 ? 1 : -1, drift = t * .016 * zone;              /* neighbouring bands flow in opposite directions */
    const w = Math.sin(lon * 6 + drift * 9 + lat * .7) * 1.6 + Math.sin(lon * 13 - drift * 7 + lat * 1.9) * .7;
    let col = jupBand(lat + w);
    const dl = lat + 22, dn = Math.atan2(Math.sin(lon - (t * .012 % TAU)), Math.cos(lon - (t * .012 % TAU)));  /* the Great Red Spot */
    const e = (dl / 5.5) ** 2 + (dn / .3) ** 2; if (e < 1) { const k = (1 - e) * .85; col = [col[0] + (196 - col[0]) * k, col[1] + (96 - col[1]) * k, col[2] + (70 - col[2]) * k]; }
    const lam = Math.max(0, u * Lx + v * Ly + z * Lz), shade = .07 + .93 * Math.pow(lam, .8) * (.62 + .38 * z);
    const th = (BAYER[(j & 3) * 4 + (i & 3)] / 16 - .5) * 10, q = (n) => Math.max(0, Math.min(255, Math.round((n * shade + th) / 12) * 12)), o = (j * N + i) * 4;
    D[o] = q(col[0]); D[o + 1] = q(col[1]); D[o + 2] = q(col[2]); D[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); DEEP.jup = c;
}
/* the large moons: real order and period ratios, distances drawn in to fit the view */
const GALILEAN = [{ n: "Io", a: 1.2, P: 1.769, s: .026, c: [232, 196, 96] }, { n: "Europa", a: 1.44, P: 3.551, s: .022, c: [226, 218, 196] }, { n: "Callisto", a: 1.95, P: 16.69, s: .034, c: [120, 104, 88] }];
function moonDot(x, px, py, r, c) {
  const g = x.createRadialGradient(px - r * .45, py - r * .4, r * .1, px, py, r);
  g.addColorStop(0, "rgb(" + c.map(v => Math.min(255, v + 30)).join(",") + ")"); g.addColorStop(.7, "rgb(" + c.join(",") + ")"); g.addColorStop(1, "rgb(" + c.map(v => v * .25 | 0).join(",") + ")");
  x.fillStyle = g; x.beginPath(); x.arc(px, py, Math.max(1.5, r), 0, TAU); x.fill();
}
/* ---- the bodies Ganymede keeps track of ----
   rule  what the motion says about the body
   camp  Jupiter Trojans: two swarms on Jupiter's own path, one ahead (L4, the Greek camp) and one behind (L5, the Trojan camp); each sways about its point
   belt  main-belt minor planets: a steady stream along one band
   near  near-Earth bodies: quick, close, bent a little as they pass
   train artificial satellites: fast straight tracks in trains, panels flashing now and then
   comet comets: an open curve that speeds up nearest the Sun and slows away from it, the tail always pointing away from the Sun
   family moons of the other worlds: a parent's moons circle together, nearest fastest, while the family drifts by
   pair  asteroids with a companion: the companion circles them as they go
   wander centaurs: unsettled paths that weave
   far   trans-Neptunian bodies and dwarf planets: small, dim and slow */
const LANES = [
  { k: "J", camp: 4, n: 6, rule: "camp" }, { k: "J", camp: 5, n: 5, rule: "camp" }, { k: "A", n: 5, rule: "belt" }, { k: "N", n: 2, rule: "near" },
  { k: "K", n: 5, rule: "train" }, { k: "Y", n: 1, rule: "comet" }, { k: "Y", n: 1, rule: "comet" }, { k: "M", n: 5, rule: "family" }, { k: "Z", n: 2, rule: "pair" },
  { k: "C", n: 2, rule: "wander" }, { k: "T", n: 4, rule: "far" }, { k: "D", n: 1, rule: "far" }
];
const SUN_DIR = [-.83, -.56];                                   /* the light on Jupiter comes from the upper left: the Sun is that way */
function deepLanes() { if (!DEEP.lanes.length) DEEP.lanes = LANES.map((l, i) => Object.assign({ i, bodies: [], wait: 1 + i * .6, asked: false }, l)); }
function deepAsk(l) { if (l.asked || !SKY.w) return; l.asked = true; SKY.w.postMessage({ lane: l.i, k: l.k, camp: l.camp, n: l.n, rule: l.rule }); }
function deepSprite(b) {
  let c = DEEP.spr.get(b.id); if (c) { DEEP.spr.delete(b.id); DEEP.spr.set(b.id, c); return c; }   /* most recently used last */
  c = document.createElement("canvas"); c.width = c.height = 16; const x = c.getContext("2d"), im = x.createImageData(16, 16), P = PAL[DOOR_OF[b.k] || "white"];
  b.rows.forEach((h, y) => { const v = parseInt(h, 16); for (let i = 0; i < 16; i++) if ((v >> (15 - i)) & 1) { const o = (y * 16 + i) * 4; im.data[o] = P[0]; im.data[o + 1] = P[1]; im.data[o + 2] = P[2]; im.data[o + 3] = 255; } });
  x.putImageData(im, 0, 0); DEEP.spr.set(b.id, c);
  if (DEEP.spr.size > 420) { const first = DEEP.spr.keys().next().value; if (!DEEP.shown.has(first)) DEEP.spr.delete(first); }  /* the picture is set aside; the body stays in the sky */
  return c;
}
function deepGot(m) {
  const l = DEEP.lanes[m.lane]; if (!l) return; l.asked = false;
  if (!m.bodies || !m.bodies.length) { l.wait = 4; return; }
  const W = DEEP.W, H = DEEP.H, now = performance.now() / 1000, U = Math.min(W, H);
  const h = (b, k) => hash2(b.seed | 0, k);
  if (l.rule === "camp") {
    m.bodies.forEach((b, i) => { b.born = now + i * 1.4; b.life = 55 + 30 * h(b, 1); b.lib = .05 + .1 * h(b, 2); b.lp = 40 + 50 * h(b, 3); b.ph = h(b, 4) * TAU; b.off = (h(b, 5) - .5) * .5; b.rad = (h(b, 6) - .5) * U * .07; b.sz = 11 + 5 * h(b, 7); });
  } else if (l.rule === "train") {
    const dir = h(m.bodies[0], 1) < .5 ? 1 : -1, ys = H * (.12 + .7 * h(m.bodies[0], 2)), sl = (h(m.bodies[0], 3) - .5) * .35, sp = 70 + 50 * h(m.bodies[0], 4), xs = dir > 0 ? -20 : W + 20;
    m.bodies.forEach((b, i) => { b.born = now; b.x0 = xs - i * 26 * dir; b.y0 = ys - i * 26 * dir * sl; b.vx = dir * sp; b.vy = dir * sp * sl; b.sz = 9; b.life = (W + 80 + i * 26) / sp + 1; });
  } else if (l.rule === "family") {
    const cy = H * (.2 + .6 * h(m.bodies[0], 1)), dir = h(m.bodies[0], 2) < .5 ? 1 : -1, sp = 5 + 4 * h(m.bodies[0], 3);
    m.bodies.forEach((b, i) => { b.born = now; b.cx0 = dir > 0 ? -60 : W + 60; b.cy = cy; b.vx = dir * sp; b.r = 16 + i * 11; b.w = .9 / Math.pow(1 + i, 1.5); b.ph = h(b, 4) * TAU; b.sz = 10; b.life = (W + 120) / sp; });
  } else {
    m.bodies.forEach((b, i) => {
      b.born = now + i * (l.rule === "belt" ? 3.5 : 1.5); const left = h(b, 1) < .5;
      if (l.rule === "belt") { b.x0 = -24; b.y0 = H * .62 + (h(b, 2) - .5) * H * .16; b.vx = 10 + 10 * h(b, 3); b.vy = -b.vx * .2; b.sz = 12 + 4 * h(b, 4); b.life = (W + 50) / b.vx; }
      else if (l.rule === "near") { b.x0 = left ? -30 : W + 30; b.y0 = H * (.15 + .7 * h(b, 2)); b.vx = (left ? 1 : -1) * (80 + 50 * h(b, 3)); b.vy = (h(b, 4) - .5) * 40; b.sz = 18 + 5 * h(b, 5); b.life = (W + 60) / Math.abs(b.vx); }
      else if (l.rule === "comet") { b.s0 = -1.7; b.span = 3.4; b.q = U * (.08 + .12 * h(b, 2)); b.ang = h(b, 3) * TAU; b.fx = W * (.25 + .5 * h(b, 4)); b.fy = H * (.25 + .5 * h(b, 5)); b.k = "Y"; b.sz = 13; b.T = 28 + 18 * h(b, 6); b.life = b.T; }
      else if (l.rule === "pair") { b.x0 = left ? -24 : W + 24; b.y0 = H * (.2 + .6 * h(b, 2)); b.vx = (left ? 1 : -1) * (12 + 8 * h(b, 3)); b.vy = 0; b.sz = 13; b.pr = 13 + 6 * h(b, 4); b.pw = 1.2 + h(b, 5); b.life = (W + 60) / Math.abs(b.vx); }
      else if (l.rule === "wander") { b.x0 = left ? -24 : W + 24; b.y0 = H * (.25 + .5 * h(b, 2)); b.vx = (left ? 1 : -1) * (14 + 8 * h(b, 3)); b.wa = H * (.04 + .06 * h(b, 4)); b.ww = .2 + .25 * h(b, 5); b.sz = 12; b.life = (W + 60) / Math.abs(b.vx); }
      else { b.x0 = left ? -16 : W + 16; b.y0 = H * (.06 + .88 * h(b, 2)); b.vx = (left ? 1 : -1) * (2.5 + 2.5 * h(b, 3)); b.vy = (h(b, 4) - .5); b.sz = 8; b.dim = .42; b.life = (W + 40) / Math.abs(b.vx); }
    });
  }
  l.bodies = m.bodies; l.wait = 0;
}
function deepPos(l, b, now) {
  const a = now - b.born, W = DEEP.W, H = DEEP.H;
  if (l.rule === "camp") {
    /* the two camps keep station on either side of Jupiter: L4 ahead (upper left of him here), L5 behind (lower right);
       each Trojan sways along the camp in a slow tadpole libration */
    const c4 = l.camp === 4, px = c4 ? W * .2 : W * .84, py = c4 ? H * .24 : H * .8, ux = px - DEEP.jx, uy = py - DEEP.jy, ul = Math.hypot(ux, uy) || 1;
    const tx = -uy / ul, ty = ux / ul, U = Math.min(W, H), along = b.off * U * .32 + b.lib * U * 1.3 * Math.sin(TAU * a / b.lp + b.ph);
    return [px + tx * along + ux / ul * b.rad, py + ty * along + uy / ul * b.rad];
  }
  if (l.rule === "train" || l.rule === "belt" || l.rule === "near" || l.rule === "far") {
    let x = b.x0 + b.vx * a, y = b.y0 + b.vy * a;
    if (l.rule === "near") { const dx = x - WD.cx, dy = y - (WD.cy + WD.oy), d = Math.hypot(dx, dy) || 1, bend = Math.min(40, 9000 / d); y += dy / d * bend * .4; }
    return [x, y];
  }
  if (l.rule === "family") { const c = b.cx0 + b.vx * a, th = b.ph + b.w * a; return [c + Math.cos(th) * b.r, b.cy + Math.sin(th) * b.r * .45]; }
  if (l.rule === "pair") return [b.x0 + b.vx * a, b.y0];
  if (l.rule === "wander") return [b.x0 + b.vx * a, b.y0 + b.wa * Math.sin(b.ww * a) + b.wa * .45 * Math.sin(b.ww * 2.3 * a + 1)];
  if (l.rule === "comet") {
    /* a parabola walked by Barker's equation: equal time, less arc near the Sun-side focus, more far from it */
    const f = Math.min(1, a / b.T), M = (f - .5) * 2 * 4.6, s = barker(M), c = Math.cos(b.ang), sn = Math.sin(b.ang);
    const u = 2 * s * b.q, v = (1 - s * s) * b.q;                         /* the focus sits at the origin */
    return [b.fx + u * c - v * sn, b.fy + u * sn + v * c, s];
  }
  return [b.x0, b.y0];
}
function barker(M) { const w = Math.cbrt(1.5 * M + Math.sqrt(2.25 * M * M + 1)); return w - 1 / w; }  /* tan(true anomaly / 2) from the parabolic mean anomaly */
function deepDraw(now, dt) {
  deepSize(); deepLanes(); DEEP.k = clamp(Math.min(DEEP.W, DEEP.H) / 620, .85, 1.6);
  const x = dctx, d = DEEP.dpr, W = DEEP.W, H = DEEP.H, t = reduce ? 0 : now / 1000;
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, deepCv.width, deepCv.height); x.drawImage(DEEP.stars, 0, 0);
  x.setTransform(d, 0, 0, d, 0, 0);
  if (now - DEEP.jupAt > (reduce ? 1e12 : 900)) { jupPaint(t); DEEP.jupAt = now; }
  const jx = DEEP.jx, jy = DEEP.jy, jr = DEEP.jr, tilt = -.05, mp = GALILEAN.map(m => {
    const th = TAU * (t / (m.P * 14)) + m.a * 3, ex = Math.cos(th) * jr * m.a, ey = Math.sin(th) * jr * m.a * .16;
    return { m, x: jx + ex * Math.cos(tilt) - ey * Math.sin(tilt), y: jy + ex * Math.sin(tilt) + ey * Math.cos(tilt), front: Math.sin(th) > 0, r: jr * m.s };
  });
  mp.forEach(p => { if (!p.front) moonDot(x, p.x, p.y, p.r, p.m.c); });
  x.save(); x.globalAlpha = .84; x.imageSmoothingEnabled = true; x.drawImage(DEEP.jup, jx - jr, jy - jr, jr * 2, jr * 2); x.restore();
  const hz = x.createRadialGradient(jx, jy, jr * .98, jx, jy, jr * 1.08); hz.addColorStop(0, "rgba(210,190,160,.16)"); hz.addColorStop(1, "rgba(210,190,160,0)"); x.fillStyle = hz; x.beginPath(); x.arc(jx, jy, jr * 1.08, 0, TAU); x.fill();
  mp.forEach(p => { if (p.front) moonDot(x, p.x, p.y, p.r, p.m.c); });
  /* the bodies */
  const sec = now / 1000; x.imageSmoothingEnabled = false;
  DEEP.lanes.forEach(l => {
    if (!l.bodies.length) { l.wait -= dt; if (l.wait <= 0) deepAsk(l); return; }
    let live = 0;
    l.bodies.forEach(b => {
      const a = sec - b.born; if (a < 0) { live++; return; } if (a > b.life) { DEEP.shown.delete(b.id); return; }
      live++; const p = deepPos(l, b, sec); if (!p) return; DEEP.shown.set(b.id, p);
      const fade = Math.min(1, a / 2, (b.life - a) / 2) * (b.dim || .8), fl = DEEP.flash.get(b.id), fa = fl ? Math.max(0, 1 - (now - fl) / 900) : 0;
      let al = fade; if (l.rule === "train" && hash2(b.seed | 0, Math.floor(sec * 2)) > .93) al = Math.min(1, al + .5);   /* a panel catches the light */
      if (l.rule === "comet") {
        const r = Math.hypot(p[0] - b.fx, p[1] - b.fy) || 1, len = Math.min(140, 3200 / Math.sqrt(r)), tx = -SUN_DIR[0], ty = -SUN_DIR[1];
        const g = x.createLinearGradient(p[0], p[1], p[0] + tx * len, p[1] + ty * len); g.addColorStop(0, "rgba(200,240,255," + (.5 * al).toFixed(3) + ")"); g.addColorStop(1, "rgba(200,240,255,0)");
        x.strokeStyle = g; x.lineWidth = 2; x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0] + tx * len, p[1] + ty * len); x.stroke();
      }
      if (l.rule === "pair") { const th = sec * b.pw + (b.seed % 7); x.fillStyle = "rgba(200,240,255," + (.8 * al).toFixed(3) + ")"; x.fillRect(Math.round(p[0] + Math.cos(th) * b.pr) - 1, Math.round(p[1] + Math.sin(th) * b.pr * .5) - 1, 2, 2); }
      x.globalAlpha = Math.min(1, al + fa); const s = b.sz * DEEP.k * (1 + .6 * fa); x.drawImage(deepSprite(b), Math.round(p[0] - s / 2), Math.round(p[1] - s / 2), s, s); x.globalAlpha = 1;
      if (fa > 0) { x.strokeStyle = "rgba(205,176,255," + (fa * .8).toFixed(3) + ")"; x.lineWidth = 1; x.beginPath(); x.arc(p[0], p[1], s * (.7 + (1 - fa) * 1.4), 0, TAU); x.stroke(); }
    });
    if (!live) { l.bodies = []; l.wait = l.rule === "train" ? 2.5 : l.rule === "comet" ? 6 : 1.2; }
  });
  /* the glyph field, carried as a case around the moon: it turns and flows only as the moon is turned */
  DEEP.caseT += dt * ((reduce ? 0 : .01) + WD.vel * .9 + WD.tv * .25);
}
addEventListener("resize", deepSize);
