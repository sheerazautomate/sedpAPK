/* ============================================================
   EXPORT.JS — Report Generation
   ============================================================ */

function renderExport() {
  const container = document.getElementById("tab-export");
  if (!container) return;

  const scopeLabel = getScopeLabel();
  const rows       = getFilteredData();
  const stats      = calcStats(rows);

  container.innerHTML = `
    <div class="export-content fade-in">

      <div class="export-scope-card">
        <div class="export-scope-label">Active Scope</div>
        <div class="export-scope-value">${scopeLabel}</div>
        <div class="export-scope-meta">${formatNumber(rows.length)} schools · ${formatNumber(stats.cur)} enrolled · ${stats.ach.toFixed(1)}% achieved</div>
      </div>

      <div class="section-header">Available Formats</div>

      <button class="export-btn" onclick="triggerSchoolPDFReportDownload()">
        <div class="export-btn-icon pdf">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div>
          <span class="export-btn-title">Export Summary PDF</span>
          <span class="export-btn-desc">Formatted school-level report, printer-ready</span>
        </div>
      </button>

      <button class="export-btn" onclick="triggerSchoolCSVReportDownload()">
        <div class="export-btn-icon csv">
          <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
        </div>
        <div>
          <span class="export-btn-title">Export Raw Data (CSV)</span>
          <span class="export-btn-desc">All ${formatNumber(rows.length)} schools · open in Excel/Sheets</span>
        </div>
      </button>

    </div>
  `;
}

function triggerSchoolPDFReportDownload() {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert("PDF library still loading. Please retry."); return; }

    const doc        = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const rows       = getFilteredData();
    const scopeLabel = getScopeLabel();

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(15);
    doc.text("Punjab School Enrollment Report", 14, 15);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Scope: ${scopeLabel}  |  Schools: ${rows.length}  |  Generated: ${new Date().toLocaleString("en-PK")}`, 14, 21);

    const body = rows.map(r => {
      const ach = r[8] ? ((r[7]/r[8])*100).toFixed(1) + "%" : "—";
      const ntAch = r[10] ? (((r[7]-r[6])/r[10])*100).toFixed(1) + "%" : "—";
      const delta = r[7] - r[9];
      return [r[4], r[5], r[1], r[2], r[6], r[7], r[8], ach, (delta >= 0 ? "+" : "") + delta, ntAch];
    });

    doc.autoTable({
      startY: 26,
      head: [["EMIS","School","Tehsil","Markaz","Baseline","Current","Target","Ach%","Daily Δ","NT Ach%"]],
      body,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235], fontSize: 8, fontStyle: "bold" },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: { 1: { cellWidth: 45 } }
    });

    doc.save(`SEDP_Report_${scopeLabel.replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
  } catch (e) {
    console.error("[export] PDF error:", e);
    alert("PDF generation failed: " + e.message);
  }
}

function triggerSchoolCSVReportDownload() {
  const rows       = getFilteredData();
  const scopeLabel = getScopeLabel();

  const header = ["EMIS","School Name","District","Tehsil","Markaz","Wing","Baseline","Current","Target","Ach%","Yesterday","Daily Delta","New Target","NT Ach%"];

  const csvRows = rows.map(r => {
    const ach   = r[8] ? ((r[7]/r[8])*100).toFixed(2) : "0";
    const ntAch = r[10] ? (((r[7]-r[6])/r[10])*100).toFixed(2) : "0";
    const delta = r[7] - r[9];
    return [r[4], `"${r[5].replace(/"/g,'""')}"`, r[0], r[1], r[2], r[3], r[6], r[7], r[8], ach, r[9], delta, r[10], ntAch];
  });

  const csvContent = [header, ...csvRows].map(row => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `SEDP_Data_${scopeLabel.replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
