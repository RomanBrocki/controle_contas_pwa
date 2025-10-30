function ReportsModal({
  tab, onChangeTab, onClose,
  years, monthsByYear, currentYear, currentMonth,
  contasDistinct,
  defaultSel = []
}) {

      // Fecha o modal ao pressionar Esc (desktop apenas)
      React.useEffect(() => {
        const handleKey = (e) => {
          if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
      }, []);
      // Estados sincronizados com a tela principal ao abrir
      const [mensalYear, setMensalYear] = React.useState(currentYear);
      const [mensalMonth, setMensalMonth] = React.useState(currentMonth);

      const [pStartYear, setPStartYear] = React.useState(currentYear);
      const [pStartMonth, setPStartMonth] = React.useState(currentMonth);
      const [pEndYear, setPEndYear] = React.useState(currentYear);
      const [pEndMonth, setPEndMonth] = React.useState(currentMonth);

      const [cmpRange, setCmpRange] = React.useState('mes'); // 'mes' | 'periodo'
      const [cmpYear, setCmpYear] = React.useState(currentYear);
      const [cmpMonth, setCmpMonth] = React.useState(currentMonth);
      const [cmpStartYear, setCmpStartYear] = React.useState(currentYear);
      const [cmpStartMonth, setCmpStartMonth] = React.useState(currentMonth);
      const [cmpEndYear, setCmpEndYear] = React.useState(currentYear);
      const [cmpEndMonth, setCmpEndMonth] = React.useState(currentMonth);
      const [cmpType, setCmpType] = React.useState('linhas'); // 'linhas' | 'barras' | 'pizza'
      const [cmpSel, setCmpSel] = React.useState(()=> new Set(defaultSel));
        React.useEffect(()=>{ if (tab==='comparativos') setCmpSel(new Set(defaultSel)); }, [tab, defaultSel]);

      // === Texto padrão do APP por tema (não afeta PDF) ===
      function __appText() {
        // tenta CSS var do body; senão, fallback por tema
        const v = (getComputedStyle(document.body).getPropertyValue('--chart-label-text') || '').trim();
        if (v) return v;
        return document.body.classList.contains('theme-light') ? '#0b1220' : '#e5e7eb';
      }

      // --- NOVOS ESTADOS ---
      const [cmpContas, setCmpContas] = React.useState([]); // lista dinâmica p/ seleção
      const [cmpWarnings, setCmpWarnings] = React.useState([]); // avisos de “sem dados comparáveis” etc.

      // --- HELPERS ---
      function makeMonthsList(y1,m1,y2,m2){
        const out=[]; let y=y1, m=m1;
        while (y<y2 || (y===y2 && m<=m2)) { out.push({y,m}); m++; if(m>12){m=1;y++;} }
        return out;
      }
      function parseBRLnum(brl){
        return parseFloat(String(brl||'').replace(/[^\d,]/g,'').replace(/\.(?=\d)/g,'').replace(',','.'))||0;
      }
      function sumByConta(items, contasSel){
        return contasSel.map(c => items.filter(x=>x.nome===c).reduce((a,b)=>a+parseBRLnum(b.valor),0));
      }
      async function contasDistinctRange(range){
        // Sempre derive da lista real do período via DataAdapter.fetchMes
        if (range === 'mes') {
          const itens = await window.DataAdapter.fetchMes(cmpYear, cmpMonth);
          return Array.from(new Set((itens || []).map(i => i.nome)));
        }
        // período → união de todos os meses do intervalo
        const months = makeMonthsList(cmpStartYear, cmpStartMonth, cmpEndYear, cmpEndMonth);
        const respostas = await Promise.all(months.map(({y,m}) => window.DataAdapter.fetchMes(y,m)));
        const acc = new Set();
        respostas.forEach(items => (items || []).forEach(i => acc.add(i.nome)));
        return Array.from(acc);
      }


      // quando trocar alcance, limitar opções de gráfico e ajustar valor padrão
      React.useEffect(()=>{
        if (cmpRange==='mes' && (cmpType==='linhas')) setCmpType('pizza');      // mês: pizza, barras
        if (cmpRange==='periodo' && (cmpType==='barras')) setCmpType('linhas');  // período: pizza, linhas
      }, [cmpRange]);

      // recarrega a lista dinâmica de contas ao mudar alcance ou datas
      React.useEffect(()=>{
        (async()=>{
          const lista = await contasDistinctRange(cmpRange);
          setCmpContas(lista);
          // mantém seleção somente do que ainda existe
          setCmpSel(prev => new Set(Array.from(prev).filter(n=>lista.includes(n))));


        })();
      }, [cmpRange, cmpYear, cmpMonth, cmpStartYear, cmpStartMonth, cmpEndYear, cmpEndMonth]);


      React.useEffect(()=>{
        setMensalYear(currentYear);
        setMensalMonth(currentMonth);
        setPStartYear(currentYear);
        setPStartMonth(currentMonth);
        setPEndYear(currentYear);
        setPEndMonth(currentMonth);
        setCmpYear(currentYear);
        setCmpMonth(currentMonth);
        setCmpStartYear(currentYear);
        setCmpStartMonth(currentMonth);
        setCmpEndYear(currentYear);
        setCmpEndMonth(currentMonth);
      }, [currentYear, currentMonth]);
      // ==== HELPERS compartilhados p/ PDF de Relatórios ====
      function monthNamePT(m){
        return new Date(2025, m-1, 1).toLocaleString('pt-BR', { month:'long' }).replace(/^./, c=>c.toUpperCase());
      }
      const fetchMes = (y, m) => window.DataAdapter.fetchMes(y, m);
      // ⚠️ NÃO redefinir sumByConta aqui; já existe acima (usa parseBRLnum).


      function _makeHost() {
        const host = document.createElement('div');
        host.id = 'pdf-host';
        host.style.position = 'fixed';
        host.style.left = '-99999px';
        host.style.top = '0';
        host.style.width = '1200px';
        host.style.pointerEvents = 'none';
        document.body.appendChild(host);
        return host;
      }
      function _addCanvas(host, h='700px', w='1100px') {
        const wrap = document.createElement('div');
        wrap.style.width = w;
        wrap.style.height = h;
        const c = document.createElement('canvas');
        wrap.appendChild(c);
        host.appendChild(wrap);
        return c;
      }


      function monthOptions(y){
        return (monthsByYear[y]||[]).map(m => <option key={m} value={m}>{monthNamePT(m)}</option>);
      }

      function toggleConta(name){
        setCmpSel(prev => {
          const n = new Set(prev);
          n.has(name) ? n.delete(name) : n.add(name);
          return n;
        });
      }
      
      function _addBlank(host, h='600px', w='1100px') {
        const wrap = document.createElement('div');
        wrap.style.width = w;
        wrap.style.height = h;
        const c = document.createElement('canvas');
        // tamanho “grande o suficiente” para ocupar o slot (o exporter escala de qualquer forma)
        c.width = parseInt(String(w).replace('px','')) || 1100;
        c.height = parseInt(String(h).replace('px','')) || 600;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        wrap.appendChild(c);
        host.appendChild(wrap);
        return c;
      }


      // === Renderer exclusivo para PIZZA do MENSAL (sem profile; 100% das contas do mês) ===
      function renderPizzaMensalStrict(canvas, { labels, valores }, titulo) {
        // ===== Normalização / Preparos =====
        const labs = [];
        const dataVals = [];
        for (let i = 0; i < (labels?.length ?? 0); i++) {
          const v = Number(valores?.[i] ?? 0);
          if (isFinite(v) && v > 0) {
            labs.push(String(labels[i] ?? '').trim());
            dataVals.push(v);
          }
        }
        const total = dataVals.reduce((a, b) => a + b, 0) || 1;
        const fmtBRL = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

        // Textos usados:
        // - nameLabels: rótulo externo (texto curto, sem valores)
        // - legendLabels: legenda rica (Nome — R$ valor (xx%))
        const nameLabels = labs.slice();
        const legendLabels = labs.map((name, i) => {
          const v = Number(dataVals[i] || 0);
          return `${name} — ${fmtBRL(v)}`;
        });

        // ===== Dependências Chart.js =====
        const Chart = window.Chart;
        const Datalabels = window.ChartDataLabels;

        // registra datalabels se necessário
        if (Chart && Datalabels && !Chart.registry.plugins.get('datalabels')) {
          try { Chart.register(Datalabels); } catch (_) {}
        }

        // ===== Plugin local p/ rótulos externos com linha + anticolisão por lado =====
        const pieOutlabels = {
          id: 'pieOutlabels',
          afterDatasetsDraw(chart) {
            const { ctx, chartArea } = chart;
            const ds = chart.data.datasets?.[0];
            const meta = chart.getDatasetMeta(0);
            if (!ds || !meta) return;

            const arr = ds.data || [];
            const totalLocal = arr.reduce((a, b) => a + (Number(b) || 0), 0) || 1;

            // estilos cientes de PDF/app
            const textColor = (window.__PDF_MODE
              ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
              : (__appText?.() || '#e5e7eb')).trim() || '#333';
            const lineColor = (window.__PDF_MODE
              ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-line-pdf') || '#4b5563')
              : 'rgba(255,255,255,.45)').trim() || '#666';

            const font = "12px Inter, Roboto, system-ui, -apple-system, Segoe UI, Arial, sans-serif";

            // âncoras iniciais
            const right = [], left = [];
            meta.data.forEach((arc, i) => {
              const v = Number(arr[i]) || 0;
              if (!v) return;

              const angle = (arc.startAngle + arc.endAngle) / 2;
              const cos = Math.cos(angle), sin = Math.sin(angle);
              const r = arc.outerRadius;
              const x0 = arc.x + cos * r;
              const y0 = arc.y + sin * r;

              const p = totalLocal ? v / totalLocal : 0;
              const extra = p < 0.08 ? 16 : 10;  // “explode” leve p/ abrir espaço
              const x1 = arc.x + cos * (r + extra);
              const y1 = arc.y + sin * (r + extra);

              const tick = 18;
              const sideRight = cos >= 0;
              const x2 = x1 + (sideRight ? tick : -tick);
              const y2 = y1;

              (sideRight ? right : left).push({
                i, v, p, x0, y0, x1, y1, x2, y2, sideRight,
                text: nameLabels[i] || ''
              });
            });

            // anticolisão por lado
            const resolve = (items) => {
              if (items.length <= 1) return;
              const minGap = 14;
              const topLim = chartArea.top + 6;
              const botLim = chartArea.bottom - 6;

              items.sort((a, b) => a.y2 - b.y2);
              items[0].y2 = Math.max(items[0].y2, topLim);
              for (let k = 1; k < items.length; k++) {
                items[k].y2 = Math.max(items[k].y2, items[k - 1].y2 + minGap);
              }
              if (items[items.length - 1].y2 > botLim) {
                items[items.length - 1].y2 = botLim;
                for (let k = items.length - 2; k >= 0; k--) {
                  items[k].y2 = Math.min(items[k].y2, items[k + 1].y2 - minGap);
                }
                items[0].y2 = Math.max(items[0].y2, topLim);
              }
            };

            resolve(right);
            resolve(left);

            // desenha
            ctx.save();
            ctx.font = font;
            ctx.fillStyle = textColor;
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;

            const drawItem = (it) => {
              // linhas (borda → “ponto” → segmento horizontal)
              ctx.beginPath();
              ctx.moveTo(it.x0, it.y0);
              ctx.lineTo(it.x1, it.y2);
              ctx.lineTo(it.x2, it.y2);
              ctx.stroke();

              // texto
              ctx.textAlign = it.sideRight ? 'left' : 'right';
              ctx.textBaseline = 'middle';
              ctx.fillText(it.text, it.x2 + (it.sideRight ? 6 : -6), it.y2);
            };

            right.forEach(drawItem);
            left.forEach(drawItem);
            ctx.restore();
          }
        };

        // ===== Destrói gráfico anterior =====
        if (canvas._chart) { try { canvas._chart.destroy(); } catch (_) {} }

        // ===== Construção do gráfico =====
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: legendLabels,               // ✅ legenda rica (Nome — R$ valor (%))
            datasets: [{
              data: dataVals,
              backgroundColor: [
                '#22d3ee', '#3b82f6', '#10b981', '#facc15', '#f472b6',
                '#a855f7', '#f97316', '#ef4444', '#94a3b8', '#14b8a6'
              ],
              borderColor: window.__PDF_MODE
                ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-line-pdf') || '#0e1218')
                : '#0e1218',
              borderWidth: 1,
              // explode leve nas fatias < 8% para abrir espaço para os traços
              offset: (ctx) => {
                const v = Number(ctx.raw) || 0;
                const p = total ? v / total : 0;
                return p < 0.08 ? 12 : 4; // px
              }
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            radius: '84%',                                      // pizza um pouco menor
            layout: { padding: { top: 18, right: 64, bottom: 18, left: 64 } }, // espaço p/ outlabels
            plugins: {
              title: {
                display: true,
                text: `Gastos por conta — ${titulo}`,
                font: { size: 20, weight: 'bold' },             // ✅ título maior
                padding: { top: 8, bottom: 16 },                // ✅ mais espaço abaixo do título
                color: window.__PDF_MODE
                  ? (getComputedStyle(document.documentElement).getPropertyValue('--chart-text-pdf') || '#111827')
                  : (__appText?.() || '#e5e7eb')
              },
              tooltip: { enabled: false },                      // PDF-friendly
              datalabels: {
                color: '#fff',
                display: (ctx) => {
                  const arr = ctx.chart?.data?.datasets?.[0]?.data || [];
                  const sum = arr.reduce((a,b)=>a + (Number(b)||0), 0);
                  const v = Number(ctx.dataset.data[ctx.dataIndex]) || 0;
                  const p = sum ? v / sum : 0;
                  return v > 0 && p >= 0.06;                    // ≥ 6%
                },
                formatter: (value, ctx) => {
                  const arr = ctx.chart?.data?.datasets?.[0]?.data || [];
                  const sum = arr.reduce((a,b)=>a + (Number(b)||0), 0);
                  const v = Number(value) || 0;
                  const p = sum ? v / sum : 0;
                  return (p * 100).toFixed(p >= 0.1 ? 0 : 1).replace('.', ',') + '%';
                },
                font: { size: 12, weight: 'bold', lineHeight: 1.1 },
                textAlign: 'center',
                offset: 2
              },
              legend: {
                position: 'bottom',
                labels: {
                  color: (__appText?.() || '#e5e7eb'),
                  font: { size: 12 },
                  usePointStyle: true,     // ✅ usa marcador circular
                  pointStyle: 'circle',    // ✅ define forma redonda
                  boxWidth: 10,            // tamanho do pontinho
                  boxHeight: 10
                }
              }

            },
            animation: false,
            events: []                                          // sem interações
          },
          plugins: [window.ChartDataLabels, pieOutlabels].filter(Boolean) // ✅ inclui o plugin local
        });

        canvas._chart = chart;
        return chart;
      }

      // === Barras horizontais locais para PDF (mensal) — estilo charts.js ===
      function renderBarrasMensalLocal(canvas, payload, opts = {}) {
        const { labels, atual, comparado, allowList } = payload; // allowList = profile.chart_accounts
        const W0 = canvas.width || 1100, H0 = canvas.height || 560;
        const ctx = canvas.getContext('2d');

        // Tema alinhado ao charts.js (PDF-friendly)
        const css = getComputedStyle(document.documentElement);
        const labelColor = (
          (window.__PDF_MODE ? css.getPropertyValue('--chart-text-pdf') : css.getPropertyValue('--chart-label-text')) ||
          '#111827'
        ).trim();
        const THEME = {
          bg: '#ffffff',
          text: labelColor || '#111827',
          atual: 'rgba(59,130,246,0.85)',       // azul (mês atual)
          comparado: 'rgba(148,163,184,0.7)'    // cinza (comparado)
        };

        // Dados (filtra por allowList mantendo ordem)
        const allowSet = allowList ? new Set(allowList) : null;
        const rows = labels
          .map((name, i) => ({ name, a: Number(atual[i] ?? 0), b: Number(comparado?.[i] ?? 0) }))
          .filter(r => !allowSet || allowSet.has(r.name));

        // Layout ( espelha charts.js )
        const margin = { t: 56, r: 40, b: 40, l: 260 };
        const barH = 18, innerGap = 10, groupGap = 20, legendH = 26;
        const contentH = rows.length ? rows.length * (barH * 2 + innerGap + groupGap) - groupGap : 0;
        const totalH = margin.t + legendH + 16 + contentH + margin.b;

        canvas.width = W0;
        canvas.height = Math.max(H0, totalH);

        // Utils
        function roundRect(ctx, x, y, w, h, r = 8) {
          if (w <= 0 || h <= 0) return;
          const rr = Math.min(r, Math.abs(h) / 2, Math.abs(w) / 2);
          ctx.beginPath();
          ctx.moveTo(x + rr, y);
          ctx.arcTo(x + w, y, x + w, y + h, rr);
          ctx.arcTo(x + w, y + h, x, y + h, rr);
          ctx.arcTo(x, y + h, x, y, rr);
          ctx.arcTo(x, y, x + w, y, rr);
          ctx.closePath();
        }
        const fmtBRL = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

        // Fundo
        ctx.fillStyle = THEME.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Título
        const titulo = opts.title || `Comparativo — ${opts.rotAtuais || 'Mês atual'} vs ${opts.rotComparado || 'Comparado'}`;
        ctx.fillStyle = THEME.text;
        ctx.font = '700 18px Inter, Roboto, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(titulo, margin.l, margin.t - 18);

        // Legenda
        const legendY = margin.t + 2;
        ctx.font = '12px Inter, Roboto, Arial, sans-serif';
        ctx.fillStyle = THEME.atual; ctx.fillRect(margin.l, legendY, 18, 10);
        ctx.fillStyle = THEME.text;  ctx.fillText(` ${opts.rotAtuais || 'Mês atual'}`, margin.l + 24, legendY + 10);
        const off2 = margin.l + 180;
        ctx.fillStyle = THEME.comparado; ctx.fillRect(off2, legendY, 18, 10);
        ctx.fillStyle = THEME.text;      ctx.fillText(` ${opts.rotComparado || 'Comparado'}`, off2 + 24, legendY + 10);

        // Área do gráfico
        const x0 = margin.l, y0 = margin.t + legendH + 16;
        const plotW = Math.max(1, canvas.width - margin.l - margin.r);
        // Eixo vertical (base Y=0)
        ctx.strokeStyle = THEME.text;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0 - 6);
        ctx.lineTo(x0, y0 + contentH + 6);
        ctx.stroke();

        const vmax = Math.max(1, ...rows.map(r => Math.max(r.a, r.b)));
        const scaleX = (v) => (v / vmax) * plotW;

        // Sem grid; apenas texto
        ctx.textBaseline = 'middle';
        ctx.fillStyle = THEME.text;

        // Desenho
        ctx.font = '13px Inter, Roboto, Arial, sans-serif';
        let yy = y0;
        rows.forEach((r) => {
          // Rótulo da conta à esquerda
          ctx.textAlign = 'right';
          ctx.fillStyle = THEME.text;
          ctx.fillText(r.name, x0 - 10, yy + barH + innerGap / 2);

          const bW = scaleX(r.b);
          const aW = scaleX(r.a);

          // Barra comparado (em cima)
          ctx.fillStyle = THEME.comparado;
          roundRect(ctx, x0, yy, bW, barH, 8); ctx.fill();

          // Barra atual (embaixo)
          ctx.fillStyle = THEME.atual;
          roundRect(ctx, x0, yy + barH + innerGap, aW, barH, 8); ctx.fill();

          // Valores (regra 75%)
          const thresh = 0.75;
          const ratioB = bW / plotW;
          const ratioA = aW / plotW;
          ctx.font = '600 12px Inter, Roboto, Arial, sans-serif';

          // comparado
          if (bW > 0) {
            if (ratioB >= thresh) {
              ctx.fillStyle = '#ffffff'; ctx.textAlign = 'right';
              ctx.fillText(fmtBRL(r.b), x0 + bW - 6, yy + barH / 2);
            } else {
              ctx.fillStyle = THEME.text; ctx.textAlign = 'left';
              ctx.fillText(fmtBRL(r.b), x0 + bW + 6, yy + barH / 2);
            }
          }

          // atual
          if (aW > 0) {
            const yA = yy + barH + innerGap + barH / 2;
            if (ratioA >= thresh) {
              ctx.fillStyle = '#ffffff'; ctx.textAlign = 'right';
              ctx.fillText(fmtBRL(r.a), x0 + aW - 6, yA);
            } else {
              ctx.fillStyle = THEME.text; ctx.textAlign = 'left';
              ctx.fillText(fmtBRL(r.a), x0 + aW + 6, yA);
            }
          }

          yy += (barH * 2 + innerGap + groupGap); // <- era '='; aqui é '+='
        });
      }



      
      // === RELATÓRIO MENSAL (corrigido: campos, layout A4 e render flush) ===
      async function onPdfRelatorioMensal() {
        const y = mensalYear;
        const m = mensalMonth;
       
        // Seleção do perfil para BARRAS (ok ficar vazio)
        const contasProfile = Array.from(cmpSel);

        // Usa a lista do profile; se não houver, cai para a seleção da UI
        const chartAccounts =
          (Array.isArray(window.AppState?.profile?.chart_accounts) && window.AppState.profile.chart_accounts.length)
            ? window.AppState.profile.chart_accounts
            : contasProfile;

        // Helpers
        const monthNamePT = (mm) =>
          new Date(2025, mm - 1, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^./, c => c.toUpperCase());
        const rotMes = `${monthNamePT(m)} / ${y}`;
        const parseBRLnum = (brl) =>
          parseFloat(String(brl || '').replace(/[^\d,]/g, '').replace(/\.(?=\d)/g, '').replace(',', '.')) || 0;

        // Render flush (garante Chart.js pronto antes do toDataURL)
        const flush = async () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));

        // Host offscreen (gráficos)
        function makeHost() {
          const host = document.createElement('div');
          host.id = 'pdf-host';
          host.style.position = 'fixed';
          host.style.left = '-99999px';
          host.style.top = '0';
          host.style.width = '1100px';
          host.style.pointerEvents = 'none';
          document.body.appendChild(host);
          return host;
        }
        function addCanvas(host, h = 680, w = 1100) {
          const wrap = document.createElement('div');
          wrap.style.width = `${w}px`;
          wrap.style.height = `${h}px`;
          const c = document.createElement('canvas');
          // ajuda o Chart.js a setar corretamente a densidade de pixels
          c.width = w;
          c.height = h;
          wrap.appendChild(c);
          host.appendChild(wrap);
          return c;
        }

        // Card-resumo (imagem simples)
        function makeResumoCanvas(host, { total, porPagador, totalDividida, deltaTexto }) {
          const W = 1100, H = 240;
          const wrap = document.createElement('div'); wrap.style.width = `${W}px`; wrap.style.height = `${H}px`;
          const c = document.createElement('canvas'); c.width = W; c.height = H; wrap.appendChild(c); host.appendChild(wrap);
          const ctx = c.getContext('2d');

          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#111827'; ctx.font = 'bold 22px Arial';
          ctx.fillText(`Resumo de ${rotMes}`, 24, 34);

          ctx.font = '16px Arial';
          const linhas = [
            `Total gasto no mês: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Total em contas DIVIDIDAS: R$ ${totalDividida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `Por pagador: ${porPagador.map(p => `${p.nome}: R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join(' | ')}`,
            `Acerto: ${deltaTexto}`
          ];
          let yText = 70; ctx.fillStyle = '#111827';
          for (const ln of linhas) { ctx.fillText(ln, 24, yText); yText += 26; }

          return c;
        }

        // === Dados ===
        const itensMes = await window.DataAdapter.fetchMes(y, m) || [];
        const prevM = m > 1 ? m - 1 : 12;
        const prevY = m > 1 ? y : (y - 1);
        const itensAnt = await window.DataAdapter.fetchMes(prevY, prevM) || [];
        const itensAnoAnt = await window.DataAdapter.fetchMes(y - 1, m) || [];

        // Pizza — TODAS as contas do mês
        const contasAll = Array.from(new Set(itensMes.map(x => x.nome))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        const valoresAll = contasAll.map(c =>
          itensMes.filter(x => x.nome === c).reduce((a, b) => a + parseBRLnum(b.valor), 0)
        );

        // Barras — apenas contas do perfil (fallback: todas)
        const contasBarras = (chartAccounts.length ? chartAccounts : contasAll);

        const sumByConta = (items, contasSel) =>
          contasSel.map(c => items.filter(x => x.nome === c).reduce((a, b) => a + parseBRLnum(b.valor), 0));
        const curVals = sumByConta(itensMes, contasBarras);
        const antVals = sumByConta(itensAnt, contasBarras);
        const anoAntVals = sumByConta(itensAnoAnt, contasBarras);

        // Resumo por pagador (⚠ usa campo `quem` do DataAdapter) + balanço
        const totalMes = itensMes.reduce((a, b) => a + parseBRLnum(b.valor), 0);
        let totalDividida = 0;
        const porPagadorMap = new Map();
        itensMes.forEach(it => {
          const v = parseBRLnum(it.valor);
          if (it.dividida) totalDividida += v;
          const k = it.quem || '—';  // <— AQUI (não é quem_pagou)
          porPagadorMap.set(k, (porPagadorMap.get(k) || 0) + v);
        });
        const porPagador = Array.from(porPagadorMap.entries())
          .map(([nome, valor]) => ({ nome, valor }))
          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        let deltaTexto = 'Sem diferença a acertar.';
        if (porPagador.length >= 2) {
          const ranked = [...porPagador].sort((a, b) => b.valor - a.valor);
          const top = ranked[0], low = ranked[ranked.length - 1];
          const delta = top.valor - low.valor;
          if (delta > 0) deltaTexto = `${low.nome} deve R$ ${delta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${top.nome}`;
        }

        // === PDF ===
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) return alert('jsPDF não carregado.');
        const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const margin = 28;
        const gap = 24;
        const slotH = (pageH - margin * 2 - gap) / 2;
        const maxW = pageW - margin * 2;

        window.__PDF_MODE = true; // aplica paleta PDF nos charts

        const host = makeHost();
        const canvases = [];
        // canvas da Pizza (primeiro slot da página)
        const cvPizza = addCanvas(host, 680, 1100);

        try {
          // 1) Pizza 100% do mês
          renderPizzaMensalStrict(cvPizza, { labels: contasAll, valores: valoresAll }, rotMes);
          if (cvPizza._chart && window.ChartFeatures?.applyPdfTheme) {
            window.ChartFeatures.applyPdfTheme(cvPizza._chart);
            cvPizza._chart.update('none');
            }
          canvases.push(cvPizza);

          // 1b) Card-resumo
          const cvResumo = makeResumoCanvas(host, { total: totalMes, porPagador, totalDividida, deltaTexto });
          canvases.push(cvResumo);

          // 2) Barras — mês anterior
          // Exemplo para "mês atual x mês anterior"
          {
            const cvAnt = addCanvas(host, 560, 1100); // (altura, largura)
            renderBarrasMensalLocal(
              cvAnt,
              {
                labels: contasBarras,
                atual: curVals,           // valores do mês
                comparado: antVals,       // valores do mês anterior
                allowList: chartAccounts  // <- profile.chart_accounts (array)
              },
              {
                title: `Comparativo de ${rotMes} vs ${monthNamePT(prevM)} / ${prevY}`,
                rotAtuais: rotMes,
                rotComparado: `${monthNamePT(prevM)} / ${prevY}`
              }
            );
            canvases.push(cvAnt);
          }

          // Exemplo para "mês atual x mesmo mês do ano anterior"
          {
            const cvAnoAnt = addCanvas(host, 560, 1100);
            renderBarrasMensalLocal(
              cvAnoAnt,
              {
                labels: contasBarras,
                atual: curVals,
                comparado: anoAntVals,
                allowList: chartAccounts
              },
              {
                title: `Comparativo de ${rotMes} vs ${monthNamePT(m)} / ${y-1}`,
                rotAtuais: rotMes,
                rotComparado: `${monthNamePT(m)} / ${y-1}`
              }
            );
            canvases.push(cvAnoAnt);
          }



          // === Inserir canvases (2 por página) ===
          canvases.forEach((cv, idx) => {
            if (idx > 0 && idx % 2 === 0) doc.addPage();
            const posInPage = idx % 2;
            const ratio = cv.width / cv.height;
            let w = maxW, h = w / ratio;
            if (h > slotH) { h = slotH; w = h * ratio; }
            const x = (pageW - w) / 2;
            const yPos = posInPage === 0 ? margin : (margin + slotH + gap);
            const img = cv.toDataURL('image/png', 1.0);
            doc.addImage(img, 'PNG', x, yPos, w, h);
          });

          // === 3) LISTAGEM POR PAGADOR (com links clicáveis)
          // ⚠️ usa campos do DataAdapter: it.quem e it.links.{boleto,comp}
          const byPayer = {};
          itensMes.forEach(it => {
            const payer = it.quem || '—';
            if (!byPayer[payer]) byPayer[payer] = [];
            byPayer[payer].push(it);
          });
          const payers = Object.keys(byPayer).sort((a, b) => a.localeCompare(b, 'pt-BR'));

          // Layout A4 (em pt) – cabe tudo sem “estourar”
          const col = {
            nome:        { x: margin,                w: 240 },
            valor:       { x: margin + 240 + 8,      w: 70,  align: 'right' },
            dividida:    { x: margin + 240 + 8 + 70 + 8, w: 60 },
            boleto:      { x: margin + 240 + 8 + 70 + 8 + 60 + 8, w: 90 },
            comprovante: { x: margin + 240 + 8 + 70 + 8 + 60 + 8 + 90 + 8, w: 90 },
          };
          const headerH = 30;
          const lineH = 18;
          const startY = margin + headerH + 12;
          const maxRows = Math.floor((pageH - startY - margin) / lineH);

          doc.addPage();
          let curY = margin;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
          doc.text(`Contas pagas — ${rotMes}`, margin, curY);
          curY += 20;

          const printHeader = () => {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
            doc.text('', col.nome.x, curY);
            doc.text('Valor',            col.valor.x + col.valor.w, curY, { align: 'right' });
            doc.text('Dividida',         col.dividida.x, curY);
            doc.text('Boleto',           col.boleto.x, curY);
            doc.text('Comprovante',      col.comprovante.x, curY);
            curY += 12;
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
          };

          let rowsOnPage = 0;
          printHeader();

          const short = (u, n = 36) => (u && u.length > n ? (u.slice(0, n) + '…') : (u || ''));

          for (const p of payers) {
            if (rowsOnPage + 2 > maxRows) {
              doc.addPage(); curY = margin;
              doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
              doc.text(`Contas pagas — ${rotMes}`, margin, curY); curY += 20;
              printHeader(); rowsOnPage = 0;
            }
            doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
            doc.text(`Quem pagou: ${p}`, margin, curY);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
            curY += lineH; rowsOnPage++;

            const linhas = byPayer[p].sort((a, b) =>
              (a.nome + (a.instancia || '')).localeCompare(b.nome + (b.instancia || ''), 'pt-BR')
            );

            for (const it of linhas) {
              if (rowsOnPage >= maxRows) {
                doc.addPage(); curY = margin;
                doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
                doc.text(`Contas pagas — ${rotMes}`, margin, curY); curY += 20;
                printHeader(); rowsOnPage = 0;
              }

              const nomeInst = it.instancia ? `${it.nome} (${it.instancia})` : it.nome;
              // Nome (wrap controlado pelo maxWidth)
              doc.text(String(nomeInst), col.nome.x, curY, { maxWidth: col.nome.w });

              // Valor
              const valTxt = `R$ ${parseBRLnum(it.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              doc.text(valTxt, col.valor.x + col.valor.w, curY, { align: 'right' });

              // Dividida
              doc.text(it.dividida ? 'Sim' : 'Não', col.dividida.x, curY);

              // Links (clicáveis, com máscara)
              if (it.links?.boleto) {
                doc.textWithLink('Boleto', col.boleto.x, curY, { url: it.links.boleto });
              }
              if (it.links?.comp) {
                doc.textWithLink('Comprovante', col.comprovante.x, curY, { url: it.links.comp });
              }


              curY += lineH; rowsOnPage++;
            }
          }

          doc.save(`relatorio_mensal_${y}_${String(m).padStart(2, '0')}.pdf`);
        } finally {
          window.__PDF_MODE = false;
          host?.parentNode?.removeChild(host);
        }
      }



      // === RELATÓRIO POR PERÍODO (pizza 100% do período + linhas 2-up + listagens por mês) ===
      async function onPdfRelatorioPeriodo() {
        const contasProfile = Array.from(cmpSel); // quais contas terão linhas
        const y1 = pStartYear, m1 = pStartMonth;
        const y2 = pEndYear,   m2 = pEndMonth;

        // monta sequência de meses
        const monthsList = []; { let y=y1, m=m1; while (y<y2 || (y===y2 && m<=m2)) { monthsList.push({y,m}); m++; if(m>12){m=1;y++;} } }
        if (!monthsList.length) return alert('Período inválido.');

        const host = _makeHost();
        const canvases = [];

        // helpers de canvas (reutiliza os do patch A)
        function splitRows(rows, maxRowsPerCanvas=28) {
          const chunks = [];
          for (let i=0;i<rows.length;i+=maxRowsPerCanvas) chunks.push(rows.slice(i,i+maxRowsPerCanvas));
          return chunks;
        }
        function makeTabelaCanvases({ titulo, rows }) {
          const W=1100,H=680;
          const canvList = [];
          const groups = splitRows(rows, 26); // ~26 linhas por canvas

          groups.forEach((subset, idx)=>{
            const wrap = document.createElement('div'); wrap.style.width=`${W}px`; wrap.style.height=`${H}px`;
            const c = document.createElement('canvas'); c.width=W; c.height=H; wrap.appendChild(c); host.appendChild(wrap);
            const ctx = c.getContext('2d');
            c._pdfLinks = []; // 👈 coletor de links clicáveis

            // header
            ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
            ctx.fillStyle='#111827'; ctx.font='bold 20px Arial';
            ctx.fillText(`${titulo}${groups.length>1?` (pág. ${idx+1}/${groups.length})`:''}`, 24, 36);

            // col titles
            const cols = [
              { x: 24,   label: '', w: 420 },
              { x: 460,  label: 'Valor',            w: 120, align: 'left' },
              { x: 600,  label: 'Dividida',         w: 80  },
              { x: 700,  label: 'Boleto',           w: 180 },
              { x: 900,  label: 'Comprovante',      w: 180 }
            ];
            ctx.font='bold 13px Arial';
            cols.forEach(col => ctx.fillText(col.label, col.x, 68));

            // linhas
            ctx.font='13px Arial'; ctx.fillStyle='#111827';
            let yRow = 92;
            const rowHeight = 24;

            subset.forEach(r=>{
              // Nome (Instância)
              const nomeInst = r.instancia ? `${r.nome} (${r.instancia})` : r.nome;
              ctx.textAlign='left';
              ctx.fillText(nomeInst, cols[0].x, yRow);

              // Valor (direita)
              const valTxt = `R$ ${r.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}`;
              ctx.textAlign='right'; ctx.fillText(valTxt, cols[1].x + cols[1].w, yRow);
              ctx.textAlign='left';

              // Dividida
              ctx.fillText(r.dividida ? 'Sim' : 'Não', cols[2].x, yRow);

              // Exibe máscaras estáticas
              const billetLabel = r.link_boleto ? 'Boleto' : '';
              const proofLabel  = r.link_comprovante ? 'Comprovante' : '';

              ctx.fillText(billetLabel, cols[3].x, yRow);
              ctx.fillText(proofLabel,  cols[4].x, yRow);


              // 🔗 Registra retângulos clicáveis (em coordenadas do CANVAS)
              const approxTextH = 14; // altura de fonte aproximada
              if (r.link_boleto) {
                c._pdfLinks.push({
                  url: r.link_boleto,
                  x: cols[3].x,
                  y: yRow - approxTextH + 4, // ajuste fino vertical
                  w: cols[3].w,
                  h: approxTextH + 6
                });
              }
              if (r.link_comprovante) {
                c._pdfLinks.push({
                  url: r.link_comprovante,
                  x: cols[4].x,
                  y: yRow - approxTextH + 4,
                  w: cols[4].w,
                  h: approxTextH + 6
                });
              }

              yRow += rowHeight;
            });

            canvList.push(c);
          });

          return canvList;
        }


        try {
          window.__PDF_MODE = true;
          window.ChartFeatures?.setupChartDefaults?.();

          // ====== 1) PIZZA 100% DO PERÍODO ======
          const todosItens = [];
          for (const {y,m} of monthsList) {
            const mm = await window.DataAdapter.fetchMes(y,m) || [];
            todosItens.push(...mm);
          }
          const contasAll = Array.from(new Set(todosItens.map(x=>x.nome))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
          const valoresAll = contasAll.map(c => todosItens.filter(x=>x.nome===c).reduce((a,b)=>a+parseBRLnum(b.valor),0));
          const rotPeriodo = `${String(m1).padStart(2,'0')}/${y1} a ${String(m2).padStart(2,'0')}/${y2}`;
          const cvPizza = _addCanvas(host, '680px', '1100px');
          console.debug('[PERÍODO pizza-like]', rotPeriodo, { labels: contasAll.length, valores: valoresAll.length, total: valoresAll.reduce((a,b)=>a+b,0) });

          window.ChartFeatures?.renderPizzaMensal?.(cvPizza, { labels: contasAll, valores: valoresAll }, rotPeriodo);
          if (cvPizza._chart && window.ChartFeatures?.applyPdfTheme) { window.ChartFeatures.applyPdfTheme(cvPizza._chart); cvPizza._chart.update('none'); }
          canvases.push(cvPizza);
          // 🔖 Spacer em branco para reservar o 2º slot da 1ª página.
          // Assim, os gráficos de LINHAS começam, obrigatoriamente, na página 2.
          const cvSpacer = _addBlank(host, '600px', '1100px');
          canvases.push(cvSpacer);


          // ====== 2) LINHAS por conta (máx. 7; 2 por página) ======
          const contasLinhas = (contasProfile.length ? contasProfile : contasAll).slice(0,7);
          for (const conta of contasLinhas) {
            // série da conta
            const valores = [];
            for (const {y,m} of monthsList) {
              const mm = await window.DataAdapter.fetchMes(y,m) || [];
              const soma = mm.filter(x=>x.nome===conta).reduce((a,b)=>a+parseBRLnum(b.valor),0);
              valores.push(soma);
            }
            if (valores.filter(v=>v>0).length < 2) continue; // exige pelo menos 2 pontos >0

            const cv = _addCanvas(host, '600px', '1100px');
            window.ChartFeatures?.renderLinhaContaPeriodo?.(cv, {
              nome: conta,
              meses: monthsList.map(({y,m}) => `${String(m).padStart(2,'0')}/${y}`),
              valores
            });
            if (cv._chart && window.ChartFeatures?.applyPdfTheme) { window.ChartFeatures.applyPdfTheme(cv._chart); cv._chart.update('none'); }
            canvases.push(cv);
          }
          canvases.push(cvSpacer);

          // ====== 3) LISTAGENS — por MÊS, agrupadas por QUEM PAGOU ======
          for (const {y,m} of monthsList) {
            const itensMes = await window.DataAdapter.fetchMes(y,m) || [];
            if (!itensMes.length) continue;

            const byPayer = {};
            itensMes.forEach(it=>{
              const payer = it.quem || '—';      // 👈 usa o campo mapeado pelo DataAdapter
              if (!byPayer[payer]) byPayer[payer] = [];
              byPayer[payer].push(it);
            });

            const payers = Object.keys(byPayer).sort((a,b)=>a.localeCompare(b,'pt-BR'));
            const rows=[];
            payers.forEach(p=>{
              rows.push({ nome: `Quem pagou: ${p}`, instancia:'', valor:0, dividida:false, link_boleto:'', link_comprovante:'', _header:true });
              byPayer[p].sort((a,b)=> (a.nome+a.instancia).localeCompare(b.nome+b.instancia,'pt-BR')).forEach(it=>{
                rows.push({
                  nome: it.nome,
                  instancia: it.instancia || '',
                  valor: parseBRLnum(it.valor),
                  dividida: !!it.dividida,
                  link_boleto: it.link_boleto || '',
                  link_comprovante: it.link_comprovante || ''
                });
              });
            });
            const rowsVisuais = rows.flatMap(r=> r._header ? [{ nome:r.nome, instancia:'', valor:0, dividida:false, link_boleto:'', link_comprovante:'' }] : [r]);
            const canvTab = makeTabelaCanvases({ titulo: `Contas pagas — ${String(m).padStart(2,'0')}/${y}`, rows: rowsVisuais });
            canvases.push(...canvTab);
          }

          // ====== EXPORTA ======
          window.PDFHelpers.exportTwoPerPage(
            canvases,
            `relatorio_periodo_${y1}-${String(m1).padStart(2,'0')}_a_${y2}-${String(m2).padStart(2,'0')}.pdf`,
            { margin: 28, gap: 24 }
          );

        } finally {
          window.__PDF_MODE = false;
          host?.parentNode?.removeChild(host);
        }
      }


      return (
        <div className="overlay" onClick={onClose}>
          <div className={`modal glass ${tab==='home' ? 'max-w-md' : 'max-w-3xl'} w-full pop`} role="dialog" aria-modal="true" aria-labelledby="reports-title" onClick={e=>e.stopPropagation()}>


            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <h3 id="reports-title" className="text-lg font-semibold">Relatórios</h3>
              <div className="ml-auto flex gap-2">
                <button className="btn ghost" onClick={onClose}>Fechar</button>
              </div>
            </div>

            {/* Tela inicial com 3 opções */}
            {tab==='home' && (
              <div className="grid gap-3">
                <button className="btn primary" onClick={()=>onChangeTab('mensal')}>Relatório mensal</button>
                <button className="btn primary" onClick={()=>onChangeTab('periodo')}>Relatório por período</button>
                <button className="btn primary" onClick={()=>onChangeTab('comparativos')}>Gráficos comparativos</button>
              </div>
            )}

            {/* MENSAL */}
            {tab==='mensal' && (
              <>
                <div className="content">
                  <MonthPickerBlock
                    title="Selecione o mês"
                    year={mensalYear} setYear={setMensalYear}
                    month={mensalMonth} setMonth={setMensalMonth}
                    years={years}
                    monthOptions={monthOptions}
                    idPrefix="mensal"
                  />
                  <div className="text-sm opacity-70" style={{marginTop:12}}>
                    Gera: Pizza do mês + Resumo por pessoa + Balanço divididas + Listagem com links.
                  </div>
                </div>
                <div className="footer flex gap-2 justify-end">
                  <button className="btn ghost" onClick={()=>onChangeTab('home')}>Voltar</button>
                  <button className="btn primary" onClick={onPdfRelatorioMensal}>Gerar PDF</button>
                </div>
              </>
            )}


            {/* PERÍODO */}
            {tab==='periodo' && (
              <>
                <div className="content">
                  <MonthPickerBlock
                    title="Selecione início"
                    year={pStartYear} setYear={setPStartYear}
                    month={pStartMonth} setMonth={setPStartMonth}
                    years={years}
                    monthOptions={monthOptions}
                    idPrefix="periodo-inicio"
                  />
                  <MonthPickerBlock
                    title="Selecione final"
                    year={pEndYear} setYear={setPEndYear}
                    month={pEndMonth} setMonth={setPEndMonth}
                    years={years}
                    monthOptions={monthOptions}
                    idPrefix="periodo-fim"
                  />
                  <div className="text-sm opacity-70" style={{marginTop:12}}>
                    Consolidado do período.
                  </div>
                </div>
                <div className="footer flex gap-2 justify-end">
                  <button className="btn ghost" onClick={()=>onChangeTab('home')}>Voltar</button>
                  <button className="btn primary" onClick={onPdfRelatorioPeriodo}>Gerar PDF</button>
                </div>
              </>
            )}


            {/* COMPARATIVOS */}
            {tab==='comparativos' && (
              <>
                <div className="content">
                  {/* Alcance sozinho */}
                  <div className="subpick">
                    <h3>Alcance</h3>
                    <div className="row">
                      <div className="cell" style={{gridColumn:'1 / -1'}}>
                        <label className="text-sm opacity-70" htmlFor="cmp-range">Tipo</label>
                        <select id="cmp-range" className="select"
                                value={cmpRange} onChange={e=>setCmpRange(e.target.value)}>
                          <option value="mes">Mês único</option>
                          <option value="periodo">Período</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {cmpRange==='mes' ? (
                    <MonthPickerBlock
                      title="Selecione o mês"
                      year={cmpYear} setYear={setCmpYear}
                      month={cmpMonth} setMonth={setCmpMonth}
                      years={years}
                      monthOptions={monthOptions}
                      idPrefix="cmp-mes"
                    />
                  ) : (
                    <>
                      <MonthPickerBlock
                        title="Selecione início"
                        year={cmpStartYear} setYear={setCmpStartYear}
                        month={cmpStartMonth} setMonth={setCmpStartMonth}
                        years={years}
                        monthOptions={monthOptions}
                        idPrefix="cmp-inicio"
                      />
                      <MonthPickerBlock
                        title="Selecione final"
                        year={cmpEndYear} setYear={setCmpEndYear}
                        month={cmpEndMonth} setMonth={setCmpEndMonth}
                        years={years}
                        monthOptions={monthOptions}
                        idPrefix="cmp-fim"
                      />
                    </>
                  )}

                  {/* Tipo de gráfico */}
                  <div className="subpick">
                    <h3>Tipo de gráfico</h3>
                    <div className="row">
                      <div className="cell" style={{gridColumn:'1 / -1'}}>
                        <select className="select" value={cmpType} onChange={e=>setCmpType(e.target.value)}>
                          {cmpRange==='mes' && (<>
                            <option value="pizza">Pizza</option>
                            <option value="barras">Barras</option>
                          </>)}
                          {cmpRange==='periodo' && (<>
                            <option value="pizza">Pizza</option>
                            <option value="linhas">Linhas</option>
                          </>)}
                        </select>

                      </div>
                    </div>
                  </div>

                  <div className="subpick">
                    <h3>Contas (seleção múltipla)</h3>

                    {/* Ações rápidas */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={()=> setCmpSel(new Set(cmpContas))}
                        disabled={cmpContas.length===0}
                        title="Selecionar todas"
                      >
                        Selecionar todas
                      </button>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={()=> setCmpSel(new Set())}
                        disabled={cmpSel.size===0}
                        title="Limpar seleção"
                      >
                        Limpar seleção
                      </button>
                    </div>

                    {/* Lista dinâmica */}
                    {cmpContas.length===0 ? (
                      <div className="text-sm opacity-70">Nenhuma conta encontrada no alcance selecionado.</div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {cmpContas.map(name => (
                          <label
                            key={name}
                            className="card flex items-start gap-3 account-chip"
                            title={name}
                          >
                            <input
                              type="checkbox"
                              checked={cmpSel.has(name)}
                              onChange={()=>toggleConta(name)}
                              style={{ marginTop: 3 }}
                            />
                            <span className="account-chip__text">{name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>


                  <div className="text-sm opacity-70" style={{marginTop:12}}>
                    (Opcional) visualizar gráfico antes do download.
                  </div>
                </div>

                <div className="footer flex flex-wrap gap-2 justify-end">
                  {/* Voltar */}
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={()=>onChangeTab('home')}
                  >
                    Voltar
                  </button>

                  {/* Gerar gráfico — reaproveite SEU handler atual */}
                  <button
                    type="button"
                    className="btn ghost"
                    disabled={cmpSel.size===0 || (cmpRange==='periodo' && cmpType==='barras')}
                    
                    onClick={async (e) => {
                      // limpa área anterior
                      const content = e.currentTarget.closest('.modal').querySelector('.content');
                      content.querySelectorAll('#cmp-chart, .cmp-note').forEach(n => n.remove());

                      // prepara host/canvas helpers
                      const host = document.createElement('div');
                      host.id = 'cmp-chart';
                      host.style.marginTop = '16px';
                      content.appendChild(host);

                      const addNote = (txt) => {
                        const n = document.createElement('div');
                        n.className = 'cmp-note text-sm opacity-70 mt-2';
                        n.textContent = txt;
                        content.appendChild(n);
                      };
                      const addCanvas = (h = '380px') => {
                        const wrap = document.createElement('div');
                        wrap.style.width = '100%';
                        wrap.style.height = h;
                        wrap.style.marginTop = '12px';
                        const c = document.createElement('canvas');
                        wrap.appendChild(c);
                        host.appendChild(wrap);
                        return c;
                      };

                      // utilidades de dados
                      const contasSel = Array.from(cmpSel);
                      const fetchMes = (y, m) => window.DataAdapter.fetchMes(y, m);
                      const monthLabel = (y, m) => `${monthNamePT(m)} / ${y}`;
                      const makeMonthsList = (y1, m1, y2, m2) => {
                        const out = []; let y=y1, m=m1;
                        while (y < y2 || (y === y2 && m <= m2)) { out.push({y,m}); m++; if (m>12){m=1;y++;} }
                        return out;
                      };

                      // aplica defaults do Chart.js
                      if (window.ChartFeatures?.setupChartDefaults) window.ChartFeatures.setupChartDefaults();

                      // --- PIZZA ---
                      if (cmpType === 'pizza') {
                        if (cmpRange === 'mes') {
                          const cur = await fetchMes(cmpYear, cmpMonth);
                          const valores = sumByConta(cur, contasSel);
                          const c = addCanvas();
                          window.ChartFeatures.renderPizzaMensal(c, { labels: contasSel, valores }, monthLabel(cmpYear, cmpMonth));
                          return;
                        } else {
                          const months = makeMonthsList(cmpStartYear, cmpStartMonth, cmpEndYear, cmpEndMonth);
                          // 🔥 performance: busca em paralelo
                          const respostas = await Promise.all(months.map(({y,m}) => fetchMes(y,m)));
                          const soma = new Array(contasSel.length).fill(0);
                          respostas.forEach(items => {
                            const v = sumByConta(items, contasSel);
                            v.forEach((n, i) => soma[i] += n);
                          });
                          const c = addCanvas();
                          const rot = `${monthNamePT(cmpStartMonth)} ${cmpStartYear} – ${monthNamePT(cmpEndMonth)} ${cmpEndYear}`;
                          window.ChartFeatures.renderPizzaMensal(c, { labels: contasSel, valores: soma }, rot);
                          return;
                        }
                      }

                      // --- LINHAS (período) ---
                      if (cmpType === 'linhas' && cmpRange === 'periodo') {
                        const months = makeMonthsList(cmpStartYear, cmpStartMonth, cmpEndYear, cmpEndMonth);
                        const labelsMes = months.map(({y,m}) => `${monthNamePT(m).slice(0,3)}/${y}`);
                        const respostas = await Promise.all(months.map(({y,m}) => fetchMes(y,m)));

                        let plotted = 0;
                        contasSel.forEach((conta) => {
                          const serie = respostas.map(items =>
                            (items || []).filter(x => x.nome === conta)
                              .reduce((a,b) => a + parseFloat(String(b.valor).replace(/[^\d,]/g,'').replace(/\.(?=\d)/g,'').replace(',','.')) || 0, 0)
                          );
                          const pontos = serie.filter(v => v > 0).length;
                          if (pontos >= 2) {
                            const c = addCanvas();
                            window.ChartFeatures.renderLinhaContaPeriodo(c, { nome: conta, meses: labelsMes, valores: serie });
                            plotted++;
                          } else {
                            addNote(`⚠️ "${conta}": sem reincidência suficiente no período para linhas.`);
                          }
                        });

                        if (plotted === 0) addNote('Nenhuma conta possui dados em 2 ou mais meses no período selecionado.');
                        return;
                      }

                      // --- BARRAS (mês único; 2 comparações lado a lado) ---
                      if (cmpType === 'barras' && cmpRange === 'mes') {
                        const atual = await fetchMes(cmpYear, cmpMonth);
                        const valsAtual = sumByConta(atual, contasSel);
                        const rotAtual = monthLabel(cmpYear, cmpMonth);

                        // mês anterior
                        const prevM = cmpMonth > 1 ? cmpMonth - 1 : 12;
                        const prevY = cmpMonth > 1 ? cmpYear : (cmpYear - 1);
                        const ant = await fetchMes(prevY, prevM);
                        const valsAnt = sumByConta(ant, contasSel);
                        const temAnt = valsAnt.some(v => v > 0);

                        // mesmo mês do ano anterior
                        const anoAnt = await fetchMes(cmpYear - 1, cmpMonth);
                        const valsAnoAnt = sumByConta(anoAnt, contasSel);
                        const temAnoAnt = valsAnoAnt.some(v => v > 0);

                        if (temAnt) {
                          const c1 = addCanvas('360px');
                          window.ChartFeatures.renderBarrasComparativas(
                            c1,
                            { labels: contasSel, atual: valsAtual, comparado: valsAnt },
                            'anterior',
                            { atual: rotAtual, comparado: monthLabel(prevY, prevM) }
                          );
                        } else {
                          addNote('ℹ️ Sem conta correspondente no mês anterior para as seleções atuais.');
                        }

                        if (temAnoAnt) {
                          const c2 = addCanvas('360px');
                          window.ChartFeatures.renderBarrasComparativas(
                            c2,
                            { labels: contasSel, atual: valsAtual, comparado: valsAnoAnt },
                            'anoAnterior',
                            { atual: rotAtual, comparado: monthLabel(cmpYear - 1, cmpMonth) }
                          );
                        } else {
                          addNote('ℹ️ Sem conta correspondente no mesmo mês do ano anterior para as seleções atuais.');
                        }

                        if (!temAnt && !temAnoAnt) addNote('Nenhuma base comparável encontrada.');
                        return;
                      }

                      // combinação inválida (ex.: barras + período)
                      alert('Combinação de alcance e tipo não suportada.');
                    }
}
                  >
                    Gerar gráfico
                  </button>

                  {/* Baixar PNG (primeiro gráfico) */}
                  <button
                    type="button"
                    className="btn primary"
                    disabled={cmpSel.size===0}
                    onClick={()=>{
                      const firstCanvas = document.querySelector('#cmp-chart canvas');
                      if (!firstCanvas) return alert('Gere um gráfico antes!');
                      const a = document.createElement('a');
                      a.download = 'grafico.png';
                      a.href = firstCanvas.toDataURL('image/png');
                      a.click();
                    }}
                  >
                    Baixar PNG
                  </button>

                  {/* Baixar PDF (todos os gráficos renderizados) */}
                  <button
                    type="button"
                    className="btn primary"
                    disabled={cmpSel.size===0}
                    onClick={()=> {
                      const wrapper = document.getElementById('cmp-chart');
                      const canvases = Array.from(wrapper?.querySelectorAll('canvas') || []);
                      if (!canvases.length) return alert('Nenhum gráfico gerado.');

                      // 1️⃣ liga modo PDF e aplica o tema
                      window.__PDF_MODE = true;
                      canvases.forEach(cv => {
                        const chart = cv._chart;
                        if (chart && window.ChartFeatures?.applyPdfTheme) {
                          window.ChartFeatures.applyPdfTheme(chart);
                        }
                      });
                      // 2️⃣ exporta 2 por página
                      window.PDFHelpers.exportTwoPerPage(canvases, 'graficos.pdf', { margin: 28, gap: 24 });
                      // 3️⃣ volta ao tema normal
                      window.__PDF_MODE = false;
                      canvases.forEach(cv => cv._chart?.update('none'));
                    }}
                  >
                    Baixar PDF (todos)
                  </button>

                  {/* === Relatórios formais (fora de qualquer <button>) === */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn"
                      onClick={onPdfRelatorioMensal}
                      title="Gera PDF com Pizza do mês e Barras comparativas (mês anterior e mesmo mês do ano anterior, quando houver dados)."
                    >
                      Relatório Mensal (PDF)
                    </button>

                    <button
                      type="button"
                      className="btn"
                      onClick={onPdfRelatorioPeriodo}
                      title="Gera PDF com gráficos de linha por conta ao longo do período selecionado (2 por página)."
                    >
                      Relatório Período (PDF)
                    </button>
                  </div>


                </div>


                {cmpSel.size===0 && (
                  <div className="text-xs opacity-70 mt-2 text-right">
                    Selecione ao menos 1 conta.
                  </div>
                )}


              </>
            )}

          </div>
        </div>
      );
    }