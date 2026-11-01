/* ---------- eyes: where pictures come from ---------- */
const srcC = $("srcCanvas"), srcX = srcC.getContext("2d", { willReadFrequently: true });
function sampleMoon() {
  const c = srcX, n = 256;
  const g = c.createLinearGradient(0, 0, 0, n); g.addColorStop(0, "#05060c"); g.addColorStop(1, "#1a1d2b"); c.fillStyle = g; c.fillRect(0, 0, n, n);
  for (let i = 0; i < 60; i++) { const x = (i * 97) % n, y = (i * 53) % n; c.fillStyle = "rgba(255,255,255," + (0.25 + (i % 5) * 0.12) + ")"; c.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1); }
  const r = c.createRadialGradient(100, 100, 10, 128, 128, 92); r.addColorStop(0, "#fff7dd"); r.addColorStop(.7, "#c9a24a"); r.addColorStop(1, "#5a4520");
  c.fillStyle = r; c.beginPath(); c.arc(128, 128, 90, 0, 7); c.fill();
  [[96, 100, 18], [150, 84, 12], [160, 150, 22], [104, 166, 14], [138, 122, 8]].forEach(([x, y, k]) => { c.fillStyle = "rgba(60,44,16,.55)"; c.beginPath(); c.arc(x, y, k, 0, 7); c.fill(); c.strokeStyle = "rgba(255,240,200,.5)"; c.lineWidth = 2; c.beginPath(); c.arc(x - 1, y - 1, k, 3.4, 5.4); c.stroke(); });
  c.strokeStyle = "#4df0ff"; c.lineWidth = 3; c.beginPath(); c.ellipse(128, 128, 118, 30, -0.5, 0, 7); c.stroke();
  c.fillStyle = "#e2af43"; c.font = "bold 22px monospace"; c.fillText("GANYMEDE", 62, 242);
}
function fitDraw(src, w, h) {
  srcX.fillStyle = "#000"; srcX.fillRect(0, 0, 256, 256);
  const s = Math.min(256 / w, 256 / h), dw = w * s, dh = h * s; srcX.imageSmoothingEnabled = true; srcX.imageSmoothingQuality = "high";
  srcX.drawImage(src, (256 - dw) / 2, (256 - dh) / 2, dw, dh);
}
function setSend(t, bad) { say($("sendStatus"), t, bad); }
function setMain(t, bad) { say($("mainStatus"), t, bad); }
function loadBlob(blob, how) {
  const url = URL.createObjectURL(blob), im = new Image();
  im.onload = () => { fitDraw(im, im.naturalWidth, im.naturalHeight); URL.revokeObjectURL(url); setSend(how + " fitted to the screen. Press Transmit."); plog("eyes: " + how); };
  im.onerror = () => setSend("That could not be read as a picture.", true);
  im.src = url;
}
$("imageLoader").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; if (f) loadBlob(f, "Picture"); e.target.value = ""; });
document.addEventListener("paste", e => {
  const items = (e.clipboardData && e.clipboardData.items) || []; for (const it of items) if (it.type && it.type.startsWith("image/")) { const f = it.getAsFile(); if (f) { e.preventDefault(); loadBlob(f, "Pasted picture"); return; } }
});
$("pasteBtn").addEventListener("click", async () => {
  try {
    const list = await navigator.clipboard.read();
    for (const item of list) for (const t of item.types) if (t.startsWith("image/")) { loadBlob(await item.getType(t), "Pasted picture"); return; }
    setSend("The clipboard holds no picture. Copy one, then press Paste.", true);
  } catch (e) { setSend("This browser wants you to paste yourself: press Ctrl+V (or long-press and choose Paste) while this page is open.", true); }
});
$("grabBtn").addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) { setSend("This browser cannot grab the screen. Use Paste or Picture instead.", true); return; }
  try {
    const st = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false }), v = document.createElement("video"); v.srcObject = st; v.muted = true; v.playsInline = true; await v.play();
    await new Promise(r => setTimeout(r, 300)); fitDraw(v, v.videoWidth, v.videoHeight); st.getTracks().forEach(t => t.stop());
    setSend("Screen grabbed from the Plasmodial Liquid Crystal Wind. Press Transmit."); plog("eyes: screen grab " + v.videoWidth + "x" + v.videoHeight);
  } catch (e) { setSend("Screen grab was cancelled or is not allowed here.", true); }
});

