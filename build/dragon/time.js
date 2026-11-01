/* ---------- the time dial ---------- */
const YR = 31556952, AGE = 13.787e9, EARTH_YBP = 4.5e9;
const nowS = () => Date.now() / 1000;
const MIN_YR = 1 / 525600;
const fromCosmicMin = m => AGE * (1 - m * MIN_YR);
const EVENTS = [
  [AGE, "Interro-BigBang*"],
  [fromCosmicMin(14), "Cosmic background radiation"],
  [fromCosmicMin(30), "First atoms"],
  [13e9, "Oldest known gamma-ray burst"],
  [12.85e9, "First galaxies form"],
  [11e9, "Milky Way forms"],
  [8.8e9, "Milky Way disk forms"],
  [4.57e9, "Solar System forms"],
  [4.5e9, "Earth and Moon form"],
  [4.1e9, "Earliest known traces of biotic life"],
  [3.8e9, "First life (prokaryotes)"],
  [3.4e9, "Photosynthesis"],
  [2.4e9, "Atmosphere becomes oxygenated"],
  [2e9, "Complex cells (eukaryotes)"],
  [0.8e9, "First multicellular life"],
  [0.67e9, "Simple animals"],
  [0.55e9, "Arthropods"],
  [0.53e9, "Fish and proto-amphibians"],
  [0.518e9, "Vertebrates"],
  [0.45e9, "Land plants"],
  [0.4e9, "Jawed fish"],
  [0.35e9, "Insects and seeds"],
  [0.33e9, "Amphibians"],
  [0.3e9, "Reptiles"],
  [0.25e9, "Permian-Triassic extinction"],
  [0.23e9, "Dinosaurs"],
  [0.201e9, "Mammals"],
  [0.15e9, "Birds"],
  [0.13e9, "Flowering plants"],
  [0.066e9, "Non-avian dinosaurs end; primates"],
  [28e6, "Apes"],
  [12.3e6, "Hominids"],
  [7e6, "Chimpanzee and human lineages split"],
  [2.8e6, "Homo and stone tools"],
  [0.4e6, "Domestication of fire"],
  [0.2e6, "Humans"],
  [0.115e6, "Most recent glacial period begins"],
  [0.035e6, "Sculpture and painting"],
  [12000, "Agriculture"],
  [11700, "End of the last Ice Age"],
  [8300, "Doggerland floods"],
  [6000, "Chalcolithic"],
  [5500, "Early Bronze Age; proto-writing"],
  [5000, "Egypt's First Dynasty; Sumerian cities"],
  [4500, "Alphabet, Akkad, wheel"],
  [4000, "Code of Hammurabi"],
  [3500, "Late Bronze Age; Minoan eruption"],
  [3000, "Iron Age; classical antiquity begins"],
  [2500, "Buddha, Confucius, Classical Greece"],
  [2000, "Roman Empire; numeral 0"],
  [1500, "Muhammad; Maya civilization"],
  [1000, "Crusades; Mongol empire"],
  [500, "Renaissance to the first Moon landing"],
  [0, "Now"]
];
const MONTHS = [["Jan", 31], ["Feb", 28], ["Mar", 31], ["Apr", 30], ["May", 31], ["Jun", 30], ["Jul", 31], ["Aug", 31], ["Sep", 30], ["Oct", 31], ["Nov", 30], ["Dec", 31]];
const p2 = n => String(Math.floor(n)).padStart(2, "0");
const grp = n => Math.round(n).toLocaleString("en-US");
let TS = nowS();
let CAL = "gregory";

