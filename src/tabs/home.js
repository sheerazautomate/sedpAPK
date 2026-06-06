/* ============================================================
   HOME.JS — Hierarchical drill-down dashboard
   Punjab → Districts → Wings → Tehsils → Markaz → Schools
   Primary metric: NT Ach% (ranked ascending = worst first)
   ============================================================ */

/* Current drill-down level shown on home (independent of APP_FILTER) */
let _homeLevel    = 0;   // 0=districts, 1=wings, 2=tehsils, 3=markaz, 4=schools
let _homePath     = {};  // { district, wing, tehsil, markaz }

/* Reset home drill path whenever APP_FILTER changes */
function resetHomeDrill() {
  _homeLevel = 0;
  _homePath  = {};
}

/* ============================================================
   MAIN RENDER
   ============================================================ */
function renderHome() {
  const container = document.getElementById("tab-home");
  if (!container) return;

  /* Determine base rows for KPIs — always the full APP_FILTER scope */
  const scopeRows = getFilteredData();
  const stats     = calcStats(scopeRows);

  /* Determine what level to show in the table based on APP_FILTER + _homePath */
  const scopeLevel = getScopeLevel();

  container.innerHTML = `
    <div class="home-content fade-in">
      ${_buildKpiStrip(stats)}
      ${_buildDrillTable(scopeRows, scopeLevel, stats)}
    </div>
  `;
}

/* ============================================================
   KPI STRIP — 6 numbers always visible at top
   ============================================================ */
function _buildKpiStrip(stats) {
  const achCls  = getAchClass(stats.ach);
  const ntCls   = getAchClass(stats.ntAch);
  const dSign   = stats.delta >= 0 ? "+" : "";
  const dCls    = stats.delta >= 0 ? "up" : "down";
  const bgapSign = stats.bgap >= 0 ? "+" : "";
  const tgapSign = stats.tgap >= 0 ? "+" : "";

  return `
    <div class="kpi-strip-grid">
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Current</span>
        <span class="kpi-strip-val">${formatNumber(stats.cur)}</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Baseline</span>
        <span class="kpi-strip-val">${formatNumber(stats.bas)}</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Target</span>
        <span class="kpi-strip-val">${formatNumber(stats.tar)}</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">New Target</span>
        <span class="kpi-strip-val">${formatNumber(stats.nt)}</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Schools</span>
        <span class="kpi-strip-val text-brand">${formatNumber(stats.schools)}</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Daily Δ</span>
        <span class="kpi-strip-val ${dCls}">${dSign}${formatNumber(stats.delta)}</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Ach%</span>
        <span class="kpi-strip-val ${achCls}">${stats.ach.toFixed(1)}%</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Base Gap</span>
        <span class="kpi-strip-val ${stats.bgap >= 0 ? 'up' : 'down'}">${bgapSign}${formatNumber(stats.bgap)}</span>
      </div>
      <div class="kpi-strip-cell">
        <span class="kpi-strip-label">Tgt Gap</span>
        <span class="kpi-strip-val ${stats.tgap >= 0 ? 'up' : 'down'}">${tgapSign}${formatNumber(stats.tgap)}</span>
      </div>
      <div class="kpi-strip-cell span2">
        <span class="kpi-strip-label">NT Ach%</span>
        <span class="kpi-strip-val ${ntCls} fw-700">${stats.ntAch.toFixed(1)}%</span>
      </div>
    </div>

    <!-- School health mini-bar -->
    <div class="health-bar-wrap">
      <div class="health-bar-seg red"   style="width:${stats.schools ? (stats.schoolsBB/stats.schools*100).toFixed(1) : 0}%"></div>
      <div class="health-bar-seg amber" style="width:${stats.schools ? (stats.schoolsBT/stats.schools*100).toFixed(1) : 0}%"></div>
      <div class="health-bar-seg green" style="width:${stats.schools ? (stats.schoolsAT/stats.schools*100).toFixed(1) : 0}%"></div>
    </div>
    <div class="health-bar-legend">
      <span class="hbl-dot red"></span><span class="hbl-text" onclick="navigateToSchoolsWithFilter('below_baseline')">Below Baseline <strong>${formatNumber(stats.schoolsBB)}</strong></span>
      <span class="hbl-dot amber"></span><span class="hbl-text" onclick="navigateToSchoolsWithFilter('above_baseline_below_target')">Below Target <strong>${formatNumber(stats.schoolsBT)}</strong></span>
      <span class="hbl-dot green"></span><span class="hbl-text" onclick="navigateToSchoolsWithFilter('above_target')">Achieved <strong>${formatNumber(stats.schoolsAT)}</strong></span>
    </div>
  `;
}

