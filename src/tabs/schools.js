/* ============================================================
   SCHOOLS.JS — Schools Table with Sort + Filter
   ============================================================ */

let _currentSchoolFilter = "all_schools";
let _currentSchoolSort   = "ach";
let _searchQuery         = "";
let _searchTimeout       = null;
let _cachedRows          = null;
let _cacheKey            = null;

/* Cache key includes filter state so changing scope invalidates it */
function _getCacheKey() {
  return `${JSON.stringify(APP_FILTER)}|${_currentSchoolFilter}|${_currentSchoolSort}|${_searchQuery}`;
}

function renderSchools() {
  const host       = document.getElementById("schools-scroll-host");
  const countBadge = document.getElementById("schools-count-badge");
  if (!host) return;

  const key = _getCacheKey();
  if (_cacheKey !== key || !_cachedRows) {
    let rows = getFilteredData();

    if (_currentSchoolFilter === "below_baseline") {
      rows = rows.filter(r => r[7] < r[6]);
    } else if (_currentSchoolFilter === "below_target") {
      rows = rows.filter(r => r[7] < r[8]);
    } else if (_currentSchoolFilter === "above_baseline_below_target") {
      rows = rows.filter(r => r[7] >= r[6] && r[7] < r[8]);
    } else if (_currentSchoolFilter === "above_target") {
      rows = rows.filter(r => r[7] >= r[8]);
    }

    if (_searchQuery.trim()) {
      const q = _searchQuery.toLowerCase().trim();
      rows = rows.filter(r => r[4].includes(q) || r[5].toLowerCase().includes(q));
    }

    rows.sort((a, b) => {
      if (_currentSchoolSort === "ach")   return (a[8] ? a[7]/a[8] : 0) - (b[8] ? b[7]/b[8] : 0);
      if (_currentSchoolSort === "ntAch") return (a[10] ? (a[7]-a[6])/a[10] : 0) - (b[10] ? (b[7]-b[6])/b[10] : 0);
      if (_currentSchoolSort === "name")  return a[5].localeCompare(b[5]);
      if (_currentSchoolSort === "emis")  return a[4].localeCompare(b[4]);
      return 0;
    });

    _cachedRows = rows;
    _cacheKey   = key;
  }

  const rows = _cachedRows;
  if (countBadge) countBadge.textContent = formatNumber(rows.length);

  if (rows.length === 0) {
    host.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>No matching schools found.</div>`;
    return;
  }

  const rowsHtml = rows.map(r => {
    const ach   = r[8] ? (r[7] / r[8]) * 100 : 0;
    const cls   = getAchClass(ach);
    const delta = r[7] - r[9];
    const dSign = delta >= 0 ? "+" : "";
    const dCls  = delta > 0 ? "pos" : delta < 0 ? "neg" : "flat";
    const ntAch = r[10] ? ((r[7] - r[6]) / r[10]) * 100 : 0;

    return `<tr class="row-${cls}">
      <td>
        <span class="cell-primary">${r[5]}</span>
        <span class="cell-sub">${r[1]} • ${r[2]}</span>
      </td>
      <td class="mono muted">${r[4]}</td>
      <td class="r">${formatNumber(r[6])}</td>
      <td class="r">${formatNumber(r[7])}</td>
      <td class="r">${formatNumber(r[8])}</td>
      <td class="c"><span class="ach-pill ${cls}">${ach.toFixed(1)}%</span></td>
      <td class="c"><span class="delta-pill ${dCls}">${dSign}${formatNumber(delta)}</span></td>
      <td class="c"><span class="ach-pill ${getAchClass(ntAch)}">${ntAch.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  host.innerHTML = `
    <div class="table-wrap fade-in">
      <table class="data-table">
        <colgroup>
          <col style="width:30%">
          <col style="width:10%">
          <col style="width:9%">
          <col style="width:9%">
          <col style="width:9%">
          <col style="width:11%">
          <col style="width:11%">
          <col style="width:11%">
        </colgroup>
        <thead>
          <tr>
            <th>School</th>
            <th>EMIS</th>
            <th class="r">Base</th>
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

function applySchoolFilter(value) {
  _currentSchoolFilter = value;
  _cachedRows = null;
  renderSchools();
}

function applySchoolSort(value) {
  _currentSchoolSort = value;
  _cachedRows = null;
  renderSchools();
}

function toggleSearch() {
  const wrap = document.getElementById("search-bar-wrap");
  if (!wrap) return;
  wrap.classList.toggle("open");
  if (wrap.classList.contains("open")) {
    document.getElementById("school-search-input").focus();
  }
}

function closeSearch() {
  const wrap  = document.getElementById("search-bar-wrap");
  const input = document.getElementById("school-search-input");
  if (wrap)  wrap.classList.remove("open");
  if (input) input.value = "";
  _searchQuery = "";
  _cachedRows  = null;
  clearTimeout(_searchTimeout);
  renderSchools();
}

function onSearchInput(value) {
  _searchQuery = value;
  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(() => {
    _cachedRows = null;
    renderSchools();
  }, 250);
}
