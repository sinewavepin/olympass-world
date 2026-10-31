import base64, re
import os
B=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')+'/'
rd=lambda p:open(B+p,encoding='utf-8').read()
def rep(s,old,new,n=1):
    assert s.count(old)==n,(s.count(old),old[:90]); return s.replace(old,new)
# ---- terminal (same as pass 4, plus SKY / TENSOR commands) ----
t=rd('src/RIVER.COM.html')
t=rep(t,'    REBOOT: () => bootRun(),',
 '    TESELA: () => { say(["SUPER POWER SHELL","the moon opens its doors again."]); setTimeout(() => parent.postMessage({ tesela: "replay" }, "*"), 700); },\n'
 '    "TESELA.LUN": () => C.TESELA(), "MOON.DOS": () => C.TESELA(), MOON: () => { say(["GANYMEDE · JUPITER III","back to the moon."]); setTimeout(() => parent.postMessage({ tesela: "moon" }, "*"), 400); },\n'
 '    SITE: () => { say(["SITE · olympass.world","opening the room."]); setTimeout(() => parent.postMessage({ tesela: "site" }, "*"), 400); },\n'
 '    SONG: () => { say(["SONG","the moon will hum it, once."]); setTimeout(() => parent.postMessage({ tesela: "song" }, "*"), 400); },\n'
 '    SKY: () => { say(["THE SKY","Ganymede\'s point of view."]); setTimeout(() => parent.postMessage({ tesela: "studio" }, "*"), 400); }, STUDIO: () => C.SKY(),\n'
 '    TENSOR: () => { say(["THE TENSOR","nine roles, twenty-five places, and water."]); setTimeout(() => parent.postMessage({ tesela: "tensor" }, "*"), 400); },\n'
 '    REBOOT: () => bootRun(),')
t=rep(t,'HELP: () => say(["1–9 or a page\'s name opens it", "DIR · HELLO · VER · STAMP · GATE",',
        'HELP: () => say(["1–9 or a page\'s name opens it", "DIR · HELLO · VER · STAMP · GATE · MOON · SKY · TENSOR · SITE · SONG · TESELA",')
t=rep(t,'  background: radial-gradient(ellipse 70% 55% at 16% -8%, var(--lamp), transparent 70%), var(--room);\n  color: var(--bezel);','  background: transparent;\n  color: var(--bezel);')
t=rep(t,'/* ============ the link: RIVER.COM becomes RiverLink ============ */',
 'window.addEventListener("message", e => { if (e.data && e.data.tesela === "enter") say(["SUPER POWER SHELL","MOON · SKY · TENSOR · SITE"], 5000); if (e.data && e.data.tesela === "say") say(e.data.lines, 4200); });\n\n/* ============ the link: RIVER.COM becomes RiverLink ============ */')
# ---- aurora (from shell.js), egg, sky ----
s=rd('build/shell.js'); s=s[:s.index('/* ============ STUDIO: the third window')]
s=rep(s,'  const x = actx, t = reduce ? 0 : now / 1000, splash = document.body.classList.contains("splash");\n  let tx = AW * .5, ty = AH * .56, tu = Math.min(AW, AH) * .075;\n  if (splash && gw) { const g = mglass.getBoundingClientRect(); if (g.width) { tx = g.left + MCX; ty = g.top + MCY; tu = Math.max(MR, 40) / 1.15; } }',
 '  const x = actx, t = reduce ? 0 : now / 1000;\n  let tx = AW * .5, ty = AH * .56, tu = Math.min(AW, AH) * .075;\n  if (WD.w) { tx = WD.cx; ty = WD.cy + WD.oy; tu = Math.max(WD.R, 40) / 1.15; }')
s=rep(s,'  const base = splash ? $("pathL") : term;\n  const rr = base.getBoundingClientRect();\n  if (rr.width) threadFrame(x, rr, t, splash ? .9 : 1);',
 '  const base = curRoom === "river" ? $("riverBox") : curRoom === "site" ? $("siteBox") : curRoom === "studio" ? $("studioBox") : curRoom === "tensor" ? $("tensorBox") : null;\n  if (base) { const rr = base.getBoundingClientRect(); if (rr.width) threadFrame(x, rr, t, .95); }')
