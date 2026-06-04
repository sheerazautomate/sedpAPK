/* ============================================================
   HOME.JS — Home Tab View & Analytics Summary
   ============================================================ */

function renderHome() {
  const container = document.getElementById("tab-home");
  if (!container) return;

  const rows = getFilteredData();
  const stats = calcStats(rows);

  // Determine color theme classes for overall status
  const achClass = getAchClass(stats.ach);
  const deltaClass = stats.delta >= 0 ? "trend-up" : "trend-down";
  const deltaSign = stats.delta >= 0 ? "+" : "";

  container.innerHTML = `
    <div class="summary-hero card-${achClass}">
      <div class="hero-label">Overall Achievement Target</div>
      <div class="hero-value">${stats.ach.toFixed(1)}%</div>
      <div class="hero-progress-bar">
        <div class="hero-progress-fill" style="width: ${Math.min(stats.ach, 100)}%"></div>
      </div>
      <div class="hero-meta">
        <span>Current: <strong>${formatNumber(stats.cur)}</strong></span>
        <span>Target: <strong>${formatNumber(stats.tar)}</strong></span>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stats-card">
        <div class="card-subtitle">Active Schools</div>
        <div class="card-main-val">${formatNumber(stats.schools)}</div>
      </div>
      <div class="stats-card">
        <div class="card-subtitle">Net Gain (vs Yesterday)</div>
        <div class="card-main-val ${deltaClass}">${deltaSign}${formatNumber(stats.delta)}</div>
      </div>
      <div class="stats-card">
        <div class="card-subtitle">New Target Ach%</div>
        <div class="card-main-val">${stats.ntAch.toFixed(1)}%</div>
        <div class="card-subtext">Target: ${formatNumber(stats.nt)}</div>
      </div>
      <div class="stats-card">
        <div class="card-subtitle">vs Baseline Profile</div>
        <div class="card-main-val">${stats.basePct.toFixed(1)}%</div>
        <div class="card-subtext">Gap: ${stats.bgap >= 0 ? "+" : ""}${formatNumber(stats.bgap)}</div>
      </div>
    </div>

    <div class="section-title-embedded">School Status Categorization</div>
    <div class="kpi-nav-list">
      
      <div class="kpi-nav-item item-red" onclick="navigateToSchoolsWithFilter('below_baseline')">
        <div class="kpi-nav-info">
          <span class="kpi-nav-title">Below Baseline Profile</span>
          <span class="kpi-nav-desc">Current retention under critical base enrollment</span>
        </div>
        <div class="kpi-nav-badge-count bg-red">${formatNumber(stats.schoolsBB)}</div>
      </div>

      <div class="kpi-nav-item item-amber" onclick="navigateToSchoolsWithFilter('below_target')">
        <div class="kpi-nav-info">
          <span class="kpi-nav-title">Below Final Target</span>
          <span class="kpi-nav-desc">Above baseline but lagging official assignment benchmarks</span>
        </div>
        <div class="kpi-nav-badge-count bg-amber">${formatNumber(stats.schoolsBT)}</div>
      </div>

      <div class="kpi-nav-item item-green" onclick="navigateToSchoolsWithFilter('above_target')">
        <div class="kpi-nav-info">
          <span class="kpi-nav-title">Achieved & Exceeded Target</span>
          <span class="kpi-nav-desc">Schools meeting or outperforming 100% goals</span>
        </div>
        <div class="kpi-nav-badge-count bg-green">${formatNumber(stats.schoolsAT)}</div>
      </div>

    </div>
  `;
}
