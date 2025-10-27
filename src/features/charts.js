// =============================================
// 📊 Chart.js Setup – Controle de Contas PWA
// =============================================
//
// Implementa setup global e o gráfico de Pizza (mensal).
// Dependências (via CDN em index.html):
//  - https://cdn.jsdelivr.net/npm/chart.js
//  - https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels
//  - https://cdn.jsdelivr.net/npm/chartjs-plugin-piechart-outlabels
// =============================================

// Registro global (só precisa rodar uma vez)
export function setupChartDefaults() {
  if (!window.Chart) {
    console.error('Chart.js não encontrado. Verifique o CDN.');
    return;
  }

  // Define estilo padrão global
  Chart.defaults.font.family = "'Inter', 'Roboto', sans-serif";
  Chart.defaults.color = '#e5e7eb';
  Chart.defaults.plugins.legend.position = 'bottom';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.tooltip.mode = 'index';
  Chart.defaults.plugins.tooltip.intersect = false;

  // Plugins globais
  if (window.ChartDataLabels) Chart.register(window.ChartDataLabels);
  if (window.Outlabels) Chart.register(window.Outlabels);

  console.log('[Chart.js] Configuração global aplicada');
}

// =============================================
// 🥧 Gráfico de Pizza – Relatório Mensal (v3)
// =============================================
//
// Mostra a distribuição de gastos por tipo de conta no mês,
// com legenda incluindo valores e labels externas com
// percentual em destaque e valor menor abaixo.
// =============================================

