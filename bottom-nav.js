/* ============================================================
   BOTTOM-NAV.JS — Tab Router + App Boot
   Owns:
     - switchTab(name)   — switches active tab + header state
     - initNav()         — wires up the boot sequence
     - hideLoader()      — fades out the loader overlay
     - updateHeader()    — syncs header title/subtitle/scope pill
   ============================================================ */

/* Tab definitions — drives all nav rendering decisions */
const TABS = [
  { id: "home",      label: "Home",      hasSearch: false, title: "SEDP Enrollment" },
  { id: "schools",   label: "Schools",   hasSearch: true,  title: "Schools"         },
  { id: "insights",  label: "Insights",  hasSearch: false, title: "Insights"        },
  { id: "breakdown", label: "Breakdown", hasSearch: false, title: "Breakdown"       },
  { id: "export",    label: "Export",    hasSearch: false, title: "Export"          },
];

let _activeTab = "home";

/* ============================================================
   PUBLIC: switchTab(name)
   Deactivates current tab, activates the new one, updates
   header, closes search if open.
   ============================================================ */
function switchTab(name) {
  if (name === _activeTab) return;

  // Close search bar if leaving Schools tab
  if (_activeTab === "schools") closeSearch();

  // Deactivate old tab pane + nav item
  const oldPane = document.getElementById(`tab-${_activeTab}`);
  const oldNav  = document.getElementById(`nav-${_activeTab}`);
  if (oldPane) oldPane.classList.remove("active");
  if (oldNav)  oldNav.classList.remove("active");

  // Activate new tab pane + nav item
  const newPane = document.getElementById(`tab-${name}`);
  const newNav  = document.getElementById(`nav-${name}`);
  if (newPane) newPane.classList.add("active");
  if (newNav)  newNav.classList.add("active");

  _activeTab = name;
  updateHeader();

  // Scroll the new tab to top
  if (newPane) newPane.scrollTop = 0;
}

/* ============================================================
   PUBLIC: getActiveTab()
   ============================================================ */
function getActiveTab() { return _activeTab; }

/* ============================================================
   PUBLIC: updateHeader()
   Syncs the header title, subtitle (sync time), scope pill,
   and search icon visibility to the current tab + filter state.
   ============================================================ */
function updateHeader() {
  const tab = TABS.find(t => t.id === _activeTab) || TABS[0];

  // Title
  const titleEl = document.getElementById("header-title");
  if (titleEl) titleEl.textContent = tab.title;

  // Subtitle — last sync time
  const subEl = document.getElementById("header-subtitle");
  if (subEl && APP_SYNC_TIME) {
    const d = new Date(APP_SYNC_TIME);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    subEl.textContent = `Synced ${d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })} ${hh}:${mm}`;
  }

  // Scope pill text
  const pillText = document.getElementById("scope-pill-text");
  if (pillText) pillText.textContent = getScopeLabel();

  // Search icon — only visible on Schools tab
  const searchBtn = document.getElementById("search-toggle-btn");
  if (searchBtn) searchBtn.style.display = tab.hasSearch ? "flex" : "none";
}

/* ============================================================
   PUBLIC: hideLoader()
   Fades out and removes the loader overlay.
   ============================================================ */
function hideLoader() {
  const overlay = document.getElementById("loader-overlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  setTimeout(() => overlay.remove(), 350);
}

/* ============================================================
   PUBLIC: showLoaderError(msg)
   Shows a permanent error state in the loader (data failed).
   ============================================================ */
function showLoaderError(msg) {
  const textEl = document.getElementById("loader-text");
  const subEl  = document.getElementById("loader-sub");
  const spinner = document.querySelector(".loader-spinner");

  if (spinner) {
    spinner.style.borderColor = "var(--red-dim)";
    spinner.style.borderTopColor = "var(--red)";
    spinner.style.animation = "none";
  }
  if (textEl) {
    textEl.textContent = "Failed to Load Data";
    textEl.style.color = "var(--red)";
  }
  if (subEl) subEl.textContent = msg || "Check your connection and try again.";
}

/* ============================================================
   PUBLIC: navigateToSchoolsWithFilter(filterValue)
   Called by Home tab KPI cards — switches to Schools tab
   and applies the given filter value.
   ============================================================ */
function navigateToSchoolsWithFilter(filterValue) {
  switchTab("schools");

  // Let the DOM update before setting the select + re-rendering
  setTimeout(() => {
    const sel = document.getElementById("school-filter-select");
    if (sel) {
      sel.value = filterValue;
      applySchoolFilter(filterValue);
    }
  }, 50);
}

/* ============================================================
   PUBLIC: initNav()
   App boot sequence. Called once from DOMContentLoaded.
   Order: fetch data → render all tabs → hide loader.
   ============================================================ */
async function initNav() {
  // 1. Fetch and build MASTER_DATA
  const ok = await initData();

  if (!ok) {
    showLoaderError("Could not load base_schools.json.");
    return;
  }

  // 2. Populate filter drawer dropdowns (needs APP_HIERARCHY)
  initFilterDrawer();

  // 3. Render all tabs (background — user sees Home first)
  try { renderHome();      } catch (e) { console.error("[nav] renderHome failed:",      e); }
  try { renderSchools();   } catch (e) { console.error("[nav] renderSchools failed:",   e); }
  try { renderInsights();  } catch (e) { console.error("[nav] renderInsights failed:",  e); }
  try { renderBreakdown(); } catch (e) { console.error("[nav] renderBreakdown failed:", e); }
  try { renderExport();    } catch (e) { console.error("[nav] renderExport failed:",    e); }

  // 4. Sync header to initial state
  updateHeader();

  // 5. Hide loader — app is ready
  hideLoader();
}

/* ============================================================
   PUBLIC: refreshAllTabs()
   Called after a filter is applied — re-renders every tab
   with the new getFilteredData() slice.
   ============================================================ */
function refreshAllTabs() {
  updateHeader();
  try { renderHome();      } catch (e) { console.error("[nav] renderHome failed:",      e); }
  try { renderSchools();   } catch (e) { console.error("[nav] renderSchools failed:",   e); }
  try { renderInsights();  } catch (e) { console.error("[nav] renderInsights failed:",  e); }
  try { renderBreakdown(); } catch (e) { console.error("[nav] renderBreakdown failed:", e); }
  // Export tab re-reads filter on each action — no re-render needed
}

/* ============================================================
   BOOT — wire up on DOM ready
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
});
