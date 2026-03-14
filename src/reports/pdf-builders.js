(function attachReportsPdfBuilders(globalObject) {
  const {
    monthNamePT,
    makeMonthsList,
    parseBRLnum,
    normalizeContaName,
  } = globalObject.ReportsHelpers;

  const {
    createOffscreenHost,
    addCanvas,
    forceWhiteBackground,
    flushRender,
  } = globalObject.ReportsDom;

  const {
    renderPizzaMensalStrict,
    renderBarrasMensalLocal,
    renderLinhaPeriodoLocal,
  } = globalObject.ReportsRenderers;

  function getJsPdf() {
    return globalObject.jspdf?.jsPDF || null;
  }

  function fetchMes(year, month) {
    return globalObject.DataAdapter.fetchMes(year, month);
  }

  function buildPageBreakMarker() {
    return { _forcePageBreak: true };
  }

  function appendCanvasesToDocument(doc, canvases, options = {}) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = options.margin ?? 28;
    const gap = options.gap ?? 24;
    const slotHeight = (pageHeight - margin * 2 - gap) / 2;

    let slotIndex = 0;

    canvases.forEach((canvas) => {
      if (canvas?._forcePageBreak) {
        if (slotIndex > 0) {
          doc.addPage();
          slotIndex = 0;
        }
        return;
      }

      if (!canvas?.toDataURL) return;

      if (slotIndex === 2) {
        doc.addPage();
        slotIndex = 0;
      }

      const ratio = canvas.width / canvas.height;
      let width = pageWidth - margin * 2;
      let height = width / ratio;
      if (height > slotHeight) {
        height = slotHeight;
        width = height * ratio;
      }

      const x = (pageWidth - width) / 2;
      const y = slotIndex === 0 ? margin : (margin + slotHeight + gap);
      const image = canvas.toDataURL('image/jpeg', 0.75);
      doc.addImage(image, 'JPEG', x, y, width, height);

      const links = Array.isArray(canvas._pdfLinks) ? canvas._pdfLinks : [];
      if (links.length) {
        const scaleX = width / canvas.width;
        const scaleY = height / canvas.height;
        links.forEach((link) => {
          if (!link?.url) return;
          doc.link(
            x + (link.x || 0) * scaleX,
            y + (link.y || 0) * scaleY,
            (link.w || 0) * scaleX || 1,
            (link.h || 0) * scaleY || 12,
            { url: link.url }
          );
        });
      }

      slotIndex += 1;
    });
  }

  function buildMonthlySummaryStats(items) {
    const totalMes = items.reduce((accumulator, item) => accumulator + parseBRLnum(item.valor), 0);
    let totalDividida = 0;
    const porPagadorGeral = new Map();
    const porPagadorDivididaMap = new Map();

    items.forEach((item) => {
      const value = parseBRLnum(item.valor);
      const payer = item.quem || '—';

      porPagadorGeral.set(payer, (porPagadorGeral.get(payer) || 0) + value);

      if (item.dividida) {
        totalDividida += value;
        porPagadorDivididaMap.set(payer, (porPagadorDivididaMap.get(payer) || 0) + value);
      }
    });

    const porPagador = Array.from(porPagadorGeral.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    const porPagadorDividida = Array.from(porPagadorDivididaMap.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    let deltaTexto = 'Acerto não calculado porque há número diferente de 2 pagadores.';
    if (porPagadorDividida.length === 0) {
      deltaTexto = 'Sem contas divididas neste mês.';
    } else {
      const pagadores = porPagador.map((payer) => payer.nome);
      const porPagadorDivididaFull = pagadores.map((nome) => {
        const current = porPagadorDividida.find((payer) => payer.nome === nome);
        return { nome, valor: current ? current.valor : 0 };
      });

      if (porPagadorDivididaFull.length === 2) {
        const quota = totalDividida / 2;
        const [payerA, payerB] = porPagadorDivididaFull;
        const excessoA = payerA.valor - quota;
        const excessoB = payerB.valor - quota;

        if (excessoA > 0.009) {
          deltaTexto = `${payerB.nome} deve R$ ${excessoA.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })} para ${payerA.nome}`;
        } else if (excessoB > 0.009) {
          deltaTexto = `${payerA.nome} deve R$ ${excessoB.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
          })} para ${payerB.nome}`;
        } else {
          deltaTexto = 'Valores de divididas já estão equilibrados.';
        }
      } else if (porPagadorDivididaFull.length === 1) {
        deltaTexto = 'Apenas 1 pagador com contas divididas.';
      }
    }

    return {
      totalMes,
      totalDividida,
      porPagador,
      porPagadorDividida,
      deltaTexto,
    };
  }

  function buildMonthlySummaryCanvas(host, payload) {
    const pageWidth = 1100;
    const cardWidth = 760;
    const hasDividedLine = payload.porPagadorDividida.length > 0;
    const height = hasDividedLine ? 280 : 240;

    const wrap = document.createElement('div');
    wrap.style.width = `${pageWidth}px`;
    wrap.style.height = `${height}px`;

    const canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = height;
    wrap.appendChild(canvas);
    host.appendChild(wrap);

    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageWidth, height);

    const xCard = (pageWidth - cardWidth) / 2;
    const yCard = 20;
    const radius = 14;

    context.fillStyle = '#ffffff';
    context.strokeStyle = '#d1d5db';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(xCard + radius, yCard);
    context.lineTo(xCard + cardWidth - radius, yCard);
    context.quadraticCurveTo(xCard + cardWidth, yCard, xCard + cardWidth, yCard + radius);
    context.lineTo(xCard + cardWidth, yCard + height - 40 - radius);
    context.quadraticCurveTo(xCard + cardWidth, yCard + height - 40, xCard + cardWidth - radius, yCard + height - 40);
    context.lineTo(xCard + radius, yCard + height - 40);
    context.quadraticCurveTo(xCard, yCard + height - 40, xCard, yCard + height - 40 - radius);
    context.lineTo(xCard, yCard + radius);
    context.quadraticCurveTo(xCard, yCard, xCard + radius, yCard);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = '#111827';
    context.font = 'bold 20px Inter, Arial, sans-serif';
    context.textAlign = 'left';
    context.fillText(`Resumo de ${payload.rotMes}`, xCard + 20, yCard + 34);

    context.font = '14px Inter, Arial, sans-serif';
    const linhaPorPagadorGeral = `Por pagador (total): ${payload.porPagador
      .map((payer) => `${payer.nome}: R$ ${payer.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .join(' | ')}`;

    const linhaPorPagadorDividida = payload.porPagadorDividida.length > 0
      ? `Por pagador (divididas): ${payload.porPagadorDividida
          .map((payer) => `${payer.nome}: R$ ${payer.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          .join(' | ')}`
      : null;

    const lines = [
      `Total gasto no mês: R$ ${payload.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `Total em contas DIVIDIDAS: R$ ${payload.totalDividida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      linhaPorPagadorGeral,
      ...(linhaPorPagadorDividida ? [linhaPorPagadorDividida] : []),
      `Acerto: ${payload.deltaTexto}`,
    ];

    function drawWrappedText(text, x, y, maxWidth, lineHeight) {
      const words = text.split(' ');
      let line = '';

      for (let index = 0; index < words.length; index += 1) {
        const testLine = `${line}${words[index]} `;
        const metrics = context.measureText(testLine);
        if (metrics.width > maxWidth && index > 0) {
          context.fillText(line, x, y);
          line = `${words[index]} `;
          y += lineHeight;
        } else {
          line = testLine;
        }
      }

      context.fillText(line, x, y);
      return y + lineHeight;
    }

    let textY = yCard + 70;
    lines.forEach((line) => {
      textY = drawWrappedText(line, xCard + 20, textY, cardWidth - 40, 24);
    });

    return canvas;
  }

  function buildMonthlyAccountComparison(itemsMes, itemsAnt, itemsAnoAnt, chartAccounts) {
    const contasAll = Array.from(new Set(itemsMes.map((item) => item.nome)))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const valoresAll = contasAll.map((conta) =>
      itemsMes
        .filter((item) => item.nome === conta)
        .reduce((accumulator, item) => accumulator + parseBRLnum(item.valor), 0)
    );
    const contasBarras = chartAccounts?.length ? chartAccounts : contasAll;
    const sumByConta = (items, contasSel) =>
      contasSel.map((conta) =>
        items
          .filter((item) => item.nome === conta)
          .reduce((accumulator, item) => accumulator + parseBRLnum(item.valor), 0)
      );

    return {
      contasAll,
      valoresAll,
      contasBarras,
      curVals: sumByConta(itemsMes, contasBarras),
      antVals: sumByConta(itemsAnt, contasBarras),
      anoAntVals: sumByConta(itemsAnoAnt, contasBarras),
    };
  }

  function appendMonthlyListingPages(doc, { year, month, rotMes, items }) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 28;
    const column = {
      nome: { x: margin, w: 240 },
      valor: { x: margin + 246, w: 70, align: 'right' },
      dividida: { x: margin + 322, w: 60 },
      boleto: { x: margin + 378, w: 90 },
      comprovante: { x: margin + 474, w: 90 },
    };
    const headerHeight = 30;
    const lineHeight = 18;
    const startY = margin + headerHeight + 12;
    const maxRows = Math.floor((pageHeight - startY - margin) / lineHeight);

    const byPayer = {};
    items.forEach((item) => {
      const payer = item.quem || '—';
      if (!byPayer[payer]) byPayer[payer] = [];
      byPayer[payer].push(item);
    });

    const payers = Object.keys(byPayer).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    doc.addPage();
    let currentY = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Contas pagas — ${rotMes}`, margin, currentY);
    currentY += 20;

    function printHeader() {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('', column.nome.x, currentY);
      doc.text('Valor', column.valor.x + column.valor.w, currentY, { align: 'right' });
      doc.text('Dividida', column.dividida.x, currentY);
      doc.text('Boleto', column.boleto.x, currentY);
      doc.text('Comprovante', column.comprovante.x, currentY);
      currentY += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
    }

    let rowsOnPage = 0;
    printHeader();

    payers.forEach((payer) => {
      if (rowsOnPage + 2 > maxRows) {
        doc.addPage();
        currentY = margin;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`Contas pagas — ${rotMes}`, margin, currentY);
        currentY += 20;
        printHeader();
        rowsOnPage = 0;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Quem pagou: ${payer}`, margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      currentY += lineHeight;
      rowsOnPage += 1;

      const rows = byPayer[payer].sort((a, b) =>
        `${a.nome}${a.instancia || ''}`.localeCompare(`${b.nome}${b.instancia || ''}`, 'pt-BR')
      );

      rows.forEach((item) => {
        if (rowsOnPage >= maxRows) {
          doc.addPage();
          currentY = margin;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.text(`Contas pagas — ${rotMes}`, margin, currentY);
          currentY += 20;
          printHeader();
          rowsOnPage = 0;
        }

        const nomeInstancia = item.instancia ? `${item.nome} (${item.instancia})` : item.nome;
        doc.text(String(nomeInstancia), column.nome.x, currentY, { maxWidth: column.nome.w });

        const valorText = `R$ ${parseBRLnum(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        doc.text(valorText, column.valor.x + column.valor.w, currentY, { align: 'right' });
        doc.text(item.dividida ? 'Sim' : 'Não', column.dividida.x, currentY);

        doc.setTextColor(0, 102, 204);
        if (item.links?.boleto) {
          doc.textWithLink('[Boleto]', column.boleto.x, currentY, { url: item.links.boleto });
        }
        if (item.links?.comp) {
          doc.textWithLink('[Comprovante]', column.comprovante.x, currentY, { url: item.links.comp });
        }
        doc.setTextColor(0, 0, 0);

        currentY += lineHeight;
        rowsOnPage += 1;
      });
    });

    return `relatorio_${String(month).padStart(2, '0')}_${year}.pdf`;
  }

  function buildPeriodTableCanvases(host, { titulo, rows }) {
    const width = 1080;
    const baseHeight = 460;
    const titleY = 24;
    const headerY = 52;
    const firstRowY = 78;
    const rowHeight = 22;
    const neededHeight = firstRowY + rows.length * rowHeight + 40;
    const height = Math.max(baseHeight, neededHeight);

    const wrap = document.createElement('div');
    wrap.style.width = `${width}px`;
    wrap.style.height = `${height}px`;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    wrap.appendChild(canvas);
    host.appendChild(wrap);

    const context = canvas.getContext('2d');
    canvas._pdfLinks = [];

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#111827';
    context.font = 'bold 18px Arial';
    context.textAlign = 'left';
    context.fillText(titulo, 24, titleY);

    const columns = [
      { x: 24, label: '', w: 380 },
      { x: 420, label: 'Valor', w: 110, align: 'right' },
      { x: 540, label: 'Dividida', w: 60 },
      { x: 620, label: 'Boleto', w: 150 },
      { x: 780, label: 'Comprovante', w: 180 },
    ];

    context.font = 'bold 14px Arial';
    columns.forEach((column) => {
      context.textAlign = column.align === 'right' ? 'right' : 'left';
      context.fillText(column.label, column.align === 'right' ? column.x + column.w : column.x, headerY);
    });

    context.font = '14px Arial';
    context.fillStyle = '#111827';
    let currentY = firstRowY;

    rows.forEach((row) => {
      if (row._header) {
        context.font = 'bold 14px Arial';
        context.fillText(row.nome, 24, currentY);
        currentY += 20;
        context.font = '14px Arial';
        return;
      }

      const nomeInstancia = row.instancia ? `${row.nome} (${row.instancia})` : row.nome;
      context.fillText(nomeInstancia, columns[0].x, currentY);

      const valorText = `R$ ${row.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      context.textAlign = 'right';
      context.fillText(valorText, columns[1].x + columns[1].w, currentY);
      context.textAlign = 'left';

      context.fillText(row.dividida ? 'Sim' : 'Não', columns[2].x, currentY);

      context.fillStyle = '#0066cc';
      const linkHeight = 14;
      if (row.link_boleto) {
        context.fillText('[Boleto]', columns[3].x, currentY);
        canvas._pdfLinks.push({
          url: row.link_boleto,
          x: columns[3].x,
          y: currentY - linkHeight + 4,
          w: columns[3].w,
          h: linkHeight + 6,
        });
      }
      if (row.link_comprovante) {
        context.fillText('[Comprovante]', columns[4].x, currentY);
        canvas._pdfLinks.push({
          url: row.link_comprovante,
          x: columns[4].x,
          y: currentY - linkHeight + 4,
          w: columns[4].w,
          h: linkHeight + 6,
        });
      }
      context.fillStyle = '#111827';
      currentY += rowHeight;
    });

    return [canvas];
  }

  function buildRowsByPayer(items) {
    const byPayer = {};
    items.forEach((item) => {
      const payer = item.quem || '—';
      if (!byPayer[payer]) byPayer[payer] = [];
      byPayer[payer].push(item);
    });

    const payers = Object.keys(byPayer).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const rows = [];

    payers.forEach((payer) => {
      rows.push({
        nome: `Quem pagou: ${payer}`,
        instancia: '',
        valor: 0,
        dividida: false,
        link_boleto: '',
        link_comprovante: '',
        _header: true,
      });

      byPayer[payer]
        .sort((a, b) => `${a.nome}${a.instancia || ''}`.localeCompare(`${b.nome}${b.instancia || ''}`, 'pt-BR'))
        .forEach((item) => {
          rows.push({
            nome: item.nome,
            instancia: item.instancia || '',
            valor: parseBRLnum(item.valor),
            dividida: !!item.dividida,
            link_boleto: item.link_boleto || item.boleto || item.links?.boleto || '',
            link_comprovante:
              item.link_comprovante ||
              item.comprovante ||
              item.links?.comp ||
              item.links?.comprovante ||
              '',
          });
        });
    });

    return rows;
  }

  async function generateMonthlyReportPdf(context) {
    const jsPDF = getJsPdf();
    if (!jsPDF) {
      alert('jsPDF não carregado.');
      return;
    }

    const { year, month, configuredChartAccounts = [] } = context;
    const rotMes = `${monthNamePT(month)} / ${year}`;
    const items = await fetchMes(year, month) || [];
    const previousMonth = month > 1 ? month - 1 : 12;
    const previousYear = month > 1 ? year : (year - 1);
    const itemsPreviousMonth = await fetchMes(previousYear, previousMonth) || [];
    const itemsPreviousYear = await fetchMes(year - 1, month) || [];

    const monthlyStats = buildMonthlySummaryStats(items);
    const accountComparison = buildMonthlyAccountComparison(
      items,
      itemsPreviousMonth,
      itemsPreviousYear,
      configuredChartAccounts
    );

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const host = createOffscreenHost({ width: '1100px' });
    const canvases = [];

    try {
      globalObject.__PDF_MODE = true;

      const pizzaCanvas = addCanvas(host, 560, 900);
      const pizzaContext = pizzaCanvas.getContext('2d');
      pizzaContext.fillStyle = '#ffffff';
      pizzaContext.fillRect(0, 0, pizzaCanvas.width, pizzaCanvas.height);
      renderPizzaMensalStrict(
        pizzaCanvas,
        { labels: accountComparison.contasAll, valores: accountComparison.valoresAll },
        rotMes
      );
      if (pizzaCanvas._chart && globalObject.ChartFeatures?.applyPdfTheme) {
        globalObject.ChartFeatures.applyPdfTheme(pizzaCanvas._chart);
        pizzaCanvas._chart.update('none');
      }
      forceWhiteBackground(pizzaCanvas);
      canvases.push(pizzaCanvas);

      canvases.push(buildMonthlySummaryCanvas(host, {
        rotMes,
        total: monthlyStats.totalMes,
        porPagador: monthlyStats.porPagador,
        totalDividida: monthlyStats.totalDividida,
        porPagadorDividida: monthlyStats.porPagadorDividida,
        deltaTexto: monthlyStats.deltaTexto,
      }));

      const previousCanvas = addCanvas(host, 520, 900);
      renderBarrasMensalLocal(
        previousCanvas,
        {
          labels: accountComparison.contasBarras,
          atual: accountComparison.curVals,
          comparado: accountComparison.antVals,
          allowList: configuredChartAccounts?.length ? configuredChartAccounts : null,
        },
        {
          title: `Comparativo de ${rotMes} vs ${monthNamePT(previousMonth)} / ${previousYear}`,
          rotAtuais: rotMes,
          rotComparado: `${monthNamePT(previousMonth)} / ${previousYear}`,
        }
      );
      canvases.push(previousCanvas);

      const previousYearCanvas = addCanvas(host, 520, 900);
      renderBarrasMensalLocal(
        previousYearCanvas,
        {
          labels: accountComparison.contasBarras,
          atual: accountComparison.curVals,
          comparado: accountComparison.anoAntVals,
          allowList: configuredChartAccounts?.length ? configuredChartAccounts : null,
        },
        {
          title: `Comparativo de ${rotMes} vs ${monthNamePT(month)} / ${year - 1}`,
          rotAtuais: rotMes,
          rotComparado: `${monthNamePT(month)} / ${year - 1}`,
        }
      );
      canvases.push(previousYearCanvas);

      appendCanvasesToDocument(doc, canvases, { margin: 28, gap: 24 });
      appendMonthlyListingPages(doc, { year, month, rotMes, items });
      doc.save(`relatorio_${String(month).padStart(2, '0')}_${year}.pdf`);
    } finally {
      globalObject.__PDF_MODE = false;
      host?.parentNode?.removeChild(host);
    }
  }

  async function generatePeriodReportPdf(context) {
    const jsPDF = getJsPdf();
    if (!jsPDF) {
      alert('jsPDF não carregado.');
      return;
    }

    const {
      startYear,
      startMonth,
      endYear,
      endMonth,
      configuredChartAccounts = [],
    } = context;

    const monthsList = makeMonthsList(startYear, startMonth, endYear, endMonth);
    if (!monthsList.length) {
      alert('Período inválido.');
      return;
    }

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const host = createOffscreenHost();
    const canvases = [];

    try {
      globalObject.__PDF_MODE = true;
      globalObject.ChartFeatures?.setupChartDefaults?.();

      const allItems = [];
      for (const { y, m } of monthsList) {
        const monthItems = await fetchMes(y, m) || [];
        allItems.push(...monthItems);
      }

      const contasAll = Array.from(new Set(allItems.map((item) => item.nome)))
        .sort((a, b) => a.localeCompare(b, 'pt-BR'));
      const valoresAll = contasAll.map((conta) =>
        allItems
          .filter((item) => item.nome === conta)
          .reduce((accumulator, item) => accumulator + parseBRLnum(item.valor), 0)
      );

      const rotPeriodo = `${String(startMonth).padStart(2, '0')}/${startYear} a ${String(endMonth).padStart(2, '0')}/${endYear}`;
      const pizzaCanvas = addCanvas(host, '560px', '900px');
      renderPizzaMensalStrict(
        pizzaCanvas,
        { labels: contasAll, valores: valoresAll },
        rotPeriodo
      );
      if (pizzaCanvas._chart && globalObject.ChartFeatures?.applyPdfTheme) {
        globalObject.ChartFeatures.applyPdfTheme(pizzaCanvas._chart);
        pizzaCanvas._chart.update('none');
      }
      forceWhiteBackground(pizzaCanvas);
      canvases.push(pizzaCanvas);

      const totalPeriodo = valoresAll.reduce((accumulator, value) => accumulator + value, 0);
      const totalCanvas = addCanvas(host, '80px', '900px');
      {
        const context2d = totalCanvas.getContext('2d');
        context2d.fillStyle = '#ffffff';
        context2d.fillRect(0, 0, totalCanvas.width, totalCanvas.height);
        context2d.fillStyle = '#111827';
        context2d.font = '600 18px Inter, Arial, sans-serif';
        context2d.textAlign = 'center';
        context2d.textBaseline = 'middle';
        context2d.fillText(
          `Total do período: R$ ${totalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          totalCanvas.width / 2,
          totalCanvas.height / 2
        );
      }
      canvases.push(totalCanvas);
      canvases.push(buildPageBreakMarker());

      const contasLinhasBase = configuredChartAccounts.length ? configuredChartAccounts : contasAll;
      const contasLinhas = contasLinhasBase.slice(0, 7);

      for (const conta of contasLinhas) {
        const valores = [];
        for (const { y, m } of monthsList) {
          const monthItems = await fetchMes(y, m) || [];
          const alvo = normalizeContaName(conta);
          const soma = monthItems
            .filter((item) => normalizeContaName(item.nome) === alvo)
            .reduce((accumulator, item) => accumulator + parseBRLnum(item.valor), 0);
          valores.push(soma);
        }

        const pontosNaoZero = valores.filter((value) => value > 0.001).length;
        if (pontosNaoZero < 1) continue;

        const lineCanvas = addCanvas(host, '600px', '1100px');
        renderLinhaPeriodoLocal(lineCanvas, {
          nome: conta,
          meses: monthsList.map(({ y, m }) => `${String(m).padStart(2, '0')}/${y}`),
          valores,
        });
        await flushRender();
        forceWhiteBackground(lineCanvas);
        canvases.push(lineCanvas);
      }

      const listingMarkersInserted = monthsList.some(({ y, m }) => {
        const current = allItems.filter((item) => Number(item.ano) === Number(y) && Number(item.mes) === Number(m));
        return current.length > 0;
      });

      if (listingMarkersInserted) {
        canvases.push(buildPageBreakMarker());
      }

      for (const { y, m } of monthsList) {
        const monthItems = await fetchMes(y, m) || [];
        if (!monthItems.length) continue;

        canvases.push(buildPageBreakMarker());
        const tableCanvases = buildPeriodTableCanvases(host, {
          titulo: `Contas pagas — ${String(m).padStart(2, '0')}/${y}`,
          rows: buildRowsByPayer(monthItems),
        });
        tableCanvases.forEach((canvas) => canvases.push(canvas));
      }

      canvases.forEach((canvas) => {
        if (!canvas?._forcePageBreak) forceWhiteBackground(canvas);
      });

      appendCanvasesToDocument(doc, canvases, { margin: 28, gap: 24 });
      doc.save(`relatorio_${String(startMonth).padStart(2, '0')}_${startYear}_a_${String(endMonth).padStart(2, '0')}_${endYear}.pdf`);
    } finally {
      globalObject.__PDF_MODE = false;
      host?.parentNode?.removeChild(host);
    }
  }

  globalObject.ReportsPdfBuilders = {
    generateMonthlyReportPdf,
    generatePeriodReportPdf,
  };
})(window);
