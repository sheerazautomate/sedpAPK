/* ============================================================
    FETCH-DATA.JS — App Data Layer
    Fetches base_schools.json + live_enrollment.json +
    yesterday_enrollment.json from GitHub raw content and assembles
    MASTER_DATA (the 11-index array every tab reads from).

    Exposes globals:
      MASTER_DATA        — full 11-index array, all schools
      APP_HIERARCHY      — { district: { wing: { tehsil: [markaz] } } }
      APP_FILTER         — current active filter { district, wing, tehsil, markaz }
      APP_SYNC_TIME      — ISO string of when data was last fetched
      getFilteredData()  — returns MASTER_DATA sliced by APP_FILTER
      initData()         — called once on boot, returns Promise
    ============================================================ */

/* ── CONFIG: Use GitHub raw content for data files ── */
const DATA_BASE_URL = "https://raw.githubusercontent.com/sheerazautomate/sedpAPK/main/data";

const URLS = {
  baseSchools     : `${DATA_BASE_URL}/base_schools.json`,
  liveEnroll      : `${DATA_BASE_URL}/live_enrollment.json`,
  yesterdayEnroll : `${DATA_BASE_URL}/yesterday_enrollment.json`,
};

/* ============================================================
    GLOBAL STATE — written once by initData(), read everywhere
    ============================================================ */
let MASTER_DATA   = [];
let APP_HIERARCHY = {};
let APP_SYNC_TIME = null;

/* Active filter — updated by filter-drawer.js, read by all tabs */
let APP_FILTER = {
  district : "",
  wing     : "",
  tehsil   : "",
  markaz   : "",
};

/* ============================================================
    PUBLIC: getFilteredData()
    Returns the subset of MASTER_DATA matching APP_FILTER.
    Every tab calls this — never filters MASTER_DATA directly.
    ============================================================ */
function getFilteredData() {
  const { district, wing, tehsil, markaz } = APP_FILTER;
  return MASTER_DATA.filter(r =>
    (!district || r[0] === district) &&
    (!wing     || r[3] === wing)     &&
    (!tehsil   || r[1] === tehsil)   &&
    (!markaz   || r[2] === markaz)
  );
}

/* ============================================================
    PUBLIC: getScopeLabel()
    Human-readable string of the active filter scope.
    ============================================================ */
function getScopeLabel() {
  const { district, wing, tehsil, markaz } = APP_FILTER;
  return markaz || tehsil || wing || district || "All Punjab";
}

/* ============================================================
    PUBLIC: getScopeBreadcrumb()
    Array of label strings from broad to narrow.
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
    0=Punjab-wide, 1=district, 2=wing, 3=tehsil, 4=markaz
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
    PUBLIC: getAchColor(pct) / getAchClass(pct)
    Returns CSS color string or class name for an ach percentage.
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
    Aggregates an array of MASTER_DATA rows into summary numbers.
    ============================================================ */
function calcStats(rows) {
  const stats = {
    cur: 0, bas: 0, tar: 0, prev: 0, nt: 0,
    schools: 0,
    schoolsBB: 0,
    schoolsBT: 0,
    schoolsAT: 0,
  };

  rows.forEach(r => {
    stats.cur  += r[7];
    stats.bas  += r[6];
    stats.tar  += r[8];
    stats.prev += r[9];
    stats.nt   += r[10];
    stats.schools++;

    if      (r[7] < r[6]) stats.schoolsBB++;
    else if (r[7] < r[8]) stats.schoolsBT++;
    else                  stats.schoolsAT++;
  });

  stats.ach     = stats.tar ? (stats.cur / stats.tar)          * 100 : 0;
  stats.ntAch   = stats.nt  ? ((stats.cur - stats.bas) / stats.nt) * 100 : 0;
  stats.basePct = stats.bas ? (stats.cur / stats.bas)          * 100 : 0;
  stats.delta   = stats.cur  - stats.prev;
  stats.bgap    = stats.cur  - stats.bas;
  stats.tgap    = stats.cur  - stats.tar;

  return stats;
}

/* ============================================================
    PUBLIC: aggregateBy(rows, colIndex)
    Groups rows by column index, returns sorted summary array.
    colIndex: 0=district, 1=tehsil, 2=markaz, 3=wing
    ============================================================ */
