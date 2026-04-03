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

  function formatBrlValue(value) {
    return `R$ ${Number(value || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatCompactBrlValue(value) {
    const amount = Number(value || 0);
    const abs = Math.abs(amount);
    const signal = amount < 0 ? '-' : '';

    if (abs >= 1000000) {
      return `${signal}R$ ${(abs / 1000000).toLocaleString('pt-BR', {
        maximumFractionDigits: abs >= 10000000 ? 0 : 1,
      })} mi`;
    }

    if (abs >= 1000) {
      return `${signal}R$ ${(abs / 1000).toLocaleString('pt-BR', {
        maximumFractionDigits: abs >= 10000 ? 0 : 1,
      })} mil`;
    }

    return `${signal}R$ ${abs.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
  }

  function periodMonthKey(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  function shiftYearMonth(year, month, deltaMonths) {
    const date = new Date(Number(year), Number(month) - 1 + Number(deltaMonths || 0), 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }

  function groupTotalsByField(items, fieldName) {
    const totals = new Map();

    (items || []).forEach((item) => {
      const key = item?.[fieldName] || '—';
      totals.set(key, (totals.get(key) || 0) + parseBRLnum(item.valor));
    });

    return Array.from(totals.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((left, right) => right.total - left.total);
  }

  function totalsMapToSortedEntries(totalsMap) {
    return Array.from(totalsMap.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }

  function totalsMapToRankedEntries(totalsMap) {
    return Array.from(totalsMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((left, right) => right.total - left.total);
  }

  function buildSafeTotalsMap(items, resolveKey) {
    const totals = new Map();

    (items || []).forEach((item) => {
      const key = resolveKey(item) || '-';
      totals.set(key, (totals.get(key) || 0) + parseBRLnum(item.valor));
    });

    return totals;
  }

  function normalizeMonthItems(monthItemsRaw, year, month) {
    return (monthItemsRaw || []).map((item) => ({
      ...item,
      ano: Number(item.ano || year),
      mes: Number(item.mes || month),
    }));
  }

  async function loadPeriodSource(monthsList) {
    const itemsByMonth = new Map();
    const allItems = [];
    const monthEntries = [];
    const batchSize = 4;

    for (let startIndex = 0; startIndex < monthsList.length; startIndex += batchSize) {
      const batch = monthsList.slice(startIndex, startIndex + batchSize);
      const batchEntries = await Promise.all(
        batch.map(async ({ y, m }) => {
          const key = periodMonthKey(y, m);
          const monthItemsRaw = await fetchMes(y, m) || [];

          return {
            key,
            monthItems: normalizeMonthItems(monthItemsRaw, y, m),
          };
        })
      );

      monthEntries.push(...batchEntries);
    }

    monthEntries.forEach(({ key, monthItems }) => {
      itemsByMonth.set(key, monthItems);
      allItems.push(...monthItems);
    });

    return { itemsByMonth, allItems };
  }

  function buildMonthAccountTotalsLookup(monthsList, itemsByMonth) {
    const accountTotalsByMonth = new Map();

    monthsList.forEach(({ y, m }) => {
      const monthKey = periodMonthKey(y, m);
      const monthItems = itemsByMonth.get(monthKey) || [];
      accountTotalsByMonth.set(
        monthKey,
        buildSafeTotalsMap(monthItems, (item) => normalizeContaName(item?.nome))
      );
    });

    return accountTotalsByMonth;
  }

  function buildAccountTimelineValues(monthsList, accountTotalsByMonth, conta) {
    const targetAccount = normalizeContaName(conta);

    return monthsList.map(({ y, m }) => {
      const monthKey = periodMonthKey(y, m);
      const monthTotals = accountTotalsByMonth.get(monthKey);
      return monthTotals?.get(targetAccount) || 0;
    });
  }

  function hasItemsInPeriodMonths(monthsList, itemsByMonth) {
    return monthsList.some(({ y, m }) => {
      const monthItems = itemsByMonth.get(periodMonthKey(y, m)) || [];
      return monthItems.length > 0;
    });
  }

  function buildPeriodAggregateData(monthsList, itemsByMonth, allItems) {
    const accountTotals = new Map();
    const payerTotals = new Map();
    const monthTotals = new Map();
    let totalPeriodo = 0;
    let totalDividido = 0;

    (allItems || []).forEach((item) => {
      const value = parseBRLnum(item.valor);
      const accountName = item?.nome || '—';
      const payerName = item?.quem || '—';
      const monthKey = periodMonthKey(item.ano, item.mes);

      totalPeriodo += value;
      accountTotals.set(accountName, (accountTotals.get(accountName) || 0) + value);
      payerTotals.set(payerName, (payerTotals.get(payerName) || 0) + value);
      monthTotals.set(monthKey, (monthTotals.get(monthKey) || 0) + value);

      if (item.dividida) {
        totalDividido += value;
      }
    });

    const contasAll = Array.from(accountTotals.keys())
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const valoresAll = contasAll.map((conta) => accountTotals.get(conta) || 0);
    const monthlyTotals = monthsList.map(({ y, m }) => ({
      year: y,
      month: m,
      label: `${String(m).padStart(2, '0')}/${String(y).slice(-2)}`,
      labelLong: `${monthNamePT(m)} / ${y}`,
      value: monthTotals.get(periodMonthKey(y, m)) || 0,
    }));
    const rankingAccounts = totalsMapToRankedEntries(accountTotals);
    const rankingPayers = totalsMapToRankedEntries(payerTotals);

    return {
      contasAll,
      valoresAll,
      monthlyTotals,
      rankingAccounts,
      rankingPayers,
      totalPeriodo,
      totalDividido,
      topAccount: rankingAccounts[0] || null,
      topPayer: rankingPayers[0] || null,
    };
  }

  function buildPageBreakMarker() {
    return { _forcePageBreak: true };
  }

  function drawRoundedRect(context, x, y, width, height, radius = 12) {
    const rr = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
    context.beginPath();
    context.moveTo(x + rr, y);
    context.lineTo(x + width - rr, y);
    context.quadraticCurveTo(x + width, y, x + width, y + rr);
    context.lineTo(x + width, y + height - rr);
    context.quadraticCurveTo(x + width, y + height, x + width - rr, y + height);
    context.lineTo(x + rr, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - rr);
    context.lineTo(x, y + rr);
    context.quadraticCurveTo(x, y, x + rr, y);
    context.closePath();
  }

  function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
    const words = String(text || '').split(' ');
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

  function truncateCanvasText(context, text, maxWidth) {
    const source = String(text || '');
    if (!source) return '';
    if (context.measureText(source).width <= maxWidth) return source;

    let truncated = source;
    while (truncated.length > 1 && context.measureText(`${truncated}…`).width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return `${truncated}…`;
  }

  function buildPeriodCoverHeadings(payload) {
    const coverScope = payload.coverScope || 'period';
    const coverLabel = payload.coverLabel || payload.rotPeriodo || '';

    if (coverScope === 'month') {
      return {
        chartTitle: `Gastos de ${coverLabel}`,
        chartSubtitle: '',
        summaryTitle: `Resumo de ${coverLabel}`,
        topFiveTitle: `Top 5 contas de ${coverLabel}`,
        scopeKey: 'month',
      };
    }

    return {
      chartTitle: 'Gasto mensal do período',
      chartSubtitle: payload.rotPeriodo,
      summaryTitle: `Resumo de ${payload.rotPeriodo}`,
      topFiveTitle: 'Top 5 contas do período',
      scopeKey: 'period',
    };
  }

  function buildTrendInfoRow(payload, average) {
    return {
      averageLabel: `Média mensal: ${formatBrlValue(average)}`,
      totalLabel: payload.coverScope === 'month'
        ? `Total de ${payload.coverLabel}: ${formatBrlValue(payload.totalPeriodo)}`
        : `Total do recorte: ${formatBrlValue(payload.totalPeriodo)}`,
    };
  }

  function computePdfTickRotation(totalPoints) {
    if (totalPoints <= 12) return 0;
    const progress = Math.min((totalPoints - 12) / 12, 1);
    return Math.round(progress * 90);
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
      const placement = canvas._pdfPlacement || null;
      const yBase = slotIndex === 0 ? margin : (margin + slotHeight + gap);
      const y = yBase + Number(placement?.yShift || 0);
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

  function buildBalanceDeltaText(summary, copy) {
    const {
      porPagador,
      porPagadorDividida,
      totalDividida,
    } = summary;

    if (porPagadorDividida.length === 0) {
      return copy.emptyDivided;
    }

    const pagadores = porPagador.map((payer) => payer.nome);
    const porPagadorDivididaMap = new Map(
      porPagadorDividida.map((payer) => [payer.nome, payer.valor])
    );
    const porPagadorDivididaFull = pagadores.map((nome) => ({
      nome,
      valor: porPagadorDivididaMap.get(nome) || 0,
    }));

    if (porPagadorDivididaFull.length === 2) {
      const quota = totalDividida / 2;
      const [payerA, payerB] = porPagadorDivididaFull;
      const excessoA = payerA.valor - quota;
      const excessoB = payerB.valor - quota;

      if (excessoA > 0.009) {
        return `${payerB.nome} deve R$ ${excessoA.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })} para ${payerA.nome}`;
      }

      if (excessoB > 0.009) {
        return `${payerA.nome} deve R$ ${excessoB.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
        })} para ${payerB.nome}`;
      }

      return copy.balanced;
    }

    if (porPagadorDivididaFull.length === 1) {
      return copy.singlePayer;
    }

    return copy.default;
  }

  function buildSharedBalanceSummaryStats(items, copy) {
    let total = 0;
    let totalDividida = 0;
    const porPagadorGeral = new Map();
    const porPagadorDivididaMap = new Map();

    items.forEach((item) => {
      const value = parseBRLnum(item.valor);
      const payer = item.quem || '—';

      total += value;
      porPagadorGeral.set(payer, (porPagadorGeral.get(payer) || 0) + value);

      if (item.dividida) {
        totalDividida += value;
        porPagadorDivididaMap.set(payer, (porPagadorDivididaMap.get(payer) || 0) + value);
      }
    });

    const summary = {
      total,
      totalDividida,
      porPagador: totalsMapToSortedEntries(porPagadorGeral),
      porPagadorDividida: totalsMapToSortedEntries(porPagadorDivididaMap),
    };

    return {
      ...summary,
      deltaTexto: buildBalanceDeltaText(summary, copy),
    };
  }

  function buildMonthlySummaryStats(items) {
    const summary = buildSharedBalanceSummaryStats(items, {
      default: 'Acerto não calculado porque há número diferente de 2 pagadores.',
      emptyDivided: 'Sem contas divididas neste mês.',
      balanced: 'Valores de divididas já estão equilibrados.',
      singlePayer: 'Apenas 1 pagador com contas divididas.',
    });

    return {
      totalMes: summary.total,
      totalDividida: summary.totalDividida,
      porPagador: summary.porPagador,
      porPagadorDividida: summary.porPagadorDividida,
      deltaTexto: summary.deltaTexto,
    };
  }

  function buildPeriodBalanceSummaryStats(items) {
    const summary = buildSharedBalanceSummaryStats(items, {
      default: 'Acerto não calculado porque há número diferente de 2 pagadores.',
      emptyDivided: 'Sem contas divididas neste período.',
      balanced: 'Valores de divididas já estão equilibrados no período.',
      singlePayer: 'Apenas 1 pagador com contas divididas no período.',
    });

    return {
      totalPeriodo: summary.total,
      totalDividida: summary.totalDividida,
      porPagador: summary.porPagador,
      porPagadorDividida: summary.porPagadorDividida,
      deltaTexto: summary.deltaTexto,
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

    let textY = yCard + 70;
    lines.forEach((line) => {
      textY = drawWrappedText(context, line, xCard + 20, textY, cardWidth - 40, 24);
    });

    return canvas;
  }

  function buildMonthlyAccountComparison(itemsMes, itemsAnt, itemsAnoAnt, chartAccounts) {
    const currentTotals = buildSafeTotalsMap(itemsMes, (item) => item?.nome);
    const previousTotals = buildSafeTotalsMap(itemsAnt, (item) => item?.nome);
    const previousYearTotals = buildSafeTotalsMap(itemsAnoAnt, (item) => item?.nome);
    const contasAll = Array.from(currentTotals.keys())
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    const valoresAll = contasAll.map((conta) => currentTotals.get(conta) || 0);
    const contasBarras = chartAccounts?.length ? chartAccounts : contasAll;
    const sumByConta = (totalsMap, contasSel) =>
      contasSel.map((conta) => totalsMap.get(conta) || 0);

    return {
      contasAll,
      valoresAll,
      contasBarras,
      curVals: sumByConta(currentTotals, contasBarras),
      antVals: sumByConta(previousTotals, contasBarras),
      anoAntVals: sumByConta(previousYearTotals, contasBarras),
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

  function drawPeriodBalanceSummaryCard(context, payload, frame) {
    const summary = payload.balanceSummary || buildPeriodBalanceSummaryStats(payload.allItems || []);
    const headings = buildPeriodCoverHeadings(payload);
    const xCard = frame.x;
    const yCard = frame.y;
    const cardWidth = frame.width;
    const cardHeight = frame.height;

    context.fillStyle = '#ffffff';
    context.strokeStyle = '#d1d5db';
    context.lineWidth = 2;
    drawRoundedRect(context, xCard, yCard, cardWidth, cardHeight, 14);
    context.fill();
    context.stroke();

    context.fillStyle = '#111827';
    context.font = 'bold 20px Inter, Arial, sans-serif';
    context.textAlign = 'left';
    context.fillText(headings.summaryTitle, xCard + 20, yCard + 34);

    context.font = '14px Inter, Arial, sans-serif';
    const linhaPorPagadorGeral = `Por pagador (total): ${summary.porPagador
      .map((payer) => `${payer.nome}: R$ ${payer.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      .join(' | ')}`;

    const linhaPorPagadorDividida = summary.porPagadorDividida.length > 0
      ? `Por pagador (divididas): ${summary.porPagadorDividida
          .map((payer) => `${payer.nome}: R$ ${payer.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
          .join(' | ')}`
      : null;

    const lines = [
      `${headings.scopeKey === 'month' ? 'Total gasto no mês' : 'Total gasto no período'}: R$ ${summary.totalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `Total em contas divididas: R$ ${summary.totalDividida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      linhaPorPagadorGeral,
      ...(linhaPorPagadorDividida ? [linhaPorPagadorDividida] : []),
      `Acerto: ${summary.deltaTexto}`,
    ];

    let textY = yCard + 70;
    lines.forEach((line) => {
      textY = drawWrappedText(context, line, xCard + 20, textY, cardWidth - 40, 24);
    });
  }

  function buildMonthlyTrendCoverCanvas(host, payload) {
    const canvas = addCanvas(host, 540, 1100);
    const headings = buildPeriodCoverHeadings(payload);
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    if (canvas._chart) canvas._chart = null;

    const values = payload.monthlyTotals.map((item) => Number(item.value || 0));
    const average = values.length
      ? values.reduce((accumulator, value) => accumulator + value, 0) / values.length
      : 0;
    const infoRow = buildTrendInfoRow(payload, average);
    const usesSelectionWindow = payload.monthlyTotals.some((item) => typeof item.isSelected === 'boolean');
    const isPeriodScope = payload.coverScope === 'period';
    const highlightLastMonth = payload.highlightLastMonth !== false;
    const pointCount = Math.max(payload.monthlyTotals.length, 1);
    const denseChart = pointCount > 13;
    const veryDenseChart = pointCount > 18;
    const titleY = 34;
    const subtitleY = headings.chartSubtitle ? 56 : 0;
    const infoY = headings.chartSubtitle ? 82 : 76;
    const valueLabelFontSize = veryDenseChart ? 9 : denseChart ? 10 : isPeriodScope ? 10 : 11;
    const tickFontSize = veryDenseChart ? 9 : 11;
    const tickRotation = pointCount <= 13 ? 0 : computePdfTickRotation(pointCount);
    const tickAreaHeight = tickRotation > 0 ? 72 : 46;
    const headerBottom = headings.chartSubtitle ? 104 : 96;
    const plotTop = headerBottom + 22;
    const plotBottom = canvas.height - tickAreaHeight;
    const legendLineWidth = 26;
    const gapAfterLine = 8;
    const gapBetweenTexts = 40;

    context.textBaseline = 'middle';
    context.fillStyle = '#111827';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    context.fillText(headings.chartTitle, canvas.width / 2, titleY);

    if (headings.chartSubtitle) {
      context.fillStyle = '#4b5563';
      context.font = '13px Arial';
      context.fillText(headings.chartSubtitle, canvas.width / 2, subtitleY);
    }

    context.strokeStyle = 'rgba(148, 163, 184, 0.95)';
    context.font = '12px Arial';
    const averageWidth = context.measureText(infoRow.averageLabel).width;
    context.font = 'bold 12px Arial';
    const totalWidth = context.measureText(infoRow.totalLabel).width;
    const infoGroupWidth = legendLineWidth + gapAfterLine + averageWidth + gapBetweenTexts + totalWidth;
    let currentInfoX = (canvas.width - infoGroupWidth) / 2;

    context.textAlign = 'left';
    context.beginPath();
    context.setLineDash([6, 10]);
    context.strokeStyle = 'rgba(148, 163, 184, 0.95)';
    context.lineWidth = 1.2;
    context.moveTo(currentInfoX, infoY);
    context.lineTo(currentInfoX + legendLineWidth, infoY);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = '#111827';
    context.font = '12px Arial';
    context.fillText(infoRow.averageLabel, currentInfoX + legendLineWidth + gapAfterLine, infoY + 0.5);
    currentInfoX += legendLineWidth + gapAfterLine + averageWidth + gapBetweenTexts;
    context.font = 'bold 12px Arial';
    context.fillText(infoRow.totalLabel, currentInfoX, infoY + 0.5);

    context.font = `bold ${valueLabelFontSize}px Arial`;
    const maxValueLabelWidth = values.length
      ? values.reduce((maxWidth, value) => (
          Math.max(maxWidth, context.measureText(formatCompactBrlValue(value)).width)
        ), 0)
      : 0;

    const baseSidePadding = veryDenseChart ? 28 : denseChart ? 34 : isPeriodScope ? 44 : 36;
    const plotLeft = Math.max(baseSidePadding, Math.ceil(maxValueLabelWidth / 2) + 12);
    const plotRight = canvas.width - plotLeft;
    const plotWidth = Math.max(plotRight - plotLeft, 1);
    const plotHeight = Math.max(plotBottom - plotTop, 1);
    const maxValue = Math.max(1, average, ...values);
    const scaleMax = maxValue * (veryDenseChart ? 1.30 : denseChart ? 1.26 : isPeriodScope ? 1.30 : 1.20);
    const averageY = plotBottom - ((average / scaleMax) * plotHeight);
    const slotWidth = plotWidth / pointCount;
    const barWidth = Math.max(
      veryDenseChart ? 12 : denseChart ? 14 : isPeriodScope ? 16 : 20,
      Math.min(
        veryDenseChart ? 14 : denseChart ? 16 : isPeriodScope ? 18 : 24,
        slotWidth * (veryDenseChart ? 0.32 : denseChart ? 0.36 : isPeriodScope ? 0.40 : 0.48)
      )
    );

    context.beginPath();
    context.setLineDash([6, 10]);
    context.strokeStyle = 'rgba(148, 163, 184, 0.95)';
    context.lineWidth = 1.2;
    context.moveTo(plotLeft, averageY);
    context.lineTo(plotRight, averageY);
    context.stroke();
    context.setLineDash([]);

    context.beginPath();
    context.strokeStyle = 'rgba(209, 213, 219, 0.9)';
    context.lineWidth = 1;
    context.moveTo(plotLeft, plotBottom);
    context.lineTo(plotRight, plotBottom);
    context.stroke();

    payload.monthlyTotals.forEach((item, index) => {
      const value = values[index];
      const barCenterX = plotLeft + (slotWidth * (index + 0.5));
      const barLeft = barCenterX - (barWidth / 2);
      const barHeight = (value / scaleMax) * plotHeight;
      const barTop = plotBottom - barHeight;

      const fillColor = usesSelectionWindow
        ? (item.isSelected ? 'rgba(34, 211, 238, 0.82)' : 'rgba(148, 163, 184, 0.36)')
        : (highlightLastMonth && index === payload.monthlyTotals.length - 1
            ? 'rgba(236, 72, 153, 0.86)'
            : 'rgba(34, 211, 238, 0.82)');

      context.fillStyle = fillColor;
      context.fillRect(barLeft, barTop, barWidth, barHeight);

      const valueLabel = formatCompactBrlValue(value);
      context.fillStyle = '#111827';
      context.font = `bold ${valueLabelFontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      const valueLabelWidth = context.measureText(valueLabel).width;
      const minCenter = plotLeft + (valueLabelWidth / 2) + 2;
      const maxCenter = plotRight - (valueLabelWidth / 2) - 2;
      const labelCenterX = Math.min(Math.max(barCenterX, minCenter), maxCenter);
      const labelY = Math.max(barTop - 8, plotTop + valueLabelFontSize + 2);
      context.fillText(valueLabel, labelCenterX, labelY);

      context.fillStyle = '#374151';
      context.font = `${tickFontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'top';

      if (tickRotation > 0) {
        context.save();
        context.translate(barCenterX, plotBottom + 14);
        context.rotate((-tickRotation * Math.PI) / 180);
        context.fillText(item.label, 0, 0);
        context.restore();
      } else {
        context.fillText(item.label, barCenterX, plotBottom + 14);
      }
    });

    forceWhiteBackground(canvas);
    canvas._chart = null;
    return canvas;
  }

  function buildPeriodTrendCoverCanvas(host, payload) {
    const canvas = addCanvas(host, 580, 1100);
    const headings = buildPeriodCoverHeadings(payload);
    const context = canvas.getContext('2d');
    const values = payload.monthlyTotals.map((item) => Number(item.value || 0));
    const selectedValues = payload.monthlyTotals
      .filter((item) => item.isSelected !== false)
      .map((item) => Number(item.value || 0));
    const averageSource = selectedValues.length ? selectedValues : values;
    const average = averageSource.length
      ? averageSource.reduce((accumulator, value) => accumulator + value, 0) / averageSource.length
      : 0;
    const infoRow = buildTrendInfoRow(payload, average);
    const pointCount = Math.max(payload.monthlyTotals.length, 1);
    const usesSelectionWindow = payload.monthlyTotals.some((item) => typeof item.isSelected === 'boolean');
    const denseChart = pointCount > 13;
    const veryDenseChart = pointCount > 18;
    const tickRotation = pointCount <= 13 ? 0 : computePdfTickRotation(pointCount);
    const tickFontSize = veryDenseChart ? 8 : denseChart ? 9 : 10;
    const valueLabelFontSize = veryDenseChart ? 8 : denseChart ? 9 : 10;
    const tickAreaHeight = tickRotation > 0 ? 92 : 54;
    const titleY = 34;
    const subtitleY = 58;
    const infoY = 86;
    const headerBottom = headings.chartSubtitle ? 104 : 92;
    const plotTop = headerBottom + 22;
    const plotBottom = canvas.height - tickAreaHeight - 14;
    const legendLineWidth = 26;
    const gapAfterLine = 8;
    const gapBetweenTexts = 40;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textBaseline = 'middle';
    context.textAlign = 'center';
    context.fillStyle = '#111827';
    context.font = 'bold 20px Arial';
    context.fillText(headings.chartTitle, canvas.width / 2, titleY);

    if (headings.chartSubtitle) {
      context.fillStyle = '#4b5563';
      context.font = '13px Arial';
      context.fillText(headings.chartSubtitle, canvas.width / 2, subtitleY);
    }

    context.font = '12px Arial';
    const averageWidth = context.measureText(infoRow.averageLabel).width;
    context.font = 'bold 12px Arial';
    const totalWidth = context.measureText(infoRow.totalLabel).width;
    const infoGroupWidth = legendLineWidth + gapAfterLine + averageWidth + gapBetweenTexts + totalWidth;
    let currentInfoX = (canvas.width - infoGroupWidth) / 2;

    context.textAlign = 'left';
    context.beginPath();
    context.setLineDash([6, 10]);
    context.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    context.lineWidth = 1.1;
    context.moveTo(currentInfoX, infoY);
    context.lineTo(currentInfoX + legendLineWidth, infoY);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = '#111827';
    context.font = '12px Arial';
    context.fillText(infoRow.averageLabel, currentInfoX + legendLineWidth + gapAfterLine, infoY + 0.5);
    currentInfoX += legendLineWidth + gapAfterLine + averageWidth + gapBetweenTexts;
    context.font = 'bold 12px Arial';
    context.fillText(infoRow.totalLabel, currentInfoX, infoY + 0.5);

    context.font = `bold ${valueLabelFontSize}px Arial`;
    const maxValueLabelWidth = values.length
      ? values.reduce((maxWidth, value) => (
          Math.max(maxWidth, context.measureText(formatCompactBrlValue(value)).width)
        ), 0)
      : 0;

    const sidePadding = veryDenseChart ? 38 : denseChart ? 44 : 52;
    const plotLeft = Math.max(sidePadding, Math.ceil(maxValueLabelWidth / 2) + 18);
    const plotRight = canvas.width - plotLeft;
    const plotWidth = Math.max(plotRight - plotLeft, 1);
    const plotHeight = Math.max(plotBottom - plotTop, 1);
    const maxValue = Math.max(1, average, ...values);
    const sortedPositiveValues = values.filter((value) => value > 0).sort((left, right) => right - left);
    const secondLargestValue = sortedPositiveValues[1] || sortedPositiveValues[0] || maxValue;
    const outlierRatio = secondLargestValue > 0 ? (maxValue / secondLargestValue) : 1;
    const scalePaddingFactor = outlierRatio >= 2.2
      ? 1.12
      : (veryDenseChart ? 1.24 : denseChart ? 1.20 : 1.16);
    const scaleMax = maxValue * scalePaddingFactor;
    const averageY = plotBottom - ((average / scaleMax) * plotHeight);
    const slotWidth = plotWidth / pointCount;
    const barWidth = Math.max(
      veryDenseChart ? 11 : denseChart ? 13 : 16,
      Math.min(
        veryDenseChart ? 13 : denseChart ? 15 : 18,
        slotWidth * (veryDenseChart ? 0.26 : denseChart ? 0.31 : 0.36)
      )
    );

    context.beginPath();
    context.setLineDash([6, 10]);
    context.strokeStyle = 'rgba(148, 163, 184, 0.9)';
    context.lineWidth = 1.1;
    context.moveTo(plotLeft, averageY);
    context.lineTo(plotRight, averageY);
    context.stroke();
    context.setLineDash([]);

    context.beginPath();
    context.strokeStyle = 'rgba(209, 213, 219, 0.92)';
    context.lineWidth = 1;
    context.moveTo(plotLeft, plotBottom);
    context.lineTo(plotRight, plotBottom);
    context.stroke();

    payload.monthlyTotals.forEach((item, index) => {
      const value = values[index];
      const barCenterX = plotLeft + (slotWidth * (index + 0.5));
      const barLeft = barCenterX - (barWidth / 2);
      const barHeight = (value / scaleMax) * plotHeight;
      const barTop = plotBottom - barHeight;
      const fillColor = usesSelectionWindow
        ? (item.isSelected ? 'rgba(34, 211, 238, 0.82)' : 'rgba(148, 163, 184, 0.34)')
        : 'rgba(34, 211, 238, 0.82)';

      context.fillStyle = fillColor;
      context.fillRect(barLeft, barTop, barWidth, barHeight);

      if (value > 0) {
        const valueLabel = formatCompactBrlValue(value);
        context.fillStyle = '#111827';
        context.font = `bold ${valueLabelFontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        const valueLabelWidth = context.measureText(valueLabel).width;
        const minCenter = plotLeft + (valueLabelWidth / 2) + 4;
        const maxCenter = plotRight - (valueLabelWidth / 2) - 4;
        const labelCenterX = Math.min(Math.max(barCenterX, minCenter), maxCenter);
        const labelY = Math.max(barTop - 10, plotTop + valueLabelFontSize + 3);
        context.fillText(valueLabel, labelCenterX, labelY);
      }

      context.fillStyle = '#374151';
      context.font = `${tickFontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'top';

      if (tickRotation > 0) {
        context.save();
        context.translate(barCenterX, plotBottom + 16);
        context.rotate((-tickRotation * Math.PI) / 180);
        context.fillText(item.label, 0, 0);
        context.restore();
      } else {
        context.fillText(item.label, barCenterX, plotBottom + 14);
      }
    });

    forceWhiteBackground(canvas);
    canvas._chart = null;
    return canvas;
  }

  function buildPeriodSummaryCardCanvas(host, payload) {
    const canvas = addCanvas(host, 440, 1100);
    const context = canvas.getContext('2d');
    const headings = buildPeriodCoverHeadings(payload);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const cardGap = 22;
    const padding = 44;
    const cardWidth = Math.floor((canvas.width - padding * 2 - cardGap) / 2);
    const cardHeight = 118;
    const cards = [
      {
        label: 'Total do período',
        value: formatBrlValue(payload.totalPeriodo),
        detail: `${payload.monthlyTotals.length} meses no recorte`,
      },
      {
        label: 'Valor dividido',
        value: formatBrlValue(payload.totalDividido),
        detail: `${payload.totalPeriodo > 0 ? Math.round((payload.totalDividido / payload.totalPeriodo) * 100) : 0}% do total`,
      },
      {
        label: 'Maior conta',
        value: payload.topAccount?.name || 'Sem dados',
        detail: payload.topAccount ? formatBrlValue(payload.topAccount.total) : '—',
      },
      {
        label: 'Maior pagador',
        value: payload.topPayer?.name || 'Sem dados',
        detail: payload.topPayer ? formatBrlValue(payload.topPayer.total) : '—',
      },
    ];

    context.fillStyle = '#111827';
    context.font = 'bold 20px Arial';
    context.fillText(headings.summaryTitle, padding, 38);
    context.font = '13px Arial';
    context.fillStyle = '#4b5563';
    context.fillText('Gráfico mensal e quadro de resumo do recorte.', padding, 62);

    cards.forEach((card, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = padding + column * (cardWidth + cardGap);
      const y = 94 + row * (cardHeight + 18);

      context.fillStyle = '#ffffff';
      context.strokeStyle = '#d1d5db';
      context.lineWidth = 2;
      drawRoundedRect(context, x, y, cardWidth, cardHeight, 14);
      context.fill();
      context.stroke();

      context.fillStyle = '#6b7280';
      context.font = 'bold 11px Arial';
      context.fillText(card.label.toUpperCase(), x + 18, y + 26);

      context.fillStyle = '#111827';
      context.font = 'bold 22px Arial';
      context.fillText(card.value, x + 18, y + 64, cardWidth - 36);

      context.fillStyle = '#4b5563';
      context.font = '13px Arial';
      context.fillText(card.detail, x + 18, y + 92, cardWidth - 36);
    });

    return canvas;
  }

  function buildPeriodTopFiveBreakoutCanvas(host, payload) {
    const canvas = addCanvas(host, 660, 1100);
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const headings = buildPeriodCoverHeadings(payload);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    canvas._pdfPlacement = { yShift: -92 };

    const topFive = payload.rankingAccounts.slice(0, 5);
    const others = payload.rankingAccounts.slice(5);
    const othersTotal = others.reduce((accumulator, item) => accumulator + item.total, 0);
    const maxVisibleOthers = 10;
    const visibleOthers = others.slice(0, maxVisibleOthers);
    const hiddenOthers = Math.max(others.length - visibleOthers.length, 0);
    const splitOthersInColumns = visibleOthers.length > 5;
    const leftX = 48;
    const leftWidth = 602;
    const rightX = 690;
    const rightWidth = width - rightX - 48;
    const barHeight = 24;
    const rowGap = 30;
    const startY = 94;
    const labelGap = 12;
    const maxValue = Math.max(1, ...topFive.map((item) => item.total));

    context.fillStyle = '#111827';
    context.font = 'bold 20px Arial';
    context.fillText(headings.topFiveTitle, leftX, 34);
    context.font = '13px Arial';
    context.fillStyle = '#4b5563';
    context.fillText('Gráfico mensal, ranking das principais contas e detalhamento das demais.', leftX, 56);

    topFive.forEach((item, index) => {
      const rowY = startY + index * (barHeight + rowGap);
      const barWidth = Math.round((item.total / maxValue) * (leftWidth - 150));
      const share = payload.totalPeriodo > 0 ? (item.total / payload.totalPeriodo) * 100 : 0;

      context.fillStyle = '#111827';
      context.font = 'bold 13px Arial';
      context.fillText(`${index + 1}. ${item.name}`, leftX, rowY - labelGap);

      context.fillStyle = '#e5e7eb';
      drawRoundedRect(context, leftX, rowY, leftWidth - 150, barHeight, 10);
      context.fill();

      context.fillStyle = index === 0 ? '#ec4899' : '#22d3ee';
      drawRoundedRect(context, leftX, rowY, barWidth, barHeight, 10);
      context.fill();

      context.fillStyle = '#111827';
      context.font = '13px Arial';
      context.fillText(`${formatBrlValue(item.total)} | ${share.toFixed(1).replace('.', ',')}%`, leftX + leftWidth - 138, rowY + 18);
    });

    context.fillStyle = '#ffffff';
    context.strokeStyle = '#d1d5db';
    context.lineWidth = 2;
    drawRoundedRect(context, rightX, 74, rightWidth, 276, 16);
    context.fill();
    context.stroke();

    context.fillStyle = '#111827';
    context.font = 'bold 16px Arial';
    context.fillText('Outras contas', rightX + 20, 102);
    context.font = '12px Arial';
    context.fillStyle = '#4b5563';
    context.fillText(`${others.length} conta${others.length === 1 ? '' : 's'} fora do Top 5`, rightX + 20, 124);
    context.fillText(`Total: ${formatBrlValue(othersTotal)}`, rightX + 20, 144);

    const othersFontSize = splitOthersInColumns ? 11 : 12;
    const othersLineHeight = splitOthersInColumns ? 18 : 22;
    const othersColumnGap = splitOthersInColumns ? 16 : 0;
    const othersInnerWidth = rightWidth - 40;
    const othersColumnWidth = splitOthersInColumns
      ? Math.floor((othersInnerWidth - othersColumnGap) / 2)
      : othersInnerWidth;
    const rowsPerColumn = splitOthersInColumns ? Math.ceil(visibleOthers.length / 2) : visibleOthers.length;

    visibleOthers.forEach((item, index) => {
      const columnIndex = splitOthersInColumns ? Math.floor(index / rowsPerColumn) : 0;
      const rowIndex = splitOthersInColumns ? (index % rowsPerColumn) : index;
      const columnX = rightX + 20 + columnIndex * (othersColumnWidth + othersColumnGap);
      const rowY = 176 + rowIndex * othersLineHeight;
      const valueWidth = splitOthersInColumns ? 92 : 104;
      const nameMaxWidth = othersColumnWidth - valueWidth - 10;

      context.fillStyle = '#111827';
      context.font = `${othersFontSize}px Arial`;
      context.fillText(
        truncateCanvasText(context, item.name, nameMaxWidth),
        columnX,
        rowY
      );
      context.textAlign = 'right';
      context.fillText(
        formatBrlValue(item.total),
        columnX + othersColumnWidth,
        rowY
      );
      context.textAlign = 'left';
    });

    if (!others.length) {
      context.fillStyle = '#6b7280';
      context.fillText('Sem outras contas além do Top 5 neste recorte.', rightX + 20, 188);
    }

    if (hiddenOthers > 0) {
      context.fillStyle = '#6b7280';
      context.font = '11px Arial';
      context.fillText(`+ ${hiddenOthers} conta${hiddenOthers === 1 ? '' : 's'} fora da capa`, rightX + 20, 334);
    }

    drawPeriodBalanceSummaryCard(context, payload, {
      x: (width - 760) / 2,
      y: height - 272,
      width: 760,
      height: 228,
    });

    return canvas;
  }

  function buildDefaultPeriodCoverCanvases(host, payload) {
    const canvases = [];

    const pizzaCanvas = addCanvas(host, 560, 900);
    renderPizzaMensalStrict(
      pizzaCanvas,
      { labels: payload.contasAll, valores: payload.valoresAll },
      payload.rotPeriodo
    );
    if (pizzaCanvas._chart && globalObject.ChartFeatures?.applyPdfTheme) {
      globalObject.ChartFeatures.applyPdfTheme(pizzaCanvas._chart);
      pizzaCanvas._chart.update('none');
    }
    forceWhiteBackground(pizzaCanvas);
    canvases.push(pizzaCanvas);

    const totalCanvas = addCanvas(host, 80, 900);
    const context2d = totalCanvas.getContext('2d');
    context2d.fillStyle = '#ffffff';
    context2d.fillRect(0, 0, totalCanvas.width, totalCanvas.height);
    context2d.fillStyle = '#111827';
    context2d.font = '600 18px Inter, Arial, sans-serif';
    context2d.textAlign = 'center';
    context2d.textBaseline = 'middle';
    context2d.fillText(
      `Total do período: ${formatBrlValue(payload.totalPeriodo)}`,
      totalCanvas.width / 2,
      totalCanvas.height / 2
    );
    canvases.push(totalCanvas);

    return canvases;
  }

  function buildVariantBPeriodCoverCanvases(host, payload) {
    return [
      buildPeriodTrendCoverCanvas(host, payload),
      buildPeriodTopFiveBreakoutCanvas(host, payload),
    ];
  }

  async function appendPeriodDetailCanvases(host, canvases, payload) {
    const contasLinhasBase = payload.configuredChartAccounts.length
      ? payload.configuredChartAccounts
      : payload.contasAll;
    const contasLinhas = contasLinhasBase.slice(0, 7);
    const accountTotalsByMonth = buildMonthAccountTotalsLookup(payload.monthsList, payload.itemsByMonth);
    const monthLabels = payload.monthsList.map(({ y, m }) => `${String(m).padStart(2, '0')}/${y}`);

    for (const conta of contasLinhas) {
      const valores = buildAccountTimelineValues(payload.monthsList, accountTotalsByMonth, conta);

      const pontosNaoZero = valores.filter((value) => value > 0.001).length;
      if (pontosNaoZero < 1) continue;

      const lineCanvas = addCanvas(host, 600, 1100);
      renderLinhaPeriodoLocal(lineCanvas, {
        nome: conta,
        meses: monthLabels,
        valores,
      });
      await flushRender();
      canvases.push(lineCanvas);
    }

    const listingMarkersInserted = hasItemsInPeriodMonths(payload.monthsList, payload.itemsByMonth);

    if (listingMarkersInserted) {
      canvases.push(buildPageBreakMarker());
    }

    payload.monthsList.forEach(({ y, m }) => {
      const monthItems = payload.itemsByMonth.get(periodMonthKey(y, m)) || [];
      if (!monthItems.length) return;

      canvases.push(buildPageBreakMarker());
      buildPeriodTableCanvases(host, {
        titulo: `Contas pagas — ${String(m).padStart(2, '0')}/${y}`,
        rows: buildRowsByPayer(monthItems),
      }).forEach((canvas) => canvases.push(canvas));
    });
  }

  async function buildMonthlyCoverPayload({ year, month, items, monthlyStats, configuredChartAccounts }) {
    const start = shiftYearMonth(year, month, -12);
    const monthsList = makeMonthsList(start.year, start.month, year, month);
    const { itemsByMonth, allItems } = await loadPeriodSource(monthsList);
    const aggregate = buildPeriodAggregateData(monthsList, itemsByMonth, allItems);
    const rotMes = `${monthNamePT(month)} / ${year}`;
    const rankingAccounts = groupTotalsByField(items, 'nome');

    return {
      ...aggregate,
      monthsList,
      itemsByMonth,
      allItems,
      coverScope: 'month',
      coverLabel: rotMes,
      rotPeriodo: rotMes,
      highlightLastMonth: true,
      rankingAccounts,
      totalPeriodo: monthlyStats.totalMes,
      topAccount: rankingAccounts[0] || null,
      configuredChartAccounts,
      balanceSummary: {
        totalPeriodo: monthlyStats.totalMes,
        totalDividida: monthlyStats.totalDividida,
        porPagador: monthlyStats.porPagador,
        porPagadorDividida: monthlyStats.porPagadorDividida,
        deltaTexto: monthlyStats.deltaTexto,
      },
    };
  }

  async function buildPeriodCoverPayload({
    startYear,
    startMonth,
    endYear,
    endMonth,
    configuredChartAccounts,
    selectedMonthsList,
    selectedItemsByMonth,
    selectedAllItems,
    selectedAggregate,
  }) {
    const rotPeriodo = `${String(startMonth).padStart(2, '0')}/${startYear} a ${String(endMonth).padStart(2, '0')}/${endYear}`;
    const needContextMonths = Math.max(13 - selectedMonthsList.length, 0);
    const coverStart = needContextMonths > 0
      ? shiftYearMonth(startYear, startMonth, -needContextMonths)
      : { year: startYear, month: startMonth };
    const coverMonthsList = makeMonthsList(coverStart.year, coverStart.month, endYear, endMonth);

    let coverAggregate = selectedAggregate;
    if (coverMonthsList.length !== selectedMonthsList.length) {
      const { itemsByMonth: coverItemsByMonth, allItems: coverAllItems } = await loadPeriodSource(coverMonthsList);
      coverAggregate = buildPeriodAggregateData(coverMonthsList, coverItemsByMonth, coverAllItems);
    }

    const selectedKeys = new Set(
      selectedMonthsList.map(({ y, m }) => periodMonthKey(y, m))
    );

    return {
      ...selectedAggregate,
      monthlyTotals: coverAggregate.monthlyTotals.map((item) => ({
        ...item,
        isSelected: selectedKeys.has(periodMonthKey(item.year, item.month)),
      })),
      monthsList: selectedMonthsList,
      itemsByMonth: selectedItemsByMonth,
      allItems: selectedAllItems,
      balanceSummary: buildPeriodBalanceSummaryStats(selectedAllItems),
      coverScope: 'period',
      coverLabel: rotPeriodo,
      highlightLastMonth: false,
      rotPeriodo,
      configuredChartAccounts,
    };
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
      globalObject.ChartFeatures?.setupChartDefaults?.();

      const monthlyCoverPayload = await buildMonthlyCoverPayload({
        year,
        month,
        items,
        monthlyStats,
        configuredChartAccounts,
      });

      canvases.push(buildMonthlyTrendCoverCanvas(host, monthlyCoverPayload));
      canvases.push(buildPeriodTopFiveBreakoutCanvas(host, monthlyCoverPayload));

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
      coverVariant = 'cover-v2',
    } = context;

    const monthsList = makeMonthsList(startYear, startMonth, endYear, endMonth);
    if (!monthsList.length) {
      alert('Período inválido.');
      return;
    }

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const host = createOffscreenHost({ width: '1100px' });
    const canvases = [];

    try {
      globalObject.__PDF_MODE = true;
      globalObject.ChartFeatures?.setupChartDefaults?.();

      if (coverVariant !== 'legacy') {
        const { itemsByMonth, allItems } = await loadPeriodSource(monthsList);
        const aggregate = buildPeriodAggregateData(monthsList, itemsByMonth, allItems);
        const periodPayload = await buildPeriodCoverPayload({
          startYear,
          startMonth,
          endYear,
          endMonth,
          configuredChartAccounts,
          selectedMonthsList: monthsList,
          selectedItemsByMonth: itemsByMonth,
          selectedAllItems: allItems,
          selectedAggregate: aggregate,
        });

        if (coverVariant === 'cover-v2') {
          canvases.push(...buildVariantBPeriodCoverCanvases(host, periodPayload));
        } else {
          canvases.push(...buildDefaultPeriodCoverCanvases(host, periodPayload));
        }

        canvases.push(buildPageBreakMarker());
        await appendPeriodDetailCanvases(host, canvases, periodPayload);

        canvases.forEach((canvas) => {
          if (!canvas?._forcePageBreak) forceWhiteBackground(canvas);
        });

        appendCanvasesToDocument(doc, canvases, { margin: 28, gap: 24 });
        doc.save(`relatorio_${String(startMonth).padStart(2, '0')}_${startYear}_a_${String(endMonth).padStart(2, '0')}_${endYear}.pdf`);
        return;
      }

      const { itemsByMonth, allItems } = await loadPeriodSource(monthsList);
      const aggregate = buildPeriodAggregateData(monthsList, itemsByMonth, allItems);
      const accountTotalsByMonth = buildMonthAccountTotalsLookup(monthsList, itemsByMonth);
      const contasAll = aggregate.contasAll;
      const valoresAll = aggregate.valoresAll;

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

      const totalPeriodo = aggregate.totalPeriodo;
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
      const monthLabels = monthsList.map(({ y, m }) => `${String(m).padStart(2, '0')}/${y}`);

      for (const conta of contasLinhas) {
        const valores = buildAccountTimelineValues(monthsList, accountTotalsByMonth, conta);

        const pontosNaoZero = valores.filter((value) => value > 0.001).length;
        if (pontosNaoZero < 1) continue;

        const lineCanvas = addCanvas(host, '600px', '1100px');
        renderLinhaPeriodoLocal(lineCanvas, {
          nome: conta,
          meses: monthLabels,
          valores,
        });
        await flushRender();
        forceWhiteBackground(lineCanvas);
        canvases.push(lineCanvas);
      }

      const listingMarkersInserted = hasItemsInPeriodMonths(monthsList, itemsByMonth);

      if (listingMarkersInserted) {
        canvases.push(buildPageBreakMarker());
      }

      for (const { y, m } of monthsList) {
        const monthItems = itemsByMonth.get(periodMonthKey(y, m)) || [];
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
