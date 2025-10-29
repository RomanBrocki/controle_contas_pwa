// src/features/pdf.js
(function () {
  function exportTwoPerPage(canvases, filename = 'graficos.pdf', opts = {}) {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return alert('jsPDF não carregado.');
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const margin = opts.margin ?? 28;
    const gap    = opts.gap ?? 24;
    const slotH  = (pageH - margin * 2 - gap) / 2; // altura de cada "slot" por página

    canvases.forEach((cv, idx) => {
      if (idx > 0 && idx % 2 === 0) doc.addPage();
      const posInPage = idx % 2; // 0 = topo, 1 = baixo

      // escala para caber no slot
      const ratio = cv.width / cv.height;
      let w = pageW - margin * 2;
      let h = w / ratio;
      if (h > slotH) { h = slotH; w = h * ratio; }

      const x = (pageW - w) / 2;
      const yTop = margin;
      const yBottom = margin + slotH + gap;
      const y = posInPage === 0 ? yTop : yBottom;

      // 1) desenha imagem do canvas
      const img = cv.toDataURL('image/png', 1.0);
      doc.addImage(img, 'PNG', x, y, w, h);

      // 2) adiciona links clicáveis (se houver metadados)
      // Esperado: cv._pdfLinks = [{ url, x, y, w, h }] em coordenadas do CANVAS (px)
      // Converte px -> pontos da página, alinhado ao deslocamento/escala
      const links = Array.isArray(cv._pdfLinks) ? cv._pdfLinks : [];
      if (links.length) {
        const scaleX = w / cv.width;
        const scaleY = h / cv.height;
        links.forEach(L => {
          if (!L?.url) return;
          const lx = x + (L.x || 0) * scaleX;
          const ly = y + (L.y || 0) * scaleY;
          const lw = (L.w || 0) * scaleX;
          const lh = (L.h || 0) * scaleY;
          // jsPDF 2.x: link(x, y, w, h, { url })
          doc.link(lx, ly, lw || 1, lh || 12, { url: L.url });
        });
      }
    });

    doc.save(filename);
  }

  window.PDFHelpers = window.PDFHelpers || {};
  window.PDFHelpers.exportTwoPerPage = exportTwoPerPage;
})();

