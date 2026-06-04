/* ============================================================
   INSIGHTS.JS — Analytics with chart + top/bottom performers
   ============================================================ */

let _insightsChart   = null;
let _cachedStats     = null;
let _cacheFilterKey  = null;

function renderInsights() {
  const container = document.getElementById("tab-insights");
  if (!container) return;

  const filterKey = JSON.stringify(APP_FILTER);
  let rows, stats;

  if (_cacheFilterKey === filterKey && _cachedStats) {
    stats = _cachedStats;
    rows  = getFilteredData(); // still need rows for performers
  } else {
    rows  = getFilteredData();
    stats = calcStats(rows);
    _cachedStats    = stats;
    _cacheFilterKey = filterKey;
  }

  /* Top 5 & Bottom 5 by Ach% */
  const withAch = rows
    .filter(r => r[8] > 0)
    .map(r => ({ name: r[5], tehsil: r[1], ach: (r[7]/r[8])*100, cur: r[7], tar: r[8] }));

  const bottom5 = [...withAch].sort((a,b) => a.ach - b.ach).slice(0, 5);
  const top5    = [...withAch].sort((a,b) => b.ach - a.ach).slice(0, 5);

  const makePerformerRows = (list, isBottom) => list.map((s, i) => {
    const cls = getAchClass(s.ach);
    const bgColors = isBottom ? ['#dc2626','#ef4444','#f87171','#fca5a5','#fecaca'] : ['#16a34a','#22c55e','#4ade80','#86efac','#bbf7d0'];
    return `<tr>
      <td class="c"><span class="rank-num" style="background:${bgColors[i]}">${i+1}</span></td>
      <td>
        <span class="cell-primary">${s.name}</span>
        <span class="cell-sub">${s.tehsil}</span>
      </td>
      <td class="r">${formatNumber(s.cur)}</td>
      <td class="r"><span class="ach-pill ${cls}">${s.ach.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  const pctBB = stats.schools ? ((stats.schoolsBB / stats.schools)*100).toFixed(1) : 0;
  const pctBT = stats.schools ? ((stats.schoolsBT / stats.schools)*100).toFixed(1) : 0;
  const pctAT = stats.schools ? ((stats.schoolsAT / stats.schools)*100).toFixed(1) : 0;

  container.innerHTML = `
    <div class="insights-content fade-in">

      <!-- Donut + legend -->
      <div class="ins-card">
        <div class="ins-card-title">School Distribution</div>
        <div class="donut-layout">
          <div class="donut-canvas-wrap">
            <canvas id="insightsDonutCanvas"></canvas>
          </div>
          <div class="donut-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background:#dc2626"></span>
              <span class="legend-label">Below Baseline</span>
              <span class="legend-val">${formatNumber(stats.schoolsBB)}</span>
              <span class="legend-pct">${pctBB}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#d97706"></span>
              <span class="legend-label">Below Target</span>
              <span class="legend-val">${formatNumber(stats.schoolsBT)}</span>
              <span class="legend-pct">${pctBT}%</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#16a34a"></span>
              <span class="legend-label">Achieved</span>
              <span class="legend-val">${formatNumber(stats.schoolsAT)}</span>
              <span class="legend-pct">${pctAT}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Key metrics -->
      <div class="ins-card">
        <div class="ins-card-title">Key Metrics</div>
        <div class="metric-strip">
          <span class="metric-label">Total Current Enrollment</span>
          <span class="metric-value">${formatNumber(stats.cur)}</span>
        </div>
        <div class="metric-strip">
          <span class="metric-label">Total Baseline Enrollment</span>
          <span class="metric-value">${formatNumber(stats.bas)}</span>
        </div>
        <div class="metric-strip">
          <span class="metric-label">Total Target</span>
          <span class="metric-value">${formatNumber(stats.tar)}</span>
        </div>
        <div class="metric-strip">
          <span class="metric-label">Target Gap (Current − Target)</span>
          <span class="metric-value ${stats.tgap >= 0 ? 'green' : 'red'}">${stats.tgap >= 0 ? "+" : ""}${formatNumber(stats.tgap)}</span>
        </div>
        <div class="metric-strip">
          <span class="metric-label">Avg Enrollment per School</span>
          <span class="metric-value">${rows.length ? formatNumber(Math.round(stats.cur / rows.length)) : 0}</span>
        </div>
        <div class="metric-strip">
          <span class="metric-label">Schools in Scope</span>
          <span class="metric-value">${formatNumber(stats.schools)}</span>
        </div>
      </div>

      <!-- Bottom 5 schools -->
      <div class="ins-card">
        <div class="ins-card-title" style="color:var(--red)">⬇ Bottom 5 Schools (by Ach%)</div>
        <table class="ins-table">
          <thead><tr>
            <th class="c">#</th>
            <th>School</th>
            <th class="r">Current</th>
            <th class="r">Ach%</th>
          </tr></thead>
          <tbody>${makePerformerRows(bottom5, true)}</tbody>
        </table>
      </div>

      <!-- Top 5 schools -->
      <div class="ins-card">
        <div class="ins-card-title" style="color:var(--green)">⬆ Top 5 Schools (by Ach%)</div>
        <table class="ins-table">
          <thead><tr>
            <th class="c">#</th>
            <th>School</th>
            <th class="r">Current</th>
            <th class="r">Ach%</th>
          </tr></thead>
          <tbody>${makePerformerRows(top5, false)}</tbody>
        </table>
      </div>

    </div>
  `;

  requestAnimationFrame(() => _initChart(stats));
}

function _initChart(stats) {
  const canvas = document.getElementById("insightsDonutCanvas");
  if (!canvas || typeof Chart === "undefined") return;

  if (_insightsChart) { _insightsChart.destroy(); _insightsChart = null; }

  _insightsChart = new Chart(canvas.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["Below Baseline", "Below Target", "Achieved"],
      datasets: [{
        data: [stats.schoolsBB, stats.schoolsBT, stats.schoolsAT],
        backgroundColor: ["#dc2626", "#d97706", "#16a34a"],
        borderWidth: 0,
        hoverOffset: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
              const pct   = total ? ((ctx.raw/total)*100).toFixed(1) : 0;
              return ` ${ctx.label}: ${ctx.raw} (${pct}%)`;
            }
          }
        }
      },
      cutout: "68%"
    }
  });
}