sky=rd('build/sky.js'); egg=rd('build/egg.js'); tens=rd('build/tensor.js')
# ---- world.js ----
w=rd('build/world.js')
i=w.index('const DOORS = ['); j=w.index('];',i)+2
w=w[:i]+'''const DOORS = [
  { id: "river", name: "RIVER.COM", sub: "the terminal", ang: -90, rgb: "47,168,255", col: "eblue", pool: ["paths", "signals", "water", "bridge1", "frequencies"] },
  { id: "engine", name: "THE ENGINE", sub: "olympass.world", ang: -30, rgb: "255,138,40", col: "orange", pool: ["structure", "iron", "arrays", "core", "magnetism"] },
  { id: "terminal", name: "THE TERMINAL", sub: "olympass.world", ang: 30, rgb: "168,214,120", col: "leaf", pool: ["stars", "orbits", "signals", "bridge2", "bridge4"] },
  { id: "case", name: "THE CASE", sub: "olympass.world", ang: 90, rgb: "205,176,255", col: "violet", pool: ["craters", "radiation", "magnetism", "bridge3"] },
  { id: "tensor", name: "THE TENSOR", sub: "nine roles · water", ang: 150, rgb: "233,225,204", col: "white", pool: ["structure", "arrays", "frequencies", "water", "iron"] },
  { id: "studio", name: "THE SKY", sub: "ganymede's view", ang: 210, rgb: "255,236,96", col: "gold", pool: ["stars", "orbits", "signals", "notes", "frequencies", "paths"] }
];'''+w[j:]
w=rep(w,'oy: 38, spinOff: 0, vel: 0, drag: false, lastX: 0 };','oy: 38, spinOff: 0, vel: 0, tilt: 0, tv: 0, ringA: 0, lag: 0, drag: false, lastX: 0, lastY: 0, moved: 0, taps: [], rx: 0, ry: 0, ap: [9, 9] };')
w=rep(w,'const picked = d.id === "studio" ? d.poolIds.slice(0, 12) : Array.from(','const picked = Array.from(')
w=rep(w,'tk = d.token, studio = d.id === "studio";','tk = d.token, studio = false;')
w=rep(w,'JSON.stringify({ taught: this.taught, seen: this.seen })','JSON.stringify({ taught: this.taught, seen: this.seen, tn: this.tn })')
w=rep(w,'this.seen = o.seen || {}; }','this.seen = o.seen || {}; this.tn = o.tn || null; }')
w=rep(w,'const GAN = { taught: {}, seen: {}, save()','const GAN = { taught: {}, seen: {}, tn: null, save()')
# layout: store ring params, place doors
w=rep(w,'''  DOORS.forEach(d => {
    const a = d.ang * Math.PI / 180; d.px = clamp(WD.cx + Math.cos(a) * rx, dw / 2 + 6, w - dw / 2 - 6); d.py = clamp(WD.cy + Math.sin(a) * ry, Hd / 2 + 6, h - 66 - Hd / 2);
    d.el.style.left = d.px + "px"; d.el.style.top = d.py + "px"; d.el.style.width = dw + "px";
  });''','''  WD.rx = rx; WD.ry = ry; WD.dw = dw; WD.Hd = Hd; DOORS.forEach(d => { d.el.style.width = dw + "px"; }); placeDoors(true);''')