/* ---------- sending ---------- */
let actx = null, playSrc = null, playRaf = 0;
function audioCtx() { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); return actx; }
function stopPlay() { if (playSrc) { try { playSrc.stop(); } catch (e) {} playSrc = null; } cancelAnimationFrame(playRaf); $("scanLine").style.display = "none"; $("playBtn").disabled = false; $("stopBtn").disabled = true; wheelState.sending = false; }
$("playBtn").addEventListener("click", () => {
  const ctx = audioCtx(), tx = buildTx(srcC, $("modeSel").value, $("rivUp").checked, TS, ctx.sampleRate);
  const buf = ctx.createBuffer(1, tx.data.length, ctx.sampleRate); buf.copyToChannel(tx.data, 0);
  const src = ctx.createBufferSource(); src.buffer = buf; src.connect(ctx.destination); playSrc = src;
  const t0 = ctx.currentTime + 0.15; src.onended = () => { if (playSrc === src) { stopPlay(); setSend("Transmission finished."); } };
  src.start(t0); $("playBtn").disabled = true; $("stopBtn").disabled = false; wheelState.sending = true; plog("transmit " + tx.seconds.toFixed(1) + " s, " + tx.marks.length + " plane(s)");
  const scan = $("scanLine"); scan.style.display = "block";
  const tick = () => {
    const t = ctx.currentTime - t0; if (t < 0) setSend("Starting..."); else {
      let mk = tx.marks[0]; for (const m of tx.marks) if (t >= m.t) mk = m;
      const lt = t - mk.t, lineS = periodOf(mk.M);
      if (lt < LEAD + GAPT) setSend("Leader tone and header (" + mk.label + "). Receivers wake up here.");
      else { const y = Math.max(0, Math.min(mk.M.n - 1, Math.floor((lt - LEAD - GAPT) / lineS))); scan.style.top = (y / mk.M.n * 100) + "%"; setSend("Transmitting " + mk.label + ": line " + (y + 1) + " of " + mk.M.n + "  ·  " + Math.max(0, Math.ceil(tx.seconds - t)) + " s left"); }
    }
    if (t < tx.seconds) playRaf = requestAnimationFrame(tick);
  };
  playRaf = requestAnimationFrame(tick);
});
$("stopBtn").addEventListener("click", () => { stopPlay(); setSend("Stopped."); });
$("wavBtn").addEventListener("click", () => {
  const tx = buildTx(srcC, $("modeSel").value, $("rivUp").checked, TS, 48000); saveBlob(wavBlob(tx.data, 48000), "dragonet-" + $("modeSel").value + ($("rivUp").checked ? "-colour" : "") + ".wav");
  setSend("Sound saved. Play it near any listening device.");
});

