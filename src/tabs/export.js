/* ============================================================
   EXPORT.JS — Full export suite
   Fixes: libraries loaded via onload callbacks, not defer
   Exports: All Schools, Below Baseline, Below Target,
            Above Target, Summary by Scope, Insights PDF
   File naming: SEDP_{Scope}_{Type}_{YYYY-MM-DD}.{ext}
   ============================================================ */

let _jspdfReady   = false;
let _jspdfLoading = false;

/* ============================================================
   LIBRARY LOADER — dynamic load so we don't block boot
   ============================================================ */
function _ensureJsPDF(callback) {
  if (window.jspdf && window.jspdf.jsPDF) { callback(); return; }

  if (_jspdfLoading) {
    /* Poll until ready */
    const poll = setInterval(() => {
      if (window.jspdf && window.jspdf.jsPDF) { clearInterval(poll); callback(); }
    }, 100);
    return;
  }

  _jspdfLoading = true;

  const s1 = document.createElement("script");
  s1.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  s1.onload = () => {
    const s2 = document.createElement("script");
    s2.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js";
    s2.onload = () => { _jspdfReady = true; callback(); };
    s2.onerror = () => { alert("Could not load PDF library. Check your internet connection."); };
    document.head.appendChild(s2);
  };
  s1.onerror = () => { alert("Could not load PDF library. Check your internet connection."); };
  document.head.appendChild(s1);
}

/* ============================================================
   FILE NAME HELPER
   ============================================================ */
function _exportFileName(type, ext) {
  const scope    = getScopeLabel().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
  const dateStr  = new Date().toISOString().slice(0, 10);
  return `SEDP_${scope}_${type}_${dateStr}.${ext}`;
}

/* ============================================================
   RENDER — export tab UI
   ============================================================ */
function renderExport() {
  const container = document.getElementById("tab-export");
  if (!container) return;

  const scopeLabel = getScopeLabel();
  const rows       = getFilteredData();
  const stats      = calcStats(rows);
  const achCls     = getAchClass(stats.ach);
  const ntCls      = getAchClass(stats.ntAch);

  const bbCount  = rows.filter(r => r[7] < r[6]).length;
  const btCount  = rows.filter(r => r[7] < r[8] && r[7] >= r[6]).length;
  const atCount  = rows.filter(r => r[7] >= r[8]).length;

  container.innerHTML = `
    <div class="export-content fade-in">

      <!-- Scope summary card -->
      <div class="export-scope-card">
        <div class="export-scope-label">Active Export Scope</div>
        <div class="export-scope-value">${scopeLabel}</div>
        <div class="export-scope-stats">
          <span>${formatNumber(rows.length)} schools</span>
          <span>${formatNumber(stats.cur)} enrolled</span>
          <span class="${achCls}">${stats.ach.toFixed(1)}% Ach</span>
          <span class="${ntCls}">${stats.ntAch.toFixed(1)}% NT Ach</span>
        </div>
      </div>

      <!-- ALL SCHOOLS -->
      <div class="export-section-label">All Schools (${formatNumber(rows.length)})</div>
      <div class="export-btn-row">
        <button class="export-btn half" onclick="exportCSV('all')">
          <div class="export-btn-icon csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">CSV</span><span class="export-btn-desc">All columns</span></div>
        </button>
        <button class="export-btn half" onclick="exportPDF('all')">
          <div class="export-btn-icon pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">PDF</span><span class="export-btn-desc">Formatted table</span></div>
        </button>
      </div>

      <!-- BELOW BASELINE -->
      <div class="export-section-label text-red">Below Baseline (${formatNumber(bbCount)})</div>
      <div class="export-btn-row">
        <button class="export-btn half" onclick="exportCSV('below_baseline')">
          <div class="export-btn-icon csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">CSV</span><span class="export-btn-desc">${formatNumber(bbCount)} schools</span></div>
        </button>
        <button class="export-btn half" onclick="exportPDF('below_baseline')">
          <div class="export-btn-icon pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">PDF</span><span class="export-btn-desc">${formatNumber(bbCount)} schools</span></div>
        </button>
      </div>

      <!-- BELOW TARGET -->
      <div class="export-section-label text-amber">Above Baseline, Below Target (${formatNumber(btCount)})</div>
      <div class="export-btn-row">
        <button class="export-btn half" onclick="exportCSV('above_baseline_below_target')">
          <div class="export-btn-icon csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">CSV</span><span class="export-btn-desc">${formatNumber(btCount)} schools</span></div>
        </button>
        <button class="export-btn half" onclick="exportPDF('above_baseline_below_target')">
          <div class="export-btn-icon pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">PDF</span><span class="export-btn-desc">${formatNumber(btCount)} schools</span></div>
        </button>
      </div>

      <!-- ABOVE TARGET -->
      <div class="export-section-label text-green">Above Target (${formatNumber(atCount)})</div>
      <div class="export-btn-row">
        <button class="export-btn half" onclick="exportCSV('above_target')">
          <div class="export-btn-icon csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">CSV</span><span class="export-btn-desc">${formatNumber(atCount)} schools</span></div>
        </button>
        <button class="export-btn half" onclick="exportPDF('above_target')">
          <div class="export-btn-icon pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">PDF</span><span class="export-btn-desc">${formatNumber(atCount)} schools</span></div>
        </button>
      </div>

      <!-- SCOPE SUMMARY (aggregated) -->
      <div class="export-section-label">Scope Summary (Aggregated)</div>
      <div class="export-btn-row">
        <button class="export-btn half" onclick="exportSummaryCSV()">
          <div class="export-btn-icon csv"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">CSV</span><span class="export-btn-desc">Grouped by region</span></div>
        </button>
        <button class="export-btn half" onclick="exportSummaryPDF()">
          <div class="export-btn-icon pdf"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div><span class="export-btn-title">PDF</span><span class="export-btn-desc">Grouped by region</span></div>
        </button>
      </div>

    </div>
  `;
}

