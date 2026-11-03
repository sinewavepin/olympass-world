
/* ============ WHO ANSWERED: the console's feed ============
   "I hear you." stays the whole message. Clicking it opens a small terminal scroll that lists, in
   the order they came home, the bodies that returned the wave: the name, what the body is, and how
   long its return took. The feed is kept in this browser between visits. */
const HF = { log: [], wave: 0, open: false, rest: false };
const HF_KIND = { S: "the star", P: "planet", D: "dwarf planet", A: "minor planet", C: "centaur", T: "trans-Neptunian object", N: "near-Earth body", H: "on an open path", Y: "comet", Z: "minor planet with a companion", K: "artificial satellite" };
function hfWhat(e) {
  if (e.k === "M") return "moon of " + (e.p || "?");
  if (e.k === "J") return "Jupiter Trojan · " + (e.x === 5 ? "Trojan camp (L5)" : "Greek camp (L4)");
  if (e.k === "X") return e.name === "Lucy" ? "spacecraft" : e.p ? "companion of " + e.p : "Lucy target";
  return HF_KIND[e.k] || "body";
}
function hfLoad() { try { const a = JSON.parse(localStorage.getItem("olympass.heard.v1") || "[]"); if (Array.isArray(a)) HF.log = a.slice(-400); } catch (e) {} HF.wave = HF.log.reduce((m, l) => Math.max(m, l.w || 0), 0); }
function hfSave() { try { localStorage.setItem("olympass.heard.v1", JSON.stringify(HF.log.slice(-400))); } catch (e) {} }
function hfLine(l, fresh) {
  const d = document.createElement("div"); d.className = "hfL" + (fresh ? " new" : "") + (l.t === "w" ? " hfW" : "");
  if (l.t === "w") d.textContent = "— wave " + l.w + " · " + l.at + " —";
  else { const n = document.createElement("b"); n.textContent = l.n; const s = document.createElement("span"); s.textContent = "  " + l.what + "  ·  " + l.s + " s"; d.appendChild(document.createTextNode("› ")); d.appendChild(n); d.appendChild(s); }
  return d;
}
function hfRender() { const host = $("hfLog"); host.innerHTML = ""; HF.log.forEach(l => host.appendChild(hfLine(l))); host.scrollTop = host.scrollHeight; $("hfN").textContent = HF.log.filter(l => l.t !== "w").length; }
function hfWave() { HF.wave++; const now = new Date(), at = now.toTimeString().slice(0, 8); HF.log.push({ t: "w", w: HF.wave, at }); hfSave(); if (HF.open) { $("hfLog").appendChild(hfLine(HF.log[HF.log.length - 1], true)); $("hfLog").scrollTop = 1e9; } }
function hfHeard(e) {
  const l = { n: e.name || e.id, what: hfWhat(e), s: e.delay.toFixed(1), w: HF.wave }; HF.log.push(l); hfSave();
  if (!HF.rest) { HF.rest = true; $("hears").classList.add("rest"); }
  if (HF.open) { const host = $("hfLog"); host.appendChild(hfLine(l, true)); host.scrollTop = host.scrollHeight; $("hfN").textContent = HF.log.filter(x => x.t !== "w").length; }
}
function hfToggle(on) {
  HF.open = on === undefined ? !HF.open : on; $("hearsFeed").hidden = !HF.open; $("hears").setAttribute("aria-expanded", String(HF.open)); $("hears").classList.toggle("open", HF.open);
  if (HF.open) hfRender();
}
function hfInit() {
  hfLoad(); const h = $("hears"); h.setAttribute("role", "button"); h.setAttribute("tabindex", "0"); h.setAttribute("aria-expanded", "false"); h.setAttribute("aria-controls", "hearsFeed"); h.title = "Who answered";
  h.addEventListener("click", () => hfToggle()); h.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hfToggle(); } });
  $("hfX").addEventListener("click", () => hfToggle(false));
}
