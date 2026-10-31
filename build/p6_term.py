# pass 6, terminal side: RIVER.COM becomes river.up/bronzedisk/HalfLoadFloppy, and the floppy can be recalled to a page.
# (exec'd by build6.py; `t` is the terminal source, `rep` asserts each replacement lands exactly once)
FULL = 'river.up/bronzedisk/HalfLoadFloppy'; SHORT = 'HalfLoadFloppy'
t = rep(t, '<title>RIVER.COM</title>', '<title>' + FULL + '</title>')
t = rep(t, '<span id="plate">RIVER.COM</span>', '<span id="plate">' + FULL + '</span>')
t = rep(t, 'plate.textContent = "RIVER.COM";', 'plate.textContent = "' + FULL + '";')
t = rep(t, '"A:\\\\RIVER.COM"', '"A:\\\\' + SHORT + '"')
t = rep(t, '"RIVER.COM /LINK"', '"' + SHORT + ' /LINK"')
t = rep(t, '[["RIVER.COM: ", "grey"]', '[["' + SHORT + ': ", "grey"]')
t = rep(t, 'receipt("RIVER.COM → ⌁ RIVERLINK  converted · nothing erased")', 'receipt("' + FULL + ' → ⌁ RIVERLINK  converted · nothing erased")', 2)
t = rep(t, 'tx(1, 0, "RIVER.COM", "white"); tx(11, 0, "⇄", "orange"); tx(13, 0, "⌁ RIVERLINK", "eblue");',
        'const hn = C >= 78 ? "' + FULL + '" : "' + SHORT + '"; tx(1, 0, hn, "white"); tx(hn.length + 2, 0, "⇄", "orange"); tx(hn.length + 4, 0, "⌁ RIVERLINK", "eblue");')
t = rep(t, 'if (C >= 58) tx(C - 1 - proto.length, 0, proto, "grey", 0.8);', 'if (C >= 58 && hn.length + 18 < C - 1 - proto.length) tx(C - 1 - proto.length, 0, proto, "grey", 0.8);')
t = rep(t, '"RIVER    COM   the river, 1992"', '"HALFLOAD FLP   river.up/bronzedisk · 1992"')
t = rep(t, '"RIVER.COM · RIVERUP.COM · 1992"', '"' + FULL + ' · RIVERUP.COM · 1992"')
t = rep(t, 'RIVER: () => bootRun(), "RIVER.COM": () => bootRun(),', 'RIVER: () => bootRun(), "RIVER.COM": () => bootRun(), HALFLOADFLOPPY: () => bootRun(), BRONZEDISK: () => bootRun(),')
t = rep(t, '/* ============ the shell: OLYMPASS.WORLD ============ */',
        'window.__want = null;\n'
        'window.addEventListener("message", e => { if (e.data && e.data.tesela === "prog" && typeof e.data.id === "string") { if (phase === "shell") openProg(e.data.id); else { window.__want = e.data.id; let n = 0; const iv = setInterval(() => { if (phase === "shell" || ++n > 80) { clearInterval(iv); return; } if (phase !== "off") skip(); }, 300); } } });\n'
        '/* ============ the shell: OLYMPASS.WORLD ============ */')
t = rep(t, 'phase = "shell"; shell.t0 = performance.now(); openProg("home", true);',
        'phase = "shell"; shell.t0 = performance.now(); { const w0 = window.__want; window.__want = null; openProg(w0 && progs[w0] ? w0 : "home", true); }')