function aggregateBy(rows, colIndex) {
  const groups = {};

  rows.forEach(r => {
    const key = r[colIndex];
    if (!key) return;
    if (!groups[key]) {
      groups[key] = { name: key, cur: 0, bas: 0, tar: 0, prev: 0, nt: 0, count: 0 };
    }
    const g = groups[key];
    g.cur  += r[7];
    g.bas  += r[6];
    g.tar  += r[8];
    g.prev += r[9];
    g.nt   += r[10];
    g.count++;
  });

  return Object.values(groups).map(g => {
    g.ach      = g.tar ? (g.cur / g.tar)          * 100 : 0;
    g.ntAch    = g.nt  ? ((g.cur - g.bas) / g.nt) * 100 : 0;
    g.delta    = g.cur - g.prev;
    g.achClass = getAchClass(g.ach);
    return g;
  }).sort((a, b) => a.ach - b.ach);
}

/* ============================================================
    PUBLIC: formatNumber(n)
    Locale-aware number formatting.
    ============================================================ */
function formatNumber(n) {
  return Number(n).toLocaleString("en-PK");
}

/* ============================================================
    PRIVATE: buildHierarchy(data)
    Builds nested district > wing > tehsil > [markaz] object.
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
    PRIVATE: safeFetch(url)
    Fetches a URL, returns parsed JSON or null on any failure.
    ============================================================ */
async function safeFetch(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[fetch-data] HTTP ${res.status} for ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[fetch-data] Failed to fetch ${url}:`, err.message);
    return null;
  }
}

/* ============================================================
    PRIVATE: setLoaderText(main, sub)
    ============================================================ */
function setLoaderText(main, sub) {
  const mainEl = document.getElementById("loader-text");
  const subEl  = document.getElementById("loader-sub");
  if (mainEl) mainEl.textContent = main;
  if (subEl)  subEl.textContent  = sub || "";
}

/* ============================================================
    PUBLIC: initData()
    Boot function. Fetches all three files, assembles MASTER_DATA.
    Returns Promise<boolean>.
    ============================================================ */
async function initData() {
  try {
    setLoaderText("Loading base school profiles...", URLS.baseSchools);

    const [baseSchools, liveRaw, yesterdayRaw] = await Promise.all([
      safeFetch(URLS.baseSchools),
      safeFetch(URLS.liveEnroll),
      safeFetch(URLS.yesterdayEnroll),
    ]);

    if (!baseSchools || !Array.isArray(baseSchools)) {
      console.error("[fetch-data] base_schools.json missing or invalid.");
      return false;
    }

    setLoaderText("Processing enrollment data...", `${baseSchools.length.toLocaleString()} school profiles`);

    // Build flat EMIS lookup maps
    const liveMap      = {};
    const yesterdayMap = {};

    if (liveRaw && typeof liveRaw === "object") {
      for (const emis in liveRaw) {
        liveMap[String(emis).trim()] = parseInt(liveRaw[emis]) || 0;
      }
    }

    if (yesterdayRaw && typeof yesterdayRaw === "object") {
      for (const emis in yesterdayRaw) {
        yesterdayMap[String(emis).trim()] = parseInt(yesterdayRaw[emis]) || 0;
      }
    }

    console.log(`[fetch-data] Live: ${Object.keys(liveMap).length} | Yesterday: ${Object.keys(yesterdayMap).length} | Base: ${baseSchools.length}`);

    setLoaderText("Building school index...", "Almost ready");

    MASTER_DATA = baseSchools.map(row => {
      const emisStr = String(row[4]).trim();

      const baseline  = parseInt(row[6]) || 0;
      const target    = parseInt(row[7]) || 0;
      const newTarget = parseInt(row[8]) || 0;

      const current   = liveMap[emisStr]      !== undefined ? liveMap[emisStr]      : baseline;
      const yesterday = yesterdayMap[emisStr] !== undefined ? yesterdayMap[emisStr] : current;

      return [
        String(row[0]).toUpperCase().trim(), // [0]  District
        String(row[1]).trim(),               // [1]  Tehsil
        String(row[2]).trim(),               // [2]  Markaz
        String(row[3]).trim(),               // [3]  Wing
        emisStr,                             // [4]  EMIS
        String(row[5]).trim(),               // [5]  School Name
        baseline,                            // [6]  Baseline
        current,                             // [7]  Current Enrollment
        target,                              // [8]  Target
        yesterday,                           // [9]  Yesterday (delta base)
        newTarget,                           // [10] New Target
      ];
    });

    APP_HIERARCHY = buildHierarchy(MASTER_DATA);
    APP_SYNC_TIME = new Date().toISOString();

    console.log(`[fetch-data] MASTER_DATA ready — ${MASTER_DATA.length} rows`);
    return true;

  } catch (err) {
    console.error("[fetch-data] Critical error:", err);
    return false;
  }
}