/* ============================================================
   CSV EXPORTS
   ============================================================ */
function exportCSV(filterType) {
  let rows = getFilteredData();

  if      (filterType === "below_baseline")             rows = rows.filter(r => r[7] < r[6]);
  else if (filterType === "above_baseline_below_target") rows = rows.filter(r => r[7] >= r[6] && r[7] < r[8]);
  else if (filterType === "above_target")               rows = rows.filter(r => r[7] >= r[8]);

  const filterLabels = {
    all: "AllSchools",
    below_baseline: "BelowBaseline",
    above_baseline_below_target: "AboveBaseline_BelowTarget",
    above_target: "AboveTarget"
  };

  const header = "Sr.,District,Wing,Tehsil,Markaz,EMIS,School Name,Baseline,Current,Daily Delta,Target,Ach%,New Target,NT Ach%\n";
  const body   = rows.map((r, i) => {
    const ach   = r[8]  ? ((r[7]/r[8])*100).toFixed(2)         : "0";
    const ntAch = r[10] ? (((r[7]-r[6])/r[10])*100).toFixed(2) : "0";
    const delta = r[7] - r[9];
    return `${i+1},"${r[0]}","${r[3]}","${r[1]}","${r[2]}","${r[4]}","${r[5].replace(/"/g,'""')}",${r[6]},${r[7]},${delta >= 0 ? "+"+delta : delta},${r[8]},${ach}%,${r[10]},${ntAch}%`;
  }).join("\n");

  _downloadCSV(header + body, _exportFileName(filterLabels[filterType] || filterType, "csv"));
}

function exportSummaryCSV() {
  const rows    = getFilteredData();
  const level   = getScopeLevel();
  const colIdx  = level === 0 ? 0 : level === 1 ? 3 : level === 2 ? 1 : 2;
  const groups  = aggregateBy(rows, colIdx).sort((a, b) => a.ntAch - b.ntAch);
  const levelNames = ["District","Wing","Tehsil","Markaz"];
  const levelName  = levelNames[Math.min(level, 3)];

  const header = `Sr.,${levelName},Schools,Baseline,Current,Daily Delta,Target,Ach%,New Target,NT Ach%\n`;
  const body   = groups.map((g, i) =>
    `${i+1},"${g.name}",${g.count},${g.bas},${g.cur},${g.delta >= 0 ? "+"+g.delta : g.delta},${g.tar},${g.ach.toFixed(2)}%,${g.nt},${g.ntAch.toFixed(2)}%`
  ).join("\n");

  _downloadCSV(header + body, _exportFileName("Summary_by_" + levelName, "csv"));
}

function _downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ============================================================
   PDF EXPORTS
   ============================================================ */