/* ---------- ears: listen until told to shut ---------- */
const WORKLET = "class T extends AudioWorkletProcessor{constructor(){super();this.b=new Float32Array(2048);this.k=0}process(i){const c=i[0]&&i[0][0];if(c){for(let j=0;j<c.length;j++){this.b[this.k++]=c[j];if(this.k===2048){this.port.postMessage(this.b.slice(0));this.k=0}}}return true}}registerProcessor('dragonet-tap',T);";
let rx = null, mic = null;
function onChunk(d) {
  let s = 0; for (let k = 0; k < d.length; k += 4) s += d[k] * d[k];
  wheelState.level = Math.min(1, Math.sqrt(s / (d.length / 4)) * 2.2);
  if (rx && !rx.push(d)) { plog("buffer reset"); rx.reset(); }
}
async function startListen() {
  const recvS = $("recvStatus");
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { say(recvS, "This browser cannot reach a microphone from here. Open the page from its https address in Chrome, Edge, Safari or Firefox.", true); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } }); }
  catch (e) { say(recvS, "The microphone was blocked. Allow it for this page in the address bar, then press Listen again.", true); return; }
  const ctx = audioCtx(), srcNode = ctx.createMediaStreamSource(stream), mute = ctx.createGain(); mute.gain.value = 0; mute.connect(ctx.destination);
  rx = new Receiver(ctx.sampleRate, rxCallbacks); let node = null, how = "worklet";
  try {
    const url = URL.createObjectURL(new Blob([WORKLET], { type: "text/javascript" })); await ctx.audioWorklet.addModule(url); URL.revokeObjectURL(url);
    node = new AudioWorkletNode(ctx, "dragonet-tap", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] }); node.port.onmessage = ev => onChunk(ev.data);
  } catch (e) {
    how = "script processor"; node = ctx.createScriptProcessor(4096, 1, 1); node.onaudioprocess = ev => onChunk(new Float32Array(ev.inputBuffer.getChannelData(0)));
  }
  srcNode.connect(node); node.connect(mute); mic = { stream, srcNode, node, mute };
  if (deck.cur == null) { clearOut(deck.pend ? deck.pend.n : 128); setProg(0); }
  wheelState.listening = true; $("shutVeil").classList.remove("on"); $("listenBtn").disabled = true; $("shutBtn").disabled = false;
  say(recvS, "Eyes open. Downloading everything it hears until you press Shut Eyes."); setMain("Eyes open. Ears at " + ctx.sampleRate + " Hz."); plog("listening (" + how + ", " + ctx.sampleRate + " Hz)");
}
function shutEyes() {
  if (mic) { try { mic.node.disconnect(); mic.srcNode.disconnect(); mic.stream.getTracks().forEach(t => t.stop()); if (mic.node.port) mic.node.port.onmessage = null; } catch (e) {} mic = null; }
  const got = deck.cur ? deck.cur.count : 0, n = deck.cur ? deck.cur.n : 0; finishCur(); rx = null;
  wheelState.listening = false; wheelState.level = 0; $("shutVeil").classList.add("on"); $("listenBtn").disabled = false; $("shutBtn").disabled = true;
  say($("recvStatus"), got ? "Eyes shut. Kept the unfinished picture (" + got + " of " + n + " lines)." : "Eyes shut."); setMain("Eyes shut. Press Listen to open them."); plog("eyes shut");
}
$("listenBtn").addEventListener("click", startListen);
$("shutBtn").addEventListener("click", shutEyes);
$("clearBtn").addEventListener("click", () => { if (rx) rx.reset(); clearDeck(); $("shelf").innerHTML = ""; shelfItems.length = 0; say($("recvStatus"), mic ? "Cleared. Still listening." : "Cleared. Press Listen."); });

/* ---------- glyph bridge controls ---------- */
$("musicOn").addEventListener("change", e => { MU.on = e.target.checked; if (MU.on) { muWake(); } say($("glyphStatus"), MU.on ? "Music is on. Each band of the picture sings as it arrives." : "Music is off."); });
$("glyphBtn").addEventListener("click", () => {
  const src = deck.last; if (!src) { say($("glyphStatus"), "Nothing received yet. Receive or test a picture first."); return; }
  if (deck.view === "glyph") { deck.view = "eye"; $("glyphBtn").classList.remove("on"); const p = deck.showP; if (p) { sizeOut(p.n); outX.drawImage(p.canvas, 0, 0); } else { clearOut(src.n); for (let y = 0; y < src.n; y++) paintGreyRow(src, y); outX.putImageData(deck.im, 0, 0); } say($("glyphStatus"), "Back to the picture."); return; }
  deck.view = "glyph"; $("glyphBtn").classList.add("on"); drawGlyphEye(glyphGrid(src.data, src.n)); say($("glyphStatus"), "Glyph eye: the picture as Ganymede's glyphs, brightest where the picture is.");
});
$("musicBtn").addEventListener("click", () => {
  const src = deck.last || { data: planesOf(srcC, 128, false).y, n: 128 };
  say($("glyphStatus"), deck.last ? "Playing the last received picture as music." : "Playing the sending picture as music."); playGrid(glyphGrid(src.data, src.n), () => say($("glyphStatus"), "Finished."));
});
$("musicStop").addEventListener("click", () => { hush(); say($("glyphStatus"), "Hushed."); });

