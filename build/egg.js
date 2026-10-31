
/* ============ the song, hidden on the front page: tap the moon three times ============ */
const ROV = { on: false, sh: 0 };
const HZ = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.26, F5: 698.46, G5: 783.99 };
const SONG = [["Hap-py birth-day to you", "G4 G4 A4 G4 C5 B4"], ["Hap-py birth-day to you", "G4 G4 A4 G4 D5 C5"], ["Hap-py birth-day dear Gan-y-mede", "G4 G4 G5 E5 C5 B4 A4"], ["Hap-py birth-day to you", "F5 F5 E5 C5 D5 C5"]];
const fold = f => { while (f > 13) f /= 2; while (f < 6.5) f *= 2; return f; };
const rwait = ms => new Promise(r => setTimeout(r, ms));
const stageEl = $("shell");
requestAnimationFrame(function shiverLoop(now) {
  requestAnimationFrame(shiverLoop);
  if (ROV.sh && !reduce) { const t = now / 1000; stageEl.style.transform = "translate(" + (Math.sin(TAU * ROV.sh * t) * 1.4).toFixed(2) + "px," + (Math.cos(TAU * ROV.sh * t * 1.01) * .8).toFixed(2) + "px)"; }
  else if (stageEl.style.transform) stageEl.style.transform = "";
});
function postSay(lines) { try { term.contentWindow.postMessage({ tesela: "say", lines }, "*"); } catch (e) {} }
async function eggSong() {
  if (ROV.on) { ROV.on = false; return; }
  ROV.on = true; closeRoom(); wake(); const beat = 560, gl = $("eggGl"), g2 = gl.getContext("2d");
  for (let p = 0; p < SONG.length && ROV.on; p++) {
    const notes = SONG[p][1].split(" "), d = notes.length === 7 ? [.75, .25, 1, 1, 1, 1, 2] : [.75, .25, 1, 1, 1, 2];
    for (let i = 0; i < notes.length && ROV.on; i++) {
      const n = notes[i], hz = HZ[n], sh = fold(hz), ms = d[i] * beat;
      readout("<b>" + n + "</b> · " + hz.toFixed(2) + " Hz &rarr; " + sh.toFixed(1) + " Hz shiver<br>" + SONG[p][0]);
      g2.clearRect(0, 0, 16, 16); g2.drawImage(stBmp("notes:" + n, "gold"), 0, 0); gl.style.left = WD.cx + "px"; gl.style.top = (WD.cy - WD.R - 46) + "px"; gl.classList.add("on");
      ROV.sh = sh; playGlyph("notes:" + n, { x: .5, vol: .85 }); ring(WD.cx, WD.cy, "255,236,96", 170, 1300); WD.vel += .35 * (i % 2 ? -1 : 1);
      kick = (performance.now() - t0) / 1000;
      await rwait(ms * .9); ROV.sh = 0; gl.classList.remove("on"); await rwait(ms * .1 + 40);
    }
    await rwait(beat);
  }
  const done = ROV.on; ROV.on = false; ROV.sh = 0; gl.classList.remove("on");
  readout(done ? "<b>THE SONG</b><br>once is the performance" : "<b>HUSHED</b>");
  setTimeout(() => { if (!ROV.on && !curRoom) readout("<b>6 PORTALS OPEN</b><br>hover a door to hear its glyphs"); }, 4200);
}
