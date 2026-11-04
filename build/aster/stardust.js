
/* ============ STARDUST KINEMATICS: the library made of light sand ============
   One pool of glowing grains makes everything here: the floating asterisk, the light that forms
   each Node's cube, its aperture, its title and the shapes the title turns into. Grains are never
   made or thrown away. When a shape changes, the field that holds the grains shifts and the grains
   travel through space to their next places; nothing fades in or out.
   Each grain is held by a spring toward a target the current structure gives it (an attractor);
   how stiff the spring is decides whether the grains flow like water, slosh, or snap into place. */
const SD = { n: 0, x: null, y: null, vx: null, vy: null, tx: null, ty: null, k: null, r: null, g: null, b: null, role: null, slot: null, seed: null,
  mode: "aster", t0: 0, ox: 0, oy: 0, nodes: [], last: 0, plan: null };
const SD_EDGE = 230, SD_AP = 54, SD_TITLE = 162, SD_CORE = 520;
function sdAlloc(n) {
  const F = () => new Float32Array(n); Object.assign(SD, { n, x: F(), y: F(), vx: F(), vy: F(), tx: F(), ty: F(), k: F(), r: F(), g: F(), b: F(), role: new Int16Array(n), slot: F(), seed: F() });
  for (let i = 0; i < n; i++) { SD.seed[i] = hash2(i, 911); SD.slot[i] = hash2(i, 913); const a = SD.seed[i] * TAU, r = 6 * hash2(i, 915); SD.x[i] = Math.cos(a) * r; SD.y[i] = Math.sin(a) * r; SD.r[i] = 205; SD.g[i] = 176; SD.b[i] = 255; }
}
function sdNeed() { return SD_CORE + Math.max(2, AL.books.length + 1) * (SD_EDGE + SD_AP + SD_TITLE); }
/* ---- the asterisk as memory-water: grains held along eight arms, swirling and sliding inside the boundary ---- */
function asPt(form, arm, t) {
  const th = arm * TAU / 8;
  if (form === 0) { const r = .14 + .86 * t; return [r * Math.cos(th), r * Math.sin(th)]; }
  if (form === 1) { const a = [Math.cos(th), Math.sin(th)], b = [.38 * Math.cos(th + 1.15), .38 * Math.sin(th + 1.15)]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  if (form === 2) { const r = 1 - .58 * t, a = th + 1.7 * t; return [r * Math.cos(a), r * Math.sin(a)]; }
  const half = t < .5, f = half ? t * 2 : (t - .5) * 2, r = half ? 1 - .58 * f : .42 + .58 * f, a = th + (half ? f : 1 + f) * Math.PI / 8; return [r * Math.cos(a), r * Math.sin(a)];
}
function sdAsterTargets(R, t, near, ndx, ndy) {
  const sh = asShape(t), rot = t * .18, cr = Math.cos(rot), sr = Math.sin(rot);
  for (let i = 0; i < SD.n; i++) {
    const s = SD.seed[i], arm = Math.floor(s * 8), core = SD.slot[i] < .14;
    let px, py;
    if (core) { const a = s * TAU * 7 + t * (1.2 + s), rr = R * .16 * Math.sqrt(SD.slot[i] / .14); px = Math.cos(a) * rr; py = Math.sin(a) * rr; }
    else {
      const u = clamp(SD.slot[i] + .07 * Math.sin(t * (1.1 + s * 1.7) + s * 40), 0, 1);                                    /* grains slide along their arm */
      const p = asPt(sh.a, arm, u), q = asPt(sh.b, arm, u), wob = .045 * Math.sin(t * 9 + s * 90);                          /* and shiver across it */
      const ax = p[0] + (q[0] - p[0]) * sh.f, ay = p[1] + (q[1] - p[1]) * sh.f, ex = ax * cr - ay * sr, ey = ax * sr + ay * cr, l = Math.hypot(ex, ey) || 1;
      px = (ex - ey / l * wob) * R; py = (ey + ex / l * wob) * R;
      if (near > 0) {                                                                                                        /* something near: the field ripples and leans toward it */
        const dot = Math.max(0, (px * ndx + py * ndy) / (Math.hypot(px, py) || 1)), rip = Math.sin(l * 9 - t * 7) * near * R * .06;
        px += ndx * R * .22 * near * dot - ey / l * rip; py += ndy * R * .22 * near * dot + ex / l * rip;
      }
    }
    SD.tx[i] = px; SD.ty[i] = py; SD.k[i] = 140;
  }
}
function sdStep(dt, damp) {
  const n = SD.n, steps = dt > .02 ? 2 : 1, h = dt / steps;
  for (let s = 0; s < steps; s++) for (let i = 0; i < n; i++) {
    const k = SD.k[i], c = (damp || 2) * Math.sqrt(k);
    SD.vx[i] += (k * (SD.tx[i] - SD.x[i]) - c * SD.vx[i]) * h; SD.vy[i] += (k * (SD.ty[i] - SD.y[i]) - c * SD.vy[i]) * h;
    SD.x[i] += SD.vx[i] * h; SD.y[i] += SD.vy[i] * h;
  }
}
function sdDraw(x, ox, oy, scale, alpha, colFn) {
  for (let i = 0; i < SD.n; i++) {
    const c = colFn ? colFn(i) : null, r = c ? c[0] : SD.r[i], g = c ? c[1] : SD.g[i], b = c ? c[2] : SD.b[i], sp = Math.min(1, Math.hypot(SD.vx[i], SD.vy[i]) / 600);
    x.fillStyle = "rgba(" + (r + (255 - r) * sp | 0) + "," + (g + (255 - g) * sp | 0) + "," + (b + (255 - b) * sp | 0) + "," + alpha + ")";
    const sz = SD.seed[i] > .92 ? 2 : 1.3; x.fillRect(ox + SD.x[i] * scale - sz / 2, oy + SD.y[i] * scale - sz / 2, sz, sz);
  }
}
/* the floating asterisk, now made of grains */
const _asStepPlain = asStep;
asStep = function (now) {
  const show = AR.done && !body.classList.contains("inroom") && !AL.open && WD.w;
  AS.cv.classList.toggle("on", !!show); if (!show) { AS.last = 0; return; }
  if (SD.n !== sdNeed() && AL.ready) { sdAlloc(sdNeed()); } else if (!SD.n) sdAlloc(sdNeed());
  const dt = AS.last ? Math.min(.05, (now - AS.last) / 1000) : .016; AS.last = now; const t = now / 1000, W = innerWidth, H = innerHeight;
  AS.s = Math.max(30, WD.R * .5);
  const tx = W * (.5 + .38 * Math.sin(t * .043 + 1.3) + .07 * Math.sin(t * .11)), ty = H * (.5 + .34 * Math.sin(t * .031 + .4) + .07 * Math.sin(t * .13 + 2));
  if (!AS.init) { AS.x = W * .18; AS.y = H * .7; AS.init = true; }
  let ax = (tx - AS.x) * .35 - AS.vx * .9, ay = (ty - AS.y) * .35 - AS.vy * .9, near = 0, ndx = 0, ndy = 0;
  const away = (x, y, r, k) => { const dx = AS.x - x, dy = AS.y - y, d = Math.hypot(dx, dy) || 1; if (d < r) { const f = k * (1 - d / r); ax += dx / d * f; ay += dy / d * f; } };
  const sense = (x, y, r) => { const dx = x - AS.x, dy = y - AS.y, d = Math.hypot(dx, dy) || 1, f = Math.max(0, 1 - d / r); if (f > near) { near = f; ndx = dx / d; ndy = dy / d; } };
  away(WD.cx, WD.cy + WD.oy, WD.R * 1.6 + AS.s, 900); sense(WD.cx, WD.cy + WD.oy, WD.R * 3.2);
  if (typeof DOORS !== "undefined") DOORS.forEach(d => { if (d.px) { away(d.px, d.py + WD.oy, 95 + AS.s * .5, 700); sense(d.px, d.py + WD.oy, 230); } });
  if (window.__deepOn) sense(DEEP.jx, DEEP.jy, DEEP.jr * 1.4);
  if (AS.y < 70 + AS.s) ay += 400; if (AS.y > H - 96 - AS.s) ay -= 400; if (AS.x < AS.s) ax += 400; if (AS.x > W - AS.s) ax -= 400;
  away(W - 90, H - 30, 150, 600);
  if (reduce) { ax = ay = 0; AS.vx = AS.vy = 0; } AS.vx += ax * dt; AS.vy += ay * dt; AS.x += AS.vx * dt; AS.y += AS.vy * dt;
  const col = asColour(AS.x, AS.y); AS.col = AS.col.map((v, i) => v + (col[i] - v) * Math.min(1, dt * 2.5));
  const d = Math.min(window.devicePixelRatio || 1, 2), S = Math.ceil(AS.s * 2.4), cv = AS.cv, R = AS.s * .5;
  if (cv.width !== S * d) { cv.width = S * d; cv.height = S * d; cv.style.width = S + "px"; cv.style.height = S + "px"; }
  cv.style.transform = "translate(" + (AS.x - S / 2).toFixed(1) + "px," + (AS.y - S / 2).toFixed(1) + "px)";
  SD.mode = "aster"; sdAsterTargets(R, reduce ? 0 : t, near, ndx, ndy); sdStep(dt, 1.4);
  /* the colour runs as a gradient across the grains: toward whatever is near, the colour of what is near */
  const base = AS.col, nc = near > 0 ? asColour(AS.x + ndx * 200, AS.y + ndy * 200) : base;
  for (let i = 0; i < SD.n; i++) { const l = Math.hypot(SD.x[i], SD.y[i]) || 1, f = near * Math.max(0, (SD.x[i] * ndx + SD.y[i] * ndy) / l) * .9; SD.r[i] = base[0] + (nc[0] - base[0]) * f; SD.g[i] = base[1] + (nc[1] - base[1]) * f; SD.b[i] = base[2] + (nc[2] - base[2]) * f; }
  const x = AS.ctx; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, S, S); x.globalCompositeOperation = "lighter"; sdDraw(x, S / 2, S / 2, 1, .55); x.globalCompositeOperation = "source-over";
};
/* ---- the shapes the grains are pulled into ---- */
function sdTextPts(text, px, n) {
  const c = document.createElement("canvas"), x = c.getContext("2d"), font = "700 " + px + "px " + getComputedStyle(document.documentElement).getPropertyValue("--font-crt");
  x.font = font; const w = Math.ceil(x.measureText(text).width) + 4, h = Math.ceil(px * 1.3); c.width = w; c.height = h; x.font = font; x.textBaseline = "middle"; x.fillStyle = "#fff"; x.fillText(text, 2, h / 2);
  const im = x.getImageData(0, 0, w, h).data, pts = [];
  for (let yy = 0; yy < h; yy += 1) for (let xx = 0; xx < w; xx += 1) if (im[(yy * w + xx) * 4 + 3] > 140) pts.push([xx - w / 2, yy - h / 2]);
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const out = [];
  for (let i = 0; i < n; i++) out.push(pts.length ? pts[Math.floor(i * pts.length / n)] : [0, 0]);
  return out;
}
function sdNodePlan() {
  const N = AL.nodes; SD.nodes = N.map(n => {
    const h = alHex(n), ra = n.s * .2, segs = [];
    for (let k = 0; k < 6; k++) segs.push([h[k], h[(k + 1) % 6]]);
    [1, 3, 5].forEach(k => { const p = h[k], dx = p[0] - n.x, dy = p[1] - n.y, d = Math.hypot(dx, dy); segs.push([[n.x + dx / d * ra * 1.15, n.y + dy / d * ra * 1.15], p]); });
    const L = [0]; segs.forEach(s => L.push(L[L.length - 1] + Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1])));
    const title = (n.b.title || "untitled").slice(0, 26), fs = Math.max(8, Math.min(n.s * .1, n.s * 1.15 / (Math.max(1, title.length) * .6)));
    return { n, segs, L, ra, path: alPath(n), title: sdTextPts(title, Math.round(fs * 1.6), SD_TITLE).map(p => [p[0] / 1.6, p[1] / 1.6]), ink: PAL[n.b.empty ? "white" : n.b.ink] || PAL.sun, empty: !!n.b.empty };
  });
  /* every grain gets its place: a node, a part (edge, aperture, title) and a slot; the rest stay as drifting dust */
  let i = 0; SD.role.fill(-1);
  SD.nodes.forEach((nd, ni) => {
    nd.e0 = i; for (let j = 0; j < SD_EDGE; j++, i++) { SD.role[i] = ni * 4 + 0; SD.slot[i] = j / SD_EDGE; }
    nd.a0 = i; for (let j = 0; j < SD_AP; j++, i++) { SD.role[i] = ni * 4 + 1; SD.slot[i] = j / SD_AP; }
    nd.t0 = i; for (let j = 0; j < SD_TITLE; j++, i++) { SD.role[i] = ni * 4 + 2; SD.slot[i] = j / SD_TITLE; }
  });
  SD.dust0 = i;
}
function sdEdgeAt(nd, u) { const tot = nd.L[nd.L.length - 1], s = ((u % 1) + 1) % 1 * tot; let j = 1; while (nd.L[j] < s) j++; const a = nd.segs[j - 1], f = (s - nd.L[j - 1]) / (nd.L[j] - nd.L[j - 1] || 1); return [a[0][0] + (a[1][0] - a[0][0]) * f, a[0][1] + (a[1][1] - a[0][1]) * f]; }
/* the title's own journey and the turning of its shapes, all as places for the 162 grains of the title */
function sdTitleTarget(nd, j, t, out) {
  const n = nd.n, T = 18, u = ((t - n.i * 1.7) % T + T) % T, s = n.s, P = nd.path, home = nd.title[j], cx = n.x, cy = n.y;
  const star = (sc) => { const arm = j % 8, f = .15 + .85 * Math.floor(j / 8) / (SD_TITLE / 8); const p = asPt(0, arm, f); return [cx + p[0] * s * sc, cy + p[1] * s * sc]; };
  const eight = (rot, flow) => { const a = (j / SD_TITLE + flow) * TAU, x0 = Math.sin(a * 2) * .5, y0 = Math.sin(a); const r = s * .26, cs = Math.cos(rot), sn = Math.sin(rot); return [cx + (x0 * cs - y0 * sn) * r, cy + (x0 * sn + y0 * cs) * r]; };
  const grids = () => { const side = j < 81 ? -1 : 1, q = j % 81, gx = q % 9, gy = Math.floor(q / 9), step = s * .028; return [cx + side * s * .19 + (gx - 4) * step, cy + (gy - 4) * step]; };
  const vortex = (f) => { const a = j * 2.399 + t * 6, r = s * .3 * (1 - f) * (.3 + .7 * (j / SD_TITLE)); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  let p, k = 120;
  if (u < 5) {                                                         /* the trace: the title runs out along the light of its frame, around the aperture, and home */
    const head = smooth(u / 5) * (P.len + 26 * 9), lead = head - (home[0] + s) * 1.1;
    p = lead > 0 && lead < P.len ? alAt(P, lead) : [cx + home[0], cy + home[1]]; k = 260;
  } else if (u < 6.4) { p = [cx + home[0], cy + home[1]]; k = 320; }
  else if (u < 7.4) { const a = j * 2.399 + t * 1.4, r = s * (.12 + .2 * hash2(j, 3)); p = [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; k = 18; }        /* dissolve into the stream */
  else if (u < 7.9) { p = [cx + (hash2(j, 5) - .5) * 4, cy + (hash2(j, 6) - .5) * 4]; k = 220; }                                                          /* rush to a dense core */
  else if (u < 8.6) { p = star(.42); k = 160; }                                                                                                               /* splash into the asterisk */
  else if (u < 10.6) { p = eight(0, (u - 8.6) * .22); k = 60; }                                                                                               /* pour down through the 8 */
  else if (u < 12.6) { p = eight(smooth(clamp((u - 10.6) / 1.2, 0, 1)) * Math.PI / 2, (u - 8.6) * .22); k = 26; }                                            /* gravity turns: the 8 lies down as ∞ */
  else if (u < 14.4) { p = grids(); k = 900; }                                                                                                                /* the loop's tension snaps: two strict grids */
  else if (u < 15.6) { p = vortex(clamp((u - 14.4) / 1.2, 0, 1)); k = 90; }                                                                                   /* the grids let go and swirl in */
  else if (u < 16.6) { p = star(.42); k = 160; }                                                                                                              /* the asterisk again */
  else { p = [cx + home[0], cy + home[1]]; k = 70; }                                                                                                          /* and the title, gathered back */
  out[0] = p[0]; out[1] = p[1]; return k;
}
/* ---- the opening: implosion, eruption along field lines, sorting into the cubes, the titles forged ---- */
function sdOpen() {
  if (SD.n !== sdNeed()) sdAlloc(sdNeed()); alLayout(); sdNodePlan();
  for (let i = 0; i < SD.n; i++) { SD.x[i] += AS.x; SD.y[i] += AS.y; SD.tx[i] = SD.x[i]; SD.ty[i] = SD.y[i]; }
  SD.mode = "open"; SD.t0 = performance.now(); SD.ox = AS.x; SD.oy = AS.y; SD.last = 0;
}
function sdClose() { SD.mode = "close"; SD.t0 = performance.now(); }
const _sdOut = [0, 0];
function sdLibTargets(now) {
  const e = (now - SD.t0) / 1000, t = now / 1000, O = [SD.ox, SD.oy], W = innerWidth, H = innerHeight;
  for (let i = 0; i < SD.n; i++) {
    const role = SD.role[i], s = SD.slot[i];
    if (SD.mode === "close") { SD.tx[i] = AS.x + (SD.seed[i] - .5) * 6; SD.ty[i] = AS.y + (hash2(i, 7) - .5) * 6; SD.k[i] = 40 + 80 * Math.min(1, e); continue; }
    if (SD.mode === "open" && e < .45) { const a = SD.seed[i] * TAU, r = 3 + 3 * hash2(i, 3); SD.tx[i] = O[0] + Math.cos(a) * r; SD.ty[i] = O[1] + Math.sin(a) * r; SD.k[i] = 600; continue; }   /* the implosion */
    if (role < 0) {                                                                                     /* the dust that is not holding a shape drifts through the grid */
      const a = SD.seed[i] * TAU + t * .02 * (1 + hash2(i, 9)), rx = W * (.15 + .7 * hash2(i, 11)), ry = H * (.15 + .7 * hash2(i, 12));
      SD.tx[i] = W / 2 + Math.cos(a) * rx * .5; SD.ty[i] = H / 2 + Math.sin(a * 1.3) * ry * .5; SD.k[i] = 3; continue;
    }
    const nd = SD.nodes[role >> 2], part = role & 3; if (!nd) continue;
    let dest, k = 120;
    if (part === 0) dest = sdEdgeAt(nd, s + t * .035);                                                   /* edges: the cube is drawn by grains flowing along it */
    else if (part === 1) { const a = s * TAU - t * .5; dest = [nd.n.x + Math.cos(a) * nd.ra, nd.n.y + Math.sin(a) * nd.ra]; }
    else { k = sdTitleTarget(nd, Math.round(s * SD_TITLE), t, _sdOut); dest = [_sdOut[0], _sdOut[1]]; }
    if (SD.mode === "open") {
      const ni = role >> 2, delay = .45 + ni * .08 + (part === 2 ? .35 : 0) + s * .35, f = clamp((e - delay) / .85, 0, 1);
      if (f < 1) {
        /* the eruption: each stream runs along its own arc, like a field line, from the core to its node */
        const mx = (O[0] + nd.n.x) / 2 + (nd.n.x - O[0]) * .1, my = Math.min(O[1], nd.n.y) - H * (.28 + .06 * ni), g = smooth(f);
        const entry = part === 2 ? [nd.n.x, nd.n.y] : dest;
        dest = [(1 - g) * (1 - g) * O[0] + 2 * (1 - g) * g * mx + g * g * entry[0], (1 - g) * (1 - g) * O[1] + 2 * (1 - g) * g * my + g * g * entry[1]]; k = f > 0 ? 400 : 600;
        if (f === 0) dest = [O[0], O[1]];
      } else if (part === 2 && e < delay + 2.1) {
        const v = clamp((e - delay - .85) / 1.2, 0, 1), a = s * TAU * 3 + e * 7 * (1 - v), r = nd.n.s * .3 * (1 - v);       /* a vortex in the centre, slowing, then the snap */
        if (v < 1) { dest = [nd.n.x + Math.cos(a) * r, nd.n.y + Math.sin(a) * r]; k = 140; } else { dest = [nd.n.x + nd.title[Math.round(s * SD_TITLE) % SD_TITLE][0], nd.n.y + nd.title[Math.round(s * SD_TITLE) % SD_TITLE][1]]; k = 900; }
      } else if (part === 0 && e < delay + 2) { dest = sdEdgeAt(nd, s + t * .035 + (1 - clamp((e - delay - .85) / 1.6, 0, 1)) * 1.2); }   /* first they race around the edges */
    }
    SD.tx[i] = dest[0]; SD.ty[i] = dest[1]; SD.k[i] = k;
  }
}
function sdLibPaint(now) {
  const c = $("alc"), x = c.getContext("2d"), d = AL.d || 1, W = innerWidth, H = innerHeight, dt = SD.last ? Math.min(.04, (now - SD.last) / 1000) : .016; SD.last = now;
  sdLibTargets(now); sdStep(dt, SD.mode === "open" && (now - SD.t0) < 1600 ? 1.1 : 1.6);
  x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H); x.globalCompositeOperation = "lighter";
  sdDraw(x, 0, 0, 1, .8, i => { const r = SD.role[i]; if (r < 0) return [150, 160, 200]; const nd = SD.nodes[r >> 2]; return nd ? ((r & 3) === 2 ? [255, 246, 220] : nd.ink) : null; });
  x.globalCompositeOperation = "source-over";
  /* labels under the nodes, typed like scrapbook tags */
  x.font = "500 9px " + getComputedStyle(document.documentElement).getPropertyValue("--font-crt"); x.textAlign = "center";
  const e = (now - SD.t0) / 1000; if (SD.mode === "lib" || e > 3) SD.nodes.forEach(nd => { const lab = nd.n.b.sub || nd.n.b.author; if (!lab) return; x.fillStyle = "rgba(180,190,220,.6)"; x.fillText(lab.toUpperCase(), nd.n.x, nd.n.y + nd.n.s * .82); });
  if (SD.mode === "open" && e > 3.2) SD.mode = "lib";
}
/* the library opens and closes through the grains */
const _alOpenSD = alOpen;
alOpen = function () { const was = AL.open; _alOpenSD(); if (!was && AL.open) sdOpen(); };
alPaint = function (now) { if (SD.n) sdLibPaint(now); };
const _alCloseSD = alClose;
alClose = function () {
  if (!AL.open || SD.mode === "close") return; sdClose(); $("alRead").hidden = true; $("gdPanel").hidden = true;
  setTimeout(() => { for (let i = 0; i < SD.n; i++) { SD.x[i] -= AS.x; SD.y[i] -= AS.y; } SD.mode = "aster"; _alCloseSD(); }, 850);
};
const _alLayoutSD = alLayout;
alLayout = function () { _alLayoutSD(); if (AL.open && SD.n) { if (SD.n !== sdNeed()) { const keep = SD.mode; sdAlloc(sdNeed()); SD.mode = keep; } sdNodePlan(); } };
