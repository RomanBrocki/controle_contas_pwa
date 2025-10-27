// src/features/pdf.js
(function () {
  function exportTwoPerPage(canvases, filename = 'graficos.pdf', opts = {}) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return alert('jsPDF não carregado.');
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const margin = opts.margin ?? 28;      // margem externa
    const gap = opts.gap ?? 24;            // espaço entre os 2 gráficos
    const slotH = (pageH - margin * 2 - gap) / 2; // altura para cada gráfico

    canvases.forEach((cv, idx) => {
      if (idx > 0 && idx % 2 === 0) doc.addPage();
      const posInPage = idx % 2; // 0 = topo, 1 = baixo

      // escala para caber no “slot”
      const ratio = cv.width / cv.height;
      let w = pageW - margin * 2;
      let h = w / ratio;
      if (h > slotH) { h = slotH; w = h * ratio; }

      const x = (pageW - w) / 2;
      const yTop = margin;
      const yBottom = margin + slotH + gap;
      const y = posInPage === 0 ? yTop : yBottom;

      const img = cv.toDataURL('image/png', 1.0);
      doc.addImage(img, 'PNG', x, y, w, h);
    });

    doc.save(filename);
  }

  window.PDFHelpers = window.PDFHelpers || {};
  window.PDFHelpers.exportTwoPerPage = exportTwoPerPage;
})();
