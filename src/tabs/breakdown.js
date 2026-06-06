/* ============================================================
   BREAKDOWN.JS — Regional Aggregation Table
   ============================================================ */

let _breakdownViewType = "district";
let _breakdownSortType = "ntAch";

function renderBreakdown() {
  const list       = document.getElementById("breakdown-list");
  const countBadge = document.getElementById("breakdown-count-badge");
  if (!list) return;

  const rows = getFilteredData();

  let colIndex = 0;
  if (_breakdownViewType === "wing")   colIndex = 3;
  if (_breakdownViewType === "tehsil") colIndex = 1;
  if (_breakdownViewType === "markaz") colIndex = 2;

  let groups = aggregateBy(rows, colIndex);

  if (_breakdownSortType === "ach")    groups.sort((a,b) => a.ach - b.ach);
  else if (_breakdownSortType === "ntAch") groups.sort((a,b) => a.ntAch - b.ntAch);
  else if (_breakdownSortType === "name")  groups.sort((a,b) => a.name.localeCompare(b.name));

  if (countBadge) countBadge.textContent = formatNumber(groups.length);

  if (groups.length === 0) {
    list.innerHTML = `<div class="empty-state">No breakdown data available for current scope.</div>`;
    return;
  }

  const rowsHtml = groups.map(g => {
    const cls    = getAchClass(g.ach);
    const ntCls  = getAchClass(g.ntAch);
    const dSign  = g.delta >= 0 ? "+" : "";
    const dCls   = g.delta > 0 ? "pos" : g.delta < 0 ? "neg" : "flat";

    return `<tr class="row-${cls}">
      <td>
        <span class="cell-primary">${g.name}</span>
        <span class="cell-sub">${formatNumber(g.count)} schools</span>
        <div class="mini-bar-wrap">
          <div class="mini-bar-fill ${cls}" style="width:${Math.min(g.ach,100)}%"></div>
        </div>
      </td>
      <td class="r">${formatNumber(g.cur)}</td>
      <td class="r">${formatNumber(g.tar)}</td>
      <td class="c"><span class="ach-pill ${cls}">${g.ach.toFixed(1)}%</span></td>
      <td class="c"><span class="delta-pill ${dCls}">${dSign}${formatNumber(g.delta)}</span></td>
      <td class="c"><span class="ach-pill ${ntCls}">${g.ntAch.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  list.innerHTML = `
    <div class="table-wrap fade-in">
      <table class="data-table">
        <colgroup>
          <col style="width:32%">
          <col style="width:14%">
          <col style="width:14%">
          <col style="width:14%">
          <col style="width:13%">
          <col style="width:13%">
        </colgroup>
        <thead>
          <tr>
            <th>${_breakdownViewType.charAt(0).toUpperCase() + _breakdownViewType.slice(1)}</th>
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