/* ---------- porthole, wind tunnel ---------- */
$("tapeSave").addEventListener("click", () => saveBlob(new Blob([tapeLines.join("\n") + "\n"], { type: "text/plain" }), "dragonet-porthole.txt"));
function gauss() { return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()); }
async function windTunnel(opts) {
  const fs = 48000, st = $("testStatus"), snr = opts && opts.snr != null ? opts.snr : +$("snrSel").value, colour = opts && opts.colour != null ? opts.colour : $("rivUp").checked, mode = opts && opts.mode || $("modeSel").value;
  say(st, "Building the sound..."); await new Promise(r => setTimeout(r, 30));
  const tx = buildTx(srcC, mode, colour, TS, fs), clean = tx.data, delay = Math.round(0.03 * fs), g = 0.2;
  let pw = 0; for (let k = 0; k < clean.length; k += 7) pw += clean[k] * clean[k]; const sig = Math.sqrt(pw / (clean.length / 7)) * g, sd = sig / Math.pow(10, snr / 20);
  const room = new Float32Array(clean.length + Math.round(fs * 0.5));
  for (let k = 0; k < room.length; k++) room[k] = ((k < clean.length ? clean[k] : 0) + 0.25 * (k >= delay && k - delay < clean.length ? clean[k - delay] : 0)) * g + gauss() * sd;
  clearDeck(); const test = new Receiver(fs, rxCallbacks); const before = $("shelf").children.length;
  for (let k = 0; k < room.length; k += 4096) { test.push(room.subarray(k, Math.min(room.length, k + 4096))); if ((k / 4096) % 40 === 0) await new Promise(r => setTimeout(r, 0)); }
  finishCur();
  const pics = $("shelf").children.length - before, p = deck.pend, lastPic = deck.last;
  const grey = planesOf(srcC, MODES[mode].n, false).y; let err = 0, cnt = 0;
  if (lastPic && lastPic.n === MODES[mode].n) for (let i = 0; i < grey.length; i++) { err += Math.abs(lastPic.data[i] - grey[i]); cnt++; }
  const msg = "Rebuilt " + pics + " picture(s); grey error " + (cnt ? (err / cnt / 255 * 100).toFixed(1) : "-") + "% of full brightness" + (p ? "; colour " + (p.cbDone && p.crDone ? "complete" : "partial") : "") + ".";
  say(st, msg); window.__lastTest = { test, msg, pics, colourDone: !!(p && p.cbDone && p.crDone), err: cnt ? err / cnt / 255 * 100 : null, stamp: lastPic && lastPic.stamp }; return window.__lastTest;
}
$("testBtn").addEventListener("click", async () => { $("testBtn").disabled = true; try { await windTunnel(); } finally { $("testBtn").disabled = false; } });

/* ---------- start ---------- */
sampleMoon(); drawTitle(); initDial(); clearOut(128); setProg(0); requestAnimationFrame(artLoop);
plog("DRAGONET.FLY awake");
window.DRAGONET = {
  version: 1, on: (ev, fn) => bus.addEventListener(ev, e => fn(e.detail)), listen: startListen, shutEyes,
  setTime: s => setTime(s), time: () => TS, stamp: () => stampText(TS),
  eyes: { draw: (img, w, h) => fitDraw(img, w || img.width, h || img.height) },
  _test: { Receiver, buildTx, planesOf, windTunnel, MODES, srcC, deck, rxCallbacks, glyphGrid, GL, stampText, readout, CALS, EVENTS, setTime }
};
