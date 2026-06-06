/* ============================================================
   BOTTOM-NAV.JS — Tab Router + App Boot
   Lazy rendering: each tab renders on first visit, then only
   when the filter changes (dirty flag). This keeps boot fast
   and tab-switching instant after first render.
   ============================================================ */

const TABS = [
  { id: "home",      label: "Home",      hasSearch: false, title: "SEDP Enrollment" },
  { id: "schools",   label: "Schools",   hasSearch: true,  title: "Schools"         },
  { id: "insights",  label: "Insights",  hasSearch: false, title: "Insights"        },
  { id: "breakdown", label: "Breakdown", hasSearch: false, title: "Breakdown"       },
  { id: "export",    label: "Export",    hasSearch: false, title: "Export"          },
];

let _activeTab = "home";

/* Dirty flags — set true when filter changes; cleared after render */
const _dirty = { home: true, schools: true, insights: true, breakdown: true, export: true };
/* Visited flags — has this tab ever been rendered? */
const _visited = { home: false, schools: false, insights: false, breakdown: false, export: false };

/* Render function registry */
const _renderers = {
  home:      () => renderHome(),
  schools:   () => renderSchools(),
  insights:  () => renderInsights(),
  breakdown: () => renderBreakdown(),
  export:    () => renderExport(),
};

/* ============================================================
   PRIVATE: _renderTab(name)
   Renders a tab only if it's dirty or unvisited.
   ============================================================ */
function _renderTab(name) {
  if (!_visited[name] || _dirty[name]) {
    try {
      _renderers[name]();
      _visited[name] = true;
      _dirty[name]   = false;
    } catch (e) {
      console.error(`[nav] render ${name} failed:`, e);
    }
  }
}

/* ============================================================
   PUBLIC: switchTab(name)
   ============================================================ */
function switchTab(name) {
  if (name === _activeTab) return;

  if (_activeTab === "schools") closeSearch();

  const oldPane = document.getElementById(`tab-${_activeTab}`);
  const oldNav  = document.getElementById(`nav-${_activeTab}`);
  if (oldPane) oldPane.classList.remove("active");
  if (oldNav)  oldNav.classList.remove("active");

  const newPane = document.getElementById(`tab-${name}`);
  const newNav  = document.getElementById(`nav-${name}`);
  if (newPane) newPane.classList.add("active");
  if (newNav)  newNav.classList.add("active");

  _activeTab = name;
  updateHeader();

  /* Render lazily — only now if dirty/unvisited */
  _renderTab(name);

  if (newPane) newPane.scrollTop = 0;
}

function getActiveTab() { return _activeTab; }

/* ============================================================
   PUBLIC: updateHeader()
   ============================================================ */
function updateHeader() {
  const tab = TABS.find(t => t.id === _activeTab) || TABS[0];

  const titleEl = document.getElementById("header-title");
  if (titleEl) titleEl.textContent = tab.title;

  const subEl = document.getElementById("header-subtitle");
  if (subEl && APP_SYNC_TIME) {
    const d  = new Date(APP_SYNC_TIME);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    subEl.textContent = `Synced ${d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })} ${hh}:${mm}`;
  }

  const pillText = document.getElementById("scope-pill-text");
  if (pillText) pillText.textContent = getScopeLabel();

  const searchBtn = document.getElementById("search-toggle-btn");
  if (searchBtn) searchBtn.style.display = tab.hasSearch ? "flex" : "none";
}

/* ============================================================
   PUBLIC: hideLoader()
   ============================================================ */
function hideLoader() {
  const overlay = document.getElementById("loader-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  setTimeout(() => overlay.remove(), 350);
}

/* ============================================================
   PUBLIC: showLoaderError(msg)
   ============================================================ */
function showLoaderError(msg) {
  const textEl  = document.getElementById("loader-text");
  const subEl   = document.getElementById("loader-sub");
  const spinner = document.querySelector(".loader-spinner");
  if (spinner) { spinner.style.borderColor = "var(--red-dim)"; spinner.style.borderTopColor = "var(--red)"; spinner.style.animation = "none"; }
  if (textEl)  { textEl.textContent = "Failed to Load Data"; textEl.style.color = "var(--red)"; }
  if (subEl)   subEl.textContent = msg || "Check your connection and try again.";
}

/* ============================================================
   PUBLIC: navigateToSchoolsWithFilter(filterValue)
   Called by Home tab rows to drill into schools list.
   ============================================================ */
function navigateToSchoolsWithFilter(filterValue) {
  switchTab("schools");
  setTimeout(() => {
    const sel = document.getElementById("school-filter-select");
    if (sel) { sel.value = filterValue; applySchoolFilter(filterValue); }
  }, 50);
}

/* ============================================================
   PUBLIC: initNav()
   Boot sequence — fetch data → render active tab → hide loader.
   All other tabs render on first visit.
   ============================================================ */
async function initNav() {
  const ok = await initData();

  if (!ok) {
    showLoaderError("Could not load enrollment data.");
    return;
  }

  initFilterDrawer();

  /* Render ONLY the home tab at boot — everything else is lazy */
  _renderTab("home");

  updateHeader();
  hideLoader();
}

/* ============================================================
   PUBLIC: refreshAllTabs()
   Called after a filter is applied. Marks all tabs dirty,
   immediately re-renders only the currently visible one.
   ============================================================ */
function refreshAllTabs() {
  /* Invalidate school-level cache */
  _cachedRows = null;

  /* Mark everything dirty */
  for (const k in _dirty) _dirty[k] = true;

  /* Immediately re-render only the active tab */
  _renderTab(_activeTab);

  updateHeader();
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => { initNav(); });
