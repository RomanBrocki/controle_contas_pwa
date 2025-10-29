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
                  <button className="btn primary">Gerar PDF</button>
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
                  <button className="btn primary">Gerar PDF</button>
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
                      const sumByConta = (items, contas) =>
                        contas.map(c => (items || [])
                          .filter(x => x.nome === c)
                          .reduce((a, b) => a + parseFloat(String(b.valor).replace(/[^\d,]/g,'').replace(/\.(?=\d)/g,'').replace(',','.')) || 0, 0)
                        );
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
                    onClick={()=>{
                      const wrapper = document.getElementById('cmp-chart');
                      const canvases = Array.from(wrapper.querySelectorAll('canvas'));
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