/* ============================================================
   BREAKDOWN.JS — Regional Matrix Aggregator
   ============================================================ */

let _breakdownViewType = "district"; // Default layout column type mapper
let _breakdownSortType = "ach";

function renderBreakdown() {
  const listContainer = document.getElementById("breakdown-list");
  const countBadge = document.getElementById("breakdown-count-badge");
  if (!listContainer) return;

  const rows = getFilteredData();

  // Column key lookup config mapper: 0=district, 1=tehsil, 2=markaz, 3=wing
  let colIndex = 0;
  if (_breakdownViewType === "wing") colIndex = 3;
  else if (_breakdownViewType === "tehsil") colIndex = 1;
  else if (_breakdownViewType === "markaz") colIndex = 2;

  // Process rows through our shared aggregator engine inside fetch-data.js
  let groups = aggregateBy(rows, colIndex);

  // Apply contextual sorting preferences
  if (_breakdownSortType === "ach") {
    groups.sort((a, b) => a.ach - b.ach); // Low performance units at top to highlight attention zones
  } else if (_breakdownSortType === "ntAch") {
    groups.sort((a, b) => a.ntAch - b.ntAch);
  } else if (_breakdownSortType === "name") {
    groups.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (countBadge) countBadge.textContent = formatNumber(groups.length);

  if (groups.length === 0) {
    listContainer.innerHTML = `<div class="empty-state-msg">No structural breakdown available.</div>`;
    return;
  }

  listContainer.innerHTML = `
    <div class="breakdown-matrix-grid" style="padding: 0 16px 16px 16px;">
      ${groups.map(g => {
        const deltaSign = g.delta >= 0 ? "+" : "";
        return `
          <div class="breakdown-row-card" style="background: var(--bg-card); border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow:0 1px 2px rgba(0,0,0,0.04); border-left: 4px solid var(--border-color, #e5e7eb);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-weight: 600; font-size: 15px; color: var(--text-main);">${g.name}</span>
              <span class="list-count-badge" style="background: var(--bg-app); color: var(--text-muted);">${g.count} Schools</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <span style="font-size: 20px; font-weight: 700; color: var(--${g.achClass});">${g.ach.toFixed(1)}% <span style="font-size:12px; font-weight:400; color:var(--text-muted);">Achieved</span></span>
              <span style="font-size: 13px; font-weight: 500; color: ${g.delta >= 0 ? 'var(--green)' : 'var(--red)'};">
                Daily: ${deltaSign}${formatNumber(g.delta)}
              </span>
            </div>

            <div style="width: 100%; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
              <div style="width: ${Math.min(g.ach, 100)}%; height: 100%; background: var(--${g.achClass});"></div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
              <span>Current: <strong>${formatNumber(g.cur)}</strong></span>
              <span>Target: <strong>${formatNumber(g.tar)}</strong></span>
              <span>NT Ach: <strong>${g.ntAch.toFixed(1)}%</strong></span>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function applyBreakdownView(value) {
  _breakdownViewType = value;
  renderBreakdown();
}

function applyBreakdownSort(value) {
  _breakdownSortType = value;
  renderBreakdown();
}
