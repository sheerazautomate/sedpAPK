/* ============================================================
   EXPORT.JS — Report Generation & Download Management
   ============================================================ */

function renderExport() {
  const container = document.getElementById("tab-export");
  if (!container) return;

  const currentScopeLabel = getScopeLabel();

  container.innerHTML = `
    <div class="export-tab-panel" style="padding: 20px 16px;">
      
      <div class="export-hero-card" style="background: linear-gradient(135deg, #1a56db, #1c64f2); color: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Active Filter Profile Target</div>
        <div style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">${currentScopeLabel}</div>
        <div style="font-size: 12px; opacity: 0.8;">Reports generated will be automatically sliced to match this operational bounding box framework.</div>
      </div>

      <div class="section-title-embedded">Available Formats</div>

      <div class="export-actions-list" style="display: flex; flex-direction: column; gap: 12px;">
        
        <button class="btn btn-primary" onclick="triggerSchoolPDFReportDownload()" style="width:100%; display: flex; justify-content: center; align-items: center; gap: 8px; padding: 14px; font-weight:600;">
          <svg style="width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Export Summary PDF Document
        </button>

        <button class="btn btn-ghost" onclick="triggerSchoolCSVReportDownload()" style="width:100%; display: flex; justify-content: center; align-items: center; gap: 8px; padding: 14px; border: 1.5px solid var(--border-color); color: var(--text-main); font-weight:600;">
          <svg style="width:20px; height:20px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Export Raw Dataset Ledger (CSV)
        </button>

      </div>
    </div>
  `;
}

/* ── HIGH PERFORMANCE REPORT EXPORT ENGINE WRAPPERS ── */

function triggerSchoolPDFReportDownload() {
  try {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
      alert("PDF library dependencies are still loading. Please retry in a moment.");
      return;
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const rows = getFilteredData();
    const scopeLabel = getScopeLabel();

    // Add explicit text headers safely
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Punjab School Enrollment Performance Report", 14, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Scope Level Focus: ${scopeLabel} | Data Record Units Count: ${rows.length}`, 14, 21);
    doc.text(`Report Generation Date: ${new Date().toLocaleDateString("en-PK")} ${new Date().toLocaleTimeString("en-PK")}`, 14, 26);

    // Transform row metrics arrays into a structured table grid layout data map string format
    const tableBodyDataMatrix = rows.map(r => {
      const achValue = r[8] ? ((r[7] / r[8]) * 100).toFixed(1) + "%" : "0.0%";
      return [r[4], r[5], r[1], r[2], r[6], r[7], r[8], achValue];
    });

    // Invoke automated layout script hooks dynamically
    doc.autoTable({
      startY: 32,
      head: [['EMIS', 'School Name', 'Tehsil', 'Markaz', 'Base', 'Current', 'Target', 'Ach%']],
      body: tableBodyDataMatrix,
      theme: 'striped',
      headStyles: { fillColor: [26, 86, 219], fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 1: { cellWidth: 50 } } // Allocate wider tracking boundary space dynamically for long string variables safely
    });

    // Execute save operation directly onto local physical window filesystem standard sandbox contexts safely
    doc.save(`SEDP_Enrollment_Report_${scopeLabel.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error("PDF engine crash context:", error);
    alert("Failed to build PDF binary payload.");
  }
}

function triggerSchoolCSVReportDownload() {
  const rows = getFilteredData();
  const scopeLabel = getScopeLabel();
  
  if (rows.length === 0) {
    alert("No active data entities are in line for formatting extraction.");
    return;
  }

  // Construct structured rows securely matching explicit escaping formats standard boundaries safely
  let rawCsvOutputBufferStr = "EMIS,School Name,District,Tehsil,Markaz,Wing,Baseline,Current Enrollment,Target,Yesterday\n";
  
  rows.forEach(r => {
    // Escape quote anomalies explicitly
    const escapedSchoolName = `"${r[5].replace(/"/g, '""')}"`;
    rawCsvOutputBufferStr += `${r[4]},${escapedSchoolName},${r[0]},${r[1]},${r[2]},${r[3]},${r[6]},${r[7]},${r[8]},${r[9]}\n`;
  });

  // Package into file blobs directly within standard client engine protocols smoothly
  const genericBlobFileHost = new Blob([rawCsvOutputBufferStr], { type: 'text/csv;charset=utf-8;' });
  const downloadLinkAnchorHook = document.createElement("a");
  
  downloadLinkAnchorHook.href = URL.createObjectURL(genericBlobFileHost);
  downloadLinkAnchorHook.setAttribute("download", `SEDP_Data_Ledger_${scopeLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(downloadLinkAnchorHook);
  downloadLinkAnchorHook.click();
  document.body.removeChild(downloadLinkAnchorHook);
}