export function renderPizzaMensal(canvas, data, rotuloMes = 'Mês do relatório') {
  if (!window.Chart) return console.error('Chart.js não carregado.');
  if (!data || !data.labels?.length) return console.warn('Sem dados para pizza mensal.');

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (canvas._chart) canvas._chart.destroy();

  const total = data.valores.reduce((a, b) => a + b, 0);

  // legenda: nome + [R$ valor]
  const legendLabels = data.labels.map((label, i) => {
    const v = data.valores[i];
    return `${label} [R$ ${v.toLocaleString('pt-BR')}]`;
  });

  const chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: legendLabels,
      datasets: [
        {
          data: data.valores,
          backgroundColor: [
            '#22d3ee', '#3b82f6', '#10b981', '#facc15', '#f472b6',
            '#a855f7', '#f97316', '#ef4444', '#94a3b8', '#14b8a6'
          ],
          borderColor: '#0e1218',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Distribuição de Gastos de ${rotuloMes}`,
          font: { size: 16, weight: 'bold' },
          padding: { top: 10, bottom: 10 }
        },
        tooltip: {
          mode: 'nearest',       // ✅ mostra apenas a fatia sob o cursor
          intersect: true,       // ✅ exige intersecção real com a fatia
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed;
              const pct = ((v / total) * 100).toFixed(1);
              return `${ctx.label.replace(/\[.*\]/, '').trim()}: ${pct}% — R$ ${v.toLocaleString('pt-BR')}`;
            }
          }
        },

        datalabels: {
        color: '#fff',
        formatter: (v, ctx) => {
            const pct = ((v / total) * 100).toFixed(1);
            const valor = `R$ ${v.toLocaleString('pt-BR')}`;
            return `${pct}%\n${valor}`;
        },
        font: (ctx) => {
            // primeira linha (percentual) 12pt, segunda (valor) 9pt
            return { size: 12, weight: 'bold', lineHeight: 1.1 };
        },
        hover: {
          mode: 'nearest',
          intersect: true
        },

        display: true,
        textAlign: 'center',
        offset: 2,
        },
        padding: { top: 0, bottom: 0 },
        outlabels: false, // desliga outlabels, usamos datalabels internos
        legend: {
          labels: {
            color: '#e5e7eb',
            font: { size: 12 }
          }
        }
      }
    },
    plugins: [window.ChartDataLabels].filter(Boolean)
  });

  canvas._chart = chart;
  return chart;
}

// =============================================
// 📊 Gráfico de Barras Comparativas (Horizontal)
// =============================================
//
// Exibe barras horizontais comparando dois meses
// (ex: Setembro/2025 vs Agosto/2025 ou Setembro/2024).
// Ideal para PDFs lado a lado.
// =============================================

export function renderBarrasComparativas(canvas, data, tipo = 'anterior', rotulos = {}) {
  if (!window.Chart) return console.error('Chart.js não carregado.');
  if (!data || !data.labels?.length) return console.warn('Sem dados para barras comparativas.');

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (canvas._chart) canvas._chart.destroy();

  // rótulos legíveis — ex: rotulos = { atual: 'Setembro/2025', comparado: 'Agosto/2025' }
  const labelAtual = rotulos.atual || 'Mês do relatório';
  const labelComparado = rotulos.comparado ||
    (tipo === 'anoAnterior' ? 'Mesmo mês do ano anterior' : 'Mês anterior');

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [
        {
          label: labelAtual,
          data: data.atual,
          backgroundColor: 'rgba(59,130,246,0.85)', // azul
          borderRadius: 8,
          barThickness: 18
        },
        {
          label: labelComparado,
          data: data.comparado,
          backgroundColor: 'rgba(148,163,184,0.7)', // cinza
          borderRadius: 8,
          barThickness: 18
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Comparativo — ${labelAtual} vs ${labelComparado}`,
          font: { size: 15, weight: 'bold' },
          padding: { top: 10, bottom: 10 }
        },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: R$ ${ctx.parsed.x.toLocaleString('pt-BR')}`
          }
        },
        legend: {
          position: 'top',
          labels: {
            color: '#e5e7eb',
            font: { size: 12 }
          }
        },
        datalabels: {
          anchor: 'end',
          align: 'right',
          color: '#e5e7eb',
          font: { size: 10 },
          formatter: (v) => `R$ ${v.toLocaleString('pt-BR')}`
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: {
            color: '#e5e7eb',
            callback: (v) => `R$ ${v}`
          }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.06)' },
          ticks: { color: '#e5e7eb' }
        }
      }
    },
    plugins: [window.ChartDataLabels].filter(Boolean)
  });

  canvas._chart = chart;
  return chart;
}

// =============================================
// 📈 Gráfico de Linhas – Relatório de Período (vFinal)
// =============================================
//
// Um gráfico por conta, com linha de média pontilhada,
// rótulos em cada ponto e linha base clara do eixo X
// (desenhada manualmente via plugin).
// =============================================
export function renderLinhaContaPeriodo(canvas, data) {
  if (!window.Chart) return console.error('Chart.js não carregado.');
  if (!data || !data.meses?.length) return console.warn('Sem dados para linhas.');

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  if (canvas._chart) canvas._chart.destroy();

  const media = data.valores.reduce((a, b) => a + b, 0) / Math.max(1, data.valores.length);
  const mediaArr = Array(data.valores.length).fill(media);
  const ini = data.meses[0];
  const fim = data.meses[data.meses.length - 1];
  const titulo = `Comparativo de conta '${data.nome}' - ${ini} a ${fim}`;
  const mediaTxt = `Média da conta: R$ ${media.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Plugin para desenhar linha base do eixo X manualmente
  const xBaselinePlugin = {
    id: 'xBaseline',
    afterDraw(chart, _args, opts) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      ctx.save();
      ctx.strokeStyle = (opts && opts.color) || 'rgba(255,255,255,0.4)'; // cor clara e visível
      ctx.lineWidth = (opts && opts.width) || 1.5;
      ctx.beginPath();
      ctx.moveTo(chartArea.left, chartArea.bottom);
      ctx.lineTo(chartArea.right, chartArea.bottom);
      ctx.stroke();
      ctx.restore();
    }
  };

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.meses,
      datasets: [
        {
          label: data.nome,
          data: data.valores,
          borderColor: 'rgba(59,130,246,1)', // azul principal
          backgroundColor: 'rgba(59,130,246,0.15)',
          tension: 0.25,
          pointRadius: 4,
          pointHoverRadius: 5,
          fill: false,
        },
        {
          label: mediaTxt,
          data: mediaArr,
          borderColor: 'rgba(148,163,184,0.95)', // cinza média
          borderDash: [6, 4],
          pointRadius: 0,
          borderWidth: 2,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', intersect: false },
      plugins: {
        title: {
          display: true,
          text: titulo,
          font: { size: 18, weight: 'bold' },
          padding: { top: 12, bottom: 8 }
        },
        legend: {
          position: 'top',
          labels: {
            color: '#e5e7eb',
            font: { size: 12 },
            filter: (item) => item.text?.startsWith('Média')
          }
        },
        tooltip: {
          mode: 'nearest',
          intersect: true,
          callbacks: {
            label: (ctx) => `R$ ${ctx.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          }
        },
        datalabels: {
          display: (ctx) => ctx.datasetIndex === 0,
          align: 'top',
          anchor: 'end',
          color: '#e5e7eb',
          font: { size: 11 },
          formatter: (v, ctx) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        },
        xBaseline: { color: 'rgba(255,255,255,0.4)', width: 1.5 } // ✅ ativa linha base
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#e5e7eb',
            maxRotation: 45,
            minRotation: 45
          },
          border: { display: false } // deixamos off, linha vem do plugin
        },
        y: {
          display: false,
          grid: { display: false },
          border: { display: false }
        }
      },
      elements: {
        line: { borderWidth: 3 },
        point: { backgroundColor: 'rgba(59,130,246,1)' }
      },
      layout: { padding: { top: 4, right: 8, bottom: 0, left: 8 } }
    },
    plugins: [window.ChartDataLabels, xBaselinePlugin].filter(Boolean)
  });

  canvas._chart = chart;
  return chart;
}




// Torna as funções acessíveis no console e em outros scripts
window.ChartFeatures = {
  setupChartDefaults,
  renderPizzaMensal,
  renderBarrasComparativas,
  renderLinhaContaPeriodo,   // ✅ novo
};


