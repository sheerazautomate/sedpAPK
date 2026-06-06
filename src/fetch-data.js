/* ============================================================
   FETCH-DATA.JS — App Data Layer
   base_schools.json: bundled locally (no network hit)
   live + yesterday: fetched from GitHub (change daily)
   ============================================================ */

/* ── CONFIG ── */
const DATA_BASE_URL = "https://raw.githubusercontent.com/sheerazautomate/sedpAPK/main/data";

/* Local path for bundled base data — resolves relative to index.html */
const LOCAL_BASE_URL = "../data/base_schools.json";

const URLS = {
  liveEnroll      : `${DATA_BASE_URL}/live_enrollment.json`,
  yesterdayEnroll : `${DATA_BASE_URL}/yesterday_enrollment.json`,
};

/* ============================================================
   GLOBAL STATE
   ============================================================ */
let MASTER_DATA   = [];
let APP_HIERARCHY = {};
let APP_SYNC_TIME = null;

let APP_FILTER = { district: "", wing: "", tehsil: "", markaz: "" };

/* ============================================================
   PUBLIC: getFilteredData()
   ============================================================ */
function getFilteredData() {
  const { district, wing, tehsil, markaz } = APP_FILTER;
  if (!district && !wing && !tehsil && !markaz) return MASTER_DATA; /* fast path */
  return MASTER_DATA.filter(r =>
    (!district || r[0] === district) &&
    (!wing     || r[3] === wing)     &&
    (!tehsil   || r[1] === tehsil)   &&
    (!markaz   || r[2] === markaz)
  );
}

/* ============================================================
   PUBLIC: getScopeLabel()
   ============================================================ */
function getScopeLabel() {
  const { district, wing, tehsil, markaz } = APP_FILTER;
  return markaz || tehsil || wing || district || "All Punjab";
}

/* ============================================================
   PUBLIC: getScopeBreadcrumb()
   ============================================================ */
function getScopeBreadcrumb() {
  const { district, wing, tehsil, markaz } = APP_FILTER;
  const parts = ["Punjab"];
  if (district) parts.push(district);
  if (wing)     parts.push(wing);
  if (tehsil)   parts.push(tehsil);
  if (markaz)   parts.push(markaz);
  return parts;
}

/* ============================================================
   PUBLIC: getScopeLevel()
   0=Punjab, 1=district, 2=wing, 3=tehsil, 4=markaz
   ============================================================ */
function getScopeLevel() {
  const { district, wing, tehsil, markaz } = APP_FILTER;
  if (markaz)   return 4;
  if (tehsil)   return 3;
  if (wing)     return 2;
  if (district) return 1;
  return 0;
}

/* ============================================================
   PUBLIC: getAchColor / getAchClass
   ============================================================ */
function getAchColor(pct) {
  if (pct < 80) return "var(--red)";
  if (pct < 90) return "var(--amber)";
  return "var(--green)";
}
function getAchClass(pct) {
  if (pct < 80) return "red";
  if (pct < 90) return "amber";
  return "green";
}

/* ============================================================
   PUBLIC: calcStats(rows)
   ============================================================ */
function calcStats(rows) {
  const s = { cur:0, bas:0, tar:0, prev:0, nt:0, schools:0, schoolsBB:0, schoolsBT:0, schoolsAT:0 };
  rows.forEach(r => {
    s.cur  += r[7]; s.bas  += r[6]; s.tar  += r[8];
    s.prev += r[9]; s.nt   += r[10]; s.schools++;
    if      (r[7] < r[6]) s.schoolsBB++;
    else if (r[7] < r[8]) s.schoolsBT++;
    else                  s.schoolsAT++;
  });
  s.ach     = s.tar ? (s.cur / s.tar) * 100          : 0;
  s.ntAch   = s.nt  ? ((s.cur - s.bas) / s.nt) * 100 : 0;
  s.basePct = s.bas ? (s.cur / s.bas) * 100           : 0;
  s.delta   = s.cur - s.prev;
  s.bgap    = s.cur - s.bas;
  s.tgap    = s.cur - s.tar;
  return s;
}

/* ============================================================
   PUBLIC: aggregateBy(rows, colIndex)
   ============================================================ */
function aggregateBy(rows, colIndex) {
  const groups = {};
  rows.forEach(r => {
    const key = r[colIndex]; if (!key) return;
    if (!groups[key]) groups[key] = { name:key, cur:0, bas:0, tar:0, prev:0, nt:0, count:0 };
    const g = groups[key];
    g.cur += r[7]; g.bas += r[6]; g.tar += r[8]; g.prev += r[9]; g.nt += r[10]; g.count++;
  });
  return Object.values(groups).map(g => {
    g.ach      = g.tar ? (g.cur / g.tar) * 100          : 0;
    g.ntAch    = g.nt  ? ((g.cur - g.bas) / g.nt) * 100 : 0;
    g.delta    = g.cur - g.prev;
    g.achClass = getAchClass(g.ach);
    return g;
  }).sort((a, b) => a.ach - b.ach);
}

