/* ---------- pixel art: title, satellite, rolling stone wheel ---------- */
const wheelState = { rx: 0, tx: 0, listening: false, sending: false, level: 0, ang: 0, speed: 0, track: 0 };
const FONT = {
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"], F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"], Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"]
};
function drawTitle() {
  const c = $("title"), x = c.getContext("2d"), txt = "DRAGONET.FLY", s = 4, W = txt.length * 6 - 1;
  c.width = W * s + s; c.height = 7 * s + s; x.imageSmoothingEnabled = false;
  const stripes = ["#ffe27a", "#ffc23a", "#ff9a24", "#ff7a1f", "#e05a14", "#b8420e", "#8a300b"];
  for (const pass of [0, 1]) {
    let ox = 0;
    for (const ch of txt) {
      const g = FONT[ch]; for (let r = 0; r < 7; r++) for (let q = 0; q < 5; q++) if (g[r][q] === "1") {
        x.fillStyle = pass === 0 ? "#2a1608" : stripes[r]; x.fillRect((ox + q) * s + (pass === 0 ? s : 0), r * s + (pass === 0 ? s : 0), s, s);
      }
      ox += 6;
    }
  }
}
function drawSat(t) {
  const c = $("sat"), x = c.getContext("2d"); x.clearRect(0, 0, 40, 28); const cx = 20, cy = 14, R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const flap = Math.sin(t * 1.4) * 0.45;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const lift = sy * flap * (sx > 0 ? 1 : -1) * 0.5 + sy * 0.55;
    for (let i = 0; i < 13; i++) {
      const px = cx + sx * (5 + i) - (sx < 0 ? 1 : 0), py = Math.round(cy + sy * 2 + lift * i * 1.0 - 1);
      R(px, py, 1, 3, i % 4 === 0 ? "#f4e6c3" : (i % 2 ? "#2aa7bd" : "#4df0ff"));
    }
    R(cx + sx * 3 - (sx < 0 ? 1 : 0), cy + sy * 2, 2, 1, "#b59a6a");
  }
  R(cx - 3, cy - 3, 6, 6, "#d9c7a0"); R(cx - 2, cy - 2, 4, 4, "#7a6642"); R(cx - 1, cy - 1, 2, 2, "#ff7a1f");
  R(cx - 1, cy - 6, 2, 1, "#f4e6c3"); R(cx - 2, cy - 7, 4, 1, "#b59a6a"); R(cx, cy - 8, 1, 1, "#ffb23e");
}
/* stone wheel: a carved disc, shaded, spinning on a track */
const WTEX = (() => {
  const n = 64, t = new Uint8Array(n * n * 2); /* value, carve */
  const h = (a, b) => { let v = (a * 374761393 + b * 668265263) >>> 0; v = ((v ^ (v >> 13)) * 1274126177) >>> 0; return (v ^ (v >> 16)) / 4294967295; };
  return { n, h };
})();
const STONE = [[40, 30, 20], [74, 58, 38], [112, 90, 58], [150, 124, 82], [190, 160, 110]];
function drawWheel(now, dt) {
  const c = $("wheel"), x = c.getContext("2d"), W = 112, H = 56, im = x.createImageData(W, H), d = im.data;
  const live = wheelState.listening || wheelState.sending, recent = now - wheelState.rx < 1500;
  let target = 0; if (wheelState.listening) target = 0.7 + wheelState.level * 5 + (recent ? 1.6 : 0); if (wheelState.sending) target = -1.8;
  wheelState.speed += (target - wheelState.speed) * Math.min(1, dt * 3); wheelState.ang += wheelState.speed * dt; wheelState.track += wheelState.speed * dt * 18;
  const cx = 56, cy = 27, R = 23;
  for (let i = 0; i < W * H; i++) { d[i * 4] = 10; d[i * 4 + 1] = 7; d[i * 4 + 2] = 4; d[i * 4 + 3] = 255; }
  for (let xx = 0; xx < W; xx++) { const gy = 51; for (let k = 0; k < 2; k++) { const o = ((gy + k) * W + xx) * 4; d[o] = 90; d[o + 1] = 70; d[o + 2] = 40; } const dot = ((xx + Math.floor(wheelState.track)) % 9 + 9) % 9; if (dot === 0) { const o = ((gy + 3) * W + xx) * 4; d[o] = 160; d[o + 1] = 120; d[o + 2] = 60; } }
  for (let py = cy - R; py <= cy + R; py++) for (let px = cx - R; px <= cx + R; px++) {
    const dx = px - cx, dy = py - cy, r = Math.sqrt(dx * dx + dy * dy); if (r > R) continue;
    const a = Math.atan2(dy, dx) - wheelState.ang; let lvl = 2;
    if (r > R - 3) lvl = 3; else if (r > R - 5) lvl = 1;
    else if (r > R - 11 && Math.cos(a * 12) > 0.55) lvl = 0;
    else if (r < 5) lvl = r < 2.5 ? 0 : 3;
    else if (r < 9 && Math.abs(Math.sin(a * 4)) < 0.16) lvl = 1;
    else { const nz = WTEX.h(Math.floor(r / 2), Math.floor(a * r / 3 + 50)); lvl = nz > 0.82 ? 3 : nz < 0.18 ? 1 : 2; }
    const lit = -(dx + dy) / (R * 1.4); lvl = Math.max(0, Math.min(4, Math.round(lvl + lit * 1.3)));
    const o = (py * W + px) * 4, col = STONE[lvl], dim = live ? 1 : 0.55; d[o] = col[0] * dim; d[o + 1] = col[1] * dim; d[o + 2] = col[2] * dim;
  }
  x.putImageData(im, 0, 0);
}
let lastT = performance.now();
function artLoop(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now; drawSat(now / 1000); drawWheel(now, dt);
  const lv = wheelState.level, k = Math.min(20, Math.round(lv * 40)), hot = lv > 0.5;
  $("vu").textContent = "LVL [" + "#".repeat(k) + "-".repeat(20 - k) + "]" + (hot ? "  TOO LOUD" : "");
  $("lampEars").className = "lamp" + (wheelState.listening ? " on" : ""); $("lampRx").className = "lamp" + (wheelState.listening && now - wheelState.rx < 1500 ? " on" : "");
  $("lampTx").className = "lamp" + (wheelState.sending ? " hot" : "");
  requestAnimationFrame(artLoop);
}
