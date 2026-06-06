/* ============================================================
   INSIGHTS.JS — Scope-aware analytics, NT Ach% primary metric
   Mirrors the reference dashboard's buildDynamicSection() logic:
     Level 0 (Punjab): Top 5 + Bottom 5 districts by NT Ach%
     Level 1 (District): Wings + Bottom 5 tehsils
     Level 2 (Wing): Tehsils + Bottom 5 markaz
     Level 3 (Tehsil): Markaz + Bottom 5 schools
     Level 4 (Markaz): All schools table
   No charts/graphs — tables only.
   ============================================================ */

let _insightsCacheKey = null;

function renderInsights() {
  const container = document.getElementById("tab-insights");
  if (!container) return;

  const filterKey = JSON.stringify(APP_FILTER);
  const rows      = getFilteredData();
  const stats     = calcStats(rows);
  const level     = getScopeLevel();
  const breadcrumb = getScopeBreadcrumb();

  _insightsCacheKey = filterKey;

  /* Overview card */
  const achCls  = getAchClass(stats.ach);
  const ntCls   = getAchClass(stats.ntAch);
  const basePct = stats.bas ? (stats.cur / stats.bas * 100) : 0;

  container.innerHTML = `
    <div class="insights-content fade-in">

      <!-- Scope header -->
      <div class="ins-scope-header">
        <div class="ins-scope-path">${breadcrumb.join(' › ')}</div>
        <div class="ins-scope-badge">${getScopeLabel()}</div>
      </div>

      <!-- Enrollment overview card -->
      <div class="ins-card">
        <div class="ins-card-title">Enrollment Overview</div>
        <div class="ins-overview-grid">
          <div class="ins-ov-cell">
            <span class="ins-ov-label">Current</span>
            <span class="ins-ov-val text-brand">${formatNumber(stats.cur)}</span>
          </div>
          <div class="ins-ov-cell">
            <span class="ins-ov-label">Baseline</span>
            <span class="ins-ov-val">${formatNumber(stats.bas)}</span>
          </div>
          <div class="ins-ov-cell">
            <span class="ins-ov-label">Target</span>
            <span class="ins-ov-val">${formatNumber(stats.tar)}</span>
          </div>
          <div class="ins-ov-cell">
            <span class="ins-ov-label">New Target</span>
            <span class="ins-ov-val">${formatNumber(stats.nt)}</span>
          </div>
          <div class="ins-ov-cell">
            <span class="ins-ov-label">Ach%</span>
            <span class="ins-ov-val ${achCls}">${stats.ach.toFixed(1)}%</span>
          </div>
          <div class="ins-ov-cell highlight">
            <span class="ins-ov-label">NT Ach%</span>
            <span class="ins-ov-val ${ntCls}">${stats.ntAch.toFixed(1)}%</span>
          </div>
        </div>

        <!-- Progress bars -->
        <div class="ins-prog-row">
          <div class="ins-prog-label">
            <span>Progress to Target</span>
            <span class="${achCls}">${stats.ach.toFixed(1)}%</span>
          </div>
          <div class="mini-bar-wrap" style="height:7px;">
            <div class="mini-bar-fill ${achCls}" style="width:${Math.min(Math.max(stats.ach,0),100)}%"></div>
          </div>
        </div>
        <div class="ins-prog-row">
          <div class="ins-prog-label">
            <span>Current vs Baseline</span>
            <span class="${basePct >= 100 ? 'text-green' : 'text-red'}">${basePct.toFixed(1)}%</span>
          </div>
          <div class="mini-bar-wrap" style="height:7px;">
            <div class="mini-bar-fill ${basePct >= 100 ? 'green' : 'red'}" style="width:${Math.min(Math.max(basePct,0),100)}%"></div>
          </div>
        </div>
      </div>

      <!-- School health -->
      <div class="ins-card">
        <div class="ins-card-title">School Health (${formatNumber(stats.schools)} schools)</div>
        <div class="ins-health-row">
          <div class="ins-health-cell red">
            <span class="ins-health-count">${formatNumber(stats.schoolsBB)}</span>
            <span class="ins-health-label">Below Baseline</span>
          </div>
          <div class="ins-health-cell amber">
            <span class="ins-health-count">${formatNumber(stats.schoolsBT)}</span>
            <span class="ins-health-label">Below Target</span>
          </div>
          <div class="ins-health-cell green">
            <span class="ins-health-count">${formatNumber(stats.schoolsAT)}</span>
            <span class="ins-health-label">Achieved</span>
          </div>
        </div>
        <div class="health-bar-wrap" style="margin:0 14px 14px;">
          <div class="health-bar-seg red"   style="width:${stats.schools?(stats.schoolsBB/stats.schools*100).toFixed(1):0}%"></div>
          <div class="health-bar-seg amber" style="width:${stats.schools?(stats.schoolsBT/stats.schools*100).toFixed(1):0}%"></div>
          <div class="health-bar-seg green" style="width:${stats.schools?(stats.schoolsAT/stats.schools*100).toFixed(1):0}%"></div>
        </div>
      </div>

      <!-- Dynamic scope-aware section -->
      ${_buildDynamicInsightSection(level, rows, stats)}

      <!-- Narrative box -->
      ${_buildNarrative(stats, rows, level)}

    </div>
  `;
}