w=rep(w,'function layoutWorld() {','''/* the ring of doors turns with the moon: yaw swings it round, tilt leans it, and it lags a little behind */
function placeDoors(force) {
  const w = WD.w, h = WD.h, T = clamp(WD.tilt, -.9, .9), key = WD.ringA.toFixed(4) + "|" + T.toFixed(4) + "|" + w + "|" + h; if (!force && key === WD.ap[0]) return; WD.ap[0] = key;
  DOORS.forEach(d => {
    const a = d.ang * Math.PI / 180 + WD.ringA, x3 = Math.cos(a) * WD.rx, y3 = Math.sin(a) * WD.ry, zz = Math.sin(a) * Math.sin(T);
    d.px = clamp(WD.cx + x3 * (1 + zz * .07), WD.dw / 2 + 6, w - WD.dw / 2 - 6); d.py = clamp(WD.cy + y3 * Math.cos(T) + (Math.cos(a) * WD.rx * Math.sin(T) * .12), WD.Hd / 2 + 6, h - 66 - WD.Hd / 2);
    d.el.style.left = d.px.toFixed(1) + "px"; d.el.style.top = d.py.toFixed(1) + "px"; d.el.style.zIndex = String(10 + Math.round(zz * 8)); d.el.style.filter = "brightness(" + (1 + zz * .22).toFixed(2) + ")";
  });
}
function layoutWorld() {''')
# physics + moon
w=rep(w,'  if (!WD.drag) { WD.spinOff += WD.vel * .016; WD.vel *= .96; }\n','''  const fr = Math.pow(.18, dt);                             /* momentum with a slight drag */
  if (!WD.drag) { WD.spinOff += WD.vel * dt; WD.vel *= fr; WD.tilt += WD.tv * dt; WD.tv *= fr; WD.tilt -= WD.tilt * (1 - Math.pow(.62, dt)); }
  WD.tilt = clamp(WD.tilt, -.9, .9);
  const ringT = WD.spinOff * .42; WD.lag = ringT - WD.ringA; WD.ringA += WD.lag * (1 - Math.exp(-dt * 7)); placeDoors(false);
''')
w=rep(w,'const mb = renderMoon(WD.MNp, spin, -.22);','const mb = renderMoon(WD.MNp, spin, -.22 + WD.tilt * .8);')
w=rep(w,'  if (!reduce) DOORS.forEach(d => {\n    const hot','''  const lagOn = Math.abs(WD.lag) > .003 || Math.abs(WD.tv) > .02 || Math.abs(WD.vel) > .02;
  if (!reduce) DOORS.forEach(d => {
    if (lagOn || d.offOn) { d.offOn = lagOn; d.cells.forEach(c => { const cl = c.i % 3, rw = Math.floor(c.i / 3); c.cv.style.transform = lagOn ? "translate(" + (-WD.lag * 38 * (cl - 1 + .4 * (rw - 1.5))).toFixed(2) + "px," + (-WD.tv * 5 * (rw - 1.5) + WD.tilt * 3 * (cl - 1)).toFixed(2) + "px)" : ""; }); }
    const hot''')
# pointer
a=w.index('/* the moon can be turned'); b=w.index('/* ---------- rooms')
w=w[:a]+'''/* the moon can be turned in four directions, with momentum; three taps on it wake a song */
worldEl.addEventListener("pointerdown", e => {
  if (AR.on && !e.target.closest("button")) finishArrival();
  if (e.target.closest(".door,#alpha")) return;
  const r = worldEl.getBoundingClientRect(); WD.onMoon = Math.hypot(e.clientX - r.left - WD.cx, e.clientY - r.top - WD.cy) < WD.R * 1.25;
  WD.drag = true; WD.lastX = e.clientX; WD.lastY = e.clientY; WD.vel = 0; WD.tv = 0; WD.moved = 0; worldEl.classList.add("grab"); try { worldEl.setPointerCapture(e.pointerId); } catch (er) {}
});
worldEl.addEventListener("pointermove", e => {
  if (!WD.drag) return; const dx = e.clientX - WD.lastX, dy = e.clientY - WD.lastY; WD.lastX = e.clientX; WD.lastY = e.clientY; WD.moved += Math.abs(dx) + Math.abs(dy);
  WD.spinOff += dx * .008; WD.tilt = clamp(WD.tilt + dy * .006, -.9, .9);
  WD.vel = WD.vel * .6 + (dx * .008 / .016) * .4; WD.tv = WD.tv * .6 + (dy * .006 / .016) * .4;
});
const endSpin = () => {
  if (!WD.drag) return; WD.drag = false; worldEl.classList.remove("grab");
  if (WD.moved < 6 && WD.onMoon && !curRoom && !AR.on) { const n = performance.now(); WD.taps = WD.taps.filter(x => n - x < 900); WD.taps.push(n); if (WD.taps.length >= 3) { WD.taps = []; eggSong(); } else { wake(); playGlyph("core:u2609", { vol: .3 }); ring(WD.cx, WD.cy, "255,211,107", 90, 800); } }
};
worldEl.addEventListener("pointerup", endSpin); worldEl.addEventListener("pointercancel", endSpin);
worldEl.addEventListener("wheel", e => { if (curRoom) return; WD.vel += clamp(e.deltaX, -80, 80) * .02; WD.tv += clamp(e.deltaY, -80, 80) * .012; }, { passive: true });

'''+w[b:]
w=rep(w,'const ROOM = { river: $("roomRiver"), site: $("roomSite"), studio: $("roomStudio") };','const ROOM = { river: $("roomRiver"), site: $("roomSite"), studio: $("roomStudio"), tensor: $("roomTensor") };')
w=rep(w,'else if (name === "studio") { stFit(); stSync(); }','else if (name === "studio") { stFit(); stSync(); } else if (name === "tensor") { tnChips(); tnClaims(); }')
w=rep(w,'else if (id === "studio") openRoom("studio"); else openRoom("site", id);','else if (id === "studio") openRoom("studio"); else if (id === "tensor") openRoom("tensor"); else openRoom("site", id);')
w=rep(w,'if (curRoom === "studio" && ST.sel >= 0) return;','if (curRoom === "studio" && ST.sel.size) return;')
w=rep(w,'''  else if (m === "studio" || m === "song") { openRoom("studio"); if (m === "song") roverSong(); }''','''  else if (m === "studio") openRoom("studio");
  else if (m === "tensor") openRoom("tensor");
  else if (m === "song") { closeRoom(); setTimeout(eggSong, 500); }''')
