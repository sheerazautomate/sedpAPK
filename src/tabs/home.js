/* ============================================================
   HOME.JS — Summary Dashboard
   ============================================================ */

function renderHome() {
  const container = document.getElementById("tab-home");
  if (!container) return;

  const rows  = getFilteredData();
  const stats = calcStats(rows);
  const achClass  = getAchClass(stats.ach);
  const deltaSign = stats.delta >= 0 ? "+" : "";
  const deltaClass = stats.delta >= 0 ? "up" : "down";

  container.innerHTML = `
    <div class="home-content fade-in">

      <!-- Hero achievement -->
      <div class="hero-card ${achClass}">
        <div class="hero-label">Overall Achievement vs Target</div>
        <div class="hero-value ${achClass}">${stats.ach.toFixed(1)}%</div>
        <div class="progress-bar">
          <div class="progress-fill ${achClass}" style="width:${Math.min(stats.ach,100)}%"></div>
        </div>
        <div class="hero-meta">
          <span>Current: <strong>${formatNumber(stats.cur)}</strong></span>
          <span>Target: <strong>${formatNumber(stats.tar)}</strong></span>
          <span>Gap: <strong>${stats.tgap >= 0 ? "+" : ""}${formatNumber(stats.tgap)}</strong></span>
        </div>
      </div>

      <!-- 4-KPI grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Schools in Scope</div>
          <div class="kpi-value">${formatNumber(stats.schools)}</div>
          <div class="kpi-subtext">Active schools</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">vs Yesterday</div>
          <div class="kpi-value ${deltaClass}">${deltaSign}${formatNumber(stats.delta)}</div>
          <div class="kpi-subtext">Net enrollment change</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">New Target Ach%</div>
          <div class="kpi-value ${getAchClass(stats.ntAch)}">${stats.ntAch.toFixed(1)}%</div>
          <div class="kpi-subtext">NT: ${formatNumber(stats.nt)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">vs Baseline</div>
          <div class="kpi-value ${stats.basePct >= 100 ? 'up' : 'down'}">${stats.basePct.toFixed(1)}%</div>
          <div class="kpi-subtext">Gap: ${stats.bgap >= 0 ? "+" : ""}${formatNumber(stats.bgap)}</div>
        </div>
      </div>

      <!-- School status breakdown -->
      <div class="section-header">School Status</div>
      <div class="status-list">
        <div class="status-row red" onclick="navigateToSchoolsWithFilter('below_baseline')">
          <div class="status-icon red">
            <svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="status-info">
            <div class="status-title">Below Baseline</div>
            <div class="status-desc">Enrollment under base profile — critical</div>
          </div>
          <div class="status-count red">${formatNumber(stats.schoolsBB)}</div>
        </div>

        <div class="status-row amber" onclick="navigateToSchoolsWithFilter('above_baseline_below_target')">
          <div class="status-icon amber">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div class="status-info">
            <div class="status-title">Above Baseline, Below Target</div>
            <div class="status-desc">Recovered but lagging assignment</div>
          </div>
          <div class="status-count amber">${formatNumber(stats.schoolsBT)}</div>
        </div>

        <div class="status-row green" onclick="navigateToSchoolsWithFilter('above_target')">
          <div class="status-icon green">
            <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="status-info">
            <div class="status-title">Achieved Target</div>
            <div class="status-desc">Meeting or exceeding 100% goal</div>
          </div>
          <div class="status-count green">${formatNumber(stats.schoolsAT)}</div>
        </div>
      </div>

    </div>
  `;
}