/* ============================================================
   DYNAMIC SECTION — changes based on scope level
   ============================================================ */
function _buildDynamicInsightSection(level, rows, stats) {
  function agg(colIdx) {
    return aggregateBy(rows, colIdx).sort((a, b) => a.ntAch - b.ntAch);
  }

  if (level === 0) {
    /* Punjab: bottom 5 + top 5 districts */
    const districts = agg(0);
    return `
      <div class="ins-two-col">
        ${_miniTable("⬇ Bottom 5 Districts", districts.slice(0, 5), true)}
        ${_miniTable("⬆ Top 5 Districts",    [...districts].sort((a,b) => b.ntAch - a.ntAch).slice(0, 5), false)}
      </div>`;

  } else if (level === 1) {
    /* District: wings breakdown + bottom 5 tehsils */
    const wings   = agg(3);
    const tehsils = agg(1);
    return `
      <div class="ins-two-col">
        ${_miniTable("Wings Breakdown", wings, wings[0]?.ntAch < 80)}
        ${_miniTable("⬇ Bottom 5 Tehsils", tehsils.slice(0, 5), true)}
      </div>`;

  } else if (level === 2) {
    /* Wing: tehsils + bottom 5 markaz */
    const tehsils = agg(1);
    const markazs = agg(2);
    return `
      <div class="ins-two-col">
        ${_miniTable("Tehsil Breakdown", tehsils, false)}
        ${_miniTable("⬇ Bottom 5 Markaz", markazs.slice(0, 5), true)}
      </div>`;

  } else if (level === 3) {
    /* Tehsil: markaz + bottom 5 schools */
    const markazs = agg(2);
    const b5 = [...rows]
      .filter(r => r[10] > 0)
      .sort((a, b) => ((a[7]-a[6])/a[10]) - ((b[7]-b[6])/b[10]))
      .slice(0, 5);
    return `
      <div class="ins-two-col">
        ${_miniTable("Markaz Performance", markazs, false)}
        ${_schoolMiniTable("⬇ Bottom 5 Schools", b5)}
      </div>`;

  } else if (level === 4) {
    /* Markaz: all schools */
    const sorted = [...rows]
      .filter(r => r[10] > 0)
      .sort((a, b) => ((a[7]-a[6])/a[10]) - ((b[7]-b[6])/b[10]));
    return _schoolMiniTable("All Schools in Markaz", sorted, true);
  }

  return "";
}

/* ============================================================
   MINI TABLES
   ============================================================ */