function ctxOf(T) {
  const ay = 1970 + T / YR, inr = Math.abs(T) < 8.64e12, jd = T / 86400 + 2440587.5, c = { T, ay, inr, jd };
  if (inr) {
    const d = new Date(T * 1000);
    c.y = d.getUTCFullYear(); c.m = d.getUTCMonth() + 1; c.d = d.getUTCDate(); c.H = d.getUTCHours(); c.M = d.getUTCMinutes(); c.S = d.getUTCSeconds();
    c.ay = c.y;
  }
  return c;
}
const hms = c => c.H != null ? p2(c.H) + ":" + p2(c.M) + ":" + p2(c.S) + " UTC" : "";
const gregBCE = ay => ay <= 0 ? grp(1 - ay) + " BCE" : grp(ay) + " CE";
const yfmt = v => Math.round(v) > 0 ? grp(v) : grp(1 - Math.round(v)) + " before year 1";
const yrOff = (c, off, era) => (c.inr ? "" : "\u2248 ") + yfmt(c.inr ? c.y + off : c.ay + off) + " " + era;
const OFF = { buddhist: [543, "BE"], hebrew: [3761, "AM"], persian: [-621, "SH"], coptic: [-283, "AM"], ethiopic: [-7, "EE"], ethioaa: [5493, "AM"], indian: [-78, "Saka"], chinese: [2698, "(year count from 2698 BCE)"], dangi: [2333, "(Dangi)"], roc: [-1911, "Minguo"], japanese: [0, "(era year not extrapolated)"], islamic: [0, ""] };
const fmtCache = {};
function intlFmt(id) {
  if (fmtCache[id] === undefined) {
    try { fmtCache[id] = new Intl.DateTimeFormat("en-u-ca-" + id, { calendar: id, year: "numeric", month: "long", day: "numeric", era: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZone: "UTC" }); } catch (e) { fmtCache[id] = null; }
  }
  return fmtCache[id];
}
function intlCal(id) {
  return c => {
    if (c.inr) { const f = intlFmt(id); if (f) { try { return f.format(new Date(c.T * 1000)); } catch (e) {} } }
    if (id.startsWith("islamic")) return "≈ " + yfmt((c.ay - 622) * 1.030684) + " AH";
    const o = OFF[id]; if (o) return "≈ " + yfmt(c.ay + o[0]) + " " + o[1];
    return "≈ " + gregBCE(Math.round(c.ay));
  };
}
function julianDate(jd) {
  const Z = Math.floor(jd + 0.5), B = Z + 1524, C = Math.floor((B - 122.1) / 365.25), D = Math.floor(365.25 * C), E = Math.floor((B - D) / 30.6001);
  const day = B - D - Math.floor(30.6001 * E), month = E < 14 ? E - 1 : E - 13, year = month > 2 ? C - 4716 : C - 4715;
  return { year, month, day };
}
const ML = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function bahai(c) {
  if (!c.inr) return "≈ " + grp(c.ay - 1843) + " BE";
  const names = ["Baha", "Jalal", "Jamal", "Azamat", "Nur", "Rahmat", "Kalimat", "Kamal", "Asma", "Izzat", "Mashiyyat", "Ilm", "Qudrat", "Qawl", "Masail", "Sharaf", "Sultan", "Mulk"];
  const ny = Date.UTC(c.y, 2, 21) / 86400000, today = Math.floor(c.T / 86400);
  let yr = c.y - 1843, start = ny; if (today < ny) { yr = c.y - 1844; start = Date.UTC(c.y - 1, 2, 21) / 86400000; }
  const dd = today - start, leap = (new Date(Date.UTC(yr + 1844, 1, 29)).getUTCMonth() === 1) ? 5 : 4;
  let s; if (dd < 342) s = (dd % 19 + 1) + " " + names[Math.floor(dd / 19)]; else if (dd < 342 + leap) s = (dd - 341) + " Ayyam-i-Ha"; else s = (dd - 342 - leap + 1) + " Ala";
  return s + ", year " + yr + " BE (Bahai era)";
}
function french(c) {
  if (!c.inr || c.T < -5.6e9) return c.inr ? "before the Republic" : "≈ year " + grp(c.ay - 1791) + " of the Republic";
  const E = Date.UTC(1792, 8, 22) / 86400000, dayN = Math.floor(c.T / 86400);
  if (dayN < E) return "before the Republic";
  let y = 1, s = E; for (;;) { const ny = Date.UTC(1791 + y + 1, 8, 22) / 86400000; if (ny > dayN) break; s = ny; y++; }
  const dd = dayN - s, mn = ["Vendemiaire", "Brumaire", "Frimaire", "Nivose", "Pluviose", "Ventose", "Germinal", "Floreal", "Prairial", "Messidor", "Thermidor", "Fructidor"];
  const dec = ((c.T % 86400) + 86400) % 86400 / 86400 * 10, h = Math.floor(dec), mi = Math.floor((dec - h) * 100), se = Math.floor(((dec - h) * 100 - mi) * 100);
  const date = dd < 360 ? (dd % 30 + 1) + " " + mn[Math.floor(dd / 30)] : "Sansculottide " + (dd - 359);
  return date + ", year " + y + " · decimal time " + h + ":" + p2(mi) + ":" + p2(se);
}
function longCount(c) {
  const d = Math.floor(c.jd + 0.5) - 584283; if (c.jd < 0) return "≈ " + grp((c.jd - 584283) / 144000) + " baktun";
  const neg = d < 0, a = Math.abs(d), b = Math.floor(a / 144000), k = Math.floor(a % 144000 / 7200), t = Math.floor(a % 7200 / 360), u = Math.floor(a % 360 / 20), kin = a % 20;
  return (neg ? "-" : "") + [b, k, t, u, kin].join(".");
}
const MON = [["Edward II", "1307-07-08"], ["Edward III", "1327-01-25"], ["Richard II", "1377-06-22"], ["Henry IV", "1399-09-30"], ["Henry V", "1413-03-21"], ["Henry VI", "1422-09-01"], ["Edward IV", "1461-03-04"], ["Edward V", "1483-04-09"], ["Richard III", "1483-06-26"], ["Henry VII", "1485-08-22"], ["Henry VIII", "1509-04-22"], ["Edward VI", "1547-01-28"], ["Mary I", "1553-07-06"], ["Elizabeth I", "1558-11-17"], ["James I", "1603-03-24"], ["Charles I", "1625-03-27"], ["Charles II", "1649-01-30"], ["James II", "1685-02-06"], ["William and Mary", "1689-02-13"], ["Anne", "1702-03-08"], ["George I", "1714-08-01"], ["George II", "1727-06-11"], ["George III", "1760-10-25"], ["George IV", "1820-01-29"], ["William IV", "1830-06-26"], ["Victoria", "1837-06-20"], ["Edward VII", "1901-01-22"], ["George V", "1910-05-06"], ["Edward VIII", "1936-01-20"], ["George VI", "1936-12-11"], ["Elizabeth II", "1952-02-06"], ["Charles III", "2022-09-08"]];
function regnal(c) {
  if (!c.inr) return "before the English crown";
  let cur = null; for (const [n, d] of MON) { if (Date.parse(d + "T00:00:00Z") / 1000 <= c.T) cur = [n, d]; }
  if (!cur) return "before Edward II (1307)";
  const a = new Date(cur[1] + "T00:00:00Z"), ay = a.getUTCFullYear(); let yrs = c.y - ay; if (c.m < a.getUTCMonth() + 1 || (c.m === a.getUTCMonth() + 1 && c.d < a.getUTCDate())) yrs--;
  return "year " + (yrs + 1) + " of " + cur[0];
}
function olympiad(c) {
  if (c.ay < -775) { const o = -(c.ay + 775); return "before 776 BCE (" + (c.inr ? "" : "\u2248 ") + grp(o) + " years)"; }
  const o = Math.floor((c.ay + 775) / 4) + 1, y = Math.floor(c.ay + 775) % 4 + 1; return "Olympiad " + grp(o) + ", year " + y;
}
function isoUtc(c) { return c.inr ? new Date(c.T * 1000).toISOString().replace(".000", "") : "≈ year " + grp(c.ay); }
function cosmic(c) {
  const begin = nowS() - AGE * YR, f = (c.T - begin) / (AGE * YR);
  if (f < 0) return "before the cosmic year begins";
  if (f > 1 + 1e-9) return "after the cosmic year ends (" + grp((c.T - nowS()) / YR) + " years ahead)";
  let s = Math.min(f, 1 - 1e-12) * 365 * 86400, day = Math.floor(s / 86400); s -= day * 86400;
  let mi = 0; while (mi < 11 && day >= MONTHS[mi][1]) { day -= MONTHS[mi][1]; mi++; }
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
  return MONTHS[mi][0] + " " + (day + 1) + " · " + p2(h) + ":" + p2(m) + ":" + (sec < 10 ? "0" : "") + sec.toFixed(5);
}
const CALS = [
  ["Cosmic", [
    ["cosmic", "Cosmic Calendar (13.787 Gyr year)", cosmic],
    ["bp", "Before Present (radiocarbon, 1950)", c => grp(1950 - c.ay) + " BP"],
    ["astro", "Astronomical year numbering", c => (c.ay <= 0 ? "-" : "") + grp(Math.abs(c.ay)).replace(/^-/, "")],
    ["holocene", "Holocene calendar (10000 BCE)", c => yrOff(c, 10000, "HE")]
  ]],
  ["Pre-modern and ancient eras", [
    ["byz", "Byzantine Anno Mundi (5509 BCE)", c => c.inr ? (c.y + (c.m >= 9 ? 5509 : 5508)) + " AM" : "≈ " + grp(c.ay + 5509) + " AM"],
    ["hebrew", "Hebrew Anno Mundi (3761 BCE)", intlCal("hebrew")],
    ["longcount", "Mesoamerican Long Count (3114 BCE)", longCount],
    ["olymp", "Olympiads (776 BCE)", olympiad],
    ["auc", "Ab urbe condita (753 BCE)", c => yrOff(c, 753, "AUC")],
    ["bud544", "Buddhist era (544 BCE)", c => yrOff(c, 544, "BE")],
    ["vikram", "Vikram Samvat (58 BCE)", c => c.inr ? (c.y + (c.m < 4 ? 56 : 57)) + " VS" : "≈ " + grp(c.ay + 57) + " VS"],
    ["julian", "Julian calendar", c => { if (c.jd < 0) return "≈ " + gregBCE(Math.round(c.ay)); const j = julianDate(c.jd); const yy = j.year <= 0 ? grp(1 - j.year) + " BCE" : grp(j.year) + " CE"; return j.day.toFixed(0).padStart(2, "0") + " " + ML[j.month - 1] + " " + yy + (c.H != null ? " " + hms(c) : ""); }],
    ["saka", "Saka era (AD 78, Indian national)", intlCal("indian")],
    ["regnal", "UK regnal years (1307 on)", regnal],
    ["masonic", "Masonic Anno Lucis", c => yrOff(c, 4000, "AL")]
  ]],
  ["Modern calendars", [
    ["gregory", "Gregorian", c => c.inr ? intlCal("gregory")(c) : "≈ " + gregBCE(Math.round(c.ay))],
    ["iso", "ISO 8601 (UTC)", isoUtc],
    ["islamic", "Islamic (Hijra, AD 622)", intlCal("islamic")],
    ["islamic-umalqura", "Islamic (Umm al-Qura)", intlCal("islamic-umalqura")],
    ["islamic-civil", "Islamic (civil)", intlCal("islamic-civil")],
    ["persian", "Iranian solar (Hijra epoch)", intlCal("persian")],
    ["bahai", "Bahai (AD 1844)", bahai],
    ["thai", "Thai solar (Buddhist era 543 BCE)", intlCal("buddhist")],
    ["rattana", "Thai National Era (1782)", c => yrOff(c, -1781, "RS")],
    ["french", "French Republican (1792)", french],
    ["roc", "Minguo / Republic of China (1912)", intlCal("roc")],
    ["juche", "Juche (1912)", c => yrOff(c, -1911, "Juche")],
    ["fascist", "Fascist Era (1922)", c => c.inr ? "year " + (c.y - (c.m > 10 || (c.m === 10 && c.d >= 29) ? 1921 : 1922)) + " E.F." : "≈ " + grp(c.ay - 1921) + " E.F."],
    ["japanese", "Japanese era names", intlCal("japanese")],
    ["chinese", "Chinese", intlCal("chinese")],
    ["dangi", "Korean Dangi", intlCal("dangi")],
    ["coptic", "Coptic", intlCal("coptic")],
    ["ethiopic", "Ethiopian", intlCal("ethiopic")],
    ["yavin", "Galactic Standard (Battle of Yavin)", c => { const y = c.ay - 1977.4; return y < 0 ? grp(-y) + " BBY" : grp(y) + " ABY"; }]
  ]],
  ["Counts of time", [
    ["unix", "Unix time (1970)", c => grp(c.T) + " s"],
    ["jd", "Julian Day (4713 BCE)", c => c.jd.toFixed(5)],
    ["mjd", "Modified Julian Day", c => (c.jd - 2400000.5).toFixed(5)],
    ["j2000", "J2000 (2000-01-01 12:00)", c => ((c.jd - 2451545) / 36525).toFixed(8) + " Julian centuries"],
    ["filetime", "Windows FILETIME (1601)", c => grp((c.T + 11644473600) * 1e7) + " ticks"],
    ["ntp", "NTP (1900)", c => grp(c.T + 2208988800) + " s"],
    ["mac", "Classic Mac (1904)", c => grp(c.T + 2082844800) + " s"],
    ["excel", "Spreadsheet serial (1899-12-30)", c => (c.T / 86400 + 25569).toFixed(5)],
    ["gps", "GPS (1980-01-06)", c => { const s = c.T - 315964800; return "week " + grp(Math.floor(s / 604800)) + ", " + grp(((s % 604800) + 604800) % 604800) + " s"; }]
  ]]
];
const CALMAP = {}; CALS.forEach(g => g[1].forEach(e => CALMAP[e[0]] = e));
function readout(T, id) { const e = CALMAP[id || CAL] || CALMAP.gregory; try { return e[2](ctxOf(T)); } catch (err) { return "—"; } }
function nearestEvent(T) {
  let best = null, bd = 1e9; const ybp = (nowS() - T) / YR;
  for (const [y, n] of EVENTS) { const d = Math.abs(Math.log10((Math.abs(ybp) + 200) / (y + 200))); if (d < bd) { bd = d; best = n; } }
  return bd < 0.03 ? best : null;
}
function agoText(T) {
  const y = (nowS() - T) / YR;
  if (Math.abs(y) < 1 / 365.25) return "now";
  const a = Math.abs(y), txt = a >= 1e9 ? (a / 1e9).toFixed(3) + " billion years" : a >= 1e6 ? (a / 1e6).toFixed(3) + " million years" : a >= 1000 ? grp(a) + " years" : a.toFixed(2) + " years";
  return txt + (y > 0 ? " ago" : " ahead");
}
function stampText(T) {
  if (T == null || !isFinite(T)) return "";
  const ev = nearestEvent(T);
  return readout(T, CAL) + (Math.abs(nowS() - T) > 86400 * 400 ? " · " + agoText(T) : "") + (ev && ev !== "Now" ? " · " + ev : "");
}
function dialToT(u) { const p = 1 - u / 1000; return nowS() - AGE * Math.pow(p, 4) * YR; }
function tToDial(T) { const ybp = Math.max(0, Math.min(AGE, (nowS() - T) / YR)); return Math.round((1 - Math.pow(ybp / AGE, 0.25)) * 1000); }
function paintDial(src) {
  $("tBig").textContent = readout(TS, CAL);
  const ev = nearestEvent(TS);
  $("tEv").textContent = ev && ev !== "Now" ? "≈ " + ev : "";
  $("tSm").textContent = (CALMAP[CAL] ? CALMAP[CAL][1] + " · " : "") + agoText(TS) + (CAL !== "cosmic" ? " · cosmic " + cosmic(ctxOf(TS)) : "");
  if (src !== "slider") $("tSlider").value = tToDial(TS);
  if (src !== "date") { const el = $("tDate"); if (Math.abs(TS) < 2.5e11 && TS > -6e10) { try { el.value = new Date(TS * 1000).toISOString().slice(0, 19); } catch (e) { el.value = ""; } } else el.value = ""; }
  if (src !== "years") { const yy = (nowS() - TS) / YR; $("tYears").value = yy < 0.001 ? 0 : +yy.toPrecision(9); }
  const evs = $("tEvent"); let pick = ""; for (let i = 0; i < EVENTS.length; i++) { const T = nowS() - EVENTS[i][0] * YR; if (Math.abs(T - TS) < 1) pick = String(i); } evs.value = pick;
  if (typeof shelfRestamp === "function") shelfRestamp();
}
function setTime(T, src) { TS = T; paintDial(src); }
function initDial() {
  const evs = $("tEvent"); evs.innerHTML = '<option value="">— jump to an event —</option>' + EVENTS.map((e, i) => '<option value="' + i + '">' + e[1] + " · " + (e[0] >= 1e9 ? (e[0] / 1e9).toFixed(3).replace(/0+$/, "").replace(/\.$/, "") + " Gya" : e[0] >= 1e6 ? (e[0] / 1e6).toFixed(2).replace(/0+$/, "").replace(/\.$/, "") + " Mya" : e[0] >= 1000 ? (e[0] / 1000).toFixed(1).replace(/\.0$/, "") + " kya" : "now") + "</option>").join("");
  const cs = $("tCal"); cs.innerHTML = CALS.map(g => '<optgroup label="' + g[0] + '">' + g[1].map(e => '<option value="' + e[0] + '">' + e[1] + "</option>").join("") + "</optgroup>").join(""); cs.value = CAL;
  $("tBegin").addEventListener("click", () => { CAL = "cosmic"; $("tCal").value = "cosmic"; setTime(nowS() - AGE * YR); });
  $("tEarth").addEventListener("click", () => setTime(nowS() - EARTH_YBP * YR));
  $("tNow").addEventListener("click", () => setTime(nowS()));
  $("tSlider").addEventListener("input", e => setTime(dialToT(+e.target.value), "slider"));
  evs.addEventListener("change", () => { if (evs.value !== "") setTime(nowS() - EVENTS[+evs.value][0] * YR); });
  cs.addEventListener("change", () => { CAL = cs.value; paintDial(); });
  $("tDate").addEventListener("change", e => { const v = e.target.value; if (!v) return; const t = Date.parse(v + (v.length === 16 ? ":00" : "") + "Z"); if (!isNaN(t)) setTime(t / 1000, "date"); });
  $("tYears").addEventListener("change", e => { const v = parseFloat(e.target.value); if (isFinite(v)) setTime(nowS() - v * YR, "years"); });
  paintDial();
}
