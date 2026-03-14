(function attachReportsWorkflows(globalObject) {
  const {
    monthLabel,
    monthNamePT,
    makeMonthsList,
    normalizeContaName,
    parseBRLnum,
    sumByConta,
  } = globalObject.ReportsHelpers;

  async function fetchMes(year, month) {
    return globalObject.DataAdapter.fetchMes(year, month);
  }

  function exportCanvasesTwoPerPage(canvases, filename = 'graficos.pdf', options = {}) {
    const { jsPDF } = globalObject.jspdf || {};
    if (!jsPDF) {
      alert('jsPDF não carregado.');
      return;
    }

    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = options.margin ?? 28;
    const gap = options.gap ?? 24;
    const slotHeight = (pageHeight - margin * 2 - gap) / 2;

    canvases.forEach((canvas, index) => {
      if (index > 0 && index % 2 === 0) doc.addPage();
      const slotIndex = index % 2;
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
      if (!links.length) return;

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
    });

    doc.save(filename);
  }

  async function listDistinctAccountsForRange({
    range,
    year,
    month,
    startYear,
    startMonth,
    endYear,
    endMonth,
  }) {
    if (range === 'mes') {
      const items = await fetchMes(year, month);
      return Array.from(new Set((items || []).map((item) => item.nome)));
    }

    const months = makeMonthsList(startYear, startMonth, endYear, endMonth);
    const responses = await Promise.all(months.map(({ y, m }) => fetchMes(y, m)));
    const accounts = new Set();

    responses.forEach((items) => {
      (items || []).forEach((item) => accounts.add(item.nome));
    });

    return Array.from(accounts);
  }

  function normalizeComparativoType(range, currentType) {
    if (range === 'mes' && currentType === 'linhas') return 'pizza';
    if (range === 'periodo' && currentType === 'barras') return 'linhas';
    return currentType;
  }

  function filterSelectionToAvailableAccounts(selection, availableAccounts) {
    const available = new Set(availableAccounts || []);
    return new Set(Array.from(selection || []).filter((name) => available.has(name)));
  }

  async function renderComparativoPreview({
    content,
    range,
    type,
    year,
    month,
    startYear,
    startMonth,
    endYear,
    endMonth,
    selectedAccounts,
  }) {
    if (!content) return;

    globalObject.ReportsDom.clearComparativoPreview(content);
    const { addNote, addCanvas } = globalObject.ReportsDom.createComparativoPreviewHost(content);
    const contasSel = Array.from(selectedAccounts || []);

    globalObject.ChartFeatures?.setupChartDefaults?.();

    if (type === 'pizza') {
      if (range === 'mes') {
        const currentItems = await fetchMes(year, month);
        const values = sumByConta(currentItems, contasSel);
        const canvas = addCanvas();
        globalObject.ChartFeatures.renderPizzaMensal(
          canvas,
          { labels: contasSel, valores: values },
          monthLabel(year, month)
        );
        return;
      }

      const months = makeMonthsList(startYear, startMonth, endYear, endMonth);
      const responses = await Promise.all(months.map(({ y, m }) => fetchMes(y, m)));
      const totalValues = new Array(contasSel.length).fill(0);

      responses.forEach((items) => {
        const values = sumByConta(items, contasSel);
        values.forEach((value, index) => {
          totalValues[index] += value;
        });
      });

      const canvas = addCanvas();
      const periodLabel = `${monthNamePT(startMonth)} ${startYear} \u2013 ${monthNamePT(endMonth)} ${endYear}`;
      globalObject.ChartFeatures.renderPizzaMensal(
        canvas,
        { labels: contasSel, valores: totalValues },
        periodLabel
      );
      return;
    }

    if (type === 'linhas' && range === 'periodo') {
      const months = makeMonthsList(startYear, startMonth, endYear, endMonth);
      const labels = months.map(({ y, m }) => `${monthNamePT(m).slice(0, 3)}/${y}`);
      const responses = await Promise.all(months.map(({ y, m }) => fetchMes(y, m)));

      let plotted = 0;
      contasSel.forEach((conta) => {
        const target = normalizeContaName(conta);
        const series = responses.map((items) =>
          (items || [])
            .filter((item) => normalizeContaName(item.nome) === target)
            .reduce((accumulator, item) => accumulator + parseBRLnum(item.valor), 0)
        );

        const points = series.filter((value) => value > 0).length;
        if (points >= 2) {
          const canvas = addCanvas();
          globalObject.ChartFeatures.renderLinhaContaPeriodo(
            canvas,
            { nome: conta, meses: labels, valores: series }
          );
          plotted += 1;
        } else {
          addNote(`\u26a0\ufe0f "${conta}": sem reincidencia suficiente no periodo para linhas.`);
        }
      });

      if (plotted === 0) {
        addNote('Nenhuma conta possui dados em 2 ou mais meses no periodo selecionado.');
      }
      return;
    }

    if (type === 'barras' && range === 'mes') {
      const currentItems = await fetchMes(year, month);
      const currentValues = sumByConta(currentItems, contasSel);
      const currentLabel = monthLabel(year, month);

      const previousMonth = month > 1 ? month - 1 : 12;
      const previousYear = month > 1 ? year : (year - 1);
      const previousItems = await fetchMes(previousYear, previousMonth);
      const previousValues = sumByConta(previousItems, contasSel);
      const hasPrevious = previousValues.some((value) => value > 0);

      const previousYearItems = await fetchMes(year - 1, month);
      const previousYearValues = sumByConta(previousYearItems, contasSel);
      const hasPreviousYear = previousYearValues.some((value) => value > 0);

      if (hasPrevious) {
        const previousCanvas = addCanvas('360px');
        globalObject.ChartFeatures.renderBarrasComparativas(
          previousCanvas,
          { labels: contasSel, atual: currentValues, comparado: previousValues },
          'anterior',
          { atual: currentLabel, comparado: monthLabel(previousYear, previousMonth) }
        );
      } else {
        addNote('\u2139\ufe0f Sem conta correspondente no mes anterior para as selecoes atuais.');
      }

      if (hasPreviousYear) {
        const previousYearCanvas = addCanvas('360px');
        globalObject.ChartFeatures.renderBarrasComparativas(
          previousYearCanvas,
          { labels: contasSel, atual: currentValues, comparado: previousYearValues },
          'anoAnterior',
          { atual: currentLabel, comparado: monthLabel(year - 1, month) }
        );
      } else {
        addNote('\u2139\ufe0f Sem conta correspondente no mesmo mes do ano anterior para as selecoes atuais.');
      }

      if (!hasPrevious && !hasPreviousYear) {
        addNote('Nenhuma base comparavel encontrada.');
      }
      return;
    }

    alert('Combinacao de alcance e tipo nao suportada.');
  }

  function downloadComparativoPng(filename = 'grafico.png') {
    const firstCanvas = document.querySelector('#cmp-chart canvas');
    if (!firstCanvas) {
      alert('Gere um grafico antes!');
      return;
    }

    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = firstCanvas.toDataURL('image/png');
    anchor.click();
  }

  function downloadComparativoPdf(filename = 'graficos.pdf') {
    const wrapper = document.getElementById('cmp-chart');
    const canvases = Array.from(wrapper?.querySelectorAll('canvas') || []);
    if (!canvases.length) {
      alert('Nenhum grafico gerado.');
      return;
    }

    try {
      globalObject.__PDF_MODE = true;
      canvases.forEach((canvas) => {
        const chart = canvas._chart;
        if (chart && globalObject.ChartFeatures?.applyPdfTheme) {
          globalObject.ChartFeatures.applyPdfTheme(chart);
        }
      });

      exportCanvasesTwoPerPage(canvases, filename, { margin: 28, gap: 24 });
    } finally {
      globalObject.__PDF_MODE = false;
      canvases.forEach((canvas) => canvas._chart?.update('none'));
    }
  }

  globalObject.ReportsWorkflows = {
    listDistinctAccountsForRange,
    normalizeComparativoType,
    filterSelectionToAvailableAccounts,
    renderComparativoPreview,
    downloadComparativoPng,
    downloadComparativoPdf,
  };
})(window);
