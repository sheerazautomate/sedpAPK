/* ============================================================
   FILTER-DRAWER.JS — Bottom Sheet Filter Component
   Owns:
     - initFilterDrawer()      — populates District dropdown
     - openFilterDrawer()      — slides drawer up
     - closeFilterDrawer()     — slides drawer down
     - resetFilterDrawer()     — clears all selections
     - applyFilterDrawer()     — commits filter + refreshes all tabs
     - onDrawerDistrictChange()
     - onDrawerWingChange()
     - onDrawerTehsilChange()

   Reads:  APP_HIERARCHY (built by fetch-data.js)
   Writes: APP_FILTER    (read by all tabs via getFilteredData())
   ============================================================ */

/* ── Internal state: what's selected inside the drawer
      (not yet committed — only committed on "Apply") ── */
let _draft = { district: "", wing: "", tehsil: "", markaz: "" };

/* ── Touch drag-to-dismiss state ── */
let _dragStartY   = 0;
let _dragging     = false;

/* ============================================================
   PUBLIC: initFilterDrawer()
   Populates the District dropdown from APP_HIERARCHY.
   Called once after initData() completes.
   ============================================================ */
function initFilterDrawer() {
  _populateDistricts();
  _syncDraftFromFilter();   // if APP_FILTER has values, reflect them
  _attachDragDismiss();
}

/* ============================================================
   PUBLIC: openFilterDrawer()
   ============================================================ */
function openFilterDrawer() {
  _syncDraftFromFilter();   // always open with current committed state
  _refreshDrawerSelects();

  document.getElementById("drawer-overlay").classList.add("open");
  document.getElementById("filter-drawer").classList.add("open");
  document.body.style.overflow = "hidden"; // prevent background scroll
}

/* ============================================================
   PUBLIC: closeFilterDrawer()
   ============================================================ */
function closeFilterDrawer() {
  document.getElementById("drawer-overlay").classList.remove("open");
  document.getElementById("filter-drawer").classList.remove("open");
  document.body.style.overflow = "";
}

/* ============================================================
   PUBLIC: resetFilterDrawer()
   Clears draft AND committed filter, refreshes all tabs.
   ============================================================ */
function resetFilterDrawer() {
  _draft = { district: "", wing: "", tehsil: "", markaz: "" };
  APP_FILTER = { district: "", wing: "", tehsil: "", markaz: "" };
  _refreshDrawerSelects();
  _resetCascadeState();
  closeFilterDrawer();
  refreshAllTabs();
}

/* ============================================================
   PUBLIC: applyFilterDrawer()
   Commits _draft → APP_FILTER, closes drawer, refreshes tabs.
   ============================================================ */
function applyFilterDrawer() {
  APP_FILTER = { ..._draft };
  closeFilterDrawer();
  refreshAllTabs();
}

/* ============================================================
   CASCADE HANDLERS — called by onchange in index.html
   ============================================================ */
function onDrawerDistrictChange() {
  _draft.district = document.getElementById("drawer-district").value;
  _draft.wing     = "";
  _draft.tehsil   = "";
  _draft.markaz   = "";
  _populateWings();
  _clearSelect("drawer-tehsil", "All Tehsils", true);
  _clearSelect("drawer-markaz", "All Markaz",  true);
}

function onDrawerWingChange() {
  _draft.wing    = document.getElementById("drawer-wing").value;
  _draft.tehsil  = "";
  _draft.markaz  = "";
  _populateTehsils();
  _clearSelect("drawer-markaz", "All Markaz", true);
}

function onDrawerTehsilChange() {
  _draft.tehsil = document.getElementById("drawer-tehsil").value;
  _draft.markaz = "";
  _populateMarkaz();
}

/* ============================================================
   PRIVATE HELPERS
   ============================================================ */

function _populateDistricts() {
  const sel = document.getElementById("drawer-district");
  _clearSelect("drawer-district", "All Districts", false);
  const districts = Object.keys(APP_HIERARCHY).sort();
  districts.forEach(d => sel.appendChild(_opt(d, d)));
}

function _populateWings() {
  const sel = document.getElementById("drawer-wing");
  _clearSelect("drawer-wing", "All Wings", false);

  if (!_draft.district) {
    sel.disabled = true;
    return;
  }

  const wings = Object.keys(APP_HIERARCHY[_draft.district] || {}).sort();
  wings.forEach(w => sel.appendChild(_opt(w, w)));
  sel.disabled = wings.length === 0;
}

