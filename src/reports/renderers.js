(function attachReportsRenderers(globalObject) {
  function appTextColor() {
    return globalObject.ReportsDom?.appTextColor?.() || '#e5e7eb';
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
    if (canvas._chart) {
      try { canvas._chart.destroy(); } catch (error) {}
    }

    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const numericValues = (valores || []).map((value) => Number(value || 0));
    const pointCount = Math.max(1, meses?.length || 0);
    const media = (
      numericValues.reduce((accumulator, value) => accumulator + value, 0) /
      Math.max(1, numericValues.length)
    ) || 0;
    const maxValue = Math.max(1, media, ...numericValues);
    const scaleMax = Math.max(1, maxValue * 1.12);
    const inicio = meses[0];
    const fim = meses[meses.length - 1];
    const titulo = `Comparativo de conta '${nome}' \u2014 ${inicio} a ${fim}`;
    const mediaTxt = `M\u00e9dia da conta: R$ ${media.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
    const denseChart = pointCount >= 10;
    const veryDenseChart = pointCount >= 14;
    const rotateValueLabels = pointCount > 12;
    const valueLabelRotation = rotateValueLabels ? 45 : 0;
    const valueLabelRotationRadians = (valueLabelRotation * Math.PI) / 180;
    const tickRotation = veryDenseChart ? 50 : denseChart ? 42 : 0;
    const tickAreaHeight = tickRotation > 0 ? 92 : 58;
    const plotLeft = 46;
    const plotRight = canvas.width - 24;
    const plotTop = 106;
    const plotBottom = canvas.height - tickAreaHeight - 24;
    const plotWidth = Math.max(plotRight - plotLeft, 1);
    const plotHeight = Math.max(plotBottom - plotTop, 1);
    const slotWidth = plotWidth / pointCount;
    const barWidth = Math.max(
      veryDenseChart ? 18 : denseChart ? 22 : 26,
      Math.min(
        veryDenseChart ? 24 : denseChart ? 28 : 34,
        slotWidth * (veryDenseChart ? 0.46 : denseChart ? 0.52 : 0.58)
      )
    );
    const labelFontSize = veryDenseChart ? 9 : 10;
    const valueLabelOffset = veryDenseChart ? 8 : 10;
    const tickFontSize = veryDenseChart ? 10 : 11;

    function formatValueLabel(value) {
      return `R$ ${Number(value || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    function drawRoundedBar(x, y, width, height, radius = 6) {
      const rr = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);
      context.beginPath();
      context.moveTo(x, y + height);
      context.lineTo(x, y + rr);
      context.quadraticCurveTo(x, y, x + rr, y);
      context.lineTo(x + width - rr, y);
      context.quadraticCurveTo(x + width, y, x + width, y + rr);
      context.lineTo(x + width, y + height);
      context.closePath();
    }

    context.fillStyle = '#111827';
    context.font = 'bold 18px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(titulo, canvas.width / 2, 40);

    const legendTextWidth = context.measureText(mediaTxt).width;
    const legendLineWidth = 34;
    const legendGap = 12;
    const legendGroupWidth = legendLineWidth + legendGap + legendTextWidth;
    let legendStartX = (canvas.width - legendGroupWidth) / 2;

    context.strokeStyle = 'rgba(107, 114, 128, 0.92)';
    context.lineWidth = 2;
    context.setLineDash([7, 6]);
    context.beginPath();
    context.moveTo(legendStartX, 76);
    context.lineTo(legendStartX + legendLineWidth, 76);
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = '#374151';
    context.font = '13px Arial';
    context.textAlign = 'left';
    context.fillText(mediaTxt, legendStartX + legendLineWidth + legendGap, 80);

    const averageY = plotBottom - ((media / scaleMax) * plotHeight);
    context.strokeStyle = 'rgba(107, 114, 128, 0.92)';
    context.lineWidth = 1.4;
    context.setLineDash([6, 6]);
    context.beginPath();
    context.moveTo(plotLeft, averageY);
    context.lineTo(plotRight, averageY);
    context.stroke();
    context.setLineDash([]);

    context.strokeStyle = '#4b5563';
    context.lineWidth = 1.6;
    context.beginPath();
    context.moveTo(plotLeft, plotBottom);
    context.lineTo(plotRight, plotBottom);
    context.stroke();

    context.beginPath();
    numericValues.forEach((value, index) => {
      const centerX = plotLeft + (slotWidth * (index + 0.5));
      const pointY = plotBottom - ((value / scaleMax) * plotHeight);
      if (index === 0) {
        context.moveTo(centerX, pointY);
      } else {
        context.lineTo(centerX, pointY);
      }
    });
    context.strokeStyle = 'rgba(75, 85, 99, 0.94)';
    context.lineWidth = 1.8;
    context.stroke();

    numericValues.forEach((value, index) => {
      const centerX = plotLeft + (slotWidth * (index + 0.5));
      const pointY = plotBottom - ((value / scaleMax) * plotHeight);
      const barHeight = Math.max(0, (value / scaleMax) * plotHeight);
      const barLeft = centerX - (barWidth / 2);
      const barTop = plotBottom - barHeight;

      context.fillStyle = 'rgba(59, 130, 246, 0.22)';
      context.strokeStyle = 'rgba(59, 130, 246, 0.35)';
      context.lineWidth = 1;
      drawRoundedBar(barLeft, barTop, barWidth, barHeight, 6);
      context.fill();
      context.stroke();

      context.fillStyle = 'rgba(75, 85, 99, 0.94)';
      context.beginPath();
      context.arc(centerX, pointY, 3.5, 0, Math.PI * 2);
      context.fill();

      const valueLabel = formatValueLabel(value);
      context.fillStyle = '#374151';
      context.font = `${labelFontSize}px Arial`;
      const labelWidth = context.measureText(valueLabel).width;
      const minCenter = plotLeft + (labelWidth / 2) + 4;
      const maxCenter = plotRight - (labelWidth / 2) - 4;
      const labelCenterX = Math.min(Math.max(centerX, minCenter), maxCenter);
      const rotatedHalfHeight = rotateValueLabels
        ? ((labelWidth * Math.sin(valueLabelRotationRadians)) + (labelFontSize * Math.cos(valueLabelRotationRadians))) / 2
        : 0;
      const labelY = Math.max(
        Math.min(barTop, pointY) - (rotateValueLabels ? valueLabelOffset + 4 : valueLabelOffset),
        plotTop + (rotateValueLabels ? rotatedHalfHeight + 4 : labelFontSize + 2)
      );

      if (rotateValueLabels) {
        context.save();
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.translate(labelCenterX, labelY);
        context.rotate((-valueLabelRotation * Math.PI) / 180);
        context.fillText(valueLabel, 0, 0);
        context.restore();
      } else {
        context.textAlign = 'center';
        context.textBaseline = 'bottom';
        context.fillText(valueLabel, labelCenterX, labelY);
      }

      context.fillStyle = '#374151';
      context.font = `${tickFontSize}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'top';
      if (tickRotation > 0) {
        context.save();
        context.translate(centerX, plotBottom + 14);
        context.rotate((-tickRotation * Math.PI) / 180);
        context.fillText(meses[index], 0, 0);
        context.restore();
      } else {
        context.fillText(meses[index], centerX, plotBottom + 12);
      }
    });

    globalObject.ReportsDom?.forceWhiteBackground?.(canvas);
    canvas._chart = null;
    return null;
  }

  globalObject.ReportsRenderers = {
    renderPizzaMensalStrict,
    renderBarrasMensalLocal,
    renderLinhaPeriodoLocal,
  };
})(window);