a=w.index('/* the song shows on the stage'); b=w.index('/* ---------- power on')
w=w[:a]+tens+'\n'+w[b:]
w=rep(w,'["river", "studio", "site", "engine", "terminal", "case"].includes(h)','["river", "studio", "tensor", "site", "engine", "terminal", "case"].includes(h)')
w=w.replace('5 PORTALS OPEN','6 PORTALS OPEN').replace('" of 5"','" of 6"')
w=rep(w,'else if (!curRoom && !AR.on && e.key.length === 1','else if (!curRoom && !AR.on && e.key.startsWith("Arrow")) { const k = e.key; if (k === "ArrowLeft") WD.vel -= 1.4; else if (k === "ArrowRight") WD.vel += 1.4; else if (k === "ArrowUp") WD.tv -= 1.4; else WD.tv += 1.4; e.preventDefault(); }\n  else if (!curRoom && !AR.on && e.key.length === 1')
w=rep(w,'window.__WD = WD; window.__ST = ST;','window.__WD = WD; window.__ST = ST; window.__TN = TN; window.__egg = eggSong;')
# ---- wrapper ----
wr=rd('build/wrapper.html'); lines=wr.split('\n')
head='\n'.join(lines[:160]); assert lines[160].strip()=='</style>'
partA='\n'.join(lines[216:436]); assert lines[436].startswith('/* ============ layout')
head=rep(head,'<title>OLYMPASS.WORLD · TESELA.lun V01</title>','<title>OLYMPASS.WORLD · Super Power Shell</title>')
partA=rep(partA,'const GL_ORDER = LUN.order.filter(id => !/^(ring|frame):/.test(id));','const GL_ORDER = LUN.order.filter(id => !/^(ring|frame|notes):/.test(id));\nconst GL_ALL = LUN.order.filter(id => !/^(ring|frame):/.test(id));')
lun=rd('build/TESELA.lun').rstrip()+'\n'+rd('build/notes.lun')
bodyh=rd('build/world_body5.html').replace('<div id="strip" aria-hidden="true"></div>','<div id="strip" aria-hidden="true"></div>\n    <canvas id="eggGl" width="16" height="16" aria-hidden="true"></canvas>')
out=head+'\n'+rd('build/world.css')+'\n'+rd('build/world5.css')+'\n</style>\n</head>\n<body class="">\n'+bodyh
out+='\n<script type="text/lun" id="lun">\n'+lun+'\n</script>\n'
out+='<script type="application/octet-stream" id="sitedata">'+base64.b64encode(rd('build/site.html').encode('utf-8')).decode()+'</script>\n'
out+='<script type="application/octet-stream" id="termdata">'+base64.b64encode(t.encode('utf-8')).decode()+'</script>\n'
out+='<script>\n'+partA+'\n'+s+'\n'+egg+'\n'+sky+'\n'+w+'\n})();\n</script>\n</body>\n</html>\n'
os.makedirs(B+'shell',exist_ok=True)
open(B+'shell/index.html','w',encoding='utf-8').write(out)
print(len(out))
