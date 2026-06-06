/* ============================================================
   SCHOOLS.JS — Paginated schools table, sort + filter
   Default sort: NT Ach% ascending (worst first)
   Pagination: 50 rows per page
   ============================================================ */

let _currentSchoolFilter = "all_schools";
let _currentSchoolSort   = "ntAch";   /* default: NT Ach% */
let _searchQuery         = "";
let _searchTimeout       = null;
let _cachedRows          = null;
let _cacheKey            = null;
let _schoolPage          = 1;
const _SCHOOL_PAGE_SIZE  = 50;

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

    if      (_currentSchoolFilter === "below_baseline")             rows = rows.filter(r => r[7] < r[6]);
    else if (_currentSchoolFilter === "below_target")               rows = rows.filter(r => r[7] < r[8]);
    else if (_currentSchoolFilter === "above_baseline_below_target") rows = rows.filter(r => r[7] >= r[6] && r[7] < r[8]);
    else if (_currentSchoolFilter === "above_target")               rows = rows.filter(r => r[7] >= r[8]);

    if (_searchQuery.trim()) {
      const q = _searchQuery.toLowerCase().trim();
      rows = rows.filter(r => r[4].includes(q) || r[5].toLowerCase().includes(q));
    }

    rows.sort((a, b) => {
      const aN = a[10] ? ((a[7]-a[6])/a[10]) : 0;
      const bN = b[10] ? ((b[7]-b[6])/b[10]) : 0;
      const aA = a[8]  ? a[7]/a[8]  : 0;
      const bA = b[8]  ? b[7]/b[8]  : 0;
      if (_currentSchoolSort === "ntAch") return aN - bN;
      if (_currentSchoolSort === "ach")   return aA - bA;
      if (_currentSchoolSort === "name")  return a[5].localeCompare(b[5]);
      if (_currentSchoolSort === "emis")  return a[4].localeCompare(b[4]);
      return 0;
    });

    _cachedRows = rows;
    _cacheKey   = key;
    _schoolPage = 1;  /* reset to page 1 on new data */
  }

  const rows     = _cachedRows;
  const total    = rows.length;
  const pages    = Math.ceil(total / _SCHOOL_PAGE_SIZE);
  const start    = (_schoolPage - 1) * _SCHOOL_PAGE_SIZE;
  const pageRows = rows.slice(start, start + _SCHOOL_PAGE_SIZE);

  if (countBadge) countBadge.textContent = formatNumber(total);

  if (total === 0) {
    host.innerHTML = `<div class="empty-state"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>No matching schools found.</div>`;
    return;
  }

  const rowsHtml = pageRows.map((r, idx) => {
    const ach   = r[8]  ? (r[7]/r[8])*100               : 0;
    const ntAch = r[10] ? ((r[7]-r[6])/r[10])*100       : 0;
    const cls   = getAchClass(ach);
    const ntCls = getAchClass(ntAch);
    const delta = r[7] - r[9];
    const dCls  = delta > 0 ? "pos" : delta < 0 ? "neg" : "flat";
    const srNo  = start + idx + 1;

    return `<tr class="row-${ntCls}">
      <td class="c mono muted" style="font-size:0.6rem;">${srNo}</td>
      <td>
        <span class="cell-primary">${r[5]}</span>
        <span class="cell-sub">${r[1]} · ${r[2]}</span>
      </td>
      <td class="mono muted c" style="font-size:0.6rem;">${r[4]}</td>
      <td class="r">${formatNumber(r[6])}</td>
      <td class="r">${formatNumber(r[7])}</td>
      <td class="r">${formatNumber(r[8])}</td>
      <td class="c"><span class="ach-pill ${cls}">${ach.toFixed(1)}%</span></td>
      <td class="c"><span class="delta-pill ${dCls}">${delta >= 0 ? "+" : ""}${formatNumber(delta)}</span></td>
      <td class="c"><span class="ach-pill ${ntCls}">${ntAch.toFixed(1)}%</span></td>
    </tr>`;
  }).join("");

  const paginationHtml = _buildPagination(pages);

  host.innerHTML = `
    <div class="table-wrap fade-in">
      <table class="data-table">
        <colgroup>
          <col style="width:26px">
          <col style="width:auto">
          <col style="width:9%">
          <col style="width:8%">
          <col style="width:8%">
          <col style="width:8%">
          <col style="width:10%">
          <col style="width:10%">
          <col style="width:10%">
        </colgroup>
        <thead>
          <tr>
            <th class="c">#</th>
            <th>School</th>
            <th class="c">EMIS</th>
            <th class="r">Base</th>
            <th class="r">Curr</th>
            <th class="r">Tgt</th>
            <th class="c">Ach%</th>
            <th class="c">Daily Δ</th>
            <th class="c">NT Ach%</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    ${paginationHtml}
  `;
}

