import re
P='shell/index.html'; s=open(P,encoding='utf-8').read()
def rep(a,b,n=1):
    global s; assert s.count(a)==n,(a[:60],s.count(a)); s=s.replace(a,b)
# the study panel and the readouts go to the back: kept in the page, hidden and inert
rep('<div class="sui" id="tnPanel">','<div class="sui" id="tnPanel" hidden inert>')
rep('<div id="tnVals" aria-live="off">','<div id="tnVals" aria-live="off" hidden inert>')
rep('<span id="tplate"><span class="o">T</span>HE TENSOR</span><span id="tnRoles">ORDER 5</span>','<span id="tplate"><span class="o">T</span>ESELA</span><span id="tnRoles"></span>')
rep('sub: "nine roles · water"','sub: "a study in water"')
# the tile alone: no role numerals, no dots, no frame
a=s.index('  /* the role grid, ghosted underneath; the picked role glows */'); b=s.index('x.restore();\n}',a)+len('x.restore();\n}')
s=s[:a]+'}'+s[b:]
# the tile plays by itself, slowly; every change glides
rep('  tnDraw(); if ((T.step & 7) === 0) tnStations();','  tnMuse(now); tnDraw(); if ((T.step & 7) === 0) tnStations();')
rep('requestAnimationFrame(function tnLoop(now) {','''let tnNext = 0;
function tnMuse(now) {
  if (now < tnNext) return; const T = TN.T; tnNext = now + 3500 + Math.random() * 5500;
  T.write(1 + Math.floor(Math.random() * T.R), Math.random() * 1.7 - .85);
  const tl = Math.sin(now / 23000) * .7; if (Math.abs(tl - T.tilt) > .08) T.ctl("tilt", tl);
}
requestAnimationFrame(function tnLoop(now) {''')
rep('</style>','''#tensorBox { grid-template-columns: minmax(0, 1fr) !important; width: min(760px, 100%) !important; margin-inline: auto; }
#tnPanel, #tnVals { display: none !important; }
</style>''')
open(P,'w',encoding='utf-8').write(s); print('ok',len(s))
s=open(P,encoding='utf-8').read()
a='  $("tnRoles").textContent = "ORDER " + n + " · " + T.R + " ROLES · " + n * n + " PLACES · k = " + (n + 1) / 2;'
assert s.count(a)==1; s=s.replace(a,'  $("tnRoles").textContent = "";'); open(P,'w',encoding='utf-8').write(s)
