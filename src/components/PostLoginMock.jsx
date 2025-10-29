function MonthPickerBlock({
      title,
      year, setYear,
      month, setMonth,
      years,
      monthOptions,
      idPrefix
    }) {
      return (
        <div className="subpick">
          <h3>{title}</h3>
          <div className="row">
            <div className="cell">
              <label htmlFor={`${idPrefix}-ano`}>Ano</label>
              <select id={`${idPrefix}-ano`} className="select"
                      value={year} onChange={e=>setYear(Number(e.target.value))}>
                {years.map(y=> <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="cell" style={{justifyContent:'flex-end'}}>
              <label htmlFor={`${idPrefix}-mes`}>Mês</label>
              <select id={`${idPrefix}-mes`} className="select"
                      value={month} onChange={e=>setMonth(Number(e.target.value))}>
                {monthOptions(year)}
              </select>
            </div>
          </div>
        </div>
      );
    }

function PostLoginMock() {
      const [theme, setTheme] = React.useState('gunmetal');
      const [showOverlay, setShowOverlay] = React.useState(true);
      const [editing, setEditing] = React.useState(null); // {mode:'edit'|'new', item:{...}}
      const [typeOpts, setTypeOpts] = React.useState([]);
      const [activeId, setActiveId] = React.useState(null); // anima o card clicado
      const [showReports, setShowReports] = React.useState(false);
      const [reportsTab, setReportsTab] = React.useState('home'); // 'mensal' | 'periodo' | 'comparativos'
      // ---- Settings / Perfil ----
      const [showSettings, setShowSettings] = React.useState(false);
      const [profile, setProfile] = React.useState(null); // {email, theme, payers_default, chart_accounts}
      const [contasDisp, setContasDisp] = React.useState([]);


      // 🔹 Anos e meses reais do Supabase
      const [years, setYears] = React.useState([]);
      const [monthsByYear, setMonthsByYear] = React.useState({});

      React.useEffect(() => {
        if (!showSettings) return;
        let alive = true;
        (async () => {
          try {
            const list = await window.SupabaseQueries.contasDistinctUltimos12();
            if (alive) setContasDisp(list);
          } catch (e) {
            console.warn('[settings] contas 12m', e);
            if (alive) setContasDisp([]);
          }
        })();
        return () => { alive = false; };
      }, [showSettings]);

      // Carrega anos e meses disponíveis do banco
      React.useEffect(() => {
        (async () => {
          try {
            const yrs = await window.SupabaseQueries.listYears();
            setYears(yrs);

            const monthsMap = {};
            for (const y of yrs) {
              const months = await window.SupabaseQueries.listMonthsByYear(y);
              monthsMap[y] = months;
            }
            setMonthsByYear(monthsMap);
          } catch (err) {
            console.error('[ui] Erro ao carregar anos/meses', err);
          }
        })();
      }, []);
      
      // Se o ano padrão (2025) não existir no banco, pega o mais recente disponível
      React.useEffect(() => {
        if (years.length && !years.includes(yearSel)) {
          setYearSel(years[0]); // assumindo que listYears() já retorna DESC
        }
      }, [years]);
      // Carrega perfil na montagem e aplica tema/pagadores
      React.useEffect(() => {
        (async () => {
          try {
            const p = await window.SupabaseQueries.getProfile();
            if (p) {
              setProfile(p);
              if (p.theme) setTheme(p.theme); // aplica tema inicial do perfil
              
            } else {
              setProfile({ email: '', theme, payers_default: [], chart_accounts: [] });
            }
          } catch (e) {
            console.warn('[perfil] erro ao carregar:', e);
            setProfile({ email: '', theme, payers_default: [], chart_accounts: [] });
          }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []); // roda uma vez

      // Carrega tipos de conta disponíveis (distinct nomes)
      React.useEffect(() => {
        (async () => {
          if (!editing) return; // abre só quando modal 'Nova/Editar' estiver ativo
          try {
            const list = await window.SupabaseQueries.contasDistinctUltimos12?.();
            setTypeOpts(Array.isArray(list) ? list : []);
          } catch (e) {
            console.warn('[tipo de conta] usando fallback COMMON_TYPES', e);
            setTypeOpts([]);
          }
        })();
      }, [editing]); // quando abrir/fechar o modal


      const [yearSel, setYearSel] = React.useState(2025);
      const [monthSel, setMonthSel] = React.useState(10); // outubro atual

      // ---- Pendências (dinâmico): estados + helpers ----
      const [pendentes, setPendentes] = React.useState(null); // null = calculando
      const [pendLoading, setPendLoading] = React.useState(false);
      // normaliza: remove acentos, trim e baixa caixa
      function normalize(str='') {
        return String(str)
          .normalize('NFD')                // decompõe acentos
          .replace(/[\u0300-\u036f]/g, '') // remove diacríticos
          .toLowerCase()
          .trim();
      }


      function prevYearMonth(y, m) {
        return m > 1 ? { y, m: m - 1 } : { y: y - 1, m: 12 };
      }
      function keyFor(i) {
        return `${normalize(i.nome)}__${normalize(i.instancia)}`;
      }



      // Exponho handlers para o Router (sem depender de React fora do componente)
      React.useEffect(() => {
        window.AppRoutes = {
          mes: ({ ano, mes } = {}) => {
            if (ano) setYearSel(Number(ano));
            if (mes) setMonthSel(Number(mes));
          },
          relatorios: () => {
            setReportsTab('home');
            setShowReports(true);
          }
        };
        return () => { if (window.AppRoutes) delete window.AppRoutes; };
      }, []);


      React.useEffect(()=>{
        const avail = monthsByYear[yearSel] || [];
        if (!avail.includes(monthSel)) {
          setMonthSel(avail[0] || monthSel); // mais recente do ano
        }
      }, [yearSel]);

      // ---- Calcula pendências comparando mês atual x anterior ----
      React.useEffect(() => {
        let alive = true;
        (async () => {
          try {
            setPendLoading(true);
            const { y, m } = prevYearMonth(yearSel, monthSel);
            const [cur, prev] = await Promise.all([
              window.DataAdapter.fetchMes(yearSel, monthSel),
              window.DataAdapter.fetchMes(y, m)
            ]);

            const curKeys = new Set((cur || []).map(keyFor));
            const listaPend = (prev || []).filter(p => !curKeys.has(keyFor(p)));

            if (!alive) return;
            setPendentes(listaPend);
            // se houver pendência, mostra overlay; se não, esconde
            setShowOverlay(listaPend.length > 0);
          } catch (e) {
            console.error('[pendentes] erro ao calcular', e);
            if (!alive) return;
            setPendentes([]);
            setShowOverlay(false);
          } finally {
            if (alive) setPendLoading(false);
          }
        })();
        return () => { alive = false; };
      }, [yearSel, monthSel]);

      // Itens reais do mês (Supabase) + loading
      const [itens, setItens] = React.useState(null); // null = carregando

      React.useEffect(() => {
        let alive = true;
        (async () => {
          try {
            const mapped = await window.DataAdapter.fetchMes(yearSel, monthSel);
            if (alive) setItens(mapped);
          } catch (err) {
            console.error('[ui] Falha ao carregar mês', err);
            if (alive) setItens([]);
          }
        })();
        return () => { alive = false; };
      }, [yearSel, monthSel]);

      // Toast simples
      const [toast, setToast] = React.useState(null); // { msg, type: 'ok'|'err' }
      function showToast(msg, type='ok'){
        setToast({ msg, type });
        setTimeout(() => setToast(null), 1800);
      }

      // Recarrega só a lista do mês atual
      async function reloadMonth(){
        const mapped = await window.DataAdapter.fetchMes(yearSel, monthSel);
        setItens(mapped);
      }

      // Pequena validação/sanitização de URL (http/https)
      function cleanUrl(u){
        if(!u) return '';
        const s = String(u).trim();
        if(/^https?:\/\//i.test(s)) return s;
        return 'https://' + s;
      }

      async function handleSave(mode, initialId, form){
        try{
          // resolve '  '
          const quem = form.quemMode === 'outro' ? (form.quemOutro || '').trim() : (form.quem || '').trim();

          // montar draft para a tabela existente
          const d = new Date(form.data || todayISO());
          const ano = d.getFullYear();
          const mes = d.getMonth() + 1;

          const draft = {
            nome_da_conta: (form.nome || '').trim(),
            valor: parseBRL(form.valor),
            data_de_pagamento: form.data || todayISO(),
            instancia: (form.instancia || '').trim(),
            quem_pagou: quem,
            dividida: !!form.dividida,
            link_boleto: cleanUrl(form.boleto),
            link_comprovante: cleanUrl(form.comp),
            ano, mes
          };

          let ok = false;
          if (mode === 'new') {
            ok = await window.SupabaseMutations.insertConta(draft);
          } else {
            ok = await window.SupabaseMutations.updateConta(initialId, draft);
          }
          if(!ok) throw new Error('Falha no Supabase');

          await reloadMonth();
          showToast('Conta salva ✅','ok');
          setEditing(null);
        } catch(e){
          console.error('[save] erro', e);
          showToast('Erro ao salvar ❌','err');
        }
      }

      async function handleDelete(id){
        try{
          const ok = await window.SupabaseMutations.deleteConta(id);
          if(!ok) throw new Error('Falha no Supabase');
          await reloadMonth();
          showToast('Conta excluída 🗑️','ok');
          setEditing(null);
        } catch(e){
          console.error('[delete] erro', e);
          showToast('Erro ao excluir ❌','err');
        }
      }


      const [payersDB, setPayersDB] = React.useState([]);

      React.useEffect(() => {
        (async () => {
          try {
            const list = await window.SupabaseQueries.payersDistinct();
            setPayersDB(list || []);
          } catch (e) {
            console.error('[ui] payersDistinct', e);
            setPayersDB([]);
          }
        })();
      }, []);


      const totalMes = React.useMemo(
        () => (itens ? itens.reduce((acc,i)=> acc + parseBRL(i.valor), 0) : 0),
        [itens]
      );
      const contasDistinct = React.useMemo(
        () => Array.from(new Set((itens || []).map(i=> i.nome))),
        [itens]
      );


      function popCard(id){
        setActiveId(id);
        setTimeout(()=> setActiveId(null), 650);
      }

      function openNew(prefill){
        popCard('new');
        setEditing({
          mode:'new',
          item: {
            id:null,
            nome: prefill?.nome || '',
            valor:'',
            data: todayISO(),
            instancia: prefill?.instancia || '',
            quem: prefill?.quem || '',
            dividida: !!prefill?.dividida,
            links: { boleto:'', comp:'' }
          }
        });
      }

      function openEdit(item){
        popCard(item.id);
        const isoDate = parseBRtoISO(item.data) || todayISO();
        setEditing({ mode:'edit', item: { ...JSON.parse(JSON.stringify(item)), data: isoDate } });
      }

      return (
        <div className={`theme-${theme} min-h-screen relative p-4 md:p-6`}>
          <div className="mx-auto w-full max-w-5xl">
          {/* Header */}
          <header className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="brand text-center md:text-left w-full">💸 Controle de Contas</h1>
            <div className="flex flex-col gap-2 w-full sm:grid sm:grid-cols-2 md:flex md:flex-row md:items-center">
              <button className={`btn primary w-full md:w-auto ${activeId==='new' ? 'pop' : ''}`} onClick={()=>openNew()}>+ Nova Conta</button>
              <button className="btn ghost w-full md:w-auto" onClick={()=>{ setReportsTab('home'); setShowReports(true); }}>📊 Relatórios</button>
              <button className="btn ghost" onClick={()=> setShowSettings(true)}>⚙️ Configurações</button>
              
            </div>
          </header>
        

          {/* Overlay pós-login (dinâmico) */}
          {showOverlay && (
            <div className="overlay hard" onClick={() => setShowOverlay(false)}>
              <div className="modal solid max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-3">💰 Contas Pendentes</h2>

                {pendentes === null || pendLoading ? (
                  <div className="card text-center py-6">Calculando…</div>
                ) : pendentes.length === 0 ? (
                  <div className="card text-center py-6 text-sm opacity-70">
                    Nenhuma conta do mês anterior está pendente.
                  </div>
                ) : (
                  <ul className="space-y-2 mb-4">
                    {pendentes.slice(0, 6).map((p, idx) => (
                      <li key={`${keyFor(p)}-${idx}`} className="card flex justify-between items-center">
                        <div>
                          <strong>{p.nome}</strong><br />
                          {/* Mostramos os dados do mês anterior só como contexto visual */}
                          <span className="text-sm opacity-70">
                            {p.instancia ? `${p.instancia} • ` : ''}{p.valor} • {p.data}
                          </span>
                        </div>
                        <button
                          className="btn primary"
                          onClick={() => {
                            // abre modal "Nova Conta" pré-preenchido (valor e data continuam padrão: vazio/hoje)
                            setShowOverlay(false);
                            openNew({ nome: p.nome, instancia: p.instancia, quem: p.quem, dividida: p.dividida });
                          }}
                        >
                          Lançar agora
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <button className="btn ghost w-full" onClick={() => setShowOverlay(false)}>Sair</button>
              </div>
            </div>
          )}


          {/* Resumo do mês + seletor ano/mês (meses DESC e nomes apenas) */}
          <section className="card mb-6 flex flex-wrap items-center gap-4">
            <div>
              <div className="text-sm opacity-70">Total do mês</div>
              <div className="text-2xl font-semibold" style={{textShadow:'var(--glow)'}}>
                {totalMes.toLocaleString('pt-BR', { style:'currency', currency:'BRL' })}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm opacity-70">Ano</label>
              <select
                className="select"
                value={yearSel}
                onChange={e=>{
                  const y = Number(e.target.value);
                  setYearSel(y);
                  Router.go(`#/mes?ano=${y}&mes=${monthSel}`);
                }}
              >
                {years.map(y=> <option key={y} value={y}>{y}</option>)}
              </select>
              <label className="text-sm opacity-70">Mês</label>
              <select
                className="select"
                value={monthSel}
                onChange={e=>{
                  const m = Number(e.target.value);
                  setMonthSel(m);
                  Router.go(`#/mes?ano=${yearSel}&mes=${m}`);
                }}
              >
                {(monthsByYear[yearSel]||[]).map(m=> (
                  <option key={m} value={m}>{monthNamePT(m)}</option>
                ))}
              </select>
            </div>
          </section>

          {/* ================================================ */}
          {/* 📭 Lista de contas do mês (loading / vazio / itens) */}
          {itens === null ? (
            <div className="card text-center py-10">Carregando…</div>
          ) : itens.length === 0 ? (
            <div className="card text-center py-10">
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta neste mês</h3>
              <p className="text-sm opacity-70 mb-4">Você ainda não adicionou nenhuma conta para este período.</p>
              <button className="btn primary" onClick={() => openNew()}>+ Adicionar primeira conta</button>
            </div>
          ) : (
            <main className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {itens.map((i) => (
                <ContaCard key={i.id} active={activeId === i.id} {...i} onEdit={() => openEdit(i)} />
              ))}
            </main>
          )}



          {editing && (
            <EditPopup
              data={editing}
              payers={payersDB}
              typeOpts={typeOpts}
              onClose={()=>setEditing(null)}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          )}


          {showReports && (
            <ReportsModal
              tab={reportsTab}
              onChangeTab={setReportsTab}
              onClose={()=>setShowReports(false)}
              years={years}
              monthsByYear={monthsByYear}
              currentYear={yearSel}
              currentMonth={monthSel}
              contasDistinct={Array.from(new Set((itens || []).map(i=> i.nome)))}
              defaultSel={Array.isArray(profile?.chart_accounts) ? profile.chart_accounts : []}
            />
          )}

          {showSettings && (
            <SettingsModal
              initial={profile}
              // contasDisponiveis: sem await no JSX; pega das contas já carregadas na tela atual
              contasDisponiveis={contasDisp}
              onClose={()=> setShowSettings(false)}
              onSaved={(p)=>{
                setProfile(p);
                if (p.theme) setTheme(p.theme); // aplica tema escolhido
                
              }}
            />
          )}


          {toast && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border"
                style={{ background:'var(--surface)', borderColor:'var(--border)', boxShadow:'var(--glow)' }}>
              <span className="text-sm">{toast.msg}</span>
            </div>
          )}

          </div>{/* /max-w wrapper */}
        </div>
      );
    }