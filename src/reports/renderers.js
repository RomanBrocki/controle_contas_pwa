(function attachReportsRenderers(globalObject) {
  function appTextColor() {
    return globalObject.ReportsDom?.appTextColor?.() || '#e5e7eb';
  }

  function computeLineScaleBounds(values) {
    const numericValues = (values || [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (!numericValues.length) {
      return { min: 0, max: 1 };
    }

    const minValue = Math.min(...numericValues);
    const maxValue = Math.max(...numericValues);
    const average = numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
    const range = maxValue - minValue;
    const reference = Math.max(Math.abs(average), Math.abs(maxValue), 1);

    if (range <= 0.000001) {
      const halfBand = Math.max(reference * 0.06, 1);
      return {
        min: Math.max(0, average - halfBand),
        max: average + halfBand,
      };
    }

    const shouldAnchorAtZero = minValue <= 0 || (range / reference) >= 0.35;
    if (shouldAnchorAtZero) {
      const topPadding = Math.max(range * 0.14, reference * 0.06, 1);
      return {
        min: 0,
        max: maxValue + topPadding,
      };
    }

    const center = (minValue + maxValue) / 2;
    const halfBand = Math.max((range * 1.35) / 2, reference * 0.05, 1);
    return {
      min: Math.max(0, center - halfBand),
      max: center + halfBand,
    };
  }

  function buildPizzaSlices(labels, valores, maxPrimarySlices = 10) {
    const entries = [];

    for (let index = 0; index < (labels?.length ?? 0); index += 1) {
      const value = Number(valores?.[index] ?? 0);
      if (Number.isFinite(value) && value > 0) {
        entries.push({
          name: String(labels[index] ?? '').trim(),
          value,
        });
      }
    }

    entries.sort((a, b) => b.value - a.value);

    if (entries.length <= maxPrimarySlices) {
      return {
        entries,
        overflowEntries: [],
      };
    }

    const primaryEntries = entries.slice(0, maxPrimarySlices);
    const overflowEntries = entries.slice(maxPrimarySlices);
    const overflowValue = overflowEntries.reduce(
      (accumulator, entry) => accumulator + entry.value,
      0
    );

    return {
      entries: [...primaryEntries, { name: 'Outros', value: overflowValue }],
      overflowEntries,
    };
  }

  function wrapTextByLength(prefix, values, maxLineLength = 92) {
    const lines = [];
    let currentLine = prefix;

    values.forEach((value, index) => {
      const separator = index === 0 ? '' : ', ';
      const nextChunk = `${separator}${value}`;

      if ((currentLine + nextChunk).length > maxLineLength && currentLine !== prefix) {
        lines.push(currentLine);
        currentLine = value;
      } else {
        currentLine += nextChunk;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  function renderPizzaMensalStrict(canvas, { labels, valores }, titulo) {
    const { entries, overflowEntries } = buildPizzaSlices(labels, valores, 10);
    const labs = entries.map((entry) => entry.name);
    const dataVals = entries.map((entry) => entry.value);

    const total = dataVals.reduce((accumulator, value) => accumulator + value, 0) || 1;
    const formatCurrency = (value) =>
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const nameLabels = labs.slice();
    const legendLabels = labs.map((name, index) => `${name} \u2014 ${formatCurrency(Number(dataVals[index] || 0))}`);
    const otherAccountsLines = overflowEntries.length
      ? wrapTextByLength(
          `Outros agrega ${overflowEntries.length} conta${overflowEntries.length > 1 ? 's' : ''}: `,
          overflowEntries.map((entry) => entry.name)
        )
      : [];

    const Chart = globalObject.Chart;
    const Datalabels = globalObject.ChartDataLabels;

    if (Chart && Datalabels && !Chart.registry.plugins.get('datalabels')) {
      try { Chart.register(Datalabels); } catch (error) {}
    }

    const pieOutlabels = {
      id: 'pieOutlabels',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea } = chart;
        const dataset = chart.data.datasets?.[0];
        const meta = chart.getDatasetMeta(0);
        if (!dataset || !meta) return;

        const values = dataset.data || [];
        const totalLocal = values.reduce((accumulator, value) => accumulator + (Number(value) || 0), 0) || 1;

        const textColor = (globalObject.__PDF_MODE
          ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
          : appTextColor()).trim() || '#333';
        const lineColor = (globalObject.__PDF_MODE
          ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-line-pdf') || '#4b5563')
          : 'rgba(255,255,255,.45)').trim() || '#666';

        const font = '12px Inter, Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif';
        const right = [];
        const left = [];

        meta.data.forEach((arc, index) => {
          const value = Number(values[index]) || 0;
          if (!value) return;

          const angle = (arc.startAngle + arc.endAngle) / 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const radius = arc.outerRadius;
          const x0 = arc.x + cos * radius;
          const y0 = arc.y + sin * radius;

          const percent = totalLocal ? value / totalLocal : 0;
          const extra = percent < 0.08 ? 16 : 10;
          const x1 = arc.x + cos * (radius + extra);
          const y1 = arc.y + sin * (radius + extra);

          const tick = 18;
          const sideRight = cos >= 0;
          const x2 = x1 + (sideRight ? tick : -tick);
          const y2 = y1;

          (sideRight ? right : left).push({
            x0,
            y0,
            x1,
            y1,
            x2,
            y2,
            sideRight,
            text: nameLabels[index] || '',
          });
        });

        const resolve = (items) => {
          if (items.length <= 1) return;

          const minGap = 14;
          const topLimit = chartArea.top + 6;
          const bottomLimit = chartArea.bottom - 6;

          items.sort((a, b) => a.y2 - b.y2);
          items[0].y2 = Math.max(items[0].y2, topLimit);

          for (let index = 1; index < items.length; index += 1) {
            items[index].y2 = Math.max(items[index].y2, items[index - 1].y2 + minGap);
          }

          if (items[items.length - 1].y2 > bottomLimit) {
            items[items.length - 1].y2 = bottomLimit;
            for (let index = items.length - 2; index >= 0; index -= 1) {
              items[index].y2 = Math.min(items[index].y2, items[index + 1].y2 - minGap);
            }
            items[0].y2 = Math.max(items[0].y2, topLimit);
          }
        };

        resolve(right);
        resolve(left);

        ctx.save();
        ctx.font = font;
        ctx.fillStyle = textColor;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 2;

        const drawItem = (item) => {
          ctx.beginPath();
          ctx.moveTo(item.x0, item.y0);
          ctx.lineTo(item.x1, item.y2);
          ctx.lineTo(item.x2, item.y2);
          ctx.stroke();

          ctx.textAlign = item.sideRight ? 'left' : 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(item.text, item.x2 + (item.sideRight ? 6 : -6), item.y2);
        };

        right.forEach(drawItem);
        left.forEach(drawItem);
        ctx.restore();
      },
    };

    if (canvas._chart) {
      try { canvas._chart.destroy(); } catch (error) {}
    }

    const context = canvas.getContext('2d');
    const chart = new Chart(context, {
      type: 'pie',
      data: {
        labels: legendLabels,
        datasets: [{
          data: dataVals,
          backgroundColor: [
            '#22d3ee', '#3b82f6', '#10b981', '#facc15', '#f472b6',
            '#a855f7', '#f97316', '#ef4444', '#94a3b8', '#14b8a6',
            '#64748b',
          ],
          borderColor: globalObject.__PDF_MODE
            ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-line-pdf') || '#0e1218')
            : '#0e1218',
          borderWidth: 1,
          offset: (ctx) => {
            const value = Number(ctx.raw) || 0;
            const percent = total ? value / total : 0;
            return percent < 0.08 ? 12 : 4;
          },
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        radius: '84%',
        layout: { padding: { top: 18, right: 64, bottom: 18, left: 64 } },
        plugins: {
          title: {
            display: true,
            text: `Gastos por conta \u2014 ${titulo}`,
            font: { size: 20, weight: 'bold' },
            padding: { top: 8, bottom: 16 },
            color: globalObject.__PDF_MODE
              ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
              : appTextColor(),
          },
          subtitle: {
            display: otherAccountsLines.length > 0,
            text: otherAccountsLines,
            position: 'bottom',
            align: 'start',
            padding: { top: 14, bottom: 0 },
            font: { size: 11, weight: '500', lineHeight: 1.25 },
            color: globalObject.__PDF_MODE
              ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
              : appTextColor(),
          },
          tooltip: { enabled: false },
          datalabels: {
            color: '#fff',
            display: (ctx) => {
              const values = ctx.chart?.data?.datasets?.[0]?.data || [];
              const sum = values.reduce((accumulator, value) => accumulator + (Number(value) || 0), 0);
              const value = Number(ctx.dataset.data[ctx.dataIndex]) || 0;
              const percent = sum ? value / sum : 0;
              return value > 0 && percent >= 0.06;
            },
            formatter: (value, ctx) => {
              const values = ctx.chart?.data?.datasets?.[0]?.data || [];
              const sum = values.reduce((accumulator, item) => accumulator + (Number(item) || 0), 0);
              const numericValue = Number(value) || 0;
              const percent = sum ? numericValue / sum : 0;
              return `${(percent * 100).toFixed(percent >= 0.1 ? 0 : 1).replace('.', ',')}%`;
            },
            font: { size: 12, weight: 'bold', lineHeight: 1.1 },
            textAlign: 'center',
            offset: 2,
          },
          legend: {
            position: 'bottom',
            labels: {
              color: appTextColor(),
              font: { size: 12 },
              usePointStyle: true,
              pointStyle: 'circle',
              boxWidth: 10,
              boxHeight: 10,
            },
          },
        },
        animation: false,
        events: [],
      },
      plugins: [globalObject.ChartDataLabels, pieOutlabels].filter(Boolean),
    });

    canvas._chart = chart;
    return chart;
  }

  function renderBarrasMensalLocal(canvas, payload, opts = {}) {
    const { labels, atual, comparado, allowList } = payload;
    const originalWidth = canvas.width || 1100;
    const originalHeight = canvas.height || 560;
    const context = canvas.getContext('2d');

    const css = getComputedStyle(document.documentElement);
    const labelColor = (
      (globalObject.__PDF_MODE
        ? css.getPropertyValue('--chart-text-pdf')
        : css.getPropertyValue('--chart-label-text')) ||
      '#111827'
    ).trim();

    const theme = {
      bg: '#ffffff',
      text: labelColor || '#111827',
      atual: 'rgba(59,130,246,0.85)',
      comparado: 'rgba(148,163,184,0.7)',
    };

    const allowSet = allowList ? new Set(allowList) : null;
    const rows = labels
      .map((name, index) => ({
        name,
        a: Number(atual[index] ?? 0),
        b: Number(comparado?.[index] ?? 0),
      }))
      .filter((row) => !allowSet || allowSet.has(row.name));

    const margin = { t: 56, r: 40, b: 40, l: 150 };
    const barHeight = 18;
    const innerGap = 10;
    const groupGap = 20;
    const legendHeight = 26;
    const contentHeight = rows.length
      ? rows.length * (barHeight * 2 + innerGap + groupGap) - groupGap
      : 0;
    const totalHeight = margin.t + legendHeight + 16 + contentHeight + margin.b;

    canvas.width = originalWidth;
    canvas.height = Math.max(originalHeight, totalHeight);

    function roundRect(ctx, x, y, width, height, radius = 8) {
      if (width <= 0 || height <= 0) return;

      const rr = Math.min(radius, Math.abs(height) / 2, Math.abs(width) / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + width, y, x + width, y + height, rr);
      ctx.arcTo(x + width, y + height, x, y + height, rr);
      ctx.arcTo(x, y + height, x, y, rr);
      ctx.arcTo(x, y, x + width, y, rr);
      ctx.closePath();
    }

    const formatCurrency = (value) =>
      `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

    context.fillStyle = theme.bg;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const titulo = opts.title || `Comparativo \u2014 ${opts.rotAtuais || 'M\u00eas atual'} vs ${opts.rotComparado || 'Comparado'}`;
    context.fillStyle = theme.text;
    context.font = '700 18px Inter, Roboto, Arial, sans-serif';
    context.textAlign = 'left';
    context.textBaseline = 'alphabetic';
    context.fillText(titulo, margin.l, margin.t - 18);

    const legendY = margin.t + 2;
    context.font = '12px Inter, Roboto, Arial, sans-serif';
    context.fillStyle = theme.atual;
    context.fillRect(margin.l, legendY, 18, 10);
    context.fillStyle = theme.text;
    context.fillText(` ${opts.rotAtuais || 'M\u00eas atual'}`, margin.l + 24, legendY + 10);

    const secondOffset = margin.l + 180;
    context.fillStyle = theme.comparado;
    context.fillRect(secondOffset, legendY, 18, 10);
    context.fillStyle = theme.text;
    context.fillText(` ${opts.rotComparado || 'Comparado'}`, secondOffset + 24, legendY + 10);

    const x0 = margin.l;
    const y0 = margin.t + legendHeight + 16;
    const plotWidth = Math.max(1, canvas.width - margin.l - margin.r);

    context.strokeStyle = theme.text;
    context.lineWidth = 1.2;
    context.beginPath();
    context.moveTo(x0, y0 - 6);
    context.lineTo(x0, y0 + contentHeight + 6);
    context.stroke();

    const maxValue = Math.max(1, ...rows.map((row) => Math.max(row.a, row.b)));
    const scaleX = (value) => (value / maxValue) * plotWidth;

    context.textBaseline = 'middle';
    context.fillStyle = theme.text;
    context.font = '13px Inter, Roboto, Arial, sans-serif';

    let currentY = y0;
    rows.forEach((row) => {
      context.textAlign = 'right';
      context.fillStyle = theme.text;
      context.fillText(row.name, x0 - 10, currentY + barHeight + innerGap / 2);

      const comparedWidth = scaleX(row.b);
      const currentWidth = scaleX(row.a);

      context.fillStyle = theme.comparado;
      roundRect(context, x0, currentY, comparedWidth, barHeight, 8);
      context.fill();

      context.fillStyle = theme.atual;
      roundRect(context, x0, currentY + barHeight + innerGap, currentWidth, barHeight, 8);
      context.fill();

      const threshold = 0.75;
      const comparedRatio = comparedWidth / plotWidth;
      const currentRatio = currentWidth / plotWidth;
      context.font = '600 12px Inter, Roboto, Arial, sans-serif';

      if (comparedWidth > 0) {
        if (comparedRatio >= threshold) {
          context.fillStyle = '#ffffff';
          context.textAlign = 'right';
          context.fillText(formatCurrency(row.b), x0 + comparedWidth - 6, currentY + barHeight / 2);
        } else {
          context.fillStyle = theme.text;
          context.textAlign = 'left';
          context.fillText(formatCurrency(row.b), x0 + comparedWidth + 6, currentY + barHeight / 2);
        }
      }

      if (currentWidth > 0) {
        const currentBarY = currentY + barHeight + innerGap + barHeight / 2;
        if (currentRatio >= threshold) {
          context.fillStyle = '#ffffff';
          context.textAlign = 'right';
          context.fillText(formatCurrency(row.a), x0 + currentWidth - 6, currentBarY);
        } else {
          context.fillStyle = theme.text;
          context.textAlign = 'left';
          context.fillText(formatCurrency(row.a), x0 + currentWidth + 6, currentBarY);
        }
      }

      currentY += (barHeight * 2 + innerGap + groupGap);
    });
  }

  function renderLinhaPeriodoLocal(canvas, { nome, meses, valores }) {
    const Chart = globalObject.Chart;
    const Datalabels = globalObject.ChartDataLabels;
    if (!Chart) {
      console.error('Chart.js nao carregado para linhas.');
      return null;
    }

    if (canvas._chart) {
      try { canvas._chart.destroy(); } catch (error) {}
    }

    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const media = (
      valores.reduce((accumulator, value) => accumulator + value, 0) /
      Math.max(1, valores.length)
    ) || 0;
    const scaleBounds = computeLineScaleBounds(valores);
    const mediaArr = new Array(valores.length).fill(media);
    const chartInsetX = Math.max(28, Math.round((canvas.width || 1100) * 0.05));

    const inicio = meses[0];
    const fim = meses[meses.length - 1];
    const titulo = `Comparativo de conta '${nome}' \u2014 ${inicio} a ${fim}`;
    const mediaTxt = `M\u00e9dia da conta: R$ ${media.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    const xBaselinePlugin = {
      id: 'xBaseline',
      afterDraw(chart) {
        const { ctx, chartArea } = chart;
        if (!chartArea) return;

        ctx.save();
        ctx.strokeStyle = globalObject.__PDF_MODE
          ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-line-pdf') || '#4b5563')
          : 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(chartArea.left, chartArea.bottom);
        ctx.lineTo(chartArea.right, chartArea.bottom);
        ctx.stroke();
        ctx.restore();
      },
    };

    if (Datalabels && !Chart.registry.plugins.get('datalabels')) {
      try { Chart.register(Datalabels); } catch (error) {}
    }

    const chart = new Chart(context, {
      type: 'line',
      data: {
        labels: meses,
        datasets: [
          {
            label: nome,
            data: valores,
            borderColor: 'rgba(59,130,246,1)',
            backgroundColor: 'rgba(59,130,246,0.12)',
            tension: 0,
            pointRadius: 4,
            pointHoverRadius: 5,
            fill: false,
          },
          {
            label: mediaTxt,
            data: mediaArr,
            borderColor: 'rgba(148,163,184,0.95)',
            borderDash: [6, 4],
            pointRadius: 0,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: titulo,
            font: { size: 18, weight: 'bold' },
            padding: { top: 10, bottom: 6 },
            color: globalObject.__PDF_MODE
              ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
              : appTextColor(),
          },
          legend: {
            position: 'top',
            labels: {
              color: globalObject.__PDF_MODE
                ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
                : appTextColor(),
              font: { size: 12 },
              filter: (item) => item.datasetIndex === 1,
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            },
          },
          datalabels: {
            display: (ctx) => ctx.datasetIndex === 0,
            align: 'top',
            anchor: 'end',
            color: globalObject.__PDF_MODE ? '#111827' : '#e5e7eb',
            font: { size: 10, weight: '500' },
            formatter: (value) =>
              `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            offset: 6,
            clamp: true,
            clip: false,
          },
          xBaseline: {},
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: globalObject.__PDF_MODE
                ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
                : appTextColor(),
              maxRotation: 45,
              minRotation: 45,
            },
            border: { display: false },
          },
          y: {
            min: scaleBounds.min,
            max: scaleBounds.max,
            display: false,
            grid: { display: false },
            border: { display: false },
          },
        },
        layout: {
          padding: {
            left: chartInsetX,
            right: chartInsetX + 24,
            top: 14,
            bottom: 0,
          },
        },
      },
      plugins: [Datalabels, xBaselinePlugin].filter(Boolean),
    });

    if (globalObject.__PDF_MODE && globalObject.ChartFeatures?.applyPdfTheme) {
      globalObject.ChartFeatures.applyPdfTheme(chart);
    }

    globalObject.ReportsDom?.forceWhiteBackground?.(canvas);
    canvas._chart = chart;
    return chart;
  }

  globalObject.ReportsRenderers = {
    renderPizzaMensalStrict,
    renderBarrasMensalLocal,
    renderLinhaPeriodoLocal,
  };
})(window);