/* ============================================================
   DRILL TABLE — context-aware, ranks by NT Ach% ascending
   ============================================================ */
function _buildDrillTable(scopeRows, scopeLevel) {
  /* Decide what to aggregate by based on current APP_FILTER scope */
  let colIndex, levelLabel, nextLevelHint;

  if (scopeLevel === 0) {
    colIndex = 0; levelLabel = "Districts"; nextLevelHint = "Tap to view Wings";
  } else if (scopeLevel === 1) {
    colIndex = 3; levelLabel = "Wings"; nextLevelHint = "Tap to view Tehsils";
  } else if (scopeLevel === 2) {
    colIndex = 1; levelLabel = "Tehsils"; nextLevelHint = "Tap to view Markaz";
  } else if (scopeLevel === 3) {
    colIndex = 2; levelLabel = "Markaz"; nextLevelHint = "Tap to view Schools";
  } else {
    /* Scope is at markaz level — show school table */
    return _buildSchoolMiniTable(scopeRows);
  }

  const groups = aggregateBy(scopeRows, colIndex)
    .sort((a, b) => a.ntAch - b.ntAch); /* ranked worst → best by NT Ach% */

  if (groups.length === 0) {
    return `<div class="empty-state">No data for current scope.</div>`;
  }

  const breadcrumb = _buildBreadcrumb();

  const rowsHtml = groups.map((g, i) => {
    const ntCls  = getAchClass(g.ntAch);
    const achCls = getAchClass(g.ach);
    const dSign  = g.delta >= 0 ? "+" : "";
    const dCls   = g.delta > 0 ? "pos" : g.delta < 0 ? "neg" : "flat";

    return `<tr class="row-${ntCls} drill-row" onclick="homeDrillInto('${g.name.replace(/'/g,"\\'")}', ${colIndex})">
      <td class="c mono muted" style="width:28px">${i+1}</td>
      <td>
        <span class="cell-primary">${g.name}</span>
        <span class="cell-sub">${formatNumber(g.count)} schools</span>
        <div class="mini-bar-wrap">
          <div class="mini-bar-fill ${ntCls}" style="width:${Math.min(Math.max(g.ntAch,0),100)}%"></div>
        </div>
      </td>
      <td class="r">${formatNumber(g.cur)}</td>
      <td class="r">${formatNumber(g.tar)}</td>
      <td class="c"><span class="ach-pill ${achCls}">${g.ach.toFixed(1)}%</span></td>
      <td class="c"><span class="delta-pill ${dCls}">${dSign}${formatNumber(g.delta)}</span></td>
      <td class="c"><span class="ach-pill ${ntCls}">${g.ntAch.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  return `
    ${breadcrumb}
    <div class="section-header">
      <span>${levelLabel} <small style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">— ranked by NT Ach%</small></span>
      <span class="count-badge">${groups.length}</span>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <colgroup>
          <col style="width:24px">
          <col style="width:auto">
          <col style="width:13%">
          <col style="width:13%">
          <col style="width:12%">
          <col style="width:12%">
          <col style="width:13%">
        </colgroup>
        <thead>
          <tr>
            <th class="c">#</th>
            <th>${levelLabel}</th>
            <th class="r">Current</th>
            <th class="r">Target</th>
            <th class="c">Ach%</th>
            <th class="c">Daily Δ</th>
            <th class="c">NT Ach%</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div class="drill-hint">${nextLevelHint} ↑ Filter to change scope</div>
  `;
}

/* Schools mini-table when at markaz scope */
function _buildSchoolMiniTable(rows) {
  const sorted = [...rows].sort((a, b) => {
    const aN = a[10] ? ((a[7]-a[6])/a[10])*100 : 0;
    const bN = b[10] ? ((b[7]-b[6])/b[10])*100 : 0;
    return aN - bN;
  });

  const breadcrumb = _buildBreadcrumb();

  const rowsHtml = sorted.map((r, i) => {
    const ach   = r[8] ? (r[7]/r[8])*100 : 0;
    const ntAch = r[10] ? ((r[7]-r[6])/r[10])*100 : 0;
    const cls   = getAchClass(ach);
    const ntCls = getAchClass(ntAch);
    const delta = r[7] - r[9];
    const dCls  = delta > 0 ? "pos" : delta < 0 ? "neg" : "flat";

    return `<tr class="row-${ntCls}">
      <td class="c mono muted" style="width:28px">${i+1}</td>
      <td>
        <span class="cell-primary">${r[5]}</span>
        <span class="cell-sub mono">${r[4]}</span>
      </td>
      <td class="r">${formatNumber(r[7])}</td>
      <td class="c"><span class="ach-pill ${cls}">${ach.toFixed(1)}%</span></td>
      <td class="c"><span class="delta-pill ${dCls}">${delta >= 0 ? "+" : ""}${formatNumber(delta)}</span></td>
      <td class="c"><span class="ach-pill ${ntCls}">${ntAch.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  return `
    ${breadcrumb}
    <div class="section-header">
      <span>Schools</span>
      <span class="count-badge">${sorted.length}</span>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <colgroup>
          <col style="width:24px">
          <col style="width:auto">
          <col style="width:13%">
          <col style="width:12%">
          <col style="width:12%">
          <col style="width:13%">
        </colgroup>
        <thead>
          <tr>
            <th class="c">#</th>
            <th>School</th>
            <th class="r">Current</th>
            <th class="c">Ach%</th>
            <th class="c">Daily Δ</th>
            <th class="c">NT Ach%</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   DRILL-DOWN — tapping a row updates APP_FILTER and re-renders
   colIndex: 0=district, 3=wing, 1=tehsil, 2=markaz
   ============================================================ */
function homeDrillInto(name, colIndex) {
  /* Map colIndex → which filter key to set */
  if (colIndex === 0) {
    APP_FILTER.district = name;
    APP_FILTER.wing     = "";
    APP_FILTER.tehsil   = "";
    APP_FILTER.markaz   = "";
  } else if (colIndex === 3) {
    APP_FILTER.wing   = name;
    APP_FILTER.tehsil = "";
    APP_FILTER.markaz = "";
  } else if (colIndex === 1) {
    APP_FILTER.tehsil  = name;
    APP_FILTER.markaz  = "";
  } else if (colIndex === 2) {
    APP_FILTER.markaz = name;
  }

  /* Sync the filter drawer draft so it shows the right values when opened */
  syncDrawerToFilter();

  /* Invalidate all tabs */
  refreshAllTabs();
}

/* ============================================================
   BREADCRUMB — shows current scope path with back navigation
   ============================================================ */
function _buildBreadcrumb() {
  const parts = getScopeBreadcrumb();
  if (parts.length <= 1) return "";

  const crumbs = parts.map((p, i) => {
    if (i === parts.length - 1) {
      return `<span class="bc-active">${p}</span>`;
    }
    return `<span class="bc-link" onclick="_bcNavigateTo(${i})">${p}</span>`;
  }).join(`<span class="bc-sep">›</span>`);

  return `<div class="breadcrumb-bar">${crumbs}</div>`;
}

/* Navigate back to a breadcrumb level */
function _bcNavigateTo(levelIndex) {
  /* levelIndex 0 = Punjab (clear all), 1 = district, 2 = wing, 3 = tehsil */
  if (levelIndex === 0) {
    APP_FILTER = { district: "", wing: "", tehsil: "", markaz: "" };
  } else if (levelIndex === 1) {
    APP_FILTER.wing   = "";
    APP_FILTER.tehsil = "";
    APP_FILTER.markaz = "";
  } else if (levelIndex === 2) {
    APP_FILTER.tehsil = "";
    APP_FILTER.markaz = "";
  } else if (levelIndex === 3) {
    APP_FILTER.markaz = "";
  }
  syncDrawerToFilter();
  refreshAllTabs();
}
