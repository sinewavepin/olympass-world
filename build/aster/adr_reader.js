
/* ============ ASTER'S DYNAMIC READING (.adr) ============
   A book is plain text with cues in curly braces. The reader lets the text arrive at its own pace,
   the way a terminal writes, and the cues shape how it arrives. The whole format is described in
   library/ASTER_DYNAMIC_READING.md, written so that the original text can be handed to any
   assistant together with that guide, and the .adr file that comes back placed in the library.
   Cues that the reader does not know are passed over quietly, so a file never breaks a book. */
const ADR_SPANS = { hush: 1, whisper: 1, swell: 1, loud: 1, tremble: 1, glow: 1, echo: 1, pace: 1, slow: 1, fast: 1 };
const ADR_ONE = { pause: 1, breath: 1, tone: 1, scene: 1, beat: 1 };
const ADR_SCENES = ["night", "dawn", "sea", "aurora", "deep", "ember", "day"];
function adrParse(src) {
  src = String(src || "").replace(/\r\n?/g, "\n"); const meta = {}; let body = src;
  const m = src.match(/^\s*::adr[^\n]*\n([\s\S]*?)\n::[ \t]*(\n|$)/);
  if (m) { m[1].split("\n").forEach(l => { const k = l.match(/^\s*([A-Za-z_-]+)\s*:\s*(.*)$/); if (k) meta[k[1].toLowerCase()] = k[2].trim(); }); body = src.slice(m[0].length); }
  const pages = body.split(/\n[ \t]*---[ \t]*\n/).map(pg => {
    const blocks = []; pg.split(/\n[ \t]*\n/).forEach(raw => {
      const txt = raw.replace(/^\n+|\n+$/g, ""); if (!txt.trim()) return; const h = txt.match(/^((?:\{[^{}]*\}[ \t\n]*)*)(#{1,3})[ \t]+([\s\S]*)$/);   /* cues may stand before a heading */
      blocks.push({ h: h ? h[2].length : 0, ev: adrInline(h ? h[1] + h[3] : txt) });
    }); return blocks;
  }).filter(p => p.length);
  if (!meta.title) { for (const pg of pages) for (const b of pg) if (b.h) { meta.title = b.ev.filter(e => e.k === "ch").map(e => e.ch).join("").trim(); break; } }
  return { meta, pages: pages.length ? pages : [[{ h: 0, ev: adrInline("(an empty book)") }]] };
}
function adrInline(s) {
  const ev = [], stack = []; let i = 0;
  const fx = () => { const o = { pace: 1 }; stack.forEach(t => { const n = t.n, a = t.a;
    if (n === "hush" || n === "whisper") o.hush = 1; else if (n === "swell" || n === "loud") o.swell = 1; else if (n === "tremble") o.tremble = 1;
    else if (n === "glow") o.glow = a || "sun"; else if (n === "echo") o.echo = 1; else if (n === "slow") o.pace *= .55; else if (n === "fast") o.pace *= 1.7; else if (n === "pace") o.pace *= clamp(parseFloat(a) || 1, .1, 5); }); return o; };
  while (i < s.length) {
    const c = s[i];
    if (c === "{" && s[i + 1] === "{") { ev.push({ k: "ch", ch: "{", fx: fx() }); i += 2; continue; }
    if (c === "}" && s[i + 1] === "}") { ev.push({ k: "ch", ch: "}", fx: fx() }); i += 2; continue; }
    if (c === "{") {
      const j = s.indexOf("}", i); if (j < 0) { ev.push({ k: "ch", ch: c, fx: fx() }); i++; continue; }
      const tag = s.slice(i + 1, j).trim(), close = tag[0] === "/", parts = (close ? tag.slice(1) : tag).split(/\s+/), n = (parts[0] || "").toLowerCase(), a = parts.slice(1).join(" ");
      if (close) { for (let k = stack.length - 1; k >= 0; k--) if (stack[k].n === n || (n === "glow" && stack[k].n === "glow")) { const t = stack.splice(k, 1)[0]; if (n === "echo") ev.push({ k: "echo", from: t.at }); break; } }
      else if (ADR_SPANS[n]) stack.push({ n, a, at: ev.length });
      else if (ADR_ONE[n]) ev.push({ k: "cue", n, a });
      i = j + 1; continue;
    }
    ev.push({ k: "ch", ch: c === "\n" ? " " : c, fx: fx() }); i++;
  }
  return ev;
}
/* ---- the reader ---- */
const AR_RD = { book: null, p: null, pi: 0, bi: 0, ei: 0, wait: 0, acc: 0, last: 0, paused: false, speed: 1, blockEl: null, runEl: null, runKey: "", done: false };
function alRead(b) {
  const R = AR_RD; R.book = b; R.p = adrParse(b.src); R.pi = 0; R.speed = (+$("arPace").value || 100) / 100 * (parseFloat(R.p.meta.pace) || 1);
  $("arTitle").textContent = R.p.meta.title || b.title || "untitled"; $("arBy").textContent = R.p.meta.author ? "· " + R.p.meta.author : "";
  $("alRead").hidden = false; $("alRead").dataset.scene = ADR_SCENES.includes(R.p.meta.scene) ? R.p.meta.scene : "night"; $("alRead").style.setProperty("--ink", "rgb(" + (PAL[R.p.meta.ink] || PAL.sun).join(",") + ")");
  AL.read = R; alPage(0); try { $("arGo").focus({ preventScroll: true }); } catch (e) {}
}
function alStopRead() { AL.read = null; }
function alPage(i) {
  const R = AR_RD; R.pi = clamp(i, 0, R.p.pages.length - 1); R.bi = 0; R.ei = 0; R.wait = 260; R.acc = 0; R.last = 0; R.done = false; R.paused = false; R.blockEl = null;
  $("arText").innerHTML = ""; $("arGo").textContent = "PAUSE"; $("arPg").textContent = "PAGE " + (R.pi + 1) + " / " + R.p.pages.length; $("arPrev").disabled = R.pi === 0; $("arNext").disabled = R.pi >= R.p.pages.length - 1; AL.read = R;
}
function arCharDelay(ch, fx) {
  let d = 29 / (fx.pace || 1); if (".!?".includes(ch)) d += 330; else if (",;:".includes(ch)) d += 120; else if (ch === "—" || ch === "…") d += 180;
  return d / AR_RD.speed;
}
function arEmit(e) {
  const R = AR_RD, host = R.blockEl;
  if (e.k === "ch") {
    const f = e.fx, key = [f.hush, f.swell, f.tremble, f.glow, f.echo].join("|");
    if (f.swell || f.tremble) { const s = document.createElement("span"); s.className = (f.swell ? "fx-swell " : "") + (f.tremble ? "fx-tremble " : "") + (f.hush ? "fx-hush" : ""); if (f.glow) s.style.color = "rgb(" + (PAL[f.glow] || PAL.sun).join(",") + ")"; if (f.tremble) s.style.animationDelay = (-(R.ei % 7) * .03) + "s"; s.textContent = e.ch; host.appendChild(s); R.runKey = ""; return arCharDelay(e.ch, f); }
    if (key !== R.runKey || !R.runEl) { R.runEl = document.createElement("span"); R.runEl.className = (f.hush ? "fx-hush " : "") + (f.echo ? "fx-said" : ""); if (f.glow) { R.runEl.style.color = "rgb(" + (PAL[f.glow] || PAL.sun).join(",") + ")"; R.runEl.classList.add("fx-glow"); } host.appendChild(R.runEl); R.runKey = key; }
    R.runEl.textContent += e.ch; return arCharDelay(e.ch, f);
  }
  if (e.k === "echo") {
    const blk = R.p.pages[R.pi][R.bi].ev, txt = blk.slice(e.from, R.ei).filter(x => x.k === "ch").map(x => x.ch).join("");
    const g = document.createElement("span"); g.className = "fx-echo"; g.textContent = " " + txt.trim(); host.appendChild(g); R.runKey = ""; return 600 / R.speed;
  }
  if (e.k === "cue") {
    if (e.n === "pause") return clamp(parseFloat(e.a) || 1, 0, 20) * 1000 / R.speed;
    if (e.n === "breath") { const el = $("alRead"); el.classList.remove("breath"); void el.offsetWidth; el.classList.add("breath"); return 1100 / R.speed; }
    if (e.n === "scene") { if (ADR_SCENES.includes(e.a)) $("alRead").dataset.scene = e.a; return 0; }
    if (e.n === "tone" || e.n === "beat") { const v = TIMBRE[e.a] ? e.a : "stars"; playGlyph(v + ":adr", { hz: TIMBRE[v].base, vol: .32 }); return 0; }
  }
  return 0;
}
function arNextBlock() {
  const R = AR_RD, pg = R.p.pages[R.pi]; if (R.bi >= pg.length) return false;
  const b = pg[R.bi], el = document.createElement(b.h ? "h3" : "p"); el.className = b.h ? "arH" : "arP"; $("arText").appendChild(el); R.blockEl = el; R.runEl = null; R.runKey = ""; return true;
}
function alReadStep(now) {
  const R = AR_RD; if (!R.p || R.paused || R.done) { R.last = 0; return; }
  const dt = R.last ? Math.min(120, now - R.last) : 16; R.last = now; R.acc += dt; let guard = 0;
  while (R.acc >= R.wait && guard++ < 40) {
    R.acc -= R.wait; R.wait = 0;
    if (!R.blockEl) { if (!arNextBlock()) { R.done = true; arPageEnd(); return; } }
    const ev = R.p.pages[R.pi][R.bi].ev;
    if (R.ei >= ev.length) { R.bi++; R.ei = 0; R.blockEl = null; R.wait = 480 / R.speed; continue; }
    R.wait = arEmit(ev[R.ei]); R.ei++;
  }
  const t = $("arText"); if (t.scrollHeight - t.scrollTop - t.clientHeight < 120) t.scrollTop = t.scrollHeight;
}
function arPageEnd() {
  const R = AR_RD; $("arGo").textContent = R.pi < R.p.pages.length - 1 ? "TURN THE PAGE" : "FROM THE START";
}
function arShowAll() {
  const R = AR_RD; if (!R.p) return; const keep = R.speed; R.speed = 1e9;
  while (!R.done) { if (!R.blockEl) { if (!arNextBlock()) { R.done = true; break; } } const ev = R.p.pages[R.pi][R.bi].ev; if (R.ei >= ev.length) { R.bi++; R.ei = 0; R.blockEl = null; continue; } const e = ev[R.ei]; if (!(e.k === "cue" && (e.n === "tone" || e.n === "beat"))) arEmit(e); R.ei++; }
  R.speed = keep; arPageEnd();
}
function alReaderInit() {
  $("arGo").addEventListener("click", () => { const R = AR_RD; if (R.done) { if (R.pi < R.p.pages.length - 1) alPage(R.pi + 1); else alPage(0); return; } R.paused = !R.paused; $("arGo").textContent = R.paused ? "READ ON" : "PAUSE"; });
  $("arPrev").addEventListener("click", () => { alPage(AR_RD.pi - 1); arShowAll(); });
  $("arNext").addEventListener("click", () => alPage(AR_RD.pi + 1));
  $("arAll").addEventListener("click", arShowAll);
  $("arPace").addEventListener("input", e => { AR_RD.speed = (+e.target.value / 100) * (parseFloat(AR_RD.p && AR_RD.p.meta.pace) || 1); $("arPaceV").textContent = (+e.target.value / 100).toFixed(2) + "×"; });
}
