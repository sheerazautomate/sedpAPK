/* ============================================================
   SCHOOLS.JS — Schools List Management & Quick Search
   ============================================================ */

let _currentSchoolFilter = "all_schools";
let _currentSchoolSort = "ach";
let _searchQuery = "";

function renderSchools() {
  const host = document.getElementById("schools-scroll-host");
  const countBadge = document.getElementById("schools-count-badge");
  if (!host) return;

  let rows = getFilteredData();

  // 1. Apply Top Status Filter
  if (_currentSchoolFilter === "below_baseline") {
    rows = rows.filter(r => r[7] < r[6]);
  } else if (_currentSchoolFilter === "below_target") {
    rows = rows.filter(r => r[7] < r[8]);
  } else if (_currentSchoolFilter === "above_baseline_below_target") {
    rows = rows.filter(r => r[7] >= r[6] && r[7] < r[8]);
  } else if (_currentSchoolFilter === "above_target") {
    rows = rows.filter(r => r[7] >= r[8]);
  }

  // 2. Apply Text/EMIS Search Filter
  if (_searchQuery.trim() !== "") {
    const q = _searchQuery.toLowerCase().trim();
    rows = rows.filter(r => r[4].includes(q) || r[5].toLowerCase().includes(q));
  }

  // 3. Apply Multi-Type Sorting Metrics
  rows.sort((a, b) => {
    if (_currentSchoolSort === "ach") {
      const achA = a[8] ? (a[7] / a[8]) : 0;
      const achB = b[8] ? (b[7] / b[8]) : 0;
      return achA - achB; // Ascending order to highlight lagging units first
    } else if (_currentSchoolSort === "ntAch") {
      const ntAchA = a[10] ? ((a[7] - a[6]) / a[10]) : 0;
      const ntAchB = b[10] ? ((b[7] - b[6]) / b[10]) : 0;
      return ntAchA - ntAchB;
    } else if (_currentSchoolSort === "name") {
      return a[5].localeCompare(b[5]);
    } else if (_currentSchoolSort === "emis") {
      return a[4].localeCompare(b[4]);
    }
    return 0;
  });

  // Update localized UI badges
  if (countBadge) countBadge.textContent = formatNumber(rows.length);

  if (rows.length === 0) {
    host.innerHTML = `<div class="empty-state-msg">No matching schools found within scope.</div>`;
    return;
  }

  // Render list template using a high-performance map string injection
  host.innerHTML = `
    <div class="virtual-scroll-container">
      ${rows.map(r => {
        const ach = r[8] ? (r[7] / r[8]) * 100 : 0;
        const colorClass = getAchClass(ach);
        const dailyDelta = r[7] - r[9];
        const deltaSign = dailyDelta >= 0 ? "+" : "";
        
        return `
          <div class="school-list-card border-${colorClass}">
            <div class="school-card-header">
              <span class="school-emis-tag">${r[4]}</span>
              <span class="school-delta-pill ${dailyDelta >= 0 ? 'pos' : 'neg'}">
                Daily: ${deltaSign}${formatNumber(dailyDelta)}
              </span>
            </div>
            <div class="school-name-text">${r[5]}</div>
            <div class="school-meta-loc-text">${r[1]} • ${r[2]}</div>
            
            <div class="school-metrics-row">
              <div class="metric-block">
                <span class="m-lbl">Baseline</span>
                <span class="m-val">${formatNumber(r[6])}</span>
              </div>
              <div class="metric-block">
                <span class="m-lbl">Current</span>
                <span class="m-val emphasis">${formatNumber(r[7])}</span>
              </div>
              <div class="metric-block">
                <span class="m-lbl">Target</span>
                <span class="m-val">${formatNumber(r[8])}</span>
              </div>
              <div class="metric-block text-right">
                <span class="m-lbl">Achieved%</span>
                <span class="m-val indicator-${colorClass}">${ach.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ── TOOLBAR EXPOSED EVENT HANDLERS ── */

function applySchoolFilter(value) {
  _currentSchoolFilter = value;
  renderSchools();
}

function applySchoolSort(value) {
  _currentSchoolSort = value;
  renderSchools();
}

/* ── SEARCH BAR EVENT ENGINE ── */

function toggleSearch() {
  const wrap = document.getElementById("search-bar-wrap");
  if (!wrap) return;
  wrap.classList.toggle("open");
  if (wrap.classList.contains("open")) {
    document.getElementById("school-search-input").focus();
  }
}

function closeSearch() {
  const wrap = document.getElementById("search-bar-wrap");
  const input = document.getElementById("school-search-input");
  if (wrap) wrap.classList.remove("open");
  if (input) input.value = "";
  _searchQuery = "";
  renderSchools();
}

function onSearchInput(value) {
  _searchQuery = value;
  renderSchools();
}