function _populateTehsils() {
  const sel = document.getElementById("drawer-tehsil");
  _clearSelect("drawer-tehsil", "All Tehsils", false);

  if (!_draft.district || !_draft.wing) {
    sel.disabled = true;
    return;
  }

  const tehsils = Object.keys(
    (APP_HIERARCHY[_draft.district] || {})[_draft.wing] || {}
  ).sort();

  tehsils.forEach(t => sel.appendChild(_opt(t, t)));
  sel.disabled = tehsils.length === 0;
}

function _populateMarkaz() {
  const sel = document.getElementById("drawer-markaz");
  _clearSelect("drawer-markaz", "All Markaz", false);

  if (!_draft.district || !_draft.wing || !_draft.tehsil) {
    sel.disabled = true;
    return;
  }

  const markazList = (
    ((APP_HIERARCHY[_draft.district] || {})[_draft.wing] || {})[_draft.tehsil] || []
  );

  markazList.forEach(m => sel.appendChild(_opt(m, m)));
  sel.disabled = markazList.length === 0;
}

/* Sync draft object → select element values (used when opening drawer) */
function _refreshDrawerSelects() {
  const d = document.getElementById("drawer-district");
  const w = document.getElementById("drawer-wing");
  const t = document.getElementById("drawer-tehsil");
  const m = document.getElementById("drawer-markaz");

  // Repopulate cascades in order based on draft
  _populateDistricts();
  d.value = _draft.district || "";

  if (_draft.district) {
    _populateWings();
    w.value = _draft.wing || "";
    w.disabled = false;
  } else {
    _clearSelect("drawer-wing",   "All Wings",   true);
    _clearSelect("drawer-tehsil", "All Tehsils", true);
    _clearSelect("drawer-markaz", "All Markaz",  true);
    return;
  }

  if (_draft.wing) {
    _populateTehsils();
    t.value = _draft.tehsil || "";
    t.disabled = false;
  } else {
    _clearSelect("drawer-tehsil", "All Tehsils", true);
    _clearSelect("drawer-markaz", "All Markaz",  true);
    return;
  }

  if (_draft.tehsil) {
    _populateMarkaz();
    m.value = _draft.markaz || "";
    m.disabled = false;
  } else {
    _clearSelect("drawer-markaz", "All Markaz", true);
  }
}

/* Copy committed APP_FILTER into _draft */
function _syncDraftFromFilter() {
  _draft = { ...APP_FILTER };
}

/* Reset Wing/Tehsil/Markaz selects to disabled empty state */
function _resetCascadeState() {
  _populateDistricts();
  _clearSelect("drawer-wing",   "All Wings",   true);
  _clearSelect("drawer-tehsil", "All Tehsils", true);
  _clearSelect("drawer-markaz", "All Markaz",  true);
}

/* Clear a select to a single placeholder option */
function _clearSelect(id, placeholder, disable) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = "";
  sel.appendChild(_opt("", placeholder));
  sel.value    = "";
  sel.disabled = disable;
}

/* Create an <option> element */
function _opt(value, label) {
  const o = document.createElement("option");
  o.value       = value;
  o.textContent = label;
  return o;
}

/* ============================================================
   DRAG-TO-DISMISS
   User can swipe the drawer down to close it.
   ============================================================ */
function _attachDragDismiss() {
  const drawer = document.getElementById("filter-drawer");
  const handle = drawer.querySelector(".drawer-handle");

  // Touch events on handle + drawer header
  const dragTarget = drawer.querySelector(".drawer-header");

  [handle, dragTarget].forEach(el => {
    if (!el) return;

    el.addEventListener("touchstart", e => {
      _dragStartY = e.touches[0].clientY;
      _dragging   = true;
      drawer.style.transition = "none";
    }, { passive: true });

    el.addEventListener("touchmove", e => {
      if (!_dragging) return;
      const dy = e.touches[0].clientY - _dragStartY;
      if (dy > 0) {
        drawer.style.transform = `translateY(${dy}px)`;
      }
    }, { passive: true });

    el.addEventListener("touchend", e => {
      if (!_dragging) return;
      _dragging = false;
      drawer.style.transition = "";
      drawer.style.transform  = "";

      const dy = e.changedTouches[0].clientY - _dragStartY;
      if (dy > 80) {
        closeFilterDrawer();
      }
    });
  });
}
