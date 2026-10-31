# pass 6, shell side: the cube behind the moon, the close-up room, the renames.
# (exec'd by build6.py after the pass-5 patches; `w` is world.js, `t` the patched terminal source)
moon = rd('build/moon.js')
fl = t[t.index('const fluid = {'):t.index('const RAMP = ')].rstrip()     # the Keeper's water, verbatim from the floppy
w = rep(w, '{ id: "river", name: "RIVER.COM", sub: "the terminal",', '{ id: "river", name: "river.up/bronzedisk/HalfLoadFloppy", sub: "the old disk",')
w = rep(w, '{ id: "terminal", name: "THE TERMINAL", sub: "olympass.world",', '{ id: "terminal", name: "THE BENCH", sub: "olympass.world",')
w = rep(w, 'el.innerHTML = \'<span class="arch"></span><b>\' + d.name + "</b><i>"', 'el.innerHTML = \'<span class="arch"></span><b>\' + d.name.replace(/\\//g, "/<wbr>") + "</b><i>"')
w = rep(w, 'tilt: 0, tv: 0, ringA: 0,', 'tilt: 0, tv: 0, ringA: 0, tapT: 0,')
w = rep(w, 'const GAN = { taught: {}, seen: {}, tn: null, save()', 'const GAN = { taught: {}, seen: {}, tn: null, mem: { s: "", p: "" }, save()')
w = rep(w, 'tn: this.tn })', 'tn: this.tn, mem: this.mem })')
w = rep(w, 'this.tn = o.tn || null; }', 'this.tn = o.tn || null; this.mem = (o.mem && typeof o.mem.s === "string" && typeof o.mem.p === "string") ? o.mem : { s: "", p: "" }; }')
w = rep(w, 'const mb = renderMoon(WD.MNp, spin, -.22 + WD.tilt * .8);', 'drawCube(x, cx, cy, R, t, spin, WD.tilt, I * appear); const mb = renderMoon(WD.MNp, spin, -.22 + WD.tilt * .8);')
w = rep(w, 'studio: $("roomStudio"), tensor: $("roomTensor") };', 'studio: $("roomStudio"), tensor: $("roomTensor"), moon: $("roomMoon") };')
w = rep(w, 'GAN.save();\n  if (AR.on) finishArrival();', 'GAN.save(); if (name !== "moon") memAdd(MDOOR[name === "site" ? arg : name]);\n  if (AR.on) finishArrival();')
w = rep(w, 'else if (name === "tensor") { tnChips(); tnClaims(); }', 'else if (name === "tensor") { tnChips(); tnClaims(); } else if (name === "moon") { mnEnter(); try { $("mnc").focus({ preventScroll: true }); } catch (er) {} }')
w = rep(w, 'else if (id === "tensor") openRoom("tensor");', 'else if (id === "tensor") openRoom("tensor"); else if (id === "moon") openRoom("moon");')
w = rep(w, '["river", "studio", "tensor", "site", "engine", "terminal", "case"].includes(h)', '["river", "studio", "tensor", "moon", "site", "engine", "terminal", "case"].includes(h)')
# a tap on the moon opens the close-up; three quick taps still wake the song
old_tap = 'if (WD.taps.length >= 3) { WD.taps = []; eggSong(); } else { wake(); playGlyph("core:u2609", { vol: .3 }); ring(WD.cx, WD.cy, "255,211,107", 90, 800); } }'
new_tap = ('clearTimeout(WD.tapT); if (WD.taps.length >= 3) { WD.taps = []; eggSong(); } else { wake(); playGlyph("core:u2609", { vol: .3 }); ring(WD.cx, WD.cy, "255,211,107", 90, 800); memAdd(6); '
           'WD.tapT = setTimeout(() => { if (WD.taps.length && !curRoom && !AR.on) { WD.taps = []; openRoom("moon"); } }, 430); } }')
w = rep(w, old_tap, new_tap)
recall = '''
function recallProg(id) {
  openRoom("river"); const send = () => { try { term.contentWindow.postMessage({ tesela: "prog", id }, "*"); } catch (e) {} };
  let d0 = null; try { d0 = term.contentDocument; } catch (e) {}
  if (d0 && d0.readyState === "complete" && d0.body && d0.body.children.length) send(); else term.addEventListener("load", () => setTimeout(send, 80), { once: true });
}
'''
a = w.index('/* ---------- power on'); w = w[:a] + fl + '\n' + moon + recall + '\n' + w[a:]
w = rep(w, 'window.__WD = WD;', 'window.__MN = MN; window.__MNB = MNB; window.__WD = WD;')