/* ============================================================
   PUBLIC: formatNumber(n)
   ============================================================ */
function formatNumber(n) {
  return Number(n).toLocaleString("en-PK");
}

/* ============================================================
   PRIVATE: buildHierarchy(data)
   ============================================================ */
function buildHierarchy(data) {
  const h = {};
  data.forEach(r => {
    const d = r[0], w = r[3], t = r[1], m = r[2];
    if (!h[d])       h[d]       = {};
    if (!h[d][w])    h[d][w]    = {};
    if (!h[d][w][t]) h[d][w][t] = new Set();
    h[d][w][t].add(m);
  });
  for (const d in h)
    for (const w in h[d])
      for (const t in h[d][w])
        h[d][w][t] = [...h[d][w][t]].sort();
  return h;
}

/* ============================================================
   PRIVATE: safeFetch(url, fallbackUrl)
   Tries primary URL; on failure tries fallback.
   ============================================================ */
async function safeFetch(url, fallbackUrl) {
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
    throw new Error(`HTTP ${res.status}`);
  } catch (e) {
    if (fallbackUrl) {
      try {
        const res2 = await fetch(fallbackUrl);
        if (res2.ok) return await res2.json();
      } catch (_) {}
    }
    console.warn(`[fetch] Failed: ${url}`);
    return null;
  }
}

function setLoaderText(main, sub) {
  const m = document.getElementById("loader-text");
  const s = document.getElementById("loader-sub");
  if (m) m.textContent = main;
  if (s) s.textContent = sub || "";
}

/* ============================================================
   PUBLIC: initData()
   Loads base schools locally first (instant), then live/yesterday.
   ============================================================ */
async function initData() {
  try {
    setLoaderText("Loading school data...", "Reading local database");

    /* 1. Load base schools — try local bundle first, fall back to GitHub */
    const baseSchools = await safeFetch(
      LOCAL_BASE_URL,
      `${DATA_BASE_URL}/base_schools.json`
    );

    if (!baseSchools || !Array.isArray(baseSchools)) {
      console.error("[fetch] base_schools.json missing or invalid.");
      return false;
    }

    setLoaderText("Fetching live enrollment...", `${baseSchools.length.toLocaleString()} school profiles loaded`);

    /* 2. Fetch live + yesterday in parallel (network, can fail gracefully) */
    const [liveRaw, yesterdayRaw] = await Promise.all([
      safeFetch(URLS.liveEnroll),
      safeFetch(URLS.yesterdayEnroll),
    ]);

    setLoaderText("Building index...", "Almost ready");

    /* 3. Build lookup maps */
    const liveMap      = {};
    const yesterdayMap = {};

    if (liveRaw && typeof liveRaw === "object") {
      for (const emis in liveRaw) liveMap[String(emis).trim()] = parseInt(liveRaw[emis]) || 0;
    }
    if (yesterdayRaw && typeof yesterdayRaw === "object") {
      for (const emis in yesterdayRaw) yesterdayMap[String(emis).trim()] = parseInt(yesterdayRaw[emis]) || 0;
    }

    /* 4. Assemble MASTER_DATA */
    MASTER_DATA = baseSchools.map(row => {
      const emisStr   = String(row[4]).trim();
      const baseline  = parseInt(row[6]) || 0;
      const target    = parseInt(row[7]) || 0;
      const newTarget = parseInt(row[8]) || 0;
      const current   = liveMap[emisStr]      !== undefined ? liveMap[emisStr]      : baseline;
      const yesterday = yesterdayMap[emisStr] !== undefined ? yesterdayMap[emisStr] : current;

      return [
        String(row[0]).toUpperCase().trim(), // [0] District
        String(row[1]).trim(),               // [1] Tehsil
        String(row[2]).trim(),               // [2] Markaz
        String(row[3]).trim(),               // [3] Wing
        emisStr,                             // [4] EMIS
        String(row[5]).trim(),               // [5] School Name
        baseline,                            // [6] Baseline
        current,                             // [7] Current
        target,                              // [8] Target
        yesterday,                           // [9] Yesterday
        newTarget,                           // [10] New Target
      ];
    });

    APP_HIERARCHY = buildHierarchy(MASTER_DATA);
    APP_SYNC_TIME = new Date().toISOString();

    console.log(`[fetch] MASTER_DATA ready — ${MASTER_DATA.length} rows | Live: ${Object.keys(liveMap).length} | Yesterday: ${Object.keys(yesterdayMap).length}`);
    return true;

  } catch (err) {
    console.error("[fetch] Critical error:", err);
    return false;
  }
}