function _buildPagination(pages) {
  if (pages <= 1) return "";

  const p = _schoolPage;
  let buttons = "";

  /* Prev */
  buttons += `<button class="pg-btn${p===1?' disabled':''}" onclick="schoolGoToPage(${p-1})" ${p===1?'disabled':''}>‹</button>`;

  /* Page numbers — show 5 around current */
  const start = Math.max(1, p - 2);
  const end   = Math.min(pages, p + 2);

  if (start > 1) buttons += `<button class="pg-btn" onclick="schoolGoToPage(1)">1</button>${start > 2 ? '<span class="pg-ellipsis">…</span>' : ''}`;

  for (let i = start; i <= end; i++) {
    buttons += `<button class="pg-btn${i === p ? ' active' : ''}" onclick="schoolGoToPage(${i})">${i}</button>`;
  }

  if (end < pages) buttons += `${end < pages - 1 ? '<span class="pg-ellipsis">…</span>' : ''}<button class="pg-btn" onclick="schoolGoToPage(${pages})">${pages}</button>`;

  /* Next */
  buttons += `<button class="pg-btn${p===pages?' disabled':''}" onclick="schoolGoToPage(${p+1})" ${p===pages?'disabled':''}>›</button>`;

  return `<div class="pagination-bar"><span class="pg-info">${formatNumber((_schoolPage-1)*_SCHOOL_PAGE_SIZE+1)}–${formatNumber(Math.min(_schoolPage*_SCHOOL_PAGE_SIZE,_cachedRows.length))} of ${formatNumber(_cachedRows.length)}</span><div class="pg-buttons">${buttons}</div></div>`;
}

function schoolGoToPage(p) {
  const pages = Math.ceil((_cachedRows ? _cachedRows.length : 0) / _SCHOOL_PAGE_SIZE);
  if (p < 1 || p > pages) return;
  _schoolPage = p;

  const host = document.getElementById("schools-scroll-host");
  if (host) host.scrollTop = 0;
  renderSchools();
}

function applySchoolFilter(value) {
  _currentSchoolFilter = value;
  _cachedRows = null;
  _schoolPage = 1;
  renderSchools();
}

function applySchoolSort(value) {
  _currentSchoolSort = value;
  _cachedRows = null;
  _schoolPage = 1;
  renderSchools();
}

function toggleSearch() {
  const wrap = document.getElementById("search-bar-wrap");
  if (!wrap) return;
  wrap.classList.toggle("open");
  if (wrap.classList.contains("open")) document.getElementById("school-search-input").focus();
}

function closeSearch() {
  const wrap  = document.getElementById("search-bar-wrap");
  const input = document.getElementById("school-search-input");
  if (wrap)  wrap.classList.remove("open");
  if (input) input.value = "";
  _searchQuery = "";
  _cachedRows  = null;
  _schoolPage  = 1;
  clearTimeout(_searchTimeout);
  renderSchools();
}

function onSearchInput(value) {
  _searchQuery = value;
  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(() => {
    _cachedRows = null;
    _schoolPage = 1;
    renderSchools();
  }, 280);
}