function _miniTable(title, groups, isRed) {
  const accentClass = isRed ? "accent-red" : "accent-green";
  const titleColor  = isRed ? "var(--red)" : "var(--green)";

  const rowsHtml = groups.map((g, i) => {
    const ntCls  = getAchClass(g.ntAch);
    const achCls = getAchClass(g.ach);
    const dCls   = g.delta > 0 ? "pos" : g.delta < 0 ? "neg" : "flat";
    const bgColors = isRed
      ? ["#dc2626","#ef4444","#f87171","#fca5a5","#fecaca","#fee2e2","#fef2f2","#fff","#fff","#fff"]
      : ["#16a34a","#22c55e","#4ade80","#86efac","#bbf7d0","#dcfce7","#f0fdf4","#fff","#fff","#fff"];

    return `<tr>
      <td class="c"><span class="rank-num" style="background:${bgColors[i]};color:${i<5?'#fff':g.ntAch<80?'var(--red)':'var(--green)'}">${i+1}</span></td>
      <td>
        <span class="cell-primary">${g.name}</span>
        <span class="cell-sub">${formatNumber(g.count)} sch</span>
      </td>
      <td class="r">${formatNumber(g.cur)}</td>
      <td class="c"><span class="delta-pill ${dCls}">${g.delta >= 0 ? "+" : ""}${formatNumber(g.delta)}</span></td>
      <td class="c"><span class="ach-pill ${achCls}" style="font-size:0.57rem">${g.ach.toFixed(1)}%</span></td>
      <td class="c"><span class="ach-pill ${ntCls}">${g.ntAch.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  return `
    <div class="ins-card">
      <div class="ins-card-title ins-card-title-${isRed ? 'red' : 'green'}">${title}</div>
      <table class="ins-table">
        <thead><tr>
          <th class="c">#</th>
          <th>Name</th>
          <th class="r">Curr</th>
          <th class="c">Δ</th>
          <th class="c">Ach%</th>
          <th class="c">NT%</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
}

function _schoolMiniTable(title, schoolRows, compact = false) {
  const rowsHtml = schoolRows.map((r, i) => {
    const ntAch = r[10] ? ((r[7]-r[6])/r[10])*100 : 0;
    const ach   = r[8]  ? (r[7]/r[8])*100           : 0;
    const ntCls = getAchClass(ntAch);
    const achCls = getAchClass(ach);
    const delta  = r[7] - r[9];
    const dCls   = delta > 0 ? "pos" : delta < 0 ? "neg" : "flat";
    const bg     = ["#dc2626","#ef4444","#f87171","#fca5a5","#fecaca"];

    return `<tr>
      <td class="c"><span class="rank-num" style="background:${bg[i] || '#e5e7eb'};color:${i<5?'#fff':'var(--text-primary)'}">${i+1}</span></td>
      <td>
        <span class="cell-primary">${r[5]}</span>
        <span class="cell-sub mono">${r[4]}</span>
      </td>
      <td class="r">${formatNumber(r[7])}</td>
      <td class="c"><span class="delta-pill ${dCls}">${delta >= 0 ? "+" : ""}${formatNumber(delta)}</span></td>
      <td class="c"><span class="ach-pill ${achCls}" style="font-size:0.57rem">${ach.toFixed(1)}%</span></td>
      <td class="c"><span class="ach-pill ${ntCls}">${ntAch.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  return `
    <div class="ins-card${compact ? ' ins-card-full' : ''}">
      <div class="ins-card-title ins-card-title-red">${title}</div>
      <table class="ins-table">
        <thead><tr>
          <th class="c">#</th>
          <th>School</th>
          <th class="r">Curr</th>
          <th class="c">Δ</th>
          <th class="c">Ach%</th>
          <th class="c">NT%</th>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
}

/* ============================================================
   NARRATIVE BOX
   ============================================================ */
function _buildNarrative(stats, rows, level) {
  const scope      = getScopeLabel();
  const ntCls      = getAchClass(stats.ntAch);
  const deltaMsg   = stats.delta > 0 ? `increased by ${formatNumber(stats.delta)}` : stats.delta < 0 ? `decreased by ${formatNumber(Math.abs(stats.delta))}` : "remained stagnant";
  const statusMsg  = stats.ntAch < 80 ? "🔴 Critical" : stats.ntAch < 90 ? "🟡 Needs Improvement" : "🟢 Good Performance";
  const bgClass    = stats.ntAch < 80 ? "narrative-red" : stats.ntAch < 90 ? "narrative-amber" : "narrative-green";

  let extra = "";
  if (level === 0) {
    const districts = aggregateBy(rows, 0).sort((a,b) => a.ntAch - b.ntAch);
    if (districts[0]) extra = ` Most critical district: ${districts[0].name} at ${districts[0].ntAch.toFixed(1)}% NT Ach.`;
  } else if (level === 1) {
    const tehsils = aggregateBy(rows, 1).sort((a,b) => a.ntAch - b.ntAch);
    if (tehsils[0]) extra = ` Most critical tehsil: ${tehsils[0].name} at ${tehsils[0].ntAch.toFixed(1)}% NT Ach.`;
  } else if (level >= 2) {
    const markazs = aggregateBy(rows, 2).sort((a,b) => a.ntAch - b.ntAch);
    if (markazs[0]) extra = ` Most critical markaz: ${markazs[0].name} at ${markazs[0].ntAch.toFixed(1)}% NT Ach.`;
  }

  return `
    <div class="ins-narrative ${bgClass}">
      <div class="ins-narrative-title">${statusMsg}</div>
      <div class="ins-narrative-text">
        <strong>${scope}</strong> — NT Ach: <strong class="${ntCls}">${stats.ntAch.toFixed(1)}%</strong> across <strong>${formatNumber(stats.schools)}</strong> schools.
        Enrollment ${deltaMsg} today. <strong>${formatNumber(stats.schoolsBB)}</strong> schools below baseline.${extra}
      </div>
    </div>`;
}