function exportPDF(filterType) {
  _ensureJsPDF(() => {
    const { jsPDF } = window.jspdf;
    let rows = getFilteredData();

    const filterLabels = {
      all: "All Schools",
      below_baseline: "Below Baseline",
      above_baseline_below_target: "Above Baseline, Below Target",
      above_target: "Above Target"
    };
    const filterFileLabels = {
      all: "AllSchools",
      below_baseline: "BelowBaseline",
      above_baseline_below_target: "AboveBaseline_BelowTarget",
      above_target: "AboveTarget"
    };

    if      (filterType === "below_baseline")              rows = rows.filter(r => r[7] < r[6]);
    else if (filterType === "above_baseline_below_target") rows = rows.filter(r => r[7] >= r[6] && r[7] < r[8]);
    else if (filterType === "above_target")                rows = rows.filter(r => r[7] >= r[8]);

    const doc        = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const scopeLabel = getScopeLabel();
    const stats      = calcStats(rows);

    /* Header */
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 297, 18, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("SED Punjab Enrollment Report", 10, 8);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Scope: ${scopeLabel}  |  Filter: ${filterLabels[filterType]}  |  Schools: ${rows.length}  |  NT Ach: ${stats.ntAch.toFixed(1)}%  |  ${new Date().toLocaleString("en-PK")}`, 10, 14);

    const body = rows.map((r, i) => {
      const ach   = r[8]  ? ((r[7]/r[8])*100).toFixed(1) + "%" : "—";
      const ntAch = r[10] ? (((r[7]-r[6])/r[10])*100).toFixed(1) + "%" : "—";
      const delta = r[7] - r[9];
      return [i+1, r[4], r[5], r[1], r[2], r[6].toLocaleString(), r[7].toLocaleString(), (delta >= 0 ? "+" : "") + delta, r[8].toLocaleString(), ach, r[10].toLocaleString(), ntAch];
    });

    doc.autoTable({
      startY: 21,
      head: [["#","EMIS","School","Tehsil","Markaz","Base","Current","Δ","Target","Ach%","New Tgt","NT Ach%"]],
      body,
      theme: "striped",
      headStyles: { fillColor: [30, 64, 175], fontSize: 6.5, fontStyle: "bold", textColor: 255 },
      styles: { fontSize: 6, cellPadding: 1.5, overflow: "ellipsize" },
      columnStyles: {
        0: { cellWidth: 7, halign: "center" },
        1: { cellWidth: 18 },
        2: { cellWidth: 55 },
        5: { halign: "right" }, 6: { halign: "right" }, 7: { halign: "center" },
        8: { halign: "right" }, 9: { halign: "center", fontStyle: "bold" },
        10: { halign: "right" }, 11: { halign: "center", fontStyle: "bold" }
      },
      didParseCell(data) {
        if (data.section !== "body") return;
        /* Color Ach% col */
        if (data.column.index === 9) {
          const v = parseFloat(data.cell.raw);
          data.cell.styles.textColor = v < 80 ? [220,53,69] : v < 90 ? [217,119,6] : [22,163,74];
        }
        /* Color NT Ach% col */
        if (data.column.index === 11) {
          const v = parseFloat(data.cell.raw);
          data.cell.styles.textColor = v < 80 ? [220,53,69] : v < 90 ? [217,119,6] : [22,163,74];
        }
        /* Color delta col */
        if (data.column.index === 7) {
          const v = parseInt(data.cell.raw);
          data.cell.styles.textColor = v > 0 ? [22,163,74] : v < 0 ? [220,53,69] : [100,116,139];
        }
      }
    });

    doc.save(_exportFileName(filterFileLabels[filterType] || filterType, "pdf"));
  });
}

function exportSummaryPDF() {
  _ensureJsPDF(() => {
    const { jsPDF } = window.jspdf;
    const rows    = getFilteredData();
    const level   = getScopeLevel();
    const colIdx  = level === 0 ? 0 : level === 1 ? 3 : level === 2 ? 1 : 2;
    const groups  = aggregateBy(rows, colIdx).sort((a, b) => a.ntAch - b.ntAch);
    const levelNames = ["District","Wing","Tehsil","Markaz"];
    const levelName  = levelNames[Math.min(level, 3)];
    const scopeLabel = getScopeLabel();
    const stats      = calcStats(rows);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 18, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`${scopeLabel} — ${levelName} Summary`, 10, 8);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Schools: ${rows.length}  |  Current: ${stats.cur.toLocaleString()}  |  NT Ach: ${stats.ntAch.toFixed(1)}%  |  ${new Date().toLocaleString("en-PK")}`, 10, 14);

    const body = groups.map((g, i) => [
      i+1, g.name, g.count, g.bas.toLocaleString(), g.cur.toLocaleString(),
      (g.delta >= 0 ? "+" : "") + g.delta, g.tar.toLocaleString(),
      g.ach.toFixed(1) + "%", g.nt.toLocaleString(), g.ntAch.toFixed(1) + "%"
    ]);

    doc.autoTable({
      startY: 21,
      head: [["#", levelName, "Schools", "Baseline", "Current", "Δ", "Target", "Ach%", "New Tgt", "NT Ach%"]],
      body,
      theme: "striped",
      headStyles: { fillColor: [30, 64, 175], fontSize: 8, fontStyle: "bold", textColor: 255 },
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "center" },
        6: { halign: "right" }, 7: { halign: "center", fontStyle: "bold" },
        8: { halign: "right" }, 9: { halign: "center", fontStyle: "bold" }
      },
      didParseCell(data) {
        if (data.section !== "body") return;
        if (data.column.index === 7) {
          const v = parseFloat(data.cell.raw);
          data.cell.styles.textColor = v < 80 ? [220,53,69] : v < 90 ? [217,119,6] : [22,163,74];
        }
        if (data.column.index === 9) {
          const v = parseFloat(data.cell.raw);
          data.cell.styles.textColor = v < 80 ? [220,53,69] : v < 90 ? [217,119,6] : [22,163,74];
        }
        if (data.column.index === 5) {
          const v = parseInt(data.cell.raw);
          data.cell.styles.textColor = v > 0 ? [22,163,74] : v < 0 ? [220,53,69] : [100,116,139];
        }
      }
    });

    doc.save(_exportFileName("Summary_by_" + levelName, "pdf"));
  });
}

/* Legacy names used by old code — point to new functions */
function triggerSchoolPDFReportDownload() { exportPDF("all"); }
function triggerSchoolCSVReportDownload() { exportCSV("all"); }
