/* ============================================================
   INSIGHTS.JS — Data Analytics Engine & Performance Chart
   ============================================================ */

let _insightsChartInstance = null;

function renderInsights() {
  const container = document.getElementById("tab-insights");
  if (!container) return;

  const rows = getFilteredData();
  const stats = calcStats(rows);

  container.innerHTML = `
    <div class="insights-container" style="padding: 16px;">
      
      <div class="insights-card-visualization" style="background: var(--bg-card); padding: 16px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
        <div class="section-title-embedded" style="margin-top:0; margin-bottom:12px;">Retention Distribution Scope</div>
        <div style="position: relative; height: 220px; width: 100%;">
          <canvas id="insightsDonutCanvas"></canvas>
        </div>
      </div>

      <div class="section-title-embedded">Analytical Indicators</div>
      <div class="insights-details-list">
        
        <div class="insight-metric-strip">
          <span class="strip-label">Average Enrollment / School</span>
          <span class="strip-value">${rows.length ? formatNumber(Math.round(stats.cur / rows.length)) : 0}</span>
        </div>

        <div class="insight-metric-strip">
          <span class="strip-label">Target Completion Deficit (Gap)</span>
          <span class="strip-value red-dim-text">${stats.tgap < 0 ? formatNumber(Math.abs(stats.tgap)) : 0}</span>
        </div>

        <div class="insight-metric-strip">
          <span class="strip-label">District Execution Index</span>
          <span class="strip-value">${(stats.ach * 0.98).toFixed(2)}</span>
        </div>

      </div>
    </div>
  `;

  // Instantiate Chart.js context via a delayed animation tick safely
  setTimeout(() => {
    _initInsightsChart(stats);
  }, 60);
}

function _initInsightsChart(stats) {
  const canvas = document.getElementById("insightsDonutCanvas");
  if (!canvas) return;

  // Destroy previous instances to avoid memory leaks or hovering redraw glitches
  if (_insightsChartInstance) {
    _insightsChartInstance.destroy();
  }

  const ctx = canvas.getContext("2d");
  
  // Use CSS custom property fallback variable maps safely
  _insightsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Below Baseline', 'Below Target Step', 'Above Target Threshold'],
      datasets: [{
        data: [stats.schoolsBB, stats.schoolsBT, stats.schoolsAT],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderWidth: 2,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 16,
            font: { family: 'system-ui, sans-serif', size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const val = context.raw || 0;
              const pct = total ? ((val / total) * 100).toFixed(1) : 0;
              return ` ${context.label}: ${val} (${pct}%)`;
            }
          }
        }
      },
      cutout: '65%'
    }
  });
}
